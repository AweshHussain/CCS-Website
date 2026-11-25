import React, { useState, useEffect } from 'react';
import { Menu, X, ArrowRight, LogOut } from 'lucide-react';
import { ThemeToggle } from '../ui/ThemeToggle';

interface NavbarProps {
  fontPreset?: string;
  onFontChange?: (fontId: string) => void;
  theme: 'dark' | 'light';
  onToggleTheme: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onOpenLogin?: () => void;
  currentView?: 'home' | 'login';
  currentUser?: {
    id: string;
    email: string;
    fullName: string;
    role: string;
    department?: string;
    avatarUrl?: string;
  } | null;
  onLogout?: () => void;
}

const NAV_ITEMS = [
  { label: 'Home', href: '#home' },
  { label: 'About', href: '#about' },
  { label: 'Team', href: '#team' },
  { label: 'Gallery', href: '#gallery' },
  { label: 'Contact', href: '#contact' },
];

export const Navbar: React.FC<NavbarProps> = ({
  theme,
  onToggleTheme,
  onOpenLogin,
  currentView = 'home',
  currentUser,
  onLogout,
}) => {
  const [activeSection, setActiveSection] = useState('home');
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);

      // Determine active section
      const sections = NAV_ITEMS.map((item) => item.href.substring(1));
      const scrollPos = window.scrollY + 200;

      for (let i = sections.length - 1; i >= 0; i--) {
        const el = document.getElementById(sections[i]);
        if (el && el.offsetTop <= scrollPos) {
          setActiveSection(sections[i]);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    if (currentView === 'login') {
      window.location.hash = href;
      window.location.reload();
      return;
    }
    const id = href.substring(1);
    const element = document.getElementById(id);
    if (element) {
      setMobileMenuOpen(false);
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      <header
        style={{ viewTransitionName: 'main-navbar' } as React.CSSProperties}
        className="fixed top-0 left-0 right-0 z-40 transition-all duration-500 py-3 sm:py-4 px-4 sm:px-8 flex justify-center"
      >
        <div
          className={`w-full max-w-7xl flex items-center justify-between px-4 sm:px-6 py-2.5 rounded-full transition-all duration-500 navbar-capsule ${
            isScrolled ? 'shadow-2xl' : ''
          }`}
        >
          {/* Official CCS Brand Logo Lockup */}
          <a
            href="#home"
            onClick={(e) => {
              if (currentView === 'login') {
                e.preventDefault();
                window.location.hash = '';
                if (onOpenLogin) window.dispatchEvent(new HashChangeEvent('hashchange'));
              } else {
                handleNavClick(e, '#home');
              }
            }}
            className="flex items-center gap-3 group cursor-pointer select-none"
          >
            <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center p-1.5 transition-transform duration-300 group-hover:scale-105">
              <img
                src={theme === 'light' ? '/ccs_emblem_red.png' : '/ccs_emblem_white.png'}
                alt="CCS Emblem"
                className="w-full h-full object-contain filter group-hover:brightness-125 transition-all"
              />
              <span className="absolute -inset-1 rounded-xl bg-[#E50920]/20 blur-sm opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-display font-extrabold tracking-wider text-base sm:text-lg text-white">
                  CCS
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#E50920]" />
              </div>
              <span className="text-[9px] uppercase tracking-widest text-zinc-400 font-mono hidden sm:inline-block leading-tight">
                Code & Compute Society
              </span>
            </div>
          </a>

          {/* Desktop Navigation Links - Centered */}
          <nav
            className={`hidden md:flex items-center gap-1 lg:gap-1.5 p-1 rounded-full ${
              theme === 'light'
                ? 'bg-white/[0.08] border border-white/10'
                : 'bg-white/[0.05] border border-white/10'
            }`}
          >
            {NAV_ITEMS.map((item) => {
              const isActive = currentView === 'home' && activeSection === item.href.substring(1);
              return (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={(e) => handleNavClick(e, item.href)}
                  className={`relative px-4 py-1.5 rounded-full text-xs font-medium tracking-wide transition-all duration-300 ${
                    isActive
                      ? 'text-white font-semibold'
                      : 'text-zinc-300 hover:text-white hover:bg-white/[0.06]'
                  }`}
                >
                  {item.label}

                  {/* Active Crimson Pill Indicator */}
                  {isActive && (
                    <span className="absolute inset-0 rounded-full bg-[#E50920] -z-10 shadow-[0_0_14px_rgba(229,9,32,0.5)]" />
                  )}
                </a>
              );
            })}
          </nav>

          {/* Right Action buttons */}
          <div className="flex items-center gap-2.5 sm:gap-3.5">
            {/* Theme Toggle */}
            <ThemeToggle theme={theme} onToggle={onToggleTheme} />

            {/* Authenticated User Capsule or Login Button */}
            {currentUser ? (
              <div className="flex items-center gap-1.5 sm:gap-2">
                {/* Person Display Name Pill (Direct Link to Dashboard/Workspace) */}
                <button
                  onClick={() => {
                    if (onOpenLogin) onOpenLogin();
                  }}
                  className={`group relative flex items-center gap-2 sm:gap-2.5 px-3 sm:px-4 py-1.5 rounded-full transition-all duration-300 shadow-md cursor-pointer border ${
                    theme === 'light'
                      ? 'bg-white/10 hover:bg-white/20 border-white/20 text-white shadow-sm'
                      : 'bg-white/[0.06] hover:bg-white/[0.12] border-white/15 text-white shadow-[0_0_15px_rgba(229,9,32,0.18)] hover:border-[#E50920]/60'
                  }`}
                  title={`Logged in as ${currentUser.fullName} (${currentUser.role.toUpperCase()}) • Open Workspace`}
                >
                  {/* Avatar or Initial Badge with live indicator dot */}
                  <div className="relative w-6 h-6 rounded-full overflow-hidden flex items-center justify-center bg-gradient-to-br from-[#E50920] to-[#7f000d] text-white shrink-0 border border-white/20">
                    {currentUser.avatarUrl ? (
                      <img
                        src={currentUser.avatarUrl}
                        alt={currentUser.fullName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-[10px] font-mono font-bold uppercase leading-none text-white">
                        {currentUser.fullName ? currentUser.fullName.charAt(0) : 'U'}
                      </span>
                    )}
                    <span className="absolute bottom-0 right-0 w-1.5 h-1.5 rounded-full bg-emerald-400 ring-1 ring-black" />
                  </div>

                  {/* Person Display Name */}
                  <span className="font-display font-bold text-xs sm:text-sm tracking-tight max-w-[85px] sm:max-w-[130px] md:max-w-[160px] truncate text-white">
                    {currentUser.fullName}
                  </span>

                  {/* Role Badge */}
                  <span className="hidden lg:inline-block text-[9px] font-mono uppercase px-2 py-0.5 rounded-full bg-[#E50920]/20 text-[#FF4D5E] border border-[#E50920]/40 font-semibold tracking-wider">
                    {currentUser.role}
                  </span>

                  <ArrowRight className="w-3.5 h-3.5 text-[#E50920] group-hover:translate-x-0.5 transition-transform" />
                </button>

                {/* Quick Logout Button */}
                {onLogout && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onLogout();
                    }}
                    className={`p-2 rounded-full transition-colors cursor-pointer border ${
                      theme === 'light'
                        ? 'bg-white/10 hover:bg-red-500/20 border-white/20 text-zinc-300 hover:text-red-400'
                        : 'glass-panel border-white/10 hover:border-red-500/40 text-zinc-400 hover:text-red-400'
                    }`}
                    title="Sign Out"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ) : (
              <button
                onClick={() => {
                  if (onOpenLogin) onOpenLogin();
                }}
                className="relative inline-flex items-center gap-1.5 px-4 sm:px-5 py-2 rounded-full text-xs font-semibold tracking-wider uppercase text-white bg-gradient-to-r from-[#E50920] to-[#B20718] hover:from-[#FF1E38] hover:to-[#E50920] transition-all duration-300 shadow-[0_0_20px_rgba(229,9,32,0.35)] hover:shadow-[0_0_30px_rgba(229,9,32,0.6)] cursor-pointer group select-none"
              >
                <span>Login</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            )}

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`md:hidden p-2 rounded-full text-zinc-300 hover:text-white focus:outline-none ${
                theme === 'light' ? 'bg-white/10 border border-white/10' : 'glass-panel'
              }`}
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      <div
        className={`fixed inset-0 z-50 md:hidden transition-all duration-400 ${
          mobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div
          className="absolute inset-0 bg-black/80 backdrop-blur-xl"
          onClick={() => setMobileMenuOpen(false)}
        />
        <div className="absolute top-20 left-4 right-4 p-6 rounded-3xl glass-panel-elevated border border-white/10 flex flex-col gap-4 shadow-2xl">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <span className="text-xs uppercase font-mono tracking-widest text-[#E50920]">
              Navigation
            </span>
            <span className="text-[10px] text-zinc-500 font-mono">Code & Compute Society</span>
          </div>

          <div className="flex flex-col gap-2">
            {NAV_ITEMS.map((item) => {
              const isActive = activeSection === item.href.substring(1);
              return (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={(e) => handleNavClick(e, item.href)}
                  className={`flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-[#E50920] text-white font-semibold shadow-lg'
                      : 'text-zinc-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <span>{item.label}</span>
                  {isActive && <span className="w-2 h-2 rounded-full bg-white" />}
                </a>
              );
            })}

            {/* Mobile User Profile or Login Button */}
            {currentUser ? (
              <div className="flex flex-col gap-2 p-3 rounded-2xl glass-panel border border-white/10 bg-white/[0.02]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center bg-gradient-to-br from-[#E50920] to-[#7f000d] border border-white/20 shrink-0">
                    {currentUser.avatarUrl ? (
                      <img
                        src={currentUser.avatarUrl}
                        alt={currentUser.fullName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-sm font-bold font-mono text-white uppercase">
                        {currentUser.fullName ? currentUser.fullName.charAt(0) : 'U'}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-semibold text-white truncate font-display">
                      {currentUser.fullName}
                    </span>
                    <span className="text-[10px] font-mono text-[#E50920] uppercase truncate">
                      {currentUser.role} • {currentUser.email}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-2">
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      if (onOpenLogin) onOpenLogin();
                    }}
                    className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-[#E50920] to-[#B20718] text-white text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <span>Dashboard</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  {onLogout && (
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        onLogout();
                      }}
                      className="py-2 px-3 rounded-xl glass-panel border border-white/10 text-zinc-300 hover:text-red-400 text-xs font-mono flex items-center gap-1 cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Logout</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  if (onOpenLogin) onOpenLogin();
                }}
                className="flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-semibold bg-gradient-to-r from-[#E50920] to-[#B20718] text-white shadow-lg shadow-[#E50920]/30 transition-all cursor-pointer"
              >
                <span>Login</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="pt-3 border-t border-white/10 flex items-center justify-between">
            <span className="text-xs font-mono text-zinc-400">Toggle Theme:</span>
            <ThemeToggle theme={theme} onToggle={onToggleTheme} />
          </div>
        </div>
      </div>
    </>
  );
};
