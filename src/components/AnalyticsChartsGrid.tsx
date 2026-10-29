import React, { useMemo } from 'react';
import { CustomerSummary, SegmentMetrics, ProductMetrics, MonthlyRevenueTrend, SpendDistributionBucket, OrderDistribution } from '../types/analytics';
import { TrendingUp, Award, Layers, PieChart, BarChart3, Repeat, ShoppingCart, IndianRupee } from 'lucide-react';

interface AnalyticsChartsGridProps {
  monthlyTrends: MonthlyRevenueTrend[];
  productMetrics: ProductMetrics[];
  segmentMetrics: SegmentMetrics[];
  summaries: CustomerSummary[];
  repeatRate: number;
  repeatBuyerCount: number;
  oneTimeBuyerCount: number;
  repeatRevenue: number;
  oneTimeRevenue: number;
  orderDistribution: OrderDistribution[];
  spendDistribution: SpendDistributionBucket[];
}

export const AnalyticsChartsGrid: React.FC<AnalyticsChartsGridProps> = ({
  monthlyTrends,
  productMetrics,
  segmentMetrics,
  summaries,
  repeatRate,
  repeatBuyerCount,
  oneTimeBuyerCount,
  repeatRevenue,
  oneTimeRevenue,
  orderDistribution,
  spendDistribution,
}) => {
  // Top 10 by revenue
  const top10Revenue = useMemo(() => {
    return [...productMetrics].sort((a, b) => b.total_revenue - a.total_revenue).slice(0, 10);
  }, [productMetrics]);

  // Top 10 by quantity
  const top10Quantity = useMemo(() => {
    return [...productMetrics].sort((a, b) => b.units_sold - a.units_sold).slice(0, 10);
  }, [productMetrics]);

  const maxMonthlyRevenue = useMemo(() => {
    return Math.max(...monthlyTrends.map((m) => m.revenue), 1000);
  }, [monthlyTrends]);

  const maxTopRev = useMemo(() => {
    return Math.max(...top10Revenue.map((p) => p.total_revenue), 1000);
  }, [top10Revenue]);

  const maxTopQty = useMemo(() => {
    return Math.max(...top10Quantity.map((p) => p.units_sold), 10);
  }, [top10Quantity]);

  const maxSegmentRev = useMemo(() => {
    return Math.max(...segmentMetrics.map((s) => s.total_revenue), 1000);
  }, [segmentMetrics]);

  const totalCust = summaries.length || 1;
  const totalRev = repeatRevenue + oneTimeRevenue || 1;

  const maxFreqCust = useMemo(() => {
    return Math.max(...orderDistribution.map((o) => o.customer_count), 1);
  }, [orderDistribution]);

  const maxSpendCust = useMemo(() => {
    return Math.max(...spendDistribution.map((s) => s.count), 1);
  }, [spendDistribution]);

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <span>Core Analytical Visualizations (8 Charts)</span>
          </h2>
          <p className="text-xs text-slate-500">
            Real-time charts calculated directly from cleaned transaction records in Indian Rupees (₹).
          </p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-md">
          {summaries.length} Customers • ₹{(totalRev).toLocaleString('en-IN', { maximumFractionDigits: 0 })} Revenue
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CHART 1: Monthly Revenue Trend */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                <span>1. Revenue by Month</span>
              </h3>
              <span className="text-[11px] font-mono text-slate-400">Monthly Trajectory</span>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Sales performance over recorded monthly periods in ₹ (Thousands).
            </p>
          </div>

          <div className="h-48 flex items-end gap-2 pt-6 pb-2 border-b border-slate-100">
            {monthlyTrends.length === 0 ? (
              <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">
                No monthly transactions recorded
              </div>
            ) : (
              monthlyTrends.map((m) => {
                const heightPct = Math.max(12, (m.revenue / maxMonthlyRevenue) * 100);
                return (
                  <div key={m.month} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                    <div className="text-[10px] font-mono text-slate-500 mb-1 group-hover:text-blue-600 font-semibold transition-colors">
                      ₹{Math.round(m.revenue / 1000)}k
                    </div>
                    <div
                      style={{ height: `${heightPct}%` }}
                      className="w-full bg-gradient-to-t from-blue-600 to-indigo-500 rounded-t-md group-hover:from-blue-700 group-hover:to-indigo-600 transition-all shadow-xs"
                      title={`${m.month}: ₹${m.revenue.toLocaleString('en-IN')} (${m.orders} orders)`}
                    ></div>
                    <span className="text-[10px] text-slate-500 mt-2 truncate w-full text-center font-medium">
                      {m.month.slice(5)}/{m.month.slice(2, 4)}
                    </span>
                  </div>
                );
              })
            )}
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 mt-3 pt-2">
            <span>Peak Month: ₹{Math.round(maxMonthlyRevenue / 1000)}k</span>
            <span className="font-mono">Total Months: {monthlyTrends.length}</span>
          </div>
        </div>

        {/* CHART 2: Top 10 Products by Revenue */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-emerald-600" />
                <span>2. Top 10 Products by Revenue (₹)</span>
              </h3>
              <span className="text-[11px] font-mono text-slate-400">Ranked by Value</span>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              Hero sales contributors generating the highest gross revenue in ₹.
            </p>
          </div>

          <div className="space-y-2 overflow-y-auto max-h-56 pr-1">
            {top10Revenue.map((p, idx) => {
              const widthPct = Math.max(8, (p.total_revenue / maxTopRev) * 100);
              return (
                <div key={p.product_name} className="space-y-0.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-medium text-slate-800 truncate max-w-[200px]" title={p.product_name}>
                      <span className="text-slate-400 font-mono mr-1.5">{idx + 1}.</span>
                      {p.product_name}
                    </span>
                    <span className="font-mono font-bold text-slate-900">
                      ₹{p.total_revenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${widthPct}%` }}
                      className="bg-emerald-500 h-full rounded-full transition-all"
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="text-[11px] text-slate-500 mt-3 pt-2 border-t border-slate-100 flex justify-between">
            <span>Rank 1: {top10Revenue[0]?.product_name ?? 'N/A'}</span>
            <span className="font-semibold text-emerald-700">₹{(top10Revenue[0]?.total_revenue ?? 0).toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* CHART 3: Top 10 Products by Quantity */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <ShoppingCart className="w-4 h-4 text-blue-600" />
                <span>3. Top 10 Products by Quantity Sold</span>
              </h3>
              <span className="text-[11px] font-mono text-slate-400">Ranked by Volume</span>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              Fastest-moving items and volume drivers across all fulfilled orders.
            </p>
          </div>

          <div className="space-y-2 overflow-y-auto max-h-56 pr-1">
            {top10Quantity.map((p, idx) => {
              const widthPct = Math.max(8, (p.units_sold / maxTopQty) * 100);
              return (
                <div key={p.product_name} className="space-y-0.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-medium text-slate-800 truncate max-w-[200px]" title={p.product_name}>
                      <span className="text-slate-400 font-mono mr-1.5">{idx + 1}.</span>
                      {p.product_name}
                    </span>
                    <span className="font-mono font-bold text-blue-700">
                      {p.units_sold} units
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${widthPct}%` }}
                      className="bg-blue-500 h-full rounded-full transition-all"
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="text-[11px] text-slate-500 mt-3 pt-2 border-t border-slate-100 flex justify-between">
            <span>Highest Volume: {top10Quantity[0]?.product_name ?? 'N/A'}</span>
            <span className="font-semibold text-blue-700">{top10Quantity[0]?.units_sold ?? 0} units</span>
          </div>
        </div>

        {/* CHART 4: Revenue by Customer Segment */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <IndianRupee className="w-4 h-4 text-emerald-600" />
                <span>4. Revenue by Customer Segment</span>
              </h3>
              <span className="text-[11px] font-mono text-slate-400">Segment Revenue Share</span>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              Distribution of revenue across Low, Medium, and High spending tiers in ₹.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            {segmentMetrics.map((seg) => {
              const widthPct = Math.max(6, (seg.total_revenue / maxSegmentRev) * 100);
              const color =
                seg.segment === 'High Spend'
                  ? 'bg-emerald-500 text-emerald-700'
                  : seg.segment === 'Medium Spend'
                  ? 'bg-blue-500 text-blue-700'
                  : 'bg-slate-400 text-slate-600';

              return (
                <div key={seg.segment} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800">{seg.segment}</span>
                    <div className="flex items-center gap-2 font-mono">
                      <span className="font-bold text-slate-900">
                        ₹{seg.total_revenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-500">
                        ({seg.revenue_share}%)
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${widthPct}%` }}
                      className={`h-full rounded-full transition-all ${
                        seg.segment === 'High Spend' ? 'bg-emerald-500' : seg.segment === 'Medium Spend' ? 'bg-blue-500' : 'bg-slate-400'
                      }`}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-[11px] mt-4 pt-3 border-t border-slate-100">
            {segmentMetrics.map((seg) => (
              <div key={seg.segment} className="p-1.5 bg-slate-50 rounded-lg">
                <div className="text-slate-400 text-[10px]">{seg.segment}</div>
                <div className="font-bold text-slate-800 font-mono">{seg.revenue_share}%</div>
              </div>
            ))}
          </div>
        </div>

        {/* CHART 5: Customers by Spending Segment */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <PieChart className="w-4 h-4 text-indigo-600" />
                <span>5. Customers by Spending Segment</span>
              </h3>
              <span className="text-[11px] font-mono text-slate-400">Customer Base Share</span>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              Proportion of total customer accounts falling into each spending tier.
            </p>
          </div>

          <div className="flex items-center justify-center py-4">
            <div className="w-full space-y-3">
              {segmentMetrics.map((seg) => {
                const pct = seg.customer_share;
                return (
                  <div key={seg.segment} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800 flex items-center gap-2">
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${
                            seg.segment === 'High Spend'
                              ? 'bg-emerald-500'
                              : seg.segment === 'Medium Spend'
                              ? 'bg-blue-500'
                              : 'bg-slate-400'
                          }`}
                        ></span>
                        {seg.segment}
                      </span>
                      <span className="font-mono font-bold text-slate-800">
                        {seg.customer_count} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${pct}%` }}
                        className={`h-full rounded-full transition-all ${
                          seg.segment === 'High Spend'
                            ? 'bg-emerald-500'
                            : seg.segment === 'Medium Spend'
                            ? 'bg-blue-500'
                            : 'bg-slate-400'
                        }`}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-100 flex justify-between">
            <span>Total Evaluated Customers:</span>
            <span className="font-bold text-slate-800 font-mono">{summaries.length}</span>
          </div>
        </div>

        {/* CHART 6: Repeat versus One-Time Buyers */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Repeat className="w-4 h-4 text-purple-600" />
                <span>6. Repeat vs One-Time Buyers</span>
              </h3>
              <span className="text-[11px] font-mono text-purple-700 font-bold">{repeatRate.toFixed(1)}% Repeat</span>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              Comparison of multi-order buyers (2+ orders) against single-order buyers.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="p-4 bg-purple-50/60 border border-purple-100 rounded-xl text-center">
              <div className="text-xs font-semibold text-purple-900 mb-1">Repeat Buyers (2+ Orders)</div>
              <div className="text-2xl font-bold font-mono text-purple-700">{repeatBuyerCount}</div>
              <div className="text-[11px] text-purple-600 mt-1 font-mono">{repeatRate.toFixed(1)}% of Customers</div>
              <div className="mt-3 pt-2 border-t border-purple-100 text-xs font-bold text-purple-900 font-mono">
                ₹{repeatRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </div>
              <div className="text-[10px] text-purple-500 font-medium">
                {((repeatRevenue / totalRev) * 100).toFixed(1)}% of Revenue
              </div>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center">
              <div className="text-xs font-semibold text-slate-700 mb-1">One-Time Buyers (1 Order)</div>
              <div className="text-2xl font-bold font-mono text-slate-700">{oneTimeBuyerCount}</div>
              <div className="text-[11px] text-slate-500 mt-1 font-mono">{(100 - repeatRate).toFixed(1)}% of Customers</div>
              <div className="mt-3 pt-2 border-t border-slate-200 text-xs font-bold text-slate-700 font-mono">
                ₹{oneTimeRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </div>
              <div className="text-[10px] text-slate-400 font-medium">
                {((oneTimeRevenue / totalRev) * 100).toFixed(1)}% of Revenue
              </div>
            </div>
          </div>

          <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-100 flex justify-between">
            <span>Repeat Revenue Multiplier:</span>
            <span className="font-bold text-purple-700">
              {oneTimeBuyerCount > 0 && repeatBuyerCount > 0
                ? `${((repeatRevenue / repeatBuyerCount) / (oneTimeRevenue / oneTimeBuyerCount)).toFixed(1)}x higher spend/buyer`
                : 'N/A'}
            </span>
          </div>
        </div>

        {/* CHART 7: Customer Spending Distribution */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-blue-600" />
                <span>7. Customer Spending Distribution</span>
              </h3>
              <span className="text-[11px] font-mono text-slate-400">Histogram Buckets</span>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Number of customers grouped by cumulative spend brackets in ₹.
            </p>
          </div>

          <div className="h-44 flex items-end gap-2 pt-4 pb-2 border-b border-slate-100">
            {spendDistribution.map((b) => {
              const heightPct = Math.max(10, (b.count / maxSpendCust) * 100);
              return (
                <div key={b.bucket} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                  <div className="text-[10px] font-mono text-slate-500 mb-1 group-hover:text-blue-600 font-semibold">
                    {b.count}
                  </div>
                  <div
                    style={{ height: `${heightPct}%` }}
                    className="w-full bg-indigo-500 rounded-t-md group-hover:bg-indigo-600 transition-all shadow-xs"
                    title={`${b.bucket}: ${b.count} customers (${b.percentage}%)`}
                  ></div>
                  <span className="text-[9px] text-slate-500 mt-2 truncate w-full text-center font-medium">
                    {b.bucket.replace(' to ', '-')}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="text-[11px] text-slate-500 mt-3 pt-2 flex justify-between">
            <span>Median Spend: ₹{(totalRev / totalCust).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
            <span className="font-mono">Buckets: {spendDistribution.length}</span>
          </div>
        </div>

        {/* CHART 8: Purchase Frequency Distribution */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-blue-600" />
                <span>8. Purchase Frequency Distribution</span>
              </h3>
              <span className="text-[11px] font-mono text-slate-400">Orders per Customer</span>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Customer distribution by discrete order count (1, 2, 3, 4, 5+ orders).
            </p>
          </div>

          <div className="h-44 flex items-end gap-3 pt-4 pb-2 border-b border-slate-100">
            {orderDistribution.map((d) => {
              const heightPct = Math.max(10, (d.customer_count / maxFreqCust) * 100);
              return (
                <div key={d.order_count} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                  <div className="text-[10px] font-mono text-slate-500 mb-1 group-hover:text-sky-600 font-semibold">
                    {d.customer_count}
                  </div>
                  <div
                    style={{ height: `${heightPct}%` }}
                    className="w-full bg-sky-500 rounded-t-md group-hover:bg-sky-600 transition-all shadow-xs"
                    title={`${d.order_count} Orders: ${d.customer_count} customers (${d.percentage.toFixed(1)}%)`}
                  ></div>
                  <span className="text-[10px] text-slate-600 mt-2 font-mono font-medium">
                    {d.order_count === 5 ? '5+ ord' : `${d.order_count} ord`}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="text-[11px] text-slate-500 mt-3 pt-2 flex justify-between">
            <span>1-Order Share: {(orderDistribution.find((o) => o.order_count === 1)?.percentage ?? 0).toFixed(1)}%</span>
            <span className="font-semibold text-sky-700">
              Multi-Order Share: {(100 - (orderDistribution.find((o) => o.order_count === 1)?.percentage ?? 0)).toFixed(1)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
