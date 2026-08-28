/**
 * Add a game to curated collections with per-collection reasons.
 *
 * Usage: node scripts/add-to-collections.mjs <slug> "<collection1>:<reason>" "<collection2>:<reason>" ...
 */
import fs from 'node:fs';

const [slug, ...entries] = process.argv.slice(2);
if (!slug || entries.length === 0) {
  console.error('usage: node scripts/add-to-collections.mjs <slug> "<collection>:<reason>" ...');
  process.exit(1);
}

for (const entry of entries) {
  const separator = entry.indexOf(':');
  const collection = entry.slice(0, separator).trim();
  const reason = entry.slice(separator + 1).trim();
  if (!reason || reason.length < 20) throw new Error(`reason too short for ${collection}`);
  const file = `src/content/collections/${collection}.md`;
  const raw = fs.readFileSync(file, 'utf8');
  if (raw.includes(`- game: ${slug}\n`)) {
    console.log(`${collection}: already present`);
    continue;
  }
  const member = `  - game: ${slug}\n    reason: "${reason.replaceAll('"', '\\"')}"\n`;
  // Insert before the closing `---` of the frontmatter block.
  const match = raw.match(/^---\r?\n([\s\S]*?)^---\r?\n/m);
  if (!match) throw new Error(`frontmatter not found in ${file}`);
  const withMember = `${match[1]}${member}`.replace(/\n$/, '\n');
  fs.writeFileSync(file, raw.replace(match[1], withMember));
  console.log(`${collection}: added ${slug}`);
}
