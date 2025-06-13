
'use server';

/**
 * @fileOverview Generates a slug URL for an article title, omitting stop words and including keywords.
 *
 * - generateSlugURL - A function that generates a slug URL from an article title.
 * - GenerateSlugURLInput - The input type for the generateSlugURL function.
 * - GenerateSlugURLOutput - The return type for the generateSlugURL function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateSlugURLInputSchema = z.object({
  title: z.string().describe('The title of the article.'),
});
export type GenerateSlugURLInput = z.infer<typeof GenerateSlugURLInputSchema>;

const GenerateSlugURLOutputSchema = z.object({
  slug: z.string().describe('The generated slug URL for the article.'),
});
export type GenerateSlugURLOutput = z.infer<typeof GenerateSlugURLOutputSchema>;

export async function generateSlugURL(input: GenerateSlugURLInput): Promise<GenerateSlugURLOutput> {
  return generateSlugURLFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateSlugURLPrompt',
  input: {schema: GenerateSlugURLInputSchema},
  output: {schema: GenerateSlugURLOutputSchema},
  prompt: `You are an expert in SEO and creating URL slugs.

  Given the article title, generate a URL slug that is SEO friendly by omitting stop words and including keywords related to the title. The slug should be short, descriptive, and use hyphens to separate words.

  Title: {{{title}}}
  `,
});

const generateSlugURLFlow = ai.defineFlow(
  {
    name: 'generateSlugURLFlow',
    inputSchema: GenerateSlugURLInputSchema,
    outputSchema: GenerateSlugURLOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output || !output.slug) {
      console.error('generateSlugURLFlow: LLM output was missing or invalid (missing slug).', output);
      throw new Error('Failed to generate a valid slug from AI.');
    }
    return output;
  }
);
