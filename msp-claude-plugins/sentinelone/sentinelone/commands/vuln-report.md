---
description: Generate a vulnerability summary report with severity breakdown and top CVEs
argument-hint: "[severity] [status] [limit]"
arguments: [severity, status, limit]
---

# SentinelOne Vulnerability Report

Generate a vulnerability summary report across managed client environments. Shows vulnerability counts by severity, top CVEs ranked by EPSS score, exploit maturity breakdown, and per-client vulnerability exposure. Useful for patch prioritization, QBR preparation, and compliance reporting.

## Prerequisites

- SentinelOne Purple MCP server connected with a valid Service User token
- MCP tools `list_vulnerabilities`, `search_vulnerabilities`, and `get_vulnerability` available
- Token must be Account or Site level (NOT Global)

## Steps

1. **Fetch vulnerabilities**

   Call `list_vulnerabilities` with the specified `status` filter, sorted by EPSS score descending. If a `severity` filter is provided, include it. Use the specified `limit`.

2. **Count by severity**

   Aggregate results to show counts of CRITICAL, HIGH, MEDIUM, LOW vulnerabilities.

3. **Identify top CVEs by EPSS score**

   Sort vulnerabilities by EPSS score descending and present the top entries with CVE ID, CVSS score, EPSS score, exploit maturity, and affected client.

4. **Break down by exploit maturity**

   Count vulnerabilities by exploit maturity: ACTIVE, WEAPONIZED, POC, NONE.

5. **Aggregate by client**

   Group vulnerabilities by site (client) to show which clients are most exposed.

6. **Provide patch prioritization recommendations**

   Recommend patching order based on EPSS score and exploit maturity.

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| severity | string | No | all | Filter by severity (CRITICAL, HIGH, MEDIUM, LOW) |
| status | string | No | NEW | Filter by status (NEW, IN_PROGRESS, TO_BE_PATCHED, RESOLVED, etc.) |
| limit | integer | No | 50 | Maximum number of vulnerabilities to return |

## Examples

### Full Vulnerability Report

```
/vuln-report
```

### Critical Vulnerabilities Only

```
/vuln-report --severity CRITICAL
```

### Vulnerabilities Queued for Patching

```
/vuln-report --status TO_BE_PATCHED
```

### Resolved Vulnerabilities (for Reporting)

```
/vuln-report --status RESOLVED --limit 100
```

### High Severity New Vulnerabilities

```
/vuln-report --severity HIGH --status NEW
```

## Output

### Full Report

