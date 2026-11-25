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
  AlertCircle,
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
  Utensils,
  X,
  Trash2,
  UserX,
  UserCheck,
  Ban,
  SlidersHorizontal,
  CheckSquare,
  Square,
} from 'lucide-react';
import { StaffAvatarUploader, AVATAR_PRESETS } from './StaffAvatarUploader';
import { Button, Badge, Input, Card } from '@/components/ui';
import {
  AppRole,
  AppPage,
  AppCapability,
  RoleConfig,
  getRolePermissions,
  saveRolePermissions,
  DEFAULT_ROLE_PERMISSIONS,
} from '@/lib/permissions';

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

const ALL_ROLES: Array<{ role: AppRole; label: string; description: string; icon: any }> = [
  { role: 'OWNER', label: 'Owner / General Director', description: 'Complete system authority and full financial profit analytics', icon: ShieldCheck },
  { role: 'MANAGER', label: 'Operations Manager', description: 'Floor supervision, staff administration, menu and stock oversight', icon: LayoutGrid },
  { role: 'CASHIER', label: 'Cashier Station', description: 'POS checkout, table bills, settlement and payment processing', icon: MonitorCheck },
  { role: 'WAITER', label: 'Floor Waiter', description: 'Table order taking, customer service, sending kitchen tickets', icon: Smartphone },
  { role: 'HEAD_CHEF', label: 'Head Chef', description: 'Kitchen line monitoring, menu recipes, kitchen inventory oversight', icon: ChefHat },
  { role: 'KITCHEN_STAFF', label: 'Kitchen Line Cook', description: 'KDS station preparation, marking orders prepared and ready', icon: ChefHat },
  { role: 'MAIN_STOREKEEPER', label: 'Main Storekeeper', description: 'Raw material procurement, main warehouse stock, transfers', icon: Boxes },
  { role: 'KITCHEN_STOREKEEPER', label: 'Kitchen Storekeeper', description: 'Kitchen store stock receiving, batch transfers, and wastage logs', icon: Boxes },
];

const AVAILABLE_PAGES: Array<{ id: AppPage; label: string; icon: any }> = [
  { id: 'profit', label: 'Profit & Analytics', icon: BarChart3 },
  { id: 'staff', label: 'Staff Management', icon: Users },
  { id: 'products', label: 'Menu Studio', icon: Utensils },
  { id: 'inventory', label: 'Stock & Inventory', icon: Boxes },
  { id: 'tables', label: 'Dining Tables', icon: LayoutGrid },
  { id: 'pos', label: 'POS Terminal', icon: MonitorCheck },
  { id: 'kds', label: 'Kitchen Display', icon: ChefHat },
  { id: 'waiter', label: 'Waiter Order Pad', icon: Smartphone },
];

const AVAILABLE_CAPABILITIES: Array<{ id: AppCapability; label: string; description: string }> = [
  { id: 'cancel_orders', label: 'Cancel Placed Orders', description: 'Permits voiding or cancelling orders from active lists' },
  { id: 'apply_discounts', label: 'Apply Bill Discounts', description: 'Allows cashier discounts and manual bill price modifications' },
  { id: 'adjust_stock', label: 'Adjust / Receive Stock', description: 'Allows recording wastage, purchases and direct stock adjustments' },
  { id: 'reset_pins', label: 'Reset Staff Credentials', description: 'Permits issuing new PIN codes or passwords to staff members' },
];

