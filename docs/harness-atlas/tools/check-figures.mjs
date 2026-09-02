#!/usr/bin/env node
/**
 * check-figures.mjs — static geometry audit for inline-SVG figures in a post.
 *
 * Catches the failure a passing build never will: a diagram authored wider than
 * the column it renders into, so the reader sees three of its four columns and
 * concludes the page is broken.
 *
 *   node docs/harness-atlas/tools/check-figures.mjs src/content/blog/<slug>.mdx
 *
 * Exits non-zero on any BLOCKER. No browser, no dependencies.
 */
import { readFileSync } from 'node:fs';

// Usable width inside a <Figure>. `.prose > *` caps children at --maxw-prose
// (45rem ≈ 720px); minus the figure's 1.25rem padding either side.
// `wide` bleeds symmetrically out of the prose column, but only as far as the
// grid leaves room: ~864px at a 1200px viewport, ~1072px at 1440px. Budget the
// narrower of those so a wide figure is not under-scaled on a laptop.
// `narrow` is for tall, small-canvas diagrams. Figure.astro caps their rendered width
// at 480px so they do not scale ~2x in the prose column; authoring one wider than 480
// units would defeat the cap and start shrinking text again.
const BUDGET = { narrow: 480, default: 660, wide: 860, full: 860 };
const MIN_FONT = 11;
const MONO_ADVANCE = 0.6; // JetBrains Mono advance width per em, approx
const MARGIN = 8;

const file = process.argv[2];
if (!file) {
	console.error('usage: check-figures.mjs <post.mdx>');
	process.exit(2);
}
const src = readFileSync(file, 'utf8');

const findings = [];
const add = (sev, fig, msg) => findings.push({ sev, fig, msg });

