import React, { useState, useEffect } from 'react';
import { Megaphone, X, Clock, Sparkles, CheckCircle2 } from 'lucide-react';

interface AnnouncementItem {
  id: string;
  message: string;
  target?: string;
  authorName?: string;
  createdAt: string;
}

export const FloatingAnnouncement: React.FC = () => {
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [seenIds, setSeenIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('ccs_seen_announcement_ids');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const fetchAnnouncements = async () => {
    try {
      // Check user role to fetch targeted announcements
      let targetQuery = 'public';
      try {
        const userStr = localStorage.getItem('ccs_current_user');
        if (userStr) {
          const u = JSON.parse(userStr);
          if (u.role === 'student') targetQuery = 'students';
        }
      } catch {}

      const res = await fetch(`/api/announcements?target=${targetQuery}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.announcements)) {
        setAnnouncements(data.announcements);
      }
    } catch {
      // Fail silently if offline
    }
  };

  useEffect(() => {
    fetchAnnouncements();
    // Poll every 5 seconds to catch live updates from coordinators
    const interval = setInterval(fetchAnnouncements, 5000);
    return () => clearInterval(interval);
  }, []);

  // Compute how many announcements have NOT been seen yet
  const unreadCount = announcements.filter((a) => !seenIds.includes(a.id)).length;

  const markAllAsSeen = () => {
    if (announcements.length === 0) return;
    const allIds = announcements.map((a) => a.id);
    const updated = Array.from(new Set([...seenIds, ...allIds]));
    setSeenIds(updated);
    try {
      localStorage.setItem('ccs_seen_announcement_ids', JSON.stringify(updated));
    } catch {}
  };

  const handleToggleOpen = () => {
    const nextState = !isOpen;
    setIsOpen(nextState);
    if (nextState) {
      // User opened the announcements panel -> mark as seen, clear unread badge
      markAllAsSeen();
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    markAllAsSeen();
  };

  const formatTimestamp = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return 'Recently';
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Recently';
    }
  };

  return (
    <div className="fixed right-5 sm:right-7 bottom-7 z-50 flex flex-col items-end">
      {/* ================= FLOATING EXPANDED ANNOUNCEMENTS CARD ================= */}
      {isOpen && (
        <div className="mb-3 w-[330px] sm:w-[390px] max-h-[500px] flex flex-col rounded-2xl glass-panel-elevated border border-white/15 bg-[#0A0A0C]/95 backdrop-blur-2xl shadow-2xl p-4 sm:p-5 relative overflow-hidden animate-in fade-in slide-in-from-bottom-3 duration-200">
          {/* Subtle top crimson glow border */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#E50920] to-transparent" />
          <div className="absolute top-0 right-0 w-36 h-24 bg-[#E50920]/15 rounded-full blur-2xl pointer-events-none" />

          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-white/10 relative z-10 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#E50920]/20 text-[#E50920] border border-[#E50920]/40 flex items-center justify-center shadow-sm">
                <Megaphone className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold font-display text-white uppercase tracking-wider">
                    Announcements
                  </h4>
                  {announcements.length > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-white/10 text-zinc-300 text-[10px] font-mono font-bold">
                      {announcements.length}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Live Society Feed
                </span>
              </div>
            </div>

            <button
              onClick={handleClose}
              className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Close Announcements"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Announcements Content */}
          <div className="py-3 overflow-y-auto space-y-3 relative z-10 pr-1 flex-1 max-h-[340px]">
            {announcements.length === 0 ? (
              <div className="py-10 text-center flex flex-col items-center justify-center gap-2 text-zinc-400">
                <CheckCircle2 className="w-9 h-9 text-emerald-400/80 mb-1" />
                <p className="text-xs font-mono font-semibold text-white">All caught up!</p>
                <p className="text-[11px] font-mono text-zinc-500">
                  No active broadcasts at this time.
                </p>
              </div>
            ) : (
              announcements.map((item, idx) => (
                <div
                  key={item.id || idx}
                  className="p-3.5 rounded-xl border border-white/10 bg-black/40 hover:border-white/20 transition-all flex flex-col gap-2 relative group"
                >
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="text-[#E50920] font-semibold flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      Broadcast #{announcements.length - idx}
                    </span>
                    <span className="text-zinc-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatTimestamp(item.createdAt)}
                    </span>
                  </div>

                  <p className="text-xs font-mono text-zinc-200 leading-relaxed whitespace-pre-wrap">
                    {item.message}
                  </p>

                  {item.authorName && (
                    <div className="text-[10px] font-mono text-zinc-500 pt-1 border-t border-white/5">
                      Posted by: <span className="text-zinc-400">{item.authorName}</span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="pt-2.5 border-t border-white/10 flex items-center justify-between text-[10px] font-mono text-zinc-500 relative z-10 shrink-0">
            <span>
              {announcements.length === 0
                ? '0 active updates'
                : `${announcements.length} live broadcast${announcements.length > 1 ? 's' : ''}`}
            </span>
            <button
              onClick={handleClose}
              className="text-[#E50920] hover:text-white transition-colors cursor-pointer font-medium"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* ================= FLOATING RIGHT ACTION BUTTON ================= */}
      {/* ALWAYS VISIBLE per specification */}
      <button
        onClick={handleToggleOpen}
        className={`relative flex items-center gap-2.5 p-3 sm:px-4 sm:py-3 rounded-full glass-panel-elevated border transition-all duration-300 cursor-pointer shadow-2xl group ${
          isOpen
            ? 'border-[#E50920] bg-black/95 shadow-[0_0_25px_rgba(229,9,32,0.5)] scale-105'
            : 'border-white/15 hover:border-[#E50920]/60 bg-[#0A0A0C]/95 hover:scale-105 shadow-[0_0_20px_rgba(0,0,0,0.7)]'
        }`}
        title={
          unreadCount > 0
            ? `${unreadCount} New Announcement${unreadCount > 1 ? 's' : ''}`
            : 'Announcements Feed'
        }
      >
        {/* Pulsing Beacon Dot: Red with ping when unread > 0, subtle emerald when all caught up */}
        <span className="relative flex h-2.5 w-2.5">
          {unreadCount > 0 ? (
            <>
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E50920] opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#E50920]" />
            </>
          ) : (
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400/80" />
          )}
        </span>

        {/* Megaphone Icon */}
        <Megaphone
          className={`w-4 h-4 transition-transform duration-200 ${
            isOpen
              ? 'text-[#E50920] rotate-12 scale-110'
              : unreadCount > 0
              ? 'text-white group-hover:scale-110'
              : 'text-zinc-300 group-hover:text-white group-hover:scale-110'
          }`}
        />

        {/* Text Label (shown on desktop) */}
        <span className="hidden sm:inline text-xs font-mono font-medium text-white tracking-wide">
          Announcements
        </span>

        {/* Numeric Badge (1, 2, 3...): ONLY shown when unreadCount > 0. When seen, this badge is completely gone! */}
        {unreadCount > 0 && (
          <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-[#E50920] text-white text-[11px] font-bold font-mono shadow-md animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>
    </div>
  );
};
