---
description: Generate a vulnerability summary report from RunZero data
argument-hint: "[site_id] [severity]"
arguments: [site_id, severity]
---

# RunZero Vulnerability Report

Generate a vulnerability summary report based on RunZero's asset and service discovery data. Identifies security risks from exposed services, weak configurations, outdated software, and insecure protocols.

## Prerequisites

- RunZero MCP server connected with valid API token
- MCP tools `runzero_assets_list`, `runzero_services_list`, and `runzero_wireless_list` available

## Steps

1. **Collect high-risk services**

   Search for services with known security implications:
   - Telnet (unencrypted remote access)
   - FTP (unencrypted file transfer)
   - RDP (exposed remote desktop)
   - SMBv1 (ransomware vector)
   - HTTP on management ports (unencrypted admin panels)
   - Deprecated TLS versions (TLSv1.0, TLSv1.1)

2. **Identify outdated software**

   Check service banners for software versions with known vulnerabilities. Flag end-of-life operating systems and server software.

3. **Check wireless security**

   If `runzero_wireless_list` data is available, flag WEP networks, open networks, and potential rogue APs.

4. **Categorize findings by severity**

   | Severity | Examples |
   |----------|---------|
   | Critical | SMBv1 exposed, WEP encryption, default credentials detected |
   | High | RDP exposed, Telnet running, expired TLS certificates |
   | Medium | FTP running, TLSv1.0/1.1, self-signed certificates |
   | Low | HTTP without HSTS, outdated but non-vulnerable software |

5. **Generate vulnerability summary**

   Present findings grouped by severity with: affected asset count, specific hosts, service details, and remediation recommendations.

6. **Provide remediation priorities**

   Rank remediations by impact and effort. Suggest quick wins (disable Telnet, block RDP) and longer-term improvements (certificate rotation, TLS upgrades).

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| site_id | string | No | all | Filter to a specific site |
| severity | string | No | medium | Minimum severity to include |

## Examples

### Full Vulnerability Report

```
/vuln-report
```

### Critical and High Only

```
/vuln-report --severity high
```

### Report for a Specific Site

```
/vuln-report --site_id "site-uuid-456"
```

### Critical Vulnerabilities for a Client

```
/vuln-report --site_id "site-uuid-456" --severity critical
```

## Error Handling

- **No Scan Data:** Recommend running `/scan-network` first
- **Large Environments:** Filter by site to reduce scope
- **Rate Limit:** Use Export API for bulk data retrieval
- **Authentication Error:** Verify `RUNZERO_API_TOKEN` is set correctly

## Related Commands

- `/asset-search` - Find specific vulnerable assets
- `/service-inventory` - Detailed service listing for remediation
- `/site-overview` - Site context for the vulnerability findings
- `/scan-network` - Refresh data with a new scan
