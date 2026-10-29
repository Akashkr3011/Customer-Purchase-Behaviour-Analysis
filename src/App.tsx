import React, { useState, useMemo } from 'react';
import { RawTransaction, ThresholdConfig, CustomerSummary } from './types/analytics';
import { DATASET_PRESETS, DatasetPreset } from './data/sampleDatasets';
import { cleanTransactionData } from './utils/dataCleaner';
import {
  calculateCustomerSummaries,
  calculateSegmentMetrics,
  calculateProductMetrics,
  calculateRepeatPurchaseAnalysis,
} from './utils/customerAnalytics';
import { TopNav } from './components/TopNav';
import { OverviewKpiStrip } from './components/OverviewKpiStrip';
import { SegmentationWorkbench } from './components/SegmentationWorkbench';
import { RepeatPurchaseAnalysis } from './components/RepeatPurchaseAnalysis';
import { PopularProductsSection } from './components/PopularProductsSection';
import { CustomerSummaryTable } from './components/CustomerSummaryTable';
import { PythonNotebookView } from './components/PythonNotebookView';
import { ActionableInsights } from './components/ActionableInsights';
import { PresentationDeckView } from './components/PresentationDeckView';
import { DataCleaningModal } from './components/DataCleaningModal';
import { CustomerDetailModal } from './components/CustomerDetailModal';
import { UploadModal } from './components/UploadModal';
import { Database, UploadCloud, RefreshCw, Layers, CheckCircle2, FileSpreadsheet, Presentation } from 'lucide-react';

