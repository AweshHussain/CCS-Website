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
  Edit3,
  X,
  ArrowRight,
  Layers,
  Code2,
  User,
  Trash2,
} from 'lucide-react';
import { DashboardBackground } from '../ui/DashboardBackground';
import { UserProfilePage } from './UserProfilePage';
import { TeamCollaborationHub } from '../team/TeamCollaborationHub';
import { registerSocketUser } from '../../services/teamSocket';
import { useSessionTimer } from '../../utils/sessionSecurity';

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

interface Announcement {
  id: string;
  message: string;
  authorName?: string;
  createdAt: string;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  currentUser,
  token,
  onLogout,
  onBackToHome,
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
        body: JSON.stringify({ message: newAnnouncementText.trim() }),
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

  useEffect(() => {
    fetchData();
  }, [token]);

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
    <div className="relative min-h-screen w-full flex flex-col bg-[#080808] text-white">
      {/* 3D Floating CCS Logo & Ambient Lighting in Background */}
      <DashboardBackground role="student" />

      {/* ================= TOP NAVBAR ================= */}
      <header className="w-full sticky top-0 z-40 bg-[#080808]/95 backdrop-blur-md border-b border-white/10 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#E50920] flex items-center justify-center text-white shadow-md shadow-[#E50920]/30">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div>
              <span className="font-display font-bold text-white text-sm tracking-wide">
                CCS <span className="text-[#E50920]">Resident Developer</span>
              </span>
              <span className="block text-[10px] font-mono text-zinc-400">
                Student Engineering Portal
              </span>
            </div>
          </div>

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
                  ? 'bg-white/10 text-white font-semibold'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <FolderGit2 className="w-3.5 h-3.5 text-[#E50920]" />
              <span>My Projects & Work</span>
              <span className="px-1.5 py-0.2 rounded-full bg-white/10 text-zinc-300 text-[9px]">
                {displayProjects.length}
              </span>
            </button>

            <button
              onClick={() => setCurrentTab('assigned_work')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono transition-colors cursor-pointer shrink-0 ${
                currentTab === 'assigned_work'
                  ? 'bg-white/10 text-white font-semibold'
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
          </nav>

          {/* Right Profile Dropdown */}
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

              <button
                onClick={() => handleOpenNewProject()}
                className="px-5 py-2.5 rounded-xl bg-[#E50920] hover:bg-[#ff1e38] text-white text-xs font-mono font-semibold transition-all duration-200 cursor-pointer flex items-center gap-2 shadow-lg shadow-[#E50920]/25"
              >
                <Plus className="w-4 h-4" />
                <span>Submit New Project Update</span>
              </button>
            </div>

            {/* Project List */}
            {displayProjects.length === 0 ? (
              <div className="p-12 text-center rounded-xl border border-white/10 bg-[#0B0C10]/92 backdrop-blur-xl shadow-xl shadow-black/40">
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
                    className="p-5 rounded-xl border border-white/10 bg-[#0B0C10]/92 backdrop-blur-xl shadow-xl shadow-black/40 hover:border-white/20 transition-all flex flex-col gap-4"
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
                    <div className="p-3.5 rounded-lg bg-black/40 border border-white/5 text-xs font-mono text-zinc-300 leading-relaxed whitespace-pre-wrap">
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
                        <span className="text-emerald-400 font-semibold block mb-0.5">Coordinator Review Notes:</span>
                        <p className="text-zinc-200">{proj.coordinatorFeedback}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 2: ASSIGNED WORK ================= */}
        {currentTab === 'assigned_work' && (
          <div className="flex flex-col gap-6">
            <div>
              <h2 className="text-xl font-bold font-display text-white">Assigned Tasks & Directives</h2>
              <p className="text-xs font-mono text-zinc-400 mt-0.5">
                Engineering milestones and tasks assigned by Society Coordinators
              </p>
            </div>

            {assignedTasks.length === 0 ? (
              <div className="p-12 text-center rounded-xl border border-white/10 bg-[#0B0C10]/92 backdrop-blur-xl shadow-xl shadow-black/40">
                <BookOpen className="w-8 h-8 text-zinc-500 mx-auto mb-2" />
                <p className="text-sm font-mono text-zinc-400">No active tasks assigned right now.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {assignedTasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-5 rounded-xl border border-white/10 bg-[#0B0C10]/92 backdrop-blur-xl shadow-xl shadow-black/40 flex flex-col gap-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <h3 className="text-base font-bold font-display text-white">{task.title}</h3>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-mono uppercase ${
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

                      <button
                        onClick={() => {
                          setCurrentTab('my_projects');
                          handleOpenNewProject(task.title);
                        }}
                        className="self-start sm:self-auto px-4 py-2 rounded-lg bg-[#E50920] hover:bg-[#ff1e38] text-white text-xs font-mono font-medium transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Submit Project for this Task</span>
                      </button>
                    </div>

                    <p className="text-xs font-mono text-zinc-300 leading-relaxed">
                      {task.description}
                    </p>

                    <div className="flex items-center gap-4 text-[11px] font-mono text-zinc-500 pt-2 border-t border-white/5">
                      <span>Assigned By: <span className="text-zinc-300">{task.assignedByName}</span></span>
                      <span>•</span>
                      <span>Domain: <span className="text-[#E50920]">{task.domain}</span></span>
                      {task.dueDate && (
                        <>
                          <span>•</span>
                          <span>Due: <span className="text-[#E50920]">{task.dueDate}</span></span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
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

        {/* ================= TAB 4: PROFILE & 10-HOUR SESSION ================= */}
        {currentTab === 'profile' && (
          <UserProfilePage
            currentUser={currentUser}
            token={token}
            onLogout={onLogout}
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
