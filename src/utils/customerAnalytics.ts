import {
  CleanTransaction,
  CustomerSummary,
  SegmentMetrics,
  ProductMetrics,
  RepeatPurchaseCadence,
  OrderDistribution,
  ThresholdConfig,
  SpendSegment,
} from '../types/analytics';

export function calculateCustomerSummaries(
  transactions: CleanTransaction[],
  thresholds: ThresholdConfig
): CustomerSummary[] {
  if (transactions.length === 0) return [];

  // Group by customer_id
  const customerMap = new Map<
    string,
    {
      transactions: CleanTransaction[];
      orderDates: Set<string>;
      totalSpend: number;
      categorySpend: Map<string, number>;
      productCounts: Map<string, number>;
    }
  >();

  let maxDatasetDate = 0;

  for (const t of transactions) {
    if (t.timestamp > maxDatasetDate) {
      maxDatasetDate = t.timestamp;
    }

    let cust = customerMap.get(t.customer_id);
    if (!cust) {
      cust = {
        transactions: [],
        orderDates: new Set<string>(),
        totalSpend: 0,
        categorySpend: new Map<string, number>(),
        productCounts: new Map<string, number>(),
      };
      customerMap.set(t.customer_id, cust);
    }

    cust.transactions.push(t);
    cust.orderDates.add(t.date); // Distinct purchase dates count as distinct orders/shopping trips
    cust.totalSpend += t.total_amount;

    cust.categorySpend.set(
      t.category,
      (cust.categorySpend.get(t.category) || 0) + t.total_amount
    );

    cust.productCounts.set(
      t.product_name,
      (cust.productCounts.get(t.product_name) || 0) + t.quantity
    );
  }

  const summaries: CustomerSummary[] = [];

  customerMap.forEach((data, customerId) => {
    // Sort transactions chronologically
    data.transactions.sort((a, b) => a.timestamp - b.timestamp);

    const firstDate = data.transactions[0].date;
    const lastTx = data.transactions[data.transactions.length - 1];
    const lastDate = lastTx.date;

    const recencyDays = Math.max(
      0,
      Math.round((maxDatasetDate - lastTx.timestamp) / (1000 * 60 * 60 * 24))
    );

    const orderCount = data.orderDates.size;
    const totalSpend = Number(data.totalSpend.toFixed(2));
    const aov = Number((totalSpend / (orderCount || 1)).toFixed(2));
    const isRepeatBuyer = orderCount >= 2;

    // Segment assignment with documented thresholds
    let spendSegment: SpendSegment = 'Low Spend';
    if (totalSpend >= thresholds.highThreshold) {
      spendSegment = 'High Spend';
    } else if (totalSpend >= thresholds.lowThreshold) {
      spendSegment = 'Medium Spend';
    }

    // Top category
    let topCategory = 'General';
    let maxCatSpend = -1;
    data.categorySpend.forEach((spend, cat) => {
      if (spend > maxCatSpend) {
        maxCatSpend = spend;
        topCategory = cat;
      }
    });

    // Top product
    let topProduct = 'Standard Item';
    let maxProdQty = -1;
    data.productCounts.forEach((qty, prod) => {
      if (qty > maxProdQty) {
        maxProdQty = qty;
        topProduct = prod;
      }
    });

    const productsBought = Array.from(data.productCounts.keys());

    summaries.push({
      customer_id: customerId,
      order_count: orderCount,
      total_spend: totalSpend,
      average_order_value: aov,
      first_purchase_date: firstDate,
      last_purchase_date: lastDate,
      recency_days: recencyDays,
      is_repeat_buyer: isRepeatBuyer,
      spend_segment: spendSegment,
      primary_category: topCategory,
      top_product: topProduct,
      products_bought: productsBought,
    });
  });

  // Sort descending by total spend by default
  summaries.sort((a, b) => b.total_spend - a.total_spend);

  return summaries;
}

export function calculateSegmentMetrics(
  summaries: CustomerSummary[]
): SegmentMetrics[] {
  const segments: SpendSegment[] = ['Low Spend', 'Medium Spend', 'High Spend'];
  const totalCustomers = summaries.length || 1;
  const totalRevenueAll = summaries.reduce((acc, c) => acc + c.total_spend, 0) || 1;

  return segments.map((seg) => {
    const matching = summaries.filter((c) => c.spend_segment === seg);
    const count = matching.length;
    const revenue = matching.reduce((acc, c) => acc + c.total_spend, 0);
    const orders = matching.reduce((acc, c) => acc + c.order_count, 0);
    const repeatCount = matching.filter((c) => c.is_repeat_buyer).length;

    return {
      segment: seg,
      customer_count: count,
      customer_share: Number(((count / totalCustomers) * 100).toFixed(1)),
      total_revenue: Number(revenue.toFixed(2)),
      revenue_share: Number(((revenue / totalRevenueAll) * 100).toFixed(1)),
      avg_orders_per_customer: count > 0 ? Number((orders / count).toFixed(2)) : 0,
      avg_spend_per_customer: count > 0 ? Number((revenue / count).toFixed(2)) : 0,
      avg_order_value: orders > 0 ? Number((revenue / orders).toFixed(2)) : 0,
      repeat_buyer_rate: count > 0 ? Number(((repeatCount / count) * 100).toFixed(1)) : 0,
    };
  });
}

