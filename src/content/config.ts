import { defineCollection, z } from 'astro:content';

const postsCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    slug: z.string().optional(),
    categories: z.array(z.string()).default([]),
    tags: z.array(z.string()).default([]),
    summary: z.string().default(''),
    cover: z.string().optional(),
    originUrl: z.string().url(),
    draft: z.boolean().default(false),
  }),
});

export const collections = {
  posts: postsCollection,
};