```
SentinelOne Vulnerability Report
================================================================
Generated: 2026-02-24
Status Filter: NEW
Total Vulnerabilities: 247

Severity Breakdown:
+----------+-------+
| Severity | Count |
+----------+-------+
| CRITICAL | 8     |
| HIGH     | 34    |
| MEDIUM   | 127   |
| LOW      | 78    |
+----------+-------+

Exploit Maturity Breakdown:
+-------------+-------+
| Maturity    | Count |
+-------------+-------+
| ACTIVE      | 5     |
| WEAPONIZED  | 12    |
| POC         | 43    |
| NONE        | 187   |
+-------------+-------+

Top 10 CVEs by EPSS Score (Exploit Likelihood):
+----------------+------+------+----------+-----------+---------------------+------------------+
| CVE ID         | CVSS | EPSS | Maturity | App       | Detected            | Client           |
+----------------+------+------+----------+-----------+---------------------+------------------+
| CVE-2024-21887 | 9.1  | 0.97 | ACTIVE   | Ivanti CS | 2026-02-20 06:00    | Acme Corp        |
| CVE-2024-3400  | 10.0 | 0.96 | ACTIVE   | PAN-OS    | 2026-02-22 14:00    | TechStart        |
| CVE-2024-1709  | 10.0 | 0.95 | ACTIVE   | ConnectWise| 2026-02-19 10:00   | Global Services  |
| CVE-2023-44228 | 10.0 | 0.94 | WEAPONIZED| Log4j    | 2026-02-15 08:00    | Metro Industries |
| CVE-2024-27198 | 9.8  | 0.92 | ACTIVE   | JetBrains | 2026-02-23 12:00    | Summit Financial |
| CVE-2024-0012  | 9.8  | 0.88 | WEAPONIZED| PAN-OS   | 2026-02-21 16:00    | Acme Corp        |
| CVE-2023-46805 | 8.2  | 0.85 | ACTIVE   | Ivanti CS | 2026-02-20 06:00    | Acme Corp        |
| CVE-2024-21762 | 9.6  | 0.83 | WEAPONIZED| FortiOS  | 2026-02-18 09:00    | Harbor Consult.  |
| CVE-2023-22518 | 9.8  | 0.79 | WEAPONIZED| Confluence| 2026-02-17 11:00   | Lakewood Ptrs    |
| CVE-2024-1212  | 9.8  | 0.74 | POC      | Progress  | 2026-02-24 02:00    | Cedar Grove      |
+----------------+------+------+----------+-----------+---------------------+------------------+

Clients by Vulnerability Exposure:
+----------------------------+----------+------+--------+------+
| Client                     | CRITICAL | HIGH | MEDIUM | LOW  |
+----------------------------+----------+------+--------+------+
| Acme Corporation           | 3        | 8    | 24     | 15   |
| TechStart Inc              | 2        | 6    | 18     | 12   |
| Global Services LLC        | 1        | 5    | 22     | 10   |
| Metro Industries           | 1        | 4    | 15     | 9    |
| Summit Financial           | 1        | 3    | 12     | 8    |
+----------------------------+----------+------+--------+------+
(More clients with fewer vulnerabilities omitted)

Patch Prioritization:
  1. IMMEDIATE: 5 vulnerabilities with ACTIVE exploit maturity
     - CVE-2024-21887 (Ivanti) on Acme Corp
     - CVE-2024-3400 (PAN-OS) on TechStart
     - CVE-2024-1709 (ConnectWise) on Global Services
     - CVE-2024-27198 (JetBrains) on Summit Financial
     - CVE-2023-46805 (Ivanti) on Acme Corp
  2. URGENT: 12 WEAPONIZED vulnerabilities within 48 hours
  3. SCHEDULED: 43 POC vulnerabilities within 30 days
  4. STANDARD: 187 vulnerabilities with no known exploit

================================================================
```

### No Vulnerabilities Found

```
SentinelOne Vulnerability Report
================================================================
Generated: 2026-02-24
Status Filter: NEW

No new vulnerabilities found.

All managed environments are up to date. Last scan check recommended
during next maintenance window.
================================================================
```

## Error Handling

### MCP Connection Error

```
Error: Unable to connect to SentinelOne Purple MCP server

Check your MCP configuration and verify your Service User token.
Token must be Account or Site level (NOT Global).
```

### Rate Limit

```
Warning: Rate limit reached during vulnerability retrieval.

Partial results available for 32 of 247 vulnerabilities.
Wait 30-60 seconds and retry, or use --severity CRITICAL to reduce results.
```

### Authentication Error

```
Error: 401 Unauthorized

Your Service User token may be invalid or Global-level.
Regenerate at: SentinelOne Console > Policy & Settings > User Management > Service Users
```

## MCP Tools Used

| Tool | Purpose |
|------|---------|
| `list_vulnerabilities` | Fetch vulnerabilities with severity/status filters |
| `search_vulnerabilities` | Search by specific CVE or client |
| `get_vulnerability` | Get full details for top CVEs |

## Use Cases

### Daily Vulnerability Check

```
/vuln-report --severity CRITICAL
```

### QBR Vulnerability Summary

```
/vuln-report --limit 100
```

### Patch Planning

```
/vuln-report --status TO_BE_PATCHED
```

### Remediation Verification

```
/vuln-report --status RESOLVED --limit 100
```

## Related Commands

- `/alert-triage` - Check if any vulnerabilities have been exploited
- `/investigate-alert` - Investigate exploitation alerts
- `/posture-review` - Review misconfigurations alongside vulnerabilities
- `/asset-inventory` - Identify affected assets for patching
