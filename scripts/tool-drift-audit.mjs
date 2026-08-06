#!/usr/bin/env node
/**
 * tool-drift-audit.mjs — cross-check every plugin's documented MCP tool names
 * against the tool names its shipped server actually registers.
 *
 * Ground truth is the union of up to four complementary sources:
 *   1. RUNTIME     — spawn `node dist/index.js` over stdio, initialize, tools/list
 *                    (see scripts/probe-mcp-tools.mjs). Authoritative, but progressive-disclosure
 *                    ("navigate") servers advertise only 1-2 entrypoints before
 *                    navigation, so it under-reports those.
 *   2. STATIC      — scan src/ for MCP `Tool` object literals (`name: "..."` with an
 *                    adjacent `inputSchema`) and `server.registerTool(...)` calls.
 *                    Covers the post-navigation surface.
 *   3. PROD-SCHEMA — mcp-gateway/schemas/<vendor>.json, pinned to the prod image
 *                    digests in .harness/vendors.json. 12 vendors only.
 *   4. LIVE-GW     — tool names observed on the live gateway connector, supplied
 *                    via --live <json> as { vendorId: [names] }.
 *
 * Documented names are the backtick-quoted snake_case tokens in each plugin's
 * skills/**\/SKILL.md, references/*.md, agents/*.md, commands/*.md and its
 * root-level docs (README.md, GOVERNANCE.md), filtered to tokens whose first
 * segment matches a prefix the server actually uses.
 *
 * Exit code 1 when any drift is found, so it can gate CI.
 *
 * Usage:
 *   node scripts/probe-mcp-tools.mjs ~/mcp ground-truth.json
 *   node scripts/tool-drift-audit.mjs \
 *     --plugins . --servers ~/mcp --gateway ~/mcp/mcp-gateway \
 *     --runtime ground-truth.json [--live live-gw.json] [--json audit.json]
 *
 * `--plugins` defaults to the current directory. At least one of --servers,
 * --runtime or --live must be given, otherwise there is nothing to compare
 * documented names against.
 */
import { readdirSync, readFileSync, existsSync, writeFileSync } from "node:fs";
import { join, relative, extname } from "node:path";

// ---------------------------------------------------------------- args
const argv = process.argv.slice(2);
const arg = (n, d) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : d; };
const PLUGINS_REPO = arg("--plugins", ".");
const SERVERS_ROOT = arg("--servers");
const GATEWAY = arg("--gateway");
const JSON_OUT = arg("--json");
const RUNTIME_JSON = arg("--runtime"); // optional pre-computed probe output
const LIVE_JSON = arg("--live");       // optional captured live-gateway tool lists
if (!SERVERS_ROOT && !RUNTIME_JSON && !LIVE_JSON) {
  console.error("Nothing to compare against. Pass at least one ground-truth source:");
  console.error("  --servers <dir with the *-mcp repos>   static scan (+ --runtime for a probe)");
  console.error("  --live <json>                          captured live-gateway tool lists");
  process.exit(2);
}
const PLUGINS = join(PLUGINS_REPO, "msp-claude-plugins");

