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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
  HelpCircle,
  Building2,
  AlertTriangle,
  ArrowRight,
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
  'Which projects require immediate attention and why?',
  'Why is Udhampur-Srinagar-Baramulla Rail Link (USBRL) high risk?',
  'Which ministry has the highest cost escalation in the portfolio?',
  'Compare Roads & Highways vs. Railways performance.',
  'Which projects have high expenditure but low physical progress?',
  'Show me high-risk projects in Arunachal Pradesh.',
];

export function InfraAIAssistant({
  projects,
  onSelectProjectByCodeOrName,
  initialQuery,
}: InfraAIAssistantProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      content: `### Welcome to InfraZyn Project Intelligence Assistant
I am your AI Decision-Support layer for the **MoSPI PAIMANA** integrated project monitoring platform (*SIH26103*).

I have full, real-time access to the **July 2026 PAIMANA Snapshot** containing **${projects.length} central sector infrastructure projects**.

How can I assist your review today? You can choose one of the suggested inquiries below or type your own question regarding cost overruns, timeline slippages, or early warnings.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [inputQuery, setInputQuery] = useState(initialQuery || '');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // If initialQuery is provided on mount, trigger it
  useEffect(() => {
    if (initialQuery && initialQuery.trim()) {
      handleSend(initialQuery);
    }
  }, [initialQuery]);

  // Construct structured context snapshot for Gemini
  const generateContextPayload = () => {
    const projectSummaries = projects.map(p => {
      const d = calculateDerivedMetrics(p);
      const r = calculateProjectRisk(p);
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
      console.error('AI Assistant failed:', e);
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        content: `**Notice:** Unable to connect to Genkit / Gemini flow at this moment (${e.message || 'Check GEMINI_API_KEY'}).\n\nHowever, all deterministic metrics, risk scores, and early warnings remain fully operational across the dashboard.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-xl border border-blue-200 dark:border-blue-900/40 bg-gradient-to-r from-blue-950 via-indigo-900 to-slate-900 text-white shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge className="bg-amber-500 text-slate-950 font-bold">
              Genkit + Gemini 2.0 Flash
            </Badge>
            <Badge variant="outline" className="text-blue-200 border-blue-400">
              Grounded Decision Support
            </Badge>
          </div>
          <h2 className="text-2xl font-bold text-white">
            InfraZyn Project Intelligence Assistant
          </h2>
          <p className="text-xs text-blue-200 mt-0.5">
            Natural-language dialogue strictly grounded in live PAIMANA infrastructure monitoring data. Hallucination-free analytical synthesis.
          </p>
        </div>

        <div className="text-xs bg-blue-900/50 border border-blue-700/60 px-3 py-2 rounded-lg text-blue-200">
          Portfolio Context: <span className="font-bold text-white">{projects.length} Monitored Projects</span>
        </div>
      </div>

      {/* Suggested Quick Prompts */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
          <Sparkles className="h-3.5 w-3.5 text-amber-500" /> Suggested Queries:
        </span>
        {SUGGESTED_QUERIES.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(q)}
            disabled={loading}
            className="text-xs bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-950 dark:hover:text-blue-300 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded-full transition-colors text-left"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Chat History Box */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
        <CardContent className="p-4 space-y-4 max-h-[520px] overflow-y-auto">
          {messages.map(msg => (
            <div
              key={msg.id}
              className={`flex items-start gap-3 text-xs leading-relaxed ${
                msg.sender === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {msg.sender === 'assistant' && (
                <div className="h-7 w-7 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 mt-1 shadow-xs">
                  <Bot className="h-4 w-4" />
                </div>
              )}

              <div
                className={`p-3.5 rounded-xl max-w-[85%] space-y-2 ${
                  msg.sender === 'user'
                    ? 'bg-blue-600 text-white rounded-tr-none shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 rounded-tl-none text-slate-900 dark:text-slate-100'
                }`}
              >
                <div className="whitespace-pre-wrap font-sans text-xs">
                  {msg.content}
                </div>

                {msg.highlightedProjects && msg.highlightedProjects.length > 0 && (
                  <div className="pt-2 mt-2 border-t border-slate-200 dark:border-slate-700 flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">
                      Cited Projects:
                    </span>
                    {msg.highlightedProjects.map((pName, i) => (
                      <Badge
                        key={i}
                        variant="outline"
                        className="text-[10px] cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/50"
                        onClick={() => onSelectProjectByCodeOrName && onSelectProjectByCodeOrName(pName)}
                      >
                        {pName}
                        <ArrowRight className="h-2.5 w-2.5 ml-1" />
                      </Badge>
                    ))}
                  </div>
                )}

                <div className={`text-[10px] text-right mt-1 ${msg.sender === 'user' ? 'text-blue-200' : 'text-muted-foreground'}`}>
                  {msg.timestamp}
                </div>
              </div>

              {msg.sender === 'user' && (
                <div className="h-7 w-7 rounded-full bg-slate-700 text-white flex items-center justify-center shrink-0 mt-1 shadow-xs">
                  <User className="h-4 w-4" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg max-w-sm">
              <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
              <span>Analyzing PAIMANA monitoring data with Gemini 2.0 Flash...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </CardContent>
      </Card>

      {/* Input Box */}
      <div className="flex items-center gap-2">
        <Input
          placeholder="Ask about project risks, cost escalations, ministry benchmarks, or delayed works..."
          value={inputQuery}
          onChange={e => setInputQuery(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') handleSend();
          }}
          disabled={loading}
          className="h-10 text-xs"
        />
        <Button
          onClick={() => handleSend()}
          disabled={loading || !inputQuery.trim()}
          className="bg-blue-600 hover:bg-blue-700 text-white h-10 px-4 shrink-0"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
