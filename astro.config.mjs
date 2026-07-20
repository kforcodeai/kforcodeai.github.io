// @ts-check

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig, fontProviders } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	site: 'https://kforcode.dev',
	integrations: [mdx(), sitemap()],
	fonts: [
		// Display / headings — geometric, technical, distinctive.
		{
			provider: fontProviders.google(),
			name: 'Space Grotesk',
			cssVariable: '--font-display',
			weights: [500, 600, 700],
			fallbacks: ['ui-sans-serif', 'system-ui', 'sans-serif'],
		},
		// Body / UI — neutral, high-legibility, recruiter-safe.
		{
			provider: fontProviders.google(),
			name: 'Inter',
			cssVariable: '--font-body',
			weights: [400, 500, 600, 700],
			fallbacks: ['ui-sans-serif', 'system-ui', 'sans-serif'],
		},
		// Mono — schematic labels, metadata, net-names, code.
		{
			provider: fontProviders.google(),
			name: 'JetBrains Mono',
			cssVariable: '--font-mono',
			weights: [400, 500, 700],
			fallbacks: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
		},
	],
});
