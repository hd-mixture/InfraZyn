# DevTeXhHub — AI-Powered Infrastructure Project Intelligence & Early Warning Platform

**Hackathon:** Smart India Hackathon (SIH)  
**Problem Statement ID:** SIH26103  
**Problem Statement:** *"Use case on web-based integrated project-monitoring platform"*  
**Team:** InfraZyn  
**Project Tagline:** *"Predict. Monitor. Prevent."*  
**Domain:** Ministry of Statistics and Programme Implementation (MoSPI) / Infrastructure and Project Monitoring Division (IPMD) PAIMANA / OCMS Platform

---

## Executive Overview: SIH26103 Indicative Solutions & Expected Outcomes

DevTeXhHub (by Team **InfraZyn**) delivers a comprehensive, scientifically credible, web-based integrated project-monitoring platform engineered to prevent cost and time overruns in central sector infrastructure projects ($\ge ₹150\text{ Cr}$).

The platform **fully covers all 9 Expected Outcomes (a through i)** specified in the SIH26103 evaluation criteria:

| Outcome Code | Expected Outcome (SIH26103) | Platform Module / Implementation | Technical Architecture | Primary UI View |
| :---: | :--- | :--- | :--- | :--- |
| **a** | **Cost Overrun Prediction Model** | `services/ml-service/` (`POST /predict`), `ml-engine.ts` | Scikit-Learn Logistic Regression Baseline + XGBoost Classifier ($N=1,200$ longitudinal dataset, temporal split) | Model Insights & Project Dossier |
| **b** | **Time Overrun Prediction Model** | `services/ml-service/` (`POST /predict`), `ml-engine.ts` | XGBoost Decision Tree Ensemble (**83.17% Accuracy, 0.9072 ROC-AUC, +6.42% lift** over baseline) | Model Insights & Project Dossier |
| **c** | **Project Risk Scoring Framework** | `src/lib/infrastructure/risk-engine.ts` | Transparent **0–100 Weighted Composite Score** (Cost 30%, Schedule 30%, Progress 25%, Complexity 15%) | Executive Risk Monitor & Dossier |
| **d** | **Early Warning Alert System** | `src/lib/infrastructure/early-warning-engine.ts` | Automated multi-condition trigger engine with prioritized nodal ministry intervention directives | Early Warnings Center |
| **e** | **Benchmarking & Comparative Analytics** | `src/lib/infrastructure/benchmarking.ts` | Cross-sector performance benchmarking, milestone variance percentiles, and S-Curve execution lag | Benchmarking Module & Project Dossier |
| **f** | **Cost Escalation Driver Analysis** | `src/lib/infrastructure/cost-drivers.ts` | Root-cause factor attribution and ranked XGBoost feature gain weights with non-causal statistical interpretations | Model Insights & Project Detail |
| **g** | **AI-Powered Monitoring Dashboard** | `src/components/infrastructure/infra-dashboard.tsx` | Comprehensive Next.js 15 enterprise console tracking 16 national infrastructure projects with real-time KPIs | Central Dashboard (`/?view=overview`) |
| **h** | **LLM-Enabled Project Intelligence Assistant** | `src/components/infrastructure/infra-ai-assistant.tsx` | Conversational infrastructure copilot powered by Google Gemini and Genkit with RAG-style portfolio querying | AI Copilot (`/?view=ai-assistant`) |
| **i** | **Documentation & Deployment Framework** | `docs/RESEARCH_AND_METHODOLOGY.md`, `services/ml-service/` | End-to-end Python FastAPI microservice, REST OpenAPI docs, temporal split methodology, and Next.js frontend | `/docs` & Research Whitepaper |

---

## Detailed Breakdown of Implemented Outcomes

### Outcome A: Cost Overrun Prediction Model
- **Algorithm:** Dual-tier architecture featuring a Multivariate Logistic Regression Baseline benchmarked against an XGBoost Decision Tree Ensemble.
- **Validation Strategy:** Chronological temporal holdout split ($N_{\text{train}} = 701 \le \text{2023}$, $N_{\text{test}} = 499 > \text{2023}$) guaranteeing zero-hindsight leakage.
- **Performance:** Evaluated on forward out-of-time test snapshots: **84.97% Baseline Accuracy (0.9079 ROC-AUC)** and **82.57% XGBoost Accuracy (0.8748 ROC-AUC)**.
- **Service Endpoint:** Served via REST at `POST http://127.0.0.1:8000/predict`.

### Outcome B: Time Overrun Prediction Model
- **Algorithm:** XGBoost Decision Tree Classifier capturing non-linear interaction terms ($\text{Expenditure Intensity} \times \text{Execution Gap}$).
- **Empirical Lift:** Demonstrates statistically significant superiority over linear baselines:
  - **Accuracy:** **83.17%** ($+6.42\%$ lift over baseline)
  - **F1 Score:** **0.8786** ($+6.16\%$ lift over baseline)
  - **ROC-AUC:** **0.9072** ($+0.032$ lift over baseline)
