import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { AUTHOR, PAPERS, SITE_DESCRIPTION } from '../consts';

export const GET: APIRoute = async () => {
	const posts = (await getCollection('blog')).sort(
		(a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf(),
	);

	const postLines = posts
		.map(
			(p) =>
				`- [${p.data.title}](${AUTHOR.site}/blog/${p.id}/): ${p.data.description}`,
		)
		.join('\n');

	const paperLines = PAPERS.map(
		(p) => `- [${p.title}](${p.url}) — ${p.venue}, ${p.year}: ${p.abstract}`,
	).join('\n');

	const body = `# ${AUTHOR.name}

> ${SITE_DESCRIPTION}

${AUTHOR.name} (${AUTHOR.handle}) is a ${AUTHOR.role} who builds the system layer behind production AI — agent runtimes, harnesses, evals, and MCP developer platforms. Published at EMNLP 2024 and Elsevier ASOC.

## Links
- Site: ${AUTHOR.site}
- Writing: ${AUTHOR.site}/blog
- Papers: ${AUTHOR.site}/research
- About: ${AUTHOR.site}/about
- GitHub: ${AUTHOR.github}
- LinkedIn: ${AUTHOR.linkedin}
- Email: ${AUTHOR.email}

## Writing
${postLines}

## Peer-reviewed publications
${paperLines}
`;

	return new Response(body, {
		headers: { 'Content-Type': 'text/plain; charset=utf-8' },
	});
};
