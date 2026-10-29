import React from 'react';
import { CleaningReport, RawTransaction } from '../types/analytics';
import { X, CheckCircle2, AlertTriangle, FileCode, Check } from 'lucide-react';

interface DataCleaningModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: CleaningReport;
  droppedRows: { reason: string; item: RawTransaction }[];
}

export const DataCleaningModal: React.FC<DataCleaningModalProps> = ({
  isOpen,
  onClose,
  report,
  droppedRows,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white border border-slate-200 rounded-lg max-w-3xl w-full max-h-[85vh] flex flex-col shadow-xl">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Data Cleaning & Pipeline Audit (DA-002)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Handling missing Customer IDs, unparseable dates, and verifying transaction integrity.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs">
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-50 p-3 rounded border border-slate-200">
              <span className="text-slate-500 block">Total Raw Rows</span>
              <span className="text-lg font-mono font-bold text-slate-900 tabular-nums">
                {report.total_raw_rows}
              </span>
            </div>
            <div className="bg-slate-50 p-3 rounded border border-slate-200">
              <span className="text-slate-500 block">Missing Customer IDs</span>
              <span className="text-lg font-mono font-bold text-rose-600 tabular-nums">
                {report.missing_customer_ids}
              </span>
            </div>
            <div className="bg-slate-50 p-3 rounded border border-slate-200">
              <span className="text-slate-500 block">Invalid Dates</span>
              <span className="text-lg font-mono font-bold text-rose-600 tabular-nums">
                {report.missing_or_invalid_dates}
              </span>
            </div>
            <div className="bg-emerald-50/50 p-3 rounded border border-emerald-200">
              <span className="text-emerald-700 block font-medium">Valid Cleaned Rows</span>
              <span className="text-lg font-mono font-bold text-emerald-800 tabular-nums">
                {report.cleaned_rows} ({report.cleaning_rate}%)
              </span>
            </div>
          </div>

          {/* Python Pandas Pipeline Code */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                <FileCode className="w-3.5 h-3.5 text-slate-600" />
                <span>Equivalent Pandas Cleaning Logic:</span>
              </span>
              <span className="font-mono text-[11px] text-slate-400">clean_pipeline.py</span>
            </div>
            <div className="bg-slate-900 text-slate-100 p-3 rounded font-mono text-[11px] leading-relaxed overflow-x-auto">
              <pre>{`# 1. Clean missing customer IDs
df_clean = df_raw.dropna(subset=['customer_id']).copy()
df_clean = df_clean[df_clean['customer_id'].astype(str).str.strip() != '']

# 2. Parse and validate dates
df_clean['date'] = pd.to_datetime(df_clean['date'], errors='coerce')
df_clean = df_clean.dropna(subset=['date']).copy()

# 3. Filter invalid amounts
df_clean['total_amount'] = pd.to_numeric(df_clean['total_amount'], errors='coerce')
df_clean = df_clean[df_clean['total_amount'] > 0]`}</pre>
            </div>
          </div>

          {/* Sample Dropped Records Audit */}
          <div className="space-y-2">
            <span className="font-semibold text-slate-800">
              Sample Excluded Records Audit Log (First {Math.min(droppedRows.length, 6)} items):
            </span>
            <div className="border border-slate-200 rounded overflow-hidden">
              <table className="w-full text-left border-collapse text-[11px]">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 border-b border-slate-200">
                    <th className="py-2 px-3">Transaction ID</th>
                    <th className="py-2 px-3">Customer ID</th>
                    <th className="py-2 px-3">Date</th>
                    <th className="py-2 px-3">Amount</th>
                    <th className="py-2 px-3">Exclusion Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-slate-700">
                  {droppedRows.slice(0, 8).map((d, i) => (
                    <tr key={i} className="hover:bg-slate-50/50">
                      <td className="py-1.5 px-3">{d.item.transaction_id || 'N/A'}</td>
                      <td className="py-1.5 px-3 text-rose-600">
                        {d.item.customer_id === null || d.item.customer_id === undefined
                          ? 'NULL (missing)'
                          : d.item.customer_id || 'EMPTY'}
                      </td>
                      <td className="py-1.5 px-3 text-rose-600">
                        {d.item.date === null || d.item.date === undefined
                          ? 'NULL'
                          : String(d.item.date)}
                      </td>
                      <td className="py-1.5 px-3">
                        {d.item.total_amount !== undefined && d.item.total_amount !== null
                          ? `₹${d.item.total_amount}`
                          : 'N/A'}
                      </td>
                      <td className="py-1.5 px-3 font-sans text-rose-700 font-medium">
                        {d.reason}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded cursor-pointer transition-colors"
          >
            Close Audit
          </button>
        </div>
      </div>
    </div>
  );
};
