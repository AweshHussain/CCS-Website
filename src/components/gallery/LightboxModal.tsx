import React, { useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Calendar, Users, Clock, Tag } from 'lucide-react';
import { GalleryItem } from '../../types';

interface LightboxModalProps {
  item: GalleryItem | null;
  items: GalleryItem[];
  onClose: () => void;
  onSelect: (item: GalleryItem) => void;
}

export const LightboxModal: React.FC<LightboxModalProps> = ({
  item,
  items,
  onClose,
  onSelect,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!item) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
    };

    window.addEventListener('keydown', handleKeyDown);
    if (item) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [item, items]);

  if (!item) return null;

  const currentIndex = items.findIndex((i) => i.id === item.id);

  const handleNext = () => {
    const nextIdx = (currentIndex + 1) % items.length;
    onSelect(items[nextIdx]);
  };

  const handlePrev = () => {
    const prevIdx = (currentIndex - 1 + items.length) % items.length;
    onSelect(items[prevIdx]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 lg:p-10 select-none">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/90 backdrop-blur-2xl transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Lightbox Container */}
      <div className="lightbox-modal relative z-10 max-w-5xl w-full max-h-[90vh] glass-panel-elevated rounded-3xl border border-white/15 overflow-hidden flex flex-col shadow-2xl">
        {/* Top Control Bar */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-white/10 bg-black/40">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#E50920] animate-pulse" />
            <span className="text-xs font-mono uppercase tracking-widest text-zinc-300">
              {item.category}
            </span>
            <span className="text-zinc-600">|</span>
            <span className="text-xs font-mono text-zinc-500">
              {currentIndex + 1} / {items.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrev}
              className="p-2 rounded-full glass-panel hover:border-[#E50920]/40 text-zinc-300 hover:text-white transition-colors"
              title="Previous (Left Arrow)"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNext}
              className="p-2 rounded-full glass-panel hover:border-[#E50920]/40 text-zinc-300 hover:text-white transition-colors"
              title="Next (Right Arrow)"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-full glass-panel hover:bg-white/10 text-zinc-300 hover:text-white transition-colors ml-2"
              title="Close (ESC)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Image Display Area */}
        <div className="relative flex-1 min-h-[300px] sm:min-h-[420px] max-h-[58vh] bg-black/60 flex items-center justify-center p-4 overflow-hidden">
          <img
            src={item.image}
            alt={item.title}
            className="max-h-full max-w-full object-contain rounded-xl shadow-2xl"
          />
        </div>

        {/* Image Details Bar */}
        <div className="p-6 bg-gradient-to-t from-black/80 to-transparent border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="max-w-2xl">
            <h3 className="text-lg sm:text-xl font-bold font-display text-white mb-2">
              {item.title}
            </h3>
            <p className="text-xs sm:text-sm text-zinc-400 font-sans leading-relaxed">
              {item.description}
            </p>

            <div className="flex flex-wrap items-center gap-2 mt-3">
              {item.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/5 border border-white/5 text-zinc-400"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:items-end gap-2 text-xs font-mono text-zinc-400 shrink-0">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#E50920]" />
              <span>{item.date}</span>
            </div>
            {item.stats?.participants && (
              <div className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-zinc-400" />
                <span>{item.stats.participants}</span>
              </div>
            )}
            {item.stats?.duration && (
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-zinc-400" />
                <span>{item.stats.duration}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

