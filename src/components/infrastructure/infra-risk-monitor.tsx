'use client';

/**
 * Centralized Risk Monitor & Early Warning Triage Matrix
 * MoSPI / IPMD PAIMANA Ecosystem
 * Team: InfraZyn (SIH26103)
 */

import React, { useState, useMemo } from 'react';
import { InfraProject, EarlyWarning, WarningSeverity, WarningCategory } from '@/types/infrastructure';
import { detectAllEarlyWarnings } from '@/lib/infrastructure/early-warning-engine';
import { calculateProjectRisk } from '@/lib/infrastructure/risk-engine';
import { calculateDerivedMetrics } from '@/lib/infrastructure/derived-metrics';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertTriangle,
  Zap,
  ShieldAlert,
  ArrowRight,
  Filter,
  CheckCircle2,
  Clock,
  TrendingUp,
} from 'lucide-react';

interface InfraRiskMonitorProps {
  projects: InfraProject[];
  onSelectProject: (project: InfraProject) => void;
}

export function InfraRiskMonitor({ projects, onSelectProject }: InfraRiskMonitorProps) {
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const allWarnings = useMemo(() => detectAllEarlyWarnings(projects), [projects]);

  const filteredWarnings = useMemo(() => {
    return allWarnings.filter(w => {
      if (severityFilter !== 'all' && w.severity !== severityFilter) return false;
      if (categoryFilter !== 'all' && w.category !== categoryFilter) return false;
      return true;
    });
  }, [allWarnings, severityFilter, categoryFilter]);

  const counts = useMemo(() => {
    let critical = 0;
    let high = 0;
    let medium = 0;
    let atRiskCapital = 0;

    const atRiskProjectIds = new Set<string>();

    allWarnings.forEach(w => {
      if (w.severity === 'CRITICAL') critical++;
      if (w.severity === 'HIGH') high++;
      if (w.severity === 'MEDIUM') medium++;
      atRiskProjectIds.add(w.projectId);
    });

    projects.forEach(p => {
      if (atRiskProjectIds.has(p.id)) {
        atRiskCapital += Number(p.revisedCost) || 0;
      }
    });

    return {
      total: allWarnings.length,
      critical,
      high,
      medium,
      atRiskCapital,
      atRiskProjectsCount: atRiskProjectIds.size,
    };
  }, [allWarnings, projects]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-xl border border-red-200 dark:border-red-900/40 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/10 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge className="bg-red-600 text-white font-semibold">
              Live Early Warning Feed
            </Badge>
            <span className="text-xs text-muted-foreground font-mono">
              PAIMANA July 2026 Snapshot
            </span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Early Warning Distress Signals & Risk Monitor
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Automated multi-factor risk heuristics identifying expenditure-progress divergence, timeline slippage, and budget breach risks.
          </p>
        </div>

        {/* Triage Summary Badges */}
        <div className="flex items-center gap-3">
          <div className="text-center px-3 py-1.5 rounded-lg border bg-white dark:bg-slate-900 shadow-xs">
            <div className="text-lg font-bold text-red-600">{counts.critical}</div>
            <div className="text-[10px] text-muted-foreground uppercase font-semibold">Critical</div>
          </div>
          <div className="text-center px-3 py-1.5 rounded-lg border bg-white dark:bg-slate-900 shadow-xs">
            <div className="text-lg font-bold text-orange-500">{counts.high}</div>
            <div className="text-[10px] text-muted-foreground uppercase font-semibold">High Priority</div>
          </div>
          <div className="text-center px-3 py-1.5 rounded-lg border bg-white dark:bg-slate-900 shadow-xs">
            <div className="text-lg font-bold text-slate-900 dark:text-white">
              ₹{(counts.atRiskCapital / 1000).toFixed(1)}k Cr
            </div>
            <div className="text-[10px] text-muted-foreground uppercase font-semibold">At-Risk Capital</div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
        <CardContent className="p-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-semibold">Filter Distress Signals:</span>

            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-[140px] h-8 text-xs">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="CRITICAL">Critical ({counts.critical})</SelectItem>
                <SelectItem value="HIGH">High ({counts.high})</SelectItem>
                <SelectItem value="MEDIUM">Medium ({counts.medium})</SelectItem>
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[150px] h-8 text-xs">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="Cost">Cost Escalation</SelectItem>
                <SelectItem value="Schedule">Schedule Slippage</SelectItem>
                <SelectItem value="Progress">Progress Gap</SelectItem>
                <SelectItem value="Multi-Risk">Multi-Risk Confluence</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="text-xs text-muted-foreground">
            Showing <span className="font-semibold text-foreground">{filteredWarnings.length}</span> active warning signals
          </div>
        </CardContent>
      </Card>

      {/* Warnings List Feed */}
      <div className="space-y-3">
        {filteredWarnings.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">
            No active early warning signals matching the current filter.
          </Card>
        ) : (
          filteredWarnings.map(warning => {
            const project = projects.find(p => p.id === warning.projectId);

            return (
              <Card
                key={warning.id}
                className="border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow"
              >
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          className={
                            warning.severity === 'CRITICAL'
                              ? 'bg-red-600 text-white font-bold'
                              : warning.severity === 'HIGH'
                              ? 'bg-orange-500 text-white font-semibold'
                              : 'bg-amber-500 text-slate-950 font-semibold'
                          }
                        >
                          {warning.severity}
                        </Badge>
                        <Badge variant="outline" className="text-xs font-mono">
                          {warning.category}
                        </Badge>
                        <span className="font-mono text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded">
                          {warning.projectCode}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {warning.projectName}
                        </span>
                      </div>

                      <div className="font-bold text-sm text-slate-900 dark:text-white pt-0.5">
                        Trigger: {warning.trigger}
                      </div>

                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {warning.explanation}
                      </p>

                      <div className="pt-2 flex items-start gap-1.5 text-xs text-blue-800 dark:text-blue-300 font-medium">
                        <span className="font-bold text-slate-900 dark:text-white">Recommended Nodal Action:</span>
                        <span>{warning.recommendedAction}</span>
                      </div>
                    </div>

                    {project && (
                      <div className="shrink-0 flex md:flex-col items-end justify-between gap-2">
                        <div className="text-right text-xs">
                          <div className="text-muted-foreground font-mono">
                            Revised Cost: ₹{project.revisedCost.toLocaleString('en-IN')} Cr
                          </div>
                          <div className="font-semibold text-slate-900 dark:text-white">
                            Progress: {project.physicalProgress}%
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onSelectProject(project)}
                          className="text-xs h-8"
                        >
                          Review Project
                          <ArrowRight className="ml-1 h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
