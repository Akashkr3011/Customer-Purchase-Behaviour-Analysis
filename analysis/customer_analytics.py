"""
Customer Analytics & Feature Engineering Module
Project ID: DA-002 (Customer Analytics)
Aggregates row-level transactions into customer-level summaries.
"""

from collections import defaultdict, Counter
from datetime import datetime
from typing import List, Dict, Any

def summarize_customers(
    transactions: List[Dict[str, Any]],
    low_threshold: float = 5000.0,
    high_threshold: float = 20000.0
) -> List[Dict[str, Any]]:
    """
    Computes customer-level summary:
    - Customer ID
    - Unique order count (using order_id)
    - Total spending
    - Average Order Value = Total Spend / Unique Orders
    - Total quantity purchased
    - First purchase date & Last purchase date
    - Days since last purchase (recency)
    - Number of unique products purchased
    - Repeat-purchase status (order_count >= 2)
    - Spend Segment ('Low Spend', 'Medium Spend', 'High Spend')
    """
    if not transactions:
        return []

    # Find maximum dataset date
    max_dt = max(t["datetime"] for t in transactions)

    cust_groups = defaultdict(list)
    for t in transactions:
        cust_groups[t["customer_id"]].append(t)

    summaries = []

    for cust_id, txns in cust_groups.items():
        txns.sort(key=lambda x: x["datetime"])

        order_ids = set()
        for t in txns:
            oid = t.get("order_id") or t["transaction_date"]
            order_ids.add(oid)

        unique_order_count = len(order_ids)
        total_spend = round(sum(t["amount"] for t in txns), 2)
        total_quantity = sum(t["quantity"] for t in txns)
        unique_prods = set(t["product_name"] for t in txns)

        first_date = txns[0]["transaction_date"]
        last_tx = txns[-1]
        last_date = last_tx["transaction_date"]
        recency_days = max(0, (max_dt - last_tx["datetime"]).days)

        aov = round(total_spend / max(1, unique_order_count), 2)
        is_repeat = unique_order_count >= 2

        # Spend segmentation
        if total_spend >= high_threshold:
            segment = "High Spend"
        elif total_spend >= low_threshold:
            segment = "Medium Spend"
        else:
            segment = "Low Spend"

        # Category and Product preferences
        cat_spend = defaultdict(float)
        prod_counts = Counter()
        for t in txns:
            cat_spend[t["category"]] += t["amount"]
            prod_counts[t["product_name"]] += t["quantity"]

        primary_cat = max(cat_spend.items(), key=lambda x: x[1])[0] if cat_spend else "General"
        top_product = prod_counts.most_common(1)[0][0] if prod_counts else "General Product"

        # Flag customers with high historical spend but inactive for a long period (>= 90 days)
        is_inactive_high_spender = (total_spend >= high_threshold) and (recency_days >= 90)

        summaries.append({
            "customer_id": cust_id,
            "order_count": unique_order_count,
            "total_spend": total_spend,
            "average_order_value": aov,
            "total_quantity": total_quantity,
            "unique_products_count": len(unique_prods),
            "first_purchase_date": first_date,
            "last_purchase_date": last_date,
            "recency_days": recency_days,
            "is_repeat_buyer": is_repeat,
            "spend_segment": segment,
            "primary_category": primary_cat,
            "top_product": top_product,
            "is_inactive_high_spender": is_inactive_high_spender
        })

    # Sort descending by total spend
    summaries.sort(key=lambda x: x["total_spend"], reverse=True)
    return summaries
