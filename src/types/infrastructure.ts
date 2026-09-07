/**
 * Domain Types for Infrastructure Project Monitoring & Intelligence
 * Inspired by MoSPI / IPMD PAIMANA Ecosystem (SIH Problem Statement: SIH26103)
 * Team: InfraZyn | Tagline: "Predict. Monitor. Prevent."
 */

export type ProjectStatus = 'Ongoing' | 'Delayed' | 'Critical' | 'Completed' | 'Ahead of Schedule';
export type ProjectType = 'Mega (>= ₹1000 Cr)' | 'Major (₹150 - ₹1000 Cr)';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type WarningSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type WarningCategory = 'Cost' | 'Schedule' | 'Progress' | 'Governance' | 'Multi-Risk';

export interface InfraMilestone {
  id: string;
  name: string;
  targetDate: string; // ISO date
  actualDate?: string; // ISO date
  status: 'Pending' | 'In Progress' | 'Achieved' | 'Delayed';
  weightagePercent: number;
}

export interface InfraProject {
  id: string;
  projectName: string;
  projectCode: string; // e.g. OCMS-RLY-2018-042
  legacyCode?: string; // e.g. PMGID-NHAI-1094
  agency: string; // e.g. Northern Railway, NHAI, DFCCIL, NTPC
  ministry: string; // e.g. Ministry of Railways, Ministry of Road Transport & Highways
  sector: string; // e.g. Railways, Roads & Highways, Power, Petroleum & Natural Gas
  state: string; // e.g. Jammu & Kashmir, Maharashtra, Arunachal Pradesh
  locationSummary?: string;
  approvalDate: string; // ISO date
  startDate: string; // ISO date
  originalCompletionDate: string; // Target DoC (Date of Commissioning)
  revisedCompletionDate: string; // Revised DoC
  originalCost: number; // in ₹ Crores
  revisedCost: number; // in ₹ Crores
  cumulativeExpenditure: number; // in ₹ Crores
  physicalProgress: number; // 0 - 100%
  financialProgress?: number; // 0 - 100% (or derived)
  status: ProjectStatus;
  projectType: ProjectType;
  sourceSnapshot: string; // "PAIMANA Report Snapshot — July 2026"
  sourceType: 'Official Flash Report Derived' | 'Prototype Demo Dataset' | 'Imported Dataset';
  description?: string;
  milestones?: InfraMilestone[];
  createdAt: string;
  updatedAt: string;
}

export interface DerivedMetrics {
  costEscalation: number; // revisedCost - originalCost (₹ Cr)
  costEscalationPercentage: number; // % escalation
  expenditureRatio: number; // cumulativeExpenditure / revisedCost
  financialProgress: number; // %
  plannedDurationMonths: number;
  revisedDurationMonths: number;
  projectAgeMonths: number;
  scheduleSlippageMonths: number;
  completionProximityMonths: number;
  expectedPhysicalProgress: number; // expected % progress based on elapsed time
  progressGap: number; // expected - actual physical progress
  expenditureIntensity: number; // financialProgress / (physicalProgress || 1)
  isTimeOverrun: boolean;
  isCostOverrun: boolean;
}

export interface RiskSubscores {
  costRisk: number; // 0 - 100
  scheduleRisk: number; // 0 - 100
  progressRisk: number; // 0 - 100
  implementationRisk: number; // 0 - 100
}

export interface RiskAssessment {
  overallScore: number; // 0 - 100
  riskLevel: RiskLevel;
  subscores: RiskSubscores;
  contributingFactors: string[];
  recommendedActions: string[];
  modelConfidence: number; // 0 - 100
  evaluatedAt: string;
}

export interface EarlyWarning {
  id: string;
  projectId: string;
  projectName: string;
  projectCode: string;
  severity: WarningSeverity;
  category: WarningCategory;
  trigger: string;
  explanation: string;
  detectedAt: string;
  recommendedAction: string;
  status: 'Active' | 'Under Review' | 'Mitigated';
}

/**
 * STRICT DATA LEAKAGE PREVENTION:
 * Input features known strictly at prediction/observation time (t).
 * Excludes any post-hoc realization variables (e.g. final revised cost, eventual completion date).
 */