// ---------------------------------------------------------------- plugin -> server/vendor map
// Plugin dirs whose slug does not equal `<server-repo minus -mcp>` are listed here.
// `server: null` = no local WYRE server repo (hosted vendor or unbuilt).
const PLUGIN_MAP = {
  "abnormal/abnormal-security": { server: "abnormal-mcp", vendor: "abnormal-security" },
  "connectwise/automate": { server: "connectwise-automate-mcp", vendor: "connectwise-automate" },
  "connectwise/cpq": { server: "connectwise-cpq-mcp", vendor: null },
  "connectwise/manage": { server: "connectwise-manage-mcp", vendor: "connectwise-manage" },
  "email-security/checkpoint-avanan": { server: "avanan-mcp", vendor: "avanan" },
  "email-security/knowbe4": { server: "knowbe4-mcp", vendor: "knowbe4" },
  "email-security/proofpoint": { server: "proofpoint-mcp", vendor: "proofpoint" },
  "kaseya/autotask": { server: "autotask-mcp", vendor: "autotask" },
  "kaseya/datto-bcdr": { server: "datto-bcdr-mcp", vendor: "datto-bcdr" },
  "kaseya/datto-rmm": { server: "datto-rmm-mcp", vendor: "datto-rmm" },
  "kaseya/datto-saas-protection": { server: "datto-saas-protection-mcp", vendor: "datto-saas-protection" },
  "kaseya/it-glue": { server: "itglue-mcp", vendor: "itglue" },
  "kaseya/kaseya-bms": { server: "kaseya-bms-mcp", vendor: "kaseya-bms" },
  "kaseya/kaseya-vsa": { server: "kaseya-vsa-mcp", vendor: "kaseya-vsa" },
  "kaseya/rocketcyber": { server: "rocketcyber-mcp", vendor: "rocketcyber" },
  "kaseya/spanning": { server: "spanning-mcp", vendor: "spanning" },
  "kaseya/unitrends": { server: "unitrends-mcp", vendor: "unitrends" },
  "ninjaone/ninjaone-rmm": { server: "ninjaone-mcp", vendor: "ninjaone" },
  "quickbooks/quickbooks-online": { server: "qbo-mcp", vendor: "qbo" },
  "superops/superops-ai": { server: "superops-mcp", vendor: "superops" },
  "syncro/syncro-msp": { server: "syncro-mcp", vendor: "syncro" },
  // Hosted upstreams — the local repo (if any) is NOT what the gateway serves.
  "pax8/pax8": { server: null, vendor: "pax8", hostedNote: "local pax8-mcp exists but gateway routes to https://mcp.pax8.com/v1" },
  "rootly/rootly": { server: null, vendor: "rootly", hostedNote: "local rootly-mcp exists but gateway routes to https://mcp.rootly.com" },
  "pagerduty/pagerduty": { server: null, vendor: "pagerduty" },
  "betterstack/betterstack": { server: null, vendor: "betterstack" },
  "hubspot/hubspot": { server: null, vendor: "hubspot" },
  "pandadoc/pandadoc": { server: null, vendor: "pandadoc" },
  "runzero/runzero": { server: null, vendor: "runzero" },
  "slack/slack": { server: null, vendor: "slack" },
  "stripe/stripe": { server: null, vendor: "stripe" },
  "warmly/warmly": { server: null, vendor: "warmly" },
  "microsoft-graph/microsoft-graph": { server: null, vendor: "microsoft-graph" },
  "m365/m365": { server: null, vendor: "microsoft-graph" },
  "azure-mcp/azure-mcp": { server: null, vendor: "azure-mcp" },
  "clio/clio": { server: null, vendor: null },
  "blackpoint/blackpoint": { server: null, vendor: "blackpoint" },
  "immybot/immybot": { server: null, vendor: "immybot" },
};
// Aggregate/meta plugins: no single vendor server.
const SKIP = new Set(["shared", "wyre-gateway", "assets-pack", "awareness-pack", "backup-pack",
  "cloudops-pack", "compliance-pack", "devops-pack", "finance-pack", "ops-pack",
  "sales-pack", "secops-pack"]);

// ---------------------------------------------------------------- discovery
function findPluginDirs(base) {
  const found = [];
  const walk = (dir, depth) => {
    if (depth > 3) return;
    let entries; try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      if (!e.isDirectory() || e.name === "node_modules" || e.name === ".git") continue;
      const p = join(dir, e.name);
      if (e.name === ".claude-plugin" && existsSync(join(p, "plugin.json"))) { found.push(dir); continue; }
      walk(p, depth + 1);
    }
  };
  walk(base, 0);
  return found.sort();
}

function walkFiles(dir, pred, acc = []) {
  let entries; try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return acc; }
  for (const e of entries) {
    const p = join(dir, e.name);
    if (e.isDirectory()) {
      if (["node_modules", "__tests__", "dist", ".git"].includes(e.name)) continue;
      walkFiles(p, pred, acc);
    } else if (pred(p, e.name)) acc.push(p);
  }
  return acc;
}

