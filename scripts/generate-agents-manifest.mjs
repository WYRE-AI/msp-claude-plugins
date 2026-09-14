#!/usr/bin/env node
/**
 * Harness-neutral manifest generator for msp-claude-plugins.
 *
 * WHY THIS EXISTS
 * ---------------
 * `.claude-plugin/marketplace.json` is the Claude Code marketplace manifest.
 * It is Claude-Code-shaped on purpose and deliberately carries no `version`
 * on entries (check-marketplace-drift.mjs rule 2 — plugin.json is the sole
 * version authority).
 *
 * OpenAI's Codex / ChatGPT desktop reads a DIFFERENT marketplace file, in a
 * different schema, from `$REPO_ROOT/.agents/plugins/marketplace.json`
 * (docs: https://developers.openai.com/codex/plugins/build/). That file
 * existed here already but listed 1 of the 83 plugins — so a Codex user who
 * added this repo saw one vendor. This script derives the whole thing.
 *
 * It emits two files, both DERIVED — no hand-authored content:
 *
 *   .agents/plugins/marketplace.json
 *       The Codex/ChatGPT marketplace, in OpenAI's documented schema. This
 *       is the file with a real consumer today.
 *
 *   .agents/catalog.json
 *       A repo-local inventory: every pack with its REAL version read from
 *       `.claude-plugin/plugin.json`, its skill/command/agent paths, and its
 *       MCP wiring. The Codex marketplace schema has no entry-level version
 *       field and this repo's rule 2 rightly refuses to add one to the
 *       Claude manifest, so this is where a machine-readable version map
 *       lives — see PORTABILITY.md for the two consumers that need it.
 *
 * This script only ever READS `.claude-plugin/marketplace.json` and the
 * per-plugin `plugin.json` files. It never writes them.
 *
 * IDEMPOTENCE
 * -----------
 * Output is a pure function of the tree: packs are emitted in
 * marketplace.json order, nested lists are sorted by name, and there is
 * deliberately NO timestamp or git SHA in the output — either would make
 * consecutive runs differ and turn `--check` into noise.
 *
 * Usage:
 *   node scripts/generate-agents-manifest.mjs           # write both files
 *   node scripts/generate-agents-manifest.mjs --check   # CI: fail if stale
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MARKETPLACE_PATH = path.join(REPO_ROOT, '.claude-plugin', 'marketplace.json');

const AGENTS_MARKETPLACE_REL = path.posix.join('.agents', 'plugins', 'marketplace.json');
const CATALOG_REL = path.posix.join('.agents', 'catalog.json');

/** Bumped only when the shape of catalog.json changes incompatibly. */
const CATALOG_SCHEMA_VERSION = 1;

/** The plugin whose .mcp.json holds the org-wide gateway endpoint. */
const GATEWAY_PLUGIN_DIR = 'msp-claude-plugins/wyre-gateway';

/**
 * Codex install policy applied to every entry.
 *
 * `installation`: "AVAILABLE" — documented value; these are opt-in packs,
 * not defaults, so INSTALLED_BY_DEFAULT would be wrong.
 *
 * `authentication`: "ON_INSTALL" — this is the only value OpenAI's docs
 * show verbatim, and it is what the previous hand-written stub used, so
 * generating it changes no policy. Real-world marketplaces in the wild also
 * use "ON_USE"/"ON_FIRST_USE", but neither appears in OpenAI's published
 * docs, and no enum is published. If OpenAI documents a deferred-auth value,
 * change it here — one constant, 83 entries.
 */
const INSTALL_POLICY = Object.freeze({
  installation: 'AVAILABLE',
  authentication: 'ON_INSTALL',
});

/** Tokens that should read as acronyms when a slug is humanized. */
const ACRONYMS = new Set(['msp', 'psa', 'rmm', 'crm', 'bcdr', 'it', 'saas', 'cpq']);

const checkMode = process.argv.includes('--check');
const errors = [];

// ── Helpers ────────────────────────────────────────────────────────────

/**
 * "email-security" -> "Email Security", "psa-rmm" -> "PSA RMM".
 * Codex's documented examples use human-readable Title Case categories
 * ("Productivity"); this repo stores kebab-case slugs. The mapping is
 * mechanical so it stays derived rather than becoming a hand-kept table.
 */
function humanize(slug) {
  return String(slug)
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((word) =>
      ACRONYMS.has(word.toLowerCase())
        ? word.toUpperCase()
        : word.charAt(0).toUpperCase() + word.slice(1),
    )
    .join(' ');
}

