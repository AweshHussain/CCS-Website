import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  MessageSquare,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Filter,
  RefreshCw,
  Send,
  Building,
  User,
  Mail,
  ChevronDown,
  ChevronUp,
  Tag,
  ShieldAlert,
  Search,
  PlusCircle,
  X,
  FileText,
} from 'lucide-react';

export interface FacultyQuery {
  id: string;
  facultyName: string;
  facultyEmail: string;
  department: string;
  subject: string;
  message: string;
  priority: 'urgent' | 'advisory' | 'normal';
  category: string;
  status: 'open' | 'in_review' | 'resolved';
  coordinatorResponse?: string;
  createdAt: string;
  resolvedAt?: string;
}

interface FacultyQueriesPanelProps {
  token: string;
  onCountUpdate?: (openCount: number) => void;
}

export const FacultyQueriesPanel: React.FC<FacultyQueriesPanelProps> = ({
  token,
  onCountUpdate,
}) => {
  const [queries, setQueries] = useState<FacultyQuery[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'urgent' | 'advisory' | 'normal'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'in_review' | 'resolved'>('all');

  // Expanded query cards
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Resolution / Response Modal
  const [selectedQuery, setSelectedQuery] = useState<FacultyQuery | null>(null);
  const [responseStatus, setResponseStatus] = useState<'in_review' | 'resolved'>('resolved');
  const [responseText, setResponseText] = useState('');
  const [submittingResponse, setSubmittingResponse] = useState(false);

  // New Query Modal (Direct Memo)
  const [showNewQueryModal, setShowNewQueryModal] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [newPriority, setNewPriority] = useState<'urgent' | 'advisory' | 'normal'>('normal');
  const [newCategory, setNewCategory] = useState('Event Permission');
  const [submittingNewQuery, setSubmittingNewQuery] = useState(false);

  // Auto-dismiss success notification in 5 seconds
  useEffect(() => {
    if (!successMessage) return;
    const timer = setTimeout(() => {
      setSuccessMessage('');
    }, 5000);
    return () => clearTimeout(timer);
  }, [successMessage]);

  const fetchQueries = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/coordinator/faculty-queries', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        setQueries(data.queries || []);
        const openCount = (data.queries || []).filter(
          (q: FacultyQuery) => q.status === 'open' || q.status === 'in_review'
        ).length;
        if (onCountUpdate) onCountUpdate(openCount);
      } else {
        setError(data.message || 'Failed to load faculty queries.');
      }
    } catch (err: any) {
      setError(err.message || 'Error connecting to database server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueries();
  }, [token]);

  // Submit response or resolution
  const handleResolveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuery) return;
    if (!responseText.trim()) {
      setError('Please provide a coordinator reply or resolution remarks.');
      return;
    }

    setSubmittingResponse(true);
    setError('');
    try {
      const res = await fetch(`/api/coordinator/faculty-queries/${selectedQuery.id}/resolve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: responseStatus,
          coordinatorResponse: responseText,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccessMessage(`Faculty query updated to ${responseStatus.toUpperCase()} successfully.`);
        setSelectedQuery(null);
        setResponseText('');
        fetchQueries();
      } else {
        setError(data.message || 'Failed to update faculty query.');
      }
    } catch (err: any) {
      setError(err.message || 'Network error updating query.');
    } finally {
      setSubmittingResponse(false);
    }
  };

  // Create new advisory query/directive
  const handleCreateQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject.trim() || !newMessage.trim()) {
      setError('Subject and message content are required.');
      return;
    }

    setSubmittingNewQuery(true);
    setError('');
    try {
      const res = await fetch('/api/coordinator/faculty-queries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          subject: newSubject,
          message: newMessage,
          priority: newPriority,
          category: newCategory,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccessMessage('Faculty advisory query posted successfully.');
        setShowNewQueryModal(false);
        setNewSubject('');
        setNewMessage('');
        fetchQueries();
      } else {
        setError(data.message || 'Failed to submit directive.');
      }
    } catch (err: any) {
      setError(err.message || 'Network error submitting directive.');
    } finally {
      setSubmittingNewQuery(false);
    }
  };

  // Filter queries
  const filteredQueries = queries.filter((q) => {
    if (priorityFilter !== 'all' && q.priority !== priorityFilter) return false;
    if (statusFilter !== 'all' && q.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const term = searchQuery.toLowerCase();
      const matchSubject = q.subject?.toLowerCase().includes(term);
      const matchFaculty = q.facultyName?.toLowerCase().includes(term);
      const matchDept = q.department?.toLowerCase().includes(term);
      const matchCat = q.category?.toLowerCase().includes(term);
      if (!matchSubject && !matchFaculty && !matchDept && !matchCat) return false;
    }
    return true;
  });

  const urgentCount = queries.filter((q) => q.priority === 'urgent' && q.status !== 'resolved').length;
  const openCount = queries.filter((q) => q.status === 'open').length;
  const inReviewCount = queries.filter((q) => q.status === 'in_review').length;
  const resolvedCount = queries.filter((q) => q.status === 'resolved').length;

  return (
    <div className="w-full flex flex-col gap-6">
      {/* ---------------- Metrics Bar ---------------- */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl glass-panel-elevated border border-white/10 flex flex-col gap-1">
          <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
            <span>TOTAL QUERIES</span>
            <MessageSquare className="w-4 h-4 text-zinc-400" />
          </div>
          <span className="text-2xl font-bold font-display text-white">{queries.length}</span>
          <span className="text-[10px] font-mono text-zinc-500">From verified faculty</span>
        </div>

        <div className="p-4 rounded-2xl glass-panel-elevated border border-amber-500/20 bg-amber-500/5 flex flex-col gap-1">
          <div className="flex items-center justify-between text-xs font-mono text-amber-400">
            <span>ACTION REQUIRED</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <span className="text-2xl font-bold font-display text-amber-300">{openCount}</span>
          <span className="text-[10px] font-mono text-amber-400/70">Awaiting coordinator reply</span>
        </div>

        <div className="p-4 rounded-2xl glass-panel-elevated border border-rose-500/30 bg-rose-500/5 flex flex-col gap-1">
          <div className="flex items-center justify-between text-xs font-mono text-[#E50920]">
            <span>URGENT DIRECTIVES</span>
            <AlertTriangle className="w-4 h-4 text-[#E50920] animate-pulse" />
          </div>
          <span className="text-2xl font-bold font-display text-[#E50920]">{urgentCount}</span>
          <span className="text-[10px] font-mono text-rose-300/70">Priority action required</span>
        </div>

        <div className="p-4 rounded-2xl glass-panel-elevated border border-emerald-500/20 bg-emerald-500/5 flex flex-col gap-1">
          <div className="flex items-center justify-between text-xs font-mono text-emerald-400">
            <span>RESOLVED</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="text-2xl font-bold font-display text-emerald-300">{resolvedCount}</span>
          <span className="text-[10px] font-mono text-emerald-400/70">Coordinator closed</span>
        </div>
      </div>

      {/* Messages */}
      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-mono flex items-center justify-between">
          <span>✓ {successMessage}</span>
          <button onClick={() => setSuccessMessage('')} className="text-emerald-400 hover:text-white">✕</button>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-mono flex items-center justify-between">
          <span>⚠️ {error}</span>
          <button onClick={() => setError('')} className="text-rose-400 hover:text-white">✕</button>
        </div>
      )}

      {/* ---------------- Controls & Filters ---------------- */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-4 rounded-2xl glass-panel border border-white/10">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search faculty queries by topic, professor, department..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-black/40 border border-white/10 text-xs font-mono text-white placeholder-zinc-500 focus:outline-none focus:border-[#E50920] transition-colors"
          />
        </div>

        <div className="flex items-center flex-wrap gap-2">
          {/* Priority filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as any)}
            className="px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs font-mono text-zinc-300 focus:outline-none focus:border-[#E50920] cursor-pointer"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">🔴 Urgent</option>
            <option value="advisory">🟡 Advisory</option>
            <option value="normal">🔵 Normal</option>
          </select>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs font-mono text-zinc-300 focus:outline-none focus:border-[#E50920] cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="open">Open</option>
            <option value="in_review">In Review</option>
            <option value="resolved">Resolved</option>
          </select>

          <button
            onClick={() => setShowNewQueryModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#E50920] hover:bg-[#ff1e38] text-white text-xs font-mono font-semibold transition-all shadow-lg shadow-[#E50920]/20 cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Post Directive</span>
          </button>

          <button
            onClick={fetchQueries}
            disabled={loading}
            className="p-2 rounded-xl glass-panel text-zinc-400 hover:text-white hover:border-[#E50920]/40 transition-colors cursor-pointer"
            title="Refresh Queries"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#E50920]' : ''}`} />
          </button>
        </div>
      </div>

      {/* ---------------- Queries List ---------------- */}
      {filteredQueries.length === 0 ? (
        <div className="p-12 rounded-3xl glass-panel border border-white/10 text-center flex flex-col items-center justify-center gap-3">
          <GraduationCap className="w-12 h-12 text-zinc-600" />
          <h4 className="text-base font-bold font-display text-zinc-300">No Faculty Queries Found</h4>
          <p className="text-xs font-mono text-zinc-500 max-w-sm">
            {searchQuery || priorityFilter !== 'all' || statusFilter !== 'all'
              ? 'Try adjusting your search criteria or priority filter.'
              : 'All faculty communications and directives have been addressed!'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredQueries.map((query) => {
            const isExpanded = expandedId === query.id;

            return (
              <div
                key={query.id}
                className={`p-5 rounded-2xl glass-panel-elevated border transition-all duration-300 flex flex-col gap-4 ${
                  query.priority === 'urgent' && query.status !== 'resolved'
                    ? 'border-[#E50920]/60 bg-gradient-to-r from-[#E50920]/10 via-black/40 to-transparent shadow-lg shadow-[#E50920]/10'
                    : query.status === 'resolved'
                    ? 'border-emerald-500/20 bg-black/30 opacity-90'
                    : 'border-white/10 hover:border-[#E50920]/40'
                }`}
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    {/* Priority badge */}
                    {query.priority === 'urgent' ? (
                      <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider bg-rose-500/20 text-[#E50920] border border-rose-500/40 font-bold animate-pulse">
                        <AlertTriangle className="w-3 h-3" />
                        <span>URGENT</span>
                      </span>
                    ) : query.priority === 'advisory' ? (
                      <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold">
                        <Tag className="w-3 h-3" />
                        <span>ADVISORY</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider bg-sky-500/20 text-sky-300 border border-sky-500/40 font-semibold">
                        <MessageSquare className="w-3 h-3" />
                        <span>NORMAL</span>
                      </span>
                    )}

                    {/* Category */}
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-mono text-zinc-400 bg-white/5 border border-white/10">
                      {query.category || 'General Directive'}
                    </span>

                    {/* Status badge */}
                    {query.status === 'resolved' ? (
                      <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>RESOLVED</span>
                      </span>
                    ) : query.status === 'in_review' ? (
                      <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono text-amber-400 bg-amber-500/10 border border-amber-500/30">
                        <Clock className="w-3 h-3" />
                        <span>IN REVIEW</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono text-rose-400 bg-rose-500/10 border border-rose-500/30">
                        <AlertTriangle className="w-3 h-3" />
                        <span>OPEN</span>
                      </span>
                    )}
                  </div>

                  <span className="text-[11px] font-mono text-zinc-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(query.createdAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>

                {/* Subject and Faculty Info */}
                <div className="flex flex-col gap-1.5">
                  <h3 className="text-base sm:text-lg font-bold font-display text-white tracking-wide">
                    {query.subject}
                  </h3>

                  <div className="flex items-center gap-4 text-xs font-mono text-zinc-400 flex-wrap">
                    <span className="flex items-center gap-1 text-zinc-300 font-semibold">
                      <GraduationCap className="w-3.5 h-3.5 text-[#E50920]" />
                      {query.facultyName}
                    </span>
                    <span className="flex items-center gap-1 text-zinc-400">
                      <Mail className="w-3.5 h-3.5 text-zinc-500" />
                      {query.facultyEmail}
                    </span>
                    <span className="flex items-center gap-1 text-rose-200/70">
                      <Building className="w-3.5 h-3.5 text-zinc-500" />
                      {query.department}
                    </span>
                  </div>
                </div>

                {/* Query Message Body */}
                <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 text-xs font-mono text-zinc-300 leading-relaxed whitespace-pre-wrap">
                  {query.message}
                </div>

                {/* Coordinator Response (if present) */}
                {query.coordinatorResponse && (
                  <div className="p-4 rounded-xl bg-[#E50920]/10 border border-[#E50920]/30 flex flex-col gap-2">
                    <div className="flex items-center justify-between text-[11px] font-mono text-rose-300 font-semibold">
                      <span className="flex items-center gap-1.5">
                        <ShieldAlert className="w-3.5 h-3.5 text-[#E50920]" />
                        <span>COORDINATOR RESPONSE & VERDICT</span>
                      </span>
                      {query.resolvedAt && (
                        <span className="text-zinc-500 font-normal">
                          {new Date(query.resolvedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-mono text-zinc-200 whitespace-pre-wrap leading-relaxed">
                      {query.coordinatorResponse}
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/5">
                  <button
                    onClick={() => {
                      setSelectedQuery(query);
                      setResponseStatus(query.status === 'open' ? 'resolved' : query.status);
                      setResponseText(query.coordinatorResponse || '');
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-[#E50920] border border-white/10 hover:border-[#E50920] text-xs font-mono text-white transition-all cursor-pointer shadow-sm group"
                  >
                    <Send className="w-3.5 h-3.5 text-[#E50920] group-hover:text-white transition-colors" />
                    <span>{query.coordinatorResponse ? 'Update Response' : 'Review & Respond'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ---------------- Respond / Resolve Modal ---------------- */}
      {selectedQuery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-xl p-6 sm:p-7 rounded-3xl glass-panel-elevated border border-white/10 shadow-2xl bg-[#080808]/95 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedQuery(null)}
              className="absolute top-5 right-5 p-2 rounded-full text-zinc-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-xl bg-[#E50920]/20 text-[#E50920] border border-[#E50920]/30">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold font-display text-white">Faculty Query Resolution</h3>
                <p className="text-xs font-mono text-zinc-400">
                  {selectedQuery.facultyName} • {selectedQuery.department}
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 mb-4">
              <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block mb-1">
                Subject
              </span>
              <p className="text-sm font-semibold text-white mb-2">{selectedQuery.subject}</p>
              <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block mb-1">
                Faculty Note
              </span>
              <p className="text-xs font-mono text-zinc-300 leading-relaxed whitespace-pre-wrap">
                {selectedQuery.message}
              </p>
            </div>

            <form onSubmit={handleResolveSubmit} className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-mono uppercase text-zinc-400 tracking-wider block mb-2">
                  Update Inquiry Status
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setResponseStatus('in_review')}
                    className={`p-2.5 rounded-xl text-xs font-mono border transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      responseStatus === 'in_review'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-semibold'
                        : 'bg-black/30 border-white/10 text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>In Review</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setResponseStatus('resolved')}
                    className={`p-2.5 rounded-xl text-xs font-mono border transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      responseStatus === 'resolved'
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-semibold'
                        : 'bg-black/30 border-white/10 text-zinc-400 hover:text-white'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Resolved</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-mono uppercase text-zinc-400 tracking-wider block mb-1.5">
                  Coordinator Feedback & Action Plan
                </label>
                <textarea
                  rows={4}
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  placeholder="Detail your answer, approvals, venue bookings, or schedule adjustments for the faculty advisor..."
                  className="w-full p-3 rounded-xl bg-black/40 border border-white/10 text-xs font-mono text-white placeholder-zinc-500 focus:outline-none focus:border-[#E50920] transition-colors leading-relaxed"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setSelectedQuery(null)}
                  className="px-4 py-2 rounded-xl text-xs font-mono text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submittingResponse}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[#E50920] hover:bg-[#ff1e38] text-white text-xs font-mono font-semibold transition-all shadow-lg shadow-[#E50920]/30 cursor-pointer disabled:opacity-50"
                >
                  {submittingResponse ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Transmitting...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Transmit Response</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------- Post New Directive / Advisory Modal ---------------- */}
      {showNewQueryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-xl p-6 sm:p-7 rounded-3xl glass-panel-elevated border border-white/10 shadow-2xl bg-[#080808]/95 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowNewQueryModal(false)}
              className="absolute top-5 right-5 p-2 rounded-full text-zinc-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-xl bg-[#E50920]/20 text-[#E50920] border border-[#E50920]/30">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold font-display text-white">Broadcast Faculty Advisory / Directive</h3>
                <p className="text-xs font-mono text-zinc-400">Post a formal circular, lab booking, or academic directive</p>
              </div>
            </div>

            <form onSubmit={handleCreateQuery} className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-mono uppercase text-zinc-400 tracking-wider block mb-1.5">
                  Subject / Heading
                </label>
                <input
                  type="text"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  placeholder="e.g. Mandatory Lab Clearance for Hackathon Weekend"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-xs font-mono text-white placeholder-zinc-500 focus:outline-none focus:border-[#E50920] transition-colors"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-mono uppercase text-zinc-400 tracking-wider block mb-1.5">
                    Category
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs font-mono text-zinc-300 focus:outline-none focus:border-[#E50920] cursor-pointer"
                  >
                    <option value="Event Permission">Event Permission</option>
                    <option value="Budget & Sponsorship">Budget & Sponsorship</option>
                    <option value="Lab & Equipment Access">Lab & Equipment Access</option>
                    <option value="Curriculum Integration">Curriculum Integration</option>
                    <option value="General Directive">General Directive</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-mono uppercase text-zinc-400 tracking-wider block mb-1.5">
                    Priority Level
                  </label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs font-mono text-zinc-300 focus:outline-none focus:border-[#E50920] cursor-pointer"
                  >
                    <option value="normal">Normal (Routine Advisory)</option>
                    <option value="advisory">Advisory (Action Suggested)</option>
                    <option value="urgent">🔴 Urgent (Immediate Action)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-mono uppercase text-zinc-400 tracking-wider block mb-1.5">
                  Detailed Directive / Message
                </label>
                <textarea
                  rows={4}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Outline the full guidelines, guidelines adherence, requirements, or event permissions..."
                  className="w-full p-3 rounded-xl bg-black/40 border border-white/10 text-xs font-mono text-white placeholder-zinc-500 focus:outline-none focus:border-[#E50920] transition-colors leading-relaxed"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setShowNewQueryModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-mono text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submittingNewQuery}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[#E50920] hover:bg-[#ff1e38] text-white text-xs font-mono font-semibold transition-all shadow-lg shadow-[#E50920]/30 cursor-pointer disabled:opacity-50"
                >
                  {submittingNewQuery ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Posting...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Post Directive</span>
                    </>
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
