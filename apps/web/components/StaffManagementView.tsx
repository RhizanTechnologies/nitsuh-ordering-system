'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAppStore } from '@/lib/store';
import { fetchApi } from '@/lib/api';
import {
  Users,
  UserPlus,
  KeyRound,
  ShieldAlert,
  Search,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  Copy,
  Check,
  Edit2,
  Lock,
  Power,
  RotateCcw,
  Sparkles,
  Info,
  ShieldCheck,
  Smartphone,
  ChefHat,
  MonitorCheck,
  Boxes,
  LayoutGrid,
  BarChart3,
  X,
  Trash2,
} from 'lucide-react';
import { StaffAvatarUploader, AVATAR_PRESETS } from './StaffAvatarUploader';
import { Button, Badge, Input, Card } from '@/components/ui';

interface StaffMember {
  id: string;
  name: string;
  employeeCode: string;
  email: string;
  role: string;
  pinCode: string;
  isActive: boolean;
  avatarUrl?: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    ordersCreated: number;
    ordersWaitered: number;
    shifts: number;
  };
}

interface ResetRequest {
  id: string;
  userId: string;
  user?: StaffMember;
  status: 'PENDING' | 'RESOLVED' | 'DISMISSED';
  requestedAt: string;
  note?: string;
  role?: string;
  employeeCode?: string;
  employeeName?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  generatedCredential?: string;
  credentialType?: 'PIN' | 'PASSWORD';
}

