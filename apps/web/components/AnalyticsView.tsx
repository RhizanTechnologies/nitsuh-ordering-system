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
  LineChart as RechartsLineChart,
  Line as RechartsLine,
  XAxis as RechartsXAxis,
  YAxis as RechartsYAxis,
  CartesianGrid as RechartsCartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer as RechartsResponsiveContainer,
  Legend as RechartsLegend,
} from 'recharts';

const LineChart = RechartsLineChart as any;
const Line = RechartsLine as any;
const XAxis = RechartsXAxis as any;
const YAxis = RechartsYAxis as any;
const CartesianGrid = RechartsCartesianGrid as any;
const Tooltip = RechartsTooltip as any;
const ResponsiveContainer = RechartsResponsiveContainer as any;
const Legend = RechartsLegend as any;
import { ProductManagementView } from '@/components/ProductManagementView';
import { useAppStore } from '@/lib/store';

export function AnalyticsView() {
  const { currentUser } = useAppStore();
  const [data, setData] = useState<any | null>(null);
  const [timeframe, setTimeframe] = useState<'day' | 'week' | 'month' | 'year'>('day');
  const [activeOwnerTab, setActiveOwnerTab] = useState<'analytics' | 'products'>('analytics');

  const chartGridStroke = '#E5DFD5';
  const chartAxisStroke = '#3C3029';
  const chartTooltipBg = '#FFFFFF';
  const chartTooltipText = '#1C1512';
  const chartTooltipBorder = '#D6CCC0';

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
      <div className="flex-1 min-h-[400px] flex items-center justify-center bg-[#F8F9FA] text-stone-900 font-sans">
        <div className="text-xs font-bold text-emerald-600 animate-pulse">
          Loading analytics...
        </div>
      </div>
    );
  }

  const { kpis, stockValuation, topDishes, weeklyTrend, recentTransactions, settings } = data;

  return (
    <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 lg:p-8 no-scrollbar bg-[#F8F9FA] text-stone-900 font-sans">
      <div className="max-w-7xl mx-auto space-y-5 pb-16">
        {/* Top Header Filter Bar */}
        <div className="bg-white border border-stone-200/90 rounded-3xl p-4 sm:p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0 shadow-2xs">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight leading-tight">
                {activeOwnerTab === 'analytics' ? 'Operations & Profit' : 'Products & Recipes'}
              </h1>
            </div>

            {/* Tab Toggle: Analytics vs Products & Recipes */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 bg-stone-100 border border-stone-200 p-1 rounded-2xl">
                <button
                  onClick={() => setActiveOwnerTab('analytics')}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    activeOwnerTab === 'analytics'
                      ? 'bg-emerald-600 text-white font-black shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span>Financial Analytics</span>
                </button>
                <button
                  onClick={() => setActiveOwnerTab('products')}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    activeOwnerTab === 'products'
                      ? 'bg-emerald-600 text-white font-black shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <Utensils className="w-3.5 h-3.5" />
                  <span>Products Studio</span>
                </button>
              </div>

              {activeOwnerTab === 'analytics' && (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 bg-stone-100 border border-stone-200 p-1 rounded-2xl">
                    {(['day', 'week', 'month', 'year'] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => setTimeframe(t)}
                        className={`px-3 py-1 rounded-xl text-xs font-bold transition uppercase cursor-pointer ${
                          timeframe === t
                            ? 'bg-emerald-600 text-white font-black shadow-xs'
                            : 'text-stone-600 hover:text-stone-900'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={handleExportCSV}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-stone-100 hover:bg-stone-200 border border-stone-200 rounded-xl text-xs font-bold text-stone-700 shadow-xs transition cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-stone-600" />
                    <span>Export CSV</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RENDER PRODUCTS STUDIO TAB */}
        {activeOwnerTab === 'products' ? (
          <ProductManagementView />
        ) : (
          /* RENDER FINANCIAL ANALYTICS TAB */
          <>
            {/* Top 5 KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4">
              {/* Total Revenue */}
              <div className="bg-white border border-stone-200/90 rounded-3xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between text-xs text-stone-600 font-bold mb-2">
                  <span>Total Revenue</span>
                  <span className="text-emerald-800 font-bold text-[10px] bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                    Live
                  </span>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-stone-900">
                  {(kpis.totalRevenue ?? 0).toFixed(2)} <span className="text-xs text-stone-500 font-bold">ETB</span>
                </div>
              </div>

              {/* Real-time Net Profit */}
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-3xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between text-xs font-bold mb-2 text-emerald-900">
                  <span>Estimated Net Profit</span>
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-emerald-800">
                  {(kpis.netProfit ?? 0).toFixed(2)}{' '}
                  <span className="text-xs font-bold text-emerald-700">ETB</span>
                </div>
                <div className="text-xs font-bold text-emerald-700 mt-1">
                  Margin: {Number(kpis.netMarginPercent ?? 0).toFixed(1)}%
                </div>
              </div>

              {/* Production COGS */}
              <div className="bg-white border border-stone-200/90 rounded-3xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
                <div className="text-xs text-stone-600 font-bold mb-2">
                  Production COGS
                </div>
                <div className="text-2xl sm:text-3xl font-black text-stone-900">
                  {(kpis.cogs ?? 0).toFixed(2)} <span className="text-xs text-stone-500 font-bold">ETB</span>
                </div>
              </div>

              {/* Total Orders */}
              <div className="bg-white border border-stone-200/90 rounded-3xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between text-xs text-stone-600 font-bold mb-2">
                  <span>Total Orders</span>
                  <ShoppingBag className="w-4 h-4 text-stone-400" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-stone-900">
                  {kpis.totalOrdersToday ?? 0}
                </div>
              </div>

              {/* Table Occupancy */}
              <div className="bg-white border border-stone-200/90 rounded-3xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between text-xs text-stone-600 font-bold mb-2">
                  <span>Available Tables</span>
                  <Users className="w-4 h-4 text-stone-400" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-stone-900">
                  {kpis.availableTables || '0/0'}
                </div>
              </div>
            </div>

            {/* Middle Section: Sales Statistic Chart & Score Widget */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Sales Trend Line Chart */}
              <div className="lg:col-span-2 bg-white border border-stone-200/90 rounded-3xl p-6 shadow-xs">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-sm font-bold text-stone-900">Sales Trend Breakdown</h3>
                  </div>
                  <div className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-xl">
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
                          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                        }}
                      />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                      <Line
                        type="monotone"
                        dataKey="coffee"
                        name="Coffee"
                        stroke="#059669"
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
                        stroke="#0284C7"
                        strokeWidth={2.5}
                        dot={{ r: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Quality Score & Complaints Box */}
              <div className="bg-white border border-stone-200/90 rounded-3xl p-6 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold uppercase text-stone-600 flex items-center gap-1.5">
                      ★ Satisfaction Score
                    </span>
                    <span className="text-xs text-stone-500 font-bold">2/98 Complaints</span>
                  </div>

                  <div className="my-4 text-center">
                    <div className="inline-flex items-center justify-center w-28 h-28 rounded-full border-4 border-dashed border-emerald-500 bg-emerald-50 text-3xl font-black text-emerald-700 shadow-xs">
                      98
                    </div>
                    <p className="text-xs font-black text-stone-900 mt-2">Excellent Rating</p>
                  </div>
                </div>

                <div className="space-y-2 border-t border-stone-200 pt-3">
                  <div className="p-2.5 bg-stone-50 border border-stone-200 rounded-2xl flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-stone-500" />
                      <span className="text-stone-800 font-bold">Wrong Menu (1)</span>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Resolved
                    </span>
                  </div>

                  <div className="p-2.5 bg-stone-50 border border-stone-200 rounded-2xl flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-stone-500" />
                      <span className="text-stone-800 font-bold">Late Service (1)</span>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Solved
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Transactions Table */}
            <div className="bg-white border border-stone-200/90 rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-stone-900">Recent Transactions</h3>
                <span className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full font-bold">
                  {recentTransactions?.length || 0} recent
                </span>
              </div>

              {/* Recent Transactions (Card Format) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {recentTransactions && recentTransactions.length > 0 ? (
                  recentTransactions.map((tx: any) => (
                    <div
                      key={tx.id}
                      className="p-3.5 bg-stone-50 border border-stone-200/80 hover:border-emerald-500/30 rounded-2xl flex flex-col justify-between gap-2.5 transition"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-black text-xs text-stone-900">#{tx.orderNumber}</span>
                          <span className="text-[10px] font-bold bg-white text-stone-700 px-2 py-0.5 rounded-md uppercase border border-stone-200">
                            {tx.paymentMethod}
                          </span>
                        </div>

                        <div className="text-[11px] font-bold text-stone-800 truncate">
                          {tx.customerName} • <span className="text-stone-500 font-semibold">{tx.tableNumber}</span>
                        </div>

                        <div className="text-[10px] text-stone-500 truncate mt-1">
                          Server: <span className="text-emerald-700 font-bold">{tx.waiterName}</span>
                        </div>

                        <div className="text-[10px] text-stone-500 truncate mt-0.5" title={tx.itemsSummary}>
                          {tx.itemsSummary}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-stone-200 flex items-center justify-between">
                        <span className="text-[10px] text-stone-500 uppercase font-bold">Settled</span>
                        <span className="text-xs font-black text-stone-900 font-mono">
                          {tx.totalAmount.toFixed(2)} ETB
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full py-8 px-6 text-center bg-stone-50 border border-stone-200 rounded-2xl">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 mx-auto flex items-center justify-center mb-2">
                      <ShoppingBag className="w-5 h-5" />
                    </div>
                    <h4 className="text-xs font-bold text-stone-700">
                      No transactions recorded yet
                    </h4>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Section: Top Dishes & Dual-Store Valuation */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Top Dishes */}
              <div className="lg:col-span-2 bg-white border border-stone-200/90 rounded-3xl p-6 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-stone-900">Top Best-Selling Dishes</h3>
                </div>

                <div className="divide-y divide-stone-100">
                  {topDishes.length === 0 ? (
                    <div className="text-xs text-stone-500 py-6 text-center">No sales recorded yet</div>
                  ) : (
                    topDishes.map((dish: any, idx: number) => (
                      <div key={dish.name} className="py-3 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold text-stone-400 w-4">#{idx + 1}</span>
                          <img
                            src={dish.imageUrl}
                            alt={dish.name}
                            className="w-10 h-10 rounded-xl object-cover bg-stone-100 border border-stone-200"
                          />
                          <div>
                            <div className="text-xs font-bold text-stone-900">{dish.name}</div>
                            <div className="text-[11px] text-stone-500 font-semibold">
                              {dish.revenue.toFixed(2)} ETB total sales
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-black text-emerald-700">{dish.count} orders</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Dual-Store Valuation */}
              <div className="bg-white border border-stone-200/90 rounded-3xl p-6 shadow-xs flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold text-stone-900 mb-3">Store Stock Valuation</h3>

                  <div className="space-y-3">
                    <div className="p-3.5 bg-stone-50 border border-stone-200/80 rounded-2xl flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-stone-800">Main Store Balance</div>
                      </div>
                      <div className="text-sm font-black text-stone-900 font-mono">
                        {stockValuation.mainStoreValuation.toLocaleString()} ETB
                      </div>
                    </div>

                    <div className="p-3.5 bg-stone-50 border border-stone-200/80 rounded-2xl flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-stone-800">Kitchen Store Balance</div>
                      </div>
                      <div className="text-sm font-black text-stone-900 font-mono">
                        {stockValuation.kitchenStoreValuation.toLocaleString()} ETB
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-stone-200 flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-600">Total Stock Value</span>
                  <span className="text-base font-black text-emerald-700 font-mono">
                    {stockValuation.totalCombined.toLocaleString()} ETB
                  </span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
