# Portability — consuming these plugins outside Claude Code

This repo's plugins are Markdown skills, slash commands, and agents. That is a
Claude-Code-shaped artifact. Most other AI harnesses consume **MCP tools**, and
a few now also consume **skill packs**. This document explains which file serves
which consumer, and how to regenerate the derived ones.

## The four consumer paths

| Consumer | What it reads | Status here |
| --- | --- | --- |
| **Claude Code** | `.claude-plugin/marketplace.json` + `<pack>/.claude-plugin/plugin.json` | Hand-maintained. The source of truth. |
| **Codex / ChatGPT desktop** | `.agents/plugins/marketplace.json` | **Generated.** All 83 packs. |
| **Any MCP host** (ChatGPT developer mode, Cursor, VS Code, Gemini CLI, …) | The Conduit gateway's MCP endpoint | Already live — no file in this repo required. |
| **Tooling / ingest** | `.agents/catalog.json` | **Generated.** Real versions + inventory. |

### 1. `.claude-plugin/marketplace.json` — Claude Code (source of truth)

Hand-maintained, 83 entries, validated by `scripts/check-marketplace-drift.mjs`.
Entries deliberately carry **no `version`** — `plugin.json` is the sole version
authority, because an entry-level version is silently ignored at install time
and then drifts.

**Never edit this file with a generator.** Everything below is derived *from* it.

### 2. `.agents/plugins/marketplace.json` — Codex / ChatGPT desktop (generated)

OpenAI's Codex and the ChatGPT desktop app read a marketplace from
`$REPO_ROOT/.agents/plugins/marketplace.json`, in their own schema — nested
`source` objects, an install `policy`, a Title-Case `category`, and a top-level
`interface.displayName`. They also read `$REPO_ROOT/.claude-plugin/marketplace.json`
as a *legacy-compatible* path, so this repo was already partly reachable; the
`.agents/` file is the canonical path and the only one that can express `policy`.

Spec: <https://developers.openai.com/codex/plugins/build/>

Policy applied to every entry is a single constant in the generator:
`installation: "AVAILABLE"` (these are opt-in packs, not defaults) and
`authentication: "ON_INSTALL"` (the only value OpenAI's docs show verbatim, and
what the previous hand-written file used). OpenAI publishes no enum for
`category`; the generator humanizes this repo's kebab-case slugs mechanically
(`email-security` → `Email Security`, `psa-rmm` → `PSA RMM`).

### 3. The Conduit MCP endpoint — every other harness (nothing to generate)

For ChatGPT, Cursor, VS Code, Gemini CLI and anything else that speaks MCP, the
answer is not a manifest in this repo. The WYRE Conduit gateway already serves
these packs over MCP at `https://conduit.wyre.ai/v1/mcp`:

- `conduit__list_skills` / `conduit__get_skill` — plain tools. These work in
  **any** MCP host today, and are the path to rely on.
- `skill://{pack}/{skill}/SKILL.md` resources and the MCP skills extension
  (`io.modelcontextprotocol/skills`, SEP-2640), for hosts that implement it.

Point a harness at that endpoint and the skills are available with no install
step. The endpoint and tool names are recorded under `mcp` in `.agents/catalog.json`
so tooling does not have to hardcode them.

Two caveats worth knowing before leaning on the extension rather than the tools.
SEP-2640 was only merged into the MCP spec on 2026-09-13, so host support is
close to nonexistent — the gateway is ahead of its clients here. And ChatGPT
specifically reads MCP skills at plugin *submission* time and snapshots them,
rather than fetching them live on each run; for live skill delivery the
plugin/marketplace path (#2) is the one that matters.

### 4. `.agents/catalog.json` — tooling and ingest (generated)

A flat inventory of every pack: its **real version read from
`.claude-plugin/plugin.json`**, its category and tags, its `mcpServers` block,
and the path of every skill, command, and agent.

It exists because the version has nowhere else to live in a machine-readable
form. The Claude manifest rightly refuses an entry-level `version` (rule 2), and
the Codex marketplace schema has no version field at all — so any consumer that
wants "what version is this pack" has to open 83 `plugin.json` files, and
consumers that read a marketplace entry's `version` get nothing. Conduit's
marketplace ingest is exactly such a consumer: it reads `entry.version` and
falls back to `'0.0.0'`, which is what every pack from this repo currently lands
as in its registry. `catalog.json` is the fix that does not require weakening
rule 2.

It carries no descriptions — those live in `SKILL.md`, and duplicating them into
a generated file would create a second copy to drift.

## Regenerating

```bash
node scripts/generate-agents-manifest.mjs           # write both .agents/ files
node scripts/generate-agents-manifest.mjs --check   # CI: fail if stale
```

Run it after adding a plugin, bumping a `plugin.json` version, or changing a
skill/command/agent file. Then confirm the Claude manifest is still intact:

```bash
node scripts/check-marketplace-drift.mjs
```

The generator is idempotent — output is a pure function of the tree, with no
timestamp or commit SHA — so `--check` is safe to gate CI on.

## What this does *not* do

- It does **not** create per-plugin manifests, which is the real unlock and the
  recommended next step. [Agent Plugins 1.0.0](https://agent-plugins.org/) — a
  vendor-neutral standard whose steering committee spans Amazon, Cursor, Google,
  Microsoft, OpenAI, and Vercel, and which is independently implemented by
  VS Code / Copilot, Cursor, and Devin Desktop — defines a portable `plugin.json`
  and `mcp.json` at each *plugin root* (visible, not under `.claude-plugin/`).
  Every pack here is close: skills already live at `skills/<name>/SKILL.md` where
  the spec expects them, and the existing `.claude-plugin/plugin.json` files
  already carry `name`, `version`, `description`, `author`, `homepage`,
  `repository`, `license`, and `keywords` — the schema's field set. Two gaps
  remain: the schema *requires* a literal `$schema` key, and it is
  `additionalProperties: false`, so the `displayName` that 11 packs carry would
  have to move under `extensions`. Doing this writes inside plugin directories,
  so it is out of scope for this generator.
- It does **not** add `.agents/skills/`. That directory is a genuine cross-client
  convention (Codex, Cursor, Copilot, Zed, Amp, Gemini CLI and Devin Desktop all
  scan it), but it is scoped to the repo an agent is *working in*. Consumers
  install these packs; they do not clone this repo. Populating it would mean
  duplicating 374 `SKILL.md` files into a second location that immediately
  starts to drift.
- It does **not** implement a cross-vendor catalog format, because there is not a
  settled one. [ARD](https://agenticresourcediscovery.org/) is the serious
  attempt — a `/.well-known/ard.json` catalog backed by Google, Microsoft,
  GitHub, AWS, Hugging Face and others — but it is still a v0.91 *proposal*, and
  the MCP Registry catalogs MCP servers only and is in preview. Worth tracking;
  not worth building against yet.

## Known leftovers

`msp-claude-plugins/kaseya/autotask/.codex-plugin/plugin.json` is a hand-written
remnant of the original single-plugin experiment. It is pinned at version `0.6.1`
while the plugin is at `0.6.2`, and it names the plugin `kaseya-autotask` while
the plugin is actually named `autotask` — the exact drift that keeping versions
in one place is meant to prevent. It should be regenerated or deleted rather than
hand-maintained.
