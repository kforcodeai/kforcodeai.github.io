# kforcodeai.github.io

Personal site and blog of **Kaushal Prajapati** — Staff AI/ML Engineer.
Built with [Astro](https://astro.build), deployed to GitHub Pages via GitHub Actions.

**Live:** https://kforcodeai.github.io

## Write a new post

Create a Markdown or MDX file in `src/content/blog/`:

```markdown
---
title: 'Your post title'
description: 'One sentence for search + social previews (~150 chars).'
pubDate: 'YYYY-MM-DD'
heroImage: '../../assets/your-image.jpg'   # optional
tags: ['agents', 'llm']                     # optional
---

Your content here…
```

That's it — the post shows up on the homepage, the `/blog` index, the RSS feed, and the sitemap automatically.

## Develop locally

```sh
npm install
npm run dev        # http://localhost:4321
npm run build      # production build into ./dist
npm run preview    # preview the production build
```

## SEO built in

- Per-page `<title>`, meta description, canonical URL, Open Graph + Twitter cards
- JSON-LD structured data (`Person` sitewide, `BlogPosting` on posts)
- `sitemap-index.xml` (via `@astrojs/sitemap`), `robots.txt`, and an RSS feed at `/rss.xml`

## Deploy

Pushing to `main` triggers `.github/workflows/deploy.yml`, which builds the site and
publishes it to GitHub Pages. In the repo: **Settings → Pages → Source → GitHub Actions**.

## Custom domain (optional, later)

Buy a domain (e.g. `kforcode.dev`), add a `public/CNAME` file containing the bare domain,
set the domain in **Settings → Pages**, and point DNS at GitHub Pages. Everything else keeps working.