export default function App() {
  const [activePreset, setActivePreset] = useState<DatasetPreset>(DATASET_PRESETS[0]);
  const [rawTransactions, setRawTransactions] = useState<RawTransaction[]>(() =>
    DATASET_PRESETS[0].generator()
  );
  const [datasetName, setDatasetName] = useState<string>(DATASET_PRESETS[0].name);

  const [thresholds, setThresholds] = useState<ThresholdConfig>({
    lowThreshold: DATASET_PRESETS[0].defaultLowThreshold,
    highThreshold: DATASET_PRESETS[0].defaultHighThreshold,
  });

  const [activeTab, setActiveTab] = useState<string>('overview');
  const [activeSegmentFilter, setActiveSegmentFilter] = useState<string>('all');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerSummary | null>(null);

  // Modals
  const [isCleaningModalOpen, setIsCleaningModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // Data Cleaning pipeline
  const { cleaned, report, droppedRows } = useMemo(() => {
    return cleanTransactionData(rawTransactions);
  }, [rawTransactions]);

  // Analytical metrics
  const summaries = useMemo(() => {
    return calculateCustomerSummaries(cleaned, thresholds);
  }, [cleaned, thresholds]);

  const segmentMetrics = useMemo(() => {
    return calculateSegmentMetrics(summaries);
  }, [summaries]);

  const productMetrics = useMemo(() => {
    return calculateProductMetrics(cleaned);
  }, [cleaned]);

  const repeatAnalysis = useMemo(() => {
    return calculateRepeatPurchaseAnalysis(summaries, cleaned);
  }, [summaries, cleaned]);

  const handleSelectPreset = (preset: DatasetPreset) => {
    setActivePreset(preset);
    setRawTransactions(preset.generator());
    setDatasetName(preset.name);
    setThresholds({
      lowThreshold: preset.defaultLowThreshold,
      highThreshold: preset.defaultHighThreshold,
    });
  };

  const handleCustomDataLoaded = (data: RawTransaction[], name: string) => {
    setRawTransactions(data);
    setDatasetName(name);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900">
      {/* Top Bar Navigation */}
      <TopNav
        thresholds={thresholds}
        onOpenCleaningModal={() => setIsCleaningModalOpen(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Sub-Header / Workspace Context Banner */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">Dataset:</span>
              <select
                value={activePreset.id}
                onChange={(e) => {
                  const p = DATASET_PRESETS.find((d) => d.id === e.target.value);
                  if (p) handleSelectPreset(p);
                }}
                className="text-xs font-semibold text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded px-2.5 py-1 focus:outline-hidden cursor-pointer"
              >
                {DATASET_PRESETS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.industry})
                  </option>
                ))}
              </select>
            </div>

            <span className="text-slate-300 hidden sm:inline" aria-hidden="true">|</span>

            {/* Cleaning Audit Quick Trigger */}
            <button
              onClick={() => setIsCleaningModalOpen(true)}
              className="text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>
                {report.cleaned_rows} cleaned records ({report.cleaning_rate}% retained)
              </span>
            </button>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setActiveTab('presentation')}
              className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded transition-colors cursor-pointer ${
                activeTab === 'presentation'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-700 bg-blue-50 border border-blue-200 hover:bg-blue-100'
              }`}
            >
              <Presentation className="w-3.5 h-3.5 text-blue-600" />
              <span>PPT Slide Deck</span>
            </button>

            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors cursor-pointer"
            >
              <UploadCloud className="w-3.5 h-3.5 text-slate-500" />
              <span>Upload Custom CSV</span>
            </button>

            <button
              onClick={() => handleSelectPreset(activePreset)}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
              title="Reload sample dataset"
            >
              <RefreshCw className="w-3 h-3 text-slate-400" />
              <span>Reset Data</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Viewport */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 space-y-8 w-full">
        {/* KPI Metric Strip */}
        <OverviewKpiStrip
          summaries={summaries}
          segmentMetrics={segmentMetrics}
          totalTransactions={cleaned.length}
          repeatRate={repeatAnalysis.repeatRate}
          repeatBuyerCount={repeatAnalysis.repeatBuyerCount}
          report={report}
        />

        {/* Dynamic Views Based on Active Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Rule-Based Spend Segmentation */}
            <SegmentationWorkbench
              segmentMetrics={segmentMetrics}
              thresholds={thresholds}
              onUpdateThresholds={setThresholds}
              onSelectSegmentFilter={(seg) => {
                setActiveSegmentFilter(seg);
                setActiveTab('customers');
              }}
            />

            {/* Repeat Purchases Section */}
            <RepeatPurchaseAnalysis
              repeatBuyerCount={repeatAnalysis.repeatBuyerCount}
              oneTimeBuyerCount={repeatAnalysis.oneTimeBuyerCount}
              repeatRate={repeatAnalysis.repeatRate}
              repeatRevenue={repeatAnalysis.repeatRevenue}
              oneTimeRevenue={repeatAnalysis.oneTimeRevenue}
              repeatRevenueShare={repeatAnalysis.repeatRevenueShare}
              orderDistribution={repeatAnalysis.orderDistribution}
              cadence={repeatAnalysis.cadence}
              avgDaysBetween={repeatAnalysis.avgDaysBetween}
            />

            {/* Popular Products */}
            <PopularProductsSection products={productMetrics} />

            {/* Actionable Insights */}
            <ActionableInsights
              repeatRate={repeatAnalysis.repeatRate}
              repeatRevenueShare={repeatAnalysis.repeatRevenueShare}
              segmentMetrics={segmentMetrics}
              thresholds={thresholds}
              avgDaysBetween={repeatAnalysis.avgDaysBetween}
            />

            {/* Customer Summary Table Teaser */}
            <CustomerSummaryTable
              summaries={summaries}
              onSelectCustomer={(c) => setSelectedCustomer(c)}
              activeSegmentFilter={activeSegmentFilter}
              setActiveSegmentFilter={setActiveSegmentFilter}
            />
          </div>
        )}

        {activeTab === 'segmentation' && (
          <div className="space-y-8">
            <SegmentationWorkbench
              segmentMetrics={segmentMetrics}
              thresholds={thresholds}
              onUpdateThresholds={setThresholds}
              onSelectSegmentFilter={(seg) => {
                setActiveSegmentFilter(seg);
                setActiveTab('customers');
              }}
            />
            <ActionableInsights
              repeatRate={repeatAnalysis.repeatRate}
              repeatRevenueShare={repeatAnalysis.repeatRevenueShare}
              segmentMetrics={segmentMetrics}
              thresholds={thresholds}
              avgDaysBetween={repeatAnalysis.avgDaysBetween}
            />
          </div>
        )}

        {activeTab === 'repeats' && (
          <div className="space-y-8">
            <RepeatPurchaseAnalysis
              repeatBuyerCount={repeatAnalysis.repeatBuyerCount}
              oneTimeBuyerCount={repeatAnalysis.oneTimeBuyerCount}
              repeatRate={repeatAnalysis.repeatRate}
              repeatRevenue={repeatAnalysis.repeatRevenue}
              oneTimeRevenue={repeatAnalysis.oneTimeRevenue}
              repeatRevenueShare={repeatAnalysis.repeatRevenueShare}
              orderDistribution={repeatAnalysis.orderDistribution}
              cadence={repeatAnalysis.cadence}
              avgDaysBetween={repeatAnalysis.avgDaysBetween}
            />
            <ActionableInsights
              repeatRate={repeatAnalysis.repeatRate}
              repeatRevenueShare={repeatAnalysis.repeatRevenueShare}
              segmentMetrics={segmentMetrics}
              thresholds={thresholds}
              avgDaysBetween={repeatAnalysis.avgDaysBetween}
            />
          </div>
        )}

        {activeTab === 'products' && (
          <div className="space-y-8">
            <PopularProductsSection products={productMetrics} />
          </div>
        )}

        {activeTab === 'customers' && (
          <div className="space-y-8">
            <CustomerSummaryTable
              summaries={summaries}
              onSelectCustomer={(c) => setSelectedCustomer(c)}
              activeSegmentFilter={activeSegmentFilter}
              setActiveSegmentFilter={setActiveSegmentFilter}
            />
          </div>
        )}

        {activeTab === 'notebook' && (
          <div className="space-y-8">
            <PythonNotebookView
              thresholds={thresholds}
              report={report}
              summaries={summaries}
              segmentMetrics={segmentMetrics}
              topProducts={productMetrics}
            />
          </div>
        )}

        {activeTab === 'presentation' && (
          <div className="space-y-8">
            <PresentationDeckView
              thresholds={thresholds}
              report={report}
              summaries={summaries}
              segmentMetrics={segmentMetrics}
              topProducts={productMetrics}
              repeatRate={repeatAnalysis.repeatRate}
              repeatRevenueShare={repeatAnalysis.repeatRevenueShare}
              avgDaysBetween={repeatAnalysis.avgDaysBetween}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800">DA-002 Customer Analytics</span>
            <span>·</span>
            <span>Customer Purchase Behaviour & Segmentation Analysis</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsCleaningModalOpen(true)}
              className="hover:text-slate-900 cursor-pointer"
            >
              Data Cleaning Audit
            </button>
            <button
              onClick={() => setActiveTab('notebook')}
              className="hover:text-slate-900 cursor-pointer"
            >
              Python / Jupyter Code
            </button>
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="hover:text-slate-900 cursor-pointer"
            >
              Upload CSV
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <DataCleaningModal
        isOpen={isCleaningModalOpen}
        onClose={() => setIsCleaningModalOpen(false)}
        report={report}
        droppedRows={droppedRows}
      />

      <CustomerDetailModal
        customer={selectedCustomer}
        transactions={cleaned}
        onClose={() => setSelectedCustomer(null)}
      />

      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onDataLoaded={handleCustomDataLoaded}
      />
    </div>
  );
}
