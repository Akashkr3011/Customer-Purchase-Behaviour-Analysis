import React, { useState } from 'react';
import { RawTransaction } from '../types/analytics';
import { X, UploadCloud, FileText, CheckCircle2 } from 'lucide-react';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataLoaded: (data: RawTransaction[], datasetName: string) => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({ isOpen, onClose, onDataLoaded }) => {
  const [csvText, setCsvText] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const parseCsv = (content: string) => {
    setErrorMsg('');
    try {
      const lines = content.trim().split('\n');
      if (lines.length < 2) {
        setErrorMsg('CSV must contain a header row and at least one data row.');
        return;
      }

      const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/["\r]/g, ''));

      // Find indices
      const custIdx = headers.findIndex((h) => h.includes('cust') || h === 'id' || h === 'user_id');
      const dateIdx = headers.findIndex((h) => h.includes('date') || h.includes('time'));
      const prodIdx = headers.findIndex((h) => h.includes('prod') || h.includes('item') || h === 'name');
      const catIdx = headers.findIndex((h) => h.includes('cat'));
      const qtyIdx = headers.findIndex((h) => h.includes('qty') || h.includes('quantity'));
      const amountIdx = headers.findIndex((h) => h.includes('amount') || h.includes('total') || h.includes('spend') || h.includes('price'));

      const transactions: RawTransaction[] = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const cols = line.split(',').map((c) => c.trim().replace(/^"|"$/g, ''));

        const custId = custIdx !== -1 ? cols[custIdx] : cols[0];
        const dateVal = dateIdx !== -1 ? cols[dateIdx] : cols[1];
        const prodName = prodIdx !== -1 ? cols[prodIdx] : 'Product Item';
        const category = catIdx !== -1 ? cols[catIdx] : 'General';
        const qty = qtyIdx !== -1 ? Number(cols[qtyIdx]) || 1 : 1;
        const total = amountIdx !== -1 ? Number(cols[amountIdx]) || 50 : 50;

        transactions.push({
          transaction_id: `UPLOAD-${1000 + i}`,
          customer_id: custId || null,
          date: dateVal || null,
          product_name: prodName,
          category: category,
          quantity: qty,
          unit_price: Number((total / qty).toFixed(2)),
          total_amount: total,
        });
      }

      if (transactions.length === 0) {
        setErrorMsg('Could not parse valid records from CSV.');
        return;
      }

      onDataLoaded(transactions, 'Uploaded Custom Dataset');
      onClose();
    } catch (err: unknown) {
      setErrorMsg(`Failed to parse CSV: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) parseCsv(content);
    };
    reader.readAsText(file);
  };

  const loadSampleCustom = () => {
    const sample = `customer_id,date,product_name,category,quantity,total_amount
CUST-801,2025-04-10,Leather Briefcase,Luggage,1,8500.00
CUST-801,2025-05-12,Minimalist Key Case,Accessories,1,1200.00
CUST-802,2025-04-11,Canvas Tote,Accessories,1,999.00
,2025-04-12,Water-Resistant Jacket,Outerwear,1,5999.00
CUST-803,INVALID_DATE,Merino Wool Crewneck,Apparel,2,4998.00
CUST-804,2025-04-15,Chelsea Boots,Footwear,1,6499.00
CUST-804,2025-04-29,Supima Cotton Tee,Apparel,3,3897.00
CUST-804,2025-06-02,Everyday Runners,Footwear,1,3999.00
CUST-805,2025-05-01,Polarized Sunglasses,Accessories,1,2999.00`;
    setCsvText(sample);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white border border-slate-200 rounded-lg max-w-xl w-full max-h-[85vh] flex flex-col shadow-xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Upload Customer Transactions CSV
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Supports transaction records with customer IDs, dates, products, and amounts.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 bg-rose-50 text-rose-700 border border-rose-200 rounded">
              {errorMsg}
            </div>
          )}

          {/* File input box */}
          <div className="border-2 border-dashed border-slate-200 rounded p-6 text-center hover:border-slate-400 transition-colors">
            <UploadCloud className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <div className="text-slate-700 font-medium">Select a local CSV file to ingest</div>
            <p className="text-slate-400 text-[11px] mt-1">Columns: customer_id, date, product_name, category, quantity, total_amount</p>
            <input
              type="file"
              accept=".csv,.txt"
              onChange={handleFileUpload}
              className="mt-3 text-xs text-slate-500 file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-medium file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="font-medium text-slate-700">Or paste raw CSV text:</span>
            <button
              onClick={loadSampleCustom}
              className="text-[11px] text-blue-600 hover:underline cursor-pointer"
            >
              Paste Test Sample (includes missing IDs for cleaning test)
            </button>
          </div>

          <textarea
            rows={6}
            placeholder="customer_id,date,product_name,category,quantity,total_amount&#10;CUST-101,2025-03-01,Merino Crewneck,Apparel,1,88.00"
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded font-mono text-[11px] text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-slate-900"
          ></textarea>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button
            onClick={onClose}
            className="text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={() => parseCsv(csvText)}
            disabled={!csvText.trim()}
            className="px-4 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
          >
            Process & Analyze CSV
          </button>
        </div>
      </div>
    </div>
  );
};
