import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = fileURLToPath(new URL('../', import.meta.url));
const html = await readFile(path.join(root, 'src/index.html'), 'utf8');
if ((html.match(/<h1[ >]/g) || []).length !== 1) throw new Error('A página precisa de exatamente um h1.');
if (!html.includes('Nexo | Triagem jurídica inteligente')) throw new Error('Título ausente.');
const output = path.join(root, 'dist');
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await cp(path.join(root, 'src'), output, {
  recursive: true,
  filter: source => !source.endsWith('.js'),
});
await build({
  entryPoints: [path.join(root, 'src/app.js')],
  outfile: path.join(output, 'app.js'),
  bundle: true,
  minify: true,
  format: 'esm',
  target: ['es2020'],
  legalComments: 'eof',
});
const notices = await Promise.all(['framer-motion', 'motion-dom', 'motion-utils'].map(async name => {
  const license = await readFile(path.join(root, 'node_modules', name, 'LICENSE.md'), 'utf8');
  return `${name}\n${license}`;
}));
await writeFile(path.join(output, 'third-party-licenses.txt'), notices.join('\n\n'));
console.log('PASS: build estático em dist/; Framer Motion incluído no JavaScript local.');
