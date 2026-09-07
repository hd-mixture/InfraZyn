# InfraZyn Python ML Microservice (SIH26103)

**Project Name:** DevTeXhHub  
**Hackathon:** Smart India Hackathon (SIH) | **Problem Statement ID:** SIH26103  
**Team:** InfraZyn | **Tagline:** *"Predict. Monitor. Prevent."*  
**Service Role:** REST API microservice serving real trained Scikit-Learn Logistic Regression and XGBoost classifiers for infrastructure cost and time overrun risk prediction.

---

## 1. Scientific Disclaimer & Provenance

> **SCIENTIFIC HONESTY MANDATE:**  
> The models in this service are trained on a **Synthetic Longitudinal ML Development Dataset ($N = 1,200$)** simulating monthly infrastructure project snapshots from 2018 to 2026.  
> This dataset was synthesized strictly to demonstrate the machine learning engineering pipeline, strict data-leakage prevention, and time-aware temporal validation.  
> It does **NOT** represent official Ministry of Statistics and Programme Implementation (MoSPI) / PAIMANA government statistics.

---

## 2. Directory Structure

```
services/ml-service/
├── data/
│   └── synthetic_infrastructure_dataset.csv  # 1,200 synthetic monthly snapshots (2018-2026)
├── models/
│   ├── cost_overrun_baseline.joblib          # Logistic Regression pipeline (Cost)
│   ├── cost_overrun_xgb.joblib               # XGBoost Classifier pipeline (Cost)
│   ├── time_overrun_baseline.joblib          # Logistic Regression pipeline (Time)
│   ├── time_overrun_xgb.joblib               # XGBoost Classifier pipeline (Time)
│   └── model_registry.json                   # Real evaluated metrics & metadata
├── generate_dataset.py                       # Synthetic data generator
├── train.py                                  # Training & temporal validation script
├── main.py                                   # FastAPI REST application
├── test_service.py                           # Unit & integration tests
└── requirements.txt                          # Dependencies
```

---

## 3. Quick Start & Execution Commands

### Step 1: Install Dependencies
```bash
pip install -r services/ml-service/requirements.txt
```

### Step 2: Generate Dataset (Optional - already generated)
```bash
python services/ml-service/generate_dataset.py
```

### Step 3: Train Models & Compute Empirical Metrics
```bash
python services/ml-service/train.py
```

### Step 4: Run Automated Tests
```bash
python services/ml-service/test_service.py
```

### Step 5: Start FastAPI Server
```bash
python -m uvicorn services.ml-service.main:app --host 127.0.0.1 --port 8000 --reload
# Or directly:
python services/ml-service/main.py
```
The interactive Swagger API documentation will be available at: `http://127.0.0.1:8000/docs`.

---

## 4. API Endpoints

| Endpoint | Method | Description |
| :--- | :---: | :--- |
| `/health` | `GET` | Service liveness, status, and model load verification. |
| `/metadata` | `GET` | Model registry, temporal partition parameters, and actual calculated validation metrics. |
| `/feature-importance` | `GET` | Ranked XGBoost feature weights with associative interpretations. |
| `/predict` | `POST` | Ingests sanitized `KnownAtPredictionFeatures` and returns cost & time overrun probabilities. |

---

## 5. Temporal Validation Results (Summary)

Evaluated on **499 forward out-of-time test snapshots** ($t > \text{2023-12-31}$):

| Model | Algorithm | Accuracy | Precision | Recall | F1 Score | ROC-AUC |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| **Cost Baseline** | Logistic Regression | 84.97% | 76.76% | 72.19% | 0.7440 | 0.9079 |
| **Cost ML** | XGBoost Classifier | 82.57% | 74.24% | 64.90% | 0.6926 | 0.8748 |
| **Time Baseline** | Logistic Regression | 76.75% | 92.50% | 73.16% | 0.8170 | 0.8752 |
| **Time ML** | XGBoost Classifier | **83.17%** | **89.94%** | **85.88%** | **0.8786** | **0.9072** |
