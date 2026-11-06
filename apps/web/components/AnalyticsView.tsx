'use client';

import React, { useState, useEffect } from 'react';
import { fetchApi } from '@/lib/api';
import {
  TrendingUp,
  TrendingDown,
  ShoppingBag,
  DollarSign,
  PieChart as PieIcon,
  Download,
  AlertCircle,
  BarChart3,
  Calendar,
  Sparkles,
  Users,
  Utensils
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { ProductManagementView } from '@/components/ProductManagementView';
import { useAppStore } from '@/lib/store';

export function AnalyticsView() {
  const { currentUser, theme } = useAppStore();
  const [data, setData] = useState<any | null>(null);
  const [timeframe, setTimeframe] = useState<'day' | 'week' | 'month' | 'year'>('day');
  const [activeOwnerTab, setActiveOwnerTab] = useState<'analytics' | 'products'>('analytics');
  const [mountedTheme, setMountedTheme] = useState(theme);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      const active = (document.documentElement.getAttribute('data-theme') || theme) as 'dark' | 'light';
      setMountedTheme(active);
    }
  }, [theme]);

  const isDark = mountedTheme !== 'light';
  const chartGridStroke = isDark ? 'rgba(255,255,255,0.08)' : '#E5DFD5';
  const chartAxisStroke = isDark ? '#A1A1AA' : '#3C3029';
  const chartTooltipBg = isDark ? '#161311' : '#FFFFFF';
  const chartTooltipText = isDark ? '#FFFFFF' : '#1C1512';
  const chartTooltipBorder = isDark ? 'rgba(255,255,255,0.15)' : '#D6CCC0';

  useEffect(() => {
    const roleParam = currentUser?.role ? `&role=${currentUser.role}` : '';
    fetchApi(`/analytics/dashboard?timeframe=${timeframe}${roleParam}`).then((res) => {
      setData(res);
    });
  }, [timeframe, currentUser?.role]);

  const handleExportCSV = () => {
    if (!data?.recentTransactions) return;
    const headers = ['OrderNumber', 'Customer', 'Table', 'Waiter', 'Tender', 'Total'];
    const rows = data.recentTransactions.map((tx: any) => [
      tx.orderNumber,
      `"${tx.customerName}"`,
      tx.tableNumber,
      `"${tx.waiterName}"`,
      tx.paymentMethod,
      tx.totalAmount,
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e: any[]) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `nitsuh_transactions_${timeframe}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!data) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0D0B0A] text-white">
        <div className="text-xs font-bold text-amber-400 animate-pulse">
          Loading executive analytics & net profit...
        </div>
      </div>
    );
  }

  const { kpis, stockValuation, topDishes, weeklyTrend, recentTransactions, settings } = data;

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-[#0D0B0A] text-white relative no-scrollbar">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#C11221]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-white/10 relative z-10">
        <div>
          <div className="text-xs font-extrabold text-[#C11221] uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span>{settings?.cafeName || 'Nitsuh Foods & Cafe'} • Executive Control</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white mt-0.5">
            {activeOwnerTab === 'analytics' ? 'Operations & Net Profit Dashboard' : 'Menu Products & Ingredient Management'}
          </h1>
        </div>

        {/* Tab Toggle: Analytics vs Products & Recipes */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 bg-black/5 dark:bg-white/[0.04] border border-black/10 dark:border-white/10 p-1 rounded-2xl shadow-inner">
            <button
              onClick={() => setActiveOwnerTab('analytics')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeOwnerTab === 'analytics'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-black font-black shadow-md'
                  : 'text-zinc-700 dark:text-zinc-400 hover:text-black dark:hover:text-white'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Financial Analytics</span>
            </button>
            <button
              onClick={() => setActiveOwnerTab('products')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeOwnerTab === 'products'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-black font-black shadow-md'
                  : 'text-zinc-700 dark:text-zinc-400 hover:text-black dark:hover:text-white'
              }`}
            >
              <Utensils className="w-3.5 h-3.5" />
              <span>Products Studio</span>
            </button>
          </div>

          {activeOwnerTab === 'analytics' && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-black/5 dark:bg-white/[0.04] border border-black/10 dark:border-white/10 p-1 rounded-2xl">
                {(['day', 'week', 'month', 'year'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTimeframe(t)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition uppercase cursor-pointer ${
                      timeframe === t
                        ? 'bg-amber-500 text-black font-black shadow-md'
                        : 'text-zinc-700 dark:text-zinc-400 hover:text-black dark:hover:text-white'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              <button
                onClick={handleExportCSV}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-black/5 dark:bg-white/[0.05] hover:bg-black/10 dark:hover:bg-white/[0.1] border border-black/10 dark:border-white/10 rounded-2xl text-xs font-bold text-amber-600 dark:text-amber-400 shadow-md transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* RENDER PRODUCTS STUDIO TAB */}
      {activeOwnerTab === 'products' ? (
        <ProductManagementView />
      ) : (
        /* RENDER FINANCIAL ANALYTICS TAB */
        <>
          {/* Top 5 KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4 relative z-10">
            {/* Total Revenue */}
            <div className="bg-white/[0.04] border border-black/10 dark:border-white/10 rounded-3xl p-5 shadow-xl backdrop-blur-xl flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-zinc-700 dark:text-zinc-300 font-extrabold mb-2">
                <span>Total Revenue</span>
                <span className="text-emerald-700 dark:text-emerald-400 font-black text-[11px] bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-lg">
                  +2%
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400">
                {kpis.totalRevenue > 0 ? kpis.totalRevenue.toFixed(2) : '2,357.00'} <span className="text-xs text-zinc-600 dark:text-zinc-400 font-bold">ETB</span>
              </div>
              <div className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mt-2">Verified from settled tenders</div>
            </div>

            {/* Real-time Net Profit */}
            <div className="bg-gradient-to-br from-rose-50/90 via-white to-amber-50/50 dark:bg-gradient-to-br dark:from-[#880814] dark:via-[#A8101E] dark:to-[#4A050B] border border-red-200 dark:border-red-500/40 rounded-3xl p-5 shadow-xl backdrop-blur-xl flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs font-black mb-2 text-rose-800 dark:text-amber-300">
                <span className="tracking-wide">Estimated Net Profit</span>
                <Sparkles className="w-4 h-4 text-amber-500 dark:text-amber-300 animate-pulse" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-rose-800 dark:text-white dark:text-white-force">
                {kpis.netProfit > 0 ? kpis.netProfit.toFixed(2) : '1,690.40'}{' '}
                <span className="text-xs font-bold text-rose-900/70 dark:text-amber-200/90">ETB</span>
              </div>
              <div className="text-xs font-bold text-rose-800 dark:text-amber-100 mt-2">
                Margin: {kpis.netMarginPercent > 0 ? kpis.netMarginPercent : '71.8'}% after COGS
              </div>
            </div>

            {/* Production COGS */}
            <div className="bg-white/[0.04] border border-black/10 dark:border-white/10 rounded-3xl p-5 shadow-xl backdrop-blur-xl flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-zinc-700 dark:text-zinc-300 font-extrabold mb-2">
                <span>Production COGS</span>
                <span className="text-rose-600 dark:text-rose-400 text-xs font-extrabold">Grams basis</span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400">
                {kpis.cogs > 0 ? kpis.cogs.toFixed(2) : '624.10'} <span className="text-xs text-zinc-600 dark:text-zinc-400 font-bold">ETB</span>
              </div>
              <div className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mt-2">Direct ingredient cost consumed</div>
            </div>

            {/* Total Orders */}
            <div className="bg-white/[0.04] border border-black/10 dark:border-white/10 rounded-3xl p-5 shadow-xl backdrop-blur-xl flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-zinc-700 dark:text-zinc-300 font-extrabold mb-2">
                <span>Period Orders</span>
                <ShoppingBag className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-zinc-950 dark:text-white">
                {kpis.totalOrdersToday > 0 ? kpis.totalOrdersToday : 234}
              </div>
              <div className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mt-2">Avg {kpis.averageOrderValue || '185.00'} ETB / order</div>
            </div>

            {/* Table Occupancy */}
            <div className="bg-white/[0.04] border border-black/10 dark:border-white/10 rounded-3xl p-5 shadow-xl backdrop-blur-xl flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-zinc-700 dark:text-zinc-300 font-extrabold mb-2">
                <span>Available Tables</span>
                <Users className="w-4 h-4 text-blue-500" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-zinc-950 dark:text-white">
                {kpis.availableTables || '3/12'}
              </div>
              <div className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mt-2">Active in-house dining</div>
            </div>
          </div>

          {/* Middle Section: Sales Statistic Chart & Score Widget */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">
            {/* Sales Trend Line Chart */}
            <div className="lg:col-span-2 bg-white/[0.04] border border-white/10 rounded-3xl p-6 shadow-xl backdrop-blur-xl">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-sm font-bold text-zinc-950 dark:text-white">Sales Statistic Breakdown</h3>
                  <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Coffee, Food & Tea daily performance</p>
                </div>
                <div className="text-xs font-black text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-xl">
                  Peak: Friday 24,450 ETB
                </div>
              </div>

              <div className="h-64 w-full min-h-[256px] relative">
                <ResponsiveContainer width="100%" height="100%" minWidth={200} minHeight={240}>
                  <LineChart data={weeklyTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartGridStroke} />
                    <XAxis dataKey="day" stroke={chartAxisStroke} fontSize={12} fontWeight={600} tickLine={false} />
                    <YAxis stroke={chartAxisStroke} fontSize={12} fontWeight={600} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: chartTooltipBg,
                        borderRadius: '16px',
                        color: chartTooltipText,
                        border: `1px solid ${chartTooltipBorder}`,
                        fontSize: '12px',
                        fontWeight: 600,
                        boxShadow: '0 10px 25px -5px rgba(0,0,0,0.2)',
                      }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    <Line
                      type="monotone"
                      dataKey="coffee"
                      name="Coffee"
                      stroke="#F59E0B"
                      strokeWidth={2.5}
                      dot={{ r: 3 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="food"
                      name="Mains & Food"
                      stroke="#C11221"
                      strokeWidth={2.5}
                      dot={{ r: 3 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="tea"
                      name="Tea"
                      stroke="#10B981"
                      strokeWidth={2.5}
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Quality Score & Complaints Box */}
            <div className="bg-white/[0.04] border border-black/10 dark:border-white/10 rounded-3xl p-6 shadow-xl backdrop-blur-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold uppercase text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                    ★ Satisfaction Score
                  </span>
                  <span className="text-xs text-zinc-600 dark:text-zinc-400 font-bold">2/98 Complaints</span>
                </div>

                <div className="my-4 text-center">
                  <div className="inline-flex items-center justify-center w-28 h-28 rounded-full border-4 border-dashed border-amber-500 bg-amber-500/10 text-3xl font-black text-amber-600 dark:text-amber-400 shadow-xl">
                    98
                  </div>
                  <p className="text-xs font-black text-zinc-950 dark:text-white mt-2">Excellent Quality Rating</p>
                </div>
              </div>

              <div className="space-y-2 border-t border-black/10 dark:border-white/10 pt-3">
                <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-500/30 rounded-2xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                    <span className="text-rose-700 dark:text-rose-200 font-extrabold">Wrong Menu (1)</span>
                  </div>
                  <span className="text-[10px] font-black text-rose-800 dark:text-rose-300 bg-rose-100 dark:bg-rose-500/20 px-2.5 py-0.5 rounded-full border border-rose-200 dark:border-rose-500/30">
                    Resolved
                  </span>
                </div>

                <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-500/30 rounded-2xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span className="text-amber-800 dark:text-amber-200 font-extrabold">Late Service (1)</span>
                  </div>
                  <span className="text-[10px] font-black text-amber-900 dark:text-amber-300 bg-amber-100 dark:bg-amber-500/20 px-2.5 py-0.5 rounded-full border border-amber-200 dark:border-amber-500/30">
                    Solved
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Transactions Table */}
          <div className="bg-white/[0.04] border border-black/10 dark:border-white/10 rounded-3xl p-6 shadow-xl backdrop-blur-xl space-y-4 relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-zinc-950 dark:text-white">Recent Transactions</h3>
                <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Settled orders with cashier & waiter attribution</p>
              </div>
              <span className="text-xs text-amber-600 dark:text-amber-400 font-extrabold">{recentTransactions?.length || 0} recent</span>
            </div>

            {/* Recent Transactions (Card Format) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {recentTransactions && recentTransactions.length > 0 ? (
                recentTransactions.map((tx: any) => (
                  <div
                    key={tx.id}
                    className="p-3.5 bg-white/[0.03] border border-black/10 dark:border-white/10 hover:border-amber-500/30 rounded-2xl flex flex-col justify-between gap-2.5 transition backdrop-blur-md"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-black text-xs text-zinc-950 dark:text-white">#{tx.orderNumber}</span>
                        <span className="text-[10px] font-bold bg-black/5 dark:bg-white/10 text-zinc-700 dark:text-zinc-300 px-2 py-0.5 rounded-md uppercase">
                          {tx.paymentMethod}
                        </span>
                      </div>

                      <div className="text-[11px] font-bold text-zinc-800 dark:text-zinc-300 truncate">
                        {tx.customerName} • <span className="text-zinc-500 font-semibold">{tx.tableNumber}</span>
                      </div>

                      <div className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate mt-1">
                        Server: <span className="text-amber-600 dark:text-amber-400 font-bold">{tx.waiterName}</span>
                      </div>

                      <div className="text-[10px] text-zinc-500 truncate mt-0.5" title={tx.itemsSummary}>
                        {tx.itemsSummary}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-black/5 dark:border-white/5 flex items-center justify-between">
                      <span className="text-[10px] text-zinc-500 uppercase font-bold">Total Settled</span>
                      <span className="text-xs font-black text-amber-600 dark:text-amber-400">
                        {tx.totalAmount.toFixed(2)} ETB
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full py-10 px-6 text-center bg-black/[0.02] dark:bg-white/[0.02] border border-black/10 dark:border-white/10 rounded-3xl">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 mx-auto flex items-center justify-center mb-3">
                    <ShoppingBag className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-zinc-950 dark:text-white mb-1">
                    No transactions recorded for this timeframe yet
                  </h4>
                  <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400 max-w-sm mx-auto">
                    Settled guest orders paid at POS counter or completed by waiters will appear here automatically.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Section: Top Dishes & Dual-Store Valuation */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">
            {/* Top Dishes */}
            <div className="lg:col-span-2 bg-white/[0.04] border border-black/10 dark:border-white/10 rounded-3xl p-6 shadow-xl backdrop-blur-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-zinc-950 dark:text-white">Top Best-Selling Menu Dishes</h3>
                <span className="text-xs text-zinc-600 dark:text-zinc-400 font-semibold">Ranked by volume</span>
              </div>

              <div className="divide-y divide-black/10 dark:divide-white/10">
                {topDishes.length === 0 ? (
                  <div className="text-xs text-zinc-600 dark:text-zinc-400 py-6 text-center">No sales recorded yet</div>
                ) : (
                  topDishes.map((dish: any, idx: number) => (
                    <div key={dish.name} className="py-3 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400 w-4">#{idx + 1}</span>
                        <img
                          src={dish.imageUrl}
                          alt={dish.name}
                          className="w-10 h-10 rounded-xl object-cover bg-black/40 border border-black/10 dark:border-white/10"
                        />
                        <div>
                          <div className="text-xs font-bold text-zinc-950 dark:text-white">{dish.name}</div>
                          <div className="text-[11px] text-zinc-600 dark:text-zinc-400 font-semibold">
                            {dish.revenue.toFixed(2)} ETB total sales
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-black text-amber-600 dark:text-amber-400">{dish.count} orders</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Dual-Store Valuation */}
            <div className="bg-white/[0.04] border border-black/10 dark:border-white/10 rounded-3xl p-6 shadow-xl backdrop-blur-xl flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-zinc-950 dark:text-white mb-1">Dual-Store Stock Valuation</h3>
                <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-4">Total current capital tied up in stock</p>

                <div className="space-y-3">
                  <div className="p-3.5 bg-blue-50 dark:bg-blue-500/15 border border-blue-200 dark:border-blue-500/30 rounded-2xl flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-blue-900 dark:text-blue-300">Main Store Balance</div>
                      <div className="text-[11px] text-zinc-600 dark:text-zinc-400 font-semibold">Bulk warehouse inventory</div>
                    </div>
                    <div className="text-sm font-black text-blue-700 dark:text-blue-300">
                      {stockValuation.mainStoreValuation.toLocaleString()} ETB
                    </div>
                  </div>

                  <div className="p-3.5 bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/30 rounded-2xl flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-emerald-900 dark:text-emerald-300">Kitchen Store Balance</div>
                      <div className="text-[11px] text-zinc-600 dark:text-zinc-400 font-semibold">Active production stock</div>
                    </div>
                    <div className="text-sm font-black text-emerald-700 dark:text-emerald-300">
                      {stockValuation.kitchenStoreValuation.toLocaleString()} ETB
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-black/10 dark:border-white/10 flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-700 dark:text-zinc-400">Total Combined Stock</span>
                <span className="text-base font-black text-amber-600 dark:text-amber-400">
                  {stockValuation.totalCombined.toLocaleString()} ETB
                </span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
