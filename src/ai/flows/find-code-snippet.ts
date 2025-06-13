
'use server';

/**
 * @fileOverview A flow to detect code snippets in an article and provide a button to copy the code snippet.
 *
 * - detectAndCopyCodeSnippet - A function that handles the detection of code snippets and provides a copy button.
 * - DetectAndCopyCodeSnippetInput - The input type for the detectAndCopyCodeSnippet function.
 * - DetectAndCopyCodeSnippetOutput - The return type for the detectAndCopyCodeSnippet function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DetectAndCopyCodeSnippetInputSchema = z.object({
  articleText: z.string().describe('The text content of the article.'),
});

export type DetectAndCopyCodeSnippetInput = z.infer<
  typeof DetectAndCopyCodeSnippetInputSchema
>;

const DetectAndCopyCodeSnippetOutputSchema = z.object({
  hasCodeSnippet: z
    .boolean()
    .describe('Whether the article contains a code snippet.'),
  codeSnippet: z
    .string()
    .optional()
    .describe('The code snippet found in the article.'),
});

export type DetectAndCopyCodeSnippetOutput = z.infer<
  typeof DetectAndCopyCodeSnippetOutputSchema
>;

export async function detectAndCopyCodeSnippet(
  input: DetectAndCopyCodeSnippetInput
): Promise<DetectAndCopyCodeSnippetOutput> {
  return detectAndCopyCodeSnippetFlow(input);
}

const detectAndCopyCodeSnippetPrompt = ai.definePrompt({
  name: 'detectAndCopyCodeSnippetPrompt',
  input: {schema: DetectAndCopyCodeSnippetInputSchema},
  output: {schema: DetectAndCopyCodeSnippetOutputSchema},
  prompt: `You are an AI assistant designed to analyze articles and determine if they contain code snippets.

  Analyze the following article text and determine if it contains a code snippet. If it does, extract the code snippet.

  Article Text: {{{articleText}}}

  Respond in JSON format with the following structure:
  {
    "hasCodeSnippet": true/false,
    "codeSnippet": "the code snippet"
  }

  If no code snippet is found, set "hasCodeSnippet" to false and omit the "codeSnippet" field.
`,
});

const detectAndCopyCodeSnippetFlow = ai.defineFlow(
  {
    name: 'detectAndCopyCodeSnippetFlow',
    inputSchema: DetectAndCopyCodeSnippetInputSchema,
    outputSchema: DetectAndCopyCodeSnippetOutputSchema,
  },
  async input => {
    const {output} = await detectAndCopyCodeSnippetPrompt(input);
    if (!output) {
      console.error('detectAndCopyCodeSnippetFlow: LLM output was missing.');
      throw new Error('Failed to get a valid response from AI for code snippet detection.');
    }
    // hasCodeSnippet is boolean, codeSnippet is optional string. This check is sufficient.
    return output;
  }
);
