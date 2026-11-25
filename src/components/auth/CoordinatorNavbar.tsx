import React, { useState, useRef, useEffect } from 'react';
import {
  Shield,
  FolderGit2,
  GraduationCap,
  Users,
  Sliders,
  LogOut,
  KeyRound,
  Mail,
  LayoutDashboard,
  ExternalLink,
  ChevronDown,
  Camera,
  RefreshCw,
  Clock,
  ListOrdered,
} from 'lucide-react';
import { useSessionTimer } from '../../utils/sessionSecurity';
import { ThemeToggle } from '../ui/ThemeToggle';

export type CoordinatorTabType =
  | 'dashboard'
  | 'student_work'
  | 'task_directives'
  | 'accounts'
  | 'settings';

interface CoordinatorNavbarProps {
  currentTab: CoordinatorTabType;
  onSelectTab: (tab: CoordinatorTabType) => void;
  currentUser: {
    id: string;
    email: string;
    fullName: string;
    role: string;
    department: string;
    avatarUrl?: string;
  };
  token: string;
  onUpdateCurrentUser: (updated: any) => void;
  onOpenChangePassword: () => void;
  onOpenChangeEmail: () => void;
  onBackToHome: () => void;
  onLogout: () => void;
  pendingSubmissionsCount?: number;
  activeDirectivesCount?: number;
  totalUsersCount?: number;
  theme?: 'dark' | 'light';
  onToggleTheme?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

export const CoordinatorNavbar: React.FC<CoordinatorNavbarProps> = ({
  currentTab,
  onSelectTab,
  currentUser,
  token,
  onUpdateCurrentUser,
  onOpenChangePassword,
  onOpenChangeEmail,
  onBackToHome,
  onLogout,
  pendingSubmissionsCount = 0,
  activeDirectivesCount = 0,
  totalUsersCount = 0,
  theme = 'dark',
  onToggleTheme,
}) => {
  const [profileOpen, setProfileOpen] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Active 10-Hour Session Expiry Watcher (auto logout on expiry)
  const session = useSessionTimer(token, onLogout);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    if (profileOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [profileOpen]);

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const res = await fetch('/api/auth/upload-avatar', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();
      if (data.success && data.user) {
        onUpdateCurrentUser(data.user);
      }
    } catch {
      // quiet catch
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const navItems = [
    { id: 'dashboard' as CoordinatorTabType, label: 'Overview', icon: LayoutDashboard, count: 0 },
    {
      id: 'student_work' as CoordinatorTabType,
      label: 'Student Work',
      icon: FolderGit2,
      count: pendingSubmissionsCount,
    },
    {
      id: 'task_directives' as CoordinatorTabType,
      label: 'Task Directives',
      icon: ListOrdered,
      count: activeDirectivesCount,
    },
  ];

  return (
    <header className={`w-full sticky top-0 z-40 backdrop-blur-md border-b transition-colors duration-300 ${
      theme === 'light' ? 'bg-[#FFFFFF]/95 border-black/10' : 'bg-[#080808]/95 border-white/10'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* ================= LEFT: Brand ================= */}
        <button
          onClick={onBackToHome}
          className="flex items-center gap-3 text-left group cursor-pointer focus:outline-none"
          title="Go to CCS Home"
        >
          <div className="relative w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center transition-transform duration-300 group-hover:scale-105 shrink-0">
            <img
              src={theme === 'light' ? '/ccs_emblem_red.png' : '/ccs_emblem_white.png'}
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
            <span className="block text-[10px] font-mono text-[#E50920] group-hover:brightness-125 transition-all">
              Coordinator Portal
            </span>
          </div>
        </button>

        {/* ================= CENTER: Nav Links ================= */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                  isActive
                    ? theme === 'light'
                      ? 'bg-black/10 text-zinc-900 font-semibold border border-black/15 shadow-sm'
                      : 'bg-white/10 text-white font-medium border border-white/15'
                    : theme === 'light'
                    ? 'text-zinc-600 hover:text-black hover:bg-black/5'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#E50920]' : 'text-zinc-400'}`} />
                <span>{item.label}</span>
                {item.count > 0 && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                      item.id === 'student_work'
                        ? 'bg-[#E50920] text-white font-semibold'
                        : 'bg-white/10 text-zinc-300'
                    }`}
                  >
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* ================= RIGHT: Theme Toggle & Profile Trigger ================= */}
        <div className="flex items-center gap-2">
          {onToggleTheme && <ThemeToggle theme={theme} onToggle={onToggleTheme} />}

          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2.5 p-1 sm:pr-2.5 rounded-full hover:bg-white/5 border border-transparent hover:border-white/10 transition-all cursor-pointer"
            >
            <div className="w-8 h-8 rounded-full overflow-hidden border border-white/20 flex items-center justify-center bg-zinc-900 shrink-0">
              {currentUser.avatarUrl ? (
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.fullName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-[#E50920] flex items-center justify-center text-white font-bold text-xs">
                  {currentUser.fullName ? currentUser.fullName.charAt(0).toUpperCase() : 'C'}
                </div>
              )}
            </div>

            <span className={`hidden sm:inline text-xs font-mono ${
              theme === 'light' ? 'text-zinc-800' : 'text-zinc-300'
            }`}>
              {currentUser.fullName?.split(' ')[0] || 'Coordinator'}
            </span>

            <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
          </button>

          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleAvatarFileChange}
            accept="image/*"
            className="hidden"
          />

          {/* ================= CLEAN PROFILE DROPDOWN ================= */}
          {profileOpen && (
            <div className={`absolute top-12 right-0 w-72 rounded-2xl border shadow-2xl p-4 z-50 animate-in fade-in duration-150 ${
              theme === 'light'
                ? 'bg-white border-black/10 shadow-xl shadow-black/10'
                : 'bg-[#0F0F12] border-white/15 shadow-2xl'
            }`}>
              {/* Profile Header */}
              <div className={`flex items-center gap-3 pb-3 border-b ${
                theme === 'light' ? 'border-black/10' : 'border-white/10'
              }`}>
                <div className="relative group shrink-0">
                  <div className={`w-12 h-12 rounded-xl overflow-hidden border flex items-center justify-center ${
                    theme === 'light' ? 'border-black/15 bg-zinc-100' : 'border-white/20 bg-zinc-900'
                  }`}>
                    {currentUser.avatarUrl ? (
                      <img
                        src={currentUser.avatarUrl}
                        alt={currentUser.fullName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-[#E50920] flex items-center justify-center text-white font-bold text-lg">
                        {currentUser.fullName ? currentUser.fullName.charAt(0).toUpperCase() : 'C'}
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingAvatar}
                    className="absolute -bottom-1 -right-1 p-1 rounded-full bg-[#E50920] hover:bg-[#ff1e38] text-white shadow transition-transform hover:scale-110 cursor-pointer"
                    title="Change Photo"
                  >
                    {uploadingAvatar ? (
                      <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                    ) : (
                      <Camera className="w-2.5 h-2.5" />
                    )}
                  </button>
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className={`text-sm font-bold truncate ${
                    theme === 'light' ? 'text-zinc-900' : 'text-white'
                  }`}>
                    {currentUser.fullName}
                  </h4>
                  <p className="text-[11px] font-mono text-[#E50920] truncate">
                    Student Coordinator
                  </p>
                  <p className={`text-[10px] font-mono truncate ${
                    theme === 'light' ? 'text-zinc-600' : 'text-zinc-500'
                  }`}>
                    {currentUser.email}
                  </p>
                </div>
              </div>

              {/* 10-Hour Session Expiry Live Status */}
              <div className={`my-2 p-2 rounded-xl border flex items-center justify-between text-[11px] font-mono ${
                theme === 'light'
                  ? 'bg-black/[0.04] border-black/10'
                  : 'bg-black/40 border-white/10'
              }`}>
                <span className={`flex items-center gap-1.5 ${
                  theme === 'light' ? 'text-zinc-600' : 'text-zinc-400'
                }`}>
                  <Clock className="w-3 h-3 text-[#E50920]" />
                  <span>Session Limit (10h):</span>
                </span>
                <span className="text-amber-500 font-bold tracking-wider">
                  {session.formattedTime}
                </span>
              </div>

              {/* Clean Menu Items */}
              <div className="py-2 flex flex-col gap-1">
                {/* 1. Task Directives */}
                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(false);
                    onSelectTab('task_directives');
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-mono transition-colors cursor-pointer text-left ${
                    currentTab === 'task_directives'
                      ? 'bg-[#E50920]/15 text-[#E50920] border border-[#E50920]/30 font-semibold'
                      : theme === 'light'
                      ? 'text-zinc-700 hover:text-black hover:bg-black/5'
                      : 'text-zinc-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <ListOrdered className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Task Directives</span>
                  </div>
                  {activeDirectivesCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-[#E50920]/20 text-[#E50920] text-[10px] font-mono font-semibold">
                      {activeDirectivesCount}
                    </span>
                  )}
                </button>

                {/* 2. Accounts */}
                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(false);
                    onSelectTab('accounts');
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-mono transition-colors cursor-pointer text-left ${
                    currentTab === 'accounts'
                      ? 'bg-[#E50920]/15 text-[#E50920] border border-[#E50920]/30 font-semibold'
                      : theme === 'light'
                      ? 'text-zinc-700 hover:text-black hover:bg-black/5'
                      : 'text-zinc-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Users className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Accounts</span>
                  </div>
                  {totalUsersCount > 0 && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                      theme === 'light' ? 'bg-black/5 text-zinc-700' : 'bg-white/10 text-zinc-300'
                    }`}>
                      {totalUsersCount}
                    </span>
                  )}
                </button>

