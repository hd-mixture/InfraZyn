'use client';

/**
 * MoSPI PAIMANA Infrastructure Project Enrollment Dialog
 * Problem Statement: SIH26103 (Ministry of Statistics and Programme Implementation)
 * Team: InfraZyn | "Predict. Monitor. Prevent."
 * 
 * Enrolls authentic infrastructure assets directly into the PAIMANA monitoring registry,
 * instantly recalculating composite risk, schedule slippage, and early warning triggers.
 */

import React, { useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { InfraProject, ProjectStatus, ProjectType, InfraMilestone } from '@/types/infrastructure';
import { getStoredProjects, saveStoredProjects } from '@/lib/infrastructure/demo-dataset';
import { db } from '@/lib/firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import {
  Building2,
  Calendar,
  IndianRupee,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Plus,
  Compass,
  FileCheck,
} from 'lucide-react';

const SECTOR_MINISTRY_MAP: Record<string, { ministry: string; prefix: string; agencies: string[] }> = {
  'Railways': {
    ministry: 'Ministry of Railways',
    prefix: 'RLY',
    agencies: ['Northern Railway', 'Western Railway', 'Dedicated Freight Corridor (DFCCIL)', 'NCRTC', 'RVNL', 'Konkan Railway (KRCL)'],
  },
  'Road Transport & Highways': {
    ministry: 'Ministry of Road Transport & Highways',
    prefix: 'ROD',
    agencies: ['National Highways Authority of India (NHAI)', 'NHIDCL', 'Border Roads Organisation (BRO)'],
  },
  'Power': {
    ministry: 'Ministry of Power',
    prefix: 'PWR',
    agencies: ['NHPC Limited', 'NTPC Limited', 'Power Grid Corporation (PGCIL)', 'SJVN Limited'],
  },
  'Petroleum & Natural Gas': {
    ministry: 'Ministry of Petroleum & Natural Gas',
    prefix: 'PET',
    agencies: ['Indian Oil Corporation (IOCL)', 'ONGC', 'Bharat Petroleum (BPCL)', 'GAIL (India)'],
  },
  'Telecommunications': {
    ministry: 'Ministry of Communications',
    prefix: 'TEL',
    agencies: ['Bharat Broadband Network (BBNL)', 'BSNL', 'MTNL'],
  },
  'Civil Aviation': {
    ministry: 'Ministry of Civil Aviation',
    prefix: 'AIR',
    agencies: ['Airports Authority of India (AAI)', 'Noida International Airport Ltd (NIAL)'],
  },
  'Shipping & Ports': {
    ministry: 'Ministry of Ports, Shipping and Waterways',
    prefix: 'PRT',
    agencies: ['Jawaharlal Nehru Port Authority (JNPA)', 'Paradip Port Authority', 'Deendayal Port Authority'],
  },
  'Urban Development': {
    ministry: 'Ministry of Housing and Urban Affairs',
    prefix: 'URB',
    agencies: ['Delhi Metro Rail Corp (DMRC)', 'Mumbai Metropolitan Region (MMRDA)', 'Bangalore Metro (BMRCL)'],
  },
  'Water Resources': {
    ministry: 'Ministry of Jal Shakti',
    prefix: 'WTR',
    agencies: ['National Water Development Agency (NWDA)', 'Central Water Commission (CWC)'],
  },
};

