---
name: "SentinelOne Vulnerabilities"
description: >
  Use this skill when working with SentinelOne XSPM vulnerabilities -
  tracking CVEs, reviewing EPSS scores, assessing exploit maturity,
  managing vulnerability status, prioritizing patches, and generating
  vulnerability reports across MSP client environments. Covers all
  vulnerability tools, status values, severity levels, and remediation
  workflows.
when_to_use: >-
  When tracking CVEs, reviewing EPSS scores, assessing exploit maturity, managing vulnerability
  status, prioritizing patches. Use when: sentinelone vulnerability, sentinelone cve, sentinelone
  patch, sentinelone epss, vulnerability management, vulnerability report, sentinelone xspm,
  sentinelone exploit, vulnerability scan, patch management, sentinelone remediation, or
  vulnerability assessment.
---

# SentinelOne XSPM Vulnerability Management

## Overview

Vulnerabilities in SentinelOne are tracked through the Extended Security Posture Management (XSPM) module. The platform identifies CVEs across managed endpoints, cloud workloads, and applications, enriching them with EPSS (Exploit Prediction Scoring System) scores, exploit maturity data, and remediation guidance. For MSPs, vulnerability management is a core service -- tracking which client endpoints have unpatched critical CVEs, prioritizing patches based on exploit likelihood, and reporting on vulnerability posture during quarterly business reviews.

All vulnerability tools are **read-only**. You can view, search, and report on vulnerabilities, but you cannot change vulnerability status, apply patches, or take remediation actions through the MCP tools.

## MCP Tools

### Available Tools

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `get_vulnerability` | Get a single vulnerability by ID | `vulnerabilityId` (required) |
| `list_vulnerabilities` | List vulnerabilities with filters | `severity`, `status`, `limit`, `cursor`, `sortBy`, `sortOrder` |
| `search_vulnerabilities` | Search vulnerabilities with GraphQL filters | `filters` (array of fieldId/filterType/values), `limit`, `cursor` |
| `get_vulnerability_notes` | Get notes on a vulnerability | `vulnerabilityId` (required) |
| `get_vulnerability_history` | Get timeline of changes for a vulnerability | `vulnerabilityId` (required) |

### List Vulnerabilities

Call `list_vulnerabilities` with optional parameters:

- **Filter by severity:** Set `severity` to `CRITICAL`, `HIGH`, `MEDIUM`, `LOW`, or `INFO`
- **Filter by status:** Set `status` to one of the allowed values (see Status Values below)
- **Sort results:** Set `sortBy` (e.g., `severity`, `epssScore`, `detectedAt`) and `sortOrder` (`ASC` or `DESC`)
- **Paginate:** Set `limit` and use `cursor` from the response for subsequent pages

**Example: List all critical vulnerabilities:**
- `list_vulnerabilities` with `severity=CRITICAL`, `sortBy=epssScore`, `sortOrder=DESC`

**Example: List vulnerabilities awaiting patches:**
- `list_vulnerabilities` with `status=TO_BE_PATCHED`, `limit=50`

### Search Vulnerabilities

Call `search_vulnerabilities` with a `filters` array for complex queries:

**Example: Search for a specific CVE:**
- `search_vulnerabilities` with `filters=[{"fieldId": "cveId", "filterType": "EQUALS", "values": ["CVE-2024-1234"]}]`

**Example: Search for exploitable vulnerabilities:**
- `search_vulnerabilities` with `filters=[{"fieldId": "exploitMaturity", "filterType": "EQUALS", "values": ["ACTIVE"]}]`

### Get Vulnerability Details

Call `get_vulnerability` with the `vulnerabilityId` to retrieve full details including CVE information, EPSS score, affected assets, and remediation guidance.

### Get Vulnerability Notes

Call `get_vulnerability_notes` with the `vulnerabilityId` to retrieve analyst comments and tracking notes.

### Get Vulnerability History

Call `get_vulnerability_history` with the `vulnerabilityId` to retrieve the timeline of status changes and updates.

## Key Concepts

### Vulnerability Status Values

