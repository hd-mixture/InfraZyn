// Predicts potential delays based on task descriptions and deadlines.
// - predictTaskDelay - Predicts potential delays for a task.
// - PredictTaskDelayInput - Input for predictTaskDelay.
// - PredictTaskDelayOutput - Output for predictTaskDelay.

'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PredictTaskDelayInputSchema = z.object({
  taskDescription: z.string().describe('Detailed description of the task.'),
  deadline: z.string().describe('The deadline for the task (ISO format).'),
});

export type PredictTaskDelayInput = z.infer<typeof PredictTaskDelayInputSchema>;

const PredictTaskDelayOutputSchema = z.object({
  likelyToDelay: z.boolean().describe('Whether the task is likely to be delayed.'),
  reason: z.string().describe('The reason for the potential delay.'),
});

export type PredictTaskDelayOutput = z.infer<typeof PredictTaskDelayOutputSchema>;

export async function predictTaskDelay(input: PredictTaskDelayInput): Promise<PredictTaskDelayOutput> {
  return predictTaskDelayFlow(input);
}

const predictTaskDelayPrompt = ai.definePrompt({
  name: 'predictTaskDelayPrompt',
  input: {schema: PredictTaskDelayInputSchema},
  output: {schema: PredictTaskDelayOutputSchema},
  prompt: `You are an expert project manager. Determine if the following task is likely to be delayed based on its description and deadline.

Task Description: {{{taskDescription}}}
Deadline: {{{deadline}}}

Consider factors like complexity, dependencies, and potential risks.

Respond with whether the task is likely to be delayed, and the reasoning behind your prediction.`,
});

const predictTaskDelayFlow = ai.defineFlow(
  {
    name: 'predictTaskDelayFlow',
    inputSchema: PredictTaskDelayInputSchema,
    outputSchema: PredictTaskDelayOutputSchema,
  },
  async input => {
    const {output} = await predictTaskDelayPrompt(input);
    return output!;
  }
);