export function StaffManagementView() {
  const { currentUser } = useAppStore();
  const isOwner = currentUser?.role === 'OWNER';
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Reset Requests state
  const [resetRequests, setResetRequests] = useState<ResetRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [resolvingRequestId, setResolvingRequestId] = useState<string | null>(null);
  const [generatedCredentialAlert, setGeneratedCredentialAlert] = useState<{
    userName: string;
    type: 'PIN' | 'PASSWORD';
    value: string;
  } | null>(null);
  const [copiedAlertCredential, setCopiedAlertCredential] = useState(false);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [activeOnly, setActiveOnly] = useState<boolean>(false);

  // Revealed PIN codes
  const [revealedPins, setRevealedPins] = useState<Record<string, boolean>>({});
  const [copiedPinId, setCopiedPinId] = useState<string | null>(null);

  // Modals state
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isResetPinOpen, setIsResetPinOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);

  // Form states: Register
  const [formName, setFormName] = useState('');
  const [formRole, setFormRole] = useState('WAITER');
  const [formEmployeeCode, setFormEmployeeCode] = useState('');
  const [formPin, setFormPin] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formAvatar, setFormAvatar] = useState(AVATAR_PRESETS[0]);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Form states: Reset PIN
  const [newPin, setNewPin] = useState('');

  // Form states: Edit
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editCode, setEditCode] = useState('');
  const [editAvatar, setEditAvatar] = useState('');

  // Form states: Password
  const [newPassword, setNewPassword] = useState('');

  const loadStaff = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchApi('/users');
      if (Array.isArray(data)) {
        setStaffList(data);
      }
    } catch (err: any) {
      console.error('Failed to load users:', err);
      setError(err.message || 'Failed to load staff list. Owner or Manager authentication required.');
    } finally {
      setLoading(false);
    }
  };

  const loadResetRequests = async () => {
    try {
      setLoadingRequests(true);
      const data = await fetchApi('/users/reset-requests');
      if (Array.isArray(data)) {
        setResetRequests(data);
      }
    } catch (err) {
      console.error('Failed to load reset requests:', err);
    } finally {
      setLoadingRequests(false);
    }
  };

  useEffect(() => {
    loadStaff();
    loadResetRequests();
  }, []);

  const handleResolveRequest = async (
    request: ResetRequest,
    action: 'GENERATE_PIN' | 'GENERATE_PASSWORD' | 'DISMISS',
  ) => {
    setResolvingRequestId(request.id);
    try {
      const res = await fetchApi(`/users/resolve-reset-request/${request.id}`, {
        method: 'POST',
        body: JSON.stringify({ action }),
      });

      if (res.credential) {
        setGeneratedCredentialAlert({
          userName: request.employeeName || request.user?.name || 'Staff Member',
          type: res.type || (action === 'GENERATE_PASSWORD' ? 'PASSWORD' : 'PIN'),
          value: res.credential,
        });
      }

      triggerToast(res.message || 'Reset request resolved successfully!');
      loadResetRequests();
      loadStaff();
    } catch (err: any) {
      alert(err.message || 'Failed to resolve request');
    } finally {
      setResolvingRequestId(null);
    }
  };

  const handleInstantGeneratePin = async (staff: StaffMember) => {
    if (!isOwner && staff.role === 'OWNER') {
      alert('Managers cannot alter Owner credentials.');
      return;
    }
    try {
      const res = await fetchApi(`/users/${staff.id}/generate-pin`, {
        method: 'POST',
      });
      setGeneratedCredentialAlert({
        userName: staff.name,
        type: 'PIN',
        value: res.pinCode,
      });
      triggerToast(`Generated new PIN ${res.pinCode} for ${staff.name}!`);
      loadStaff();
    } catch (err: any) {
      alert(err.message || 'Failed to generate PIN');
    }
  };

  const triggerToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 4500);
  };

  const generateRandomPin = () => {
    const pin = Math.floor(1000 + Math.random() * 9000).toString();
    return pin;
  };

  const handleOpenRegister = () => {
    setFormName('');
    setFormRole('WAITER');
    setFormEmployeeCode('');
    setFormPin(generateRandomPin());
    setFormPassword('');
    setFormAvatar(AVATAR_PRESETS[Math.floor(Math.random() * AVATAR_PRESETS.length)]);
    setModalError(null);
    setIsRegisterOpen(true);
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setModalError('Employee full name is required');
      return;
    }
    if (!formPin.trim() || !/^\d{4,6}$/.test(formPin.trim())) {
      setModalError('PIN must be 4 to 6 numeric digits');
      return;
    }

    setFormSubmitting(true);
    setModalError(null);

    try {
      const res = await fetchApi('/users', {
        method: 'POST',
        body: JSON.stringify({
          name: formName.trim(),
          role: formRole,
          employeeCode: formEmployeeCode.trim() || undefined,
          pinCode: formPin.trim(),
          password: formPassword.trim() || undefined,
          avatarUrl: formAvatar || undefined,
        }),
      });

      triggerToast(`Staff member "${res.name}" registered with Code ${res.employeeCode} and PIN ${res.pinCode}!`);
      setIsRegisterOpen(false);
      loadStaff();
    } catch (err: any) {
      setModalError(err.message || 'Failed to register employee');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleOpenResetPin = (staff: StaffMember) => {
    if (!isOwner && staff.role === 'OWNER') {
      alert('Managers cannot alter Owner credentials.');
      return;
    }
    setSelectedStaff(staff);
    setNewPin(generateRandomPin());
    setModalError(null);
    setIsResetPinOpen(true);
  };

  const handleResetPinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaff) return;
    if (!newPin.trim() || !/^\d{4,6}$/.test(newPin.trim())) {
      setModalError('PIN must be 4 to 6 numeric digits');
      return;
    }

    setFormSubmitting(true);
    setModalError(null);

    try {
      await fetchApi(`/users/${selectedStaff.id}/pin`, {
        method: 'PATCH',
        body: JSON.stringify({ pinCode: newPin.trim() }),
      });

      triggerToast(`PIN for ${selectedStaff.name} updated to ${newPin.trim()}`);
      setIsResetPinOpen(false);
      loadStaff();
    } catch (err: any) {
      setModalError(err.message || 'Failed to reset PIN');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleOpenEdit = (staff: StaffMember) => {
    if (!isOwner && staff.role === 'OWNER') {
      alert('Managers cannot edit Owner profiles.');
      return;
    }
    setSelectedStaff(staff);
    setEditName(staff.name);
    setEditRole(staff.role);
    setEditCode(staff.employeeCode);
    setEditAvatar(staff.avatarUrl || AVATAR_PRESETS[0]);
    setModalError(null);
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaff) return;

    setFormSubmitting(true);
    setModalError(null);

    try {
      await fetchApi(`/users/${selectedStaff.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: editName.trim(),
          role: editRole,
          employeeCode: editCode.trim(),
          avatarUrl: editAvatar || null,
        }),
      });

      triggerToast(`Profile for ${editName} updated successfully`);
      setIsEditOpen(false);
      loadStaff();
    } catch (err: any) {
      setModalError(err.message || 'Failed to update staff profile');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleToggleStatus = async (staff: StaffMember) => {
    if (!isOwner && staff.role === 'OWNER') {
      alert('Managers cannot alter Owner status.');
      return;
    }
    if (staff.id === currentUser?.id) {
      alert('You cannot deactivate your own active session!');
      return;
    }

    const action = staff.isActive ? 'deactivate' : 'activate';
    if (!confirm(`Are you sure you want to ${action} ${staff.name}?`)) return;

    try {
      await fetchApi(`/users/${staff.id}/toggle-status`, { method: 'PATCH' });
      triggerToast(`${staff.name} is now ${staff.isActive ? 'inactive (locked out)' : 'active'}`);
      loadStaff();
    } catch (err: any) {
      alert(err.message || 'Failed to toggle status');
    }
  };

  const handleArchiveStaff = async (staff: StaffMember) => {
    if (staff.role === 'OWNER') {
      alert('The Owner account cannot be deleted or archived.');
      return;
    }
    if (!confirm(`Are you sure you want to archive/remove staff member "${staff.name}"? This removes them from active terminals while safely preserving past audit logs.`)) return;

    try {
      const res = await fetchApi(`/users/${staff.id}`, { method: 'DELETE' });
      triggerToast(res?.message || `Staff member "${staff.name}" archived.`);
      loadStaff();
    } catch (err: any) {
      alert(err.message || 'Failed to archive staff');
    }
  };

  const handleOpenPasswordModal = (staff: StaffMember) => {
    if (!isOwner && staff.role === 'OWNER') {
      alert('Managers cannot reset Owner password.');
      return;
    }
    setSelectedStaff(staff);
    setNewPassword('');
    setModalError(null);
    setIsPasswordModalOpen(true);
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaff) return;
    if (newPassword.length < 6) {
      setModalError('Password must be at least 6 characters');
      return;
    }

    setFormSubmitting(true);
    try {
      await fetchApi(`/users/${selectedStaff.id}/password`, {
        method: 'PATCH',
        body: JSON.stringify({ password: newPassword }),
      });
      triggerToast(`Manager password updated for ${selectedStaff.name}`);
      setIsPasswordModalOpen(false);
    } catch (err: any) {
      setModalError(err.message || 'Failed to update password');
    } finally {
      setFormSubmitting(false);
    }
  };

  const togglePinVisibility = (id: string) => {
    setRevealedPins((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const copyToClipboard = (pin: string, id: string) => {
    navigator.clipboard.writeText(pin);
    setCopiedPinId(id);
    setTimeout(() => setCopiedPinId(null), 2000);
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'OWNER':
        return { label: 'Owner / Executive', color: 'bg-rose-100 dark:bg-rose-500/20 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-500/40', icon: ShieldCheck };
      case 'MANAGER':
        return { label: 'General Manager', color: 'bg-purple-100 dark:bg-purple-500/20 text-purple-800 dark:text-purple-300 border-purple-300 dark:border-purple-500/40', icon: LayoutGrid };
      case 'CASHIER':
        return { label: 'Cashier / POS', color: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/40', icon: MonitorCheck };
      case 'WAITER':
        return { label: 'Service Waiter', color: 'bg-blue-100 dark:bg-blue-500/20 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-500/40', icon: Smartphone };
      case 'KITCHEN_STAFF':
        return { label: 'Kitchen Cook', color: 'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-500/40', icon: ChefHat };
      case 'HEAD_CHEF':
        return { label: 'Head Chef', color: 'bg-orange-100 dark:bg-orange-500/20 text-orange-800 dark:text-orange-300 border-orange-300 dark:border-orange-500/40', icon: ChefHat };
      case 'MAIN_STOREKEEPER':
        return { label: 'Main Storekeeper', color: 'bg-cyan-100 dark:bg-cyan-500/20 text-cyan-800 dark:text-cyan-300 border-cyan-300 dark:border-cyan-500/40', icon: Boxes };
      case 'KITCHEN_STOREKEEPER':
        return { label: 'Kitchen Storekeeper', color: 'bg-teal-100 dark:bg-teal-500/20 text-teal-800 dark:text-teal-300 border-teal-300 dark:border-teal-500/40', icon: Boxes };
      default:
        return { label: role, color: 'bg-stone-100 dark:bg-white/10 text-stone-800 dark:text-white border-stone-300 dark:border-white/20', icon: Users };
    }
  };

  // Visible staff (Managers must NEVER see Owner information or accounts)
  const visibleStaffList = useMemo(() => {
    return staffList.filter((s) => isOwner || s.role !== 'OWNER');
  }, [staffList, isOwner]);

  // Filtered staff
  const filteredStaff = useMemo(() => {
    return visibleStaffList.filter((s) => {
      if (activeOnly && !s.isActive) return false;
      if (roleFilter !== 'ALL' && s.role !== roleFilter) return false;
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const matchName = s.name.toLowerCase().includes(q);
        const matchCode = s.employeeCode?.toLowerCase().includes(q);
        const matchRole = s.role.toLowerCase().includes(q);
        return matchName || matchCode || matchRole;
      }
      return true;
    });
  }, [visibleStaffList, activeOnly, roleFilter, searchTerm]);

  const totalStaff = visibleStaffList.length;
  const activeStaff = visibleStaffList.filter((s) => s.isActive).length;
  const frontOfHouse = visibleStaffList.filter((s) => s.role === 'CASHIER' || s.role === 'WAITER').length;
  const kitchenStaff = visibleStaffList.filter((s) => s.role === 'KITCHEN_STAFF' || s.role === 'HEAD_CHEF').length;
  const storeStaff = visibleStaffList.filter((s) => s.role === 'MAIN_STOREKEEPER' || s.role === 'KITCHEN_STOREKEEPER').length;

  const visibleResetRequests = useMemo(() => {
    return resetRequests.filter((r) => isOwner || r.role !== 'OWNER');
  }, [resetRequests, isOwner]);

  return (
    <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 lg:p-8 no-scrollbar">
      <div className="max-w-7xl mx-auto space-y-6 pb-16">
        {/* Toast Notification */}
      {successToast && (
        <div className="fixed top-20 right-5 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 animate-in fade-in slide-in-from-top-3 duration-200">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span className="text-xs font-black">{successToast}</span>
        </div>
      )}

      {/* Main Header Card */}
      <div className="bg-white dark:bg-[#161311] border border-stone-200/90 dark:border-white/10 rounded-3xl p-4 sm:p-6 lg:p-7 shadow-sm transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0 mt-0.5 sm:mt-0 shadow-xs">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-stone-900 dark:text-white tracking-tight leading-tight">
                  Staff & User Management
                </h1>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30 whitespace-nowrap shrink-0 shadow-2xs">
                  {isOwner ? 'Owner Terminal' : 'Manager Console'}
                </span>
              </div>
              <p className="text-xs text-stone-500 dark:text-zinc-400 font-medium mt-0.5">
                Manage team profiles, station roles, and instant terminal PIN codes
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 w-full sm:w-auto">
            <Button
              variant="primary"
              size="default"
              onClick={handleOpenRegister}
              className="flex-1 sm:flex-initial justify-center shadow-xs"
            >
              <UserPlus className="w-4 h-4" />
              <span className="whitespace-nowrap">+ Register New Staff</span>
            </Button>
            <Button
              variant="secondary"
              size="icon"
              onClick={loadStaff}
              title="Refresh Staff List"
              className="shrink-0"
            >
              <RotateCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 sm:gap-3 mt-5 pt-5 border-t border-stone-200/80 dark:border-white/10">
          <div className="bg-stone-50 dark:bg-white/[0.03] p-3 rounded-2xl border border-stone-200/80 dark:border-white/10">
            <div className="text-[10px] font-bold text-stone-500 dark:text-zinc-400 uppercase tracking-wider">Total Registered</div>
            <div className="text-xl font-black text-stone-900 dark:text-white mt-0.5">{totalStaff}</div>
            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">{activeStaff} Active on Duty</div>
          </div>

          <div className="bg-stone-50 dark:bg-white/[0.03] p-3 rounded-2xl border border-stone-200/80 dark:border-white/10">
            <div className="text-[10px] font-bold text-stone-500 dark:text-zinc-400 uppercase tracking-wider">Front of House</div>
            <div className="text-xl font-black text-stone-900 dark:text-white mt-0.5">{frontOfHouse}</div>
            <div className="text-[10px] text-stone-500 dark:text-zinc-400">Cashiers & Waiters</div>
          </div>

          <div className="bg-stone-50 dark:bg-white/[0.03] p-3 rounded-2xl border border-stone-200/80 dark:border-white/10">
            <div className="text-[10px] font-bold text-stone-500 dark:text-zinc-400 uppercase tracking-wider">Kitchen & Chefs</div>
            <div className="text-xl font-black text-stone-900 dark:text-white mt-0.5">{kitchenStaff}</div>
            <div className="text-[10px] text-stone-500 dark:text-zinc-400">Cooks & Head Chefs</div>
          </div>

          <div className="bg-stone-50 dark:bg-white/[0.03] p-3 rounded-2xl border border-stone-200/80 dark:border-white/10">
            <div className="text-[10px] font-bold text-stone-500 dark:text-zinc-400 uppercase tracking-wider">Storekeepers</div>
            <div className="text-xl font-black text-stone-900 dark:text-white mt-0.5">{storeStaff}</div>
            <div className="text-[10px] text-stone-500 dark:text-zinc-400">Dual Store Inventory</div>
          </div>

          <div className="bg-stone-50 dark:bg-white/[0.03] p-3 rounded-2xl border border-stone-200/80 dark:border-white/10 col-span-2 sm:col-span-1">
            <div className="text-[10px] font-bold text-stone-500 dark:text-zinc-400 uppercase">Internal Identifiers</div>
            <div className="text-xl font-black text-amber-600 dark:text-amber-400 mt-0.5">EMP-001+</div>
            <div className="text-[10px] text-stone-500 dark:text-zinc-400">No Email / Phone Needed</div>
          </div>
        </div>
      </div>

      {/* Generated Credential Banner Alert */}
      {generatedCredentialAlert && (
        <div className="bg-emerald-500/10 border-2 border-emerald-500/40 rounded-3xl p-5 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-black uppercase text-emerald-800 dark:text-emerald-300">
                New {generatedCredentialAlert.type} Generated for {generatedCredentialAlert.userName}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="font-mono text-xl font-black bg-white dark:bg-black/30 px-3 py-1 rounded-xl border border-emerald-500/40 text-stone-900 dark:text-white tracking-widest select-all">
                  {generatedCredentialAlert.value}
                </span>
                <span className="text-[11px] text-stone-600 dark:text-zinc-400">
                  (Communicate this credential to the employee)
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(generatedCredentialAlert.value);
                setCopiedAlertCredential(true);
                setTimeout(() => setCopiedAlertCredential(false), 2000);
              }}
            >
              {copiedAlertCredential ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4 text-white" />}
              <span>{copiedAlertCredential ? 'Copied!' : 'Copy Code'}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setGeneratedCredentialAlert(null)}
            >
              Dismiss
            </Button>
          </div>
        </div>
      )}

      {/* Pending Reset Requests Section */}
      {visibleResetRequests.filter((r) => r.status === 'PENDING').length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-3xl p-5 sm:p-6 shadow-sm space-y-3 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-400">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-black text-stone-900 dark:text-white flex items-center gap-2">
                  PIN & Password Reset Requests
                  <Badge variant="warning">
                    {visibleResetRequests.filter((r) => r.status === 'PENDING').length} Pending
                  </Badge>
                </h2>
                <p className="text-[11px] text-stone-600 dark:text-zinc-400">
                  Employees requesting new credentials from the login screen
                </p>
              </div>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={loadResetRequests}
            >
              <RotateCcw className={`w-3.5 h-3.5 ${loadingRequests ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
            {visibleResetRequests
              .filter((r) => r.status === 'PENDING')
              .map((req) => {
                const isManagementRole = req.role === 'OWNER' || req.role === 'MANAGER';
                return (
                  <div
                    key={req.id}
                    className="bg-white dark:bg-[#1C1815] border border-amber-500/30 rounded-2xl p-4 shadow-xs space-y-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <div className="text-xs font-black text-stone-900 dark:text-white">
                          {req.employeeName || req.user?.name || 'Staff Member'}
                        </div>
                        <div className="text-[10px] text-stone-500 dark:text-zinc-400 font-mono">
                          {req.employeeCode || req.user?.employeeCode || 'STAFF'} • {req.role || req.user?.role}
                        </div>
                      </div>
                      <Badge variant="warning">Reset Needed</Badge>
                    </div>

                    <div className="text-[11px] bg-stone-50 dark:bg-white/[0.04] p-2.5 rounded-xl border border-stone-200/80 dark:border-white/10 text-stone-700 dark:text-zinc-300 italic">
                      "{req.note || 'Forgot credentials / PIN'}"
                    </div>

                    <div className="flex items-center gap-2 pt-1 border-t border-stone-100 dark:border-white/10">
                      {isManagementRole ? (
                        <Button
                          variant="primary"
                          size="sm"
                          disabled={resolvingRequestId === req.id}
                          onClick={() => handleResolveRequest(req, 'GENERATE_PASSWORD')}
                          className="flex-1"
                        >
                          <Lock className="w-3.5 h-3.5" />
                          <span>Generate Password</span>
                        </Button>
                      ) : (
                        <Button
                          variant="primary"
                          size="sm"
                          disabled={resolvingRequestId === req.id}
                          onClick={() => handleResolveRequest(req, 'GENERATE_PIN')}
                          className="flex-1"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                          <span>Generate New PIN</span>
                        </Button>
                      )}

                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={resolvingRequestId === req.id}
                        onClick={() => handleResolveRequest(req, 'DISMISS')}
                      >
                        Dismiss
                      </Button>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Search & Role Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 dark:text-zinc-500" />
          <input
            type="text"
            placeholder="Search by name, employee code (EMP-001), or role..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white dark:bg-[#161311] border border-stone-200 dark:border-white/10 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-stone-900 dark:text-white placeholder-stone-400 dark:placeholder-zinc-600 focus:outline-none focus:border-amber-500 shadow-xs"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
          {[
            { id: 'ALL', label: 'All Roles' },
            ...(isOwner ? [{ id: 'OWNER', label: 'Owner' }] : []),
            { id: 'CASHIER', label: 'Cashiers' },
            { id: 'WAITER', label: 'Waiters' },
            { id: 'KITCHEN_STAFF', label: 'Kitchen' },
            { id: 'MAIN_STOREKEEPER', label: 'Storekeepers' },
            { id: 'MANAGER', label: 'Managers' },
          ].map((tab) => (
            <Button
              key={tab.id}
              variant={roleFilter === tab.id ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setRoleFilter(tab.id)}
              className="shrink-0 whitespace-nowrap"
            >
              {tab.label}
            </Button>
          ))}

          <label className="flex items-center gap-1.5 text-xs font-bold text-stone-600 dark:text-zinc-400 ml-2 cursor-pointer flex-shrink-0 select-none">
            <input
              type="checkbox"
              checked={activeOnly}
              onChange={(e) => setActiveOnly(e.target.checked)}
              className="rounded accent-amber-500"
            />
            <span>Active Only</span>
          </label>
        </div>
      </div>

      {/* Staff Grid */}
      {loading ? (
        <div className="p-12 text-center text-xs font-bold text-stone-500 dark:text-zinc-400">
          Loading Nitsuh staff database...
        </div>
      ) : filteredStaff.length === 0 ? (
        <div className="bg-white dark:bg-[#161311] border border-stone-200 dark:border-white/10 rounded-3xl p-8 text-center text-stone-500 dark:text-zinc-400">
          <p className="font-bold text-sm">No staff members found matching your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStaff.map((staff) => {
            const roleInfo = getRoleBadge(staff.role);
            const RoleIcon = roleInfo.icon;
            const isPinRevealed = revealedPins[staff.id];
            const isCopied = copiedPinId === staff.id;

            return (
              <div
                key={staff.id}
                className={`bg-white dark:bg-[#161311] border rounded-3xl p-5 shadow-xs transition hover:shadow-md relative overflow-hidden flex flex-col justify-between ${
                  staff.role === 'OWNER'
                    ? 'border-amber-400 dark:border-amber-500/60 ring-2 ring-amber-400/20 bg-gradient-to-b from-amber-50/40 via-white to-white dark:from-amber-950/20 dark:via-[#161311] dark:to-[#161311]'
                    : staff.isActive
                    ? 'border-stone-200/90 dark:border-white/10'
                    : 'border-rose-300 dark:border-rose-900/40 bg-stone-50/50 dark:bg-stone-950/20 opacity-80'
                }`}
              >
                {staff.role === 'OWNER' && (
                  <div className="absolute top-0 right-0 bg-gradient-to-r from-amber-500 to-orange-500 text-stone-950 text-[9px] font-black uppercase tracking-wider px-3 py-0.5 rounded-bl-xl shadow-xs">
                    ★ Executive Owner
                  </div>
                )}
                <div>
                  {/* Top: Avatar, Name, Code, and Status Badge */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {staff.avatarUrl ? (
                        <img
                          src={staff.avatarUrl}
                          alt={staff.name}
                          className="w-12 h-12 rounded-2xl object-cover ring-2 ring-amber-400/30 flex-shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30 flex items-center justify-center font-black text-base flex-shrink-0">
                          {staff.name.charAt(0)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <h2 className="text-sm font-black text-stone-900 dark:text-white truncate">
                          {staff.name}
                        </h2>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="font-mono text-[10px] font-black px-1.5 py-0.5 rounded-md bg-stone-100 dark:bg-white/[0.08] text-stone-700 dark:text-zinc-300 border border-stone-200 dark:border-white/10">
                            {staff.employeeCode || 'EMP-???'}
                          </span>
                          <span className={`inline-flex items-center gap-1 text-[9px] font-black uppercase px-2 py-0.5 rounded-md border ${roleInfo.color}`}>
                            <RoleIcon className="w-2.5 h-2.5" />
                            <span>{roleInfo.label}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Status Toggle Switch (BUG-006) */}
                    <button
                      onClick={() => handleToggleStatus(staff)}
                      title={`Click to ${staff.isActive ? 'Deactivate' : 'Activate'}`}
                      className={`text-[10px] font-black px-2.5 py-1 rounded-xl flex items-center gap-1.5 transition cursor-pointer shadow-xs ${
                        staff.isActive
                          ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30 hover:bg-emerald-100'
                          : 'bg-rose-50 dark:bg-rose-500/10 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-500/30 hover:bg-rose-100'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${staff.isActive ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                      <span>{staff.isActive ? 'Active' : 'Deactivated'}</span>
                    </button>
                  </div>

                  {/* Terminal PIN Box */}
                  <div className="mt-4 p-3 bg-stone-50 dark:bg-white/[0.03] rounded-2xl border border-stone-200/80 dark:border-white/10 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] font-bold text-stone-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                        <KeyRound className="w-3 h-3 text-amber-500" />
                        <span>Touch Terminal PIN</span>
                      </div>
                      <div className="font-mono text-base font-black text-stone-900 dark:text-white mt-0.5 tracking-widest">
                        {isPinRevealed ? staff.pinCode : '••••'}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => togglePinVisibility(staff.id)}
                        className="p-1.5 rounded-xl hover:bg-stone-200 dark:hover:bg-white/10 text-stone-600 dark:text-zinc-400 transition cursor-pointer"
                        title={isPinRevealed ? 'Hide PIN' : 'Reveal PIN'}
                      >
                        {isPinRevealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>

                      <button
                        onClick={() => copyToClipboard(staff.pinCode, staff.id)}
                        className="p-1.5 rounded-xl hover:bg-stone-200 dark:hover:bg-white/10 text-stone-600 dark:text-zinc-400 transition cursor-pointer"
                        title="Copy PIN Code"
                      >
                        {isCopied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Workload Stats - Role Relevant (BUG-008) */}
                  {staff.role === 'CASHIER' || staff.role === 'WAITER' || staff.role === 'OWNER' || staff.role === 'MANAGER' ? (
                    <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                      <div className="p-2 rounded-xl bg-stone-100/60 dark:bg-white/[0.02]">
                        <div className="text-[9px] font-bold text-stone-500 dark:text-zinc-400 uppercase">POS Sales</div>
                        <div className="text-xs font-black text-stone-900 dark:text-white mt-0.5">
                          {staff._count?.ordersCreated || 0}
                        </div>
                      </div>
                      <div className="p-2 rounded-xl bg-stone-100/60 dark:bg-white/[0.02]">
                        <div className="text-[9px] font-bold text-stone-500 dark:text-zinc-400 uppercase">Waiter Slips</div>
                        <div className="text-xs font-black text-stone-900 dark:text-white mt-0.5">
                          {staff._count?.ordersWaitered || 0}
                        </div>
                      </div>
                      <div className="p-2 rounded-xl bg-stone-100/60 dark:bg-white/[0.02]">
                        <div className="text-[9px] font-bold text-stone-500 dark:text-zinc-400 uppercase">Cash Shifts</div>
                        <div className="text-xs font-black text-stone-900 dark:text-white mt-0.5">
                          {staff._count?.shifts || 0}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 mt-3 text-center">
                      <div className="p-2 rounded-xl bg-stone-100/60 dark:bg-white/[0.02]">
                        <div className="text-[9px] font-bold text-stone-500 dark:text-zinc-400 uppercase">Station Duty</div>
                        <div className="text-xs font-black text-stone-900 dark:text-white mt-0.5">
                          {staff.isActive ? 'Active on Floor' : 'Off Duty'}
                        </div>
                      </div>
                      <div className="p-2 rounded-xl bg-stone-100/60 dark:bg-white/[0.02]">
                        <div className="text-[9px] font-bold text-stone-500 dark:text-zinc-400 uppercase">Access Scope</div>
                        <div className="text-xs font-black text-stone-900 dark:text-white mt-0.5">
                          {staff.role.includes('STORE') ? 'Inventory & Ledger' : 'Kitchen KDS'}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom Card Actions */}
                <div className="mt-4 pt-3 border-t border-stone-200/80 dark:border-white/10 flex items-center justify-between gap-1.5">
                  <button
                    onClick={() => handleInstantGeneratePin(staff)}
                    title="1-Click Auto-Generate New Unique PIN"
                    className="py-1.5 px-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 rounded-xl text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    <span>Gen PIN</span>
                  </button>

                  <button
                    onClick={() => handleOpenResetPin(staff)}
                    className="flex-1 py-1.5 px-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30 rounded-xl text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <KeyRound className="w-3 h-3" />
                    <span>Custom PIN</span>
                  </button>

                  <button
                    onClick={() => handleOpenEdit(staff)}
                    className="py-1.5 px-2 bg-stone-100 hover:bg-stone-200 dark:bg-white/[0.05] dark:hover:bg-white/10 text-stone-700 dark:text-zinc-300 border border-stone-200 dark:border-white/10 rounded-xl text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>Edit</span>
                  </button>

                  {(staff.role === 'OWNER' || staff.role === 'MANAGER') && (
                    <button
                      onClick={() => handleOpenPasswordModal(staff)}
                      title="Reset Management Password"
                      className="py-1.5 px-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/30 rounded-xl text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Lock className="w-3 h-3" />
                      <span>Password</span>
                    </button>
                  )}

                  {staff.role !== 'OWNER' && (
                    <button
                      onClick={() => handleArchiveStaff(staff)}
                      title="Archive or remove departed employee"
                      className="py-1.5 px-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-rose-400 border border-rose-500/30 rounded-xl text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Role Security Reference Card */}
      <div className="bg-white dark:bg-[#161311] border border-stone-200/90 dark:border-white/10 rounded-3xl p-5 sm:p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <ShieldAlert className="w-4 h-4 text-amber-500" />
          <h2 className="text-sm font-black text-stone-900 dark:text-white uppercase tracking-wider">
            Terminal Access & Role Security Matrix
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-stone-50 dark:bg-white/[0.02] rounded-2xl border border-stone-200/70 dark:border-white/10">
            <span className="font-black text-emerald-700 dark:text-emerald-400">CASHIER / POS</span>
            <p className="text-[11px] text-stone-600 dark:text-zinc-400 mt-1">
              Terminal POS, cash opening/closing, table billing, fire waiter slips to kitchen.
            </p>
          </div>
          <div className="p-3 bg-stone-50 dark:bg-white/[0.02] rounded-2xl border border-stone-200/70 dark:border-white/10">
            <span className="font-black text-blue-700 dark:text-blue-400">SERVICE WAITER</span>
            <p className="text-[11px] text-stone-600 dark:text-zinc-400 mt-1">
              Waiter Pad device only. Table menu ordering, item notes, sends digital slips to cashier.
            </p>
          </div>
          <div className="p-3 bg-stone-50 dark:bg-white/[0.02] rounded-2xl border border-stone-200/70 dark:border-white/10">
            <span className="font-black text-orange-700 dark:text-orange-400">KITCHEN & HEAD CHEF</span>
            <p className="text-[11px] text-stone-600 dark:text-zinc-400 mt-1">
              Kitchen Display (KDS), cooking floor inventory, gram-level recipe creation.
            </p>
          </div>
          <div className="p-3 bg-stone-50 dark:bg-white/[0.02] rounded-2xl border border-stone-200/70 dark:border-white/10">
            <span className="font-black text-cyan-700 dark:text-cyan-400">DUAL STOREKEEPERS</span>
            <p className="text-[11px] text-stone-600 dark:text-zinc-400 mt-1">
              Main bulk warehouse & kitchen store, supplier purchase orders, transfer dispatches.
            </p>
          </div>
        </div>
      </div>

      {/* ================= MODAL: REGISTER NEW STAFF ================= */}
      {isRegisterOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#161311] border border-stone-200 dark:border-white/15 rounded-3xl max-w-lg w-full p-4 sm:p-6 shadow-2xl relative my-8">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-white/10">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-stone-900 dark:text-white">Register New Staff Member</h3>
                  <p className="text-[11px] text-stone-500 dark:text-zinc-400">
                    Creates terminal access credentials. No email or phone needed.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsRegisterOpen(false)}
                className="p-1.5 rounded-xl hover:bg-stone-100 dark:hover:bg-white/10 text-stone-500 dark:text-zinc-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="mt-4 p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-500/50 text-rose-700 dark:text-rose-300 text-xs font-bold rounded-2xl">
                {modalError}
              </div>
            )}

            <form onSubmit={handleRegisterSubmit} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-zinc-300 mb-1">
                  Employee Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Dawit Bekele"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                  className="w-full bg-stone-50 dark:bg-white/[0.05] border border-stone-300 dark:border-white/10 rounded-2xl px-4 py-2.5 text-xs text-stone-900 dark:text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="flex items-center min-h-[20px] text-xs font-bold text-stone-700 dark:text-zinc-300 mb-1">
                    Role & Station <span className="text-rose-500 ml-0.5">*</span>
                  </label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value)}
                    className="w-full bg-stone-50 dark:bg-[#201B17] border border-stone-300 dark:border-white/10 rounded-2xl px-3 py-2.5 text-xs font-bold text-stone-900 dark:text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    <option value="WAITER">Waiter / Order Pad</option>
                    <option value="CASHIER">Cashier / POS</option>
                    <option value="KITCHEN_STAFF">Kitchen Cook</option>
                    <option value="HEAD_CHEF">Head Chef</option>
                    <option value="MAIN_STOREKEEPER">Main Storekeeper</option>
                    <option value="KITCHEN_STOREKEEPER">Kitchen Storekeeper</option>
                    <option value="MANAGER">General Manager</option>
                  </select>
                </div>

                <div>
                  <label className="flex items-center min-h-[20px] text-xs font-bold text-stone-700 dark:text-zinc-300 mb-1">
                    Employee Code (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Auto (e.g. EMP-010)"
                    value={formEmployeeCode}
                    onChange={(e) => setFormEmployeeCode(e.target.value)}
                    className="w-full bg-stone-50 dark:bg-white/[0.05] border border-stone-300 dark:border-white/10 rounded-2xl px-4 py-2.5 text-xs text-stone-900 dark:text-white focus:outline-none focus:border-amber-500 uppercase"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-stone-700 dark:text-zinc-300">
                    4-Digit Quick Touch PIN <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setFormPin(generateRandomPin())}
                    className="text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Generate Random PIN</span>
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="4 to 6 numeric digits"
                  maxLength={6}
                  value={formPin}
                  onChange={(e) => setFormPin(e.target.value.replace(/\D/g, ''))}
                  required
                  className="w-full bg-stone-50 dark:bg-white/[0.05] border border-stone-300 dark:border-white/10 rounded-2xl px-4 py-2.5 text-sm font-mono font-black text-stone-900 dark:text-white focus:outline-none focus:border-amber-500 tracking-widest text-center"
                />
              </div>

              {formRole === 'MANAGER' && (
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-zinc-300 mb-1">
                    Management Password (Optional)
                  </label>
                  <input
                    type="password"
                    placeholder="Defaults to nitsuh123"
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    className="w-full bg-stone-50 dark:bg-white/[0.05] border border-stone-300 dark:border-white/10 rounded-2xl px-4 py-2.5 text-xs text-stone-900 dark:text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              )}

              {/* Custom Staff Photo & Avatar Uploader */}
              <StaffAvatarUploader
                value={formAvatar}
                onChange={setFormAvatar}
                staffName={formName}
                label="Staff Profile Photo / Avatar"
              />

              <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-stone-200 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setIsRegisterOpen(false)}
                  className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 dark:bg-white/[0.05] dark:hover:bg-white/10 text-stone-700 dark:text-zinc-300 rounded-2xl text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-stone-950 font-black text-xs rounded-2xl shadow-lg shadow-amber-500/25 cursor-pointer disabled:opacity-50"
                >
                  {formSubmitting ? 'Registering...' : 'Register Staff Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: RESET PIN ================= */}
      {isResetPinOpen && selectedStaff && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#161311] border border-stone-200 dark:border-white/15 rounded-3xl max-w-sm w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-white/10">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-stone-900 dark:text-white">Reset Staff PIN</h3>
                  <p className="text-[11px] text-stone-500 dark:text-zinc-400">
                    For {selectedStaff.name} ({selectedStaff.employeeCode})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsResetPinOpen(false)}
                className="p-1.5 rounded-xl hover:bg-stone-100 dark:hover:bg-white/10 text-stone-500 dark:text-zinc-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {modalError && (
              <div className="mt-3 p-2.5 bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-500/50 text-rose-700 dark:text-rose-300 text-xs font-bold rounded-2xl">
                {modalError}
              </div>
            )}

            <form onSubmit={handleResetPinSubmit} className="space-y-4 mt-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-stone-700 dark:text-zinc-300">
                    New 4-Digit PIN
                  </label>
                  <button
                    type="button"
                    onClick={() => setNewPin(generateRandomPin())}
                    className="text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Random</span>
                  </button>
                </div>
                <input
                  type="text"
                  maxLength={6}
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                  required
                  className="w-full bg-stone-50 dark:bg-white/[0.05] border border-stone-300 dark:border-white/10 rounded-2xl px-4 py-3 text-lg font-mono font-black text-stone-900 dark:text-white tracking-widest text-center focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-200 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setIsResetPinOpen(false)}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 dark:bg-white/[0.05] text-stone-700 dark:text-zinc-300 rounded-2xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-stone-950 font-black text-xs rounded-2xl shadow-md cursor-pointer disabled:opacity-50"
                >
                  {formSubmitting ? 'Saving...' : 'Update PIN'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: EDIT PROFILE ================= */}
      {isEditOpen && selectedStaff && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#161311] border border-stone-200 dark:border-white/15 rounded-3xl max-w-md w-full p-4 sm:p-6 shadow-2xl relative my-8">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-white/10">
              <h3 className="text-sm font-black text-stone-900 dark:text-white">Edit Staff Profile</h3>
              <button
                onClick={() => setIsEditOpen(false)}
                className="p-1.5 rounded-xl hover:bg-stone-100 dark:hover:bg-white/10 text-stone-500 dark:text-zinc-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {modalError && (
              <div className="mt-3 p-2.5 bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-500/50 text-rose-700 dark:text-rose-300 text-xs font-bold rounded-2xl">
                {modalError}
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-3.5 mt-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-zinc-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                  className="w-full bg-stone-50 dark:bg-white/[0.05] border border-stone-300 dark:border-white/10 rounded-2xl px-4 py-2.5 text-xs text-stone-900 dark:text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-zinc-300 mb-1">
                    Employee Code
                  </label>
                  <input
                    type="text"
                    value={editCode}
                    onChange={(e) => setEditCode(e.target.value)}
                    required
                    className="w-full bg-stone-50 dark:bg-white/[0.05] border border-stone-300 dark:border-white/10 rounded-2xl px-3 py-2.5 text-xs text-stone-900 dark:text-white focus:outline-none focus:border-amber-500 uppercase font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-zinc-300 mb-1">
                    Role
                  </label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                    className="w-full bg-stone-50 dark:bg-[#201B17] border border-stone-300 dark:border-white/10 rounded-2xl px-3 py-2.5 text-xs font-bold text-stone-900 dark:text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="WAITER">Service Waiter</option>
                    <option value="CASHIER">Cashier / POS</option>
                    <option value="KITCHEN_STAFF">Kitchen Cook</option>
                    <option value="HEAD_CHEF">Head Chef</option>
                    <option value="MAIN_STOREKEEPER">Main Storekeeper</option>
                    <option value="KITCHEN_STOREKEEPER">Kitchen Storekeeper</option>
                    <option value="MANAGER">General Manager</option>
                  </select>
                </div>
              </div>

              {/* Custom Staff Photo & Avatar Uploader */}
              <StaffAvatarUploader
                value={editAvatar}
                onChange={setEditAvatar}
                staffName={editName}
                label="Update Staff Photo / Avatar"
              />

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-200 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 dark:bg-white/[0.05] text-stone-700 dark:text-zinc-300 rounded-2xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-stone-950 font-black text-xs rounded-2xl shadow-md cursor-pointer disabled:opacity-50"
                >
                  {formSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: RESET PASSWORD ================= */}
      {isPasswordModalOpen && selectedStaff && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#161311] border border-stone-200 dark:border-white/15 rounded-3xl max-w-sm w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-white/10">
              <h3 className="text-sm font-black text-stone-900 dark:text-white">Reset Manager Password</h3>
              <button
                onClick={() => setIsPasswordModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-stone-100 dark:hover:bg-white/10 text-stone-500 dark:text-zinc-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {modalError && (
              <div className="mt-3 p-2.5 bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-500/50 text-rose-700 dark:text-rose-300 text-xs font-bold rounded-2xl">
                {modalError}
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-zinc-300 mb-1">
                  New Password (min 6 chars)
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="w-full bg-stone-50 dark:bg-white/[0.05] border border-stone-300 dark:border-white/10 rounded-2xl px-4 py-2.5 text-xs text-stone-900 dark:text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-200 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 dark:bg-white/[0.05] text-stone-700 dark:text-zinc-300 rounded-2xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-stone-950 font-black text-xs rounded-2xl shadow-md cursor-pointer disabled:opacity-50"
                >
                  {formSubmitting ? 'Updating...' : 'Set Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
