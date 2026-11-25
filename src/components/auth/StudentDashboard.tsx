import React, { useState, useEffect, useRef } from 'react';
import {
  GraduationCap,
  FolderGit2,
  Users,
  Plus,
  Send,
  ExternalLink,
  Github,
  Clock,
  CheckCircle2,
  AlertCircle,
  LogOut,
  ChevronDown,
  RefreshCw,
  Sparkles,
  BookOpen,
  Radio,
  Globe,
  Edit3,
  X,
  ArrowRight,
  Layers,
  Code2,
  User,
  Trash2,
  ListOrdered,
  Lock,
  Unlock,
  Zap,
  ChevronUp,
  Check,
} from 'lucide-react';
import { DashboardBackground } from '../ui/DashboardBackground';
import { UserProfilePage } from './UserProfilePage';
import { TeamCollaborationHub } from '../team/TeamCollaborationHub';
import { registerSocketUser } from '../../services/teamSocket';
import { useSessionTimer } from '../../utils/sessionSecurity';
import { ThemeToggle } from '../ui/ThemeToggle';

interface StudentDashboardProps {
  currentUser: {
    id: string;
    email: string;
    fullName: string;
    role: string;
    department: string;
    avatarUrl?: string;
    groupId?: string | null;
    groupName?: string | null;
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
  theme?: 'dark' | 'light';
  onToggleTheme?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

type StudentTab = 'team_collaboration' | 'my_projects' | 'assigned_work' | 'announcements' | 'profile';

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
  coordinatorName?: string;
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
  assignedByRole?: string;
  assignedTo: string;
  isOpenToAll?: boolean;
  queueType?: string;
  maxClaims?: number;
  claimsQueue?: {
    studentId: string;
    studentName: string;
    studentEmail: string;
    department?: string;
    claimedAt: string;
    submissionId?: string;
    status: string;
    notes?: string;
  }[];
  dueDate: string;
  priority: 'normal' | 'high' | 'urgent';
  status: 'active' | 'closed' | 'completed' | 'archived';
  createdAt: string;
}

interface Announcement {
  id: string;
  message: string;
  target?: 'all' | 'public' | 'students' | 'teams';
  authorName?: string;
  createdAt: string;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  currentUser,
  token,
  onLogout,
  onBackToHome,
  theme = 'dark',
  onToggleTheme,
}) => {
  const [currentTab, setCurrentTab] = useState<StudentTab>('team_collaboration');
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Register real-time presence with socket
  useEffect(() => {
    registerSocketUser(currentUser.id, currentUser.groupId || null, currentUser.fullName);
  }, [currentUser.id, currentUser.groupId, currentUser.fullName]);

  // Active 10-Hour Session Expiry Watcher (auto logout on expiry)
  const session = useSessionTimer(token, onLogout);

  // Data states
  const [allUpdates, setAllUpdates] = useState<StudentUpdate[]>([]);
  const [assignedTasks, setAssignedTasks] = useState<AssignedTask[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionError, setActionError] = useState('');

  // Project Modal State (Create or Edit)
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [projectTitle, setProjectTitle] = useState('');
  const [description, setDescription] = useState('');
  const [domain, setDomain] = useState('Full-Stack Web & Systems');
  const [githubUrl, setGithubUrl] = useState('');
  const [demoUrl, setDemoUrl] = useState('');
  const [progressPercent, setProgressPercent] = useState<number>(30);
  const [savingProject, setSavingProject] = useState(false);
  const [expandedStudentQueues, setExpandedStudentQueues] = useState<Record<string, boolean>>({});
  const [claimingTaskId, setClaimingTaskId] = useState<string | null>(null);
  const [refreshingTarget, setRefreshingTarget] = useState<'nav' | 'projects' | 'assigned' | null>(null);

  // Live User Profile with real-time permissions synchronization
  const [userProfile, setUserProfile] = useState<any>(currentUser);

  useEffect(() => {
    setUserProfile(currentUser);
  }, [currentUser]);

  // Synchronize latest permissions from backend continuously
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

  // Check if Lead Coordinator has granted public announcement access
  const hasAnnouncementAccess = Boolean(
    userProfile?.role === 'coordinator' ||
    userProfile?.permissions?.canBroadcastAnnouncements ||
    currentUser?.permissions?.canBroadcastAnnouncements
  );

  // New Announcement Broadcast State
  const [newAnnouncementText, setNewAnnouncementText] = useState('');
  const [announcementTarget, setAnnouncementTarget] = useState<'all' | 'public' | 'students' | 'teams'>('all');
  const [postingAnnouncement, setPostingAnnouncement] = useState(false);

  // Automatically reset to my_projects if on announcements tab but access is not granted
  useEffect(() => {
    if (currentTab === 'announcements' && !hasAnnouncementAccess) {
      setCurrentTab('my_projects');
    }
  }, [currentTab, hasAnnouncementAccess]);

  const handlePostAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnnouncementText.trim()) return;
    setPostingAnnouncement(true);
    setActionError('');
    try {
      const res = await fetch('/api/coordinator/announcements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: newAnnouncementText.trim(),
          target: announcementTarget,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setNewAnnouncementText('');
        setActionSuccess('Announcement broadcast live to society ticker!');
        setTimeout(() => setActionSuccess(''), 4000);
        // Refresh announcements list
        const resAnn = await fetch('/api/announcements');
        const dataAnn = await resAnn.json();
        if (dataAnn.success) setAnnouncements(dataAnn.announcements || []);
      } else {
        setActionError(data.message || 'Failed to post announcement.');
      }
    } catch (err: any) {
      setActionError(err.message || 'Error posting announcement.');
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
        setActionSuccess('Announcement removed.');
        setTimeout(() => setActionSuccess(''), 3000);
      } else {
        setActionError(data.message || 'Failed to delete announcement.');
      }
    } catch (err: any) {
      setActionError(err.message || 'Error deleting announcement.');
    }
  };

  // First-Come, First-Served Task Claim
  const handleClaimTask = async (task: AssignedTask, andOpenSubmit = false) => {
    setClaimingTaskId(task.id);
    setActionError('');
    try {
      const res = await fetch(`/api/coordinator/assigned-work/${task.id}/claim`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data.success) {
        setActionSuccess(data.message || 'Slot reserved in queue!');
        setTimeout(() => setActionSuccess(''), 4500);
        setAssignedTasks((prev) =>
          prev.map((t) => (t.id === task.id ? data.task : t))
        );
        if (andOpenSubmit) {
          setCurrentTab('my_projects');
          handleOpenNewProject(task.title);
        }
      } else {
        setActionError(data.message || 'Failed to claim task slot.');
      }
    } catch (err: any) {
      setActionError(err.message || 'Error claiming task slot.');
    } finally {
      setClaimingTaskId(null);
    }
  };

  // Release Claimed Task Slot
  const handleReleaseClaim = async (task: AssignedTask) => {
    if (!window.confirm(`Release your slot in the queue for "${task.title}"? Another student will be able to claim it.`)) {
      return;
    }
    setClaimingTaskId(task.id);
    setActionError('');
    try {
      const res = await fetch(`/api/coordinator/assigned-work/${task.id}/release-claim`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data.success) {
        setActionSuccess('You have surrendered your slot. Queue updated.');
        setTimeout(() => setActionSuccess(''), 4000);
        setAssignedTasks((prev) =>
          prev.map((t) => (t.id === task.id ? data.task : t))
        );
      } else {
        setActionError(data.message || 'Failed to release queue slot.');
      }
    } catch (err: any) {
      setActionError(err.message || 'Error releasing queue slot.');
    } finally {
      setClaimingTaskId(null);
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

  // Ensure window stays at the top when entering dashboard or switching tabs
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [currentTab]);

  // Fetch student data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [resUpdates, resTasks, resAnn] = await Promise.all([
        fetch('/api/coordinator/student-updates', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/coordinator/assigned-work', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/announcements'),
      ]);

      const [dataUpdates, dataTasks, dataAnn] = await Promise.all([
        resUpdates.json(),
        resTasks.json(),
        resAnn.json(),
      ]);

      if (dataUpdates.success) setAllUpdates(dataUpdates.updates || []);
      if (dataTasks.success) setAssignedTasks(dataTasks.work || []);
      if (dataAnn.success) setAnnouncements(dataAnn.announcements || []);
    } catch {
      // quiet catch
    } finally {
      setLoading(false);
    }
  };

  // Dedicated manual refresh with guaranteed smooth rotation animation for the specific clicked button
  const handleManualRefresh = async (target: 'nav' | 'projects' | 'assigned') => {
    if (refreshingTarget) return;
    setRefreshingTarget(target);
    const minSpinPromise = new Promise((resolve) => setTimeout(resolve, 1000));
    try {
      await Promise.all([fetchData(), minSpinPromise]);
    } finally {
      setRefreshingTarget(null);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  // Active Presence Heartbeat: Keeps the student online in Coordinator views
  useEffect(() => {
    if (!token) return;
    const pingHeartbeat = () => {
      fetch('/api/auth/heartbeat', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    };

    pingHeartbeat();
    const interval = setInterval(pingHeartbeat, 15000); // Send heartbeat every 15 seconds

    return () => clearInterval(interval);
  }, [token]);

  const handleLogout = () => {
    if (token) {
      fetch('/api/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
    onLogout();
  };

  // Filter for current student's projects (or show all with current student's prioritized)
  const myEmail = currentUser.email.toLowerCase();
  const myProjects = allUpdates.filter(
    (u) => u.studentEmail?.toLowerCase() === myEmail || u.studentName === currentUser.fullName
  );
  const displayProjects = myProjects.length > 0 ? myProjects : allUpdates;

  // Open modal for new project
  const handleOpenNewProject = (prefillTitle?: string) => {
    setEditingProjectId(null);
    setProjectTitle(prefillTitle || '');
    setDescription('');
    setDomain('Full-Stack Web & Systems');
    setGithubUrl('');
    setDemoUrl('');
    setProgressPercent(20);
    setActionError('');
    setShowProjectModal(true);
  };

  // Open modal for editing existing project
  const handleOpenEditProject = (p: StudentUpdate) => {
    setEditingProjectId(p.id);
    setProjectTitle(p.projectTitle);
    setDescription(p.description);
    setDomain(p.domain || 'Full-Stack Web & Systems');
    setGithubUrl(p.githubUrl || '');
    setDemoUrl(p.demoUrl || '');
    setProgressPercent(p.progressPercent || 0);
    setActionError('');
    setShowProjectModal(true);
  };

  // Save Project (POST new or PUT existing)
  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectTitle.trim() || !description.trim()) {
      setActionError('Project title and description are required.');
      return;
    }

    setSavingProject(true);
    setActionError('');
    try {
      const url = editingProjectId
        ? `/api/coordinator/student-updates/${editingProjectId}`
        : '/api/coordinator/student-updates';
      const method = editingProjectId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          projectTitle: projectTitle.trim(),
          description: description.trim(),
          domain,
          githubUrl: githubUrl.trim(),
          demoUrl: demoUrl.trim(),
          progressPercent,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setActionSuccess(
          editingProjectId
            ? 'Project milestone updated successfully! Re-submitted for coordinator review.'
            : 'New project submitted successfully! Society Coordinators notified.'
        );

        // Broadcast to teammates if student belongs to a group
        if (currentUser.groupId) {
          fetch(`/api/team/activities/${currentUser.groupId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({
              actionType: 'milestone',
              title: `${editingProjectId ? 'Updated milestone on' : 'Submitted project:'} ${projectTitle.trim()}`,
              details: `Progress milestone at ${progressPercent}%. Domain: ${domain}.`,
              link: githubUrl.trim() || demoUrl.trim() || '',
            }),
          }).catch(() => {});
        }

        setShowProjectModal(false);
        fetchData();
      } else {
        setActionError(data.message || 'Failed to save project update.');
      }
    } catch (err: any) {
      setActionError(err.message || 'Error connecting to server.');
    } finally {
      setSavingProject(false);
    }
  };

  return (
    <div className={`relative min-h-screen w-full flex flex-col transition-colors duration-300 ${
      theme === 'light' ? 'bg-[#F8F9FA] text-zinc-900' : 'bg-[#080808] text-white'
    }`}>
      {/* 3D Floating CCS Logo & Ambient Lighting in Background */}
      <DashboardBackground role="student" theme={theme} />

      {/* ================= TOP NAVBAR ================= */}
      <header className={`w-full sticky top-0 z-40 backdrop-blur-md border-b transition-colors duration-300 relative ${
        theme === 'light' ? 'bg-[#FFFFFF]/95 border-black/10' : 'bg-[#080808]/95 border-white/10'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Brand */}
          <button
            onClick={onBackToHome}
            className="flex items-center gap-3 text-left group cursor-pointer focus:outline-none"
            title="Go to CCS Home"
          >
            <div className="relative w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center transition-transform duration-300 group-hover:scale-105 shrink-0">
              <img
                src="/ccs_official_logo.png"
                alt="CCS Logo"
                className="w-full h-full object-contain filter group-hover:brightness-125 transition-all"
              />
            </div>
            <div>
              <span className={`font-display font-bold text-xs sm:text-sm tracking-wide block transition-colors ${
                theme === 'light' ? 'text-zinc-900 group-hover:text-black' : 'text-white group-hover:text-zinc-100'
              }`}>
                Code &amp; Compute Society
              </span>
              <span className="block text-[10px] font-mono text-zinc-400 group-hover:text-[#E50920] transition-colors">
                student portal
              </span>
            </div>
          </button>

          {/* Center Tabs */}
          <nav className="flex items-center gap-1 overflow-x-auto max-w-[calc(100vw-220px)] sm:max-w-none no-scrollbar py-1">
            <button
              onClick={() => setCurrentTab('team_collaboration')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono transition-colors cursor-pointer shrink-0 ${
                currentTab === 'team_collaboration'
                  ? 'bg-[#E50920] text-white font-semibold shadow-md shadow-[#E50920]/25'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Team Collaboration</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </button>

            <button
              onClick={() => setCurrentTab('my_projects')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono transition-colors cursor-pointer shrink-0 ${
                currentTab === 'my_projects'
                  ? theme === 'light'
                    ? 'bg-black/10 text-zinc-900 font-semibold border border-black/15 shadow-sm'
                    : 'bg-white/10 text-white font-semibold'
                  : theme === 'light'
                  ? 'text-zinc-600 hover:text-black hover:bg-black/5'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <FolderGit2 className="w-3.5 h-3.5 text-[#E50920]" />
              <span>My Projects & Work</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[9px] ${
                theme === 'light' ? 'bg-black/10 text-zinc-700' : 'bg-white/10 text-zinc-300'
              }`}>
                {displayProjects.length}
              </span>
            </button>

            <button
              onClick={() => setCurrentTab('assigned_work')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono transition-colors cursor-pointer shrink-0 ${
                currentTab === 'assigned_work'
                  ? theme === 'light'
                    ? 'bg-black/10 text-zinc-900 font-semibold border border-black/15 shadow-sm'
                    : 'bg-white/10 text-white font-semibold'
                  : theme === 'light'
                  ? 'text-zinc-600 hover:text-black hover:bg-black/5'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Assigned Work</span>
              {assignedTasks.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 text-[9px] font-bold">
                  {assignedTasks.length}
                </span>
              )}
            </button>

            {/* Announcements Tab - ONLY visible if coordinator has granted public announcement broadcasting access */}
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

            {/* Quick Refresh Icon in Tabs Bar */}
            <button
              onClick={() => handleManualRefresh('nav')}
              disabled={Boolean(refreshingTarget)}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer shrink-0"
              title="Refresh Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#E50920] ${refreshingTarget === 'nav' ? 'animate-spin' : ''}`} />
            </button>
          </nav>

          {/* Right Profile Dropdown & Theme Toggle */}
          <div className="flex items-center gap-2">
            {onToggleTheme && <ThemeToggle theme={theme} onToggle={onToggleTheme} />}

            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2.5 p-1.5 sm:px-3 sm:py-1.5 rounded-full border border-white/10 hover:border-[#E50920]/40 bg-white/[0.03] transition-all cursor-pointer"
              >
              <div className="w-7 h-7 rounded-full bg-[#E50920]/20 text-[#E50920] border border-[#E50920]/40 flex items-center justify-center font-bold text-xs">
                {currentUser.fullName?.charAt(0) || 'S'}
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-medium text-white truncate max-w-[120px]">
                  {currentUser.fullName}
                </span>
                <span className="text-[10px] font-mono text-[#E50920]">
                  STUDENT DEVELOPER
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
            </button>

            {profileOpen && (
              <div className="absolute top-12 right-0 w-72 rounded-2xl border border-white/15 bg-[#0F0F12] shadow-2xl p-4 z-50 animate-in fade-in duration-150">
                <div className="pb-3 border-b border-white/10">
                  <h4 className="text-sm font-bold text-white truncate">{currentUser.fullName}</h4>
                  <p className="text-[11px] font-mono text-[#E50920]">Student Member</p>
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
                      handleLogout();
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
      </div>
    </header>

      {/* ================= MAIN CONTAINER ================= */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex-1 flex flex-col gap-6 relative z-10">
        {/* Banner feedback */}
        {actionSuccess && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-mono flex items-center justify-between">
            <span>✓ {actionSuccess}</span>
            <button onClick={() => setActionSuccess('')} className="text-emerald-400 hover:text-white">✕</button>
          </div>
        )}

        {actionError && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-400 text-xs font-mono flex items-center justify-between">
            <span>⚠️ {actionError}</span>
            <button onClick={() => setActionError('')} className="text-rose-400 hover:text-white">✕</button>
          </div>
        )}

        {/* ================= TAB 0: TEAM COLLABORATION HUB ================= */}
        {currentTab === 'team_collaboration' && (
          <TeamCollaborationHub
            currentUser={currentUser}
            token={token}
            onRefreshUser={fetchData}
          />
        )}

        {/* ================= TAB 1: MY PROJECTS & WORK UPDATES ================= */}
        {currentTab === 'my_projects' && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-white/10">
              <div>
                <h2 className="text-xl font-bold font-display text-white">Project Work & Milestones</h2>
                <p className="text-xs font-mono text-zinc-400 mt-0.5">
                  Update your ongoing project code, push milestones, and track coordinator feedback
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => handleManualRefresh('projects')}
                  disabled={Boolean(refreshingTarget)}
                  className="px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white text-xs font-mono transition-colors cursor-pointer flex items-center gap-2"
                  title="Refresh Projects and Feedback"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-[#E50920] ${refreshingTarget === 'projects' ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>

                <button
                  onClick={() => handleOpenNewProject()}
                  className="px-5 py-2.5 rounded-xl bg-[#E50920] hover:bg-[#ff1e38] text-white text-xs font-mono font-semibold transition-all duration-200 cursor-pointer flex items-center gap-2 shadow-lg shadow-[#E50920]/25"
                >
                  <Plus className="w-4 h-4" />
                  <span>Submit New Project Update</span>
                </button>
              </div>
            </div>

            {/* Project List */}
            {displayProjects.length === 0 ? (
              <div className="p-12 text-center rounded-xl border border-white/10 bg-[#0B0C10] backdrop-blur-2xl shadow-xl shadow-black/60">
                <FolderGit2 className="w-8 h-8 text-zinc-500 mx-auto mb-2" />
                <p className="text-sm font-mono text-zinc-400 mb-3">No project updates submitted yet.</p>
                <button
                  onClick={() => handleOpenNewProject()}
                  className="px-4 py-2 rounded-lg bg-[#E50920] text-white text-xs font-mono cursor-pointer"
                >
                  Submit Your First Project
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {displayProjects.map((proj) => (
                  <div
                    key={proj.id}
                    className="p-5 rounded-xl border border-white/10 bg-[#0B0C10] backdrop-blur-2xl shadow-xl shadow-black/60 hover:border-white/20 transition-all flex flex-col gap-4"
                  >
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2.5">
                          <h3 className="text-base font-bold font-display text-white">{proj.projectTitle}</h3>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase ${
                              proj.status === 'approved'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : proj.status === 'changes_requested'
                                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            }`}
                          >
                            {proj.status.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-xs font-mono text-zinc-400 mt-1">
                          Domain: <span className="text-[#E50920]">{proj.domain}</span> • Last Updated:{' '}
                          <span className="text-zinc-300">{new Date(proj.updatedAt || proj.submittedAt).toLocaleDateString()}</span>
                        </p>
                      </div>

                      {/* Edit / Update Project button */}
                      <button
                        onClick={() => handleOpenEditProject(proj)}
                        className="self-start sm:self-auto px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/15 text-white text-xs font-mono transition-colors cursor-pointer flex items-center gap-2"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-[#E50920]" />
                        <span>Update Project Details</span>
                      </button>
                    </div>

                    {/* Description */}
                    <div className="p-3.5 rounded-lg bg-[#07070A] border border-white/10 text-xs font-mono text-zinc-300 leading-relaxed whitespace-pre-wrap">
                      {proj.description}
                    </div>

                    {/* Progress Bar & Links */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-white/5 text-xs font-mono">
                      <div className="flex items-center gap-3">
                        <span className="text-zinc-500">Progress:</span>
                        <div className="w-36 bg-black/50 rounded-full h-2 border border-white/10 overflow-hidden">
                          <div
                            className="bg-[#E50920] h-full rounded-full transition-all duration-300"
                            style={{ width: `${proj.progressPercent}%` }}
                          />
                        </div>
                        <span className="text-white font-semibold">{proj.progressPercent}%</span>
                      </div>

                      <div className="flex items-center gap-3">
                        {proj.githubUrl && (
                          <a
                            href={proj.githubUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-zinc-400 hover:text-white transition-colors"
                          >
                            <Github className="w-3.5 h-3.5" />
                            <span>Repository</span>
                          </a>
                        )}
                        {proj.demoUrl && (
                          <a
                            href={proj.demoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-[#E50920] hover:underline"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Live Demo</span>
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Coordinator Review Feedback Notes */}
                    {proj.coordinatorFeedback && (
                      <div className="p-3 rounded-lg bg-[#14151C]/90 border border-white/10 text-xs font-mono">
                        <span className="text-emerald-400 font-semibold block mb-0.5">
                          {proj.coordinatorName ? `${proj.coordinatorName} (Coordinator):` : 'Coordinator:'}
                        </span>
                        <p className="text-zinc-200">{proj.coordinatorFeedback}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 2: ASSIGNED WORK & DIRECTIVES ================= */}
        {currentTab === 'assigned_work' && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-xl font-bold font-display text-white">Assigned Tasks & Directives</h2>
                  <span className="px-2 py-0.5 rounded-full bg-[#E50920]/20 text-[#E50920] border border-[#E50920]/30 text-[10px] font-mono uppercase font-bold tracking-wider">
                    Open Enrollment
                  </span>
                </div>
                <p className="text-xs font-mono text-zinc-400 mt-1">
                  Engineering milestones issued by Society Coordinators • Open to all students with real-time queue slot reservation
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => handleManualRefresh('assigned')}
                  disabled={Boolean(refreshingTarget)}
                  className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white text-xs font-mono transition-colors cursor-pointer flex items-center gap-2"
                  title="Refresh Tasks and Queue Status"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-[#E50920] ${refreshingTarget === 'assigned' ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
              </div>
            </div>

            {assignedTasks.length === 0 ? (
              <div className="p-12 text-center rounded-xl border border-white/10 bg-[#0B0C10] backdrop-blur-2xl shadow-xl shadow-black/60">
                <BookOpen className="w-8 h-8 text-zinc-500 mx-auto mb-2" />
                <p className="text-sm font-mono text-zinc-400">No active task directives published right now.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5">
                {assignedTasks.map((task) => {
                  const claims = task.claimsQueue || [];
                  const capacity = task.maxClaims !== undefined ? task.maxClaims : 5;
                  const isFull = capacity > 0 && claims.length >= capacity;
                  const isClosed = task.status === 'closed' || task.status === 'archived';
                  const myClaimIndex = claims.findIndex(
                    (c) => c.studentId === currentUser.id || c.studentEmail === currentUser.email
                  );
                  const hasClaimed = myClaimIndex !== -1;
                  const isExpanded = !!expandedStudentQueues[task.id];
                  const percentFilled = capacity > 0 ? Math.min(100, Math.round((claims.length / capacity) * 100)) : 0;
                  const isBusy = claimingTaskId === task.id;

                  return (
                    <div
                      key={task.id}
                      className="p-5 sm:p-6 rounded-xl border border-white/10 bg-[#0B0C10] backdrop-blur-2xl shadow-xl shadow-black/60 flex flex-col gap-4 hover:border-white/20 transition-all"
                    >
                      {/* Top Row: Title, Badges, and Action Buttons */}
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <h3 className="text-base sm:text-lg font-bold font-display text-white">
                              {task.title}
                            </h3>

                            {/* Priority Badge */}
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-mono uppercase font-semibold ${
                                task.priority === 'urgent'
                                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                  : task.priority === 'high'
                                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                  : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                              }`}
                            >
                              {task.priority}
                            </span>

                            {/* Open to All Badge */}
                            <span className="px-2 py-0.5 rounded-full bg-[#E50920]/15 text-[#E50920] border border-[#E50920]/30 text-[10px] font-mono font-bold flex items-center gap-1">
                              <Sparkles className="w-2.5 h-2.5" />
                              <span>Open to All</span>
                            </span>

                            {/* User Status Badge */}
                            {hasClaimed && (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-mono font-bold flex items-center gap-1 shadow-sm shadow-emerald-500/20">
                                <Check className="w-3 h-3" />
                                <span>Slot #{myClaimIndex + 1} Secured in Queue</span>
                              </span>
                            )}
                          </div>

                          <p className="text-xs font-mono text-zinc-300 leading-relaxed">
                            {task.description}
                          </p>
                        </div>

                        {/* Interactive Buttons based on Claim Status */}
                        <div className="flex flex-wrap items-center gap-2 shrink-0 self-start">
                          {hasClaimed ? (
                            <>
                              <button
                                onClick={() => {
                                  setCurrentTab('my_projects');
                                  handleOpenNewProject(task.title);
                                }}
                                className="px-4 py-2 rounded-lg bg-[#E50920] hover:bg-[#ff1e38] text-white text-xs font-mono font-medium transition-all shadow-md shadow-[#E50920]/30 cursor-pointer flex items-center gap-1.5"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Submit Project for this Task</span>
                              </button>

                              <button
                                onClick={() => handleReleaseClaim(task)}
                                disabled={isBusy}
                                className="px-3 py-2 rounded-lg bg-white/5 hover:bg-rose-500/20 text-zinc-400 hover:text-rose-400 border border-white/10 hover:border-rose-500/30 text-xs font-mono transition-colors cursor-pointer"
                                title="Surrender queue slot to another student"
                              >
                                Release Slot
                              </button>
                            </>
                          ) : isClosed ? (
                            <span className="px-4 py-2 rounded-lg bg-zinc-800/80 border border-white/10 text-zinc-500 text-xs font-mono">
                              Directive Closed
                            </span>
                          ) : isFull ? (
                            <span className="px-4 py-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono font-semibold">
                              Queue Full
                            </span>
                          ) : (
                            <>
                              <button
                                onClick={() => handleClaimTask(task, false)}
                                disabled={isBusy}
                                className="px-3.5 py-2 rounded-lg bg-white/10 hover:bg-white/15 border border-white/20 text-white text-xs font-mono font-medium transition-colors cursor-pointer flex items-center gap-1.5"
                              >
                                {isBusy ? (
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                                )}
                                <span>Claim Slot</span>
                              </button>

                              <button
                                onClick={() => handleClaimTask(task, true)}
                                disabled={isBusy}
                                className="px-4 py-2 rounded-lg bg-[#E50920] hover:bg-[#ff1e38] text-white text-xs font-mono font-medium transition-all shadow-md shadow-[#E50920]/30 cursor-pointer flex items-center gap-1.5"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Claim & Submit Project</span>
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Capacity Meter & Directive Details */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-3 border-y border-white/10 text-xs font-mono">
                        <div className="flex flex-wrap items-center gap-3 text-zinc-400">
                          <span>
                            Assigned By: <span className="text-zinc-200">{task.assignedByName || 'Awesh Hussain'}</span> (Coordinator)
                          </span>
                          <span>•</span>
                          <span>
                            Domain: <span className="text-[#E50920] font-semibold">{task.domain}</span>
                          </span>
                          {task.dueDate && (
                            <>
                              <span>•</span>
                              <span>
                                Due: <span className="text-amber-300">{task.dueDate}</span>
                              </span>
                            </>
                          )}
                        </div>

                        {/* Queue Progress Bar */}
                        <div className="flex flex-col gap-1.5 justify-center">
                          <div className="flex items-center justify-between text-[11px] font-mono">
                            <span className="text-zinc-400 flex items-center gap-1.5">
                              <Users className="w-3 h-3 text-zinc-400" />
                              <span>Queue Slots Claimed:</span>
                            </span>
                            <span
                              className={
                                isFull
                                  ? 'text-rose-400 font-bold'
                                  : claims.length > 0
                                  ? 'text-emerald-400 font-bold'
                                  : 'text-zinc-400'
                              }
                            >
                              {claims.length} / {capacity > 0 ? capacity : '∞'} {isFull && '(FULL)'}
                            </span>
                          </div>

                          <div className="w-full bg-black/50 rounded-full h-1.5 overflow-hidden border border-white/10">
                            <div
                              className={`h-full transition-all duration-300 ${
                                isFull
                                  ? 'bg-rose-500'
                                  : percentFilled > 60
                                  ? 'bg-amber-400'
                                  : 'bg-gradient-to-r from-[#E50920] to-emerald-400'
                              }`}
                              style={{ width: `${capacity > 0 ? percentFilled : 100}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Expandable Queue Roster */}
                      <div>
                        <button
                          onClick={() =>
                            setExpandedStudentQueues((prev) => ({ ...prev, [task.id]: !prev[task.id] }))
                          }
                          className="flex items-center gap-2 text-xs font-mono text-zinc-400 hover:text-white transition-colors cursor-pointer"
                        >
                          <ListOrdered className="w-3.5 h-3.5 text-[#E50920]" />
                          <span>
                            Queue Roster ({claims.length} Student{claims.length !== 1 ? 's' : ''})
                          </span>
                          {isExpanded ? (
                            <ChevronUp className="w-3.5 h-3.5 text-zinc-500" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
                          )}
                        </button>

                        {isExpanded && (
                          <div className="mt-3 p-3 rounded-xl bg-black/40 border border-white/10 flex flex-col gap-2 animate-in fade-in">
                            {claims.length === 0 ? (
                              <p className="text-[11px] font-mono text-zinc-500 text-center py-2">
                                No claims yet. Be the first to claim a slot in this queue!
                              </p>
                            ) : (
                              <div className="divide-y divide-white/5">
                                {claims.map((claim, idx) => {
                                  const isMe =
                                    claim.studentId === currentUser.id ||
                                    claim.studentEmail === currentUser.email;

                                  return (
                                    <div
                                      key={claim.studentId + idx}
                                      className={`py-2 first:pt-0 last:pb-0 flex items-center justify-between text-xs font-mono ${
                                        isMe ? 'text-emerald-400 font-semibold' : 'text-zinc-300'
                                      }`}
                                    >
                                      <div className="flex items-center gap-2.5">
                                        <div
                                          className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 ${
                                            isMe
                                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                              : 'bg-white/10 text-zinc-400'
                                          }`}
                                        >
                                          #{idx + 1}
                                        </div>
                                        <span>
                                          {claim.studentName} {isMe && '(You)'}
                                        </span>
                                      </div>

                                      <span className="text-[10px] text-zinc-500">
                                        {new Date(claim.claimedAt).toLocaleDateString()} {new Date(claim.claimedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 3: ANNOUNCEMENTS (GUARDED) ================= */}
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
              className="p-5 rounded-xl border border-white/10 bg-[#0B0C10] backdrop-blur-2xl shadow-xl shadow-black/60 flex flex-col gap-3"
            >
              <label className="text-xs font-mono text-zinc-300 font-bold uppercase flex items-center gap-2">
                <Send className="w-3.5 h-3.5 text-[#E50920]" />
                <span>Broadcast New Live Announcement</span>
              </label>

              {/* Destination Target Selector */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-mono text-zinc-400">Choose Display Destination:</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'public', label: 'Main Page', sub: 'Public Visitors', icon: Globe, activeClass: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50' },
                    { id: 'teams', label: 'Team Squads', sub: 'Teams Hub', icon: Users, activeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50' },
                    { id: 'students', label: 'All Students', sub: 'Student Portal', icon: GraduationCap, activeClass: 'bg-purple-500/20 text-purple-300 border-purple-500/50' },
                    { id: 'all', label: 'Everywhere', sub: 'Global Broadcast', icon: Radio, activeClass: 'bg-[#E50920]/20 text-[#E50920] border-[#E50920]/50' },
                  ].map((dest) => {
                    const Icon = dest.icon;
                    const isSelected = announcementTarget === dest.id;
                    return (
                      <button
                        key={dest.id}
                        type="button"
                        onClick={() => setAnnouncementTarget(dest.id as any)}
                        className={`p-2 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-0.5 ${
                          isSelected
                            ? dest.activeClass
                            : 'bg-black/40 border-white/10 text-zinc-400 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 font-semibold text-xs font-mono">
                          <Icon className="w-3.5 h-3.5 shrink-0" />
                          <span>{dest.label}</span>
                        </div>
                        <span className="text-[10px] font-mono text-zinc-500 block truncate">{dest.sub}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-1">
                <input
                  type="text"
                  value={newAnnouncementText}
                  onChange={(e) => setNewAnnouncementText(e.target.value)}
                  placeholder="e.g. 🚀 Hackathon mentorship session starts at 5:00 PM in Lab 3!"
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
                Max 180 characters. Visible to targeted audience on the platform.
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
                  className="p-4 rounded-xl border border-white/10 bg-[#0B0C10] backdrop-blur-2xl shadow-xl shadow-black/60 flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[#E50920] font-semibold">Broadcast #{announcements.length - idx}</span>
                      <span
                        className={`px-2 py-0.2 rounded-full text-[9px] font-mono font-semibold uppercase tracking-wider border ${
                          ann.target === 'public'
                            ? 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30'
                            : ann.target === 'teams'
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                            : ann.target === 'students'
                            ? 'bg-purple-500/15 text-purple-400 border-purple-500/30'
                            : 'bg-[#E50920]/15 text-[#E50920] border-[#E50920]/30'
                        }`}
                      >
                        {ann.target === 'public'
                          ? '🌐 Main Page'
                          : ann.target === 'teams'
                          ? '👥 Team Squads'
                          : ann.target === 'students'
                          ? '🎓 All Students'
                          : '📢 Everywhere'}
                      </span>
                    </div>
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

        {/* ================= TAB 4: PROFILE & 10-HOUR SESSION ================= */}
        {currentTab === 'profile' && (
          <UserProfilePage
            currentUser={currentUser}
            token={token}
            onLogout={handleLogout}
          />
        )}
      </main>

      {/* ================= MODAL: SUBMIT / EDIT PROJECT ================= */}
      {showProjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-2xl glass-panel-elevated border border-white/15 bg-[#0A0A0C]/95 backdrop-blur-2xl shadow-2xl p-6 sm:p-7 overflow-hidden z-10 max-h-[90vh] overflow-y-auto">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#E50920] to-transparent" />

            <button
              onClick={() => setShowProjectModal(false)}
              className="absolute top-5 right-5 p-1.5 rounded-lg text-zinc-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-bold font-display text-white mb-1">
              {editingProjectId ? 'Update Project Milestone' : 'Submit Project Work'}
            </h3>
            <p className="text-xs font-mono text-zinc-400 mb-4">
              Share your engineering progress with Society Coordinators
            </p>

            <form onSubmit={handleSaveProject} className="space-y-4">
              <div>
                <label className="text-xs font-mono text-zinc-400 block mb-1.5 uppercase">
                  Project Title
                </label>
                <input
                  type="text"
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                  placeholder="e.g. Distributed Consensus Engine"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-black/50 border border-white/15 text-xs font-mono text-white placeholder-zinc-500 focus:outline-none focus:border-[#E50920]"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-mono text-zinc-400 block mb-1.5 uppercase">
                  Technical Domain
                </label>
                <select
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-black/50 border border-white/15 text-xs font-mono text-zinc-200 focus:outline-none focus:border-[#E50920] cursor-pointer"
                >
                  <option value="Full-Stack Web & Systems">Full-Stack Web & Systems</option>
                  <option value="Artificial Intelligence & Systems">Artificial Intelligence & Systems</option>
                  <option value="Cloud Infrastructure & Networks">Cloud Infrastructure & Networks</option>
                  <option value="Cybersecurity & Cryptography">Cybersecurity & Cryptography</option>
                  <option value="Distributed Ledger / Web3">Distributed Ledger / Web3</option>
                  <option value="Mobile App Engineering">Mobile App Engineering</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-mono text-zinc-400 block mb-1.5 uppercase">
                  Milestone Description / Work Done
                </label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detail the modules built, architecture implemented, and milestone progress..."
                  className="w-full p-3 rounded-lg bg-black/50 border border-white/15 text-xs font-mono text-white placeholder-zinc-500 focus:outline-none focus:border-[#E50920]"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-mono text-zinc-400 block mb-1.5 uppercase">
                    GitHub Repo URL
                  </label>
                  <input
                    type="url"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    placeholder="https://github.com/..."
                    className="w-full px-3.5 py-2.5 rounded-lg bg-black/50 border border-white/15 text-xs font-mono text-white placeholder-zinc-500 focus:outline-none focus:border-[#E50920]"
                  />
                </div>

                <div>
                  <label className="text-xs font-mono text-zinc-400 block mb-1.5 uppercase">
                    Live Demo / Deployment URL
                  </label>
                  <input
                    type="url"
                    value={demoUrl}
                    onChange={(e) => setDemoUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3.5 py-2.5 rounded-lg bg-black/50 border border-white/15 text-xs font-mono text-white placeholder-zinc-500 focus:outline-none focus:border-[#E50920]"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5 text-xs font-mono">
                  <span className="text-zinc-400 uppercase">Progress: {progressPercent}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={progressPercent}
                  onChange={(e) => setProgressPercent(Number(e.target.value))}
                  className="w-full accent-[#E50920] cursor-pointer"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowProjectModal(false)}
                  className="px-4 py-2 rounded-lg border border-white/10 text-xs font-mono text-zinc-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProject}
                  className="px-6 py-2 rounded-lg bg-[#E50920] hover:bg-[#ff1e38] text-white text-xs font-mono font-semibold transition-colors cursor-pointer"
                >
                  {savingProject ? 'Saving...' : editingProjectId ? 'Update Project' : 'Submit Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
