"""
MODEL TRAINING & TEMPORAL VALIDATION PIPELINE
SIH26103 | Team InfraZyn | DevTeXhHub

Trains real Logistic Regression baselines and XGBoost ensemble classifiers
on the synthetic longitudinal dataset using time-aware temporal splitting.
Computes real, un-falsified validation metrics and saves trained artifacts.
"""

import os
import json
import joblib
import numpy as np
import pandas as pd
from datetime import datetime

from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    confusion_matrix,
)
from xgboost import XGBClassifier

# Feature Definitions
NUMERICAL_FEATURES = [
    'sanctioned_cost',
    'project_age_months',
    'planned_duration_months',
    'cumulative_expenditure_to_date',
    'physical_progress_to_date',
    'progress_gap',
    'expenditure_intensity',
    'terrain_complexity_index',
    'clearance_bottlenecks_count',
    'historical_revisions_count',
    'spend_progress_interaction',
]

CATEGORICAL_FEATURES = [
    'sector',
]

ALL_FEATURE_COLUMNS = NUMERICAL_FEATURES + CATEGORICAL_FEATURES

def prepare_feature_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    """Prepares features and engineers non-linear interaction terms."""
    df_feat = df.copy()
    # Interaction term: high spend intensity while progress gap is wide
    df_feat['spend_progress_interaction'] = (
        df_feat['expenditure_intensity'] * (df_feat['progress_gap'] / 100.0)
    )
    return df_feat

def evaluate_model(model, X_test, y_test, model_name: str) -> dict:
    """Calculates genuine empirical validation metrics on the temporal test fold."""
    y_pred = model.predict(X_test)
    y_prob = model.predict_proba(X_test)[:, 1]

    acc = float(accuracy_score(y_test, y_pred))
    prec = float(precision_score(y_test, y_pred, zero_division=0))
    rec = float(recall_score(y_test, y_pred, zero_division=0))
    f1 = float(f1_score(y_test, y_pred, zero_division=0))
    auc = float(roc_auc_score(y_test, y_prob))
    cm = confusion_matrix(y_test, y_pred).tolist()

    return {
        'accuracy': round(acc, 4),
        'precision': round(prec, 4),
        'recall': round(rec, 4),
        'f1_score': round(f1, 4),
        'roc_auc': round(auc, 4),
        'confusion_matrix': {
            'tn': cm[0][0],
            'fp': cm[0][1],
            'fn': cm[1][0],
            'tp': cm[1][1],
        },
    }

def extract_xgb_feature_importance(pipeline, feature_names: list) -> list:
    """Extracts and normalizes feature importance scores from XGBoost model."""
    xgb_step = pipeline.named_steps['classifier']
    preprocessor = pipeline.named_steps['preprocessor']

    # Get feature names after one-hot encoding
    cat_encoder = preprocessor.named_transformers_['cat']
    cat_feature_names = cat_encoder.get_feature_names_out(CATEGORICAL_FEATURES).tolist()
    transformed_feature_names = NUMERICAL_FEATURES + cat_feature_names

    importances = xgb_step.feature_importances_
    
    # Aggregate one-hot sector features into a single 'sector' feature
    sector_importance = 0.0
    agg_features = {}
    for name, imp in zip(transformed_feature_names, importances):
        if name.startswith('sector_'):
            sector_importance += float(imp)
        else:
            agg_features[name] = float(imp)
    agg_features['sector'] = sector_importance

    total_imp = sum(agg_features.values()) or 1.0
    ranked = sorted(
        [
            {
                'feature_name': k,
                'importance_score': round(v / total_imp, 4),
            }
            for k, v in agg_features.items()
        ],
        key=lambda x: x['importance_score'],
        reverse=True,
    )
    return ranked

