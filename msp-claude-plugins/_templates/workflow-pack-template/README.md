# Industry Workflow Pack — anatomy and exemplar

This is the design note for **industry workflow packs**: cross-vendor plugins that
bundle the skills, subagents, and slash commands for how an MSP runs a whole
function — operations, security ops, finance/billing, compliance — rather than for
a single vendor's API. The roadmap context is in the repo-root
[ROADMAP.md](../../../ROADMAP.md).

This document is deliberately one file: it defines the structure and rules so the
first pack PR (and every one after it) scaffolds against a settled shape. Do not
copy this directory into a plugin; author the pack directory fresh and use the
snippets below as the exemplar.

## What a pack is (and is not)

| | Vendor plugin (existing) | Workflow pack (new) |
|---|---|---|
| Shape | Tool-shaped: one vendor, deep API knowledge | Job-shaped: one MSP function, many vendors |
| Skills teach | Endpoints, field mappings, rate limits | Playbooks, judgment calls, cross-system sequences |
| Tools come from | The vendor's MCP server or the gateway | The WYRE MCP Gateway (`.mcp.json` below) |
| Example | `autotask`, `huntress`, `quickbooks-online` | `ops-pack`, `secops-pack`, `finance-pack`, `compliance-pack` |

Three hard rules:

1. **Packs compose, never duplicate.** A pack must not restate vendor API knowledge
   that lives in a vendor plugin's skills. If a pack needs Autotask status
   semantics, its skill says "resolve status IDs via `autotask_list_ticket_statuses`" —
   it does not re-document Autotask's status model. Duplicated knowledge drifts.
2. **Ground every tool reference in the real gateway tool surface.** Agents and
   commands name actual tools (`autotask_search_tickets`, `huntress_incidents_list`,
   `cipp_list_tenants`). No invented tool names — this is what separates a pack
   that works from marketing markdown.
3. **Degrade explicitly.** Packs span vendors, but no MSP has every connector.
   Every agent and command declares what it needs and what it does when a
   connector is absent (skip the section and say so — never silently fabricate).

## Exemplar structure: `ops-pack`

Packs live under a `workflow-packs/` vendor-level directory inside the plugin
root, one directory per pack, and are registered in `.claude-plugin/marketplace.json`
like any other plugin:

```
msp-claude-plugins/workflow-packs/ops-pack/
├── .claude-plugin/
│   └── plugin.json               # name + version authority (bump-gate applies)
├── README.md                     # what the pack runs, required/optional connectors
├── .mcp.json                     # gateway wiring — see below
├── skills/
│   ├── sla-escalation-playbooks/SKILL.md
│   ├── dispatch-prioritization/SKILL.md
│   └── board-hygiene/SKILL.md
├── agents/
│   ├── board-health-auditor.md
│   ├── stale-ticket-chaser.md
│   └── dispatch-coordinator.md
└── commands/
    ├── morning-huddle.md         # → /ops-pack:morning-huddle
    ├── sla-breaches.md           # → /ops-pack:sla-breaches
    └── eod-handoff.md            # → /ops-pack:eod-handoff
```

### `plugin.json`

```json
{
  "name": "ops-pack",
  "displayName": "MSP Operations Pack",
  "description": "Cross-vendor service-desk operations: board health, dispatch, SLA pressure, and shift handoffs across your connected PSA and RMM",
  "version": "0.1.0",
  "author": { "name": "MSP Claude Plugins Community" },
  "homepage": "https://github.com/wyre-technology/msp-claude-plugins",
  "repository": "https://github.com/wyre-technology/msp-claude-plugins",
  "license": "Apache-2.0"
}
```

### Marketplace entry

```json
{
  "name": "ops-pack",
  "displayName": "MSP Operations Pack",
  "source": "./msp-claude-plugins/workflow-packs/ops-pack",
  "description": "Cross-vendor service-desk operations: board health, dispatch, SLA pressure, and shift handoffs",
  "category": "workflow-pack",
  "tags": ["workflow-pack", "operations", "msp", "cross-vendor"]
}
```

`category: "workflow-pack"` is the discriminator both consumers use: the docs site
groups packs separately from vendor plugins, and Conduit's catalog surfaces them as
enable-in-one-click bundles.

### `.mcp.json` — Conduit gateway wiring

