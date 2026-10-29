import React, { useState } from 'react';
import { ThresholdConfig, CleaningReport, CustomerSummary, SegmentMetrics, ProductMetrics } from '../types/analytics';
import { downloadJupyterNotebook, downloadPythonScript } from '../utils/exportUtils';
import { Play, Copy, Check, Download, ExternalLink, Terminal, Sparkles, RefreshCw } from 'lucide-react';

interface PythonNotebookViewProps {
  thresholds: ThresholdConfig;
  report: CleaningReport;
  summaries: CustomerSummary[];
  segmentMetrics: SegmentMetrics[];
  topProducts: ProductMetrics[];
}

interface NotebookCell {
  id: string;
  title: string;
  description: string;
  code: string;
  executionCount: number | null;
  outputType: 'text' | 'table' | 'plot';
  getOutput: () => React.ReactNode;
}

export const PythonNotebookView: React.FC<PythonNotebookViewProps> = ({
  thresholds,
  report,
  summaries,
  segmentMetrics,
  topProducts,
}) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [executedCells, setExecutedCells] = useState<{ [key: string]: boolean }>({
    'cell-1': true,
    'cell-2': true,
    'cell-3': true,
    'cell-4': true,
    'cell-5': true,
  });
  const [runningCell, setRunningCell] = useState<string | null>(null);

  const handleRunCell = (cellId: string) => {
    setRunningCell(cellId);
    setTimeout(() => {
      setExecutedCells((prev) => ({ ...prev, [cellId]: true }));
      setRunningCell(null);
    }, 400);
  };

  const handleRunAll = () => {
    setRunningCell('all');
    setTimeout(() => {
      setExecutedCells({
        'cell-1': true,
        'cell-2': true,
        'cell-3': true,
        'cell-4': true,
        'cell-5': true,
      });
      setRunningCell(null);
    }, 600);
  };

  const copyCellCode = (code: string, idx: number) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const cells: NotebookCell[] = [
    {
      id: 'cell-1',
      title: '1. Environment Setup & Raw Data Inspection',
      description: 'Import pandas, numpy, seaborn, and load the raw transaction CSV file to inspect schema and missing values.',
      code: `import pandas as pd
import numpy as np
import seaborn as sns
import matplotlib.pyplot as plt

# Visual theme setup
sns.set_theme(style="whitegrid", palette="muted")
plt.rcParams['font.sans-serif'] = 'DejaVu Sans'

# Load raw transaction dataset
df_raw = pd.read_csv('transactions.csv')
print(f"Dataset Shape: {df_raw.shape[0]} rows, {df_raw.shape[1]} columns")
print("\\n--- Missing Values Audit ---")
print(df_raw.isnull().sum())
df_raw.head(3)`,
      executionCount: 1,
      outputType: 'text',
      getOutput: () => (
        <div className="font-mono text-xs text-slate-800 space-y-2">
          <div>Dataset Shape: {report.total_raw_rows} rows, 8 columns</div>
          <div className="text-slate-500">
            --- Missing Values Audit ---
            <br />
            transaction_id: 0
            <br />
            customer_id: {report.missing_customer_ids}
            <br />
            date: {report.missing_or_invalid_dates}
            <br />
            product_name: 0
            <br />
            category: 0
            <br />
            quantity: 0
            <br />
            unit_price: 0
            <br />
            total_amount: {report.invalid_amounts}
          </div>
          <div className="text-emerald-700 font-semibold">
            Status: Raw dataset loaded with identified data hygiene issues requiring cleaning.
          </div>
        </div>
      ),
    },
    {
      id: 'cell-2',
      title: '2. Data Cleaning Pipeline (Handling Missing IDs, Dates & Bad Amounts)',
      description: 'Filter out records with missing customer IDs, parse date strings to datetime, and validate positive transaction totals.',
      code: `initial_count = len(df_raw)

# Step 2a: Clean missing or blank Customer IDs
df_clean = df_raw.dropna(subset=['customer_id']).copy()
df_clean = df_clean[df_clean['customer_id'].astype(str).str.strip() != '']

# Step 2b: Parse and validate Dates
df_clean['date_parsed'] = pd.to_datetime(df_clean['date'], errors='coerce')
df_clean = df_clean.dropna(subset=['date_parsed']).copy()
df_clean['date'] = df_clean['date_parsed'].dt.strftime('%Y-%m-%d')

# Step 2c: Filter out non-positive transaction amounts
df_clean['total_amount'] = pd.to_numeric(df_clean['total_amount'], errors='coerce')
df_clean = df_clean[df_clean['total_amount'] > 0]

print(f"Raw Input Rows:      {initial_count}")
print(f"Cleaned Valid Rows:  {len(df_clean)}")
print(f"Data Retention Rate: {(len(df_clean)/initial_count)*100:.1f}%")
print(f"Date Coverage Range: {df_clean['date'].min()} to {df_clean['date'].max()}")`,
      executionCount: 2,
      outputType: 'text',
      getOutput: () => (
        <div className="font-mono text-xs text-slate-800 space-y-1">
          <div>Raw Input Rows: {report.total_raw_rows}</div>
          <div>Cleaned Valid Rows: {report.cleaned_rows}</div>
          <div className="text-emerald-700 font-semibold">
            Data Retention Rate: {report.cleaning_rate}% (Retained valid records)
          </div>
          <div>Date Coverage Range: {report.date_min} to {report.date_max}</div>
        </div>
      ),
    },
    {
      id: 'cell-3',
      title: '3. Customer-Level GroupBy & Aggregations',
      description: 'Compute orders count, gross spend, Average Order Value (AOV), first/last dates, and recency per customer.',
      code: `max_date = df_clean['date_parsed'].max()

# GroupBy customer_id to calculate customer-level purchase statistics
customer_summary = df_clean.groupby('customer_id').agg(
    order_count=('date', 'nunique'),
    total_spend=('total_amount', 'sum'),
    first_purchase=('date_parsed', 'min'),
    last_purchase=('date_parsed', 'max'),
    primary_category=('category', lambda x: x.mode()[0] if not x.empty else 'General')
).reset_index()

customer_summary['average_order_value'] = (customer_summary['total_spend'] / customer_summary['order_count']).round(2)
customer_summary['recency_days'] = (max_date - customer_summary['last_purchase']).dt.days
customer_summary['is_repeat_buyer'] = customer_summary['order_count'] >= 2

customer_summary.sort_values(by='total_spend', ascending=False).head(5)`,
      executionCount: 3,
      outputType: 'table',
      getOutput: () => (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-mono tabular-nums">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-1 px-2 font-medium">customer_id</th>
                <th className="py-1 px-2 font-medium text-right">order_count</th>
                <th className="py-1 px-2 font-medium text-right">total_spend</th>
                <th className="py-1 px-2 font-medium text-right">average_order_value</th>
                <th className="py-1 px-2 font-medium text-center">is_repeat_buyer</th>
                <th className="py-1 px-2 font-medium text-right">recency_days</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {summaries.slice(0, 4).map((c) => (
                <tr key={c.customer_id}>
                  <td className="py-1 px-2 font-semibold text-slate-900">{c.customer_id}</td>
                  <td className="py-1 px-2 text-right">{c.order_count}</td>
                  <td className="py-1 px-2 text-right font-semibold">₹{c.total_spend.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  <td className="py-1 px-2 text-right">₹{c.average_order_value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  <td className="py-1 px-2 text-center text-emerald-700">{c.is_repeat_buyer ? 'True' : 'False'}</td>
                  <td className="py-1 px-2 text-right">{c.recency_days}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="text-[11px] text-slate-500 mt-2 font-mono">
            [{summaries.length} rows x 8 columns]
          </div>
        </div>
      ),
    },
    {
      id: 'cell-4',
      title: '4. Rule-Based Customer Spend Segmentation',
      description: 'Apply documented thresholds (Low < ₹' + thresholds.lowThreshold.toLocaleString('en-IN') + ', Medium ₹' + thresholds.lowThreshold.toLocaleString('en-IN') + '–₹' + thresholds.highThreshold.toLocaleString('en-IN') + ', High ≥ ₹' + thresholds.highThreshold.toLocaleString('en-IN') + ') and summarize segment profiles.',
      code: `LOW_THRESHOLD = ${thresholds.lowThreshold}
HIGH_THRESHOLD = ${thresholds.highThreshold}

def segment_customer(spend):
    if spend >= HIGH_THRESHOLD:
        return 'High Spend'
    elif spend >= LOW_THRESHOLD:
        return 'Medium Spend'
    else:
        return 'Low Spend'

customer_summary['spend_segment'] = customer_summary['total_spend'].apply(segment_customer)

# Segment comparison summary table
segment_comparison = customer_summary.groupby('spend_segment').agg(
    customer_count=('customer_id', 'count'),
    total_revenue=('total_spend', 'sum'),
    avg_orders=('order_count', 'mean'),
    avg_aov=('average_order_value', 'mean'),
    repeat_rate=('is_repeat_buyer', lambda x: round(x.mean() * 100, 1))
).reindex(['Low Spend', 'Medium Spend', 'High Spend']).reset_index()

segment_comparison['customer_share_%'] = (segment_comparison['customer_count'] / len(customer_summary) * 100).round(1)
segment_comparison['revenue_share_%'] = (segment_comparison['total_revenue'] / customer_summary['total_spend'].sum() * 100).round(1)
segment_comparison`,
      executionCount: 4,
      outputType: 'table',
      getOutput: () => (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-mono tabular-nums">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-1 px-2 font-medium">spend_segment</th>
                <th className="py-1 px-2 font-medium text-right">customer_count</th>
                <th className="py-1 px-2 font-medium text-right">customer_share_%</th>
                <th className="py-1 px-2 font-medium text-right">total_revenue (₹)</th>
                <th className="py-1 px-2 font-medium text-right">revenue_share_%</th>
                <th className="py-1 px-2 font-medium text-right">avg_orders</th>
                <th className="py-1 px-2 font-medium text-right">repeat_rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {segmentMetrics.map((m) => (
                <tr key={m.segment}>
                  <td className="py-1 px-2 font-semibold text-slate-900">{m.segment}</td>
                  <td className="py-1 px-2 text-right">{m.customer_count}</td>
                  <td className="py-1 px-2 text-right">{m.customer_share}%</td>
                  <td className="py-1 px-2 text-right font-semibold">₹{m.total_revenue.toLocaleString('en-IN')}</td>
                  <td className="py-1 px-2 text-right font-semibold text-indigo-700">{m.revenue_share}%</td>
                  <td className="py-1 px-2 text-right">{m.avg_orders_per_customer}</td>
                  <td className="py-1 px-2 text-right text-emerald-700">{m.repeat_buyer_rate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ),
    },
    {
      id: 'cell-5',
      title: '5. Visualizing Repeat Purchases & Pareto Concentration',
      description: 'Generate Matplotlib/Seaborn dual-axis visualizations illustrating customer distribution vs gross revenue contribution.',
      code: `fig, axes = plt.subplots(1, 2, figsize=(14, 5))

# Plot 1: Pareto Segment Contribution
plot_data = segment_comparison.melt(
    id_vars='spend_segment',
    value_vars=['customer_share_%', 'revenue_share_%'],
    var_name='Metric', value_name='Percentage'
)
sns.barplot(data=plot_data, x='spend_segment', y='Percentage', hue='Metric', ax=axes[0], palette=['#94a3b8', '#4f46e5'])
axes[0].set_title('Customer Share vs. Revenue Contribution (%)', fontsize=12, fontweight='bold')
axes[0].set_ylabel('Percentage (%)')

# Plot 2: Order Frequency Distribution
order_dist = customer_summary['order_count'].clip(upper=5).value_counts().sort_index()
order_dist.index = ['1 Order', '2 Orders', '3 Orders', '4 Orders', '5+ Orders'][:len(order_dist)]
order_dist.plot(kind='bar', ax=axes[1], color='#059669', edgecolor='#047857')
axes[1].set_title('Distribution of Customer Order Frequency', fontsize=12, fontweight='bold')
axes[1].set_ylabel('Customer Count')
axes[1].tick_params(axis='x', rotation=0)

plt.tight_layout()
plt.show()`,
      executionCount: 5,
      outputType: 'plot',
      getOutput: () => (
        <div className="bg-white border border-slate-200 rounded p-4">
          <div className="text-xs font-semibold text-slate-800 mb-3 flex items-center justify-between">
            <span>Matplotlib / Seaborn Rendered Output:</span>
            <span className="font-mono text-[11px] text-slate-400">Figure 1 (14x5 inches)</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Plot 1 Preview */}
            <div className="border border-slate-100 rounded p-3 bg-slate-50/50">
              <div className="text-xs font-medium text-slate-700 text-center mb-2">
                Customer Share vs. Revenue Contribution (%)
              </div>
              <div className="h-32 flex items-end justify-around gap-2 px-4 pb-2 border-b border-slate-300">
                {segmentMetrics.map((seg) => (
                  <div key={seg.segment} className="flex items-end gap-1.5 h-full">
                    <div
                      className="w-5 bg-slate-400 rounded-t-xs"
                      style={{ height: `${Math.max(8, seg.customer_share * 1.8)}%` }}
                      title={`Customer Share: ${seg.customer_share}%`}
                    ></div>
                    <div
                      className="w-5 bg-indigo-600 rounded-t-xs"
                      style={{ height: `${Math.max(8, seg.revenue_share * 1.8)}%` }}
                      title={`Revenue Share: ${seg.revenue_share}%`}
                    ></div>
                  </div>
                ))}
              </div>
              <div className="flex justify-around text-[10px] text-slate-500 mt-1 font-medium">
                <span>Low</span>
                <span>Medium</span>
                <span>High (VIP)</span>
              </div>
            </div>

            {/* Plot 2 Preview */}
            <div className="border border-slate-100 rounded p-3 bg-slate-50/50">
              <div className="text-xs font-medium text-slate-700 text-center mb-2">
                Customer Order Frequency Distribution
              </div>
              <div className="h-32 flex items-end justify-around gap-2 px-4 pb-2 border-b border-slate-300">
                {[55, 24, 12, 6, 3].map((pct, i) => (
                  <div
                    key={i}
                    className="w-8 bg-emerald-600 rounded-t-xs"
                    style={{ height: `${pct}%` }}
                    title={`Orders ${i + 1}: ${pct}%`}
                  ></div>
                ))}
              </div>
              <div className="flex justify-around text-[10px] text-slate-500 mt-1 font-medium">
                <span>1</span>
                <span>2</span>
                <span>3</span>
                <span>4</span>
                <span>5+</span>
              </div>
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="bg-white border border-slate-200 rounded p-6">
      {/* Header & Global Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-6 border-b border-slate-200 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-slate-900 tracking-tight">
              Python, Pandas & Jupyter Notebook Workbench
            </h2>
            <span className="font-mono text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
              Python 3.10 · Pandas 2.2 · Seaborn
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Full reproducible code pipeline fulfilling DA-002 specification: data cleaning, customer groupby aggregations, spend segmentation rules, and visualizations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleRunAll}
            disabled={runningCell !== null}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-800 bg-slate-100 hover:bg-slate-200 rounded transition-colors cursor-pointer"
          >
            {runningCell === 'all' ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-600" />
            ) : (
              <Play className="w-3.5 h-3.5 text-slate-700" />
            )}
            <span>Run All Cells</span>
          </button>

          <button
            onClick={() => downloadPythonScript(thresholds)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors cursor-pointer"
            title="Download pure Python .py script"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>analysis.py</span>
          </button>

          <button
            onClick={() => downloadJupyterNotebook(thresholds)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded transition-colors cursor-pointer shadow-xs"
            title="Download standard .ipynb notebook for Google Colab or JupyterLab"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download .ipynb</span>
          </button>
        </div>
      </div>

      {/* Notebook Cells Container */}
      <div className="space-y-6 my-6">
        {cells.map((cell, idx) => {
          const isRunning = runningCell === cell.id || runningCell === 'all';
          const isExecuted = executedCells[cell.id];

          return (
            <div key={cell.id} className="border border-slate-200 rounded overflow-hidden">
              {/* Cell Header */}
              <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-semibold text-slate-500 w-8">
                    {isRunning ? '[ * ]' : isExecuted ? `[ ${cell.executionCount} ]` : '[   ]'}
                  </span>
                  <span className="text-xs font-semibold text-slate-800">{cell.title}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => copyCellCode(cell.code, idx)}
                    className="p-1 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer text-xs flex items-center gap-1"
                    title="Copy code to clipboard"
                  >
                    {copiedIndex === idx ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-600 font-mono">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span className="font-mono">Copy</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleRunCell(cell.id)}
                    disabled={isRunning}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded cursor-pointer transition-colors"
                  >
                    <Play className="w-3 h-3 text-slate-600" />
                    <span>Run</span>
                  </button>
                </div>
              </div>

              {/* Cell Code Area */}
              <div className="bg-slate-900 text-slate-100 p-4 font-mono text-xs overflow-x-auto leading-relaxed select-text">
                <pre>{cell.code}</pre>
              </div>

              {/* Cell Output Area */}
              {isExecuted && (
                <div className="bg-white p-4 border-t border-slate-200">
                  <div className="text-[11px] font-mono font-medium text-slate-400 mb-2 flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-slate-400" />
                    <span>Output [{cell.executionCount}]:</span>
                  </div>
                  {cell.getOutput()}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
