---
name: "Blackpoint Incident Response"
description: >
  Blackpoint Cyber (CompassOne) detection investigation: the read-only
  tool surface across tenants, assets, detections, and vulnerabilities,
  the tenant → asset → detection → vulnerability drill-down, asset
  relationship maps, dark-web and external-exposure cross-references,
  and which tool domains are stubs.
when_to_use: >-
  When investigating a Blackpoint Cyber / CompassOne detection, building an incident timeline
  across assets, or correlating detections with known vulnerabilities. Use when: blackpoint
  detection, blackpoint investigation, blackpoint incident, compassone detection, blackpoint
  vulnerability, blackpoint asset relationships, or blackpoint dark web.
---

# Blackpoint Incident Response

The functional Blackpoint tool surface today is read-only and centers
on detections and the assets they fire against. This skill walks the
investigation flow: tenant → asset → detections → vulnerabilities,
plus dark-web and external-vulnerability cross-references.

## API Tools

### Tenants

| Tool | Purpose |
|------|---------|
| `blackpoint_tenants_list` | Partner's customer tenants |
| `blackpoint_tenants_get` | Detail for one tenant |

### Assets

| Tool | Purpose |
|------|---------|
| `blackpoint_assets_list` | Assets for a tenant |
| `blackpoint_assets_get` | Detail for one asset |
| `blackpoint_assets_search` | Search assets by name / identifier |
| `blackpoint_assets_relationships` | Asset relationships (parent / child / related) |

### Detections

| Tool | Purpose |
|------|---------|
| `blackpoint_detections_list` | Detections for the tenant / asset scope |
| `blackpoint_detections_get` | Full detail for one detection |

### Vulnerabilities

| Tool | Purpose |
|------|---------|
| `blackpoint_vulnerabilities_list` | Known vulnerabilities for the scope |
| `blackpoint_vulnerabilities_scans_list` | Recent scan results |
| `blackpoint_vulnerabilities_darkweb_list` | Dark-web exposure findings |
| `blackpoint_vulnerabilities_external_list` | External (internet-facing) vulnerabilities |

## Common Workflows

### Walk a detection end-to-end

1. Identify the tenant: `blackpoint_tenants_list` →
   `blackpoint_tenants_get`.
2. List recent detections: `blackpoint_detections_list`.
3. Pick the detection of interest: `blackpoint_detections_get`.
4. Pivot to the affected asset:
   `blackpoint_assets_get` and `blackpoint_assets_relationships`.
5. Cross-reference vulnerabilities on that asset:
   `blackpoint_vulnerabilities_list`.

### Per-tenant exposure rollup

1. `blackpoint_tenants_get` to confirm scope.
2. `blackpoint_vulnerabilities_external_list` for internet-facing
   exposure.
3. `blackpoint_vulnerabilities_darkweb_list` for credential / data
   leakage.
4. `blackpoint_vulnerabilities_scans_list` for recent scan history.
5. Roll up: count by severity, age, and asset. Surface anything
   high-severity with no recent scan.

### Asset relationship map

1. `blackpoint_assets_search` to find the entry asset.
2. `blackpoint_assets_relationships` to enumerate connected assets.
3. For each related asset, summarize detections and vulnerabilities
   to build a blast-radius view.

### Multi-tenant detection sweep (partner view)

1. `blackpoint_tenants_list` to enumerate customers.
2. For each tenant, call `blackpoint_detections_list` for a recent
   window.
3. Roll up: detections per tenant, severity distribution, top
   detection types.
4. Surface tenants with abnormal volume or new detection types as
   priority follow-ups.

## Edge Cases

- **Stub domains** — `blackpoint_alerts_*`,
  `blackpoint_cloud_security_*`, `blackpoint_notifications_*`,
  `blackpoint_partners_*`, `blackpoint_threat_intel_*`, and
  `blackpoint_tickets_*` are placeholders today and should not be
  invoked. Prefer the four functional domains.
- **Read-only** — Any "respond" or "acknowledge" action must happen
  in the CompassOne portal; the MCP surface cannot mutate state yet.
- **Asset identity drift** — Re-imaged endpoints can produce two
  asset records. Use `blackpoint_assets_search` and dedupe on
  hostname / serial before reporting.

## Best Practices

- Always include tenant name in every output — partner-level work
  spans many customers and ambiguity bites.
- Pair detections with the associated asset and any related
  vulnerabilities in a single view; analysts should not have to chase
  the link themselves.
- For QBRs, pull the external-vulnerability list and dark-web list
  together — they tell complementary stories.

## Related Skills

- [api-patterns](../api-patterns/SKILL.md) - Auth, hierarchy, pagination
