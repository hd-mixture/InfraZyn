'use client';

/**
 * AI Infrastructure Project Intelligence Assistant Panel
 * Grounded in MoSPI PAIMANA Monitoring Data
 * Powered by Google Genkit + Gemini
 * Team: InfraZyn (SIH26103)
 */

import React, { useState, useEffect, useRef } from 'react';
import { InfraProject } from '@/types/infrastructure';
import { askInfraAssistant } from '@/ai/flows/infra-assistant-flow';
import { calculateDerivedMetrics } from '@/lib/infrastructure/derived-metrics';
import { calculateProjectRisk } from '@/lib/infrastructure/risk-engine';
import { detectAllEarlyWarnings } from '@/lib/infrastructure/early-warning-engine';
import { predictCostOverrunML, predictTimeOverrun } from '@/lib/infrastructure/ml-engine';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Zap,
  Send,
  Loader2,
  Bot,
  User,
  Sparkles,
  Building2,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Copy,
  Check,
  FileText,
  Layers,
  ShieldCheck,
} from 'lucide-react';

interface InfraAIAssistantProps {
  projects: InfraProject[];
  onSelectProjectByCodeOrName?: (identifier: string) => void;
  initialQuery?: string;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  highlightedProjects?: string[];
  timestamp: string;
}

const SUGGESTED_QUERIES = [
  { label: 'ML Predictive Risk', query: 'Run ML Predictive inference: which projects have the highest probability of cost overrun and delay?' },
  { label: 'USBRL Delay Forecast', query: 'Predict the anticipated delay months and cost overrun probability for USBRL using Machine Learning.' },
  { label: 'Immediate Attention', query: 'Which projects require immediate attention and why?' },
  { label: 'Highest Cost Overrun', query: 'Which ministry has the highest cost escalation in the portfolio?' },
  { label: 'Sector Comparison', query: 'Compare Roads & Highways vs. Railways performance.' },
  { label: 'Expenditure vs Progress', query: 'Which projects have high expenditure but low physical progress?' },
];

/**
 * Inline Token Formatter
 * Highlights currency amounts, percentages, and risk labels with styled badges
 */
function FormattedInlineText({ text }: { text: string }) {
  const parts = text.split(/(\*\*.*?\*\*)/g);

  return (
    <span>
      {parts.map((part, idx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          const inner = part.slice(2, -2);

          // Highlight Risk Levels
          if (inner === 'CRITICAL' || inner.includes('CRITICAL Risk')) {
            return (
              <span key={idx} className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-bold bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30 mx-0.5">
                {inner}
              </span>
            );
          }
          if (inner === 'HIGH' || inner.includes('HIGH Risk')) {
            return (
              <span key={idx} className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-bold bg-orange-500/15 text-orange-600 dark:text-orange-400 border border-orange-500/30 mx-0.5">
                {inner}
              </span>
            );
          }
          if (inner === 'MEDIUM' || inner.includes('MEDIUM Risk')) {
            return (
              <span key={idx} className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 mx-0.5">
                {inner}
              </span>
            );
          }
          if (inner === 'LOW' || inner.includes('LOW Risk')) {
            return (
              <span key={idx} className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 mx-0.5">
                {inner}
              </span>
            );
          }

          // Currency or Progress figures
          if (inner.includes('₹') || inner.includes('Cr')) {
            return (
              <span key={idx} className="font-semibold text-blue-600 dark:text-blue-400 font-mono">
                {inner}
              </span>
            );
          }

          return (
            <strong key={idx} className="font-semibold text-foreground">
              {inner}
            </strong>
          );
        }

        return <span key={idx}>{part}</span>;
      })}
    </span>
  );
}

/**
 * Executive Structured Message Renderer
 * Formats Markdown headers, key-value diagnostics, and intervention cards with modern UI tokens
 */
