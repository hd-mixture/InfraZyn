'use client';

/**
 * Cost Escalation Driver Analysis
 * MoSPI / IPMD PAIMANA Ecosystem
 * Team: InfraZyn (SIH26103)
 */

import React, { useMemo } from 'react';
import { InfraProject } from '@/types/infrastructure';
import { analyzeCostDrivers } from '@/lib/infrastructure/cost-drivers';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  TrendingUp,
  Activity,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  Compass,
  FileSpreadsheet,
} from 'lucide-react';

interface InfraCostDriversProps {
  projects: InfraProject[];
}

export function InfraCostDrivers({ projects }: InfraCostDriversProps) {
  const drivers = useMemo(() => analyzeCostDrivers(projects), [projects]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-xl border border-amber-200 dark:border-amber-900/40 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/10 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge className="bg-amber-600 text-white font-semibold">
              Root Cause Intelligence
            </Badge>
            <span className="text-xs text-muted-foreground font-mono">
              PAIMANA July 2026 Snapshot
            </span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Cost Escalation Driver & Correlation Analysis
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Empirical evaluation of measurable operational, geological, and financial factors associated with project budget overruns.
          </p>
        </div>

        <div className="text-xs bg-white dark:bg-slate-900 border px-3 py-2 rounded-lg max-w-xs text-muted-foreground">
          <span className="font-semibold text-foreground">Analytical Policy Note:</span> Variables indicate empirical correlation and association patterns, and do not represent formal legal or administrative causation.
        </div>
      </div>

      {/* Drivers List */}
      <div className="space-y-4">
        {drivers.map((driver, index) => (
          <Card key={index} className="border-slate-200 dark:border-slate-800 shadow-sm">
            <CardContent className="p-5">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      #{index + 1}. {driver.driverName}
                    </span>
                    <Badge
                      className={
                        driver.impactLevel === 'Very High' ? 'bg-red-600 text-white' :
                        driver.impactLevel === 'High' ? 'bg-orange-500 text-white' :
                        'bg-amber-500 text-slate-950'
                      }
                    >
                      {driver.impactLevel} Association
                    </Badge>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {driver.description}
                  </p>

                  <div className="text-xs font-mono font-medium text-blue-700 dark:text-blue-300">
                    Observed Metric: {driver.observedCorrelation}
                  </div>
                </div>

                {/* Association Strength Gauge */}
                <div className="sm:w-[180px] p-3 rounded-lg border bg-slate-50 dark:bg-slate-800/40 text-center shrink-0">
                  <div className="text-xs text-muted-foreground font-medium">Association Strength</div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
                    {(driver.associationScore * 100).toFixed(0)}%
                  </div>
                  <Progress value={driver.associationScore * 100} className="h-1.5 mt-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Policy Insights & Interventions Grid */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            Strategic Interventions to Mitigate Escalation Drivers
          </CardTitle>
          <CardDescription className="text-xs">
            Actionable policy recommendations informed by IPMD / MoSPI monitoring patterns
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 text-xs">
          <div className="p-3 rounded-lg border bg-slate-50 dark:bg-slate-800/40 space-y-1">
            <div className="font-bold text-slate-900 dark:text-white">Pre-Construction RoW Mandate</div>
            <p className="text-muted-foreground leading-relaxed">
              Mandate 80% encumbrance-free land acquisition and statutory environmental clearances prior to tender award to decouple timeline slippage from civil contractor idling claims.
            </p>
          </div>

          <div className="p-3 rounded-lg border bg-slate-50 dark:bg-slate-800/40 space-y-1">
            <div className="font-bold text-slate-900 dark:text-white">Geotechnical Risk Contingencies</div>
            <p className="text-muted-foreground leading-relaxed">
              Incorporate 3D seismic profiling and advanced pilot bore investigations in young Himalayan zones (USBRL, Zojila, Sivok-Rangpo) to absorb subsurface surprises in baseline engineering.
            </p>
          </div>

          <div className="p-3 rounded-lg border bg-slate-50 dark:bg-slate-800/40 space-y-1">
            <div className="font-bold text-slate-900 dark:text-white">Milestone-Linked Financial Disbursement</div>
            <p className="text-muted-foreground leading-relaxed">
              Cap contractor mobilization advances and tie progress billing strictly to verified physical milestones, curbing high expenditure intensity with lagging physical ground reality.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
