import { getCollection } from 'astro:content';
import { OGImageRoute } from 'astro-og-canvas';

// Build one OG card per blog post. Slug is derived from the `pages` key,
// producing routes like /og/<post-id>.png (see BaseHead ogImage prop).
const posts = await getCollection('blog');
const pages = Object.fromEntries(posts.map((post) => [post.id, post.data]));

export const { getStaticPaths, GET } = await OGImageRoute({
	pages,
	getImageOptions: (_path, page: (typeof posts)[number]['data']) => ({
		title: page.title,
		description: page.description,
		bgGradient: [
			[15, 18, 25],
			[34, 41, 57],
		],
		border: { color: [35, 55, 255], width: 12, side: 'inline-start' },
		padding: 60,
		font: {
			title: { color: [255, 255, 255], size: 60, lineHeight: 1.15 },
			description: { color: [180, 190, 210], size: 30, lineHeight: 1.4 },
		},
	}),
});
