// Actualiza en sw.js la lista de archivos a guardar sin conexión y su versión.
// La versión es un hash del contenido: cada cambio en la app genera una versión nueva,
// y los dispositivos instalados se actualizan solos la próxima vez que abran la app.
// Uso (después de cada cambio): node tools/build-sw.mjs
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const ROOT_FILES = ['index.html', 'manifest.webmanifest'];
const DIRS = ['css', 'js', 'icons'];

const walk = dir => readdirSync(dir).flatMap(name => {
  const p = join(dir, name);
  return statSync(p).isDirectory() ? walk(p) : [p];
});

const files = [...ROOT_FILES.map(f => join(ROOT, f)), ...DIRS.flatMap(d => walk(join(ROOT, d)))]
  .map(p => relative(ROOT, p).split(sep).join('/'))
  .sort();

const hash = createHash('sha256');
for (const f of files) hash.update(f).update(readFileSync(join(ROOT, f)));
const version = hash.digest('hex').slice(0, 8);

const swPath = join(ROOT, 'sw.js');
const sw = readFileSync(swPath, 'utf8')
  .replace(/const VERSION = '.*?';/, `const VERSION = '${version}';`)
  .replace(/const PRECACHE = \[[\s\S]*?\];/, `const PRECACHE = [\n  './',\n${files.map(f => `  './${f}',`).join('\n')}\n];`);
writeFileSync(swPath, sw);
console.log(`sw.js actualizado: versión ${version}, ${files.length + 1} archivos`);
