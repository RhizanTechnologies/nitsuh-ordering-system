'use client';

import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';

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

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', // Female Exec
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', // Male Manager
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150', // Female Cashier
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150', // Male Waiter
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150', // Female Waiter
  'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=150', // Chef Male
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150', // Chef Female
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150', // Storekeeper
];

export function StaffManagementView() {
  const { currentUser } = useAppStore();
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

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

  useEffect(() => {
    loadStaff();
  }, []);

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

  const handleOpenPasswordModal = (staff: StaffMember) => {
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

  // Filtered staff
  const filteredStaff = staffList.filter((s) => {
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

  const totalStaff = staffList.length;
  const activeStaff = staffList.filter((s) => s.isActive).length;
  const frontOfHouse = staffList.filter((s) => s.role === 'CASHIER' || s.role === 'WAITER').length;
  const kitchenStaff = staffList.filter((s) => s.role === 'KITCHEN_STAFF' || s.role === 'HEAD_CHEF').length;
  const storeStaff = staffList.filter((s) => s.role === 'MAIN_STOREKEEPER' || s.role === 'KITCHEN_STOREKEEPER').length;

  return (
    <div className="space-y-6 pb-16">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed top-20 right-5 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 animate-in fade-in slide-in-from-top-3 duration-200">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span className="text-xs font-black">{successToast}</span>
        </div>
      )}

      {/* Main Header Card */}
      <div className="bg-white dark:bg-[#161311] border border-stone-200/90 dark:border-white/10 rounded-3xl p-5 sm:p-7 shadow-sm transition-colors">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-stone-900 dark:text-white tracking-tight flex items-center gap-2">
                  Staff & User Management
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                    Owner Terminal
                  </span>
                </h1>
                <p className="text-xs text-stone-600 dark:text-zinc-400 font-medium">
                  Internal terminal identities, 4-digit touch PIN codes, role security & instant PIN recovery
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleOpenRegister}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-stone-950 font-black text-xs rounded-2xl shadow-lg shadow-amber-500/25 transition cursor-pointer active:scale-95"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Register New Staff</span>
            </button>
            <button
              onClick={loadStaff}
              title="Refresh Staff List"
              className="p-2.5 bg-stone-100 hover:bg-stone-200 dark:bg-white/[0.05] dark:hover:bg-white/[0.1] text-stone-700 dark:text-zinc-300 border border-stone-200 dark:border-white/10 rounded-2xl transition cursor-pointer"
            >
              <RotateCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-6 pt-5 border-t border-stone-200/80 dark:border-white/10">
          <div className="bg-stone-50 dark:bg-white/[0.03] p-3 rounded-2xl border border-stone-200/80 dark:border-white/10">
            <div className="text-[10px] font-bold text-stone-500 dark:text-zinc-400 uppercase">Total Registered</div>
            <div className="text-xl font-black text-stone-900 dark:text-white mt-0.5">{totalStaff}</div>
            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">{activeStaff} Active on Duty</div>
          </div>

          <div className="bg-stone-50 dark:bg-white/[0.03] p-3 rounded-2xl border border-stone-200/80 dark:border-white/10">
            <div className="text-[10px] font-bold text-stone-500 dark:text-zinc-400 uppercase">Front of House</div>
            <div className="text-xl font-black text-stone-900 dark:text-white mt-0.5">{frontOfHouse}</div>
            <div className="text-[10px] text-stone-500 dark:text-zinc-400">Cashiers & Waiters</div>
          </div>

          <div className="bg-stone-50 dark:bg-white/[0.03] p-3 rounded-2xl border border-stone-200/80 dark:border-white/10">
            <div className="text-[10px] font-bold text-stone-500 dark:text-zinc-400 uppercase">Kitchen & Chefs</div>
            <div className="text-xl font-black text-stone-900 dark:text-white mt-0.5">{kitchenStaff}</div>
            <div className="text-[10px] text-stone-500 dark:text-zinc-400">Cooks & Head Chefs</div>
          </div>

          <div className="bg-stone-50 dark:bg-white/[0.03] p-3 rounded-2xl border border-stone-200/80 dark:border-white/10">
            <div className="text-[10px] font-bold text-stone-500 dark:text-zinc-400 uppercase">Storekeepers</div>
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
            { id: 'CASHIER', label: 'Cashiers' },
            { id: 'WAITER', label: 'Waiters' },
            { id: 'KITCHEN_STAFF', label: 'Kitchen' },
            { id: 'MAIN_STOREKEEPER', label: 'Storekeepers' },
            { id: 'MANAGER', label: 'Managers' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setRoleFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex-shrink-0 cursor-pointer ${
                roleFilter === tab.id
                  ? 'bg-amber-500 text-stone-950 shadow-sm'
                  : 'bg-white dark:bg-[#161311] text-stone-600 dark:text-zinc-400 border border-stone-200 dark:border-white/10 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
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
                  staff.isActive
                    ? 'border-stone-200/90 dark:border-white/10'
                    : 'border-rose-300 dark:border-rose-900/40 bg-stone-50/50 dark:bg-stone-950/20 opacity-80'
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

                    {/* Status Pill */}
                    <button
                      onClick={() => handleToggleStatus(staff)}
                      title={`Click to ${staff.isActive ? 'Deactivate' : 'Activate'}`}
                      className={`text-[10px] font-black px-2 py-1 rounded-xl flex items-center gap-1 transition cursor-pointer ${
                        staff.isActive
                          ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30 hover:bg-emerald-100'
                          : 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-300 dark:border-rose-500/30 hover:bg-rose-100'
                      }`}
                    >
                      {staff.isActive ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Active</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3 h-3" />
                          <span>Locked</span>
                        </>
                      )}
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

                  {/* Workload Stats */}
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
                </div>

                {/* Bottom Card Actions */}
                <div className="mt-4 pt-3 border-t border-stone-200/80 dark:border-white/10 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleOpenResetPin(staff)}
                    className="flex-1 py-1.5 px-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30 rounded-xl text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <KeyRound className="w-3 h-3" />
                    <span>Reset PIN</span>
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
                      <span>Pass</span>
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
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#161311] border border-stone-200 dark:border-white/15 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative my-8">
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-zinc-300 mb-1">
                    Role & Station <span className="text-rose-500">*</span>
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
                    <option value="OWNER">Owner / Executive</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-zinc-300 mb-1">
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

              {(formRole === 'OWNER' || formRole === 'MANAGER') && (
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

              {/* Avatar Selector */}
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-zinc-300 mb-2">
                  Select Staff Avatar Icon
                </label>
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {AVATAR_PRESETS.map((url, idx) => (
                    <img
                      key={idx}
                      src={url}
                      alt="avatar preset"
                      onClick={() => setFormAvatar(url)}
                      className={`w-10 h-10 rounded-xl object-cover cursor-pointer transition border-2 flex-shrink-0 ${
                        formAvatar === url
                          ? 'border-amber-500 scale-105 ring-2 ring-amber-400/40'
                          : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                    />
                  ))}
                </div>
              </div>

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
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#161311] border border-stone-200 dark:border-white/15 rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
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

              <div className="grid grid-cols-2 gap-3">
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
                    <option value="OWNER">Owner / Executive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-zinc-300 mb-1.5">
                  Change Avatar
                </label>
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {AVATAR_PRESETS.map((url, idx) => (
                    <img
                      key={idx}
                      src={url}
                      alt="avatar"
                      onClick={() => setEditAvatar(url)}
                      className={`w-9 h-9 rounded-xl object-cover cursor-pointer transition border-2 flex-shrink-0 ${
                        editAvatar === url
                          ? 'border-amber-500 scale-105 ring-2 ring-amber-400/40'
                          : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                    />
                  ))}
                </div>
              </div>

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
  );
}
