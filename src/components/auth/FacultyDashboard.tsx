import React, { useState, useEffect, useRef } from 'react';
import {
  Award,
  BookOpen,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  Send,
  ExternalLink,
  Github,
  Trash2,
  Sliders,
  LogOut,
  ChevronDown,
  RefreshCw,
  Sparkles,
  Filter,
  Check,
  X,
  FileText,
  ArrowRight,
  LayoutDashboard,
  FolderGit2,
  MessageSquare,
  Shield,
  Layers,
  Calendar,
  Users,
  User,
  Radio,
} from 'lucide-react';
import { DashboardBackground } from '../ui/DashboardBackground';
import { UserProfilePage } from './UserProfilePage';
import { useSessionTimer } from '../../utils/sessionSecurity';

interface FacultyDashboardProps {
  currentUser: {
    id: string;
    email: string;
    fullName: string;
    role: string;
    department: string;
    avatarUrl?: string;
    permissions?: {
      canBroadcastAnnouncements?: boolean;
      canReviewProjects?: boolean;
      canAssignWork?: boolean;
      canManageInquiries?: boolean;
      [key: string]: boolean | undefined;
    };
  };
  token: string;
  onLogout: () => void;
  onBackToHome: () => void;
}

type FacultyTab = 'overview' | 'student_updates' | 'assign_work' | 'directives' | 'announcements' | 'profile';

interface StudentUpdate {
  id: string;
  studentName: string;
  studentEmail: string;
  department: string;
  projectTitle: string;
  description: string;
  domain: string;
  githubUrl: string;
  demoUrl: string;
  progressPercent: number;
  status: 'pending' | 'approved' | 'changes_requested';
  coordinatorFeedback?: string;
  submittedAt: string;
  updatedAt: string;
}

interface AssignedTask {
  id: string;
  title: string;
  description: string;
  domain: string;
  assignedByName: string;
  assignedByEmail: string;
  assignedTo: string;
  dueDate: string;
  priority: 'normal' | 'high' | 'urgent';
  status: 'active' | 'completed' | 'archived';
  createdAt: string;
}

interface FacultyQuery {
  id: string;
  subject: string;
  message: string;
  priority: string;
  category: string;
  status: string;
  coordinatorResponse?: string;
  createdAt: string;
}

