# PRD: Liongard Plugin for MSP Claude Plugins

## Overview

Add Liongard support to the MSP Claude Plugins ecosystem. Liongard is an automated IT documentation and configuration management platform for MSPs. It provides continuous monitoring, inspection, and documentation of IT environments across multiple platforms.

**GitHub Issue:** wyre-technology/msp-claude-plugins#17

## Deliverables

1. **node-liongard** — TypeScript client library (`@wyre-technology/node-liongard`)
2. **liongard-mcp** — MCP server with decision-tree architecture (`wyre-technology/liongard-mcp`)
3. **Plugin directory** — Claude Code plugin at `msp-claude-plugins/liongard/liongard/`

## API Reference

- **Docs:** https://docs.liongard.com/reference/developer-guide
- **Base URL:** `https://{instance}.app.liongard.com/api/v1` (v1), `https://{instance}.app.liongard.com/api/v2` (v2)
- **Auth:** API key via `X-ROAR-API-KEY` header (v1) or `X-Auth-Token` header
- **Pagination:** Page-based (`page` + `pageSize` params for GET, `Pagination` object in POST body). Max page size: 2000. Response includes `TotalRows`, `HasMoreRows`, `CurrentPage`, `TotalPages`, `PageSize`.
- **Rate Limits:** Not documented. Start with 300 req/min conservative default.

## Key Entities

| Entity | API Version | Description |
|--------|-------------|-------------|
| Environments | v1 + v2 | Customer organizations / sites being monitored |
| Environment Groups | v2 | Logical groupings of environments |
| Agents | v1 + v2 | Software deployed to customer sites that runs inspections |
| Inspectors | v1 | Templates defining what to inspect (e.g., Active Directory, O365) |
| Launchpoints | v1 | Configured inspection instances (inspector + environment + schedule) |
| Systems | v1 | Discovered systems/devices from inspections |
| Inspections | v1 | Individual inspection run results |
| Detections | v1 + v2 | Change/anomaly detections from inspections |
| Alerts | v1 | Alert rules and triggered alerts |
| Metrics | v1 + v2 | Custom metrics across systems/environments |
| Timeline | v1 + v2 | Audit trail of events and changes |
| Asset Inventory | v2 | Identities and device profiles |
| Dataprints | v2 | JMESPath-evaluated data from system details |
| Webhooks | v2 | Webhook configuration for event notifications |
| Users / Groups | v1 | User and group management |
| Access Keys | v1 | API key management |

## node-liongard Client Library

### Authentication

```typescript
import { LiongardClient } from '@wyre-technology/node-liongard';

const client = new LiongardClient({
  instance: 'yourcompany',        // {instance}.app.liongard.com
  apiKey: 'your-api-key',
  apiVersion: 'v1',               // 'v1' or 'v2', default 'v1'
});
```

### Architecture

Follow the existing node-* library patterns:
- TypeScript, ESM
- Rate limiting (300 req/min default, configurable)
- Automatic pagination helper (`listAll()` iterates all pages)
- Per-resource modules: `client.environments`, `client.agents`, `client.systems`, etc.
- Vitest for testing
- GitHub Packages for publishing

### Core Methods

**Environments:**
- `environments.list(options?)` — paginated list
- `environments.get(id)` — single environment
- `environments.create(data)` — create environment
- `environments.update(id, data)` — update environment
- `environments.delete(id)` — delete environment
- `environments.count()` — total count
- `environments.getRelatedEntities(id)` — related systems, launchpoints, etc.

**Agents:**
- `agents.list(options?)` — list agents
- `agents.delete(ids)` — bulk delete
- `agents.generateInstaller()` — dynamic installer generation

**Systems:**
- `systems.list(options?)` — list discovered systems
- `systems.get(id)` — single system detail

**Inspectors:**
- `inspectors.list(options?)` — list inspector templates
- `inspectors.get(id)` — single inspector

**Launchpoints:**
- `launchpoints.list(options?)` — list configured inspections
- `launchpoints.get(id)` — single launchpoint
- `launchpoints.create(data)` — create launchpoint
- `launchpoints.update(id, data)` — update launchpoint
- `launchpoints.runNow(id)` — trigger immediate inspection

**Detections:**
- `detections.list(options?)` — list detections / changes

**Alerts:**
- `alerts.list(options?)` — list alerts
- `alerts.get(id)` — single alert

**Metrics:**
- `metrics.list(options?)` — list defined metrics
- `metrics.evaluate(options)` — get metric values
- `metrics.evaluateSystems(options)` — metrics for systems

**Timeline:**
- `timeline.list(options?)` — list timeline events

**Asset Inventory (v2):**
- `inventory.identities.list(options?)` — list identities
- `inventory.identities.get(id)` — single identity
- `inventory.devices.list(options?)` — list device profiles
- `inventory.devices.get(id)` — single device

**Webhooks (v2):**
- `webhooks.list()` — list webhooks
- `webhooks.create(data)` — create webhook
- `webhooks.get(id)` — single webhook
- `webhooks.update(id, data)` — update webhook
- `webhooks.delete(id)` — delete webhook

## liongard-mcp MCP Server

### Decision Tree Architecture

Root tool: `liongard_navigate`

Domains:
1. **environments** — Environment CRUD, counts, groups
2. **agents** — Agent management, installer generation
3. **inspections** — Inspectors, launchpoints, run inspections
4. **systems** — Discovered systems and system details
5. **detections** — Change detection and anomalies
6. **alerts** — Alert rules and triggered alerts
7. **metrics** — Custom metrics, evaluation
8. **timeline** — Event timeline and audit trail
9. **inventory** — Asset inventory (identities, devices)

### Tool Count Estimate

~20 tools across domains (consistent with other MCP servers).

### Credential Requirements

| Field | Description |
|-------|-------------|
| `instance` | Liongard instance name (subdomain) |
| `apiKey` | API key for authentication |

### Gateway Integration

Add to the gateway vendor registry:
Gateway configuration source is omitted from this repository.

## Plugin Directory

```
msp-claude-plugins/liongard/liongard/
├── .claude-plugin/
│   └── plugin.json
├── skills/
│   ├── liongard-overview.md
│   ├── liongard-environments.md
│   ├── liongard-inspections.md
│   ├── liongard-systems.md
│   └── liongard-detections.md
├── commands/
│   ├── liongard-health-check.md
│   └── liongard-environment-summary.md
└── README.md
```

### Skills

1. **liongard-overview** — Platform overview, terminology (environments, agents, inspectors, launchpoints, systems), authentication, common workflows
2. **liongard-environments** — Environment management, grouping, related entities
3. **liongard-inspections** — Inspector types, launchpoint configuration, scheduling, triggering inspections
4. **liongard-systems** — System discovery, system details, dataprints
5. **liongard-detections** — Change detection, anomalies, detection types, alert configuration

## Implementation Order

1. `node-liongard` client library (separate repo `@wyre-technology/node-liongard`)
2. `liongard-mcp` MCP server (separate repo `wyre-technology/liongard-mcp`)
3. Plugin directory in monorepo (skills + commands)
4. Gateway vendor config (in `mcp-gateway`)
5. Docs site updates (plugin page, MCP server page)

## Success Criteria

- [ ] `node-liongard`: All core methods implemented, 80+ tests, published to GitHub Packages
- [ ] `liongard-mcp`: Decision-tree architecture, 70+ tests, Docker image on GHCR
- [ ] Plugin: 5 skills, 2 commands, valid plugin.json
- [ ] Gateway: Vendor config with validation, credential form working
- [ ] Docs: Plugin and MCP server pages added
