#!/usr/bin/env node
/**
 * Refresh scripts/connector-tools.snapshot.json — the pinned tool names that
 * scripts/check-connector-tools.mjs checks plugin docs against.
 *
 * For every WYRE-hosted connector in connectors.json it pulls the published
 * container image (no Docker needed: `crane export`), starts the server over
 * stdio with dummy credentials, and records `tools/list`. Progressive-
 * disclosure servers (`*_navigate`) are walked domain by domain. Listing tools
 * never calls the vendor API, so no real credentials are involved.
 *
 * Some servers only list part of their surface at runtime (opt-in or
 * tier-gated tools, HTTP-only bridges). Pass --servers <dir> with checkouts of
 * the WYRE-AI/*-mcp repos to also add `name: '<prefix>_...'` literals from
 * their src/. Names already in the snapshot from other sources are kept unless
 * --replace is given, so a failed probe never empties a connector.
 *
 * Requires: node >= 20, crane (https://github.com/google/go-containerregistry),
 * public GHCR images. Each image is extracted to a temp dir and deleted.
 *
 * Usage:
 *   node scripts/refresh-connector-tools.mjs                 # all, pinned digests
 *   node scripts/refresh-connector-tools.mjs --only cipp,hudu
 *   node scripts/refresh-connector-tools.mjs --latest        # probe :latest, record its digest
 *   node scripts/refresh-connector-tools.mjs --servers ~/mcp # also scan source
 *   node scripts/refresh-connector-tools.mjs --replace       # drop names not seen this run
 */

import { execFileSync, spawn } from 'node:child_process';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SNAP = path.join(ROOT, 'scripts', 'connector-tools.snapshot.json');
const mapping = JSON.parse(fs.readFileSync(path.join(ROOT, 'connectors.json'), 'utf8'));
const snapshot = JSON.parse(fs.readFileSync(SNAP, 'utf8'));
const arg = (f) => { const i = process.argv.indexOf(f); return i === -1 ? null : process.argv[i + 1]; };
const ONLY = arg('--only')?.split(',');
const SERVERS = arg('--servers');
const LATEST = process.argv.includes('--latest');
const REPLACE = process.argv.includes('--replace');
const TOOLISH = /^[a-z][a-z0-9]*(?:_[a-z0-9]+)+$/;

function rmrf(dir) {
  try { execFileSync('chmod', ['-R', 'u+w', dir]); } catch {}
  fs.rmSync(dir, { recursive: true, force: true });
}

function extract(ref, dir) {
  // crane export | tar, keeping only /app (where every fleet image puts the server).
  execFileSync('bash', ['-o', 'pipefail', '-c',
    `crane export --platform linux/amd64 "$REF" - | tar -x -C "$DIR" --wildcards 'app/*'`],
    { env: { ...process.env, REF: ref, DIR: dir }, stdio: ['ignore', 'ignore', 'pipe'], timeout: 300_000 });
}

function fakeEnv(slug) {
  const env = { PATH: process.env.PATH, HOME: os.tmpdir(), NODE_ENV: 'production',
    MCP_TRANSPORT: 'stdio', TRANSPORT: 'stdio', AUTH_MODE: 'env' };
  const suffixes = ['API_KEY', 'APIKEY', 'API_TOKEN', 'TOKEN', 'SECRET', 'CLIENT_ID', 'CLIENT_SECRET',
    'USERNAME', 'USER', 'PASSWORD', 'ACCOUNT_ID', 'ORG_ID', 'ORGANIZATION_ID', 'TENANT_ID', 'SUBDOMAIN',
    'DOMAIN', 'BASE_URL', 'URL', 'REGION', 'INTEGRATION_CODE', 'PARTNER_ID', 'COMPANY_ID', 'SITE_ID',
    'INSTANCE', 'HOST', 'EMAIL', 'KEY', 'ID', 'API_SECRET', 'ACCESS_KEY', 'SECRET_KEY', 'PUBLIC_KEY',
    'PRIVATE_KEY', 'SERVER', 'API_URL', 'INSTANCE_URL'];
  const p = slug.replace(/-/g, '_').toUpperCase();
  env[p] = 'probe-dummy-value';
  for (const s of suffixes) env[`${p}_${s}`] = /URL|HOST|SERVER/.test(s) ? 'https://example.invalid' : 'probe-dummy-value';
  return env;
}

