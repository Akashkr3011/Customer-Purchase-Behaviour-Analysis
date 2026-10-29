import React, { useState, useMemo } from 'react';
import { CustomerSummary, SpendSegment } from '../types/analytics';
import { exportCsv } from '../utils/exportUtils';
import { Search, ArrowUpDown, Download, ChevronLeft, ChevronRight, Eye } from 'lucide-react';

interface CustomerSummaryTableProps {
  summaries: CustomerSummary[];
  onSelectCustomer: (customer: CustomerSummary) => void;
  activeSegmentFilter: string;
  setActiveSegmentFilter: (segment: string) => void;
}

export const CustomerSummaryTable: React.FC<CustomerSummaryTableProps> = ({
  summaries,
  onSelectCustomer,
  activeSegmentFilter,
  setActiveSegmentFilter,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [repeatFilter, setRepeatFilter] = useState<'all' | 'repeat' | 'single'>('all');
  const [sortField, setSortField] = useState<keyof CustomerSummary>('total_spend');
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 15;

  const handleSort = (field: keyof CustomerSummary) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false); // default descending for metrics
    }
  };

  const filtered = useMemo(() => {
    return summaries.filter((c) => {
      // Search term
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchesId = c.customer_id.toLowerCase().includes(term);
        const matchesCat = c.primary_category.toLowerCase().includes(term);
        const matchesProd = c.top_product.toLowerCase().includes(term);
        if (!matchesId && !matchesCat && !matchesProd) return false;
      }

      // Segment filter
      if (activeSegmentFilter !== 'all' && c.spend_segment !== activeSegmentFilter) {
        return false;
      }

      // Repeat filter
      if (repeatFilter === 'repeat' && !c.is_repeat_buyer) return false;
      if (repeatFilter === 'single' && c.is_repeat_buyer) return false;

      return true;
    });
  }, [summaries, searchTerm, activeSegmentFilter, repeatFilter]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];

      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortAsc ? valA - valB : valB - valA;
      }
      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      if (typeof valA === 'boolean' && typeof valB === 'boolean') {
        return sortAsc ? (valA === valB ? 0 : valA ? 1 : -1) : valA === valB ? 0 : valA ? -1 : 1;
      }
      return 0;
    });
  }, [filtered, sortField, sortAsc]);

  const totalPages = Math.ceil(sorted.length / pageSize) || 1;
  const paginated = sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleExport = () => {
    const exportRows = sorted.map((c) => ({
      customer_id: c.customer_id,
      order_count: c.order_count,
      total_spend: c.total_spend,
      average_order_value: c.average_order_value,
      spend_segment: c.spend_segment,
      is_repeat_buyer: c.is_repeat_buyer ? 'Yes' : 'No',
      first_purchase_date: c.first_purchase_date,
      last_purchase_date: c.last_purchase_date,
      recency_days: c.recency_days,
      primary_category: c.primary_category,
      top_product: c.top_product,
    }));
    exportCsv('customer_level_summary_da002.csv', exportRows);
  };

  return (
    <div className="bg-white border border-slate-200 rounded p-6">
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-6 border-b border-slate-200 gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 tracking-tight">
            Customer-Level Aggregation & Summary Table
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Individual customer metrics derived via Pandas GroupBy aggregation ({sorted.length} matching customers).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search ID, category, item..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="text-xs pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-slate-900 w-48 sm:w-56"
            />
          </div>

          {/* Segment Filter */}
          <select
            value={activeSegmentFilter}
            onChange={(e) => {
              setActiveSegmentFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-slate-900"
          >
            <option value="all">All Segments</option>
            <option value="High Spend">High Spend (VIP)</option>
            <option value="Medium Spend">Medium Spend</option>
            <option value="Low Spend">Low Spend</option>
          </select>

          {/* Repeat Buyer Filter */}
          <select
            value={repeatFilter}
            onChange={(e) => {
              setRepeatFilter(e.target.value as 'all' | 'repeat' | 'single');
              setCurrentPage(1);
            }}
            className="text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-slate-900"
          >
            <option value="all">All Frequency Tiers</option>
            <option value="repeat">Repeat Buyers (2+ orders)</option>
            <option value="single">Single-Order (1-Time)</option>
          </select>

          {/* Export CSV Button */}
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors whitespace-nowrap cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export Table CSV</span>
          </button>
        </div>
      </div>

      {/* High-Density Data Grid */}
      <div className="overflow-x-auto my-4">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500 bg-slate-50/70">
              <th
                onClick={() => handleSort('customer_id')}
                className="py-2.5 px-3 font-medium cursor-pointer hover:text-slate-900"
              >
                <div className="flex items-center gap-1">
                  <span>Customer ID</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort('spend_segment')}
                className="py-2.5 px-3 font-medium cursor-pointer hover:text-slate-900"
              >
                <div className="flex items-center gap-1">
                  <span>Segment</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort('order_count')}
                className="py-2.5 px-3 font-medium text-right cursor-pointer hover:text-slate-900"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Orders</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort('total_spend')}
                className="py-2.5 px-3 font-medium text-right cursor-pointer hover:text-slate-900"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Total Spend (₹)</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort('average_order_value')}
                className="py-2.5 px-3 font-medium text-right cursor-pointer hover:text-slate-900"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>AOV (₹)</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort('is_repeat_buyer')}
                className="py-2.5 px-3 font-medium text-center cursor-pointer hover:text-slate-900"
              >
                <div className="flex items-center justify-center gap-1">
                  <span>Repeat?</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort('first_purchase_date')}
                className="py-2.5 px-3 font-medium cursor-pointer hover:text-slate-900"
              >
                <div className="flex items-center gap-1">
                  <span>First Order</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort('last_purchase_date')}
                className="py-2.5 px-3 font-medium cursor-pointer hover:text-slate-900"
              >
                <div className="flex items-center gap-1">
                  <span>Last Order</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort('recency_days')}
                className="py-2.5 px-3 font-medium text-right cursor-pointer hover:text-slate-900"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Recency</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-2.5 px-3 font-medium">Top Category</th>
              <th className="py-2.5 px-3 font-medium text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-mono tabular-nums text-slate-700">
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={11} className="py-8 text-center text-slate-500 font-sans">
                  No customers matched the current filter criteria.
                </td>
              </tr>
            ) : (
              paginated.map((c) => (
                <tr
                  key={c.customer_id}
                  onClick={() => onSelectCustomer(c)}
                  className="hover:bg-slate-50/80 cursor-pointer transition-colors group"
                >
                  <td className="py-2 px-3 font-semibold text-slate-900 group-hover:text-blue-600">
                    {c.customer_id}
                  </td>
                  <td className="py-2 px-3 font-sans">
                    <span
                      className={`inline-block text-[11px] font-medium ${
                        c.spend_segment === 'High Spend'
                          ? 'text-indigo-700 font-semibold'
                          : c.spend_segment === 'Medium Spend'
                          ? 'text-slate-800'
                          : 'text-slate-500'
                      }`}
                    >
                      {c.spend_segment}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-right">{c.order_count}</td>
                  <td className="py-2 px-3 text-right font-semibold text-slate-900">
                    ₹{c.total_spend.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="py-2 px-3 text-right">₹{c.average_order_value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td className="py-2 px-3 text-center font-sans">
                    {c.is_repeat_buyer ? (
                      <span className="text-emerald-700 font-medium">Yes</span>
                    ) : (
                      <span className="text-slate-400">No</span>
                    )}
                  </td>
                  <td className="py-2 px-3 text-slate-500">{c.first_purchase_date}</td>
                  <td className="py-2 px-3 text-slate-700">{c.last_purchase_date}</td>
                  <td className="py-2 px-3 text-right text-slate-600">{c.recency_days}d ago</td>
                  <td className="py-2 px-3 font-sans text-slate-700">{c.primary_category}</td>
                  <td className="py-2 px-3 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectCustomer(c);
                      }}
                      className="p-1 text-slate-400 hover:text-slate-900 rounded cursor-pointer"
                      title="Inspect Customer Transactions"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200 text-xs text-slate-500">
        <div>
          Showing {(currentPage - 1) * pageSize + 1} to{' '}
          {Math.min(currentPage * pageSize, sorted.length)} of {sorted.length} customers
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-1.5 border border-slate-200 rounded text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className="font-mono">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-1.5 border border-slate-200 rounded text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
