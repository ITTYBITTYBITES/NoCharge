import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://nocharge.net',
  output: 'static',
  build: {
    format: 'directory',
  },
  vite: {
    server: {
      host: true,
      allowedHosts: true,
    },
    preview: {
      host: true,
      allowedHosts: true,
    },
  },
});
