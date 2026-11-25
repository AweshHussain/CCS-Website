import React, { useState, useEffect, useRef } from 'react';
import {
  Users,
  MessageSquare,
  Send,
  Lock,
  GitCommit,
  GitPullRequest,
  Code2,
  Sparkles,
  Clock,
  Plus,
  ExternalLink,
  RefreshCw,
  X,
  MessageCircle,
  Hash,
  Activity,
  CheckCircle2,
  AlertTriangle,
  FolderGit2,
  Trash2,
  Edit2,
  Check,
} from 'lucide-react';
import { getTeamSocket } from '../../services/teamSocket';

interface Teammate {
  id: string;
  fullName: string;
  email: string;
  role: string;
  department: string;
  avatarUrl?: string;
  isOnline: boolean;
  isMe?: boolean;
  latestProject?: {
    title: string;
    progress: number;
    domain: string;
    status: string;
    githubUrl?: string;
  } | null;
}

interface TeamActivity {
  id: string;
  groupId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  actionType: 'commit' | 'push' | 'file_update' | 'milestone' | 'status_change' | 'general';
  title: string;
  details?: string;
  link?: string;
  timestamp: string;
}

interface ChatMessage {
  id: string;
  type: 'group' | 'direct';
  groupId?: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  recipientId?: string;
  content: string;
  attachments?: any[];
  isEdited?: boolean;
  editedAt?: string;
  createdAt: string;
}

interface TeamCollaborationHubProps {
  currentUser: {
    id: string;
    email: string;
    fullName: string;
    role: string;
    department: string;
    avatarUrl?: string;
    groupId?: string | null;
    groupName?: string | null;
    permissions?: any;
  };
  token: string;
  onRefreshUser?: () => void;
  theme?: 'dark' | 'light';
}

