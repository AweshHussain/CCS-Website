import React, { useState, useEffect } from 'react';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  X,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface ChangeEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentEmail: string;
  token: string;
  onSuccess?: (updatedUser: any, newToken: string) => void;
}

export const ChangeEmailModal: React.FC<ChangeEmailModalProps> = ({
  isOpen,
  onClose,
  currentEmail,
  token,
  onSuccess,
}) => {
  const [newEmail, setNewEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Auto-dismiss success notification after 4 seconds
  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => {
      setSuccess('');
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [success, onClose]);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setNewEmail('');
      setCurrentPassword('');
      setError('');
      setSuccess('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const cleanNew = newEmail.trim().toLowerCase();

    if (!cleanNew) {
      setError('New email address is required.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanNew)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (cleanNew === currentEmail.toLowerCase()) {
      setError('New email address is identical to your current email.');
      return;
    }

    if (!currentPassword) {
      setError('Please enter your account password to verify this change.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/change-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          newEmail: cleanNew,
          currentPassword,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccess(`Email updated successfully to ${cleanNew}`);
        if (onSuccess) {
          onSuccess(data.user, data.token);
        }
      } else {
        setError(data.message || 'Failed to update email address.');
      }
    } catch (err: any) {
      setError(err.message || 'Network error updating email address.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      {/* Click outside backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Card */}
      <div className="relative w-full max-w-md rounded-2xl glass-panel-elevated border border-white/15 bg-[#0A0A0C]/95 backdrop-blur-2xl shadow-2xl p-6 sm:p-7 overflow-hidden z-10 animate-in zoom-in-95 duration-200">
        {/* Subtle top crimson glow border */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#E50920] to-transparent" />
        <div className="absolute top-0 right-0 w-36 h-24 bg-[#E50920]/15 rounded-full blur-2xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          type="button"
          className="absolute top-5 right-5 p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          title="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-[#E50920]/15 border border-[#E50920]/30 text-[#E50920] flex items-center justify-center shadow-inner">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold font-display text-white">
              Change Account Email
            </h3>
            <p className="text-xs font-mono text-zinc-400 mt-0.5">
              Update your primary coordinator address
            </p>
          </div>
        </div>

        {/* Notifications */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-400 text-xs font-mono flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-mono flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Current Email Display */}
          <div>
            <label className="text-xs font-mono text-zinc-400 block mb-1.5 uppercase tracking-wider">
              Current Email
            </label>
            <div className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-xs font-mono text-zinc-400 select-all">
              {currentEmail}
            </div>
          </div>

          {/* New Email */}
          <div>
            <label className="text-xs font-mono text-zinc-400 block mb-1.5 uppercase tracking-wider">
              New Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="coordinator@domain.com"
                required
                className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-black/50 border border-white/15 text-xs font-mono text-white placeholder-zinc-500 focus:outline-none focus:border-[#E50920] transition-colors"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500">
                <Mail className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>

          {/* Account Password Confirmation */}
          <div>
            <label className="text-xs font-mono text-zinc-400 block mb-1.5 uppercase tracking-wider">
              Account Password (for Security)
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                required
                className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-black/50 border border-white/15 text-xs font-mono text-white placeholder-zinc-500 focus:outline-none focus:border-[#E50920] transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
            <p className="text-[10px] font-mono text-zinc-500 mt-1">
              Required to prevent unauthorized modifications to your coordinator account.
            </p>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-[#E50920] hover:bg-[#ff1e38] text-white text-xs font-mono font-semibold transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-[#E50920]/20 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Updating Email...</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>Confirm & Update Email</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
