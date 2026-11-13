// Коллекции Astro. Пока одна — юридические документы (src/content/docs/*.md):
// политика ПДн, политика cookie, согласие на обработку ПДн, согласие соискателя.
// Текст редактируется в админке /admin/ → «Документы»; страницы — src/pages/<slug>.astro (общий вид — components/LegalDoc.astro).
// Остальное содержимое src/content/ (вакансии, объекты, события, контакты) читается напрямую из JSON в src/data/.
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const docs = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/docs' }),
  schema: z.object({
    title: z.string(),
    subtitle: z.string().optional(),
    edition: z.string().optional(),
  }),
});

export const collections = { docs };
