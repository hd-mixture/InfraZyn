/**
 * Machine Learning Architecture Contracts & Scientific Standards
 * SIH26103 | Team: InfraZyn
 * 
 * Enforces:
 * 1. Strict Data Leakage Prevention (Observable inputs vs. Post-hoc outcome labels)
 * 2. Time-Aware Validation Protocols (Temporal splitting rather than random cross-validation)
 * 3. Formal Prediction Target Definitions
 * 4. Pluggable Model Training, Evaluation, and Prediction Abstractions
 */

import {
  InfraProject,
  KnownAtPredictionFeatures,
  OutcomeLabelFields,
  TargetVariableDefinition,
  TargetVariableType,
  ModelPerformanceMetrics,
  ValidationStrategy,
} from '@/types/infrastructure';
import { calculateDerivedMetrics, calculateMonthsDiff } from './derived-metrics';

/**
 * HIGH-COMPLEXITY GEOTECHNICAL REGIONS
 * Hill states carry structural and environmental friction coefficients.
 */
export const HIGH_COMPLEXITY_STATES = new Set([
  'Jammu & Kashmir',
  'Ladakh',
  'Arunachal Pradesh',
  'Assam',
  'Sikkim',
  'Himachal Pradesh',
  'Uttarakhand',
  'Nagaland',
  'Manipur',
  'Mizoram',
  'Meghalaya',
  'Tripura',
]);

/**
 * TARGET VARIABLE REGISTRY
 * Explicitly defines what each model predicts and documents the anti-leakage rule.
 */
export const TARGET_VARIABLE_REGISTRY: Record<TargetVariableType, TargetVariableDefinition> = {
  COST_OVERRUN_BINARY: {
    id: 'COST_OVERRUN_BINARY',
    name: 'Cost Overrun Occurrence (Binary >= 10%)',
    type: 'classification',
    description: 'Predicts probability that final project cost will exceed original approved budget by 10% or more.',
    leakageRule: 'STRICT: Must not include revisedCost, currentCostEscalation, or any budget revision approvals granted after observation date.',
  },
  TIME_OVERRUN_BINARY: {
    id: 'TIME_OVERRUN_BINARY',
    name: 'Critical Schedule Slippage (Binary >= 12 Months)',
    type: 'classification',
    description: 'Predicts probability that project commissioning will be postponed by 12 months or more beyond original target DoC.',
    leakageRule: 'STRICT: Must not include revisedCompletionDate or post-observation milestone postponement records.',
  },
  COST_OVERRUN_PERCENTAGE: {
    id: 'COST_OVERRUN_PERCENTAGE',
    name: 'Cost Escalation Magnitude (%)',
    type: 'regression',
    description: 'Estimates continuous percentage escalation over original sanction.',
    leakageRule: 'STRICT: Outcome field costEscalationPercentage is the regression target and strictly excluded from model feature space.',
  },
  TIME_SLIPPAGE_MONTHS: {
    id: 'TIME_SLIPPAGE_MONTHS',
    name: 'Schedule Slippage Duration (Months)',
    type: 'regression',
    description: 'Estimates continuous additional elapsed calendar months beyond original commissioning target.',
    leakageRule: 'STRICT: revisedDurationMonths and scheduleSlippageMonths are strictly outcome targets.',
  },
};

/**
 * 1. DATA LEAKAGE PREVENTION: Feature Extraction
 * Extracts ONLY features known and observable at the snapshot date (t).
 * Guarantees no hindsight bias or post-hoc leakage into model inputs.
 */
