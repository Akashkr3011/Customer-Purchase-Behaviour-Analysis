import React from 'react';
import { Filter, Calendar, Package, Tag, RotateCcw } from 'lucide-react';

interface InteractiveFilterBarProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (val: string) => void;
  onEndDateChange: (val: string) => void;
  selectedProduct: string;
  onProductChange: (val: string) => void;
  availableProducts: string[];
  selectedSegment: string;
  onSegmentChange: (val: string) => void;
  onResetFilters: () => void;
  totalFilteredTransactions: number;
  totalRawTransactions: number;
}

export const InteractiveFilterBar: React.FC<InteractiveFilterBarProps> = ({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  selectedProduct,
  onProductChange,
  availableProducts,
  selectedSegment,
  onSegmentChange,
  onResetFilters,
  totalFilteredTransactions,
  totalRawTransactions,
}) => {
  const isFiltered =
    Boolean(startDate) ||
    Boolean(endDate) ||
    selectedProduct !== 'all' ||
    selectedSegment !== 'all';

  return (
    <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Title and Badge */}
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
            <Filter className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900 tracking-tight">Interactive Filters</span>
              {isFiltered && (
                <span className="text-[10px] font-semibold px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full">
                  Filters Active
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500">
              Showing {totalFilteredTransactions} of {totalRawTransactions} transactions
            </p>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Date Range: Start */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="text-[11px] text-slate-500 font-medium">From:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => onStartDateChange(e.target.value)}
              className="bg-transparent text-slate-800 text-xs focus:outline-hidden font-mono"
            />
          </div>

          {/* Date Range: End */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="text-[11px] text-slate-500 font-medium">To:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => onEndDateChange(e.target.value)}
              className="bg-transparent text-slate-800 text-xs focus:outline-hidden font-mono"
            />
          </div>

          {/* Product Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs">
            <Package className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={selectedProduct}
              onChange={(e) => onProductChange(e.target.value)}
              className="bg-transparent text-slate-800 text-xs focus:outline-hidden max-w-[140px] truncate cursor-pointer font-medium"
            >
              <option value="all">All Products</option>
              {availableProducts.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/* Customer Segment Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs">
            <Tag className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={selectedSegment}
              onChange={(e) => onSegmentChange(e.target.value)}
              className="bg-transparent text-slate-800 text-xs focus:outline-hidden cursor-pointer font-medium"
            >
              <option value="all">All Segments</option>
              <option value="High Spend">High Spend (≥₹20k)</option>
              <option value="Medium Spend">Medium Spend (₹5k–₹20k)</option>
              <option value="Low Spend">Low Spend (&lt;₹5k)</option>
            </select>
          </div>

          {/* Reset button */}
          {isFiltered && (
            <button
              onClick={onResetFilters}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
