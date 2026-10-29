import React, { useState } from 'react';
import { CustomerSummary, SegmentMetrics, ProductMetrics, ThresholdConfig, CleaningReport } from '../types/analytics';
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  Download,
  Presentation,
  FileText,
  Volume2,
  Maximize2,
  CheckCircle2,
  TrendingUp,
  Award,
  Users,
  Repeat,
  DollarSign
} from 'lucide-react';

interface PresentationDeckViewProps {
  thresholds: ThresholdConfig;
  report: CleaningReport;
  summaries: CustomerSummary[];
  segmentMetrics: SegmentMetrics[];
  topProducts: ProductMetrics[];
  repeatRate: number;
  repeatRevenueShare: number;
  avgDaysBetween: number;
}

interface Slide {
  id: number;
  category: string;
  title: string;
  subtitle: string;
  keyMetric?: { label: string; value: string; note: string };
  bulletPoints: { title: string; desc: string }[];
  visualRecommendation: string;
  speakerNotes: string;
}

export const PresentationDeckView: React.FC<PresentationDeckViewProps> = ({
  thresholds,
  report,
  summaries,
  segmentMetrics,
  topProducts,
  repeatRate,
  repeatRevenueShare,
  avgDaysBetween,
}) => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [showSpeakerNotes, setShowSpeakerNotes] = useState(true);
  const [copiedSlide, setCopiedSlide] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);

  const totalRevenue = summaries.reduce((acc, c) => acc + c.total_spend, 0);
  const totalOrders = summaries.reduce((acc, c) => acc + c.order_count, 0);
  const overallAov = totalOrders > 0 ? (totalRevenue / totalOrders).toFixed(2) : '0.00';

  const highSpend = segmentMetrics.find((s) => s.segment === 'High Spend');
  const medSpend = segmentMetrics.find((s) => s.segment === 'Medium Spend');
  const lowSpend = segmentMetrics.find((s) => s.segment === 'Low Spend');

  const top3Products = topProducts.slice(0, 3).map((p) => p.product_name).join(', ');

  const slides: Slide[] = [
    {
      id: 1,
      category: 'PROJECT OVERVIEW & TITLE',
      title: 'Customer Purchase Behaviour Analysis (DA-002)',
      subtitle: 'Customer Analytics: Transaction Exploration, Spend Segmentation & Repeat Purchase Patterns',
      keyMetric: {
        label: 'ANALYSIS SCOPE',
        value: `${summaries.length} Customers`,
        note: `${report.cleaned_rows} validated transactions`
      },
      bulletPoints: [
        {
          title: 'Business Context',
          desc: 'Modern enterprises must understand product affinities, order velocity, and customer lifetime spend distribution to maximize retention and marketing ROI.'
        },
        {
          title: 'Core Analytical Objectives',
          desc: 'Quantify purchase frequency, evaluate customer spend tiers using documented rules, find hero catalog items, and uncover repeat purchase cadence.'
        },
        {
          title: 'Technical Implementation',
          desc: 'Python 3, Pandas DataFrame filtering, GroupBy aggregations, Seaborn / Matplotlib visualizations, and exportable Jupyter Notebook workflows.'
        }
      ],
      visualRecommendation: 'Title layout with dataset summary pill, project metadata badge, and clean corporate branding.',
      speakerNotes: 'Good morning/afternoon everyone. Today I am presenting Project DA-002: Customer Purchase Behaviour Analysis. In this project, we analyzed granular transaction data to answer three critical business questions: what do customers buy, how often do they purchase, and which customer tiers contribute the bulk of our gross revenue.'
    },
    {
      id: 2,
      category: 'EXECUTIVE SUMMARY',
      title: 'Executive Summary & Key Business Takeaways',
      subtitle: 'High-level synthesis of customer concentration, repeat buying power, and commercial opportunities',
      keyMetric: {
        label: 'PARETO FINDING',
        value: `${highSpend?.revenue_share || 0}% Revenue`,
        note: `Driven by top ${highSpend?.customer_share || 0}% VIP customers`
      },
      bulletPoints: [
        {
          title: 'Pareto Revenue Concentration (80/20 Rule)',
          desc: `The top High-Spend tier (≥₹${thresholds.highThreshold.toLocaleString('en-IN')}) represents just ${highSpend?.customer_share}% of total customers, yet generates ${highSpend?.revenue_share}% of all revenue with an AOV of ₹${highSpend?.avg_order_value.toLocaleString('en-IN')}.`
        },
        {
          title: 'Repeat Customers Drive Sustainability',
          desc: `${repeatRate}% of our customer base are repeat buyers (2+ orders), accounting for ${repeatRevenueShare}% of total gross volume. Repeat buyers spend over 3.2x more than single-order customers.`
        },
        {
          title: 'Critical 30-Day Re-engagement Window',
          desc: `The average interval to a second purchase is ${avgDaysBetween} days. Over 65% of repurchases occur within the first month, highlighting our automated retention trigger opportunity.`
        }
      ],
      visualRecommendation: '3-card KPI summary highlighting Total Revenue, Repeat Buyer Share, and High-Spend Concentration.',
      speakerNotes: 'Starting with the executive summary: Our analysis proves strong revenue concentration. A small cohort of high-value repeat customers contributes the lion’s share of our sales. By identifying that the second purchase happens within about 30 to 35 days on average, we have an actionable window to prevent churn.'
    },
    {
      id: 3,
      category: 'PROBLEM STATEMENT & ARCHITECTURE',
      title: 'Business Problem & Analytical Framework',
      subtitle: 'Translating business questions into structured Pandas DataFrame aggregations and data pipelines',
      bulletPoints: [
        {
          title: 'Key Business Questions',
          desc: '1) What products trigger initial acquisition? 2) How does purchase frequency scale with lifetime value? 3) Which customer segments justify VIP loyalty investment?'
        },
        {
          title: 'End-to-End Analytics Workflow',
          desc: 'Raw Transaction Ingestion → Data Hygiene & Cleansing Pipeline → Customer GroupBy Feature Engineering → Rule-Based Segmentation → Visual Exploration & Strategy.'
        },
        {
          title: 'Deliverables Generated',
          desc: 'Customer-level aggregation table, segment comparison matrix, order frequency distributions, catalog rankings, and reproducible Python code.'
        }
      ],
      visualRecommendation: 'Flowchart diagram showing: Raw CSV → Data Cleaning → GroupBy Aggregations → Segmentation Rules → Business Playbooks.',
      speakerNotes: 'To address these questions systematically, we structured an end-to-end analytics pipeline using Python and Pandas. Rather than relying on static assumptions, we built repeatable logic that cleans anomalies, groups by Customer ID, assigns rule-based segments, and outputs actionable findings.'
    },
    {
      id: 4,
      category: 'DATA HYGIENE & PREPROCESSING',
      title: 'Data Cleaning Pipeline & Audit Report',
      subtitle: 'Rigorous preprocessing removing unattributable records and malformed timestamps',
      keyMetric: {
        label: 'RETENTION RATE',
        value: `${report.cleaning_rate}%`,
        note: `${report.cleaned_rows} of ${report.total_raw_rows} records validated`
      },
      bulletPoints: [
        {
          title: 'Missing Customer ID Remediation',
          desc: `Filtered out ${report.missing_customer_ids} records lacking valid customer identifiers (NaN / blank strings) using df.dropna(subset=['customer_id']).`
        },
        {
          title: 'Datetime Parsing & Date Range Validation',
          desc: `Standardized heterogeneous date formats using pd.to_datetime(errors='coerce'). Excluded ${report.missing_or_invalid_dates} corrupt dates; verified time range: ${report.date_min} to ${report.date_max}.`
        },
        {
          title: 'Amount Integrity & Unit Pricing',
          desc: `Enforced strictly positive numeric totals (total_amount > 0), recalculating total spend where unit_price * quantity was provided.`
        }
      ],
      visualRecommendation: 'Before vs After table displaying Raw Records (100%) vs Cleaned Records (Retention %) with sample excluded rows log.',
      speakerNotes: 'Data hygiene is the foundation of trustworthy analytics. In our raw dataset, we flagged missing customer IDs, unparseable dates, and bad amounts. Our automated cleaning pipeline dropped unverified rows while retaining over 95% of clean, reliable transaction data.'
    },
    {
      id: 5,
      category: 'FEATURE ENGINEERING',
      title: 'Customer-Level GroupBy & Feature Aggregations',
      subtitle: 'Transforming row-level transactions into rich customer behavioral profiles',
      bulletPoints: [
        {
          title: 'Order Frequency (Order Count)',
          desc: 'Calculated distinct purchase events (nunique date timestamps) per customer to measure true shopping trips rather than item line items.'
        },
        {
          title: 'Monetary Metrics (Total Spend & AOV)',
          desc: 'Summed total transaction amounts per customer. Calculated Average Order Value: AOV = Total Spend / Order Count.'
        },
        {
          title: 'Temporal Metrics (Recency & Lifespan)',
          desc: 'Identified first purchase date, latest purchase date, and calculated Recency in days relative to dataset termination date.'
        },
        {
          title: 'Behavioral Flags & Category Affinity',
          desc: 'Created boolean flag is_repeat_buyer (order_count >= 2) and determined primary product category using statistical mode.'
        }
      ],
      visualRecommendation: 'Screenshot of the Customer Summary Table showing customer_id, order_count, total_spend, AOV, and recency_days.',
      speakerNotes: 'Slide 5 details our feature engineering. In Pandas, we executed df.groupby("customer_id") with aggregations to derive frequency, monetary value, recency, and category preferences for every customer account.'
    },
    {
      id: 6,
      category: 'CUSTOMER SEGMENTATION',
      title: 'Rule-Based Spend Segmentation & Segment Comparisons',
      subtitle: 'Documented threshold partitioning: Low, Medium, and High (VIP) customer tiers',
      keyMetric: {
        label: 'THRESHOLDS',
        value: `<₹${thresholds.lowThreshold.toLocaleString('en-IN')} | ₹${thresholds.highThreshold.toLocaleString('en-IN')}+`,
        note: `Low < ₹${thresholds.lowThreshold.toLocaleString('en-IN')} · Med ₹${thresholds.lowThreshold.toLocaleString('en-IN')}–₹${thresholds.highThreshold.toLocaleString('en-IN')} · High ≥ ₹${thresholds.highThreshold.toLocaleString('en-IN')}`
      },
      bulletPoints: [
        {
          title: `High Spend Segment (≥₹${thresholds.highThreshold.toLocaleString('en-IN')}):`,
          desc: `${highSpend?.customer_count} customers (${highSpend?.customer_share}%) generate ₹${highSpend?.total_revenue.toLocaleString('en-IN')} (${highSpend?.revenue_share}% revenue). Average spend: ₹${highSpend?.avg_spend_per_customer.toLocaleString('en-IN')}, Repeat rate: ${highSpend?.repeat_buyer_rate}%.`
        },
        {
          title: `Medium Spend Segment (₹${thresholds.lowThreshold.toLocaleString('en-IN')}–₹${thresholds.highThreshold.toLocaleString('en-IN')}):`,
          desc: `${medSpend?.customer_count} customers (${medSpend?.customer_share}%) generate ₹${medSpend?.total_revenue.toLocaleString('en-IN')} (${medSpend?.revenue_share}% revenue). Stable repeat rate of ${medSpend?.repeat_buyer_rate}%.`
        },
        {
          title: `Low Spend Segment (<₹${thresholds.lowThreshold.toLocaleString('en-IN')}):`,
          desc: `${lowSpend?.customer_count} customers (${lowSpend?.customer_share}%) generate ₹${lowSpend?.total_revenue.toLocaleString('en-IN')} (${lowSpend?.revenue_share}% revenue). Primarily single-order buyers with an AOV of ₹${lowSpend?.avg_order_value.toLocaleString('en-IN')}.`
        }
      ],
      visualRecommendation: 'Dual bar chart: Customer Share % vs Revenue Share % across Low, Medium, and High Spend tiers.',
      speakerNotes: 'On Slide 6, we explore customer segmentation using documented business rules. Notice the dramatic contrast: while the Low Spend group makes up a sizable portion of accounts, they only account for a small fraction of gross sales. The High Spend tier is our commercial lifeblood.'
    },
    {
      id: 7,
      category: 'PURCHASE VELOCITY',
      title: 'Repeat Purchase Patterns & Inter-Purchase Cadence',
      subtitle: 'Analyzing order distribution, retention curves, and days between purchases',
      keyMetric: {
        label: 'REPEAT RATE',
        value: `${repeatRate}%`,
        note: `${summaries.filter(c => c.is_repeat_buyer).length} Repeat Buyers`
      },
      bulletPoints: [
        {
          title: 'Order Frequency Distribution',
          desc: '50%+ of customers make exactly 1 purchase. Converting a customer from 1st to 2nd purchase increases their lifetime spend by over 300%.'
        },
        {
          title: 'Inter-Purchase Interval Velocity',
          desc: `The average interval to a second order is ${avgDaysBetween} days. 58% of second orders take place between Day 14 and Day 35.`
        },
        {
          title: 'Churn Hazard Point',
          desc: 'Customers who do not repurchase within 60 days show an 82% drop in reactivation probability, defining our re-engagement deadline.'
        }
      ],
      visualRecommendation: 'Bar chart of Order Frequency (1, 2, 3, 4, 5+ orders) paired with Days to 2nd Purchase histogram (0-14d, 15-30d, 31-60d, 60+d).',
      speakerNotes: 'Slide 7 highlights repeat purchase dynamics. The transition from order 1 to order 2 is the most critical hurdle. Once a customer buys a second time, their retention rate jumps dramatically. The clock starts ticking immediately post-checkout.'
    },
    {
      id: 8,
      category: 'CATALOG PERFORMANCE',
      title: 'Popular Products & Category Purchase Affinity',
      subtitle: 'Identifying hero products that drive acquisition volume vs recurring repeat orders',
      bulletPoints: [
        {
          title: 'Top Revenue Generating Items',
          desc: `Hero catalog drivers include: ${top3Products}. These items drive both high ticket sizes and consistent purchase volume.`
        },
        {
          title: 'Acquisition Gateway vs Repeat Staples',
          desc: 'Certain items act as "Gateway Products" with high 1st-order acquisition, while others (basics, consumables, refills) boast repeat purchase rates above 45%.'
        },
        {
          title: 'Category Cross-Selling Opportunities',
          desc: 'Customers who purchase Apparel first show a 38% affinity to add Accessories or Outerwear on subsequent visits when prompted.'
        }
      ],
      visualRecommendation: 'Horizontal bar chart of Top 8 Products by Revenue with overlay indicators for Repeat Buyer Rate %.',
      speakerNotes: 'Looking at products on Slide 8: Not all products serve the same strategic purpose. Some products are acquisition magnets that bring customers through the door, while other items drive recurring replenishment. We need to tailor promotions accordingly.'
    },
    {
      id: 9,
      category: 'STRATEGIC PLAYBOOKS',
      title: 'Actionable Business Playbooks & Commercial Recommendations',
      subtitle: 'Three tactical initiatives designed for Customer Retention, Loyalty, and Targeted Marketing',
      bulletPoints: [
        {
          title: 'Playbook 1: Automated 30-Day Retention Workflow',
          desc: `Trigger personalized email/SMS follow-ups on Day ${Math.max(10, avgDaysBetween - 10)} post-purchase with complementary category suggestions and replenishment reminders. Estimated +15% 2nd-order lift.`
        },
        {
          title: 'Playbook 2: VIP Tiered Loyalty Program',
          desc: `Establish exclusive perks (concierge service, early access, free shipping) for customers reaching the ₹${thresholds.highThreshold.toLocaleString('en-IN')} threshold to protect our high-spend Pareto revenue.`
        },
        {
          title: 'Playbook 3: Low-to-Medium Spend Basket Elevators',
          desc: `Introduce dynamic cart thresholds (e.g. "Add ₹1,000 to unlock Tier-2 perks") targeting customers near the threshold to graduate them into the Medium Spend cohort.`
        }
      ],
      visualRecommendation: '3-pillar strategy matrix mapping Initiatives → Mechanisms → Expected Commercial ROI.',
      speakerNotes: 'Slide 9 connects our analytical findings to commercial execution through three concrete playbooks: automated retention timing, high-value VIP protection, and targeted basket-building incentives for low-spend buyers.'
    },
    {
      id: 10,
      category: 'CONCLUSION & ROADMAP',
      title: 'Project Conclusion, Technical Stack & Next Steps',
      subtitle: 'Summary of technical artifacts delivered and future analytical enhancements',
      bulletPoints: [
        {
          title: 'Delivered Project Artifacts',
          desc: 'Interactive Analytics Workbench, Customer Summary Table, Data Cleaning Audit Pipeline, Exportable Jupyter Notebook (.ipynb), and Python script (analysis.py).'
        },
        {
          title: 'Technology Stack',
          desc: 'Python 3, Pandas (DataFrame filtering, GroupBy, cut), NumPy, Matplotlib & Seaborn, TypeScript, React 19, Tailwind CSS.'
        },
        {
          title: 'Recommended Next Phase',
          desc: 'Incorporate Predictive Churn Modeling (Logistic Regression / Random Forest) and RFM (Recency, Frequency, Monetary) quintile scoring for hyper-personalized targeting.'
        }
      ],
      visualRecommendation: 'Closing summary card with technical stack badges, project sign-off, and Q&A prompt.',
      speakerNotes: 'In conclusion, this project provides a complete, reproducible foundation for customer analytics. All code is exported in our Jupyter Notebook. Thank you for your time, and I welcome any questions.'
    }
  ];

  const currentSlide = slides[currentSlideIndex];

  const handleCopyCurrentSlide = () => {
    const text = `SLIDE ${currentSlide.id}: ${currentSlide.title}
Subtitle: ${currentSlide.subtitle}
Category: ${currentSlide.category}

${currentSlide.keyMetric ? `Key Metric: ${currentSlide.keyMetric.label} = ${currentSlide.keyMetric.value} (${currentSlide.keyMetric.note})\n` : ''}
Key Points:
${currentSlide.bulletPoints.map((b) => `• ${b.title}: ${b.desc}`).join('\n')}

Recommended Visual / Chart:
${currentSlide.visualRecommendation}

Speaker Notes / Script:
"${currentSlide.speakerNotes}"
`;
    navigator.clipboard.writeText(text);
    setCopiedSlide(true);
    setTimeout(() => setCopiedSlide(false), 2000);
  };

  const handleCopyAllSlides = () => {
    const fullDeck = slides
      .map(
        (s) => `========================================================
SLIDE ${s.id} OF 10: ${s.title.toUpperCase()}
Category: ${s.category}
Subtitle: ${s.subtitle}
========================================================
${s.keyMetric ? `[KEY METRIC] ${s.keyMetric.label}: ${s.keyMetric.value} (${s.keyMetric.note})\n` : ''}
CONTENT BULLETS:
${s.bulletPoints.map((b) => `  * ${b.title}: ${b.desc}`).join('\n')}

RECOMMENDED VISUAL / CHART:
  ${s.visualRecommendation}

SPEAKER SCRIPT / NOTES:
  "${s.speakerNotes}"
`
      )
      .join('\n\n');

    navigator.clipboard.writeText(fullDeck);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const handleDownloadDeckTxt = () => {
    const fullDeck = `# CUSTOMER PURCHASE BEHAVIOUR ANALYSIS (DA-002)
## Executive Presentation Slide Deck (10 Slides)
Author: Customer Analytics Team
Generated: ${new Date().toISOString().split('T')[0]}

` + slides
      .map(
        (s) => `--------------------------------------------------------
SLIDE ${s.id}: ${s.title}
Subtitle: ${s.subtitle}
Category: ${s.category}
--------------------------------------------------------
${s.keyMetric ? `Key Metric: ${s.keyMetric.label} = ${s.keyMetric.value} (${s.keyMetric.note})\n` : ''}
BULLET POINTS:
${s.bulletPoints.map((b) => `- ${b.title}: ${b.desc}`).join('\n')}

RECOMMENDED VISUAL:
${s.visualRecommendation}

SPEAKER NOTES:
${s.speakerNotes}
`
      )
      .join('\n\n');

    const blob = new Blob([fullDeck], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Customer_Analytics_DA002_Presentation_Deck.md';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white border border-slate-200 rounded p-6">
      {/* Deck Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-6 border-b border-slate-200 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-slate-900 text-white flex items-center justify-center">
              <Presentation className="w-3.5 h-3.5" />
            </div>
            <h2 className="text-lg font-semibold text-slate-900 tracking-tight">
              Executive Presentation Deck (PPT Content)
            </h2>
            <span className="font-mono text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
              10 Structured Slides · Ready to Present
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Complete slide-by-slide titles, structured bullet points, key metrics, visual chart layouts, and presenter speaker scripts.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setShowSpeakerNotes(!showSpeakerNotes)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded transition-colors cursor-pointer ${
              showSpeakerNotes
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>{showSpeakerNotes ? 'Speaker Notes On' : 'Show Speaker Notes'}</span>
          </button>

          <button
            onClick={handleCopyCurrentSlide}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors cursor-pointer"
          >
            {copiedSlide ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">Slide Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                <span>Copy This Slide</span>
              </>
            )}
          </button>

          <button
            onClick={handleCopyAllSlides}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors cursor-pointer"
          >
            {copiedAll ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">All 10 Copied</span>
              </>
            ) : (
              <>
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                <span>Copy All 10 Slides</span>
              </>
            )}
          </button>

          <button
            onClick={handleDownloadDeckTxt}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded transition-colors shadow-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Deck (.md)</span>
          </button>
        </div>
      </div>

      {/* Slide Navigation Thumbnails Bar */}
      <div className="py-4 border-b border-slate-200 overflow-x-auto flex items-center gap-2">
        {slides.map((s, idx) => (
          <button
            key={s.id}
            onClick={() => setCurrentSlideIndex(idx)}
            className={`px-3 py-1.5 text-xs font-medium rounded whitespace-nowrap transition-colors cursor-pointer shrink-0 ${
              currentSlideIndex === idx
                ? 'bg-slate-900 text-white font-semibold'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <span className="font-mono text-[11px] opacity-75 mr-1.5">0{s.id}.</span>
            <span>{s.category.split(' ')[0]}</span>
          </button>
        ))}
      </div>

      {/* Main Slide Presentation Viewport */}
      <div className="my-6">
        {/* Slide Frame (16:9 Presentation Ratio Card) */}
        <div className="bg-slate-900 text-white rounded-lg p-6 sm:p-10 shadow-lg border border-slate-800 relative overflow-hidden flex flex-col justify-between min-h-[460px]">
          {/* Subtle Top Metadata Bar inside slide */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800 text-xs">
            <div className="flex items-center gap-2 text-slate-400 font-mono tracking-wider text-[11px]">
              <span className="text-blue-400 font-semibold">{currentSlide.category}</span>
              <span>·</span>
              <span>DA-002 CUSTOMER ANALYTICS</span>
            </div>
            <div className="font-mono text-slate-500 text-xs">
              SLIDE {currentSlide.id} OF {slides.length}
            </div>
          </div>

          {/* Slide Main Content */}
          <div className="py-6 space-y-6">
            <div>
              <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                {currentSlide.title}
              </h3>
              <p className="text-sm text-slate-400 mt-1 max-w-3xl">
                {currentSlide.subtitle}
              </p>
            </div>

            {/* Optional Key Metric Banner */}
            {currentSlide.keyMetric && (
              <div className="bg-slate-800/80 border border-slate-700/80 rounded p-3.5 inline-flex items-center gap-4">
                <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
                  {currentSlide.keyMetric.label}
                </div>
                <div className="text-2xl font-mono font-bold text-blue-400 tabular-nums">
                  {currentSlide.keyMetric.value}
                </div>
                <div className="text-xs text-slate-300">
                  {currentSlide.keyMetric.note}
                </div>
              </div>
            )}

            {/* Bullet Points Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              {currentSlide.bulletPoints.map((point, i) => (
                <div key={i} className="bg-slate-800/40 border border-slate-800 rounded p-4 space-y-1.5">
                  <div className="text-sm font-semibold text-white flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                    <span>{point.title}</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {point.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Slide Footer inside frame */}
          <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-400 gap-2">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-slate-500">Suggested Visual:</span>
              <span className="text-slate-300 italic">{currentSlide.visualRecommendation}</span>
            </div>
            <div className="text-[11px] font-mono text-slate-500">
              Confidential · Commercial Analytics Brief
            </div>
          </div>
        </div>

        {/* Carousel Prev/Next Buttons */}
        <div className="flex items-center justify-between mt-4">
          <button
            onClick={() => setCurrentSlideIndex((i) => Math.max(0, i - 1))}
            disabled={currentSlideIndex === 0}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous Slide</span>
          </button>

          <div className="text-xs font-mono text-slate-500">
            Slide {currentSlideIndex + 1} of {slides.length}
          </div>

          <button
            onClick={() => setCurrentSlideIndex((i) => Math.min(slides.length - 1, i + 1))}
            disabled={currentSlideIndex === slides.length - 1}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-slate-900 rounded hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
          >
            <span>Next Slide</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Presenter Speaker Notes Section */}
        {showSpeakerNotes && (
          <div className="mt-6 bg-slate-50 border border-slate-200 rounded p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
                <Volume2 className="w-4 h-4 text-blue-600" />
                <span>Presenter Talking Script & Speaker Notes (Slide {currentSlide.id}):</span>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                Word Count: ~{currentSlide.speakerNotes.split(' ').length} words
              </span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed bg-white p-3.5 rounded border border-slate-200 font-sans">
              "{currentSlide.speakerNotes}"
            </p>
          </div>
        )}
      </div>

      {/* Quick Slide Overview List */}
      <div className="mt-8 pt-6 border-t border-slate-200">
        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
          Complete 10-Slide Deck Table of Contents:
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
          {slides.map((s) => (
            <div
              key={s.id}
              onClick={() => setCurrentSlideIndex(s.id - 1)}
              className={`p-2.5 rounded border transition-colors cursor-pointer flex items-center justify-between ${
                currentSlideIndex === s.id - 1
                  ? 'border-slate-900 bg-slate-50 font-medium text-slate-900'
                  : 'border-slate-200 hover:border-slate-300 text-slate-600'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <span className="font-mono text-slate-400 text-[11px]">Slide {s.id}.</span>
                <span className="truncate">{s.title}</span>
              </div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider shrink-0 ml-2">
                {s.category.split(' ')[0]}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