export function extractKnownFeatures(
  project: InfraProject,
  referenceDate: Date = new Date('2026-07-31')
): KnownAtPredictionFeatures {
  const sanitizedCost = Math.max(0, Number(project.originalCost) || 0);
  const currentExp = Math.max(0, Number(project.cumulativeExpenditure) || 0);
  const actualPhysical = Math.min(100, Math.max(0, Number(project.physicalProgress) || 0));

  // Time elapsed from sanctioned start to current observation snapshot
  const refDateStr = referenceDate.toISOString().split('T')[0];
  const projectAgeMonths = calculateMonthsDiff(project.startDate, refDateStr);
  const plannedDurationMonths = calculateMonthsDiff(project.startDate, project.originalCompletionDate);

  // S-Curve expected physical progress based strictly on original planned schedule
  let expectedPhysical = 0;
  if (plannedDurationMonths > 0) {
    const elapsedRatio = Math.min(1.0, projectAgeMonths / plannedDurationMonths);
    const sCurve = 3 * Math.pow(elapsedRatio, 2) - 2 * Math.pow(elapsedRatio, 3);
    expectedPhysical = Number((Math.min(100, Math.max(0, sCurve * 100))).toFixed(1));
  } else {
    expectedPhysical = actualPhysical;
  }

  // Progress Gap observable at time t
  const progressGap = Number((Math.max(0, expectedPhysical - actualPhysical)).toFixed(1));

  // Expenditure Intensity observable at time t:
  // Financial spend ratio relative to original budget vs. actual physical progress
  const financialSpendRatio = sanitizedCost > 0 ? (currentExp / sanitizedCost) * 100 : 0;
  const safePhysical = Math.max(1, actualPhysical);
  const expenditureIntensity = Number((financialSpendRatio / safePhysical).toFixed(2));

  // Geotechnical terrain complexity weight (0.1 for plains, 0.6 for hills/strategic corridors, 0.9 for extreme high-altitude/tunnel)
  let terrainIndex = 0.1;
  if (HIGH_COMPLEXITY_STATES.has(project.state)) {
    terrainIndex = project.locationSummary?.toLowerCase().includes('tunnel') || project.locationSummary?.toLowerCase().includes('himalayan')
      ? 0.85
      : 0.60;
  } else if (project.locationSummary?.toLowerCase().includes('ghats') || project.locationSummary?.toLowerCase().includes('bridge')) {
    terrainIndex = 0.40;
  }

  return {
    projectCode: project.projectCode,
    sanctionedCost: sanitizedCost,
    projectAgeMonths,
    plannedDurationMonths,
    currentExpenditure: currentExp,
    physicalProgress: actualPhysical,
    progressGap,
    expenditureIntensity,
    sector: project.sector,
    ministry: project.ministry,
    state: project.state,
    terrainComplexityIndex: terrainIndex,
  };
}

/**
 * 2. OUTCOME LABEL EXTRACTION
 * Extracts ground truth labels from the completed or revised project state.
 */
export function extractOutcomeLabels(project: InfraProject): OutcomeLabelFields {
  const metrics = calculateDerivedMetrics(project);
  const originalCost = Math.max(0, Number(project.originalCost) || 0);
  const revisedCost = Math.max(originalCost, Number(project.revisedCost) || originalCost);
  const costEscalation = metrics.costEscalation;
  const costEscalationPercentage = metrics.costEscalationPercentage;

  return {
    revisedCost,
    costEscalation,
    costEscalationPercentage,
    hasCostOverrun: costEscalationPercentage >= 10.0,
    revisedCompletionDate: project.revisedCompletionDate,
    scheduleSlippageMonths: metrics.scheduleSlippageMonths,
    hasCriticalTimeOverrun: metrics.scheduleSlippageMonths >= 12,
  };
}

/**
 * 3. TIME-AWARE VALIDATION PROTOCOL: Temporal Dataset Splitting
 * Infrastructure projects evolve through calendar time. Standard random k-fold
 * causes future project states to leak into the training of historical states.
 * 
 * Temporal Split Rule:
 * Train Set: Historical projects or snapshots with approvalDate <= cutoffDate
 * Test Set: Projects approved after cutoffDate
 */
export function splitDatasetByTimeCutoff(
  projects: InfraProject[],
  cutoffDateStr: string = '2020-01-01'
): {
  trainSet: InfraProject[];
  testSet: InfraProject[];
  splitStrategy: ValidationStrategy;
  cutoffDate: string;
} {
  const cutoffTime = new Date(cutoffDateStr).getTime();

  const trainSet: InfraProject[] = [];
  const testSet: InfraProject[] = [];

  projects.forEach(p => {
    const projectTime = new Date(p.approvalDate || p.startDate).getTime();
    if (projectTime <= cutoffTime) {
      trainSet.push(p);
    } else {
      testSet.push(p);
    }
  });

  return {
    trainSet,
    testSet,
    splitStrategy: 'TEMPORAL_SPLIT',
    cutoffDate: cutoffDateStr,
  };
}

/**
 * 4. MODEL INTERFACE & TRAINING ABSTRACTIONS
 * Pluggable abstraction supporting both in-engine TypeScript baseline models
 * and external Python/FastAPI microservices (e.g. Scikit-Learn / XGBoost).
 */
export interface RiskPredictionOutput {
  probabilityPercent?: number; // 0 - 100 for classification
  continuousPrediction?: number; // Estimated value for regression
  predictionUnit?: string; // e.g. "%" or "Months"
  riskClassification: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'; // Alias for compatibility with project detail
  contributingFeatures: { featureName: string; contributionWeight: number; description: string }[];
  explanation: string;
  modelIdentifier: string;
  leakageGuaranteed: boolean; // Confirms strict adherence to KnownAtPredictionFeatures
}

export interface RiskModelContract {
  name: string;
  version: string;
  tier: 'Tier 1: Deterministic Risk Scoring' | 'Tier 2: Statistical Baseline' | 'Tier 3: Machine Learning Model';
  target: TargetVariableType;
  validationStrategy: ValidationStrategy;
  
  predict(project: InfraProject): RiskPredictionOutput;
  evaluate(dataset: InfraProject[]): ModelPerformanceMetrics;
}
