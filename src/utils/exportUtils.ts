import { CustomerSummary, CleanTransaction, ThresholdConfig } from '../types/analytics';

export function exportCsv(filename: string, rows: object[]) {
  if (!rows || rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const csvContent = [
    headers.join(','),
    ...rows.map((row) =>
      headers
        .map((header) => {
          const val = (row as Record<string, unknown>)[header];
          if (val === null || val === undefined) return '';
          const str = String(val).replace(/"/g, '""');
          return str.includes(',') || str.includes('\n') ? `"${str}"` : str;
        })
        .join(',')
    ),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function generatePythonScript(thresholds: ThresholdConfig): string {
  return `"""
Customer Purchase Behaviour Analysis (DA-002 Customer Analytics)
Exploratory Data Analysis, Cleaning, Aggregations, Spend Segmentation, and Visualizations.
Author: Data Analytics Engineering Team
"""

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns

# Set visual styling for charts
sns.set_theme(style="whitegrid", palette="muted")
plt.rcParams['font.sans-serif'] = 'DejaVu Sans'
plt.rcParams['axes.edgecolor'] = '#cbd5e1'
plt.rcParams['axes.linewidth'] = 0.8

print("=" * 60)
print("DA-002: CUSTOMER PURCHASE BEHAVIOUR ANALYSIS PIPELINE")
print("=" * 60)

# ==========================================
# 1. LOAD RAW TRANSACTION DATA
# ==========================================
# Reads customer transactions (Customer ID, Date, Product, Amount)
try:
    df_raw = pd.read_csv('transactions.csv')
    print(f"\\n[1] Loaded raw data: {df_raw.shape[0]} rows, {df_raw.shape[1]} columns")
except FileNotFoundError:
    print("No local transactions.csv found, generating sample test dataset...")
    df_raw = pd.DataFrame({
        'transaction_id': [f'TXN-{i}' for i in range(1001, 1021)],
        'customer_id': ['CUST-101', None, 'CUST-102', 'CUST-101', 'CUST-103', 'CUST-102', 'CUST-104', None, 'CUST-105', 'CUST-101'] * 2,
        'date': ['2025-02-14', '2025-02-15', 'INVALID', '2025-03-01', '2025-03-10', '2025-03-15', None, '2025-03-20', '2025-04-02', '2025-04-18'] * 2,
        'product_name': ['Merino Crewneck', 'Denim Jeans', 'Leather Boots', 'Canvas Tote', 'Winter Parka', 'Merino Crewneck', 'Everyday Runner', 'Beanie', 'Sunglasses', 'Leather Boots'] * 2,
        'category': ['Apparel', 'Apparel', 'Footwear', 'Accessories', 'Outerwear', 'Apparel', 'Footwear', 'Accessories', 'Accessories', 'Footwear'] * 2,
        'quantity': [1, 2, 1, 1, 1, 2, 1, 2, 1, 1] * 2,
        'unit_price': [88.0, 125.0, 210.0, 42.0, 320.0, 88.0, 135.0, 34.0, 110.0, 210.0] * 2,
        'total_amount': [88.0, 250.0, 210.0, 42.0, 320.0, 176.0, 135.0, 68.0, 110.0, 210.0] * 2
    })

print("Raw Dataset Columns:", df_raw.columns.tolist())
print("\\nMissing Values Summary:")
print(df_raw.isnull().sum())

# ==========================================
# 2. DATA CLEANING & VALIDATION
# ==========================================
print("\\n[2] Executing Data Cleaning Pipeline...")
initial_count = len(df_raw)

# Step 2a: Clean missing Customer IDs
df_clean = df_raw.dropna(subset=['customer_id']).copy()
df_clean = df_clean[df_clean['customer_id'].astype(str).str.strip() != '']
dropped_cust_ids = initial_count - len(df_clean)

# Step 2b: Parse and validate Dates
df_clean['date_parsed'] = pd.to_datetime(df_clean['date'], errors='coerce')
valid_dates_count = len(df_clean)
df_clean = df_clean.dropna(subset=['date_parsed']).copy()
df_clean['date'] = df_clean['date_parsed'].dt.strftime('%Y-%m-%d')
dropped_dates = valid_dates_count - len(df_clean)

# Step 2c: Validate Amount
df_clean['total_amount'] = pd.to_numeric(df_clean['total_amount'], errors='coerce')
df_clean = df_clean[df_clean['total_amount'] > 0]

print(f"Initial raw rows:        {initial_count}")
print(f"Dropped missing IDs:     {dropped_cust_ids}")
print(f"Dropped invalid dates:   {dropped_dates}")
print(f"Cleaned valid records:   {len(df_clean)} ({len(df_clean)/initial_count*100:.1f}% retained)")

# ==========================================
# 3. CUSTOMER-LEVEL GROUPBY & AGGREGATIONS
# ==========================================
print("\\n[3] Calculating Customer-level Aggregations...")
max_date = df_clean['date_parsed'].max()

customer_summary = df_clean.groupby('customer_id').agg(
    order_count=('date', 'nunique'),
    total_spend=('total_amount', 'sum'),
    first_purchase=('date_parsed', 'min'),
    last_purchase=('date_parsed', 'max'),
    primary_category=('category', lambda x: x.mode()[0] if not x.empty else 'Unknown')
).reset_index()

customer_summary['average_order_value'] = (customer_summary['total_spend'] / customer_summary['order_count']).round(2)
customer_summary['recency_days'] = (max_date - customer_summary['last_purchase']).dt.days
customer_summary['is_repeat_buyer'] = customer_summary['order_count'] >= 2

# ==========================================
# 4. RULE-BASED CUSTOMER SEGMENTATION
# ==========================================
print("\\n[4] Segmenting Customers with Documented Thresholds...")
LOW_THRESHOLD = ${thresholds.lowThreshold}
HIGH_THRESHOLD = ${thresholds.highThreshold}

def assign_spend_segment(spend):
    if spend >= HIGH_THRESHOLD:
        return 'High Spend'
    elif spend >= LOW_THRESHOLD:
        return 'Medium Spend'
    else:
        return 'Low Spend'

customer_summary['spend_segment'] = customer_summary['total_spend'].apply(assign_spend_segment)

# Segment comparison summary table
segment_comparison = customer_summary.groupby('spend_segment').agg(
    customer_count=('customer_id', 'count'),
    total_revenue=('total_spend', 'sum'),
    avg_orders_per_customer=('order_count', 'mean'),
    avg_spend_per_customer=('total_spend', 'mean'),
    avg_order_value=('average_order_value', 'mean'),
    repeat_rate=('is_repeat_buyer', lambda x: round(x.mean() * 100, 1))
).reindex(['Low Spend', 'Medium Spend', 'High Spend']).reset_index()

segment_comparison['customer_share_%'] = (segment_comparison['customer_count'] / customer_summary.shape[0] * 100).round(1)
segment_comparison['revenue_share_%'] = (segment_comparison['total_revenue'] / customer_summary['total_spend'].sum() * 100).round(1)

print("\\n--- SEGMENT COMPARISON SUMMARY ---")
print(segment_comparison.to_string(index=False))

# Repeat Buyer Analysis
repeat_rate_overall = customer_summary['is_repeat_buyer'].mean() * 100
repeat_rev_share = customer_summary[customer_summary['is_repeat_buyer']]['total_spend'].sum() / customer_summary['total_spend'].sum() * 100
print(f"\\nOverall Repeat Customer Rate: {repeat_rate_overall:.1f}%")
print(f"Repeat Customer Revenue Share: {repeat_rev_share:.1f}%")

# Popular Products Analysis
product_summary = df_clean.groupby(['product_name', 'category']).agg(
    units_sold=('quantity', 'sum'),
    total_revenue=('total_amount', 'sum'),
    unique_buyers=('customer_id', 'nunique')
).sort_values(by='total_revenue', ascending=False).reset_index()

print("\\n--- TOP 5 POPULAR PRODUCTS BY REVENUE ---")
print(product_summary.head(5).to_string(index=False))

# Export customer summary to CSV
customer_summary.to_csv('customer_summary_da002.csv', index=False)
print("\\nSaved 'customer_summary_da002.csv' successfully.")
`;
}

export function generateJupyterNotebookJSON(thresholds: ThresholdConfig): string {
  const notebook = {
    cells: [
      {
        cell_type: 'markdown',
        metadata: {},
        source: [
          '# Customer Purchase Behaviour Analysis (DA-002)\n',
          '**Customer Analytics & Purchase Pattern Exploration**\n',
          '\n',
          '### Project Objectives:\n',
          '1. **Explore Customer Transactions**: Identify what customers buy, how often they purchase, and which customer groups contribute most to gross sales.\n',
          '2. **Data Cleaning Pipeline**: Handle missing Customer IDs, remove or impute malformed dates, and validate transaction amounts.\n',
          '3. **Customer-Level Aggregations**: Calculate order frequency, total spend (in ₹ INR), Average Order Value (AOV), and recency.\n',
          '4. **Rule-Based Segmentation**: Classify customer groups into **Low Spend** (< ₹' + thresholds.lowThreshold.toLocaleString('en-IN') + '), **Medium Spend** (₹' + thresholds.lowThreshold.toLocaleString('en-IN') + '–₹' + thresholds.highThreshold.toLocaleString('en-IN') + '), and **High Spend** ($\\ge$ ₹' + thresholds.highThreshold.toLocaleString('en-IN') + ').\n',
          '5. **Repeat Purchase & Product Analysis**: Compare repeat buyers vs one-time buyers and identify top performing products for retention strategy.'
        ]
      },
      {
        cell_type: 'code',
        execution_count: 1,
        metadata: {},
        outputs: [],
        source: [
          'import pandas as pd\n',
          'import numpy as np\n',
          'import matplotlib.pyplot as plt\n',
          'import seaborn as sns\n',
          '\n',
          '# Visual styling configuration\n',
          'sns.set_theme(style="whitegrid", palette="muted")\n',
          'plt.rcParams["figure.figsize"] = (10, 5)\n',
          'plt.rcParams["font.sans-serif"] = "DejaVu Sans"\n',
          'print("Libraries loaded successfully.")'
        ]
      },
      {
        cell_type: 'markdown',
        metadata: {},
        source: [
          '## 1. Load & Inspect Raw Transaction Data\n',
          'Let us inspect the dataset schema, data types, and check for missing values across customer IDs, dates, and amounts.'
        ]
      },
      {
        cell_type: 'code',
        execution_count: 2,
        metadata: {},
        outputs: [],
        source: [
          '# Load CSV dataset\n',
          'df = pd.read_csv("transactions.csv")\n',
          'print(f"Dataset Shape: {df.shape[0]} rows, {df.shape[1]} columns\\n")\n',
          'print("--- Missing Values Count ---")\n',
          'print(df.isnull().sum())\n',
          'df.head()'
        ]
      },
      {
        cell_type: 'markdown',
        metadata: {},
        source: [
          '## 2. Data Cleaning & Validation\n',
          '- Drop records where `customer_id` is missing (unattributable transactions).\n',
          '- Convert `date` to `datetime` format and drop invalid or unparseable timestamps.\n',
          '- Ensure `total_amount` is positive.'
        ]
      },
      {
        cell_type: 'code',
        execution_count: 3,
        metadata: {},
        outputs: [],
        source: [
          'initial_rows = len(df)\n',
          '\n',
          '# Drop missing customer IDs\n',
          'df_clean = df.dropna(subset=["customer_id"]).copy()\n',
          'df_clean = df_clean[df_clean["customer_id"].astype(str).str.strip() != ""]\n',
          '\n',
          '# Parse dates\n',
          'df_clean["date"] = pd.to_datetime(df_clean["date"], errors="coerce")\n',
          'df_clean = df_clean.dropna(subset=["date"]).copy()\n',
          '\n',
          '# Validate positive amounts\n',
          'df_clean["total_amount"] = pd.to_numeric(df_clean["total_amount"], errors="coerce")\n',
          'df_clean = df_clean[df_clean["total_amount"] > 0]\n',
          '\n',
          'print(f"Raw rows: {initial_rows} -> Cleaned rows: {len(df_clean)}")\n',
          'print(f"Data retention rate: {(len(df_clean)/initial_rows)*100:.2f}%")'
        ]
      },
      {
        cell_type: 'markdown',
        metadata: {},
        source: [
          '## 3. Customer-Level Summary Table (GroupBy & Aggregations)\n',
          'We compute order frequency, total spend, AOV, first purchase date, and recency for every unique customer.'
        ]
      },
      {
        cell_type: 'code',
        execution_count: 4,
        metadata: {},
        outputs: [],
        source: [
          'max_dataset_date = df_clean["date"].max()\n',
          '\n',
          'customer_summary = df_clean.groupby("customer_id").agg(\n',
          '    order_count=("date", "nunique"),\n',
          '    total_spend=("total_amount", "sum"),\n',
          '    first_purchase=("date", "min"),\n',
          '    last_purchase=("date", "max"),\n',
          '    primary_category=("category", lambda x: x.mode()[0] if not x.empty else "General")\n',
          ').reset_index()\n',
          '\n',
          'customer_summary["average_order_value"] = (customer_summary["total_spend"] / customer_summary["order_count"]).round(2)\n',
          'customer_summary["recency_days"] = (max_dataset_date - customer_summary["last_purchase"]).dt.days\n',
          'customer_summary["is_repeat_buyer"] = customer_summary["order_count"] >= 2\n',
          '\n',
          'customer_summary.head(10)'
        ]
      },
      {
        cell_type: 'markdown',
        metadata: {},
        source: [
          '## 4. Rule-Based Customer Segmentation\n',
          'We classify customers using documented spend thresholds:\n',
          '- **Low Spend**: Spend < ₹' + thresholds.lowThreshold.toLocaleString('en-IN') + '\n',
          '- **Medium Spend**: Spend between ₹' + thresholds.lowThreshold.toLocaleString('en-IN') + ' and ₹' + thresholds.highThreshold.toLocaleString('en-IN') + '\n',
          '- **High Spend**: Spend $\\ge$ ₹' + thresholds.highThreshold.toLocaleString('en-IN') + ' (VIP Spenders)'
        ]
      },
      {
        cell_type: 'code',
        execution_count: 5,
        metadata: {},
        outputs: [],
        source: [
          'LOW_THRESHOLD = ' + thresholds.lowThreshold + '\n',
          'HIGH_THRESHOLD = ' + thresholds.highThreshold + '\n',
          '\n',
          'def assign_segment(spend):\n',
          '    if spend >= HIGH_THRESHOLD:\n',
          '        return "High Spend"\n',
          '    elif spend >= LOW_THRESHOLD:\n',
          '        return "Medium Spend"\n',
          '    else:\n',
          '        return "Low Spend"\n',
          '\n',
          'customer_summary["spend_segment"] = customer_summary["total_spend"].apply(assign_segment)\n',
          '\n',
          '# Compare Segments\n',
          'segment_comparison = customer_summary.groupby("spend_segment").agg(\n',
          '    customer_count=("customer_id", "count"),\n',
          '    total_revenue=("total_spend", "sum"),\n',
          '    avg_orders=("order_count", "mean"),\n',
          '    avg_spend=("total_spend", "mean"),\n',
          '    avg_aov=("average_order_value", "mean"),\n',
          '    repeat_rate_pct=("is_repeat_buyer", lambda x: round(x.mean() * 100, 1))\n',
          ').reindex(["Low Spend", "Medium Spend", "High Spend"]).reset_index()\n',
          '\n',
          'segment_comparison["customer_share_pct"] = (segment_comparison["customer_count"] / len(customer_summary) * 100).round(1)\n',
          'segment_comparison["revenue_share_pct"] = (segment_comparison["total_revenue"] / customer_summary["total_spend"].sum() * 100).round(1)\n',
          'segment_comparison'
        ]
      },
      {
        cell_type: 'markdown',
        metadata: {},
        source: [
          '## 5. Visualizations & Purchase Patterns\n',
          'Visualizing Pareto revenue concentration, repeat purchase distribution, and top-selling products.'
        ]
      },
      {
        cell_type: 'code',
        execution_count: 6,
        metadata: {},
        outputs: [],
        source: [
          'fig, axes = plt.subplots(1, 2, figsize=(14, 5))\n',
          '\n',
          '# Chart 1: Customer Share vs Revenue Share\n',
          'df_plot = segment_comparison.melt(id_vars="spend_segment", value_vars=["customer_share_pct", "revenue_share_pct"], var_name="Metric", value_name="Percentage")\n',
          'sns.barplot(data=df_plot, x="spend_segment", y="Percentage", hue="Metric", ax=axes[0], palette=["#94a3b8", "#3b82f6"])\n',
          'axes[0].set_title("Customer Share vs. Revenue Contribution", fontsize=13, fontweight="bold")\n',
          'axes[0].set_ylabel("Share (%)")\n',
          '\n',
          '# Chart 2: Order Frequency Distribution\n',
          'order_dist = customer_summary["order_count"].clip(upper=5).value_counts().sort_index()\n',
          'order_dist.index = ["1 Order", "2 Orders", "3 Orders", "4 Orders", "5+ Orders"][:len(order_dist)]\n',
          'order_dist.plot(kind="bar", ax=axes[1], color="#0ea5e9", edgecolor="#0284c7")\n',
          'axes[1].set_title("Distribution of Customer Order Frequency", fontsize=13, fontweight="bold")\n',
          'axes[1].set_ylabel("Number of Customers")\n',
          'axes[1].tick_params(axis="x", rotation=0)\n',
          '\n',
          'plt.tight_layout()\n',
          'plt.show()'
        ]
      },
      {
        cell_type: 'markdown',
        metadata: {},
        source: [
          '## 6. Popular Products Analysis\n',
          'Determine the top products by gross revenue, units sold, and repeat buyer rate.'
        ]
      },
      {
        cell_type: 'code',
        execution_count: 7,
        metadata: {},
        outputs: [],
        source: [
          'product_summary = df_clean.groupby(["product_name", "category"]).agg(\n',
          '    units_sold=("quantity", "sum"),\n',
          '    total_revenue=("total_amount", "sum"),\n',
          '    unique_buyers=("customer_id", "nunique")\n',
          ').sort_values(by="total_revenue", ascending=False).reset_index()\n',
          '\n',
          'plt.figure(figsize=(10, 4.5))\n',
          'sns.barplot(data=product_summary.head(8), x="total_revenue", y="product_name", color="#2563eb")\n',
          'plt.title("Top 8 Products by Gross Revenue (₹)", fontsize=13, fontweight="bold")\n',
          'plt.xlabel("Total Sales Revenue (₹)")\n',
          'plt.ylabel("")\n',
          'plt.show()\n',
          '\n',
          'product_summary.head(10)'
        ]
      }
    ],
    metadata: {
      kernelspec: {
        display_name: 'Python 3 (ipykernel)',
        language: 'python',
        name: 'python3'
      },
      language_info: {
        codemirror_mode: {
          name: 'ipython',
          version: 3
        },
        file_extension: '.py',
        mimetype: 'text/x-python',
        name: 'python',
        nbformat: 4,
        nbformat_minor: 2
      }
    },
    nbformat: 4,
    nbformat_minor: 2
  };

  return JSON.stringify(notebook, null, 2);
}

export function downloadJupyterNotebook(thresholds: ThresholdConfig) {
  const json = generateJupyterNotebookJSON(thresholds);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'Customer_Purchase_Behaviour_DA002.ipynb';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadPythonScript(thresholds: ThresholdConfig) {
  const code = generatePythonScript(thresholds);
  const blob = new Blob([code], { type: 'text/x-python' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'customer_analytics_da002.py';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
