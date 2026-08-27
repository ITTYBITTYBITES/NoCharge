#!/usr/bin/env node

import { execFileSync } from 'node:child_process';

if (process.env.CI === 'true') {
  const message = execFileSync('git', ['log', '-1', '--pretty=%B'], { encoding: 'utf8' });
  const bypass = message.match(/\[(?:skip e2e|skip checks)\]/i);
  if (bypass) {
    throw new Error(`${bypass[0]} is no longer allowed. The phases 2–5 integration is complete and the full CI gate is required.`);
  }
}

console.log('CI bypass policy passed.');
