// Copies the library that reads PDF files (pdfjs-dist) to public/vendor/pdfjs, where the Documents page
// fetches it from only when somebody chooses a PDF. It is served by this site itself: nothing is loaded
// from another address at run time.
import { copyFileSync, cpSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const from = path.dirname(require.resolve('pdfjs-dist/package.json'));
const to = path.join(here, '..', '..', 'public', 'vendor', 'pdfjs');
mkdirSync(to, { recursive: true });
for (const file of ['pdf.min.mjs', 'pdf.worker.min.mjs']) copyFileSync(path.join(from, 'build', file), path.join(to, file));
copyFileSync(path.join(from, 'LICENSE'), path.join(to, 'LICENSE'));
// Fonts a PDF may name without carrying them (their own licences are in the folder), and the decoders of the
// compressed pictures inside scanned PDFs.
for (const dir of ['standard_fonts', 'wasm']) cpSync(path.join(from, dir), path.join(to, dir), { recursive: true });
const { version } = JSON.parse(readFileSync(path.join(from, 'package.json'), 'utf8'));
writeFileSync(path.join(to, 'VERSION'), `pdfjs-dist ${version}\n`);
console.log(`pdfjs-dist ${version} copied to public/vendor/pdfjs`);
