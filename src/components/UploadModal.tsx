import React, { useState } from 'react';
import { RawTransaction } from '../types/analytics';
import { X, UploadCloud, FileSpreadsheet, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataLoaded: (data: RawTransaction[], datasetName: string) => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({ isOpen, onClose, onDataLoaded }) => {
  const [csvText, setCsvText] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const parseRowObject = (row: Record<string, any>, idx: number): RawTransaction => {
    const keys = Object.keys(row);
    const findKey = (...names: string[]): string | undefined => {
      return keys.find((k) => {
        const cleanK = k.toLowerCase().replace(/[^a-z0-9]/g, '');
        return names.some((n) => cleanK.includes(n.replace(/[^a-z0-9]/g, '')));
      });
    };

    const custKey = findKey('customer_id', 'cust_id', 'customer', 'custid', 'user_id', 'client');
    const orderKey = findKey('order_id', 'orderid', 'order', 'invoice_id', 'transaction_id', 'tx_id');
    const txKey = findKey('transaction_id', 'tx_id', 'id') || orderKey;
    const dateKey = findKey('transaction_date', 'date', 'order_date', 'time', 'timestamp');
    const prodKey = findKey('product_name', 'product', 'item_name', 'item', 'name');
    const catKey = findKey('category', 'cat', 'dept', 'department');
    const qtyKey = findKey('quantity', 'qty', 'count', 'units');
    const priceKey = findKey('unit_price', 'price', 'rate');
    const amountKey = findKey('amount', 'total_amount', 'total', 'spend', 'line_total', 'revenue');

    const customerId = custKey && row[custKey] !== undefined ? String(row[custKey]).trim() : null;
    const orderId = orderKey && row[orderKey] !== undefined ? String(row[orderKey]).trim() : `ORD-${1000 + idx}`;
    const txId = txKey && row[txKey] !== undefined ? String(row[txKey]).trim() : `TX-${1000 + idx}`;
    const dateVal = dateKey && row[dateKey] !== undefined ? String(row[dateKey]).trim() : null;
    const prodName = prodKey && row[prodKey] !== undefined ? String(row[prodKey]).trim() : 'Product Item';
    const category = catKey && row[catKey] !== undefined ? String(row[catKey]).trim() : 'General';
    
    let qty = qtyKey && row[qtyKey] !== undefined ? Number(row[qtyKey]) : 1;
    if (isNaN(qty)) qty = 1;

    let unitPrice = priceKey && row[priceKey] !== undefined ? Number(row[priceKey]) : 0;
    let totalAmount = amountKey && row[amountKey] !== undefined ? Number(row[amountKey]) : 0;

    // Hygiene calculation: calculate missing amounts using quantity * unit_price only when both inputs are valid
    if ((!totalAmount || totalAmount <= 0) && qty > 0 && unitPrice > 0) {
      totalAmount = qty * unitPrice;
    } else if (totalAmount > 0 && (!unitPrice || unitPrice <= 0) && qty > 0) {
      unitPrice = Number((totalAmount / qty).toFixed(2));
    }

    return {
      transaction_id: txId,
      order_id: orderId,
      customer_id: customerId && customerId !== '' ? customerId : null,
      date: dateVal,
      product_name: prodName,
      category: category,
      quantity: qty,
      unit_price: unitPrice > 0 ? unitPrice : Number((totalAmount / qty).toFixed(2)),
      total_amount: totalAmount,
    };
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg('');
    setIsProcessing(true);

    try {
      const fileName = file.name.toLowerCase();
      if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet);

        if (!jsonData || jsonData.length === 0) {
          setErrorMsg('The Excel worksheet contains no valid data rows.');
          setIsProcessing(false);
          return;
        }

        const transactions: RawTransaction[] = jsonData.map((row, idx) => parseRowObject(row, idx));
        onDataLoaded(transactions, file.name.replace(/\.[^/.]+$/, ''));
        onClose();
      } else {
        // Plain text / CSV file
        const text = await file.text();
        parseCsv(text, file.name.replace(/\.[^/.]+$/, ''));
      }
    } catch (err: unknown) {
      setErrorMsg(`Failed to parse file: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const parseCsv = (content: string, customName = 'Uploaded Dataset') => {
    setErrorMsg('');
    try {
      const lines = content.trim().split(/\r?\n/);
      if (lines.length < 2) {
        setErrorMsg('CSV must contain a header row and at least one data row.');
        return;
      }

      const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/["\r]/g, ''));
      const transactions: RawTransaction[] = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const cols = line.split(',').map((c) => c.trim().replace(/^"|"$/g, ''));

        const rowObj: Record<string, any> = {};
        headers.forEach((h, idx) => {
          rowObj[h] = cols[idx];
        });

        transactions.push(parseRowObject(rowObj, i));
      }

      if (transactions.length === 0) {
        setErrorMsg('Could not extract any transaction rows from CSV.');
        return;
      }

      onDataLoaded(transactions, customName);
      onClose();
    } catch (err: unknown) {
      setErrorMsg(`Failed to parse CSV: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const loadSampleCustom = () => {
    const sample = `order_id,customer_id,transaction_date,product_name,category,quantity,unit_price,amount
ORD-7001,CUST-801,2025-04-10,Leather Laptop Briefcase,Luggage,1,8500.00,8500.00
ORD-7002,CUST-801,2025-05-12,Minimalist Key Case,Accessories,1,1200.00,1200.00
ORD-7003,CUST-802,2025-04-11,Canvas Tote Bag,Accessories,1,999.00,999.00
ORD-7004,,2025-04-12,Water-Resistant Jacket,Outerwear,1,5999.00,5999.00
ORD-7005,CUST-803,INVALID_DATE,Merino Wool Crewneck,Apparel,2,2499.00,4998.00
ORD-7006,CUST-804,2025-04-15,Chelsea Leather Boots,Footwear,1,6499.00,6499.00
ORD-7007,CUST-804,2025-04-29,Supima Cotton Tee,Apparel,3,1299.00,
ORD-7008,CUST-804,2025-06-02,Everyday Runners,Footwear,1,3999.00,3999.00
ORD-7009,CUST-805,2025-05-01,Polarized Sunglasses,Accessories,1,2999.00,2999.00`;
    setCsvText(sample);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white border border-slate-200 rounded-xl max-w-xl w-full max-h-[85vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Upload Customer Dataset
              </h3>
              <p className="text-xs text-slate-500">
                Supports CSV, Excel (.xlsx, .xls) with Indian Rupee (₹) amounts.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* File Upload Drop Area */}
          <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-blue-400 hover:bg-blue-50/20 transition-all">
            <UploadCloud className="w-9 h-9 text-blue-500 mx-auto mb-2" />
            <div className="text-slate-800 font-semibold text-sm">
              Select CSV or Excel (.xlsx) file
            </div>
            <p className="text-slate-400 text-[11px] mt-1">
              Expected columns: order_id, customer_id, transaction_date, product_name, quantity, unit_price, amount
            </p>
            <input
              type="file"
              accept=".csv,.xlsx,.xls,.txt"
              onChange={handleFileUpload}
              disabled={isProcessing}
              className="mt-3 text-xs text-slate-500 file:mr-2.5 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer disabled:opacity-50"
            />
            {isProcessing && <p className="text-xs text-blue-600 mt-2 font-medium">Processing file...</p>}
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="font-semibold text-slate-700">Or paste raw CSV text:</span>
            <button
              onClick={loadSampleCustom}
              className="text-[11px] font-medium text-blue-600 hover:underline cursor-pointer"
            >
              Paste Test Sample (with missing amounts & invalid dates)
            </button>
          </div>

          <textarea
            rows={5}
            placeholder="order_id,customer_id,transaction_date,product_name,category,quantity,unit_price,amount"
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-mono text-[11px] text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-blue-600"
          ></textarea>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50/70 flex items-center justify-between">
          <button
            onClick={onClose}
            className="text-xs text-slate-500 hover:text-slate-800 cursor-pointer font-medium"
          >
            Cancel
          </button>
          <button
            onClick={() => parseCsv(csvText, 'Pasted Transaction Data')}
            disabled={!csvText.trim() || isProcessing}
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-xs"
          >
            Process & Ingest Transactions
          </button>
        </div>
      </div>
    </div>
  );
};
