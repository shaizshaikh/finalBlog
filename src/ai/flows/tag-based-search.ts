
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

const ArticleSearchSchema = z.object({
  id: z.string().describe("The unique identifier of the article."), // Added ID
  title: z.string(),
  content: z.string(),
  tags: z.array(z.string()),
});

const AiEnhancedTagBasedSearchInputSchema = z.object({
  query: z.string().describe('The search query.'),
  tags: z.array(z.string()).describe('The list of tags to search for.'),
  articles: z.array(ArticleSearchSchema).describe('The list of articles to search through, including their IDs.'),
});
export type AiEnhancedTagBasedSearchInput = z.infer<
  typeof AiEnhancedTagBasedSearchInputSchema
>;

const AiEnhancedTagBasedSearchOutputSchema = z.array(
  z.object({
    id: z.string().describe("The unique identifier of the relevant article."), // Added ID
    title: z.string(),
    content: z.string().optional().describe("A brief snippet or summary if relevant, otherwise can be omitted."),
    tags: z.array(z.string()),
  })
).describe('A list of articles (with their IDs) that are relevant to the search query.');
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
  prompt: `You are a search engine that enhances search results based on tags and query.

The user is searching for articles based on the following query: {{{query}}}

The following tags are being used to search: {{tags}}

Given the following articles (each with an 'id', 'title', 'content', and 'tags'):

{{#each articles}}
Article ID: {{{id}}}
Title: {{{title}}}
Content: {{{content}}}
Tags: {{tags}}
---
{{/each}}

Return a list of articles that are relevant to the search query and tags.
Your response should be an array of objects, where each object represents a relevant article and MUST include its original 'id', 'title', and 'tags'. You can optionally include a short relevant 'content' snippet.

Only include articles that are relevant to the search query and tags.
Focus on matching the query against title, content, and tags.
Prioritize articles that match more tags or have stronger relevance to the query in their content or title.
Return the original 'id' for each matched article.
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
    if (!output || !Array.isArray(output)) {
      console.error('aiEnhancedTagBasedSearchFlow: LLM output was missing or not an array.', output);
      // Return empty array as a graceful fallback if AI fails
      return [];
    }
    // Further validation could be added here to check if each item in the array matches the expected structure
    return output;
  }
);
