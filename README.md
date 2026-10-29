# Customer Purchase Behaviour Analysis (DA-002)
## Category: Customer Analytics | Currency: Indian Rupees (₹)

A comprehensive, production-grade Customer Analytics solution that analyzes transactional records to discover purchasing patterns, customer spending segments, product performance, repeat-purchase cadence, and evidence-grounded retention strategies.

Built with Python (Pandas, NumPy, Matplotlib, Seaborn) for robust analytical computing and a modern, interactive React + TypeScript + Tailwind CSS web dashboard with multi-format data ingestion (CSV and Excel `.xlsx`).

---

## 1. Project Objectives
1. **Understand Customer Purchasing**: Identify what products customers purchase, order frequencies, and spending distributions.
2. **Order-Aware Aggregations**: Accurately group items by `order_id` rather than assuming each transaction row is a separate order.
3. **Rule-Based Customer Segmentation**: Categorize customers into documented, configurable spending tiers in Indian Rupees:
   - **Low Spend**: Below ₹5,000
   - **Medium Spend**: ₹5,000 to below ₹20,000
   - **High Spend**: ₹20,000 or above
4. **Repeat Purchase & Cadence Modeling**: Quantify one-time vs. repeat buyer rates, revenue contribution, and average days between consecutive orders.
5. **Data Hygiene & Auditing**: Handle corrupt dates, deduplicate transactions, validate quantities/prices, compute missing amounts only when valid inputs exist (`quantity × unit_price`), and generate transparent cleaning audit logs.
6. **Evidence-Grounded Recommendations**: Provide actionable retention, cross-selling, and loyalty initiatives backed by concrete calculations.

---

## 2. Directory Structure

```
├── analysis/
│   ├── data_cleaning.py        # Raw data validation, deduplication, date parsing, missing amount calculation
│   ├── customer_analytics.py   # Order grouping, spend, AOV, recency, repeat flag, inactive high-spenders
│   ├── segmentation.py         # Spending tier classification, segment metrics, top products, order cadence
│   └── visualizations.py       # Matplotlib / SVG chart generators for segment and product trends
├── data/
│   ├── transactions.csv        # Clean labeled synthetic demonstration dataset (1,100+ transactions)
│   ├── customer_summary.csv    # Generated customer-level aggregation table
│   ├── segment_summary.csv     # Generated segment-level comparison summary
│   └── product_summary.csv     # Generated product performance summary
├── notebooks/
│   └── customer_purchase_analysis.ipynb # Complete 15-section Jupyter / Colab analysis notebook
├── visualizations/             # Generated standalone chart images
│   ├── segment_revenue.svg
│   ├── top_products_revenue.svg
│   └── purchase_frequency.svg
├── src/
│   ├── components/             # React dashboard components, charts, tables, filter bars, modals
│   ├── data/                   # Preset demonstration datasets (Retail, SaaS, Electronics)
│   ├── types/                  # TypeScript data interfaces for transactions, segments, metrics
│   ├── utils/                  # TypeScript data cleaning and analytical mirror calculations
│   ├── App.tsx                 # Main dashboard application with sidebar navigation and view modes
│   └── main.tsx                # React root entry point
├── test_customer_analysis.py   # Automated unit test suite (4 suites, verifying calculations & thresholds)
├── run_analysis.py             # End-to-end Python pipeline execution script
├── requirements.txt            # Python dependencies (pandas, numpy, matplotlib, seaborn, openpyxl, etc.)
└── package.json                # Node.js dependencies (React 19, Tailwind CSS, Lucide icons, SheetJS xlsx)
```

---

## 3. Python Analysis Execution

### Running the Python Analytics Pipeline
To run data cleaning, compute customer metrics, export summaries to CSV, and render visual charts:
```bash
python3 run_analysis.py
```
This generates:
- `data/customer_summary.csv`
- `data/segment_summary.csv`
- `data/product_summary.csv`
- `visualizations/segment_revenue.svg`
- `visualizations/top_products_revenue.svg`
- `visualizations/purchase_frequency.svg`

### Running the Automated Unit Test Suite
To execute the unit tests verifying spending thresholds, order deduplication, AOV calculation, missing data handling, and repeat classification:
```bash
python3 test_customer_analysis.py
```
All tests use Python's built-in `unittest` module and execute instantly without external dependencies.

---

## 4. Running the Jupyter Notebook

