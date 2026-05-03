import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import categoriesData from './data/categories.json';

const validCategories = categoriesData.items.map((c) => c.name);

const articulos = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/articulos' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    category: z.string().refine((c) => validCategories.includes(c), {
      message: `La categoría debe ser una de: ${validCategories.join(', ')}. Edita src/data/categories.json para agregar más.`,
    }),
    coverImage: z.string(),
    coverImageAlt: z.string().optional(),
    author: z.string(),
    // Power features (all optional for backward compatibility)
    draft: z.boolean().optional().default(false),
    featured: z.boolean().optional().default(false),
    tags: z.array(z.string()).optional().default([]),
    seoTitle: z.string().optional(),
    seoDescription: z.string().optional(),
    seoOgImage: z.string().optional(),
    authorRef: z.string().optional(),
    relatedArticles: z.array(z.string()).optional().default([]),
  }),
});

const equipo = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/equipo' }),
  schema: z.object({
    name: z.string(),
    role: z.string(),
    bio: z.string(),
    photo: z.string(),
    order: z.number().optional(),
    socialLinks: z.object({
      instagram: z.string().optional(),
      twitter: z.string().optional(),
      linkedin: z.string().optional(),
    }).optional(),
  }),
});

const legal = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/legal' }),
  schema: z.object({
    title: z.string(),
    lastUpdated: z.coerce.date(),
  }),
});

const comments = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/comments' }),
  schema: z.object({
    post_slug: z.string(),
    author_name: z.string(),
    content: z.string(),
    approved: z.boolean(),
    created_at: z.coerce.date(),
  }),
});

export const collections = { articulos, equipo, legal, comments };