| Status | Description |
|--------|-------------|
| `NEW` | Vulnerability detected and not yet reviewed |
| `IN_PROGRESS` | Vulnerability is being investigated or remediated |
| `ON_HOLD` | Remediation paused (e.g., waiting for vendor patch) |
| `RESOLVED` | Vulnerability has been remediated |
| `RISK_ACKED` | Risk acknowledged -- vulnerability accepted without remediation |
| `SUPPRESSED` | Vulnerability suppressed from reporting (e.g., false positive) |
| `TO_BE_PATCHED` | Vulnerability queued for patching |

### Severity Levels

| Severity | CVSS Range | Description |
|----------|-----------|-------------|
| `CRITICAL` | 9.0 - 10.0 | Immediate remediation required |
| `HIGH` | 7.0 - 8.9 | Remediate within days |
| `MEDIUM` | 4.0 - 6.9 | Remediate within weeks |
| `LOW` | 0.1 - 3.9 | Remediate during maintenance windows |
| `INFO` | 0.0 | Informational, no action required |

### EPSS Scores

The Exploit Prediction Scoring System (EPSS) provides a probability score (0.0 to 1.0) indicating how likely a vulnerability is to be exploited in the next 30 days:

| EPSS Range | Interpretation | Priority |
|-----------|----------------|----------|
| 0.9 - 1.0 | Near-certain exploitation | Immediate |
| 0.7 - 0.9 | Very high likelihood | Within 24 hours |
| 0.4 - 0.7 | Moderate likelihood | Within 1 week |
| 0.1 - 0.4 | Low likelihood | Within 30 days |
| 0.0 - 0.1 | Very unlikely | Standard maintenance |

### Exploit Maturity

| Maturity | Description |
|----------|-------------|
| `ACTIVE` | Exploit is actively being used in the wild |
| `WEAPONIZED` | Exploit code is publicly available and weaponized |
| `POC` | Proof-of-concept exists but not widely used |
| `NONE` | No known exploit code |

### GraphQL Filter Syntax

Search tools use GraphQL filters:

```json
{
  "fieldId": "severity",
  "filterType": "EQUALS",
  "values": ["CRITICAL"]
}
```

Common filter fields: `cveId`, `severity`, `status`, `epssScore`, `exploitMaturity`, `siteName`, `endpointName`, `applicationName`, `detectedAt`.

## Field Reference

### Core Vulnerability Fields

| Field | Type | Description |
|-------|------|-------------|
| `vulnerabilityId` | string | Unique vulnerability identifier |
| `cveId` | string | CVE identifier (e.g., CVE-2024-1234) |
| `name` | string | Vulnerability name/title |
| `severity` | string | CRITICAL/HIGH/MEDIUM/LOW/INFO |
| `status` | string | Current status (NEW, IN_PROGRESS, etc.) |
| `cvssScore` | float | CVSS v3 base score |
| `epssScore` | float | EPSS probability score (0.0 - 1.0) |
| `exploitMaturity` | string | ACTIVE/WEAPONIZED/POC/NONE |
| `detectedAt` | datetime | When the vulnerability was first detected |
| `siteName` | string | SentinelOne site (MSP client) |
| `endpointName` | string | Affected endpoint hostname |
| `applicationName` | string | Vulnerable application name |
| `applicationVersion` | string | Vulnerable application version |
| `remediationSteps` | string | Recommended remediation actions |
| `fixVersion` | string | Application version that fixes the vulnerability |
| `affectedAssets` | array | List of affected assets |

## Common Workflows

### Critical Vulnerability Review

1. Call `list_vulnerabilities` with `severity=CRITICAL`, `status=NEW`, `sortBy=epssScore`, `sortOrder=DESC`
2. Review each vulnerability's EPSS score and exploit maturity
3. For high-EPSS vulnerabilities, call `get_vulnerability` for full details
4. Group by client (siteName) to identify which clients are most exposed
5. Prioritize remediation based on EPSS score and exploit maturity

### Vulnerability Audit by Client

