#!/usr/bin/env node
/**
 * verify-post.mjs — mechanical gate for a Harness Atlas post (spec §8).
 *
 *   node docs/harness-atlas/tools/verify-post.mjs src/content/blog/<slug>.mdx
 *
 * Exits non-zero on any FAIL. No dependencies, no network.
 *
 * This file replaces an earlier version that enforced the inverted rules:
 * question-headed sections, a pillar table per section, and file:line
 * citations in the body. The spec now forbids all three, so those checks
 * are gone and their opposites are enforced instead.
 *
 * Heuristic checks (transitions, aphorism shape, attribution) are marked
 * HEURISTIC in the output: they catch drift, not truth.
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, basename } from 'node:path';

const file = process.argv[2];
if (!file) {
	console.error('usage: verify-post.mjs <post.mdx>');
	process.exit(2);
}
const raw = readFileSync(file, 'utf8');
const slug = basename(file).replace(/\.mdx?$/, '');

// ── split frontmatter from body ────────────────────────────────────────────
const fmMatch = raw.match(/^---\n([\s\S]*?)\n---\n/);
if (!fmMatch) {
	console.error('FAIL  no frontmatter');
	process.exit(1);
}
const fm = fmMatch[1];
const body = raw.slice(fmMatch[0].length);

const fmStr = (k) => (fm.match(new RegExp(`^${k}:\\s*['"]?(.*?)['"]?\\s*$`, 'm')) || [, ''])[1];
const title = fmStr('title');
const description = fmStr('description');

// Primary keyword: derived from the slug, the way a reader would say it.
const keyword = slug.replace(/-/g, ' ');
const keywordRe = new RegExp(keyword.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&').replace(/\s+/g, '[\\s-]+'), 'i');

// ── strip machinery so prose checks see prose ──────────────────────────────
const svgs = [...body.matchAll(/<svg[\s\S]*?<\/svg>/g)].map((m) => m[0]);
const fences = [...body.matchAll(/```[\s\S]*?```/g)].map((m) => m[0]);
const tables = [...body.matchAll(/(?:^\|.*\|\s*$\n?)+/gm)].map((m) => m[0]);

let prose = body
	.replace(/<svg[\s\S]*?<\/svg>/g, '')
	.replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
	.replace(/```[\s\S]*?```/g, '')
	.replace(/<\/?(Figure|Callout|figure)[^>]*>/g, '')
	.replace(/^\s*import .*$/gm, '');

const proseNoTables = prose.replace(/(?:^\|.*\|\s*$\n?)+/gm, '');
const words = (s) => s.replace(/[#*_`>[\]()]/g, ' ').split(/\s+/).filter((w) => /[a-z0-9]/i.test(w));
const proseWordCount = words(proseNoTables).length;
const tableWordCount = words(tables.join('\n')).length;

// ── sections ──────────────────────────────────────────────────────────────
const h2s = [...proseNoTables.matchAll(/^##\s+(.+)$/gm)].map((m) => ({ text: m[1].trim(), at: m.index }));
const sections = h2s.map((h, i) => {
	const end = i + 1 < h2s.length ? h2s[i + 1].at : proseNoTables.length;
	const raw = proseNoTables.slice(h.at, end);
	return { heading: h.text, body: raw.replace(/^##\s+.+$/m, '').trim(), words: words(raw).length };
});
const lede = proseNoTables.slice(0, h2s.length ? h2s[0].at : proseNoTables.length);

const sentences = (s) =>
	s
		.replace(/\n+/g, ' ')
		.split(/(?<=[.!?])\s+(?=[A-Z"'(])/)
		.map((x) => x.trim())
		.filter(Boolean);

// ── results ───────────────────────────────────────────────────────────────
const results = [];
const check = (ok, name, detail = '', kind = '') =>
	results.push({ ok, name, detail: String(detail), kind });

// ── title / description / keyword ──────────────────────────────────────────
check(title.length > 0 && title.length <= 60, 'title ≤ 60 chars', `${title.length} chars`);
check(keywordRe.test(title), 'title contains the primary keyword', `keyword="${keyword}"`);
check(!/\bpart\s*\d/i.test(title), 'title has no "Part N"');
check(!/^how\s+\S+\s+works/i.test(title), 'title does not compete head-on ("How X works")');
check(/[:—-]/.test(title) || title.split(/\s+/).length > 5, 'title carries a claim, not just a subject');
check(
	description.length >= 140 && description.length <= 160,
	'description 140-160 chars',
	`${description.length} chars`,
);
check(keywordRe.test(description), 'description contains the primary keyword');
check(keywordRe.test(words(prose).slice(0, 100).join(' ')), 'primary keyword in the first 100 words');

// ── structure ─────────────────────────────────────────────────────────────
const questionH2s = sections.filter((s) => s.heading.trim().endsWith('?'));
const qRatio = sections.length ? questionH2s.length / sections.length : 0;
check(qRatio <= 0.4, '≤40% of H2s are questions', `${questionH2s.length}/${sections.length} = ${Math.round(qRatio * 100)}%`);
check(sections.length >= 6 && sections.length <= 14, 'H2 count 6-14 (an arc, not a questionnaire)', sections.length);

const mean = sections.reduce((a, s) => a + s.words, 0) / (sections.length || 1);
const sd = Math.sqrt(sections.reduce((a, s) => a + (s.words - mean) ** 2, 0) / (sections.length || 1));
check(sd / mean >= 0.35, 'section-length stdev ≥ 35% of mean', `${Math.round((sd / mean) * 100)}% (mean ${Math.round(mean)}w)`);

const longOpeners = sections.filter((s) => (sentences(s.body)[0] || '').split(/\s+/).length > 40);
check(longOpeners.length === 0, 'every section opens with a ≤40-word sentence', longOpeners.map((s) => s.heading).join('; '));

// Transitions: the first sentence must reach back at some point, not open cold.
const BACKREF =
	/\b(that|this|those|these|it|its|they|their|there|which|so|but|and|then|still|same|both|all of|none of|every|each|above|earlier|instead|take|strip|off by default|because|after|once|if)\b/i;
const cold = sections.filter((s, i) => i > 0 && !BACKREF.test((sentences(s.body)[0] || '').slice(0, 160)));
check(
	sections.length < 2 || (sections.length - 1 - cold.length) / (sections.length - 1) >= 0.8,
	'≥80% of sections open by connecting back',
	cold.length ? `cold opens: ${cold.map((s) => s.heading).join('; ')}` : 'all connected',
	'HEURISTIC',
);

check(proseWordCount >= 2200 && proseWordCount <= 3200, 'prose word count 2200-3200', `${proseWordCount} prose (+${tableWordCount} in tables)`);

// ── apparatus that must not appear ────────────────────────────────────────
const CITATION = /(?:[\w./-]+\.(?:py|ts|tsx|js|mjs|go|rs|md|ya?ml|toml|json):L?\d+)|(?:#L\d+)|(?:blob\/[0-9a-f]{7,40}\/)|(?:\b[\w-]+\/[\w-]+\.(?:py|ts|tsx|go|rs)\b)/g;
const cites = [...proseNoTables.matchAll(CITATION)].map((m) => m[0]);
check(cites.length === 0, 'zero file paths, line numbers or source permalinks', cites.slice(0, 4).join(', '));

const PROVENANCE = /verified against|every claim (?:below )?cites|vital statistics|legend (?:for|,)|defined once|provenance/i;
const prov = proseNoTables.match(PROVENANCE);
check(!prov, 'no provenance apparatus (verified-against, vital statistics, legend)', prov ? prov[0] : '');

const META =
	/\bcrawler|\bSEO\b|answer engine|featured snippet|no network (?:access|at)|network access at|my (?:sandbox|tooling|environment)|this (?:post|teardown|section) (?:will|is going to)|restated in prose|steelman first|in words, since/i;
const meta = proseNoTables.match(META);
check(!meta, 'no meta-commentary about the post or its construction', meta ? meta[0] : '');

const STAMP = /\*\*(?:this is a )?(?:real trade|free win)[^*]*\*\*|\*\*both free wins\*\*/i;
check(!STAMP.test(proseNoTables), 'no bolded taxonomy stamps');

