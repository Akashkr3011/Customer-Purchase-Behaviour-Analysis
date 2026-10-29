import React from 'react';
import { CustomerSummary, SegmentMetrics, CleaningReport } from '../types/analytics';
import { IndianRupee, Users, ShoppingCart, TrendingUp, Repeat } from 'lucide-react';

interface OverviewKpiStripProps {
  summaries: CustomerSummary[];
  segmentMetrics: SegmentMetrics[];
  totalTransactions: number;
  repeatRate: number;
  repeatBuyerCount: number;
  report?: CleaningReport;
}

export const OverviewKpiStrip: React.FC<OverviewKpiStripProps> = ({
  summaries,
  totalTransactions,
  repeatRate,
  repeatBuyerCount,
}) => {
  const totalRevenue = summaries.reduce((acc, c) => acc + c.total_spend, 0);
  const totalOrders = summaries.reduce((acc, c) => acc + c.order_count, 0);
  const overallAov = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {/* 1. Total Revenue */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-1.5">
          <span>Total Revenue</span>
          <div className="p-1.5 bg-blue-50 text-blue-600 rounded-md">
            <IndianRupee className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 tracking-tight">
          ₹{totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <div className="text-xs text-slate-500 mt-1">
          From {totalTransactions.toLocaleString('en-IN')} line items
        </div>
      </div>

      {/* 2. Total Customers */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-1.5">
          <span>Total Customers</span>
          <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-md">
            <Users className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 tracking-tight">
          {summaries.length.toLocaleString('en-IN')}
        </div>
        <div className="text-xs text-slate-500 mt-1">
          ₹{(totalRevenue / (summaries.length || 1)).toLocaleString('en-IN', { maximumFractionDigits: 0 })} avg spend/cust
        </div>
      </div>

      {/* 3. Total Orders */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-1.5">
          <span>Total Orders</span>
          <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-md">
            <ShoppingCart className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 tracking-tight">
          {totalOrders.toLocaleString('en-IN')}
        </div>
        <div className="text-xs text-slate-500 mt-1">
          Unique orders via <code className="text-[11px] bg-slate-100 px-1 py-0.5 rounded font-mono">order_id</code>
        </div>
      </div>

      {/* 4. Average Order Value (AOV) */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-1.5">
          <span>Average Order Value</span>
          <div className="p-1.5 bg-amber-50 text-amber-600 rounded-md">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 tracking-tight">
          ₹{overallAov.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <div className="text-xs text-slate-500 mt-1">
          Total Revenue / Unique Orders
        </div>
      </div>

      {/* 5. Repeat-Purchase Rate */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-1.5">
          <span>Repeat-Purchase Rate</span>
          <div className="p-1.5 bg-purple-50 text-purple-600 rounded-md">
            <Repeat className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-bold font-mono tabular-nums text-purple-700 tracking-tight">
          {repeatRate.toFixed(1)}%
        </div>
        <div className="text-xs text-slate-500 mt-1">
          {repeatBuyerCount} buyers with 2+ orders
        </div>
      </div>
    </div>
  );
};
