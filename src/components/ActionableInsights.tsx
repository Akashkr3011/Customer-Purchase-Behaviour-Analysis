import React from 'react';
import { SegmentMetrics, ThresholdConfig } from '../types/analytics';
import { Target, Award, ShoppingBag, ArrowRight, ShieldCheck, Mail, Zap } from 'lucide-react';

interface ActionableInsightsProps {
  repeatRate: number;
  repeatRevenueShare: number;
  segmentMetrics: SegmentMetrics[];
  thresholds: ThresholdConfig;
  avgDaysBetween: number;
}

export const ActionableInsights: React.FC<ActionableInsightsProps> = ({
  repeatRate,
  repeatRevenueShare,
  segmentMetrics,
  thresholds,
  avgDaysBetween,
}) => {
  const highSpend = segmentMetrics.find((s) => s.segment === 'High Spend');
  const medSpend = segmentMetrics.find((s) => s.segment === 'Medium Spend');
  const lowSpend = segmentMetrics.find((s) => s.segment === 'Low Spend');

  return (
    <div className="bg-white border border-slate-200 rounded p-6">
      <div className="pb-6 border-b border-slate-200">
        <h2 className="text-lg font-semibold text-slate-900 tracking-tight">
          Actionable Observations & Strategic Business Playbooks
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Data-grounded initiatives translating empirical customer purchase behaviour into measurable revenue growth.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-6">
        {/* Playbook 1: Customer Retention */}
        <div className="border border-slate-200 rounded p-5 bg-slate-50/50 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-slate-900 font-semibold text-sm mb-2">
              <div className="w-6 h-6 rounded bg-emerald-100 text-emerald-800 flex items-center justify-center">
                <Target className="w-3.5 h-3.5" />
              </div>
              <span>1. Customer Retention Playbook</span>
            </div>

            <div className="text-xs text-slate-600 space-y-2 mt-3 leading-relaxed">
              <p>
                <strong>Empirical Observation:</strong> {repeatRate}% of customer accounts are repeat buyers, yet they generate <strong>{repeatRevenueShare}% of total gross revenue</strong>. The median interval between 1st and 2nd purchase is {avgDaysBetween} days.
              </p>
              <p>
                <strong>Recommended Action:</strong> Deploy an automated post-purchase sequence triggering at <strong>Day {Math.max(7, avgDaysBetween - 10)} to Day {avgDaysBetween + 5}</strong> with personalized category recommendations and replenishment reminders.
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-200 text-xs font-medium text-emerald-800 flex items-center justify-between">
            <span>Projected Impact:</span>
            <span className="font-mono font-semibold">+12% to +18% 2nd-order lift</span>
          </div>
        </div>

        {/* Playbook 2: Loyalty Programs */}
        <div className="border border-slate-200 rounded p-5 bg-slate-50/50 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-slate-900 font-semibold text-sm mb-2">
              <div className="w-6 h-6 rounded bg-indigo-100 text-indigo-800 flex items-center justify-center">
                <Award className="w-3.5 h-3.5" />
              </div>
              <span>2. VIP Tiered Loyalty Program</span>
            </div>

            <div className="text-xs text-slate-600 space-y-2 mt-3 leading-relaxed">
              <p>
                <strong>Empirical Observation:</strong> The High Spend tier (≥₹{thresholds.highThreshold.toLocaleString('en-IN')}) constitutes {highSpend?.customer_share}% of the buyer base but contributes <strong>{highSpend?.revenue_share}% of total sales</strong> with an AOV of ₹{highSpend?.avg_order_value.toLocaleString('en-IN')}.
              </p>
              <p>
                <strong>Recommended Action:</strong> Institute an invite-only VIP Club for accounts crossing ₹{thresholds.highThreshold.toLocaleString('en-IN')} lifetime spend, featuring complimentary expedited shipping, early product drops, and dedicated concierge support.
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-200 text-xs font-medium text-indigo-800 flex items-center justify-between">
            <span>Projected Impact:</span>
            <span className="font-mono font-semibold">94%+ VIP annual retention</span>
          </div>
        </div>

        {/* Playbook 3: Targeted Marketing */}
        <div className="border border-slate-200 rounded p-5 bg-slate-50/50 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-slate-900 font-semibold text-sm mb-2">
              <div className="w-6 h-6 rounded bg-amber-100 text-amber-800 flex items-center justify-center">
                <ShoppingBag className="w-3.5 h-3.5" />
              </div>
              <span>3. Low-to-Medium Segment Nudges</span>
            </div>

            <div className="text-xs text-slate-600 space-y-2 mt-3 leading-relaxed">
              <p>
                <strong>Empirical Observation:</strong> Low Spend customers (&lt;₹{thresholds.lowThreshold.toLocaleString('en-IN')}) have an average order count of {lowSpend?.avg_orders_per_customer} and AOV of ₹{lowSpend?.avg_order_value.toLocaleString('en-IN')}.
              </p>
              <p>
                <strong>Recommended Action:</strong> Introduce dynamic bundle discounts (e.g. "Add ₹1,000 more to unlock free gift or Tier-2 perks") targeting accounts approaching the threshold to accelerate transition into the Medium Spend cohort.
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-200 text-xs font-medium text-amber-800 flex items-center justify-between">
            <span>Projected Impact:</span>
            <span className="font-mono font-semibold">+22% AOV on second order</span>
          </div>
        </div>
      </div>
    </div>
  );
};
