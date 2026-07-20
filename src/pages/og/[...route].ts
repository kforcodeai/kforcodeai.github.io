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
		title: 'Engineering AI systems that survive production.',
		description: `${SITE_TITLE} · Field notes on production AI, agentic systems, deep-learning papers, and software engineering.`,
	},
	writing: {
		title: 'Field notes from production.',
		description: 'Production AI, agent runtimes, evals, retrieval, and applied LLM engineering.',
	},
	research: {
		title: 'Research informed by real systems.',
		description: 'Peer-reviewed work at EMNLP and Elsevier Applied Soft Computing.',
	},
	about: {
		title: 'I build the system layer between models and products.',
		description: `${AUTHOR.name} · ${AUTHOR.role} · 8+ years shipping production AI at scale.`,
	},
};

const pages = { ...sitePages, ...postPages };

export const { getStaticPaths, GET } = await OGImageRoute({
	pages,
	getImageOptions: (_path, page: { title: string; description: string }) => ({
		title: page.title,
		description: page.description,
		bgGradient: [
			[11, 11, 11],
			[17, 17, 17],
		],
		border: { color: [74, 222, 128], width: 12, side: 'inline-start' },
		padding: 70,
		font: {
			title: { color: [241, 241, 241], size: 62, lineHeight: 1.1, weight: 'Bold' },
			description: { color: [155, 155, 155], size: 28, lineHeight: 1.4 },
		},
	}),
});
