import React, { useState } from 'react';
import {
  User,
  Mail,
  Shield,
  Clock,
  LogOut,
  CheckCircle2,
  Copy,
  GraduationCap,
  Briefcase,
  Building,
  KeyRound,
  AlertTriangle,
  Award,
  Layers,
  Terminal,
} from 'lucide-react';
import { useSessionTimer } from '../../utils/sessionSecurity';

interface UserProfilePageProps {
  currentUser: {
    id: string;
    email: string;
    fullName: string;
    role: string;
    department: string;
    avatarUrl?: string;
    permissions?: {
      canSendEmails?: boolean;
      canBroadcastAnnouncements?: boolean;
      canReviewProjects?: boolean;
      canAssignWork?: boolean;
      canManageAccounts?: boolean;
      [key: string]: boolean | undefined;
    };
  };
  token: string;
  onLogout: () => void;
  onTokenRefreshed?: (newToken: string) => void;
}

export const UserProfilePage: React.FC<UserProfilePageProps> = ({
  currentUser,
  token,
  onLogout,
  onTokenRefreshed,
}) => {
  const [copiedEmail, setCopiedEmail] = useState(false);
  const session = useSessionTimer(token, onLogout, onTokenRefreshed);

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(currentUser.email);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const getRoleDesignation = (role: string) => {
    switch (role) {
      case 'student':
        return {
          title: 'Code & Compute Society',
          subtitle: 'student portal',
          badge: 'STUDENT BUILDER',
          color: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
          icon: <Terminal className="w-5 h-5 text-blue-400" />,
          level: 'Level 1 - Engineering Resident',
          privileges: [
            'Submit and publish ongoing technical project repositories',
            'Receive structured advisory feedback from technical leads',
            'Access assigned assignments and society directives',
            'Real-time access to society broadcasts and announcements',
          ],
        };
      case 'coordinator':
      default:
        return {
          title: 'Student Coordinator & Tech Lead',
          subtitle: 'Executive Leadership & Full-Stack Core',
          badge: 'COORDINATOR DESK',
          color: 'text-[#E50920] bg-[#E50920]/10 border-[#E50920]/30',
          icon: <Shield className="w-5 h-5 text-[#E50920]" />,
          level: 'Level 3 - Root Portal Administrator',
          privileges: [
            'Full administrative oversight of all society modules',
            'Broadcast live announcements to the public platform',
            'Manage and issue credentials to student rosters',
            'Decrypted access to credential security vault',
          ],
        };
    }
  };

  const roleMeta = getRoleDesignation(currentUser.role);

  return (
    <div className="w-full flex flex-col gap-6 animate-in fade-in duration-200">
      {/* ---------------- Profile Header Banner ---------------- */}
      <div className="p-6 sm:p-8 rounded-2xl border border-white/10 bg-[#0B0C10]/92 backdrop-blur-xl shadow-xl shadow-black/40 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        {/* Ambient subtle glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#E50920]/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center gap-5 relative z-10">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-zinc-800 to-zinc-950 border border-white/15 shadow-2xl flex items-center justify-center text-white font-bold text-3xl font-display overflow-hidden">
              {currentUser.avatarUrl ? (
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.fullName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{currentUser.fullName ? currentUser.fullName.charAt(0).toUpperCase() : 'U'}</span>
              )}
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-[#0B0C10] flex items-center justify-center shadow-md" title="Active Session">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            </div>
          </div>

          {/* User Details */}
          <div className="flex flex-col gap-1.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold font-display text-white">
                {currentUser.fullName}
              </h1>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase border ${roleMeta.color}`}
              >
                {roleMeta.badge}
              </span>
            </div>

            <p className="text-xs sm:text-sm font-mono text-zinc-300 flex items-center gap-2">
              <Briefcase className="w-3.5 h-3.5 text-[#E50920]" />
              <span>{roleMeta.title}</span>
              <span className="text-zinc-600 hidden sm:inline">•</span>
              <span className="text-zinc-400 hidden sm:inline text-xs">{roleMeta.subtitle}</span>
            </p>

            <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-zinc-400 mt-1">
              <span className="flex items-center gap-1.5 text-zinc-300">
                <Building className="w-3.5 h-3.5 text-zinc-500" />
                <span>{currentUser.department || 'Computer Science & Engineering'}</span>
              </span>

              <span className="text-zinc-600">•</span>

              <div className="flex items-center gap-1.5 bg-black/40 px-2.5 py-1 rounded-md border border-white/10">
                <Mail className="w-3 h-3 text-[#E50920]" />
                <span className="text-zinc-300 select-all">{currentUser.email}</span>
                <button
                  onClick={handleCopyEmail}
                  className="ml-1 text-zinc-500 hover:text-white transition-colors cursor-pointer"
                  title="Copy Email"
                >
                  {copiedEmail ? (
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Sign Out Button */}
        <div className="flex items-center gap-3 relative z-10 self-start md:self-auto">
          <button
            onClick={onLogout}
            className="px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-mono transition-colors cursor-pointer flex items-center gap-2 shadow-md shadow-rose-950/20"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* ---------------- SECTION 2: COMPACT 10-HOUR TOKEN EXPIRY ---------------- */}
      <div className="p-4 sm:p-5 rounded-2xl border border-white/10 bg-[#0B0C10]/92 backdrop-blur-xl shadow-lg shadow-black/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#E50920]/15 text-[#E50920] border border-[#E50920]/30 flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-white font-mono">
                10-Hour Session Expiry:
              </span>
              <span className="text-xs font-mono font-bold text-amber-400">
                {session.formattedTime}
              </span>
              <span className="text-[10px] font-mono text-zinc-500">remaining</span>
            </div>
            <p className="text-[11px] font-mono text-zinc-400">
              Session automatically resets and logs out every 10 hours for security.
            </p>
          </div>
        </div>
      </div>

      {/* ---------------- SECTION 3: DESIGNATION & PORTAL PRIVILEGES ---------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Designation Specs (5 cols) */}
        <div className="lg:col-span-5 p-6 rounded-2xl border border-white/10 bg-[#0B0C10]/92 backdrop-blur-xl shadow-xl shadow-black/40 flex flex-col gap-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-white/10">
            <Award className="w-4 h-4 text-[#E50920]" />
            <h3 className="text-sm font-semibold text-white font-display">Designation Profile</h3>
          </div>

          <div className="flex flex-col gap-3 text-xs font-mono">
            <div className="flex items-center justify-between pb-2 border-b border-white/5">
              <span className="text-zinc-500">Official Designation:</span>
              <span className="text-white font-semibold">{roleMeta.title}</span>
            </div>

            <div className="flex items-center justify-between pb-2 border-b border-white/5">
              <span className="text-zinc-500">Department / Domain:</span>
              <span className="text-zinc-200">{currentUser.department || 'Computer Science & Engineering'}</span>
            </div>

            <div className="flex items-center justify-between pb-2 border-b border-white/5">
              <span className="text-zinc-500">System Role ID:</span>
              <span className="text-[#E50920] uppercase font-bold">{currentUser.role}</span>
            </div>

            <div className="flex items-center justify-between pb-2 border-b border-white/5">
              <span className="text-zinc-500">Access Authority:</span>
              <span className="text-zinc-300">{roleMeta.level}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-zinc-500">Authentication Mode:</span>
              <span className="text-emerald-400 font-semibold">Institutional Verified</span>
            </div>
          </div>
        </div>

        {/* Right: Assigned Portal Capabilities (7 cols) */}
        <div className="lg:col-span-7 p-6 rounded-2xl border border-white/10 bg-[#0B0C10]/92 backdrop-blur-xl shadow-xl shadow-black/40 flex flex-col gap-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-white/10">
            <Layers className="w-4 h-4 text-[#E50920]" />
            <h3 className="text-sm font-semibold text-white font-display">Portal Capabilities & Scope</h3>
          </div>

          <p className="text-xs font-mono text-zinc-400 leading-relaxed">
            Your verified {currentUser.role.toUpperCase()} credentials grant access to the following operational endpoints:
          </p>

          <div className="space-y-2.5">
            {/* Dynamic Coordinator-delegated Email Sending Capability */}
            {currentUser.permissions?.canSendEmails && (
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3">
                <Mail className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="flex flex-col">
                  <span className="text-xs font-mono font-bold text-emerald-300">
                    Official Email Sending Access: AUTHORIZED
                  </span>
                  <span className="text-[11px] font-mono text-zinc-400">
                    Access granted by Student Coordinator to send and broadcast official society emails.
                  </span>
                </div>
              </div>
            )}

            {roleMeta.privileges.map((item, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg bg-black/40 border border-white/5 flex items-start gap-3"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-xs font-mono text-zinc-200">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
