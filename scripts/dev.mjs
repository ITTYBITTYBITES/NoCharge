import { createServer } from 'vite';

const startedAt = performance.now();
const server = await createServer({
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: false,
    open: false,
  },
});

await server.listen();
server.printUrls();
console.log(`[NoCharge] Development server ready in ${(performance.now() - startedAt).toFixed(0)}ms`);

const close = async () => {
  await server.close();
  process.exit(0);
};
process.once('SIGINT', close);
process.once('SIGTERM', close);