export interface KnownAtPredictionFeatures {
  projectCode: string;
  sanctionedCost: number; // ₹ Cr (Original Sanctioned Cost approved at sanction)
  projectAgeMonths: number; // Elapsed months from start date to current observation date
  plannedDurationMonths: number; // Original targeted timeline duration
  currentExpenditure: number; // Cumulative expenditure disbursed up to observation date
  physicalProgress: number; // 0 - 100% physically certified at observation date
  progressGap: number; // S-curve expected progress % - actual physical progress %
  expenditureIntensity: number; // Financial spend ratio / Physical progress ratio
  sector: string;
  ministry: string;
  state: string;
  terrainComplexityIndex: number; // 0.1 to 1.0 based on hill/geotechnical severity
}

/**
 * OUTCOME / LABEL FIELDS:
 * Variables realized AFTER project execution or revision.
 * STRICTLY FORBIDDEN from being used as model input features.
 */
export interface OutcomeLabelFields {
  revisedCost: number; // Final or revised anticipated cost
  costEscalation: number; // revisedCost - originalCost
  costEscalationPercentage: number;
  hasCostOverrun: boolean; // Binary label: costEscalationPercentage >= 10%
  revisedCompletionDate: string;
  scheduleSlippageMonths: number; // Total calendar months delayed
  hasCriticalTimeOverrun: boolean; // Binary label: scheduleSlippageMonths >= 12
}

export type TargetVariableType =
  | 'COST_OVERRUN_BINARY' // Classification: P(Cost Escalation >= 10%)
  | 'TIME_OVERRUN_BINARY' // Classification: P(Schedule Slippage >= 12 mo)
  | 'COST_OVERRUN_PERCENTAGE' // Regression: Estimated % cost escalation
  | 'TIME_SLIPPAGE_MONTHS'; // Regression: Estimated delay in months

export interface TargetVariableDefinition {
  id: TargetVariableType;
  name: string;
  type: 'classification' | 'regression';
  description: string;
  leakageRule: string; // Explains what features are forbidden
}

export type ModelStatus =
  | 'OPERATIONAL_DETERMINISTIC'
  | 'AWAITING_HISTORICAL_DATA'
  | 'TRAINED'
  | 'EVALUATED';

export type ValidationStrategy =
  | 'TEMPORAL_SPLIT' // Train on t <= T_cutoff, Test on t > T_cutoff
  | 'ROLLING_WINDOW_TEMPORAL'
  | 'PURGED_TIME_SERIES_CV';

export interface ModelPerformanceMetrics {
  modelName: string;
  modelType: 'Statistical Baseline' | 'ML Ensemble (Random Forest / GBDT Surrogate)' | 'Deterministic Decision Support';
  metricsAvailable: boolean; // FALSE when historical training data is insufficient
  statusReason?: string;
  datasetSize: number;
  evaluatedOn: string;
  // Classification metrics (only when metricsAvailable === true)
  accuracy?: number;
  precision?: number;
  recall?: number;
  f1Score?: number;
  rocAuc?: number;
  // Regression metrics (only when metricsAvailable === true)
  mae?: number; // Mean Absolute Error
  rmse?: number; // Root Mean Squared Error
  r2?: number; // R-squared coefficient
  statusNote: string;
}

export interface ModelRegistryEntry {
  modelVersion: string; // e.g. "v0.1-heuristic", "v1.0-xgb-paimana"
  modelName: string;
  modelTier: 'Tier 1: Deterministic Risk Scoring' | 'Tier 2: Statistical Baseline' | 'Tier 3: Machine Learning Model';
  algorithm: string; // e.g. "Multi-Factor Weighted Scoring", "Logistic Regression", "Gradient Boosted Trees"
  trainingDate?: string;
  trainingDataset: string;
  featureSet: string[];
  targetVariable: string;
  validationStrategy: string;
  metrics: ModelPerformanceMetrics;
  status: ModelStatus;
  runtimeProvider: 'local-ts-engine' | 'python-fastapi-service';
  notes: string;
}

export interface FeatureImportanceEntry {
  featureName: string;
  importanceScore: number; // Normalized 0 - 1
  associatedTarget: string;
  directionality: 'Positive' | 'Negative' | 'Non-linear';
  interpretation: string; // Non-causal associative phrasing!
}

export interface BenchmarkingMetrics {
  categoryName: string;
  totalProjects: number;
  avgCostEscalationPercent: number;
  avgScheduleSlippageMonths: number;
  avgPhysicalProgress: number;
  avgExpenditureRatio: number;
  highRiskProjectCount: number;
}

export interface CostDriverImpact {
  driverName: string;
  associationScore: number; // 0 - 1 (correlation/feature importance)
  impactLevel: 'Very High' | 'High' | 'Moderate' | 'Low';
  description: string;
  observedCorrelation: string;
}
