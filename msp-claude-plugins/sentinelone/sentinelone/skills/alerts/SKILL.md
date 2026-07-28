---
name: "sentinelone-alerts"
description: "SentinelOne's read-only unified alert surface: the list/search/get alert tools plus notes and history, severity levels, status values, view types, GraphQL filter syntax, and cursor-based pagination."
when_to_use: >-
  When triaging new alerts, investigating specific alerts, searching by severity or status,
  reviewing alert timelines, and managing alert workflows across MSP client environments. Use
  when: sentinelone alert, sentinelone threat, sentinelone detection, sentinelone incident, alert
  triage, alert investigation, sentinelone severity, sentinelone critical, sentinelone high, alert
  management, sentinelone notification, or security alert.
---

# SentinelOne Unified Alert Management

All alert tools are **read-only** — you can view, search, and investigate alerts but cannot modify status, assignments, or take response actions.

For full field definitions, response examples, and error details see [REFERENCE.md](./REFERENCE.md).

## MCP Tools

### list_alerts — List alerts with filters

Parameters: `severity`, `status`, `viewType`, `limit`, `cursor`, `sortBy`, `sortOrder`

```
list_alerts severity=CRITICAL status=NEW sortBy=detectedAt sortOrder=DESC limit=50
list_alerts viewType=CLOUD limit=50
```

### search_alerts — GraphQL filter search

Parameter: `filters` (array of `{fieldId, filterType, values}`), `limit`, `cursor`

```
search_alerts filters=[{"fieldId": "endpointName", "filterType": "CONTAINS", "values": ["workstation-01"]}]
search_alerts filters=[{"fieldId": "severity", "filterType": "IN", "values": ["CRITICAL", "HIGH"]}]
```

**Filter types:** `EQUALS`, `NOT_EQUALS`, `CONTAINS`, `IN`, `NOT_IN`. Add `"isNegated": true` to invert any filter.

### get_alert — Full alert details

```
get_alert alertId=1234567890
```

### get_alert_notes / get_alert_history

```
get_alert_notes alertId=1234567890
get_alert_history alertId=1234567890
```

## Key Concepts

**Severity:** `CRITICAL` | `HIGH` | `MEDIUM` | `LOW` | `INFO` | `UNKNOWN`

**Status:** `NEW` | `IN_PROGRESS` | `RESOLVED` | `FALSE_POSITIVE`

**View types:** `ALL` (default) | `CLOUD` | `KUBERNETES` | `IDENTITY` | `INFRASTRUCTURE_AS_CODE` | `ADMISSION_CONTROLLER` | `OFFENSIVE_SECURITY` | `SECRET_SCANNING`

**Pagination:** Pass `limit` on the first call, then pass the returned `cursor` to fetch subsequent pages until no results remain.

## Workflows

### Triage New Alerts

1. `list_alerts` with `status=NEW`, `sortBy=severity`, `sortOrder=DESC`, `limit=50`
2. If results hit the limit, page through with `cursor` — do not assume 50 covers everything
3. For each CRITICAL/HIGH alert: `get_alert` for full details, then `get_alert_notes` for prior context
4. If `get_alert` returns not-found, the alert may have been merged or resolved — re-query `list_alerts` to confirm
5. Build triage summary: alert name, severity, client (siteName), endpoint, detection time

### Investigate a Specific Alert

1. `get_alert` with the `alertId`
   - If not found: verify the ID via `list_alerts` or `search_alerts` — alert IDs can change after merge operations
2. `get_alert_notes` — check for existing analyst notes before duplicating work
3. `get_alert_history` — review timeline of status changes and assignments
4. Use `purple_ai` to investigate the threat described in the alert
5. Cross-reference with `list_inventory_items` for affected asset context

### Search Across Clients

1. `search_alerts` with `filters=[{"fieldId": "severity", "filterType": "IN", "values": ["CRITICAL", "HIGH"]}]`
2. If results are large, add a time-range filter or narrow by `viewType` to reduce noise
3. Group by `siteName` to identify which clients need attention first

## Best Practices

1. **Triage CRITICAL/HIGH first** — always sort by severity descending during triage
2. **Check notes before investigating** — call `get_alert_notes` to avoid duplicating prior analyst work
3. **Paginate large result sets** — never assume a single page contains all matching alerts; always check for a returned cursor
4. **Scope by site for client work** — use site/account filters or GraphQL `siteName` filter when investigating a specific client

## Related Skills

- [Purple AI](../purple-ai/SKILL.md) — Natural language investigation of alert threats
- [Threat Hunting](../threat-hunting/SKILL.md) — PowerQuery execution for deep analysis
- [API Patterns](../api-patterns/SKILL.md) — MCP tools reference and connection info
- [Inventory](../inventory/SKILL.md) — Asset context for affected endpoints
- [Vulnerabilities](../vulnerabilities/SKILL.md) — Vulnerability context for compromised assets
