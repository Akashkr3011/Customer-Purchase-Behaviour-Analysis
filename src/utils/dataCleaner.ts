import { RawTransaction, CleanTransaction, CleaningReport } from '../types/analytics';

export function cleanTransactionData(raw: RawTransaction[]): {
  cleaned: CleanTransaction[];
  report: CleaningReport;
  droppedRows: { reason: string; item: RawTransaction }[];
} {
  let missingCustIdCount = 0;
  let missingOrInvalidDateCount = 0;
  let invalidAmountCount = 0;
  const droppedRows: { reason: string; item: RawTransaction }[] = [];
  const cleaned: CleanTransaction[] = [];

  for (const item of raw) {
    // 1. Check Customer ID
    if (!item.customer_id || typeof item.customer_id !== 'string' || item.customer_id.trim() === '' || item.customer_id.toLowerCase() === 'nan' || item.customer_id.toLowerCase() === 'null') {
      missingCustIdCount++;
      droppedRows.push({ reason: 'Missing or null CustomerID', item });
      continue;
    }

    // 2. Check Date
    if (!item.date || typeof item.date !== 'string') {
      missingOrInvalidDateCount++;
      droppedRows.push({ reason: 'Missing date value', item });
      continue;
    }

    const parsedDate = new Date(item.date);
    if (isNaN(parsedDate.getTime()) || item.date === 'INVALID_DATE') {
      missingOrInvalidDateCount++;
      droppedRows.push({ reason: 'Unparseable or malformed date string', item });
      continue;
    }

    // 3. Amount verification (clean or recalculate from quantity * unit_price)
    let amount = Number(item.total_amount);
    const qty = Number(item.quantity) || 1;
    const unitPrice = Number(item.unit_price) || 0;

    if (isNaN(amount) || amount <= 0) {
      if (qty > 0 && unitPrice > 0) {
        amount = qty * unitPrice;
      } else {
        invalidAmountCount++;
        droppedRows.push({ reason: 'Non-positive or invalid transaction amount', item });
        continue;
      }
    }

    const isoDate = parsedDate.toISOString().split('T')[0];

    cleaned.push({
      transaction_id: item.transaction_id || `TXN-${Math.random().toString(36).substring(2, 9)}`,
      customer_id: item.customer_id.trim(),
      date: isoDate,
      timestamp: parsedDate.getTime(),
      product_name: item.product_name || 'Standard Item',
      category: item.category || 'General',
      quantity: qty,
      unit_price: unitPrice || Number((amount / qty).toFixed(2)),
      total_amount: Number(amount.toFixed(2)),
    });
  }

  // Sort chronologically
  cleaned.sort((a, b) => a.timestamp - b.timestamp);

  const dates = cleaned.map((c) => c.date);
  const minDate = dates.length > 0 ? dates[0] : 'N/A';
  const maxDate = dates.length > 0 ? dates[dates.length - 1] : 'N/A';

  const report: CleaningReport = {
    total_raw_rows: raw.length,
    missing_customer_ids: missingCustIdCount,
    missing_or_invalid_dates: missingOrInvalidDateCount,
    invalid_amounts: invalidAmountCount,
    cleaned_rows: cleaned.length,
    cleaning_rate: raw.length > 0 ? Number(((cleaned.length / raw.length) * 100).toFixed(1)) : 100,
    date_min: minDate,
    date_max: maxDate,
  };

  return { cleaned, report, droppedRows };
}
