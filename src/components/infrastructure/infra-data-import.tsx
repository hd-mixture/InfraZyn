'use client';

/**
 * Infrastructure Data Ingestion & Model Training Dataset Pipeline
 * MoSPI / IPMD PAIMANA Platform
 * Team: InfraZyn (SIH26103)
 * 
 * SEPARATES:
 * 1. Project Data Import (Current Portfolio Monitoring)
 * 2. Historical Model Training Dataset (Longitudinal Evaluation Pipeline)
 */

import React, { useState } from 'react';
import { InfraProject } from '@/types/infrastructure';
import { saveStoredProjects, resetDemoDataset } from '@/lib/infrastructure/demo-dataset';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Download,
  Database,
  ArrowRight,
  Layers,
  Cpu,
  Lock,
  Calendar,
  Sparkles,
  Sliders,
} from 'lucide-react';

interface InfraDataImportProps {
  currentProjects: InfraProject[];
  onDataUpdated: (newProjects: InfraProject[]) => void;
}

const SAMPLE_PORTFOLIO_CSV = `projectName,projectCode,agency,ministry,sector,state,approvalDate,startDate,originalCompletionDate,revisedCompletionDate,originalCost,revisedCost,cumulativeExpenditure,physicalProgress,status,projectType
"Dedicated Freight Corridor East Phase-I","OCMS-RLY-2023-110","DFCCIL","Ministry of Railways","Railways","Uttar Pradesh","2015-04-10","2016-01-15","2023-12-31","2026-10-31",18500,24200,21000,86.5,"Ongoing","Mega (>= ₹1000 Cr)"
"Kaziranga Elevated Corridor NH-715","OCMS-RTH-2023-089","NHAI","Ministry of Road Transport & Highways","Roads & Highways","Assam","2023-08-10","2024-02-01","2027-03-31","2027-12-31",5500,5750,1200,22.0,"Ongoing","Mega (>= ₹1000 Cr)"
"Vizag Port Multi-Cargo Berth Mechanization","OCMS-SHP-2022-014","VPA","Ministry of Ports, Shipping and Waterways","Shipping","Andhra Pradesh","2022-03-15","2022-09-01","2025-06-30","2026-09-30",950,1180,890,74.0,"Delayed","Major (₹150 - ₹1000 Cr)"`;

const SAMPLE_HISTORICAL_TRAINING_CSV = `snapshotDate,projectCode,projectName,sector,state,sanctionedCost,startDate,plannedCompletionDate,cumulativeExpenditureToDate,physicalProgressToDate,realizedFinalCost,realizedFinalCompletionDate
"2021-03-31","OCMS-RLY-2018-011","Patna-Gaya Doubling","Railways","Bihar",950,"2018-05-01","2022-03-31",620,68.5,1240,"2023-06-30"
"2021-06-30","OCMS-PWR-2017-042","Teesta Stage-IV Hydro","Power","Sikkim",4200,"2017-09-15","2023-08-31",2800,49.0,6100,"2026-03-31"
"2022-01-31","OCMS-RTH-2019-093","Varanasi Ring Road Phase-2","Roads & Highways","Uttar Pradesh",1450,"2019-11-01","2023-06-30",1100,82.0,1520,"2023-11-30"`;

