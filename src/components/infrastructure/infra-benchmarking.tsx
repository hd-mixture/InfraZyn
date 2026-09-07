'use client';

/**
 * Infrastructure Benchmarking & Comparative Analytics
 * MoSPI / IPMD PAIMANA Platform
 * Team: InfraZyn (SIH26103)
 */

import React, { useState, useMemo } from 'react';
import { InfraProject } from '@/types/infrastructure';
import { aggregateMetricsByGroup } from '@/lib/infrastructure/benchmarking';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { BarChart3, Scale, Layers, Building2, MapPin, TrendingUp, AlertTriangle } from 'lucide-react';

interface InfraBenchmarkingProps {
  projects: InfraProject[];
}

export function InfraBenchmarking({ projects }: InfraBenchmarkingProps) {
  const [benchmarkType, setBenchmarkType] = useState<'sector' | 'ministry' | 'state'>('sector');

  // Aggregated data by chosen group
  const aggregatedData = useMemo(() => {
    return aggregateMetricsByGroup(projects, benchmarkType);
  }, [projects, benchmarkType]);

  // Two specific entities selected for direct head-to-head comparison
  const [entityA, setEntityA] = useState<string>('');
  const [entityB, setEntityB] = useState<string>('');

  // Default selection if empty or type changes
  React.useEffect(() => {
    if (aggregatedData.length >= 2) {
      setEntityA(aggregatedData[0].categoryName);
      setEntityB(aggregatedData[1].categoryName);
    } else if (aggregatedData.length === 1) {
      setEntityA(aggregatedData[0].categoryName);
      setEntityB(aggregatedData[0].categoryName);
    }
  }, [aggregatedData]);

  const itemA = useMemo(() => aggregatedData.find(d => d.categoryName === entityA) || aggregatedData[0], [aggregatedData, entityA]);
  const itemB = useMemo(() => aggregatedData.find(d => d.categoryName === entityB) || aggregatedData[1] || aggregatedData[0], [aggregatedData, entityB]);

  // Head-to-Head Comparison Chart Data
  const comparisonChartData = useMemo(() => {
    if (!itemA || !itemB) return [];
    return [
      {
        metric: 'Avg Cost Escalation (%)',
        [itemA.categoryName]: itemA.avgCostEscalationPercent,
        [itemB.categoryName]: itemB.avgCostEscalationPercent,
      },
      {
        metric: 'Avg Slippage (Months)',
        [itemA.categoryName]: itemA.avgScheduleSlippageMonths,
        [itemB.categoryName]: itemB.avgScheduleSlippageMonths,
      },
      {
        metric: 'Avg Physical Progress (%)',
        [itemA.categoryName]: itemA.avgPhysicalProgress,
        [itemB.categoryName]: itemB.avgPhysicalProgress,
      },
    ];
  }, [itemA, itemB]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-xl border border-indigo-200 dark:border-indigo-900/40 bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-950/20 dark:to-blue-950/10 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge className="bg-indigo-600 text-white font-semibold">
              Comparative Intelligence
            </Badge>
            <span className="text-xs text-muted-foreground font-mono">
              PAIMANA July 2026 Snapshot
            </span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Benchmarking & Cross-Sector Comparative Analytics
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Evaluate systemic cost escalations, timeline slippages, and completion velocity across infrastructure sectors, ministries, and states.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={benchmarkType === 'sector' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setBenchmarkType('sector')}
            className="text-xs h-8"
          >
            <Layers className="h-3.5 w-3.5 mr-1" />
            Sector vs. Sector
          </Button>
          <Button
            variant={benchmarkType === 'ministry' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setBenchmarkType('ministry')}
            className="text-xs h-8"
          >
            <Building2 className="h-3.5 w-3.5 mr-1" />
            Ministry
          </Button>
          <Button
            variant={benchmarkType === 'state' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setBenchmarkType('state')}
            className="text-xs h-8"
          >
            <MapPin className="h-3.5 w-3.5 mr-1" />
            State
          </Button>
        </div>
      </div>

      {/* Head-to-Head Comparison Card */}
      {itemA && itemB && (
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Scale className="h-4 w-4 text-indigo-600" />
                  Head-to-Head Comparative Benchmark
                </CardTitle>
                <CardDescription className="text-xs">
                  Direct performance contrast between two selected {benchmarkType} groups
                </CardDescription>
              </div>

              {/* Entity Selectors */}
              <div className="flex items-center gap-2">
                <Select value={entityA} onValueChange={setEntityA}>
                  <SelectTrigger className="w-[180px] h-8 text-xs font-semibold">
                    <SelectValue placeholder="Select Entity A" />
                  </SelectTrigger>
                  <SelectContent>
                    {aggregatedData.map(d => (
                      <SelectItem key={d.categoryName} value={d.categoryName}>
                        {d.categoryName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <span className="text-xs font-bold text-muted-foreground">VS</span>

                <Select value={entityB} onValueChange={setEntityB}>
                  <SelectTrigger className="w-[180px] h-8 text-xs font-semibold">
                    <SelectValue placeholder="Select Entity B" />
                  </SelectTrigger>
                  <SelectContent>
                    {aggregatedData.map(d => (
                      <SelectItem key={d.categoryName} value={d.categoryName}>
                        {d.categoryName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Metric Comparison Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Entity A Stats */}
              <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/40 dark:bg-blue-950/20 dark:border-blue-900/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-base text-blue-900 dark:text-blue-200">
                    {itemA.categoryName}
                  </span>
                  <Badge variant="outline" className="text-xs border-blue-300">
                    {itemA.totalProjects} Projects Monitored
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-blue-200/60 dark:border-blue-900/60">
                  <div>
                    <span className="text-muted-foreground">Avg Cost Escalation:</span>
                    <div className="text-base font-bold text-amber-600">
                      +{itemA.avgCostEscalationPercent}%
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Avg Timeline Slippage:</span>
                    <div className="text-base font-bold text-red-600">
                      {itemA.avgScheduleSlippageMonths} months
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Avg Physical Progress:</span>
                    <div className="text-base font-bold text-slate-900 dark:text-white">
                      {itemA.avgPhysicalProgress}%
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">High/Critical Risk Projects:</span>
                    <div className="text-base font-bold text-orange-600">
                      {itemA.highRiskProjectCount} of {itemA.totalProjects}
                    </div>
                  </div>
                </div>
              </div>

              {/* Entity B Stats */}
              <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/40 dark:bg-indigo-950/20 dark:border-indigo-900/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-base text-indigo-900 dark:text-indigo-200">
                    {itemB.categoryName}
                  </span>
                  <Badge variant="outline" className="text-xs border-indigo-300">
                    {itemB.totalProjects} Projects Monitored
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-indigo-200/60 dark:border-indigo-900/60">
                  <div>
                    <span className="text-muted-foreground">Avg Cost Escalation:</span>
                    <div className="text-base font-bold text-amber-600">
                      +{itemB.avgCostEscalationPercent}%
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Avg Timeline Slippage:</span>
                    <div className="text-base font-bold text-red-600">
                      {itemB.avgScheduleSlippageMonths} months
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Avg Physical Progress:</span>
                    <div className="text-base font-bold text-slate-900 dark:text-white">
                      {itemB.avgPhysicalProgress}%
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">High/Critical Risk Projects:</span>
                    <div className="text-base font-bold text-orange-600">
                      {itemB.highRiskProjectCount} of {itemB.totalProjects}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Side-by-Side Bar Chart */}
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonChartData} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                  <XAxis dataKey="metric" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#1E293B', color: '#fff', borderRadius: '8px', fontSize: '12px' }} />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Bar dataKey={itemA.categoryName} fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey={itemB.categoryName} fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Aggregate League Table for all categories */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-blue-600" />
            Complete {benchmarkType.charAt(0).toUpperCase() + benchmarkType.slice(1)} Performance Benchmark Ranking
          </CardTitle>
          <CardDescription className="text-xs">
            Ranked by Average Cost Escalation Percentage across all monitored project records
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-900 border-b text-muted-foreground">
                <tr>
                  <th className="p-3">Rank & {benchmarkType.charAt(0).toUpperCase() + benchmarkType.slice(1)}</th>
                  <th className="p-3 text-center">Projects</th>
                  <th className="p-3 text-right">Avg Cost Escalation (%)</th>
                  <th className="p-3 text-center">Avg Slippage (Months)</th>
                  <th className="p-3 text-center">Avg Physical Progress</th>
                  <th className="p-3 text-center">Expenditure Ratio</th>
                  <th className="p-3 text-center">High Risk Count</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {aggregatedData.map((row, idx) => (
                  <tr key={row.categoryName} className="hover:bg-slate-50/80 dark:hover:bg-slate-900/50">
                    <td className="p-3 font-semibold text-slate-900 dark:text-white">
                      <span className="text-muted-foreground font-normal mr-2">#{idx + 1}</span>
                      {row.categoryName}
                    </td>
                    <td className="p-3 text-center font-mono">{row.totalProjects}</td>
                    <td className="p-3 text-right font-mono font-bold text-amber-600 dark:text-amber-400">
                      +{row.avgCostEscalationPercent}%
                    </td>
                    <td className="p-3 text-center font-mono text-red-600 font-semibold">
                      +{row.avgScheduleSlippageMonths} mo
                    </td>
                    <td className="p-3 text-center font-mono font-medium">
                      {row.avgPhysicalProgress}%
                    </td>
                    <td className="p-3 text-center font-mono text-muted-foreground">
                      {row.avgExpenditureRatio}x
                    </td>
                    <td className="p-3 text-center">
                      <Badge variant="outline" className="text-xs border-amber-300">
                        {row.highRiskProjectCount}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
