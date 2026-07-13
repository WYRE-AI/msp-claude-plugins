---
name: "SentinelOne Misconfigurations"
description: >
  Use this skill when working with SentinelOne XSPM misconfigurations -
  cloud security posture management across AWS, Azure, GCP, Kubernetes,
  identity, and infrastructure-as-code. Covers misconfiguration detection,
  compliance standards, MITRE ATT&CK mappings, remediation steps,
  evidence details, and posture review workflows for MSP clients.
when_to_use: >-
  When working with cloud security posture management across AWS, Azure, GCP, Kubernetes,
  identity, and infrastructure-as-code in SentinelOne XSPM misconfigurations. Use when:
  sentinelone misconfiguration, sentinelone posture, sentinelone compliance, sentinelone cspm,
  cloud security posture, sentinelone cloud security, sentinelone kubernetes security, sentinelone
  identity security, sentinelone iac, misconfiguration review, compliance audit, or security
  posture.
---

# SentinelOne XSPM Cloud Security Posture Management

## Overview

Misconfigurations in SentinelOne are tracked through the Extended Security Posture Management (XSPM) module. The platform detects security configuration gaps across cloud environments (AWS, Azure, GCP), Kubernetes clusters, identity providers (Active Directory, Entra ID), and infrastructure-as-code templates. Each misconfiguration includes compliance standard mappings, MITRE ATT&CK technique mappings, remediation steps, and evidence showing the specific resource, file, IP, port, or secret involved.

For MSPs, misconfiguration detection is essential for maintaining client security posture -- identifying exposed S3 buckets, overly permissive firewall rules, unrotated service account keys, and Kubernetes workloads running as root. These findings directly support compliance audits and QBR security reporting.

All misconfiguration tools are **read-only**. You can view, search, and report on misconfigurations, but you cannot remediate them through the MCP tools.

## MCP Tools

### Available Tools

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `get_misconfiguration` | Get a single misconfiguration by ID | `misconfigurationId` (required) |
| `list_misconfigurations` | List misconfigurations with filters | `severity`, `status`, `viewType`, `limit`, `cursor`, `sortBy`, `sortOrder` |
| `search_misconfigurations` | Search misconfigurations with GraphQL filters | `filters` (array of fieldId/filterType/values), `limit`, `cursor` |
| `get_misconfiguration_notes` | Get notes on a misconfiguration | `misconfigurationId` (required) |
| `get_misconfiguration_history` | Get timeline of changes for a misconfiguration | `misconfigurationId` (required) |

### List Misconfigurations

Call `list_misconfigurations` with optional parameters:

- **Filter by severity:** Set `severity` to `CRITICAL`, `HIGH`, `MEDIUM`, `LOW`, or `INFO`
- **Filter by status:** Set `status` to `NEW`, `IN_PROGRESS`, `RESOLVED`, `RISK_ACKED`, or `SUPPRESSED`
- **Filter by view type:** Set `viewType` to scope the detection domain (see View Types below)
- **Sort results:** Set `sortBy` and `sortOrder`
- **Paginate:** Set `limit` and use `cursor` for subsequent pages

**Example: List critical cloud misconfigurations:**
- `list_misconfigurations` with `severity=CRITICAL`, `viewType=CLOUD`, `sortOrder=DESC`

**Example: List Kubernetes misconfigurations:**
- `list_misconfigurations` with `viewType=KUBERNETES`, `limit=50`

### Search Misconfigurations

Call `search_misconfigurations` with a `filters` array:

**Example: Search for misconfigurations in a client's environment:**
- `search_misconfigurations` with `filters=[{"fieldId": "siteName", "filterType": "EQUALS", "values": ["Acme Corporation"]}]`

**Example: Search for a specific compliance standard:**
- `search_misconfigurations` with `filters=[{"fieldId": "complianceStandard", "filterType": "CONTAINS", "values": ["CIS"]}]`

### Get Misconfiguration Details

Call `get_misconfiguration` with the `misconfigurationId` to retrieve full details including compliance mappings, evidence, and remediation steps.

### Get Misconfiguration Notes

Call `get_misconfiguration_notes` with the `misconfigurationId` to retrieve analyst comments and tracking notes.

### Get Misconfiguration History

