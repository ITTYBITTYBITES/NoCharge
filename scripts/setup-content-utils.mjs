import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';

export async function publishedSetupSlugs(root = process.cwd()) {
  const directory = join(root, 'src', 'content', 'setup');
  const files = (await readdir(directory)).filter((file) => file.endsWith('.md')).sort();
  const slugs = [];
  for (const file of files) {
    const text = await readFile(join(directory, file), 'utf8');
    const frontmatter = text.replace(/^---\n/, '').split('\n---\n', 1)[0];
    if (!/^draft:\s*true$/m.test(frontmatter)) slugs.push(file.replace(/\.md$/, ''));
  }
  return slugs;
}