function readJson(absPath, label) {
  try {
    return JSON.parse(fs.readFileSync(absPath, 'utf8'));
  } catch (err) {
    errors.push(`${label}: unreadable or invalid JSON — ${err.message}`);
    return null;
  }
}

/** Immediate subdirectory names, sorted. */
function listDirs(absPath) {
  if (!fs.existsSync(absPath)) return [];
  return fs
    .readdirSync(absPath, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();
}

/** Immediate `.md` file basenames (extension stripped), sorted. */
function listMarkdownIds(absPath) {
  if (!fs.existsSync(absPath)) return [];
  return fs
    .readdirSync(absPath, { withFileTypes: true })
    .filter((e) => e.isFile() && e.name.endsWith('.md'))
    .map((e) => e.name.replace(/\.md$/, ''))
    .sort();
}

/** The `mcpServers` block a plugin ships, if any. */
function readMcpServers(relDir) {
  const absPath = path.join(REPO_ROOT, relDir, '.mcp.json');
  if (!fs.existsSync(absPath)) return null;
  const json = readJson(absPath, `${relDir}/.mcp.json`);
  if (!json || typeof json.mcpServers !== 'object' || json.mcpServers === null) return null;
  return json.mcpServers;
}

// ── Read the Claude marketplace (read-only, always) ────────────────────

const marketplace = readJson(MARKETPLACE_PATH, '.claude-plugin/marketplace.json');
if (!marketplace || !Array.isArray(marketplace.plugins)) {
  console.error('✘ .claude-plugin/marketplace.json is missing or has no `plugins` array');
  process.exit(2);
}

// ── Build both manifests from one pass over the tree ───────────────────

const codexEntries = [];
const catalogPacks = [];

for (const entry of marketplace.plugins) {
  const label = `entry "${entry.name ?? '<unnamed>'}"`;

  if (typeof entry.source !== 'string' || !entry.source.startsWith('./')) {
    errors.push(`${label}: source must be a ./-relative path (got ${JSON.stringify(entry.source)})`);
    continue;
  }
  const relDir = entry.source.replace(/^\.\//, '');
  const absDir = path.join(REPO_ROOT, relDir);
  if (!fs.existsSync(absDir)) {
    errors.push(`${label}: plugin directory ${relDir} does not exist`);
    continue;
  }

  // plugin.json is the sole version authority — the whole reason this
  // generator reads it instead of trusting the marketplace entry.
  const pluginJson = readJson(
    path.join(absDir, '.claude-plugin', 'plugin.json'),
    `${relDir}/.claude-plugin/plugin.json`,
  );
  if (!pluginJson) continue;
  if (pluginJson.name !== entry.name) {
    errors.push(
      `${label}: plugin.json name "${pluginJson.name}" does not match the marketplace entry name`,
    );
    continue;
  }
  if (typeof pluginJson.version !== 'string' || pluginJson.version === '') {
    errors.push(`${label}: plugin.json declares no version string`);
    continue;
  }

  // ── Codex / ChatGPT marketplace entry ──
  // Field set per https://developers.openai.com/codex/plugins/build/ —
  // name, source, policy, category. `description` is not in the documented
  // required set but is carried by marketplaces in the wild and is what a
  // plugin picker has to show, so it is included.
  const codexEntry = {
    name: entry.name,
    description: entry.description ?? pluginJson.description ?? '',
    source: {
      source: 'local',
      path: entry.source,
    },
    policy: { ...INSTALL_POLICY },
    category: humanize(entry.category ?? 'general'),
  };
  codexEntries.push(codexEntry);

  // ── Catalog pack ──
  const skills = listDirs(path.join(absDir, 'skills')).filter((dir) =>
    fs.existsSync(path.join(absDir, 'skills', dir, 'SKILL.md')),
  );

  const pack = {
    name: entry.name,
    displayName: entry.displayName ?? pluginJson.displayName ?? humanize(entry.name),
    version: pluginJson.version,
    description: entry.description ?? pluginJson.description ?? '',
    category: entry.category ?? 'general',
    tags: Array.isArray(entry.tags) ? [...entry.tags] : [],
    path: relDir,
  };
  if (typeof pluginJson.license === 'string') pack.license = pluginJson.license;
  if (typeof pluginJson.homepage === 'string') pack.homepage = pluginJson.homepage;

  const mcpServers = readMcpServers(relDir);
  if (mcpServers) pack.mcpServers = mcpServers;

  pack.skills = skills.map((id) => ({
    id,
    path: path.posix.join(relDir, 'skills', id, 'SKILL.md'),
  }));
  pack.commands = listMarkdownIds(path.join(absDir, 'commands')).map((id) => ({
    id,
    path: path.posix.join(relDir, 'commands', `${id}.md`),
  }));
  pack.agents = listMarkdownIds(path.join(absDir, 'agents')).map((id) => ({
    id,
    path: path.posix.join(relDir, 'agents', `${id}.md`),
  }));

  catalogPacks.push(pack);
}

// ── Assemble the Codex marketplace ─────────────────────────────────────

const codexMarketplace = {
  name: marketplace.name ?? 'msp-claude-plugins',
  interface: {
    displayName: humanize(marketplace.name ?? 'msp-claude-plugins'),
  },
  plugins: codexEntries,
};

// ── Assemble the catalog ───────────────────────────────────────────────

const catalog = {
  schemaVersion: CATALOG_SCHEMA_VERSION,
  name: marketplace.name ?? 'msp-claude-plugins',
  description: marketplace.description ?? '',
  generator: {
    script: 'scripts/generate-agents-manifest.mjs',
    derivedFrom: [
      '.claude-plugin/marketplace.json',
      '<pack>/.claude-plugin/plugin.json',
      '<pack>/.mcp.json',
      '<pack>/skills/, <pack>/commands/, <pack>/agents/',
    ],
    note: 'Generated file — do not edit by hand. Regenerate with `node scripts/generate-agents-manifest.mjs`.',
  },
};
if (marketplace.owner) catalog.owner = marketplace.owner;

// The org-wide gateway endpoint is derived, not hardcoded: it is whatever
// the dedicated wyre-gateway plugin's .mcp.json declares.
const gatewayServers = readMcpServers(GATEWAY_PLUGIN_DIR);
const gatewayEntry = gatewayServers ? Object.entries(gatewayServers)[0] : null;
if (gatewayEntry) {
  const [serverName, server] = gatewayEntry;
  catalog.mcp = {
    // How a non-Claude harness consumes these packs without installing
    // anything: point it at this endpoint.
    server: serverName,
    type: server.type ?? 'http',
    url: server.url,
    skills: {
      // MCP skills extension (SEP-2640), which the gateway implements.
      extension: 'io.modelcontextprotocol/skills',
      // Plain-tool fallback for hosts that do not implement the extension.
      tools: ['conduit__list_skills', 'conduit__get_skill'],
      resourceUriTemplate: 'skill://{pack}/{skill}/SKILL.md',
    },
  };
}

catalog.totals = {
  packs: catalogPacks.length,
  skills: catalogPacks.reduce((n, p) => n + p.skills.length, 0),
  commands: catalogPacks.reduce((n, p) => n + p.commands.length, 0),
  agents: catalogPacks.reduce((n, p) => n + p.agents.length, 0),
};
catalog.packs = catalogPacks;

// ── Report / write ─────────────────────────────────────────────────────

if (errors.length > 0) {
  console.error(`\n✘ ${errors.length} manifest generation error(s):\n`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

const outputs = [
  { rel: AGENTS_MARKETPLACE_REL, body: `${JSON.stringify(codexMarketplace, null, 2)}\n` },
  { rel: CATALOG_REL, body: `${JSON.stringify(catalog, null, 2)}\n` },
];

if (checkMode) {
  const stale = outputs.filter(({ rel, body }) => {
    const abs = path.join(REPO_ROOT, rel);
    const current = fs.existsSync(abs) ? fs.readFileSync(abs, 'utf8') : null;
    return current !== body;
  });
  if (stale.length > 0) {
    console.error(
      `\n✘ ${stale.length} generated file(s) out of date:\n` +
        stale.map(({ rel }) => `  - ${rel}`).join('\n') +
        '\n\n  Run: node scripts/generate-agents-manifest.mjs\n',
    );
    process.exit(1);
  }
  console.log(
    `✔ .agents/ manifests are up to date (${catalog.totals.packs} packs, ${catalog.totals.skills} skills)`,
  );
  process.exit(0);
}

for (const { rel, body } of outputs) {
  const abs = path.join(REPO_ROOT, rel);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, body);
}

console.log(
  `✔ wrote ${AGENTS_MARKETPLACE_REL} (${codexEntries.length} entries)\n` +
    `✔ wrote ${CATALOG_REL} — ${catalog.totals.packs} packs, ${catalog.totals.skills} skills, ` +
    `${catalog.totals.commands} commands, ${catalog.totals.agents} agents`,
);
