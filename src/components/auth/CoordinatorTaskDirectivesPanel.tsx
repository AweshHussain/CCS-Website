import React, { useState, useEffect } from 'react';
import {
  ListOrdered,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Trash2,
  Edit3,
  Users,
  Shield,
  Layers,
  Sparkles,
  RefreshCw,
  X,
  ExternalLink,
  Lock,
  Unlock,
  ChevronDown,
  ChevronUp,
  UserX,
  Calendar,
  Tag,
} from 'lucide-react';

export interface AssignedTaskDirective {
  id: string;
  title: string;
  description: string;
  domain: string;
  assignedByName: string;
  assignedByEmail: string;
  assignedByRole?: string;
  assignedTo: string;
  isOpenToAll: boolean;
  queueType: string;
  maxClaims: number;
  claimsQueue: {
    studentId: string;
    studentName: string;
    studentEmail: string;
    department?: string;
    claimedAt: string;
    submissionId?: string;
    status: string;
    notes?: string;
    isOnline?: boolean;
  }[];
  dueDate: string;
  priority: 'normal' | 'high' | 'urgent';
  status: 'active' | 'closed' | 'completed' | 'archived';
  createdAt: string;
  updatedAt?: string;
}

interface CoordinatorTaskDirectivesPanelProps {
  token: string;
  currentUser: {
    id: string;
    fullName: string;
    email: string;
    role: string;
    department?: string;
  };
  onCountUpdate?: (count: number) => void;
  theme?: 'dark' | 'light';
}

const PRESET_DOMAINS = [
  'Artificial Intelligence & Systems',
  'Cloud Infrastructure & Networks',
  'Full-Stack Web & Systems',
  'Cybersecurity & Cryptography',
  'DevOps & Automation',
  'Mobile & Ubiquitous Computing',
  'Computer Graphics & Engine Dev',
];

