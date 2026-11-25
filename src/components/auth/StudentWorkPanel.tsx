import React, { useState, useEffect } from 'react';
import {
  FolderGit2,
  ExternalLink,
  Github,
  CheckCircle2,
  AlertTriangle,
  Clock,
  MessageSquare,
  Search,
  Filter,
  RefreshCw,
  Send,
  X,
  Code2,
} from 'lucide-react';

interface StudentSubmission {
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
  updatedAt?: string;
}

interface StudentWorkPanelProps {
  token: string;
  currentUser?: {
    id?: string;
    fullName?: string;
    email?: string;
    role?: string;
  } | null;
  onCountUpdate?: (pendingCount: number) => void;
}

export const StudentWorkPanel: React.FC<StudentWorkPanelProps> = ({ token, currentUser, onCountUpdate }) => {
  const [submissions, setSubmissions] = useState<StudentSubmission[]>([]);
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'pending' | 'approved' | 'changes_requested'>('all');

  // Review Modal State
  const [reviewingSubmission, setReviewingSubmission] = useState<StudentSubmission | null>(null);
  const [reviewStatus, setReviewStatus] = useState<'approved' | 'changes_requested' | 'pending'>('approved');
  const [reviewFeedback, setReviewFeedback] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Auto-dismiss success notification
  useEffect(() => {
    if (!successMessage) return;
    const timer = setTimeout(() => setSuccessMessage(''), 5000);
    return () => clearTimeout(timer);
  }, [successMessage]);

  const fetchSubmissions = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/coordinator/student-updates', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setSubmissions(data.updates);
        if (onCountUpdate) {
          const pending = (data.updates || []).filter((u: StudentSubmission) => u.status === 'pending').length;
          onCountUpdate(pending);
        }
      } else {
        setError(data.message || 'Failed to fetch student project updates.');
      }
    } catch (err: any) {
      setError(err.message || 'Error connecting to server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, [token]);

  const handleManualRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    const minSpinPromise = new Promise((resolve) => setTimeout(resolve, 1000));
    try {
      await Promise.all([fetchSubmissions(), minSpinPromise]);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleOpenReview = (submission: StudentSubmission) => {
    setReviewingSubmission(submission);
    setReviewStatus(submission.status);
    setReviewFeedback(submission.coordinatorFeedback || '');
  };

  const handleSaveReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewingSubmission) return;

    setSubmittingReview(true);
    try {
      const reviewerName = currentUser?.fullName || currentUser?.email || (() => {
        try {
          const saved = localStorage.getItem('ccs_current_user');
          if (saved) {
            const p = JSON.parse(saved);
            return p.fullName || p.email;
          }
        } catch {}
        return 'Coordinator';
      })();

      const res = await fetch(`/api/coordinator/student-updates/${reviewingSubmission.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: reviewStatus,
          coordinatorFeedback: reviewFeedback.trim(),
          coordinatorName: reviewerName,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccessMessage(`Project review updated: ${reviewingSubmission.projectTitle}`);
        setReviewingSubmission(null);
        fetchSubmissions();
      } else {
        alert(data.message || 'Failed to update review status.');
      }
    } catch (err: any) {
      alert(err.message || 'Error submitting review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const filteredSubmissions = submissions.filter((sub) => {
    const matchesFilter = selectedFilter === 'all' || sub.status === selectedFilter;
    const matchesSearch =
      sub.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.projectTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.domain.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.department.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const pendingCount = submissions.filter((s) => s.status === 'pending').length;
  const approvedCount = submissions.filter((s) => s.status === 'approved').length;
  const changesCount = submissions.filter((s) => s.status === 'changes_requested').length;

  return (
    <div className="w-full space-y-6">
      {/* ---------------- Header & Metrics Bar ---------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl glass-panel border border-white/10 shadow-lg shadow-black/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-zinc-400">Total Submissions</span>
            <FolderGit2 className="w-4 h-4 text-zinc-400" />
          </div>
          <p className="text-2xl font-bold font-display text-white mt-1">{submissions.length}</p>
          <span className="text-[10px] font-mono text-zinc-500">Across all engineering tracks</span>
        </div>

        <div className="p-4 rounded-2xl glass-panel border border-amber-500/20 bg-amber-500/5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-amber-300">Needs Review</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold font-display text-amber-400 mt-1">{pendingCount}</p>
          <span className="text-[10px] font-mono text-amber-400/70">Awaiting coordinator feedback</span>
        </div>

        <div className="p-4 rounded-2xl glass-panel border border-emerald-500/20 bg-emerald-500/5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-emerald-300">Approved Projects</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold font-display text-emerald-400 mt-1">{approvedCount}</p>
          <span className="text-[10px] font-mono text-emerald-400/70">Staging & production ready</span>
        </div>
      </div>

      {/* ---------------- Search & Filter Bar ---------------- */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-2xl glass-panel border border-white/10">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by student, project title, or domain..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#E50920] font-mono"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setSelectedFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono transition-all cursor-pointer ${
              selectedFilter === 'all'
                ? 'bg-[#E50920] text-white font-semibold shadow-md'
                : 'glass-panel text-zinc-400 hover:text-white'
            }`}
          >
            All ({submissions.length})
          </button>
          <button
            onClick={() => setSelectedFilter('pending')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono transition-all cursor-pointer ${
              selectedFilter === 'pending'
                ? 'bg-amber-500 text-black font-semibold shadow-md'
                : 'glass-panel text-zinc-400 hover:text-amber-300'
            }`}
          >
            Pending ({pendingCount})
          </button>
          <button
            onClick={() => setSelectedFilter('approved')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono transition-all cursor-pointer ${
              selectedFilter === 'approved'
                ? 'bg-emerald-500 text-black font-semibold shadow-md'
                : 'glass-panel text-zinc-400 hover:text-emerald-300'
            }`}
          >
            Approved ({approvedCount})
          </button>
          <button
            onClick={() => setSelectedFilter('changes_requested')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono transition-all cursor-pointer ${
              selectedFilter === 'changes_requested'
                ? 'bg-rose-500 text-white font-semibold shadow-md'
                : 'glass-panel text-zinc-400 hover:text-rose-300'
            }`}
          >
            Revisions ({changesCount})
          </button>

          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="p-2 rounded-xl glass-panel text-zinc-400 hover:text-white transition-colors cursor-pointer"
            title="Refresh Submissions"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#E50920] ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-mono flex items-center justify-between">
          <span>✓ {successMessage}</span>
          <button onClick={() => setSuccessMessage('')} className="text-emerald-400 hover:text-white">✕</button>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-mono flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ---------------- Submissions List ---------------- */}
      {loading && submissions.length === 0 ? (
        <div className="py-16 text-center text-zinc-400 font-mono text-xs flex flex-col items-center gap-2">
          <RefreshCw className="w-5 h-5 animate-spin text-[#E50920]" />
          <span>Loading student work submissions from cloud cluster...</span>
        </div>
      ) : filteredSubmissions.length === 0 ? (
        <div className="py-16 text-center text-zinc-500 font-mono text-xs glass-panel rounded-3xl border border-white/10">
          No project updates matching this filter.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredSubmissions.map((sub) => {
            const isPending = sub.status === 'pending';
            const isApproved = sub.status === 'approved';
            const isRevision = sub.status === 'changes_requested';

            return (
              <div
                key={sub.id}
                className="p-5 rounded-3xl glass-panel border border-white/10 hover:border-white/20 transition-all shadow-xl shadow-black/40 flex flex-col gap-4 relative overflow-hidden"
              >
                {/* Status Indicator Stripe */}
                <div
                  className={`absolute top-0 left-0 bottom-0 w-1 ${
                    isApproved ? 'bg-emerald-500' : isRevision ? 'bg-rose-500' : 'bg-amber-500'
                  }`}
                />

                {/* Top Row: Title, Domain, Status Badge */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="pl-2">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-zinc-300">
                        {sub.domain}
                      </span>
                      <span className="text-[10px] font-mono text-zinc-500">
                        Submitted {new Date(sub.submittedAt).toLocaleDateString()}
                      </span>
                    </div>

                    <h3 className="text-base sm:text-lg font-bold font-display text-white">
                      {sub.projectTitle}
                    </h3>

                    <div className="flex items-center gap-2 text-xs font-mono text-zinc-400 mt-0.5">
                      <span className="text-zinc-200 font-medium">{sub.studentName}</span>
                      <span>•</span>
                      <span className="text-zinc-400">{sub.department}</span>
                    </div>
                  </div>

                  {/* Status Badge & Review Button */}
                  <div className="flex items-center gap-2 self-start sm:self-auto pl-2 sm:pl-0">
                    <span
                      className={`text-[10px] font-mono uppercase tracking-wider px-2.5 py-1 rounded-full font-semibold border ${
                        isApproved
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                          : isRevision
                          ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                          : 'bg-amber-500/15 text-amber-400 border-amber-500/30 animate-pulse'
                      }`}
                    >
                      {sub.status.replace('_', ' ')}
                    </span>

                    <button
                      onClick={() => handleOpenReview(sub)}
                      className="px-3 py-1 rounded-full bg-white/5 hover:bg-[#E50920]/20 border border-white/10 hover:border-[#E50920]/40 text-xs font-mono text-zinc-300 hover:text-white transition-all cursor-pointer"
                    >
                      Review
                    </button>
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-zinc-300 font-sans pl-2 leading-relaxed">
                  {sub.description}
                </p>

                {/* Progress Bar */}
                <div className="pl-2 space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
                    <span>Implementation Milestone</span>
                    <span className="text-white font-semibold">{sub.progressPercent}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-black/60 overflow-hidden border border-white/10">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isApproved ? 'bg-emerald-500' : 'bg-gradient-to-r from-[#E50920] to-[#ff4d61]'
                      }`}
                      style={{ width: `${sub.progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* Coordinator Feedback Box (if present) */}
                {sub.coordinatorFeedback && (
                  <div className="ml-2 p-3 rounded-2xl bg-black/50 border border-white/10 flex items-start gap-2.5 text-xs font-mono">
                    <MessageSquare className="w-3.5 h-3.5 text-[#E50920] shrink-0 mt-0.5" />
                    <div>
                      <span className="text-zinc-400 text-[10px] block uppercase tracking-wider font-semibold">
                        {sub.coordinatorName ? `${sub.coordinatorName} (Coordinator):` : 'Coordinator:'}
                      </span>
                      <p className="text-zinc-200 mt-0.5">{sub.coordinatorFeedback}</p>
                    </div>
                  </div>
                )}

                {/* Bottom Action Links */}
                <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-white/5 pl-2 text-xs font-mono">
                  {sub.githubUrl && (
                    <a
                      href={sub.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-zinc-400 hover:text-white transition-colors"
                    >
                      <Github className="w-3.5 h-3.5" />
                      <span>Repository</span>
                      <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                    </a>
                  )}

                  {sub.demoUrl && (
                    <a
                      href={sub.demoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-[#E50920] hover:text-white transition-colors"
                    >
                      <Code2 className="w-3.5 h-3.5" />
                      <span>Live Demo</span>
                      <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                    </a>
                  )}

                  <span className="text-zinc-600 ml-auto text-[10px]">
                    Contact: {sub.studentEmail}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ---------------- Review Modal ---------------- */}
      {reviewingSubmission && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative w-full max-w-lg p-6 sm:p-7 rounded-3xl glass-panel-elevated border border-white/15 bg-black/90 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
              <div>
                <h3 className="text-base font-bold font-display text-white uppercase">
                  Review Submission
                </h3>
                <p className="text-xs font-mono text-zinc-400 truncate max-w-xs">
                  {reviewingSubmission.projectTitle}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setReviewingSubmission(null)}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveReview} className="space-y-4">
              {/* Status Selector */}
              <div>
                <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block mb-2">
                  Evaluation Verdict
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setReviewStatus('approved')}
                    className={`py-2 px-3 rounded-xl border text-xs font-mono transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      reviewStatus === 'approved'
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50 font-semibold'
                        : 'glass-panel text-zinc-400 hover:text-white border-white/10'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Approve</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setReviewStatus('changes_requested')}
                    className={`py-2 px-3 rounded-xl border text-xs font-mono transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      reviewStatus === 'changes_requested'
                        ? 'bg-rose-500/20 text-rose-400 border-rose-500/50 font-semibold'
                        : 'glass-panel text-zinc-400 hover:text-white border-white/10'
                    }`}
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                    <span>Request Changes</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setReviewStatus('pending')}
                    className={`py-2 px-3 rounded-xl border text-xs font-mono transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      reviewStatus === 'pending'
                        ? 'bg-amber-500/20 text-amber-400 border-amber-500/50 font-semibold'
                        : 'glass-panel text-zinc-400 hover:text-white border-white/10'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Under Review</span>
                  </button>
                </div>
              </div>

              {/* Feedback Note */}
              <div>
                <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block mb-1">
                  Coordinator Feedback / Directive
                </label>
                <textarea
                  value={reviewFeedback}
                  onChange={(e) => setReviewFeedback(e.target.value)}
                  rows={4}
                  placeholder="Provide constructive feedback, notes for merge, or recommendations for staging deployment..."
                  className="w-full p-3 rounded-xl bg-black/60 border border-white/15 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#E50920] font-sans"
                />
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setReviewingSubmission(null)}
                  className="px-4 py-2 rounded-xl glass-panel text-xs font-mono text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#E50920] to-[#B20718] hover:from-[#ff1e38] hover:to-[#E50920] text-white text-xs font-semibold font-mono tracking-wider shadow-md transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  {submittingReview ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  <span>Save Verdict</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
