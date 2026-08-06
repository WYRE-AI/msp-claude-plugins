#!/usr/bin/env node
/**
 * Reference-resolution check for msp-claude-plugins.
 *
 * Four PRs (#181, #196, #202, #205) fixed documentation that pointed at things
 * which do not exist: anti-trigger bullets routing readers to a deleted skill,
 * and 86 references naming skills that never existed because five plugins have
 * a directory name that differs from their marketplace name. Nothing verified
 * that a reference resolved. This does.
 *
 * Rules:
 *   1.  Every marketplace entry's `source` resolves to a real directory, and
 *       every on-disk plugin (a dir with .claude-plugin/plugin.json) is
 *       registered in marketplace.json. Neither side may name the other's ghost.
 *   2.  Every backticked skill-id-shaped reference in the repo's prose resolves
 *       to a real skill, agent or command.
 *   2b. A slug-shaped skill `name:` frontmatter equals that skill's canonical
 *       id. A second id for one skill is what let half of #181's malformed
 *       references resolve while their siblings dangled.
 *   3.  Every skill / agent / command the generated docs-site data claims a
 *       plugin ships exists on disk under that plugin.
 *   3b. The hand-maintained routine-catalog table names only real plugins and
 *       real agents.
 *
 * CANONICAL IDS ARE DERIVED FROM marketplace.json, NOT FROM DIRECTORY NAMES.
 * A skill's id is `<marketplace entry name>-<skill directory slug>`. Six
 * entries carry a name that is not their directory basename — connectwise/
 * {manage,automate,cpq} -> connectwise-{psa,automate,cpq}, shared ->
 * shared-skills, superops/superops-ai -> superops, syncro/syncro-msp ->
 * syncro — and references are also written from the *vendor* directory
 * (`quickbooks-` for quickbooks-online, `ninjaone-` for ninjaone-rmm). Both
 * forms are the #181 bug, and both are recognised as plugin aliases below so
 * that writing one is reported rather than silently accepted.
 *
 * Usage: node scripts/check-doc-references.mjs [--verbose]
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PLUGINS_ROOT = path.join(REPO_ROOT, 'msp-claude-plugins');
const MARKETPLACE_PATH = path.join(REPO_ROOT, '.claude-plugin', 'marketplace.json');
const DOCS_DATA = path.join(PLUGINS_ROOT, 'docs', 'src', 'data');
const VERBOSE = process.argv.includes('--verbose');

const errors = [];

// ── Telling a skill reference from a hyphenated tool name ───────────────
// `pandadoc-send-document` and `pax8-list-companies` are TOOLS, not skills.
// #181 hit ~34 such look-alikes. Both shapes are `<plugin>-<words>`, so the
// discriminator is the tail: a skill slug is a noun phrase naming a subject
// area (`tickets`, `time-entries`, `api-patterns`); a tool name leads with the
// verb it performs (`send-document`, `list-companies`, `get-product-pricing`).
// A reference therefore only counts when its tail is either a slug that really
// is a skill directory somewhere in the repo, or — inside an `## Anti-triggers`
// section, whose bullets exist solely to name another skill — any noun-led
// tail. Deleted skills whose slug survives nowhere are caught by the second
// branch; that is the #196/#202/#205 class.
const VERBS = new Set([
  'add', 'apply', 'approve', 'archive', 'assign', 'attach', 'build', 'bulk',
  'cancel', 'check', 'clear', 'clone', 'close', 'complete', 'convert', 'copy',
  'count', 'create', 'deactivate', 'delete', 'deploy', 'describe', 'detach',
  'disable', 'dismiss', 'download', 'edit', 'enable', 'enrich', 'execute',
  'export', 'fetch', 'find', 'generate', 'get', 'grant', 'handle', 'import',
  'install', 'invite', 'issue', 'join', 'kill', 'link', 'list', 'lock',
  'lookup', 'make', 'manage', 'merge', 'move', 'navigate', 'offboard',
  'onboard', 'open', 'patch', 'pause', 'ping', 'poll', 'post', 'publish',
  'pull', 'purge', 'push', 'put', 'query', 'reboot', 'recover', 'refresh',
  'register', 'reject', 'release', 'remove', 'rename', 'reopen', 'reply',
  'report', 'request', 'reset', 'resolve', 'restart', 'restore', 'resume',
  'retry', 'revoke', 'roll', 'rotate', 'run', 'save', 'scan', 'schedule',
  'search', 'send', 'set', 'share', 'show', 'start', 'stop', 'submit',
  'suspend', 'sync', 'tag', 'test', 'toggle', 'trigger', 'unarchive',
  'unassign', 'unlink', 'unlock', 'update', 'upload', 'upsert', 'use',
  'validate', 'verify', 'view', 'wait', 'write',
]);

// ── Helpers ────────────────────────────────────────────────────────────
function walk(dir, acc = []) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return acc; }
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === 'node_modules' || e.name === '.git' || e.name === 'dist') continue;
      walk(p, acc);
    } else acc.push(p);
  }
  return acc;
}

function frontmatterName(file) {
  const m = fs.readFileSync(file, 'utf8').match(/^---\s*\n([\s\S]*?)\n---/);
  if (!m) return null;
  const n = m[1].match(/^name:\s*(.+)$/m);
  if (!n) return null;
  const v = n[1].trim().replace(/^['"]|['"]$/g, '');
  return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(v) ? v : null;
}

// ── Inventory ──────────────────────────────────────────────────────────
const marketplace = JSON.parse(fs.readFileSync(MARKETPLACE_PATH, 'utf8'));

/** Everything a reference is allowed to name. */
const validIds = new Set();
/** Slugs that really are a skill directory somewhere. */
const skillSlugs = new Set();
/** Tokens that plausibly identify a plugin: marketplace name, directory
 *  basename, the vendor/plugin path joined with `-`, and the vendor dir. The
 *  wrong ones are exactly what dangling references are written from. */
