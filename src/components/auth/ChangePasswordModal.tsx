import React, { useState, useEffect } from 'react';
import {
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  X,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string;
  onSuccess?: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isOpen,
  onClose,
  token,
  onSuccess,
}) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Auto-dismiss success notification after 5 seconds
  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => {
      setSuccess('');
      onClose();
    }, 5000);
    return () => clearTimeout(timer);
  }, [success, onClose]);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setError('');
      setSuccess('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleGeneratePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let pass = '';
    for (let i = 0; i < 14; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(pass);
    setConfirmPassword(pass);
    setShowNewPassword(true);
    setShowConfirmPassword(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!currentPassword.trim() || !newPassword.trim()) {
      setError('Current password and new password are required.');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccess('Password changed successfully! New credentials active.');
        if (onSuccess) onSuccess();
      } else {
        setError(data.message || 'Failed to update password.');
      }
    } catch (err: any) {
      setError(err.message || 'Network error updating password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      {/* Outer Click Backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Dialog Card matching the user's exact styling */}
      <div className="relative w-full max-w-md p-6 sm:p-7 rounded-3xl glass-panel-elevated border border-white/15 bg-[#0A0A0C]/95 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 z-10">
        {/* Subtle Ambient Red Glow */}
        <div className="absolute top-0 right-0 w-64 h-36 bg-[#E50920]/15 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header matching screenshot */}
        <div className="flex items-center gap-3.5 mb-6">
          <div className="w-11 h-11 rounded-2xl bg-[#E50920]/15 border border-[#E50920]/40 flex items-center justify-center text-[#E50920] shadow-lg shadow-[#E50920]/20">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold font-display text-white tracking-tight">
              Change Account Password
            </h3>
            <p className="text-xs font-mono text-zinc-400">
              Update your coordinator login credentials
            </p>
          </div>
        </div>

        {/* Success Alert */}
        {success && (
          <div className="mb-4 p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-mono flex items-center justify-between">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{success}</span>
            </span>
            <button onClick={() => setSuccess('')} className="text-emerald-400 hover:text-white">✕</button>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-mono flex items-center justify-between">
            <span className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-[#E50920]" />
              <span>{error}</span>
            </span>
            <button onClick={() => setError('')} className="text-rose-400 hover:text-white">✕</button>
          </div>
        )}

        {/* Password Form matching screenshot inputs */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Current Password */}
          <div>
            <label className="text-[11px] font-mono uppercase text-zinc-400 tracking-wider block mb-1.5 font-medium">
              Current Password
            </label>
            <div className="relative">
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                required
                className="w-full px-4 py-3 pr-11 rounded-2xl bg-black/60 border border-white/10 text-xs font-mono text-white placeholder-zinc-500 focus:outline-none focus:border-[#E50920] transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white cursor-pointer"
                title={showCurrentPassword ? 'Hide password' : 'Show password'}
              >
                {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-mono uppercase text-zinc-400 tracking-wider font-medium">
                New Password
              </label>
              <button
                type="button"
                onClick={handleGeneratePassword}
                className="text-[11px] font-mono text-[#E50920] hover:text-white flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-3 h-3" />
                <span>Generate</span>
              </button>
            </div>
            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
                required
                minLength={6}
                className="w-full px-4 py-3 pr-11 rounded-2xl bg-black/60 border border-white/10 text-xs font-mono text-white placeholder-zinc-500 focus:outline-none focus:border-[#E50920] transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white cursor-pointer"
                title={showNewPassword ? 'Hide password' : 'Show password'}
              >
                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm New Password */}
          <div>
            <label className="text-[11px] font-mono uppercase text-zinc-400 tracking-wider block mb-1.5 font-medium">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
                required
                minLength={6}
                className="w-full px-4 py-3 pr-11 rounded-2xl bg-black/60 border border-white/10 text-xs font-mono text-white placeholder-zinc-500 focus:outline-none focus:border-[#E50920] transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white cursor-pointer"
                title={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Red Confirm & Change Password Button matching screenshot */}
          <button
            type="submit"
            disabled={loading}
            className="mt-3 w-full py-3.5 px-5 rounded-2xl bg-[#E50920] hover:bg-[#ff1e38] text-white text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-[#E50920]/40 transition-all cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Updating Password...</span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                <span>Confirm & Change Password</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
