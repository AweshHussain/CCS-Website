import React, { useState, useEffect, useRef } from 'react';
import {
  UserPlus,
  Users,
  Award,
  GraduationCap,
  Copy,
  Check,
  Trash2,
  Eye,
  EyeOff,
  RefreshCw,
  Sparkles,
  AlertCircle,
  Building,
  Mail,
  User,
  Shield,
  Edit3,
  Camera,
  Upload,
  X,
  ChevronDown,
  ShieldCheck,
  Radio,
  FolderGit2,
  BookOpen,
  CheckCircle2,
  Send,
  Sliders,
  AlertTriangle,
  FolderPlus,
  UserCheck,
  Layers,
  Plus,
  UserMinus,
} from 'lucide-react';

export interface TeamGroup {
  id: string;
  name: string;
  code: string;
  description: string;
  memberCount: number;
  maxCapacity: number;
  availableSeats: number;
  isFull: boolean;
  members: { id: string; fullName: string; email: string; avatarUrl?: string; department?: string }[];
  createdAt: string;
}

interface ManagedUser {
  id: string;
  email: string;
  passwordHash?: string;
  password?: string;
  fullName: string;
  role: 'coordinator' | 'student';
  department: string;
  avatarUrl: string;
  groupId?: string | null;
  groupName?: string | null;
  permissions?: {
    canSendEmails?: boolean;
    canBroadcastAnnouncements?: boolean;
    canReviewProjects?: boolean;
    canAssignWork?: boolean;
    canManageAccounts?: boolean;
    [key: string]: boolean | undefined;
  };
  createdAt: string;
}

interface AccountManagementPanelProps {
  currentUser: {
    id: string;
    email: string;
    fullName: string;
    role: string;
    department: string;
    avatarUrl: string;
  };
  token: string;
  onUpdateCurrentUser: (updated: any) => void;
  theme?: 'dark' | 'light';
}

