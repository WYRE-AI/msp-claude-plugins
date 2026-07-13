---
description: List discovered services across RunZero assets
argument-hint: "[site_id] [protocol] [port] [limit]"
arguments: [site_id, protocol, port, limit]
---

# RunZero Service Inventory

List and analyze discovered services across assets. Filter by site, protocol, or port to focus on specific service types. Useful for security audits, compliance checks, and attack surface analysis.

## Prerequisites

- RunZero MCP server connected with valid API token
- MCP tools `runzero_services_list` and `runzero_services_export` available

## Steps

1. **Fetch services with filters**

   Call `runzero_services_list` with the provided filters (`site_id`, `protocol`, `port`). Build a RunZero query string from the filters. Paginate through results up to `limit`.

2. **Aggregate by protocol and port**

   Group services by protocol and port. Count unique assets per service type.

3. **Flag high-risk services**

   Identify services that pose security risks: RDP, Telnet, FTP, SMBv1, unencrypted HTTP admin panels, deprecated TLS versions.

4. **Build service inventory table**

   Present services with: protocol, port, asset hostname/IP, software version, and last seen.

5. **Provide security recommendations**

   For flagged services, suggest remediation actions (disable, firewall, upgrade, encrypt).

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| site_id | string | No | all | Filter to a specific site |
| protocol | string | No | all | Filter by protocol (rdp, ssh, http, etc.) |
| port | integer | No | all | Filter by port number |
| limit | integer | No | 100 | Maximum services to return |

## Examples

### All Services for a Site

```
/service-inventory --site_id "site-uuid-456"
```

### RDP Services Across All Sites

```
/service-inventory --protocol rdp
```

### Services on a Specific Port

```
/service-inventory --port 8443
```

### SSH Services for a Client

```
/service-inventory --site_id "site-uuid-456" --protocol ssh
```

## Error Handling

- **Large Result Sets:** Use protocol or site filters to narrow results
- **Rate Limit:** Use the Export API for large inventories
- **Authentication Error:** Verify `RUNZERO_API_TOKEN` is set correctly
- **No Results:** Verify the site has been scanned; broaden filters

## Related Commands

- `/asset-search` - Find the assets hosting these services
- `/site-overview` - Full site overview including service summary
- `/vuln-report` - Vulnerability analysis of discovered services
- `/scan-network` - Run a new scan to refresh service data