def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    data_path = os.path.join(script_dir, 'data', 'synthetic_infrastructure_dataset.csv')
    models_dir = os.path.join(script_dir, 'models')
    os.makedirs(models_dir, exist_ok=True)

    print(f"Loading synthetic longitudinal dataset from {data_path}...")
    df_raw = pd.read_csv(data_path)
    df = prepare_feature_dataframe(df_raw)

    # -------------------------------------------------------------------------
    # TIME-AWARE TEMPORAL VALIDATION SPLIT
    # Train set: snapshots <= 2023-12-31 (~70%)
    # Test set:  snapshots >  2023-12-31 (~30%)
    # Prevents future temporal leakage into training
    # -------------------------------------------------------------------------
    temporal_cutoff = '2023-12-31'
    train_df = df[df['snapshot_date'] <= temporal_cutoff].copy()
    test_df = df[df['snapshot_date'] > temporal_cutoff].copy()

    print(f"Temporal Split Cutoff: {temporal_cutoff}")
    print(f"Historical Train Fold: {len(train_df)} snapshots ({len(train_df)/len(df)*100:.1f}%)")
    print(f"Forward Test Fold:     {len(test_df)} snapshots ({len(test_df)/len(df)*100:.1f}%)")

    # Features and Targets
    X_train = train_df[ALL_FEATURE_COLUMNS]
    X_test = test_df[ALL_FEATURE_COLUMNS]
    
    y_cost_train = train_df['cost_overrun']
    y_cost_test = test_df['cost_overrun']
    
    y_time_train = train_df['time_overrun']
    y_time_test = test_df['time_overrun']

    # Preprocessor definition
    preprocessor = ColumnTransformer(
        transformers=[
            ('num', StandardScaler(), NUMERICAL_FEATURES),
            ('cat', OneHotEncoder(handle_unknown='ignore'), CATEGORICAL_FEATURES),
        ]
    )

    # -------------------------------------------------------------------------
    # 1. TRAIN COST OVERRUN MODELS
    # -------------------------------------------------------------------------
    print("\n--- Training Cost Overrun Models ---")
    
    # Model 1A: Cost Baseline (Logistic Regression)
    cost_baseline_pipe = Pipeline([
        ('preprocessor', preprocessor),
        ('classifier', LogisticRegression(max_iter=1000, random_state=42)),
    ])
    cost_baseline_pipe.fit(X_train, y_cost_train)
    cost_baseline_metrics = evaluate_model(cost_baseline_pipe, X_test, y_cost_test, "Cost Baseline")
    print(f"Cost Baseline Metrics: {cost_baseline_metrics}")

    # Model 1B: Cost ML (XGBoost)
    cost_xgb_pipe = Pipeline([
        ('preprocessor', preprocessor),
        ('classifier', XGBClassifier(
            n_estimators=120,
            max_depth=4,
            learning_rate=0.08,
            subsample=0.85,
            colsample_bytree=0.85,
            random_state=42,
            eval_metric='logloss',
        )),
    ])
    cost_xgb_pipe.fit(X_train, y_cost_train)
    cost_xgb_metrics = evaluate_model(cost_xgb_pipe, X_test, y_cost_test, "Cost XGBoost")
    cost_xgb_importance = extract_xgb_feature_importance(cost_xgb_pipe, ALL_FEATURE_COLUMNS)
    print(f"Cost XGBoost Metrics:  {cost_xgb_metrics}")

    # -------------------------------------------------------------------------
    # 2. TRAIN TIME OVERRUN MODELS
    # -------------------------------------------------------------------------
    print("\n--- Training Time Overrun Models ---")
    
    # Model 2A: Time Baseline (Logistic Regression)
    time_baseline_pipe = Pipeline([
        ('preprocessor', preprocessor),
        ('classifier', LogisticRegression(max_iter=1000, random_state=42)),
    ])
    time_baseline_pipe.fit(X_train, y_time_train)
    time_baseline_metrics = evaluate_model(time_baseline_pipe, X_test, y_time_test, "Time Baseline")
    print(f"Time Baseline Metrics: {time_baseline_metrics}")

    # Model 2B: Time ML (XGBoost)
    time_xgb_pipe = Pipeline([
        ('preprocessor', preprocessor),
        ('classifier', XGBClassifier(
            n_estimators=120,
            max_depth=4,
            learning_rate=0.08,
            subsample=0.85,
            colsample_bytree=0.85,
            random_state=42,
            eval_metric='logloss',
        )),
    ])
    time_xgb_pipe.fit(X_train, y_time_train)
    time_xgb_metrics = evaluate_model(time_xgb_pipe, X_test, y_time_test, "Time XGBoost")
    time_xgb_importance = extract_xgb_feature_importance(time_xgb_pipe, ALL_FEATURE_COLUMNS)
    print(f"Time XGBoost Metrics:  {time_xgb_metrics}")

    # -------------------------------------------------------------------------
    # 3. SERIALIZE ARTIFACTS
    # -------------------------------------------------------------------------
    print("\nSaving trained models to joblib artifacts...")
    joblib.dump(cost_baseline_pipe, os.path.join(models_dir, 'cost_overrun_baseline.joblib'))
    joblib.dump(cost_xgb_pipe, os.path.join(models_dir, 'cost_overrun_xgb.joblib'))
    joblib.dump(time_baseline_pipe, os.path.join(models_dir, 'time_overrun_baseline.joblib'))
    joblib.dump(time_xgb_pipe, os.path.join(models_dir, 'time_overrun_xgb.joblib'))

    # Metadata & Registry Output
    registry = {
        'training_timestamp': datetime.utcnow().isoformat() + 'Z',
        'dataset_type': 'Synthetic Longitudinal ML Development Dataset',
        'dataset_disclaimer': 'Trained exclusively on synthetic data for architecture demonstration. Not official government statistics.',
        'total_dataset_size': len(df),
        'train_records_count': len(X_train),
        'test_records_count': len(X_test),
        'temporal_cutoff': temporal_cutoff,
        'feature_count': len(ALL_FEATURE_COLUMNS),
        'features_used': ALL_FEATURE_COLUMNS,
        'models': {
            'cost_overrun_baseline': {
                'model_name': 'Logistic Regression Baseline (Cost Overrun)',
                'model_tier': 'Tier 2: Statistical Baseline',
                'model_version': 'v1.0-logreg-synthetic',
                'algorithm': 'Multivariate Logistic Regression (L2 Penalty)',
                'target': 'COST_OVERRUN_BINARY (>= 10% budget escalation)',
                'metrics': cost_baseline_metrics,
            },
            'cost_overrun_xgb': {
                'model_name': 'XGBoost Classifier (Cost Overrun)',
                'model_tier': 'Tier 3: Machine Learning Model',
                'model_version': 'v1.0-xgboost-synthetic',
                'algorithm': 'Gradient Boosted Decision Trees (XGBoost)',
                'target': 'COST_OVERRUN_BINARY (>= 10% budget escalation)',
                'metrics': cost_xgb_metrics,
                'feature_importance': cost_xgb_importance,
            },
            'time_overrun_baseline': {
                'model_name': 'Logistic Regression Baseline (Time Overrun)',
                'model_tier': 'Tier 2: Statistical Baseline',
                'model_version': 'v1.0-logreg-synthetic',
                'algorithm': 'Multivariate Logistic Regression (L2 Penalty)',
                'target': 'TIME_OVERRUN_BINARY (>= 12 months delay)',
                'metrics': time_baseline_metrics,
            },
            'time_overrun_xgb': {
                'model_name': 'XGBoost Classifier (Time Overrun)',
                'model_tier': 'Tier 3: Machine Learning Model',
                'model_version': 'v1.0-xgboost-synthetic',
                'algorithm': 'Gradient Boosted Decision Trees (XGBoost)',
                'target': 'TIME_OVERRUN_BINARY (>= 12 months delay)',
                'metrics': time_xgb_metrics,
                'feature_importance': time_xgb_importance,
            },
        },
    }

    registry_path = os.path.join(models_dir, 'model_registry.json')
    with open(registry_path, 'w') as f:
        json.dump(registry, f, indent=2)
    print(f"Model registry written to: {registry_path}")
    print("\nTraining and validation successfully completed!")

if __name__ == '__main__':
    main()
