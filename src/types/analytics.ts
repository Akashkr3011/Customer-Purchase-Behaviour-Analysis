export interface RawTransaction {
  transaction_id?: string | null;
  order_id?: string | null;
  customer_id?: string | null;
  date?: string | null;
  transaction_date?: string | null;
  product_name?: string | null;
  category?: string | null;
  quantity?: number | string | null;
  unit_price?: number | string | null;
  total_amount?: number | string | null;
  amount?: number | string | null;
}

export interface CleanTransaction {
  transaction_id: string;
  order_id: string;
  customer_id: string;
  date: string; // ISO YYYY-MM-DD
  timestamp: number;
  product_name: string;
  category: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
}

export interface CleaningReport {
  total_raw_rows: number;
  duplicate_rows: number;
  missing_customer_ids: number;
  missing_or_invalid_dates: number;
  invalid_amounts: number;
  calculated_amounts_count: number;
  cleaned_rows: number;
  cleaning_rate: number; // percentage retained
  date_min: string;
  date_max: string;
  is_synthetic: boolean;
  notes: string[];
}

export type SpendSegment = 'Low Spend' | 'Medium Spend' | 'High Spend';

export interface ThresholdConfig {
  lowThreshold: number; // spend < lowThreshold = Low Spend (default: 5000)
  highThreshold: number; // spend >= highThreshold = High Spend (default: 20000)
}

export interface CustomerSummary {
  customer_id: string;
  order_count: number; // distinct orders (order_id)
  total_spend: number;
  average_order_value: number; // total_spend / order_count
  total_quantity: number; // sum of quantity purchased
  unique_products_count: number; // distinct products purchased
  first_purchase_date: string;
  last_purchase_date: string;
  recency_days: number;
  is_repeat_buyer: boolean; // order_count >= 2
  spend_segment: SpendSegment;
  primary_category: string;
  top_product: string;
  products_bought: string[];
  is_inactive_high_spender: boolean; // high spend but recency > 90 days
}

export interface SegmentMetrics {
  segment: SpendSegment;
  customer_count: number;
  customer_share: number; // percentage 0-100
  total_revenue: number;
  revenue_share: number; // percentage 0-100
  avg_orders_per_customer: number;
  avg_spend_per_customer: number;
  avg_order_value: number;
  repeat_buyer_rate: number; // percentage 0-100
}

export interface ProductMetrics {
  product_name: string;
  category: string;
  units_sold: number;
  total_revenue: number;
  unique_buyers: number;
  repeat_buyer_count: number;
  repeat_rate: number; // percentage 0-100
  avg_price: number;
}

export interface RepeatPurchaseCadence {
  bucket: string; // e.g. "0-14 days", "15-30 days", "31-60 days", "61-90 days", "90+ days"
  customer_count: number;
  percentage: number;
}

export interface OrderDistribution {
  order_count: number; // 1, 2, 3, 4, 5+
  customer_count: number;
  percentage: number;
  total_revenue: number;
}

export interface MonthlyRevenueTrend {
  month: string; // YYYY-MM
  label: string; // e.g. "Jan 2025"
  revenue: number;
  orders: number;
  unique_customers: number;
}

export interface SpendDistributionBucket {
  bucket: string;
  min: number;
  max: number;
  count: number;
  percentage: number;
  revenue: number;
}

export interface CrossSellPair {
  product_a: string;
  product_b: string;
  co_occurrence_count: number;
  confidence_pct: number;
}
