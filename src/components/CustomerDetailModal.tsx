import React from 'react';
import { CustomerSummary, CleanTransaction } from '../types/analytics';
import { X, Calendar, DollarSign, Package, ShoppingBag } from 'lucide-react';

interface CustomerDetailModalProps {
  customer: CustomerSummary | null;
  transactions: CleanTransaction[];
  onClose: () => void;
}

export const CustomerDetailModal: React.FC<CustomerDetailModalProps> = ({
  customer,
  transactions,
  onClose,
}) => {
  if (!customer) return null;

  const customerTxns = transactions.filter((t) => t.customer_id === customer.customer_id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white border border-slate-200 rounded-lg max-w-2xl w-full max-h-[85vh] flex flex-col shadow-xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-slate-900 font-mono">
                {customer.customer_id}
              </h3>
              <span className="text-xs px-2 py-0.5 rounded bg-slate-100 font-medium text-slate-700">
                {customer.spend_segment}
              </span>
              {customer.is_repeat_buyer && (
                <span className="text-xs px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-medium">
                  Repeat Buyer
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Customer Purchase History & Product Affinity Breakdown
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs">
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-50 p-3 rounded border border-slate-200">
              <span className="text-slate-500 block">Total Lifetime Spend</span>
              <span className="text-lg font-mono font-bold text-slate-900 tabular-nums">
                ₹{customer.total_spend.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="bg-slate-50 p-3 rounded border border-slate-200">
              <span className="text-slate-500 block">Total Orders</span>
              <span className="text-lg font-mono font-bold text-slate-900 tabular-nums">
                {customer.order_count}
              </span>
            </div>
            <div className="bg-slate-50 p-3 rounded border border-slate-200">
              <span className="text-slate-500 block">Avg Order Value</span>
              <span className="text-lg font-mono font-bold text-slate-900 tabular-nums">
                ₹{customer.average_order_value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="bg-slate-50 p-3 rounded border border-slate-200">
              <span className="text-slate-500 block">Recency (Last Active)</span>
              <span className="text-lg font-mono font-bold text-slate-900 tabular-nums">
                {customer.recency_days}d ago
              </span>
            </div>
          </div>

          {/* Dates & Categories */}
          <div className="border border-slate-200 rounded p-3 bg-slate-50/50 flex flex-wrap items-center justify-between gap-4 text-xs">
            <div>
              <span className="text-slate-500 block">First Purchase:</span>
              <span className="font-mono text-slate-800 font-medium">{customer.first_purchase_date}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Last Purchase:</span>
              <span className="font-mono text-slate-800 font-medium">{customer.last_purchase_date}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Primary Category:</span>
              <span className="text-slate-800 font-medium">{customer.primary_category}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Top Product:</span>
              <span className="text-slate-800 font-medium">{customer.top_product}</span>
            </div>
          </div>

          {/* Individual Transaction Lines */}
          <div className="space-y-2">
            <span className="font-semibold text-slate-800">
              Transaction Line Items ({customerTxns.length}):
            </span>
            <div className="border border-slate-200 rounded overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 border-b border-slate-200">
                    <th className="py-2 px-3">Date</th>
                    <th className="py-2 px-3">Transaction ID</th>
                    <th className="py-2 px-3">Product Name</th>
                    <th className="py-2 px-3">Category</th>
                    <th className="py-2 px-3 text-right">Qty</th>
                    <th className="py-2 px-3 text-right">Unit Price (₹)</th>
                    <th className="py-2 px-3 text-right">Total (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-slate-700">
                  {customerTxns.map((t) => (
                    <tr key={t.transaction_id} className="hover:bg-slate-50/50">
                      <td className="py-1.5 px-3">{t.date}</td>
                      <td className="py-1.5 px-3 text-slate-500">{t.transaction_id}</td>
                      <td className="py-1.5 px-3 font-sans font-medium text-slate-900">
                        {t.product_name}
                      </td>
                      <td className="py-1.5 px-3 font-sans text-slate-600">{t.category}</td>
                      <td className="py-1.5 px-3 text-right">{t.quantity}</td>
                      <td className="py-1.5 px-3 text-right">₹{t.unit_price.toLocaleString('en-IN')}</td>
                      <td className="py-1.5 px-3 text-right font-semibold text-slate-900">
                        ₹{t.total_amount.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded cursor-pointer transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
