/**
 * AI Infrastructure Project Intelligence Assistant Flow
 * Grounded Q&A over MoSPI PAIMANA infrastructure monitoring data.
 * Powered by Google Genkit & Gemini.
 * Team: InfraZyn (SIH26103)
 */

'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const InfraAssistantInputSchema = z.object({
  query: z.string().describe('The user question or analytical prompt regarding infrastructure projects.'),
  contextData: z.string().describe('JSON or structured text context of currently filtered projects, risk scores, early warnings, and benchmarking metrics.'),
});

export type InfraAssistantInput = z.infer<typeof InfraAssistantInputSchema>;

const InfraAssistantOutputSchema = z.object({
  answer: z.string().describe('The concise, highly grounded response to the query.'),
  highlightedProjects: z.array(z.string()).describe('List of project codes or names specifically mentioned or recommended for intervention.'),
  dataGrounded: z.boolean().describe('Whether the answer was fully grounded in available application data.'),
  snapshotReferenced: z.string().describe('The snapshot date or data source referenced in the explanation.'),
});

export type InfraAssistantOutput = z.infer<typeof InfraAssistantOutputSchema>;

export async function askInfraAssistant(input: InfraAssistantInput): Promise<InfraAssistantOutput> {
  return infraAssistantFlow(input);
}

const infraAssistantPrompt = ai.definePrompt({
  name: 'infraAssistantPrompt',
  input: { schema: InfraAssistantInputSchema },
  output: { schema: InfraAssistantOutputSchema },
  prompt: `You are the Lead Infrastructure Project Intelligence Assistant for Team InfraZyn (Smart India Hackathon SIH26103) on the MoSPI PAIMANA web-based integrated project-monitoring platform.
Your tagline is: "Predict. Monitor. Prevent."

You have been provided with the following real-time application context (derived from the PAIMANA Report Snapshot — July 2026):

=== APPLICATION MONITORING DATA CONTEXT ===
{{{contextData}}}
==========================================

USER QUERY:
{{{query}}}

INSTRUCTIONS:
1. Ground your response STRICTLY on the project data, calculated risk scores, early warnings, and cost escalations provided in the context.
2. DO NOT invent or fabricate statistics, projects, or dates.
3. If specific requested information is not in the context, clearly state that it is not present in the current dataset snapshot.
4. When citing cost figures, use ₹ Crores (Cr) and mention the official PAIMANA project code when available.
5. In explaining why a project is high risk, reference calculated factors: schedule slippage months, expenditure-to-physical progress gap, and cost escalation percentage.
6. Emphasize actionable interventions (e.g. inter-ministerial review, PMG escalation, statutory clearance acceleration).
7. Format the answer with clean markdown bullet points and concise bold headings.
`,
});

const infraAssistantFlow = ai.defineFlow(
  {
    name: 'infraAssistantFlow',
    inputSchema: InfraAssistantInputSchema,
    outputSchema: InfraAssistantOutputSchema,
  },
  async input => {
    const { output } = await infraAssistantPrompt(input);
    return output!;
  }
);