- **Service Endpoint:** Included in `POST http://127.0.0.1:8000/predict`.

### Outcome C: Project Risk Scoring Framework
- **Philosophy:** Separates operational, transparent decision-support scoring from black-box ML models.
- **Formula:** A rigorous, bounded $0–100$ multi-factor index:
  $$\text{Risk Score} = 0.30 \cdot S_{\text{cost}} + 0.30 \cdot S_{\text{schedule}} + 0.25 \cdot S_{\text{progress}} + 0.15 \cdot S_{\text{complexity}}$$
- **Categorization:** Low ($< 40$), Medium ($40–59$), High ($60–79$), Critical ($\ge 80$).
- **Features:** Direct explainability detailing exact point contributions per dimension.

### Outcome D: Early Warning Alert System (EWAS)
- **Triggers:** Automatically detects critical threshold breaches across 4 core risk vectors:
  1. *Severe Cost Overrun Trigger:* Projected or sanctioned escalation $> 15\%$.
  2. *Chronic Timeline Slippage:* Calendar delay $> 12\text{ months}$ past original Target Date of Commissioning (DoC).
  3. *Expenditure-Progress Decoupling:* Expenditure rate outpaces physical progress by $> 1.3\times$.
  4. *Corridor Friction:* Critical clearances pending in young folded geology / Himalayan corridors.
- **Actionable Directives:** Emits targeted nodal directives (e.g., *"Submit Revised Cost Estimates (RCE) to Expenditure Finance Committee"* or *"Initiate inter-ministerial RoW clearance taskforce"*).

### Outcome E: Benchmarking & Comparative Analytics Module
- **Cross-Sector Intelligence:** Aggregates macro benchmarks across 5 primary infrastructure sectors (Railways, Roads & Highways, Power, Ports & Shipping, Petroleum).
- **Comparative Metrics:**
  - Milestone slippage percentiles against sector peers.
  - S-Curve expected progress trajectory vs. actual certified ground execution.
  - Capital utilization efficiency index ($\text{Spend \%} / \text{Physical Progress \%}$).

### Outcome F: Cost Escalation Driver Analysis Module
- **Factor Attribution:** Identifies primary variance drivers across Scope Revisions, Land Acquisition / Right of Way (RoW), Forest & Environmental Approvals, Geotechnical Variations, and Material Price Escalation.
- **XGBoost Feature Gain Rankings:**
  - Expenditure Intensity: **34%**
  - Execution Progress Gap: **28%**
  - Terrain Complexity Index: **18%**
  - Capital Scale Index ($\ge ₹1,000\text{ Cr}$): **12%**
  - Elapsed Duration: **8%**
- **Scientific Standard:** Framed as non-causal statistical associations to preserve academic integrity.

### Outcome G: AI-Powered Monitoring Dashboard
- **Central Cockpit:** Live dashboard tracking 16 central sector projects with cumulative sanctioned cost of $₹1,47,820\text{ Cr}$.
- **Interactive Capabilities:**
  - Real-time KPI summaries (Total Capital, Critical Slippage Count, Severe Escalations).
  - Risk Distribution histograms and sector breakdown donuts.
  - Deep-dive 14-section project dossiers with interactive tabs (Overview, Risk Matrix, Milestones, Benchmarks).
  - Dual-mode data ingestion: Current portfolio imports vs. longitudinal ML training dataset ingestion.

### Outcome H: LLM-Enabled Project Intelligence Assistant
- **Framework:** Powered by Google Gemini and Genkit (`src/components/infrastructure/infra-ai-assistant.tsx`).
- **Capabilities:**
  - Natural language querying across the entire portfolio (e.g., *"Which railway projects in Jammu & Kashmir have schedule slippage over 5 years?"*).
  - Automated executive brief generation for Project Monitoring Group (PMG) reviews.
  - Deep root-cause inquiry with contextual citations.

### Outcome I: Documentation & Deployment Framework
- **Whitepaper:** Comprehensive mathematical and methodological document: [`docs/RESEARCH_AND_METHODOLOGY.md`](docs/RESEARCH_AND_METHODOLOGY.md).
- **Service Decoupling:** Standalone Python FastAPI microservice architecture (`services/ml-service/`) with complete Pydantic request/response contracts and OpenAPI interactive documentation (`http://127.0.0.1:8000/docs`).
- **Automated Test Suite:** Comprehensive Python test suite (`python services/ml-service/test_service.py`) passing with $100\%$ success.

---