Call `get_misconfiguration_history` with the `misconfigurationId` to retrieve the timeline of status changes and updates.

## Key Concepts

### View Types

| View Type | Description | Example Findings |
|-----------|-------------|------------------|
| `CLOUD` | Cloud infrastructure (AWS, Azure, GCP) | Public S3 buckets, open security groups, unencrypted storage |
| `KUBERNETES` | Kubernetes clusters and workloads | Containers running as root, missing network policies, exposed dashboards |
| `IDENTITY` | Identity providers (AD, Entra ID) | Stale accounts, excessive permissions, missing MFA |
| `INFRASTRUCTURE_AS_CODE` | IaC templates (Terraform, CloudFormation) | Hardcoded secrets, missing encryption, overly permissive policies |
| `ADMISSION_CONTROLLER` | Kubernetes admission policies | Policy violations in pod deployments |
| `SECRET_SCANNING` | Exposed secrets and credentials | API keys in code, hardcoded passwords, leaked tokens |

### Compliance Standards

Misconfigurations are mapped to industry compliance standards:

| Standard | Description |
|----------|-------------|
| CIS Benchmarks | Center for Internet Security configuration benchmarks |
| SOC 2 | Service Organization Control Type 2 |
| PCI DSS | Payment Card Industry Data Security Standard |
| HIPAA | Health Insurance Portability and Accountability Act |
| NIST 800-53 | National Institute of Standards and Technology |
| ISO 27001 | International information security standard |
| GDPR | General Data Protection Regulation |
| AWS Well-Architected | AWS security best practices |
| Azure Security Benchmark | Azure security best practices |

### MITRE ATT&CK Mappings

Misconfigurations are mapped to MITRE ATT&CK techniques they could enable:

| Misconfiguration Type | MITRE Technique |
|----------------------|-----------------|
| Public cloud storage | T1530 - Data from Cloud Storage |
| Excessive IAM permissions | T1078 - Valid Accounts |
| Missing MFA | T1078.004 - Cloud Accounts |
| Open management ports | T1133 - External Remote Services |
| Unencrypted data at rest | T1565 - Data Manipulation |
| Exposed secrets | T1552 - Unsecured Credentials |

### Evidence

Each misconfiguration includes evidence showing the specific resource affected:

| Evidence Type | Description |
|---------------|-------------|
| `files` | Affected files or IaC templates |
| `ips` | IP addresses or CIDR ranges |
| `ports` | Open ports or port ranges |
| `secrets` | Exposed credentials or API keys (redacted) |
| `resources` | Cloud resource ARNs or identifiers |
| `policies` | IAM policies or security group rules |

## Field Reference

### Core Misconfiguration Fields

| Field | Type | Description |
|-------|------|-------------|
| `misconfigurationId` | string | Unique misconfiguration identifier |
| `name` | string | Misconfiguration name/title |
| `severity` | string | CRITICAL/HIGH/MEDIUM/LOW/INFO |
| `status` | string | NEW/IN_PROGRESS/RESOLVED/RISK_ACKED/SUPPRESSED |
| `viewType` | string | Detection domain (CLOUD, KUBERNETES, etc.) |
| `detectedAt` | datetime | When the misconfiguration was first detected |
| `siteName` | string | SentinelOne site (MSP client) |
| `complianceStandards` | array | Mapped compliance standards |
| `mitreAttackTechniques` | array | MITRE ATT&CK technique IDs |
| `remediationSteps` | string | Step-by-step remediation guidance |
| `evidence` | object | Evidence details (files, IPs, ports, secrets) |
| `resourceType` | string | Type of affected resource |
| `resourceName` | string | Name of affected resource |
| `cloudProvider` | string | AWS/AZURE/GCP (for cloud findings) |
| `region` | string | Cloud region (for cloud findings) |

## Common Workflows

### Cloud Security Posture Review

1. Call `list_misconfigurations` with `viewType=CLOUD`, `severity=CRITICAL`, `sortOrder=DESC`
2. Group by cloud provider (AWS/Azure/GCP) and region
3. For each critical finding, call `get_misconfiguration` for full details and remediation steps
4. Identify patterns (e.g., multiple public S3 buckets, widespread missing encryption)
5. Build a remediation priority list

