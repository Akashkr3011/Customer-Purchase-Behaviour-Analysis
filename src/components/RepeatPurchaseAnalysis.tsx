import React from 'react';
import { OrderDistribution, RepeatPurchaseCadence } from '../types/analytics';
import { Repeat, Clock, DollarSign, ArrowRight } from 'lucide-react';

interface RepeatPurchaseAnalysisProps {
  repeatBuyerCount: number;
  oneTimeBuyerCount: number;
  repeatRate: number;
  repeatRevenue: number;
  oneTimeRevenue: number;
  repeatRevenueShare: number;
  orderDistribution: OrderDistribution[];
  cadence: RepeatPurchaseCadence[];
  avgDaysBetween: number;
}

export const RepeatPurchaseAnalysis: React.FC<RepeatPurchaseAnalysisProps> = ({
  repeatBuyerCount,
  oneTimeBuyerCount,
  repeatRate,
  repeatRevenue,
  oneTimeRevenue,
  repeatRevenueShare,
  orderDistribution,
  cadence,
  avgDaysBetween,
}) => {
  const maxOrderCount = Math.max(...orderDistribution.map((d) => d.customer_count), 1);
  const maxCadenceCount = Math.max(...cadence.map((c) => c.customer_count), 1);
  const totalCustomers = repeatBuyerCount + oneTimeBuyerCount;

  return (
    <div className="bg-white border border-slate-200 rounded p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200 gap-2">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 tracking-tight">
            Repeat Purchase Dynamics & Frequency Analysis
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Evaluating purchase velocity, customer conversion from 1st to 2nd purchase, and repeat revenue compounding.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500">Average Interval:</span>
          <span className="font-mono font-semibold text-slate-900 bg-slate-100 px-2.5 py-1 rounded">
            {avgDaysBetween} days to 2nd order
          </span>
        </div>
      </div>

      {/* High-level Revenue & Customer Split */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
        {/* 1-Time Customers */}
        <div className="border border-slate-200 rounded p-4 bg-slate-50/50">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Single-Purchase Cohort (1 Order)
            </span>
            <span className="text-xs font-mono text-slate-600">
              {((oneTimeBuyerCount / (totalCustomers || 1)) * 100).toFixed(1)}% of base
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div>
              <div className="text-2xl font-bold font-mono text-slate-800 tabular-nums">
                {oneTimeBuyerCount} <span className="text-sm font-normal text-slate-500">customers</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-semibold font-mono text-slate-800 tabular-nums">
                ₹{oneTimeRevenue.toLocaleString('en-IN')}
              </div>
              <div className="text-xs text-slate-500">
                {(100 - repeatRevenueShare).toFixed(1)}% total revenue
              </div>
            </div>
          </div>
        </div>

        {/* Repeat Customers */}
        <div className="border border-emerald-200 bg-emerald-50/20 rounded p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">
              Repeat Customers Cohort (2+ Orders)
            </span>
            <span className="text-xs font-mono font-semibold text-emerald-700">
              {repeatRate}% of base
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div>
              <div className="text-2xl font-bold font-mono text-emerald-900 tabular-nums">
                {repeatBuyerCount} <span className="text-sm font-normal text-emerald-700">customers</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-semibold font-mono text-emerald-900 tabular-nums">
                ₹{repeatRevenue.toLocaleString('en-IN')}
              </div>
              <div className="text-xs text-emerald-700 font-medium">
                {repeatRevenueShare}% total revenue
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Two Analytical Visualizers: Frequency Histogram + Days to 2nd Purchase Cadence */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4">
        {/* Visualization 1: Order Frequency Distribution (Histogram) */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-900">
              Distribution of Order Frequency (Orders per Customer)
            </h3>
            <span className="text-xs text-slate-500 font-mono">Count & Spend</span>
          </div>

          <div className="space-y-3">
            {orderDistribution.map((item) => {
              const label = item.order_count === 5 ? '5+ Orders' : `${item.order_count} ${item.order_count === 1 ? 'Order' : 'Orders'}`;
              const barPct = (item.customer_count / maxOrderCount) * 100;
              const isRepeat = item.order_count >= 2;

              return (
                <div key={item.order_count} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className={`font-medium ${isRepeat ? 'text-emerald-800' : 'text-slate-700'}`}>
                      {label}
                    </span>
                    <span className="font-mono text-slate-500">
                      <span className="font-semibold text-slate-800">{item.customer_count}</span> customers ({item.percentage}%) · ₹{item.total_revenue.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="h-4 bg-slate-100 rounded-xs overflow-hidden flex items-center">
                    <div
                      className={`h-full rounded-xs transition-all duration-300 ${
                        isRepeat ? 'bg-emerald-600' : 'bg-slate-400'
                      }`}
                      style={{ width: `${Math.max(3, barPct)}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>

          <p className="text-xs text-slate-500 mt-4 leading-relaxed">
            <strong>Key Frequency Insight:</strong> Transitioning a 1-time buyer to their 2nd purchase unlocks exponential lifetime value, with repeat buyers spending an average of {((repeatRevenue / (repeatBuyerCount || 1)) / (oneTimeRevenue / (oneTimeBuyerCount || 1))).toFixed(1)}x more total revenue than single-order customers.
          </p>
        </div>

        {/* Visualization 2: Time to Second Purchase Cadence (Days Interval) */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-900">
              Inter-Purchase Interval (Days to Second Purchase)
            </h3>
            <span className="text-xs text-slate-500 font-mono">Cohort Cadence</span>
          </div>

          <div className="space-y-3">
            {cadence.map((c) => {
              const barPct = (c.customer_count / maxCadenceCount) * 100;
              return (
                <div key={c.bucket} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-700">{c.bucket}</span>
                    <span className="font-mono text-slate-500">
                      <span className="font-semibold text-slate-800">{c.customer_count}</span> customers ({c.percentage}%)
                    </span>
                  </div>
                  <div className="h-4 bg-slate-100 rounded-xs overflow-hidden flex items-center">
                    <div
                      className="h-full bg-blue-600 rounded-xs transition-all duration-300"
                      style={{ width: `${Math.max(3, barPct)}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 p-3 bg-blue-50/50 border border-blue-100 rounded text-xs text-blue-900 leading-relaxed">
            <strong>Retention Playbook Trigger:</strong> The peak repurchase window is concentrated within the first 30 days. Marketing automation workflows should schedule targeted replenishment and cross-sell nudges between <strong>Day 14 and Day 28</strong> post-purchase before decay occurs.
          </div>
        </div>
      </div>
    </div>
  );
};
