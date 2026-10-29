import React, { useState, useMemo } from 'react';
import { RawTransaction, ThresholdConfig, CustomerSummary, SpendSegment } from './types/analytics';
import { DATASET_PRESETS, DatasetPreset } from './data/sampleDatasets';
import { cleanTransactionData } from './utils/dataCleaner';
import {
  calculateCustomerSummaries,
  calculateSegmentMetrics,
  calculateProductMetrics,
  calculateRepeatPurchaseAnalysis,
  calculateMonthlyTrends,
  calculateSpendDistribution,
} from './utils/customerAnalytics';
import { OverviewKpiStrip } from './components/OverviewKpiStrip';
import { AnalyticsChartsGrid } from './components/AnalyticsChartsGrid';
import { InteractiveFilterBar } from './components/InteractiveFilterBar';
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
import {
  LayoutDashboard,
  Layers,
  Repeat,
  Package,
  Users,
  Code2,
  Presentation,
  CheckCircle2,
  UploadCloud,
  RefreshCw,
  Menu,
  X,
  FileSpreadsheet,
  IndianRupee,
} from 'lucide-react';

export default function App() {
  const [activePreset, setActivePreset] = useState<DatasetPreset>(DATASET_PRESETS[0]);
  const [rawTransactions, setRawTransactions] = useState<RawTransaction[]>(() =>
    DATASET_PRESETS[0].generator()
  );
  const [datasetName, setDatasetName] = useState<string>(DATASET_PRESETS[0].name);

  // Configurable spending thresholds (₹)
  const [thresholds, setThresholds] = useState<ThresholdConfig>({
    lowThreshold: DATASET_PRESETS[0].defaultLowThreshold,
    highThreshold: DATASET_PRESETS[0].defaultHighThreshold,
  });

  const [activeTab, setActiveTab] = useState<string>('overview');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerSummary | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Interactive filters
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<string>('all');
  const [selectedSegment, setSelectedSegment] = useState<string>('all');

  // Modals
  const [isCleaningModalOpen, setIsCleaningModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // 1. Data Cleaning pipeline
  const { cleaned, report, droppedRows } = useMemo(() => {
    return cleanTransactionData(rawTransactions);
  }, [rawTransactions]);

  // Available unique products for dropdown
  const availableProducts = useMemo(() => {
    const set = new Set<string>();
    cleaned.forEach((t) => set.add(t.product_name));
    return Array.from(set).sort();
  }, [cleaned]);

  // 2. Interactive filtering
  const filteredCleaned = useMemo(() => {
    return cleaned.filter((t) => {
      if (startDate && t.date < startDate) return false;
      if (endDate && t.date > endDate) return false;
      if (selectedProduct !== 'all' && t.product_name !== selectedProduct) return false;
      return true;
    });
  }, [cleaned, startDate, endDate, selectedProduct]);

  // 3. Customer-level summaries from filtered records
  const allSummaries = useMemo(() => {
    return calculateCustomerSummaries(filteredCleaned, thresholds);
  }, [filteredCleaned, thresholds]);

  // Customer summaries filtered by segment
  const summaries = useMemo(() => {
    if (selectedSegment === 'all') return allSummaries;
    return allSummaries.filter((c) => c.spend_segment === selectedSegment);
  }, [allSummaries, selectedSegment]);

  // 4. Aggregations & Metrics
  const segmentMetrics = useMemo(() => {
    return calculateSegmentMetrics(allSummaries);
  }, [allSummaries]);

  const productMetrics = useMemo(() => {
    return calculateProductMetrics(filteredCleaned);
  }, [filteredCleaned]);

  const repeatAnalysis = useMemo(() => {
    return calculateRepeatPurchaseAnalysis(summaries, filteredCleaned);
  }, [summaries, filteredCleaned]);

  const monthlyTrends = useMemo(() => {
    return calculateMonthlyTrends(filteredCleaned);
  }, [filteredCleaned]);

  const spendDistribution = useMemo(() => {
    return calculateSpendDistribution(summaries);
  }, [summaries]);

  const handleSelectPreset = (preset: DatasetPreset) => {
    setActivePreset(preset);
    setRawTransactions(preset.generator());
    setDatasetName(preset.name);
    setThresholds({
      lowThreshold: preset.defaultLowThreshold,
      highThreshold: preset.defaultHighThreshold,
    });
    // Reset filters
    setStartDate('');
    setEndDate('');
    setSelectedProduct('all');
    setSelectedSegment('all');
  };

  const handleCustomDataLoaded = (data: RawTransaction[], name: string) => {
    setRawTransactions(data);
    setDatasetName(name);
    setStartDate('');
    setEndDate('');
    setSelectedProduct('all');
    setSelectedSegment('all');
  };

  const handleResetFilters = () => {
    setStartDate('');
    setEndDate('');
    setSelectedProduct('all');
    setSelectedSegment('all');
  };

  const navItems = [
    { id: 'overview', label: 'Overview Dashboard', icon: LayoutDashboard },
    { id: 'segmentation', label: 'Spending Segmentation', icon: Layers },
    { id: 'repeats', label: 'Repeat Purchases', icon: Repeat },
    { id: 'products', label: 'Popular Products', icon: Package },
    { id: 'customers', label: 'Customer Summary', icon: Users },
    { id: 'notebook', label: 'Python / Jupyter', icon: Code2 },
    { id: 'presentation', label: 'PPT Slide Deck', icon: Presentation },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row text-slate-900 font-sans antialiased">
      {/* Mobile Top Header */}
      <header className="md:hidden bg-slate-900 text-white px-4 py-3 flex items-center justify-between sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white"
          >
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="w-7 h-7 rounded bg-blue-600 text-white font-mono font-bold flex items-center justify-center text-xs">
            DA
          </div>
          <span className="font-semibold text-sm">Customer Analytics (DA-002)</span>
        </div>
        <button
          onClick={() => setIsUploadModalOpen(true)}
          className="p-1.5 text-slate-300 hover:text-white"
        >
          <UploadCloud className="w-5 h-5" />
        </button>
      </header>

      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 flex flex-col transition-transform duration-200 ease-in-out md:static md:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-mono font-bold flex items-center justify-center text-sm shadow-sm">
              DA
            </div>
            <div>
              <div className="font-bold text-white text-sm tracking-tight">Customer Analytics</div>
              <div className="text-[11px] font-mono text-slate-400">DA-002 • ₹ INR</div>
            </div>
          </div>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="md:hidden p-1 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dataset Ingestion Badge */}
        <div className="p-4 border-b border-slate-800/80 bg-slate-950/40">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Active Dataset
          </div>
          <select
            value={activePreset.id}
            onChange={(e) => {
              const p = DATASET_PRESETS.find((d) => d.id === e.target.value);
              if (p) handleSelectPreset(p);
            }}
            className="w-full text-xs font-semibold text-white bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 focus:outline-hidden cursor-pointer"
          >
            {DATASET_PRESETS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <div className="flex items-center justify-between mt-2 text-[11px] text-slate-400">
            <button
              onClick={() => setIsCleaningModalOpen(true)}
              className="flex items-center gap-1 hover:text-emerald-400 cursor-pointer text-emerald-500"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{report.cleaning_rate}% Clean</span>
            </button>
            <button
              onClick={() => handleSelectPreset(activePreset)}
              className="hover:text-white flex items-center gap-1 cursor-pointer"
              title="Reset data"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer Action */}
        <div className="p-4 border-t border-slate-800 space-y-2">
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors cursor-pointer"
          >
            <UploadCloud className="w-3.5 h-3.5 text-blue-400" />
            <span>Upload CSV / Excel</span>
          </button>
          <div className="text-[10px] text-center text-slate-500 font-mono">
            {cleaned.length} rows • ₹ INR currency
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Workspace Bar (Desktop) */}
        <header className="hidden md:flex bg-white border-b border-slate-200 px-8 py-3.5 items-center justify-between sticky top-0 z-30 shadow-xs">
          <div className="flex items-center gap-4">
            <span className="text-xs font-semibold text-slate-500">Current Scope:</span>
            <span className="text-xs font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
              {datasetName}
            </span>
            <button
              onClick={() => setIsCleaningModalOpen(true)}
              className="text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1.5 cursor-pointer font-medium"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>
                {report.cleaned_rows} clean records ({report.cleaning_rate}% retained)
              </span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('presentation')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                activeTab === 'presentation'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-700 bg-blue-50 border border-blue-200 hover:bg-blue-100'
              }`}
            >
              <Presentation className="w-3.5 h-3.5 text-blue-600" />
              <span>PPT Deck</span>
            </button>

            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer shadow-xs"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Upload Dataset</span>
            </button>
          </div>
        </header>

        {/* Viewport Container */}
        <main className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto">
          {/* Interactive Multi-Filter Bar */}
          <InteractiveFilterBar
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
            selectedProduct={selectedProduct}
            onProductChange={setSelectedProduct}
            availableProducts={availableProducts}
            selectedSegment={selectedSegment}
            onSegmentChange={setSelectedSegment}
            onResetFilters={handleResetFilters}
            totalFilteredTransactions={filteredCleaned.length}
            totalRawTransactions={cleaned.length}
          />

          {/* 5 Core KPI Metric Cards */}
          <OverviewKpiStrip
            summaries={summaries}
            segmentMetrics={segmentMetrics}
            totalTransactions={filteredCleaned.length}
            repeatRate={repeatAnalysis.repeatRate}
            repeatBuyerCount={repeatAnalysis.repeatBuyerCount}
            report={report}
          />

          {/* TAB 1: OVERVIEW DASHBOARD */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Core 8 Analytical Visualizations Grid */}
              <AnalyticsChartsGrid
                monthlyTrends={monthlyTrends}
                productMetrics={productMetrics}
                segmentMetrics={segmentMetrics}
                summaries={summaries}
                repeatRate={repeatAnalysis.repeatRate}
                repeatBuyerCount={repeatAnalysis.repeatBuyerCount}
                oneTimeBuyerCount={repeatAnalysis.oneTimeBuyerCount}
                repeatRevenue={repeatAnalysis.repeatRevenue}
                oneTimeRevenue={repeatAnalysis.oneTimeRevenue}
                orderDistribution={repeatAnalysis.orderDistribution}
                spendDistribution={spendDistribution}
              />

              {/* Actionable Insights */}
              <ActionableInsights
                repeatRate={repeatAnalysis.repeatRate}
                repeatRevenueShare={repeatAnalysis.repeatRevenueShare}
                segmentMetrics={segmentMetrics}
                thresholds={thresholds}
                avgDaysBetween={repeatAnalysis.avgDaysBetween}
              />

              {/* Segmentation Workbench Section */}
              <SegmentationWorkbench
                segmentMetrics={segmentMetrics}
                thresholds={thresholds}
                onUpdateThresholds={setThresholds}
                onSelectSegmentFilter={(seg) => {
                  setSelectedSegment(seg);
                  setActiveTab('customers');
                }}
              />

              {/* Customer Summary Table */}
              <CustomerSummaryTable
                summaries={summaries}
                onSelectCustomer={(c) => setSelectedCustomer(c)}
                activeSegmentFilter={selectedSegment}
                setActiveSegmentFilter={setSelectedSegment}
              />
            </div>
          )}

          {/* TAB 2: SPENDING SEGMENTATION */}
          {activeTab === 'segmentation' && (
            <div className="space-y-8">
              <SegmentationWorkbench
                segmentMetrics={segmentMetrics}
                thresholds={thresholds}
                onUpdateThresholds={setThresholds}
                onSelectSegmentFilter={(seg) => {
                  setSelectedSegment(seg);
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

          {/* TAB 3: REPEAT PURCHASES */}
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

          {/* TAB 4: POPULAR PRODUCTS */}
          {activeTab === 'products' && (
            <div className="space-y-8">
              <PopularProductsSection products={productMetrics} />
            </div>
          )}

          {/* TAB 5: CUSTOMER SUMMARY */}
          {activeTab === 'customers' && (
            <div className="space-y-8">
              <CustomerSummaryTable
                summaries={summaries}
                onSelectCustomer={(c) => setSelectedCustomer(c)}
                activeSegmentFilter={selectedSegment}
                setActiveSegmentFilter={setSelectedSegment}
              />
            </div>
          )}

          {/* TAB 6: PYTHON NOTEBOOK */}
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

          {/* TAB 7: PPT SLIDE DECK */}
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

        {/* Global Footer */}
        <footer className="mt-auto border-t border-slate-200 bg-white py-5 px-6">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800">Project DA-002: Customer Purchase Behaviour Analysis</span>
              <span>•</span>
              <span>Indian Rupees (₹)</span>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsCleaningModalOpen(true)}
                className="hover:text-slate-900 cursor-pointer font-medium"
              >
                Data Cleaning Audit
              </button>
              <button
                onClick={() => setActiveTab('notebook')}
                className="hover:text-slate-900 cursor-pointer font-medium"
              >
                Python / Jupyter Pipeline
              </button>
              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="hover:text-slate-900 cursor-pointer font-medium"
              >
                Upload CSV / Excel
              </button>
            </div>
          </div>
        </footer>
      </div>

      {/* Global Modals */}
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
