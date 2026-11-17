import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';

const root = fileURLToPath(new URL('./', import.meta.url));
const staticConfig = readFileSync(new URL('./browser/vercel-static.json', import.meta.url), 'utf8');
const previewHeaders = Object.fromEntries(JSON.parse(staticConfig).headers[0].headers.map((item: { key: string; value: string }) => [item.key, item.value]));

export default defineConfig({
  root: `${root}browser`,
  publicDir: `${root}public`,
  envDir: false,
  resolve: { alias: { '@': root } },
  define: { __NEXO_BROWSER_DEMO__: 'true' },
  plugins: [react(), {
    name: 'nexo-vercel-static-config',
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'vercel.json', source: staticConfig });
      this.emitFile({ type: 'asset', fileName: 'robots.txt', source: 'User-agent: *\nDisallow: /relato\nDisallow: /painel\nSitemap: https://aps-nexo.vercel.app/sitemap.xml\n' });
      this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://aps-nexo.vercel.app/</loc></url></urlset>' });
    },
  }],
  server: { host: '127.0.0.1', port: 5180, strictPort: true },
  preview: { host: '127.0.0.1', port: 5180, strictPort: true, headers: previewHeaders },
  build: { outDir: `${root}dist/browser`, emptyOutDir: false, sourcemap: false, target: 'es2022', manifest: true },
});