1. Call `search_vulnerabilities` with `filters=[{"fieldId": "siteName", "filterType": "EQUALS", "values": ["Client Name"]}]`
2. Aggregate by severity: count CRITICAL, HIGH, MEDIUM, LOW
3. Identify top CVEs by EPSS score
4. Check for any actively exploited vulnerabilities (`exploitMaturity=ACTIVE`)
5. Generate a client-specific vulnerability report

### Patch Prioritization

1. Call `list_vulnerabilities` with `status=TO_BE_PATCHED`, `sortBy=epssScore`, `sortOrder=DESC`
2. Focus on vulnerabilities with `exploitMaturity` of `ACTIVE` or `WEAPONIZED`
3. Group by application to identify which patches address the most vulnerabilities
4. Generate a prioritized patch list by client

### Vulnerability Trending

1. Call `list_vulnerabilities` for the current period
2. Compare with previous period to identify new vulnerabilities
3. Calculate remediation rates (resolved / total)
4. Track EPSS score distribution changes
5. Report on vulnerability posture improvement or degradation

### QBR Vulnerability Report

1. Call `search_vulnerabilities` filtered by client site
2. Count by severity and status
3. Highlight CRITICAL and HIGH with ACTIVE exploit maturity
4. Show remediation progress (resolved vs. new over the period)
5. List top 5 CVEs by EPSS score with remediation recommendations

## Response Examples

**Vulnerability Detail:**

```json
{
  "vulnerabilityId": "vuln-abc-123",
  "cveId": "CVE-2024-21887",
  "name": "Ivanti Connect Secure Authentication Bypass",
  "severity": "CRITICAL",
  "status": "NEW",
  "cvssScore": 9.1,
  "epssScore": 0.97,
  "exploitMaturity": "ACTIVE",
  "detectedAt": "2026-02-24T06:00:00.000Z",
  "siteName": "Acme Corporation",
  "endpointName": "ACME-VPN-01",
  "applicationName": "Ivanti Connect Secure",
  "applicationVersion": "9.1R17",
  "remediationSteps": "Upgrade to version 9.1R18 or later. Apply vendor mitigation XML as interim measure.",
  "fixVersion": "9.1R18"
}
```

## Error Handling

### Common Errors

| Error | Cause | Resolution |
|-------|-------|------------|
| Vulnerability not found | Invalid vulnerabilityId | Verify the ID with `list_vulnerabilities` |
| Invalid severity filter | Wrong severity value | Use CRITICAL, HIGH, MEDIUM, LOW, or INFO |
| Invalid status filter | Wrong status value | Use NEW, IN_PROGRESS, ON_HOLD, RESOLVED, RISK_ACKED, SUPPRESSED, or TO_BE_PATCHED |
| Empty results | No matching vulnerabilities | Widen filters or check scope |
| Authentication error | Invalid token | Verify Service User token is Account or Site level |

## Best Practices

1. **Prioritize by EPSS** - Sort vulnerabilities by EPSS score, not just CVSS severity
2. **Focus on exploit maturity** - ACTIVE and WEAPONIZED vulnerabilities need immediate attention
3. **Scope to clients** - Always filter by site when reviewing a specific client's vulnerability posture
4. **Track remediation** - Monitor status transitions from NEW to RESOLVED over time
5. **Use risk acknowledgment wisely** - Only use RISK_ACKED for vulnerabilities with genuine compensating controls
6. **Generate client reports** - Build severity-based summaries for client QBRs
7. **Monitor for new criticals** - Regularly check for new CRITICAL/HIGH vulnerabilities with high EPSS
8. **Group patches by application** - Prioritize patches that fix the most high-EPSS vulnerabilities
9. **Check notes and history** - Review existing notes before duplicating investigation work
10. **Cross-reference with alerts** - Check if any vulnerability has associated exploitation alerts

## Related Skills

- [Alerts](../alerts/SKILL.md) - Alert context for exploited vulnerabilities
- [Misconfigurations](../misconfigurations/SKILL.md) - Security posture gaps related to vulnerabilities
- [Inventory](../inventory/SKILL.md) - Asset context for affected endpoints
- [API Patterns](../api-patterns/SKILL.md) - MCP tools reference and connection info
- [Purple AI](../purple-ai/SKILL.md) - Investigate exploitation of specific CVEs
