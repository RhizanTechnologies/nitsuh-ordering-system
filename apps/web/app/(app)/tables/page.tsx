'use client';

import React, { useState, useEffect } from 'react';
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
  RefreshCw
} from 'lucide-react';

export default function TablesPage() {
  const { currentUser } = useAppStore();
  const [tablesList, setTablesList] = useState<any[]>([]);
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
      const data = await fetchApi('/menu/tables');
      setTablesList(data);
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
      setSuccessMsg(`Table updated successfully!`);
      setEditingTableId(null);
      loadTables();
    } catch (err: any) {
      setError(err.message || 'Failed to update table');
    } finally {
      setFormLoading(false);
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
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-7xl mx-auto w-full text-white no-scrollbar">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <LayoutGrid className="w-6 h-6 text-amber-400" />
            <span>Dining Tables & Floor Plan</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Real-time table status monitoring and floor configuration (Add, Edit, Remove tables)
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={loadTables}
            className="p-2.5 rounded-2xl border border-white/10 bg-white/[0.05] hover:bg-white/[0.1] text-zinc-300 transition cursor-pointer"
            title="Refresh tables"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {isOwnerOrManager && (
            <button
              onClick={handleStartAdd}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 active:scale-95 text-black rounded-2xl text-xs font-black transition shadow-lg shadow-amber-500/25 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Add New Table</span>
            </button>
          )}
        </div>
      </div>

      {successMsg && (
        <div className="mb-4 p-3.5 bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 rounded-2xl text-xs flex items-center gap-2 animate-in fade-in backdrop-blur-xl">
          <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3.5 bg-rose-950/40 border border-rose-500/40 text-rose-300 rounded-2xl text-xs flex items-center gap-2 animate-in fade-in backdrop-blur-xl">
          <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Add / Edit Form Card */}
      {(showAddForm || editingTableId) && (
        <div className="mb-6 p-5 bg-white/[0.04] rounded-3xl border border-white/15 shadow-2xl backdrop-blur-xl">
          <h3 className="text-sm font-black text-white mb-3 flex items-center gap-2">
            {showAddForm ? <Plus className="w-4 h-4 text-amber-400" /> : <Edit3 className="w-4 h-4 text-amber-400" />}
            <span>{showAddForm ? 'Add New Dining Table' : 'Edit Table Details'}</span>
          </h3>

          <form onSubmit={showAddForm ? handleSaveAdd : handleSaveEdit} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-zinc-400 uppercase mb-1">
                Table Name / Number *
              </label>
              <input
                type="text"
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                placeholder="e.g. T07 - Balcony"
                className="w-full px-3 py-2 text-xs rounded-xl border border-white/10 focus:outline-none focus:border-amber-500/50 bg-white/[0.05] text-white placeholder-zinc-500"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-zinc-400 uppercase mb-1">
                Guest Capacity
              </label>
              <select
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-white/10 focus:outline-none focus:border-amber-500/50 bg-[#161311] text-white"
              >
                <option value="2">2 Guests (Couples)</option>
                <option value="4">4 Guests (Standard)</option>
                <option value="6">6 Guests (Family)</option>
                <option value="8">8 Guests (Large Group)</option>
                <option value="12">12+ Guests (VIP Hall)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-zinc-400 uppercase mb-1">
                Initial Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-white/10 focus:outline-none focus:border-amber-500/50 bg-[#161311] text-white"
              >
                <option value="AVAILABLE">🟢 Available (Clean)</option>
                <option value="RESERVED">🟡 Reserved</option>
              </select>
            </div>

            <div className="flex items-end gap-2">
              <button
                type="submit"
                disabled={formLoading}
                className="flex-1 py-2 px-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black rounded-xl text-xs font-black transition shadow-lg shadow-amber-500/20 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{formLoading ? 'Saving...' : showAddForm ? 'Create Table' : 'Save Changes'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setEditingTableId(null);
                }}
                className="py-2 px-3 bg-white/[0.08] hover:bg-white/[0.12] text-zinc-300 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1 no-scrollbar">
        {(['ALL', 'AVAILABLE', 'OCCUPIED', 'RESERVED'] as const).map((filter) => (
          <button
            key={filter}
            onClick={() => setStatusFilter(filter)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              statusFilter === filter
                ? 'bg-amber-500 text-black font-black shadow-md'
                : 'bg-white/[0.05] border border-white/10 text-zinc-400 hover:text-white'
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
          const isOccupied = t.status === 'OCCUPIED';
          const isReserved = t.status === 'RESERVED';

          return (
            <div
              key={t.id}
              className={`p-4 rounded-3xl border transition-all shadow-xl backdrop-blur-xl relative flex flex-col justify-between ${
                isOccupied
                  ? 'bg-rose-950/25 border-rose-500/40 text-rose-200'
                  : isReserved
                  ? 'bg-purple-950/25 border-purple-500/40 text-purple-200'
                  : 'bg-white/[0.04] border-white/10 hover:border-amber-500/40 text-white'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-black text-white">{t.tableNumber}</span>
                  <span
                    className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase border ${
                      isOccupied
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                        : isReserved
                        ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    }`}
                  >
                    {t.status}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-zinc-400 mb-4">
                  <Users className="w-3.5 h-3.5 text-zinc-500" />
                  <span>{t.capacity} Guests Capacity</span>
                </div>
              </div>

              {isOwnerOrManager && (
                <div className="flex items-center justify-end gap-1 pt-3 border-t border-white/10">
                  <button
                    onClick={() => handleStartEdit(t)}
                    className="p-1.5 text-zinc-400 hover:text-amber-400 hover:bg-white/[0.08] rounded-lg transition cursor-pointer"
                    title="Edit table"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(t.id, t.tableNumber)}
                    className="p-1.5 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition cursor-pointer"
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
  );
}
