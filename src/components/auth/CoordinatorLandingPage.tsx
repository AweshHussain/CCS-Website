import React, { useState, useEffect } from 'react';
import {
  FolderGit2,
  GraduationCap,
  Users,
  ChevronRight,
  Radio,
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
  const [facultyQueries, setFacultyQueries] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [userCount, setUserCount] = useState<number>(0);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [resUpdates, resQueries, resSettings, resUsers] = await Promise.all([
          fetch('/api/coordinator/student-updates', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/coordinator/faculty-queries', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/coordinator/settings', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/admin/users', { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        const [dataUpdates, dataQueries, dataSettings, dataUsers] = await Promise.all([
          resUpdates.json(),
          resQueries.json(),
          resSettings.json(),
          resUsers.json(),
        ]);

        if (dataUpdates.success) setStudentUpdates(dataUpdates.updates || []);
        if (dataQueries.success) setFacultyQueries(dataQueries.queries || []);
        if (dataSettings.success) setSettings(dataSettings.settings || null);
        if (dataUsers.success) setUserCount((dataUsers.users || []).length);
      } catch {
        // quiet fallback
      }
    };

    fetchDashboardData();
  }, [token]);

  const pendingCount = studentUpdates.filter((u) => u.status === 'pending').length;
  const openQueriesCount = facultyQueries.filter((q) => q.status === 'open' || q.status === 'in_review').length;

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
            onClick={() => onNavigate('student_work')}
            className="px-3.5 py-1.5 rounded-lg bg-[#E50920] hover:bg-[#ff1e38] text-white text-xs font-mono font-medium transition-colors cursor-pointer"
          >
            Review Student Work
          </button>
          <button
            onClick={() => onNavigate('faculty_queries')}
            className="px-3.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-mono transition-colors cursor-pointer"
          >
            Faculty Inquiries
          </button>
        </div>
      </div>

      {/* ================= 3 CLEAN STATS CARDS ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Student Work */}
        <div
          onClick={() => onNavigate('student_work')}
          className="p-5 rounded-xl border border-white/10 bg-[#0B0C10]/92 backdrop-blur-xl shadow-xl shadow-black/40 hover:border-white/20 transition-all cursor-pointer group"
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

        {/* Card 2: Faculty Queries */}
        <div
          onClick={() => onNavigate('faculty_queries')}
          className="p-5 rounded-xl border border-white/10 bg-[#0B0C10]/92 backdrop-blur-xl shadow-xl shadow-black/40 hover:border-white/20 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-xs font-mono text-zinc-400 mb-2">
            <span>Faculty Inquiries</span>
            <GraduationCap className="w-4 h-4 text-zinc-400 group-hover:text-white transition-colors" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white font-display">
              {facultyQueries.length}
            </span>
            {openQueriesCount > 0 ? (
              <span className="text-xs font-mono text-[#E50920]">
                ({openQueriesCount} need response)
              </span>
            ) : (
              <span className="text-xs font-mono text-emerald-400">(All resolved)</span>
            )}
          </div>
        </div>

        {/* Card 3: Accounts */}
        <div
          onClick={() => onNavigate('accounts')}
          className="p-5 rounded-xl border border-white/10 bg-[#0B0C10]/92 backdrop-blur-xl shadow-xl shadow-black/40 hover:border-white/20 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-xs font-mono text-zinc-400 mb-2">
            <span>Registered Accounts</span>
            <Users className="w-4 h-4 text-zinc-400 group-hover:text-white transition-colors" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white font-display">
              {userCount || 4}
            </span>
            <span className="text-xs font-mono text-zinc-500">Active</span>
          </div>
        </div>
      </div>

      {/* ================= OPTIONAL BANNER ROW ================= */}
      {settings?.isBannerActive && (
        <div className="px-4 py-3 rounded-xl bg-[#0B0C10]/92 backdrop-blur-xl border border-white/10 shadow-lg shadow-black/30 flex items-center justify-between gap-3">
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

      {/* ================= TWO CLEAN FEEDS ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left: Student Updates */}
        <div className="p-5 rounded-xl border border-white/10 bg-[#0B0C10]/92 backdrop-blur-xl shadow-xl shadow-black/40 flex flex-col gap-3">
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
            {studentUpdates.slice(0, 3).map((item) => (
              <div
                key={item.id}
                onClick={() => onNavigate('student_work')}
                className="p-3.5 rounded-lg bg-[#14151C]/80 border border-white/10 hover:border-white/20 transition-all flex flex-col gap-1.5 cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white">{item.studentName}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-zinc-400">
                    {item.domain}
                  </span>
                </div>
                <p className="text-xs text-zinc-300 line-clamp-1">{item.projectTitle}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Faculty Inquiries */}
        <div className="p-5 rounded-xl border border-white/10 bg-[#0B0C10]/92 backdrop-blur-xl shadow-xl shadow-black/40 flex flex-col gap-3">
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <h3 className="text-sm font-semibold text-white font-display">
              Recent Faculty Inquiries
            </h3>
            <button
              onClick={() => onNavigate('faculty_queries')}
              className="text-xs font-mono text-zinc-400 hover:text-white flex items-center gap-0.5 cursor-pointer"
            >
              <span>View All</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <div className="flex flex-col gap-2.5">
            {facultyQueries.slice(0, 3).map((query) => (
              <div
                key={query.id}
                onClick={() => onNavigate('faculty_queries')}
                className="p-3.5 rounded-lg bg-[#14151C]/80 border border-white/10 hover:border-white/20 transition-all flex flex-col gap-1.5 cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white">{query.facultyName}</span>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                      query.priority === 'urgent'
                        ? 'bg-rose-500/20 text-[#E50920]'
                        : 'bg-white/5 text-zinc-400'
                    }`}
                  >
                    {query.priority?.toUpperCase()}
                  </span>
                </div>
                <p className="text-xs text-zinc-300 line-clamp-1">{query.subject}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