function probe(appDir, slug) {
  return new Promise((resolve) => {
    const child = spawn('node', ['dist/index.js'], { cwd: appDir, env: fakeEnv(slug), stdio: ['pipe', 'pipe', 'pipe'] });
    const all = new Set(); const pending = new Map(); let buf = ''; let err = ''; let done = false; let id = 1;
    const finish = (reason) => { if (done) return; done = true; child.kill('SIGKILL'); resolve({ tools: [...all].sort(), reason, stderr: err.slice(-300) }); };
    const timer = setTimeout(() => finish('timeout'), 25_000);
    child.on('exit', (c) => setTimeout(() => finish(`exited ${c}`), 200));
    child.stderr.on('data', (d) => { err += d; });
    child.stdout.on('data', (d) => {
      buf += d; let i;
      while ((i = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, i); buf = buf.slice(i + 1);
        let m; try { m = JSON.parse(line); } catch { continue; }
        if (m.id != null && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
      }
    });
    const rpc = (method, params) => new Promise((r) => { const n = id++; pending.set(n, r); child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id: n, method, params }) + '\n'); });
    (async () => {
      const init = await rpc('initialize', { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'refresh-connector-tools', version: '1' } });
      if (!init.result) return finish('initialize failed');
      child.stdin.write(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) + '\n');
      const list = await rpc('tools/list', {});
      const tools = list.result?.tools ?? [];
      tools.forEach((t) => all.add(t.name));
      const nav = tools.find((t) => /_navigate$/.test(t.name));
      if (nav) {
        const props = nav.inputSchema?.properties ?? {};
        const key = Object.keys(props).find((k) => Array.isArray(props[k].enum));
        for (const v of key ? props[key].enum : []) {
          await rpc('tools/call', { name: nav.name, arguments: { [key]: v } });
          ((await rpc('tools/list', {})).result?.tools ?? []).forEach((t) => all.add(t.name));
          const back = [...all].find((n) => /_back$/.test(n));
          if (back) await rpc('tools/call', { name: back, arguments: {} });
        }
      }
      clearTimeout(timer);
      finish(list.result ? null : 'tools/list failed');
    })();
  });
}

function staticNames(repo, known) {
  const src = path.join(SERVERS, repo, 'src');
  if (!fs.existsSync(src)) return [];
  const prefixes = new Set(known.filter((t) => TOOLISH.test(t)).map((t) => t.split('_')[0] + '_'));
  const out = new Set();
  const walk = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) { if (!['__tests__', 'node_modules', 'test', 'tests'].includes(e.name)) walk(p); continue; }
      if (!/\.(ts|js|mjs)$/.test(e.name) || /\.test\./.test(e.name)) continue;
      for (const m of fs.readFileSync(p, 'utf8').matchAll(/name:\s*['"]([a-z][a-z0-9]*(?:_[a-z0-9]+)+)['"]/g)) {
        if ([...prefixes].some((x) => m[1].startsWith(x))) out.add(m[1]);
      }
    }
  };
  walk(src);
  return [...out];
}

const failures = [];
for (const c of mapping.connectors) {
  if (c.kind !== 'wyre-hosted' || !c.image) continue;
  if (ONLY && !ONLY.includes(c.slug)) continue;
  const entry = snapshot.connectors[c.slug] ?? (snapshot.connectors[c.slug] = { image: null, sources: [], tools: null });
  let ref = LATEST || !entry.image ? `${c.image}:latest` : entry.image;
  if (LATEST) {
    try { ref = `${c.image}@${execFileSync('crane', ['digest', `${c.image}:latest`], { encoding: 'utf8' }).trim()}`; }
    catch { failures.push(`${c.slug}: cannot resolve ${c.image}:latest (private package?)`); continue; }
  }
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), `cnt-${c.slug}-`));
  let res = { tools: [], reason: 'not probed' };
  try {
    extract(ref, tmp);
    const app = path.join(tmp, 'app');
    res = fs.existsSync(path.join(app, 'dist', 'index.js')) ? await probe(app, c.slug) : { tools: [], reason: 'no app/dist/index.js in image' };
  } catch (e) { res = { tools: [], reason: `extract failed: ${String(e.stderr ?? e.message).slice(0, 200)}` }; }
  finally { rmrf(tmp); }

  const keep = REPLACE ? [] : (entry.tools ?? []);
  const names = new Set([...keep, ...res.tools]);
  const sources = new Set(REPLACE ? [] : entry.sources);
  if (res.tools.length) sources.add('runtime');
  if (SERVERS && c.repo?.startsWith('WYRE-AI/')) {
    const extra = staticNames(c.repo.split('/')[1], [...names]);
    if (extra.some((n) => !names.has(n))) sources.add('static');
    extra.forEach((n) => names.add(n));
  }
  entry.image = ref; entry.sources = [...sources]; entry.tools = names.size ? [...names].sort() : null;
  console.log(`${c.slug.padEnd(28)} ${String(res.tools.length).padStart(4)} runtime, ${String(names.size).padStart(4)} total${res.reason ? `  (${res.reason})` : ''}`);
  if (!res.tools.length) failures.push(`${c.slug}: ${res.reason}`);
}

snapshot.generatedAt = new Date().toISOString().slice(0, 10);
fs.writeFileSync(SNAP, JSON.stringify(snapshot, null, 2) + '\n');
if (failures.length) console.log(`\n${failures.length} connector(s) without a runtime list (kept previous names):\n  ${failures.join('\n  ')}`);
console.log('\nNow run: node scripts/check-connector-tools.mjs');
