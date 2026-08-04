---
name: "Liongard Systems"
description: >
  Liongard systems — the assets discovered by inspections — plus their
  detail data (raw configuration JSON with historical snapshots),
  dataprint extraction via JMESPath expressions, and the v2 Asset
  Inventory identity and device profiles that correlate one entity
  across multiple inspectors.
when_to_use: >-
  When listing or inspecting discovered assets, reading configuration data out of a
  system's detail record, writing JMESPath/dataprint expressions, or correlating
  identities and devices across platforms. Use when: liongard system, liongard device,
  system detail, dataprint, jmespath, liongard asset, liongard inventory, system data
  liongard, or liongard identity.
---

# Liongard Systems & Data

## Overview

Systems are the entities discovered during Liongard inspections. When a launchpoint runs an inspection, it discovers systems such as servers, firewalls, cloud services, user accounts, domain controllers, and other infrastructure components. Each system carries detailed configuration data captured at the time of inspection, giving a historical record of the IT environment.

## Anti-triggers

- **Acting on the device** — a Liongard system is a read-only snapshot
  of something an inspection found. Rebooting it, patching it, or
  running a script needs the RMM that manages it: `ncentral-devices`,
  `atera-agents`, `syncro-assets`, `superops-assets`, or
  `immybot-endpoint-management`.
- **The MSP's documentation of record** — Liongard auto-discovers.
  Hand-maintained documentation, passwords, and CIs live in
  `hudu-assets` or `it-glue-configurations`.
- **Why a system's data is stale or missing** — that is an inspection
  problem; use `liongard-inspections`.
- **What changed between two snapshots** — use `liongard-detections`.

## Key Concepts

### Systems

A system is identified by `ID` and always traces back to the `InspectorID` that found it, the `LaunchpointID` that produced it, and the parent `EnvironmentID`. `Status` is one of `Active`, `Inactive`, or `Error`; `LastInspection` tells you how fresh the data is. `DetailCount` and `DetectionCount` are only returned on the single-system GET, not in list responses.

See [references/fields.md](references/fields.md) for the complete field reference and the entity relationship map.

### System Details

System details contain the raw configuration data captured during inspections — the actual IT documentation payload: user lists, firewall rules, backup statuses, license counts, security settings. Details are stored as structured JSON under a top-level `Data` key and can be queried with JMESPath via the dataprints API. Details are versioned: passing `?date=YYYY-MM-DD` returns the snapshot as of that date, which is what makes configuration diffing possible.

### Dataprints

Dataprints evaluate a JMESPath expression server-side against a system's detail record, so you retrieve exactly the fields you need instead of pulling the whole detail document and parsing it client-side.

### Asset Inventory (v2)

Asset Inventory aggregates identities and devices across *all* inspectors into single profiles. Each profile carries a `Sources` array showing every inspector that observed that entity — an AD account and its Microsoft 365 counterpart resolve to one identity, a physical host and its vSphere VM record to one device. This is the cross-platform view; per-inspector data stays on the systems themselves. Note that inventory IDs are UUID strings, not the integer IDs used elsewhere in the API.

### JMESPath Quick Reference

| Expression | Description |
|------------|-------------|
| `Data.Field` | Direct field access |
| `Data.Array[0]` | First array element |
| `Data.Array[*].Name` | All Name values from array |
| `Data.Array[?Status=='Active']` | Filter array elements |
| `Data.{a: Field1, b: Field2}` | Multi-select hash |
| `Data.Array | length(@)` | Count array elements |
| `Data.Array[*].Name | sort(@)` | Sort values |
| `Data.Array[?Age > \`30\`]` | Numeric comparison |

## API Patterns

The full endpoint catalog with request/response bodies lives in [references/api.md](references/api.md). The non-obvious parts:

- **System list filters are camelCase query params** — `environmentId`, `inspectorId`, `launchpointId` — while response bodies are PascalCase (`Data`, `TotalRows`, `HasMoreRows`, `CurrentPage`, `TotalPages`, `PageSize`). Page until `HasMoreRows` is false.
- **Details live on a sub-resource**: `GET /api/v1/systems/{systemId}/detail`. Add `?date=` for a historical snapshot.
- **Dataprint evaluation is v2 and POST-only**: `POST /api/v2/dataprints-evaluate-systemdetailid` with `{"SystemDetailID": ..., "Expression": ...}`, returning a bare `{"Result": ...}`. Note it keys on the *system detail* ID, not the system ID.
- **Asset Inventory is a separate v2 namespace**: `/api/v2/inventory/identities` and `/api/v2/inventory/devices`, each with a `/{id}` single-fetch.

## Common Workflows

### Comparing System Snapshots

1. **Get current detail** - Fetch latest system detail
2. **Get historical detail** - Fetch detail from a specific date
3. **Compare data** - Diff the two snapshots
4. **Identify changes** - Note what configuration items changed

### Cross-Platform Asset Correlation

1. **Query identities** - Get all identities for an environment
2. **Review sources** - See which platforms each identity appears in
3. **Identify gaps** - Find users missing from expected platforms
4. **Check status** - Verify enabled/disabled status across platforms
5. **Report findings** - Generate cross-platform identity report

See [references/examples.md](references/examples.md) for worked implementations of paginated system retrieval and dataprint extraction.

## Gotchas

- **Rate limit is 300 requests/minute.** Sweeping systems across a large partner instance hits this fast — page with a large `pageSize` rather than many small requests.
- **A 404 on `/detail` usually means "never inspected", not "bad ID".** Check `LastInspection` on the system before treating it as missing.
- **A JMESPath path that doesn't exist returns a null `Result`, not an error.** Only syntax errors produce 422, so null is ambiguous between "field absent" and "field genuinely null" — verify against the detail document when it matters.
- **Detail schemas vary by inspector.** Fields present on one inspector's systems may be absent on another's, so never assume a shared shape across system types.

See [references/errors.md](references/errors.md) for the complete API and JMESPath error tables.

## Best Practices

1. **Use dataprints for specific data** - Avoid fetching entire system details when you only need a few fields
2. **Cache system lists** - Systems change infrequently, cache for minutes
3. **Filter by environment** - Always scope queries to specific environments
4. **Monitor detail counts** - Track detail count changes for data quality
5. **Leverage asset inventory** - Use identities and devices for cross-platform views

## Related Skills

- [Liongard Overview](../overview/SKILL.md) - Platform overview and terminology
- [Liongard Environments](../environments/SKILL.md) - Environment management
- [Liongard Inspections](../inspections/SKILL.md) - Inspectors and launchpoints
- [Liongard Detections](../detections/SKILL.md) - Change detection and alerts