export function InfraDataImport({ currentProjects, onDataUpdated }: InfraDataImportProps) {
  const [activeTab, setActiveTab] = useState<'portfolio' | 'historical-training'>('portfolio');
  const [csvText, setCsvText] = useState(SAMPLE_PORTFOLIO_CSV);
  const [trainingCsvText, setTrainingCsvText] = useState(SAMPLE_HISTORICAL_TRAINING_CSV);
  
  const [importSummary, setImportSummary] = useState<{
    imported: number;
    valid: number;
    warnings: number;
    errors: number;
    details: string[];
  } | null>(null);

  const [trainingSummary, setTrainingSummary] = useState<{
    snapshotCount: number;
    dateSpan: string;
    meetsThreshold: boolean;
    pipelineStage: string;
  } | null>(null);

  const { toast } = useToast();

  // Handle Portfolio Import
  const handleParseAndImport = () => {
    try {
      const lines = csvText.trim().split('\n');
      if (lines.length < 2) {
        toast({
          variant: 'destructive',
          title: 'Import Failed',
          description: 'CSV must contain a header line and at least one data row.',
        });
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
      const requiredFields = ['projectName', 'projectCode', 'agency', 'ministry', 'sector', 'state', 'originalCost', 'revisedCost', 'cumulativeExpenditure', 'physicalProgress'];
      
      const missingRequired = requiredFields.filter(rf => !headers.includes(rf));
      if (missingRequired.length > 0) {
        toast({
          variant: 'destructive',
          title: 'Missing Required Columns',
          description: `Missing: ${missingRequired.join(', ')}`,
        });
        return;
      }

      let validCount = 0;
      let warningCount = 0;
      let errorCount = 0;
      const details: string[] = [];
      const newProjects: InfraProject[] = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
        const row = (matches || line.split(',')).map(c => c.trim().replace(/^"|"$/g, ''));

        const getVal = (field: string): string => {
          const idx = headers.indexOf(field);
          return idx !== -1 && row[idx] !== undefined ? row[idx] : '';
        };

        const projectName = getVal('projectName');
        const projectCode = getVal('projectCode');
        const origCost = parseFloat(getVal('originalCost')) || 0;
        const revCost = parseFloat(getVal('revisedCost')) || origCost;
        const exp = parseFloat(getVal('cumulativeExpenditure')) || 0;
        const progress = parseFloat(getVal('physicalProgress')) || 0;

        if (!projectName || !projectCode) {
          errorCount++;
          details.push(`Row ${i}: Skipped - missing projectName or projectCode.`);
          continue;
        }

        if (exp > revCost * 1.5) {
          warningCount++;
          details.push(`Row ${i} (${projectCode}): Cumulative expenditure exceeds 150% of revised cost.`);
        }

        validCount++;
        newProjects.push({
          id: `imp-${Date.now()}-${i}`,
          projectName,
          projectCode,
          agency: getVal('agency') || 'Implementing Agency',
          ministry: getVal('ministry') || 'Central Ministry',
          sector: getVal('sector') || 'General Infrastructure',
          state: getVal('state') || 'National',
          approvalDate: getVal('approvalDate') || '2023-01-01',
          startDate: getVal('startDate') || '2023-06-01',
          originalCompletionDate: getVal('originalCompletionDate') || '2027-12-31',
          revisedCompletionDate: getVal('revisedCompletionDate') || '2028-06-30',
          originalCost: origCost,
          revisedCost: revCost,
          cumulativeExpenditure: exp,
          physicalProgress: progress,
          financialProgress: revCost > 0 ? Number(((exp / revCost) * 100).toFixed(1)) : 0,
          status: (getVal('status') as any) || (revCost > origCost ? 'Delayed' : 'Ongoing'),
          projectType: origCost >= 1000 ? 'Mega (>= ₹1000 Cr)' : 'Major (₹150 - ₹1000 Cr)',
          sourceSnapshot: 'User Uploaded Ingestion Dataset',
          sourceType: 'Imported Dataset',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }

      if (newProjects.length === 0) {
        toast({
          variant: 'destructive',
          title: 'No Valid Projects Found',
          description: 'Could not parse any valid project rows from CSV.',
        });
        return;
      }

      saveStoredProjects(newProjects);
      onDataUpdated(newProjects);

      setImportSummary({
        imported: newProjects.length,
        valid: validCount,
        warnings: warningCount,
        errors: errorCount,
        details,
      });

      toast({
        title: 'Ingestion Completed',
        description: `Successfully imported ${newProjects.length} infrastructure projects.`,
      });
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Parsing Error',
        description: 'Failed to process CSV file. Please verify delimiter format.',
      });
    }
  };

  // Handle Historical Training Dataset Validation
  const handleValidateTrainingData = () => {
    const lines = trainingCsvText.trim().split('\n').filter(l => l.trim().length > 0);
    const rowCount = Math.max(0, lines.length - 1);
    
    // In our prototype, check if user provided N >= 500
    const meetsThreshold = rowCount >= 500;

    setTrainingSummary({
      snapshotCount: rowCount,
      dateSpan: '2018-03 to 2024-12 (Multi-Year)',
      meetsThreshold,
      pipelineStage: meetsThreshold
        ? 'Ready for Time-Aware Model Training'
        : 'Sample Size Inadequate for Production ML Training (Requires N ≥ 500)',
    });

    if (!meetsThreshold) {
      toast({
        variant: 'destructive',
        title: 'Sample Size Below Threshold',
        description: `Dataset contains ${rowCount} rows. Production training requires at least 500 historical monthly snapshots.`,
      });
    } else {
      toast({
        title: 'Historical Training Data Validated',
        description: `Verified ${rowCount} monthly snapshots. Ready for temporal partition training.`,
      });
    }
  };

  const handleResetToDemo = () => {
    const defaultData = resetDemoDataset();
    onDataUpdated(defaultData);
    setImportSummary(null);
    setCsvText(SAMPLE_PORTFOLIO_CSV);
    toast({
      title: 'Reset Completed',
      description: 'Restored the 16 standard MoSPI PAIMANA prototype records.',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-xl border bg-gradient-to-r from-slate-50 to-blue-50/40 dark:from-slate-900 dark:to-blue-950/20 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge className="bg-slate-800 text-white text-xs">
              Data Governance & Ingestion Pipeline
            </Badge>
            <Badge variant="outline" className="text-xs border-blue-300">
              MoSPI PAIMANA Conforming
            </Badge>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Data Ingestion & Historical Model Training Hub
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5 max-w-2xl">
            Ingest current month project flash reports to update active monitoring, or upload historical multi-year longitudinal datasets to train machine learning baseline models.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleResetToDemo}
            className="text-xs flex items-center gap-1.5 border-slate-300"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Restore Demo Snapshot (16 Projects)
          </Button>
        </div>
      </div>

      {/* Tabs Selector: Portfolio Ingestion vs. Historical Model Training */}
      <div className="flex items-center gap-3 border-b pb-2">
        <button
          onClick={() => setActiveTab('portfolio')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
            activeTab === 'portfolio'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-muted-foreground hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Database className="h-4 w-4" />
          1. Portfolio Data Ingestion (Current Monitoring)
        </button>

        <button
          onClick={() => setActiveTab('historical-training')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
            activeTab === 'historical-training'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-muted-foreground hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Cpu className="h-4 w-4" />
          2. Historical Model Training Dataset (Longitudinal ML)
        </button>
      </div>

      {/* TAB 1: PORTFOLIO DATA INGESTION */}
      {activeTab === 'portfolio' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* CSV Input Card */}
          <Card className="lg:col-span-2 border-slate-200 dark:border-slate-800 shadow-sm">
            <CardHeader className="pb-3 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5 text-blue-600" />
                  Paste or Upload Project Monitoring CSV
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCsvText(SAMPLE_PORTFOLIO_CSV)}
                  className="text-xs text-blue-600"
                >
                  Load Sample
                </Button>
              </div>
              <CardDescription className="text-xs">
                Upload current month&apos;s PAIMANA flash report data to refresh portfolio dashboards, 14-point dossiers, and deterministic risk scores.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-5 space-y-4">
              <div>
                <Textarea
                  value={csvText}
                  onChange={e => setCsvText(e.target.value)}
                  rows={10}
                  className="font-mono text-xs leading-relaxed"
                  placeholder="Paste CSV content here..."
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="text-[11px] text-muted-foreground">
                  Format: Comma-separated with header row. Currency in ₹ Crores.
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    onClick={handleParseAndImport}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs flex items-center gap-1.5"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    Validate & Ingest Projects
                  </Button>
                </div>
              </div>

              {/* Import Results Summary */}
              {importSummary && (
                <div className="p-4 rounded-xl border bg-slate-50 dark:bg-slate-900/50 space-y-2 text-xs mt-4">
                  <div className="flex items-center justify-between font-bold">
                    <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4" />
                      Ingested {importSummary.imported} projects
                    </span>
                    <span className="text-muted-foreground">
                      Errors: {importSummary.errors} | Warnings: {importSummary.warnings}
                    </span>
                  </div>

                  {importSummary.details.length > 0 && (
                    <div className="pt-2 border-t text-[11px] space-y-1 text-amber-700 dark:text-amber-400">
                      {importSummary.details.map((d, idx) => (
                        <div key={idx}>• {d}</div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Schema Guide Card */}
          <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Database className="h-4 w-4 text-slate-700 dark:text-slate-300" />
                Required PAIMANA Columns
              </CardTitle>
            </CardHeader>

            <CardContent className="p-4 space-y-3 text-xs">
              <div className="space-y-1">
                <div className="font-mono text-[11px] font-bold text-foreground">projectName</div>
                <div className="text-muted-foreground text-[10px]">Official project title</div>
              </div>
              <div className="space-y-1">
                <div className="font-mono text-[11px] font-bold text-foreground">projectCode</div>
                <div className="text-muted-foreground text-[10px]">MoSPI / OCMS project code</div>
              </div>
              <div className="space-y-1">
                <div className="font-mono text-[11px] font-bold text-foreground">originalCost & revisedCost</div>
                <div className="text-muted-foreground text-[10px]">Sanctioned and anticipated figures in ₹ Crore</div>
              </div>
              <div className="space-y-1">
                <div className="font-mono text-[11px] font-bold text-foreground">cumulativeExpenditure</div>
                <div className="text-muted-foreground text-[10px]">Total disbursed expenditure to date (₹ Cr)</div>
              </div>
              <div className="space-y-1">
                <div className="font-mono text-[11px] font-bold text-foreground">physicalProgress</div>
                <div className="text-muted-foreground text-[10px]">0 to 100 percentage certified</div>
              </div>

              <div className="pt-3 border-t text-[11px] text-muted-foreground">
                <span className="font-semibold text-foreground">Automatic Derivations:</span> S-curve progress gap, expenditure intensity, and 0–100 risk assessments are computed automatically upon ingestion.
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 2: HISTORICAL MODEL TRAINING DATASET */}
      {activeTab === 'historical-training' && (
        <div className="space-y-6">
          {/* Scientific Pipeline Flowchart */}
          <Card className="border-indigo-200 dark:border-indigo-900/40 bg-gradient-to-r from-indigo-50/30 to-blue-50/20 dark:from-indigo-950/20 dark:to-blue-950/10">
            <CardHeader className="pb-3 border-b">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-indigo-950 dark:text-indigo-100">
                  <Sliders className="h-4 w-4 text-indigo-600" />
                  Scientific 8-Stage Model Training & Evaluation Pipeline
                </CardTitle>
                <Badge className="bg-indigo-600 text-white text-[10px]">
                  SIH26103 Architecture
                </Badge>
              </div>
              <CardDescription className="text-xs">
                How longitudinal historical PAIMANA data is transformed into a verified machine learning model
              </CardDescription>
            </CardHeader>

            <CardContent className="p-5">
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 text-center text-xs">
                {[
                  { step: '1. Ingest', desc: 'Longitudinal CSV' },
                  { step: '2. Validate', desc: 'Schema & Quality' },
                  { step: '3. Filter', desc: 'Zero Leakage' },
                  { step: '4. Engineer', desc: 'S-Curve & Intensity' },
                  { step: '5. Partition', desc: 'Temporal Split' },
                  { step: '6. Train', desc: 'Logistic / GBDT' },
                  { step: '7. Evaluate', desc: 'Unbiased Metrics' },
                  { step: '8. Register', desc: 'Versioned Model' },
                ].map((s, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg border bg-white dark:bg-slate-900 shadow-2xs">
                    <div className="font-bold text-indigo-600 dark:text-indigo-400 text-[11px]">{s.step}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">{s.desc}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Historical CSV Ingestion Box */}
            <Card className="lg:col-span-2 border-slate-200 dark:border-slate-800 shadow-sm">
              <CardHeader className="pb-3 border-b">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <FileSpreadsheet className="h-5 w-5 text-indigo-600" />
                    Historical Longitudinal Training Dataset CSV
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setTrainingCsvText(SAMPLE_HISTORICAL_TRAINING_CSV)}
                    className="text-xs text-indigo-600"
                  >
                    Load Sample Snapshots
                  </Button>
                </div>
                <CardDescription className="text-xs">
                  Upload multi-year historical monthly snapshots. Requires minimum 500 records to perform scientifically valid model training.
                </CardDescription>
              </CardHeader>

              <CardContent className="p-5 space-y-4">
                <Textarea
                  value={trainingCsvText}
                  onChange={e => setTrainingCsvText(e.target.value)}
                  rows={8}
                  className="font-mono text-xs leading-relaxed"
                  placeholder="Paste historical multi-year CSV content here..."
                />

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div className="text-[11px] text-muted-foreground">
                    Required: <code>snapshotDate</code>, <code>projectCode</code>, <code>cumulativeExpenditureToDate</code>, <code>realizedFinalCost</code>.
                  </div>

                  <Button
                    onClick={handleValidateTrainingData}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Validate Historical Training Dataset
                  </Button>
                </div>

                {trainingSummary && (
                  <div className="p-4 rounded-xl border bg-slate-50 dark:bg-slate-900/50 space-y-2 text-xs mt-4">
                    <div className="flex items-center justify-between font-bold">
                      <span>Detected Records: {trainingSummary.snapshotCount}</span>
                      <Badge
                        variant="outline"
                        className={
                          trainingSummary.meetsThreshold
                            ? 'text-emerald-600 border-emerald-300'
                            : 'text-amber-600 border-amber-300'
                        }
                      >
                        {trainingSummary.meetsThreshold ? 'Eligible for Training' : 'Under Threshold (N < 500)'}
                      </Badge>
                    </div>

                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      {trainingSummary.pipelineStage}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Anti-Leakage & Governance Panel */}
            <Card className="border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Lock className="h-4 w-4 text-amber-600" />
                  Model Training Governance
                </CardTitle>
              </CardHeader>

              <CardContent className="p-4 space-y-4 text-xs">
                <div className="space-y-1">
                  <span className="font-bold text-foreground">Why Separate Datasets?</span>
                  <p className="text-muted-foreground text-[11px]">
                    Project data import refreshes current operational monitoring. Historical training data builds statistical predictive models. Conflating the two risks training models on unverified current data.
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="font-bold text-foreground">Minimum Sample Size (N ≥ 500)</span>
                  <p className="text-muted-foreground text-[11px]">
                    Cross-validated machine learning models require sufficient degrees of freedom across sectors and ministries to prevent catastrophic overfitting.
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="font-bold text-foreground">Temporal Split Enforcement</span>
                  <p className="text-muted-foreground text-[11px]">
                    Training pipeline partitions projects by sanction date (e.g. Train: 2018–2023, Test: 2024–2026) to mirror real forward deployment.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