// Pair each <Figure ...> opening tag with the <svg> that follows it.
const figures = [...src.matchAll(/<Figure\b([^>]*)>/g)].map((m) => ({
	attrs: m[1],
	from: m.index + m[0].length,
}));
figures.forEach((f, i) => {
	f.to = i + 1 < figures.length ? figures[i + 1].from : src.length;
	f.body = src.slice(f.from, f.to);
	f.n = (f.attrs.match(/\bn=["']([^"']+)/) || [, String(i + 1)])[1];
	f.width = (f.attrs.match(/\bwidth=["']([^"']+)/) || [, 'default'])[1];
	f.caption = (f.attrs.match(/\bcaption=["']([^"']*)/) || [, ''])[1];
	if (/\bminWidth=/.test(f.attrs))
		add('BLOCKER', f.n, 'minWidth prop is set — restructure the diagram instead of forcing scroll');
});

if (!figures.length) add('WARN', '-', 'no <Figure> found in this post');

for (const f of figures) {
	const svg = f.body.match(/<svg\b[\s\S]*?<\/svg>/);
	if (!svg) {
		add('BLOCKER', f.n, 'no inline <svg> inside this Figure');
		continue;
	}
	const s = svg[0];
	const budget = BUDGET[f.width] ?? BUDGET.default;

	// --- viewBox ---
	const vb = s.match(/viewBox=["']\s*([-\d.]+)\s+([-\d.]+)\s+([\d.]+)\s+([\d.]+)/);
	if (!vb) {
		add('BLOCKER', f.n, 'svg has no viewBox — it cannot scale');
		continue;
	}
	const vw = parseFloat(vb[3]);
	const vh = parseFloat(vb[4]);
	if (vw > budget)
		add('BLOCKER', f.n, `viewBox width ${vw} exceeds the ${f.width} budget of ${budget} — restructure vertically (§7.2), do not widen`);

	const limit = vw - MARGIN;

	// --- accessibility ---
	if (!/\brole=["']img["']/.test(s)) add('BLOCKER', f.n, 'svg is missing role="img"');
	if (!/<title\b/.test(s)) add('BLOCKER', f.n, 'svg is missing <title>');
	if (!/<desc\b/.test(s)) add('BLOCKER', f.n, 'svg is missing <desc>');

	// --- hardcoded colors break one of the two themes ---
	for (const m of s.matchAll(/(?:fill|stroke|color)=["']\s*(#[0-9a-fA-F]{3,8}|rgba?\()/g))
		add('BLOCKER', f.n, `hex/rgb color literal "${m[1]}" — use a CSS variable`);

	// --- rects / boxes ---
	for (const m of s.matchAll(/<rect\b[^>]*>/g)) {
		const x = num(m[0], 'x'), w = num(m[0], 'width');
		const y = num(m[0], 'y'), h = num(m[0], 'height');
		if (x != null && w != null && x + w > limit)
			add('BLOCKER', f.n, `rect right edge ${x + w} exceeds viewBox ${vw} (clipped)`);
		if (y != null && h != null && y + h > vh)
			add('BLOCKER', f.n, `rect bottom edge ${y + h} exceeds viewBox height ${vh} (clipped)`);
	}

	// --- circles ---
	for (const m of s.matchAll(/<circle\b[^>]*>/g)) {
		const cx = num(m[0], 'cx'), r = num(m[0], 'r');
		if (cx != null && r != null && cx + r > limit)
			add('BLOCKER', f.n, `circle right edge ${cx + r} exceeds viewBox ${vw}`);
	}

	// --- text: estimate the advance width, since it is not in the markup ---
	for (const m of s.matchAll(/<text\b([^>]*)>([\s\S]*?)<\/text>/g)) {
		const attrs = m[1];
		const label = m[2].replace(/<[^>]*>/g, '').trim();
		if (!label) continue;
		const x = num(attrs, 'x');
		const cls = (attrs.match(/class=["']([^"']*)/) || [, ''])[1];
		const fs = num(attrs, 'font-size') ?? fontForClass(cls);
		if (fs != null && fs < MIN_FONT)
			add('BLOCKER', f.n, `font-size ${fs} below the ${MIN_FONT} floor ("${clip(label)}") — illegible once scaled on mobile`);
		if (x == null || fs == null) continue;
		const anchor = (attrs.match(/text-anchor=["']([^"']*)/) || [, 'start'])[1];
		const est = label.length * MONO_ADVANCE * fs;
		const right = anchor === 'middle' ? x + est / 2 : anchor === 'end' ? x : x + est;
		if (right > limit)
			add('BLOCKER', f.n, `text "${clip(label)}" runs to ~${Math.round(right)}, past viewBox ${vw} (clipped)`);
	}

	// --- path / line coordinates ---
	for (const m of s.matchAll(/<(?:path|line|polyline)\b[^>]*>/g)) {
		for (const c of coords(m[0])) {
			if (c.x > vw + 1) add('BLOCKER', f.n, `connector x=${c.x} outside viewBox ${vw}`);
			if (c.y > vh + 1) add('BLOCKER', f.n, `connector y=${c.y} outside viewBox height ${vh}`);
		}
	}

	// --- density: mobile legibility, not aesthetics ---
	const boxes = (s.match(/<rect\b/g) || []).length;
	if (boxes > 12)
		add('WARN', f.n, `${boxes} boxes — past ~10 elements a figure is unreadable at 390px; split it`);

	// --- caption doing the body's job ---
	const words = f.caption.split(/\s+/).filter(Boolean).length;
	if (words > 30) add('WARN', f.n, `caption is ${words} words — one sentence naming what to look at; the explanation belongs in the prose`);

	// --- series scaffolding leaking into reader-facing art ---
	for (const m of s.matchAll(/>([^<]*\b(?:P0\d|MOD::)[^<]*)</g))
		add('WARN', f.n, `framework label "${m[1].trim()}" in diagram text — meaningless without the primitive pages`);
}

function num(str, name) {
	const m = str.match(new RegExp(`\\b${name}=["']\\s*([-\\d.]+)`));
	return m ? parseFloat(m[1]) : null;
}
function fontForClass(cls) {
	if (/\bf-title\b/.test(cls)) return 13;
	if (/\bf-t\b/.test(cls)) return 12;
	if (/\bf-sub\b/.test(cls)) return 11;
	if (/\bf-accent\b/.test(cls)) return 11;
	if (/\bf-g\b/.test(cls)) return 11;
	return null;
}
function coords(tag) {
	const d = (tag.match(/\bd=["']([^"']+)/) || [, ''])[1];
	const out = [];
	const nums = d.match(/-?\d+(?:\.\d+)?/g) || [];
	for (let i = 0; i + 1 < nums.length; i += 2)
		out.push({ x: parseFloat(nums[i]), y: parseFloat(nums[i + 1]) });
	for (const k of [['x1', 'y1'], ['x2', 'y2']]) {
		const x = num(tag, k[0]), y = num(tag, k[1]);
		if (x != null && y != null) out.push({ x, y });
	}
	return out;
}
function clip(s) {
	return s.length > 34 ? s.slice(0, 31) + '…' : s;
}

const blockers = findings.filter((f) => f.sev === 'BLOCKER');
const warns = findings.filter((f) => f.sev === 'WARN');
for (const f of [...blockers, ...warns]) console.log(`${f.sev.padEnd(8)} FIG.${f.fig}  ${f.msg}`);
console.log(
	`\n${figures.length} figure(s) · ${blockers.length} blocker(s) · ${warns.length} warning(s)`,
);
process.exit(blockers.length ? 1 : 0);
