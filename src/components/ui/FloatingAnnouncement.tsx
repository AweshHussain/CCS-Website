import React, { useState, useEffect, useRef } from 'react';
import { Megaphone, X, Clock, Sparkles } from 'lucide-react';

interface AnnouncementItem {
  id: string;
  message: string;
  authorName?: string;
  createdAt: string;
}

export const FloatingAnnouncement: React.FC = () => {
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [hasNewUpdate, setHasNewUpdate] = useState<boolean>(false);
  const previousCountRef = useRef<number>(0);

  const fetchAnnouncements = async () => {
    try {
      const res = await fetch('/api/announcements');
      const data = await res.json();
      if (data.success && Array.isArray(data.announcements)) {
        const list = data.announcements;
        if (previousCountRef.current > 0 && list.length > previousCountRef.current) {
          // A new announcement arrived!
          setHasNewUpdate(true);
          setIsOpen(true);
        }
        previousCountRef.current = list.length;
        setAnnouncements(list);
      }
    } catch {
      // Fail silently if offline
    }
  };

  useEffect(() => {
    fetchAnnouncements();
    // Poll every 6 seconds so whenever coordinator posts or deletes an update, the count updates immediately
    const interval = setInterval(fetchAnnouncements, 6000);
    return () => clearInterval(interval);
  }, []);

  const count = announcements.length;

  // If no announcements exist, do not render clutter
  if (count === 0) {
    return null;
  }

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
                  <span className="px-1.5 py-0.2 rounded-full bg-[#E50920] text-white text-[10px] font-mono font-bold">
                    {count}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Live Society Feed
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                setIsOpen(false);
                setHasNewUpdate(false);
              }}
              className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Close Announcements"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Scrollable Announcements List */}
          <div className="py-3 overflow-y-auto space-y-3 relative z-10 pr-1 flex-1 max-h-[340px]">
            {announcements.map((item, idx) => (
              <div
                key={item.id || idx}
                className="p-3.5 rounded-xl border border-white/10 bg-black/40 hover:border-white/20 transition-all flex flex-col gap-2 relative group"
              >
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span className="text-[#E50920] font-semibold flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Update #{announcements.length - idx}
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
            ))}
          </div>

          {/* Footer */}
          <div className="pt-2.5 border-t border-white/10 flex items-center justify-between text-[10px] font-mono text-zinc-500 relative z-10 shrink-0">
            <span>{count} live broadcast{count > 1 ? 's' : ''}</span>
            <button
              onClick={() => {
                setIsOpen(false);
                setHasNewUpdate(false);
              }}
              className="text-[#E50920] hover:text-white transition-colors cursor-pointer font-medium"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* ================= FLOATING RIGHT ACTION BUTTON ================= */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          setHasNewUpdate(false);
        }}
        className={`relative flex items-center gap-2.5 p-3 sm:px-4 sm:py-3 rounded-full glass-panel-elevated border transition-all duration-300 cursor-pointer shadow-2xl group ${
          isOpen
            ? 'border-[#E50920] bg-black/90 shadow-[0_0_25px_rgba(229,9,32,0.45)]'
            : 'border-white/15 hover:border-[#E50920]/60 bg-[#0A0A0C]/95 hover:scale-105 shadow-[0_0_20px_rgba(0,0,0,0.7)]'
        }`}
        title={`${count} Active Announcement${count > 1 ? 's' : ''}`}
      >
        {/* Pulsing Beacon Dot */}
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E50920] opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#E50920]" />
        </span>

        {/* Megaphone Icon */}
        <Megaphone
          className={`w-4 h-4 transition-transform duration-200 ${
            isOpen ? 'text-[#E50920] rotate-12' : 'text-white group-hover:scale-110'
          }`}
        />

        {/* Text Label (shown on desktop) */}
        <span className="hidden sm:inline text-xs font-mono font-medium text-white tracking-wide">
          Announcements
        </span>

        {/* Numeric Badge (1, 2, 3...) per user specification */}
        <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-[#E50920] text-white text-[11px] font-bold font-mono shadow-md animate-pulse">
          {count}
        </span>
      </button>
    </div>
  );
};
