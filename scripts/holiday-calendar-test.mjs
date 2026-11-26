import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

process.env.TZ = 'America/New_York';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const vite = await createServer({
  configFile: path.join(root, 'vite.config.ts'),
  root,
  server: { middlewareMode: true },
  appType: 'custom',
  optimizeDeps: { noDiscovery: true },
  logLevel: 'error',
});

try {
  await vite.ssrLoadModule('/src/theme/holidayCalendar.test.ts');
} finally {
  await vite.close();
}
