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
import { Button, Badge, Input } from '@/components/ui';

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
  const [tableToDelete, setTableToDelete] = useState<any | null>(null);

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
            capacity: parseInt(capacity, 10) || 4,
            status,
          }),
        });
        setSuccessMsg(`Table ${tableNumber} updated successfully.`);
      } else {
        await fetchApi('/menu/tables', {
          method: 'POST',
          body: JSON.stringify({
            tableNumber: tableNumber.trim(),
            capacity: parseInt(capacity, 10) || 4,
            status,
          }),
        });
        setSuccessMsg(`Table ${tableNumber} created successfully.`);
      }

      handleCancelForm();
      await refreshTables();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save table.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTable = (t: any) => {
    if (t.orders && t.orders.length > 0) {
      setError(`Cannot delete Table ${t.tableNumber} while it has an active dining bill.`);
      return;
    }
    setTableToDelete(t);
  };

  const confirmDeleteTable = async () => {
    if (!tableToDelete) return;
    const t = tableToDelete;
    setTableToDelete(null);
    try {
      await fetchApi(`/menu/tables/${t.id}`, { method: 'DELETE' });
      setSuccessMsg(`Table ${t.tableNumber} deleted.`);
      await refreshTables();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to delete table.');
    }
  };

  const filteredTables = tablesList.filter((t) => {
    const isOccupied = t.status === 'OCCUPIED';
    if (statusFilter === 'AVAILABLE') return t.status === 'AVAILABLE';
    if (statusFilter === 'OCCUPIED') return isOccupied;
    if (statusFilter === 'RESERVED') return t.status === 'RESERVED';
    return true;
  });

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#161311] text-stone-900 dark:text-white rounded-[32px] max-w-2xl w-full p-4 sm:p-6 shadow-2xl border border-stone-200 dark:border-white/15 my-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-stone-200 dark:border-white/10">
          <div>
            <h3 className="text-base sm:text-lg font-black text-stone-900 dark:text-white flex items-center gap-2">
              <LayoutGrid className="w-5 h-5 text-emerald-600" />
              <span>Dining Tables &amp; Floor Plan</span>
            </h3>
            <p className="text-xs text-stone-500 dark:text-zinc-400">
              {isOwnerOrManager
                ? 'Configure dining tables, seat capacities, and room availability'
                : 'Select an available table for this dining guest'}
            </p>
          </div>
          <Button
            variant="secondary"
            size="icon-sm"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Tab Toggle for Owner/Manager */}
        {isOwnerOrManager && (
          <div className="flex items-center justify-between mb-4 bg-stone-100 dark:bg-white/[0.04] p-1.5 rounded-2xl border border-stone-200 dark:border-white/10">
            <div className="flex items-center gap-1">
              <Button
                variant={activeTab === 'floor' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => {
                  setActiveTab('floor');
                  handleCancelForm();
                }}
              >
                Floor Plan View
              </Button>
              <Button
                variant={activeTab === 'manage' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('manage')}
              >
                <Settings2 className="w-3.5 h-3.5" />
                <span>Manage Tables ({tablesList.length})</span>
              </Button>
            </div>

            {activeTab === 'manage' && !showAddForm && (
              <Button
                variant="primary"
                size="sm"
                onClick={handleStartAdd}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Table</span>
              </Button>
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
            className="mb-5 p-4 bg-stone-50 dark:bg-white/[0.04] border border-stone-200 dark:border-white/10 rounded-2xl space-y-3"
          >
            <div className="text-xs font-bold text-stone-900 dark:text-white uppercase tracking-wider flex items-center justify-between">
              <span>{editingTableId ? 'Edit Dining Table' : 'Add New Dining Table'}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={handleCancelForm}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-stone-600 dark:text-zinc-400 uppercase mb-1">
                  Table Number / Zone
                </label>
                <Input
                  type="text"
                  placeholder="e.g. T05 - Balcony"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-600 dark:text-zinc-400 uppercase mb-1">
                  Seating Capacity
                </label>
                <Input
                  type="number"
                  min="1"
                  max="50"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-600 dark:text-zinc-400 uppercase mb-1">
                  Initial Status
                </label>
                <select
                  value={status}
                  onChange={(e: any) => setStatus(e.target.value)}
                  className="w-full bg-white dark:bg-[#161311] border border-stone-300 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-stone-900 dark:text-white focus:outline-none focus:border-amber-500/50"
                >
                  <option value="AVAILABLE" className="bg-white dark:bg-[#161311] text-stone-900 dark:text-white">Available</option>
                  <option value="RESERVED" className="bg-white dark:bg-[#161311] text-stone-900 dark:text-white">Reserved</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleCancelForm}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={loading}
              >
                <Save className="w-3.5 h-3.5" />
                <span>{loading ? 'Saving...' : editingTableId ? 'Update Table' : 'Create Table'}</span>
              </Button>
            </div>
          </form>
        )}

        {/* Status Filters Bar */}
        <div className="flex items-center justify-between flex-wrap gap-2 mb-3 text-xs font-semibold">
          <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar">
            {(['ALL', 'AVAILABLE', 'OCCUPIED', 'RESERVED'] as const).map((s) => (
              <Button
                key={s}
                variant={statusFilter === s ? 'success' : 'secondary'}
                size="sm"
                onClick={() => setStatusFilter(s)}
                className="text-[11px]"
              >
                {s === 'ALL' ? `All (${tablesList.length})` : s}
              </Button>
            ))}
          </div>

          <div className="hidden sm:flex items-center gap-3 text-[11px]">
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-stone-600 dark:text-zinc-400">Open</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span className="text-stone-600 dark:text-zinc-400">Occupied</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
              <span className="text-stone-600 dark:text-zinc-400">Reserved</span>
            </div>
          </div>
        </div>

        {/* Table Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[50vh] overflow-y-auto no-scrollbar pr-1 pt-1">
          {filteredTables.map((t) => {
            const isOccupied = t.status === 'OCCUPIED';
            const hasActiveOrder = isOccupied && t.orders && t.orders.length > 0;
            const isReserved = t.status === 'RESERVED';
            const isAvailable = t.status === 'AVAILABLE';
            // Only genuinely available tables can show as selected for a new order
            const isSelected = selectedTable === t.tableNumber && isAvailable;

            return (
              <div
                key={t.id}
                onClick={() => {
                  if (activeTab === 'floor' && onSelectTable) {
                    if (isOccupied) {
                      setError(`Table "${t.tableNumber}" is currently seated with an active bill. Please select an available Open table.`);
                      return;
                    }
                    if (isReserved) {
                      setError(`Table "${t.tableNumber}" is currently reserved. Please select an available Open table.`);
                      return;
                    }
                    onSelectTable(t.tableNumber);
                    onClose();
                  }
                }}
                className={`p-3.5 rounded-2xl border transition relative flex flex-col justify-between ${
                  isSelected
                    ? 'border-emerald-600 ring-2 ring-emerald-500/30 bg-emerald-50/50 cursor-pointer'
                    : isOccupied
                    ? 'bg-amber-50/30 border-amber-300/60 cursor-not-allowed opacity-80'
                    : isReserved
                    ? 'bg-purple-50/30 border-purple-200 cursor-not-allowed opacity-80'
                    : 'bg-stone-50 dark:bg-white/[0.04] border-stone-200 dark:border-white/10 hover:border-emerald-500 dark:hover:border-emerald-500 cursor-pointer hover:scale-[1.02] active:scale-[0.98]'
                }`}
              >
                {/* Floating Corner Selection Badge (Separated from header content) */}
                {isSelected && (
                  <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-emerald-600 text-white shadow-xs flex items-center justify-center ring-2 ring-white z-10">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                )}

                {/* Header: Table Title & Status Badge cleanly spaced */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0 flex-1">
                    <span className="font-heading font-black text-sm text-stone-900 dark:text-white block leading-tight truncate">
                      {t.tableNumber}
                    </span>
                  </div>

                  {/* Status Badge */}
                  <Badge
                    variant={isOccupied ? 'amber' : isReserved ? 'purple' : 'success'}
                    className="flex-shrink-0"
                  >
                    {isOccupied ? 'Seated' : isReserved ? 'Reserved' : 'Open'}
                  </Badge>
                </div>

                {/* Capacity */}
                <div className="flex items-center gap-1.5 text-xs text-stone-500 dark:text-zinc-400 mb-2">
                  <Users className="w-3.5 h-3.5 text-stone-500 dark:text-zinc-400" />
                  <span>Capacity: {t.capacity} seats</span>
                </div>

                {/* Active Order Summary if Seated */}
                {isOccupied && (
                  <div className="flex items-center justify-between gap-1 text-[11px] font-bold border-t border-amber-500/20 dark:border-white/10 pt-1.5 mb-2 text-amber-700 dark:text-amber-300">
                    <span className="truncate">
                      {hasActiveOrder
                        ? `Active: ${t.orders[0].orderNumber} (${Number(t.orders[0].totalAmount).toFixed(2)} ETB)`
                        : 'Occupied'}
                    </span>
                    <button
                      type="button"
                      onClick={async (e) => {
                        e.stopPropagation();
                        try {
                          await fetchApi(`/menu/tables/${t.id}`, {
                            method: 'PATCH',
                            body: JSON.stringify({ status: 'AVAILABLE' }),
                          });
                          setSuccessMsg(`Table ${t.tableNumber} is now Open.`);
                          await refreshTables();
                          setTimeout(() => setSuccessMsg(null), 2500);
                        } catch (err: any) {
                          setError(err.message || 'Failed to release table');
                        }
                      }}
                      className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-amber-200/70 hover:bg-emerald-600 hover:text-white text-amber-900 transition flex-shrink-0 cursor-pointer"
                      title="Clear table and set to Open"
                    >
                      Free Table
                    </button>
                  </div>
                )}

                {/* Owner / Manager Action Bar in Manage Mode */}
                {isOwnerOrManager && activeTab === 'manage' && (
                  <div className="flex items-center justify-end gap-1 pt-2 border-t border-stone-200 dark:border-white/10 mt-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartEdit(t);
                      }}
                      title="Edit Table"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      disabled={hasActiveOrder}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteTable(t);
                      }}
                      className="text-stone-500 hover:text-[#C11221]"
                      title={hasActiveOrder ? 'Cannot delete table with active order' : 'Delete Table'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
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

      {/* Confirmation Modal for Table Deletion */}
      {tableToDelete && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-stone-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-stone-200/90 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
              <Trash2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-black text-stone-900">Delete Table</h3>
              <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                Are you sure you want to delete table <strong className="text-stone-800 font-bold">&quot;{tableToDelete.tableNumber}&quot;</strong>? This action will remove it from the floor plan.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setTableToDelete(null)}
                className="px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteTable}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-black text-xs transition shadow-xs cursor-pointer"
              >
                Delete Table
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
