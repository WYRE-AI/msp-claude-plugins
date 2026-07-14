# MSP Operations (ops-pack)

The daily service-desk engine: board health, dispatch, SLA pressure, and shift
handoffs — cross-vendor, wired to whatever PSA (and optionally RMM) you have
connected through the WYRE MCP Gateway / [Conduit](https://conduit.wyre.ai).

This is a **workflow pack**, not a vendor plugin: it doesn't teach any single PSA's
API. It bundles the judgment layer — escalation decisions, dispatch scoring, board
hygiene — on top of whatever ticket data your connected PSA returns.

## What it needs connected

- **Required:** any PSA (Autotask, HaloPSA, ConnectWise Manage/PSA, Syncro, or
  Kaseya BMS). Every skill, agent, and command discovers the connected PSA's actual
  tools via `conduit__search_tools` before pulling data — nothing here hardcodes a
  vendor's tool names.
- **Optional:** an RMM (Datto RMM, NinjaOne, ConnectWise Automate, Atera) for device
  correlation, and/or an on-call/incident tool (PagerDuty, Rootly) for overnight
  context in the end-of-day handoff. Sections that depend on an optional connector
  are skipped with an explicit note when it isn't present — never silently, never
  fabricated.

If no PSA is connected, every skill, agent, and command in this pack says so
explicitly rather than guessing.

## What's in it

**Skills**
- `sla-escalation-playbooks` — when/how to escalate a ticket approaching or past
  SLA breach, mapped across the major PSA families' SLA models
- `dispatch-prioritization` — how to triage and score an unassigned ticket queue
- `board-hygiene` — stale-ticket detection, duplicate linking, status-transition
  sanity, and queue-balance checks

**Agents**
- `board-health-auditor` — full board-health sweep with a scored report, worst
  offenders first
- `stale-ticket-chaser` — finds cold tickets, diagnoses why they stalled, drafts a
  follow-up action per ticket
- `dispatch-coordinator` — proposes an assignment plan for the unassigned queue with
  rationale per ticket

**Commands**
- `/ops-pack:morning-huddle` — daily kickoff report (no arguments)
- `/ops-pack:sla-breaches [window]` — tickets breaching or about to breach SLA
  within a window (default `24h`)
- `/ops-pack:eod-handoff` — end-of-day handoff summary (no arguments)

## Install

```
/plugin marketplace add wyre-technology/msp-claude-plugins
/plugin install ops-pack@msp-claude-plugins
```

On first use, Claude Code will prompt to connect the `conduit` MCP server
(`https://conduit.wyre.ai/v1/mcp`). Connect at least one PSA through Conduit before
running any command in this pack.

## Related

- [wyre-gateway](../wyre-gateway) — the underlying multi-vendor gateway plugin these
  packs are built on top of
- Individual vendor plugins (`autotask`, `halopsa`, `connectwise`, `syncro`, …) —
  for deep, single-vendor API work this pack deliberately does not duplicate