// ---------------------------------------------------------------- ground truth: static
const TOOLISH = /^[a-z][a-z0-9]*(?:_[a-z0-9]+)+$/;
const TOOLISH_SRC = "[a-z][a-z0-9]*(?:_[a-z0-9]+)+";

/**
 * Return the paren-balanced parameter list starting at `open` (index of the `(`).
 * Balancing parens is safe across TS param lists: arrow-function types
 * (`(a: X) => Y`) and indexed access types (`Tool["inputSchema"]`) nest cleanly.
 */
function paramList(text, open) {
  let depth = 0;
  for (let i = open; i < text.length; i++) {
    if (text[i] === "(") depth++;
    else if (text[i] === ")" && --depth === 0) return text.slice(open + 1, i);
  }
  return null;
}

/**
 * Names of local *tool factory* helpers — functions that take the tool name and
 * its schema and return the Tool for you:
 *
 *   function ro(name: string, description: string, inputSchema: Tool["inputSchema"], call) {
 *     return { tool: { name, description, inputSchema }, call };
 *   }
 *   const specs = [ ro("vendor_clients_list", "…", schema({…}), (c, a) => …) ];
 *
 * There is no `name: "…"` literal anywhere, so the object-literal pass below
 * cannot see a single one of these tools. A factory is recognised by its
 * signature declaring both a `name` and an `inputSchema` parameter, with `name`
 * first — the tool name is then the first argument at each call site.
 */
