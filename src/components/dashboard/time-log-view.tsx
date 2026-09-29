'use client';

/**
 * National Infrastructure Milestone & Regulatory Timeline Logs
 * MoSPI / IPMD PAIMANA Compliance & Audit Trail
 * Problem Statement: SIH26103 | Team: InfraZyn
 * 
 * Replaces legacy employee timesheets with an authentic national infrastructure
 * milestone audit trail tracking statutory clearances, physical achievements,
 * safety inspections, and slippage events across all mega projects.
 */

import React, { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { InfraProject } from '@/types/infrastructure';
import { getStoredProjects } from '@/lib/infrastructure/demo-dataset';
import {
  Download,
  PlusCircle,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ShieldCheck,
  Building2,
  Calendar,
  Filter,
  FileSpreadsheet,
  Activity,
  Layers,
  ArrowUpDown,
  Tag,
} from 'lucide-react';

export type EventCategory = 
  | 'Milestone Achievement' 
  | 'Statutory Clearance' 
  | 'Safety & Quality Inspection' 
  | 'Timeline Slippage Alert' 
  | 'Expenditure Audit';

export interface MilestoneAuditEntry {
  id: string;
  projectId: string;
  projectName: string;
  projectCode: string;
  sector: string;
  agency: string;
  eventName: string;
  category: EventCategory;
  targetDate: string;
  actualDate?: string;
  authority: string;
  status: 'Achieved' | 'In Progress' | 'Delayed' | 'Pending';
  weightagePercent?: number;
  notes: string;
}

// Pre-seeded authentic MoSPI PAIMANA regulatory & inspection logs
const BASE_REGULATORY_LOGS: MilestoneAuditEntry[] = [
  {
    id: 'log-01',
    projectId: 'proj-01',
    projectName: 'Udhampur-Srinagar-Baramulla Rail Link (USBRL)',
    projectCode: 'OCMS-RLY-2002-019',
    sector: 'Railways',
    agency: 'Northern Railway / KRCL',
    eventName: 'Chenab Arch Bridge Superstructure Erection & Gold Joint',
    category: 'Milestone Achievement',
    targetDate: '2021-04-15',
    actualDate: '2022-08-14',
    authority: 'Konkan Railway / Northern Railway Safety Directorate',
    status: 'Achieved',
    weightagePercent: 30,
    notes: 'World highest railway arch bridge (359m above river bed) successfully completed with wind tunnel calibration up to 266 km/h.',
  },
  {
    id: 'log-02',
    projectId: 'proj-01',
    projectName: 'Udhampur-Srinagar-Baramulla Rail Link (USBRL)',
    projectCode: 'OCMS-RLY-2002-019',
    sector: 'Railways',
    agency: 'Northern Railway',
    eventName: 'Tunnel T-49 Breakthrough (12.75 km)',
    category: 'Milestone Achievement',
    targetDate: '2023-09-30',
    actualDate: '2024-02-15',
    authority: 'Chief Administrative Officer (Construction) / NR',
    status: 'Achieved',
    weightagePercent: 25,
    notes: 'Longest transportation tunnel in India breakthrough completed through complex young Himalayan geology.',
  },
  {
    id: 'log-03',
    projectId: 'proj-01',
    projectName: 'Udhampur-Srinagar-Baramulla Rail Link (USBRL)',
    projectCode: 'OCMS-RLY-2002-019',
    sector: 'Railways',
    agency: 'Northern Railway',
    eventName: 'Commissioner of Railway Safety (CRS) Sectional Inspection',
    category: 'Safety & Quality Inspection',
    targetDate: '2026-06-30',
    authority: 'Commission of Railway Safety (Northern Circle)',
    status: 'In Progress',
    weightagePercent: 20,
    notes: 'Statutory dynamic speed trial and overhead electrification safety sign-off for Sangaldan-Reasi section.',
  },
  {
    id: 'log-04',
    projectId: 'proj-02',
    projectName: 'Dibang Multipurpose Hydroelectric Project (2880 MW)',
    projectCode: 'OCMS-PWR-2019-114',
    sector: 'Power',
    agency: 'NHPC Limited',
    eventName: 'Stage-II Forest Clearance & Land Handover',
    category: 'Statutory Clearance',
    targetDate: '2020-12-31',
    actualDate: '2022-09-15',
    authority: 'MoEFCC Forest Advisory Committee (FAC)',
    status: 'Achieved',
    weightagePercent: 20,
    notes: 'Diversion of 4,577.84 hectares of forest land sanctioned with conditions of compensatory afforestation.',
  },
  {
    id: 'log-05',
    projectId: 'proj-02',
    projectName: 'Dibang Multipurpose Hydroelectric Project (2880 MW)',
    projectCode: 'OCMS-PWR-2019-114',
    sector: 'Power',
    agency: 'NHPC Limited',
    eventName: 'Diversion Tunnel-1 Excavation & River Diversion',
    category: 'Timeline Slippage Alert',
    targetDate: '2023-06-30',
    authority: 'Central Water Commission (CWC) Technical Advisory',
    status: 'Delayed',
    weightagePercent: 30,
    notes: 'Flash floods in Lower Dibang Valley inundated upstream cofferdam; 14-month schedule slippage logged.',
  },
  {
    id: 'log-06',
    projectId: 'proj-03',
    projectName: 'Mumbai-Ahmedabad High-Speed Rail Corridor (MAHSR)',
    projectCode: 'OCMS-RLY-2015-081',
    sector: 'Railways',
    agency: 'NHSRCL',
    eventName: '100% Land Acquisition Handover across Gujarat (951 Ha)',
    category: 'Statutory Clearance',
    targetDate: '2020-03-31',
    actualDate: '2023-01-20',
    authority: 'Revenue Department, Government of Gujarat / NHSRCL',
    status: 'Achieved',
    weightagePercent: 25,
    notes: 'Complete statutory RoW secured across 8 districts in Gujarat; enabled full-scale civil viaduct launch.',
  },
  {
    id: 'log-07',
    projectId: 'proj-03',
    projectName: 'Mumbai-Ahmedabad High-Speed Rail Corridor (MAHSR)',
    projectCode: 'OCMS-RLY-2015-081',
    sector: 'Railways',
    agency: 'NHSRCL',
    eventName: '21 km Undersea Tunnel Package (C-2 BKC to Shilphata)',
    category: 'Milestone Achievement',
    targetDate: '2024-12-31',
    authority: 'Afcons-KPT Consortium / JICA Technical Team',
    status: 'In Progress',
    weightagePercent: 30,
    notes: '7 km undersea section beneath Thane Creek using 13.1m diameter slurry TBMs currently in progress.',
  },
  {
    id: 'log-08',
    projectId: 'proj-04',
    projectName: 'Western Dedicated Freight Corridor (WDFC)',
    projectCode: 'OCMS-RLY-2006-004',
    sector: 'Railways',
    agency: 'DFCCIL',
    eventName: 'Dadri - Rewari Section Double Stack Container Commercial Run',
    category: 'Milestone Achievement',
    targetDate: '2021-08-15',
    actualDate: '2022-01-07',
    authority: 'Dedicated Freight Corridor Corp of India / MoR',
    status: 'Achieved',
    weightagePercent: 35,
    notes: 'Operationalized 127 km link connecting WDFC directly with Eastern DFC at Dadri junction.',
  },
  {
    id: 'log-09',
    projectId: 'proj-05',
    projectName: 'Noida International Airport (Jewar)',
    projectCode: 'OCMS-AIR-2018-022',
    sector: 'Civil Aviation',
    agency: 'Noida International Airport Ltd (NIAL)',
    eventName: 'Runway 10/28 Bituminous Surface Completion & ILS Calibration',
    category: 'Safety & Quality Inspection',
    targetDate: '2024-03-31',
    actualDate: '2024-05-18',
    authority: 'Directorate General of Civil Aviation (DGCA) & AAI',
    status: 'Achieved',
    weightagePercent: 30,
    notes: 'Successful flight validation of Instrument Landing System (ILS) and precision approach lighting.',
  },
  {
    id: 'log-10',
    projectId: 'proj-06',
    projectName: 'BharatNet Phase-II National Broadband',
    projectCode: 'OCMS-TEL-2017-093',
    sector: 'Telecommunications',
    agency: 'BBNL / BSNL',
    eventName: 'Underground OFC Spurring in Remote LWE Districts',
    category: 'Timeline Slippage Alert',
    targetDate: '2023-03-31',
    authority: 'Digital Communications Commission (DCC) Review',
    status: 'Delayed',
    weightagePercent: 25,
    notes: 'Contractor dispute and security clearance delays in Bastar & Malkangiri; 18 months slippage.',
  },
  {
    id: 'log-11',
    projectId: 'proj-07',
    projectName: 'HPCL Rajasthan Refinery & Petrochemical Complex',
    projectCode: 'OCMS-PET-2018-055',
    sector: 'Petroleum & Natural Gas',
    agency: 'HRRL',
    eventName: 'Crude Distillation Unit (CDU) Heavy Reactor Erection',
    category: 'Milestone Achievement',
    targetDate: '2023-11-30',
    actualDate: '2024-03-12',
    authority: 'Engineers India Limited (EIL) Inspection Agency',
    status: 'Achieved',
    weightagePercent: 30,
    notes: 'Heavy lift erection of 1,200 metric tonne reactor column completed at Pachpadra, Barmer.',
  },
  {
    id: 'log-12',
    projectId: 'proj-08',
    projectName: 'Char Dham All-Weather Road Connectivity Project',
    projectCode: 'OCMS-ROD-2016-037',
    sector: 'Road Transport & Highways',
    agency: 'MoRTH / BRO / NHIDCL',
    eventName: 'Supreme Court High-Powered Committee (HPC) Environmental Clearance',
    category: 'Statutory Clearance',
    targetDate: '2020-09-30',
    actualDate: '2021-12-14',
    authority: 'Supreme Court of India / MoEFCC High-Powered Committee',
    status: 'Achieved',
    weightagePercent: 20,
    notes: 'Approved 10m tarred surface for strategic feeder routes leading to Indo-China border areas.',
  },
];

const LOCAL_TIMELINE_LOGS_KEY = 'paimana_timeline_audit_logs_v1';

export function TimeLogView() {
  const { toast } = useToast();
  const [projects, setProjects] = useState<InfraProject[]>([]);
  const [auditLogs, setAuditLogs] = useState<MilestoneAuditEntry[]>([]);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [sectorFilter, setSectorFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [projectFilter, setProjectFilter] = useState('all');

  // New Event Modal State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newEventProject, setNewEventProject] = useState('');
  const [newEventName, setNewEventName] = useState('');
  const [newEventCategory, setNewEventCategory] = useState<EventCategory>('Milestone Achievement');
  const [newEventTargetDate, setNewEventTargetDate] = useState(new Date().toISOString().split('T')[0]);
  const [newEventActualDate, setNewEventActualDate] = useState('');
  const [newEventAuthority, setNewEventAuthority] = useState('');
  const [newEventStatus, setNewEventStatus] = useState<'Achieved' | 'In Progress' | 'Delayed' | 'Pending'>('Achieved');
  const [newEventNotes, setNewEventNotes] = useState('');

  // Load projects and compile dynamic timeline logs
  useEffect(() => {
    const loadedProjects = getStoredProjects();
    setProjects(loadedProjects);

    // Check if custom logs stored in localStorage
    let storedCustomLogs: MilestoneAuditEntry[] = [];
    try {
      const raw = localStorage.getItem(LOCAL_TIMELINE_LOGS_KEY);
      if (raw) {
        storedCustomLogs = JSON.parse(raw);
      }
    } catch (e) {
      console.warn('Could not read custom timeline logs:', e);
    }

    // Also extract all milestones defined on active projects
    const dynamicProjectLogs: MilestoneAuditEntry[] = [];
    loadedProjects.forEach(p => {
      if (p.milestones && p.milestones.length > 0) {
        p.milestones.forEach((m, idx) => {
          // Avoid duplicate if already covered in base logs
          const existsInBase = BASE_REGULATORY_LOGS.some(
            b => b.projectCode === p.projectCode && b.eventName.toLowerCase().includes(m.name.toLowerCase().substring(0, 15))
          );
          if (!existsInBase) {
            dynamicProjectLogs.push({
              id: `dyn-${p.id}-${m.id || idx}`,
              projectId: p.id,
              projectName: p.projectName,
              projectCode: p.projectCode,
              sector: p.sector,
              agency: p.agency,
              eventName: m.name,
              category: m.status === 'Achieved' 
                ? 'Milestone Achievement' 
                : m.status === 'Delayed' 
                  ? 'Timeline Slippage Alert' 
                  : 'Milestone Achievement',
              targetDate: m.targetDate,
              actualDate: m.actualDate,
              authority: p.agency || 'Nodal Ministry Directorate',
              status: m.status,
              weightagePercent: m.weightagePercent,
              notes: `Key operational milestone monitored under ${p.projectCode} schedule framework.`,
            });
          }
        });
      }
    });

    // Combine all logs, with custom user logs first
    const combined = [...storedCustomLogs, ...BASE_REGULATORY_LOGS, ...dynamicProjectLogs];
    setAuditLogs(combined);
  }, []);

  // Filtered logs
  const filteredLogs = useMemo(() => {
    return auditLogs.filter(log => {
      if (sectorFilter !== 'all' && log.sector !== sectorFilter) return false;
      if (statusFilter !== 'all' && log.status !== statusFilter) return false;
      if (categoryFilter !== 'all' && log.category !== categoryFilter) return false;
      if (projectFilter !== 'all' && log.projectCode !== projectFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = log.projectName.toLowerCase().includes(q);
        const matchesCode = log.projectCode.toLowerCase().includes(q);
        const matchesEvent = log.eventName.toLowerCase().includes(q);
        const matchesAuth = log.authority.toLowerCase().includes(q);
        const matchesNotes = log.notes.toLowerCase().includes(q);
        if (!matchesName && !matchesCode && !matchesEvent && !matchesAuth && !matchesNotes) {
          return false;
        }
      }

      return true;
    });
  }, [auditLogs, sectorFilter, statusFilter, categoryFilter, projectFilter, searchQuery]);

  // Unique sector options
  const sectors = useMemo(() => Array.from(new Set(auditLogs.map(l => l.sector))).sort(), [auditLogs]);

  // KPI Metrics
  const totalCount = auditLogs.length;
  const achievedCount = auditLogs.filter(l => l.status === 'Achieved').length;
  const inProgressCount = auditLogs.filter(l => l.status === 'In Progress').length;
  const delayedCount = auditLogs.filter(l => l.status === 'Delayed').length;
  const clearanceCount = auditLogs.filter(l => l.category === 'Statutory Clearance').length;

  // Handle Export to CSV
  const handleExportCSV = () => {
    const headers = [
      'Log ID',
      'Project Code',
      'Project Name',
      'Sector',
      'Executing Agency',
      'Event / Milestone Title',
      'Category',
      'Target Date',
      'Actual / Inspection Date',
      'Inspecting Authority',
      'Status',
      'Weightage (%)',
      'Audit Notes',
    ];

    const rows = filteredLogs.map(l => [
      `"${l.id}"`,
      `"${l.projectCode}"`,
      `"${l.projectName.replace(/"/g, '""')}"`,
      `"${l.sector}"`,
      `"${l.agency}"`,
      `"${l.eventName.replace(/"/g, '""')}"`,
      `"${l.category}"`,
      `"${l.targetDate}"`,
      `"${l.actualDate || 'N/A'}"`,
      `"${l.authority.replace(/"/g, '""')}"`,
      `"${l.status}"`,
      `"${l.weightagePercent || 0}"`,
      `"${l.notes.replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `paimana_milestone_audit_trail_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Audit Trail Exported",
      description: `Downloaded ${filteredLogs.length} milestone & regulatory inspection logs to CSV.`,
    });
  };

  // Handle Add New Audit Log
  const handleAddAuditLog = (e: React.FormEvent) => {
    e.preventDefault();

    if (!newEventProject) {
      toast({ variant: 'destructive', title: 'Select Project', description: 'Please select an infrastructure project.' });
      return;
    }
    if (!newEventName.trim()) {
      toast({ variant: 'destructive', title: 'Event Title Required', description: 'Please enter a milestone or inspection title.' });
      return;
    }

    const selectedProj = projects.find(p => p.projectCode === newEventProject);
    const newEntry: MilestoneAuditEntry = {
      id: `usr-log-${Date.now()}`,
      projectId: selectedProj?.id || 'proj-custom',
      projectName: selectedProj?.projectName || 'Infrastructure Project',
      projectCode: newEventProject,
      sector: selectedProj?.sector || 'Infrastructure',
      agency: selectedProj?.agency || 'Nodal Agency',
      eventName: newEventName.trim(),
      category: newEventCategory,
      targetDate: newEventTargetDate,
      actualDate: newEventActualDate || undefined,
      authority: newEventAuthority.trim() || 'MoSPI / IPMD Inspection Team',
      status: newEventStatus,
      weightagePercent: 20,
      notes: newEventNotes.trim() || 'Recorded during executive MoSPI monitoring audit review.',
    };

    // Save to state and localStorage
    const updated = [newEntry, ...auditLogs];
    setAuditLogs(updated);

    try {
      const existingRaw = localStorage.getItem(LOCAL_TIMELINE_LOGS_KEY);
      const existing = existingRaw ? JSON.parse(existingRaw) : [];
      localStorage.setItem(LOCAL_TIMELINE_LOGS_KEY, JSON.stringify([newEntry, ...existing]));
    } catch (err) {
      console.warn('Could not persist custom log:', err);
    }

    toast({
      title: "Timeline Event Logged",
      description: `"${newEntry.eventName}" registered for ${newEntry.projectCode}.`,
    });

    setIsAddOpen(false);
    setNewEventName('');
    setNewEventNotes('');
    setNewEventAuthority('');
  };

  const getStatusBadge = (status: MilestoneAuditEntry['status']) => {
    switch (status) {
      case 'Achieved':
        return (
          <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" /> Achieved
          </Badge>
        );
      case 'In Progress':
        return (
          <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1">
            <Clock className="h-3 w-3" /> In Progress
          </Badge>
        );
      case 'Delayed':
        return (
          <Badge className="bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" /> Delayed
          </Badge>
        );
      case 'Pending':
        return (
          <Badge variant="outline" className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <Activity className="h-3 w-3" /> Pending
          </Badge>
        );
    }
  };

  const getCategoryBadge = (category: EventCategory) => {
    switch (category) {
      case 'Statutory Clearance':
        return <Badge variant="outline" className="text-[10px] border-indigo-300 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 bg-indigo-50/50 dark:bg-indigo-950/40">Clearance</Badge>;
      case 'Safety & Quality Inspection':
        return <Badge variant="outline" className="text-[10px] border-blue-300 dark:border-blue-800 text-blue-700 dark:text-blue-300 bg-blue-50/50 dark:bg-blue-950/40">Inspection</Badge>;
      case 'Timeline Slippage Alert':
        return <Badge variant="outline" className="text-[10px] border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 bg-rose-50/50 dark:bg-rose-950/40">Slippage Alert</Badge>;
      case 'Expenditure Audit':
        return <Badge variant="outline" className="text-[10px] border-purple-300 dark:border-purple-800 text-purple-700 dark:text-purple-300 bg-purple-50/50 dark:bg-purple-950/40">Audit</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px] border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/40">Milestone</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header & Context Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white border border-white/10 shadow-lg">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <span>National Infrastructure Milestone & Audit Logs</span>
            </h1>
            <Badge className="bg-blue-500/20 border border-blue-400/40 text-blue-300 text-[10px] font-bold uppercase">
              MoSPI PAIMANA
            </Badge>
          </div>
          <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
            Real-time chronological timeline tracking statutory clearances, technical inspections, 
            bridge/tunnel breakthrough achievements, and timeline slippage alerts across all active central mega projects.
          </p>
        </div>

        {/* Top Actions */}
        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="h-8 text-xs bg-white/10 hover:bg-white/20 text-white border-white/20 hover:border-white/40 gap-1.5"
          >
            <Download className="h-3.5 w-3.5 text-blue-300" />
            <span>Export Audit Trail (CSV)</span>
          </Button>

          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                className="h-8 text-xs bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold shadow-sm gap-1.5"
              >
                <PlusCircle className="h-3.5 w-3.5" />
                <span>Log Timeline Event</span>
              </Button>
            </DialogTrigger>

            <DialogContent className="max-w-lg border-slate-200 dark:border-slate-800">
              <DialogHeader>
                <DialogTitle className="text-base font-bold flex items-center gap-2">
                  <Activity className="h-4 w-4 text-blue-600" />
                  <span>Record Infrastructure Milestone Event</span>
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Add an official inspection, milestone achievement, or statutory clearance to the PAIMANA audit trail.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleAddAuditLog} className="space-y-3.5 py-2">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Select Project</Label>
                  <Select value={newEventProject} onValueChange={setNewEventProject}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Choose an active project..." />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map(p => (
                        <SelectItem key={p.projectCode} value={p.projectCode}>
                          {p.projectCode} — {p.projectName.substring(0, 35)}...
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Milestone / Event Name</Label>
                  <Input
                    placeholder="e.g. Tunnel T-50 Arch Breakthrough, CRS Dynamic Inspection"
                    value={newEventName}
                    onChange={e => setNewEventName(e.target.value)}
                    className="h-8 text-xs"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Event Category</Label>
                    <Select value={newEventCategory} onValueChange={(v: EventCategory) => setNewEventCategory(v)}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Milestone Achievement">Milestone Achievement</SelectItem>
                        <SelectItem value="Statutory Clearance">Statutory Clearance</SelectItem>
                        <SelectItem value="Safety & Quality Inspection">Safety & Quality Inspection</SelectItem>
                        <SelectItem value="Timeline Slippage Alert">Timeline Slippage Alert</SelectItem>
                        <SelectItem value="Expenditure Audit">Expenditure Audit</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Status</Label>
                    <Select value={newEventStatus} onValueChange={(v: any) => setNewEventStatus(v)}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Achieved">Achieved</SelectItem>
                        <SelectItem value="In Progress">In Progress</SelectItem>
                        <SelectItem value="Delayed">Delayed</SelectItem>
                        <SelectItem value="Pending">Pending</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Target / Scheduled Date</Label>
                    <Input
                      type="date"
                      value={newEventTargetDate}
                      onChange={e => setNewEventTargetDate(e.target.value)}
                      className="h-8 text-xs"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Actual / Achieved Date</Label>
                    <Input
                      type="date"
                      value={newEventActualDate}
                      onChange={e => setNewEventActualDate(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Inspecting Authority / Officer</Label>
                  <Input
                    placeholder="e.g. Commissioner of Railway Safety, CWC, NHAI Chief Project Officer"
                    value={newEventAuthority}
                    onChange={e => setNewEventAuthority(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Audit Notes & Technical Observations</Label>
                  <Textarea
                    placeholder="Provide technical progress notes, structural verification or reason for slippage..."
                    value={newEventNotes}
                    onChange={e => setNewEventNotes(e.target.value)}
                    rows={2}
                    className="text-xs resize-none"
                  />
                </div>

                <DialogFooter className="pt-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setIsAddOpen(false)} className="h-8 text-xs">
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" className="h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold">
                    Save to Audit Trail
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <Card className="border-slate-200 dark:border-slate-800 bg-card p-3 shadow-2xs">
          <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Total Tracked</div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">{totalCount}</div>
          <div className="text-[10px] text-muted-foreground mt-0.5">Audit Events & Milestones</div>
        </Card>

        <Card className="border-emerald-200 dark:border-emerald-900/50 bg-emerald-500/5 p-3 shadow-2xs">
          <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Achieved</div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{achievedCount}</div>
          <div className="text-[10px] text-emerald-600/70 mt-0.5">Completed & Verified</div>
        </Card>

        <Card className="border-amber-200 dark:border-amber-900/50 bg-amber-500/5 p-3 shadow-2xs">
          <div className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">In Progress</div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">{inProgressCount}</div>
          <div className="text-[10px] text-amber-600/70 mt-0.5">Active Execution Phase</div>
        </Card>

        <Card className="border-rose-200 dark:border-rose-900/50 bg-rose-500/5 p-3 shadow-2xs">
          <div className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider">Slippage / Delay</div>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">{delayedCount}</div>
          <div className="text-[10px] text-rose-600/70 mt-0.5">Schedule Bottlenecks</div>
        </Card>

        <Card className="border-indigo-200 dark:border-indigo-900/50 bg-indigo-500/5 p-3 shadow-2xs col-span-2 sm:col-span-1">
          <div className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Clearances</div>
          <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">{clearanceCount}</div>
          <div className="text-[10px] text-indigo-600/70 mt-0.5">Forest / Land / Safety</div>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
        <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <span>Chronological Milestone & Inspection Stream</span>
                <Badge variant="outline" className="text-xs font-mono">
                  {filteredLogs.length} Records
                </Badge>
              </CardTitle>
              <CardDescription className="text-xs">
                Verified against MoSPI PAIMANA monthly monitoring schedule & site inspection reports
              </CardDescription>
            </div>

            {/* Filter Controls Bar */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Search */}
              <div className="relative min-w-[210px]">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search milestone, project, authority..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-8 h-8 text-xs"
                />
              </div>

              {/* Sector Filter */}
              <Select value={sectorFilter} onValueChange={setSectorFilter}>
                <SelectTrigger className="w-[130px] h-8 text-xs">
                  <SelectValue placeholder="Sector" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sectors</SelectItem>
                  {sectors.map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Category Filter */}
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[140px] h-8 text-xs">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="Milestone Achievement">Milestone Achievement</SelectItem>
                  <SelectItem value="Statutory Clearance">Statutory Clearance</SelectItem>
                  <SelectItem value="Safety & Quality Inspection">Safety Inspection</SelectItem>
                  <SelectItem value="Timeline Slippage Alert">Slippage Alert</SelectItem>
                  <SelectItem value="Expenditure Audit">Expenditure Audit</SelectItem>
                </SelectContent>
              </Select>

              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[125px] h-8 text-xs">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Achieved">Achieved</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Delayed">Delayed</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50 dark:bg-slate-900 text-xs">
                <TableRow>
                  <TableHead className="w-[260px]">Project & Code</TableHead>
                  <TableHead className="w-[300px]">Milestone / Regulatory Event</TableHead>
                  <TableHead className="w-[130px]">Category</TableHead>
                  <TableHead className="w-[160px]">Target vs Actual</TableHead>
                  <TableHead className="w-[180px]">Inspecting Authority</TableHead>
                  <TableHead className="w-[120px]">Status</TableHead>
                  <TableHead className="min-w-[240px]">Audit Notes / Technical Impact</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody className="text-xs">
                {filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                      No milestone or regulatory audit logs found matching your filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map(log => (
                    <TableRow key={log.id} className="hover:bg-muted/40 transition-colors">
                      {/* Project Title & Code */}
                      <TableCell className="align-top py-3 font-medium">
                        <div className="flex flex-col gap-1">
                          <span className="font-semibold text-slate-900 dark:text-white line-clamp-1">
                            {log.projectName}
                          </span>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0">
                              {log.projectCode}
                            </Badge>
                            <span className="text-[10px] text-muted-foreground">
                              {log.sector}
                            </span>
                          </div>
                        </div>
                      </TableCell>

                      {/* Milestone Event Title */}
                      <TableCell className="align-top py-3">
                        <div className="flex items-start gap-2">
                          <div className="mt-0.5 shrink-0">
                            {log.status === 'Achieved' ? (
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                            ) : log.status === 'Delayed' ? (
                              <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />
                            ) : log.category === 'Statutory Clearance' ? (
                              <ShieldCheck className="h-3.5 w-3.5 text-indigo-600" />
                            ) : (
                              <Clock className="h-3.5 w-3.5 text-amber-600" />
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-800 dark:text-slate-200">
                              {log.eventName}
                            </div>
                            {log.weightagePercent && log.weightagePercent > 0 && (
                              <span className="text-[10px] text-muted-foreground font-mono">
                                Milestone Weight: {log.weightagePercent}%
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      {/* Category */}
                      <TableCell className="align-top py-3">
                        {getCategoryBadge(log.category)}
                      </TableCell>

                      {/* Target vs Actual Date */}
                      <TableCell className="align-top py-3 font-mono">
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1 text-[11px]">
                            <span className="text-muted-foreground">Target:</span>
                            <span>{log.targetDate}</span>
                          </div>
                          {log.actualDate ? (
                            <div className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                              <span>Achieved:</span>
                              <span>{log.actualDate}</span>
                            </div>
                          ) : log.status === 'Delayed' ? (
                            <span className="text-[10px] text-rose-600 font-bold">
                              Overdue
                            </span>
                          ) : (
                            <span className="text-[10px] text-muted-foreground">
                              Pending
                            </span>
                          )}
                        </div>
                      </TableCell>

                      {/* Authority */}
                      <TableCell className="align-top py-3">
                        <div className="text-slate-700 dark:text-slate-300 font-medium line-clamp-2">
                          {log.authority}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {log.agency}
                        </div>
                      </TableCell>

                      {/* Status */}
                      <TableCell className="align-top py-3">
                        {getStatusBadge(log.status)}
                      </TableCell>

                      {/* Audit Notes */}
                      <TableCell className="align-top py-3 text-slate-600 dark:text-slate-400 leading-relaxed text-[11px]">
                        {log.notes}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
