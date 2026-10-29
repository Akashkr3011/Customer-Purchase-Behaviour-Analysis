import { RawTransaction, CleanTransaction, CleaningReport } from '../types/analytics';

export function cleanTransactionData(
  raw: RawTransaction[],
  isSynthetic: boolean = true
): {
  cleaned: CleanTransaction[];
  report: CleaningReport;
  droppedRows: { reason: string; item: RawTransaction }[];
} {
  let missingCustIdCount = 0;
  let missingOrInvalidDateCount = 0;
  let invalidAmountCount = 0;
  let duplicateCount = 0;
  let calculatedAmountsCount = 0;

  const droppedRows: { reason: string; item: RawTransaction }[] = [];
  const cleaned: CleanTransaction[] = [];
  const seenTxnKeys = new Set<string>();
  const notes: string[] = [];

  for (let idx = 0; idx < raw.length; idx++) {
    const item = raw[idx];

    // 1. Resolve Customer ID
    const rawCustId = item.customer_id;
    if (
      !rawCustId ||
      typeof rawCustId !== 'string' ||
      rawCustId.trim() === '' ||
      rawCustId.trim().toLowerCase() === 'nan' ||
      rawCustId.trim().toLowerCase() === 'null' ||
      rawCustId.trim().toLowerCase() === 'none'
    ) {
      missingCustIdCount++;
      droppedRows.push({
        reason: 'Missing or null CustomerID: unattributable record',
        item,
      });
      continue;
    }
    const customerId = rawCustId.trim();

    // 2. Resolve Dates
    const rawDate = item.date || item.transaction_date;
    if (!rawDate || typeof rawDate !== 'string') {
      missingOrInvalidDateCount++;
      droppedRows.push({
        reason: 'Missing transaction date value',
        item,
      });
      continue;
    }

    const parsedDate = new Date(rawDate);
    if (
      isNaN(parsedDate.getTime()) ||
      rawDate.toUpperCase() === 'INVALID_DATE' ||
      rawDate.toLowerCase() === 'nan' ||
      rawDate.toLowerCase() === 'null'
    ) {
      missingOrInvalidDateCount++;
      droppedRows.push({
        reason: `Unparseable or malformed date: "${rawDate}"`,
        item,
      });
      continue;
    }

    // 3. Resolve Product Name Cleanup
    let prodName = (item.product_name || 'Standard Product').trim();
    // Clean unwanted characters and strip wrapping quotes
    prodName = prodName.replace(/^["']|["']$/g, '').trim();
    if (prodName.length === 0) prodName = 'General Product';

    // 4. Resolve Quantity & Unit Price
    const rawQty = item.quantity;
    const qty = Number(rawQty);
    const isValidQty = !isNaN(qty) && qty > 0;

    const rawUnitPrice = item.unit_price;
    const unitPrice = Number(rawUnitPrice);
    const isValidUnitPrice = !isNaN(unitPrice) && unitPrice > 0;

    // 5. Amount calculation and validation
    // Calculate missing amounts using quantity * unit_price only when both inputs are valid.
    // Never silently replace missing or invalid amounts with arbitrary values.
    const rawAmount = item.amount !== undefined && item.amount !== null ? item.amount : item.total_amount;
    let finalAmount: number | null = null;

    if (rawAmount !== undefined && rawAmount !== null && String(rawAmount).trim() !== '') {
      const parsedAmount = Number(rawAmount);
      if (!isNaN(parsedAmount) && parsedAmount > 0) {
        finalAmount = Number(parsedAmount.toFixed(2));
      }
    }

    // If amount was missing or invalid, check if we can compute from quantity * unit_price
    if (finalAmount === null) {
      if (isValidQty && isValidUnitPrice) {
        finalAmount = Number((qty * unitPrice).toFixed(2));
        calculatedAmountsCount++;
      } else {
        invalidAmountCount++;
        droppedRows.push({
          reason: `Invalid transaction amount (raw: ${rawAmount}, qty: ${rawQty}, unit_price: ${rawUnitPrice})`,
          item,
        });
        continue;
      }
    }

    // Unit price reconciliation
    const finalQty = isValidQty ? Math.round(qty) : 1;
    const finalUnitPrice = isValidUnitPrice
      ? Number(unitPrice.toFixed(2))
      : Number((finalAmount / finalQty).toFixed(2));

    // 6. Transaction ID and Order ID
    const rawTxId = item.transaction_id || `TXN-${idx + 1000}`;
    const rawOrderId = item.order_id || rawTxId;
    const isoDate = parsedDate.toISOString().split('T')[0];

    // 7. Duplicate Transaction Detection
    // Check duplicate by transaction_id if unique, or by order_id + customer_id + product + date
    const duplicateKey = `${rawTxId.trim().toUpperCase()}|${customerId.toUpperCase()}|${prodName.toLowerCase()}|${isoDate}|${finalAmount}`;
    if (seenTxnKeys.has(duplicateKey)) {
      duplicateCount++;
      droppedRows.push({
        reason: `Duplicate transaction record detected (Key: ${rawTxId})`,
        item,
      });
      continue;
    }
    seenTxnKeys.add(duplicateKey);

    cleaned.push({
      transaction_id: rawTxId.trim(),
      order_id: rawOrderId.trim(),
      customer_id: customerId,
      date: isoDate,
      timestamp: parsedDate.getTime(),
      product_name: prodName,
      category: (item.category || 'General').trim(),
      quantity: finalQty,
      unit_price: finalUnitPrice,
      total_amount: finalAmount,
    });
  }

  // Sort chronologically
  cleaned.sort((a, b) => a.timestamp - b.timestamp);

  const dates = cleaned.map((c) => c.date);
  const minDate = dates.length > 0 ? dates[0] : 'N/A';
  const maxDate = dates.length > 0 ? dates[dates.length - 1] : 'N/A';

  if (calculatedAmountsCount > 0) {
    notes.push(
      `Calculated missing total amount for ${calculatedAmountsCount} record(s) using valid quantity × unit_price.`
    );
  }
  if (duplicateCount > 0) {
    notes.push(`Deduplicated ${duplicateCount} identical transaction row(s).`);
  }
  if (missingCustIdCount > 0) {
    notes.push(`Excluded ${missingCustIdCount} row(s) with missing or empty Customer IDs.`);
  }
  if (missingOrInvalidDateCount > 0) {
    notes.push(`Excluded ${missingOrInvalidDateCount} row(s) with corrupt or unparseable dates.`);
  }

  const report: CleaningReport = {
    total_raw_rows: raw.length,
    duplicate_rows: duplicateCount,
    missing_customer_ids: missingCustIdCount,
    missing_or_invalid_dates: missingOrInvalidDateCount,
    invalid_amounts: invalidAmountCount,
    calculated_amounts_count: calculatedAmountsCount,
    cleaned_rows: cleaned.length,
    cleaning_rate:
      raw.length > 0 ? Number(((cleaned.length / raw.length) * 100).toFixed(1)) : 100,
    date_min: minDate,
    date_max: maxDate,
    is_synthetic: isSynthetic,
    notes,
  };

  return { cleaned, report, droppedRows };
}
