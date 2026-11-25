import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Shield,
  Award,
  Lock,
  User,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Fingerprint,
  Terminal,
  LogOut,
  Cpu,
  KeyRound,
  Sparkles,
  Layers,
  Database,
  RefreshCw,
  Compass,
  Check,
  Zap,
  Target,
  Activity,
  Server,
  Radio,
  FileCheck2,
  Code2
} from 'lucide-react';
import { Floating3DLogo } from '../3d/Floating3DLogo';
import { ThemeToggle } from '../ui/ThemeToggle';
import { AccountManagementPanel } from './AccountManagementPanel';
import { CoordinatorNavbar, CoordinatorTabType } from './CoordinatorNavbar';
import { CoordinatorLandingPage } from './CoordinatorLandingPage';
import { ChangePasswordModal } from './ChangePasswordModal';
import { ChangeEmailModal } from './ChangeEmailModal';
import { StudentWorkPanel } from './StudentWorkPanel';
import { CoordinatorTaskDirectivesPanel } from './CoordinatorTaskDirectivesPanel';
import { PortalSettingsPanel } from './PortalSettingsPanel';
import { StudentDashboard } from './StudentDashboard';
import { DashboardBackground } from '../ui/DashboardBackground';

interface LoginPageProps {
  theme: 'dark' | 'light';
  onToggleTheme: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onBackToHome: () => void;
}

type RoleType = 'coordinator' | 'student';

interface RoleConfig {
  id: RoleType;
  title: string;
  shortLabel: string;
  tagline: string;
  badge: string;
  glyphLabel: string;
  icon: React.ElementType;
  clearanceLevel: string;
  placeholderEmail: string;
  description: string;
  telemetry: {
    stat1Label: string;
    stat1Value: string;
    stat2Label: string;
    stat2Value: string;
    stat3Label: string;
    stat3Value: string;
  };
}

const ROLES: RoleConfig[] = [
  {
    id: 'coordinator',
    title: 'Student Coordinator',
    shortLabel: 'Coordinator',
    tagline: 'OPERATIONS & LEADERSHIP',
    badge: 'CORE // OPS',
    glyphLabel: 'CORE C // 02',
    icon: Shield,
    clearanceLevel: 'LEVEL 2: OPS CLEARANCE',
    placeholderEmail: 'coordinator@ccs-society.org',
    description: 'Society event administration, track coordination, inventory dispatch, and domain repo management.',
    telemetry: {
      stat1Label: 'Ops Quotas',
      stat1Value: 'Active // Unlimited',
      stat2Label: 'Live Repos',
      stat2Value: '18 Mounted',
      stat3Label: 'Dispatch Queue',
      stat3Value: '0 Pending',
    },
  },
  {
    id: 'student',
    title: 'Students',
    shortLabel: 'Student',
    tagline: 'MEMBER & DEVELOPER ACCESS',
    badge: 'NODE // MEMBER',
    glyphLabel: 'INNER CIPHER // 03',
    icon: GraduationCap,
    clearanceLevel: 'LEVEL 1: RESIDENT BUILDER',
    placeholderEmail: 'student@institution.edu',
    description: 'Access GPU cluster sandboxes, member repositories, hackathon passes, and dev credits.',
    telemetry: {
      stat1Label: 'GPU Cluster',
      stat1Value: '48.0 TFLOPS A100',
      stat2Label: 'Hackathon Pass',
      stat2Value: 'Verified Active',
      stat3Label: 'Git Workspace',
      stat3Value: 'ccs/dev-sandbox',
    },
  },
];

