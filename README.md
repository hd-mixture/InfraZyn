# DevTeXhHub (Team InfraZyn - SIH26103)

> **"Predict. Monitor. Prevent."**  
> AI-Powered Integrated Infrastructure Project Monitoring & Early Warning Platform.

DevTeXhHub is an integrated project management and national-scale infrastructure intelligence platform. Built for the **Smart India Hackathon (Problem Statement ID: SIH26103)**, it unites enterprise development workflows with a scientifically grounded, multi-tier infrastructure prediction architecture inspired by **MoSPI / IPMD PAIMANA & OCMS** standards.

---

## 🏗️ Highlights & Core Capabilities

### 1. Three-Tier Scientific Risk Architecture
- **Tier 1: Explainable Deterministic Risk Scoring Engine ($0–100$)**
  - Transparent composite risk score calculated from Cost Overruns ($30\%$), Schedule Slippage ($30\%$), Progress Variance ($25\%$), and Corridor / Geotechnical Complexity ($15\%$).
  - Delivers zero-black-box decision support with actionable nodal recommendations.
- **Tier 2: Statistical Baseline Model**
  - Multivariate Logistic Regression and OLS benchmarks providing an interpretable empirical baseline.
- **Tier 3: Machine Learning Model Pipeline (XGBoost Ensemble)**
  - Non-linear ensemble model capturing complex interaction terms (e.g., expenditure velocity vs. S-curve progress gap).
  - Out-of-time temporal holdout validation demonstrates empirical lift on schedule delay prediction ($83.17\%$ accuracy, $0.8786$ F1, $0.9072$ ROC-AUC).

### 2. Strict Data Leakage Prevention & Temporal Validation
- Guaranteed zero-leakage contracts segregating known-at-prediction features from post-facto realization outcome labels.
- Temporal train/test splitting ($\le 2023$ train fold vs. $2024–2026$ test fold) to prevent chronological leakage in infrastructure time-series.

### 3. Integrated Python FastAPI ML Microservice (`services/ml-service/`)
- Independent REST microservice serving trained Scikit-Learn and XGBoost pipelines on port `8000`.
- Endpoints for `/health`, `/metadata`, `/feature-importance`, and real-time on-demand project inference `/predict`.

### 4. Comprehensive Infrastructure Monitoring Suite
- **National Projects Registry**: 16 flagship projects across Indian Railways, Highways, Power, Ports, and Petroleum.
- **14-Section Deep-Dive Project Dossiers**: Milestone tracking, S-curves, contractual bottlenecks, early warning triggers, and live ML inference.
- **Risk Monitor Matrix**: Quadrant mapping of high-cost and high-schedule risks.
- **Automated Early Warning Signals**: Proactive alerts on cost surges, critical timeline slips, and compounding variance.
- **Genkit / Gemini AI Infrastructure Assistant**: Conversational agent providing contextual project intelligence and natural language queries.

### 5. Role-Based Software Project Management (DevTeXhHub Core)
- Distinct role-based dashboards for **Admins**, **Managers**, **Developers**, **QAs**, and **Designers**.
- Kanban-style task boards, time logs, user management, and notifications.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend Framework** | Next.js 15 (App Router), React 19, TypeScript 5 |
| **Styling & Design System** | Tailwind CSS v4, Lucide Icons, Shadcn UI Components |
| **Machine Learning Service** | Python 3.12, FastAPI, Uvicorn, Scikit-Learn, XGBoost, Pandas, NumPy |
| **AI / Large Language Models** | Google Genkit, Google Gemini 2.5 Flash |
| **Backend & Database** | Firebase (Firestore, Authentication) |
| **Validation & State** | Zod, Pydantic, SWR / React Hooks |

---

## 🚀 Getting Started

### Prerequisites
- Node.js $\ge 18.18$
- Python $\ge 3.10$
- npm or yarn

### 1. Clone the Repository
```bash
git clone https://github.com/hd-mixture/DevTeXhHub.git
cd DevTeXhHub
```

### 2. Install Frontend Dependencies
```bash
npm install
```

### 3. Setup & Start the Python ML Microservice
```bash
# In a separate terminal or background process:
pip install -r services/ml-service/requirements.txt

# Run automated test suite (6/6 tests passing)
python services/ml-service/test_service.py

# Start FastAPI server on port 8000
python services/ml-service/main.py
```
*API documentation available at `http://127.0.0.1:8000/docs`.*

### 4. Start Next.js Frontend
```bash
npm run dev -- -p 9005
```
Open [http://localhost:9005](http://localhost:9005) in your browser.

---

## 🧪 Verification & Testing Commands

- **Frontend Typecheck**: `npm run typecheck`
- **Python ML Service Tests**: `python services/ml-service/test_service.py`
- **Model Training Pipeline**: `python services/ml-service/train.py`

---

## 📚 Methodology Documentation

For in-depth mathematical formulations, feature contracts, anti-leakage rules, and temporal split protocols, refer to [docs/RESEARCH_AND_METHODOLOGY.md](docs/RESEARCH_AND_METHODOLOGY.md) and [walkthrough.md](walkthrough.md).

---

## 👥 Team InfraZyn

- **Hackathon:** Smart India Hackathon (SIH)
- **Problem Statement ID:** SIH26103
- **Tagline:** *"Predict. Monitor. Prevent."*