export const FacultyDashboard: React.FC<FacultyDashboardProps> = ({
  currentUser,
  token,
  onLogout,
  onBackToHome,
}) => {
  const [currentTab, setCurrentTab] = useState<FacultyTab>('overview');
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Active 10-Hour Session Expiry Watcher (auto logout on expiry)
  const session = useSessionTimer(token, onLogout);

  // Data States
  const [studentUpdates, setStudentUpdates] = useState<StudentUpdate[]>([]);
  const [assignedTasks, setAssignedTasks] = useState<AssignedTask[]>([]);
  const [queries, setQueries] = useState<FacultyQuery[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedbackSuccess, setFeedbackSuccess] = useState('');
  const [feedbackError, setFeedbackError] = useState('');

  // Status Filter for Student Updates
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'changes_requested'>('all');

  // Review Modal / Action State
  const [selectedUpdateForReview, setSelectedUpdateForReview] = useState<StudentUpdate | null>(null);
  const [reviewStatus, setReviewStatus] = useState<'approved' | 'changes_requested'>('approved');
  const [reviewFeedback, setReviewFeedback] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // New Work Assignment Form State
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newDomain, setNewDomain] = useState('Artificial Intelligence & Systems');
  const [newAssignee, setNewAssignee] = useState('All Students');
  const [newDueDate, setNewDueDate] = useState('');
  const [newPriority, setNewPriority] = useState<'normal' | 'high' | 'urgent'>('normal');
  const [assigningWork, setAssigningWork] = useState(false);

  // New Directive Form State
  const [newQuerySubject, setNewQuerySubject] = useState('');
  const [newQueryMessage, setNewQueryMessage] = useState('');
  const [newQueryPriority, setNewQueryPriority] = useState('normal');
  const [newQueryCategory, setNewQueryCategory] = useState('Academic Directive');
  const [submittingQuery, setSubmittingQuery] = useState(false);

  // Live User Profile with real-time permissions synchronization
  const [userProfile, setUserProfile] = useState<any>(currentUser);

  useEffect(() => {
    setUserProfile(currentUser);
  }, [currentUser]);

  // Synchronize latest permissions from backend continuously so updates reflect instantly
  useEffect(() => {
    const fetchLatestPermissions = async () => {
      try {
        const res = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success && data.user) {
          setUserProfile((prev: any) => ({ ...prev, ...data.user }));
          localStorage.setItem('ccs_current_user', JSON.stringify(data.user));
        }
      } catch {
        // quiet fallback
      }
    };

    fetchLatestPermissions();
    const interval = setInterval(fetchLatestPermissions, 3000);
    return () => clearInterval(interval);
  }, [token]);

  // Also listen to storage & auth change events across tabs
  useEffect(() => {
    const handleSync = () => {
      try {
        const saved = localStorage.getItem('ccs_current_user');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && (parsed.id === userProfile.id || parsed.email === userProfile.email)) {
            setUserProfile((prev: any) => ({ ...prev, ...parsed }));
          }
        }
      } catch {
        // quiet catch
      }
    };
    window.addEventListener('storage', handleSync);
    window.addEventListener('ccs_auth_change', handleSync);
    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('ccs_auth_change', handleSync);
    };
  }, [userProfile.id, userProfile.email]);

  // Check if coordinator has granted public announcement access to this faculty member
  const hasAnnouncementAccess = Boolean(
    userProfile?.role === 'coordinator' ||
    userProfile?.permissions?.canBroadcastAnnouncements ||
    currentUser?.permissions?.canBroadcastAnnouncements
  );
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [newAnnouncementText, setNewAnnouncementText] = useState('');
  const [postingAnnouncement, setPostingAnnouncement] = useState(false);

  // If on announcements tab but access is revoked or not granted, reset to overview
  useEffect(() => {
    if (currentTab === 'announcements' && !hasAnnouncementAccess) {
      setCurrentTab('overview');
    }
  }, [currentTab, hasAnnouncementAccess]);

  const handlePostAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnnouncementText.trim()) return;
    setPostingAnnouncement(true);
    setFeedbackError('');
    try {
      const res = await fetch('/api/coordinator/announcements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: newAnnouncementText.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setNewAnnouncementText('');
        setFeedbackSuccess('Announcement broadcast live to society ticker!');
        setTimeout(() => setFeedbackSuccess(''), 4000);
        // Refresh announcements
        const resAnn = await fetch('/api/announcements');
        const dataAnn = await resAnn.json();
        if (dataAnn.success) setAnnouncements(dataAnn.announcements || []);
      } else {
        setFeedbackError(data.message || 'Failed to post announcement.');
      }
    } catch (err: any) {
      setFeedbackError(err.message || 'Error posting announcement.');
    } finally {
      setPostingAnnouncement(false);
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    try {
      const res = await fetch(`/api/coordinator/announcements/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setAnnouncements((prev) => prev.filter((a) => a.id !== id));
        setFeedbackSuccess('Announcement removed.');
        setTimeout(() => setFeedbackSuccess(''), 3000);
      } else {
        setFeedbackError(data.message || 'Failed to delete announcement.');
      }
    } catch (err: any) {
      setFeedbackError(err.message || 'Error deleting announcement.');
    }
  };

  // Close profile dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    if (profileOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [profileOpen]);

  // Fetch all dashboard data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [resUpdates, resTasks, resQueries, resAnn] = await Promise.all([
        fetch('/api/coordinator/student-updates', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/coordinator/assigned-work', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/coordinator/faculty-queries', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/announcements'),
      ]);

      const [dataUpdates, dataTasks, dataQueries, dataAnn] = await Promise.all([
        resUpdates.json(),
        resTasks.json(),
        resQueries.json(),
        resAnn.json(),
      ]);

      if (dataUpdates.success) setStudentUpdates(dataUpdates.updates || []);
      if (dataTasks.success) setAssignedTasks(dataTasks.work || []);
      if (dataQueries.success) setQueries(dataQueries.queries || []);
      if (dataAnn.success) setAnnouncements(dataAnn.announcements || []);
    } catch {
      // quiet fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  // Review & Status Update Submission
  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUpdateForReview) return;

    setSubmittingReview(true);
    setFeedbackError('');
    try {
      const res = await fetch(`/api/coordinator/student-updates/${selectedUpdateForReview.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: reviewStatus,
          coordinatorFeedback: reviewFeedback.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setFeedbackSuccess(`Student project marked as ${reviewStatus.replace('_', ' ').toUpperCase()}`);
        setSelectedUpdateForReview(null);
        setReviewFeedback('');
        fetchData();
      } else {
        setFeedbackError(data.message || 'Failed to submit review.');
      }
    } catch (err: any) {
      setFeedbackError(err.message || 'Error submitting review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  // Assign New Work
  const handleAssignWork = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDescription.trim()) return;

    setAssigningWork(true);
    setFeedbackError('');
    try {
      const res = await fetch('/api/coordinator/assigned-work', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: newTitle.trim(),
          description: newDescription.trim(),
          domain: newDomain,
          assignedTo: newAssignee,
          dueDate: newDueDate,
          priority: newPriority,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setFeedbackSuccess('New project assignment assigned to students.');
        setNewTitle('');
        setNewDescription('');
        setNewDueDate('');
        fetchData();
      } else {
        setFeedbackError(data.message || 'Failed to assign work.');
      }
    } catch (err: any) {
      setFeedbackError(err.message || 'Error assigning work.');
    } finally {
      setAssigningWork(false);
    }
  };

  // Delete Assigned Task
  const handleDeleteTask = async (id: string) => {
    try {
      const res = await fetch(`/api/coordinator/assigned-work/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setAssignedTasks((prev) => prev.filter((t) => t.id !== id));
        setFeedbackSuccess('Task removed.');
      }
    } catch {
      // quiet catch
    }
  };

  // Submit Query to Coordinator
  const handleQuerySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuerySubject.trim() || !newQueryMessage.trim()) return;

    setSubmittingQuery(true);
    setFeedbackError('');
    try {
      const res = await fetch('/api/coordinator/faculty-queries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          subject: newQuerySubject.trim(),
          message: newQueryMessage.trim(),
          priority: newQueryPriority,
          category: newQueryCategory,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setFeedbackSuccess('Directive submitted to Coordinator Desk.');
        setNewQuerySubject('');
        setNewQueryMessage('');
        fetchData();
      } else {
        setFeedbackError(data.message || 'Failed to submit query.');
      }
    } catch (err: any) {
      setFeedbackError(err.message || 'Error submitting query.');
    } finally {
      setSubmittingQuery(false);
    }
  };

  const pendingCount = studentUpdates.filter((u) => u.status === 'pending').length;
  const filteredUpdates = studentUpdates.filter((u) => {
    if (statusFilter === 'all') return true;
    return u.status === statusFilter;
  });

  return (
    <div className="relative min-h-screen w-full flex flex-col bg-[#080808] text-white">
      {/* 3D Floating CCS Logo & Ambient Lighting in Background */}
      <DashboardBackground role="faculty" />

      {/* ================= TOP NAVBAR ================= */}
      <header className="w-full sticky top-0 z-40 bg-[#080808]/95 backdrop-blur-md border-b border-white/10 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#E50920] flex items-center justify-center text-white shadow-md shadow-[#E50920]/30">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <span className="font-display font-bold text-white text-sm tracking-wide">
                CCS <span className="text-[#E50920]">Faculty Council</span>
              </span>
              <span className="block text-[10px] font-mono text-zinc-400">
                Academic Advisory & Research
              </span>
            </div>
          </div>

          {/* Center Tabs */}
          <nav className="flex items-center gap-1 overflow-x-auto max-w-[calc(100vw-220px)] sm:max-w-none no-scrollbar py-1">
            <button
              onClick={() => setCurrentTab('overview')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono transition-colors cursor-pointer shrink-0 ${
                currentTab === 'overview'
                  ? 'bg-white/10 text-white font-semibold'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Overview</span>
            </button>

            <button
              onClick={() => setCurrentTab('student_updates')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono transition-colors cursor-pointer shrink-0 ${
                currentTab === 'student_updates'
                  ? 'bg-white/10 text-white font-semibold'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <FolderGit2 className="w-3.5 h-3.5" />
              <span>Student Projects</span>
              {pendingCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-[#E50920] text-white text-[9px] font-bold">
                  {pendingCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setCurrentTab('assign_work')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono transition-colors cursor-pointer shrink-0 ${
                currentTab === 'assign_work'
                  ? 'bg-white/10 text-white font-semibold'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Plus className="w-3.5 h-3.5 text-[#E50920]" />
              <span>Assign Work</span>
              <span className="px-1.5 py-0.2 rounded-full bg-white/10 text-zinc-300 text-[9px]">
                {assignedTasks.length}
              </span>
            </button>

            <button
              onClick={() => setCurrentTab('directives')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono transition-colors cursor-pointer shrink-0 ${
                currentTab === 'directives'
                  ? 'bg-white/10 text-white font-semibold'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Directives</span>
            </button>

            {/* Announcements Tab - ONLY visible if coordinator has granted public announcement access */}
            {hasAnnouncementAccess && (
              <button
                onClick={() => setCurrentTab('announcements')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono transition-colors cursor-pointer shrink-0 ${
                  currentTab === 'announcements'
                    ? 'bg-[#E50920] text-white font-semibold shadow-md shadow-[#E50920]/20'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Radio className="w-3.5 h-3.5 text-amber-400" />
                <span>Announcements</span>
                <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 text-[9px] font-bold">
                  GRANTED
                </span>
              </button>
            )}
          </nav>

          {/* Right Profile Dropdown */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2.5 p-1.5 sm:px-3 sm:py-1.5 rounded-full border border-white/10 hover:border-[#E50920]/40 bg-white/[0.03] transition-all cursor-pointer"
            >
              <div className="w-7 h-7 rounded-full bg-[#E50920]/20 text-[#E50920] border border-[#E50920]/40 flex items-center justify-center font-bold text-xs">
                {currentUser.fullName?.charAt(0) || 'F'}
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-medium text-white truncate max-w-[120px]">
                  {currentUser.fullName}
                </span>
                <span className="text-[10px] font-mono text-[#E50920]">
                  FACULTY ADVISOR
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
            </button>

            {profileOpen && (
              <div className="absolute top-12 right-0 w-72 rounded-2xl border border-white/15 bg-[#0F0F12] shadow-2xl p-4 z-50 animate-in fade-in duration-150">
                <div className="pb-3 border-b border-white/10">
                  <h4 className="text-sm font-bold text-white truncate">{currentUser.fullName}</h4>
                  <p className="text-[11px] font-mono text-[#E50920]">Faculty Advisor</p>
                  <p className="text-[10px] font-mono text-zinc-500 truncate">{currentUser.email}</p>
                </div>

                <div className="py-2 flex flex-col gap-1">
                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      setCurrentTab('profile');
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-mono text-zinc-300 hover:text-white hover:bg-white/5 transition-colors cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-2.5">
                      <User className="w-3.5 h-3.5 text-[#E50920]" />
                      <span>My Profile & Session</span>
                    </div>
                    <span className="text-[10px] font-mono text-amber-400">
                      {session.formattedTime}
                    </span>
                  </button>

                  {hasAnnouncementAccess && (
                    <button
                      onClick={() => {
                        setProfileOpen(false);
                        setCurrentTab('announcements');
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-mono text-amber-300 hover:text-white hover:bg-amber-500/10 transition-colors cursor-pointer text-left"
                    >
                      <div className="flex items-center gap-2.5">
                        <Radio className="w-3.5 h-3.5 text-amber-400" />
                        <span>Public Announcements</span>
                      </div>
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold">
                        ACTIVE
                      </span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      onBackToHome();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-mono text-zinc-300 hover:text-white hover:bg-white/5 transition-colors cursor-pointer text-left"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
                    <span>View Public Site</span>
                  </button>
                </div>

                <div className="pt-2 border-t border-white/10">
                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      onLogout();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-mono text-rose-400 hover:text-white hover:bg-rose-500/10 transition-colors cursor-pointer text-left"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ================= MAIN CONTENT ================= */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex-1 flex flex-col gap-6 relative z-10">
        {/* Banner feedback */}
        {feedbackSuccess && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-mono flex items-center justify-between">
            <span>✓ {feedbackSuccess}</span>
            <button onClick={() => setFeedbackSuccess('')} className="text-emerald-400 hover:text-white">✕</button>
          </div>
        )}

        {feedbackError && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-400 text-xs font-mono flex items-center justify-between">
            <span>⚠️ {feedbackError}</span>
            <button onClick={() => setFeedbackError('')} className="text-rose-400 hover:text-white">✕</button>
          </div>
        )}

        {/* ================= TAB 1: OVERVIEW ================= */}
        {currentTab === 'overview' && (
          <div className="flex flex-col gap-6">
            <div>
              <h2 className="text-xl font-bold font-display text-white">Faculty Advisory Overview</h2>
              <p className="text-xs font-mono text-zinc-400 mt-0.5">
                Review student project updates, assign research directives, and oversee society tech deliverables
              </p>
            </div>

            {/* Granted Announcements Access Banner Card */}
            {hasAnnouncementAccess && (
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-[#0B0C10]/95 to-[#0B0C10]/95 border border-amber-500/35 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
                    <Radio className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-bold font-display text-white">
                        Public Announcement Broadcasting Authority Active
                      </h3>
                      <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold uppercase">
                        Granted by Coordinator
                      </span>
                    </div>
                    <p className="text-xs font-mono text-zinc-300 mt-1">
                      You have full authority to broadcast real-time announcements directly to the public site ticker.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setCurrentTab('announcements')}
                  className="px-4 py-2.5 rounded-xl bg-[#E50920] hover:bg-[#ff1e38] text-white text-xs font-mono font-semibold transition-all cursor-pointer flex items-center justify-center gap-2 shrink-0 shadow-lg shadow-[#E50920]/20"
                >
                  <Radio className="w-3.5 h-3.5" />
                  <span>Open Announcements Desk →</span>
                </button>
              </div>
            )}

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-xl border border-white/10 bg-[#0B0C10]/92 backdrop-blur-xl shadow-xl shadow-black/40 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center">
                  <FolderGit2 className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-2xl font-bold font-display text-white">{studentUpdates.length}</span>
                  <span className="text-xs font-mono text-zinc-400 block">Student Projects</span>
                </div>
              </div>

              <div className="p-5 rounded-xl border border-white/10 bg-[#0B0C10]/92 backdrop-blur-xl shadow-xl shadow-black/40 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-2xl font-bold font-display text-white">{pendingCount}</span>
                  <span className="text-xs font-mono text-zinc-400 block">Pending Review</span>
                </div>
              </div>

              <div className="p-5 rounded-xl border border-white/10 bg-[#0B0C10]/92 backdrop-blur-xl shadow-xl shadow-black/40 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#E50920]/10 text-[#E50920] border border-[#E50920]/20 flex items-center justify-center">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-2xl font-bold font-display text-white">{assignedTasks.length}</span>
                  <span className="text-xs font-mono text-zinc-400 block">Work Assignments</span>
                </div>
              </div>

              <div className="p-5 rounded-xl border border-white/10 bg-[#0B0C10]/92 backdrop-blur-xl shadow-xl shadow-black/40 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-2xl font-bold font-display text-white">{queries.length}</span>
                  <span className="text-xs font-mono text-zinc-400 block">Directives Raised</span>
                </div>
              </div>
            </div>

            {/* Quick Actions & Recent Updates */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Recent student updates */}
              <div className="lg:col-span-8 p-5 rounded-xl border border-white/10 bg-[#0B0C10]/92 backdrop-blur-xl shadow-xl shadow-black/40 flex flex-col gap-4">
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <h3 className="text-sm font-semibold text-white font-display">Recent Student Project Submissions</h3>
                  <button
                    onClick={() => setCurrentTab('student_updates')}
                    className="text-xs font-mono text-[#E50920] hover:underline flex items-center gap-1"
                  >
                    <span>View All</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                <div className="space-y-3">
                  {studentUpdates.slice(0, 4).map((upd) => (
                    <div
                      key={upd.id}
                      className="p-3.5 rounded-lg bg-black/40 border border-white/5 hover:border-white/15 transition-all flex items-center justify-between gap-4"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-white truncate">{upd.projectTitle}</h4>
                          <span
                            className={`px-1.5 py-0.2 rounded-full text-[9px] font-mono uppercase ${
                              upd.status === 'approved'
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : upd.status === 'changes_requested'
                                ? 'bg-rose-500/20 text-rose-400'
                                : 'bg-amber-500/20 text-amber-400'
                            }`}
                          >
                            {upd.status.replace('_', ' ')}
                          </span>
                        </div>
                        <span className="text-[11px] font-mono text-zinc-400 block mt-0.5 truncate">
                          {upd.studentName} • {upd.domain}
                        </span>
                      </div>

                      <button
                        onClick={() => {
                          setSelectedUpdateForReview(upd);
                          setCurrentTab('student_updates');
                        }}
                        className="px-3 py-1.5 rounded-lg bg-[#E50920]/15 hover:bg-[#E50920] text-[#E50920] hover:text-white border border-[#E50920]/30 text-xs font-mono transition-colors cursor-pointer shrink-0"
                      >
                        Review
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Assign Work card */}
              <div className="lg:col-span-4 p-5 rounded-xl border border-white/10 bg-[#0B0C10]/92 backdrop-blur-xl shadow-xl shadow-black/40 flex flex-col justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 pb-2 border-b border-white/10 mb-3">
                    <Plus className="w-4 h-4 text-[#E50920]" />
                    <h3 className="text-sm font-semibold text-white font-display">Assign New Project Work</h3>
                  </div>
                  <p className="text-xs font-mono text-zinc-400 leading-relaxed">
                    Issue project milestones, architecture challenges, or lab directives to resident student builders.
                  </p>
                </div>

                <button
                  onClick={() => setCurrentTab('assign_work')}
                  className="w-full py-2.5 px-4 rounded-lg bg-[#E50920] hover:bg-[#ff1e38] text-white text-xs font-mono font-medium transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Open Assignment Desk</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 2: STUDENT PROJECTS & UPDATES ================= */}
        {currentTab === 'student_updates' && (
          <div className="flex flex-col gap-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
              <div>
                <h2 className="text-xl font-bold font-display text-white">Student Project Submissions</h2>
                <p className="text-xs font-mono text-zinc-400 mt-0.5">
                  Inspect student code, verify milestone progress, and provide academic advisory feedback
                </p>
              </div>

              {/* Filter pills */}
              <div className="flex items-center gap-1.5 p-1 rounded-lg bg-black/40 border border-white/10">
                {(['all', 'pending', 'approved', 'changes_requested'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setStatusFilter(filter)}
                    className={`px-3 py-1 rounded-md text-xs font-mono capitalize transition-colors cursor-pointer ${
                      statusFilter === filter
                        ? 'bg-[#E50920] text-white font-semibold'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    {filter.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Submissions List */}
            {filteredUpdates.length === 0 ? (
              <div className="p-12 text-center rounded-xl border border-white/10 bg-[#0B0C10]/92 backdrop-blur-xl shadow-xl shadow-black/40">
                <FolderGit2 className="w-8 h-8 text-zinc-500 mx-auto mb-2" />
                <p className="text-sm font-mono text-zinc-400">No project submissions match the selected filter.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {filteredUpdates.map((item) => (
                  <div
                    key={item.id}
                    className="p-5 rounded-xl border border-white/10 bg-[#0B0C10]/92 backdrop-blur-xl shadow-xl shadow-black/40 hover:border-white/20 transition-all flex flex-col gap-4"
                  >
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2.5">
                          <h3 className="text-base font-bold font-display text-white">{item.projectTitle}</h3>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase ${
                              item.status === 'approved'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : item.status === 'changes_requested'
                                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            }`}
                          >
                            {item.status.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-xs font-mono text-zinc-400 mt-1">
                          Author: <span className="text-zinc-200">{item.studentName}</span> ({item.studentEmail}) •{' '}
                          <span className="text-[#E50920]">{item.domain}</span>
                        </p>
                      </div>

                      {/* Review Action */}
                      <button
                        onClick={() => setSelectedUpdateForReview(item)}
                        className="self-start sm:self-auto px-4 py-2 rounded-lg bg-[#E50920] hover:bg-[#ff1e38] text-white text-xs font-mono font-medium transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <Award className="w-3.5 h-3.5" />
                        <span>Advisory Review</span>
                      </button>
                    </div>

                    {/* Description */}
                    <div className="p-3.5 rounded-lg bg-black/40 border border-white/5 text-xs font-mono text-zinc-300 leading-relaxed whitespace-pre-wrap">
                      {item.description}
                    </div>

                    {/* Progress Bar & Links */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-white/5 text-xs font-mono">
                      <div className="flex items-center gap-3">
                        <span className="text-zinc-500">Progress:</span>
                        <div className="w-32 bg-black/50 rounded-full h-2 border border-white/10 overflow-hidden">
                          <div
                            className="bg-[#E50920] h-full rounded-full transition-all duration-300"
                            style={{ width: `${item.progressPercent}%` }}
                          />
                        </div>
                        <span className="text-white font-semibold">{item.progressPercent}%</span>
                      </div>

                      <div className="flex items-center gap-3">
                        {item.githubUrl && (
                          <a
                            href={item.githubUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-zinc-400 hover:text-white transition-colors"
                          >
                            <Github className="w-3.5 h-3.5" />
                            <span>Repository</span>
                          </a>
                        )}
                        {item.demoUrl && (
                          <a
                            href={item.demoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-[#E50920] hover:underline"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Live Demo</span>
                          </a>
                        )}
                        <span className="text-zinc-500 text-[11px]">
                          Submitted: {new Date(item.submittedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* Existing Coordinator / Faculty Feedback */}
                    {item.coordinatorFeedback && (
                      <div className="p-3 rounded-lg bg-[#E50920]/5 border border-[#E50920]/20 text-xs font-mono">
                        <span className="text-[#E50920] font-semibold block mb-0.5">Faculty / Coordinator Feedback:</span>
                        <p className="text-zinc-300">{item.coordinatorFeedback}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Review Modal */}
            {selectedUpdateForReview && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
                <div className="relative w-full max-w-lg rounded-2xl glass-panel-elevated border border-white/15 bg-[#0A0A0C]/95 backdrop-blur-2xl shadow-2xl p-6 sm:p-7 overflow-hidden z-10">
                  <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#E50920] to-transparent" />

                  <button
                    onClick={() => setSelectedUpdateForReview(null)}
                    className="absolute top-5 right-5 p-1.5 rounded-lg text-zinc-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  <h3 className="text-base font-bold font-display text-white mb-1">
                    Advisory Review: {selectedUpdateForReview.projectTitle}
                  </h3>
                  <p className="text-xs font-mono text-zinc-400 mb-4">
                    Student: {selectedUpdateForReview.studentName} ({selectedUpdateForReview.studentEmail})
                  </p>

                  <form onSubmit={handleReviewSubmit} className="space-y-4">
                    <div>
                      <label className="text-xs font-mono text-zinc-400 block mb-1.5 uppercase">
                        Review Verdict
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setReviewStatus('approved')}
                          className={`p-2.5 rounded-lg text-xs font-mono font-semibold border flex items-center justify-center gap-2 cursor-pointer transition-colors ${
                            reviewStatus === 'approved'
                              ? 'bg-emerald-600 text-white border-emerald-500'
                              : 'bg-black/40 text-zinc-400 border-white/10'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Approve Project</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setReviewStatus('changes_requested')}
                          className={`p-2.5 rounded-lg text-xs font-mono font-semibold border flex items-center justify-center gap-2 cursor-pointer transition-colors ${
                            reviewStatus === 'changes_requested'
                              ? 'bg-rose-600 text-white border-rose-500'
                              : 'bg-black/40 text-zinc-400 border-white/10'
                          }`}
                        >
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>Request Changes</span>
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-mono text-zinc-400 block mb-1.5 uppercase">
                        Faculty Feedback & Guidance
                      </label>
                      <textarea
                        rows={3}
                        value={reviewFeedback}
                        onChange={(e) => setReviewFeedback(e.target.value)}
                        placeholder="Provide guidance on code quality, architecture benchmarks, or milestone approval..."
                        className="w-full p-3 rounded-lg bg-black/50 border border-white/15 text-xs font-mono text-white placeholder-zinc-500 focus:outline-none focus:border-[#E50920]"
                        required
                      />
                    </div>

                    <div className="pt-2 flex items-center justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => setSelectedUpdateForReview(null)}
                        className="px-4 py-2 rounded-lg border border-white/10 text-xs font-mono text-zinc-400 hover:text-white cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={submittingReview}
                        className="px-5 py-2 rounded-lg bg-[#E50920] hover:bg-[#ff1e38] text-white text-xs font-mono font-semibold transition-colors cursor-pointer"
                      >
                        {submittingReview ? 'Submitting...' : 'Save Review'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 3: ASSIGN WORK ================= */}
        {currentTab === 'assign_work' && (
          <div className="flex flex-col gap-6">
            <div>
              <h2 className="text-xl font-bold font-display text-white">Assign Work & Directives</h2>
              <p className="text-xs font-mono text-zinc-400 mt-0.5">
                Assign tasks, project milestones, and engineering deliverables to student developers
              </p>
            </div>

            {/* Creation Card */}
            <form
              onSubmit={handleAssignWork}
              className="p-5 sm:p-6 rounded-xl border border-white/10 bg-[#0B0C10]/92 backdrop-blur-xl shadow-xl shadow-black/40 flex flex-col gap-4"
            >
              <div className="flex items-center gap-2 pb-2 border-b border-white/10">
                <Plus className="w-4 h-4 text-[#E50920]" />
                <h3 className="text-sm font-semibold text-white font-display">New Assignment</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-xs font-mono text-zinc-400 block mb-1.5 uppercase">
                    Assignment Title
                  </label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Build Real-time WebSocket Gateway with Redis"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-black/50 border border-white/15 text-xs font-mono text-white placeholder-zinc-500 focus:outline-none focus:border-[#E50920]"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-mono text-zinc-400 block mb-1.5 uppercase">
                    Technical Track / Domain
                  </label>
                  <select
                    value={newDomain}
                    onChange={(e) => setNewDomain(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-black/50 border border-white/15 text-xs font-mono text-zinc-200 focus:outline-none focus:border-[#E50920] cursor-pointer"
                  >
                    <option value="Artificial Intelligence & Systems">Artificial Intelligence & Systems</option>
                    <option value="Cloud Infrastructure & Networks">Cloud Infrastructure & Networks</option>
                    <option value="Full-Stack Web & Mobile">Full-Stack Web & Mobile</option>
                    <option value="Cybersecurity & Cryptography">Cybersecurity & Cryptography</option>
                    <option value="Distributed Ledger / Web3">Distributed Ledger / Web3</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-mono text-zinc-400 block mb-1.5 uppercase">
                    Target Assignees
                  </label>
                  <input
                    type="text"
                    value={newAssignee}
                    onChange={(e) => setNewAssignee(e.target.value)}
                    placeholder="All Students or specific email"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-black/50 border border-white/15 text-xs font-mono text-white placeholder-zinc-500 focus:outline-none focus:border-[#E50920]"
                  />
                </div>

                <div>
                  <label className="text-xs font-mono text-zinc-400 block mb-1.5 uppercase">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-black/50 border border-white/15 text-xs font-mono text-zinc-200 focus:outline-none focus:border-[#E50920]"
                  />
                </div>

                <div>
                  <label className="text-xs font-mono text-zinc-400 block mb-1.5 uppercase">
                    Priority
                  </label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-black/50 border border-white/15 text-xs font-mono text-zinc-200 focus:outline-none focus:border-[#E50920] cursor-pointer"
                  >
                    <option value="normal">Normal Priority</option>
                    <option value="high">High Priority</option>
                    <option value="urgent">Urgent Deliverable</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-mono text-zinc-400 block mb-1.5 uppercase">
                    Task Description & Engineering Requirements
                  </label>
                  <textarea
                    rows={3}
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="Specify project objectives, architecture requirements, and milestone evaluation criteria..."
                    className="w-full p-3 rounded-lg bg-black/50 border border-white/15 text-xs font-mono text-white placeholder-zinc-500 focus:outline-none focus:border-[#E50920]"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={assigningWork}
                  className="px-6 py-2.5 rounded-lg bg-[#E50920] hover:bg-[#ff1e38] text-white text-xs font-mono font-semibold transition-colors cursor-pointer flex items-center gap-2"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{assigningWork ? 'Assigning...' : 'Assign Work to Students'}</span>
                </button>
              </div>
            </form>

            {/* List of Active Assigned Tasks */}
            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-semibold text-white font-display">
                Currently Assigned Tasks ({assignedTasks.length})
              </h3>

              {assignedTasks.length === 0 ? (
                <div className="p-8 text-center rounded-xl border border-white/10 bg-[#0B0C10]/92 backdrop-blur-xl shadow-xl shadow-black/40">
                  <p className="text-xs font-mono text-zinc-400">No work assignments issued yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {assignedTasks.map((task) => (
                    <div
                      key={task.id}
                      className="p-4 rounded-xl border border-white/10 bg-[#0B0C10]/92 backdrop-blur-xl shadow-xl shadow-black/40 flex items-start justify-between gap-4"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-sm font-bold text-white">{task.title}</h4>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[9px] font-mono uppercase ${
                              task.priority === 'urgent'
                                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                : task.priority === 'high'
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                            }`}
                          >
                            {task.priority}
                          </span>
                        </div>
                        <p className="text-xs font-mono text-zinc-300 leading-relaxed mb-2">
                          {task.description}
                        </p>
                        <div className="flex items-center gap-3 text-[10px] font-mono text-zinc-500">
                          <span>Domain: <span className="text-zinc-400">{task.domain}</span></span>
                          <span>•</span>
                          <span>Assigned to: <span className="text-zinc-400">{task.assignedTo}</span></span>
                          {task.dueDate && (
                            <>
                              <span>•</span>
                              <span>Due: <span className="text-[#E50920]">{task.dueDate}</span></span>
                            </>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="p-2 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-colors cursor-pointer shrink-0"
                        title="Remove task"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= TAB 4: ADVISORY DIRECTIVES ================= */}
        {currentTab === 'directives' && (
          <div className="flex flex-col gap-6">
            <div>
              <h2 className="text-xl font-bold font-display text-white">Advisory Directives & Inquiries</h2>
              <p className="text-xs font-mono text-zinc-400 mt-0.5">
                Issue academic governance directives or raise operational queries with the Student Coordinator desk
              </p>
            </div>

            {/* Directive Creation Form */}
            <form
              onSubmit={handleQuerySubmit}
              className="p-5 sm:p-6 rounded-xl border border-white/10 bg-[#0B0C10]/92 backdrop-blur-xl shadow-xl shadow-black/40 flex flex-col gap-4"
            >
              <div className="flex items-center gap-2 pb-2 border-b border-white/10">
                <MessageSquare className="w-4 h-4 text-[#E50920]" />
                <h3 className="text-sm font-semibold text-white font-display">New Directive</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-mono text-zinc-400 block mb-1.5 uppercase">Subject</label>
                  <input
                    type="text"
                    value={newQuerySubject}
                    onChange={(e) => setNewQuerySubject(e.target.value)}
                    placeholder="e.g. Lab Resource Allocation for Hackathon"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-black/50 border border-white/15 text-xs font-mono text-white placeholder-zinc-500 focus:outline-none focus:border-[#E50920]"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-mono text-zinc-400 block mb-1.5 uppercase">Category</label>
                  <select
                    value={newQueryCategory}
                    onChange={(e) => setNewQueryCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-black/50 border border-white/15 text-xs font-mono text-zinc-200 focus:outline-none focus:border-[#E50920] cursor-pointer"
                  >
                    <option value="Academic Directive">Academic Directive</option>
                    <option value="Event Permission">Event Permission</option>
                    <option value="Budget & Infrastructure">Budget & Infrastructure</option>
                    <option value="Curriculum Advisory">Curriculum Advisory</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-mono text-zinc-400 block mb-1.5 uppercase">Directive Details</label>
                  <textarea
                    rows={3}
                    value={newQueryMessage}
                    onChange={(e) => setNewQueryMessage(e.target.value)}
                    placeholder="State the directive or inquiry for the student coordinator..."
                    className="w-full p-3 rounded-lg bg-black/50 border border-white/15 text-xs font-mono text-white placeholder-zinc-500 focus:outline-none focus:border-[#E50920]"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={submittingQuery}
                  className="px-6 py-2.5 rounded-lg bg-[#E50920] hover:bg-[#ff1e38] text-white text-xs font-mono font-semibold transition-colors cursor-pointer flex items-center gap-2"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submittingQuery ? 'Submitting...' : 'Submit Directive'}</span>
                </button>
              </div>
            </form>

            {/* Directive History */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-white font-display">Directive Logs ({queries.length})</h3>
              {queries.map((q) => (
                <div key={q.id} className="p-4 rounded-xl border border-white/10 bg-[#0B0C10]/92 backdrop-blur-xl shadow-xl shadow-black/40 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-white">{q.subject}</h4>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[9px] font-mono uppercase ${
                        q.status === 'resolved'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-amber-500/20 text-amber-400'
                      }`}
                    >
                      {q.status}
                    </span>
                  </div>
                  <p className="text-xs font-mono text-zinc-300">{q.message}</p>
                  {q.coordinatorResponse && (
                    <div className="mt-2 p-2.5 rounded-lg bg-white/5 border border-white/10 text-xs font-mono">
                      <span className="text-[#E50920] font-semibold block mb-0.5">Coordinator Desk Response:</span>
                      <p className="text-zinc-300">{q.coordinatorResponse}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= TAB: ANNOUNCEMENTS (GUARDED) ================= */}
        {currentTab === 'announcements' && hasAnnouncementAccess && (
          <div className="flex flex-col gap-6">
            {/* Broadcaster Privilege Active Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
                  <Radio className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold font-display text-white">
                    Public Announcement Broadcast Authority
                  </h3>
                  <p className="text-xs font-mono text-zinc-400">
                    Access granted by Society Coordinator. Updates broadcast directly to the public platform ticker.
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold self-start sm:self-auto">
                BROADCASTER PRIVILEGE ACTIVE
              </span>
            </div>

            {/* Broadcast Creation Form */}
            <form
              onSubmit={handlePostAnnouncement}
              className="p-5 rounded-xl border border-white/10 bg-[#0B0C10]/92 backdrop-blur-xl shadow-xl shadow-black/40 flex flex-col gap-3"
            >
              <label className="text-xs font-mono text-zinc-300 font-bold uppercase flex items-center gap-2">
                <Send className="w-3.5 h-3.5 text-[#E50920]" />
                <span>Broadcast New Live Public Announcement</span>
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={newAnnouncementText}
                  onChange={(e) => setNewAnnouncementText(e.target.value)}
                  placeholder="e.g. 📢 Faculty research symposium paper submissions close this Friday at 5 PM."
                  className="flex-1 px-4 py-2.5 rounded-lg bg-black/60 border border-white/15 text-xs font-mono text-white placeholder-zinc-500 focus:outline-none focus:border-[#E50920]"
                  maxLength={180}
                />
                <button
                  type="submit"
                  disabled={postingAnnouncement || !newAnnouncementText.trim()}
                  className="px-5 py-2.5 rounded-lg bg-[#E50920] hover:bg-[#ff1e38] text-white text-xs font-mono font-semibold transition-colors disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{postingAnnouncement ? 'Broadcasting...' : 'Broadcast'}</span>
                </button>
              </div>
              <span className="text-[10px] font-mono text-zinc-500">
                Max 180 characters. Visible to all platform visitors and society members on the ticker.
              </span>
            </form>

            <div>
              <h2 className="text-xl font-bold font-display text-white">Active Society Announcements</h2>
              <p className="text-xs font-mono text-zinc-400 mt-0.5">
                Official broadcasts currently active on the platform ({announcements.length})
              </p>
            </div>

            <div className="space-y-3">
              {announcements.map((ann, idx) => (
                <div
                  key={ann.id || idx}
                  className="p-4 rounded-xl border border-white/10 bg-[#0B0C10]/92 backdrop-blur-xl shadow-xl shadow-black/40 flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-[#E50920] font-semibold">Broadcast #{announcements.length - idx}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-zinc-500">{new Date(ann.createdAt).toLocaleDateString()}</span>
                      <button
                        onClick={() => handleDeleteAnnouncement(ann.id)}
                        className="text-zinc-500 hover:text-rose-400 transition-colors p-1 cursor-pointer"
                        title="Delete Announcement"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs font-mono text-zinc-200 leading-relaxed whitespace-pre-wrap">
                    {ann.message}
                  </p>
                  {ann.authorName && (
                    <span className="text-[10px] font-mono text-zinc-500 pt-1 border-t border-white/5">
                      Posted by: {ann.authorName}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= TAB 5: PROFILE & 10-HOUR SESSION ================= */}
        {currentTab === 'profile' && (
          <UserProfilePage
            currentUser={currentUser}
            token={token}
            onLogout={onLogout}
          />
        )}
      </main>
    </div>
  );
};
