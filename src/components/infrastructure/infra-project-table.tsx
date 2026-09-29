'use client';

/**
 * Infrastructure Projects Master Registry Table
 * MoSPI PAIMANA Ecosystem
 * Team: InfraZyn (SIH26103)
 */

import React, { useState, useMemo } from 'react';
import { InfraProject, RiskLevel } from '@/types/infrastructure';
import { calculateDerivedMetrics } from '@/lib/infrastructure/derived-metrics';
import { calculateProjectRisk } from '@/lib/infrastructure/risk-engine';
import { detectEarlyWarningsForProject } from '@/lib/infrastructure/early-warning-engine';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  AlertTriangle,
  ArrowUpDown,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Filter,
  Plus,
} from 'lucide-react';
import { CreateProjectForm } from '@/components/dashboard/create-project-form';

interface InfraProjectTableProps {
  projects: InfraProject[];
  onSelectProject: (project: InfraProject) => void;
}

type SortField = 'projectName' | 'revisedCost' | 'physicalProgress' | 'riskScore' | 'scheduleSlippage';
type SortOrder = 'asc' | 'desc';

export function InfraProjectTable({ projects, onSelectProject }: InfraProjectTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sectorFilter, setSectorFilter] = useState('all');
  const [ministryFilter, setMinistryFilter] = useState('all');
  const [riskFilter, setRiskFilter] = useState('all');
  const [sortField, setSortField] = useState<SortField>('riskScore');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  const sectors = useMemo(() => Array.from(new Set(projects.map(p => p.sector))).sort(), [projects]);
  const ministries = useMemo(() => Array.from(new Set(projects.map(p => p.ministry))).sort(), [projects]);

  const filteredAndSortedProjects = useMemo(() => {
    let result = projects.filter(p => {
      if (sectorFilter !== 'all' && p.sector !== sectorFilter) return false;
      if (ministryFilter !== 'all' && p.ministry !== ministryFilter) return false;
      
      if (riskFilter !== 'all') {
        const risk = calculateProjectRisk(p);
        if (risk.riskLevel !== riskFilter) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = p.projectName.toLowerCase().includes(q);
        const matchesCode = p.projectCode.toLowerCase().includes(q);
        const matchesAgency = p.agency.toLowerCase().includes(q);
        const matchesState = p.state.toLowerCase().includes(q);
        if (!matchesName && !matchesCode && !matchesAgency && !matchesState) return false;
      }

      return true;
    });

    result.sort((a, b) => {
      let valA: number | string = 0;
      let valB: number | string = 0;

      if (sortField === 'projectName') {
        valA = a.projectName.toLowerCase();
        valB = b.projectName.toLowerCase();
      } else if (sortField === 'revisedCost') {
        valA = a.revisedCost;
        valB = b.revisedCost;
      } else if (sortField === 'physicalProgress') {
        valA = a.physicalProgress;
        valB = b.physicalProgress;
      } else if (sortField === 'riskScore') {
        valA = calculateProjectRisk(a).overallScore;
        valB = calculateProjectRisk(b).overallScore;
      } else if (sortField === 'scheduleSlippage') {
        valA = calculateDerivedMetrics(a).scheduleSlippageMonths;
        valB = calculateDerivedMetrics(b).scheduleSlippageMonths;
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [projects, sectorFilter, ministryFilter, riskFilter, searchQuery, sortField, sortOrder]);

  const totalPages = Math.ceil(filteredAndSortedProjects.length / pageSize) || 1;
  const paginatedProjects = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAndSortedProjects.slice(start, start + pageSize);
  }, [filteredAndSortedProjects, currentPage]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
    setCurrentPage(1);
  };

  const getRiskBadge = (riskLevel: RiskLevel, score: number) => {
    switch (riskLevel) {
      case 'CRITICAL':
        return <Badge className="bg-red-600 text-white font-semibold">Critical ({score})</Badge>;
      case 'HIGH':
        return <Badge className="bg-orange-500 text-white font-semibold">High ({score})</Badge>;
      case 'MEDIUM':
        return <Badge className="bg-amber-500 text-slate-950 font-semibold">Medium ({score})</Badge>;
      case 'LOW':
        return <Badge className="bg-emerald-600 text-white font-semibold">Low ({score})</Badge>;
    }
  };

  return (
    <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <span>National Infrastructure Projects Registry</span>
              <Badge variant="outline" className="text-xs">
                {filteredAndSortedProjects.length} Projects
              </Badge>
            </CardTitle>
            <CardDescription className="text-xs">
              Official IPMD / MoSPI monitoring parameters including cost escalation, timeline slippage, and early warnings
            </CardDescription>
          </div>

          {/* Table Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[200px]">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search projects, code, state..."
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-8 h-8 text-xs"
              />
            </div>

            <Select value={sectorFilter} onValueChange={v => { setSectorFilter(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-[140px] h-8 text-xs">
                <SelectValue placeholder="Sector" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sectors</SelectItem>
                {sectors.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={riskFilter} onValueChange={v => { setRiskFilter(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-[130px] h-8 text-xs">
                <SelectValue placeholder="Risk" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Risks</SelectItem>
                <SelectItem value="CRITICAL">Critical Risk</SelectItem>
                <SelectItem value="HIGH">High Risk</SelectItem>
                <SelectItem value="MEDIUM">Medium Risk</SelectItem>
                <SelectItem value="LOW">Low Risk</SelectItem>
              </SelectContent>
            </Select>

            <CreateProjectForm>
              <Button size="sm" className="h-8 gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-xs font-semibold text-white shadow-xs">
                <Plus className="h-3.5 w-3.5" />
                <span>Enroll Project</span>
              </Button>
            </CreateProjectForm>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50 dark:bg-slate-900 text-xs">
              <TableRow>
                <TableHead className="w-[280px]">
                  <Button variant="ghost" size="sm" onClick={() => handleSort('projectName')} className="h-7 text-xs font-semibold p-0">
                    Project & Code
                    <ArrowUpDown className="ml-1 h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead className="w-[140px]">Sector & State</TableHead>
                <TableHead className="text-right">Original (₹ Cr)</TableHead>
                <TableHead className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => handleSort('revisedCost')} className="h-7 text-xs font-semibold p-0 ml-auto">
                    Revised (₹ Cr)
                    <ArrowUpDown className="ml-1 h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead className="text-right">Spend (₹ Cr)</TableHead>
                <TableHead className="w-[150px]">
                  <Button variant="ghost" size="sm" onClick={() => handleSort('physicalProgress')} className="h-7 text-xs font-semibold p-0">
                    Physical Progress
                    <ArrowUpDown className="ml-1 h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead className="text-center">
                  <Button variant="ghost" size="sm" onClick={() => handleSort('scheduleSlippage')} className="h-7 text-xs font-semibold p-0">
                    Slippage
                    <ArrowUpDown className="ml-1 h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead className="text-center">
                  <Button variant="ghost" size="sm" onClick={() => handleSort('riskScore')} className="h-7 text-xs font-semibold p-0">
                    Risk Level
                    <ArrowUpDown className="ml-1 h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead className="text-center">Warnings</TableHead>
                <TableHead className="text-center">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="text-xs">
              {paginatedProjects.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                    No infrastructure projects found matching the filter criteria.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedProjects.map(project => {
                  const derived = calculateDerivedMetrics(project);
                  const risk = calculateProjectRisk(project);
                  const warnings = detectEarlyWarningsForProject(project);

                  return (
                    <TableRow
                      key={project.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-900/50 cursor-pointer transition-colors"
                      onClick={() => onSelectProject(project)}
                    >
                      {/* Project Name & Code */}
                      <TableCell className="font-medium">
                        <div className="font-semibold text-slate-900 dark:text-white line-clamp-1">
                          {project.projectName}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-muted-foreground">
                          <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.2 rounded text-[10px]">
                            {project.projectCode}
                          </span>
                          <span>•</span>
                          <span>{project.agency}</span>
                        </div>
                      </TableCell>

                      {/* Sector & State */}
                      <TableCell>
                        <div className="font-medium">{project.sector}</div>
                        <div className="text-[11px] text-muted-foreground">{project.state}</div>
                      </TableCell>

                      {/* Original Cost */}
                      <TableCell className="text-right font-mono text-muted-foreground">
                        ₹{project.originalCost.toLocaleString('en-IN')}
                      </TableCell>

                      {/* Revised Cost & Escalation */}
                      <TableCell className="text-right font-mono">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          ₹{project.revisedCost.toLocaleString('en-IN')}
                        </div>
                        {derived.costEscalationPercentage > 0 && (
                          <div className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                            +{derived.costEscalationPercentage}%
                          </div>
                        )}
                      </TableCell>

                      {/* Expenditure */}
                      <TableCell className="text-right font-mono">
                        <div>₹{project.cumulativeExpenditure.toLocaleString('en-IN')}</div>
                        <div className="text-[10px] text-muted-foreground">
                          {derived.financialProgress}% fin
                        </div>
                      </TableCell>

                      {/* Physical Progress */}
                      <TableCell>
                        <div className="flex items-center justify-between text-[11px] mb-1">
                          <span className="font-semibold">{project.physicalProgress}%</span>
                          {derived.progressGap > 10 && (
                            <span className="text-[10px] text-red-600 font-medium">
                              -{derived.progressGap}% gap
                            </span>
                          )}
                        </div>
                        <Progress value={project.physicalProgress} className="h-1.5" />
                      </TableCell>

                      {/* Schedule Slippage */}
                      <TableCell className="text-center font-mono">
                        {derived.scheduleSlippageMonths > 0 ? (
                          <span className="text-red-600 font-semibold">
                            +{derived.scheduleSlippageMonths} mo
                          </span>
                        ) : (
                          <span className="text-emerald-600 font-medium">On Track</span>
                        )}
                      </TableCell>

                      {/* Risk Level */}
                      <TableCell className="text-center">
                        {getRiskBadge(risk.riskLevel, risk.overallScore)}
                      </TableCell>

                      {/* Warnings count */}
                      <TableCell className="text-center">
                        {warnings.length > 0 ? (
                          <Badge variant="outline" className="text-red-600 border-red-300 bg-red-50 dark:bg-red-950/40 text-[10px]">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            {warnings.length}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-[11px]">None</span>
                        )}
                      </TableCell>

                      {/* Action */}
                      <TableCell className="text-center" onClick={e => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          onClick={() => onSelectProject(project)}
                        >
                          Details
                          <ExternalLink className="ml-1 h-3 w-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Bar */}
        <div className="flex items-center justify-between px-4 py-3 border-t bg-slate-50/50 dark:bg-slate-900/30 text-xs text-muted-foreground">
          <div>
            Showing {(currentPage - 1) * pageSize + 1} to{' '}
            {Math.min(currentPage * pageSize, filteredAndSortedProjects.length)} of{' '}
            {filteredAndSortedProjects.length} projects
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-7 w-7 p-0"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="h-7 w-7 p-0"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
