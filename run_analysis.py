#!/usr/bin/env python3
"""
DA-002: Customer Purchase Behaviour Analysis - End-to-End Analysis Pipeline
Executes data ingestion, hygiene cleaning, customer groupby aggregations,
spend segmentation, repeat-purchase cadence, and CSV exports.
"""

import os
import csv
import random
from datetime import datetime, timedelta
from analysis.data_cleaning import clean_transactions
from analysis.customer_analytics import summarize_customers
from analysis.segmentation import compare_segments, summarize_products, analyze_repeat_purchases
from analysis.visualizations import generate_svg_bar_chart

DATA_DIR = "data"
OUTPUT_DIR = "data"
VIS_DIR = "visualizations"

def generate_synthetic_transactions(filepath: str, num_customers: int = 250, seed: int = 42):
    """
    Generates a realistic, clearly labelled synthetic retail transaction dataset with intentional
    edge cases (missing IDs, bad dates, duplicate transactions) for data hygiene validation.
    """
    random.seed(seed)
    products = [
        {"name": "Merino Wool Crewneck", "category": "Apparel", "price": 2499.0},
        {"name": "Selvedge Slim Denim", "category": "Apparel", "price": 3499.0},
        {"name": "Supima Cotton Tee (3-Pack)", "category": "Apparel", "price": 1299.0},
        {"name": "Water-Resistant Commuter Jacket", "category": "Outerwear", "price": 5999.0},
        {"name": "Insulated Winter Parka", "category": "Outerwear", "price": 8999.0},
        {"name": "Full-Grain Leather Chelsea Boots", "category": "Footwear", "price": 6499.0},
        {"name": "Breathable Knit Everyday Runners", "category": "Footwear", "price": 3999.0},
        {"name": "Minimalist Canvas Tote", "category": "Accessories", "price": 999.0},
        {"name": "Italian Leather Bifold Wallet", "category": "Accessories", "price": 1899.0},
        {"name": "Recycled Wool Beanie", "category": "Accessories", "price": 899.0},
        {"name": "Polarized Sunglasses", "category": "Accessories", "price": 2999.0},
        {"name": "Aerodynamic Duffle Bag", "category": "Luggage", "price": 4499.0},
    ]

    start_date = datetime(2025, 1, 15)
    rows = []
    txn_id_counter = 10001
    order_id_counter = 50001

    for c_idx in range(1, num_customers + 1):
        cust_id = f"CUST-{1000 + c_idx}"
        # Pareto distribution: 20% high order count (4-9 orders), 30% medium (2-3 orders), 50% single order
        roll = random.random()
        if roll > 0.8:
            orders_count = random.randint(4, 8)
        elif roll > 0.5:
            orders_count = random.randint(2, 3)
        else:
            orders_count = 1

        curr_time = start_date + timedelta(days=random.randint(0, 180))

        for o in range(orders_count):
            order_id = f"ORD-{order_id_counter}"
            order_id_counter += 1
            if o > 0:
                curr_time += timedelta(days=random.randint(12, 45))

            items_in_order = random.randint(1, 3)
            for _ in range(items_in_order):
                prod = random.choice(products)
                qty = 2 if random.random() > 0.8 else 1
                amount = round(prod["price"] * qty, 2)

                rows.append({
                    "transaction_id": f"TXN-{txn_id_counter}",
                    "order_id": order_id,
                    "customer_id": cust_id,
                    "transaction_date": curr_time.strftime("%Y-%m-%d"),
                    "product_name": prod["name"],
                    "category": prod["category"],
                    "quantity": qty,
                    "unit_price": prod["price"],
                    "amount": amount
                })
                txn_id_counter += 1

    # Inject intentional hygiene test anomalies:
    # 1. Missing customer IDs (~25 rows)
    for _ in range(25):
        idx = random.randint(0, len(rows) - 1)
        rows[idx]["customer_id"] = ""

    # 2. Corrupt / invalid dates (~15 rows)
    for _ in range(15):
        idx = random.randint(0, len(rows) - 1)
        rows[idx]["transaction_date"] = "INVALID_DATE"

    # 3. Missing amount with valid qty & unit price (~18 rows) -> should be calculated
    for _ in range(18):
        idx = random.randint(0, len(rows) - 1)
        rows[idx]["amount"] = ""

    # 4. Duplicate rows (~12 rows)
    for _ in range(12):
        src_idx = random.randint(0, len(rows) - 1)
        rows.append(dict(rows[src_idx]))

    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    fieldnames = ["transaction_id", "order_id", "customer_id", "transaction_date", "product_name", "category", "quantity", "unit_price", "amount"]
    with open(filepath, "w", newline="", encoding="utf-8") as f:
        # Document dataset clearly as synthetic demonstration data
        f.write("# DATASET NOTICE: Clearly labelled synthetic sample dataset generated for DA-002 Customer Analytics demonstration.\n")
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    print(f"Generated synthetic demonstration dataset with {len(rows)} rows at: {filepath}")

