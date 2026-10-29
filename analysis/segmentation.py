"""
Segmentation, Product Performance & Repeat Purchase Analysis
Project ID: DA-002 (Customer Analytics)
"""

from collections import defaultdict
from typing import List, Dict, Any

def compare_segments(customer_summaries: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Computes segment comparisons across Low Spend, Medium Spend, and High Spend tiers.
    """
    total_customers = max(1, len(customer_summaries))
    total_revenue_all = max(0.01, sum(c["total_spend"] for c in customer_summaries))

    segments = ["Low Spend", "Medium Spend", "High Spend"]
    results = []

    for seg in segments:
        matching = [c for c in customer_summaries if c["spend_segment"] == seg]
        count = len(matching)
        rev = round(sum(c["total_spend"] for c in matching), 2)
        total_orders = sum(c["order_count"] for c in matching)
        repeat_count = sum(1 for c in matching if c["is_repeat_buyer"])

        cust_share = round((count / total_customers) * 100, 2)
        rev_share = round((rev / total_revenue_all) * 100, 2)
        avg_spend = round(rev / max(1, count), 2)
        avg_orders = round(total_orders / max(1, count), 2)
        avg_aov = round(rev / max(1, total_orders), 2)
        repeat_rate = round((repeat_count / max(1, count)) * 100, 2)

        results.append({
            "spend_segment": seg,
            "customer_count": count,
            "customer_share_pct": cust_share,
            "total_revenue": rev,
            "revenue_share_pct": rev_share,
            "avg_spend_per_customer": avg_spend,
            "avg_orders_per_customer": avg_orders,
            "average_order_value": avg_aov,
            "repeat_buyer_rate_pct": repeat_rate
        })

    return results

def summarize_products(transactions: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Aggregates product sales:
    - units_sold
    - total_revenue
    - unique_buyers
    - repeat_buyers
    - repeat_rate_pct
    - avg_unit_price
    """
    prod_map = defaultdict(lambda: {
        "category": "",
        "units": 0,
        "revenue": 0.0,
        "buyer_orders": defaultdict(int)
    })

    for t in transactions:
        pname = t["product_name"]
        entry = prod_map[pname]
        entry["category"] = t["category"]
        entry["units"] += t["quantity"]
        entry["revenue"] += t["amount"]
        entry["buyer_orders"][t["customer_id"]] += 1

    results = []
    for pname, data in prod_map.items():
        unique_buyers = len(data["buyer_orders"])
        repeat_buyers = sum(1 for orders in data["buyer_orders"].values() if orders >= 2)
        repeat_rate = round((repeat_buyers / max(1, unique_buyers)) * 100, 2)
        avg_price = round(data["revenue"] / max(1, data["units"]), 2)

        results.append({
            "product_name": pname,
            "category": data["category"],
            "units_sold": data["units"],
            "total_revenue": round(data["revenue"], 2),
            "unique_buyers": unique_buyers,
            "repeat_buyers": repeat_buyers,
            "repeat_purchase_rate_pct": repeat_rate,
            "average_unit_price": avg_price
        })

    # Sort descending by total revenue
    results.sort(key=lambda x: x["total_revenue"], reverse=True)
    return results

def analyze_repeat_purchases(
    customer_summaries: List[Dict[str, Any]],
    transactions: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Analyzes repeat purchase behavior and inter-purchase intervals.
    """
    total_customers = len(customer_summaries)
    repeat_customers = [c for c in customer_summaries if c["is_repeat_buyer"]]
    one_time_customers = [c for c in customer_summaries if not c["is_repeat_buyer"]]

    repeat_count = len(repeat_customers)
    one_time_count = len(one_time_customers)
    repeat_rate = round((repeat_count / max(1, total_customers)) * 100, 2)

    total_revenue = sum(c["total_spend"] for c in customer_summaries)
    repeat_revenue = sum(c["total_spend"] for c in repeat_customers)
    one_time_revenue = sum(c["total_spend"] for c in one_time_customers)
    repeat_rev_share = round((repeat_revenue / max(0.01, total_revenue)) * 100, 2)

    # Order frequency distribution
    freq_counts = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
    for c in customer_summaries:
        k = 5 if c["order_count"] >= 5 else c["order_count"]
        freq_counts[k] = freq_counts.get(k, 0) + 1

    # Inter-purchase interval (days between orders for repeat buyers)
    cust_order_times = defaultdict(list)
    for t in transactions:
        cust_order_times[t["customer_id"]].append(t["datetime"])

    days_between = []
    for dt_list in cust_order_times.values():
        unique_sorted = sorted(list(set(dt_list)))
        if len(unique_sorted) >= 2:
            for i in range(1, len(unique_sorted)):
                diff = (unique_sorted[i] - unique_sorted[i-1]).days
                if diff >= 0:
                    days_between.append(diff)

    avg_days_between = round(sum(days_between) / len(days_between), 1) if days_between else 0.0

    return {
        "total_customers": total_customers,
        "one_time_customers": one_time_count,
        "repeat_customers": repeat_count,
        "repeat_rate_pct": repeat_rate,
        "total_revenue": round(total_revenue, 2),
        "one_time_revenue": round(one_time_revenue, 2),
        "repeat_revenue": round(repeat_revenue, 2),
        "repeat_revenue_share_pct": repeat_rev_share,
        "frequency_distribution": freq_counts,
        "avg_days_between_orders": avg_days_between
    }
