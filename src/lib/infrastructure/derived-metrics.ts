/**
 * Feature Engineering & Derived Indicator Layer
 * Transparent, deterministic calculations for infrastructure project monitoring.
 * Team: InfraZyn (SIH26103)
 */

import { InfraProject, DerivedMetrics } from '@/types/infrastructure';

/**
 * Calculates months difference between two ISO date strings safely
 */
export function calculateMonthsDiff(startDateStr: string, endDateStr: string): number {
  try {
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
    
    const yearDiff = end.getFullYear() - start.getFullYear();
    const monthDiff = end.getMonth() - start.getMonth();
    const totalMonths = yearDiff * 12 + monthDiff;
    return totalMonths >= 0 ? totalMonths : 0;
  } catch {
    return 0;
  }
}

/**
 * Derives comprehensive metrics from an infrastructure project record.
 * Avoids division by zero and preserves explainable calculations.
 */
export function calculateDerivedMetrics(project: InfraProject, referenceDate: Date = new Date('2026-07-31')): DerivedMetrics {
  const originalCost = Math.max(0, Number(project.originalCost) || 0);
  const revisedCost = Math.max(originalCost, Number(project.revisedCost) || originalCost);
  const cumulativeExpenditure = Math.max(0, Number(project.cumulativeExpenditure) || 0);
  const physicalProgress = Math.min(100, Math.max(0, Number(project.physicalProgress) || 0));

  // 1. Cost Escalation
  const costEscalation = Math.max(0, Number((revisedCost - originalCost).toFixed(2)));
  const costEscalationPercentage = originalCost > 0
    ? Number(((costEscalation / originalCost) * 100).toFixed(2))
    : 0;

  // 2. Expenditure Ratio & Financial Progress
  const expenditureRatio = revisedCost > 0
    ? Number((cumulativeExpenditure / revisedCost).toFixed(3))
    : 0;
  const financialProgress = Number((expenditureRatio * 100).toFixed(2));

  // 3. Timelines & Durations
  const plannedDurationMonths = calculateMonthsDiff(project.startDate, project.originalCompletionDate);
  const revisedDurationMonths = calculateMonthsDiff(project.startDate, project.revisedCompletionDate);
  
  const refDateStr = referenceDate.toISOString().split('T')[0];
  const projectAgeMonths = calculateMonthsDiff(project.startDate, refDateStr);
  
  // Schedule Slippage: Difference between revised and original completion
  const slippageRaw = calculateMonthsDiff(project.originalCompletionDate, project.revisedCompletionDate);
  const scheduleSlippageMonths = slippageRaw > 0 ? slippageRaw : 0;

  // Completion Proximity: Months remaining till revised completion
  const targetEnd = new Date(project.revisedCompletionDate);
  const isPastTarget = targetEnd.getTime() < referenceDate.getTime();
  const completionProximityMonths = isPastTarget ? 0 : calculateMonthsDiff(refDateStr, project.revisedCompletionDate);

  // 4. Expected Physical Progress based on planned duration elapsed
  let expectedPhysicalProgress = 0;
  if (revisedDurationMonths > 0) {
    const elapsedRatio = Math.min(1.0, projectAgeMonths / revisedDurationMonths);
    // S-curve approximation for infrastructure: slower at start, steep in middle, slower at finish
    // S(t) = 3*(t^2) - 2*(t^3) (smooth cubic hermite)
    const sCurve = (3 * Math.pow(elapsedRatio, 2)) - (2 * Math.pow(elapsedRatio, 3));
    expectedPhysicalProgress = Number((Math.min(100, Math.max(0, sCurve * 100))).toFixed(1));
  } else {
    expectedPhysicalProgress = physicalProgress;
  }

  // 5. Progress Gap (expected minus actual)
  const progressGap = Number((Math.max(0, expectedPhysicalProgress - physicalProgress)).toFixed(1));

  // 6. Expenditure Intensity (financial progress vs physical progress)
  // If financial progress is way higher than physical progress, expenditure is outstripping physical realization
  const safePhysical = Math.max(1, physicalProgress);
  const expenditureIntensity = Number((financialProgress / safePhysical).toFixed(2));

  const isCostOverrun = costEscalation > 0 || expenditureRatio > 0.95;
  const isTimeOverrun = scheduleSlippageMonths > 0 || (isPastTarget && physicalProgress < 100);

  return {
    costEscalation,
    costEscalationPercentage,
    expenditureRatio,
    financialProgress,
    plannedDurationMonths,
    revisedDurationMonths,
    projectAgeMonths,
    scheduleSlippageMonths,
    completionProximityMonths,
    expectedPhysicalProgress,
    progressGap,
    expenditureIntensity,
    isTimeOverrun,
    isCostOverrun,
  };
}