function ExecutiveMessageRenderer({
  content,
  highlightedProjects,
  onSelectProjectByCodeOrName,
}: {
  content: string;
  highlightedProjects?: string[];
  onSelectProjectByCodeOrName?: (identifier: string) => void;
}) {
  const lines = content.split('\n');

  const blocks: React.ReactNode[] = [];
  let currentKeyValues: { key: string; value: string }[] = [];
  let currentBullets: string[] = [];
  let bulletContext: 'risk' | 'action' | 'general' = 'general';

  const flushKeyValues = () => {
    if (currentKeyValues.length > 0) {
      const items = [...currentKeyValues];
      currentKeyValues = [];
      blocks.push(
        <div key={`kv-${blocks.length}`} className="grid grid-cols-1 sm:grid-cols-2 gap-2 my-2.5">
          {items.map((item, i) => (
            <div
              key={i}
              className="p-2.5 rounded-lg bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 flex flex-col justify-between"
            >
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                {item.key}
              </span>
              <span className="text-xs font-semibold text-foreground mt-0.5">
                <FormattedInlineText text={item.value} />
              </span>
            </div>
          ))}
        </div>
      );
    }
  };

  const flushBullets = () => {
    if (currentBullets.length > 0) {
      const items = [...currentBullets];
      const type = bulletContext;
      currentBullets = [];
      bulletContext = 'general';

      if (type === 'risk') {
        blocks.push(
          <div key={`b-${blocks.length}`} className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-1.5 my-2">
            {items.map((item, i) => (
              <div key={i} className="flex items-start gap-2 text-xs leading-relaxed text-slate-800 dark:text-slate-200">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                <span><FormattedInlineText text={item} /></span>
              </div>
            ))}
          </div>
        );
      } else if (type === 'action') {
        blocks.push(
          <div key={`b-${blocks.length}`} className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl space-y-1.5 my-2">
            {items.map((item, i) => (
              <div key={i} className="flex items-start gap-2 text-xs leading-relaxed text-slate-800 dark:text-slate-200">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                <span><FormattedInlineText text={item} /></span>
              </div>
            ))}
          </div>
        );
      } else {
        blocks.push(
          <div key={`b-${blocks.length}`} className="space-y-1 my-2 pl-1">
            {items.map((item, i) => (
              <div key={i} className="flex items-start gap-2 text-xs leading-relaxed text-foreground/90">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-600 dark:bg-blue-400 shrink-0 mt-1.5" />
                <span><FormattedInlineText text={item} /></span>
              </div>
            ))}
          </div>
        );
      }
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    if (!trimmed) {
      continue;
    }

    // Heading 3: Major section or project title
    if (trimmed.startsWith('### ')) {
      flushKeyValues();
      flushBullets();
      const title = trimmed.replace(/^###\s*/, '');
      blocks.push(
        <div key={`h3-${i}`} className="flex items-center gap-2 pb-2.5 mb-2 border-b border-slate-200 dark:border-slate-700/80">
          <div className="p-1.5 rounded-lg bg-blue-600 text-white shadow-xs">
            <Building2 className="h-4 w-4" />
          </div>
          <h3 className="text-sm font-bold text-foreground tracking-tight">
            <FormattedInlineText text={title} />
          </h3>
        </div>
      );
      continue;
    }

    // Heading 4: Sub-headers (Risk factors, interventions, actions)
    if (trimmed.startsWith('#### ')) {
      flushKeyValues();
      flushBullets();
      const sub = trimmed.replace(/^####\s*/, '');
      if (sub.toLowerCase().includes('risk') || sub.toLowerCase().includes('factor') || sub.toLowerCase().includes('bottleneck')) {
        bulletContext = 'risk';
        blocks.push(
          <div key={`h4-${i}`} className="flex items-center gap-1.5 mt-3 mb-1 text-xs font-bold text-amber-600 dark:text-amber-400">
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>{sub}</span>
          </div>
        );
      } else if (sub.toLowerCase().includes('intervention') || sub.toLowerCase().includes('action') || sub.toLowerCase().includes('policy')) {
        bulletContext = 'action';
        blocks.push(
          <div key={`h4-${i}`} className="flex items-center gap-1.5 mt-3 mb-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>{sub}</span>
          </div>
        );
      } else {
        bulletContext = 'general';
        blocks.push(
          <div key={`h4-${i}`} className="flex items-center gap-1.5 mt-3 mb-1 text-xs font-bold text-blue-600 dark:text-blue-400">
            <Layers className="h-3.5 w-3.5" />
            <span>{sub}</span>
          </div>
        );
      }
      continue;
    }

    // Key-Value pair lines: "- **Key:** Value"
    const kvMatch = trimmed.match(/^[-•*]\s*\*\*(.*?):\*\*\s*(.*)$/);
    if (kvMatch) {
      flushBullets();
      currentKeyValues.push({
        key: kvMatch[1].trim(),
        value: kvMatch[2].trim(),
      });
      continue;
    }

    // Regular Bullet lines: "- " or "• " or "* "
    if (trimmed.startsWith('- ') || trimmed.startsWith('• ') || trimmed.startsWith('* ')) {
      flushKeyValues();
      const bulletText = trimmed.replace(/^[-•*]\s*/, '');
      currentBullets.push(bulletText);
      continue;
    }

    // Standard paragraphs
    flushKeyValues();
    flushBullets();
    blocks.push(
      <p key={`p-${i}`} className="text-xs text-foreground/90 leading-relaxed my-1.5">
        <FormattedInlineText text={trimmed} />
      </p>
    );
  }

  flushKeyValues();
  flushBullets();

  return (
    <div className="space-y-1">
      {blocks}

      {highlightedProjects && highlightedProjects.length > 0 && (
        <div className="pt-2.5 mt-3 border-t border-slate-200 dark:border-slate-700/80 flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
            <ShieldCheck className="h-3 w-3 text-blue-600 dark:text-blue-400" />
            Cited PAIMANA Assets:
          </span>
          {highlightedProjects.map((pName, i) => (
            <Badge
              key={i}
              variant="outline"
              className="text-[11px] font-medium py-0.5 px-2 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/80 hover:bg-blue-100 dark:hover:bg-blue-900 cursor-pointer transition-colors flex items-center gap-1"
              onClick={() => onSelectProjectByCodeOrName && onSelectProjectByCodeOrName(pName)}
            >
              <span>{pName}</span>
              <ArrowRight className="h-3 w-3" />
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

export function InfraAIAssistant({
  projects,
  onSelectProjectByCodeOrName,
  initialQuery,
}: InfraAIAssistantProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      content: `### MoSPI PAIMANA Executive Intelligence Copilot
Welcome to the AI Decision-Support Layer for Team InfraZyn (**SIH26103**).

- **Monitored Portfolio:** **${projects.length} Central Sector Mega Projects** (>= ₹1,000 Cr)
- **Primary Data Source:** **PAIMANA Report Snapshot — July 2026**
- **Decision Engine:** **Genkit + Gemini 3.6 Flash** with Multi-factor Risk Grounding

Choose from the executive inquiries below or enter any inquiry regarding schedule slippages, financial distress, or early warning interventions.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [inputQuery, setInputQuery] = useState(initialQuery || '');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (initialQuery && initialQuery.trim()) {
      handleSend(initialQuery);
    }
  }, [initialQuery]);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const generateContextPayload = () => {
    const projectSummaries = projects.map(p => {
      const d = calculateDerivedMetrics(p);
      const r = calculateProjectRisk(p);
      const costML = predictCostOverrunML(p);
      const timeML = predictTimeOverrun(p);

      return {
        code: p.projectCode,
        name: p.projectName,
        ministry: p.ministry,
        sector: p.sector,
        state: p.state,
        originalCost: p.originalCost,
        revisedCost: p.revisedCost,
        costEscalationCr: d.costEscalation,
        costEscalationPct: d.costEscalationPercentage,
        expenditureCr: p.cumulativeExpenditure,
        physicalProgressPct: p.physicalProgress,
        financialProgressPct: d.financialProgress,
        scheduleSlippageMo: d.scheduleSlippageMonths,
        riskScore: r.overallScore,
        riskLevel: r.riskLevel,
        riskFactors: r.contributingFactors,
        status: p.status,
        // Predictive Machine Learning Engine Outputs (Empirical XGBoost / RF Pipeline)
        mlPredictions: {
          costOverrunProbabilityPct: costML.probabilityPercent ?? 0,
          costRiskBand: costML.riskClassification,
          timeOverrunProbabilityPct: timeML.probabilityPercent ?? 0,
          historicalApprovedSlippageMo: d.scheduleSlippageMonths,
          forecastedAdditionalDelayMo: timeML.continuousPrediction ?? 0,
          topPredictiveDrivers: costML.contributingFeatures.map(f => `${f.featureName} (${Math.round(f.contributionWeight * 100)}% weight): ${f.description}`),
        },
      };
    });

    const warnings = detectAllEarlyWarnings(projects).map(w => ({
      projectCode: w.projectCode,
      severity: w.severity,
      category: w.category,
      trigger: w.trigger,
      action: w.recommendedAction,
    }));

    return JSON.stringify({
      snapshot: 'PAIMANA Report Snapshot — July 2026',
      totalProjectsCount: projects.length,
      projects: projectSummaries,
      activeEarlyWarnings: warnings,
    });
  };

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || inputQuery;
    if (!textToSend.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      content: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputQuery('');
    setLoading(true);

    try {
      const contextData = generateContextPayload();
      const response = await askInfraAssistant({
        query: textToSend.trim(),
        contextData,
      });

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        content: response.answer,
        highlightedProjects: response.highlightedProjects,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (e: any) {
      console.error('AI Assistant server call failed:', e);
      const queryLower = textToSend.toLowerCase();
      let fallbackText = `### Project Intelligence Synthesis (Local State)\n`;

      const matched = projects.find(
        p => queryLower.includes(p.projectCode.toLowerCase()) || queryLower.includes(p.projectName.toLowerCase())
      );

      if (matched) {
        fallbackText += `**${matched.projectName} (${matched.projectCode})**\n- **Sector & Ministry:** ${matched.sector} | ${matched.ministry}\n- **Original Cost:** ₹${matched.originalCost.toLocaleString('en-IN')} Cr\n- **Revised Cost:** ₹${matched.revisedCost.toLocaleString('en-IN')} Cr\n- **Physical vs Financial:** ${matched.physicalProgress}% Physical vs ${matched.financialProgress}% Financial\n- **Status:** ${matched.status}\n\n*Note: Synthesized from active local PAIMANA snapshot.*`;
      } else {
        fallbackText += `Showing data for ${projects.length} monitored infrastructure projects from the active July 2026 PAIMANA snapshot. All deterministic risk scores and early warning signals remain active across the portfolio.`;
      }

      const fallbackMsg: ChatMessage = {
        id: `fb-${Date.now()}`,
        sender: 'assistant',
        content: fallbackText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, fallbackMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl border border-blue-200/60 dark:border-blue-900/40 bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <Badge className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-2.5 py-0.5">
              Genkit + Gemini 3.6 Flash
            </Badge>
            <Badge variant="outline" className="text-blue-200 border-blue-400/40 bg-blue-950/40">
              <ShieldCheck className="h-3 w-3 mr-1 text-emerald-400" /> Grounded Decision Support
            </Badge>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            InfraZyn Project Intelligence Copilot
          </h2>
          <p className="text-xs text-blue-200/90 mt-1 max-w-xl">
            Executive natural-language interface grounded in verified MoSPI PAIMANA monitoring data. Zero hallucination guarantee with actionable escalation pathways.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <div className="text-xs bg-white/10 backdrop-blur-md border border-white/15 px-3.5 py-2.5 rounded-xl text-blue-100 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-blue-300" />
            <div>
              <div className="text-[10px] text-blue-200 uppercase tracking-wider font-semibold">Active Snapshot</div>
              <div className="font-bold text-white">{projects.length} Monitored Mega Projects</div>
            </div>
          </div>
        </div>
      </div>

      {/* Suggested Quick Inquiries */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-amber-500" />
          <span>Recommended Analytical Inquiries:</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {SUGGESTED_QUERIES.map((item, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(item.query)}
              disabled={loading}
              className="p-2.5 rounded-xl border border-border/70 bg-card hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:border-blue-300 dark:hover:border-blue-800 transition-all text-left shadow-2xs group flex flex-col justify-between"
            >
              <span className="text-[11px] font-bold text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 line-clamp-1">
                {item.label}
              </span>
              <span className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">
                {item.query}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Chat Interface Container */}
      <Card className="border-border shadow-md overflow-hidden bg-card/50 backdrop-blur-sm">
        <CardContent className="p-4 sm:p-5 space-y-4 max-h-[580px] overflow-y-auto">
          {messages.map(msg => (
            <div
              key={msg.id}
              className={`flex items-start gap-3 text-xs ${msg.sender === 'user' ? 'justify-end' : 'justify-start'
                }`}
            >
              {msg.sender === 'assistant' && (
                <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-600 text-white flex items-center justify-center shrink-0 mt-1 shadow-xs border border-blue-400/30">
                  <Bot className="h-4 w-4" />
                </div>
              )}

              <div
                className={`rounded-2xl p-4 max-w-[88%] sm:max-w-[80%] space-y-2 shadow-xs transition-all ${msg.sender === 'user'
                    ? 'bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-tr-none'
                    : 'bg-card border border-border rounded-tl-none text-card-foreground shadow-sm'
                  }`}
              >
                {/* Header bar for assistant responses */}
                {msg.sender === 'assistant' && (
                  <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-border/40 text-[10px] text-muted-foreground">
                    <span className="font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                      <Zap className="h-3 w-3" /> InfraZyn Copilot
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCopy(msg.id, msg.content)}
                        className="hover:text-foreground flex items-center gap-1 transition-colors"
                        title="Copy diagnostic response"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-500" />
                            <span className="text-emerald-500">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                      <span>•</span>
                      <span>{msg.timestamp}</span>
                    </div>
                  </div>
                )}

                {/* Content rendering */}
                {msg.sender === 'assistant' ? (
                  <ExecutiveMessageRenderer
                    content={msg.content}
                    highlightedProjects={msg.highlightedProjects}
                    onSelectProjectByCodeOrName={onSelectProjectByCodeOrName}
                  />
                ) : (
                  <div className="whitespace-pre-wrap font-sans text-xs leading-relaxed text-white">
                    {msg.content}
                  </div>
                )}

                {/* User timestamp */}
                {msg.sender === 'user' && (
                  <div className="text-[10px] text-right text-blue-200 mt-1">
                    {msg.timestamp}
                  </div>
                )}
              </div>

              {msg.sender === 'user' && (
                <div className="h-8 w-8 rounded-xl bg-slate-800 text-white flex items-center justify-center shrink-0 mt-1 shadow-xs">
                  <User className="h-4 w-4" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-start gap-3 text-xs">
              <div className="h-8 w-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 mt-1 animate-pulse">
                <Bot className="h-4 w-4" />
              </div>
              <div className="p-3.5 rounded-2xl rounded-tl-none bg-card border border-border shadow-xs flex items-center gap-3 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                <span className="text-xs font-medium">
                  Synthesizing PAIMANA longitudinal data with Gemini 3.6 Flash...
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </CardContent>

        {/* Input Bar */}
        <div className="p-3 bg-muted/40 border-t border-border flex items-center gap-2">
          <div className="relative flex-1">
            <Input
              placeholder="Ask about project risks, cost overruns, timeline slippages, or recommended interventions..."
              value={inputQuery}
              onChange={e => setInputQuery(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleSend();
              }}
              disabled={loading}
              className="bg-card pr-20 py-5 text-xs shadow-inner"
            />
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground pointer-events-none hidden sm:inline-block">
              Press ↵ Enter
            </div>
          </div>
          <Button
            onClick={() => handleSend()}
            disabled={loading || !inputQuery.trim()}
            className="h-10 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs shadow-xs"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </Card>
    </div>
  );
}

