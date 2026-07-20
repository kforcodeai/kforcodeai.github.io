import type { CollectionEntry } from 'astro:content';

export type Post = CollectionEntry<'blog'>;

/** Reading time in minutes from raw markdown body (~220 wpm). */
export function readingTime(body: string | undefined): number {
	if (!body) return 1;
	const words = body.trim().split(/\s+/).length;
	return Math.max(1, Math.round(words / 220));
}

/** Newest-first sort. */
export function byDateDesc(a: Post, b: Post): number {
	return b.data.pubDate.valueOf() - a.data.pubDate.valueOf();
}

/** All unique tags across posts, with counts, sorted by frequency then name. */
export function tagCounts(posts: Post[]): { tag: string; count: number }[] {
	const map = new Map<string, number>();
	for (const p of posts) for (const t of p.data.tags ?? []) map.set(t, (map.get(t) ?? 0) + 1);
	return [...map.entries()]
		.map(([tag, count]) => ({ tag, count }))
		.sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

/** Posts sharing the most tags with the given one (excluding itself). */
export function relatedPosts(current: Post, all: Post[], limit = 2): Post[] {
	const tags = new Set(current.data.tags ?? []);
	return all
		.filter((p) => p.id !== current.id)
		.map((p) => ({
			post: p,
			score: (p.data.tags ?? []).filter((t) => tags.has(t)).length,
		}))
		.sort((a, b) => b.score - a.score || byDateDesc(a.post, b.post))
		.slice(0, limit)
		.map((x) => x.post);
}

/** Short "MOD::NAME" style net label from a slug. */
export function netLabel(prefix: string, value: string): string {
	return `${prefix}::${value.toUpperCase().replace(/[^A-Z0-9]+/g, '_')}`;
}
