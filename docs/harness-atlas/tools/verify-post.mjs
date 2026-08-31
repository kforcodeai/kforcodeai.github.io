#!/usr/bin/env node
/**
 * verify-post.mjs — Harness Atlas SEO/AEO + pillar-discipline verifier.
 *
 * Usage:  node docs/harness-atlas/tools/verify-post.mjs src/content/blog/<slug>.mdx
 *
 * Exits non-zero on any FAIL. Reusable across the series — nothing post-specific
 * is hardcoded. Where a rule needs a per-post value (the primary keyword), it is
 * derived from the slug.
 *
 * The type-3/type-4 detection heuristic: in this series those questions are
 * always phrased "Why ...?" (design choice) or "When ...?" / "Would ...?"
 * (situational), so every H2 with that shape must carry a pillar verdict table.
 */

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { basename, join } from 'node:path';

const path = process.argv[2];
if (!path) {
	console.error('usage: verify-post.mjs <path-to-post.mdx>');
	process.exit(2);
}

const raw = readFileSync(path, 'utf8');
const slug = basename(path).replace(/\.mdx?$/, '');
const results = [];
const pass = (name, detail = '') => results.push({ ok: true, name, detail });
const fail = (name, detail = '') => results.push({ ok: false, name, detail });
const check = (ok, name, detail = '') => (ok ? pass(name, detail) : fail(name, detail));

// ── split frontmatter / body ──────────────────────────────────────────────
const fmMatch = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
if (!fmMatch) {
	console.error('FAIL  frontmatter: no --- delimited block at top of file');
	process.exit(1);
}
const [, fmRaw, body] = fmMatch;

