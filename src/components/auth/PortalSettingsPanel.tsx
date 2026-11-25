import React, { useState, useEffect } from 'react';
import {
  KeyRound,
  Mail,
  Megaphone,
  Radio,
  Save,
  RefreshCw,
  Trash2,
  Plus,
  Send,
  Clock,
  Sparkles,
  Globe,
  Users,
  GraduationCap,
} from 'lucide-react';

interface PortalSettings {
  societyName: string;
  announcementBanner: string;
  isBannerActive: boolean;
  submissionSeasonOpen: boolean;
  allowedRegistrationDomain: string;
  notifyOnStudentSubmission: boolean;
  notifyOnFacultyQuery: boolean;
  updatedAt?: string;
}

interface Announcement {
  id: string;
  message: string;
  target?: 'all' | 'public' | 'students' | 'teams';
  authorName?: string;
  createdAt: string;
}

interface PortalSettingsPanelProps {
  token: string;
  currentUser: {
    id: string;
    email: string;
    fullName: string;
    role: string;
    department: string;
  };
  onOpenChangePassword: () => void;
  onOpenChangeEmail: () => void;
}

export const PortalSettingsPanel: React.FC<PortalSettingsPanelProps> = ({
  token,
  currentUser,
  onOpenChangePassword,
  onOpenChangeEmail,
}) => {
  const [settings, setSettings] = useState<PortalSettings>({
    societyName: 'Code & Compute Society (CCS)',
    announcementBanner: '🚀 Hackathon Season 2026 Submissions are now officially open!',
    isBannerActive: true,
    submissionSeasonOpen: true,
    allowedRegistrationDomain: 'All Domains',
    notifyOnStudentSubmission: true,
    notifyOnFacultyQuery: true,
  });

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [newAnnouncementText, setNewAnnouncementText] = useState('');
  const [selectedTarget, setSelectedTarget] = useState<'all' | 'public' | 'students' | 'teams'>('all');
  const [filterTarget, setFilterTarget] = useState<'any' | 'all' | 'public' | 'students' | 'teams'>('any');
  const [postingAnnouncement, setPostingAnnouncement] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState('');
  const [settingsError, setSettingsError] = useState('');

  useEffect(() => {
    if (!settingsSuccess) return;
    const timer = setTimeout(() => setSettingsSuccess(''), 5000);
    return () => clearTimeout(timer);
  }, [settingsSuccess]);

  const fetchSettings = async () => {
    setLoading(true);
    setSettingsError('');
    try {
      const res = await fetch('/api/coordinator/settings', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && data.settings) {
        setSettings({
          societyName: data.settings.societyName || 'Code & Compute Society (CCS)',
          announcementBanner:
            data.settings.announcementBanner || '🚀 Hackathon Season 2026 Submissions are now officially open!',
          isBannerActive: data.settings.isBannerActive ?? true,
          submissionSeasonOpen: data.settings.submissionSeasonOpen ?? true,
          allowedRegistrationDomain: data.settings.allowedRegistrationDomain || 'All Domains',
          notifyOnStudentSubmission: data.settings.notifyOnStudentSubmission ?? true,
          notifyOnFacultyQuery: data.settings.notifyOnFacultyQuery ?? true,
          updatedAt: data.settings.updatedAt,
        });
      }
    } catch (err: any) {
      setSettingsError(err.message || 'Error connecting to server.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAnnouncements = async () => {
    try {
      const res = await fetch('/api/coordinator/announcements', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.announcements)) {
        setAnnouncements(data.announcements);
      }
    } catch {
      // Ignore background refresh errors
    }
  };

  useEffect(() => {
    fetchSettings();
    fetchAnnouncements();
  }, [token]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    setSettingsError('');
    try {
      const res = await fetch('/api/coordinator/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (data.success) {
        setSettingsSuccess('Settings saved successfully.');
      } else {
        setSettingsError(data.message || 'Failed to update settings.');
      }
    } catch (err: any) {
      setSettingsError(err.message || 'Network error updating settings.');
    } finally {
      setSavingSettings(false);
    }
  };

  const handlePostAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnnouncementText.trim()) return;

    setPostingAnnouncement(true);
    setSettingsError('');
    try {
      const res = await fetch('/api/coordinator/announcements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: newAnnouncementText.trim(),
          target: selectedTarget,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setNewAnnouncementText('');
        fetchAnnouncements();
        setSettingsSuccess('New live update broadcasted successfully.');
      } else {
        setSettingsError(data.message || 'Failed to post update.');
      }
    } catch (err: any) {
      setSettingsError(err.message || 'Network error posting update.');
    } finally {
      setPostingAnnouncement(false);
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    setDeletingId(id);
    setSettingsError('');
    try {
      const res = await fetch(`/api/coordinator/announcements/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        setAnnouncements((prev) => prev.filter((a) => a.id !== id));
        setSettingsSuccess('Announcement removed.');
      } else {
        setSettingsError(data.message || 'Failed to delete announcement.');
      }
    } catch (err: any) {
      setSettingsError(err.message || 'Network error deleting announcement.');
    } finally {
      setDeletingId(null);
    }
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
    <div className="w-full flex flex-col gap-6 animate-in fade-in duration-200">
      {/* Clean Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div>
          <h2 className="text-xl font-bold font-display text-white">Coordinator Settings</h2>
          <p className="text-xs font-mono text-zinc-400 mt-0.5">
            Manage live broadcast announcements, account security, and operating preferences
          </p>
        </div>

        <button
          onClick={async () => {
            if (isRefreshing) return;
            setIsRefreshing(true);
            const minSpinPromise = new Promise((resolve) => setTimeout(resolve, 1000));
            try {
              await Promise.all([fetchSettings(), fetchAnnouncements(), minSpinPromise]);
            } finally {
              setIsRefreshing(false);
            }
          }}
          disabled={isRefreshing || loading}
          className="p-2 rounded-lg border border-white/10 hover:border-white/20 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          title="Refresh Settings"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-[#E50920] ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Notifications */}
      {settingsSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-mono flex items-center justify-between">
          <span>✓ {settingsSuccess}</span>
          <button onClick={() => setSettingsSuccess('')} className="text-emerald-400 hover:text-white">✕</button>
        </div>
      )}

      {settingsError && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-400 text-xs font-mono flex items-center justify-between">
          <span>⚠️ {settingsError}</span>
          <button onClick={() => setSettingsError('')} className="text-rose-400 hover:text-white">✕</button>
        </div>
      )}

      {/* ================= ROW 1: LIVE ANNOUNCEMENTS BROADCAST MANAGER ================= */}
      <div className="p-5 rounded-xl border border-white/10 bg-[#0B0C10]/92 backdrop-blur-xl shadow-xl shadow-black/40 flex flex-col gap-4">
        <div className="flex items-center justify-between pb-2 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#E50920]/20 text-[#E50920] border border-[#E50920]/40 flex items-center justify-center">
              <Megaphone className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-white font-display">
                  Live Public Announcements
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-[#E50920]/20 border border-[#E50920]/40 text-[#E50920] text-[11px] font-mono font-bold">
                  {announcements.length} Active
                </span>
              </div>
              <p className="text-[11px] font-mono text-zinc-400 mt-0.5">
                Updates appear directly in the bottom-right floating badge on the public site
              </p>
            </div>
          </div>
        </div>

        {/* Destination Target Selector */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-mono text-zinc-300 font-semibold uppercase flex items-center justify-between">
            <span>Broadcast Destination / Target Display:</span>
            <span className="text-[10px] text-zinc-500 font-normal lowercase">Choose where this update will be seen</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: 'public', label: 'Main Page', sub: 'Public Visitors', icon: Globe, activeClass: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-sm' },
              { id: 'teams', label: 'Team Squads', sub: 'Teams Hub', icon: Users, activeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm' },
              { id: 'students', label: 'All Students', sub: 'Student Portal', icon: GraduationCap, activeClass: 'bg-purple-500/20 text-purple-300 border-purple-500/50 shadow-sm' },
              { id: 'all', label: 'Everywhere', sub: 'Global Broadcast', icon: Radio, activeClass: 'bg-[#E50920]/20 text-[#E50920] border-[#E50920]/50 shadow-sm' },
            ].map((dest) => {
              const Icon = dest.icon;
              const isSelected = selectedTarget === dest.id;
              return (
                <button
                  key={dest.id}
                  type="button"
                  onClick={() => setSelectedTarget(dest.id as any)}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                    isSelected
                      ? dest.activeClass
                      : 'bg-black/40 border-white/10 text-zinc-400 hover:text-white hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-semibold text-xs font-mono">
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span>{dest.label}</span>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-400 block truncate">{dest.sub}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Input box to create new announcement */}
        <form onSubmit={handlePostAnnouncement} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={newAnnouncementText}
            onChange={(e) => setNewAnnouncementText(e.target.value)}
            placeholder="Type a new update message (e.g., Registrations open till 11:59 PM)..."
            className="flex-1 px-4 py-2.5 rounded-lg bg-black/50 border border-white/10 text-xs font-mono text-white placeholder-zinc-500 focus:outline-none focus:border-[#E50920]"
          />
          <button
            type="submit"
            disabled={postingAnnouncement || !newAnnouncementText.trim()}
            className="px-5 py-2.5 rounded-lg bg-[#E50920] hover:bg-[#ff1e38] text-white text-xs font-mono font-medium transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {postingAnnouncement ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Posting...</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Post Update</span>
              </>
            )}
          </button>
        </form>

        {/* Active Announcements List with Delete Option */}
        <div className="pt-2 flex flex-col gap-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-white/5">
            <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider">
              Current Active Updates ({announcements.length})
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { id: 'any', label: 'All' },
                { id: 'public', label: '🌐 Main Page' },
                { id: 'teams', label: '👥 Teams' },
                { id: 'students', label: '🎓 Students' },
                { id: 'all', label: '📢 Everywhere' },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilterTarget(f.id as any)}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-mono transition-colors cursor-pointer ${
                    filterTarget === f.id
                      ? 'bg-white/15 text-white font-semibold border border-white/20'
                      : 'text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {announcements.length === 0 ? (
            <div className="p-4 rounded-lg bg-black/30 border border-white/5 text-center text-xs font-mono text-zinc-500">
              No active announcements. Post an update above to broadcast to selected destinations.
            </div>
          ) : (
            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {announcements
                .filter((item) => {
                  if (filterTarget === 'any') return true;
                  if (filterTarget === 'all') return item.target === 'all' || !item.target;
                  return item.target === filterTarget;
                })
                .map((item, idx) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-lg bg-black/40 border border-white/10 hover:border-white/20 transition-all flex items-start justify-between gap-3 group"
                >
                  <div className="flex-1 flex flex-col gap-1.5">
                    <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-400 flex-wrap">
                      <span className="text-[#E50920] font-semibold">
                        #{announcements.length - idx}
                      </span>
                      {/* Destination Badge */}
                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-semibold uppercase tracking-wider border ${
                          item.target === 'public'
                            ? 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30'
                            : item.target === 'teams'
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                            : item.target === 'students'
                            ? 'bg-purple-500/15 text-purple-400 border-purple-500/30'
                            : 'bg-[#E50920]/15 text-[#E50920] border-[#E50920]/30'
                        }`}
                      >
                        {item.target === 'public'
                          ? '🌐 Main Page (Visitors)'
                          : item.target === 'teams'
                          ? '👥 Team Squads'
                          : item.target === 'students'
                          ? '🎓 All Students'
                          : '📢 Everywhere'}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-zinc-500">
                        <Clock className="w-3 h-3" />
                        {formatTimestamp(item.createdAt)}
                      </span>
                      {item.authorName && (
                        <>
                          <span>•</span>
                          <span className="text-zinc-400">{item.authorName}</span>
                        </>
                      )}
                    </div>
                    <p className="text-xs font-mono text-zinc-200 leading-relaxed whitespace-pre-wrap">
                      {item.message}
                    </p>
                  </div>

                  {/* Delete Button */}
                  <button
                    type="button"
                    onClick={() => handleDeleteAnnouncement(item.id)}
                    disabled={deletingId === item.id}
                    className="p-2 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-colors cursor-pointer shrink-0"
                    title="Delete this update"
                  >
                    {deletingId === item.id ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-rose-400" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ================= LEFT: Account Security (4 cols) ================= */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className="p-5 rounded-xl border border-white/10 bg-[#0B0C10]/92 backdrop-blur-xl shadow-xl shadow-black/40 flex flex-col gap-4">
            <div className="flex items-center gap-2.5 pb-2 border-b border-white/10">
              <KeyRound className="w-4 h-4 text-[#E50920]" />
              <h3 className="text-sm font-semibold text-white font-display">Account Security</h3>
            </div>

            <div className="flex flex-col gap-2.5 text-xs font-mono">
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">Email:</span>
                <span className="text-zinc-300 truncate max-w-[180px]">{currentUser.email}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">Role:</span>
                <span className="text-[#E50920] uppercase font-semibold">{currentUser.role}</span>
              </div>
            </div>

            {/* Account Modification Buttons */}
            <div className="flex flex-col gap-2 mt-2">
              <button
                type="button"
                onClick={onOpenChangeEmail}
                className="w-full py-2.5 px-4 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-mono transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <Mail className="w-3.5 h-3.5 text-[#E50920]" />
                <span>Change Email Address</span>
              </button>

              <button
                type="button"
                onClick={onOpenChangePassword}
                className="w-full py-2.5 px-4 rounded-lg bg-[#E50920] hover:bg-[#ff1e38] text-white text-xs font-mono font-medium transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Change Password</span>
              </button>
            </div>
          </div>
        </div>

        {/* ================= RIGHT: Portal Operating Controls (8 cols) ================= */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          <form
            onSubmit={handleSaveSettings}
            className="p-5 rounded-xl border border-white/10 bg-[#0B0C10]/92 backdrop-blur-xl shadow-xl shadow-black/40 flex flex-col gap-4"
          >
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <h3 className="text-sm font-semibold text-white font-display">Portal Configuration</h3>
              {settings.updatedAt && (
                <span className="text-[10px] font-mono text-zinc-500">
                  Last saved: {new Date(settings.updatedAt).toLocaleTimeString()}
                </span>
              )}
            </div>

            {/* Organization Name */}
            <div>
              <label className="text-xs font-mono text-zinc-400 block mb-1.5">
                Organization / Society Name
              </label>
              <input
                type="text"
                value={settings.societyName}
                onChange={(e) => setSettings({ ...settings, societyName: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-xs font-mono text-white focus:outline-none focus:border-[#E50920]"
                required
              />
            </div>

            {/* Submission Season Toggle */}
            <div className="p-3.5 rounded-lg bg-black/30 border border-white/10 flex items-center justify-between">
              <div>
                <span className="text-xs font-mono text-zinc-300 font-medium block">
                  Student Project Submissions
                </span>
                <span className="text-[11px] font-mono text-zinc-500">
                  Allow students to submit new project milestone updates
                </span>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.submissionSeasonOpen}
                  onChange={(e) => setSettings({ ...settings, submissionSeasonOpen: e.target.checked })}
                  className="w-3.5 h-3.5 accent-[#E50920] rounded cursor-pointer"
                />
                <span className="text-xs font-mono">
                  {settings.submissionSeasonOpen ? (
                    <span className="text-emerald-400">Open</span>
                  ) : (
                    <span className="text-rose-400">Closed</span>
                  )}
                </span>
              </label>
            </div>

            {/* Domain policy */}
            <div>
              <label className="text-xs font-mono text-zinc-400 block mb-1.5">
                Allowed Registration Domain
              </label>
              <select
                value={settings.allowedRegistrationDomain}
                onChange={(e) => setSettings({ ...settings, allowedRegistrationDomain: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-xs font-mono text-zinc-200 focus:outline-none focus:border-[#E50920] cursor-pointer"
              >
                <option value="All Domains">All Domains</option>
                <option value="@ccs-society.org">@ccs-society.org</option>
                <option value="@college.edu">@college.edu</option>
              </select>
            </div>

            {/* Alert toggles */}
            <div className="flex flex-col sm:flex-row gap-3 pt-1">
              <label className="flex-1 flex items-center justify-between p-3 rounded-lg bg-black/30 border border-white/10 cursor-pointer">
                <span className="text-xs font-mono text-zinc-300">
                  Alert on student updates
                </span>
                <input
                  type="checkbox"
                  checked={settings.notifyOnStudentSubmission}
                  onChange={(e) => setSettings({ ...settings, notifyOnStudentSubmission: e.target.checked })}
                  className="w-3.5 h-3.5 accent-[#E50920] rounded cursor-pointer"
                />
              </label>

              <label className="flex-1 flex items-center justify-between p-3 rounded-lg bg-black/30 border border-white/10 cursor-pointer">
                <span className="text-xs font-mono text-zinc-300">
                  Alert on faculty inquiries
                </span>
                <input
                  type="checkbox"
                  checked={settings.notifyOnFacultyQuery}
                  onChange={(e) => setSettings({ ...settings, notifyOnFacultyQuery: e.target.checked })}
                  className="w-3.5 h-3.5 accent-[#E50920] rounded cursor-pointer"
                />
              </label>
            </div>

            {/* Save Button */}
            <div className="flex items-center justify-end pt-2 border-t border-white/10">
              <button
                type="submit"
                disabled={savingSettings}
                className="flex items-center gap-2 px-5 py-2 rounded-lg bg-[#E50920] hover:bg-[#ff1e38] text-white text-xs font-mono font-medium transition-colors cursor-pointer disabled:opacity-50"
              >
                {savingSettings ? (
                  <>
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3 h-3" />
                    <span>Save Settings</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