function toolFactories(text) {
  const names = new Set();
  const DECL = /(?:^|[\s;])(?:export\s+)?(?:function\s+([A-Za-z_$][\w$]*)\s*(\()|(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:function\s*)?(\())/g;
  let m;
  while ((m = DECL.exec(text))) {
    const fn = m[1] ?? m[3];
    const params = paramList(text, m.index + m[0].length - 1);
    if (!fn || !params) continue;
    if (!/\binputSchema\b/.test(params)) continue;
    if (!/^\s*name\s*[:,)]/.test(params) && !/^\s*name\s*$/.test(params)) continue;
    names.add(fn);
  }
  return names;
}

function staticTools(serverDir) {
  if (!SERVERS_ROOT) return null;
  const src = join(SERVERS_ROOT, serverDir, "src");
  if (!existsSync(src)) return null;
  const files = walkFiles(src, (p, n) =>
    [".ts", ".js", ".mts", ".mjs"].includes(extname(n)) &&
    !/\.(test|spec)\.[cm]?[tj]s$/.test(n) && !/\.d\.ts$/.test(n) &&
    // prompts.ts declares MCP *prompt* arguments as `{ name: 'client_name' }` —
    // same object shape as a Tool literal, but not a tool.
    !/^prompts\.[cm]?[tj]s$/.test(n));
  const texts = files.map((f) => readFileSync(f, "utf8"));
  // Factories are collected across the whole src tree first: a repo may declare
  // them in one module and call them from another.
  const factories = new Set();
  for (const text of texts) for (const fn of toolFactories(text)) factories.add(fn);
  const FACTORY = factories.size
    ? new RegExp(`\\b(?:${[...factories].join("|")})\\(\\s*(['"\`])(${TOOLISH_SRC})\\1`, "g")
    : null;

  const tools = new Set();
  const REG = /\.(?:registerTool|tool|addTool)\(\s*(['"`])([a-z][a-z0-9]*(?:_[a-z0-9]+)+)\1/g;
  for (const text of texts) {
    const lines = text.split("\n");
    // MCP `Tool` object literals: `name: "x"` with an adjacent inputSchema/description.
    for (let i = 0; i < lines.length; i++) {
      const m = lines[i].match(/name:\s*(['"`])([a-z][a-z0-9]*(?:_[a-z0-9]+)+)\1/);
      if (!m) continue;
      const win = lines.slice(Math.max(0, i - 3), i + 16).join("\n");
      if (/inputSchema/.test(win)) tools.add(m[2]);
    }
    // Imperative registration: server.registerTool("x", ...) — often multi-line.
    let r; REG.lastIndex = 0;
    while ((r = REG.exec(text))) tools.add(r[2]);
    // Tool-factory call sites: ro("x", …), hi("x", …), irrev("x", …).
    if (FACTORY) { FACTORY.lastIndex = 0; while ((r = FACTORY.exec(text))) tools.add(r[2]); }
  }
  return [...tools].sort();
}

// ---------------------------------------------------------------- documented names
const DOC_GLOBS = (dir) => walkFiles(dir, (p, n) => {
  if (extname(n) !== ".md") return false;
  const rel = relative(dir, p);
  // Plugin-root docs (README.md, GOVERNANCE.md, …) plus the four content dirs.
  return !rel.includes("/") || /^skills\//.test(rel) || /^references\//.test(rel) ||
         /^agents\//.test(rel) || /^commands\//.test(rel);
});

function documentedNames(pluginDir) {
  const files = DOC_GLOBS(pluginDir);
  const hits = new Map(); // name -> [file:line]
  for (const f of files) {
    const lines = readFileSync(f, "utf8").split("\n");
    for (let i = 0; i < lines.length; i++) {
      // backtick-quoted tokens, plus mcp__vendor__tool references
      for (const m of lines[i].matchAll(/`([^`\s]+)`/g)) {
        let t = m[1];
        const ns = t.match(/^mcp__[a-z0-9-]+__(.+)$/);
        if (ns) t = ns[1];
        if (!TOOLISH.test(t)) continue;
        if (!hits.has(t)) hits.set(t, []);
        hits.get(t).push(`${relative(pluginDir, f)}:${i + 1}`);
      }
    }
  }
  return hits;
}

// ---------------------------------------------------------------- classification
function prefixesOf(tools) {
  const p = new Set();
  for (const t of tools) p.add(t.split("_")[0]);
  return p;
}
function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const d = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++)
    d[i][j] = Math.min(d[i-1][j] + 1, d[i][j-1] + 1, d[i-1][j-1] + (a[i-1] === b[j-1] ? 0 : 1));
  return d[m][n];
}
function nearest(name, pool) {
  const segsA = new Set(name.split("_"));
  let best = null, bestScore = -1;
  for (const c of pool) {
    const segsB = new Set(c.split("_"));
    let inter = 0; for (const s of segsA) if (segsB.has(s)) inter++;
    const jac = inter / new Set([...segsA, ...segsB]).size;
    const lev = 1 - levenshtein(name, c) / Math.max(name.length, c.length);
    const score = jac * 0.7 + lev * 0.3;
    if (score > bestScore) { bestScore = score; best = c; }
  }
  return { candidate: best, score: bestScore };
}

// ---------------------------------------------------------------- run
const runtime = RUNTIME_JSON && existsSync(RUNTIME_JSON)
  ? Object.fromEntries(JSON.parse(readFileSync(RUNTIME_JSON, "utf8"))
      .filter((r) => r.ok).map((r) => [r.vendor, r.tools]))
  : {};

// Third source: the gateway's pinned prod schemas (schemas/<vendor>.json), captured
// from the image digests in .harness/vendors.json. Available for 12 vendors only.
function schemaTools(vendorId) {
  if (!vendorId || !GATEWAY) return null;
  const p = join(GATEWAY, "schemas", `${vendorId}.json`);
  if (!existsSync(p)) return null;
  try {
    const j = JSON.parse(readFileSync(p, "utf8"));
    return (j.tools || []).map((t) => t.name).sort();
  } catch { return null; }
}

const live = LIVE_JSON && existsSync(LIVE_JSON) ? JSON.parse(readFileSync(LIVE_JSON, "utf8")) : {};

const report = [];
for (const dir of findPluginDirs(PLUGINS)) {
  const slug = relative(PLUGINS, dir);
  if (SKIP.has(slug)) continue;
  const mapped = PLUGIN_MAP[slug] ?? { server: `${slug.split("/").pop()}-mcp`, vendor: slug.split("/").pop() };
  const serverDir = mapped.server;
  const st = serverDir ? staticTools(serverDir) : null;
  const rt = serverDir ? runtime[serverDir] : null;
  const sc = mapped.hostedNote ? null : schemaTools(mapped.vendor);
  const lv = mapped.vendor && live[mapped.vendor] ? live[mapped.vendor] : null;
  const truth = st || rt || sc || lv
    ? [...new Set([...(st || []), ...(rt || []), ...(sc || []), ...(lv || [])])].sort()
    : null;

  const docs = documentedNames(dir);
  const entry = {
    plugin: slug, server: serverDir, vendor: mapped.vendor,
    hostedNote: mapped.hostedNote || null,
    groundTruth: truth,
    groundTruthSource: truth
      ? [st && "static", rt && "runtime", sc && "prod-schema", lv && "live-gw"].filter(Boolean).join("+")
      : "NONE",
    runtimeCount: rt ? rt.length : null, staticCount: st ? st.length : null,
    schemaCount: sc ? sc.length : null, liveCount: lv ? lv.length : null,
    documented: [], drifted: [], undocumented: [], unverified: !truth,
    // Self-check: anything the live server advertised that the static scan missed.
    staticMissed: st && rt ? rt.filter((t) => !st.includes(t)) : [],
  };
  if (!truth) {
    // No ground truth (hosted upstream / unbuilt server). Still record what the
    // docs claim, using the plugin slug as the namespace guess, so the vendor
    // lands in the "unverified" bucket with its claim surface visible.
    const guess = slug.split("/").pop().replace(/-/g, "_");
    const alt = slug.split("/").pop().split("-")[0];
    entry.documentedUnverified = [...docs.keys()].filter((n) => {
      const head = n.split("_")[0];
      return n.startsWith(guess + "_") || head === alt;
    }).sort();
    entry.allDocTokens = [...docs.keys()].sort();
    report.push(entry); continue;
  }

  const prefixes = prefixesOf(truth);
  const truthSet = new Set(truth);
  for (const [name, sites] of docs) {
    if (!prefixes.has(name.split("_")[0])) continue; // not a tool of this server's namespace
    entry.documented.push(name);
    if (truthSet.has(name)) continue;
    const { candidate, score } = nearest(name, truth);
    entry.drifted.push({
      name, sites: sites.slice(0, 6), occurrences: sites.length,
      classification: score >= 0.45 ? "renamed" : "absent",
      realName: score >= 0.45 ? candidate : null, similarity: +score.toFixed(2),
    });
  }
  const docSet = new Set(entry.documented);
  entry.undocumented = truth.filter((t) => !docSet.has(t));
  entry.documented.sort(); entry.drifted.sort((a, b) => a.name.localeCompare(b.name));
  report.push(entry);
}

if (JSON_OUT) writeFileSync(JSON_OUT, JSON.stringify(report, null, 2));

// ---------------------------------------------------------------- console summary
const drifted = report.filter((r) => r.drifted.length);
const clean = report.filter((r) => !r.unverified && !r.drifted.length);
const unver = report.filter((r) => r.unverified);
console.log("PLUGIN".padEnd(38) + "TRUTH".padEnd(7) + "DOC'D".padEnd(7) + "DRIFT".padEnd(7) + "UNDOC".padEnd(7) + "SOURCE");
for (const r of report) {
  console.log(
    r.plugin.padEnd(38) +
    String(r.groundTruth ? r.groundTruth.length : "-").padEnd(7) +
    String(r.documented.length).padEnd(7) +
    String(r.drifted.length).padEnd(7) +
    String(r.undocumented.length).padEnd(7) +
    r.groundTruthSource,
  );
}
console.log(`\ndrifted=${drifted.length} clean=${clean.length} unverified=${unver.length} total=${report.length}`);
process.exitCode = drifted.length ? 1 : 0;
