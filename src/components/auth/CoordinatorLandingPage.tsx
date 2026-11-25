import React, { useState, useEffect } from 'react';
import {
  FolderGit2,
  Users,
  ChevronRight,
  Radio,
  UserPlus,
  Sliders,
  Shield,
  ListOrdered,
} from 'lucide-react';
import { CoordinatorTabType } from './CoordinatorNavbar';

interface CoordinatorLandingPageProps {
  currentUser: {
    id: string;
    email: string;
    fullName: string;
    role: string;
    department: string;
    avatarUrl?: string;
  };
  token: string;
  onNavigate: (tab: CoordinatorTabType) => void;
  onOpenChangePassword: () => void;
}

export const CoordinatorLandingPage: React.FC<CoordinatorLandingPageProps> = ({
  currentUser,
  token,
  onNavigate,
}) => {
  const [studentUpdates, setStudentUpdates] = useState<any[]>([]);
  const [assignedWork, setAssignedWork] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [userCount, setUserCount] = useState<number>(0);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [resUpdates, resWork, resSettings, resUsers] = await Promise.all([
          fetch('/api/coordinator/student-updates', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/coordinator/assigned-work', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/coordinator/settings', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/admin/users', { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        const [dataUpdates, dataWork, dataSettings, dataUsers] = await Promise.all([
          resUpdates.json(),
          resWork.json(),
          resSettings.json(),
          resUsers.json(),
        ]);

        if (dataUpdates.success) setStudentUpdates(dataUpdates.updates || []);
        if (dataWork.success) setAssignedWork(dataWork.work || []);
        if (dataSettings.success) setSettings(dataSettings.settings || null);
        if (dataUsers.success) setUserCount((dataUsers.users || []).length);
      } catch {
        // quiet fallback
      }
    };

    fetchDashboardData();
  }, [token]);

  const pendingCount = studentUpdates.filter((u) => u.status === 'pending').length;
  const activeDirectivesCount = assignedWork.filter((w) => w.status === 'active').length;
  const totalClaimsCount = assignedWork.reduce((acc, w) => acc + (w.claimsQueue?.length || 0), 0);

  return (
    <div className="w-full flex flex-col gap-6 animate-in fade-in duration-200">
      {/* ================= CLEAN HEADER ================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-white/10">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-display text-white">
            Welcome, {currentUser.fullName}
          </h1>
          <p className="text-xs font-mono text-zinc-400 mt-0.5">
            Student Coordinator • {currentUser.department || 'Executive Operations'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('task_directives')}
            className="px-3.5 py-1.5 rounded-lg bg-[#E50920] hover:bg-[#ff1e38] text-white text-xs font-mono font-medium transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <ListOrdered className="w-3.5 h-3.5" />
            <span>Task Directives</span>
          </button>
          <button
            onClick={() => onNavigate('student_work')}
            className="px-3.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-mono transition-colors cursor-pointer"
          >
            Review Student Work
          </button>
          <button
            onClick={() => onNavigate('accounts')}
            className="px-3.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-mono transition-colors cursor-pointer"
          >
            Manage Accounts
          </button>
        </div>
      </div>

      {/* ================= 3 CLEAN STATS CARDS ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Student Work */}
        <div
          onClick={() => onNavigate('student_work')}
          className="p-5 rounded-xl border border-white/10 bg-[#0B0C10] backdrop-blur-2xl shadow-xl shadow-black/60 hover:border-white/20 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-xs font-mono text-zinc-400 mb-2">
            <span>Student Projects</span>
            <FolderGit2 className="w-4 h-4 text-zinc-400 group-hover:text-white transition-colors" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white font-display">
              {studentUpdates.length}
            </span>
            {pendingCount > 0 ? (
              <span className="text-xs font-mono text-amber-400">
                ({pendingCount} pending review)
              </span>
            ) : (
              <span className="text-xs font-mono text-emerald-400">(Up to date)</span>
            )}
          </div>
        </div>

        {/* Card 2: Task Directives */}
        <div
          onClick={() => onNavigate('task_directives')}
          className="p-5 rounded-xl border border-white/10 bg-[#0B0C10] backdrop-blur-2xl shadow-xl shadow-black/60 hover:border-white/20 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-xs font-mono text-zinc-400 mb-2">
            <span>Task Directives</span>
            <ListOrdered className="w-4 h-4 text-[#E50920] group-hover:scale-110 transition-transform" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white font-display">
              {activeDirectivesCount}
            </span>
            <span className="text-xs font-mono text-emerald-400">
              ({totalClaimsCount} queued claims)
            </span>
          </div>
        </div>

        {/* Card 3: Accounts */}
        <div
          onClick={() => onNavigate('accounts')}
          className="p-5 rounded-xl border border-white/10 bg-[#0B0C10] backdrop-blur-2xl shadow-xl shadow-black/60 hover:border-white/20 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-xs font-mono text-zinc-400 mb-2">
            <span>Registered Accounts</span>
            <Users className="w-4 h-4 text-zinc-400 group-hover:text-white transition-colors" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white font-display">
              {userCount || 3}
            </span>
            <span className="text-xs font-mono text-zinc-500">Active</span>
          </div>
        </div>
      </div>

      {/* ================= OPTIONAL BANNER ROW ================= */}
      {settings?.isBannerActive && (
        <div className="px-4 py-3 rounded-xl bg-[#0B0C10] backdrop-blur-2xl border border-white/10 shadow-lg shadow-black/50 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <Radio className="w-3.5 h-3.5 text-[#E50920] shrink-0" />
            <span className="text-xs font-mono text-zinc-300 truncate">
              {settings.announcementBanner}
            </span>
          </div>
          <button
            onClick={() => onNavigate('settings')}
            className="text-[11px] font-mono text-zinc-400 hover:text-white shrink-0 cursor-pointer"
          >
            Edit
          </button>
        </div>
      )}

      {/* ================= TWO CLEAN PANELS ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left: Student Updates */}
        <div className="p-5 rounded-xl border border-white/10 bg-[#0B0C10] backdrop-blur-2xl shadow-xl shadow-black/60 flex flex-col gap-3">
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <h3 className="text-sm font-semibold text-white font-display">
              Recent Student Submissions
            </h3>
            <button
              onClick={() => onNavigate('student_work')}
              className="text-xs font-mono text-zinc-400 hover:text-white flex items-center gap-0.5 cursor-pointer"
            >
              <span>View All</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <div className="flex flex-col gap-2.5">
            {studentUpdates.length > 0 ? (
              studentUpdates.slice(0, 3).map((item) => (
                <div
                  key={item.id}
                  onClick={() => onNavigate('student_work')}
                  className="p-3.5 rounded-lg bg-[#14151C] border border-white/10 hover:border-white/20 transition-all flex flex-col gap-1.5 cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-white">{item.studentName}</span>
                      <span
                        className={`w-2 h-2 rounded-full inline-block ${
                          item.isOnline
                            ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)] animate-pulse'
                            : 'bg-rose-500'
                        }`}
                        title={item.isOnline ? 'Online' : 'Offline'}
                      />
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-zinc-400">
                      {item.domain}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-300 line-clamp-1">{item.projectTitle}</p>
                </div>
              ))
            ) : (
              <p className="text-xs font-mono text-zinc-500 py-4 text-center">No student submissions yet.</p>
            )}
          </div>
        </div>

        {/* Right: Quick Action Controls */}
        <div className="p-5 rounded-xl border border-white/10 bg-[#0B0C10] backdrop-blur-2xl shadow-xl shadow-black/60 flex flex-col gap-3">
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <h3 className="text-sm font-semibold text-white font-display">
              Quick Operations
            </h3>
            <span className="text-xs font-mono text-zinc-500">Coordinator Desk</span>
          </div>

          <div className="flex flex-col gap-2.5">
            <button
              onClick={() => onNavigate('student_work')}
              className="p-3.5 rounded-lg bg-[#14151C] border border-white/10 hover:border-[#E50920]/40 transition-all flex items-center justify-between cursor-pointer text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#E50920]/10 flex items-center justify-center text-[#E50920]">
                  <FolderGit2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-white group-hover:text-[#E50920] transition-colors">Review Projects & Milestones</div>
                  <div className="text-[11px] font-mono text-zinc-400">Approve submissions and leave feedback</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors" />
            </button>

            <button
              onClick={() => onNavigate('accounts')}
              className="p-3.5 rounded-lg bg-[#14151C]/80 border border-white/10 hover:border-[#E50920]/40 transition-all flex items-center justify-between cursor-pointer text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-zinc-300">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-white group-hover:text-[#E50920] transition-colors">Grant New Credentials</div>
                  <div className="text-[11px] font-mono text-zinc-400">Issue student member or coordinator accounts</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors" />
            </button>

            <button
              onClick={() => onNavigate('settings')}
              className="p-3.5 rounded-lg bg-[#14151C]/80 border border-white/10 hover:border-[#E50920]/40 transition-all flex items-center justify-between cursor-pointer text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-zinc-300">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-white group-hover:text-[#E50920] transition-colors">Broadcasts & Settings</div>
                  <div className="text-[11px] font-mono text-zinc-400">Manage announcement ticker and system state</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
