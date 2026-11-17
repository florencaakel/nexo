import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const root = fileURLToPath(new URL('../', import.meta.url));
const built = join(root, 'dist/browser');
const manifest = JSON.parse(readFileSync(join(built, '.vite/manifest.json'), 'utf8'));
const selected = new Set(['index.html', 'robots.txt', 'sitemap.xml', 'vercel.json']);
for (const chunk of Object.values(manifest)) {
  selected.add(chunk.file);
  for (const file of [...(chunk.css || []), ...(chunk.assets || [])]) selected.add(file);
}
// Only tracked public files and current build assets enter the upload candidate.
// Never enumerate/read environment files created by a hosting CLI in dist.
for (const tracked of execFileSync('git', ['ls-files', '-z', 'public'], { cwd: root, encoding: 'utf8' }).split('\0').filter(Boolean)) {
  selected.add(tracked.slice('public/'.length));
}
for (const name of selected) {
  if (typeof name !== 'string' || name.split('/').some(part => part.startsWith('.') || part === 'node_modules') || !resolve(built, name).startsWith(`${built}/`) || !existsSync(join(built, name))) {
    throw new Error('O pacote contém um caminho não permitido ou arquivo ausente.');
  }
}
const outputs = join(root, 'outputs'); mkdirSync(outputs, { recursive: true });
const destination = mkdtempSync(join(outputs, 'nexo-vercel-'));
for (const name of selected) {
  const target = join(destination, name); mkdirSync(dirname(target), { recursive: true }); copyFileSync(join(built, name), target);
}
console.log(JSON.stringify({ directory: destination, files: selected.size, sourceCommit: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim() }));
