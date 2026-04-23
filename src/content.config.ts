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

export const collections = { articulos, equipo };
