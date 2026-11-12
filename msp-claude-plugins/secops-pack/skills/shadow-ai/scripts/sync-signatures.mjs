#!/usr/bin/env node
// Dependency-free canonical TSV -> standalone endpoint scripts.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const dir = path.dirname(fileURLToPath(import.meta.url));
const tsv = fs.readFileSync(path.join(dir, 'signatures.tsv'), 'utf8').trimEnd();
const rows = tsv.split('\n').map(x => x.split('\t'));
for (const [i, r] of rows.entries()) {
  if (r.length !== 10 || (i && (!/^[a-z][a-z0-9]*$/.test(r[0]) || !['win','mac','lin'].includes(r[4])))) throw Error(`Invalid signature row ${i+1}`);
}
if (rows[0].join(',') !== 'id,product,vendor,category,os,scope,kind,pattern,confidence,notes') throw Error('Invalid TSV header');
const products = new Map();
for (const r of rows.slice(1)) {
  if (!['m','u'].includes(r[5]) || !['high','review'].includes(r[8]) ||
      !['desktop','ide-ext','browser-ext','cli','local-llm'].includes(r[3]) ||
      !['path','uninstall','appx','package','vscode','jetbrains','manifest','pwa','shortcut'].includes(r[6])) throw Error(`Invalid schema: ${r[0]}`);
  if (['path','vscode','jetbrains'].includes(r[6]) && (r[7].startsWith('/') || r[7].split('/').includes('..') || /[\\$`]/.test(r[7]))) throw Error(`Unsafe path: ${r[0]}`);
  if (products.has(r[0]) && products.get(r[0]) !== r[1]) throw Error(`ID maps to different products: ${r[0]}`);
  products.set(r[0],r[1]);
}
let failed = false;
for (const file of ['Detect-ShadowAI.ps1','detect-shadow-ai-macos.sh','detect-shadow-ai-linux.sh']) {
  const p = path.join(dir,file);
  const old = fs.readFileSync(p,'utf8');
  const block = file.endsWith('.ps1') ? `# BEGIN SAI SIGNATURES\n$SignatureData = @'\n${tsv}\n'@\n# END SAI SIGNATURES` : `# BEGIN SAI SIGNATURES\nSIGNATURES=$(cat <<'SAI_SIGNATURES'\n${tsv}\nSAI_SIGNATURES\n)\n# END SAI SIGNATURES`;
  const updated = old.replace(/# BEGIN SAI SIGNATURES\n[\s\S]*?# END SAI SIGNATURES/, () => block);
  if ((old.match(/# BEGIN SAI SIGNATURES/g) || []).length !== 1 || (old.match(/# END SAI SIGNATURES/g) || []).length !== 1 || !/# BEGIN SAI SIGNATURES\n[\s\S]*?# END SAI SIGNATURES/.test(old)) throw Error(`Invalid markers: ${file}`);
  if (process.argv.includes('--check')) { if (old !== updated) { console.error(`Stale signatures: ${file}`); failed=true; } }
  else fs.writeFileSync(p,updated);
}
if (failed) process.exit(1);
console.log(process.argv.includes('--check') ? 'Embedded signatures match canonical TSV.' : 'Embedded signatures regenerated.');