### In Google Colab
1. Open [Google Colab](https://colab.research.google.com).
2. Choose **Upload** and upload `notebooks/customer_purchase_analysis.ipynb`.
3. Upload `data/transactions.csv` into the Colab session files (or run with synthetic data).
4. Run all cells sequentially.

### Locally with JupyterLab or VS Code
```bash
pip install -r requirements.txt
jupyter lab notebooks/customer_purchase_analysis.ipynb
```

The notebook contains 15 comprehensive sections:
1. Title and Objective
2. Library Imports
3. Data Loading (CSV and Excel options)
4. Data Cleaning and Hygiene Pipeline
5. Data-Quality Report Output
6. Customer Aggregation (unique order counting via `order_id`, spend, AOV, first/last purchase, days since last, total qty, unique products)
7. Demonstrative Spending Segmentation
8. Segment Comparison & Metrics Table
9. Product-Level Analytics (Top 10 by revenue and quantity, unique buyers)
10. Repeat-Purchase Analysis and Cadence
11. Matplotlib & Seaborn Visualizations (8 charts)
12. Customer-Level Summary Table & Inactive High-Spender Detection
13. Evidence-Grounded Business Recommendations
14. Methodological Limitations
15. Summary of Findings

---

## 5. Web Application Features

The React application delivers a responsive dashboard:
- **Navigation Modes**: Sidebar and header navigation across Overview, Spending Segmentation, Repeat Analysis, Popular Products, Customer Table, Python Notebook, and PPT Presentation Deck.
- **Interactive Multi-Filter Bar**:
  - Filter transactions by **Date Range** (Start Date to End Date).
  - Filter by **Product** (All or individual products).
  - Filter by **Customer Segment** (All, Low Spend, Medium Spend, High Spend).
- **8 Responsive Visualizations**:
  1. *Revenue by Month* (Monthly sales trajectory in ₹)
  2. *Top 10 Products by Revenue* (Ranked hero revenue drivers in ₹)
  3. *Top 10 Products by Quantity Sold* (High-velocity volume items)
  4. *Revenue by Customer Segment* (Bar breakdown of segment sales in ₹)
  5. *Customers by Spending Segment* (Customer count and percentage share)
  6. *Repeat vs. One-Time Buyers* (Buyer loyalty comparison and revenue distribution)
  7. *Customer Spending Distribution* (Binned spend distribution in ₹)
  8. *Purchase Frequency Distribution* (1, 2, 3, 4, 5+ orders per customer)
- **Customer Summary Table**:
  - Detailed metrics: Customer ID, Unique Orders, Total Spend (₹), AOV (₹), Total Quantity, Unique Products, First/Last Purchase Dates, Days Since Last Purchase, Repeat Status, and Inactive High-Spender indicator (≥₹20k spend with ≥90 days of inactivity).
  - Search, sortable columns, and pagination.
- **Data Ingestion**:
  - Upload custom **CSV** or Excel (**`.xlsx` / `.xls`**) files.
  - Automatic column matching for customer IDs, dates, quantities, prices, and amounts.
  - Transparent data-cleaning modal showing retained vs. dropped rows with exact error reasons.

---

## 6. Analytical Rules & Equations

### Order Counting and Average Order Value (AOV)
$$\text{Unique Orders} = \text{Count of distinct } \texttt{order\_id} \text{ for customer}$$
$$\text{Average Order Value (AOV)} = \frac{\sum \text{Customer Transaction Amount}}{\text{Unique Orders}}$$

### Repeat Buyer Definition
$$\text{Repeat Buyer} \iff \text{Unique Orders} \ge 2$$

### Demonstration Spending Thresholds (Indian Rupees)
- **Low Spend**: $\text{Total Spend} < ₹5,000$
- **Medium Spend**: $₹5,000 \le \text{Total Spend} < ₹20,000$
- **High Spend**: $\text{Total Spend} \ge ₹20,000$

*(These thresholds are configurable demonstration rules designed for business intuition, not absolute universal standards).*

### Inactive High-Spender Criterion
Identifies customers belonging to the **High Spend** tier whose last purchase date is $\ge 90\text{ days}$ prior to the analysis reference date. Note: This indicates extended inactivity, not guaranteed churn.

---

## 7. License & Compliance
Distributed under the Apache-2.0 License. All sample datasets are synthetic and designed exclusively for exploratory and demonstration purposes.