                {/* 3. Settings */}
                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(false);
                    onSelectTab('settings');
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-mono transition-colors cursor-pointer text-left ${
                    currentTab === 'settings'
                      ? 'bg-[#E50920]/15 text-[#E50920] border border-[#E50920]/30 font-semibold'
                      : theme === 'light'
                      ? 'text-zinc-700 hover:text-black hover:bg-black/5'
                      : 'text-zinc-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Sliders className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Settings</span>
                </button>

                {/* Subtle Divider */}
                <div className={`my-1 border-t ${theme === 'light' ? 'border-black/10' : 'border-white/10'}`} />

                {/* 3. Change Email */}
                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(false);
                    onOpenChangeEmail();
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-mono transition-colors cursor-pointer text-left ${
                    theme === 'light'
                      ? 'text-zinc-700 hover:text-black hover:bg-black/5'
                      : 'text-zinc-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Mail className="w-3.5 h-3.5 text-[#E50920]" />
                  <span>Change Email</span>
                </button>

                {/* 4. Change Password */}
                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(false);
                    onOpenChangePassword();
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-mono transition-colors cursor-pointer text-left ${
                    theme === 'light'
                      ? 'text-zinc-700 hover:text-black hover:bg-black/5'
                      : 'text-zinc-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <KeyRound className="w-3.5 h-3.5 text-[#E50920]" />
                  <span>Change Password</span>
                </button>

                {/* 5. View Public Site */}
                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(false);
                    onBackToHome();
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-mono transition-colors cursor-pointer text-left ${
                    theme === 'light'
                      ? 'text-zinc-700 hover:text-black hover:bg-black/5'
                      : 'text-zinc-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <ExternalLink className={`w-3.5 h-3.5 ${theme === 'light' ? 'text-zinc-500' : 'text-zinc-400'}`} />
                  <span>View Public Site</span>
                </button>
              </div>

              {/* Logout */}
              <div className={`pt-2 border-t ${theme === 'light' ? 'border-black/10' : 'border-white/10'}`}>
                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(false);
                    onLogout();
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-mono transition-colors cursor-pointer text-left ${
                    theme === 'light'
                      ? 'text-rose-600 hover:text-rose-800 hover:bg-rose-50'
                      : 'text-rose-400 hover:text-white hover:bg-rose-500/10'
                  }`}
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

      {/* Mobile nav bar */}
      <div className="md:hidden border-t border-white/10 px-2 py-2 flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = currentTab === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`flex flex-col items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-mono ${
                isActive ? 'text-[#E50920] font-semibold' : 'text-zinc-400'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};
