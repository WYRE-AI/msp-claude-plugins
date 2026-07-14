# Roadmap

> Last updated 2026-07-13. Maintained by [WYRE Technology](https://wyretechnology.com).
> Live project board: [github.com/orgs/wyre-technology/projects/1](https://github.com/orgs/wyre-technology/projects/1)

This document is the public strategy and roadmap for `msp-claude-plugins`. It says
what we're committed to, where the project is going, and how releases work — so you
can decide whether to build on it. Short version: you can.

## Our commitment to this project

**This repository is not being abandoned, wound down, or replaced.** It is the
canonical community marketplace for MSP Claude Code plugins, and it stays that way.
The community that formed around this repo — contributors, issue reporters, MSPs
running these plugins in production — is the most valuable thing the project has
built, and we intend to keep earning it.

Concretely: every commit to `main` passes `claude plugin validate` in CI, and
`main` is branch-protected on that workflow, so the marketplace stays installable
by construction. Nothing is removed silently — deprecations are called out in
[CHANGELOG.md](CHANGELOG.md) and the README before a plugin disappears. Every
user-visible change lands in [CHANGELOG.md](CHANGELOG.md) following
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) conventions.

Today the marketplace carries **63 plugins** — 300+ skills, 250+ slash commands,
115+ subagents — across PSA, RMM, documentation, security, email security,
monitoring, networking, accounting, CRM, and sales tooling. All of it is
maintained under that same standard, whether it was written by WYRE or by a
community contributor.

## One marketplace, two consumers

There is one repo and one catalog. It is consumed two ways, and both consume the
exact same artifact — there is no fork, no parallel format, no "community edition."

```
              wyre-technology/msp-claude-plugins
        one repo · one marketplace.json · one set of plugins
                (skills, agents, commands, .mcp.json)
                              │
          ┌───────────────────┴───────────────────┐
          │                                       │
  Claude Code / Claude Desktop            Conduit (mcp.wyre.ai)
  ──────────────────────────              ──────────────────────────
  /plugin marketplace add                 Marketplace ingestion,
    wyre-technology/msp-claude-plugins    pinned to a git SHA per sync
  /plugin install <name>@msp-claude-plugins
          │                                       │
  plugins run locally: skills,            curated skills catalog with
  agents, slash commands, and             org-level grants, automated
  .mcp.json connections               security scanning, and audit
                                          trails layered on top
```

- **Claude Code path** — the classic open-source flow. Add the marketplace, install
  plugins, done. Free, no account, works offline once installed.
- **Conduit path** — [Conduit](https://mcp.wyre.ai) syncs this repo into its
  curated skills catalog (each sync pinned to an exact commit SHA). Organizations
  get the same skills with governance on top: admins grant packs to teams, every
  ingested skill passes automated security scanning before it's enabled, and usage
  is auditable. WYRE's first-party plugins, skills, and subagents form the curated
  tier inside the same catalog.

The north star for both paths is the same: **dead simple**. One command (or one
click) to enable a plugin or a pack — with Conduit adding the compliance and
governance layer that MSP organizations need, not a different install experience.

## What just shipped

- **Official-format alignment** ([#136](https://github.com/wyre-technology/msp-claude-plugins/pull/136),
  merged). The marketplace now validates clean against the official Claude Code
  plugin-marketplace spec: real SchemaStore `$schema`, `plugin.json` as the sole
  version authority, entry names aligned with plugin names, and a CI `Validate`
  workflow with a drift check and a **version bump-gate** (see
  [Versioning](#versioning-and-releases) below).
- **Frontmatter modernization** ([#137](https://github.com/wyre-technology/msp-claude-plugins/pull/137),
  in review). Every command, skill, and agent migrates to the official Claude Code
  frontmatter formats — 252 commands, 301 skills, and a repo-wide fix for invalid
  agent YAML. Once merged, per-plugin validation flips from advisory to hard-fail
  in CI.
- **Conduit marketplace ingestion** ([conduit#917](https://github.com/wyre-technology/conduit/pull/917),
  in review). Conduit learns to load skills directly from an official Claude Code
  plugin-marketplace repo — this one. Single pinned SHA per sync, pre-ingestion
  security scanning, provenance recorded. This is what makes "one marketplace, two
  consumers" real rather than aspirational.

## Near term: industry workflow packs

The next major addition to the catalog. Today's plugins are **vendor-shaped** — one
plugin per tool, deep knowledge of that tool's API. Workflow packs are
**job-shaped**: cross-vendor plugins that bundle the skills, subagents, and slash
commands for how an MSP actually runs a function, wired to live systems through
the WYRE MCP Gateway's connectors. Packs compose vendor plugins; they don't
duplicate them.

Packs ship continually as partners and integrations are added — each pack is a
normal plugin in this marketplace, individually versioned, installable via
`/plugin install <pack>@msp-claude-plugins` or enabled with one click in Conduit.

The first four:

### 1. MSP Operations (`ops-pack`)

The daily service-desk engine: board health, dispatch, SLA pressure, handoffs.

- **Skills:** `sla-escalation-playbooks`, `dispatch-prioritization`, `board-hygiene`
- **Agents:** `board-health-auditor`, `stale-ticket-chaser`, `dispatch-coordinator`
- **Commands:** `/ops-pack:morning-huddle`, `/ops-pack:sla-breaches`, `/ops-pack:eod-handoff`

### 2. Security Operations (`secops-pack`)

Cross-vendor alert triage and incident response across your EDR/MDR/SIEM stack
(Huntress, Blackpoint, SentinelOne, Blumira, SaaS Alerts, CIPP — whatever is
connected).

- **Skills:** `alert-severity-normalization`, `containment-playbooks`, `bec-response`
- **Agents:** `overnight-alert-summarizer`, `incident-timeline-builder`, `tenant-exposure-ranker`
- **Commands:** `/secops-pack:portfolio-sweep`, `/secops-pack:incident-report`, `/secops-pack:tenant-exposure`

### 3. Finance & Billing (`finance-pack`)

Agreement and billing truth across PSA, accounting (QuickBooks Online, Xero), and
distribution (Pax8, Sherweb).

- **Skills:** `agreement-reconciliation`, `license-true-up`, `margin-analysis`
- **Agents:** `billing-drift-detector`, `renewal-calendar-builder`, `profitability-ranker`
- **Commands:** `/finance-pack:month-end-recon`, `/finance-pack:true-up`, `/finance-pack:renewals`

### 4. Compliance (`compliance-pack`)

Evidence collection and control drift against the frameworks MSP clients actually
get asked about (CIS, SOC 2, HIPAA, cyber-insurance questionnaires), grounded in
CIPP, Liongard, and IT Glue.

- **Skills:** `evidence-mapping`, `standards-drift`, `insurance-questionnaires`
- **Agents:** `evidence-packager`, `control-drift-reporter`, `questionnaire-autofiller`
- **Commands:** `/compliance-pack:evidence-pack`, `/compliance-pack:drift-report`, `/compliance-pack:questionnaire`

The pack anatomy — what's in one, the design rules, and the `.mcp.json` gateway
wiring — is documented in the
[workflow-pack template](msp-claude-plugins/_templates/workflow-pack-template/README.md).
Names and contents above are the design targets; each pack lands via a normal PR
with its own PRD, and the catalog grows from there as new partner integrations come
online.

## How to contribute

Same as always — [CONTRIBUTING.md](CONTRIBUTING.md) has the full tiered guide:

- **Tier 1 — quick fixes:** typos, field-mapping corrections, bug fixes. Fork,
  branch, PR. No process.
- **Tier 2 — enhancements:** new commands/skills for existing plugins. Open a
  feature issue, get a maintainer thumbs-up, PR.
- **Tier 3 — new platforms (and new workflow packs):** PRD first, from
  `_templates/`. Community review, then build.

Contributions that land here reach both consumers automatically: Claude Code users
on their next `/plugin marketplace update`, and Conduit organizations on the next
catalog sync. One PR, both audiences.

Questions or ideas? [Discussions](https://github.com/wyre-technology/msp-claude-plugins/discussions)
or [Discord](https://discord.gg/cCPtPaFw8e).

## Versioning and releases

- **Semver, per plugin.** Each plugin's `.claude-plugin/plugin.json` is the sole
  version authority (marketplace entries carry no version fields as of #136).
- **The bump-gate.** Claude Code's update detection is a version-string match —
  pushing changes without bumping the version means installed users silently never
  receive them. CI therefore fails any PR that changes files under a plugin's
  directory without bumping that plugin's version. If CI is green, shipped means
  shipped.
- **Conventional commits** (`fix:`, `feat:`, `docs:`, …) on every PR; every
  user-visible change is recorded in [CHANGELOG.md](CHANGELOG.md) under
  [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) conventions.
- **Getting updates.** Claude Code: `/plugin marketplace update msp-claude-plugins`.
  Conduit: catalog syncs are pinned to a commit SHA, so an org's catalog states
  exactly which version of this repo it reflects.

---

Built by MSPs, for MSPs — and staying that way.
