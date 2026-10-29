#!/usr/bin/env python3
"""
Unit Tests for Customer Purchase Behaviour Analysis (DA-002)
Tests data cleaning, order counting, AOV calculation, spending thresholds,
missing values handling, duplicate removal, and repeat-purchase classification.
"""

import unittest
from datetime import datetime
from analysis.data_cleaning import clean_transactions
from analysis.customer_analytics import summarize_customers
from analysis.segmentation import compare_segments, summarize_products, analyze_repeat_purchases

class TestCustomerAnalytics(unittest.TestCase):

    def setUp(self):
        """Prepare sample raw transactions with intentional edge cases."""
        self.raw_data = [
            # Customer 1: 3 orders, repeat buyer, High Spend
            {"transaction_id": "T1", "order_id": "O1", "customer_id": "C1", "transaction_date": "2025-01-10", "product_name": "Parka", "category": "Outerwear", "quantity": 1, "unit_price": 9000, "amount": 9000},
            {"transaction_id": "T2", "order_id": "O2", "customer_id": "C1", "transaction_date": "2025-02-15", "product_name": "Boots", "category": "Footwear", "quantity": 1, "unit_price": 6500, "amount": 6500},
            {"transaction_id": "T3", "order_id": "O3", "customer_id": "C1", "transaction_date": "2025-03-20", "product_name": "Denim", "category": "Apparel", "quantity": 2, "unit_price": 3500, "amount": 7000}, # Total = 22,500 (High Spend)

            # Customer 2: 1 order with 2 item lines (same order_id O4), 1-time buyer, Low Spend
            {"transaction_id": "T4", "order_id": "O4", "customer_id": "C2", "transaction_date": "2025-02-01", "product_name": "Tee", "category": "Apparel", "quantity": 1, "unit_price": 1299, "amount": 1299},
            {"transaction_id": "T5", "order_id": "O4", "customer_id": "C2", "transaction_date": "2025-02-01", "product_name": "Beanie", "category": "Accessories", "quantity": 1, "unit_price": 899, "amount": 899}, # Total = 2,198 (Low Spend), 1 unique order

            # Customer 3: 2 orders, Medium Spend (₹10,000)
            {"transaction_id": "T6", "order_id": "O5", "customer_id": "C3", "transaction_date": "2025-01-20", "product_name": "Jacket", "category": "Outerwear", "quantity": 1, "unit_price": 6000, "amount": 6000},
            {"transaction_id": "T7", "order_id": "O6", "customer_id": "C3", "transaction_date": "2025-03-05", "product_name": "Runner", "category": "Footwear", "quantity": 1, "unit_price": 4000, "amount": 4000},

            # Edge Case 1: Missing Customer ID -> should be dropped
            {"transaction_id": "T8", "order_id": "O7", "customer_id": "", "transaction_date": "2025-02-10", "product_name": "Tote", "category": "Accessories", "quantity": 1, "unit_price": 999, "amount": 999},
            {"transaction_id": "T9", "order_id": "O8", "customer_id": None, "transaction_date": "2025-02-11", "product_name": "Tote", "category": "Accessories", "quantity": 1, "unit_price": 999, "amount": 999},

            # Edge Case 2: Invalid Date -> should be dropped
            {"transaction_id": "T10", "order_id": "O9", "customer_id": "C4", "transaction_date": "INVALID_DATE", "product_name": "Tee", "category": "Apparel", "quantity": 1, "unit_price": 1299, "amount": 1299},

            # Edge Case 3: Missing amount with valid qty & unit price -> should be calculated (2 * 1299 = 2598)
            {"transaction_id": "T11", "order_id": "O10", "customer_id": "C5", "transaction_date": "2025-02-25", "product_name": "Tee", "category": "Apparel", "quantity": 2, "unit_price": 1299, "amount": ""},

            # Edge Case 4: Duplicate row -> T1 duplicate should be dropped
            {"transaction_id": "T1", "order_id": "O1", "customer_id": "C1", "transaction_date": "2025-01-10", "product_name": "Parka", "category": "Outerwear", "quantity": 1, "unit_price": 9000, "amount": 9000},
        ]

    def test_data_cleaning_and_hygiene(self):
        """Test missing values, bad dates, duplicates, and amount calculations."""
        cleaned, report, dropped = clean_transactions(self.raw_data)

        # 12 total raw rows, 2 missing cust_id, 1 bad date, 1 duplicate -> 4 dropped, 1 calculated amount, 8 cleaned
        self.assertEqual(report["total_raw_rows"], 12)
        self.assertEqual(report["missing_customer_ids"], 2)
        self.assertEqual(report["missing_or_invalid_dates"], 1)
        self.assertEqual(report["duplicate_rows"], 1)
        self.assertEqual(report["calculated_amounts"], 1)
        self.assertEqual(len(cleaned), 8)

        # Verify C5 missing amount was computed correctly as qty * unit_price (2 * 1299 = 2598.0)
        c5_txns = [t for t in cleaned if t["customer_id"] == "C5"]
        self.assertEqual(len(c5_txns), 1)
        self.assertEqual(c5_txns[0]["amount"], 2598.0)

    def test_order_count_and_aov(self):
        """Test unique order count using order_id and accurate AOV calculation."""
        cleaned, _, _ = clean_transactions(self.raw_data)
        summaries = summarize_customers(cleaned, low_threshold=5000, high_threshold=20000)

        # Find C2: placed 1 order with 2 item rows (T4 and T5 both have order_id 'O4')
        c2 = next(c for c in summaries if c["customer_id"] == "C2")
        self.assertEqual(c2["order_count"], 1)
        self.assertEqual(c2["total_spend"], 2198.0)
        self.assertEqual(c2["average_order_value"], 2198.0)
        self.assertEqual(c2["total_quantity"], 2)
        self.assertEqual(c2["unique_products_count"], 2)
        self.assertFalse(c2["is_repeat_buyer"])

        # Find C1: placed 3 distinct orders (O1, O2, O3)
        c1 = next(c for c in summaries if c["customer_id"] == "C1")
        self.assertEqual(c1["order_count"], 3)
        self.assertEqual(c1["total_spend"], 22500.0)
        self.assertEqual(c1["average_order_value"], 7500.0) # 22500 / 3
        self.assertTrue(c1["is_repeat_buyer"])

    def test_spending_thresholds(self):
        """Test Low (< ₹5k), Medium (₹5k - ₹20k), High (≥ ₹20k) segmentation."""
        cleaned, _, _ = clean_transactions(self.raw_data)
        summaries = summarize_customers(cleaned, low_threshold=5000, high_threshold=20000)

        c1 = next(c for c in summaries if c["customer_id"] == "C1")
        c2 = next(c for c in summaries if c["customer_id"] == "C2")
        c3 = next(c for c in summaries if c["customer_id"] == "C3")

        self.assertEqual(c1["spend_segment"], "High Spend") # 22,500 >= 20,000
        self.assertEqual(c2["spend_segment"], "Low Spend") # 2,198 < 5,000
        self.assertEqual(c3["spend_segment"], "Medium Spend") # 10,000 in [5000, 20000)

    def test_repeat_purchase_classification(self):
        """Test repeat classification and segment comparison rollups."""
        cleaned, _, _ = clean_transactions(self.raw_data)
        summaries = summarize_customers(cleaned, low_threshold=5000, high_threshold=20000)

        # C1 has 3 orders (repeat), C3 has 2 orders (repeat), C2 has 1 order (one-time), C5 has 1 order (one-time)
        repeat_buyers = [c for c in summaries if c["is_repeat_buyer"]]
        one_time_buyers = [c for c in summaries if not c["is_repeat_buyer"]]

        self.assertEqual(len(repeat_buyers), 2) # C1, C3
        self.assertEqual(len(one_time_buyers), 2) # C2, C5

        repeat_stats = analyze_repeat_purchases(summaries, cleaned)
        self.assertEqual(repeat_stats["repeat_rate_pct"], 50.0) # 2 / 4 = 50%

        # Segment comparisons
        segments = compare_segments(summaries)
        self.assertEqual(len(segments), 3)

        high_seg = next(s for s in segments if s["spend_segment"] == "High Spend")
        self.assertEqual(high_seg["customer_count"], 1)
        self.assertEqual(high_seg["total_revenue"], 22500.0)

if __name__ == "__main__":
    unittest.main()