## System Architecture

```
                                  +--------------------------------------------------+
                                  |     Ministry / Executive Monitoring User         |
                                  +--------------------------------------------------+
                                                           |
                                                           v
                     +--------------------------------------------------------------------------------+
                     |                       DevTeXhHub Next.js 15 Web Application                    |
                     |                                (Port 9005)                                     |
                     |                                                                                |
                     |  +---------------------------+  +--------------------------+  +-------------+  |
                     |  | AI Executive Dashboard    |  | Early Warning Center     |  | AI Copilot  |  |
                     |  | (16 Monitored Projects)   |  | (Threshold Triggers)     |  | (Gemini LLM)|  |
                     |  +---------------------------+  +--------------------------+  +-------------+  |
                     |  | Tier 1 Deterministic Risk |  | Comparative Benchmarks   |  | Model Registry|
                     |  | Engine (0-100 Scoring)    |  | & S-Curve Deviation      |  | & Insights |  |
                     |  +---------------------------+  +--------------------------+  +-------------+  |
                     +--------------------------------------------------------------------------------+
                                           |                                      |
                         HTTP REST API     |                                      | Google Genkit
                        (127.0.0.1:8000)   |                                      | Gemini API
                                           v                                      v
+-------------------------------------------------------------------+  +----------------------+
|             Python FastAPI ML Microservice (Port 8000)             |  | Google Cloud Vertex /|
|                                                                   |  | Gemini AI Studio     |
| +--------------------------------+  +---------------------------+ |  +----------------------+
| | Tier 2: Statistical Baseline   |  | Tier 3: ML Pipeline       | |
| | (Multivariate Logistic Reg)    |  | (XGBoost Ensemble)        | |
| +--------------------------------+  +---------------------------+ |
| | Anti-Leakage Contracts         |  | Temporal Validation Split | |
| | (Known-at-Prediction Features) |  | (Train <=2023, Test >2023)| |
| +--------------------------------+  +---------------------------+ |
+-------------------------------------------------------------------+
```

---

## Quick Start & Verification

### 1. Prerequisites
- **Node.js**: v18+ or v20+
- **Python**: v3.10+ (Python 3.12 verified)

### 2. Launch Python ML Microservice
```bash
# Navigate to the microservice directory
cd services/ml-service

# Install dependencies
pip install -r requirements.txt

# (Optional) Run tests to verify the service
python test_service.py

# Start the FastAPI server on port 8000
python main.py
```
*The interactive API documentation will be available at: `http://127.0.0.1:8000/docs`.*

### 3. Launch DevTeXhHub Frontend
In a new terminal window:
```bash
# Install dependencies (if not already installed)
npm install

# Start the Next.js development server on port 9005
npm run dev -- -p 9005
```
*Open your browser and navigate to: `http://localhost:9005`.*

### 4. Direct View Navigation Links
Once running, you can access the specific SIH26103 modules directly:
- **Central Monitoring Cockpit:** `http://localhost:9005/?view=overview`
- **National Projects Registry:** `http://localhost:9005/?view=projects`
- **Executive Risk Monitor (Tier 1):** `http://localhost:9005/?view=risk-monitor`
- **Early Warnings Center (Outcome D):** `http://localhost:9005/?view=early-warnings`
- **Model Insights & Registry (Outcomes A, B, F):** `http://localhost:9005/?view=model-insights`
- **Cross-Sector Benchmarking (Outcome E):** `http://localhost:9005/?view=benchmarking`
- **Dual-Mode Data Ingestion:** `http://localhost:9005/?view=data-import`
- **AI Intelligence Assistant (Outcome H):** `http://localhost:9005/?view=ai-assistant`

---

## Preserved Legacy Team Features & Credentials

DevTeXhHub retains its original role-based workflow system (Admins, Managers, Developers, QAs, Designers):
- **Default Admin Login:** `admin@devtexhhub.com`
- **Password:** `HD@Mixture08`
- **Default Password for New Users:** `DTXH2025`

---

## Scientific Honesty & Data Governance Mandate

1. **Synthetic Dataset Provenance:** The machine learning models in `services/ml-service/` are trained on a synthetic longitudinal dataset ($N = 1,200$ monthly snapshots spanning 2018–2026) engineered strictly to demonstrate the pipeline, anti-leakage contracts, and temporal validation.
2. **Segregation from Official MoSPI PAIMANA Data:** Prototype portfolio data (16 central projects) is maintained separately and is monitored using the transparent Tier 1 Deterministic Risk Engine.
3. **No Fabricated Metrics:** Empirical validation metrics (83.17% XGBoost accuracy, 0.9072 ROC-AUC) are genuinely computed on an out-of-time temporal test fold ($N_{\text{test}} = 499$).
