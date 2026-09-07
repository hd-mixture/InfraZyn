'use client';

/**
 * Infrastructure Project Comprehensive Detail View
 * Complete 14-Section Deep-Dive Analysis
 * MoSPI / IPMD PAIMANA Platform
 * Team: InfraZyn (SIH26103)
 */

import React, { useState, useEffect } from 'react';
import { InfraProject } from '@/types/infrastructure';
import { calculateDerivedMetrics } from '@/lib/infrastructure/derived-metrics';
import { calculateProjectRisk } from '@/lib/infrastructure/risk-engine';
import { detectEarlyWarningsForProject } from '@/lib/infrastructure/early-warning-engine';
import { predictCostOverrunML, predictTimeOverrun } from '@/lib/infrastructure/ml-engine';
import { compareProjectToSector } from '@/lib/infrastructure/benchmarking';
import { predictProjectWithML, MLPredictionResult } from '@/lib/infrastructure/ml-api-client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  ArrowLeft,
  AlertTriangle,
  Building2,
  Calendar,
  Clock,
  TrendingUp,
  MapPin,
  CheckCircle2,
  Activity,
  Zap,
  BarChart3,
  HelpCircle,
  FileText,
  ShieldAlert,
  Layers,
  Server,
  RefreshCw,
  Cpu,
  Info,
} from 'lucide-react';

interface InfraProjectDetailProps {
  project: InfraProject;
  allProjects: InfraProject[];
  onBack: () => void;
  onNavigateToAssistantWithQuery: (query: string) => void;
}

