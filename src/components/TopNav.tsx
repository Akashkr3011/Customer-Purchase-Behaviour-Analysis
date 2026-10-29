import React from 'react';
import { Download, FileCode, Database } from 'lucide-react';
import { ThresholdConfig } from '../types/analytics';
import { downloadJupyterNotebook, downloadPythonScript } from '../utils/exportUtils';

interface TopNavProps {
  thresholds: ThresholdConfig;
  onOpenCleaningModal: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  thresholds,
  onOpenCleaningModal,
  activeTab,
  setActiveTab,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded bg-slate-900 text-white font-mono font-bold flex items-center justify-center text-xs tracking-wider">
            DA
          </div>
          <span className="text-base font-semibold tracking-tight text-slate-900 whitespace-nowrap">
            Customer Analytics <span className="font-mono text-xs font-normal text-slate-500 ml-1">DA-002</span>
          </span>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          <button
            onClick={() => setActiveTab('overview')}
            className={`whitespace-nowrap shrink-0 transition-colors ${
              activeTab === 'overview'
                ? 'text-slate-900 font-semibold border-b-2 border-slate-900 pb-0.5'
                : 'hover:text-slate-900'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('segmentation')}
            className={`whitespace-nowrap shrink-0 transition-colors ${
              activeTab === 'segmentation'
                ? 'text-slate-900 font-semibold border-b-2 border-slate-900 pb-0.5'
                : 'hover:text-slate-900'
            }`}
          >
            Segmentation
          </button>
          <button
            onClick={() => setActiveTab('repeats')}
            className={`whitespace-nowrap shrink-0 transition-colors ${
              activeTab === 'repeats'
                ? 'text-slate-900 font-semibold border-b-2 border-slate-900 pb-0.5'
                : 'hover:text-slate-900'
            }`}
          >
            Repeat Purchases
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`whitespace-nowrap shrink-0 transition-colors ${
              activeTab === 'products'
                ? 'text-slate-900 font-semibold border-b-2 border-slate-900 pb-0.5'
                : 'hover:text-slate-900'
            }`}
          >
            Top Products
          </button>
          <button
            onClick={() => setActiveTab('customers')}
            className={`whitespace-nowrap shrink-0 transition-colors ${
              activeTab === 'customers'
                ? 'text-slate-900 font-semibold border-b-2 border-slate-900 pb-0.5'
                : 'hover:text-slate-900'
            }`}
          >
            Customer Summary
          </button>
          <button
            onClick={() => setActiveTab('notebook')}
            className={`whitespace-nowrap shrink-0 transition-colors ${
              activeTab === 'notebook'
                ? 'text-slate-900 font-semibold border-b-2 border-slate-900 pb-0.5'
                : 'hover:text-slate-900'
            }`}
          >
            Python Notebook
          </button>
          <button
            onClick={() => setActiveTab('presentation')}
            className={`whitespace-nowrap shrink-0 transition-colors ${
              activeTab === 'presentation'
                ? 'text-slate-900 font-semibold border-b-2 border-slate-900 pb-0.5'
                : 'hover:text-slate-900'
            }`}
          >
            PPT Deck
          </button>
        </nav>

        {/* Zone 3: Primary Action & Clean Audit */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onOpenCleaningModal}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors whitespace-nowrap"
            title="Inspect Data Cleaning Pipeline"
          >
            <Database className="w-3.5 h-3.5 text-slate-500" />
            <span>Cleaning Audit</span>
          </button>

          <button
            onClick={() => downloadJupyterNotebook(thresholds)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded transition-colors whitespace-nowrap shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export .ipynb</span>
          </button>
        </div>
      </div>
    </header>
  );
};
