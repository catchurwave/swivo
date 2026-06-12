#!/usr/bin/env node
/**
 * Build-time pre-rendering for SEO.
 *
 * Pipeline:
 *   1. Vite builds the client bundle to `dist/`.
 *   2. Vite builds the SSR bundle to `dist/server/`.
 *   3. This script imports the SSR bundle, walks a route list, calls
 *      `render(url)` for each, and writes a static `<route>/index.html` file
 *      using the client `index.html` as a template.
 *
 * Result: crawlers (and slow connections) get fully-formed HTML on every
 * pre-rendered URL; the client re-hydrates as a normal SPA.
 *
 * Dynamic routes (blog posts, formes juridiques) are listed against the
 * bundled seed data so the pipeline stays offline-friendly. When the WP
 * editor publishes new posts, just rerun `npm run build`.
 */

import { mkdir, readFile, writeFile, cp } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root      = resolve(__dirname, '..');
const clientDir = join(root, 'dist');
const serverDir = join(root, 'dist-server');

// Read VITE_BASE from .env so prerender can match StaticRouter's basename.
let BASE = '/';
try {
  const env = await readFile(join(root, '.env'), 'utf8');
  const m = env.match(/^VITE_BASE\s*=\s*(.+)$/m);
  if (m) BASE = m[1].trim();
} catch {}
const basename = BASE.replace(/\/$/, '') || '';

const templatePath = join(clientDir, 'index.html');
const ssrEntry     = join(serverDir, 'entry-server.js');

if (!existsSync(templatePath)) {
  console.error('✗ Missing', templatePath, '— did you run vite build first?');
  process.exit(1);
}
if (!existsSync(ssrEntry)) {
  console.error('✗ Missing', ssrEntry, '— did you run the SSR build?');
  process.exit(1);
}

const template = await readFile(templatePath, 'utf8');
const mod = await import(pathToFileURL(ssrEntry).href);

const formeSlugs = (mod.FORMES_SEED ?? []).map((f) => f.slug);
const postSlugs  = (mod.POSTS_SEED  ?? []).map((p) => p.slug);

const routes = [
  '/',
  '/tarifs',
  '/faq',
  '/blog',
  '/creer-mon-entreprise',
  '/outils/calculateurs',
  '/mentions-legales',
  '/politique-de-confidentialite',
  '/cgv',
  '/cookies',
  '/connexion',
  '/inscription',
  ...formeSlugs.map((s) => `/formes-juridiques/${s}`),
  ...postSlugs.map((s) => `/blog/${s}`),
];

let count = 0;
for (const url of routes) {
  // Prefix the SPA basename so StaticRouter can match.
  const fullUrl = (basename + url).replace(/\/+/g, '/');
  const { html, head } = mod.render(fullUrl);
  const out = template
    .replace('<!--app-head-->', head)
    .replace('<!--app-html-->', html);

  const target =
    url === '/'
      ? join(clientDir, 'index.html')
      : join(clientDir, url.replace(/^\//, ''), 'index.html');

  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, out, 'utf8');
  count += 1;
}

console.log(`✓ Pre-rendered ${count} routes → ${clientDir}`);
