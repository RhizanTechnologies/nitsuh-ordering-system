'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { fetchApi, getSocket } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import {
  Users,
  CheckCircle,
  Plus,
  Trash2,
  Edit3,
  Save,
  AlertCircle,
  LayoutGrid,
  Check,
  RefreshCw,
  Clock,
  ArrowRight
} from 'lucide-react';
import { calculatePrepTime } from '@/lib/timer-utils';

export default function TablesPage() {
  const { currentUser } = useAppStore();
  const [tablesList, setTablesList] = useState<any[]>([]);
  const [activeOrders, setActiveOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'AVAILABLE' | 'OCCUPIED' | 'RESERVED'>('ALL');

  // Form states for Add / Edit
  const [editingTableId, setEditingTableId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [tableNumber, setTableNumber] = useState('');
  const [capacity, setCapacity] = useState('4');
  const [status, setStatus] = useState<'AVAILABLE' | 'RESERVED'>('AVAILABLE');
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const isOwnerOrManager = currentUser?.role === 'OWNER' || currentUser?.role === 'MANAGER';

  const loadTables = async () => {
    setLoading(true);
    try {
      const [tablesData, ordersData] = await Promise.all([
        fetchApi('/menu/tables'),
        fetchApi('/orders?statuses=CONFIRMED,IN_PREPARATION,READY,SERVED').catch(() => []),
      ]);
      setTablesList(tablesData);
      setActiveOrders(ordersData || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTables();

    const socket = getSocket();
    const handleTablesUpdate = (updated: any[]) => {
      setTablesList(updated);
    };

    socket.on('tables:updated', handleTablesUpdate);
    return () => {
      socket.off('tables:updated', handleTablesUpdate);
    };
  }, []);

  const getNextSequentialTableNumber = () => {
    const nums = tablesList
      .map((t) => {
        const match = t.tableNumber.match(/\d+/);
        return match ? parseInt(match[0], 10) : 0;
      })
      .filter((n) => n > 0);
    const max = nums.length > 0 ? Math.max(...nums) : 0;
    const nextNum = max + 1;
    return `Table ${nextNum < 10 ? '0' + nextNum : nextNum}`;
  };

  const handleStartAdd = () => {
    setEditingTableId(null);
    setTableNumber(getNextSequentialTableNumber());
    setCapacity('4');
    setStatus('AVAILABLE');
    setShowAddForm(true);
    setError(null);
    setSuccessMsg(null);
  };

  const handleInstantAutoAddNext = async () => {
    const nextNum = getNextSequentialTableNumber();
    setFormLoading(true);
    try {
      await fetchApi('/menu/tables', {
        method: 'POST',
        body: JSON.stringify({
          tableNumber: nextNum,
          capacity: 4,
          status: 'AVAILABLE',
        }),
      });
      setSuccessMsg(`"${nextNum}" automatically created!`);
      loadTables();
    } catch (err: any) {
      setError(err.message || 'Failed to auto-add table');
    } finally {
      setFormLoading(false);
    }
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

  const handleSaveAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tableNumber.trim()) {
      setError('Table name or identifier is required');
      return;
    }
    setFormLoading(true);
    setError(null);
    try {
      await fetchApi('/menu/tables', {
        method: 'POST',
        body: JSON.stringify({
          tableNumber: tableNumber.trim(),
          capacity: parseInt(capacity, 10) || 4,
          status,
        }),
      });
      setSuccessMsg(`Table "${tableNumber}" added successfully!`);
      setShowAddForm(false);
      setTableNumber('');
      loadTables();
    } catch (err: any) {
      setError(err.message || 'Failed to add table');
    } finally {
      setFormLoading(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTableId || !tableNumber.trim()) return;
    setFormLoading(true);
    setError(null);
    try {
      await fetchApi(`/menu/tables/${editingTableId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          tableNumber: tableNumber.trim(),
          capacity: parseInt(capacity, 10) || 4,
          status,
        }),
      });
      setSuccessMsg(`Table "${tableNumber}" updated successfully!`);
      setEditingTableId(null);
      loadTables();
    } catch (err: any) {
      setError(err.message || 'Failed to update table');
    } finally {
      setFormLoading(false);
    }
  };

  const handleFreeTable = async (tableId: string, name: string) => {
    if (!confirm(`Are you sure you want to release "${name}" and mark it Available?`)) return;
    setLoading(true);
    try {
      await fetchApi(`/menu/tables/${tableId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'AVAILABLE' }),
      });
      setSuccessMsg(`Table "${name}" has been released and is now Available.`);
      await loadTables();
    } catch (err: any) {
      setError(err.message || 'Failed to release table');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (tableId: string, name: string) => {
    if (!confirm(`Are you sure you want to delete table "${name}"?`)) return;
    try {
      await fetchApi(`/menu/tables/${tableId}`, {
        method: 'DELETE',
      });
      setSuccessMsg(`Table "${name}" removed.`);
      loadTables();
    } catch (err: any) {
      alert(err.message || 'Failed to delete table. Check if table has active orders.');
    }
  };

  const filteredTables = tablesList.filter((t) => {
    if (statusFilter === 'ALL') return true;
    return t.status === statusFilter;
  });

  return (
    <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 lg:p-8 no-scrollbar bg-[#F8F9FA] text-stone-900 font-sans">
      <div className="max-w-7xl mx-auto space-y-5 pb-16">
        {/* Header Card */}
        <div className="bg-white border border-stone-200/90 rounded-3xl p-4 sm:p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0 shadow-2xs">
                <LayoutGrid className="w-5 h-5" />
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight leading-tight">
                Dining Tables
              </h1>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={loadTables}
                className="p-2 rounded-xl border border-stone-200 bg-stone-100 hover:bg-stone-200 text-stone-700 transition cursor-pointer shadow-xs"
                title="Refresh tables"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>

              {isOwnerOrManager && (
                <>
                  <button
                    onClick={handleInstantAutoAddNext}
                    className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 active:scale-95 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                    title="1-Click Auto-Number & Create Next Table"
                  >
                    <Plus className="w-4 h-4 stroke-[2.5]" />
                    <span>+ Auto Next</span>
                  </button>
                  <button
                    onClick={handleStartAdd}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                    <span>Add New Table</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {successMsg && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs flex items-center gap-2 animate-in fade-in">
            <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Add Form Card (Only for creating new table) */}
        {showAddForm && (
          <div className="p-5 bg-white rounded-3xl border border-stone-200/90 shadow-xs animate-in fade-in slide-in-from-top-2">
            <h3 className="text-sm font-black text-stone-900 mb-3 flex items-center gap-2">
              <Plus className="w-4 h-4 text-emerald-600" />
              <span>Add New Dining Table</span>
            </h3>

            <form onSubmit={handleSaveAdd} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1">
                  Table Name / Number *
                </label>
                <input
                  type="text"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  placeholder="e.g. T07 - Balcony"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 bg-stone-50 text-stone-900 placeholder-stone-400 font-bold"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1">
                  Guest Capacity
                </label>
                <select
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:border-emerald-600 bg-stone-50 text-stone-900 cursor-pointer"
                >
                  <option value="2">2 Guests (Couples)</option>
                  <option value="4">4 Guests (Standard)</option>
                  <option value="6">6 Guests (Family)</option>
                  <option value="8">8 Guests (Large Group)</option>
                  <option value="12">12+ Guests (VIP Hall)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1">
                  Initial Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:border-emerald-600 bg-stone-50 text-stone-900 cursor-pointer"
                >
                  <option value="AVAILABLE">Available</option>
                  <option value="RESERVED">Reserved</option>
                </select>
              </div>

              <div className="flex items-end gap-2">
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex-1 py-2 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>{formLoading ? 'Creating...' : 'Create Table'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="py-2 px-3 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {(['ALL', 'AVAILABLE', 'OCCUPIED', 'RESERVED'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                statusFilter === filter
                  ? 'bg-emerald-600 text-white font-black shadow-xs'
                  : 'bg-stone-100 border border-stone-200 text-stone-700 hover:bg-stone-200'
              }`}
            >
              {filter === 'ALL' && `All Tables (${tablesList.length})`}
              {filter === 'AVAILABLE' && `Available (${tablesList.filter((t) => t.status === 'AVAILABLE').length})`}
              {filter === 'OCCUPIED' && `Occupied (${tablesList.filter((t) => t.status === 'OCCUPIED').length})`}
              {filter === 'RESERVED' && `Reserved (${tablesList.filter((t) => t.status === 'RESERVED').length})`}
            </button>
          ))}
        </div>

        {/* Floor Plan Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredTables.map((t) => {
            const isEditing = editingTableId === t.id;

            if (isEditing) {
              return (
                <div
                  key={t.id}
                  className="p-4 rounded-3xl border-2 border-emerald-500 bg-white transition-all shadow-md relative flex flex-col justify-between animate-in fade-in"
                >
                  <form onSubmit={handleSaveEdit} className="space-y-3">
                    <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                      <div className="flex items-center gap-1.5 text-xs font-black text-emerald-800">
                        <Edit3 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Edit Table Details</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setEditingTableId(null)}
                        className="w-6 h-6 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition text-xs font-bold cursor-pointer"
                        title="Cancel"
                      >
                        ✕
                      </button>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-stone-600 uppercase mb-1">
                        Table Name / Number *
                      </label>
                      <input
                        type="text"
                        value={tableNumber}
                        onChange={(e) => setTableNumber(e.target.value)}
                        placeholder="e.g. T06 - VIP Lounge"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 bg-stone-50 text-stone-900 placeholder-stone-400 font-bold"
                        required
                        autoFocus
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-stone-600 uppercase mb-1">
                        Guest Capacity
                      </label>
                      <select
                        value={capacity}
                        onChange={(e) => setCapacity(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:border-emerald-600 bg-stone-50 text-stone-900 cursor-pointer font-medium"
                      >
                        <option value="2">2 Guests (Couples)</option>
                        <option value="4">4 Guests (Standard)</option>
                        <option value="6">6 Guests (Family)</option>
                        <option value="8">8 Guests (Large Group)</option>
                        <option value="12">12+ Guests (VIP Hall)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-stone-600 uppercase mb-1">
                        Table Status
                      </label>
                      <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value as any)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:border-emerald-600 bg-stone-50 text-stone-900 cursor-pointer font-medium"
                      >
                        <option value="AVAILABLE">Available (Open)</option>
                        <option value="RESERVED">Reserved</option>
                        {t.status === 'OCCUPIED' && <option value="OCCUPIED">Occupied</option>}
                      </select>
                    </div>

                    {error && editingTableId === t.id && (
                      <div className="p-2 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-[11px] font-medium">
                        {error}
                      </div>
                    )}

                    <div className="flex items-center gap-2 pt-2 border-t border-stone-100">
                      <button
                        type="submit"
                        disabled={formLoading}
                        className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>{formLoading ? 'Saving...' : 'Save Changes'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingTableId(null)}
                        className="py-2 px-3 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold transition cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              );
            }

            const isOccupied = t.status === 'OCCUPIED';
            const isReserved = t.status === 'RESERVED';

            return (
              <div
                key={t.id}
                className={`p-4 rounded-3xl border transition-all shadow-xs relative flex flex-col justify-between ${
                  isOccupied
                    ? 'bg-rose-50/70 border-rose-200 text-stone-900'
                    : isReserved
                    ? 'bg-amber-50/70 border-amber-200 text-stone-900'
                    : 'bg-white border-stone-200/90 hover:border-emerald-500/40 text-stone-900'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-black text-stone-900">{t.tableNumber}</span>
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase border ${
                        isOccupied
                          ? 'bg-rose-100 text-rose-800 border-rose-200'
                          : isReserved
                          ? 'bg-amber-100 text-amber-800 border-amber-200'
                          : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      }`}
                    >
                      {t.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-stone-500 mb-3">
                    <Users className="w-3.5 h-3.5 text-stone-400" />
                    <span>{t.capacity} Guests Capacity</span>
                  </div>

                  {isOccupied && (() => {
                    const activeOrder = activeOrders.find((o) => o.tableId === t.id);
                    const prep = activeOrder ? calculatePrepTime(activeOrder.createdAt) : null;
                    return (
                      <div className="bg-white rounded-2xl p-2.5 mb-3 border border-stone-200 text-xs space-y-1.5 shadow-2xs">
                        {activeOrder ? (
                          <>
                            <div className="flex items-center justify-between">
                              <span className="font-black text-stone-900">{activeOrder.orderNumber}</span>
                              {prep && (
                                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${prep.badgeClass}`}>
                                  {prep.formattedTime}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center justify-between text-[11px] text-stone-600">
                              <span>Server: <strong className="text-emerald-700">{activeOrder.waiter?.name || 'Staff'}</strong></span>
                              <span className="font-extrabold text-stone-900 font-mono">
                                {Number(activeOrder.totalAmount || 0).toFixed(2)} ETB
                              </span>
                            </div>
                          </>
                        ) : (
                          <div className="text-[11px] font-bold text-amber-800 py-1">
                            Table marked occupied (no active order found).
                          </div>
                        )}
                        <div className="flex items-center gap-1.5 pt-1">
                          {activeOrder && (
                            <Link
                              href="/pos"
                              className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded-xl flex items-center justify-center gap-1 transition shadow-xs"
                            >
                              <span>Settle in POS</span>
                              <ArrowRight className="w-3 h-3" />
                            </Link>
                          )}
                          {isOwnerOrManager && (
                            <button
                              type="button"
                              onClick={() => handleFreeTable(t.id, t.tableNumber)}
                              className="py-1.5 px-3 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-[11px] rounded-xl transition cursor-pointer"
                              title="Force clear table and set to Available"
                            >
                              Free Table
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {isOwnerOrManager && (
                  <div className="flex items-center justify-end gap-1 pt-3 border-t border-stone-200">
                    <button
                      onClick={() => handleStartEdit(t)}
                      className="p-1.5 text-stone-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition cursor-pointer"
                      title="Edit table"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(t.id, t.tableNumber)}
                      className="p-1.5 text-stone-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                      title="Delete table"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
