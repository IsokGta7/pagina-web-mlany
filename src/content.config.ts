import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const articulos = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/articulos' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    category: z.enum(['Biología', 'Física', 'Química', 'Tecnología', 'Medio Ambiente']),
    coverImage: z.string(),
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
