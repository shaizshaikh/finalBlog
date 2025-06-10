'use server';

/**
 * @fileOverview A flow that enhances tag-based search results using AI.
 *
 * - aiEnhancedTagBasedSearch - A function that takes a search query and a list of tags and returns a list of relevant articles.
 * - AiEnhancedTagBasedSearchInput - The input type for the aiEnhancedTagBasedSearch function.
 * - AiEnhancedTagBasedSearchOutput - The return type for the aiEnhancedTagBasedSearch function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AiEnhancedTagBasedSearchInputSchema = z.object({
  query: z.string().describe('The search query.'),
  tags: z.array(z.string()).describe('The list of tags to search for.'),
  articles: z.array(
    z.object({
      title: z.string(),
      content: z.string(),
      tags: z.array(z.string()),
    })
  ).describe('The list of articles to search through.'),
});
export type AiEnhancedTagBasedSearchInput = z.infer<
  typeof AiEnhancedTagBasedSearchInputSchema
>;

const AiEnhancedTagBasedSearchOutputSchema = z.array(
  z.object({
    title: z.string(),
    content: z.string(),
    tags: z.array(z.string()),
  })
).describe('A list of articles that are relevant to the search query.');
export type AiEnhancedTagBasedSearchOutput = z.infer<
  typeof AiEnhancedTagBasedSearchOutputSchema
>;

export async function aiEnhancedTagBasedSearch(
  input: AiEnhancedTagBasedSearchInput
): Promise<AiEnhancedTagBasedSearchOutput> {
  return aiEnhancedTagBasedSearchFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiEnhancedTagBasedSearchPrompt',
  input: {schema: AiEnhancedTagBasedSearchInputSchema},
  output: {schema: AiEnhancedTagBasedSearchOutputSchema},
  prompt: `You are a search engine that enhances search results based on tags.

The user is searching for articles based on the following query: {{{query}}}

The following tags are being used to search: {{tags}}

Given the following articles:

{{#each articles}}
Title: {{{title}}}
Content: {{{content}}}
Tags: {{tags}}
{{/each}}

Return a list of articles that are relevant to the search query.

Only include articles that are relevant to the search query and tags.
`,
});

const aiEnhancedTagBasedSearchFlow = ai.defineFlow(
  {
    name: 'aiEnhancedTagBasedSearchFlow',
    inputSchema: AiEnhancedTagBasedSearchInputSchema,
    outputSchema: AiEnhancedTagBasedSearchOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
