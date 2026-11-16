import React, { useState, useEffect } from 'react';
import { IntroAnimation } from './components/intro/IntroAnimation';
import { Navbar } from './components/navigation/Navbar';
import { HeroSection } from './components/hero/HeroSection';
import { AboutSection } from './components/about/AboutSection';
import { TeamSection } from './components/team/TeamSection';
import { GallerySection } from './components/gallery/GallerySection';
import { ContactSection } from './components/contact/ContactSection';
import { Footer } from './components/footer/Footer';
import { ParticleBackground } from './components/ui/ParticleBackground';
import { Floating3DLogo } from './components/3d/Floating3DLogo';
import { LoginPage } from './components/auth/LoginPage';
import { FloatingAnnouncement } from './components/ui/FloatingAnnouncement';

export function App() {
  // Always start with intro on every page load/refresh
  const [showIntro, setShowIntro] = useState<boolean>(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [currentView, setCurrentView] = useState<'home' | 'login'>(() => {
    return window.location.hash === '#login' ? 'login' : 'home';
  });

  // User authentication session state
  const [currentUser, setCurrentUser] = useState<any>(() => {
    try {
      const saved = localStorage.getItem('ccs_current_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Theme state: default to 'dark'
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('ccs_theme') as 'dark' | 'light') || 'dark';
  });

  // Font preset state: default to 'space' (Space Grotesk)
  const [fontPreset, setFontPreset] = useState<string>(() => {
    const saved = localStorage.getItem('ccs_font_preset');
    return saved === 'unbounded' ? 'space' : (saved || 'space');
  });

  // Shockwave energy ripple state
  const [ripple, setRipple] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    localStorage.setItem('ccs_theme', theme);
    const root = document.documentElement;
    root.classList.remove('dark', 'light');
    root.classList.add(theme);
    if (theme === 'light') {
      document.body.style.backgroundColor = '#FFFFFF';
      document.body.style.color = '#09090B';
    } else {
      document.body.style.backgroundColor = '#080808';
      document.body.style.color = '#FFFFFF';
    }
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('ccs_font_preset', fontPreset);
    document.documentElement.className = `scroll-smooth ${theme} font-preset-${fontPreset}`;
  }, [fontPreset, theme]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);

    const listener = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, []);

  // Listen to hash changes for deep linking (e.g. #login vs #home)
  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === '#login') {
        setCurrentView('login');
      } else {
        setCurrentView('home');
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Sync authenticated user across tabs, components and validate with backend
  useEffect(() => {
    const syncUser = () => {
      try {
        const saved = localStorage.getItem('ccs_current_user');
        setCurrentUser(saved ? JSON.parse(saved) : null);
      } catch {
        setCurrentUser(null);
      }
    };

    window.addEventListener('ccs_auth_change', syncUser);
    window.addEventListener('storage', syncUser);

    // Verify token validity with backend if token exists
    const token = localStorage.getItem('ccs_jwt_token');
    if (token) {
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.user) {
            setCurrentUser(data.user);
            localStorage.setItem('ccs_current_user', JSON.stringify(data.user));
          } else {
            localStorage.removeItem('ccs_jwt_token');
            localStorage.removeItem('ccs_current_user');
            setCurrentUser(null);
          }
        })
        .catch(() => {
          // Backend offline - retain cached profile
        });
    }

    return () => {
      window.removeEventListener('ccs_auth_change', syncUser);
      window.removeEventListener('storage', syncUser);
    };
  }, []);

  // Silent Anti-Inspection & Right-Click Security Guard (No visual banner)
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // F12 Developer Tools
      if (e.key === 'F12' || e.keyCode === 123) {
        e.preventDefault();
        return false;
      }

      // Ctrl+Shift+I / J / C (or Cmd+Option+I/J/C on macOS)
      if (
        (e.ctrlKey || e.metaKey) &&
        e.shiftKey &&
        ['I', 'i', 'J', 'j', 'C', 'c'].includes(e.key)
      ) {
        e.preventDefault();
        return false;
      }

      // Ctrl+U (View Page Source)
      if ((e.ctrlKey || e.metaKey) && (e.key === 'u' || e.key === 'U')) {
        e.preventDefault();
        return false;
      }

      // Ctrl+S (Save Page)
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        return false;
      }
    };

    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('ccs_jwt_token');
    localStorage.removeItem('ccs_current_user');
    window.dispatchEvent(new Event('ccs_auth_change'));
    setCurrentUser(null);
  };

  const handleOpenLogin = () => {
    window.location.hash = '#login';
    setCurrentView('login');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToHome = () => {
    window.location.hash = '#home';
    setCurrentView('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleIntroComplete = () => {
    setShowIntro(false);
  };

  const handleToggleTheme = (e: React.MouseEvent<HTMLButtonElement>) => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    const x = e.clientX;
    const y = e.clientY;

    // Trigger futuristic energetic shockwave ripple from click coordinates (2 seconds)
    setRipple({ x, y });
    setTimeout(() => setRipple(null), 2100);

    // Modern Circular View Transitions API
    if ('startViewTransition' in document) {
      const endRadius = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y)
      );

      // Lock scrolling/dragging during the transition to prevent viewport tearing/desync
      const preventScroll = (evt: Event) => {
        evt.preventDefault();
      };
      window.addEventListener('wheel', preventScroll, { passive: false });
      window.addEventListener('touchmove', preventScroll, { passive: false });
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      const cleanup = () => {
        window.removeEventListener('wheel', preventScroll);
        window.removeEventListener('touchmove', preventScroll);
        document.body.style.overflow = prevOverflow;
      };

      // @ts-ignore
      const transition = document.startViewTransition(() => {
        setTheme(nextTheme);
      });

      transition.ready.then(() => {
        document.documentElement.animate(
          {
            clipPath: [
              `circle(0px at ${x}px ${y}px)`,
              `circle(${endRadius}px at ${x}px ${y}px)`
            ]
          },
          {
            duration: 1800, // Majestic, smooth circular reveal
            easing: 'cubic-bezier(0.25, 1, 0.35, 1)',
            pseudoElement: '::view-transition-new(root)'
          }
        );
      });

      transition.finished.then(cleanup).catch(cleanup);
      setTimeout(cleanup, 2100);
    } else {
      setTheme(nextTheme);
    }
  };

  return (
    <div
      className={`relative min-h-screen ${theme === 'light' ? 'bg-[#FFFFFF] text-[#09090B]' : 'bg-[#080808] text-white'
        } selection:bg-[#E50920] selection:text-white font-preset-${fontPreset} transition-colors duration-500`}
    >
      {/* Intro cinematic sequence */}
      {showIntro && <IntroAnimation onComplete={handleIntroComplete} />}

      {/* Global subtle particle sparks & floating mesh dots */}
      <ParticleBackground reducedMotion={reducedMotion} theme={theme} />

      {/* Quantum Energy Shockwave Ripple Overlay spanning 2 seconds */}
      {ripple && (
        <div
          className="fixed pointer-events-none z-[99999]"
          style={{ left: ripple.x, top: ripple.y }}
        >
          {/* Inner spark */}
          <div className="absolute -translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white shadow-[0_0_35px_#FFFFFF] animate-ping" />
          {/* Expanding crimson shockwave halo that travels with the 2-second portal */}
          <div
            className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#E50920] shadow-[0_0_60px_rgba(229,9,32,0.85)] pointer-events-none"
            style={{
              animation: 'quantumShockwave 2s cubic-bezier(0.25, 1, 0.35, 1) forwards',
            }}
          />
        </div>
      )}

      {/* Phone/Mobile Persistent 3D Floating Logo Watermark */}
      <div className="lg:hidden fixed inset-0 z-0 pointer-events-none flex items-center justify-center overflow-hidden">
        <div className="w-[310px] h-[310px] sm:w-[390px] sm:h-[390px] opacity-[0.16] filter drop-shadow-[0_0_40px_rgba(229,9,32,0.35)] scale-110">
          <Floating3DLogo reducedMotion={reducedMotion} isWatermark={true} theme={theme} />
        </div>
      </div>

      {/* Main App Content */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {currentView !== 'login' && (
          <Navbar
            fontPreset={fontPreset}
            onFontChange={setFontPreset}
            theme={theme}
            onToggleTheme={handleToggleTheme}
            onOpenLogin={handleOpenLogin}
            currentView={currentView}
            currentUser={currentUser}
            onLogout={handleLogout}
          />
        )}

        {currentView === 'login' ? (
          <main className="flex-1 flex flex-col">
            <LoginPage
              theme={theme}
              onToggleTheme={handleToggleTheme}
              onBackToHome={handleBackToHome}
            />
          </main>
        ) : (
          <>
            <main className="flex-1 flex flex-col">
              <HeroSection reducedMotion={reducedMotion} theme={theme} />
              <AboutSection />
              <TeamSection />
              <GallerySection />
              <ContactSection />
            </main>
            <Footer theme={theme} />
          </>
        )}
      </div>

      {/* Floating Announcement Icon on Right Side of Screen (Hidden during intro sequence and login) */}
      {!showIntro && currentView !== 'login' && <FloatingAnnouncement />}
    </div>
  );
}

export default App;
