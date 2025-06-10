import { config } from 'dotenv';
config();

import '@/ai/flows/generate-tags.ts';
import '@/ai/flows/tag-based-search.ts';
import '@/ai/flows/find-code-snippet.ts';
import '@/ai/flows/generate-slug-url.ts';