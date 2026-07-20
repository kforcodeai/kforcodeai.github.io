import { getCollection } from 'astro:content';
import { OGImageRoute } from 'astro-og-canvas';
import { AUTHOR, SITE_TITLE } from '../../consts';

// One OG card per blog post + branded cards for the main sections.
const posts = await getCollection('blog');

const postPages = Object.fromEntries(
	posts.map((post) => [
		post.id,
		{ title: post.data.title, description: post.data.description },
	]),
);

const sitePages: Record<string, { title: string; description: string }> = {
	home: {
		title: 'I build the system layer behind production AI.',
		description: `${SITE_TITLE} · ${AUTHOR.role} — agent runtimes, harnesses, evals, MCP platforms.`,
	},
	writing: {
		title: 'Writing — production AI, from the parts that break at scale.',
		description: 'Agent runtimes, evals, retrieval, and applied LLM engineering.',
	},
	research: {
		title: 'Papers & Research',
		description: 'Peer-reviewed work — EMNLP 2024 · Elsevier ASOC ×2.',
	},
	about: {
		title: `About ${SITE_TITLE}`,
		description: `${AUTHOR.role} · 8+ years shipping production AI at scale.`,
	},
};

const pages = { ...sitePages, ...postPages };

export const { getStaticPaths, GET } = await OGImageRoute({
	pages,
	getImageOptions: (_path, page: { title: string; description: string }) => ({
		title: page.title,
		description: page.description,
		bgGradient: [
			[8, 11, 17],
			[19, 26, 37],
		],
		border: { color: [77, 155, 255], width: 14, side: 'inline-start' },
		padding: 70,
		font: {
			title: { color: [233, 237, 244], size: 62, lineHeight: 1.15, weight: 'Bold' },
			description: { color: [124, 135, 152], size: 28, lineHeight: 1.4 },
		},
	}),
});