export const CoordinatorTaskDirectivesPanel: React.FC<CoordinatorTaskDirectivesPanelProps> = ({
  token,
  currentUser,
  onCountUpdate,
  theme = 'dark',
}) => {
  const [tasks, setTasks] = useState<AssignedTaskDirective[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'closed'>('all');
  const [expandedQueues, setExpandedQueues] = useState<Record<string, boolean>>({});
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [onlineUserIds, setOnlineUserIds] = useState<string[]>([]);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [domain, setDomain] = useState(PRESET_DOMAINS[0]);
  const [customDomain, setCustomDomain] = useState('');
  const [priority, setPriority] = useState<'normal' | 'high' | 'urgent'>('normal');
  const [dueDate, setDueDate] = useState('');
  const [isOpenToAll, setIsOpenToAll] = useState(true);
  const [maxClaims, setMaxClaims] = useState(5);
  const [saving, setSaving] = useState(false);
  const [actionInProgressId, setActionInProgressId] = useState<string | null>(null);

  // Auto-dismiss alerts
  useEffect(() => {
    if (!successMessage) return;
    const t = setTimeout(() => setSuccessMessage(''), 5000);
    return () => clearTimeout(t);
  }, [successMessage]);

  const fetchTasks = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/coordinator/assigned-work', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setTasks(data.work || []);
        if (onCountUpdate) {
          const activeCount = (data.work || []).filter(
            (t: AssignedTaskDirective) => t.status === 'active'
          ).length;
          onCountUpdate(activeCount);
        }
      } else {
        setError(data.message || 'Failed to load task directives.');
      }
    } catch (err: any) {
      setError(err.message || 'Error connecting to server.');
    } finally {
      setLoading(false);
    }
  };

  const fetchPresence = async () => {
    try {
      const res = await fetch('/api/coordinator/presence', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.onlineUserIds)) {
        setOnlineUserIds(data.onlineUserIds);
      }
    } catch {}
  };

  useEffect(() => {
    fetchTasks();
    fetchPresence();
    const interval = setInterval(fetchPresence, 8000);
    return () => clearInterval(interval);
  }, [token]);

  const handleManualRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    const minSpinPromise = new Promise((resolve) => setTimeout(resolve, 1000));
    try {
      await Promise.all([fetchTasks(), fetchPresence(), minSpinPromise]);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingTaskId(null);
    setTitle('');
    setDescription('');
    setDomain(PRESET_DOMAINS[0]);
    setCustomDomain('');
    setPriority('normal');
    setDueDate('');
    setIsOpenToAll(true);
    setMaxClaims(5);
    setShowModal(true);
  };

  const handleOpenEditModal = (task: AssignedTaskDirective) => {
    setEditingTaskId(task.id);
    setTitle(task.title);
    setDescription(task.description);
    if (PRESET_DOMAINS.includes(task.domain)) {
      setDomain(task.domain);
      setCustomDomain('');
    } else {
      setDomain('Other');
      setCustomDomain(task.domain);
    }
    setPriority(task.priority);
    setDueDate(task.dueDate || '');
    setIsOpenToAll(task.isOpenToAll !== false);
    setMaxClaims(task.maxClaims !== undefined ? task.maxClaims : 5);
    setShowModal(true);
  };

  const handleSaveDirective = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setError('Title and description are required.');
      return;
    }

    setSaving(true);
    setError('');
    const resolvedDomain = domain === 'Other' && customDomain.trim() ? customDomain.trim() : domain;

    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        domain: resolvedDomain,
        priority,
        dueDate,
        isOpenToAll,
        maxClaims: Number(maxClaims) || 0,
        assignedTo: isOpenToAll ? 'All Students' : 'Target Engineering Squad',
      };

      const url = editingTaskId
        ? `/api/coordinator/assigned-work/${editingTaskId}`
        : '/api/coordinator/assigned-work';
      const method = editingTaskId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        setSuccessMessage(
          editingTaskId
            ? 'Task directive updated successfully!'
            : 'New task directive published! Open to all students with real-time queue slot reservation.'
        );
        setShowModal(false);
        fetchTasks();
      } else {
        setError(data.message || 'Failed to save task directive.');
      }
    } catch (err: any) {
      setError(err.message || 'Error communicating with backend.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (task: AssignedTaskDirective) => {
    const nextStatus = task.status === 'active' ? 'closed' : 'active';
    setActionInProgressId(task.id);
    try {
      const res = await fetch(`/api/coordinator/assigned-work/${task.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMessage(`Directive is now ${nextStatus.toUpperCase()}.`);
        setTasks((prev) =>
          prev.map((t) => (t.id === task.id ? { ...t, status: nextStatus } : t))
        );
      } else {
        setError(data.message || 'Failed to update status.');
      }
    } catch (err: any) {
      setError(err.message || 'Error updating status.');
    } finally {
      setActionInProgressId(null);
    }
  };

  const handleDeleteDirective = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this task directive? All queued claims will be removed.')) {
      return;
    }

    setActionInProgressId(id);
    try {
      const res = await fetch(`/api/coordinator/assigned-work/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMessage('Task directive removed successfully.');
        setTasks((prev) => prev.filter((t) => t.id !== id));
      } else {
        setError(data.message || 'Failed to delete task directive.');
      }
    } catch (err: any) {
      setError(err.message || 'Error deleting directive.');
    } finally {
      setActionInProgressId(null);
    }
  };

  const handleReleaseStudentClaim = async (taskId: string, studentId: string, studentName: string) => {
    if (!window.confirm(`Release queue slot for ${studentName}? This will free up a slot in the queue.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/coordinator/assigned-work/${taskId}/release-claim`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ studentId }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMessage(`Released queue slot for ${studentName}.`);
        setTasks((prev) =>
          prev.map((t) => (t.id === taskId ? data.task : t))
        );
      } else {
        setError(data.message || 'Failed to release slot.');
      }
    } catch (err: any) {
      setError(err.message || 'Error releasing slot.');
    }
  };

  const toggleQueueExpanded = (taskId: string) => {
    setExpandedQueues((prev) => ({ ...prev, [taskId]: !prev[taskId] }));
  };

  // Filter tasks
  const filteredTasks = tasks.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.domain.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.claimsQueue || []).some((c) =>
        c.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.studentEmail.toLowerCase().includes(searchQuery.toLowerCase())
      );

    const matchesStatus =
      filterStatus === 'all'
        ? true
        : filterStatus === 'active'
        ? t.status === 'active'
        : t.status === 'closed';

    return matchesSearch && matchesStatus;
  });

  const totalClaimsCount = tasks.reduce((acc, t) => acc + (t.claimsQueue?.length || 0), 0);
  const activeDirectivesCount = tasks.filter((t) => t.status === 'active').length;

  return (
    <div className="w-full flex flex-col gap-6 animate-in fade-in duration-200">
      {/* ================= CLEAN HEADER ================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold font-display text-white">
              Task Directives & Queue Management
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-[#E50920]/20 text-[#E50920] border border-[#E50920]/30 text-[10px] font-mono uppercase font-bold tracking-wider">
              Coordinator Authority
            </span>
          </div>
          <p className="text-xs font-mono text-zinc-400 mt-1">
            Broadcast engineering milestones open to all students with real-time queue slot tracking
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            title="Refresh Directives"
          >
            <RefreshCw className={`w-4 h-4 text-[#E50920] ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2 rounded-lg bg-[#E50920] hover:bg-[#ff1e38] text-white text-xs font-mono font-medium transition-all shadow-md shadow-[#E50920]/30 flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Issue Task Directive</span>
          </button>
        </div>
      </div>

      {/* ================= STATS TELEMETRY ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className={`p-4 rounded-xl border backdrop-blur-2xl shadow-lg ${
          theme === 'light'
            ? 'bg-white/95 border-black/10 shadow-black/5'
            : 'bg-[#0B0C10] border-white/10 shadow-black/60'
        }`}>
          <div className="flex items-center justify-between text-xs font-mono text-zinc-400 mb-1.5">
            <span>Active Directives</span>
            <Layers className="w-4 h-4 text-[#E50920]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-bold font-display ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>{activeDirectivesCount}</span>
            <span className="text-xs font-mono text-zinc-500">of {tasks.length} total</span>
          </div>
        </div>

        <div className={`p-4 rounded-xl border backdrop-blur-2xl shadow-lg ${
          theme === 'light'
            ? 'bg-white/95 border-black/10 shadow-black/5'
            : 'bg-[#0B0C10] border-white/10 shadow-black/60'
        }`}>
          <div className="flex items-center justify-between text-xs font-mono text-zinc-400 mb-1.5">
            <span>Total Claimed Slots</span>
            <Users className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-bold font-display ${theme === 'light' ? 'text-zinc-900' : 'text-white'}`}>{totalClaimsCount}</span>
            <span className={`text-xs font-mono ${theme === 'light' ? 'text-emerald-600 font-semibold' : 'text-emerald-400'}`}>across active queues</span>
          </div>
        </div>

        <div className={`p-4 rounded-xl border backdrop-blur-2xl shadow-lg ${
          theme === 'light'
            ? 'bg-white/95 border-black/10 shadow-black/5'
            : 'bg-[#0B0C10] border-white/10 shadow-black/60'
        }`}>
          <div className="flex items-center justify-between text-xs font-mono text-zinc-400 mb-1.5">
            <span>Queue Status</span>
            <ListOrdered className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-base font-bold font-mono ${theme === 'light' ? 'text-amber-600' : 'text-amber-300'}`}>Queue Active</span>
            <span className="text-xs font-mono text-zinc-500">Automated Dispatch</span>
          </div>
        </div>
      </div>

      {/* ================= NOTIFICATIONS ================= */}
      {error && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between gap-3 text-xs font-mono text-rose-300 animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')} className="p-1 hover:text-white cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {successMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-3 text-xs font-mono text-emerald-300 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage('')} className="p-1 hover:text-white cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ================= SEARCH & FILTER CONTROLS ================= */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search directives, domains, or claimed students..."
            className={`w-full pl-9 pr-4 py-2 rounded-xl border text-xs font-mono focus:outline-none focus:border-[#E50920] transition-colors ${
              theme === 'light'
                ? 'bg-white border-black/15 text-zinc-900 placeholder-zinc-400'
                : 'bg-[#0B0C10] border-white/10 text-white placeholder-zinc-500'
            }`}
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-zinc-500" />
          <span className={`text-xs font-mono ${theme === 'light' ? 'text-zinc-600' : 'text-zinc-400'}`}>Filter:</span>
          {(['all', 'active', 'closed'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1 rounded-lg text-xs font-mono uppercase transition-colors cursor-pointer ${
                filterStatus === st
                  ? theme === 'light'
                    ? 'bg-black/10 text-zinc-900 font-semibold border border-black/15 shadow-sm'
                    : 'bg-white/15 text-white font-semibold border border-white/20'
                  : theme === 'light'
                  ? 'bg-black/5 text-zinc-600 hover:text-black hover:bg-black/10'
                  : 'bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* ================= DIRECTIVES LIST ================= */}
      {filteredTasks.length === 0 ? (
        <div className={`p-12 text-center rounded-xl border backdrop-blur-2xl shadow-xl ${
          theme === 'light'
            ? 'bg-white/95 border-black/10 shadow-black/5'
            : 'bg-[#0B0C10] border-white/10 shadow-black/60'
        }`}>
          <ListOrdered className={`w-10 h-10 mx-auto mb-3 ${theme === 'light' ? 'text-zinc-400' : 'text-zinc-600'}`} />
          <p className={`text-sm font-mono ${theme === 'light' ? 'text-zinc-800' : 'text-zinc-300'}`}>No task directives found.</p>
          <p className={`text-xs font-mono mt-1 ${theme === 'light' ? 'text-zinc-500' : 'text-zinc-500'}`}>
            Click &ldquo;Issue Task Directive&rdquo; above to publish your first open-to-all milestone.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredTasks.map((task) => {
            const claims = task.claimsQueue || [];
            const capacity = task.maxClaims !== undefined ? task.maxClaims : 5;
            const isFull = capacity > 0 && claims.length >= capacity;
            const isExpanded = !!expandedQueues[task.id];
            const percentFilled = capacity > 0 ? Math.min(100, Math.round((claims.length / capacity) * 100)) : 0;

            return (
              <div
                key={task.id}
                className={`p-5 rounded-xl border transition-all ${
                  task.status === 'active'
                    ? theme === 'light'
                      ? 'bg-white/95 border-black/10 shadow-lg shadow-black/5 hover:border-black/20'
                      : 'border-white/10 bg-[#0B0C10] backdrop-blur-2xl shadow-xl shadow-black/60 hover:border-white/20'
                    : theme === 'light'
                    ? 'border-black/5 bg-zinc-50 opacity-90'
                    : 'border-white/5 bg-[#080808] opacity-85'
                }`}
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-white/10">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <h3 className="text-base font-bold font-display text-white">{task.title}</h3>

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

                      {/* Status Badge */}
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-mono uppercase font-semibold ${
                          task.status === 'active'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-zinc-500/20 text-zinc-400 border border-zinc-500/30'
                        }`}
                      >
                        {task.status}
                      </span>

                      {/* Open to All Badge */}
                      <span className="px-2 py-0.5 rounded-full bg-[#E50920]/15 text-[#E50920] border border-[#E50920]/30 text-[10px] font-mono font-bold flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5" />
                        <span>Open to All</span>
                      </span>
                    </div>

                    <p className="text-xs font-mono text-zinc-300 leading-relaxed mt-1">
                      {task.description}
                    </p>
                  </div>

                  {/* Top Action Buttons */}
                  <div className="flex items-center gap-1.5 shrink-0 self-start">
                    <button
                      onClick={() => handleToggleStatus(task)}
                      disabled={actionInProgressId === task.id}
                      className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-zinc-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
                      title={task.status === 'active' ? 'Close queue to new claims' : 'Reopen queue'}
                    >
                      {task.status === 'active' ? (
                        <>
                          <Lock className="w-3 h-3 text-amber-400" />
                          <span className="hidden sm:inline">Close</span>
                        </>
                      ) : (
                        <>
                          <Unlock className="w-3 h-3 text-emerald-400" />
                          <span className="hidden sm:inline">Reopen</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleOpenEditModal(task)}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                      title="Edit Directive"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleDeleteDirective(task.id)}
                      disabled={actionInProgressId === task.id}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-500/20 border border-white/10 hover:border-rose-500/30 text-zinc-400 hover:text-rose-400 transition-colors cursor-pointer"
                      title="Delete Directive"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Metadata & Queue Meter */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-3 border-b border-white/10 text-xs font-mono">
                  <div className="flex flex-wrap items-center gap-3 text-zinc-400">
                    <span>
                      Domain: <span className="text-[#E50920] font-semibold">{task.domain}</span>
                    </span>
                    <span>•</span>
                    <span>
                      Assigned By: <span className="text-zinc-200">{task.assignedByName}</span>
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

                  {/* Queue Capacity Progress Bar */}
                  <div className="flex flex-col gap-1.5 justify-center">
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-zinc-400 flex items-center gap-1.5">
                        <Users className="w-3 h-3 text-zinc-400" />
                        <span>Queue Capacity:</span>
                      </span>
                      <span className={isFull ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
                        {claims.length} / {capacity > 0 ? capacity : '∞'} Claimed {isFull && '(QUEUE FULL)'}
                      </span>
                    </div>

                    <div className="w-full bg-black/50 rounded-full h-1.5 overflow-hidden border border-white/10">
                      <div
                        className={`h-full transition-all duration-300 ${
                          isFull
                            ? 'bg-rose-500'
                            : percentFilled > 70
                            ? 'bg-amber-400'
                            : 'bg-gradient-to-r from-[#E50920] to-emerald-400'
                        }`}
                        style={{ width: `${capacity > 0 ? percentFilled : 100}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Queue Accordion Trigger */}
                <div className="pt-3 flex items-center justify-between">
                  <button
                    onClick={() => toggleQueueExpanded(task.id)}
                    className="flex items-center gap-2 text-xs font-mono text-zinc-300 hover:text-white transition-colors cursor-pointer"
                  >
                    <ListOrdered className="w-3.5 h-3.5 text-[#E50920]" />
                    <span className="font-semibold">
                      Queue Order ({claims.length} Student{claims.length !== 1 ? 's' : ''})
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-3.5 h-3.5 text-zinc-400" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
                    )}
                  </button>

                  <span className="text-[11px] font-mono text-zinc-500">
                    Status: Live Queue
                  </span>
                </div>

                {/* FCFS Queue Roster */}
                {isExpanded && (
                  <div className="mt-3 p-3.5 rounded-xl bg-black/40 border border-white/10 flex flex-col gap-2.5 animate-in fade-in duration-150">
                    {claims.length === 0 ? (
                      <p className="text-xs font-mono text-zinc-500 text-center py-3">
                        Queue is currently empty. Directives are open to all students on an open queue claim basis.
                      </p>
                    ) : (
                      <div className="divide-y divide-white/5">
                        {claims.map((claim, idx) => (
                          <div
                            key={claim.studentId + idx}
                            className="py-2.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono"
                          >
                            <div className="flex items-center gap-3">
                              {/* Position Badge */}
                              <div className="w-6 h-6 rounded-full bg-[#E50920]/20 border border-[#E50920]/40 text-[#E50920] font-bold text-[11px] flex items-center justify-center shrink-0">
                                #{idx + 1}
                              </div>

                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-white font-display">
                                    {claim.studentName}
                                  </span>
                                  {/* Online / Offline status dot badge */}
                                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono">
                                    <span
                                      className={`w-2 h-2 rounded-full ${
                                        ((claim.studentId && onlineUserIds.includes(claim.studentId)) || claim.isOnline)
                                          ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)] animate-pulse'
                                          : 'bg-rose-500'
                                      }`}
                                    />
                                    <span
                                      className={
                                        ((claim.studentId && onlineUserIds.includes(claim.studentId)) || claim.isOnline)
                                          ? 'text-emerald-400 font-semibold'
                                          : 'text-zinc-500'
                                      }
                                    >
                                      {((claim.studentId && onlineUserIds.includes(claim.studentId)) || claim.isOnline)
                                        ? 'Online'
                                        : 'Offline'}
                                    </span>
                                  </span>
                                  <span className="text-[10px] text-zinc-500">
                                    ({claim.studentEmail})
                                  </span>
                                  {claim.status === 'submitted' && (
                                    <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 text-[9px] border border-emerald-500/30">
                                      Project Submitted
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] text-zinc-400 mt-0.5">
                                  Claimed at: {new Date(claim.claimedAt).toLocaleString()} • {claim.department || 'CSE'}
                                </div>
                              </div>
                            </div>

                            <button
                              onClick={() => handleReleaseStudentClaim(task.id, claim.studentId, claim.studentName)}
                              className="self-end sm:self-auto px-2 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-[11px] transition-colors cursor-pointer flex items-center gap-1"
                              title="Release student claim and free slot"
                            >
                              <UserX className="w-3 h-3" />
                              <span>Release Slot</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ================= CREATE / EDIT MODAL ================= */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-xl rounded-2xl border border-white/15 bg-[#0F0F12] shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#E50920] flex items-center justify-center text-white">
                  <ListOrdered className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold font-display text-white">
                    {editingTaskId ? 'Edit Task Directive' : 'Issue New Task Directive'}
                  </h3>
                  <p className="text-[11px] font-mono text-zinc-400">
                    Open to all students with queue capacity tracking
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveDirective} className="space-y-4">
              {/* Directive Title */}
              <div>
                <label className="block text-xs font-mono text-zinc-300 mb-1">
                  Directive Title <span className="text-[#E50920]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Distributed WebSocket State Synchronizer"
                  className="w-full px-3.5 py-2 rounded-xl bg-black/50 border border-white/15 text-xs font-mono text-white placeholder-zinc-500 focus:outline-none focus:border-[#E50920] transition-colors"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-mono text-zinc-300 mb-1">
                  Description & Engineering Deliverables <span className="text-[#E50920]">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detail the technical milestones, expected stack, GitHub repository benchmarks, and completion criteria..."
                  className="w-full px-3.5 py-2 rounded-xl bg-black/50 border border-white/15 text-xs font-mono text-white placeholder-zinc-500 focus:outline-none focus:border-[#E50920] transition-colors resize-none"
                />
              </div>

              {/* Domain & Priority Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Domain */}
                <div>
                  <label className="block text-xs font-mono text-zinc-300 mb-1">
                    Engineering Track / Domain
                  </label>
                  <select
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-black/50 border border-white/15 text-xs font-mono text-white focus:outline-none focus:border-[#E50920] transition-colors"
                  >
                    {PRESET_DOMAINS.map((d) => (
                      <option key={d} value={d} className="bg-zinc-900 text-white">
                        {d}
                      </option>
                    ))}
                    <option value="Other" className="bg-zinc-900 text-white">
                      Other (Custom Track)
                    </option>
                  </select>

                  {domain === 'Other' && (
                    <input
                      type="text"
                      placeholder="Enter custom domain..."
                      value={customDomain}
                      onChange={(e) => setCustomDomain(e.target.value)}
                      className="w-full mt-2 px-3.5 py-1.5 rounded-lg bg-black/50 border border-white/15 text-xs font-mono text-white placeholder-zinc-500 focus:outline-none focus:border-[#E50920]"
                    />
                  )}
                </div>

                {/* Priority */}
                <div>
                  <label className="block text-xs font-mono text-zinc-300 mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full px-3.5 py-2 rounded-xl bg-black/50 border border-white/15 text-xs font-mono text-white focus:outline-none focus:border-[#E50920] transition-colors"
                  >
                    <option value="normal" className="bg-zinc-900 text-white">Normal</option>
                    <option value="high" className="bg-zinc-900 text-white">High Priority</option>
                    <option value="urgent" className="bg-zinc-900 text-white">Urgent</option>
                  </select>
                </div>
              </div>

              {/* Queue Capacity & Due Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Queue Max Claims */}
                <div>
                  <label className="block text-xs font-mono text-zinc-300 mb-1">
                    Queue Capacity (Max Claim Slots)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={maxClaims}
                      onChange={(e) => setMaxClaims(Number(e.target.value))}
                      className="w-full px-3.5 py-2 rounded-xl bg-black/50 border border-white/15 text-xs font-mono text-white focus:outline-none focus:border-[#E50920] transition-colors"
                    />
                    <div className="flex gap-1">
                      {[1, 3, 5, 10].map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setMaxClaims(n)}
                          className={`px-2 py-1 rounded text-[11px] font-mono cursor-pointer ${
                            maxClaims === n
                              ? 'bg-[#E50920] text-white font-bold'
                              : 'bg-white/5 text-zinc-400 hover:text-white'
                          }`}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-500 mt-1 block">
                    First {maxClaims} students to claim will enter the active queue.
                  </span>
                </div>

                {/* Due Date */}
                <div>
                  <label className="block text-xs font-mono text-zinc-300 mb-1">
                    Submission Due Date
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-black/50 border border-white/15 text-xs font-mono text-white focus:outline-none focus:border-[#E50920] transition-colors"
                  />
                </div>
              </div>

              {/* Open to All Toggle Card */}
              <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-white font-mono flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#E50920]" />
                    <span>Open to All Students</span>
                  </h4>
                  <p className="text-[11px] font-mono text-zinc-400 mt-0.5">
                    Broadcasts this directive to the student portal where any student can claim a slot in queue order.
                  </p>
                </div>

                <input
                  type="checkbox"
                  checked={isOpenToAll}
                  onChange={(e) => setIsOpenToAll(e.target.checked)}
                  className="w-4 h-4 accent-[#E50920] cursor-pointer"
                />
              </div>

              {/* Coordinator Signature Notice */}
              <div className="text-[11px] font-mono text-zinc-400 flex items-center gap-2">
                <Shield className="w-3.5 h-3.5 text-zinc-500" />
                <span>
                  Directive will be signed by: <strong className="text-white">{currentUser.fullName}</strong> (Coordinator)
                </span>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-mono text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-[#E50920] hover:bg-[#ff1e38] text-white text-xs font-mono font-medium transition-all shadow-md shadow-[#E50920]/30 cursor-pointer flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Publishing...</span>
                    </>
                  ) : (
                    <span>{editingTaskId ? 'Save Changes' : 'Publish Task Directive'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