def load_transactions(filepath: str):
    rows = []
    with open(filepath, "r", encoding="utf-8", errors="replace") as f:
        lines = [line for line in f if not line.startswith("#")]
        reader = csv.DictReader(lines)
        for r in reader:
            rows.append(r)
    return rows

def save_csv(filepath: str, data: list, fieldnames: list):
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    with open(filepath, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(data)
    print(f"Saved: {filepath} ({len(data)} rows)")

def main():
    print("=" * 65)
    print("CUSTOMER PURCHASE BEHAVIOUR ANALYSIS (DA-002) - PYTHON PIPELINE")
    print("=" * 65)

    tx_file = os.path.join(DATA_DIR, "transactions.csv")
    if not os.path.exists(tx_file):
        print(f"No existing {tx_file} found. Creating clearly labelled synthetic sample dataset...")
        generate_synthetic_transactions(tx_file)

    raw_data = load_transactions(tx_file)
    print(f"\n[1] Loaded Raw Transactions: {len(raw_data)} records")

    # Step 2: Data Cleaning
    print("\n[2] Executing Data Hygiene Pipeline...")
    cleaned, report, dropped = clean_transactions(raw_data)
    print(f"    - Cleaned Valid Rows:      {report['cleaned_rows']}")
    print(f"    - Missing Customer IDs:    {report['missing_customer_ids']}")
    print(f"    - Invalid Dates:           {report['missing_or_invalid_dates']}")
    print(f"    - Duplicate Rows Dropped:  {report['duplicate_rows']}")
    print(f"    - Calculated Amounts:      {report['calculated_amounts']}")
    print(f"    - Data Retention Rate:     {report['retention_rate_pct']}%")
    print(f"    - Date Span:               {report['min_date']} to {report['max_date']}")

    # Step 3: Customer-Level Aggregations
    print("\n[3] Calculating Customer-Level Aggregations & Metrics...")
    LOW_THRESHOLD = 5000.0
    HIGH_THRESHOLD = 20000.0
    customer_summaries = summarize_customers(cleaned, low_threshold=LOW_THRESHOLD, high_threshold=HIGH_THRESHOLD)
    print(f"    - Total Unique Customers:  {len(customer_summaries)}")

    total_revenue = sum(c["total_spend"] for c in customer_summaries)
    total_orders = sum(c["order_count"] for c in customer_summaries)
    aov_overall = round(total_revenue / max(1, total_orders), 2)
    print(f"    - Total Gross Spend:       ₹{total_revenue:,.2f}")
    print(f"    - Total Orders:            {total_orders:,}")
    print(f"    - Average Order Value:     ₹{aov_overall:,.2f}")

    # Step 4: Spend Segmentation
    print("\n[4] Segmenting Customers (Low < ₹5k, Med ₹5k-₹20k, High ≥ ₹20k)...")
    segments = compare_segments(customer_summaries)
    for s in segments:
        print(f"    [{s['spend_segment']}] {s['customer_count']} cust ({s['customer_share_pct']}%) -> ₹{s['total_revenue']:,.2f} ({s['revenue_share_pct']}% rev) | AOV: ₹{s['average_order_value']:,.2f} | Repeat: {s['repeat_buyer_rate_pct']}%")

    # Step 5: Product Performance
    print("\n[5] Analyzing Product Catalog Performance...")
    products = summarize_products(cleaned)
    print("    Top 5 Products by Revenue:")
    for p in products[:5]:
        print(f"    - {p['product_name']} ({p['category']}): ₹{p['total_revenue']:,.2f} | {p['units_sold']} units | {p['unique_buyers']} buyers | Repeat Rate: {p['repeat_purchase_rate_pct']}%")

    # Step 6: Repeat Purchase Analysis
    print("\n[6] Evaluating Repeat Purchase Dynamics...")
    repeat_stats = analyze_repeat_purchases(customer_summaries, cleaned)
    print(f"    - Repeat Buyer Rate:       {repeat_stats['repeat_rate_pct']}% ({repeat_stats['repeat_customers']} customers)")
    print(f"    - Repeat Revenue Share:    {repeat_stats['repeat_revenue_share_pct']}% (₹{repeat_stats['repeat_revenue']:,.2f})")
    print(f"    - Avg Interval to 2nd Order: {repeat_stats['avg_days_between_orders']} days")

    # Save Output CSVs
    print("\n[7] Exporting Summary CSVs...")
    cust_fields = ["customer_id", "order_count", "total_spend", "average_order_value", "total_quantity", "unique_products_count", "first_purchase_date", "last_purchase_date", "recency_days", "is_repeat_buyer", "spend_segment", "primary_category", "top_product", "is_inactive_high_spender"]
    save_csv(os.path.join(OUTPUT_DIR, "customer_summary.csv"), customer_summaries, cust_fields)

    seg_fields = ["spend_segment", "customer_count", "customer_share_pct", "total_revenue", "revenue_share_pct", "avg_spend_per_customer", "avg_orders_per_customer", "average_order_value", "repeat_buyer_rate_pct"]
    save_csv(os.path.join(OUTPUT_DIR, "segment_summary.csv"), segments, seg_fields)

    prod_fields = ["product_name", "category", "units_sold", "total_revenue", "unique_buyers", "repeat_buyers", "repeat_purchase_rate_pct", "average_unit_price"]
    save_csv(os.path.join(OUTPUT_DIR, "product_summary.csv"), products, prod_fields)

    # Generate Chart Visualizations
    print("\n[8] Generating Chart Visualizations in visualizations/...")
    generate_svg_bar_chart(
        segments,
        x_key="spend_segment",
        y_key="total_revenue",
        title="Revenue by Customer Segment (₹ INR)",
        y_label="Gross Revenue (₹)",
        output_path=os.path.join(VIS_DIR, "revenue_by_segment.svg")
    )

    generate_svg_bar_chart(
        products[:8],
        x_key="product_name",
        y_key="total_revenue",
        title="Top 8 Products by Revenue (₹ INR)",
        y_label="Total Revenue (₹)",
        output_path=os.path.join(VIS_DIR, "top_products_revenue.svg")
    )

    freq_data = [{"frequency": f"{k} Orders" if k < 5 else "5+ Orders", "count": v} for k, v in repeat_stats["frequency_distribution"].items()]
    generate_svg_bar_chart(
        freq_data,
        x_key="frequency",
        y_key="count",
        title="Customer Purchase Frequency Distribution",
        y_label="Number of Customers",
        output_path=os.path.join(VIS_DIR, "purchase_frequency.svg")
    )
    print("    Visual charts created successfully.")

    print("\n" + "=" * 65)
    print("ANALYSIS PIPELINE COMPLETED SUCCESSFULLY")
    print("=" * 65)

if __name__ == "__main__":
    main()
