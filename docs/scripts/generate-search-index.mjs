#!/usr/bin/env node

/**
 * Generate a static search index JSON from PIP markdown files.
 * This runs during prebuild so the search dialog can use client-side search
 * (required for Next.js static export / GitHub Pages deployment).
 */

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const PIPS_DIR = path.join(process.cwd(), '../PIPs');
const OUTPUT = path.join(process.cwd(), 'public', 'search-index.json');

function main() {
  // Ensure public dir exists
  const publicDir = path.join(process.cwd(), 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  const files = fs.readdirSync(PIPS_DIR)
    .filter(f => f.endsWith('.md') || f.endsWith('.mdx'))
    .filter(f => f.startsWith('pip-'));

  const index = [];

  for (const file of files) {
    try {
      const content = fs.readFileSync(path.join(PIPS_DIR, file), 'utf8');
      const { data, content: body } = matter(content);

      const pipMatch = file.match(/pip-(\d+)/);
      const pipNumber = data.pip !== undefined ? data.pip : (pipMatch ? parseInt(pipMatch[1], 10) : null);
      const slug = file.replace(/\.mdx?$/, '');

      // Convert Date objects
      const created = data.created instanceof Date ? data.created.toISOString().split('T')[0] : data.created;

      index.push({
        id: slug,
        url: `/docs/${slug}`,
        title: data.title || slug,
        description: data.description || '',
        content: body.substring(0, 500),
        structuredData: {
          pip: pipNumber,
          status: data.status || '',
          type: data.type || '',
          category: data.category || '',
          tags: data.tags || [],
        },
      });
    } catch (err) {
      console.error(`Error processing ${file}:`, err.message);
    }
  }

  // Sort by PIP number
  index.sort((a, b) => (a.structuredData.pip || 9999) - (b.structuredData.pip || 9999));

  fs.writeFileSync(OUTPUT, JSON.stringify(index, null, 2));
  console.log(`[search-index] Generated ${index.length} entries -> public/search-index.json`);
}

main();
