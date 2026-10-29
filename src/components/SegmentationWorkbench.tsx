import React from 'react';
import { SegmentMetrics, ThresholdConfig } from '../types/analytics';
import { Sliders, HelpCircle, ArrowUpRight, Check } from 'lucide-react';

interface SegmentationWorkbenchProps {
  segmentMetrics: SegmentMetrics[];
  thresholds: ThresholdConfig;
  onUpdateThresholds: (newThresholds: ThresholdConfig) => void;
  onSelectSegmentFilter?: (segment: string) => void;
}

export const SegmentationWorkbench: React.FC<SegmentationWorkbenchProps> = ({
  segmentMetrics,
  thresholds,
  onUpdateThresholds,
  onSelectSegmentFilter,
}) => {
  const lowSeg = segmentMetrics.find((s) => s.segment === 'Low Spend');
  const medSeg = segmentMetrics.find((s) => s.segment === 'Medium Spend');
  const highSeg = segmentMetrics.find((s) => s.segment === 'High Spend');

  return (
    <div className="bg-white border border-slate-200 rounded p-6">
      {/* Header and Threshold Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 tracking-tight">
            Customer Spend Segmentation & Rule-Based Comparison
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Documented decision rule: Customers partitioned by total lifetime transaction volume into Low, Medium, and High (VIP) tiers.
          </p>
        </div>

        {/* Interactive Threshold Tuner */}
        <div className="flex flex-wrap items-center gap-4 bg-slate-50 p-2.5 rounded border border-slate-200 text-xs">
          <div className="flex items-center gap-1.5 font-medium text-slate-700">
            <Sliders className="w-3.5 h-3.5 text-slate-500" />
            <span>Documented Thresholds:</span>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-slate-600 font-medium">Low Cutoff:</label>
            <div className="flex items-center">
              <span className="text-slate-400 mr-1">₹</span>
              <input
                type="number"
                min="1000"
                max="25000"
                step="500"
                value={thresholds.lowThreshold}
                onChange={(e) =>
                  onUpdateThresholds({
                    ...thresholds,
                    lowThreshold: Math.max(500, Number(e.target.value)),
                  })
                }
                className="w-20 px-2 py-1 bg-white border border-slate-300 rounded text-slate-800 font-mono text-xs focus:ring-1 focus:ring-slate-900 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-slate-600 font-medium">High (VIP) Cutoff:</label>
            <div className="flex items-center">
              <span className="text-slate-400 mr-1">₹</span>
              <input
                type="number"
                min="5000"
                max="100000"
                step="1000"
                value={thresholds.highThreshold}
                onChange={(e) =>
                  onUpdateThresholds({
                    ...thresholds,
                    highThreshold: Math.max(thresholds.lowThreshold + 1000, Number(e.target.value)),
                  })
                }
                className="w-20 px-2 py-1 bg-white border border-slate-300 rounded text-slate-800 font-mono text-xs focus:ring-1 focus:ring-slate-900 focus:outline-hidden"
              />
            </div>
          </div>

          <button
            onClick={() => onUpdateThresholds({ lowThreshold: 5000, highThreshold: 20000 })}
            className="text-xs text-slate-500 hover:text-slate-900 underline ml-1 cursor-pointer"
          >
            Reset Defaults
          </button>
        </div>
      </div>

      {/* Segment Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-6">
        {/* Low Spend Card */}
        <div className="border border-slate-200 rounded p-4 bg-slate-50/50 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-slate-800">Low Spend</div>
              <span className="text-xs font-mono text-slate-500">Spend &lt; ₹{thresholds.lowThreshold.toLocaleString('en-IN')}</span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">
                ₹{lowSeg?.total_revenue.toLocaleString('en-IN')}
              </span>
              <span className="text-xs text-slate-500 font-mono">
                ({lowSeg?.revenue_share}% of sales)
              </span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-200 grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-slate-500 block">Customers</span>
              <span className="font-mono font-medium text-slate-800">
                {lowSeg?.customer_count} ({lowSeg?.customer_share}%)
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Avg Orders</span>
              <span className="font-mono font-medium text-slate-800">
                {lowSeg?.avg_orders_per_customer}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Avg Order Value</span>
              <span className="font-mono font-medium text-slate-800">
                ₹{lowSeg?.avg_order_value.toLocaleString('en-IN')}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Repeat Rate</span>
              <span className="font-mono font-medium text-slate-800">
                {lowSeg?.repeat_buyer_rate}%
              </span>
            </div>
          </div>
        </div>

        {/* Medium Spend Card */}
        <div className="border border-slate-200 rounded p-4 bg-slate-50/50 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-slate-800">Medium Spend</div>
              <span className="text-xs font-mono text-slate-500">₹{thresholds.lowThreshold.toLocaleString('en-IN')} – ₹{thresholds.highThreshold.toLocaleString('en-IN')}</span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">
                ₹{medSeg?.total_revenue.toLocaleString('en-IN')}
              </span>
              <span className="text-xs text-slate-500 font-mono">
                ({medSeg?.revenue_share}% of sales)
              </span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-200 grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-slate-500 block">Customers</span>
              <span className="font-mono font-medium text-slate-800">
                {medSeg?.customer_count} ({medSeg?.customer_share}%)
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Avg Orders</span>
              <span className="font-mono font-medium text-slate-800">
                {medSeg?.avg_orders_per_customer}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Avg Order Value</span>
              <span className="font-mono font-medium text-slate-800">
                ₹{medSeg?.avg_order_value.toLocaleString('en-IN')}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Repeat Rate</span>
              <span className="font-mono font-medium text-slate-800">
                {medSeg?.repeat_buyer_rate}%
              </span>
            </div>
          </div>
        </div>

        {/* High Spend Card */}
        <div className="border border-indigo-200 bg-indigo-50/30 rounded p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-indigo-950">High Spend (VIP)</div>
              <span className="text-xs font-mono text-indigo-700">Spend &ge; ₹{thresholds.highThreshold.toLocaleString('en-IN')}</span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono tabular-nums text-indigo-950">
                ₹{highSeg?.total_revenue.toLocaleString('en-IN')}
              </span>
              <span className="text-xs text-indigo-700 font-mono font-semibold">
                ({highSeg?.revenue_share}% of sales)
              </span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-indigo-200 grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-slate-500 block">Customers</span>
              <span className="font-mono font-medium text-slate-800">
                {highSeg?.customer_count} ({highSeg?.customer_share}%)
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Avg Orders</span>
              <span className="font-mono font-medium text-slate-800">
                {highSeg?.avg_orders_per_customer}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Avg Order Value</span>
              <span className="font-mono font-medium text-slate-800">
                ₹{highSeg?.avg_order_value.toLocaleString('en-IN')}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Repeat Rate</span>
              <span className="font-mono font-medium text-emerald-700 font-semibold">
                {highSeg?.repeat_buyer_rate}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Pareto Comparison: Share of Customers vs Share of Revenue */}
      <div className="pt-2">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-900">
            Pareto Contribution: Customer Base Share vs. Revenue Share
          </h3>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-slate-600">
              <span className="w-3 h-3 bg-slate-300 rounded-xs inline-block"></span> Customer Share (%)
            </span>
            <span className="flex items-center gap-1.5 text-slate-600">
              <span className="w-3 h-3 bg-indigo-600 rounded-xs inline-block"></span> Revenue Share (%)
            </span>
          </div>
        </div>

        <div className="space-y-4 pt-1">
          {segmentMetrics.map((seg) => (
            <div key={seg.segment} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-slate-800">{seg.segment}</span>
                <span className="font-mono text-slate-500">
                  {seg.customer_share}% customers &rarr; {seg.revenue_share}% revenue
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {/* Customer Bar */}
                <div className="h-4 bg-slate-100 rounded-xs overflow-hidden flex items-center">
                  <div
                    className="h-full bg-slate-300 rounded-xs transition-all duration-300"
                    style={{ width: `${Math.max(4, seg.customer_share)}%` }}
                  ></div>
                </div>
                {/* Revenue Bar */}
                <div className="h-4 bg-slate-100 rounded-xs overflow-hidden flex items-center">
                  <div
                    className="h-full bg-indigo-600 rounded-xs transition-all duration-300"
                    style={{ width: `${Math.max(4, seg.revenue_share)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Formal Segment Comparison Table */}
      <div className="mt-8 overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500 bg-slate-50/70">
              <th className="py-2.5 px-3 font-medium">Customer Segment</th>
              <th className="py-2.5 px-3 font-medium">Threshold Rule</th>
              <th className="py-2.5 px-3 font-medium text-right">Customers</th>
              <th className="py-2.5 px-3 font-medium text-right">Customer Share</th>
              <th className="py-2.5 px-3 font-medium text-right">Gross Spend (₹)</th>
              <th className="py-2.5 px-3 font-medium text-right">Revenue Share</th>
              <th className="py-2.5 px-3 font-medium text-right">Avg Frequency</th>
              <th className="py-2.5 px-3 font-medium text-right">AOV (₹)</th>
              <th className="py-2.5 px-3 font-medium text-right">Repeat Rate</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-mono tabular-nums text-slate-700">
            {segmentMetrics.map((m) => (
              <tr key={m.segment} className="hover:bg-slate-50/50 transition-colors">
                <td className="py-2.5 px-3 font-sans font-medium text-slate-900">{m.segment}</td>
                <td className="py-2.5 px-3 font-sans text-slate-500">
                  {m.segment === 'Low Spend' && `< ₹${thresholds.lowThreshold.toLocaleString('en-IN')}`}
                  {m.segment === 'Medium Spend' && `₹${thresholds.lowThreshold.toLocaleString('en-IN')} – ₹${thresholds.highThreshold.toLocaleString('en-IN')}`}
                  {m.segment === 'High Spend' && `≥ ₹${thresholds.highThreshold.toLocaleString('en-IN')}`}
                </td>
                <td className="py-2.5 px-3 text-right">{m.customer_count}</td>
                <td className="py-2.5 px-3 text-right">{m.customer_share}%</td>
                <td className="py-2.5 px-3 text-right font-semibold text-slate-900">
                  ₹{m.total_revenue.toLocaleString('en-IN')}
                </td>
                <td className="py-2.5 px-3 text-right font-semibold text-indigo-700">
                  {m.revenue_share}%
                </td>
                <td className="py-2.5 px-3 text-right">{m.avg_orders_per_customer}</td>
                <td className="py-2.5 px-3 text-right">₹{m.avg_order_value.toLocaleString('en-IN')}</td>
                <td className="py-2.5 px-3 text-right text-emerald-700">{m.repeat_buyer_rate}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
