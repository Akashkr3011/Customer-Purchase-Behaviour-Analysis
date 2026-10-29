import React, { useState } from 'react';
import { ProductMetrics } from '../types/analytics';
import { exportCsv } from '../utils/exportUtils';
import { Download, TrendingUp, Layers } from 'lucide-react';

interface PopularProductsSectionProps {
  products: ProductMetrics[];
}

export const PopularProductsSection: React.FC<PopularProductsSectionProps> = ({ products }) => {
  const [metricMode, setMetricMode] = useState<'revenue' | 'units'>('revenue');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = Array.from(new Set(products.map((p) => p.category)));

  const filtered = products
    .filter((p) => selectedCategory === 'all' || p.category === selectedCategory)
    .sort((a, b) => (metricMode === 'revenue' ? b.total_revenue - a.total_revenue : b.units_sold - a.units_sold));

  const top10 = filtered.slice(0, 10);
  const maxVal = metricMode === 'revenue'
    ? Math.max(...top10.map((p) => p.total_revenue), 1)
    : Math.max(...top10.map((p) => p.units_sold), 1);

  return (
    <div className="bg-white border border-slate-200 rounded p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200 gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 tracking-tight">
            Popular Products & Category Purchase Affinity
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Identify hero catalog items driving initial acquisition volume and subsequent repeat repurchases.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-slate-900"
          >
            <option value="all">All Categories ({products.length} products)</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {/* Metric Mode Toggle */}
          <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded border border-slate-200">
            <button
              onClick={() => setMetricMode('revenue')}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap cursor-pointer ${
                metricMode === 'revenue'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              By Revenue (₹)
            </button>
            <button
              onClick={() => setMetricMode('units')}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap cursor-pointer ${
                metricMode === 'units'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              By Units Sold
            </button>
          </div>

          <button
            onClick={() => exportCsv('popular_products_analysis.csv', products)}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors cursor-pointer"
            title="Download CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Visual Chart: Top 10 Horizontal Bar Ranking */}
      <div className="my-6">
        <h3 className="text-sm font-semibold text-slate-900 mb-4">
          Top Products Rank: {metricMode === 'revenue' ? 'Gross Revenue (₹)' : 'Total Units Sold'}
        </h3>

        <div className="space-y-3">
          {top10.map((item, index) => {
            const currentVal = metricMode === 'revenue' ? item.total_revenue : item.units_sold;
            const barPct = (currentVal / maxVal) * 100;

            return (
              <div key={item.product_name} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 truncate max-w-md">
                    <span className="font-mono text-slate-400 w-5">{index + 1}.</span>
                    <span className="font-medium text-slate-800 truncate">{item.product_name}</span>
                    <span className="text-slate-400 font-normal">·</span>
                    <span className="text-slate-500">{item.category}</span>
                  </div>
                  <div className="font-mono text-slate-600 tabular-nums">
                    {metricMode === 'revenue' ? (
                      <>
                        <span className="font-semibold text-slate-900">₹{item.total_revenue.toLocaleString('en-IN')}</span>{' '}
                        <span className="text-slate-400">({item.units_sold} units)</span>
                      </>
                    ) : (
                      <>
                        <span className="font-semibold text-slate-900">{item.units_sold} units</span>{' '}
                        <span className="text-slate-400">(₹{item.total_revenue.toLocaleString('en-IN')})</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="h-3.5 bg-slate-100 rounded-xs overflow-hidden flex items-center">
                  <div
                    className="h-full bg-slate-800 rounded-xs transition-all duration-300"
                    style={{ width: `${Math.max(2, barPct)}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Comprehensive Product Metrics Table */}
      <div className="mt-8 overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500 bg-slate-50/70">
              <th className="py-2.5 px-3 font-medium">Rank & Product Name</th>
              <th className="py-2.5 px-3 font-medium">Category</th>
              <th className="py-2.5 px-3 font-medium text-right">Avg Unit Price (₹)</th>
              <th className="py-2.5 px-3 font-medium text-right">Units Sold</th>
              <th className="py-2.5 px-3 font-medium text-right">Gross Revenue (₹)</th>
              <th className="py-2.5 px-3 font-medium text-right">Unique Buyers</th>
              <th className="py-2.5 px-3 font-medium text-right">Repeat Buyers</th>
              <th className="py-2.5 px-3 font-medium text-right">Repeat Rate</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-mono tabular-nums text-slate-700">
            {products.map((p, idx) => (
              <tr key={p.product_name} className="hover:bg-slate-50/50 transition-colors">
                <td className="py-2 px-3 font-sans font-medium text-slate-900 flex items-center gap-2">
                  <span className="text-slate-400 font-mono w-5 text-right">{idx + 1}.</span>
                  <span>{p.product_name}</span>
                </td>
                <td className="py-2 px-3 font-sans text-slate-600">{p.category}</td>
                <td className="py-2 px-3 text-right">₹{p.avg_price.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</td>
                <td className="py-2 px-3 text-right">{p.units_sold.toLocaleString('en-IN')}</td>
                <td className="py-2 px-3 text-right font-semibold text-slate-900">
                  ₹{p.total_revenue.toLocaleString('en-IN')}
                </td>
                <td className="py-2 px-3 text-right">{p.unique_buyers}</td>
                <td className="py-2 px-3 text-right">{p.repeat_buyer_count}</td>
                <td className="py-2 px-3 text-right font-semibold text-emerald-700">
                  {p.repeat_rate}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
