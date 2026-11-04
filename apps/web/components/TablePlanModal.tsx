'use client';

import React, { useState, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { fetchApi, getSocket } from '@/lib/api';
import {
  X,
  Users,
  CheckCircle,
  Plus,
  Trash2,
  Edit3,
  Save,
  Settings2,
  AlertCircle,
  LayoutGrid,
  Check
} from 'lucide-react';

interface TablePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  tables: any[];
  selectedTable?: string;
  onSelectTable?: (tableNumber: string) => void;
  onTablesUpdated?: (tables: any[]) => void;
}

export function TablePlanModal({
  isOpen,
  onClose,
  tables: initialTables,
  selectedTable,
  onSelectTable,
  onTablesUpdated,
}: TablePlanModalProps) {
  const { currentUser } = useAppStore();
  const [tablesList, setTablesList] = useState<any[]>(initialTables || []);
  const [activeTab, setActiveTab] = useState<'floor' | 'manage'>('floor');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'AVAILABLE' | 'OCCUPIED' | 'RESERVED'>('ALL');

  // Form states for Add / Edit
  const [editingTableId, setEditingTableId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [tableNumber, setTableNumber] = useState('');
  const [capacity, setCapacity] = useState('4');
  const [status, setStatus] = useState<'AVAILABLE' | 'RESERVED'>('AVAILABLE');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const isOwnerOrManager = currentUser?.role === 'OWNER' || currentUser?.role === 'MANAGER';

  useEffect(() => {
    setTablesList(initialTables || []);
  }, [initialTables]);

  // Real-time table updates via Socket.IO
  useEffect(() => {
    const socket = getSocket();
    const handleTablesUpdate = (updatedTables: any[]) => {
      setTablesList(updatedTables);
      if (onTablesUpdated) onTablesUpdated(updatedTables);
    };

    socket.on('tables:updated', handleTablesUpdate);
    return () => {
      socket.off('tables:updated', handleTablesUpdate);
    };
  }, [onTablesUpdated]);

  if (!isOpen) return null;

  const refreshTables = async () => {
    try {
      const refreshed = await fetchApi('/menu/tables');
      setTablesList(refreshed);
      if (onTablesUpdated) onTablesUpdated(refreshed);
    } catch (e) {}
  };

  const handleStartAdd = () => {
    setEditingTableId(null);
    setTableNumber('');
    setCapacity('4');
    setStatus('AVAILABLE');
    setShowAddForm(true);
    setError(null);
    setSuccessMsg(null);
  };

  const handleStartEdit = (t: any) => {
    setShowAddForm(false);
    setEditingTableId(t.id);
    setTableNumber(t.tableNumber);
    setCapacity(String(t.capacity));
    setStatus(t.status === 'RESERVED' ? 'RESERVED' : 'AVAILABLE');
    setError(null);
    setSuccessMsg(null);
  };

  const handleCancelForm = () => {
    setEditingTableId(null);
    setShowAddForm(false);
    setError(null);
  };

  const handleSaveTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tableNumber.trim()) {
      setError('Please provide a table number or name.');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      if (editingTableId) {
        await fetchApi(`/menu/tables/${editingTableId}`, {
          method: 'PATCH',
          body: JSON.stringify({
            tableNumber: tableNumber.trim(),
            capacity: parseInt(capacity) || 4,
            status,
          }),
        });
        setSuccessMsg(`Table "${tableNumber}" updated successfully!`);
      } else {
        await fetchApi('/menu/tables', {
          method: 'POST',
          body: JSON.stringify({
            tableNumber: tableNumber.trim(),
            capacity: parseInt(capacity) || 4,
            status,
          }),
        });
        setSuccessMsg(`Table "${tableNumber}" created successfully!`);
      }

      handleCancelForm();
      await refreshTables();
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err: any) {
      setError(err.message || 'Failed to save table.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTable = async (t: any) => {
    if (!confirm(`Are you sure you want to delete Table "${t.tableNumber}"?`)) return;
    setLoading(true);
    setError(null);

    try {
      await fetchApi(`/menu/tables/${t.id}`, { method: 'DELETE' });
      setSuccessMsg(`Table "${t.tableNumber}" deleted.`);
      await refreshTables();
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err: any) {
      setError(err.message || 'Failed to delete table. Check if active orders exist.');
    } finally {
      setLoading(false);
    }
  };

  const filteredTables = tablesList.filter((t) => {
    const hasActiveOrder = t.orders && t.orders.length > 0;
    if (statusFilter === 'AVAILABLE') return !hasActiveOrder && t.status !== 'RESERVED';
    if (statusFilter === 'OCCUPIED') return hasActiveOrder;
    if (statusFilter === 'RESERVED') return t.status === 'RESERVED';
    return true;
  });

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-[#161311] text-white rounded-[32px] max-w-2xl w-full p-4 sm:p-6 shadow-2xl border border-white/15 my-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10">
          <div>
            <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
              <LayoutGrid className="w-5 h-5 text-amber-400" />
              <span>Dining Tables & Floor Plan</span>
            </h3>
            <p className="text-xs text-zinc-400">
              {isOwnerOrManager
                ? 'Configure dining tables, seat capacities, and room availability'
                : 'Select an available table for this dining guest'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-white/[0.08] hover:bg-white/[0.15] rounded-xl transition text-zinc-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Toggle for Owner/Manager */}
        {isOwnerOrManager && (
          <div className="flex items-center justify-between mb-4 bg-white/[0.04] p-1.5 rounded-2xl border border-white/10">
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  setActiveTab('floor');
                  handleCancelForm();
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  activeTab === 'floor'
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-black font-black shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Floor Plan View
              </button>
              <button
                onClick={() => setActiveTab('manage')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'manage'
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-black font-black shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Settings2 className="w-3.5 h-3.5" />
                <span>Manage Tables ({tablesList.length})</span>
              </button>
            </div>

            {activeTab === 'manage' && !showAddForm && (
              <button
                onClick={handleStartAdd}
                className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-black font-extrabold rounded-xl text-xs shadow-md transition active:scale-95 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Table</span>
              </button>
            )}
          </div>
        )}

        {/* Alerts & Feedback */}
        {error && (
          <div className="mb-4 p-3 bg-rose-950/40 border border-rose-500/40 text-rose-300 rounded-2xl text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {successMsg && (
          <div className="mb-4 p-3 bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 rounded-2xl text-xs font-semibold flex items-center gap-2">
            <CheckCircle className="w-4 h-4 flex-shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* ADD / EDIT FORM (For Owner / Manager) */}
        {(showAddForm || editingTableId) && (
          <form
            onSubmit={handleSaveTable}
            className="mb-5 p-4 bg-white/[0.04] border border-white/10 rounded-2xl space-y-3"
          >
            <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center justify-between">
              <span>{editingTableId ? 'Edit Dining Table' : 'Add New Dining Table'}</span>
              <button
                type="button"
                onClick={handleCancelForm}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-zinc-400 uppercase mb-1">
                  Table Number / Zone
                </label>
                <input
                  type="text"
                  placeholder="e.g. T05 - Balcony"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  required
                  className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500/50"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-400 uppercase mb-1">
                  Seating Capacity
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  required
                  className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500/50"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-400 uppercase mb-1">
                  Initial Status
                </label>
                <select
                  value={status}
                  onChange={(e: any) => setStatus(e.target.value)}
                  className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-amber-500/50"
                >
                  <option value="AVAILABLE" className="bg-[#161311] text-white">Available</option>
                  <option value="RESERVED" className="bg-[#161311] text-white">Reserved</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={handleCancelForm}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-zinc-400 hover:text-white transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-black rounded-xl text-xs font-extrabold shadow-md transition disabled:opacity-50 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{loading ? 'Saving...' : editingTableId ? 'Update Table' : 'Create Table'}</span>
              </button>
            </div>
          </form>
        )}

        {/* Status Filters Bar */}
        <div className="flex items-center justify-between flex-wrap gap-2 mb-3 text-xs font-semibold">
          <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar">
            {(['ALL', 'AVAILABLE', 'OCCUPIED', 'RESERVED'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition whitespace-nowrap cursor-pointer ${
                  statusFilter === s
                    ? 'bg-amber-500 text-black font-black shadow-md'
                    : 'bg-white/[0.05] border border-white/10 text-zinc-400 hover:text-white'
                }`}
              >
                {s === 'ALL' ? `All (${tablesList.length})` : s}
              </button>
            ))}
          </div>

          <div className="hidden sm:flex items-center gap-3 text-[11px]">
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-zinc-400">Open</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span className="text-zinc-400">Seated</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
              <span className="text-zinc-400">Reserved</span>
            </div>
          </div>
        </div>

        {/* TABLES GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-[380px] overflow-y-auto pr-1 no-scrollbar">
          {filteredTables.map((t) => {
            const hasActiveOrder = t.orders && t.orders.length > 0;
            const isSelected = selectedTable === t.tableNumber;
            const isReserved = t.status === 'RESERVED';

            return (
              <div
                key={t.id}
                onClick={() => {
                  if (activeTab === 'floor' && onSelectTable) {
                    onSelectTable(t.tableNumber);
                    onClose();
                  }
                }}
                className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between ${
                  activeTab === 'floor' ? 'cursor-pointer hover:border-amber-500/50' : ''
                } ${
                  isSelected && activeTab === 'floor'
                    ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-2 border-amber-500 text-white shadow-lg shadow-amber-500/20'
                    : hasActiveOrder
                    ? 'bg-amber-950/25 border-amber-500/40 text-amber-200'
                    : isReserved
                    ? 'bg-purple-950/25 border-purple-500/40 text-purple-200'
                    : 'bg-white/[0.04] border-white/10 hover:bg-white/[0.08] text-white'
                }`}
              >
                {/* Top Row: Name and Status Badge */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black truncate">{t.tableNumber}</span>
                  <span
                    className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${
                      isSelected && activeTab === 'floor'
                        ? 'bg-amber-500 text-black'
                        : hasActiveOrder
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : isReserved
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    {hasActiveOrder ? 'Seated' : isReserved ? 'Reserved' : 'Open'}
                  </span>
                </div>

                {/* Capacity */}
                <div className="flex items-center gap-1.5 text-xs text-zinc-400 mb-2">
                  <Users className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Capacity: {t.capacity} seats</span>
                </div>

                {/* Active Order Summary if Seated */}
                {hasActiveOrder && (
                  <div className="text-[11px] font-bold border-t border-white/10 pt-1.5 mb-2 text-amber-300">
                    Active: {t.orders[0].orderNumber} ({Number(t.orders[0].totalAmount).toFixed(2)} ETB)
                  </div>
                )}

                {/* Owner / Manager Action Bar in Manage Mode */}
                {isOwnerOrManager && activeTab === 'manage' && (
                  <div className="flex items-center justify-end gap-1 pt-2 border-t border-white/10 mt-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartEdit(t);
                      }}
                      className="p-1.5 text-zinc-400 hover:text-amber-400 hover:bg-white/[0.06] rounded-lg transition cursor-pointer"
                      title="Edit Table"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      disabled={hasActiveOrder}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteTable(t);
                      }}
                      className="p-1.5 text-zinc-400 hover:text-[#C11221] hover:bg-red-500/10 rounded-lg transition disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                      title={hasActiveOrder ? 'Cannot delete table with active order' : 'Delete Table'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {filteredTables.length === 0 && (
          <div className="py-12 text-center text-xs text-zinc-500">
            No tables match the selected filter.
          </div>
        )}
      </div>
    </div>
  );
}
