import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const blog = defineCollection({
	// Load Markdown and MDX files in the `src/content/blog/` directory.
	loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
	// Type-check frontmatter using a schema
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			description: z.string(),
			// Transform string to Date object
			pubDate: z.coerce.date(),
			updatedDate: z.coerce.date().optional(),
			heroImage: z.optional(image()),
			tags: z.array(z.string()).default([]),
			// ── Harness Atlas series fields (all optional so earlier posts keep validating) ──
			series: z
				.object({ name: z.string(), order: z.number(), primitive: z.string() })
				.optional(),
			verifiedAgainst: z
				.object({ repo: z.string(), commit: z.string(), date: z.string() })
				.optional(),
			drills: z
				.array(z.object({ level: z.string(), q: z.string(), a: z.string() }))
				.default([]),
			proficiency: z.string().optional(),
		}),
});

export const collections = { blog };
