# ScalePad Plugin

Claude Code plugin for [ScalePad](https://www.scalepad.com) - asset lifecycle management, warranty services, client engagement roadmaps, compliance, backup monitoring, and quoting for MSPs.

## What It Does

- **Core** - Read-only unified platform data: clients, contacts, members, sites, opportunities, hardware/SaaS assets, product catalog, service contracts, tickets, integrations
- **Lifecycle Manager** - Engagement and roadmap workflows: initiatives, goals, meetings, action items, assessments, deliverables, budgets, contracts, warranty pricing, hardware lifecycles
- **ControlMap** - Compliance management per client: risks, controls, evidence, policies, framework objectives, assessments, action items
- **Backup Radar** - Read-only backup health and backup device inventory per client
- **Quoter** - Quotes, catalog items/groups, contacts, suppliers, and OAuth helpers for the standalone api.quoter.com path

## Installation

```
/plugin marketplace add wyre-technology/msp-claude-plugins
/plugin install scalepad
```

The plugin connects through the [WYRE MCP Gateway](https://mcp.wyre.ai) at `https://mcp.wyre.ai/v1/scalepad/mcp`.

## Configuration

| Variable | Required | Description |
|----------|----------|-------------|
| `X_SCALEPAD_API_KEY` | Yes | ScalePad platform API key (generated in the ScalePad app by an Administrator; sent as `X-ScalePad-Api-Key`). One key covers Core, Lifecycle Manager, ControlMap, Backup Radar, and the hosted Quoter API. |
| `X_SCALEPAD_REGION` | No | Data-residency region: `us` (default), `eu`, `ca`, or `au`. Affects ControlMap (us/eu/ca/au) and Backup Radar (us/eu); Core and Lifecycle Manager are US-only. Sent as `X-ScalePad-Region`. |
| `X_QUOTER_CLIENT_ID` | No | Quoter OAuth client ID - only needed for the standalone api.quoter.com path. Sent as `X-Quoter-Client-Id`. |
| `X_QUOTER_CLIENT_SECRET` | No | Quoter OAuth client secret, paired with the client ID. Sent as `X-Quoter-Client-Secret`. |

Product endpoints return HTTP 402 when the account lacks an active subscription for that product.

## Skills

- `api-patterns` - Auth, navigation, pagination, rate limits, error handling
- `core` - Unified platform data (read-only)
- `lifecycle-manager` - Initiatives, goals, meetings, assets, warranties, budgets
- `controlmap` - Compliance: risks, controls, evidence, policies, assessments
- `backup-radar` - Backup health and device inventory
- `quoter` - Quote building and catalog management

## Commands

- `/warranty-lookup` - Look up warranty and lifecycle status for a client's hardware
- `/asset-lifecycle-report` - Build an asset lifecycle/aging report for a client
- `/create-quote` - Build and publish a Quoter quote step by step
- `/backup-health` - Check Backup Radar health across a client's backups
- `/compliance-status` - Summarize a client's ControlMap compliance posture

## Agents

- `lifecycle-analyst` - Warranty and asset lifecycle analysis across Core and Lifecycle Manager
- `quote-builder` - End-to-end Quoter quote construction and publication
- `compliance-auditor` - ControlMap risk/control/evidence review

## Tools

Provided by the ScalePad MCP server through the WYRE MCP Gateway. All tools are
exposed upfront; `scalepad_navigate` is a discovery aid that lists a product
domain's tools, and `scalepad_status` reports credential status and available
domains.

| Domain | Prefix | Tools | Notes |
|--------|--------|-------|-------|
| Core | `scalepad_core_*` | 24 | Read-only, US-only |
| Lifecycle Manager | `scalepad_lm_*` | ~190 | Full CRUD over engagement/roadmap workflows |
| ControlMap | `scalepad_cm_*` | ~100 | Compliance CRUD, regions us/eu/ca/au |
| Backup Radar | `scalepad_br_*` | 3 | Read-only, regions us/eu |
| Quoter | `scalepad_quoter_*` | ~60 | Quotes + catalog CRUD |

## License

Apache-2.0
