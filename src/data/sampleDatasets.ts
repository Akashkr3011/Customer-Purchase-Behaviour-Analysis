import { RawTransaction } from '../types/analytics';

export interface DatasetPreset {
  id: string;
  name: string;
  description: string;
  industry: string;
  defaultLowThreshold: number;
  defaultHighThreshold: number;
  generator: () => RawTransaction[];
}

// Deterministic Pseudo-Random Number Generator (PRNG) to ensure repeatable analytical runs
function createPRNG(seed: number) {
  let s = seed;
  return function () {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

export function generateRetailDataset(): RawTransaction[] {
  const rand = createPRNG(42);
  const products = [
    { name: 'Merino Wool Crewneck', category: 'Apparel', basePrice: 2499 },
    { name: 'Selvedge Slim Denim', category: 'Apparel', basePrice: 3499 },
    { name: 'Supima Cotton Tee (3-Pack)', category: 'Apparel', basePrice: 1299 },
    { name: 'Water-Resistant Commuter Jacket', category: 'Outerwear', basePrice: 5999 },
    { name: 'Insulated Winter Parka', category: 'Outerwear', basePrice: 8999 },
    { name: 'Full-Grain Leather Chelsea Boots', category: 'Footwear', basePrice: 6499 },
    { name: 'Breathable Knit Everyday Runners', category: 'Footwear', basePrice: 3999 },
    { name: 'Minimalist Canvas Tote', category: 'Accessories', basePrice: 999 },
    { name: 'Italian Leather Bifold Wallet', category: 'Accessories', basePrice: 1899 },
    { name: 'Recycled Wool Beanie', category: 'Accessories', basePrice: 899 },
    { name: 'Polarized Sunglasses', category: 'Accessories', basePrice: 2999 },
    { name: 'Aerodynamic Duffle Bag', category: 'Luggage', basePrice: 4499 },
  ];

  const transactions: RawTransaction[] = [];
  const numCustomers = 280;
  const startDate = new Date(2025, 0, 15).getTime();
  const endDate = new Date(2026, 2, 25).getTime();

  // Create customer IDs
  const customerIds = Array.from({ length: numCustomers }, (_, i) => `CUST-${1000 + i + 1}`);

  let txCounter = 10001;

  customerIds.forEach((custId, idx) => {
    // Generate Pareto behavior: ~20% of customers have high frequency (4-9 orders), 30% have medium frequency (2-3 orders), 50% have 1 order
    let orderCount = 1;
    const profileRoll = rand();
    if (profileRoll > 0.8) {
      orderCount = Math.floor(rand() * 6) + 4; // 4 to 9 orders
    } else if (profileRoll > 0.5) {
      orderCount = Math.floor(rand() * 2) + 2; // 2 or 3 orders
    } else {
      orderCount = 1; // 1-time buyer
    }

    let customerBaseTime = startDate + rand() * (endDate - startDate - 120 * 86400000);

    for (let o = 0; o < orderCount; o++) {
      // Pick 1 to 3 items per order
      const itemsInOrder = Math.floor(rand() * 2) + 1;
      const orderTime = o === 0 
        ? customerBaseTime 
        : customerBaseTime + (rand() * 45 + 12) * 86400000; // subsequent purchases 12 to 57 days later
      
      // Keep customerBaseTime advancing
      customerBaseTime = orderTime;

      const dateObj = new Date(Math.min(orderTime, endDate));
      const dateStr = dateObj.toISOString().split('T')[0];

      for (let i = 0; i < itemsInOrder; i++) {
        // Product affinity
        const prod = products[Math.floor(rand() * products.length)];
        const qty = rand() > 0.85 ? 2 : 1;
        const total = prod.basePrice * qty;

        transactions.push({
          transaction_id: `TXN-${txCounter++}`,
          customer_id: custId,
          date: dateStr,
          product_name: prod.name,
          category: prod.category,
          quantity: qty,
          unit_price: prod.basePrice,
          total_amount: total,
        });
      }
    }
  });

  // Inject intentional realistic data cleaning edge cases to showcase Pandas data cleaning:
  // 1. Missing Customer IDs (~35 rows)
  for (let k = 0; k < 35; k++) {
    const targetIdx = Math.floor(rand() * transactions.length);
    transactions[targetIdx].customer_id = null;
  }

  // 2. Missing or corrupt dates (~22 rows)
  for (let k = 0; k < 22; k++) {
    const targetIdx = Math.floor(rand() * transactions.length);
    transactions[targetIdx].date = rand() > 0.5 ? null : 'INVALID_DATE';
  }

  // 3. Corrupt/negative/zero amounts (~14 rows)
  for (let k = 0; k < 14; k++) {
    const targetIdx = Math.floor(rand() * transactions.length);
    transactions[targetIdx].total_amount = rand() > 0.5 ? -48.0 : 0;
  }

  return transactions;
}

export function generateArtisanCoffeeDataset(): RawTransaction[] {
  const rand = createPRNG(1337);
  const products = [
    { name: 'Ethiopia Yirgacheffe (Whole Bean 250g)', category: 'Single Origin', basePrice: 850 },
    { name: 'Guatemala Antigua Peaberry (250g)', category: 'Single Origin', basePrice: 950 },
    { name: 'Colombia Huila Supremo (250g)', category: 'Single Origin', basePrice: 790 },
    { name: 'Velvet Espresso Blend (1kg Bag)', category: 'Blends', basePrice: 1650 },
    { name: 'Midnight Roasters Dark Blend (250g)', category: 'Blends', basePrice: 750 },
    { name: 'Cold Brew Bottled Concentrate 1L', category: 'Ready To Drink', basePrice: 650 },
    { name: 'Precision Conical Burr Grinder', category: 'Brew Equipment', basePrice: 5500 },
    { name: 'Ceramic Pour-Over Dripper V60', category: 'Brew Equipment', basePrice: 1200 },
    { name: 'Unbleached Filter Cones (100pk)', category: 'Supplies', basePrice: 390 },
    { name: 'Barista Stainless Gooseneck Kettle', category: 'Brew Equipment', basePrice: 2900 },
    { name: 'Oat Milk Barista Edition (Case of 6)', category: 'Pantry', basePrice: 1400 },
  ];

  const transactions: RawTransaction[] = [];
  const numCustomers = 220;
  const startDate = new Date(2025, 1, 1).getTime();
  const endDate = new Date(2026, 2, 28).getTime();

  let txCounter = 20001;
  const customerIds = Array.from({ length: numCustomers }, (_, i) => `CUST-COFFEE-${200 + i + 1}`);

  customerIds.forEach((custId) => {
    let orderCount = 1;
    const profileRoll = rand();
    if (profileRoll > 0.7) {
      orderCount = Math.floor(rand() * 8) + 3; // Coffee subscription behavior (high repeat)
    } else if (profileRoll > 0.45) {
      orderCount = Math.floor(rand() * 3) + 2;
    } else {
      orderCount = 1;
    }

    let customerBaseTime = startDate + rand() * (endDate - startDate - 100 * 86400000);

    for (let o = 0; o < orderCount; o++) {
      const itemsInOrder = Math.floor(rand() * 2) + 1;
      const orderTime = o === 0 ? customerBaseTime : customerBaseTime + (rand() * 28 + 14) * 86400000;
      customerBaseTime = orderTime;
      const dateStr = new Date(Math.min(orderTime, endDate)).toISOString().split('T')[0];

      for (let i = 0; i < itemsInOrder; i++) {
        const prod = products[Math.floor(rand() * products.length)];
        const qty = rand() > 0.7 ? 2 : 1;
        const total = prod.basePrice * qty;

        transactions.push({
          transaction_id: `TXN-CF-${txCounter++}`,
          customer_id: custId,
          date: dateStr,
          product_name: prod.name,
          category: prod.category,
          quantity: qty,
          unit_price: prod.basePrice,
          total_amount: total,
        });
      }
    }
  });

  // Inject intentional missing data
  for (let k = 0; k < 25; k++) {
    const idx = Math.floor(rand() * transactions.length);
    transactions[idx].customer_id = null;
  }
  for (let k = 0; k < 18; k++) {
    const idx = Math.floor(rand() * transactions.length);
    transactions[idx].date = null;
  }

  return transactions;
}

export const DATASET_PRESETS: DatasetPreset[] = [
  {
    id: 'retail_apparel',
    name: 'Omnichannel Apparel & Outerwear',
    description: '1,400+ transaction lines tracking customer orders, unit spend in ₹, and repeat cadence.',
    industry: 'Fashion & Lifestyle Retail',
    defaultLowThreshold: 5000,
    defaultHighThreshold: 20000,
    generator: generateRetailDataset,
  },
  {
    id: 'artisan_coffee',
    name: 'Artisan Roastery & Coffee Club',
    description: 'High-frequency recurring subscription and equipment orders across 220 customer cohorts.',
    industry: 'Food & Beverage Subscriptions',
    defaultLowThreshold: 3000,
    defaultHighThreshold: 12000,
    generator: generateArtisanCoffeeDataset,
  },
];