export function StaffManagementView() {
  const { currentUser } = useAppStore();
  const isOwner = currentUser?.role === 'OWNER';
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    title: string;
    description: string;
    confirmText: string;
    isDanger?: boolean;
    onConfirm: () => void;
  } | null>(null);

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
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'DISABLED'>('ALL');

  // View Tab: Staff Directory vs Role Permissions Matrix
  const [viewTab, setViewTab] = useState<'staff' | 'permissions'>('staff');
  const [rolePermissions, setRolePermissions] = useState<Record<AppRole, RoleConfig>>(() => getRolePermissions());
  const [isSavingPerms, setIsSavingPerms] = useState(false);

  const toggleRolePage = (r: AppRole, page: AppPage) => {
    if (r === 'OWNER') return; // Owner always has all pages
    setRolePermissions((prev) => {
      const currentPages = prev[r]?.pages || [];
      const updatedPages = currentPages.includes(page)
        ? currentPages.filter((p) => p !== page)
        : [...currentPages, page];
      return {
        ...prev,
        [r]: {
          ...prev[r],
          pages: updatedPages,
        },
      };
    });
  };

  const toggleRoleCapability = (r: AppRole, cap: AppCapability) => {
    if (r === 'OWNER') return; // Owner always has all capabilities
    setRolePermissions((prev) => {
      const currentCaps = prev[r]?.capabilities || [];
      const updatedCaps = currentCaps.includes(cap)
        ? currentCaps.filter((c) => c !== cap)
        : [...currentCaps, cap];
      return {
        ...prev,
        [r]: {
          ...prev[r],
          capabilities: updatedCaps,
        },
      };
    });
  };

  const handleSaveRolePermissions = () => {
    setIsSavingPerms(true);
    saveRolePermissions(rolePermissions);
    setTimeout(() => {
      setIsSavingPerms(false);
      triggerToast('Role permissions saved successfully! Changes are active.', 'success');
    }, 200);
  };

  const handleResetRolePermissions = () => {
    setConfirmModal({
      title: 'Reset Role Permissions',
      description: 'Are you sure you want to revert all role permissions and page accesses to system defaults?',
      confirmText: 'Reset to Defaults',
      isDanger: true,
      onConfirm: () => {
        setRolePermissions(DEFAULT_ROLE_PERMISSIONS);
        saveRolePermissions(DEFAULT_ROLE_PERMISSIONS);
        triggerToast('Role permissions reset to default configuration.', 'success');
      },
    });
  };

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
      triggerToast(err.message || 'Failed to resolve request', 'error');
    } finally {
      setResolvingRequestId(null);
    }
  };

  const handleInstantGeneratePin = async (staff: StaffMember) => {
    if (!isOwner && staff.role === 'OWNER') {
      triggerToast('Managers cannot alter Owner credentials.', 'error');
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
      triggerToast(`Generated new PIN ${res.pinCode} for ${staff.name}!`, 'success');
      loadStaff();
    } catch (err: any) {
      triggerToast(err.message || 'Failed to generate PIN', 'error');
    }
  };

  const triggerToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ message: msg, type });
    setTimeout(() => {
      setToast((curr) => (curr?.message === msg ? null : curr));
    }, 4500);
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
      triggerToast('Managers cannot alter Owner credentials.', 'error');
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

      triggerToast(`PIN for ${selectedStaff.name} updated to ${newPin.trim()}`, 'success');
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
      triggerToast('Managers cannot edit Owner profiles.', 'error');
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

      triggerToast(`Profile for ${editName} updated successfully`, 'success');
      setIsEditOpen(false);
      loadStaff();
    } catch (err: any) {
      setModalError(err.message || 'Failed to update staff profile');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleToggleStatus = (staff: StaffMember) => {
    if (!isOwner && staff.role === 'OWNER') {
      triggerToast('Managers cannot alter Owner status.', 'error');
      return;
    }
    if (!isOwner && staff.role === 'MANAGER' && staff.id !== currentUser?.id) {
      triggerToast('Only the Owner can disable or enable Manager accounts.', 'error');
      return;
    }
    if (staff.id === currentUser?.id) {
      triggerToast('You cannot disable your own active account!', 'error');
      return;
    }

    const willDisable = staff.isActive;
    setConfirmModal({
      title: willDisable ? 'Disable Staff Member' : 'Enable Staff Member',
      description: willDisable
        ? `Are you sure you want to disable ${staff.name}? They will immediately be locked out of the website and cannot log into any station. All profile information, PIN code, and past history are preserved.`
        : `Enable website access for ${staff.name}? Their existing PIN and credentials will immediately work again.`,
      confirmText: willDisable ? 'Disable Access' : 'Enable Access',
      isDanger: willDisable,
      onConfirm: async () => {
        setConfirmModal(null);
        try {
          await fetchApi(`/users/${staff.id}/toggle-status`, { method: 'PATCH' });
          triggerToast(
            willDisable
              ? `${staff.name} is now disabled (locked out of website). Profile information is preserved.`
              : `${staff.name} is now active and can access the website.`,
            'success',
          );
          loadStaff();
        } catch (err: any) {
          triggerToast(err.message || 'Failed to update staff status', 'error');
        }
      },
    });
  };

  const handleArchiveStaff = (staff: StaffMember) => {
    if (staff.role === 'OWNER') {
      triggerToast('The Owner account cannot be deleted or archived.', 'error');
      return;
    }

    setConfirmModal({
      title: 'Archive Staff Member',
      description: `Are you sure you want to archive staff member "${staff.name}"? This removes them from active terminals while safely preserving past audit logs.`,
      confirmText: 'Archive Staff',
      isDanger: true,
      onConfirm: async () => {
        setConfirmModal(null);
        try {
          const res = await fetchApi(`/users/${staff.id}`, { method: 'DELETE' });
          triggerToast(res?.message || `Staff member "${staff.name}" archived.`, 'success');
          loadStaff();
        } catch (err: any) {
          triggerToast(err.message || 'Failed to archive staff', 'error');
        }
      },
    });
  };

  const handleOpenPasswordModal = (staff: StaffMember) => {
    if (!isOwner && staff.role === 'OWNER') {
      triggerToast('Managers cannot reset Owner password.', 'error');
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
        return { label: 'Owner', color: 'bg-stone-100 text-stone-800 border-stone-200', icon: ShieldCheck };
      case 'MANAGER':
        return { label: 'Manager', color: 'bg-emerald-50 text-emerald-800 border-emerald-200', icon: LayoutGrid };
      case 'CASHIER':
        return { label: 'Cashier', color: 'bg-emerald-50 text-emerald-800 border-emerald-200', icon: MonitorCheck };
      case 'WAITER':
        return { label: 'Waiter', color: 'bg-emerald-50 text-emerald-800 border-emerald-200', icon: Smartphone };
      case 'KITCHEN_STAFF':
        return { label: 'Cook', color: 'bg-stone-100 text-stone-800 border-stone-200', icon: ChefHat };
      case 'HEAD_CHEF':
        return { label: 'Head Chef', color: 'bg-stone-100 text-stone-800 border-stone-200', icon: ChefHat };
      case 'MAIN_STOREKEEPER':
        return { label: 'Storekeeper', color: 'bg-stone-100 text-stone-800 border-stone-200', icon: Boxes };
      case 'KITCHEN_STOREKEEPER':
        return { label: 'Kitchen Store', color: 'bg-stone-100 text-stone-800 border-stone-200', icon: Boxes };
      default:
        return { label: role, color: 'bg-stone-100 text-stone-800 border-stone-200', icon: Users };
    }
  };

  // Visible staff (Managers must NEVER see Owner information or accounts)
  const visibleStaffList = useMemo(() => {
    return staffList.filter((s) => isOwner || s.role !== 'OWNER');
  }, [staffList, isOwner]);

  // Filtered staff
  const filteredStaff = useMemo(() => {
    return visibleStaffList.filter((s) => {
      if (statusFilter === 'ACTIVE' && !s.isActive) return false;
      if (statusFilter === 'DISABLED' && s.isActive) return false;
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
  }, [visibleStaffList, statusFilter, roleFilter, searchTerm]);

  const totalStaff = visibleStaffList.length;
  const activeStaff = visibleStaffList.filter((s) => s.isActive).length;
  const disabledStaff = visibleStaffList.filter((s) => !s.isActive).length;
  const frontOfHouse = visibleStaffList.filter((s) => s.role === 'CASHIER' || s.role === 'WAITER').length;
  const kitchenStaff = visibleStaffList.filter((s) => s.role === 'KITCHEN_STAFF' || s.role === 'HEAD_CHEF').length;
  const storeStaff = visibleStaffList.filter((s) => s.role === 'MAIN_STOREKEEPER' || s.role === 'KITCHEN_STOREKEEPER').length;

  const visibleResetRequests = useMemo(() => {
    return resetRequests.filter((r) => isOwner || r.role !== 'OWNER');
  }, [resetRequests, isOwner]);

  return (
    <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 lg:p-8 no-scrollbar bg-[#F8F9FA] text-stone-900 font-sans">
      <div className="max-w-7xl mx-auto space-y-5 pb-16">
        {/* Toast Notification */}
        {toast && (
          <div className="fixed top-20 right-5 z-50 max-w-sm w-full sm:w-auto animate-in fade-in slide-in-from-top-3 duration-200">
            <div
              className={`px-4 py-3 rounded-2xl shadow-2xl border flex items-center justify-between gap-3 text-xs font-black ${
                toast.type === 'error'
                  ? 'bg-rose-600 text-white border-rose-700 shadow-rose-900/20'
                  : 'bg-emerald-600 text-white border-emerald-700 shadow-emerald-900/20'
              }`}
            >
              <div className="flex items-center gap-2">
                {toast.type === 'error' ? (
                  <AlertCircle className="w-4 h-4 shrink-0 text-white" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-white" />
                )}
                <span>{toast.message}</span>
              </div>
              <button
                onClick={() => setToast(null)}
                className="text-white/80 hover:text-white p-1 rounded-lg transition cursor-pointer"
              >
                ✕
              </button>
            </div>
          </div>
        )}

      {/* Main Header Card */}
      <div className="bg-white border border-stone-200/90 rounded-3xl p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0 shadow-2xs">
              <Users className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight leading-tight">
                Staff Management
              </h1>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200 whitespace-nowrap shrink-0">
                {isOwner ? 'Owner' : 'Manager'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 w-full sm:w-auto">
            <button
              onClick={handleOpenRegister}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-bold text-xs shadow-xs transition cursor-pointer select-none"
            >
              <UserPlus className="w-4 h-4" />
              <span className="whitespace-nowrap">Register Staff</span>
            </button>
            <button
              onClick={loadStaff}
              title="Refresh Staff List"
              className="inline-flex items-center justify-center p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200 transition cursor-pointer shrink-0"
            >
              <RotateCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 mt-4 pt-4 border-t border-stone-200/80">
          <div className="bg-stone-50 border border-stone-200/80 rounded-2xl p-3">
            <div className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Total Staff</div>
            <div className="text-xl font-black text-stone-900 mt-0.5">{totalStaff}</div>
          </div>

          <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-3">
            <div className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Active Staff</div>
            <div className="text-xl font-black text-emerald-800 mt-0.5">{activeStaff}</div>
          </div>

          <div className="bg-rose-50/60 border border-rose-200/80 rounded-2xl p-3">
            <div className="text-[10px] font-bold text-rose-700 uppercase tracking-wider">Disabled Staff</div>
            <div className="text-xl font-black text-rose-800 mt-0.5">{disabledStaff}</div>
          </div>

          <div className="bg-stone-50 border border-stone-200/80 rounded-2xl p-3">
            <div className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Kitchen & Store</div>
            <div className="text-xl font-black text-stone-900 mt-0.5">{kitchenStaff + storeStaff}</div>
          </div>
        </div>

        {/* Tab Selector for Owner */}
        {isOwner && (
          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-stone-200/80">
            <button
              type="button"
              onClick={() => setViewTab('staff')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                viewTab === 'staff'
                  ? 'bg-emerald-600 text-white shadow-xs font-black'
                  : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Staff Directory</span>
            </button>
            <button
              type="button"
              onClick={() => setViewTab('permissions')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                viewTab === 'permissions'
                  ? 'bg-emerald-600 text-white shadow-xs font-black'
                  : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Role Permissions & Page Access Matrix</span>
            </button>
          </div>
        )}
      </div>

      {/* VIEW TAB 1: STAFF DIRECTORY */}
      {viewTab === 'staff' && (
        <>
          {/* Generated Credential Banner Alert */}
      {generatedCredentialAlert && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-black uppercase text-emerald-900">
                New {generatedCredentialAlert.type} for {generatedCredentialAlert.userName}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="font-mono text-lg font-black bg-white px-2.5 py-0.5 rounded-lg border border-emerald-200 text-stone-900 select-all">
                  {generatedCredentialAlert.value}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                navigator.clipboard.writeText(generatedCredentialAlert.value);
                setCopiedAlertCredential(true);
                setTimeout(() => setCopiedAlertCredential(false), 2000);
              }}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              {copiedAlertCredential ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copiedAlertCredential ? 'Copied' : 'Copy'}</span>
            </button>
            <button
              onClick={() => setGeneratedCredentialAlert(null)}
              className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold transition cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Pending Reset Requests Section */}
      {visibleResetRequests.filter((r) => r.status === 'PENDING').length > 0 && (
        <div className="bg-emerald-50/60 border border-emerald-200 rounded-3xl p-4 sm:p-5 shadow-xs space-y-3 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-black text-stone-900 flex items-center gap-2">
                  PIN & Password Reset Requests
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {visibleResetRequests.filter((r) => r.status === 'PENDING').length} Pending
                  </span>
                </h2>
              </div>
            </div>
            <button
              onClick={loadResetRequests}
              className="p-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold flex items-center gap-1 transition cursor-pointer"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${loadingRequests ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
            {visibleResetRequests
              .filter((r) => r.status === 'PENDING')
              .map((req) => {
                const isManagementRole = req.role === 'OWNER' || req.role === 'MANAGER';
                return (
                  <div
                    key={req.id}
                    className="bg-white border border-stone-200 rounded-2xl p-3.5 shadow-xs space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs font-black text-stone-900">
                          {req.employeeName || req.user?.name || 'Staff Member'}
                        </div>
                        <div className="text-[10px] text-stone-500 font-mono">
                          {req.employeeCode || req.user?.employeeCode || 'STAFF'} • {req.role || req.user?.role}
                        </div>
                      </div>
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-stone-100 text-stone-700">
                        {req.role}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-stone-100">
                      {isManagementRole ? (
                        <button
                          disabled={resolvingRequestId === req.id}
                          onClick={() => handleResolveRequest(req, 'GENERATE_PASSWORD')}
                          className="flex-1 py-1 px-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Lock className="w-3.5 h-3.5" />
                          <span>Password</span>
                        </button>
                      ) : (
                        <button
                          disabled={resolvingRequestId === req.id}
                          onClick={() => handleResolveRequest(req, 'GENERATE_PIN')}
                          className="flex-1 py-1 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                          <span>Gen PIN</span>
                        </button>
                      )}

                      <button
                        disabled={resolvingRequestId === req.id}
                        onClick={() => handleResolveRequest(req, 'DISMISS')}
                        className="py-1 px-2 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-lg text-xs font-bold transition cursor-pointer"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Search & Status/Role Filters Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 flex-1 flex-wrap">
          <div className="relative flex-1 min-w-[220px] max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="Search staff..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-stone-200 rounded-2xl pl-10 pr-4 py-2.5 text-xs font-semibold text-stone-900 placeholder-stone-400 focus:outline-none focus:border-emerald-600 shadow-xs"
            />
          </div>

          {/* Status Filter: All / Active / Disabled */}
          <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-2xl border border-stone-200 shrink-0">
            {[
              { id: 'ALL', label: `All (${totalStaff})` },
              { id: 'ACTIVE', label: `Active (${activeStaff})` },
              { id: 'DISABLED', label: `Disabled (${disabledStaff})` },
            ].map((s) => (
              <button
                key={s.id}
                onClick={() => setStatusFilter(s.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  statusFilter === s.id
                    ? 'bg-white text-stone-950 font-black shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
          {[
            { id: 'ALL', label: 'All Roles' },
            ...(isOwner ? [{ id: 'OWNER', label: 'Owner' }] : []),
            { id: 'CASHIER', label: 'Cashiers' },
            { id: 'WAITER', label: 'Waiters' },
            { id: 'KITCHEN_STAFF', label: 'Kitchen' },
            { id: 'MAIN_STOREKEEPER', label: 'Store' },
            { id: 'MANAGER', label: 'Managers' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setRoleFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                roleFilter === tab.id
                  ? 'bg-emerald-600 text-white font-black shadow-xs'
                  : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Staff Grid */}
      {loading ? (
        <div className="p-12 text-center text-xs font-bold text-stone-500">
          Loading staff list...
        </div>
      ) : filteredStaff.length === 0 ? (
        <div className="bg-white border border-stone-200 rounded-3xl p-8 text-center text-stone-500">
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
                className={`bg-white border rounded-3xl p-4 sm:p-5 shadow-xs transition hover:shadow-md relative overflow-hidden flex flex-col justify-between ${
                  staff.role === 'OWNER'
                    ? 'border-emerald-300 ring-2 ring-emerald-300/20 bg-emerald-50/20'
                    : staff.isActive
                    ? 'border-stone-200/90'
                    : 'border-rose-200 bg-rose-50/30'
                }`}
              >
                <div>
                  {/* Top: Avatar, Name, Code, and Status Badge */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {staff.avatarUrl ? (
                        <img
                          src={staff.avatarUrl}
                          alt={staff.name}
                          className="w-11 h-11 rounded-2xl object-cover ring-1 ring-stone-200 shrink-0"
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center justify-center font-black text-base shrink-0">
                          {staff.name.charAt(0)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <h2 className="text-sm font-black text-stone-900 truncate">
                          {staff.name}
                        </h2>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-stone-100 text-stone-700 border border-stone-200">
                            {staff.employeeCode || 'EMP-???'}
                          </span>
                          <span className={`inline-flex items-center gap-1 text-[9px] font-bold uppercase px-2 py-0.5 rounded-md border ${roleInfo.color}`}>
                            <RoleIcon className="w-2.5 h-2.5" />
                            <span>{roleInfo.label}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Status Badge */}
                    {staff.pinCode?.startsWith('ARC-') ? (
                      <span className="text-[10px] font-black px-2.5 py-1 rounded-xl bg-stone-100 text-stone-600 border border-stone-200 flex items-center gap-1.5 shadow-xs">
                        <span className="w-2 h-2 rounded-full bg-stone-400" />
                        <span>Archived</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => handleToggleStatus(staff)}
                        title={
                          staff.id === currentUser?.id
                            ? 'Your active account'
                            : staff.isActive
                            ? 'Click to Disable Access'
                            : 'Click to Enable Access'
                        }
                        className={`text-[10px] font-black px-2.5 py-1 rounded-xl flex items-center gap-1.5 transition cursor-pointer shadow-xs ${
                          staff.isActive
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                            : 'bg-rose-50 text-rose-700 border border-rose-300 hover:bg-rose-100'
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${staff.isActive ? 'bg-emerald-500' : 'bg-rose-500 animate-pulse'}`} />
                        <span>{staff.isActive ? 'Active' : 'Disabled'}</span>
                      </button>
                    )}
                  </div>

                  {/* Terminal PIN Box */}
                  <div className="mt-3.5 p-3 bg-stone-50 rounded-2xl border border-stone-200/80 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1">
                        <KeyRound className="w-3 h-3 text-emerald-600" />
                        <span>Terminal PIN</span>
                      </div>
                      <div className="font-mono text-base font-black text-stone-900 mt-0.5 tracking-widest">
                        {isPinRevealed ? staff.pinCode : '••••'}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => togglePinVisibility(staff.id)}
                        className="p-1.5 rounded-xl hover:bg-stone-200 text-stone-600 transition cursor-pointer"
                        title={isPinRevealed ? 'Hide PIN' : 'Reveal PIN'}
                      >
                        {isPinRevealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>

                      <button
                        onClick={() => copyToClipboard(staff.pinCode, staff.id)}
                        className="p-1.5 rounded-xl hover:bg-stone-200 text-stone-600 transition cursor-pointer"
                        title="Copy PIN Code"
                      >
                        {isCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Bottom Card Actions */}
                <div className="mt-4 pt-3 border-t border-stone-200/80 flex items-center justify-between gap-1.5">
                  <button
                    onClick={() => handleInstantGeneratePin(staff)}
                    className="py-1.5 px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3 text-emerald-600" />
                    <span>Gen PIN</span>
                  </button>

                  <button
                    onClick={() => handleOpenResetPin(staff)}
                    className="flex-1 py-1.5 px-2 bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200 rounded-xl text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <KeyRound className="w-3 h-3" />
                    <span>Custom PIN</span>
                  </button>

                  <button
                    onClick={() => handleOpenEdit(staff)}
                    className="py-1.5 px-2 bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200 rounded-xl text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>Edit</span>
                  </button>

                  {(staff.role === 'OWNER' || staff.role === 'MANAGER') && (
                    <button
                      onClick={() => handleOpenPasswordModal(staff)}
                      className="py-1.5 px-2 bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200 rounded-xl text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Lock className="w-3 h-3" />
                      <span>Password</span>
                    </button>
                  )}

                  {/* Dedicated Enable/Disable Access Button */}
                  {staff.id !== currentUser?.id && (isOwner || (staff.role !== 'OWNER' && staff.role !== 'MANAGER')) && (
                    <button
                      onClick={() => handleToggleStatus(staff)}
                      className={`py-1.5 px-2 rounded-xl text-[11px] font-black transition flex items-center justify-center gap-1 cursor-pointer border ${
                        staff.isActive
                          ? 'bg-stone-100 hover:bg-rose-50 text-stone-700 hover:text-rose-700 border-stone-200 hover:border-rose-300'
                          : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-600 shadow-xs'
                      }`}
                      title={staff.isActive ? 'Disable user from using the website' : 'Enable website access'}
                    >
                      {staff.isActive ? (
                        <>
                          <UserX className="w-3 h-3" />
                          <span>Disable</span>
                        </>
                      ) : (
                        <>
                          <UserCheck className="w-3 h-3" />
                          <span>Enable</span>
                        </>
                      )}
                    </button>
                  )}

                  {/* Archive Button */}
                  {staff.role !== 'OWNER' && (
                    <button
                      onClick={() => handleArchiveStaff(staff)}
                      className="py-1.5 px-2 bg-stone-100 hover:bg-rose-50 text-stone-600 hover:text-rose-700 border border-stone-200 hover:border-rose-200 rounded-xl text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                      title="Archive Staff Member"
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
      </>
      )}

      {/* VIEW TAB 2: ROLE PERMISSIONS & ACCESS MATRIX */}
      {viewTab === 'permissions' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Header Card for Permissions Matrix */}
          <div className="bg-white border border-stone-200/90 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <SlidersHorizontal className="w-4 h-4" />
                </span>
                <h2 className="text-base sm:text-lg font-black text-stone-900 font-heading">
                  Role Permissions & Station Page Access Matrix
                </h2>
              </div>
              <p className="text-xs text-stone-500 mt-1 max-w-2xl leading-relaxed">
                Choose which station pages and operational functions each role is authorized to access. Changes update immediately across all terminal stations, navigation tabs, and route guards.
              </p>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={handleResetRolePermissions}
                className="px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs transition cursor-pointer"
              >
                Reset to Defaults
              </button>
              <button
                type="button"
                onClick={handleSaveRolePermissions}
                disabled={isSavingPerms}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                <span>{isSavingPerms ? 'Saving Changes...' : 'Save Permissions'}</span>
              </button>
            </div>
          </div>

          {/* Matrix Cards for Roles */}
          <div className="space-y-4">
            {ALL_ROLES.map(({ role, label, description, icon: RoleIcon }) => {
              const isOwnerRole = role === 'OWNER';
              const cfg = rolePermissions[role] || DEFAULT_ROLE_PERMISSIONS[role];
              const activePages = cfg.pages || [];
              const activeCaps = cfg.capabilities || [];

              return (
                <div
                  key={role}
                  className={`bg-white border rounded-3xl p-5 shadow-xs transition ${
                    isOwnerRole ? 'border-emerald-300 bg-emerald-50/20' : 'border-stone-200/90'
                  }`}
                >
                  {/* Role Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 border-b border-stone-100 gap-2">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border ${
                          isOwnerRole
                            ? 'bg-emerald-600 text-white border-emerald-700'
                            : 'bg-stone-100 text-stone-700 border-stone-200'
                        }`}
                      >
                        <RoleIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-black text-stone-900">{label}</h3>
                          <span className="font-mono text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-stone-100 text-stone-600 border border-stone-200">
                            {role}
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-500 mt-0.5">{description}</p>
                      </div>
                    </div>

                    {isOwnerRole && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 whitespace-nowrap self-start sm:self-auto">
                        <Check className="w-3 h-3 stroke-[3]" />
                        Full System Authority (Permanent)
                      </span>
                    )}
                  </div>

                  {/* Accessible Pages Checkbox Strip */}
                  <div className="mt-3.5">
                    <div className="text-[11px] font-black uppercase tracking-wider text-stone-500 mb-2 flex items-center justify-between">
                      <span>Accessible Station Pages</span>
                      <span className="text-[10px] font-bold text-stone-400">
                        {isOwnerRole ? 'All 8 Pages' : `${activePages.length} of ${AVAILABLE_PAGES.length} Enabled`}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
                      {AVAILABLE_PAGES.map((page) => {
                        const PageIcon = page.icon;
                        const isChecked = isOwnerRole || activePages.includes(page.id);

                        return (
                          <button
                            key={page.id}
                            type="button"
                            disabled={isOwnerRole}
                            onClick={() => toggleRolePage(role, page.id)}
                            className={`p-2.5 rounded-2xl border text-left flex flex-col justify-between transition cursor-pointer select-none ${
                              isChecked
                                ? 'bg-emerald-50 border-emerald-300 text-emerald-950 shadow-2xs'
                                : 'bg-stone-50 border-stone-200 text-stone-400 hover:border-stone-300'
                            } ${isOwnerRole ? 'cursor-default opacity-90' : ''}`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <PageIcon
                                className={`w-3.5 h-3.5 ${
                                  isChecked ? 'text-emerald-700' : 'text-stone-400'
                                }`}
                              />
                              {isChecked ? (
                                <CheckSquare className="w-3.5 h-3.5 text-emerald-700" />
                              ) : (
                                <Square className="w-3.5 h-3.5 text-stone-300" />
                              )}
                            </div>
                            <span
                              className={`text-[11px] font-extrabold truncate ${
                                isChecked ? 'text-stone-900' : 'text-stone-400'
                              }`}
                            >
                              {page.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Operational Capabilities Checkbox Strip */}
                  <div className="mt-4 pt-3 border-t border-stone-100">
                    <div className="text-[11px] font-black uppercase tracking-wider text-stone-500 mb-2">
                      Operational Capabilities & Actions
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                      {AVAILABLE_CAPABILITIES.map((cap) => {
                        const isChecked = isOwnerRole || activeCaps.includes(cap.id);

                        return (
                          <button
                            key={cap.id}
                            type="button"
                            disabled={isOwnerRole}
                            onClick={() => toggleRoleCapability(role, cap.id)}
                            className={`p-2.5 rounded-2xl border text-left flex items-start gap-2.5 transition cursor-pointer select-none ${
                              isChecked
                                ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950 shadow-2xs'
                                : 'bg-stone-50 border-stone-200 text-stone-400 hover:border-stone-300'
                            } ${isOwnerRole ? 'cursor-default opacity-90' : ''}`}
                          >
                            <div className="mt-0.5 shrink-0">
                              {isChecked ? (
                                <CheckSquare className="w-4 h-4 text-emerald-700" />
                              ) : (
                                <Square className="w-4 h-4 text-stone-300" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div
                                className={`text-xs font-bold ${
                                  isChecked ? 'text-stone-900' : 'text-stone-500'
                                }`}
                              >
                                {cap.label}
                              </div>
                              <div className="text-[10px] text-stone-400 mt-0.5 leading-tight">
                                {cap.description}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Save Bar */}
          <div className="bg-white border border-stone-200/90 rounded-3xl p-4 shadow-xs flex items-center justify-between">
            <span className="text-xs font-bold text-stone-600">
              💡 Changes apply immediately for all current & future sessions upon saving.
            </span>
            <button
              type="button"
              onClick={handleSaveRolePermissions}
              disabled={isSavingPerms}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{isSavingPerms ? 'Saving Changes...' : 'Save All Changes'}</span>
            </button>
          </div>
        </div>
      )}

      {/* ================= MODAL: REGISTER NEW STAFF ================= */}
      {isRegisterOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white border border-stone-200/90 rounded-3xl max-w-lg w-full p-4 sm:p-6 shadow-2xl relative my-8 text-stone-900">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <UserPlus className="w-5 h-5" />
                </div>
                <h3 className="text-base font-black text-stone-900">Register Staff Member</h3>
              </div>
              <button
                onClick={() => setIsRegisterOpen(false)}
                className="p-1.5 rounded-xl hover:bg-stone-100 text-stone-500 hover:text-stone-900 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-2xl">
                {modalError}
              </div>
            )}

            <form onSubmit={handleRegisterSubmit} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Employee Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Dawit Bekele"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-4 py-2.5 text-xs text-stone-900 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="flex items-center min-h-[20px] text-xs font-bold text-stone-700 mb-1">
                    Role & Station <span className="text-rose-500 ml-0.5">*</span>
                  </label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2.5 text-xs font-bold text-stone-900 focus:outline-none focus:border-emerald-600 cursor-pointer"
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
                  <label className="flex items-center min-h-[20px] text-xs font-bold text-stone-700 mb-1">
                    Employee Code (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Auto (e.g. EMP-010)"
                    value={formEmployeeCode}
                    onChange={(e) => setFormEmployeeCode(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-4 py-2.5 text-xs text-stone-900 focus:outline-none focus:border-emerald-600 uppercase"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-stone-700">
                    4-Digit Quick Touch PIN <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setFormPin(generateRandomPin())}
                    className="text-[11px] font-bold text-emerald-700 hover:underline flex items-center gap-1 cursor-pointer"
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
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-4 py-2.5 text-sm font-mono font-black text-stone-900 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 tracking-widest text-center"
                />
              </div>

              {formRole === 'MANAGER' && (
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Management Password (Optional)
                  </label>
                  <input
                    type="password"
                    placeholder="Defaults to nitsuh123"
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-4 py-2.5 text-xs text-stone-900 focus:outline-none focus:border-emerald-600"
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

              <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsRegisterOpen(false)}
                  className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer disabled:opacity-50"
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
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-stone-200/90 rounded-3xl max-w-sm w-full p-6 shadow-2xl relative text-stone-900">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-stone-900">Reset Staff PIN</h3>
                </div>
              </div>
              <button
                onClick={() => setIsResetPinOpen(false)}
                className="p-1.5 rounded-xl hover:bg-stone-100 text-stone-500 hover:text-stone-900 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {modalError && (
              <div className="mt-3 p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-2xl">
                {modalError}
              </div>
            )}

            <form onSubmit={handleResetPinSubmit} className="space-y-4 mt-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-stone-700">
                    New 4-Digit PIN
                  </label>
                  <button
                    type="button"
                    onClick={() => setNewPin(generateRandomPin())}
                    className="text-[11px] font-bold text-emerald-700 hover:underline flex items-center gap-1 cursor-pointer"
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
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-4 py-3 text-lg font-mono font-black text-stone-900 tracking-widest text-center focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsResetPinOpen(false)}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer disabled:opacity-50"
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
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white border border-stone-200/90 rounded-3xl max-w-md w-full p-4 sm:p-6 shadow-2xl relative my-8 text-stone-900">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <h3 className="text-sm font-black text-stone-900">Edit Staff Profile</h3>
              <button
                onClick={() => setIsEditOpen(false)}
                className="p-1.5 rounded-xl hover:bg-stone-100 text-stone-500 hover:text-stone-900 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {modalError && (
              <div className="mt-3 p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-2xl">
                {modalError}
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-3.5 mt-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-4 py-2.5 text-xs text-stone-900 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Employee Code
                  </label>
                  <input
                    type="text"
                    value={editCode}
                    onChange={(e) => setEditCode(e.target.value)}
                    required
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2.5 text-xs text-stone-900 focus:outline-none focus:border-emerald-600 uppercase font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Role
                  </label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2.5 text-xs font-bold text-stone-900 focus:outline-none focus:border-emerald-600 cursor-pointer"
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

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer disabled:opacity-50"
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
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-stone-200/90 rounded-3xl max-w-sm w-full p-6 shadow-2xl relative text-stone-900">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <h3 className="text-sm font-black text-stone-900">Reset Manager Password</h3>
              <button
                onClick={() => setIsPasswordModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-stone-100 text-stone-500 hover:text-stone-900 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {modalError && (
              <div className="mt-3 p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-2xl">
                {modalError}
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  New Password (min 6 chars)
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-4 py-2.5 text-xs text-stone-900 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {formSubmitting ? 'Updating...' : 'Set Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Confirmation Modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-stone-200/90 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                confirmModal.isDanger
                  ? 'bg-rose-50 border border-rose-200 text-rose-600'
                  : 'bg-emerald-50 border border-emerald-200 text-emerald-700'
              }`}
            >
              {confirmModal.isDanger ? (
                <AlertCircle className="w-6 h-6" />
              ) : (
                <CheckCircle2 className="w-6 h-6" />
              )}
            </div>

            <div>
              <h3 className="text-base font-black text-stone-900">{confirmModal.title}</h3>
              <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                {confirmModal.description}
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmModal.onConfirm}
                className={`px-4 py-2.5 rounded-xl text-white font-black text-xs transition shadow-xs cursor-pointer active:scale-95 ${
                  confirmModal.isDanger
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {confirmModal.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