Packs are cross-vendor by definition, so they connect through the WYRE MCP Gateway
(one authenticated connection, every connected vendor's tools) rather than to
individual vendor MCP servers:

```json
{
  "mcpServers": {
    "msp-mcp-gateway": {
      "type": "http",
      "url": "https://mcp.wyre.ai/v1/mcp"
    }
  }
}
```

This is the same wiring the `wyre-gateway` plugin ships. Installing a pack in
Claude Code prompts the user to approve this server once; authentication is
OAuth 2.1 + PKCE against the gateway, and which vendor tools actually appear is
governed by the org's connected vendors and Conduit's org grants — the pack never
carries credentials.

Self-hosters can point the same pack at their own gateway URL; the pack's README
must say so.

### Skill exemplar (official frontmatter — matches `_templates/skill-template/`)

```markdown
---
name: "SLA Escalation Playbooks"
when_to_use: >-
  When tickets are approaching or breaching SLA and the operator needs the
  escalation sequence. Use when: SLA breach, escalation, response-time risk,
  "what's about to breach".
description: >
  Use this skill when triaging SLA pressure across the connected PSA. Covers
  breach-risk ordering, who gets paged at each escalation stage, and how to
  post an escalation note the PSA's workflow rules will pick up. Resolve
  status/priority IDs via the connected PSA's list tools (e.g.
  autotask_list_ticket_statuses) — never hardcode tenant-specific IDs.
---
```

Body sections follow the skill template: Overview, Key Concepts, Common Workflows,
Error Handling. The pack-specific difference: a required **"Connected systems"**
section listing which gateway connectors the skill draws on (required vs
optional), and what changes when an optional one is missing.

### Agent exemplar (official frontmatter — matches `_templates/agent-template.md`)

```markdown
---
name: board-health-auditor
description: Use this agent when a service manager needs a cross-board health
  read - aging, unassigned, SLA-risk, and stale-ticket hotspots across the
  connected PSA. Trigger for daily board reviews, "how's the board look",
  pre-standup prep, and dispatch-load questions. Examples - "audit the board",
  "what's rotting in the queue", "morning board health check"
model: inherit
---

You are a service-desk operations analyst for an MSP. You ground yourself
first: test the gateway connection, list the PSA's queues and statuses once,
then pull open tickets ordered by SLA risk...
```

Agents follow the four-paragraph structure from the agent template (grounding,
sequencing, reporting, variants) plus Capabilities and Approach sections. Pack
agents additionally declare **required connectors** in their opening grounding
paragraph and skip-with-a-note behavior for missing ones.

### Command exemplar (official frontmatter — matches `_templates/command-template.md`)

```markdown
---
description: Cross-system morning huddle - overnight alerts, board state, SLA risk, and today's schedule in one digest
argument-hint: "[queue]"
arguments: [queue]
---

# Morning Huddle

## Prerequisites

- WYRE MCP Gateway connected (`msp-mcp-gateway`) with at least a PSA connector
- Optional: RMM, security connectors (sections are skipped with a note if absent)

## Steps

1. Verify gateway connectivity (call the PSA's test/ping tool)
2. Pull overnight alerts from each connected security/RMM vendor
3. Pull board state from the PSA (new, unassigned, SLA-risk), scoped to `queue` if given
4. Emit the huddle digest: alerts → board → SLA risk → capacity flags

## Arguments

- `queue` (optional) — Limit the board section to one PSA queue/board
```

## Versioning and release

Packs are plugins: semver in `plugin.json`, the CI bump-gate applies (any change
under the pack directory without a version bump fails the PR), user-visible
changes go in the repo [CHANGELOG.md](../../../CHANGELOG.md). Packs start at
`0.1.0` and go `1.0.0` when every shipped agent/command has been exercised against
a live gateway org.

## Definition of done for a new pack

- [ ] PRD submitted and approved (Tier 3 in [CONTRIBUTING.md](../../../CONTRIBUTING.md))
- [ ] Every tool name verified against the live gateway tool surface
- [ ] No duplicated vendor-plugin knowledge (composition rule above)
- [ ] Explicit missing-connector behavior in every agent and command
- [ ] `claude plugin validate <pack-dir>` clean
- [ ] Marketplace entry with `category: "workflow-pack"`; drift check green
- [ ] README lists required vs optional connectors and the self-hosted gateway note
- [ ] Exercised end-to-end against a gateway org with a representative connector set