const pluginAliases = new Set();
/** alias -> marketplace entry name, for "did you mean" (ambiguous ones dropped). */
const aliasToPlugin = new Map();
/** entry name -> { skills, agents, commands } actually on disk. */
const onDisk = new Map();

for (const entry of marketplace.plugins) {
  const rel = entry.source.replace(/^\.\//, '');
  const dir = path.join(REPO_ROOT, rel);

  if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) {
    errors.push(`marketplace entry "${entry.name}": source "${entry.source}" is not a directory`);
    continue;
  }

  const parts = rel.replace(/^msp-claude-plugins\//, '').split('/');
  for (const alias of [entry.name, parts[parts.length - 1], parts.join('-'), parts[0]]) {
    pluginAliases.add(alias);
    if (aliasToPlugin.has(alias) && aliasToPlugin.get(alias) !== entry.name) aliasToPlugin.set(alias, null);
    else aliasToPlugin.set(alias, entry.name);
  }
  validIds.add(entry.name);

  const shipped = { skills: new Set(), agents: new Set(), commands: new Set() };

  const skillsDir = path.join(dir, 'skills');
  if (fs.existsSync(skillsDir)) {
    for (const d of fs.readdirSync(skillsDir, { withFileTypes: true })) {
      if (!d.isDirectory()) continue;
      const md = path.join(skillsDir, d.name, 'SKILL.md');
      if (!fs.existsSync(md)) continue;
      shipped.skills.add(d.name);
      skillSlugs.add(d.name);
      const canonical = `${entry.name}-${d.name}`;
      validIds.add(canonical);
      // Rule 2b: a skill may title its `name:` freely ("Mimecast Queue
      // Management"), but a *slug-shaped* name is an id, and a second id for
      // the same skill is what let half of #181's malformed references resolve
      // while their siblings dangled. One id per skill, or the guard has a hole.
      const fmName = frontmatterName(md);
      if (fmName && fmName !== canonical) {
        errors.push(
          `${path.relative(REPO_ROOT, md)}: frontmatter name "${fmName}" is slug-shaped but is not ` +
          `this skill's canonical id "${canonical}" — a second id makes references to the wrong ` +
          'one resolve by accident. Rename it, or use a prose title.',
        );
      }
    }
  }

  for (const sub of ['agents', 'commands']) {
    const d = path.join(dir, sub);
    if (!fs.existsSync(d)) continue;
    for (const f of fs.readdirSync(d)) {
      if (path.extname(f) !== '.md') continue;
      const slug = path.basename(f, '.md');
      shipped[sub].add(slug);
      validIds.add(slug);
      validIds.add(`${entry.name}-${slug}`);
      const fmName = frontmatterName(path.join(d, f));
      if (fmName) validIds.add(fmName);
    }
  }

  onDisk.set(entry.name, shipped);
}

// ── Rule 1 (reverse): every on-disk plugin is registered ────────────────
const registeredDirs = new Set(
  marketplace.plugins.map((p) => path.resolve(REPO_ROOT, p.source.replace(/^\.\//, ''))),
);
(function findUnregistered(dir, depth = 0) {
  if (depth > 3) return;
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const e of entries) {
    if (!e.isDirectory() || e.name === 'node_modules' || e.name === '.git') continue;
    const p = path.join(dir, e.name);
    if (e.name === '.claude-plugin' && fs.existsSync(path.join(p, 'plugin.json'))) {
      if (!registeredDirs.has(path.resolve(dir))) {
        errors.push(
          `plugin at ${path.relative(REPO_ROOT, dir)} has a plugin.json but no marketplace.json entry — ` +
          `it ships to nobody, and references to its skills cannot resolve`,
        );
      }
      continue;
    }
    findUnregistered(p, depth + 1);
  }
})(PLUGINS_ROOT);

// ── Rule 2: backticked references resolve ──────────────────────────────
/** Mark the lines that sit inside an `## Anti-triggers` section. */
function routingLines(lines) {
  const flags = new Array(lines.length).fill(false);
  let inSection = false;
  let depth = 0;
  lines.forEach((line, i) => {
    const h = line.match(/^(#{2,6})\s+(.*)$/);
    if (h) {
      const level = h[1].length;
      if (/^anti[-\s]?triggers\b/i.test(h[2].trim())) { inSection = true; depth = level; }
      else if (inSection && level <= depth) inSection = false;
    }
    flags[i] = inSection;
  });
  return flags;
}

function referenceKind(token, inRouting) {
  if (!/^[a-z0-9]+(-[a-z0-9]+)+$/.test(token)) return null;
  const parts = token.split('-');
  for (let i = 1; i < parts.length; i++) {
    const prefix = parts.slice(0, i).join('-');
    if (!pluginAliases.has(prefix)) continue;
    const tail = parts.slice(i);
    if (skillSlugs.has(tail.join('-'))) return { kind: 'skill-slug', prefix, tail: tail.join('-') };
    if (inRouting && !VERBS.has(tail[0])) return { kind: 'anti-trigger', prefix, tail: tail.join('-') };
  }
  return null;
}

const PROSE_EXT = new Set(['.md', '.mdx', '.astro', '.ts']);
const scanned = [
  ...walk(PLUGINS_ROOT),
  ...fs.readdirSync(REPO_ROOT).map((f) => path.join(REPO_ROOT, f)),
].filter((f) => {
  if (!PROSE_EXT.has(path.extname(f))) return false;
  if (!fs.statSync(f).isFile()) return false;
  // A changelog's job is to record what changed, which means naming skills that
  // were deleted or renamed ("`syncro-msp` → `syncro`", "#195 deleted
  // `checkpoint-avanan-incidents`"). Those references are correct precisely
  // because they no longer resolve.
  if (path.basename(f) === 'CHANGELOG.md') return false;
  // The docs site's own source counts; its dependencies and build output do not.
  if (f.includes(`${path.sep}docs${path.sep}`) && !f.includes(`${path.sep}docs${path.sep}src${path.sep}`)) return false;
  if (path.extname(f) === '.ts' && !f.startsWith(DOCS_DATA) && !f.includes(`${path.sep}docs${path.sep}src${path.sep}`)) return false;
  return true;
});

const dangling = new Map();
let checked = 0;
for (const file of scanned) {
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  const routing = routingLines(lines);
  lines.forEach((line, i) => {
    for (const m of line.matchAll(/`([^`\s]+)`/g)) {
      const token = m[1];
      const ref = referenceKind(token, routing[i]);
      if (!ref) continue;
      checked++;
      if (validIds.has(token)) continue;
      if (!dangling.has(token)) dangling.set(token, { ...ref, sites: [] });
      dangling.get(token).sites.push(`${path.relative(REPO_ROOT, file)}:${i + 1}`);
    }
  });
}

for (const [token, { kind, prefix, tail, sites }] of [...dangling].sort()) {
  // The written prefix is a plugin alias; if it is a directory name, the fix is
  // usually the same tail under that plugin's marketplace name (the #181 shape).
  const suggestions = [];
  const canonicalPlugin = aliasToPlugin.get(prefix);
  if (canonicalPlugin && validIds.has(`${canonicalPlugin}-${tail}`)) {
    suggestions.push(`${canonicalPlugin}-${tail}`);
  }
  for (const id of validIds) {
    if (suggestions.length >= 3) break;
    if (id.endsWith(`-${tail}`) && !suggestions.includes(id)) suggestions.push(id);
  }
  errors.push(
    `dangling reference \`${token}\` (${kind}, ${sites.length} site${sites.length === 1 ? '' : 's'}) — ` +
    `nothing by that id ships.${suggestions.length ? ` Did you mean ${suggestions.map((n) => `\`${n}\``).join(', ')}?` : ''}\n` +
    sites.map((s) => `      ${s}`).join('\n'),
  );
}

// ── Rule 3: docs-site data matches the filesystem ──────────────────────
// #205's residue: #204 deleted /manage-policy and renamed an agent, and the
// generated data went on advertising both. The data file is generated, so this
// reports staleness rather than editing it.
function checkDocsData(file, label) {
  if (!fs.existsSync(file)) return;
  const text = fs.readFileSync(file, 'utf8');
  // Slice the generated array one plugin per top-level `id:` line.
  const starts = [...text.matchAll(/^ {4}id: '([^']+)',$/gm)];
  for (let i = 0; i < starts.length; i++) {
    const id = starts[i][1];
    const block = text.slice(starts[i].index, starts[i + 1]?.index ?? text.length);
    if (!onDisk.has(id)) {
      errors.push(`${label}: lists plugin "${id}", which has no marketplace entry`);
      continue;
    }
    const shipped = onDisk.get(id);
    for (const field of ['skills', 'agents', 'commands']) {
      // An empty list is emitted inline as `agents: [],` — matching it as an
      // open bracket would swallow the next field's entries.
      const section = block.match(new RegExp(`^ {4}${field}: \\[\\n([\\s\\S]*?)\\n {4}\\],?$`, 'm'))?.[1];
      if (!section) continue;
      for (const m of section.matchAll(/\{ name: '([^']+)'/g)) {
        const name = m[1].replace(/^\//, '');
        if (!shipped[field].has(name)) {
          errors.push(
            `${label}: plugin "${id}" is documented as shipping ${field.slice(0, -1)} "${name}", ` +
            'which is not on disk — the generated data is stale ' +
            '(run `npm run generate` in msp-claude-plugins/docs)',
          );
        }
      }
    }
  }
}
checkDocsData(path.join(DOCS_DATA, 'plugins.ts'), 'docs/src/data/plugins.ts');

// ── Rule 3b: hand-written docs-site agent tables ───────────────────────
// The routine catalog is a hand-maintained `<th>Agent</th><th>Plugin</th>`
// table. It kept scheduling `tenant-policy-auditor` for a month after #204
// renamed it. Only tables with that exact header pair are read, so no other
// docs-site table is interpreted as agent references.
for (const file of walk(path.join(PLUGINS_ROOT, 'docs', 'src', 'pages'))) {
  if (path.extname(file) !== '.astro') continue;
  const text = fs.readFileSync(file, 'utf8');
  if (!/<th>Agent<\/th>\s*<th>Plugin<\/th>/.test(text)) continue;
  const label = path.relative(REPO_ROOT, file);
  const lines = text.split('\n');
  lines.forEach((line, i) => {
    const m = line.match(/<tr><td>([a-z0-9-]+)<\/td><td>([a-z0-9-]+)<\/td>/);
    if (!m) return;
    const [, agent, plugin] = m;
    if (!onDisk.has(plugin)) {
      errors.push(
        `${label}:${i + 1}: table row names plugin "${plugin}", which is not a marketplace entry ` +
        `(a directory name is not an installable plugin id)`,
      );
      return;
    }
    if (!onDisk.get(plugin).agents.has(agent)) {
      errors.push(
        `${label}:${i + 1}: table schedules agent "${agent}" for plugin "${plugin}", ` +
        'which ships no such agent',
      );
    }
  });
}

// ── Report ─────────────────────────────────────────────────────────────
if (VERBOSE) {
  console.log(`inventory: ${marketplace.plugins.length} plugins, ${validIds.size} resolvable ids, ` +
    `${skillSlugs.size} skill slugs, ${pluginAliases.size} plugin aliases`);
  console.log(`scanned ${scanned.length} files, ${checked} skill-shaped references`);
}

if (errors.length > 0) {
  console.error(`\n✘ ${errors.length} reference error(s):\n`);
  for (const e of errors) console.error(`  - ${e}`);
  console.error(
    '\n  Canonical skill ids are `<marketplace entry name>-<skill directory slug>`.\n' +
    '  The marketplace name is NOT always the directory name — check .claude-plugin/marketplace.json.\n',
  );
  process.exit(1);
}

console.log(
  `✔ reference check passed (${checked} skill-shaped references across ${scanned.length} files ` +
  `resolve against ${validIds.size} ids from ${marketplace.plugins.length} plugins)`,
);
