#!/usr/bin/env node
import { parse } from 'parse5';
import { readFile, readdir } from 'node:fs/promises';
import { join, relative } from 'node:path';

const dist = join(process.cwd(), 'dist');
const files = [];
async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) await walk(path);
    else if (entry.name.endsWith('.html')) files.push(path);
  }
}
await walk(dist);

// These are inline prose elements where an Astro line break is not guaranteed
// to emit a text-space node. Layout spans/buttons are deliberately excluded:
// their parent flex/grid gap supplies visual separation.
const inlineProse = new Set(['a', 'code', 'em', 'strong', 'b', 'i', 'mark']);
const ignoredParagraphClasses = new Set(['ma-card__links', 'daily-slot__actions']);
const wordAtEnd = /[\p{L}\p{N}]$/u;
const wordAtStart = /^[\p{L}\p{N}]/u;
const failures = [];

function attr(node, name) {
  return node.attrs?.find((item) => item.name === name)?.value ?? '';
}

function text(node) {
  if (node.nodeName === '#text') return node.value;
  return (node.childNodes ?? []).map(text).join('');
}

function inspect(node, file) {
  if (node.tagName === 'p') {
    const classes = attr(node, 'class').split(/\s+/);
    if (!classes.some((name) => ignoredParagraphClasses.has(name))) {
      const children = node.childNodes ?? [];
      for (let index = 0; index < children.length - 1; index += 1) {
        const leftNode = children[index];
        const rightNode = children[index + 1];
        if (!inlineProse.has(leftNode.tagName) && !inlineProse.has(rightNode.tagName)) continue;
        const left = text(leftNode);
        const right = text(rightNode);
        if (!left || !right || !wordAtEnd.test(left) || !wordAtStart.test(right)) continue;
        const excerpt = text(node).replace(/\s+/g, ' ').trim().slice(0, 180);
        failures.push(`${relative(dist, file)}: joins “${left.slice(-24)}” and “${right.slice(0, 24)}” without whitespace (${excerpt})`);
      }
    }
  }
  for (const child of node.childNodes ?? []) inspect(child, file);
}

for (const file of files) inspect(parse(await readFile(file, 'utf8')), file);

if (failures.length) {
  console.error(`Rendered prose spacing audit failed (${failures.length} joined boundaries):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log(`Rendered prose spacing audit passed for ${files.length} HTML files.`);
}
