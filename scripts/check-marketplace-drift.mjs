#!/usr/bin/env node
/**
 * Marketplace drift + version-bump gate for msp-claude-plugins.
 *
 * Always-on drift rules:
 *   1. Every marketplace entry's `name` must equal its plugin.json `name`
 *      (the entry name is the public identifier — enabledPlugins keys,
 *      /plugin install, skill namespacing).
 *   2. Marketplace entries must NOT carry a `version` field — plugin.json
 *      is the sole version authority (entry versions are silently ignored
 *      at install time and drift).
 *   3. No unrecognized fields on marketplace entries or the top level.
 *
 * Bump gate (only when --base <ref> is given, e.g. in PR CI):
 *   4. If any file under a plugin's directory changed relative to the merge
 *      base, that plugin's plugin.json `version` must have changed too.
 *      Claude Code update detection is a version-string match — shipping
 *      changes without a bump means installed users silently never update.
 *
 * Usage:
 *   node scripts/check-marketplace-drift.mjs            # drift rules only
 *   node scripts/check-marketplace-drift.mjs --base origin/main
 */

import { execFileSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MARKETPLACE_PATH = path.join(REPO_ROOT, '.claude-plugin', 'marketplace.json');

// Fields Claude Code recognizes. Anything else fails the check so unknown
// keys (like the old `mcpRepo`/`icon`) can't creep back in.
const ALLOWED_TOP_LEVEL_FIELDS = new Set([
  '$schema', 'name', 'description', 'version', 'owner', 'metadata', 'plugins',
]);
const ALLOWED_ENTRY_FIELDS = new Set([
  'name', 'displayName', 'source', 'description', 'author', 'homepage',
  'repository', 'license', 'keywords', 'category', 'tags', 'strict',
  'commands', 'agents', 'skills', 'hooks', 'mcpServers',
]);

const baseArgIdx = process.argv.indexOf('--base');
const baseRef = baseArgIdx !== -1 ? process.argv[baseArgIdx + 1] : null;
if (baseArgIdx !== -1 && !baseRef) {
  console.error('error: --base requires a git ref argument');
  process.exit(2);
}

const errors = [];

function git(...args) {
  return execFileSync('git', args, { cwd: REPO_ROOT, encoding: 'utf8' });
}

const marketplace = JSON.parse(fs.readFileSync(MARKETPLACE_PATH, 'utf8'));

// ── Rule 3 (top level) ─────────────────────────────────────────────────
for (const key of Object.keys(marketplace)) {
  if (!ALLOWED_TOP_LEVEL_FIELDS.has(key)) {
    errors.push(`marketplace.json top-level: unrecognized field "${key}"`);
  }
}

// ── Rules 1-3 (per entry) ──────────────────────────────────────────────
const pluginDirs = new Map(); // entry name -> repo-relative plugin dir

for (const entry of marketplace.plugins) {
  const label = `entry "${entry.name ?? '<unnamed>'}"`;

  for (const key of Object.keys(entry)) {
    if (key === 'version') {
      errors.push(`${label}: carries a "version" field — plugin.json is the sole version authority; remove it`);
    } else if (!ALLOWED_ENTRY_FIELDS.has(key)) {
      errors.push(`${label}: unrecognized field "${key}"`);
    }
  }

  if (typeof entry.source !== 'string' || !entry.source.startsWith('./')) {
    errors.push(`${label}: source must be a ./-relative path (got ${JSON.stringify(entry.source)})`);
    continue;
  }

  const relDir = entry.source.replace(/^\.\//, '');
  pluginDirs.set(entry.name, relDir);

  const pluginJsonPath = path.join(REPO_ROOT, relDir, '.claude-plugin', 'plugin.json');
  if (!fs.existsSync(pluginJsonPath)) {
    errors.push(`${label}: missing ${relDir}/.claude-plugin/plugin.json`);
    continue;
  }

  let pluginJson;
  try {
    pluginJson = JSON.parse(fs.readFileSync(pluginJsonPath, 'utf8'));
  } catch (err) {
    errors.push(`${label}: unparseable plugin.json — ${err.message}`);
    continue;
  }

  if (pluginJson.name !== entry.name) {
    errors.push(`${label}: plugin.json name "${pluginJson.name}" does not match the marketplace entry name`);
  }
  if (typeof pluginJson.version !== 'string' || pluginJson.version.length === 0) {
    errors.push(`${label}: plugin.json must declare a version string`);
  }
}

// ── Rule 4: bump gate ──────────────────────────────────────────────────
if (baseRef) {
  const mergeBase = git('merge-base', baseRef, 'HEAD').trim();
  const changedFiles = git('diff', '--name-only', mergeBase, 'HEAD')
    .split('\n')
    .filter(Boolean);

  const changedByPlugin = new Map(); // entry name -> changed files
  for (const file of changedFiles) {
    for (const [name, dir] of pluginDirs) {
      if (file === dir || file.startsWith(`${dir}/`)) {
        if (!changedByPlugin.has(name)) changedByPlugin.set(name, []);
        changedByPlugin.get(name).push(file);
        break;
      }
    }
  }

  for (const [name, files] of changedByPlugin) {
    const dir = pluginDirs.get(name);
    const manifestPath = `${dir}/.claude-plugin/plugin.json`;

    let baseVersion = null;
    try {
      baseVersion = JSON.parse(git('show', `${mergeBase}:${manifestPath}`)).version ?? null;
    } catch {
      // Plugin (or its manifest) doesn't exist at base — new plugin, no bump needed.
      continue;
    }

    let headVersion = null;
    try {
      headVersion = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, manifestPath), 'utf8')).version ?? null;
    } catch {
      // Missing/unparseable manifest at HEAD is already reported above.
      continue;
    }

    if (baseVersion === headVersion) {
      errors.push(
        `bump gate: plugin "${name}" changed without a plugin.json version bump ` +
        `(still ${JSON.stringify(headVersion)}). Changed files:\n    - ${files.join('\n    - ')}`
      );
    }
  }

  console.log(`bump gate: compared HEAD against merge base ${mergeBase.slice(0, 12)} (${changedFiles.length} changed files, ${changedByPlugin.size} plugins touched)`);
}

// ── Report ─────────────────────────────────────────────────────────────
if (errors.length > 0) {
  console.error(`\n✘ ${errors.length} marketplace drift error(s):\n`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

console.log(`✔ marketplace drift check passed (${marketplace.plugins.length} entries)`);
