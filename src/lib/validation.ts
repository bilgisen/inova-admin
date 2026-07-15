import { z } from 'zod';

const jsonField = z.record(z.string(), z.string()).optional().default({});
const jsonFieldRequired = z.record(z.string(), z.string());

export const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

export const projectSchema = z.object({
  title: jsonFieldRequired,
  slug: z.string().min(1),
  description: jsonField,
  content: jsonField,
  client: jsonField,
  fair_name: jsonField,
  fair_date: z.string().optional(),
  location: jsonField,
  category_id: z.number().int().positive().nullable().optional(),
  status: z.enum(['draft', 'published']).optional().default('draft'),
  sort_order: z.number().int().optional().default(0),
  is_featured: z.number().int().min(0).max(1).optional().default(0),
  meta_title: jsonField,
  meta_description: jsonField,
  og_image: z.string().optional(),
});

export const projectUpdateSchema = projectSchema.partial();

export const categorySchema = z.object({
  name: jsonFieldRequired,
  slug: z.string().min(1),
  type: z.enum(['project', 'post', 'page']),
  description: jsonField,
  sort_order: z.number().int().optional().default(0),
});

export const categoryUpdateSchema = categorySchema.partial();

export const tagSchema = z.object({
  name: jsonFieldRequired,
  slug: z.string().min(1),
});

export const tagUpdateSchema = tagSchema.partial();

export const mediaSchema = z.object({
  project_id: z.number().int().positive().nullable().optional(),
  filename: z.string().min(1),
  original_name: z.string().min(1),
  mime_type: z.string().optional().default('image/jpeg'),
  url: z.string().url(),
  cloudinary_pid: z.string().min(1),
  width: z.number().int().optional(),
  height: z.number().int().optional(),
  file_size: z.number().int().optional(),
  alt_text: jsonField,
  caption: jsonField,
  is_cover: z.number().int().min(0).max(1).optional().default(0),
  sort_order: z.number().int().optional().default(0),
});

export const mediaUpdateSchema = mediaSchema.partial();

export const postSchema = z.object({
  title: jsonFieldRequired,
  slug: z.string().min(1),
  content: jsonField,
  excerpt: jsonField,
  category_id: z.number().int().positive().nullable().optional(),
  status: z.enum(['draft', 'published']).optional().default('draft'),
  meta_title: jsonField,
  meta_description: jsonField,
  og_image: z.string().optional(),
  tags: z.array(z.number().int()).optional(),
});

export const postUpdateSchema = postSchema.partial();

export const pageSchema = z.object({
  title: jsonFieldRequired,
  slug: z.string().min(1),
  content: jsonField,
  status: z.enum(['draft', 'published']).optional().default('draft'),
  meta_title: jsonField,
  meta_description: jsonField,
  og_image: z.string().optional(),
});

export const pageUpdateSchema = pageSchema.partial();

export const reorderSchema = z.object({
  items: z.array(z.object({
    id: z.number().int(),
    sort_order: z.number().int(),
  })),
});