export function calculateProductMetrics(
  transactions: CleanTransaction[]
): ProductMetrics[] {
  const productMap = new Map<
    string,
    {
      category: string;
      units: number;
      revenue: number;
      buyerOrders: Map<string, number>;
    }
  >();

  for (const t of transactions) {
    let prod = productMap.get(t.product_name);
    if (!prod) {
      prod = {
        category: t.category,
        units: 0,
        revenue: 0,
        buyerOrders: new Map<string, number>(),
      };
      productMap.set(t.product_name, prod);
    }
    prod.units += t.quantity;
    prod.revenue += t.total_amount;
    prod.buyerOrders.set(
      t.customer_id,
      (prod.buyerOrders.get(t.customer_id) || 0) + 1
    );
  }

  const results: ProductMetrics[] = [];
  productMap.forEach((val, name) => {
    const uniqueBuyers = val.buyerOrders.size;
    let repeatBuyerCount = 0;
    val.buyerOrders.forEach((orders) => {
      if (orders >= 2) repeatBuyerCount++;
    });

    results.push({
      product_name: name,
      category: val.category,
      units_sold: val.units,
      total_revenue: Number(val.revenue.toFixed(2)),
      unique_buyers: uniqueBuyers,
      repeat_buyer_count: repeatBuyerCount,
      repeat_rate: uniqueBuyers > 0 ? Number(((repeatBuyerCount / uniqueBuyers) * 100).toFixed(1)) : 0,
      avg_price: val.units > 0 ? Number((val.revenue / val.units).toFixed(2)) : 0,
    });
  });

  // Sort by total revenue descending
  results.sort((a, b) => b.total_revenue - a.total_revenue);
  return results;
}

export function calculateRepeatPurchaseAnalysis(
  summaries: CustomerSummary[],
  transactions: CleanTransaction[]
) {
  const totalCustomers = summaries.length || 1;
  const repeatBuyers = summaries.filter((c) => c.is_repeat_buyer);
  const oneTimeBuyers = summaries.filter((c) => !c.is_repeat_buyer);

  const repeatBuyerCount = repeatBuyers.length;
  const repeatRate = Number(((repeatBuyerCount / totalCustomers) * 100).toFixed(1));

  const totalRevenue = summaries.reduce((acc, c) => acc + c.total_spend, 0);
  const repeatRevenue = repeatBuyers.reduce((acc, c) => acc + c.total_spend, 0);
  const oneTimeRevenue = oneTimeBuyers.reduce((acc, c) => acc + c.total_spend, 0);
  const repeatRevenueShare = Number(((repeatRevenue / (totalRevenue || 1)) * 100).toFixed(1));

  // Order distribution (1, 2, 3, 4, 5+)
  const distBuckets: { [key: number]: { count: number; revenue: number } } = {
    1: { count: 0, revenue: 0 },
    2: { count: 0, revenue: 0 },
    3: { count: 0, revenue: 0 },
    4: { count: 0, revenue: 0 },
    5: { count: 0, revenue: 0 }, // 5+
  };

  summaries.forEach((c) => {
    const k = c.order_count >= 5 ? 5 : c.order_count;
    if (distBuckets[k]) {
      distBuckets[k].count++;
      distBuckets[k].revenue += c.total_spend;
    }
  });

  const orderDistribution: OrderDistribution[] = [1, 2, 3, 4, 5].map((k) => ({
    order_count: k,
    customer_count: distBuckets[k].count,
    percentage: Number(((distBuckets[k].count / totalCustomers) * 100).toFixed(1)),
    total_revenue: Number(distBuckets[k].revenue.toFixed(2)),
  }));

  // Inter-purchase interval (Days to 2nd purchase)
  const custOrderDates = new Map<string, number[]>();
  for (const t of transactions) {
    if (!custOrderDates.has(t.customer_id)) {
      custOrderDates.set(t.customer_id, []);
    }
    custOrderDates.get(t.customer_id)!.push(t.timestamp);
  }

  const daysToSecondPurchase: number[] = [];
  custOrderDates.forEach((timestamps) => {
    const uniqueSorted = Array.from(new Set(timestamps)).sort((a, b) => a - b);
    if (uniqueSorted.length >= 2) {
      const diffDays = Math.round((uniqueSorted[1] - uniqueSorted[0]) / (1000 * 60 * 60 * 24));
      daysToSecondPurchase.push(diffDays);
    }
  });

  const cadenceBuckets: { label: string; min: number; max: number; count: number }[] = [
    { label: '0–14 days', min: 0, max: 14, count: 0 },
    { label: '15–30 days', min: 15, max: 30, count: 0 },
    { label: '31–60 days', min: 31, max: 60, count: 0 },
    { label: '61–90 days', min: 61, max: 90, count: 0 },
    { label: '90+ days', min: 91, max: 9999, count: 0 },
  ];

  daysToSecondPurchase.forEach((days) => {
    for (const b of cadenceBuckets) {
      if (days >= b.min && days <= b.max) {
        b.count++;
        break;
      }
    }
  });

  const totalSecondPurchases = daysToSecondPurchase.length || 1;
  const cadence: RepeatPurchaseCadence[] = cadenceBuckets.map((b) => ({
    bucket: b.label,
    customer_count: b.count,
    percentage: Number(((b.count / totalSecondPurchases) * 100).toFixed(1)),
  }));

  const avgDaysBetween = daysToSecondPurchase.length > 0
    ? Math.round(daysToSecondPurchase.reduce((a, b) => a + b, 0) / daysToSecondPurchase.length)
    : 0;

  return {
    repeatBuyerCount,
    oneTimeBuyerCount: oneTimeBuyers.length,
    repeatRate,
    repeatRevenue,
    oneTimeRevenue,
    repeatRevenueShare,
    orderDistribution,
    cadence,
    avgDaysBetween,
  };
}
