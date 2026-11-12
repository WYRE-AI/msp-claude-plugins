#!/usr/bin/env node
/**
 * Plugin <-> connector check for msp-claude-plugins.
 *
 * Ties every plugin to the Conduit connector(s) it documents, and every
 * documented tool name to that connector's published tool list. Offline:
 * it reads two committed files and the plugin markdown, nothing else.
 *
 *   connectors.json                       plugin -> connector mapping, and the
 *                                         list of connectors WYRE ships
 *   scripts/connector-tools.snapshot.json pinned tool names per connector,
 *                                         refreshed by refresh-connector-tools.mjs
 *
 * FAILS WHEN
 *   1. A marketplace plugin has no entry in connectors.json `plugins`, or its
 *      entry lists no connector, or names a connector that is not defined.
 *   2. A connectors.json plugin entry names a plugin the marketplace lacks.
 *   3. A plugin's markdown names a tool (a backticked lower_snake_case token,
 *      `mcp__server__tool` unwrapped) that starts with a known connector tool
 *      prefix but is missing from that connector's snapshot. Prefix ownership:
 *      a plugin's own connectors first; for multi-vendor plugins (packs, shared
 *      skills, the gateway plugin) every connector's prefixes apply.
 *   4. A connector's `plugins` list disagrees with the plugin entries.
 *   5. The generated connector/plugin tables in README.md are stale.
 *
 * DOES NOT FAIL ON
 *   Connectors whose snapshot is `tools: null` (vendor-hosted servers that need
 *   a live sign-in to list tools). They are reported as unverified.
 *   Tokens listed in a plugin entry's `ignoreTools` (with a reason), for docs
 *   that deliberately name a tool that does not exist ("there is no X tool").
 *
 * Usage:
 *   node scripts/check-connector-tools.mjs            # check
 *   node scripts/check-connector-tools.mjs --verbose  # also list unverified plugins
 *   node scripts/check-connector-tools.mjs --write-readme  # regenerate README tables
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));
const marketplace = read('.claude-plugin/marketplace.json');
const mapping = read('connectors.json');
const snapshot = read('scripts/connector-tools.snapshot.json');
const VERBOSE = process.argv.includes('--verbose');

const TOOLISH = /^[a-z][a-z0-9]*(?:_[a-z0-9]+)+$/;
// Leading segments too generic to claim a token for a connector on their own
// (IT Glue's tools are unprefixed: search_documents, get_password, ...).
const GENERIC = new Set(['get', 'list', 'search', 'create', 'update', 'delete', 'archive',
  'unarchive', 'publish', 'add', 'remove', 'set', 'run', 'find', 'query', 'test', 'check']);

const errors = [];
const unverified = [];

const connectors = new Map(mapping.connectors.map((c) => [c.slug, c]));
const toolsOf = (slug) => snapshot.connectors?.[slug]?.tools ?? null;

// Prefixes per connector. A connector is "prefixed" when one non-generic
// leading segment covers at least half its tools (autotask_*, hec_*, kpn_*);
// only that segment claims tokens, so a stray param like `start_date` or
// `cve_id` is never mistaken for a tool. An unprefixed connector (IT Glue's
// search_documents, Rootly's list_incidents) is checked on generic verbs, and
// only for plugins mapped to it directly.
function prefixInfo(slug) {
  const tools = (toolsOf(slug) ?? []).filter((t) => TOOLISH.test(t));
  const counts = new Map();
  for (const t of tools) { const s = t.split('_')[0]; counts.set(s, (counts.get(s) ?? 0) + 1); }
  const own = [...counts].filter(([s, n]) => !GENERIC.has(s) && n * 2 >= tools.length).map(([s]) => s);
  const generic = [...counts.keys()].filter((s) => GENERIC.has(s));
  return { own, generic };
}
const prefixCache = new Map();
const info = (slug) => {
  if (!prefixCache.has(slug)) prefixCache.set(slug, prefixInfo(slug));
  return prefixCache.get(slug);
};
const prefixes = (slug) => info(slug).own;
const directPrefixes = (slug) => (info(slug).own.length ? info(slug).own : info(slug).generic);

function walk(dir, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (!['node_modules', '.git'].includes(e.name)) walk(p, acc); }
    else if (e.name.endsWith('.md')) acc.push(p);
  }
  return acc;
}

function tokensIn(file) {
  const out = [];
  fs.readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
    for (const m of line.matchAll(/`([^`\s]+)`/g)) {
      let t = m[1].replace(/\(\)$/, '');
      const ns = t.match(/^mcp__[a-z0-9-]+__(.+)$/);
      if (ns) t = ns[1];
      if (TOOLISH.test(t)) out.push({ t, line: i + 1 });
    }
  });
  return out;
}

// ── Rules 1, 2, 4: mapping completeness ──────────────────────────────────
const mpNames = new Set(marketplace.plugins.map((p) => p.name));
const claimed = new Map(); // connector -> plugins naming it
for (const p of marketplace.plugins) {
  const entry = mapping.plugins?.[p.name];
  if (!entry) { errors.push(`${p.name}: no entry in connectors.json "plugins" (map it to a connector, or to "conduit" for multi-vendor plugins)`); continue; }
  if (!Array.isArray(entry.connectors) || entry.connectors.length === 0) { errors.push(`${p.name}: connectors.json entry lists no connector`); continue; }
  for (const c of entry.connectors) {
    if (!connectors.has(c)) errors.push(`${p.name}: maps to "${c}", which connectors.json does not define`);
    if (!claimed.has(c)) claimed.set(c, new Set());
    claimed.get(c).add(p.name);
  }
}
for (const name of Object.keys(mapping.plugins ?? {})) {
  if (!mpNames.has(name)) errors.push(`connectors.json maps plugin "${name}", which is not in marketplace.json`);
}
for (const c of connectors.values()) {
  const want = [...(claimed.get(c.slug) ?? [])].sort().join(',');
  const have = [...(c.plugins ?? [])].sort().join(',');
  if (want !== have) errors.push(`connectors.json: connector "${c.slug}" lists plugins [${have}] but plugin entries give [${want}]`);
  if (!(c.slug in (snapshot.connectors ?? {}))) errors.push(`connector "${c.slug}" has no entry in scripts/connector-tools.snapshot.json (run refresh-connector-tools.mjs)`);
}

// ── Rule 3: documented tool names exist ──────────────────────────────────
const allSlugs = [...connectors.keys()];
const MULTI = new Set(['gateway']);
let checkedTokens = 0;
for (const p of marketplace.plugins) {
  const entry = mapping.plugins?.[p.name];
  if (!entry?.connectors?.length) continue;
  const dir = path.join(ROOT, p.source.replace(/^\.\//, ''));
  if (!fs.existsSync(dir)) continue; // reported by check-doc-references.mjs
  const multi = entry.connectors.some((c) => MULTI.has(connectors.get(c)?.kind));
  const ignore = new Set((entry.ignoreTools ?? []).map((x) => (typeof x === 'string' ? x : x.name)));

  // prefix -> union of tool names across the connectors owning it
  const owners = new Map();
  const own = (slug, list) => {
    const tools = toolsOf(slug);
    if (!tools) return;
    for (const pre of list) {
      if (!owners.has(pre)) owners.set(pre, new Set());
      for (const t of tools) owners.get(pre).add(t);
    }
  };
  for (const c of entry.connectors) own(c, directPrefixes(c));
  if (multi) for (const c of allSlugs) own(c, prefixes(c));
  const ownedHere = new Set(owners.keys());

  const unverifiable = entry.connectors.filter((c) => toolsOf(c) === null);
  if (unverifiable.length && !multi) unverified.push(`${p.name} (${unverifiable.join(', ')})`);

  const bad = new Map();
  for (const f of walk(dir)) {
    for (const { t, line } of tokensIn(f)) {
      const pre = t.split('_')[0];
      if (!ownedHere.has(pre) || ignore.has(t)) continue;
      checkedTokens++;
      if (owners.get(pre).has(t)) continue;
      if (!bad.has(t)) bad.set(t, []);
      bad.get(t).push(`${path.relative(dir, f)}:${line}`);
    }
  }
  for (const [t, sites] of bad) {
    errors.push(`${p.name}: \`${t}\` is not a tool on ${entry.connectors.join('/')} (snapshot) — ${sites.slice(0, 3).join(', ')}${sites.length > 3 ? ` +${sites.length - 3} more` : ''}`);
  }
}


// ── README tables (generated from connectors.json + marketplace.json) ────
// README.md carries two generated blocks between marker comments. The check
// fails when they drift; `--write-readme` rewrites them.
function cell(s) { return String(s ?? '').replace(/\|/g, '\\|').replace(/\s+/g, ' ').trim(); }
function shortDesc(p) {
  let d = p.description ?? '';
  d = d.replace(/^.{1,60}?\s[-–—:]\s+/, ''); // drop the leading "Vendor - " label
  return d.length > 110 ? d.slice(0, 107).replace(/[ ,;]+\S*$/, '') + '...' : d;
}
function readmeBlocks() {
  const byName = new Map(marketplace.plugins.map((p) => [p.name, p]));
  const link = (p) => `[\`${p.name}\`](${p.source.replace(/^\.\//, '')})`;
  const src = (c) => {
    if (c.kind === 'wyre-hosted') {
      if (!c.repo) return 'WYRE-hosted';
      return c.repoPublic ? `[${c.repo.split('/')[1]}](https://github.com/${c.repo})` : `${c.repo.split('/')[1]} (source not public yet)`;
    }
    if (c.kind === 'vendor-hosted') return "Vendor's own MCP, via Conduit";
    if (c.kind === 'vendor-direct') return "Vendor's own MCP (not in Conduit)";
    return '';
  };
  const rows = mapping.connectors
    .filter((c) => c.kind !== 'gateway' && (c.kind === 'wyre-hosted' || (c.plugins ?? []).length))
    .sort((a, b) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }));
  const conn = ['| Vendor | Plugin | What the plugin covers | Connector |', '|---|---|---|---|'];
  for (const c of rows) {
    const ps = (c.plugins ?? []).map((n) => byName.get(n)).filter(Boolean);
    const plugin = ps.length ? ps.map(link).join(', ') : 'no plugin yet';
    const what = ps.length ? cell(ps.map(shortDesc).join(' / ')) : '';
    conn.push(`| ${cell(c.name)} | ${plugin} | ${what} | ${src(c)} |`);
  }
  const multi = ['| Plugin | What it does |', '|---|---|'];
  for (const p of [...marketplace.plugins].sort((a, b) => a.name.localeCompare(b.name))) {
    const e = mapping.plugins?.[p.name];
    if (!e?.connectors?.includes('conduit')) continue;
    multi.push(`| ${link(p)} | ${cell(p.description)} |`);
  }
  return { CONNECTORS: conn.join('\n'), PACKS: multi.join('\n') };
}
{
  const readmePath = path.join(ROOT, 'README.md');
  let readme = fs.readFileSync(readmePath, 'utf8');
  const blocks = readmeBlocks();
  let next = readme;
  for (const [k, v] of Object.entries(blocks)) {
    const re = new RegExp(`(<!-- ${k}:START[^>]*-->)[\\s\\S]*?(<!-- ${k}:END -->)`);
    if (!re.test(next)) { errors.push(`README.md: missing <!-- ${k}:START --> / <!-- ${k}:END --> block`); continue; }
    next = next.replace(re, (_, a, b) => `${a}\n${v}\n${b}`);
  }
  if (process.argv.includes('--write-readme')) {
    if (next !== readme) fs.writeFileSync(readmePath, next);
    console.log('README.md tables written');
  } else if (next !== readme) {
    errors.push('README.md: connector/plugin tables are out of date (run node scripts/check-connector-tools.mjs --write-readme)');
  }
}

// ── Report ───────────────────────────────────────────────────────────────
const wyre = mapping.connectors.filter((c) => c.kind === 'wyre-hosted');
const mapped = wyre.filter((c) => (c.plugins ?? []).length);
console.log(`connectors: ${wyre.length} WYRE-hosted (${mapped.length} with a plugin, ${wyre.length - mapped.length} without), ${mapping.connectors.length - wyre.length} other`);
console.log(`plugins: ${marketplace.plugins.length} mapped-checked, ${checkedTokens} tool references checked against the snapshot`);
if (unverified.length) {
  console.log(`unverified: ${unverified.length} plugin(s) use a connector with no offline tool list${VERBOSE ? ':\n  ' + unverified.join('\n  ') : ' (--verbose to list)'}`);
}
if (errors.length) {
  console.error(`\n${errors.length} problem(s):`);
  for (const e of errors) console.error(`  - ${e}`);
  console.error('\nFix the doc, map the plugin in connectors.json, or refresh the snapshot: node scripts/refresh-connector-tools.mjs');
  process.exit(1);
}
console.log('OK');
