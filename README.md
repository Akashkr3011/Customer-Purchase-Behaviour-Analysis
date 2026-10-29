# 📊 Customer Analytics: Purchase Behaviour (DA-002)

An end-to-end customer purchase behaviour analytics platform designed to analyze transaction patterns, customer frequency dynamics, and revenue concentration using rule-based spend segmentation.

---

## 🚀 Key Highlights & Insights

- **Pareto Concentration (80/20 Rule):** The top **High-Spend (VIP)** segment contributes **~63.3% of total revenue** while representing only **26% of customers**.
- **Repeat Buyer Multiplier:** Repeat buyers (2+ orders) generate **82.3% of total gross sales**, spending ~4.7x more lifetime value compared to one-time buyers.
- **Critical Retention Window:** Peak repeat purchases occur within the **first 30 to 35 days**. Automated retention triggers between **Day 14 and Day 28** capture peak conversion before churn decay.

---

## 🛠️ Segmentation Rules (Indian Rupees - ₹)

| Segment | Documented Threshold | Revenue Share | Avg Orders | Avg Order Value (AOV) | Repeat Rate |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Low Spend** | `< ₹5,000` | 4.8% | 1.04 | ₹2,631 | 3.9% |
| **Medium Spend** | `₹5,000 – ₹20,000` | 31.8% | 1.81 | ₹6,124 | 49.6% |
| **High Spend (VIP)** | `≥ ₹20,000` | 63.3% | 5.38 | ₹7,212 | 98.6% |

---

## 📦 Features

- **Automated Data Cleaning Pipeline:** Audits and fixes missing Customer IDs, unparseable date formats, and transaction totals with a **>94% data retention rate**.
- **Customer Feature Engineering:** Groups line-item orders into customer profiles tracking `total_spend`, `order_count`, `AOV`, `recency_days`, and top product category.
- **Repeat Purchase Cadence Analysis:** Visualizes inter-purchase day intervals and cohort frequency decay.
- **Hero Product Catalog Affinity:** Identifies acquisition drivers vs. recurring replenishment items.
- **Actionable Strategic Playbooks:** Includes automated post-checkout workflows, tiered VIP loyalty frameworks, and cart-threshold accelerators.
- **Interactive Presentation Deck:** Built-in 10-slide executive summary presentation with speaker notes.

---

## 💻 Tech Stack

- **Frontend / UI:** React 19, TypeScript, Tailwind CSS, Lucide Icons
- **Data Engineering & Analytics:** Python 3, Pandas, NumPy, Matplotlib, Seaborn
- **Environment:** Jupyter Notebook (`.ipynb`) & Standalone Python Scripts

---

## ⚙️ Quick Start

### 1. Clone the repository
```bash
git clone [https://github.com/your-username/customer-analytics-da002.git](https://github.com/your-username/customer-analytics-da002.git)
cd customer-analytics-da002