export const TeamCollaborationHub: React.FC<TeamCollaborationHubProps> = ({
  currentUser,
  token,
  onRefreshUser,
  theme = 'dark',
}) => {
  const [loading, setLoading] = useState(true);
  const [hasGroup, setHasGroup] = useState<boolean>(false);
  const [group, setGroup] = useState<any>(null);
  const [teammates, setTeammates] = useState<Teammate[]>([]);
  const [activities, setActivities] = useState<TeamActivity[]>([]);
  const [teamAnnouncements, setTeamAnnouncements] = useState<any[]>([]);
  const [dismissedBroadcastIds, setDismissedBroadcastIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('ccs_dismissed_team_broadcasts');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [activityFilter, setActivityFilter] = useState<string>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Chat State
  const [chatMode, setChatMode] = useState<'group' | 'direct'>('group');
  const [activeTeammate, setActiveTeammate] = useState<Teammate | null>(null);
  const [groupMessages, setGroupMessages] = useState<ChatMessage[]>([]);
  const [directMessages, setDirectMessages] = useState<ChatMessage[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Edit Message State
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [isUpdatingMessage, setIsUpdatingMessage] = useState(false);
  const [isClearingChat, setIsClearingChat] = useState(false);

  // Post Activity Modal State
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [newActionType, setNewActionType] = useState<'commit' | 'push' | 'file_update' | 'milestone'>('commit');
  const [newActivityTitle, setNewActivityTitle] = useState('');
  const [newActivityDetails, setNewActivityDetails] = useState('');
  const [newActivityLink, setNewActivityLink] = useState('');
  const [isSubmittingActivity, setIsSubmittingActivity] = useState(false);
  const [activityError, setActivityError] = useState('');

  // Auto-scroll chat internally inside the message container ONLY (never scrolls the page/window)
  const scrollToBottom = (smooth = false) => {
    if (messagesContainerRef.current) {
      if (smooth) {
        messagesContainerRef.current.scrollTo({
          top: messagesContainerRef.current.scrollHeight,
          behavior: 'smooth',
        });
      } else {
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
      }
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [groupMessages, directMessages, chatMode, activeTeammate]);

  // Fetch Team Data from API
  const fetchTeamData = async (silent = false) => {
    if (!silent) setLoading(true);
    else setIsRefreshing(true);

    try {
      const res = await fetch('/api/team/my-group', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (data.success) {
        setHasGroup(data.hasGroup);
        setGroup(data.group || null);
        setTeammates(data.teammates || []);
        setActivities(data.activities || []);
        setGroupMessages(data.messages || []);

        // Default direct teammate to first teammate other than self if not set
        if (!activeTeammate && data.teammates && data.teammates.length > 0) {
          const other = data.teammates.find((t: Teammate) => t.id !== currentUser.id);
          if (other) setActiveTeammate(other);
        }
      }

      // Fetch team-specific announcements
      try {
        const resAnn = await fetch('/api/announcements?target=teams');
        const dataAnn = await resAnn.json();
        if (dataAnn.success && Array.isArray(dataAnn.announcements)) {
          setTeamAnnouncements(dataAnn.announcements);
        }
      } catch {}
    } catch (err) {
      console.warn('Failed to fetch team data:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  // Fetch Direct Messages when switching teammate
  const fetchDirectMessages = async (teammateId: string) => {
    try {
      const res = await fetch(`/api/team/messages/direct/${teammateId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setDirectMessages(data.messages || []);
      }
    } catch (err) {
      console.warn('Failed to load direct messages:', err);
    }
  };

  useEffect(() => {
    fetchTeamData();
  }, [currentUser.groupId]);

  useEffect(() => {
    if (chatMode === 'direct' && activeTeammate) {
      fetchDirectMessages(activeTeammate.id);
    }
  }, [chatMode, activeTeammate]);

  // Periodic heartbeat & polling fallback (runs every 6 seconds)
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        await fetch('/api/team/heartbeat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ groupId: group?.id }),
        });

        // Silently sync messages and activities
        if (hasGroup && group?.id) {
          const res = await fetch('/api/team/my-group', {
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await res.json();
          if (data.success && data.hasGroup) {
            setTeammates(data.teammates || []);
            setActivities(data.activities || []);
            setGroupMessages(data.messages || []);
          }
        }
      } catch {
        // silent fallback
      }
    }, 6000);

    return () => clearInterval(interval);
  }, [hasGroup, group?.id, token]);

  // Socket.io Real-Time Synchronization Listener
  useEffect(() => {
    const socket = getTeamSocket();
    if (!socket) return;

    const handleNewTeamMessage = (msg: ChatMessage) => {
      if (msg.groupId === group?.id) {
        setGroupMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      }
    };

    const handleNewDirectMessage = (msg: ChatMessage) => {
      const isRelevant =
        (msg.senderId === currentUser.id && msg.recipientId === activeTeammate?.id) ||
        (msg.senderId === activeTeammate?.id && msg.recipientId === currentUser.id);

      if (isRelevant) {
        setDirectMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      }
    };

    const handleNewActivity = (act: TeamActivity) => {
      if (act.groupId === group?.id) {
        setActivities((prev) => {
          if (prev.some((a) => a.id === act.id)) return prev;
          return [act, ...prev];
        });
      }
    };

    const handleTeammatePresence = ({ userId, status }: { userId: string; status: 'online' | 'offline' }) => {
      setTeammates((prev) =>
        prev.map((t) => (t.id === userId ? { ...t, isOnline: status === 'online' } : t))
      );
    };

    const handleGroupChanged = () => {
      fetchTeamData(true);
      if (onRefreshUser) onRefreshUser();
    };

    const handleTyping = ({ userName, groupId }: { userName: string; groupId: string }) => {
      if (groupId === group?.id) {
        setTypingUser(userName);
      }
    };

    const handleStoppedTyping = () => {
      setTypingUser(null);
    };

    const handleTeamMessageEdited = (updatedMsg: ChatMessage) => {
      setGroupMessages((prev) => prev.map((m) => (m.id === updatedMsg.id ? updatedMsg : m)));
    };

    const handleDirectMessageEdited = (updatedMsg: ChatMessage) => {
      setDirectMessages((prev) => prev.map((m) => (m.id === updatedMsg.id ? updatedMsg : m)));
    };

    const handleTeamMessageDeleted = ({ messageId }: { messageId: string }) => {
      setGroupMessages((prev) => prev.filter((m) => m.id !== messageId));
    };

    const handleDirectMessageDeleted = ({ messageId }: { messageId: string }) => {
      setDirectMessages((prev) => prev.filter((m) => m.id !== messageId));
    };

    const handleTeamChatCleared = () => {
      setGroupMessages([]);
    };

    const handleDirectChatCleared = ({ user1Id, user2Id }: { user1Id: string; user2Id: string }) => {
      if (
        (user1Id === currentUser.id && user2Id === activeTeammate?.id) ||
        (user2Id === currentUser.id && user1Id === activeTeammate?.id)
      ) {
        setDirectMessages([]);
      }
    };

    socket.on('new_team_message', handleNewTeamMessage);
    socket.on('new_direct_message', handleNewDirectMessage);
    socket.on('team_message_edited', handleTeamMessageEdited);
    socket.on('direct_message_edited', handleDirectMessageEdited);
    socket.on('team_message_deleted', handleTeamMessageDeleted);
    socket.on('direct_message_deleted', handleDirectMessageDeleted);
    socket.on('team_chat_cleared', handleTeamChatCleared);
    socket.on('direct_chat_cleared', handleDirectChatCleared);
    socket.on('new_team_activity', handleNewActivity);
    socket.on('teammate_presence', handleTeammatePresence);
    socket.on('presence_update', handleTeammatePresence);
    socket.on('my_group_changed', handleGroupChanged);
    socket.on('teammate_typing', handleTyping);
    socket.on('teammate_stopped_typing', handleStoppedTyping);

    return () => {
      socket.off('new_team_message', handleNewTeamMessage);
      socket.off('new_direct_message', handleNewDirectMessage);
      socket.off('team_message_edited', handleTeamMessageEdited);
      socket.off('direct_message_edited', handleDirectMessageEdited);
      socket.off('team_message_deleted', handleTeamMessageDeleted);
      socket.off('direct_message_deleted', handleDirectMessageDeleted);
      socket.off('team_chat_cleared', handleTeamChatCleared);
      socket.off('direct_chat_cleared', handleDirectChatCleared);
      socket.off('new_team_activity', handleNewActivity);
      socket.off('teammate_presence', handleTeammatePresence);
      socket.off('presence_update', handleTeammatePresence);
      socket.off('my_group_changed', handleGroupChanged);
      socket.off('teammate_typing', handleTyping);
      socket.off('teammate_stopped_typing', handleStoppedTyping);
    };
  }, [group?.id, activeTeammate?.id, currentUser.id]);

  // Send Message Handler
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!messageInput.trim() || isSendingMessage) return;

    const content = messageInput.trim();
    setMessageInput('');
    setIsSendingMessage(true);

    try {
      if (chatMode === 'group') {
        const res = await fetch(`/api/team/messages/group/${group.id}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ content }),
        });
        const data = await res.json();
        if (data.success && data.chatMessage) {
          setGroupMessages((prev) => {
            if (prev.some((m) => m.id === data.chatMessage.id)) return prev;
            return [...prev, data.chatMessage];
          });
        }
      } else if (chatMode === 'direct' && activeTeammate) {
        const res = await fetch(`/api/team/messages/direct/${activeTeammate.id}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ content }),
        });
        const data = await res.json();
        if (data.success && data.chatMessage) {
          setDirectMessages((prev) => {
            if (prev.some((m) => m.id === data.chatMessage.id)) return prev;
            return [...prev, data.chatMessage];
          });
        }
      }
    } catch (err) {
      console.warn('Failed to send message:', err);
    } finally {
      setIsSendingMessage(false);
    }
  };

  // Edit Message Handler
  const handleSaveEdit = async (messageId: string) => {
    if (!editingContent.trim() || isUpdatingMessage) return;
    setIsUpdatingMessage(true);
    try {
      const res = await fetch(`/api/team/messages/${messageId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: editingContent.trim() }),
      });
      const data = await res.json();
      if (data.success && data.chatMessage) {
        if (chatMode === 'group') {
          setGroupMessages((prev) => prev.map((m) => (m.id === messageId ? data.chatMessage : m)));
        } else {
          setDirectMessages((prev) => prev.map((m) => (m.id === messageId ? data.chatMessage : m)));
        }
        setEditingMessageId(null);
        setEditingContent('');
      } else {
        alert(data.message || 'Failed to update message.');
      }
    } catch (err) {
      console.warn('Error updating message:', err);
    } finally {
      setIsUpdatingMessage(false);
    }
  };

  // Delete Single Message Handler
  const handleDeleteMessage = async (messageId: string) => {
    if (!window.confirm('Delete this message?')) return;
    try {
      const res = await fetch(`/api/team/messages/${messageId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        if (chatMode === 'group') {
          setGroupMessages((prev) => prev.filter((m) => m.id !== messageId));
        } else {
          setDirectMessages((prev) => prev.filter((m) => m.id !== messageId));
        }
      } else {
        alert(data.message || 'Failed to delete message.');
      }
    } catch (err) {
      console.warn('Error deleting message:', err);
    }
  };

  // Clear Chat History Handler
  const handleClearChat = async () => {
    const isGroup = chatMode === 'group';
    const targetName = isGroup ? (group?.name || 'Group Chat') : (activeTeammate?.fullName || 'Private Chat');
    if (!window.confirm(`Are you sure you want to clear all chat messages for ${targetName}? This cannot be undone.`)) {
      return;
    }

    setIsClearingChat(true);
    try {
      const url = isGroup
        ? `/api/team/messages/clear/group/${group?.id}`
        : `/api/team/messages/clear/direct/${activeTeammate?.id}`;

      const res = await fetch(url, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        if (isGroup) {
          setGroupMessages([]);
        } else {
          setDirectMessages([]);
        }
      } else {
        alert(data.message || 'Failed to clear chat.');
      }
    } catch (err) {
      console.warn('Error clearing chat:', err);
    } finally {
      setIsClearingChat(false);
    }
  };

  // Submit Teammate Activity
  const handleSubmitActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActivityTitle.trim() || isSubmittingActivity) return;

    setIsSubmittingActivity(true);
    setActivityError('');

    try {
      const res = await fetch(`/api/team/activities/${group.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          actionType: newActionType,
          title: newActivityTitle.trim(),
          details: newActivityDetails.trim(),
          link: newActivityLink.trim(),
        }),
      });

      const data = await res.json();
      if (data.success && data.activity) {
        setActivities((prev) => [data.activity, ...prev]);
        setShowActivityModal(false);
        setNewActivityTitle('');
        setNewActivityDetails('');
        setNewActivityLink('');
      } else {
        setActivityError(data.message || 'Failed to post activity.');
      }
    } catch (err: any) {
      setActivityError(err.message || 'Network error.');
    } finally {
      setIsSubmittingActivity(false);
    }
  };

  // =========================================================================
  // VIEW 1: UNASSIGNED STUDENT (Requirement 4)
  // =========================================================================
  if (!loading && !hasGroup) {
    return (
      <div className="w-full flex flex-col gap-6 animate-fadeIn">
        {/* Unassigned Warning Banner */}
        <div className="p-8 sm:p-10 rounded-2xl border border-amber-500/30 bg-[#0B0C10]/95 backdrop-blur-xl shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />

          <div className="relative z-10 max-w-2xl flex flex-col gap-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-mono font-semibold uppercase tracking-wider w-fit">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Not Assigned to a Group</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black font-display text-white tracking-tight">
              STANDALONE WORKSPACE // AWAITING ROSTER ALLOCATION
            </h2>

            <p className="text-xs sm:text-sm font-sans text-zinc-300 leading-relaxed">
              You are currently registered as an independent student member. Your Society Lead Coordinator allocates students into collaborative project squads of up to <strong>4 members</strong>.
            </p>

            <div className="p-4 rounded-xl bg-black/50 border border-white/10 font-mono text-xs text-zinc-400 space-y-2">
              <div className="flex items-center gap-2 text-white font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>What happens once you are assigned:</span>
              </div>
              <p>• All 4 teammates will automatically populate on your dashboard with live online indicators.</p>
              <p>• Your private Team Group Chat and 1-on-1 direct messaging will unlock immediately.</p>
              <p>• Teammates' code commits, GitHub pulls, and file milestones will stream in real time without refreshing.</p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => fetchTeamData(true)}
                disabled={isRefreshing}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-mono flex items-center gap-2 transition-all cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>Check Assignment Status</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: ACTIVE TEAM COLLABORATION HUB (Requirements 1, 2, 5)
  // =========================================================================
  const filteredActivities = activities.filter((act) => {
    if (activityFilter === 'all') return true;
    return act.actionType === activityFilter;
  });

  const visibleTeamAnnouncements = teamAnnouncements.filter((a) => !dismissedBroadcastIds.includes(a.id));

  const handleDismissBroadcast = async (id: string) => {
    const updated = [...dismissedBroadcastIds, id];
    setDismissedBroadcastIds(updated);
    try {
      localStorage.setItem('ccs_dismissed_team_broadcasts', JSON.stringify(updated));
    } catch {}

    setTeamAnnouncements((prev) => prev.filter((a) => a.id !== id));

    try {
      const hasPermission =
        currentUser.role === 'coordinator' ||
        currentUser.role === 'admin' ||
        currentUser.permissions?.canBroadcastAnnouncements;

      if (hasPermission && token) {
        await fetch(`/api/coordinator/announcements/${id}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }
    } catch {}
  };

  return (
    <div className="w-full flex flex-col gap-6 animate-fadeIn">
      {/* Pinned Team Directives / Broadcasts */}
      {visibleTeamAnnouncements.length > 0 && (
        <div className="p-3.5 sm:p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 backdrop-blur-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono text-emerald-300">
          <div className="flex items-center gap-2.5 overflow-hidden min-w-0">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold uppercase tracking-wider shrink-0">
              Team Broadcast
            </span>
            <span className="text-white font-medium truncate">{visibleTeamAnnouncements[0].message}</span>
          </div>
          <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
            <span className="text-[10px] text-emerald-400/80">
              {new Date(visibleTeamAnnouncements[0].createdAt).toLocaleDateString()}
            </span>
            <button
              onClick={() => handleDismissBroadcast(visibleTeamAnnouncements[0].id)}
              className="p-1 sm:p-1.5 rounded-lg text-emerald-400/80 hover:text-white hover:bg-emerald-500/20 border border-emerald-500/20 hover:border-emerald-500/50 transition-all cursor-pointer flex items-center justify-center group"
              title="Cut / Dismiss broadcast"
              aria-label="Cut / Dismiss broadcast"
            >
              <X className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
            </button>
          </div>
        </div>
      )}

      {/* ================= TEAM HEADER ================= */}
      <div className={`p-6 rounded-2xl border backdrop-blur-xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 ${
        theme === 'light'
          ? 'bg-white/95 border-black/10 shadow-black/5 text-zinc-900'
          : 'bg-[#0B0C10]/95 border-white/10 shadow-black/50 text-white'
      }`}>
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full bg-[#E50920]/20 text-[#E50920] border border-[#E50920]/40 text-[10px] font-mono font-bold uppercase tracking-wider">
              {group?.code || 'TEAM'}
            </span>
            <span className={`text-xs font-mono ${theme === 'light' ? 'text-zinc-600' : 'text-zinc-400'}`}>
              Capacity: <strong className={theme === 'light' ? 'text-zinc-900' : 'text-white'}>{teammates.length} / 4 Members</strong>
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-mono text-emerald-500 font-semibold">Live Sync</span>
          </div>

          <h1 className={`text-xl sm:text-2xl font-bold font-display ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>
            {group?.name || 'Assigned Project Squad'}
          </h1>
          {group?.description && (
            <p className={`text-xs font-mono mt-1 max-w-2xl ${theme === 'light' ? 'text-zinc-600' : 'text-zinc-400'}`}>
              {group.description}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowActivityModal(true)}
            className="px-4 py-2 rounded-xl bg-[#E50920] hover:bg-[#ff1e38] text-white text-xs font-mono font-semibold flex items-center gap-2 shadow-lg shadow-[#E50920]/25 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Log Commit / Activity</span>
          </button>

          <button
            onClick={() => fetchTeamData(true)}
            disabled={isRefreshing}
            className={`p-2 rounded-xl border transition-all cursor-pointer ${
              theme === 'light'
                ? 'bg-black/5 hover:bg-black/10 border-black/15 text-zinc-700 hover:text-black'
                : 'bg-white/5 hover:bg-white/10 border-white/10 text-zinc-300 hover:text-white'
            }`}
            title="Force Sync"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* ================= SECTION 1: TEAMMATES ROSTER (Max 4 students) ================= */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-mono uppercase text-zinc-300 font-semibold tracking-wider">
            <Users className="w-4 h-4 text-[#E50920]" />
            <span>Assigned Teammates ({teammates.length}/4)</span>
          </div>
          <span className="text-[11px] font-mono text-zinc-500">
            {group?.availableSeats > 0 ? `${group.availableSeats} seat(s) remaining for cohort` : 'Team Full (4/4)'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {teammates.map((teammate) => {
            const isMe = teammate.id === currentUser.id;
            return (
              <div
                key={teammate.id}
                className={`p-4 rounded-xl border backdrop-blur-2xl transition-all flex flex-col justify-between gap-3 shadow-xl ${
                  isMe
                    ? theme === 'light'
                      ? 'border-[#E50920] bg-rose-50/60 shadow-md shadow-[#E50920]/10'
                      : 'border-[#E50920]/60 bg-[#161218] shadow-md shadow-[#E50920]/15'
                    : theme === 'light'
                    ? 'border-black/10 bg-white/95 hover:border-black/25 shadow-black/5'
                    : 'border-white/10 bg-[#0E0F14] hover:border-white/25 shadow-black/50'
                }`}
              >
                {/* Top Profile */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      {teammate.avatarUrl ? (
                        <img
                          src={teammate.avatarUrl}
                          alt={teammate.fullName}
                          className="w-10 h-10 rounded-xl object-cover border border-white/15"
                        />
                      ) : (
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs border ${
                          theme === 'light'
                            ? 'bg-zinc-200 text-zinc-800 border-zinc-300'
                            : 'bg-gradient-to-br from-zinc-700 to-zinc-900 text-white border-white/10'
                        }`}>
                          {teammate.fullName.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      {/* Presence Dot */}
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 ${
                          theme === 'light' ? 'border-white' : 'border-[#0B0C10]'
                        } ${
                          teammate.isOnline ? 'bg-emerald-400' : 'bg-zinc-500'
                        }`}
                        title={teammate.isOnline ? 'Online Now' : 'Offline'}
                      />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-xs font-bold truncate max-w-[120px] ${
                          theme === 'light' ? 'text-zinc-900' : 'text-white'
                        }`}>
                          {teammate.fullName}
                        </span>
                        {isMe && (
                          <span className="text-[9px] font-mono px-1 rounded bg-[#E50920]/20 text-[#E50920] font-bold">
                            YOU
                          </span>
                        )}
                      </div>
                      <span className={`text-[10px] font-mono block truncate ${
                        theme === 'light' ? 'text-zinc-500' : 'text-zinc-400'
                      }`}>
                        {teammate.department || 'Computer Science'}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-semibold ${
                      teammate.isOnline
                        ? 'bg-emerald-500/15 text-emerald-600 border border-emerald-500/30'
                        : theme === 'light'
                        ? 'bg-black/5 text-zinc-500'
                        : 'bg-white/5 text-zinc-500'
                    }`}
                  >
                    {teammate.isOnline ? 'ONLINE' : 'OFFLINE'}
                  </span>
                </div>

                {/* Latest Project Work */}
                <div className={`p-2.5 rounded-lg border text-[11px] font-mono ${
                  theme === 'light'
                    ? 'bg-zinc-50 border-black/10'
                    : 'bg-[#07070A] border-white/10'
                }`}>
                  <span className={`block text-[9px] uppercase tracking-wider mb-0.5 ${
                    theme === 'light' ? 'text-zinc-500' : 'text-zinc-500'
                  }`}>
                    Current Milestone:
                  </span>
                  {teammate.latestProject ? (
                    <div>
                      <div className={`font-semibold line-clamp-1 ${
                        theme === 'light' ? 'text-zinc-900' : 'text-zinc-200'
                      }`}>
                        {teammate.latestProject.title}
                      </div>
                      <div className="flex items-center justify-between text-[10px] mt-1">
                        <span className={theme === 'light' ? 'text-zinc-600' : 'text-zinc-400'}>
                          {teammate.latestProject.progress}% complete
                        </span>
                        <span className="text-[#E50920] font-semibold">{teammate.latestProject.domain}</span>
                      </div>
                    </div>
                  ) : (
                    <span className="text-zinc-400 italic">No project submissions yet</span>
                  )}
                </div>

                {/* Direct Message Action Button */}
                {!isMe && (
                  <button
                    onClick={() => {
                      setActiveTeammate(teammate);
                      setChatMode('direct');
                    }}
                    className={`w-full py-1.5 px-3 rounded-lg border flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-xs font-mono ${
                      theme === 'light'
                        ? 'bg-black/5 hover:bg-black/10 border-black/10 text-zinc-800 hover:text-black'
                        : 'bg-white/5 hover:bg-white/10 border-white/10 hover:border-[#E50920]/40 text-zinc-300 hover:text-white'
                    }`}
                  >
                    <MessageSquare className="w-3 h-3 text-[#E50920]" />
                    <span>Private Message</span>
                  </button>
                )}
              </div>
            );
          })}

          {/* Empty Seats Filler Cards */}
          {Array.from({ length: Math.max(0, 4 - teammates.length) }).map((_, idx) => (
            <div
              key={`empty-${idx}`}
              className={`p-4 rounded-xl border border-dashed flex flex-col items-center justify-center gap-2 text-center min-h-[140px] ${
                theme === 'light'
                  ? 'border-black/15 bg-white/70'
                  : 'border-white/10 bg-[#0E0F14] backdrop-blur-xl'
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                theme === 'light' ? 'bg-black/5 text-zinc-400' : 'bg-white/5 text-zinc-600'
              }`}>
                <Users className="w-4 h-4" />
              </div>
              <span className={`text-xs font-mono ${theme === 'light' ? 'text-zinc-600' : 'text-zinc-500'}`}>
                Seat {teammates.length + idx + 1} Open
              </span>
              <span className={`text-[10px] font-mono ${theme === 'light' ? 'text-zinc-400' : 'text-zinc-600'}`}>
                Awaiting Coordinator Allocation
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ================= SECTION 2: SPLIT COLLABORATION SUITE ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ================= LEFT (7 Cols): LIVE ACTIVITY FEED ================= */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className={`p-5 rounded-2xl border backdrop-blur-xl shadow-xl flex flex-col gap-4 ${
            theme === 'light'
              ? 'bg-white/95 border-black/10 shadow-black/5'
              : 'bg-[#0B0C10]/95 border-white/10 shadow-black/50'
          }`}>
            {/* Feed Header */}
            <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b ${
              theme === 'light' ? 'border-black/10' : 'border-white/10'
            }`}>
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#E50920]" />
                <h3 className={`text-sm font-bold font-display ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>
                  Live Project Activity Stream
                </h3>
              </div>

              {/* Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
                {['all', 'commit', 'milestone', 'push'].map((f) => (
                  <button
                    key={f}
                    onClick={() => setActivityFilter(f)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-mono uppercase tracking-wider transition-all cursor-pointer ${
                      activityFilter === f
                        ? 'bg-[#E50920] text-white font-bold'
                        : theme === 'light'
                        ? 'bg-black/5 text-zinc-600 hover:text-black border border-black/10'
                        : 'bg-white/5 text-zinc-400 hover:text-white'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Activities List */}
            <div className="flex flex-col gap-3 max-h-[520px] overflow-y-auto pr-1">
              {filteredActivities.length === 0 ? (
                <div className={`p-8 text-center font-mono text-xs ${theme === 'light' ? 'text-zinc-400' : 'text-zinc-500'}`}>
                  No project activities logged for this filter yet.
                </div>
              ) : (
                filteredActivities.map((act) => {
                  return (
                    <div
                      key={act.id}
                      className={`p-3.5 rounded-xl border transition-all flex flex-col gap-2 ${
                        theme === 'light'
                          ? 'bg-zinc-50/90 border-black/10 hover:border-[#E50920]/40'
                          : 'border-white/5 bg-black/40 hover:border-white/15'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-[#E50920]/15 text-[#E50920] flex items-center justify-center shrink-0">
                            {act.actionType === 'commit' ? (
                              <GitCommit className="w-3.5 h-3.5" />
                            ) : act.actionType === 'milestone' ? (
                              <Sparkles className="w-3.5 h-3.5" />
                            ) : act.actionType === 'push' ? (
                              <GitPullRequest className="w-3.5 h-3.5" />
                            ) : (
                              <Code2 className="w-3.5 h-3.5" />
                            )}
                          </div>
                          <div>
                            <span className={`text-xs font-bold block ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>
                              {act.userName}
                            </span>
                            <span className={`text-[10px] font-mono ${theme === 'light' ? 'text-zinc-500' : 'text-zinc-400'}`}>
                              {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} •{' '}
                              {new Date(act.timestamp).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        <span className={`text-[9px] font-mono px-2 py-0.5 rounded uppercase font-semibold border ${
                          theme === 'light'
                            ? 'bg-black/5 text-zinc-700 border-black/10'
                            : 'bg-white/5 text-zinc-300 border-white/10'
                        }`}>
                          {act.actionType}
                        </span>
                      </div>

                      <p className={`text-xs font-mono pl-9 ${theme === 'light' ? 'text-zinc-800' : 'text-zinc-200'}`}>
                        {act.title}
                      </p>
                      {act.details && (
                        <p className={`text-[11px] font-mono pl-9 leading-relaxed whitespace-pre-wrap ${
                          theme === 'light' ? 'text-zinc-600' : 'text-zinc-400'
                        }`}>
                          {act.details}
                        </p>
                      )}

                      {act.link && (
                        <div className="pl-9 pt-1">
                          <a
                            href={act.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-mono text-[#E50920] hover:underline"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>View Commit / Reference</span>
                          </a>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* ================= RIGHT (5 Cols): TEAM MESSAGING SYSTEM ================= */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className={`p-5 rounded-2xl border backdrop-blur-xl shadow-xl flex flex-col h-[600px] ${
            theme === 'light'
              ? 'bg-white/95 border-black/10 shadow-black/5'
              : 'bg-[#0B0C10]/95 border-white/10 shadow-black/50'
          }`}>
            {/* Chat Mode Switcher Tabs */}
            <div className={`flex items-center justify-between pb-3 border-b ${
              theme === 'light' ? 'border-black/10' : 'border-white/10'
            }`}>
              <div className={`flex items-center gap-1.5 p-1 rounded-xl border ${
                theme === 'light' ? 'bg-zinc-100 border-black/10' : 'bg-black/50 border-white/10'
              }`}>
                <button
                  onClick={() => setChatMode('group')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                    chatMode === 'group'
                      ? 'bg-[#E50920] text-white font-bold shadow-md shadow-[#E50920]/30'
                      : theme === 'light'
                      ? 'text-zinc-600 hover:text-black'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Hash className="w-3.5 h-3.5" />
                  <span>Group Chat</span>
                </button>

                <button
                  onClick={() => setChatMode('direct')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                    chatMode === 'direct'
                      ? 'bg-[#E50920] text-white font-bold shadow-md shadow-[#E50920]/30'
                      : theme === 'light'
                      ? 'text-zinc-600 hover:text-black'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Personal 1-on-1</span>
                </button>
              </div>

              {/* Privacy Badge */}
              <div
                className="flex items-center gap-1 text-[10px] font-mono text-zinc-400"
                title="Strict database-level encryption & authorized participant gating"
              >
                <Lock className="w-3 h-3 text-emerald-500" />
                <span className="text-emerald-600 font-semibold">Private</span>
              </div>
            </div>

            {/* Direct Message Teammate Selector when in Direct Mode */}
            {chatMode === 'direct' && (
              <div className={`py-2.5 px-1 border-b flex items-center gap-2 overflow-x-auto scrollbar-none ${
                theme === 'light' ? 'border-black/10' : 'border-white/10'
              }`}>
                <span className={`text-[10px] font-mono uppercase tracking-wider shrink-0 ${
                  theme === 'light' ? 'text-zinc-500' : 'text-zinc-500'
                }`}>
                  Chat With:
                </span>
                {teammates
                  .filter((t) => t.id !== currentUser.id)
                  .map((t) => {
                    const isSelected = activeTeammate?.id === t.id;
                    return (
                      <button
                        key={t.id}
                        onClick={() => setActiveTeammate(t)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono transition-all shrink-0 cursor-pointer ${
                          isSelected
                            ? 'bg-[#E50920] text-white font-bold'
                            : theme === 'light'
                            ? 'bg-black/5 text-zinc-700 hover:text-black border border-black/10'
                            : 'bg-white/5 text-zinc-300 hover:text-white border border-white/10'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${t.isOnline ? 'bg-emerald-400' : 'bg-zinc-400'}`} />
                        <span>{t.fullName}</span>
                      </button>
                    );
                  })}
              </div>
            )}

            {/* Chat Target Subtitle and Action Header */}
            <div className={`py-2 text-[11px] font-mono flex items-center justify-between gap-2 border-b ${
              theme === 'light' ? 'text-zinc-600 border-black/10' : 'text-zinc-400 border-white/5'
            }`}>
              <div className="flex items-center gap-1.5 overflow-hidden">
                {chatMode === 'group' ? (
                  <span className="truncate">
                    Talking to: <strong className={theme === 'light' ? 'text-zinc-900' : 'text-white'}>{group?.name}</strong>
                  </span>
                ) : activeTeammate ? (
                  <span className="truncate">
                    Private thread: <strong className={theme === 'light' ? 'text-zinc-900' : 'text-white'}>{activeTeammate.fullName}</strong>
                  </span>
                ) : (
                  <span>Select a teammate to message</span>
                )}
                {typingUser && <span className="text-[10px] text-[#E50920] animate-pulse shrink-0 hidden sm:inline">({typingUser} typing...)</span>}
              </div>

              {/* Clear Chat Button */}
              {((chatMode === 'group' && groupMessages.length > 0) || (chatMode === 'direct' && directMessages.length > 0)) && (
                <button
                  type="button"
                  onClick={handleClearChat}
                  disabled={isClearingChat}
                  title="Clear conversation history"
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono border transition-all cursor-pointer shrink-0 disabled:opacity-50 ${
                    theme === 'light'
                      ? 'text-zinc-600 hover:text-red-600 hover:bg-red-50 border-black/10 hover:border-red-300'
                      : 'text-zinc-400 hover:text-red-400 hover:bg-red-500/10 border-transparent hover:border-red-500/20'
                  }`}
                >
                  <Trash2 className="w-3 h-3 text-red-500" />
                  <span className="hidden xs:inline sm:inline">Clear Chat</span>
                </button>
              )}
            </div>

            {/* Message History Container (internal scrolling only) */}
            <div ref={messagesContainerRef} className="flex-1 overflow-y-auto space-y-3 py-2 pr-1 max-h-[380px] min-h-[300px]">
              {chatMode === 'group' ? (
                groupMessages.length === 0 ? (
                  <div className={`p-8 text-center font-mono text-xs ${theme === 'light' ? 'text-zinc-400' : 'text-zinc-500'}`}>
                    No messages in group discussion yet. Start the conversation!
                  </div>
                ) : (
                  groupMessages.map((msg) => {
                    const isMe = msg.senderId === currentUser.id;
                    const isEditing = editingMessageId === msg.id;
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col group/msg ${isMe ? 'items-end' : 'items-start'}`}
                      >
                        <div className={`flex items-center gap-1.5 text-[10px] font-mono mb-0.5 px-1 ${
                          theme === 'light' ? 'text-zinc-500' : 'text-zinc-400'
                        }`}>
                          <span className={isMe ? 'text-[#E50920] font-bold' : theme === 'light' ? 'text-zinc-800 font-semibold' : 'text-zinc-300'}>
                            {msg.senderName}
                          </span>
                          <span>•</span>
                          <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          {msg.isEdited && <span className="text-zinc-400 italic text-[9px]">(edited)</span>}
                        </div>

                        {isEditing ? (
                          <div className={`w-full max-w-[95%] sm:max-w-[85%] p-2 rounded-xl border flex flex-col gap-2 ${
                            theme === 'light'
                              ? 'bg-white border-black/20 shadow-md'
                              : 'bg-black/80 border-[#E50920]/40'
                          }`}>
                            <textarea
                              value={editingContent}
                              onChange={(e) => setEditingContent(e.target.value)}
                              className={`w-full p-2 rounded-lg text-xs border focus:border-[#E50920] focus:outline-none resize-none font-sans ${
                                theme === 'light'
                                  ? 'bg-zinc-50 text-zinc-900 border-black/15'
                                  : 'bg-zinc-900 text-white border-white/10'
                              }`}
                              rows={2}
                              autoFocus
                            />
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingMessageId(null);
                                  setEditingContent('');
                                }}
                                className={`px-2 py-1 rounded text-[10px] font-mono cursor-pointer ${
                                  theme === 'light' ? 'text-zinc-600 hover:text-black' : 'text-zinc-400 hover:text-white'
                                }`}
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSaveEdit(msg.id)}
                                disabled={isUpdatingMessage || !editingContent.trim()}
                                className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#E50920] hover:bg-[#ff1e38] text-white text-[10px] font-mono font-semibold transition-all cursor-pointer disabled:opacity-50"
                              >
                                <Check className="w-3 h-3" />
                                <span>Save</span>
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="relative group/bubble max-w-[92%] sm:max-w-[85%] flex items-start gap-1">
                            {/* Actions for sender (Edit / Delete) */}
                            {isMe && (
                              <div className={`opacity-0 group-hover/msg:opacity-100 flex items-center gap-0.5 self-center shrink-0 transition-opacity p-0.5 rounded-lg border ${
                                theme === 'light'
                                  ? 'bg-white/90 border-black/10 shadow-sm'
                                  : 'bg-black/60 border-white/10'
                              }`}>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingMessageId(msg.id);
                                    setEditingContent(msg.content);
                                  }}
                                  title="Edit message"
                                  className={`p-1 rounded transition-colors cursor-pointer ${
                                    theme === 'light' ? 'text-zinc-600 hover:text-black hover:bg-black/5' : 'text-zinc-400 hover:text-white hover:bg-white/10'
                                  }`}
                                >
                                  <Edit2 className="w-2.5 h-2.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteMessage(msg.id)}
                                  title="Delete message"
                                  className="p-1 hover:text-red-500 text-zinc-400 hover:bg-red-50 rounded transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-2.5 h-2.5" />
                                </button>
                              </div>
                            )}

                            <div
                              className={`p-2.5 sm:p-3 rounded-2xl text-xs font-sans leading-relaxed whitespace-pre-wrap break-words ${
                                isMe
                                  ? 'bg-[#E50920] text-white rounded-tr-sm shadow-md shadow-[#E50920]/20'
                                  : theme === 'light'
                                  ? 'bg-zinc-100 text-zinc-900 rounded-tl-sm border border-black/10'
                                  : 'bg-zinc-800/90 text-zinc-100 rounded-tl-sm border border-white/10'
                              }`}
                            >
                              {msg.content}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )
              ) : (
                /* Direct Messages Thread */
                directMessages.length === 0 ? (
                  <div className={`p-8 text-center font-mono text-xs ${theme === 'light' ? 'text-zinc-400' : 'text-zinc-500'}`}>
                    No private messages with {activeTeammate?.fullName || 'this teammate'} yet. Send a direct message!
                  </div>
                ) : (
                  directMessages.map((msg) => {
                    const isMe = msg.senderId === currentUser.id;
                    const isEditing = editingMessageId === msg.id;
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col group/msg ${isMe ? 'items-end' : 'items-start'}`}
                      >
                        <div className={`flex items-center gap-1.5 text-[10px] font-mono mb-0.5 px-1 ${
                          theme === 'light' ? 'text-zinc-500' : 'text-zinc-400'
                        }`}>
                          <span className={isMe ? 'text-[#E50920] font-bold' : theme === 'light' ? 'text-zinc-800 font-semibold' : 'text-zinc-300'}>
                            {msg.senderName}
                          </span>
                          <span>•</span>
                          <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          {msg.isEdited && <span className="text-zinc-400 italic text-[9px]">(edited)</span>}
                        </div>

                        {isEditing ? (
                          <div className={`w-full max-w-[95%] sm:max-w-[85%] p-2 rounded-xl border flex flex-col gap-2 ${
                            theme === 'light'
                              ? 'bg-white border-black/20 shadow-md'
                              : 'bg-black/80 border-[#E50920]/40'
                          }`}>
                            <textarea
                              value={editingContent}
                              onChange={(e) => setEditingContent(e.target.value)}
                              className={`w-full p-2 rounded-lg text-xs border focus:border-[#E50920] focus:outline-none resize-none font-sans ${
                                theme === 'light'
                                  ? 'bg-zinc-50 text-zinc-900 border-black/15'
                                  : 'bg-zinc-900 text-white border-white/10'
                              }`}
                              rows={2}
                              autoFocus
                            />
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingMessageId(null);
                                  setEditingContent('');
                                }}
                                className={`px-2 py-1 rounded text-[10px] font-mono cursor-pointer ${
                                  theme === 'light' ? 'text-zinc-600 hover:text-black' : 'text-zinc-400 hover:text-white'
                                }`}
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSaveEdit(msg.id)}
                                disabled={isUpdatingMessage || !editingContent.trim()}
                                className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#E50920] hover:bg-[#ff1e38] text-white text-[10px] font-mono font-semibold transition-all cursor-pointer disabled:opacity-50"
                              >
                                <Check className="w-3 h-3" />
                                <span>Save</span>
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="relative group/bubble max-w-[92%] sm:max-w-[85%] flex items-start gap-1">
                            {/* Actions for sender (Edit / Delete) */}
                            {isMe && (
                              <div className={`opacity-0 group-hover/msg:opacity-100 flex items-center gap-0.5 self-center shrink-0 transition-opacity p-0.5 rounded-lg border ${
                                theme === 'light'
                                  ? 'bg-white/90 border-black/10 shadow-sm'
                                  : 'bg-black/60 border-white/10'
                              }`}>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingMessageId(msg.id);
                                    setEditingContent(msg.content);
                                  }}
                                  title="Edit message"
                                  className={`p-1 rounded transition-colors cursor-pointer ${
                                    theme === 'light' ? 'text-zinc-600 hover:text-black hover:bg-black/5' : 'text-zinc-400 hover:text-white hover:bg-white/10'
                                  }`}
                                >
                                  <Edit2 className="w-2.5 h-2.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteMessage(msg.id)}
                                  title="Delete message"
                                  className="p-1 hover:text-red-500 text-zinc-400 hover:bg-red-50 rounded transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-2.5 h-2.5" />
                                </button>
                              </div>
                            )}

                            <div
                              className={`p-2.5 sm:p-3 rounded-2xl text-xs font-sans leading-relaxed whitespace-pre-wrap break-words ${
                                isMe
                                  ? 'bg-[#E50920] text-white rounded-tr-sm shadow-md shadow-[#E50920]/20'
                                  : theme === 'light'
                                  ? 'bg-zinc-100 text-zinc-900 rounded-tl-sm border border-black/10'
                                  : 'bg-zinc-800/90 text-zinc-100 rounded-tl-sm border border-white/10'
                              }`}
                            >
                              {msg.content}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )
              )}
            </div>

            {/* Message Input Box */}
            <form onSubmit={handleSendMessage} className={`pt-3 border-t flex items-center gap-2 ${
              theme === 'light' ? 'border-black/10' : 'border-white/10'
            }`}>
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder={
                  chatMode === 'group'
                    ? `Message ${group?.name}...`
                    : `Private message to ${activeTeammate?.fullName || 'teammate'}...`
                }
                className={`flex-1 px-4 py-2.5 rounded-xl border text-xs font-sans focus:outline-none transition-colors ${
                  theme === 'light'
                    ? 'bg-zinc-50 border-black/15 text-zinc-900 placeholder-zinc-400 focus:border-[#E50920]'
                    : 'bg-black/60 border-white/10 text-white placeholder-zinc-500 focus:border-[#E50920]/60'
                }`}
              />
              <button
                type="submit"
                disabled={!messageInput.trim() || isSendingMessage}
                className="p-2.5 rounded-xl bg-[#E50920] hover:bg-[#ff1e38] text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-md shadow-[#E50920]/30 shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* ================= MODAL: POST PROJECT ACTIVITY / COMMIT LOG ================= */}
      {showActivityModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-lg p-6 rounded-2xl border border-white/15 bg-[#0B0C10] shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <GitCommit className="w-5 h-5 text-[#E50920]" />
                <h3 className="text-base font-bold font-display text-white">Log Project Activity / Commit</h3>
              </div>
              <button
                onClick={() => setShowActivityModal(false)}
                className="text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {activityError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs font-mono text-red-400">
                {activityError}
              </div>
            )}

            <form onSubmit={handleSubmitActivity} className="space-y-4">
              {/* Type Selection */}
              <div>
                <label className="text-xs font-mono text-zinc-300 block mb-1.5 uppercase">Activity Type</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: 'commit', label: 'Commit' },
                    { id: 'push', label: 'Push' },
                    { id: 'milestone', label: 'Milestone' },
                    { id: 'file_update', label: 'Files' },
                  ].map((t) => (
                    <button
                      type="button"
                      key={t.id}
                      onClick={() => setNewActionType(t.id as any)}
                      className={`py-1.5 rounded-lg text-xs font-mono uppercase font-semibold transition-all cursor-pointer ${
                        newActionType === t.id
                          ? 'bg-[#E50920] text-white shadow-md'
                          : 'bg-white/5 text-zinc-400 hover:text-white border border-white/10'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-mono text-zinc-300 block mb-1.5 uppercase">Activity Headline *</label>
                <input
                  type="text"
                  required
                  value={newActivityTitle}
                  onChange={(e) => setNewActivityTitle(e.target.value)}
                  placeholder="e.g. Pushed 3 commits to branch `feature/auth`"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/10 text-xs font-mono text-white placeholder-zinc-500 focus:outline-none focus:border-[#E50920]/60"
                />
              </div>

              <div>
                <label className="text-xs font-mono text-zinc-300 block mb-1.5 uppercase">Detailed Notes / Files Changed</label>
                <textarea
                  rows={3}
                  value={newActivityDetails}
                  onChange={(e) => setNewActivityDetails(e.target.value)}
                  placeholder="e.g. Updated authentication middleware and token verification logic..."
                  className="w-full px-3.5 py-2 rounded-xl bg-black/60 border border-white/10 text-xs font-mono text-white placeholder-zinc-500 focus:outline-none focus:border-[#E50920]/60 resize-none"
                />
              </div>

              <div>
                <label className="text-xs font-mono text-zinc-300 block mb-1.5 uppercase">GitHub / Commit Link (Optional)</label>
                <input
                  type="url"
                  value={newActivityLink}
                  onChange={(e) => setNewActivityLink(e.target.value)}
                  placeholder="https://github.com/..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/10 text-xs font-mono text-white placeholder-zinc-500 focus:outline-none focus:border-[#E50920]/60"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowActivityModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 text-zinc-400 hover:text-white text-xs font-mono cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingActivity || !newActivityTitle.trim()}
                  className="px-5 py-2 rounded-xl bg-[#E50920] hover:bg-[#ff1e38] text-white text-xs font-mono font-semibold transition-all cursor-pointer shadow-md shadow-[#E50920]/30 disabled:opacity-50"
                >
                  {isSubmittingActivity ? 'Broadcasting...' : 'Broadcast to Teammates'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
