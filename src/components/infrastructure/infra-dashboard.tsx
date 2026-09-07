'use client';

/**
 * Main Infrastructure Monitoring Dashboard
 * MoSPI / IPMD PAIMANA Ecosystem
 * Team: InfraZyn | Hackathon: SIH26103 | "Predict. Monitor. Prevent."
 */

import React, { useState, useMemo } from 'react';
import { InfraProject, RiskLevel, ProjectStatus } from '@/types/infrastructure';
import { calculateDerivedMetrics } from '@/lib/infrastructure/derived-metrics';
import { calculateProjectRisk } from '@/lib/infrastructure/risk-engine';
import { detectAllEarlyWarnings } from '@/lib/infrastructure/early-warning-engine';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import {
  AlertTriangle,
  TrendingUp,
  Building2,
  MapPin,
  Compass,
  Zap,
  RotateCcw,
  Search,
  ExternalLink,
  Calendar,
  Layers,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

interface InfraDashboardProps {
  projects: InfraProject[];
  onSelectProject: (project: InfraProject) => void;
  onNavigateView: (view: string) => void;
}

const RISK_COLORS: Record<RiskLevel, string> = {
  LOW: '#10B981', // green
  MEDIUM: '#F59E0B', // amber
  HIGH: '#F97316', // orange
  CRITICAL: '#EF4444', // red
};

export function InfraDashboard({ projects, onSelectProject, onNavigateView }: InfraDashboardProps) {
  // Filter states
  const [selectedMinistry, setSelectedMinistry] = useState<string>('all');
  const [selectedSector, setSelectedSector] = useState<string>('all');
  const [selectedState, setSelectedState] = useState<string>('all');
  const [selectedRisk, setSelectedRisk] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Extract unique filter dropdown values
  const ministries = useMemo(() => Array.from(new Set(projects.map(p => p.ministry))).sort(), [projects]);
  const sectors = useMemo(() => Array.from(new Set(projects.map(p => p.sector))).sort(), [projects]);
  const states = useMemo(() => Array.from(new Set(projects.map(p => p.state))).sort(), [projects]);

  // Filtered projects
  const filteredProjects = useMemo(() => {
    return projects.filter(project => {
      if (selectedMinistry !== 'all' && project.ministry !== selectedMinistry) return false;
      if (selectedSector !== 'all' && project.sector !== selectedSector) return false;
      if (selectedState !== 'all' && project.state !== selectedState) return false;
      if (selectedStatus !== 'all' && project.status !== selectedStatus) return false;
      if (selectedType !== 'all') {
        if (selectedType === 'Mega' && !project.projectType.includes('Mega')) return false;
        if (selectedType === 'Major' && !project.projectType.includes('Major')) return false;
      }

      if (selectedRisk !== 'all') {
        const risk = calculateProjectRisk(project);
        if (risk.riskLevel !== selectedRisk) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = project.projectName.toLowerCase().includes(q);
        const matchesCode = project.projectCode.toLowerCase().includes(q);
        const matchesAgency = project.agency.toLowerCase().includes(q);
        if (!matchesName && !matchesCode && !matchesAgency) return false;
      }

      return true;
    });
  }, [projects, selectedMinistry, selectedSector, selectedState, selectedRisk, selectedStatus, selectedType, searchQuery]);

  // KPI Calculations on filtered subset
  const kpiStats = useMemo(() => {
    let totalOriginalCost = 0;
    let totalRevisedCost = 0;
    let totalExpenditure = 0;
    let highRiskCount = 0;
    let criticalRiskCount = 0;

    filteredProjects.forEach(p => {
      totalOriginalCost += Number(p.originalCost) || 0;
      totalRevisedCost += Number(p.revisedCost) || 0;
      totalExpenditure += Number(p.cumulativeExpenditure) || 0;

      const risk = calculateProjectRisk(p);
      if (risk.riskLevel === 'HIGH') highRiskCount++;
      if (risk.riskLevel === 'CRITICAL') criticalRiskCount++;
    });

    const totalEscalation = Math.max(0, totalRevisedCost - totalOriginalCost);
    const avgEscalationPercent = totalOriginalCost > 0 ? (totalEscalation / totalOriginalCost) * 100 : 0;
    const allWarnings = detectAllEarlyWarnings(filteredProjects);

    return {
      totalProjects: filteredProjects.length,
      totalOriginalCost,
      totalRevisedCost,
      totalExpenditure,
      totalEscalation,
      avgEscalationPercent,
      highRiskCount,
      criticalRiskCount,
      activeWarningsCount: allWarnings.length,
    };
  }, [filteredProjects]);

  // Chart 1: Ministry-wise Project Distribution & Cost Escalation
  const ministryChartData = useMemo(() => {
    const map: Record<string, { name: string; projects: number; originalCost: number; revisedCost: number; escalation: number }> = {};
    filteredProjects.forEach(p => {
      const minKey = p.ministry.replace('Ministry of ', '');
      if (!map[minKey]) {
        map[minKey] = { name: minKey, projects: 0, originalCost: 0, revisedCost: 0, escalation: 0 };
      }
      map[minKey].projects += 1;
      map[minKey].originalCost += Number(p.originalCost) || 0;
      map[minKey].revisedCost += Number(p.revisedCost) || 0;
      map[minKey].escalation += Math.max(0, (Number(p.revisedCost) || 0) - (Number(p.originalCost) || 0));
    });
    return Object.values(map).sort((a, b) => b.revisedCost - a.revisedCost).slice(0, 6);
  }, [filteredProjects]);

  // Chart 2: Sector-wise Breakdown & Avg Risk Score
  const sectorChartData = useMemo(() => {
    const map: Record<string, { sector: string; count: number; totalRisk: number }> = {};
    filteredProjects.forEach(p => {
      if (!map[p.sector]) map[p.sector] = { sector: p.sector, count: 0, totalRisk: 0 };
      map[p.sector].count++;
      map[p.sector].totalRisk += calculateProjectRisk(p).overallScore;
    });
    return Object.values(map).map(item => ({
      sector: item.sector,
      count: item.count,
      avgRisk: Math.round(item.totalRisk / item.count),
    })).sort((a, b) => b.avgRisk - a.avgRisk);
  }, [filteredProjects]);

  // Chart 3: Risk Level Distribution (Donut)
  const riskDistributionData = useMemo(() => {
    const counts: Record<RiskLevel, number> = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };
    filteredProjects.forEach(p => {
      const risk = calculateProjectRisk(p);
      counts[risk.riskLevel]++;
    });
    return [
      { name: 'Low Risk', value: counts.LOW, color: RISK_COLORS.LOW },
      { name: 'Medium Risk', value: counts.MEDIUM, color: RISK_COLORS.MEDIUM },
      { name: 'High Risk', value: counts.HIGH, color: RISK_COLORS.HIGH },
      { name: 'Critical Risk', value: counts.CRITICAL, color: RISK_COLORS.CRITICAL },
    ].filter(d => d.value > 0);
  }, [filteredProjects]);

  // Chart 4: Physical Progress vs. Financial Progress Scatter/Bar
  const progressComparisonData = useMemo(() => {
    return filteredProjects.slice(0, 8).map(p => {
      const derived = calculateDerivedMetrics(p);
      return {
        name: p.projectName.length > 18 ? p.projectName.substring(0, 18) + '...' : p.projectName,
        physical: p.physicalProgress,
        financial: derived.financialProgress,
        fullName: p.projectName,
      };
    });
  }, [filteredProjects]);

  // Top Critical Projects Requiring Attention
  const topCriticalProjects = useMemo(() => {
    return [...filteredProjects]
      .map(p => ({
        project: p,
        risk: calculateProjectRisk(p),
        derived: calculateDerivedMetrics(p),
      }))
      .filter(item => item.risk.riskLevel === 'CRITICAL' || item.risk.riskLevel === 'HIGH')
      .sort((a, b) => b.risk.overallScore - a.risk.overallScore)
      .slice(0, 4);
  }, [filteredProjects]);

  const handleResetFilters = () => {
    setSelectedMinistry('all');
    setSelectedSector('all');
    setSelectedState('all');
    setSelectedRisk('all');
    setSelectedStatus('all');
    setSelectedType('all');
    setSearchQuery('');
  };

  return (
    <div className="space-y-6">
      {/* Hackathon & Platform Identity Banner */}
      <div className="rounded-xl border border-blue-200 bg-gradient-to-r from-blue-950 via-indigo-900 to-slate-900 p-5 text-white shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-blue-500 hover:bg-blue-600 text-white font-semibold">
                SIH26103
              </Badge>
              <Badge variant="outline" className="text-blue-200 border-blue-400">
                Team InfraZyn
              </Badge>
              <Badge variant="outline" className="text-amber-300 border-amber-400/50 bg-amber-950/40">
                PAIMANA Report Snapshot — July 2026
              </Badge>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white">
              AI-Powered Infrastructure Project Intelligence & Early Warning Platform
            </h2>
            <p className="text-sm text-blue-200">
              Integrated monitoring, predictive risk modeling, and decision-support for central sector infrastructure investments.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigateView('ai-assistant')}
              className="bg-blue-800/60 hover:bg-blue-700 text-white border-blue-400"
            >
              <Zap className="mr-2 h-4 w-4 text-amber-400" />
              Ask AI Assistant
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => onNavigateView('early-warnings')}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold"
            >
              <AlertTriangle className="mr-2 h-4 w-4" />
              Early Warnings ({kpiStats.activeWarningsCount})
            </Button>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <Card className="shadow-sm border-slate-200 dark:border-slate-800">
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by project name, OCMS code, agency..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-8 h-9 text-sm"
              />
            </div>

            {/* Ministry */}
            <Select value={selectedMinistry} onValueChange={setSelectedMinistry}>
              <SelectTrigger className="w-[180px] h-9 text-xs">
                <SelectValue placeholder="Ministry: All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ministries</SelectItem>
                {ministries.map(m => (
                  <SelectItem key={m} value={m}>
                    {m.replace('Ministry of ', '')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sector */}
            <Select value={selectedSector} onValueChange={setSelectedSector}>
              <SelectTrigger className="w-[160px] h-9 text-xs">
                <SelectValue placeholder="Sector: All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sectors</SelectItem>
                {sectors.map(s => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* State */}
            <Select value={selectedState} onValueChange={setSelectedState}>
              <SelectTrigger className="w-[150px] h-9 text-xs">
                <SelectValue placeholder="State: All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All States</SelectItem>
                {states.map(st => (
                  <SelectItem key={st} value={st}>{st}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Risk Level */}
            <Select value={selectedRisk} onValueChange={setSelectedRisk}>
              <SelectTrigger className="w-[140px] h-9 text-xs">
                <SelectValue placeholder="Risk: All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Risk Levels</SelectItem>
                <SelectItem value="CRITICAL">Critical Risk</SelectItem>
                <SelectItem value="HIGH">High Risk</SelectItem>
                <SelectItem value="MEDIUM">Medium Risk</SelectItem>
                <SelectItem value="LOW">Low Risk</SelectItem>
              </SelectContent>
            </Select>

            {/* Status */}
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-[140px] h-9 text-xs">
                <SelectValue placeholder="Status: All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Ongoing">Ongoing</SelectItem>
                <SelectItem value="Delayed">Delayed</SelectItem>
                <SelectItem value="Critical">Critical</SelectItem>
                <SelectItem value="Ahead of Schedule">Ahead of Schedule</SelectItem>
              </SelectContent>
            </Select>

            {/* Project Type */}
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-[130px] h-9 text-xs">
                <SelectValue placeholder="Type: All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Scales</SelectItem>
                <SelectItem value="Mega">Mega (≥ ₹1000 Cr)</SelectItem>
                <SelectItem value="Major">Major</SelectItem>
              </SelectContent>
            </Select>

            {/* Reset Button */}
            <Button variant="ghost" size="sm" onClick={handleResetFilters} className="h-9 px-2 text-xs">
              <RotateCcw className="h-3.5 w-3.5 mr-1" />
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 7 Core Executive KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {/* KPI 1 */}
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
          <CardContent className="p-3">
            <div className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Building2 className="h-3.5 w-3.5 text-blue-500" />
              Projects Monitored
            </div>
            <div className="text-2xl font-bold mt-1 text-slate-900 dark:text-white">
              {kpiStats.totalProjects}
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">Central Sector Projects</div>
          </CardContent>
        </Card>

        {/* KPI 2 */}
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
          <CardContent className="p-3">
            <div className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <span className="text-blue-600 font-semibold">₹</span>
              Original Sanction
            </div>
            <div className="text-xl font-bold mt-1 text-slate-900 dark:text-white">
              ₹{(kpiStats.totalOriginalCost / 1000).toFixed(1)}k <span className="text-xs font-normal">Cr</span>
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">Approved baseline cost</div>
          </CardContent>
        </Card>

        {/* KPI 3 */}
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
          <CardContent className="p-3">
            <div className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <span className="text-indigo-600 font-semibold">₹</span>
              Revised Cost
            </div>
            <div className="text-xl font-bold mt-1 text-slate-900 dark:text-white">
              ₹{(kpiStats.totalRevisedCost / 1000).toFixed(1)}k <span className="text-xs font-normal">Cr</span>
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">Anticipated completion</div>
          </CardContent>
        </Card>

        {/* KPI 4 */}
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
          <CardContent className="p-3">
            <div className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
              Cumulative Spend
            </div>
            <div className="text-xl font-bold mt-1 text-slate-900 dark:text-white">
              ₹{(kpiStats.totalExpenditure / 1000).toFixed(1)}k <span className="text-xs font-normal">Cr</span>
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              {kpiStats.totalRevisedCost > 0 ? ((kpiStats.totalExpenditure / kpiStats.totalRevisedCost) * 100).toFixed(1) : 0}% utilization
            </div>
          </CardContent>
        </Card>

        {/* KPI 5: Cost Escalation */}
        <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-900/50 shadow-sm">
          <CardContent className="p-3">
            <div className="text-xs font-medium text-amber-700 dark:text-amber-400 flex items-center gap-1">
              <AlertTriangle className="h-3.5 w-3.5" />
              Cost Escalation
            </div>
            <div className="text-xl font-bold mt-1 text-amber-900 dark:text-amber-200">
              ₹{(kpiStats.totalEscalation / 1000).toFixed(1)}k <span className="text-xs font-normal">Cr</span>
            </div>
            <div className="text-[11px] text-amber-700 dark:text-amber-300 font-medium mt-0.5">
              +{kpiStats.avgEscalationPercent.toFixed(1)}% over original
            </div>
          </CardContent>
        </Card>

        {/* KPI 6: High & Critical Risk */}
        <Card className="border-red-200 bg-red-50/50 dark:bg-red-950/20 dark:border-red-900/50 shadow-sm">
          <CardContent className="p-3">
            <div className="text-xs font-medium text-red-700 dark:text-red-400 flex items-center gap-1">
              <AlertTriangle className="h-3.5 w-3.5" />
              High / Critical Risk
            </div>
            <div className="text-2xl font-bold mt-1 text-red-800 dark:text-red-200">
              {kpiStats.criticalRiskCount + kpiStats.highRiskCount}
            </div>
            <div className="text-[11px] text-red-600 dark:text-red-300 mt-0.5">
              {kpiStats.criticalRiskCount} Critical, {kpiStats.highRiskCount} High
            </div>
          </CardContent>
        </Card>

        {/* KPI 7: Active Early Warnings */}
        <Card
          className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-900/50 shadow-sm cursor-pointer hover:border-blue-400 transition-colors"
          onClick={() => onNavigateView('early-warnings')}
        >
          <CardContent className="p-3">
            <div className="text-xs font-medium text-blue-700 dark:text-blue-400 flex items-center gap-1">
              <Zap className="h-3.5 w-3.5 text-amber-500" />
              Early Warnings
            </div>
            <div className="text-2xl font-bold mt-1 text-blue-800 dark:text-blue-200">
              {kpiStats.activeWarningsCount}
            </div>
            <div className="text-[11px] text-blue-600 dark:text-blue-300 mt-0.5 flex items-center gap-1">
              <span>Immediate triage</span>
              <ExternalLink className="h-2.5 w-2.5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top High-Risk Projects Alert Row */}
      {topCriticalProjects.length > 0 && (
        <Card className="border-amber-300/80 bg-gradient-to-r from-amber-50/80 to-orange-50/50 dark:from-amber-950/30 dark:to-orange-950/20 shadow-sm">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                <CardTitle className="text-base font-semibold text-amber-900 dark:text-amber-200">
                  Priority Intervention Spotlight: Projects in Critical Distress Corridor
                </CardTitle>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs border-amber-300 hover:bg-amber-100"
                onClick={() => onNavigateView('risk-monitor')}
              >
                View Risk Matrix
              </Button>
            </div>
            <CardDescription className="text-xs text-amber-800/80 dark:text-amber-300/70">
              Identified by InfraZyn Multi-Factor Risk Engine (Cost Escalation + Time Slippage + Progress Lag)
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {topCriticalProjects.map(({ project, risk, derived }) => (
                <div
                  key={project.id}
                  onClick={() => onSelectProject(project)}
                  className="rounded-lg border border-amber-200 dark:border-amber-800/60 bg-white dark:bg-slate-900 p-3 shadow-xs hover:shadow-md cursor-pointer transition-all hover:border-amber-400"
                >
                  <div className="flex items-start justify-between gap-1 mb-1">
                    <span className="text-[10px] font-mono font-medium text-muted-foreground bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                      {project.projectCode}
                    </span>
                    <Badge
                      className={`text-[10px] px-1.5 py-0 font-semibold ${
                        risk.riskLevel === 'CRITICAL'
                          ? 'bg-red-600 text-white'
                          : 'bg-orange-500 text-white'
                      }`}
                    >
                      {risk.riskLevel} ({risk.overallScore}/100)
                    </Badge>
                  </div>
                  <div className="font-semibold text-sm line-clamp-1 text-slate-900 dark:text-white">
                    {project.projectName}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {project.ministry.replace('Ministry of ', '')} • {project.state}
                  </div>

                  <div className="grid grid-cols-2 gap-1 mt-2.5 pt-2 border-t text-[11px]">
                    <div>
                      <span className="text-muted-foreground">Escalation: </span>
                      <span className="font-semibold text-amber-700 dark:text-amber-400">
                        +{derived.costEscalationPercentage}%
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Slippage: </span>
                      <span className="font-semibold text-red-600">
                        {derived.scheduleSlippageMonths} mo
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Ministry-wise Cost & Escalation */}
        <Card className="shadow-sm border-slate-200 dark:border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Building2 className="h-4 w-4 text-blue-600" />
              Ministry-wise Investment & Cost Escalation (₹ Cr)
            </CardTitle>
            <CardDescription className="text-xs">
              Comparison between Original Approved Cost and Revised Anticipated Cost
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[280px] pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ministryChartData} margin={{ top: 10, right: 10, left: 10, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                <XAxis dataKey="name" angle={-15} textAnchor="end" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(value: any) => [`₹${Number(value).toLocaleString('en-IN')} Cr`]}
                  contentStyle={{ backgroundColor: '#1E293B', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="originalCost" name="Original Sanction" fill="#94A3B8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="revisedCost" name="Revised Cost" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="escalation" name="Cost Escalation" fill="#F97316" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Chart 2: Sector-wise Breakdown & Risk Score */}
        <Card className="shadow-sm border-slate-200 dark:border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Layers className="h-4 w-4 text-indigo-600" />
              Sectoral Risk & Project Count Analysis
            </CardTitle>
            <CardDescription className="text-xs">
              Average Risk Score (0-100) and Project Volume by Infrastructure Sector
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[280px] pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sectorChartData} margin={{ top: 10, right: 10, left: 10, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                <XAxis dataKey="sector" angle={-15} textAnchor="end" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 11 }} domain={[0, 100]} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: '#1E293B', color: '#fff', borderRadius: '8px', fontSize: '12px' }} />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar yAxisId="left" dataKey="avgRisk" name="Avg Risk Score (/100)" fill="#EF4444" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="right" dataKey="count" name="Projects Monitored" fill="#6366F1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Chart 3: Risk Level Distribution (Donut) */}
        <Card className="shadow-sm border-slate-200 dark:border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Compass className="h-4 w-4 text-emerald-600" />
              Portfolio Risk Classification Breakdown
            </CardTitle>
            <CardDescription className="text-xs">
              Distribution of projects categorized under Low, Medium, High, and Critical Risk
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[260px] flex items-center justify-center pt-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={riskDistributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {riskDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1E293B', color: '#fff', borderRadius: '8px', fontSize: '12px' }} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Chart 4: Physical vs. Financial Progress Gap */}
        <Card className="shadow-sm border-slate-200 dark:border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-cyan-600" />
              Physical vs. Financial Progress Alignment (%)
            </CardTitle>
            <CardDescription className="text-xs">
              Disparities between Ground Realization (%) and Cumulative Fund Utilization (%)
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[260px] pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={progressComparisonData} margin={{ top: 10, right: 10, left: 0, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                <XAxis dataKey="name" angle={-15} textAnchor="end" tick={{ fontSize: 10 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(val: any) => [`${val}%`]}
                  contentStyle={{ backgroundColor: '#1E293B', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="physical" name="Physical Progress (%)" fill="#10B981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="financial" name="Financial Progress (%)" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Quick Navigation Footer Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl border bg-slate-50 dark:bg-slate-900">
        <div className="text-xs text-muted-foreground">
          Showing <span className="font-semibold text-foreground">{filteredProjects.length}</span> of{' '}
          <span className="font-semibold text-foreground">{projects.length}</span> total monitored projects. Source:{' '}
          <span className="font-semibold text-blue-600">PAIMANA Flash Report (July 2026 Snapshot)</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => onNavigateView('projects')} className="text-xs">
            Open Full Projects Registry
          </Button>
          <Button variant="outline" size="sm" onClick={() => onNavigateView('benchmarking')} className="text-xs">
            Benchmarking Analytics
          </Button>
          <Button variant="outline" size="sm" onClick={() => onNavigateView('model-insights')} className="text-xs">
            Statistical vs. ML Insights
          </Button>
        </div>
      </div>
    </div>
  );
}
