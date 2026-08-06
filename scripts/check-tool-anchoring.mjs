#!/usr/bin/env node
/**
 * Un-anchored documentation detector for msp-claude-plugins.
 *
 * `scripts/tool-drift-audit.mjs` compares the tool names a plugin *names*
 * against the tool names its server registers. Documentation that names no
 * tool at all is therefore invisible to it: DRIFT 0 means "no named tool is
 * wrong", not "correct".
 *
 * checkpoint-avanan proved the gap. Its four commands named zero MCP tools and
 * passed every check while documenting a REST API that does not exist
 * (`GET /v1.0/threats`, `POST /v1.0/quarantine/release`) and flags encoding
 * capabilities the product lacks (`--allow-list`, `--notify`). See #204.
 *
 * WHAT THIS FLAGS
 *   A skill, agent or command that carries operation evidence — an HTTP verb
 *   plus a path, or a CLI-style `--flag` — while naming zero MCP tools.
 *   Tool names are backticked lower_snake_case tokens, the same shape
 *   tool-drift-audit.mjs extracts, so the two checks agree on what "names a
 *   tool" means.
 *
 * WHAT THIS CANNOT FLAG
 *   Whether an un-anchored REST recipe is *true*. Syncro's commands document
 *   Syncro's real REST API; checkpoint-avanan's documented a fiction. Nothing
 *   in the text distinguishes them — that needs vendor ground truth, which is
 *   what tool-drift-audit.mjs is for, and it needs the sibling *-mcp checkouts
 *   CI does not have.
 *
 * RATCHET, NOT A CLIFF
 *   158 units were already un-anchored when this check was written. Rewriting
 *   them needs per-vendor ground truth, so they are inventoried in
 *   scripts/unanchored-docs.json with the evidence line that put them there.
 *   The check fails on any unit NOT in the inventory (no new un-anchored docs)
 *   and on any inventory entry that is stale — unit gone, or now naming tools —
 *   so the file cannot rot and the debt can only shrink.
 *
 * Usage:
 *   node scripts/check-tool-anchoring.mjs
 *   node scripts/check-tool-anchoring.mjs --update   # rewrite the inventory
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MARKETPLACE_PATH = path.join(REPO_ROOT, '.claude-plugin', 'marketplace.json');
const INVENTORY_PATH = path.join(REPO_ROOT, 'scripts', 'unanchored-docs.json');
const UPDATE = process.argv.includes('--update');

// Same shape tool-drift-audit.mjs treats as a tool name.
const TOOLISH = /^[a-z][a-z0-9]*(?:_[a-z0-9]+)+$/;
// An HTTP verb followed by a path: `GET /v1.0/threats`, `POST /api/v1/tickets`.
const HTTP = /(?:^|[\s`(|>])(GET|POST|PUT|PATCH|DELETE)\s+(\/[A-Za-z0-9._~\-/{}<>:*]+)/;
// A CLI-style long flag: `--allow-list`, `--severity`.
const FLAG = /(?:^|[\s`("'])(--[a-z][a-z0-9]*(?:-[a-z0-9]+)*)\b/;

function walk(dir, acc = []) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return acc; }
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === 'node_modules' || e.name === '.git') continue;
      walk(p, acc);
    } else if (path.extname(e.name) === '.md') acc.push(p);
  }
  return acc;
}

/** Backticked tool-shaped tokens in a file, `mcp__vendor__tool` unwrapped. */
function toolsIn(file) {
  const found = new Set();
  for (const m of fs.readFileSync(file, 'utf8').matchAll(/`([^`\s]+)`/g)) {
    let t = m[1];
    const ns = t.match(/^mcp__[a-z0-9-]+__(.+)$/);
    if (ns) t = ns[1];
    if (TOOLISH.test(t)) found.add(t);
  }
  return found;
}

/** Operation evidence, with the line that carries it. */
function evidenceIn(files, base) {
  const http = [];
  const flags = [];
  for (const f of files) {
    const rel = path.relative(base, f);
    fs.readFileSync(f, 'utf8').split('\n').forEach((line, i) => {
      const h = line.match(HTTP);
      if (h) http.push(`${rel}:${i + 1} ${h[1]} ${h[2]}`);
      const g = line.match(FLAG);
      if (g) flags.push(`${rel}:${i + 1} ${g[1]}`);
    });
  }
  return { http, flags };
}

// ── Enumerate units ────────────────────────────────────────────────────
const marketplace = JSON.parse(fs.readFileSync(MARKETPLACE_PATH, 'utf8'));
const units = [];

for (const entry of marketplace.plugins) {
  const dir = path.join(REPO_ROOT, entry.source.replace(/^\.\//, ''));
  if (!fs.existsSync(dir)) continue; // reported by check-doc-references.mjs

  const skillsDir = path.join(dir, 'skills');
  if (fs.existsSync(skillsDir)) {
    for (const d of fs.readdirSync(skillsDir, { withFileTypes: true })) {
      if (!d.isDirectory()) continue;
      const sd = path.join(skillsDir, d.name);
      if (!fs.existsSync(path.join(sd, 'SKILL.md'))) continue;
      // A skill is judged whole: SKILL.md plus its references/.
      units.push({ id: `${entry.name}:skills/${d.name}`, dir, files: walk(sd) });
    }
  }
  for (const sub of ['agents', 'commands']) {
    const d = path.join(dir, sub);
    if (!fs.existsSync(d)) continue;
    for (const f of fs.readdirSync(d)) {
      if (path.extname(f) !== '.md') continue;
      units.push({ id: `${entry.name}:${sub}/${f}`, dir, files: [path.join(d, f)] });
    }
  }
}

// ── Classify ───────────────────────────────────────────────────────────
const unanchored = new Map(); // id -> { citation, http, flags }
for (const u of units) {
  const tools = new Set();
  for (const f of u.files) for (const t of toolsIn(f)) tools.add(t);
  if (tools.size > 0) continue;

  const { http, flags } = evidenceIn(u.files, u.dir);
  if (http.length === 0 && flags.length === 0) continue;

  const first = http[0] ?? flags[0];
  unanchored.set(u.id, {
    citation: `names no MCP tool; ${http.length} HTTP endpoint(s), ${flags.length} CLI flag(s) — first at ${first}`,
    http, flags,
  });
}

// ── --update: rewrite the inventory ────────────────────────────────────
if (UPDATE) {
  const out = {
    _rationale: [
      'Skills, agents and commands that describe an operation while naming zero MCP tools.',
      'scripts/tool-drift-audit.mjs only checks tools that are NAMED, so these documents',
      'pass every automated check no matter what they claim — the checkpoint-avanan class (#204).',
      'Rewriting them needs per-vendor tool ground truth, which CI does not have, so they are',
      'inventoried here instead. scripts/check-tool-anchoring.mjs fails on any unit NOT listed',
      '(no new un-anchored docs) and on any listed unit that is gone or now names tools (no',
      'stale entries). The list can therefore only shrink.',
      'Regenerate with: node scripts/check-tool-anchoring.mjs --update',
    ],
    _seeded: '2026-08-06, from the state left by #181/#195/#196/#202/#204/#205.',
    units: Object.fromEntries([...unanchored].sort().map(([id, v]) => [id, v.citation])),
  };
  fs.writeFileSync(INVENTORY_PATH, `${JSON.stringify(out, null, 2)}\n`);
  console.log(`wrote ${path.relative(REPO_ROOT, INVENTORY_PATH)} with ${unanchored.size} entries`);
  process.exit(0);
}

// ── Compare against the inventory ──────────────────────────────────────
if (!fs.existsSync(INVENTORY_PATH)) {
  console.error(`error: missing ${path.relative(REPO_ROOT, INVENTORY_PATH)} — run with --update to seed it`);
  process.exit(2);
}
const inventory = JSON.parse(fs.readFileSync(INVENTORY_PATH, 'utf8')).units ?? {};
const unitIds = new Set(units.map((u) => u.id));

const errors = [];

for (const [id, info] of [...unanchored].sort()) {
  if (id in inventory) continue;
  const shown = [...info.http.slice(0, 3), ...info.flags.slice(0, 2)];
  errors.push(
    `${id} describes an operation but names no MCP tool.\n` +
    shown.map((s) => `      ${s}`).join('\n') +
    (info.http.length + info.flags.length > shown.length
      ? `\n      … ${info.http.length + info.flags.length - shown.length} more`
      : '') +
    '\n      Name the MCP tool(s) that perform this, in backticks — that is the only\n' +
    '      thing scripts/tool-drift-audit.mjs can check. If no tool performs it, say\n' +
    '      so plainly and drop the request/flag recipe rather than inventing one.',
  );
}

for (const id of Object.keys(inventory).sort()) {
  if (unanchored.has(id)) continue;
  const reason = unitIds.has(id)
    ? 'it is anchored now (it names MCP tools, or the request/flag recipe is gone)'
    : 'it no longer exists';
  errors.push(
    `stale inventory entry "${id}" — ${reason}.\n` +
    '      Delete the line from scripts/unanchored-docs.json (or run --update).',
  );
}

if (errors.length > 0) {
  console.error(`\n✘ ${errors.length} tool-anchoring error(s):\n`);
  for (const e of errors) console.error(`  - ${e}\n`);
  process.exit(1);
}

console.log(
  `✔ tool-anchoring check passed (${units.length} skills/agents/commands; ` +
  `${unanchored.size} un-anchored, all inventoried)`,
);
if (unanchored.size > 0) {
  console.log(
    `::warning title=Un-anchored documentation::${unanchored.size} skills/agents/commands ` +
    'describe operations without naming a single MCP tool, so tool-drift-audit.mjs cannot ' +
    'see them. See scripts/unanchored-docs.json.',
  );
}
