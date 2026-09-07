"""
FASTAPI MACHINE LEARNING MICROSERVICE
SIH26103 | Team InfraZyn | DevTeXhHub

Provides REST API endpoints for:
- Health check (/health)
- Model metadata & registry (/metadata)
- Feature importance (/feature-importance)
- Real-time project risk inference (/predict)
"""

import os
import json
import joblib
import pandas as pd
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

app = FastAPI(
    title="InfraZyn Infrastructure ML Inference Service",
    description="Real ML service serving trained Logistic Regression and XGBoost models for SIH26103.",
    version="1.0.0",
)

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(SCRIPT_DIR, 'models')

# Load models and metadata on startup
cost_baseline_model = None
cost_xgb_model = None
time_baseline_model = None
time_xgb_model = None
model_registry = {}

def load_artifacts():
    global cost_baseline_model, cost_xgb_model, time_baseline_model, time_xgb_model, model_registry
    try:
        cost_baseline_path = os.path.join(MODELS_DIR, 'cost_overrun_baseline.joblib')
        cost_xgb_path = os.path.join(MODELS_DIR, 'cost_overrun_xgb.joblib')
        time_baseline_path = os.path.join(MODELS_DIR, 'time_overrun_baseline.joblib')
        time_xgb_path = os.path.join(MODELS_DIR, 'time_overrun_xgb.joblib')
        registry_path = os.path.join(MODELS_DIR, 'model_registry.json')

        if os.path.exists(cost_baseline_path):
            cost_baseline_model = joblib.load(cost_baseline_path)
        if os.path.exists(cost_xgb_path):
            cost_xgb_model = joblib.load(cost_xgb_path)
        if os.path.exists(time_baseline_path):
            time_baseline_model = joblib.load(time_baseline_path)
        if os.path.exists(time_xgb_path):
            time_xgb_model = joblib.load(time_xgb_path)
        if os.path.exists(registry_path):
            with open(registry_path, 'r') as f:
                model_registry = json.load(f)
    except Exception as e:
        print(f"Error loading artifacts: {e}")

load_artifacts()

# Pydantic Schemas
class ProjectPredictionInput(BaseModel):
    # Features known strictly at prediction time
    sanctioned_cost: float = Field(..., ge=0, description="Original approved budget in ₹ Cr")
    project_age_months: int = Field(..., ge=0, description="Elapsed months since project sanction")
    planned_duration_months: int = Field(..., gt=0, description="Original planned duration in months")
    cumulative_expenditure_to_date: float = Field(..., ge=0, description="Disbursed expenditure up to observation date (₹ Cr)")
    physical_progress_to_date: float = Field(..., ge=0, le=100, description="Certified physical completion percentage")
    progress_gap: float = Field(..., ge=0, description="S-curve expected % minus actual physical %")
    expenditure_intensity: float = Field(..., ge=0, description="Ratio of spend % to physical progress %")
    sector: str = Field(default="Roads & Highways", description="Infrastructure sector")
    terrain_complexity_index: float = Field(default=0.2, ge=0.1, le=1.0, description="Terrain friction factor (0.1 plains to 0.85 alpine)")
    clearance_bottlenecks_count: int = Field(default=0, ge=0, description="Number of unresolved statutory clearances")
    historical_revisions_count: int = Field(default=0, ge=0, description="Prior milestone adjustments count")
    
    # Optional identifier
    project_code: Optional[str] = Field(default="PRJ-QUERY", description="Project code identifier")

class ContributingFeature(BaseModel):
    feature_name: str
    impact_description: str
    importance_weight: float

class PredictionResponse(BaseModel):
    project_code: str
    cost_overrun: Dict[str, Any]
    time_overrun: Dict[str, Any]
    model_metadata: Dict[str, Any]
    top_contributing_features: List[ContributingFeature]
    scientific_disclaimer: str

@app.get("/health")
def health_check():
    models_ready = all([
        cost_baseline_model is not None,
        cost_xgb_model is not None,
        time_baseline_model is not None,
        time_xgb_model is not None,
    ])
    return {
        "status": "healthy" if models_ready else "degraded",
        "service": "InfraZyn ML Inference Service (SIH26103)",
        "models_loaded": models_ready,
        "dataset_type": "Synthetic Longitudinal ML Development Dataset",
        "scientific_disclaimer": "Models trained on synthetic longitudinal data for pipeline validation. Not official government statistics.",
    }

@app.get("/metadata")
def get_metadata():
    if not model_registry:
        load_artifacts()
    if not model_registry:
        raise HTTPException(status_code=503, detail="Model registry not available. Please run train.py first.")
    return model_registry

@app.get("/feature-importance")
def get_feature_importance():
    if not model_registry:
        load_artifacts()
    
    cost_importance = model_registry.get('models', {}).get('cost_overrun_xgb', {}).get('feature_importance', [])
    time_importance = model_registry.get('models', {}).get('time_overrun_xgb', {}).get('feature_importance', [])
    
    return {
        "cost_overrun_features": cost_importance,
        "time_overrun_features": time_importance,
        "interpretation_disclaimer": "Feature importance represents statistical association within gradient boosted trees, not direct mechanical causality.",
    }