export function InfraProjectDetail({
  project,
  allProjects,
  onBack,
  onNavigateToAssistantWithQuery,
}: InfraProjectDetailProps) {
  const derived = calculateDerivedMetrics(project);
  const risk = calculateProjectRisk(project);
  const warnings = detectEarlyWarningsForProject(project);
  const costML = predictCostOverrunML(project);
  const timeML = predictTimeOverrun(project);
  const benchmark = compareProjectToSector(project, allProjects);

  const [activeTab, setActiveTab] = useState<'overview' | 'risk' | 'milestones' | 'benchmarks'>('overview');
  const [liveML, setLiveML] = useState<MLPredictionResult | null>(null);
  const [loadingML, setLoadingML] = useState(false);
  const [mlAvailable, setMlAvailable] = useState<boolean | null>(null);

  const fetchLiveML = async () => {
    setLoadingML(true);
    try {
      const res = await predictProjectWithML(project);
      if (res) {
        setLiveML(res);
        setMlAvailable(true);
      } else {
        setMlAvailable(false);
      }
    } catch {
      setMlAvailable(false);
    } finally {
      setLoadingML(false);
    }
  };

  useEffect(() => {
    fetchLiveML();
  }, [project.projectCode]);

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b">
        <Button variant="ghost" size="sm" onClick={onBack} className="text-xs">
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Back to Projects Registry
        </Button>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigateToAssistantWithQuery(`Analyze ${project.projectName} (${project.projectCode}). Why is it high risk and what interventions are needed?`)}
            className="text-xs border-blue-400 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950"
          >
            <Zap className="mr-1.5 h-3.5 w-3.5 text-amber-500" />
            Ask AI Assistant About This Project
          </Button>
        </div>
      </div>

      {/* SECTION 1: Project Overview & Meta Header */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-2 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-semibold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-blue-600 dark:text-blue-400">
                {project.projectCode}
              </span>
              {project.legacyCode && (
                <span className="font-mono text-xs text-muted-foreground bg-slate-50 dark:bg-slate-800/60 px-2 py-0.5 rounded">
                  {project.legacyCode}
                </span>
              )}
              <Badge variant="outline" className="text-xs">
                {project.projectType}
              </Badge>
              <Badge className={
                project.status === 'Critical' ? 'bg-red-600' :
                project.status === 'Delayed' ? 'bg-orange-500' :
                project.status === 'Ongoing' ? 'bg-blue-600' : 'bg-emerald-600'
              }>
                {project.status}
              </Badge>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              {project.projectName}
            </h1>

            <p className="text-sm text-muted-foreground leading-relaxed">
              {project.description || `${project.sector} infrastructure project under ${project.agency}, situated in ${project.state}.`}
            </p>

            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-1">
              <span className="flex items-center gap-1 font-medium text-foreground">
                <Building2 className="h-3.5 w-3.5 text-blue-500" />
                {project.agency}
              </span>
              <span>•</span>
              <span>{project.ministry}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-emerald-500" />
                {project.state}
              </span>
              <span>•</span>
              <span className="text-amber-600 dark:text-amber-400 font-medium">
                {project.sourceSnapshot}
              </span>
            </div>
          </div>

          {/* Overall Risk Score Badge Box */}
          <div className={`p-4 rounded-xl border text-center min-w-[160px] ${
            risk.riskLevel === 'CRITICAL' ? 'bg-red-50 border-red-300 dark:bg-red-950/40 dark:border-red-800' :
            risk.riskLevel === 'HIGH' ? 'bg-orange-50 border-orange-300 dark:bg-orange-950/40 dark:border-orange-800' :
            risk.riskLevel === 'MEDIUM' ? 'bg-amber-50 border-amber-300 dark:bg-amber-950/40 dark:border-amber-800' :
            'bg-emerald-50 border-emerald-300 dark:bg-emerald-950/40 dark:border-emerald-800'
          }`}>
            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Overall Project Risk
            </div>
            <div className="text-4xl font-extrabold mt-1 text-slate-900 dark:text-white">
              {risk.overallScore} <span className="text-base font-normal text-muted-foreground">/ 100</span>
            </div>
            <div className="mt-1">
              <Badge className={`text-xs font-semibold ${
                risk.riskLevel === 'CRITICAL' ? 'bg-red-600 text-white' :
                risk.riskLevel === 'HIGH' ? 'bg-orange-500 text-white' :
                risk.riskLevel === 'MEDIUM' ? 'bg-amber-500 text-slate-950' : 'bg-emerald-600 text-white'
              }`}>
                {risk.riskLevel} RISK
              </Badge>
            </div>
            <div className="text-[10px] text-muted-foreground mt-1">
              Confidence: {risk.modelConfidence}%
            </div>
          </div>
        </div>
      </div>

      {/* 4 Core Financial & Timeline Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Cost Analysis Card */}
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1.5">
              <span className="text-blue-600 font-bold">₹</span> Cost Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-2">
            <div>
              <div className="text-xs text-muted-foreground">Revised Anticipated Cost</div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                ₹{project.revisedCost.toLocaleString('en-IN')} <span className="text-xs font-normal">Cr</span>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs pt-2 border-t">
              <span className="text-muted-foreground">Original Sanction:</span>
              <span className="font-semibold">₹{project.originalCost.toLocaleString('en-IN')} Cr</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Net Escalation:</span>
              <span className={`font-semibold ${derived.costEscalationPercentage > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                +₹{derived.costEscalation.toLocaleString('en-IN')} Cr ({derived.costEscalationPercentage}%)
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Expenditure & Burn Rate Card */}
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4 text-emerald-600" /> Cumulative Spend
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-2">
            <div>
              <div className="text-xs text-muted-foreground">Total Cumulative Expenditure</div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                ₹{project.cumulativeExpenditure.toLocaleString('en-IN')} <span className="text-xs font-normal">Cr</span>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs pt-2 border-t">
              <span className="text-muted-foreground">Financial Progress:</span>
              <span className="font-semibold">{derived.financialProgress}%</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Expenditure Intensity:</span>
              <span className={`font-semibold ${derived.expenditureIntensity > 1.3 ? 'text-red-600' : 'text-slate-700 dark:text-slate-300'}`}>
                {derived.expenditureIntensity}x
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Physical Progress Card */}
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1.5">
              <Activity className="h-4 w-4 text-cyan-600" /> Physical Execution
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-2">
            <div>
              <div className="text-xs text-muted-foreground">Ground Physical Progress</div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {project.physicalProgress}%
              </div>
            </div>
            <Progress value={project.physicalProgress} className="h-2 mt-1" />
            <div className="flex items-center justify-between text-xs pt-2 border-t">
              <span className="text-muted-foreground">Expected S-Curve:</span>
              <span className="font-semibold">{derived.expectedPhysicalProgress}%</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Progress Gap:</span>
              <span className={`font-semibold ${derived.progressGap > 15 ? 'text-red-600' : 'text-emerald-600'}`}>
                {derived.progressGap > 0 ? `-${derived.progressGap}% lag` : 'On Schedule'}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Schedule & Slippage Card */}
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-orange-600" /> Timelines & Slippage
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-2">
            <div>
              <div className="text-xs text-muted-foreground">Revised Target Completion</div>
              <div className="text-lg font-bold text-slate-900 dark:text-white">
                {project.revisedCompletionDate}
              </div>
            </div>
            <div className="flex items-center justify-between text-xs pt-2 border-t">
              <span className="text-muted-foreground">Original Target:</span>
              <span className="font-semibold">{project.originalCompletionDate}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Schedule Slippage:</span>
              <span className={`font-semibold ${derived.scheduleSlippageMonths > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                {derived.scheduleSlippageMonths > 0 ? `+${derived.scheduleSlippageMonths} months delay` : 'Nil'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SECTION 9 & 11: Multi-Factor Risk Subscores & Explainability */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risk Subscores Column */}
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-red-600" />
              Risk Subscores Breakdown (0 - 100)
            </CardTitle>
            <CardDescription className="text-xs">
              InfraZyn Multi-Factor Weights (Cost 30%, Schedule 30%, Progress 25%, Complexity 15%)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Cost Risk */}
            <div>
              <div className="flex justify-between text-xs mb-1 font-medium">
                <span>Cost Risk Subscore</span>
                <span className="font-bold text-amber-600">{risk.subscores.costRisk} / 100</span>
              </div>
              <Progress value={risk.subscores.costRisk} className="h-2" />
            </div>

            {/* Schedule Risk */}
            <div>
              <div className="flex justify-between text-xs mb-1 font-medium">
                <span>Schedule Risk Subscore</span>
                <span className="font-bold text-red-600">{risk.subscores.scheduleRisk} / 100</span>
              </div>
              <Progress value={risk.subscores.scheduleRisk} className="h-2" />
            </div>

            {/* Progress Risk */}
            <div>
              <div className="flex justify-between text-xs mb-1 font-medium">
                <span>Progress / Execution Risk</span>
                <span className="font-bold text-orange-600">{risk.subscores.progressRisk} / 100</span>
              </div>
              <Progress value={risk.subscores.progressRisk} className="h-2" />
            </div>

            {/* Implementation Risk */}
            <div>
              <div className="flex justify-between text-xs mb-1 font-medium">
                <span>Implementation / Terrain Complexity</span>
                <span className="font-bold text-blue-600">{risk.subscores.implementationRisk} / 100</span>
              </div>
              <Progress value={risk.subscores.implementationRisk} className="h-2" />
            </div>

            {/* Live ML Microservice Inferences */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs space-y-2.5 border border-blue-200/60 dark:border-blue-900/40">
              <div className="flex items-center justify-between">
                <span className="font-bold text-foreground flex items-center gap-1.5">
                  <Cpu className="h-4 w-4 text-blue-600" />
                  Live ML Inferences (FastAPI)
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={fetchLiveML}
                  disabled={loadingML}
                  className="h-6 px-1.5 text-[10px]"
                >
                  <RefreshCw className={`h-2.5 w-2.5 mr-1 ${loadingML ? 'animate-spin' : ''}`} />
                  Predict
                </Button>
              </div>

              {liveML ? (
                <div className="space-y-2 text-[11px]">
                  <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Cost Overrun Prob (XGBoost):</span>
                      <span className="font-bold text-amber-600 font-mono">
                        {liveML.cost_overrun.probability_percent}%
                      </span>
                    </div>
                    <div className="text-[10px] text-muted-foreground flex justify-between mt-0.5">
                      <span>Baseline: {liveML.cost_overrun.baseline_probability_percent}%</span>
                      <Badge variant="outline" className="text-[9px] py-0">{liveML.cost_overrun.risk_band}</Badge>
                    </div>
                  </div>

                  <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Time Overrun Prob (XGBoost):</span>
                      <span className="font-bold text-red-600 font-mono">
                        {liveML.time_overrun.probability_percent}%
                      </span>
                    </div>
                    <div className="text-[10px] text-muted-foreground flex justify-between mt-0.5">
                      <span>Baseline: {liveML.time_overrun.baseline_probability_percent}%</span>
                      <Badge variant="outline" className="text-[9px] py-0">{liveML.time_overrun.risk_band}</Badge>
                    </div>
                  </div>

                  {liveML.top_contributing_features.length > 0 && (
                    <div className="pt-1 text-[10px] text-muted-foreground">
                      <span className="font-semibold text-foreground">Top ML Driver: </span>
                      {liveML.top_contributing_features[0].impact_description}
                    </div>
                  )}

                  <div className="text-[9px] text-muted-foreground pt-1 border-t">
                    *Trained on synthetic longitudinal development data (N = 1,200) for pipeline validation.
                  </div>
                </div>
              ) : (
                <div className="space-y-1 text-[11px] text-muted-foreground">
                  <div>
                    Cost Overrun Prob: <span className="font-bold text-amber-600">{costML.probabilityPercent}%</span> ({costML.riskLevel})
                  </div>
                  <div>
                    Time Overrun Prob: <span className="font-bold text-red-600">{timeML.probabilityPercent}%</span> ({timeML.riskLevel})
                  </div>
                  {mlAvailable === false && (
                    <div className="text-[10px] text-amber-700 dark:text-amber-400 pt-1">
                      (FastAPI service offline, showing local fallback heuristic)
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* "Why is this project high risk?" Explainability Card */}
        <Card className="lg:col-span-2 border-slate-200 dark:border-slate-800 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <HelpCircle className="h-4 w-4 text-amber-600" />
              Why is this Project at Risk? (Explainability & Drivers)
            </CardTitle>
            <CardDescription className="text-xs">
              Transparent root causes derived from PAIMANA milestone, cost, and timeline records
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              {risk.contributingFactors.map((factor, index) => (
                <div key={index} className="flex items-start gap-2 text-xs p-2.5 rounded-lg border border-amber-200/60 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-900/40">
                  <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <span className="text-slate-800 dark:text-slate-200 leading-relaxed font-medium">{factor}</span>
                </div>
              ))}
            </div>

            {/* SECTION 12: Recommended Actions */}
            <div className="pt-2">
              <div className="text-xs font-bold uppercase text-muted-foreground tracking-wider mb-2">
                Recommended Nodal Interventions
              </div>
              <div className="space-y-1.5">
                {risk.recommendedActions.map((action, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
                    <CheckCircle2 className="h-3.5 w-3.5 text-blue-600 shrink-0 mt-0.5" />
                    <span>{action}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SECTION 10: Active Early Warnings Alert Feed */}
      {warnings.length > 0 && (
        <Card className="border-red-200 dark:border-red-900/50 shadow-sm bg-red-50/20 dark:bg-red-950/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold text-red-900 dark:text-red-300 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Active Early Warnings ({warnings.length} Detected)
            </CardTitle>
            <CardDescription className="text-xs text-red-800/70 dark:text-red-300/70">
              Automated trigger conditions requiring immediate Project Monitoring Group review
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-2">
            {warnings.map(warning => (
              <div key={warning.id} className="p-3 rounded-lg border border-red-200 dark:border-red-800/80 bg-white dark:bg-slate-900 shadow-xs">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2">
                    <Badge className={
                      warning.severity === 'CRITICAL' ? 'bg-red-600 text-white' :
                      warning.severity === 'HIGH' ? 'bg-orange-500 text-white' : 'bg-amber-500 text-slate-950'
                    }>
                      {warning.severity} PRIORITY
                    </Badge>
                    <Badge variant="outline" className="text-xs font-mono">
                      {warning.category}
                    </Badge>
                  </div>
                  <span className="text-[11px] text-muted-foreground">{warning.status}</span>
                </div>
                <div className="font-semibold text-xs text-slate-900 dark:text-white mt-1">
                  Trigger: {warning.trigger}
                </div>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  {warning.explanation}
                </p>
                <div className="mt-2 pt-2 border-t flex items-start gap-1.5 text-xs text-blue-800 dark:text-blue-300 font-medium">
                  <span className="font-bold">Directive:</span>
                  <span>{warning.recommendedAction}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* SECTION 8 & Benchmarking: Milestones & Sector Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Milestones Card */}
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-600" />
              Critical Milestones & Execution Stages
            </CardTitle>
            <CardDescription className="text-xs">
              Monitored project deliverables and completion verification
            </CardDescription>
          </CardHeader>
          <CardContent>
            {project.milestones && project.milestones.length > 0 ? (
              <div className="space-y-3">
                {project.milestones.map(m => (
                  <div key={m.id} className="p-2.5 rounded-lg border bg-slate-50 dark:bg-slate-800/40 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-slate-900 dark:text-white">{m.name}</span>
                      <Badge variant="outline" className={`text-[10px] ${
                        m.status === 'Achieved' ? 'border-emerald-500 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40' :
                        m.status === 'Delayed' ? 'border-red-500 text-red-600 bg-red-50 dark:bg-red-950/40' :
                        'border-blue-500 text-blue-600'
                      }`}>
                        {m.status}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-muted-foreground text-[11px]">
                      <span>Target: {m.targetDate}</span>
                      {m.actualDate && <span>Achieved: {m.actualDate}</span>}
                      <span>Weightage: {m.weightagePercent}%</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-muted-foreground py-6 text-center">
                Milestone tracking active under standard IPMD quarterly report cycles.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sector Benchmark Delta Card */}
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-indigo-600" />
              Sector Benchmark Comparison ({project.sector})
            </CardTitle>
            <CardDescription className="text-xs">
              How this project compares to the national average of {project.sector} projects
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Cost Escalation Benchmark */}
            <div className="p-3 rounded-lg border bg-slate-50 dark:bg-slate-800/40">
              <div className="flex justify-between text-xs font-semibold">
                <span>Cost Escalation %</span>
                <span>
                  Project: <span className="text-amber-600">{benchmark.projectCostEscalationPercent}%</span> vs Sector Avg: {benchmark.sectorAvgCostEscalationPercent}%
                </span>
              </div>
              <div className="text-[11px] text-muted-foreground mt-1">
                {benchmark.costEscalationDelta > 0
                  ? `+${benchmark.costEscalationDelta}% higher cost escalation than sector peer average.`
                  : `${Math.abs(benchmark.costEscalationDelta)}% lower cost escalation than sector peer average.`}
              </div>
            </div>

            {/* Schedule Slippage Benchmark */}
            <div className="p-3 rounded-lg border bg-slate-50 dark:bg-slate-800/40">
              <div className="flex justify-between text-xs font-semibold">
                <span>Timeline Slippage</span>
                <span>
                  Project: <span className="text-red-600">{benchmark.projectScheduleSlippageMonths} mo</span> vs Sector Avg: {benchmark.sectorAvgScheduleSlippageMonths} mo
                </span>
              </div>
              <div className="text-[11px] text-muted-foreground mt-1">
                {benchmark.scheduleSlippageDelta > 0
                  ? `+${benchmark.scheduleSlippageDelta} months more delay than typical ${project.sector} projects.`
                  : `Performing within or better than average sector schedule parameters.`}
              </div>
            </div>

            {/* Risk Benchmark */}
            <div className="p-3 rounded-lg border bg-slate-50 dark:bg-slate-800/40">
              <div className="flex justify-between text-xs font-semibold">
                <span>Risk Score</span>
                <span>
                  Project: <span className="text-slate-900 dark:text-white font-bold">{benchmark.projectRiskScore}/100</span> vs Sector Avg: {benchmark.sectorAvgRiskScore}/100
                </span>
              </div>
              <div className="text-[11px] text-muted-foreground mt-1">
                Sector average risk reflects aggregate operational and statutory clearance factors.
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SECTION 2 & 13: Administrative & Snapshot Metadata Footer */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm text-xs">
        <CardContent className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <span className="text-muted-foreground">Date of Approval:</span>
            <div className="font-semibold text-slate-900 dark:text-white mt-0.5">{project.approvalDate}</div>
          </div>
          <div>
            <span className="text-muted-foreground">Actual Start Date:</span>
            <div className="font-semibold text-slate-900 dark:text-white mt-0.5">{project.startDate}</div>
          </div>
          <div>
            <span className="text-muted-foreground">Reporting Division:</span>
            <div className="font-semibold text-slate-900 dark:text-white mt-0.5">MoSPI / IPMD (PAIMANA)</div>
          </div>
          <div>
            <span className="text-muted-foreground">Data Snapshot:</span>
            <div className="font-semibold text-blue-600 dark:text-blue-400 mt-0.5">{project.sourceSnapshot}</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
