import {
  CleanTransaction,
  CustomerSummary,
  SegmentMetrics,
  ProductMetrics,
  RepeatPurchaseCadence,
  OrderDistribution,
  ThresholdConfig,
  SpendSegment,
  MonthlyRevenueTrend,
  SpendDistributionBucket,
  CrossSellPair,
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
      orderIds: Set<string>;
      totalSpend: number;
      totalQuantity: number;
      uniqueProducts: Set<string>;
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
        orderIds: new Set<string>(),
        totalSpend: 0,
        totalQuantity: 0,
        uniqueProducts: new Set<string>(),
        categorySpend: new Map<string, number>(),
        productCounts: new Map<string, number>(),
      };
      customerMap.set(t.customer_id, cust);
    }

    cust.transactions.push(t);
    // Distinct order identifier (using order_id, or transaction date as order trip fallback)
    const effectiveOrderId = t.order_id && t.order_id.trim() !== '' ? t.order_id : t.date;
    cust.orderIds.add(effectiveOrderId);

    cust.totalSpend += t.total_amount;
    cust.totalQuantity += t.quantity;
    cust.uniqueProducts.add(t.product_name);

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
    data.transactions.sort((a, b) => a.timestamp - b.timestamp);

    const firstDate = data.transactions[0].date;
    const lastTx = data.transactions[data.transactions.length - 1];
    const lastDate = lastTx.date;

    const recencyDays = Math.max(
      0,
      Math.round((maxDatasetDate - lastTx.timestamp) / (1000 * 60 * 60 * 24))
    );

    const orderCount = data.orderIds.size;
    const totalSpend = Number(data.totalSpend.toFixed(2));
    const aov = Number((totalSpend / Math.max(1, orderCount)).toFixed(2));
    const isRepeatBuyer = orderCount >= 2;

    // Configurable spend thresholds
    let spendSegment: SpendSegment = 'Low Spend';
    if (totalSpend >= thresholds.highThreshold) {
      spendSegment = 'High Spend';
    } else if (totalSpend >= thresholds.lowThreshold) {
      spendSegment = 'Medium Spend';
    }

    // Identify customers with high historical spending who have not purchased recently (> 90 days)
    const isInactiveHighSpender = totalSpend >= thresholds.highThreshold && recencyDays >= 90;

    // Primary category
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

    summaries.push({
      customer_id: customerId,
      order_count: orderCount,
      total_spend: totalSpend,
      average_order_value: aov,
      total_quantity: data.totalQuantity,
      unique_products_count: data.uniqueProducts.size,
      first_purchase_date: firstDate,
      last_purchase_date: lastDate,
      recency_days: recencyDays,
      is_repeat_buyer: isRepeatBuyer,
      spend_segment: spendSegment,
      primary_category: topCategory,
      top_product: topProduct,
      products_bought: Array.from(data.uniqueProducts),
      is_inactive_high_spender: isInactiveHighSpender,
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
      repeat_rate:
        uniqueBuyers > 0 ? Number(((repeatBuyerCount / uniqueBuyers) * 100).toFixed(1)) : 0,
      avg_price: val.units > 0 ? Number((val.revenue / val.units).toFixed(2)) : 0,
    });
  });

  results.sort((a, b) => b.total_revenue - a.total_revenue);
  return results;
}

export function calculateMonthlyTrends(
  transactions: CleanTransaction[]
): MonthlyRevenueTrend[] {
  const monthMap = new Map<
    string,
    { revenue: number; orders: Set<string>; customers: Set<string> }
  >();

  for (const t of transactions) {
    const monthKey = t.date.substring(0, 7); // YYYY-MM
    let entry = monthMap.get(monthKey);
    if (!entry) {
      entry = { revenue: 0, orders: new Set(), customers: new Set() };
      monthMap.set(monthKey, entry);
    }
    entry.revenue += t.total_amount;
    entry.orders.add(t.order_id || t.transaction_id);
    entry.customers.add(t.customer_id);
  }

  const sortedMonths = Array.from(monthMap.keys()).sort();
  const monthNames = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];

  return sortedMonths.map((m) => {
    const [year, month] = m.split('-');
    const label = `${monthNames[parseInt(month, 10) - 1]} ${year.substring(2)}`;
    const data = monthMap.get(m)!;
    return {
      month: m,
      label,
      revenue: Number(data.revenue.toFixed(2)),
      orders: data.orders.size,
      unique_customers: data.customers.size,
    };
  });
}

export function calculateSpendDistribution(
  summaries: CustomerSummary[]
): SpendDistributionBucket[] {
  const buckets = [
    { bucket: '< ₹2,500', min: 0, max: 2500, count: 0, revenue: 0 },
    { bucket: '₹2.5k - ₹5k', min: 2500, max: 5000, count: 0, revenue: 0 },
    { bucket: '₹5k - ₹10k', min: 5000, max: 10000, count: 0, revenue: 0 },
    { bucket: '₹10k - ₹20k', min: 10000, max: 20000, count: 0, revenue: 0 },
    { bucket: '₹20k - ₹35k', min: 20000, max: 35000, count: 0, revenue: 0 },
    { bucket: '₹35k+', min: 35000, max: 999999999, count: 0, revenue: 0 },
  ];

  const total = summaries.length || 1;
  summaries.forEach((c) => {
    for (const b of buckets) {
      if (c.total_spend >= b.min && c.total_spend < b.max) {
        b.count++;
        b.revenue += c.total_spend;
        break;
      }
    }
  });

  return buckets.map((b) => ({
    ...b,
    percentage: Number(((b.count / total) * 100).toFixed(1)),
    revenue: Number(b.revenue.toFixed(2)),
  }));
}

export function calculateCrossSellPairs(
  transactions: CleanTransaction[]
): CrossSellPair[] {
  // Find products purchased by the same customer
  const customerProducts = new Map<string, Set<string>>();
  for (const t of transactions) {
    if (!customerProducts.has(t.customer_id)) {
      customerProducts.set(t.customer_id, new Set());
    }
    customerProducts.get(t.customer_id)!.add(t.product_name);
  }

  const pairCounts = new Map<string, { a: string; b: string; count: number }>();
  customerProducts.forEach((prods) => {
    const list = Array.from(prods);
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const [a, b] = [list[i], list[j]].sort();
        const key = `${a}|||${b}`;
        const curr = pairCounts.get(key) || { a, b, count: 0 };
        curr.count++;
        pairCounts.set(key, curr);
      }
    }
  });

  const totalCust = customerProducts.size || 1;
  const pairs = Array.from(pairCounts.values())
    .map((p) => ({
      product_a: p.a,
      product_b: p.b,
      co_occurrence_count: p.count,
      confidence_pct: Number(((p.count / totalCust) * 100).toFixed(1)),
    }))
    .sort((a, b) => b.co_occurrence_count - a.co_occurrence_count);

  return pairs.slice(0, 5);
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
  const repeatRevenueShare = Number(((repeatRevenue / Math.max(1, totalRevenue)) * 100).toFixed(1));

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

  // Inter-purchase interval (Days between distinct orders)
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
      if (diffDays >= 0) {
        daysToSecondPurchase.push(diffDays);
      }
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

  const avgDaysBetween =
    daysToSecondPurchase.length > 0
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
