import { useState, useEffect, useCallback } from 'react';

export interface TokenSessionInfo {
  issuedAtMs: number;
  expiresAtMs: number;
  totalDurationMs: number;
  remainingMs: number;
  hours: number;
  minutes: number;
  seconds: number;
  formattedTime: string;
  percentRemaining: number;
  isExpired: boolean;
}

const DEFAULT_10_HOURS_MS = 10 * 60 * 60 * 1000; // 36,000,000 ms

/**
 * Safely decodes a JWT payload without external libraries
 */
export function decodeJwtPayload(token: string): any | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

/**
 * Calculates current session timing details from a JWT token
 */
export function getSessionTiming(token: string): TokenSessionInfo {
  const now = Date.now();
  const payload = decodeJwtPayload(token);

  let issuedAtMs: number;
  let expiresAtMs: number;

  if (payload && payload.exp) {
    const rawExpMs = payload.exp * 1000;
    const rawIatMs = payload.iat ? payload.iat * 1000 : now;
    issuedAtMs = rawIatMs;
    // Strict 10-Hour Policy: enforce max 10 hours even if token had an older 7d expiration
    expiresAtMs = Math.min(rawExpMs, issuedAtMs + DEFAULT_10_HOURS_MS);
  } else {
    // Fallback based on localStorage timestamp
    const storedIssued = localStorage.getItem('ccs_session_issued_at');
    if (storedIssued && !isNaN(Number(storedIssued))) {
      issuedAtMs = Number(storedIssued);
    } else {
      issuedAtMs = now;
      localStorage.setItem('ccs_session_issued_at', String(issuedAtMs));
    }
    expiresAtMs = issuedAtMs + DEFAULT_10_HOURS_MS;
  }

  // Strictly clamp remaining time so it never exceeds 10 hours
  let remainingMs = expiresAtMs - now;
  if (remainingMs > DEFAULT_10_HOURS_MS) {
    remainingMs = DEFAULT_10_HOURS_MS;
    expiresAtMs = now + DEFAULT_10_HOURS_MS;
  }
  remainingMs = Math.max(0, remainingMs);
  const isExpired = remainingMs <= 0;

  const totalDurationMs = DEFAULT_10_HOURS_MS;
  const totalRemainingSec = Math.floor(remainingMs / 1000);
  const hours = Math.floor(totalRemainingSec / 3600);
  const minutes = Math.floor((totalRemainingSec % 3600) / 60);
  const seconds = totalRemainingSec % 60;

  const pad = (n: number) => String(n).padStart(2, '0');
  const formattedTime = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;

  const percentRemaining = Math.min(100, Math.max(0, (remainingMs / totalDurationMs) * 100));

  return {
    issuedAtMs,
    expiresAtMs,
    totalDurationMs,
    remainingMs,
    hours,
    minutes,
    seconds,
    formattedTime,
    percentRemaining,
    isExpired,
  };
}

/**
 * React hook that keeps track of the 10-hour session timer
 * and automatically triggers logout when the token expires
 */
export function useSessionTimer(
  token: string,
  onLogout: () => void,
  onTokenRefreshed?: (newToken: string) => void
) {
  const [sessionInfo, setSessionInfo] = useState<TokenSessionInfo>(() => getSessionTiming(token));
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState('');
  const [refreshSuccess, setRefreshSuccess] = useState('');

  // Ticks every second to update remaining countdown
  useEffect(() => {
    if (!token) return;

    const tick = () => {
      const info = getSessionTiming(token);
      setSessionInfo(info);

      if (info.isExpired) {
        localStorage.setItem('ccs_session_expired_notice', 'true');
        onLogout();
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [token, onLogout]);

  // Function to reset the 10-hour session
  const refreshSession = useCallback(async () => {
    if (!token) return false;
    setIsRefreshing(true);
    setRefreshError('');
    setRefreshSuccess('');

    try {
      const res = await fetch('/api/auth/refresh-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (data.success && data.token) {
        localStorage.setItem('ccs_jwt_token', data.token);
        localStorage.setItem('ccs_session_issued_at', String(Date.now()));
        window.dispatchEvent(new Event('ccs_auth_change'));

        setSessionInfo(getSessionTiming(data.token));
        setRefreshSuccess('Session extended for 10 hours.');
        if (onTokenRefreshed) {
          onTokenRefreshed(data.token);
        }
        return true;
      } else {
        setRefreshError(data.message || 'Failed to refresh session.');
        return false;
      }
    } catch (err: any) {
      setRefreshError(err.message || 'Network error refreshing session.');
      return false;
    } finally {
      setIsRefreshing(false);
    }
  }, [token, onTokenRefreshed]);

  return {
    ...sessionInfo,
    refreshSession,
    isRefreshing,
    refreshError,
    refreshSuccess,
  };
}