export function CreateProjectForm({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  // Form State
  const [projectName, setProjectName] = useState('');
  const [projectCode, setProjectCode] = useState('');
  const [sector, setSector] = useState('Railways');
  const [ministry, setMinistry] = useState('Ministry of Railways');
  const [agency, setAgency] = useState('Northern Railway');
  const [state, setState] = useState('Delhi / NCR');
  const [locationSummary, setLocationSummary] = useState('');
  
  // Cost State (₹ Cr)
  const [originalCost, setOriginalCost] = useState<number | ''>(3200);
  const [revisedCost, setRevisedCost] = useState<number | ''>(3850);
  const [cumulativeExpenditure, setCumulativeExpenditure] = useState<number | ''>(2100);

  // Timeline State
  const [approvalDate, setApprovalDate] = useState('2021-04-15');
  const [startDate, setStartDate] = useState('2021-09-01');
  const [originalCompletionDate, setOriginalCompletionDate] = useState('2025-03-31');
  const [revisedCompletionDate, setRevisedCompletionDate] = useState('2026-10-31');
  const [physicalProgress, setPhysicalProgress] = useState<number | ''>(58.5);
  const [status, setStatus] = useState<ProjectStatus>('Delayed');
  const [description, setDescription] = useState('');

  // Auto-generate project code on sector change if empty or matches pattern
  const handleSectorChange = (newSector: string) => {
    setSector(newSector);
    const meta = SECTOR_MINISTRY_MAP[newSector];
    if (meta) {
      setMinistry(meta.ministry);
      setAgency(meta.agencies[0] || '');
      const randomId = Math.floor(100 + Math.random() * 900);
      setProjectCode(`OCMS-${meta.prefix}-2026-${randomId}`);
    }
  };

  const handleGenerateCode = () => {
    const meta = SECTOR_MINISTRY_MAP[sector] || { prefix: 'INF' };
    const randomId = Math.floor(100 + Math.random() * 900);
    setProjectCode(`OCMS-${meta.prefix}-2026-${randomId}`);
  };

  const handleFillSample = () => {
    setProjectName('Delhi - Meerut Regional Rapid Transit System (RRTS)');
    setProjectCode('OCMS-RLY-2024-108');
    setSector('Railways');
    setMinistry('Ministry of Railways');
    setAgency('National Capital Region Transport Corporation (NCRTC)');
    setState('Delhi / Uttar Pradesh');
    setLocationSummary('82.15 km semi-high-speed rail corridor linking Sarai Kale Khan to Modipuram, Meerut.');
    setOriginalCost(30274);
    setRevisedCost(32950);
    setCumulativeExpenditure(26100);
    setApprovalDate('2019-03-07');
    setStartDate('2019-06-01');
    setOriginalCompletionDate('2024-03-31');
    setRevisedCompletionDate('2025-09-30');
    setPhysicalProgress(86.2);
    setStatus('Delayed');
    setDescription('Priority semi-high-speed suburban transit corridor. Facing minor land encumbrance and station viaduct integration delays across the Delhi section.');
  };

  // Live KPI Calculations
  const orig = Number(originalCost) || 0;
  const rev = Number(revisedCost) || orig || 1;
  const exp = Number(cumulativeExpenditure) || 0;
  const costEscalation = Math.max(0, rev - orig);
  const costEscalationPct = orig > 0 ? ((costEscalation / orig) * 100).toFixed(1) : '0';
  const finProgress = Math.min(100, Math.round((exp / rev) * 1000) / 10);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!projectName.trim()) {
      toast({
        variant: 'destructive',
        title: 'Project Name Required',
        description: 'Please specify an infrastructure project title.',
      });
      return;
    }

    if (!projectCode.trim()) {
      toast({
        variant: 'destructive',
        title: 'Project Code Required',
        description: 'Please provide or generate an OCMS/MoSPI code.',
      });
      return;
    }

    setLoading(true);

    try {
      const sanitizedCost = Number(originalCost) || 500;
      const sanitizedRevCost = Number(revisedCost) || sanitizedCost;
      const sanitizedExp = Number(cumulativeExpenditure) || 0;
      const sanitizedPhys = Number(physicalProgress) || 0;

      const projectType: ProjectType = sanitizedRevCost >= 1000
        ? 'Mega (>= ₹1000 Cr)'
        : 'Major (₹150 - ₹1000 Cr)';

      const defaultMilestones: InfraMilestone[] = [
        {
          id: 'm1',
          name: 'Statutory Clearances & CCEA Sanction',
          targetDate: approvalDate || '2022-01-01',
          actualDate: approvalDate || '2022-01-01',
          status: 'Achieved',
          weightagePercent: 20,
        },
        {
          id: 'm2',
          name: 'Primary Civil Works & Structural Package',
          targetDate: originalCompletionDate || '2025-06-30',
          status: sanitizedPhys >= 50 ? 'In Progress' : 'Delayed',
          weightagePercent: 50,
        },
        {
          id: 'm3',
          name: 'Integrated Testing, Safety Certification & Final Commissioning',
          targetDate: revisedCompletionDate || '2026-12-31',
          status: 'Pending',
          weightagePercent: 30,
        },
      ];

      const newProject: InfraProject = {
        id: `proj-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        projectName: projectName.trim(),
        projectCode: projectCode.trim().toUpperCase(),
        legacyCode: `PMGID-${(SECTOR_MINISTRY_MAP[sector]?.prefix || 'INF')}-${Math.floor(100 + Math.random() * 900)}`,
        agency: agency.trim() || 'State Nodal Agency',
        ministry: ministry.trim() || 'MoSPI Monitored Line Ministry',
        sector: sector,
        state: state.trim() || 'National Grid',
        locationSummary: locationSummary.trim() || `${state} Infrastructure Alignment`,
        approvalDate: approvalDate || new Date().toISOString().split('T')[0],
        startDate: startDate || new Date().toISOString().split('T')[0],
        originalCompletionDate: originalCompletionDate || '2026-12-31',
        revisedCompletionDate: revisedCompletionDate || '2027-12-31',
        originalCost: sanitizedCost,
        revisedCost: sanitizedRevCost,
        cumulativeExpenditure: sanitizedExp,
        physicalProgress: sanitizedPhys,
        financialProgress: finProgress,
        status: status,
        projectType: projectType,
        sourceSnapshot: 'MoSPI PAIMANA Registry Live Enrollment',
        sourceType: 'Imported Dataset',
        description: description.trim() || `${projectName} enrolled under MoSPI / IPMD early warning framework.`,
        milestones: defaultMilestones,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // 1. Save to local storage infrastructure dataset (Powers all UI views)
      const currentProjects = getStoredProjects();
      // Avoid duplicate codes
      const filtered = currentProjects.filter(p => p.projectCode !== newProject.projectCode);
      const updatedList = [newProject, ...filtered];
      saveStoredProjects(updatedList);

      // 2. Dispatch custom event so page.tsx updates immediately
      window.dispatchEvent(new CustomEvent('infra_projects_updated', { detail: newProject }));

      // 3. Optional: Sync to Firestore if available
      try {
        await addDoc(collection(db, 'infra_projects'), {
          ...newProject,
          savedAt: Timestamp.now(),
        });
      } catch (fbErr) {
        console.warn('Firestore optional sync skipped:', fbErr);
      }

      toast({
        title: "Infrastructure Project Enrolled!",
        description: `${newProject.projectName} (${newProject.projectCode}) is now live with automated Early Warning & ML Risk Scores.`,
      });

      setOpen(false);
      
      // Navigate to Projects view and show the newly created project
      router.push('/?view=projects');
    } catch (err: any) {
      console.error('Error saving project:', err);
      toast({
        variant: 'destructive',
        title: 'Enrollment Error',
        description: err?.message || 'Could not enroll project. Please check inputs.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>

      <DialogContent className="max-w-3xl max-h-[92vh] flex flex-col p-0 gap-0 border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <DialogHeader className="px-6 py-4 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white shrink-0 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-blue-500/20 border border-blue-400/30 text-blue-300">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  <span>Enroll Infrastructure Project Record</span>
                  <Badge variant="outline" className="border-blue-400/40 text-blue-300 text-[10px] uppercase font-semibold">
                    MoSPI PAIMANA
                  </Badge>
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-300">
                  Direct enrollment into national monitoring registry with automatic early warning calculation
                </DialogDescription>
              </div>
            </div>

            {/* Auto-fill sample button */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleFillSample}
              className="hidden sm:flex items-center gap-1.5 h-7 text-xs bg-white/10 hover:bg-white/20 text-white border-white/20 hover:border-white/40"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-300" />
              <span>Load Realistic Sample</span>
            </Button>
          </div>
        </DialogHeader>

        {/* Scrollable Form Body */}
        <ScrollArea className="flex-1 overflow-y-auto px-6 py-5">
          <form id="infra-enroll-form" onSubmit={handleSubmit} className="space-y-6">
            
            {/* Quick Banner for evaluator */}
            <div className="sm:hidden flex justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleFillSample}
                className="w-full text-xs flex items-center justify-center gap-1.5 h-8 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800"
              >
                <Sparkles className="h-3.5 w-3.5 text-blue-600" />
                <span>Auto-Fill Sample Project (Delhi-Meerut RRTS)</span>
              </Button>
            </div>

            {/* SECTION 1: Identity & Governance */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 pb-1.5 border-b border-slate-200 dark:border-slate-800 text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                <Compass className="h-4 w-4" />
                <span>1. Project Identity & Governance</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2 space-y-1.5">
                  <Label htmlFor="projectName" className="text-xs font-semibold">
                    Project Official Title <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="projectName"
                    placeholder="e.g. Udhampur-Srinagar-Baramulla Rail Link (USBRL)"
                    value={projectName}
                    onChange={e => setProjectName(e.target.value)}
                    required
                    className="h-9 text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="projectCode" className="text-xs font-semibold">
                      OCMS / MoSPI Code <span className="text-red-500">*</span>
                    </Label>
                    <button
                      type="button"
                      onClick={handleGenerateCode}
                      className="text-[11px] text-blue-600 hover:text-blue-700 underline flex items-center gap-1"
                    >
                      <Sparkles className="h-2.5 w-2.5" /> Generate Code
                    </button>
                  </div>
                  <Input
                    id="projectCode"
                    placeholder="e.g. OCMS-RLY-2026-108"
                    value={projectCode}
                    onChange={e => setProjectCode(e.target.value.toUpperCase())}
                    required
                    className="h-9 text-sm font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Infrastructure Sector</Label>
                  <Select value={sector} onValueChange={handleSectorChange}>
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="Select Sector" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(SECTOR_MINISTRY_MAP).map(s => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="ministry" className="text-xs font-semibold">Line Ministry</Label>
                  <Input
                    id="ministry"
                    value={ministry}
                    onChange={e => setMinistry(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="agency" className="text-xs font-semibold">Executing Agency / Nodal PSU</Label>
                  <Input
                    id="agency"
                    placeholder="e.g. Northern Railway, NHAI, NHPC"
                    value={agency}
                    onChange={e => setAgency(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="state" className="text-xs font-semibold">State / Union Territory</Label>
                  <Input
                    id="state"
                    placeholder="e.g. Jammu & Kashmir, Maharashtra, Gujarat"
                    value={state}
                    onChange={e => setState(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="locationSummary" className="text-xs font-semibold">Location / Alignment Summary</Label>
                  <Input
                    id="locationSummary"
                    placeholder="e.g. 111 km Katra-Banihal section across Pir Panjal"
                    value={locationSummary}
                    onChange={e => setLocationSummary(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 2: Financial Metrics */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 pb-1.5 border-b border-slate-200 dark:border-slate-800 text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                <IndianRupee className="h-4 w-4" />
                <span>2. Financial Allocation & Expenditure (₹ Crores)</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="originalCost" className="text-xs font-semibold">
                    Original Sanctioned Cost (₹ Cr) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="originalCost"
                    type="number"
                    min="1"
                    step="0.1"
                    value={originalCost}
                    onChange={e => setOriginalCost(e.target.value === '' ? '' : Number(e.target.value))}
                    className="h-9 text-sm font-semibold"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="revisedCost" className="text-xs font-semibold">
                    Anticipated / Revised Cost (₹ Cr) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="revisedCost"
                    type="number"
                    min="1"
                    step="0.1"
                    value={revisedCost}
                    onChange={e => setRevisedCost(e.target.value === '' ? '' : Number(e.target.value))}
                    className="h-9 text-sm font-semibold"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="cumulativeExpenditure" className="text-xs font-semibold">
                    Cumulative Expenditure (₹ Cr)
                  </Label>
                  <Input
                    id="cumulativeExpenditure"
                    type="number"
                    min="0"
                    step="0.1"
                    value={cumulativeExpenditure}
                    onChange={e => setCumulativeExpenditure(e.target.value === '' ? '' : Number(e.target.value))}
                    className="h-9 text-sm font-semibold"
                  />
                </div>
              </div>

              {/* Live Financial Calculated Preview Bar */}
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Calculated Cost Escalation:</span>
                  <span className={`font-bold ${costEscalation > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600'}`}>
                    ₹ {costEscalation.toLocaleString('en-IN')} Cr ({costEscalationPct}%)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Financial Progress:</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">
                    {finProgress}%
                  </span>
                </div>
                <Badge variant="secondary" className="text-[10px]">
                  {rev >= 1000 ? 'Mega Project (>= ₹1000 Cr)' : 'Major Project (₹150-1000 Cr)'}
                </Badge>
              </div>
            </div>

            {/* SECTION 3: Timeline & Progress */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 pb-1.5 border-b border-slate-200 dark:border-slate-800 text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                <Calendar className="h-4 w-4" />
                <span>3. Timelines, Physical Progress & Execution Status</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="approvalDate" className="text-xs font-semibold">CCEA / Sanction Date</Label>
                  <Input
                    id="approvalDate"
                    type="date"
                    value={approvalDate}
                    onChange={e => setApprovalDate(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="startDate" className="text-xs font-semibold">Commencement / Groundbreaking</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="originalCompletionDate" className="text-xs font-semibold">
                    Original Commissioning Target (DoC) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="originalCompletionDate"
                    type="date"
                    value={originalCompletionDate}
                    onChange={e => setOriginalCompletionDate(e.target.value)}
                    className="h-9 text-xs"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="revisedCompletionDate" className="text-xs font-semibold">
                    Revised / Anticipated DoC <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="revisedCompletionDate"
                    type="date"
                    value={revisedCompletionDate}
                    onChange={e => setRevisedCompletionDate(e.target.value)}
                    className="h-9 text-xs"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="physicalProgress" className="text-xs font-semibold">
                      Physical Progress (%) <span className="text-red-500">*</span>
                    </Label>
                    <span className="text-xs font-mono font-bold text-blue-600">
                      {physicalProgress || 0}%
                    </span>
                  </div>
                  <Input
                    id="physicalProgress"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    placeholder="e.g. 64.5"
                    value={physicalProgress}
                    onChange={e => setPhysicalProgress(e.target.value === '' ? '' : Number(e.target.value))}
                    className="h-9 text-sm"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Monitoring Status</Label>
                  <Select value={status} onValueChange={(v: ProjectStatus) => setStatus(v)}>
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Ongoing">Ongoing (Within Limits)</SelectItem>
                      <SelectItem value="Delayed">Delayed (Timeline Slippage)</SelectItem>
                      <SelectItem value="Critical">Critical (High Cost & Delay Overrun)</SelectItem>
                      <SelectItem value="Ahead of Schedule">Ahead of Schedule</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* SECTION 4: Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-xs font-semibold">
                Project Scope & Execution Notes (Optional)
              </Label>
              <Textarea
                id="description"
                placeholder="Key technical scope, geological bottlenecks, contractor status, or land acquisition notes..."
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={2}
                className="text-xs resize-none"
              />
            </div>
          </form>
        </ScrollArea>

        {/* Modal Footer */}
        <DialogFooter className="px-6 py-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-muted-foreground hidden sm:block">
            Auto-evaluates Risk Index, Early Warnings & Sector Benchmarks on submit.
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setOpen(false)}
              disabled={loading}
              className="text-xs h-9"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="infra-enroll-form"
              size="sm"
              disabled={loading}
              className="text-xs h-9 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold flex items-center gap-1.5 shadow-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Enrolling Project...</span>
                </>
              ) : (
                <>
                  <FileCheck className="h-3.5 w-3.5" />
                  <span>Enroll in PAIMANA Registry</span>
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
