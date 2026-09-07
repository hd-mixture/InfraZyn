/**
 * Benchmarking & Comparative Analytics Engine
 * Compares Sector vs Sector, Ministry vs Ministry, State vs State, and Project vs Sector Averages.
 * Team: InfraZyn (SIH26103)
 */

import { InfraProject, BenchmarkingMetrics } from '@/types/infrastructure';
import { calculateDerivedMetrics } from './derived-metrics';
import { calculateProjectRisk } from './risk-engine';

export interface ProjectBenchmarkDelta {
  projectCostEscalationPercent: number;
  sectorAvgCostEscalationPercent: number;
  costEscalationDelta: number; // positive = worse than sector avg

  projectScheduleSlippageMonths: number;
  sectorAvgScheduleSlippageMonths: number;
  scheduleSlippageDelta: number; // positive = more delayed than sector avg

  projectPhysicalProgress: number;
  sectorAvgPhysicalProgress: number;
  physicalProgressDelta: number;

  projectRiskScore: number;
  sectorAvgRiskScore: number;
}

/**
 * Aggregates benchmarking metrics for a group of projects
 */
export function aggregateMetricsByGroup(
  projects: InfraProject[],
  groupKey: 'sector' | 'ministry' | 'state'
): BenchmarkingMetrics[] {
  const groups: Record<string, InfraProject[]> = {};

  projects.forEach(p => {
    const key = p[groupKey] || 'Other';
    if (!groups[key]) groups[key] = [];
    groups[key].push(p);
  });

  return Object.entries(groups).map(([categoryName, projs]) => {
    const count = projs.length;
    let totalEscalationPct = 0;
    let totalSlippageMonths = 0;
    let totalPhysicalProg = 0;
    let totalExpRatio = 0;
    let highRiskCount = 0;

    projs.forEach(p => {
      const derived = calculateDerivedMetrics(p);
      const risk = calculateProjectRisk(p);

      totalEscalationPct += derived.costEscalationPercentage;
      totalSlippageMonths += derived.scheduleSlippageMonths;
      totalPhysicalProg += p.physicalProgress;
      totalExpRatio += derived.expenditureRatio;

      if (risk.riskLevel === 'HIGH' || risk.riskLevel === 'CRITICAL') {
        highRiskCount++;
      }
    });

    return {
      categoryName,
      totalProjects: count,
      avgCostEscalationPercent: Number((totalEscalationPct / count).toFixed(1)),
      avgScheduleSlippageMonths: Number((totalSlippageMonths / count).toFixed(1)),
      avgPhysicalProgress: Number((totalPhysicalProg / count).toFixed(1)),
      avgExpenditureRatio: Number((totalExpRatio / count).toFixed(2)),
      highRiskProjectCount: highRiskCount,
    };
  }).sort((a, b) => b.avgCostEscalationPercent - a.avgCostEscalationPercent);
}

/**
 * Compares a specific project against its sector's average benchmarks
 */
export function compareProjectToSector(
  project: InfraProject,
  allProjects: InfraProject[]
): ProjectBenchmarkDelta {
  const sectorProjects = allProjects.filter(p => p.sector === project.sector);
  const pDerived = calculateDerivedMetrics(project);
  const pRisk = calculateProjectRisk(project);

  let totalEscPct = 0;
  let totalSlip = 0;
  let totalProg = 0;
  let totalRisk = 0;
  const count = sectorProjects.length || 1;

  sectorProjects.forEach(sp => {
    const d = calculateDerivedMetrics(sp);
    const r = calculateProjectRisk(sp);
    totalEscPct += d.costEscalationPercentage;
    totalSlip += d.scheduleSlippageMonths;
    totalProg += sp.physicalProgress;
    totalRisk += r.overallScore;
  });

  const sectorAvgCostEscalationPercent = Number((totalEscPct / count).toFixed(1));
  const sectorAvgScheduleSlippageMonths = Number((totalSlip / count).toFixed(1));
  const sectorAvgPhysicalProgress = Number((totalProg / count).toFixed(1));
  const sectorAvgRiskScore = Math.round(totalRisk / count);

  return {
    projectCostEscalationPercent: pDerived.costEscalationPercentage,
    sectorAvgCostEscalationPercent,
    costEscalationDelta: Number((pDerived.costEscalationPercentage - sectorAvgCostEscalationPercent).toFixed(1)),

    projectScheduleSlippageMonths: pDerived.scheduleSlippageMonths,
    sectorAvgScheduleSlippageMonths,
    scheduleSlippageDelta: Number((pDerived.scheduleSlippageMonths - sectorAvgScheduleSlippageMonths).toFixed(1)),

    projectPhysicalProgress: project.physicalProgress,
    sectorAvgPhysicalProgress,
    physicalProgressDelta: Number((project.physicalProgress - sectorAvgPhysicalProgress).toFixed(1)),

    projectRiskScore: pRisk.overallScore,
    sectorAvgRiskScore,
  };
}