const scalar = (key) => {
	const m = fmRaw.match(new RegExp(`^${key}:\\s*(.*)$`, 'm'));
	if (!m) return null;
	return m[1].trim().replace(/^['"]|['"]$/g, '');
};

const title = scalar('title') ?? '';
const description = scalar('description') ?? '';
const tagsRaw = scalar('tags') ?? '';
const tags = [...tagsRaw.matchAll(/'([^']+)'|"([^"]+)"/g)].map((m) => m[1] ?? m[2]);

// Primary keyword: the slug, spaces for dashes. Series slugs are keyword-forward
// by construction (PLAN.md §2), so this is the keyword the post is competing for.
const keyword = slug.replace(/-/g, ' ');
// Compare keyword-insensitively to hyphenation: the slug cannot carry the hyphen
// inside a product name ("hermes-agent architecture" -> hermes-agent-architecture),
// so normalize both sides to single spaces before matching.
const norm = (s) => s.toLowerCase().replace(/[-\s]+/g, ' ');
const hasKeyword = (hay) => norm(hay).includes(norm(keyword));

// ── prose extraction: strip imports, JSX/SVG blocks, code fences, comments ──
const prose = body
	.replace(/^import .*$/gm, '')
	.replace(/^export .*$/gm, '')
	.replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
	.replace(/<svg[\s\S]*?<\/svg>/g, '')
	.replace(/<\/?(Figure|Callout|aside|figure|figcaption)[^>]*>/g, '')
	.replace(/```[\s\S]*?```/g, '');

const countWords = (s) => s.split(/\s+/).filter((w) => /[a-zA-Z0-9]/.test(w)).length;
const words = prose.split(/\s+/).filter((w) => /[a-zA-Z0-9]/.test(w));
// The 2,200-3,200 rule is about readable prose. Markdown table cells are a
// deliberately separate asset in this series (tables are extraction bait, PLAN
// §8), so they are reported but not counted against the prose budget.
const tableWordCount = countWords(
	prose.split('\n').filter((l) => l.trim().startsWith('|')).join('\n'),
);
const wordCount = countWords(
	prose.split('\n').filter((l) => !l.trim().startsWith('|')).join('\n'),
);

// ── 1. title ──────────────────────────────────────────────────────────────
check(title.length > 0 && title.length <= 60, 'title length ≤ 60', `${title.length} chars`);
check(
	hasKeyword(title),
	'title contains primary keyword',
	`keyword="${keyword}"`,
);
check(!/\bpart\s+\d|\bpart\s+(one|two|three)\b/i.test(title), 'title has no "Part N"');
check(
	!/^how\s+\w+\s+works/i.test(title),
	'title does not compete head-on ("How X works")',
);

// ── 2. description ────────────────────────────────────────────────────────
check(
	description.length >= 140 && description.length <= 160,
	'description 140-160 chars',
	`${description.length} chars`,
);
check(
	hasKeyword(description),
	'description contains primary keyword',
);

// ── 3. keyword in opening ─────────────────────────────────────────────────
const opening = words.slice(0, 100).join(' ');
check(hasKeyword(opening), 'primary keyword in first 100 words');

// ── 4. H2 discipline ──────────────────────────────────────────────────────
const h2s = [...prose.matchAll(/^##\s+(.+)$/gm)].map((m) => m[1].trim());
const questionH2s = h2s.filter((h) => h.endsWith('?'));
const ratio = h2s.length ? questionH2s.length / h2s.length : 0;
check(
	ratio >= 0.8,
	'≥80% of H2s are questions',
	`${questionH2s.length}/${h2s.length} = ${(ratio * 100).toFixed(0)}%`,
);
check(h2s.length >= 12 && h2s.length <= 24, 'H2 count in range (12-24 incl. wrappers)', `${h2s.length}`);

// ── 5. answer-first: first sentence of each section ≤ 40 words ────────────
const sections = [];
const parts = prose.split(/^##\s+/m).slice(1);
for (const part of parts) {
	const nl = part.indexOf('\n');
	sections.push({ heading: part.slice(0, nl).trim(), text: part.slice(nl + 1) });
}
const longOpeners = [];
for (const s of sections) {
	const firstProse = s.text
		.split('\n')
		.map((l) => l.trim())
		.find(
			(l) =>
				l &&
				!l.startsWith('|') &&
				!l.startsWith('<') &&
				!l.startsWith('`') &&
				!l.startsWith('-') &&
				!l.startsWith('*') &&
				!l.startsWith('{'),
		);
	if (!firstProse) continue;
	const sentence = firstProse.split(/(?<=[.!?])\s/)[0];
	const n = sentence.split(/\s+/).length;
	if (n > 40) longOpeners.push(`${s.heading} (${n}w)`);
}
check(longOpeners.length === 0, 'every section opens with a ≤40-word sentence', longOpeners.join('; '));

// ── 6. word count ─────────────────────────────────────────────────────────
check(
	wordCount >= 2200 && wordCount <= 3200,
	'prose word count 2200-3200',
	`${wordCount} prose (+${tableWordCount} in tables)`,
);

// ── 7. internal links exist ───────────────────────────────────────────────
const internal = [...prose.matchAll(/\]\((\/[^)\s]*)\)/g)].map((m) => m[1]);
check(internal.length >= 4, '≥4 internal links', `${internal.length}: ${internal.join(', ')}`);

const blogDir = 'src/content/blog';
const knownSlugs = existsSync(blogDir)
	? readdirSync(blogDir).map((f) => f.replace(/\.mdx?$/, ''))
	: [];
const pagesDir = 'src/pages';
const staticRoutes = new Set(['/', '/blog', '/about']);
if (existsSync(pagesDir)) {
	for (const f of readdirSync(pagesDir)) {
		if (f.endsWith('.astro') || f.endsWith('.ts') || f.endsWith('.js')) {
			const name = f.replace(/\.(astro|ts|js)$/, '');
			if (!name.startsWith('[')) staticRoutes.add(name === 'index' ? '/' : `/${name}`);
		}
	}
}
const dead = [];
for (const href of internal) {
	const clean = href.split('#')[0].replace(/\/$/, '') || '/';
	if (staticRoutes.has(clean)) continue;
	const blogMatch = clean.match(/^\/blog\/(.+)$/);
	if (blogMatch && knownSlugs.includes(blogMatch[1])) continue;
	if (/^\/tags\/[^/]+$/.test(clean)) continue;
	dead.push(href);
}
check(dead.length === 0, 'zero internal links to a nonexistent page', dead.join(', '));

// ── 8. code citations carry a commit or repo link ─────────────────────────
// Any `path/file.ext:L123` reference must be inside a markdown link whose href
// points at a repo blob/tree URL.
const citations = [...prose.matchAll(/`([\w./-]+\.(?:py|ts|tsx|mjs|md|yaml|yml)):L\d+[^`]*`/g)];
const unlinked = [];
for (const c of citations) {
	const idx = c.index ?? 0;
	const after = prose.slice(idx + c[0].length, idx + c[0].length + 200);
	if (!/^\]\(https?:\/\/[^)]*\/(blob|tree)\/[0-9a-f]{7,40}\//.test(after)) {
		unlinked.push(c[1]);
	}
}
check(unlinked.length === 0, 'every file:line citation links to a pinned commit', unlinked.join(', '));

// ── 9. numeric claims sit within 2 lines of a link ────────────────────────
const lines = prose.split('\n');
const orphanNumbers = [];
for (let i = 0; i < lines.length; i++) {
	const line = lines[i];
	if (line.trim().startsWith('|')) continue; // tables carry a Source column
	if (line.trim().startsWith('#')) continue;
	// A "numeric claim" = a figure with a unit or magnitude, not prose ordinals.
	const nums = line.match(/\b\d[\d,._]*\s*(?:%|x\b|K\b|tokens?\b|s\b|lines\b|per million)/g);
	if (!nums) continue;
	const window = lines.slice(Math.max(0, i - 2), i + 3).join('\n');
	if (!/\]\(https?:\/\//.test(window) && !/\]\(\//.test(window)) {
		orphanNumbers.push(`L${i + 1}: ${nums.join(' ')}`);
	}
}
check(orphanNumbers.length === 0, 'every numeric claim is within 2 lines of a link', orphanNumbers.join(' | '));

// ── 10. SVG accessibility + no hex literals ───────────────────────────────
const svgs = [...body.matchAll(/<svg[\s\S]*?<\/svg>/g)].map((m) => m[0]);
check(svgs.length > 0, 'post contains at least one diagram', `${svgs.length}`);
const a11yProblems = [];
svgs.forEach((svg, i) => {
	if (!/role\s*=\s*"img"/.test(svg)) a11yProblems.push(`svg${i + 1}: no role="img"`);
	if (!/<title[\s>]/.test(svg)) a11yProblems.push(`svg${i + 1}: no <title>`);
	if (!/<desc[\s>]/.test(svg)) a11yProblems.push(`svg${i + 1}: no <desc>`);
	if (!/viewBox/.test(svg)) a11yProblems.push(`svg${i + 1}: no viewBox`);
});
check(a11yProblems.length === 0, 'every SVG has role, title, desc, viewBox', a11yProblems.join('; '));

const hexInSvg = svgs.flatMap((svg) => svg.match(/#[0-9a-fA-F]{3,8}\b/g) ?? []).filter(
	// ignore fragment refs like url(#f1a) and aria-labelledby ids
	(h) => !/^#[a-z]/.test(h),
);
check(hexInSvg.length === 0, 'zero hex color literals in SVG', hexInSvg.join(', '));

// ── 11. tags ──────────────────────────────────────────────────────────────
check(tags.length >= 3 && tags.length <= 5, 'tags 3-5', `${tags.length}: ${tags.join(', ')}`);
check(
	tags.every((t) => t === t.toLowerCase()),
	'all tags lowercase',
);
const otherTags = new Set();
for (const f of knownSlugs) {
	if (f === slug) continue;
	for (const ext of ['.md', '.mdx']) {
		const p = join(blogDir, f + ext);
		if (!existsSync(p)) continue;
		const other = readFileSync(p, 'utf8');
		const m = other.match(/^tags:\s*(.*)$/m);
		if (m) for (const t of [...m[1].matchAll(/'([^']+)'|"([^"]+)"/g)]) otherTags.add(t[1] ?? t[2]);
	}
}
const reused = tags.filter((t) => otherTags.has(t));
check(reused.length >= 2, '≥2 tags already used by an existing post', reused.join(', '));

// ── 12. frontmatter validates against the current schema ──────────────────
const schemaPath = 'src/content.config.ts';
if (existsSync(schemaPath)) {
	const schema = readFileSync(schemaPath, 'utf8');
	const fmKeys = [...fmRaw.matchAll(/^([A-Za-z][A-Za-z0-9_]*):/gm)].map((m) => m[1]);
	const unknown = fmKeys.filter((k) => !new RegExp(`\\b${k}\\s*:`).test(schema));
	check(unknown.length === 0, 'every frontmatter key exists in the schema', unknown.join(', '));
} else {
	fail('schema file found', schemaPath);
}

// ── 13. drills ────────────────────────────────────────────────────────────
const drillLevels = [...fmRaw.matchAll(/^\s*-\s*level:\s*'([^']+)'/gm)].map((m) => m[1]);
check(drillLevels.length >= 5, '≥5 drills', `${drillLevels.length}`);
check(drillLevels.includes('staff'), 'at least one staff-level drill', drillLevels.join(', '));

// ── 14. pillar discipline ─────────────────────────────────────────────────
const PILLAR_TABLE = /\|\s*Accuracy\s*\|\s*Latency\s*\|\s*Cost\s*\|/i;
const priced = sections.filter((s) => PILLAR_TABLE.test(s.text));
const designOrSituational = sections.filter((s) => /^(Why|When|Would)\b/i.test(s.heading));
const unpriced = designOrSituational.filter((s) => !PILLAR_TABLE.test(s.text));
check(
	unpriced.length === 0,
	'every type-3/type-4 section carries a pillar verdict table',
	unpriced.map((s) => s.heading).join('; '),
);
check(
	designOrSituational.length >= 7,
	'≥7 type-3/type-4 sections (≈half the post)',
	`${designOrSituational.length} of ${h2s.length} H2s`,
);

const legendRe = /▲\s*improves.*▼\s*degrades.*●\s*neutral.*◆/s;
const legendIdx = prose.search(legendRe);
const firstGlyphIdx = prose.search(/[▲▼●◆]/);
check(legendIdx >= 0, 'pillar legend is defined');
check(
	legendIdx >= 0 && firstGlyphIdx >= 0 && legendIdx <= firstGlyphIdx,
	'pillar legend appears before first glyph use',
);
const legendCount = (prose.match(new RegExp('▲\\s*improves', 'g')) ?? []).length;
check(legendCount === 1, 'pillar legend defined exactly once', `${legendCount}`);

// The whole-harness summary: exactly one section whose heading names the summary.
const summarySections = sections.filter(
	(s) => /pillar summary/i.test(s.heading) && PILLAR_TABLE.test(s.text),
);
check(summarySections.length === 1, 'exactly one whole-harness pillar summary table', `${summarySections.length}`);

const latencySections = sections.filter((s) => /latency/i.test(s.text) || /latency/i.test(s.heading));
check(latencySections.length >= 3, 'latency discussed in ≥3 distinct sections', `${latencySections.length}`);

check(/free win/i.test(prose) && /real trade/i.test(prose), 'free wins vs real trades explicitly labeled');
check(
	/optimizes for|optimize[sd]? for|optimizing for/i.test(prose),
	'post states what the harness optimizes for (the denominator)',
);
check(
	/architectural reasoning|not measurement|not benchmark/i.test(prose),
	'pillar verdicts labeled as reasoning rather than measurement',
);

// ── report ────────────────────────────────────────────────────────────────
const failures = results.filter((r) => !r.ok);
const pad = (s, n) => (s.length >= n ? s : s + ' '.repeat(n - s.length));
console.log(
	`\nverify-post · ${path}\nprimary keyword: "${keyword}" · ${wordCount} prose words ` +
		`(+${tableWordCount} in tables) · ${h2s.length} H2s\n`,
);
for (const r of results) {
	console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${pad(r.name, 58)} ${r.detail}`);
}
console.log(`\n${results.length - failures.length}/${results.length} checks passed.`);
if (failures.length) {
	console.log(`\n${failures.length} FAILING:`);
	for (const f of failures) console.log(`  · ${f.name}${f.detail ? ` — ${f.detail}` : ''}`);
	process.exit(1);
}
console.log('All checks passed.\n');