// ── tables and pseudocode ─────────────────────────────────────────────────
check(tables.length <= 2, '≤2 tables in the whole post', `${tables.length}`);
const glyphTables = tables.filter((t) => /[▲▼●◆]/.test(t));
check(glyphTables.length === 0, 'no glyph-notation tables', `${glyphTables.length}`);
check(fences.length <= 3, '≤3 pseudocode blocks', fences.length);
const longFence = fences.filter((f) => f.split('\n').length - 2 > 15);
check(longFence.length === 0, 'every pseudocode block ≤15 lines');
const realCode = fences.filter((f) => /\b(?:import |def |self\.|const |=>|async )/.test(f));
check(realCode.length === 0, 'pseudocode, not transcribed source', `${realCode.length} block(s) look like real code`);

// ── numbers must be attributed ────────────────────────────────────────────
const ATTRIB =
	/their own|theirs|they (?:put|report|list|publish|say)|the repo (?:publishes|lists|reports)|by their|own (?:comment|note|guide|figure|pricing|reckoning|published)|my arithmetic|arithmetic on|published (?:run|figures)|pricing table|comment (?:puts|says)|I am taking their word|no accuracy cost/i;
const lines = proseNoTables.split('\n');
const numberish = /(?:^|[\s(])\d[\d,.]*\s*(?:%|percent|x\b|×|tokens|seconds|minutes|dollars|per million)/i;
const unattributed = [];
lines.forEach((ln, i) => {
	if (!numberish.test(ln)) return;
	const window = lines.slice(Math.max(0, i - 2), i + 3).join(' ');
	if (!ATTRIB.test(window) && !/\]\(https?:/.test(window)) unattributed.push(ln.trim().slice(0, 70));
});
check(unattributed.length === 0, 'every numeric claim is attributed or is own arithmetic', unattributed.slice(0, 3).join(' | '), 'HEURISTIC');

// ── voice tics ────────────────────────────────────────────────────────────
const PERFORMED =
	/I have not seen (?:this|that|another|it)|I had not seen|nowhere else have I|the finding that reframed|reframed the teardown|the line I would quote|I would quote in a design review|as I read it, this is|let me be clear/gi;
const performed = [...proseNoTables.matchAll(PERFORMED)];
check(performed.length <= 4, 'performed first person ≤4', `${performed.length}`);

const dashes = (proseNoTables.match(/—/g) || []).length;
check(dashes <= 6, 'em-dash constructions ≤6', dashes);

const ANTITHESIS = /\bnot\s+[^,.;:]{2,45},?\s+but\s+/gi;
const antithesisEnd = /,\s+not\s+[^,.;:]{2,45}\./g;
const anti = [...proseNoTables.matchAll(ANTITHESIS)].length + [...proseNoTables.matchAll(antithesisEnd)].length;
check(anti <= 3, '"not X but Y" antitheses ≤3', anti);

const SUPERLATIVE =
	/\bthe (?:single )?most \w+|\bthe clearest\b|\bthe best\b|\brarer than\b|\bthe only (?:one|harness|thing) that\b|\bthe biggest\b|\bmost (?:transferable|quotable|dangerous|useful)\b/gi;
const supers = [...proseNoTables.matchAll(SUPERLATIVE)];
check(supers.length <= 2, 'superlative rankings ≤2', supers.map((m) => m[0]).join(', '));

// Aphorism shape: a section closing on a short, standalone epigram.
const aphorisms = sections.filter((s) => {
	const ss = sentences(s.body);
	const last = ss[ss.length - 1] || '';
	const n = last.split(/\s+/).filter(Boolean).length;
	return n > 0 && n <= 11;
});
check(aphorisms.length <= 3, 'section-closing aphorisms ≤3', aphorisms.map((s) => s.heading).join('; '), 'HEURISTIC');

const IDENT = /`[a-z_]+(?:_[a-z0-9]+){1,}`|`[A-Z][A-Za-z]+\.[a-z_]+\(`/g;
const idents = [...proseNoTables.matchAll(IDENT)].map((m) => m[0]);
check(idents.length === 0, 'no backticked internal identifiers as prose nouns', idents.slice(0, 4).join(', '));

// ── the mess a human leaves behind ────────────────────────────────────────
const UNCERTAIN = /I (?:cannot|can't|could not|couldn't) (?:tell|verify|work out|figure out)|I do not know whether|it may just be|I am taking their word/i;
const HARDREAD = /I spent (?:a|an|some)|took me a while|convinced (?:that )?|misread|re-read (?:it|the)|reads that way/i;
const REVISED = /I went in expecting|I expected to|changed my mind|I would have (?:given|written|said)|before reading this/i;
check(UNCERTAIN.test(proseNoTables), 'admits at least one thing not figured out');
check(HARDREAD.test(proseNoTables), 'admits at least one hard or misleading read');
check(REVISED.test(proseNoTables), 'revises at least one of the author\'s own views');

// ── analysis coverage ─────────────────────────────────────────────────────
const latencySections = sections.filter((s) => /latency|stall|wall clock|wall-clock|blocks a turn/i.test(s.body));
check(latencySections.length >= 3, 'latency discussed in ≥3 sections', latencySections.length);

const FREE_VS_TRADE =
	/costs nothing|nothing is given up|no accuracy cost|only works because|constraint you may not share|buys? .{0,30}(?:by|with) (?:giving|paying)|pays for|gives up/i;
check(FREE_VS_TRADE.test(proseNoTables), 'distinguishes cost-free choices from traded ones, in prose');
check(/what it optimizes for|optimizes for/i.test(proseNoTables), 'states what the harness optimizes for');
check(/steelman|the steelman is|in their own guide|the stated reason/i.test(proseNoTables) || /fair(?:est)? reading/i.test(proseNoTables), 'steelman present before the critique');

// ── figures ───────────────────────────────────────────────────────────────
check(svgs.length >= 1 && svgs.length <= 3, '1-3 diagrams', svgs.length);
const badA11y = svgs.filter((s) => !/role=["']img["']/.test(s) || !/<title/.test(s) || !/<desc/.test(s) || !/viewBox=/.test(s));
check(badA11y.length === 0, 'every SVG has role, title, desc, viewBox');
const hexes = svgs.flatMap((s) => [...s.matchAll(/(?:fill|stroke|color)=["']\s*(#[0-9a-fA-F]{3,8}|rgba?\()/g)].map((m) => m[1]));
check(hexes.length === 0, 'zero hex/rgb literals in SVG', hexes.slice(0, 3).join(', '));
check(!/minWidth=/.test(body), 'no minWidth prop on a Figure (restructure instead)');

// ── internal links ────────────────────────────────────────────────────────
const internal = [...proseNoTables.matchAll(/\[([^\]]+)\]\((\/[^)\s]*)\)/g)].map((m) => ({ text: m[1], href: m[2], at: m.index }));
check(internal.length >= 3, '≥3 internal links', internal.map((l) => l.href).join(', '));

const blogDir = 'src/content/blog';
const knownSlugs = existsSync(blogDir) ? readdirSync(blogDir).map((f) => f.replace(/\.mdx?$/, '')) : [];
const pagesDir = 'src/pages';
const pageRoutes = existsSync(pagesDir)
	? readdirSync(pagesDir, { withFileTypes: true }).flatMap((e) =>
			e.isDirectory() ? [`/${e.name}`] : [`/${e.name.replace(/\.(astro|md|mdx)$/, '').replace(/^index$/, '')}`],
		)
	: [];
const dead = internal.filter((l) => {
	const p = l.href.replace(/\/$/, '');
	if (p === '' || p === '/blog') return false;
	if (p.startsWith('/blog/')) return !knownSlugs.includes(p.slice('/blog/'.length));
	return !pageRoutes.includes(p);
});
check(dead.length === 0, 'zero internal links to a nonexistent page', dead.map((l) => l.href).join(', '));

// Links must sit inside sentences, not be gathered into a link paragraph.
const paras = proseNoTables.split(/\n{2,}/);
const linkParas = paras.filter((p) => {
	const n = [...p.matchAll(/\[[^\]]+\]\(\/[^)\s]*\)/g)].length;
	return n >= 2 && words(p).length < 45 && !/^\*I'm \[/.test(p.trim());
});
check(linkParas.length === 0, 'no clustered link paragraph', linkParas.length);

// ── frontmatter contract ──────────────────────────────────────────────────
const SCHEMA_KEYS = ['title', 'description', 'pubDate', 'updatedDate', 'heroImage', 'tags', 'series', 'verifiedAgainst', 'drills', 'proficiency'];
const fmKeys = [...fm.matchAll(/^([a-zA-Z]\w*):/gm)].map((m) => m[1]);
const unknown = fmKeys.filter((k) => !SCHEMA_KEYS.includes(k));
check(unknown.length === 0, 'every frontmatter key exists in the schema', unknown.join(', '));

const tags = (fm.match(/^tags:\s*\[(.*)\]/m) || [, ''])[1].split(',').map((t) => t.trim().replace(/['"]/g, '')).filter(Boolean);
check(tags.length >= 3 && tags.length <= 5, 'tags 3-5', tags.join(', '));
check(tags.every((t) => t === t.toLowerCase()), 'all tags lowercase');
const otherPosts = existsSync(blogDir) ? readdirSync(blogDir).filter((f) => f.replace(/\.mdx?$/, '') !== slug) : [];
const usedTags = new Set(
	otherPosts.flatMap((f) => {
		const m = readFileSync(join(blogDir, f), 'utf8').match(/^tags:\s*\[(.*)\]/m);
		return m ? m[1].split(',').map((t) => t.trim().replace(/['"]/g, '')) : [];
	}),
);
const shared = tags.filter((t) => usedTags.has(t));
check(shared.length >= 2, '≥2 tags already used by another post', shared.join(', '));

const drillLevels = [...fm.matchAll(/^\s*-\s*level:\s*['"]?(\w+)/gm)].map((m) => m[1]);
check(drillLevels.length >= 5, '≥5 drills', drillLevels.length);
check(drillLevels.includes('staff'), 'at least one staff-level drill', drillLevels.join(', '));

// ── report ────────────────────────────────────────────────────────────────
console.log(`\nverify-post · ${file}`);
console.log(`primary keyword: "${keyword}" · ${proseWordCount} prose words · ${sections.length} H2s · ${tables.length} tables · ${svgs.length} figures\n`);
const fails = results.filter((r) => !r.ok);
for (const r of results) {
	const tag = r.ok ? 'PASS' : 'FAIL';
	console.log(`${tag}  ${r.kind ? r.kind + ' ' : ''}${r.name.padEnd(52)} ${r.detail}`);
}
console.log(`\n${results.length - fails.length}/${results.length} checks passed.`);
if (fails.length) {
	console.log(`\n${fails.length} FAIL(s):`);
	for (const f of fails) console.log(`  · ${f.name} ${f.detail ? '— ' + f.detail : ''}`);
	process.exit(1);
}
console.log('All checks passed.');
