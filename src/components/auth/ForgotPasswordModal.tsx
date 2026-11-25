import React, { useState } from 'react';
import { Mail, KeyRound, Lock, ArrowRight, ArrowLeft, RefreshCw, CheckCircle2, AlertCircle, X, ShieldCheck } from 'lucide-react';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialEmail?: string;
  theme?: 'dark' | 'light';
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  isOpen,
  onClose,
  initialEmail = '',
  theme = 'dark',
}) => {
  const [step, setStep] = useState<'request' | 'verify'>('request');
  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [devOtpHint, setDevOtpHint] = useState<string | null>(null);

  if (!isOpen) return null;

  // Step 1: Request OTP
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your account email.');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccessMessage('');
    setDevOtpHint(null);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        setError('Server is updating or unavailable. Please retry in a few seconds.');
        return;
      }
      const data = await res.json();
      if (data.success) {
        setSuccessMessage(data.message || 'Verification code sent to your email.');
        if (data.devOtp) {
          setDevOtpHint(data.devOtp);
        }
        setStep('verify');
      } else {
        setError(data.message || 'Failed to send verification code.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to connect to authentication server.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify OTP and Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim()) {
      setError('Please enter the 6-digit verification code.');
      return;
    }
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          otp: otp.trim(),
          newPassword,
        }),
      });
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        setError('Server is updating or unavailable. Please retry in a few seconds.');
        return;
      }
      const data = await res.json();
      if (data.success) {
        alert('Password successfully reset! You can now log in with your new password.');
        onClose();
      } else {
        setError(data.message || 'Failed to reset password.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit password reset.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className={`w-full max-w-md p-6 sm:p-7 rounded-2xl border shadow-2xl relative overflow-hidden ${
        theme === 'light'
          ? 'bg-white border-black/10 shadow-black/15 text-zinc-900'
          : 'bg-[#0B0C10] border-white/15 shadow-black/80 text-white'
      }`}>
        {/* Ambient Top Glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#E50920]/10 rounded-full blur-[90px] pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#E50920]/15 text-[#E50920] border border-[#E50920]/30 flex items-center justify-center">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold font-display tracking-tight">
                {step === 'request' ? 'Reset Account Password' : 'Enter 6-Digit OTP'}
              </h3>
              <p className={`text-[11px] font-mono ${theme === 'light' ? 'text-zinc-500' : 'text-zinc-400'}`}>
                {step === 'request'
                  ? 'We will send a verification code to your email'
                  : `Verification code sent to ${email}`}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-1 rounded-lg transition-colors cursor-pointer ${
              theme === 'light' ? 'text-zinc-400 hover:text-black hover:bg-black/5' : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs font-mono text-red-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Success / Info Notification */}
        {successMessage && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs font-mono text-emerald-400 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Development simulation hint */}
        {devOtpHint && (
          <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs font-mono text-amber-300">
            <strong>Dev Mode Simulation:</strong> Your code is: <code className="bg-amber-500/20 px-1 py-0.5 rounded font-bold">{devOtpHint}</code>
          </div>
        )}

        {/* STEP 1: Enter Email & Request OTP */}
        {step === 'request' && (
          <form onSubmit={handleRequestOtp} className="space-y-4">
            <div>
              <label className={`text-xs font-mono uppercase block mb-1.5 ${theme === 'light' ? 'text-zinc-700' : 'text-zinc-300'}`}>
                Registered Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. your_email@domain.com"
                  required
                  className={`w-full px-3.5 py-2.5 pl-10 rounded-xl border text-xs font-mono focus:outline-none focus:border-[#E50920] ${
                    theme === 'light'
                      ? 'bg-zinc-50 border-black/15 text-zinc-900 placeholder-zinc-400'
                      : 'bg-black/50 border-white/15 text-white placeholder-zinc-500'
                  }`}
                />
                <Mail className="w-4 h-4 text-[#E50920] absolute left-3.5 top-3" />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={onClose}
                className={`px-4 py-2 rounded-xl text-xs font-mono transition-colors cursor-pointer ${
                  theme === 'light' ? 'text-zinc-600 hover:text-black hover:bg-black/5' : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-5 py-2.5 rounded-xl bg-[#E50920] hover:bg-[#ff1e38] text-white text-xs font-bold font-mono uppercase tracking-wider shadow-lg shadow-[#E50920]/30 flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ArrowRight className="w-3.5 h-3.5" />}
                <span>Send Reset Code</span>
              </button>
            </div>
          </form>
        )}

        {/* STEP 2: Enter OTP & New Password */}
        {step === 'verify' && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            {/* 6-Digit OTP Input */}
            <div>
              <label className={`text-xs font-mono uppercase block mb-1.5 ${theme === 'light' ? 'text-zinc-700' : 'text-zinc-300'}`}>
                6-Digit Verification Code
              </label>
              <div className="relative">
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  required
                  autoFocus
                  className={`w-full px-3.5 py-3 pl-10 rounded-xl border text-center text-lg tracking-[8px] font-bold font-mono focus:outline-none focus:border-[#E50920] ${
                    theme === 'light'
                      ? 'bg-zinc-50 border-black/15 text-zinc-900 placeholder-zinc-300'
                      : 'bg-black/50 border-white/15 text-white placeholder-zinc-600'
                  }`}
                />
                <ShieldCheck className="w-4 h-4 text-[#E50920] absolute left-3.5 top-3.5" />
              </div>
              <p className={`text-[10px] font-mono mt-1 ${theme === 'light' ? 'text-zinc-500' : 'text-zinc-400'}`}>
                Check your inbox for the 6-digit code. Valid for 10 minutes.
              </p>
            </div>

            {/* New Password */}
            <div>
              <label className={`text-xs font-mono uppercase block mb-1.5 ${theme === 'light' ? 'text-zinc-700' : 'text-zinc-300'}`}>
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  required
                  className={`w-full px-3.5 py-2.5 pl-10 pr-10 rounded-xl border text-xs font-mono focus:outline-none focus:border-[#E50920] ${
                    theme === 'light'
                      ? 'bg-zinc-50 border-black/15 text-zinc-900 placeholder-zinc-400'
                      : 'bg-black/50 border-white/15 text-white placeholder-zinc-500'
                  }`}
                />
                <Lock className="w-4 h-4 text-[#E50920] absolute left-3.5 top-3" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-zinc-400 hover:text-white"
                >
                  <span className="text-[10px] font-mono">{showPassword ? 'HIDE' : 'SHOW'}</span>
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div>
              <label className={`text-xs font-mono uppercase block mb-1.5 ${theme === 'light' ? 'text-zinc-700' : 'text-zinc-300'}`}>
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  required
                  className={`w-full px-3.5 py-2.5 pl-10 rounded-xl border text-xs font-mono focus:outline-none focus:border-[#E50920] ${
                    theme === 'light'
                      ? 'bg-zinc-50 border-black/15 text-zinc-900 placeholder-zinc-400'
                      : 'bg-black/50 border-white/15 text-white placeholder-zinc-500'
                  }`}
                />
                <Lock className="w-4 h-4 text-[#E50920] absolute left-3.5 top-3" />
              </div>
            </div>

            <div className="flex items-center justify-between pt-3">
              <button
                type="button"
                onClick={() => setStep('request')}
                className={`text-xs font-mono flex items-center gap-1 cursor-pointer ${
                  theme === 'light' ? 'text-zinc-600 hover:text-black' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Resend Code</span>
              </button>

              <button
                type="submit"
                disabled={isLoading}
                className="px-5 py-2.5 rounded-xl bg-[#E50920] hover:bg-[#ff1e38] text-white text-xs font-bold font-mono uppercase tracking-wider shadow-lg shadow-[#E50920]/30 flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                <span>Set New Password</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