export const AccountManagementPanel: React.FC<AccountManagementPanelProps> = ({
  currentUser,
  token,
  onUpdateCurrentUser,
  theme = 'dark',
}) => {
  const [activeTab, setActiveTab] = useState<'roster' | 'groups' | 'create'>('roster');
  const [usersList, setUsersList] = useState<ManagedUser[]>([]);
  const [groupsList, setGroupsList] = useState<TeamGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});

  // Expandable Panel State (Downward Accordion)
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [togglingPermission, setTogglingPermission] = useState<string | null>(null);

  // Group creation & assignment in Issue Form
  const [studentGroupOption, setStudentGroupOption] = useState<'existing' | 'new' | 'none'>('existing');
  const [selectedExistingGroupId, setSelectedExistingGroupId] = useState<string>('');
  const [newSquadName, setNewSquadName] = useState<string>('');

  // Standalone Squad creation state (Team Squads Tab)
  const [showCreateSquadModal, setShowCreateSquadModal] = useState(false);
  const [newSquadDirectName, setNewSquadDirectName] = useState('');
  const [newSquadDirectDesc, setNewSquadDirectDesc] = useState('');
  const [isCreatingSquad, setIsCreatingSquad] = useState(false);

  // Edit User State
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);
  const [editFullName, setEditFullName] = useState('');
  const [editDepartment, setEditDepartment] = useState('');
  const [editAvatarUrl, setEditAvatarUrl] = useState('');
  const [editAvatarFile, setEditAvatarFile] = useState<File | null>(null);
  const [editAvatarPreview, setEditAvatarPreview] = useState<string>('');
  const [editGroupId, setEditGroupId] = useState<string>('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editError, setEditError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-dismiss success notification after 5 seconds
  useEffect(() => {
    if (!successMessage) return;
    const timer = setTimeout(() => {
      setSuccessMessage('');
    }, 5000);
    return () => clearTimeout(timer);
  }, [successMessage]);

  // New Account Form State
  const [newRole, setNewRole] = useState<'coordinator' | 'student'>('student');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newDepartment, setNewDepartment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch all users
  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/users', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        setUsersList(data.users);
      } else {
        setError(data.message || 'Failed to fetch registered users.');
      }
    } catch (err: any) {
      setError(err.message || 'Error connecting to database server.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch all team squads
  const fetchGroups = async () => {
    try {
      const res = await fetch('/api/team/groups', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.groups)) {
        setGroupsList(data.groups);
        // Default select the first non-full group if none selected
        if (!selectedExistingGroupId) {
          const available = data.groups.find((g: TeamGroup) => !g.isFull);
          if (available) {
            setSelectedExistingGroupId(available.id);
          } else if (data.groups.length > 0) {
            setSelectedExistingGroupId(data.groups[0].id);
          }
        }
      }
    } catch (err: any) {
      console.warn('Failed to load team groups:', err.message);
    }
  };

  // Triggered strictly on click so the user sees it rotating only while actively refreshing
  const handleManualRefresh = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (isRefreshing) return;
    setIsRefreshing(true);
    const start = Date.now();
    try {
      await Promise.all([fetchUsers(), fetchGroups()]);
    } finally {
      const elapsed = Date.now() - start;
      const minDuration = 700; // minimum duration so the rotation motion is visibly clear
      if (elapsed < minDuration) {
        setTimeout(() => setIsRefreshing(false), minDuration - elapsed);
      } else {
        setIsRefreshing(false);
      }
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchGroups();
  }, [token]);

  // Generate random strong password
  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let pass = '';
    for (let i = 0; i < 12; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(pass);
  };

  // Create new user account
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim() || !newPassword.trim()) {
      setError('Email and password are required.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setSuccessMessage('');

    try {
      const payload: any = {
        email: newEmail.trim(),
        password: newPassword,
        fullName: newFullName.trim() || newEmail.split('@')[0],
        role: newRole,
        department: newDepartment.trim() || (newRole === 'coordinator' ? 'Operations & Executive Core' : 'Engineering Core'),
      };

      if (newRole === 'student') {
        payload.groupOption = studentGroupOption;
        if (studentGroupOption === 'existing' && selectedExistingGroupId) {
          payload.existingGroupId = selectedExistingGroupId;
        } else if (studentGroupOption === 'new') {
          payload.newGroupName = newSquadName.trim() || undefined;
        }
      }

      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        const plainPass = newPassword;
        setSuccessMessage(`New credentials created for ${newFullName || newEmail}! Credentials: [Email: ${newEmail.trim()} | Password: ${plainPass}]`);
        setNewEmail('');
        setNewPassword('');
        setNewFullName('');
        setNewDepartment('');
        setNewSquadName('');
        await Promise.all([fetchUsers(), fetchGroups()]);
        setActiveTab('roster');
      } else {
        setError(data.message || 'Failed to create user account.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to connect to backend.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick Assign or Unassign student to squad
  const handleAssignStudentToSquad = async (userId: string, targetGroupId: string | null) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          groupId: targetGroupId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMessage(`Team squad membership updated.`);
        await Promise.all([fetchUsers(), fetchGroups()]);
      } else {
        setError(data.message || 'Failed to update team assignment.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to connect to backend.');
    }
  };

  // Create a squad directly from Team Squads tab
  const handleCreateDirectSquad = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSquadDirectName.trim()) {
      setError('Squad name is required.');
      return;
    }
    setIsCreatingSquad(true);
    try {
      const res = await fetch('/api/team/groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newSquadDirectName.trim(),
          description: newSquadDirectDesc.trim() || 'Engineering & Project Collaboration Squad',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMessage(`New squad "${newSquadDirectName.trim()}" created successfully! (4 open seats)`);
        setNewSquadDirectName('');
        setNewSquadDirectDesc('');
        setShowCreateSquadModal(false);
        await fetchGroups();
      } else {
        setError(data.message || 'Failed to create squad.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to connect to backend.');
    } finally {
      setIsCreatingSquad(false);
    }
  };

  // Remove member from squad
  const handleRemoveMemberFromSquad = async (groupId: string, memberId: string, memberName: string) => {
    if (!window.confirm(`Remove ${memberName} from this squad? They will become unassigned.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/team/groups/${groupId}/remove-member`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ studentId: memberId }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMessage(`${memberName} is now unassigned from the squad.`);
        await Promise.all([fetchUsers(), fetchGroups()]);
      } else {
        setError(data.message || 'Failed to remove member.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to connect to backend.');
    }
  };

  // Delete squad
  const handleDeleteSquad = async (groupId: string, name: string) => {
    if (!window.confirm(`Delete squad "${name}"? All assigned students will become unassigned.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/team/groups/${groupId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMessage(`Squad "${name}" deleted.`);
        await Promise.all([fetchUsers(), fetchGroups()]);
      } else {
        setError(data.message || 'Failed to delete squad.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to connect to backend.');
    }
  };

  // Delete user account
  const handleDeleteUser = async (id: string, name: string) => {
    if (id === currentUser.id) {
      alert('You cannot delete your own active administrator account.');
      return;
    }
    if (!window.confirm(`Are you sure you want to revoke and delete the account for ${name}?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMessage(`Account for ${name} has been deleted.`);
        setUsersList((prev) => prev.filter((u) => u.id !== id));
      } else {
        setError(data.message || 'Failed to delete user.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to connect to backend.');
    }
  };

  // Copy credentials helper
  const copyCredentials = (user: ManagedUser) => {
    const text = `CCS Society Credentials:\nEmail: ${user.email}\nPassword: ${user.password}\nRole: ${user.role.toUpperCase()}`;
    navigator.clipboard.writeText(text);
    setCopiedId(user.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Toggle password visibility for row
  const togglePasswordReveal = (id: string) => {
    setRevealedPasswords((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Open Edit User Modal
  const handleOpenEdit = (user: ManagedUser) => {
    setEditingUser(user);
    setEditFullName(user.fullName || '');
    setEditDepartment(user.department || '');
    setEditAvatarUrl(user.avatarUrl || '');
    setEditGroupId(user.groupId || '');
    setEditAvatarFile(null);
    setEditAvatarPreview(user.avatarUrl || '');
    setEditError('');
  };

  // Handle Photo File Pick
  const handlePhotoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setEditAvatarFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      setEditAvatarPreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Save Edit Profile (Name & Photo)
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    if (!editFullName.trim()) {
      setEditError('Full Name is required.');
      return;
    }

    setIsSavingEdit(true);
    setEditError('');

    try {
      let finalAvatarUrl = editAvatarUrl.trim();

      // 1. If photo file chosen, upload it first
      if (editAvatarFile) {
        const formData = new FormData();
        formData.append('avatar', editAvatarFile);
        const avatarRes = await fetch(`/api/admin/users/${editingUser.id}/avatar`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
        const avatarData = await avatarRes.json();
        if (avatarData.success && avatarData.avatarUrl) {
          finalAvatarUrl = avatarData.avatarUrl;
        }
      }

      // 2. Update user name, department, avatar, and squad assignment
      const res = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fullName: editFullName.trim(),
          department: editDepartment.trim(),
          avatarUrl: finalAvatarUrl,
          groupId: editingUser.role === 'student' ? (editGroupId ? editGroupId : null) : undefined,
        }),
      });

      const data = await res.json();
      if (data.success && data.user) {
        setUsersList((prev) =>
          prev.map((u) =>
            u.id === editingUser.id
              ? { ...u, ...data.user, avatarUrl: finalAvatarUrl || data.user.avatarUrl }
              : u
          )
        );

        if (editingUser.id === currentUser.id) {
          onUpdateCurrentUser({
            ...currentUser,
            ...data.user,
            avatarUrl: finalAvatarUrl || data.user.avatarUrl,
          });
        }

        setSuccessMessage(`Account updated for ${editFullName.trim()}!`);
        setEditingUser(null);
        await Promise.all([fetchUsers(), fetchGroups()]);
      } else {
        setEditError(data.message || 'Failed to update account.');
      }
    } catch (err: any) {
      setEditError(err.message || 'Network error updating user account.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Toggle granular permission (e.g. canSendEmails)
  const handleTogglePermission = async (userId: string, permissionKey: string, newValue: boolean) => {
    setTogglingPermission(`${userId}-${permissionKey}`);
    try {
      const res = await fetch(`/api/admin/users/${userId}/permissions`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          permissions: {
            [permissionKey]: newValue,
          },
        }),
      });

      const data = await res.json();
      if (data.success && data.user) {
        setUsersList((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, permissions: data.user.permissions } : u))
        );

        // Sync localStorage and notify other components if current user was modified
        const saved = localStorage.getItem('ccs_current_user');
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (parsed && (parsed.id === userId || parsed.email === data.user.email)) {
              const updated = { ...parsed, permissions: data.user.permissions };
              localStorage.setItem('ccs_current_user', JSON.stringify(updated));
              window.dispatchEvent(new Event('ccs_auth_change'));
            }
          } catch {}
        }

        const permName = permissionKey === 'canBroadcastAnnouncements'
          ? 'Public Announcements'
          : permissionKey === 'canReviewProjects'
          ? 'Review Project Submissions'
          : permissionKey === 'canAssignWork'
          ? 'Assign Work'
          : permissionKey;
        setSuccessMessage(
          `Permission "${permName}" ${newValue ? 'granted to' : 'revoked from'} ${data.user.fullName}.`
        );
      } else {
        alert(data.message || 'Failed to update permission.');
      }
    } catch (err: any) {
      alert(err.message || 'Network error updating permission.');
    } finally {
      setTogglingPermission(null);
    }
  };

  return (
    <div className="w-full flex flex-col gap-6 animate-in fade-in duration-200">
      {/* Clean Header & Subtabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
        <div>
          <h2 className="text-xl font-bold font-display text-white">Accounts & Access Delegation</h2>
          <p className="text-xs font-mono text-zinc-400 mt-0.5">
            Manage user directory, edit profiles & photos, and share access privileges with faculties & coordinators
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setActiveTab('roster')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
              activeTab === 'roster'
                ? 'bg-white/15 text-white font-medium border border-white/20'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            User Roster ({usersList.length})
          </button>

          <button
            onClick={() => setActiveTab('groups')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-mono transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'groups'
                ? 'bg-emerald-500/20 text-emerald-300 font-medium border border-emerald-500/30'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Team Squads ({groupsList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('create')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
              activeTab === 'create'
                ? 'bg-[#E50920] text-white font-medium'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            + Issue Credentials
          </button>

          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing || loading}
            className="p-1.5 rounded-lg border border-white/10 hover:border-[#E50920]/40 text-zinc-400 hover:text-white transition-colors cursor-pointer group"
            title="Refresh Users & Squads"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 text-[#E50920] transition-transform ${
                isRefreshing ? 'animate-spin' : 'group-hover:rotate-45'
              }`}
            />
          </button>
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
        <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-mono flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ---------------- TAB 1: USER ROSTER ---------------- */}
      {activeTab === 'roster' && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white font-display flex items-center gap-2">
              <Users className="w-4 h-4 text-[#E50920]" />
              <span>Visible User Credentials & Roster</span>
            </h3>
            <span className="text-[11px] font-mono text-zinc-500">
              Click an account to share permissions • Edit name & photo anytime
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3.5">
            {usersList.map((user) => {
              const isRevealed = revealedPasswords[user.id] || false;
              const isMe = user.id === currentUser.id;
              const isExpanded = expandedUserId === user.id;

              // Permissions count
              const perms = user.permissions || {};
              const activeCount = Object.values(perms).filter(Boolean).length;

              return (
                <div
                  key={user.id}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all duration-300 flex flex-col gap-3 bg-[#0B0C10]/92 backdrop-blur-xl shadow-xl shadow-black/40 ${
                    isMe
                      ? 'border-[#E50920]/50 bg-gradient-to-r from-[#E50920]/10 via-[#0B0C10]/95 to-[#0B0C10]/95'
                      : isExpanded
                      ? 'border-white/25 shadow-2xl'
                      : 'border-white/10 hover:border-white/20'
                  }`}
                >
                  {/* Top Row: User Summary & Primary Actions */}
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Left: Avatar + Details */}
                    <div className="flex items-center gap-3.5">
                      {/* Avatar with edit overlay */}
                      <div
                        onClick={() => handleOpenEdit(user)}
                        className="relative group w-12 h-12 rounded-xl overflow-hidden border border-white/15 shrink-0 flex items-center justify-center bg-black/60 cursor-pointer shadow-md"
                        title="Click to edit photo & name"
                      >
                        {user.avatarUrl ? (
                          <img src={user.avatarUrl} alt={user.fullName} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-950 flex items-center justify-center text-white font-bold text-sm">
                            {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                          <Camera className="w-4 h-4" />
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-white text-sm font-display">{user.fullName}</span>
                          {isMe && (
                            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-white/10 text-white border border-white/20">
                              YOU
                            </span>
                          )}
                          <span
                            className={`text-[9px] font-mono px-2 py-0.5 rounded-full uppercase tracking-wider font-semibold ${
                              user.role === 'coordinator'
                                ? 'bg-[#E50920]/20 text-[#E50920] border border-[#E50920]/40'
                                : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                            }`}
                          >
                            {user.role}
                          </span>

                          {/* Team Group Badge for Students */}
                          {user.role === 'student' && (
                            user.groupId && user.groupName ? (
                              <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold flex items-center gap-1">
                                <Users className="w-2.5 h-2.5" />
                                <span>{user.groupName}</span>
                              </span>
                            ) : (
                              <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-zinc-800/90 text-zinc-400 border border-white/10 font-medium flex items-center gap-1">
                                <AlertTriangle className="w-2.5 h-2.5 text-amber-400" />
                                <span>Not Assigned to a Group</span>
                              </span>
                            )
                          )}

                          {/* Announcements Access Pill if active */}
                          {perms.canBroadcastAnnouncements && (
                            <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold flex items-center gap-1">
                              <Radio className="w-2.5 h-2.5" />
                              <span>Announcements</span>
                            </span>
                          )}
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-xs font-mono text-zinc-400 mt-1">
                          <span className="text-zinc-300">{user.email}</span>
                          <span className="hidden sm:inline text-zinc-600">•</span>
                          <span className="text-zinc-500 text-[11px]">{user.department}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Actions Bar */}
                    <div className="flex flex-wrap items-center gap-2 pt-2 lg:pt-0 border-t lg:border-t-0 border-white/10">
                      {/* 1. Edit Name & Photo Button */}
                      <button
                        onClick={() => handleOpenEdit(user)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-zinc-200 hover:text-white transition-all cursor-pointer"
                        title="Edit Name and Photo"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-[#E50920]" />
                        <span>Edit</span>
                      </button>

                      {/* 2. Access & Permissions Downward Accordion Toggle */}
                      <button
                        onClick={() => setExpandedUserId(isExpanded ? null : user.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono transition-all cursor-pointer border ${
                          isExpanded
                            ? 'bg-[#E50920] text-white border-[#E50920] font-semibold shadow-md shadow-[#E50920]/20'
                            : 'bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border-white/10'
                        }`}
                        title="Share Access & Permissions"
                      >
                        <Sliders className="w-3.5 h-3.5" />
                        <span>Access & Privileges</span>
                        <ChevronDown
                          className={`w-3 h-3 transition-transform duration-300 ${
                            isExpanded ? 'rotate-180' : ''
                          }`}
                        />
                      </button>

                      {/* 3. Password Box with Eye Toggle */}
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/60 border border-white/15 font-mono text-xs">
                        <span
                          className="text-emerald-400 text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 font-semibold"
                          title="Encrypted in DB; Decrypted strictly for Lead Coordinator"
                        >
                          {user.password ? 'VAULT' : 'HASH'}
                        </span>
                        <span
                          className="text-zinc-200 font-mono text-[11px] truncate max-w-[100px] sm:max-w-[130px]"
                          title={user.password || user.passwordHash}
                        >
                          {isRevealed ? (user.password || user.passwordHash) : '••••••••'}
                        </span>
                        <button
                          onClick={() => togglePasswordReveal(user.id)}
                          className="ml-1 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                          title={isRevealed ? 'Hide Password' : 'Show Password'}
                        >
                          {isRevealed ? <EyeOff className="w-3.5 h-3.5 text-[#E50920]" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>

                      {/* 4. Copy Credential Button */}
                      <button
                        onClick={() => copyCredentials(user)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-zinc-300 hover:text-white transition-all cursor-pointer"
                        title="Copy Login Credentials"
                      >
                        {copiedId === user.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400 font-semibold">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>

                      {/* 5. Delete Account Button */}
                      {!isMe && (
                        <button
                          onClick={() => handleDeleteUser(user.id, user.fullName)}
                          className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
                          title="Delete User Account"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* ================= DOWNWARD EXPANDABLE ACCESS & PERMISSIONS PANEL ================= */}
                  <div
                    className={`transition-all duration-300 ease-in-out overflow-hidden ${
                      isExpanded
                        ? 'max-h-[850px] opacity-100 mt-2 pt-3 border-t border-white/10'
                        : 'max-h-0 opacity-0 pointer-events-none'
                    }`}
                  >
                    <div className="p-4 sm:p-5 rounded-xl bg-black/50 border border-white/10 flex flex-col gap-4">
                      {/* Downward Panel Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/10">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-[#E50920]/20 text-[#E50920] border border-[#E50920]/40 flex items-center justify-center">
                            <ShieldCheck className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="text-xs sm:text-sm font-bold font-display text-white">
                              Share Access & Capabilities • {user.fullName}
                            </h4>
                            <p className="text-[11px] font-mono text-zinc-400">
                              Toggle privileges below to grant functional access to this user in their portal.
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-start sm:self-auto">
                          {/* Small Refresh Button - Rotates only on click while refreshing */}
                          <button
                            type="button"
                            onClick={handleManualRefresh}
                            disabled={isRefreshing || loading}
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#E50920]/40 text-[10px] font-mono text-zinc-300 hover:text-white transition-all cursor-pointer group shadow-sm"
                            title="Refresh Permissions & Roster"
                          >
                            <RefreshCw
                              className={`w-3 h-3 text-[#E50920] transition-transform ${
                                isRefreshing ? 'animate-spin' : 'group-hover:rotate-45'
                              }`}
                            />
                            <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
                          </button>

                          <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-zinc-300">
                            {activeCount} Shared Privileges Active
                          </span>
                        </div>
                      </div>

                      {/* Granular Permission Toggles */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {/* 1. PUBLIC ANNOUNCEMENT BROADCASTING */}
                        <div
                          className={`p-3.5 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                            perms.canBroadcastAnnouncements
                              ? 'border-amber-500/50 bg-amber-500/10'
                              : 'border-white/5 bg-black/40'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0 mt-0.5">
                              <Radio className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold font-mono text-white">
                                  Public Announcements
                                </span>
                                {perms.canBroadcastAnnouncements && (
                                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-500/30 text-amber-300 font-bold">
                                    ON
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] font-mono text-zinc-400 mt-0.5 leading-relaxed">
                                Allow publishing and editing live announcement banners on the public site ticker.
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              handleTogglePermission(
                                user.id,
                                'canBroadcastAnnouncements',
                                !perms.canBroadcastAnnouncements
                              )
                            }
                            disabled={togglingPermission === `${user.id}-canBroadcastAnnouncements`}
                            className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 mt-1 p-0.5 ${
                              perms.canBroadcastAnnouncements ? 'bg-amber-500' : 'bg-zinc-800'
                            }`}
                          >
                            <div
                              className={`w-5 h-5 rounded-full bg-white transition-transform ${
                                perms.canBroadcastAnnouncements ? 'translate-x-5' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>

                        {/* 3. STUDENT PROJECTS REVIEW VERDICTS */}
                        <div
                          className={`p-3.5 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                            perms.canReviewProjects
                              ? 'border-emerald-500/50 bg-emerald-500/10'
                              : 'border-white/5 bg-black/40'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0 mt-0.5">
                              <FolderGit2 className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold font-mono text-white">
                                  Review Project Submissions
                                </span>
                                {perms.canReviewProjects && (
                                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/30 text-emerald-300 font-bold">
                                    ON
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] font-mono text-zinc-400 mt-0.5 leading-relaxed">
                                Authority to approve, reject, or request changes on student repository submissions.
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              handleTogglePermission(user.id, 'canReviewProjects', !perms.canReviewProjects)
                            }
                            disabled={togglingPermission === `${user.id}-canReviewProjects`}
                            className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 mt-1 p-0.5 ${
                              perms.canReviewProjects ? 'bg-emerald-500' : 'bg-zinc-800'
                            }`}
                          >
                            <div
                              className={`w-5 h-5 rounded-full bg-white transition-transform ${
                                perms.canReviewProjects ? 'translate-x-5' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>

                        {/* 4. WORK & DIRECTIVE ASSIGNMENT */}
                        <div
                          className={`p-3.5 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                            perms.canAssignWork
                              ? 'border-blue-500/50 bg-blue-500/10'
                              : 'border-white/5 bg-black/40'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center shrink-0 mt-0.5">
                              <BookOpen className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold font-mono text-white">
                                  Assign Work Directives
                                </span>
                                {perms.canAssignWork && (
                                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-blue-500/30 text-blue-300 font-bold">
                                    ON
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] font-mono text-zinc-400 mt-0.5 leading-relaxed">
                                Authorize issuing milestone directives and tasks to resident engineering tracks.
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              handleTogglePermission(user.id, 'canAssignWork', !perms.canAssignWork)
                            }
                            disabled={togglingPermission === `${user.id}-canAssignWork`}
                            className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 mt-1 p-0.5 ${
                              perms.canAssignWork ? 'bg-blue-500' : 'bg-zinc-800'
                            }`}
                          >
                            <div
                              className={`w-5 h-5 rounded-full bg-white transition-transform ${
                                perms.canAssignWork ? 'translate-x-5' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>
                      </div>

                      {/* Team Squad Allocation & Direct Reassignment */}
                      {user.role === 'student' && (
                        <div className="p-3.5 rounded-xl border border-white/10 bg-black/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
                              <Users className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold font-mono text-white">
                                  Team Squad Assignment
                                </span>
                                {user.groupId ? (
                                  <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-emerald-500/30 text-emerald-300 font-bold">
                                    {user.groupName}
                                  </span>
                                ) : (
                                  <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">
                                    Unassigned
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] font-mono text-zinc-400 mt-0.5">
                                Reassign this student to any open squad (max 4 students). Updates real-time across dashboards.
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <select
                              value={user.groupId || ''}
                              onChange={(e) => handleAssignStudentToSquad(user.id, e.target.value || null)}
                              className="px-3 py-1.5 rounded-xl bg-black/60 border border-white/15 text-xs text-white font-mono focus:outline-none focus:border-[#E50920] cursor-pointer"
                            >
                              <option value="">No Group (Unassigned)</option>
                              {groupsList.map((g) => (
                                <option
                                  key={g.id}
                                  value={g.id}
                                  disabled={g.isFull && g.id !== user.groupId}
                                >
                                  {g.name} ({g.memberCount}/4) {g.isFull && g.id !== user.groupId ? '[FULL]' : ''}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      )}

                      {/* Footer notice */}
                      <div className="pt-2 flex items-center justify-between text-[11px] font-mono text-zinc-400 border-t border-white/5">
                        <span className="flex items-center gap-1.5 text-zinc-300">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Permissions update live in MongoDB Atlas and take effect immediately.</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => setExpandedUserId(null)}
                          className="text-[#E50920] hover:underline cursor-pointer"
                        >
                          Close Panel ▲
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ---------------- TAB 2: ISSUE NEW CREDENTIALS ---------------- */}
      {activeTab === 'create' && (
        <form onSubmit={handleCreateUser} className="p-6 sm:p-8 rounded-3xl bg-[#0B0C10]/92 backdrop-blur-xl border border-white/10 flex flex-col gap-6 shadow-2xl">
          <div>
            <h3 className="text-lg font-bold font-display text-white mb-1 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-[#E50920]" />
              <span>Issue New Institutional Account</span>
            </h3>
            <p className="text-xs text-zinc-400 font-mono">
              Grant custom email credentials to Student Coordinators or Student Members.
            </p>
          </div>

          {/* Role Selection */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-mono uppercase tracking-wider text-zinc-300">
              Account Role / Clearance Level:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { id: 'coordinator', label: 'Student Coordinator', icon: Shield, desc: 'Operations lead & system admin' },
                { id: 'student', label: 'Student Member', icon: GraduationCap, desc: 'Standard member & sandbox access' },
              ].map((r) => (
                <button
                  type="button"
                  key={r.id}
                  onClick={() => setNewRole(r.id as any)}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                    newRole === r.id
                      ? 'border-[#E50920] bg-[#E50920]/15 shadow-lg shadow-[#E50920]/20'
                      : 'border-white/10 bg-black/30 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <r.icon className={`w-4 h-4 ${newRole === r.id ? 'text-[#E50920]' : 'text-zinc-400'}`} />
                    <span className="font-bold text-xs text-white">{r.label}</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 font-mono leading-relaxed">{r.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-mono text-zinc-300 block mb-1.5 uppercase">Full Name</label>
              <input
                type="text"
                value={newFullName}
                onChange={(e) => setNewFullName(e.target.value)}
                placeholder="e.g. Dr. Rajesh Sharma or Aarav Mehta"
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/15 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#E50920] font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-mono text-zinc-300 block mb-1.5 uppercase">Department / Track</label>
              <input
                type="text"
                value={newDepartment}
                onChange={(e) => setNewDepartment(e.target.value)}
                placeholder="e.g. Computer Science & Engineering"
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/15 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#E50920] font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-mono text-zinc-300 block mb-1.5 uppercase">Email Address *</label>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="e.g. member@ccs-society.org"
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/15 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#E50920] font-mono"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-mono text-zinc-300 uppercase">Initial Password *</label>
                <button
                  type="button"
                  onClick={generatePassword}
                  className="text-[11px] font-mono text-[#E50920] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Generate Strong</span>
                </button>
              </div>
              <input
                type="text"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Set or generate a password"
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/15 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#E50920] font-mono"
              />
            </div>
          </div>

          {/* Team Squad Assignment (Student Members Only) */}
          {newRole === 'student' && (
            <div className="flex flex-col gap-3 p-4 sm:p-5 rounded-2xl bg-black/40 border border-white/10 mt-1">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-2 border-b border-white/5">
                <label className="text-xs font-mono uppercase tracking-wider text-zinc-200 font-bold flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#E50920]" />
                  <span>Student ID Assignment & Team Squad Allocation:</span>
                </label>
                <span className="text-[11px] font-mono text-zinc-400">Strict Capacity: Max 4 Students per Group</span>
              </div>

              {/* 3 Group Assignment Option Tabs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => setStudentGroupOption('existing')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    studentGroupOption === 'existing'
                      ? 'border-[#E50920] bg-[#E50920]/15 text-white font-semibold shadow-md'
                      : 'border-white/10 bg-black/30 text-zinc-400 hover:text-white'
                  }`}
                >
                  <div className="text-xs font-bold mb-0.5 text-[#E50920]">Option A</div>
                  <div className="text-xs font-semibold text-white">Add to Existing Group</div>
                  <div className="text-[10px] font-mono text-zinc-400 mt-1">Choose an active squad with open seats</div>
                </button>

                <button
                  type="button"
                  onClick={() => setStudentGroupOption('new')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    studentGroupOption === 'new'
                      ? 'border-[#E50920] bg-[#E50920]/15 text-white font-semibold shadow-md'
                      : 'border-white/10 bg-black/30 text-zinc-400 hover:text-white'
                  }`}
                >
                  <div className="text-xs font-bold mb-0.5 text-[#E50920]">Option B</div>
                  <div className="text-xs font-semibold text-white">Create a New Group</div>
                  <div className="text-[10px] font-mono text-zinc-400 mt-1">Initialize with 1 student (3 open seats)</div>
                </button>

                <button
                  type="button"
                  onClick={() => setStudentGroupOption('none')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    studentGroupOption === 'none'
                      ? 'border-[#E50920] bg-[#E50920]/15 text-white font-semibold shadow-md'
                      : 'border-white/10 bg-black/30 text-zinc-400 hover:text-white'
                  }`}
                >
                  <div className="text-xs font-bold mb-0.5 text-zinc-400">Option C</div>
                  <div className="text-xs font-semibold text-white">No Group (Unassigned)</div>
                  <div className="text-[10px] font-mono text-zinc-400 mt-1">Keep standalone until assigned later</div>
                </button>
              </div>

              {/* OPTION A: Join Existing Group */}
              {studentGroupOption === 'existing' && (
                <div className="flex flex-col gap-2.5 mt-2">
                  <span className="text-[11px] font-mono text-zinc-300 font-semibold">
                    Select which group the new student should join (max 4 per group):
                  </span>

                  {groupsList.length === 0 ? (
                    <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-mono">
                      No active groups currently found in database. Select <strong>Option B</strong> above to generate a new group!
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {groupsList.map((grp) => {
                        const isSelected = selectedExistingGroupId === grp.id;
                        const isFull = grp.isFull || (grp.memberCount >= 4);
                        const openSeats = Math.max(0, 4 - grp.memberCount);

                        return (
                          <div
                            key={grp.id}
                            onClick={() => {
                              if (!isFull) setSelectedExistingGroupId(grp.id);
                            }}
                            className={`p-3.5 rounded-xl border transition-all ${
                              isFull
                                ? 'opacity-40 cursor-not-allowed bg-black/30 border-white/5'
                                : isSelected
                                ? 'border-emerald-500 bg-emerald-500/15 cursor-pointer shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500/50'
                                : 'border-white/10 bg-black/40 hover:border-white/20 cursor-pointer'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-xs font-bold text-white truncate font-display">{grp.name}</span>
                              <span
                                className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                                  isFull
                                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                }`}
                              >
                                {grp.memberCount}/4 Students
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
                              <span>Code: {grp.code}</span>
                              <span className={isFull ? 'text-rose-400 font-semibold' : 'text-emerald-400 font-semibold'}>
                                {isFull ? 'Capacity Reached (4/4)' : `${openSeats} ${openSeats === 1 ? 'Seat' : 'Seats'} Open`}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* OPTION B: Create New Group */}
              {studentGroupOption === 'new' && (
                <div className="flex flex-col gap-2 mt-2">
                  <label className="text-xs font-mono text-zinc-300 font-semibold">
                    New Group Name:
                  </label>
                  <input
                    type="text"
                    value={newSquadName}
                    onChange={(e) => setNewSquadName(e.target.value)}
                    placeholder={`e.g. Team Squad ${groupsList.length + 1} or Team Vanguard`}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/15 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#E50920] font-mono"
                  />
                  <p className="text-[11px] font-mono text-zinc-400">
                    A new group will be generated with a unique Group ID. The new student will be assigned as member 1 of 4, keeping the remaining 3 seats open for future additions.
                  </p>
                </div>
              )}

              {/* OPTION C: Unassigned */}
              {studentGroupOption === 'none' && (
                <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-white/10 text-zinc-300 text-xs font-mono flex items-start gap-2.5 mt-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-white block mb-0.5">Students Without a Group</span>
                    <p className="text-[11px] text-zinc-400 leading-relaxed">
                      This student will remain standalone in their personal dashboard with "Not Assigned to a Group" status. They will be strictly blocked from viewing other groups' chats or activities until assigned later.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={() => setActiveTab('roster')}
              className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-mono text-zinc-300 hover:text-white cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#E50920] to-[#B20718] hover:from-[#ff1e38] hover:to-[#E50920] text-xs font-bold uppercase tracking-wider text-white shadow-xl shadow-[#E50920]/40 flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
              <span>Issue Credentials</span>
            </button>
          </div>
        </form>
      )}

      {/* ---------------- TAB 3: TEAM SQUADS MANAGEMENT ---------------- */}
      {activeTab === 'groups' && (
        <div className="flex flex-col gap-6 animate-in fade-in duration-200">
          {/* Header & New Squad trigger */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[#0B0C10]/92 border border-white/10 shadow-xl">
            <div>
              <h3 className="text-base font-bold font-display text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-400" />
                <span>Team Squads & Member Allocation</span>
              </h3>
              <p className="text-xs font-mono text-zinc-400 mt-1">
                Collaborative team roster. Each team can contain a maximum of 4 students with private group chat & real-time activity sync.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowCreateSquadModal(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-xs font-mono font-bold transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Squad</span>
            </button>
          </div>

          {/* Squads Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {groupsList.map((grp) => {
              const unassigned = usersList.filter((u) => u.role === 'student' && !u.groupId);
              const isFull = grp.isFull || (grp.memberCount >= 4);
              const slots = [0, 1, 2, 3];

              return (
                <div
                  key={grp.id}
                  className="p-5 sm:p-6 rounded-2xl bg-[#0B0C10]/95 border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between gap-5 shadow-xl shadow-black/40"
                >
                  {/* Top Bar: Squad Name & Badges */}
                  <div>
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold text-sm">
                          {grp.code || 'CCS'}
                        </div>
                        <div>
                          <h4 className="text-base font-bold font-display text-white">{grp.name}</h4>
                          <span className="text-[10px] font-mono text-zinc-500">ID: {grp.id}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-mono font-bold px-2.5 py-1 rounded-full border ${
                            isFull
                              ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                              : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          }`}
                        >
                          {grp.memberCount}/4 Students
                        </span>

                        <button
                          type="button"
                          onClick={() => handleDeleteSquad(grp.id, grp.name)}
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-500/20 text-zinc-400 hover:text-rose-400 transition-colors cursor-pointer"
                          title="Delete Squad"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <p className="text-xs font-mono text-zinc-400 mt-1 line-clamp-2">
                      {grp.description || 'Engineering and project collaboration cohort.'}
                    </p>
                  </div>

                  {/* 4 Member Slots */}
                  <div className="flex flex-col gap-2">
                    <span className="text-[11px] font-mono uppercase text-zinc-500 tracking-wider font-semibold">
                      Team Roster (Max 4 Members):
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {slots.map((idx) => {
                        const member = grp.members?.[idx];

                        if (member) {
                          return (
                            <div
                              key={member.id}
                              className="p-3 rounded-xl bg-black/60 border border-white/10 flex items-center justify-between gap-2"
                            >
                              <div className="flex items-center gap-2.5 overflow-hidden">
                                <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-white/15 overflow-hidden flex items-center justify-center text-xs font-bold text-white shrink-0">
                                  {member.avatarUrl ? (
                                    <img src={member.avatarUrl} alt={member.fullName} className="w-full h-full object-cover" />
                                  ) : (
                                    <span>{member.fullName ? member.fullName.charAt(0).toUpperCase() : 'S'}</span>
                                  )}
                                </div>
                                <div className="overflow-hidden">
                                  <span className="text-xs font-bold text-white truncate block font-display">
                                    {member.fullName}
                                  </span>
                                  <span className="text-[10px] font-mono text-zinc-400 truncate block">
                                    {member.email}
                                  </span>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleRemoveMemberFromSquad(grp.id, member.id, member.fullName)}
                                className="p-1.5 rounded-lg hover:bg-rose-500/20 text-zinc-500 hover:text-rose-400 transition-colors cursor-pointer shrink-0"
                                title="Remove from squad"
                              >
                                <UserMinus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          );
                        }

                        return (
                          <div
                            key={`empty-${idx}`}
                            className="p-3 rounded-xl border border-dashed border-white/10 bg-black/20 flex items-center justify-center text-[11px] font-mono text-zinc-500"
                          >
                            <span>Seat {idx + 1}: Open</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Add Unassigned Student to this Squad (if capacity available) */}
                  {!isFull && unassigned.length > 0 && (
                    <div className="p-3 rounded-xl bg-black/40 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mt-1">
                      <span className="text-xs font-mono text-zinc-300">
                        Assign an unassigned student:
                      </span>

                      <div className="flex items-center gap-2">
                        <select
                          id={`select-unassigned-${grp.id}`}
                          className="px-2.5 py-1.5 rounded-lg bg-black/70 border border-white/15 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                          defaultValue=""
                        >
                          <option value="" disabled>Select student...</option>
                          {unassigned.map((st) => (
                            <option key={st.id} value={st.id}>
                              {st.fullName} ({st.email})
                            </option>
                          ))}
                        </select>

                        <button
                          type="button"
                          onClick={() => {
                            const sel = document.getElementById(`select-unassigned-${grp.id}`) as HTMLSelectElement;
                            if (sel && sel.value) {
                              handleAssignStudentToSquad(sel.value, grp.id);
                            }
                          }}
                          className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-mono font-semibold transition-colors cursor-pointer shrink-0"
                        >
                          Assign
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Standalone Students Section (Requirement 4) */}
          <div className="p-5 sm:p-6 rounded-2xl bg-[#0B0C10]/95 border border-white/10 flex flex-col gap-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold font-display text-white">
                    Students Without a Group ({usersList.filter((u) => u.role === 'student' && !u.groupId).length})
                  </h4>
                  <p className="text-xs font-mono text-zinc-400">
                    These students work individually in their dashboard and have no access to other teams' chats or live activity streams.
                  </p>
                </div>
              </div>
            </div>

            {usersList.filter((u) => u.role === 'student' && !u.groupId).length === 0 ? (
              <div className="p-4 rounded-xl bg-black/40 border border-white/5 text-center text-xs font-mono text-zinc-500">
                ✓ All student members are currently assigned to team squads.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {usersList
                  .filter((u) => u.role === 'student' && !u.groupId)
                  .map((student) => (
                    <div
                      key={student.id}
                      className="p-3.5 rounded-xl bg-black/60 border border-white/10 flex flex-col justify-between gap-3"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-lg bg-zinc-800 border border-white/15 overflow-hidden flex items-center justify-center text-xs font-bold text-white shrink-0">
                          {student.avatarUrl ? (
                            <img src={student.avatarUrl} alt={student.fullName} className="w-full h-full object-cover" />
                          ) : (
                            <span>{student.fullName ? student.fullName.charAt(0).toUpperCase() : 'S'}</span>
                          )}
                        </div>
                        <div className="overflow-hidden">
                          <span className="text-xs font-bold text-white truncate block font-display">
                            {student.fullName}
                          </span>
                          <span className="text-[10px] font-mono text-zinc-400 truncate block">
                            {student.email}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                        <select
                          id={`assign-direct-${student.id}`}
                          className="flex-1 px-2.5 py-1.5 rounded-lg bg-black/80 border border-white/15 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                          defaultValue=""
                        >
                          <option value="" disabled>Select squad...</option>
                          {groupsList
                            .filter((g) => !g.isFull && g.memberCount < 4)
                            .map((g) => (
                              <option key={g.id} value={g.id}>
                                {g.name} ({g.memberCount}/4)
                              </option>
                            ))}
                        </select>

                        <button
                          type="button"
                          onClick={() => {
                            const sel = document.getElementById(`assign-direct-${student.id}`) as HTMLSelectElement;
                            if (sel && sel.value) {
                              handleAssignStudentToSquad(student.id, sel.value);
                            }
                          }}
                          className="px-3 py-1.5 rounded-lg bg-[#E50920] hover:bg-[#ff1e38] text-white text-xs font-mono font-semibold transition-colors cursor-pointer shrink-0"
                        >
                          Assign
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Create Squad Modal */}
          {showCreateSquadModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
              <div className="relative w-full max-w-md rounded-2xl bg-[#0B0C10] border border-white/15 shadow-2xl p-6 overflow-hidden z-10">
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-500 to-transparent" />

                <button
                  type="button"
                  onClick={() => setShowCreateSquadModal(false)}
                  className="absolute top-5 right-5 p-1.5 rounded-lg text-zinc-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                    <Plus className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold font-display text-white">
                      Create New Team Squad
                    </h3>
                    <p className="text-xs font-mono text-zinc-400">
                      Spins up a 4-seat collaboration squad
                    </p>
                  </div>
                </div>

                <form onSubmit={handleCreateDirectSquad} className="space-y-4">
                  <div>
                    <label className="text-xs font-mono text-zinc-300 block mb-1 uppercase font-semibold">
                      Squad Name *
                    </label>
                    <input
                      type="text"
                      value={newSquadDirectName}
                      onChange={(e) => setNewSquadDirectName(e.target.value)}
                      placeholder={`e.g. Team Squad ${groupsList.length + 1} or Team Quantum`}
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/15 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-mono text-zinc-300 block mb-1 uppercase font-semibold">
                      Project Objective / Description
                    </label>
                    <textarea
                      rows={3}
                      value={newSquadDirectDesc}
                      onChange={(e) => setNewSquadDirectDesc(e.target.value)}
                      placeholder="Describe the project domain or engineering focus of this squad..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/15 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 font-mono resize-none"
                    />
                  </div>

                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[11px] font-mono">
                    ✓ Maximum 4 students capacity is automatically enforced. Team chat room and activity feed will be initialized automatically.
                  </div>

                  <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/10">
                    <button
                      type="button"
                      onClick={() => setShowCreateSquadModal(false)}
                      className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-mono text-zinc-400 hover:text-white cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isCreatingSquad}
                      className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-mono font-semibold transition-colors cursor-pointer flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                    >
                      {isCreatingSquad ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Creating...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Create Squad</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= EDIT USER PROFILE & PHOTO MODAL ================= */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-2xl bg-[#0B0C10] border border-white/15 shadow-2xl p-6 sm:p-7 overflow-hidden z-10">
            {/* Top red accent stripe */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#E50920] to-transparent" />

            <button
              onClick={() => setEditingUser(null)}
              className="absolute top-5 right-5 p-1.5 rounded-lg text-zinc-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-[#E50920]/15 text-[#E50920] border border-[#E50920]/30 flex items-center justify-center">
                <Edit3 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold font-display text-white">
                  Edit Account Profile
                </h3>
                <p className="text-xs font-mono text-zinc-400">
                  Update name and profile photo for {editingUser.email}
                </p>
              </div>
            </div>

            {editError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-400 text-xs font-mono flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-4">
              {/* Photo Upload & Preview */}
              <div className="flex items-center gap-4 p-3 rounded-xl bg-black/40 border border-white/10">
                <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-white/20 bg-zinc-900 shrink-0 flex items-center justify-center">
                  {editAvatarPreview ? (
                    <img src={editAvatarPreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-950 flex items-center justify-center text-white font-bold text-xl">
                      {editFullName ? editFullName.charAt(0).toUpperCase() : 'U'}
                    </div>
                  )}
                </div>

                <div className="flex-1 flex flex-col gap-1.5">
                  <span className="text-xs font-mono text-white font-semibold">Account Photo</span>
                  <p className="text-[11px] font-mono text-zinc-400">Upload a picture (JPG, PNG, WEBP, max 5MB)</p>
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handlePhotoFileChange}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-mono text-white transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <Camera className="w-3.5 h-3.5 text-[#E50920]" />
                      <span>Choose Image</span>
                    </button>
                    {editAvatarFile && (
                      <span className="text-[11px] font-mono text-emerald-400 truncate max-w-[130px]">
                        {editAvatarFile.name}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Photo URL fallback */}
              <div>
                <label className="text-xs font-mono text-zinc-400 block mb-1 uppercase">
                  Or Image Web URL (Optional)
                </label>
                <input
                  type="url"
                  value={editAvatarUrl}
                  onChange={(e) => {
                    setEditAvatarUrl(e.target.value);
                    if (!editAvatarFile) setEditAvatarPreview(e.target.value);
                  }}
                  placeholder="https://example.com/avatar.jpg"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/15 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#E50920] font-mono"
                />
              </div>

              {/* Full Name */}
              <div>
                <label className="text-xs font-mono text-zinc-400 block mb-1 uppercase">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  placeholder="e.g. Dr. Rajesh Sharma"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/15 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#E50920] font-mono"
                />
              </div>

              {/* Department */}
              <div>
                <label className="text-xs font-mono text-zinc-400 block mb-1 uppercase">
                  Department / Track
                </label>
                <input
                  type="text"
                  value={editDepartment}
                  onChange={(e) => setEditDepartment(e.target.value)}
                  placeholder="e.g. Department of Computer Science & Engineering"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/15 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#E50920] font-mono"
                />
              </div>

              {/* Squad Assignment (for Students) */}
              {editingUser.role === 'student' && (
                <div>
                  <label className="text-xs font-mono text-zinc-400 block mb-1 uppercase">
                    Team Squad Assignment
                  </label>
                  <select
                    value={editGroupId}
                    onChange={(e) => setEditGroupId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/15 text-xs text-white focus:outline-none focus:border-[#E50920] font-mono cursor-pointer"
                  >
                    <option value="">Not Assigned to a Group (Solo)</option>
                    {groupsList.map((g) => (
                      <option
                        key={g.id}
                        value={g.id}
                        disabled={g.isFull && g.id !== editingUser.groupId}
                      >
                        {g.name} ({g.memberCount}/4 students) {g.isFull && g.id !== editingUser.groupId ? '- FULL' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-mono text-zinc-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="px-5 py-2 rounded-xl bg-[#E50920] hover:bg-[#ff1e38] text-white text-xs font-mono font-semibold transition-colors cursor-pointer flex items-center gap-1.5 shadow-lg shadow-[#E50920]/25 disabled:opacity-50"
                >
                  {isSavingEdit ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Save Profile</span>
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