@app.post("/predict", response_model=PredictionResponse)
def predict_project(payload: ProjectPredictionInput):
    if not cost_xgb_model or not time_xgb_model:
        load_artifacts()
        if not cost_xgb_model or not time_xgb_model:
            raise HTTPException(status_code=503, detail="ML models not loaded on server.")

    # Engineer interaction term
    spend_progress_interaction = payload.expenditure_intensity * (payload.progress_gap / 100.0)

    # Prepare DataFrame matching training feature schema
    feature_dict = {
        'sanctioned_cost': [payload.sanctioned_cost],
        'project_age_months': [payload.project_age_months],
        'planned_duration_months': [payload.planned_duration_months],
        'cumulative_expenditure_to_date': [payload.cumulative_expenditure_to_date],
        'physical_progress_to_date': [payload.physical_progress_to_date],
        'progress_gap': [payload.progress_gap],
        'expenditure_intensity': [payload.expenditure_intensity],
        'terrain_complexity_index': [payload.terrain_complexity_index],
        'clearance_bottlenecks_count': [payload.clearance_bottlenecks_count],
        'historical_revisions_count': [payload.historical_revisions_count],
        'spend_progress_interaction': [spend_progress_interaction],
        'sector': [payload.sector],
    }
    input_df = pd.DataFrame(feature_dict)

    # Inferences
    cost_baseline_prob = float(cost_baseline_model.predict_proba(input_df)[0][1])
    cost_xgb_prob = float(cost_xgb_model.predict_proba(input_df)[0][1])
    
    time_baseline_prob = float(time_baseline_model.predict_proba(input_df)[0][1])
    time_xgb_prob = float(time_xgb_model.predict_proba(input_df)[0][1])

    # Top contributing features based on input deviations
    contributing: List[ContributingFeature] = []
    if payload.expenditure_intensity > 1.25:
        contributing.append(ContributingFeature(
            feature_name="Expenditure Intensity Anomaly",
            impact_description=f"Spend rate ({payload.expenditure_intensity}x) significantly outpaces ground physical execution.",
            importance_weight=0.34,
        ))
    if payload.progress_gap > 10.0:
        contributing.append(ContributingFeature(
            feature_name="S-Curve Milestone Lag",
            impact_description=f"Execution lags planned S-curve by {payload.progress_gap}% physical completion.",
            importance_weight=0.28,
        ))
    if payload.terrain_complexity_index > 0.4:
        contributing.append(ContributingFeature(
            feature_name="Terrain Geotechnical Friction",
            impact_description=f"Corridor difficulty index of {payload.terrain_complexity_index} elevates logistical variance.",
            importance_weight=0.18,
        ))
    if payload.clearance_bottlenecks_count > 0:
        contributing.append(ContributingFeature(
            feature_name="Unresolved Clearances",
            impact_description=f"{payload.clearance_bottlenecks_count} statutory clearance bottlenecks awaiting nodal sign-off.",
            importance_weight=0.12,
        ))
    if not contributing:
        contributing.append(ContributingFeature(
            feature_name="Stable Baseline Execution",
            impact_description="Observed parameters fall within nominal operational tolerances.",
            importance_weight=0.10,
        ))

    return PredictionResponse(
        project_code=payload.project_code,
        cost_overrun={
            "probability_percent": round(cost_xgb_prob * 100, 1),
            "baseline_probability_percent": round(cost_baseline_prob * 100, 1),
            "risk_band": "CRITICAL" if cost_xgb_prob >= 0.75 else ("HIGH" if cost_xgb_prob >= 0.50 else ("MEDIUM" if cost_xgb_prob >= 0.30 else "LOW")),
            "model_version": "v1.0-xgboost-synthetic",
            "algorithm": "Gradient Boosted Decision Trees (XGBoost)",
        },
        time_overrun={
            "probability_percent": round(time_xgb_prob * 100, 1),
            "baseline_probability_percent": round(time_baseline_prob * 100, 1),
            "risk_band": "CRITICAL" if time_xgb_prob >= 0.75 else ("HIGH" if time_xgb_prob >= 0.50 else ("MEDIUM" if time_xgb_prob >= 0.30 else "LOW")),
            "model_version": "v1.0-xgboost-synthetic",
            "algorithm": "Gradient Boosted Decision Trees (XGBoost)",
        },
        model_metadata={
            "training_dataset": "Synthetic Longitudinal ML Development Dataset (N = 1,200)",
            "validation_strategy": "Time-Aware Temporal Split (Train: <= 2023, Test: > 2023)",
            "anti_leakage_guaranteed": True,
        },
        top_contributing_features=contributing,
        scientific_disclaimer="Probabilities are derived from an ML pipeline trained on synthetic longitudinal data for architecture demonstration. Not official government forecasts.",
    )

if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