### Compliance Audit

1. Call `search_misconfigurations` filtered by compliance standard (e.g., CIS, SOC 2, HIPAA)
2. Group by severity and status
3. Calculate compliance score: (resolved / total) * 100
4. Identify gap areas where critical misconfigurations are open
5. Generate a compliance report with remediation timelines

### Client Security Assessment

1. Call `search_misconfigurations` filtered by `siteName` for the client
2. Aggregate by view type: cloud, Kubernetes, identity, IaC
3. Count by severity: CRITICAL, HIGH, MEDIUM, LOW
4. Highlight misconfigurations with MITRE ATT&CK mappings
5. Provide remediation guidance for the top findings

### Kubernetes Security Review

1. Call `list_misconfigurations` with `viewType=KUBERNETES`, `limit=100`
2. Focus on containers running as root, missing network policies, and exposed services
3. Cross-reference with any related alerts
4. Generate a Kubernetes hardening checklist

### Identity Posture Review

1. Call `list_misconfigurations` with `viewType=IDENTITY`
2. Focus on stale accounts, excessive permissions, and missing MFA
3. Group by identity provider (Active Directory, Entra ID)
4. Generate identity hygiene recommendations

## Response Examples

**Misconfiguration Detail:**

```json
{
  "misconfigurationId": "misconfig-xyz-789",
  "name": "S3 Bucket Public Access Enabled",
  "severity": "CRITICAL",
  "status": "NEW",
  "viewType": "CLOUD",
  "detectedAt": "2026-02-24T04:30:00.000Z",
  "siteName": "Acme Corporation",
  "cloudProvider": "AWS",
  "region": "us-east-1",
  "resourceType": "S3 Bucket",
  "resourceName": "acme-backup-2026",
  "complianceStandards": ["CIS AWS 1.5", "SOC 2", "PCI DSS 3.2.1"],
  "mitreAttackTechniques": ["T1530"],
  "remediationSteps": "1. Navigate to S3 > acme-backup-2026 > Permissions\n2. Enable 'Block all public access'\n3. Verify no bucket policies grant public access\n4. Enable S3 access logging",
  "evidence": {
    "resources": ["arn:aws:s3:::acme-backup-2026"],
    "policies": ["PublicRead ACL enabled"]
  }
}
```

## Error Handling

### Common Errors

| Error | Cause | Resolution |
|-------|-------|------------|
| Misconfiguration not found | Invalid misconfigurationId | Verify the ID with `list_misconfigurations` |
| Invalid severity filter | Wrong severity value | Use CRITICAL, HIGH, MEDIUM, LOW, or INFO |
| Invalid view type | Wrong viewType value | Use CLOUD, KUBERNETES, IDENTITY, etc. |
| Empty results | No matching misconfigurations | Widen filters or check scope |
| Authentication error | Invalid token | Verify Service User token is Account or Site level |

## Best Practices

1. **Prioritize by severity** - Focus on CRITICAL and HIGH misconfigurations first
2. **Use view types** - Scope reviews to specific domains (cloud, Kubernetes, identity)
3. **Map to compliance** - Track which compliance standards are impacted by open findings
4. **Follow remediation steps** - SentinelOne provides step-by-step guidance for each finding
5. **Review evidence** - Check the specific resource, policy, or file involved before remediating
6. **Track progress** - Monitor status transitions from NEW to RESOLVED
7. **Aggregate for QBRs** - Build posture summaries by client for quarterly reviews
8. **Cross-reference with alerts** - Check if any misconfiguration has been exploited
9. **Focus on patterns** - Multiple similar misconfigurations suggest a systemic issue
10. **Scope to clients** - Always filter by site when reviewing a specific client's posture

## Related Skills

- [Alerts](../alerts/SKILL.md) - Alerts triggered by misconfiguration exploitation
- [Vulnerabilities](../vulnerabilities/SKILL.md) - Vulnerabilities that compound misconfiguration risk
- [Inventory](../inventory/SKILL.md) - Asset context for misconfigured resources
- [API Patterns](../api-patterns/SKILL.md) - MCP tools reference and connection info
- [Purple AI](../purple-ai/SKILL.md) - Investigate potential exploitation of misconfigurations
