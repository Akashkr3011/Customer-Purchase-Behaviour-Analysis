"""
Data Cleaning & Hygiene Module
Project ID: DA-002 (Customer Analytics)
Handles missing values, duplicate transaction detection, date parsing,
and amount calculation (quantity * unit_price).
"""

import csv
from datetime import datetime
from typing import Dict, List, Tuple, Any

def clean_transactions(
    rows: List[Dict[str, Any]]
) -> Tuple[List[Dict[str, Any]], Dict[str, Any], List[Dict[str, Any]]]:
    """
    Cleans raw transaction rows.
    Removes:
    - Missing or empty customer_id
    - Unparseable or missing transaction_date
    - Non-positive amounts (where quantity * unit_price cannot resolve)
    - Duplicate transaction rows
    """
    cleaned: List[Dict[str, Any]] = []
    dropped: List[Dict[str, Any]] = []

    seen_keys = set()
    missing_cust_id_count = 0
    missing_date_count = 0
    invalid_amount_count = 0
    duplicate_count = 0
    calculated_amount_count = 0

    for idx, row in enumerate(rows):
        # 1. Customer ID
        cust_id = row.get("customer_id")
        if cust_id is None or str(cust_id).strip() == "" or str(cust_id).strip().lower() in ("nan", "null", "none"):
            missing_cust_id_count += 1
            dropped.append({"row_index": idx, "reason": "Missing customer_id", "data": row})
            continue
        cust_id = str(cust_id).strip()

        # 2. Date parsing
        raw_date = row.get("transaction_date") or row.get("date")
        if not raw_date or str(raw_date).strip().lower() in ("nan", "null", "invalid_date", ""):
            missing_date_count += 1
            dropped.append({"row_index": idx, "reason": "Missing or invalid transaction_date", "data": row})
            continue

        raw_date_str = str(raw_date).strip()
        parsed_dt = None
        for fmt in ("%Y-%m-%d", "%Y-%m-%d %H:%M:%S", "%d/%m/%Y", "%m/%d/%Y", "%Y/%m/%d"):
            try:
                parsed_dt = datetime.strptime(raw_date_str, fmt)
                break
            except ValueError:
                continue

        if parsed_dt is None:
            # Try ISO format
            try:
                parsed_dt = datetime.fromisoformat(raw_date_str)
            except Exception:
                missing_date_count += 1
                dropped.append({"row_index": idx, "reason": f"Unparseable date: {raw_date_str}", "data": row})
                continue

        iso_date = parsed_dt.strftime("%Y-%m-%d")

        # 3. Product cleanup
        prod_name = str(row.get("product_name") or "Standard Item").strip().strip('"').strip("'")
        category = str(row.get("category") or "General").strip().strip('"').strip("'")

        # 4. Quantity & Unit Price
        try:
            qty = float(row.get("quantity", 1))
            if qty <= 0:
                qty = 1.0
        except (ValueError, TypeError):
            qty = 1.0

        try:
            unit_price = float(row.get("unit_price", 0))
        except (ValueError, TypeError):
            unit_price = 0.0

        # 5. Amount validation
        raw_amount = row.get("amount") if "amount" in row and row.get("amount") is not None else row.get("total_amount")
        final_amount = None

        if raw_amount is not None and str(raw_amount).strip() != "":
            try:
                parsed_amt = float(raw_amount)
                if parsed_amt > 0:
                    final_amount = round(parsed_amt, 2)
            except (ValueError, TypeError):
                final_amount = None

        if final_amount is None:
            if qty > 0 and unit_price > 0:
                final_amount = round(qty * unit_price, 2)
                calculated_amount_count += 1
            else:
                invalid_amount_count += 1
                dropped.append({"row_index": idx, "reason": f"Invalid amount ({raw_amount}) and cannot compute", "data": row})
                continue

        if unit_price <= 0 and qty > 0:
            unit_price = round(final_amount / qty, 2)

        # 6. Duplicate detection
        txn_id = str(row.get("transaction_id") or row.get("order_id") or f"TXN-{idx+1000}").strip()
        order_id = str(row.get("order_id") or txn_id).strip()

        dup_key = (txn_id.upper(), cust_id.upper(), prod_name.lower(), iso_date, final_amount)
        if dup_key in seen_keys:
            duplicate_count += 1
            dropped.append({"row_index": idx, "reason": f"Duplicate transaction {txn_id}", "data": row})
            continue
        seen_keys.add(dup_key)

        cleaned.append({
            "transaction_id": txn_id,
            "order_id": order_id,
            "customer_id": cust_id,
            "transaction_date": iso_date,
            "date": iso_date,
            "product_name": prod_name,
            "category": category,
            "quantity": int(qty),
            "unit_price": unit_price,
            "amount": final_amount,
            "total_amount": final_amount,
            "datetime": parsed_dt
        })

    cleaned.sort(key=lambda x: x["datetime"])

    min_date = cleaned[0]["transaction_date"] if cleaned else "N/A"
    max_date = cleaned[-1]["transaction_date"] if cleaned else "N/A"
    retention_rate = round((len(cleaned) / max(1, len(rows))) * 100, 2)

    report = {
        "total_raw_rows": len(rows),
        "cleaned_rows": len(cleaned),
        "dropped_rows_count": len(dropped),
        "missing_customer_ids": missing_cust_id_count,
        "missing_or_invalid_dates": missing_date_count,
        "invalid_amounts": invalid_amount_count,
        "calculated_amounts": calculated_amount_count,
        "duplicate_rows": duplicate_count,
        "retention_rate_pct": retention_rate,
        "min_date": min_date,
        "max_date": max_date,
    }

    return cleaned, report, dropped
