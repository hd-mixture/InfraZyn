/**
 * Python FastAPI ML Microservice Client Bridge
 * SIH26103 | Team InfraZyn | DevTeXhHub
 * 
 * Communicates with the external Python FastAPI service (default: http://127.0.0.1:8000).
 * Implements strict fault tolerance: if the service is unreachable or offline,
 * falls back gracefully without breaking any existing dashboard features.
 */

import { InfraProject } from '@/types/infrastructure';
import { extractKnownFeatures } from './ml-contracts';

function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_ML_SERVICE_URL) {
    return process.env.NEXT_PUBLIC_ML_SERVICE_URL;
  }
  if (typeof window !== 'undefined') {
    const host = window.location.hostname || 'localhost';
    return `${window.location.protocol}//${host}:8000`;
  }
  return 'http://127.0.0.1:8000';
}

export interface MLServiceHealth {
  isOnline: boolean;
  status?: string;
  service?: string;
  modelsLoaded?: boolean;
  datasetType?: string;
  scientificDisclaimer?: string;
}

export interface ModelMetricsSummary {
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  roc_auc: number;
  confusion_matrix: {
    tn: number;
    fp: number;
    fn: number;
    tp: number;
  };
}

export interface MLModelRegistryResponse {
  training_timestamp: string;
  dataset_type: string;
  dataset_disclaimer: string;
  total_dataset_size: number;
  train_records_count: number;
  test_records_count: number;
  temporal_cutoff: string;
  feature_count: number;
  features_used: string[];
  models: {
    cost_overrun_baseline: {
      model_name: string;
      model_tier: string;
      model_version: string;
      algorithm: string;
      target: string;
      metrics: ModelMetricsSummary;
    };
    cost_overrun_xgb: {
      model_name: string;
      model_tier: string;
      model_version: string;
      algorithm: string;
      target: string;
      metrics: ModelMetricsSummary;
      feature_importance: { feature_name: string; importance_score: number }[];
    };
    time_overrun_baseline: {
      model_name: string;
      model_tier: string;
      model_version: string;
      algorithm: string;
      target: string;
      metrics: ModelMetricsSummary;
    };
    time_overrun_xgb: {
      model_name: string;
      model_tier: string;
      model_version: string;
      algorithm: string;
      target: string;
      metrics: ModelMetricsSummary;
      feature_importance: { feature_name: string; importance_score: number }[];
    };
  };
}

export interface MLPredictionResult {
  project_code: string;
  cost_overrun: {
    probability_percent: number;
    baseline_probability_percent: number;
    risk_band: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    model_version: string;
    algorithm: string;
  };
  time_overrun: {
    probability_percent: number;
    baseline_probability_percent: number;
    risk_band: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    model_version: string;
    algorithm: string;
  };
  model_metadata: {
    training_dataset: string;
    validation_strategy: string;
    anti_leakage_guaranteed: boolean;
  };
  top_contributing_features: {
    feature_name: string;
    impact_description: string;
    importance_weight: number;
  }[];
  scientific_disclaimer: string;
}

/**
 * Checks if the Python FastAPI ML microservice is reachable and healthy.
 */
export async function checkMLServiceHealth(): Promise<MLServiceHealth> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    const res = await fetch(`${getBaseUrl()}/health`, {
      method: 'GET',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      return { isOnline: false };
    }

    const data = await res.json();
    return {
      isOnline: true,
      status: data.status,
      service: data.service,
      modelsLoaded: data.models_loaded,
      datasetType: data.dataset_type,
      scientificDisclaimer: data.scientific_disclaimer,
    };
  } catch (err) {
    return { isOnline: false };
  }
}

/**
 * Fetches real model metadata and empirical calculated metrics from FastAPI /metadata.
 */
export async function fetchMLModelRegistry(): Promise<MLModelRegistryResponse | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    const res = await fetch(`${getBaseUrl()}/metadata`, {
      method: 'GET',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    return null;
  }
}

/**
 * Fetches ranked feature importance from the trained XGBoost models.
 */
export async function fetchMLFeatureImportance(): Promise<any | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    const res = await fetch(`${getBaseUrl()}/feature-importance`, {
      method: 'GET',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    return null;
  }
}

/**
 * Executes live prediction for an individual infrastructure project by sending
 * sanitized KnownAtPredictionFeatures to the Python FastAPI microservice.
 */
export async function predictProjectWithML(
  project: InfraProject
): Promise<MLPredictionResult | null> {
  try {
    // Extract strictly observable features (Zero Leakage Guarantee)
    const feat = extractKnownFeatures(project);

    const payload = {
      project_code: project.projectCode,
      sanctioned_cost: feat.sanctionedCost,
      project_age_months: feat.projectAgeMonths,
      planned_duration_months: Math.max(1, feat.plannedDurationMonths),
      cumulative_expenditure_to_date: feat.currentExpenditure,
      physical_progress_to_date: feat.physicalProgress,
      progress_gap: feat.progressGap,
      expenditure_intensity: feat.expenditureIntensity,
      sector: feat.sector,
      terrain_complexity_index: feat.terrainComplexityIndex,
      clearance_bottlenecks_count: feat.terrainComplexityIndex > 0.5 ? 2 : 0,
      historical_revisions_count: project.revisedCost > project.originalCost ? 1 : 0,
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const res = await fetch(`${getBaseUrl()}/predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    return null;
  }
}
