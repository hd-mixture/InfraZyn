/**
 * Early Warning Engine
 * Automated detection of emerging project distress patterns.
 * Team: InfraZyn (SIH26103)
 */

import { InfraProject, EarlyWarning, WarningSeverity, WarningCategory } from '@/types/infrastructure';
import { calculateDerivedMetrics } from './derived-metrics';
import { calculateProjectRisk } from './risk-engine';

/**
 * Evaluates an individual project and generates any active early warnings
 */
export function detectEarlyWarningsForProject(project: InfraProject): EarlyWarning[] {
  const warnings: EarlyWarning[] = [];
  const metrics = calculateDerivedMetrics(project);
  const risk = calculateProjectRisk(project);
  const nowStr = new Date().toISOString();

  // 1. Critical Disconnect: High Expenditure with Lagging Physical Progress
  if (metrics.financialProgress >= 50 && project.physicalProgress <= 35) {
    warnings.push({
      id: `EW-${project.id}-EXP-LAG`,
      projectId: project.id,
      projectName: project.projectName,
      projectCode: project.projectCode,
      severity: 'CRITICAL',
      category: 'Cost',
      trigger: `Financial expenditure (${metrics.financialProgress}%) outstrips physical completion (${project.physicalProgress}%).`,
      explanation: `Cumulative expenditure has reached ₹${project.cumulativeExpenditure.toLocaleString('en-IN')} Cr while physical progress stands at only ${project.physicalProgress}%. This strongly signals contractor mobilization advances or billing outpacing verified ground reality.`,
      detectedAt: nowStr,
      recommendedAction: 'Immediate third-party physical milestone audit before releasing further payment tranches.',
      status: 'Active',
    });
  }

  // 2. Severe Cost Overrun Alert
  if (metrics.costEscalationPercentage >= 35) {
    const severity: WarningSeverity = metrics.costEscalationPercentage >= 60 ? 'CRITICAL' : 'HIGH';
    warnings.push({
      id: `EW-${project.id}-COST-OVER`,
      projectId: project.id,
      projectName: project.projectName,
      projectCode: project.projectCode,
      severity,
      category: 'Cost',
      trigger: `Cost escalation exceeds ${metrics.costEscalationPercentage}% over original sanction.`,
      explanation: `Project cost has surged from ₹${project.originalCost.toLocaleString('en-IN')} Cr to ₹${project.revisedCost.toLocaleString('en-IN')} Cr (Escalation: ₹${metrics.costEscalation.toLocaleString('en-IN')} Cr). Major drivers include revised scope, land acquisition delays, and material cost inflation.`,
      detectedAt: nowStr,
      recommendedAction: 'Submit revised cost estimates (RCE) to Expenditure Finance Committee (EFC) and initiate value engineering review.',
      status: 'Active',
    });
  }

  // 3. Severe Schedule Slippage Alert
  if (metrics.scheduleSlippageMonths >= 24) {
    const severity: WarningSeverity = metrics.scheduleSlippageMonths >= 48 ? 'CRITICAL' : 'HIGH';
    warnings.push({
      id: `EW-${project.id}-SCHED-SLIP`,
      projectId: project.id,
      projectName: project.projectName,
      projectCode: project.projectCode,
      severity,
      category: 'Schedule',
      trigger: `Timeline extended by ${metrics.scheduleSlippageMonths} months past original target DoC.`,
      explanation: `Target Date of Commissioning has slipped from ${project.originalCompletionDate} to ${project.revisedCompletionDate}. Persistent critical path bottlenecks remain unresolved.`,
      detectedAt: nowStr,
      recommendedAction: 'Enforce critical path re-sequencing and convene state-level coordination meeting for right-of-way (RoW) clearances.',
      status: 'Active',
    });
  }

  // 4. Imminent Target Date with Substantial Incomplete Works
  if (metrics.completionProximityMonths <= 6 && project.physicalProgress < 75 && project.status !== 'Completed') {
    warnings.push({
      id: `EW-${project.id}-IMMINENT-DUE`,
      projectId: project.id,
      projectName: project.projectName,
      projectCode: project.projectCode,
      severity: 'HIGH',
      category: 'Schedule',
      trigger: `Less than ${metrics.completionProximityMonths} months remaining with ${100 - project.physicalProgress}% physical works pending.`,
      explanation: `The scheduled completion deadline is approaching rapidly while ground completion is only ${project.physicalProgress}%, making target breach virtually certain without intensive acceleration.`,
      detectedAt: nowStr,
      recommendedAction: 'Mobilize additional contractor shifts and review resource constraints on critical civil packages.',
      status: 'Active',
    });
  }

  // 5. Execution Deficit / Progress Gap
  if (metrics.progressGap >= 25) {
    warnings.push({
      id: `EW-${project.id}-GAP-DEFICIT`,
      projectId: project.id,
      projectName: project.projectName,
      projectCode: project.projectCode,
      severity: 'MEDIUM',
      category: 'Progress',
      trigger: `Progress gap of ${metrics.progressGap}% compared to projected S-curve baseline.`,
      explanation: `Expected physical progress based on time elapsed is ${metrics.expectedPhysicalProgress}%, but verified progress is only ${project.physicalProgress}%.`,
      detectedAt: nowStr,
      recommendedAction: 'Review machinery downtime, labor availability, and seasonal disruption recovery plans.',
      status: 'Active',
    });
  }

  // 6. Multi-Risk Confluence Warning
  if (risk.subscores.costRisk >= 65 && risk.subscores.scheduleRisk >= 65) {
    warnings.push({
      id: `EW-${project.id}-CONFLUENCE`,
      projectId: project.id,
      projectName: project.projectName,
      projectCode: project.projectCode,
      severity: 'CRITICAL',
      category: 'Multi-Risk',
      trigger: `Simultaneous severe cost escalation and major timeline overrun detected.`,
      explanation: `Compound risk status: Both cost risk (${risk.subscores.costRisk}/100) and schedule risk (${risk.subscores.scheduleRisk}/100) are elevated simultaneously. These dual pressures severely amplify default probability.`,
      detectedAt: nowStr,
      recommendedAction: 'Mandatory high-level nodal officer intervention and restructuring of project delivery timeline.',
      status: 'Active',
    });
  }

  return warnings;
}

/**
 * Evaluates all projects across the portfolio and aggregates all active warnings
 */
export function detectAllEarlyWarnings(projects: InfraProject[]): EarlyWarning[] {
  return projects.flatMap(detectEarlyWarningsForProject);
}