export const LoginPage: React.FC<LoginPageProps> = ({ theme, onToggleTheme, onBackToHome }) => {
  const [selectedRole, setSelectedRole] = useState<RoleType>('coordinator');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Authenticated User & JWT Token
  const [authToken, setAuthToken] = useState<string | null>(() => localStorage.getItem('ccs_jwt_token'));
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Authentication Sequence States
  const [authStatus, setAuthStatus] = useState<'idle' | 'scanning' | 'verifying' | 'granted' | 'dashboard'>('idle');
  const [scanStep, setScanStep] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');

  // Coordinator Navigation & Modal States
  const [coordinatorTab, setCoordinatorTab] = useState<CoordinatorTabType>('dashboard');
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showChangeEmailModal, setShowChangeEmailModal] = useState(false);
  const [pendingSubmissionsCount, setPendingSubmissionsCount] = useState(0);
  const [activeDirectivesCount, setActiveDirectivesCount] = useState(0);
  const [totalUsersCount, setTotalUsersCount] = useState(0);

  // Poll/fetch badges when logged in
  useEffect(() => {
    if (!authToken || !currentUser) return;
    const fetchCounts = async () => {
      try {
        const [resSub, resDir, resU] = await Promise.all([
          fetch('/api/coordinator/student-updates', { headers: { Authorization: `Bearer ${authToken}` } }),
          fetch('/api/coordinator/assigned-work', { headers: { Authorization: `Bearer ${authToken}` } }),
          fetch('/api/admin/users', { headers: { Authorization: `Bearer ${authToken}` } }),
        ]);
        const [dataSub, dataDir, dataU] = await Promise.all([resSub.json(), resDir.json(), resU.json()]);
        if (dataSub.success) {
          setPendingSubmissionsCount((dataSub.updates || []).filter((u: any) => u.status === 'pending').length);
        }
        if (dataDir.success) {
          setActiveDirectivesCount((dataDir.work || []).filter((w: any) => w.status === 'active').length);
        }
        if (dataU.success) {
          setTotalUsersCount((dataU.users || []).length);
        }
      } catch (e) {
        // silent fallback
      }
    };
    fetchCounts();
  }, [authToken, currentUser]);

  const currentRole = ROLES.find((r) => r.id === selectedRole) || ROLES[0];

  // Auto-restore session from token on mount or listen for logout events
  useEffect(() => {
    const handleAuthChange = () => {
      const token = localStorage.getItem('ccs_jwt_token');
      if (!token) {
        setEmail('');
        setPassword('');
        setShowPassword(false);
        setErrorMessage('');
        setAuthToken(null);
        setCurrentUser(null);
        setAuthStatus('idle');
        setScanStep(0);
      }
    };

    window.addEventListener('ccs_auth_change', handleAuthChange);

    // Check if user was auto-logged out due to 10-hour session expiry
    if (localStorage.getItem('ccs_session_expired_notice')) {
      setErrorMessage('Your 10-hour session limit has expired. You have been securely logged out. Please sign in again.');
      localStorage.removeItem('ccs_session_expired_notice');
    }

    const token = localStorage.getItem('ccs_jwt_token');
    if (token) {
      setAuthToken(token);
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.user) {
            setCurrentUser(data.user);
            localStorage.setItem('ccs_current_user', JSON.stringify(data.user));
            window.dispatchEvent(new Event('ccs_auth_change'));
            setSelectedRole(data.user.role as RoleType);
            setEmail('');
            setPassword('');
            setAuthStatus('dashboard');
          } else {
            localStorage.removeItem('ccs_jwt_token');
            localStorage.removeItem('ccs_current_user');
            window.dispatchEvent(new Event('ccs_auth_change'));
            setEmail('');
            setPassword('');
            setAuthToken(null);
          }
        })
        .catch(() => {
          // Backend unreachable or offline
        });
    }

    return () => {
      window.removeEventListener('ccs_auth_change', handleAuthChange);
    };
  }, []);

  // Handle role tab change
  const handleRoleChange = (roleId: RoleType) => {
    if (authStatus !== 'idle') return;
    setSelectedRole(roleId);
    setErrorMessage('');
  };

  // Submit Authentication to Backend with JWT issuance
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please enter a valid institutional email address.');
      return;
    }
    if (!password.trim()) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setErrorMessage('');
    setAuthStatus('scanning');
    setScanStep(1); // 3D Vault accelerates & pulses

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
          role: selectedRole,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        setAuthStatus('idle');
        setScanStep(0);
        setErrorMessage(data.message || 'Incorrect. Please check the entered details and role selection.');
        return;
      }

      // Save token and user in localStorage & notify application
      localStorage.setItem('ccs_jwt_token', data.token);
      localStorage.setItem('ccs_session_issued_at', String(Date.now()));
      localStorage.setItem('ccs_current_user', JSON.stringify(data.user));
      window.dispatchEvent(new Event('ccs_auth_change'));

      setAuthToken(data.token);
      setCurrentUser(data.user);

      // Play slick biometric & handshake sequence
      setTimeout(() => setScanStep(2), 500);
      setTimeout(() => {
        setScanStep(3);
        setAuthStatus('verifying');
      }, 1000);
      setTimeout(() => {
        setScanStep(4);
        setAuthStatus('granted');
      }, 1600);
      setTimeout(() => {
        setAuthStatus('dashboard');
      }, 2300);
    } catch (err: any) {
      setAuthStatus('idle');
      setScanStep(0);
      setErrorMessage('Could not connect to backend server. Make sure the backend server is running.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('ccs_jwt_token');
    localStorage.removeItem('ccs_session_issued_at');
    localStorage.removeItem('ccs_current_user');
    window.dispatchEvent(new Event('ccs_auth_change'));
    setEmail('');
    setPassword('');
    setShowPassword(false);
    setErrorMessage('');
    setAuthToken(null);
    setCurrentUser(null);
    setAuthStatus('idle');
    setScanStep(0);
  };

  // 1. Dedicated Coordinator Dashboard Layout
  if (authStatus === 'dashboard' && currentUser && currentUser.role === 'coordinator') {
    return (
      <div className="relative min-h-screen w-full flex flex-col bg-[#080808] text-white">
        {/* 3D Floating Logo & Ambient Lighting in Background */}
        <DashboardBackground role="coordinator" />

        {/* Coordinator Top Navbar */}
        <CoordinatorNavbar
          currentTab={coordinatorTab}
          onSelectTab={(tab) => setCoordinatorTab(tab)}
          currentUser={currentUser}
          token={authToken!}
          onUpdateCurrentUser={(updated) => {
            setCurrentUser(updated);
            localStorage.setItem('ccs_current_user', JSON.stringify(updated));
            window.dispatchEvent(new Event('ccs_auth_change'));
          }}
          onOpenChangePassword={() => setShowChangePasswordModal(true)}
          onOpenChangeEmail={() => setShowChangeEmailModal(true)}
          onBackToHome={onBackToHome}
          onLogout={handleLogout}
          pendingSubmissionsCount={pendingSubmissionsCount}
          activeDirectivesCount={activeDirectivesCount}
          totalUsersCount={totalUsersCount}
        />

        {/* Main Dashboard Views Container */}
        <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex-1 flex flex-col relative z-10">
          {coordinatorTab === 'dashboard' && (
            <CoordinatorLandingPage
              currentUser={currentUser}
              token={authToken!}
              onNavigate={(tab) => setCoordinatorTab(tab)}
              onOpenChangePassword={() => setShowChangePasswordModal(true)}
            />
          )}

          {coordinatorTab === 'student_work' && (
            <StudentWorkPanel
              token={authToken!}
              currentUser={currentUser}
              onCountUpdate={(cnt) => setPendingSubmissionsCount(cnt)}
            />
          )}

          {coordinatorTab === 'task_directives' && (
            <CoordinatorTaskDirectivesPanel
              token={authToken!}
              currentUser={currentUser}
              onCountUpdate={(cnt) => setActiveDirectivesCount(cnt)}
            />
          )}

          {coordinatorTab === 'accounts' && (
            <AccountManagementPanel
              currentUser={currentUser}
              token={authToken!}
              onUpdateCurrentUser={(updated) => {
                setCurrentUser(updated);
                localStorage.setItem('ccs_current_user', JSON.stringify(updated));
                window.dispatchEvent(new Event('ccs_auth_change'));
              }}
              theme={theme}
            />
          )}

          {coordinatorTab === 'settings' && (
            <PortalSettingsPanel
              token={authToken!}
              currentUser={currentUser}
              onOpenChangePassword={() => setShowChangePasswordModal(true)}
              onOpenChangeEmail={() => setShowChangeEmailModal(true)}
            />
          )}
        </main>

        {/* Popup Change Password Modal */}
        <ChangePasswordModal
          isOpen={showChangePasswordModal}
          onClose={() => setShowChangePasswordModal(false)}
          token={authToken!}
        />

        {/* Popup Change Email Modal */}
        <ChangeEmailModal
          isOpen={showChangeEmailModal}
          onClose={() => setShowChangeEmailModal(false)}
          currentEmail={currentUser.email}
          token={authToken!}
          onSuccess={(updatedUser, newToken) => {
            setCurrentUser(updatedUser);
            setAuthToken(newToken);
            localStorage.setItem('ccs_jwt_token', newToken);
            localStorage.setItem('ccs_current_user', JSON.stringify(updatedUser));
            window.dispatchEvent(new Event('ccs_auth_change'));
          }}
        />
      </div>
    );
  }

  // 2. Dedicated Student Dashboard (Check assignments, update projects & milestones)
  if (authStatus === 'dashboard' && currentUser && currentUser.role === 'student') {
    return (
      <StudentDashboard
        currentUser={currentUser}
        token={authToken!}
        onLogout={handleLogout}
        onBackToHome={onBackToHome}
      />
    );
  }

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between overflow-x-hidden pt-6 sm:pt-8 pb-10 px-4 sm:px-6 lg:px-8 select-none">
      {/* Background ambient lighting */}
      <div className="fixed top-1/4 left-1/3 -translate-x-1/2 w-[650px] h-[650px] bg-[#E50920]/8 rounded-full blur-[180px] pointer-events-none z-0" />
      <div className="fixed bottom-10 right-10 w-96 h-96 bg-[#E50920]/6 rounded-full blur-[140px] pointer-events-none z-0" />

      {/* 3D Rotating CCS Emblem Watermark in the Background */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden">
        {/* Ambient red halo behind watermark */}
        <div
          className={`w-[450px] h-[450px] sm:w-[550px] sm:h-[550px] rounded-full bg-[#E50920]/12 blur-[130px] transition-all duration-700 pointer-events-none ${
            authStatus !== 'idle' ? 'scale-125 bg-[#E50920]/25' : ''
          }`}
        />

        {/* 3D Model Instance floating in background */}
        <div className="absolute w-[360px] h-[360px] sm:w-[460px] sm:h-[460px] opacity-35 transition-opacity duration-500">
          <Floating3DLogo
            isWatermark={true}
            theme={theme}
            authPhase={authStatus}
            selectedRole={selectedRole}
          />
        </div>
      </div>

      {/* Top Floating Control Bar: Return Home & Theme Toggle */}
      <div className="max-w-4xl mx-auto w-full flex items-center justify-between mb-4 sm:mb-6 relative z-20">
        <button
          onClick={onBackToHome}
          className={`inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-full transition-all duration-300 group cursor-pointer shadow-md ${
            theme === 'light'
              ? 'bg-zinc-100 hover:bg-zinc-200 border border-zinc-300 text-zinc-900 shadow-sm'
              : 'glass-panel border border-white/10 hover:border-[#E50920]/50 text-zinc-300 hover:text-white'
          }`}
          title="Return to Home Page"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-[#E50920] group-hover:-translate-x-1 transition-transform" />
          <span className="text-xs font-mono font-semibold tracking-wider">RETURN TO HOME</span>
        </button>

        <div className="flex items-center gap-2.5">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full glass-panel border border-white/10 text-[10px] font-mono text-zinc-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>PORTAL GATEWAY</span>
          </div>

          <ThemeToggle
            theme={theme}
            onToggle={onToggleTheme}
            className={
              theme === 'light'
                ? 'bg-zinc-100 hover:bg-zinc-200 border border-zinc-300 text-zinc-900 shadow-sm'
                : 'glass-panel hover:border-[#E50920]/40 text-zinc-300 hover:text-white'
            }
          />
        </div>
      </div>

      {/* MAIN CONTAINER */}
      <div className="w-full relative z-10 flex-1 flex flex-col justify-center py-2">
        {/* If Logged In: Show Sleek Post-Login Simulation Dashboard */}
        {authStatus === 'dashboard' ? (
          currentUser && currentUser.role === 'coordinator' ? (
            /* ============================================================== */
            /* EXECUTIVE COORDINATOR DASHBOARD: ACCOUNT & CREDENTIAL AUTHORITY */
            /* ============================================================== */
            <div className="max-w-5xl mx-auto w-full relative z-10 animate-fadeIn space-y-6">
              {/* Top Bar with Logout & Return to Home */}
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#E50920] to-[#B00617] flex items-center justify-center text-white shadow-lg shadow-[#E50920]/40">
                    <currentRole.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold font-display text-white">
                      {currentUser?.fullName || currentRole.title}
                    </h2>
                    <span className="text-[10px] font-mono text-zinc-400">
                      {currentUser?.role?.toUpperCase()} AUTHORITY • {currentUser?.email}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={onBackToHome}
                    className="px-3.5 py-1.5 rounded-xl glass-panel text-xs font-mono text-zinc-300 hover:text-white cursor-pointer"
                  >
                    Return to Home
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#E50920]/20 hover:bg-[#E50920] text-white border border-[#E50920]/40 text-xs font-mono transition-all cursor-pointer shadow-sm"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>

              {/* The Dedicated Panel for Managing & Granting Accounts to Coordinators & Students */}
              <AccountManagementPanel
                currentUser={currentUser}
                token={authToken!}
                onUpdateCurrentUser={(updated) => {
                  setCurrentUser(updated);
                  localStorage.setItem('ccs_current_user', JSON.stringify(updated));
                  window.dispatchEvent(new Event('ccs_auth_change'));
                }}
                theme={theme}
              />
            </div>
          ) : (
            /* ============================================================== */
            /* STUDENT MEMBER DASHBOARD & SANDBOX                             */
            /* ============================================================== */
            <div className="clay-card w-full max-w-xl mx-auto p-6 sm:p-8 relative overflow-hidden animate-fadeIn border border-[#E50920]/40">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#E50920]/20 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10">
                <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
                  <div className="flex items-center gap-3.5">
                    {/* Student Avatar */}
                    <div className="w-12 h-12 rounded-2xl overflow-hidden glass-panel border border-[#E50920]/50 p-1 flex items-center justify-center bg-black/40">
                      {currentUser?.avatarUrl ? (
                        <img src={currentUser.avatarUrl} alt="Avatar" className="w-full h-full object-cover rounded-xl" />
                      ) : (
                        <div className="w-full h-full rounded-xl bg-gradient-to-br from-[#E50920] to-[#800512] flex items-center justify-center text-white font-bold text-lg font-display">
                          {currentUser?.fullName?.charAt(0) || 'S'}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base sm:text-lg font-bold font-display text-white">
                          {currentUser?.fullName || 'Student Member'}
                        </h3>
                        <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          ACTIVE NODE
                        </span>
                      </div>
                      <p className="text-[11px] font-mono text-zinc-400">
                        {currentUser?.email || email} • {currentUser?.department || 'Student Developer'}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:border-[#E50920]/50 hover:bg-[#E50920]/10 text-xs font-mono text-zinc-300 hover:text-white transition-all cursor-pointer"
                  >
                    <LogOut className="w-3 h-3 text-[#E50920]" />
                    <span>LOGOUT</span>
                  </button>
                </div>

                {/* Status metrics grid */}
                <div className="grid grid-cols-3 gap-2.5 mb-5">
                  <div className="p-2.5 rounded-xl clay-input-well">
                    <span className="text-[9px] font-mono uppercase text-zinc-400 block mb-0.5 truncate">
                      Clearance
                    </span>
                    <span className="text-xs font-bold font-display text-[#E50920] truncate block">
                      LEVEL 1: MEMBER
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl clay-input-well">
                    <span className="text-[9px] font-mono uppercase text-zinc-400 block mb-0.5 truncate">
                      GPU Sandbox
                    </span>
                    <span className="text-xs font-bold font-display text-white truncate block">
                      Allocated (48 TFLOPS)
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl clay-input-well">
                    <span className="text-[9px] font-mono uppercase text-zinc-400 block mb-0.5 truncate">
                      Hack Pass
                    </span>
                    <span className="text-xs font-bold font-display text-emerald-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      Active Pass
                    </span>
                  </div>
                </div>

                {/* Terminal Logs View */}
                <div className="p-3 rounded-xl bg-black/60 border border-white/10 font-mono text-[11px] text-zinc-300 mb-5 space-y-1 shadow-inner">
                  <div className="flex items-center gap-1.5 text-zinc-400 pb-1.5 mb-1.5 border-b border-white/5">
                    <Terminal className="w-3 h-3 text-[#E50920]" />
                    <span className="text-[10px]">AUTHENTICATED SESSION LOG</span>
                  </div>
                  <p className="text-emerald-400">✓ JWT Token validated with Database. Session live.</p>
                  <p className="text-zinc-300">→ Identity resolved: <span className="text-white font-bold">{currentUser?.fullName}</span></p>
                  <p className="text-zinc-500 text-[10px]">Session Token: {authToken ? `${authToken.slice(0, 18)}...` : 'ccs_session_active'}</p>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <button
                    onClick={onBackToHome}
                    className="flex-1 py-2.5 px-4 rounded-xl clay-btn-crimson text-xs font-bold uppercase tracking-wider text-white shadow-xl flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Launch Society Portal</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={handleLogout}
                    className="px-4 py-2.5 rounded-xl glass-panel border border-white/10 hover:border-white/30 text-xs font-mono text-zinc-300 hover:text-white transition-all cursor-pointer"
                  >
                    Switch Account
                  </button>
                </div>
              </div>
            </div>
          )
        ) : (
          /* COMPACT, CENTERED CLAYMORPHIC PORTAL LOGIN CARD */
          <div className="w-full max-w-[460px] mx-auto relative z-10">
            <div
              className={`clay-card w-full pt-8 pb-6 px-5 sm:px-6 relative transition-all duration-500 ${
                authStatus !== 'idle'
                  ? 'border-[#E50920]/80 shadow-[0_0_50px_rgba(229,9,32,0.35)]'
                  : ''
              }`}
            >
              {/* 3D Floating Top Protruding Key Badge - Centered */}
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-20 flex items-center justify-center">
                <div className="relative w-12 h-12 rounded-2xl clay-chip border border-white/20 flex items-center justify-center shadow-xl">
                  <div
                    className={`absolute -inset-1 rounded-2xl bg-[#E50920]/25 blur-md pointer-events-none transition-all duration-500 ${
                      authStatus !== 'idle' ? 'scale-125 bg-[#E50920]/60 animate-pulse' : ''
                    }`}
                  />
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#E50920] to-[#990515] flex items-center justify-center text-white shadow-inner">
                    {authStatus === 'granted' ? (
                      <CheckCircle2 className="w-4 h-4 text-white animate-bounce" />
                    ) : authStatus !== 'idle' ? (
                      <Fingerprint className="w-4 h-4 text-white animate-pulse" />
                    ) : (
                      <KeyRound className="w-4 h-4 text-white" />
                    )}
                  </div>
                </div>
              </div>

              {/* Header Content - Centered & Compact */}
              <div className="pt-2 mb-4 text-center">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-[9px] font-mono tracking-widest text-[#E50920] uppercase mb-1 shadow-sm">
                  <span>IDENTITY GATEWAY • CCS 2026</span>
                </div>

                <h2 className="text-xl sm:text-2xl font-black font-display text-white tracking-wide uppercase">
                  PORTAL LOGIN
                </h2>

                <p className="text-[11px] sm:text-xs text-zinc-400 font-sans mt-0.5">
                  Enter your credentials and select your authorized role
                </p>
              </div>

              <form onSubmit={handleLogin} autoComplete="off" className="space-y-3.5">
                {/* Error Banner */}
                {errorMessage && (
                  <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs font-mono text-red-400 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* STEP 01: CREDENTIALS */}
                <div className="p-3.5 rounded-2xl clay-card border border-white/5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full bg-[#E50920] text-white font-mono text-[9px] font-bold flex items-center justify-center shadow-sm shadow-[#E50920]/40">
                        01
                      </span>
                      <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-300 font-semibold">
                        LOGIN CREDENTIALS
                      </span>
                    </div>
                  </div>

                  {/* Institutional Email Recessed Input Well */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[10px] font-mono text-zinc-400">
                        Institutional Email Address
                      </label>
                      {email && (
                        <button
                          type="button"
                          onClick={() => setEmail('')}
                          className="text-[9px] font-mono text-zinc-500 hover:text-zinc-300 cursor-pointer"
                        >
                          CLEAR
                        </button>
                      )}
                    </div>
                    <div className="clay-input-well flex items-center p-1.5 focus-within:border-[#E50920]/60 transition-colors">
                      <div className="clay-chip w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-zinc-300">
                        <Mail className="w-3.5 h-3.5 text-[#E50920]" />
                      </div>

                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={currentRole.placeholderEmail}
                        disabled={authStatus !== 'idle'}
                        required
                        className="w-full bg-transparent px-2.5 py-1 text-xs sm:text-[13px] font-mono text-white placeholder-zinc-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Password Recessed Input Well */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[10px] font-mono text-zinc-400">
                        Account Password
                      </label>
                      <a
                        href="#forgot"
                        onClick={(e) => {
                          e.preventDefault();
                          alert('Password reset requests require coordinator desk approval or contacting tech@ccs-society.org');
                        }}
                        className="text-[9px] font-mono text-[#E50920] hover:underline"
                      >
                        Forgot?
                      </a>
                    </div>

                    <div className="clay-input-well flex items-center p-1.5 focus-within:border-[#E50920]/60 transition-colors">
                      <div className="clay-chip w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-zinc-300">
                        <Lock className="w-3.5 h-3.5 text-[#E50920]" />
                      </div>

                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••••"
                        disabled={authStatus !== 'idle'}
                        required
                        className="w-full bg-transparent px-2.5 py-1 text-xs sm:text-[13px] font-mono text-white placeholder-zinc-500 focus:outline-none tracking-wider"
                      />

                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="clay-chip w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                        title={showPassword ? 'Hide password' : 'Peek password'}
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* STEP 02: THE THREE COLUMNS FOR SPECIFYING ROLE */}
                <div className="p-3.5 rounded-2xl clay-card border border-white/5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full bg-[#E50920] text-white font-mono text-[9px] font-bold flex items-center justify-center shadow-sm shadow-[#E50920]/40">
                        02
                      </span>
                      <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-300 font-semibold">
                        SPECIFY YOUR ROLE
                      </span>
                    </div>
                    <span className="text-[9px] font-mono text-zinc-400">
                      Active: <strong className="text-white">{currentRole.shortLabel}</strong>
                    </span>
                  </div>

                  {/* THE 2 ROLES SIDE-BY-SIDE */}
                  <div className="grid grid-cols-2 gap-3">
                    {ROLES.map((role) => {
                      const isSelected = selectedRole === role.id;
                      const RoleIcon = role.icon;

                      return (
                        <button
                          key={role.id}
                          type="button"
                          onClick={() => handleRoleChange(role.id)}
                          disabled={authStatus !== 'idle'}
                          className={`relative p-2 sm:p-2.5 rounded-xl transition-all duration-300 flex flex-col items-center text-center cursor-pointer select-none group ${
                            isSelected
                              ? 'clay-chip border-2 border-[#E50920] shadow-[0_4px_16px_rgba(229,9,32,0.3)] scale-[1.02] -translate-y-0.5'
                              : 'clay-input-well border border-white/5 hover:border-white/15 opacity-65 hover:opacity-100'
                          }`}
                        >
                          <div className="absolute top-1.5 right-1.5">
                            <div
                              className={`w-3 h-3 rounded-full flex items-center justify-center transition-all ${
                                isSelected
                                  ? 'bg-[#E50920] text-white shadow-sm'
                                  : 'bg-white/5 text-transparent border border-white/10'
                              }`}
                            >
                              <Check className="w-2 h-2" />
                            </div>
                          </div>

                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center mb-1 transition-transform duration-300 group-hover:scale-105 ${
                              isSelected
                                ? 'bg-gradient-to-br from-[#E50920] to-[#A30514] text-white shadow-sm shadow-[#E50920]/40'
                                : 'clay-chip text-zinc-400'
                            }`}
                          >
                            <RoleIcon className="w-3.5 h-3.5" />
                          </div>

                          <span className="text-[10px] sm:text-[11px] font-bold font-display text-white leading-tight block mb-0.5 line-clamp-1">
                            {role.shortLabel}
                          </span>

                          <span className="text-[8px] font-mono text-[#E50920] uppercase tracking-wider block font-semibold truncate max-w-full">
                            {role.badge}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* IN-CARD TELEMETRY & AUTHENTICATION MOTION HUD */}
                {authStatus !== 'idle' && (
                  <div className="p-3 rounded-xl clay-input-well border border-[#E50920]/50 space-y-2 animate-fadeIn relative overflow-hidden">
                    <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-[#FF2A3D] to-transparent animate-scanline pointer-events-none" />

                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className="text-zinc-300 flex items-center gap-1.5">
                        <Terminal className="w-3 h-3 text-[#E50920]" />
                        <span>HANDSHAKE</span>
                      </span>
                      <span className="text-[#E50920] font-bold">
                        {scanStep === 1 && 'SPOOLING...'}
                        {scanStep === 2 && 'CIPHER VERIFIED'}
                        {scanStep === 3 && 'DISPATCHING TOKEN'}
                        {scanStep >= 4 && 'AUTHORIZED'}
                      </span>
                    </div>

                    {/* Stepped progress bar */}
                    <div className="w-full bg-black/50 rounded-full h-1 overflow-hidden border border-white/5">
                      <div
                        className="h-full bg-gradient-to-r from-[#E50920] via-[#FF3B4D] to-emerald-400 transition-all duration-400 ease-out shadow-[0_0_10px_rgba(229,9,32,0.8)]"
                        style={{
                          width:
                            scanStep === 1
                              ? '30%'
                              : scanStep === 2
                              ? '65%'
                              : scanStep === 3
                              ? '90%'
                              : '100%',
                        }}
                      />
                    </div>

                    {/* Dynamic Status Text */}
                    <div className="text-[10px] font-mono text-zinc-300 flex items-center gap-1.5">
                      {scanStep < 4 ? (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#E50920] animate-ping flex-shrink-0" />
                      ) : (
                        <CheckCircle2 className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                      )}
                      <span className="truncate">
                        {scanStep === 1 && `Verifying ${email}...`}
                        {scanStep === 2 && `Validating against ${currentRole.title}...`}
                        {scanStep === 3 && `Authorizing clearance...`}
                        {scanStep >= 4 && `Clearance confirmed! Accessing portal.`}
                      </span>
                    </div>
                  </div>
                )}

                {/* TACTILE 3D CLAY PUSH BUTTON */}
                <div className="pt-0.5">
                  <button
                    type="submit"
                    disabled={authStatus !== 'idle'}
                    className={`w-full py-3 px-5 rounded-xl text-xs font-bold uppercase tracking-wider text-white transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer clay-btn-crimson select-none ${
                      authStatus !== 'idle' ? 'opacity-90 pointer-events-none' : ''
                    }`}
                  >
                    {authStatus === 'idle' && (
                      <>
                        <span>ACCESS {currentRole.shortLabel.toUpperCase()} PORTAL</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}

                    {authStatus === 'scanning' && (
                      <div className="flex items-center gap-2 font-mono text-xs">
                        <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>SYNCHRONIZING...</span>
                      </div>
                    )}

                    {authStatus === 'verifying' && (
                      <div className="flex items-center gap-2 font-mono text-xs">
                        <Cpu className="w-3.5 h-3.5 animate-pulse text-white" />
                        <span>AUTHORIZING SESSION...</span>
                      </div>
                    )}

                    {authStatus === 'granted' && (
                      <div className="flex items-center gap-2 font-mono text-xs text-white">
                        <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                        <span>ACCESS GRANTED</span>
                      </div>
                    )}
                  </button>
                </div>

                {/* Footer Trust Badge */}
                <div className="text-center pt-2 border-t border-white/10">
                  <p className="text-[10px] font-mono text-zinc-400 flex items-center justify-center gap-1">
                    <span className="text-[11px]">🔒</span>
                    <span>Protected by Role-Based JWT Encryption • CCS 2026</span>
                  </p>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Subtle Bottom Footer Info */}
      <div className="max-w-4xl mx-auto w-full pt-4 text-center text-[11px] font-mono text-zinc-500 relative z-10">
        <span>Code & Compute Society (CCS) Central Access Management • All sessions cryptographically verified</span>
      </div>
    </div>
  );
};
