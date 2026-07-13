---
description: Cloud security posture review with compliance gap analysis
argument-hint: "[severity] [view_type] [limit]"
arguments: [severity, view_type, limit]
---

# SentinelOne Cloud Security Posture Review

Review cloud security posture across managed client environments. Lists misconfigurations grouped by severity, identifies compliance gaps against industry standards (CIS, SOC 2, PCI DSS, HIPAA), and provides remediation guidance for the most critical findings. Useful for compliance audits, QBR security reporting, and cloud hardening initiatives.

## Prerequisites

- SentinelOne Purple MCP server connected with a valid Service User token
- MCP tools `list_misconfigurations`, `search_misconfigurations`, and `get_misconfiguration` available
- Token must be Account or Site level (NOT Global)

## Steps

1. **Fetch misconfigurations**

   Call `list_misconfigurations` with the specified `severity` filter, `viewType`, and `limit`. Sort by severity descending.

2. **Count by severity**

   Aggregate results to show counts of CRITICAL, HIGH, MEDIUM, LOW misconfigurations.

3. **Identify compliance gaps**

   Group misconfigurations by compliance standard to show which standards have the most open findings.

4. **Break down by client**

   Group by site (client) to show which clients have the worst posture.

5. **Highlight critical findings with remediation**

   For CRITICAL and HIGH findings, include the remediation steps and evidence details.

6. **Provide posture improvement recommendations**

   Prioritize remediation based on severity, compliance impact, and exploit potential.

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| severity | string | No | all | Filter by severity (CRITICAL, HIGH, MEDIUM, LOW) |
| view_type | string | No | CLOUD | Domain filter (CLOUD, KUBERNETES, IDENTITY, INFRASTRUCTURE_AS_CODE, SECRET_SCANNING) |
| limit | integer | No | 50 | Maximum number of misconfigurations to return |

## Examples

### Cloud Posture Review

```
/posture-review
```

### Critical Cloud Findings Only

```
/posture-review --severity CRITICAL
```

### Kubernetes Posture Review

```
/posture-review --view_type KUBERNETES
```

### Identity Posture Review

```
/posture-review --view_type IDENTITY
```

### IaC Security Review

```
/posture-review --view_type INFRASTRUCTURE_AS_CODE
```

### Exposed Secrets Review

```
/posture-review --view_type SECRET_SCANNING
```

## Output

### Cloud Posture Report

```
SentinelOne Cloud Security Posture Review
================================================================
Generated: 2026-02-24
Domain:    CLOUD
Total Misconfigurations: 156

Severity Breakdown:
+----------+-------+
| Severity | Count |
+----------+-------+
| CRITICAL | 5     |
| HIGH     | 18    |
| MEDIUM   | 67    |
| LOW      | 66    |
+----------+-------+

Compliance Impact:
+----------------------------+----------+------+--------+------+
| Standard                   | CRITICAL | HIGH | MEDIUM | LOW  |
+----------------------------+----------+------+--------+------+
| CIS AWS 1.5               | 3        | 8    | 25     | 20   |
| CIS Azure 2.0             | 1        | 5    | 18     | 15   |
| SOC 2                     | 4        | 12   | 35     | 30   |
| PCI DSS 3.2.1             | 2        | 6    | 15     | 10   |
| HIPAA                     | 1        | 4    | 12     | 8    |
+----------------------------+----------+------+--------+------+

Clients by Posture Risk:
+----------------------------+----------+------+--------+------+
| Client                     | CRITICAL | HIGH | MEDIUM | LOW  |
+----------------------------+----------+------+--------+------+
| Acme Corporation           | 2        | 5    | 15     | 12   |
| TechStart Inc              | 1        | 4    | 12     | 10   |
| Global Services LLC        | 1        | 3    | 18     | 15   |
| Metro Industries           | 1        | 3    | 10     | 12   |
| Summit Financial           | 0        | 3    | 12     | 17   |
+----------------------------+----------+------+--------+------+

CRITICAL Findings (Immediate Remediation Required):
================================================================

1. S3 Bucket Public Access Enabled
   Client:     Acme Corporation
   Resource:   arn:aws:s3:::acme-backup-2026 (AWS us-east-1)
   Compliance: CIS AWS 1.5, SOC 2, PCI DSS
   MITRE:      T1530 - Data from Cloud Storage
   Remediation:
     1. Navigate to S3 > acme-backup-2026 > Permissions
     2. Enable "Block all public access"
     3. Verify no bucket policies grant public access
     4. Enable S3 access logging

2. Security Group Allows SSH from 0.0.0.0/0
   Client:     Acme Corporation
   Resource:   sg-0abc1234 (AWS us-east-1)
   Compliance: CIS AWS 1.5, SOC 2, PCI DSS
   MITRE:      T1133 - External Remote Services
   Remediation:
     1. Restrict SSH (port 22) to specific IP ranges
     2. Use a bastion host or VPN for remote access
     3. Enable VPC Flow Logs for monitoring

3. Azure Storage Account Without Encryption at Rest
   Client:     TechStart Inc
   Resource:   techstart-files (Azure eastus)
   Compliance: CIS Azure 2.0, HIPAA, PCI DSS
   MITRE:      T1565 - Data Manipulation
   Remediation:
     1. Enable Azure Storage Service Encryption (SSE)
     2. Use customer-managed keys for HIPAA compliance
     3. Enable soft delete and versioning

4. IAM Root Account Without MFA
   Client:     Global Services LLC
   Resource:   AWS Account 123456789012
   Compliance: CIS AWS 1.5, SOC 2, PCI DSS, HIPAA
   MITRE:      T1078 - Valid Accounts
   Remediation:
     1. Enable MFA on the root account immediately
     2. Use hardware MFA token for root (not virtual)
     3. Restrict root account usage to emergencies only

5. Kubernetes Dashboard Exposed to Internet
   Client:     Metro Industries
   Resource:   k8s-dashboard (AKS cluster metro-prod)
   Compliance: CIS Kubernetes 1.6, SOC 2
   MITRE:      T1133 - External Remote Services
   Remediation:
     1. Remove public LoadBalancer service
     2. Use kubectl proxy or port-forward for access
     3. Implement RBAC for dashboard access

Posture Improvement Priorities:
  1. IMMEDIATE: Remediate 5 CRITICAL findings (public storage, open SSH, no MFA)
  2. THIS WEEK: Address 18 HIGH findings (encryption, access controls)
  3. THIS MONTH: Resolve 67 MEDIUM findings (logging, monitoring gaps)
  4. ONGOING: Track and reduce LOW findings during maintenance

Posture Score: 68/100 (Fair)
  Target: 85/100 within 90 days
================================================================
```

### Clean Posture

```
SentinelOne Cloud Security Posture Review
================================================================
Generated: 2026-02-24
Domain:    CLOUD
Severity:  CRITICAL

No critical cloud misconfigurations found.

Cloud security posture is strong at the critical level.
Consider reviewing HIGH severity findings:
  /posture-review --severity HIGH

Posture Score: 92/100 (Excellent)
================================================================
```

### No Data

```
SentinelOne Cloud Security Posture Review
================================================================
Generated: 2026-02-24
Domain:    KUBERNETES

No Kubernetes misconfigurations found.

Possible reasons:
  - No Kubernetes clusters connected to SentinelOne
  - Kubernetes security scanning not enabled
  - Service User token may lack CSPM access

Suggestions:
  - Check SentinelOne Console > Cloud Security for connector status
  - Try a different domain: /posture-review --view_type CLOUD
================================================================
```

## Error Handling

### MCP Connection Error

```
Error: Unable to connect to SentinelOne Purple MCP server

Check your MCP configuration and verify your Service User token.
Token must be Account or Site level (NOT Global).
```

### Authentication Error

```
Error: 401 Unauthorized

Your Service User token may be invalid or Global-level.
Regenerate at: SentinelOne Console > Policy & Settings > User Management > Service Users
```

### Rate Limit

```
Warning: Rate limit reached during posture review.

Partial results available. Wait 30-60 seconds and retry.
Use --severity CRITICAL to reduce the result set.
```

## MCP Tools Used

| Tool | Purpose |
|------|---------|
| `list_misconfigurations` | Fetch misconfigurations with severity/viewType filters |
| `search_misconfigurations` | Search by client, compliance standard, or resource |
| `get_misconfiguration` | Get full details including remediation steps and evidence |

## Use Cases

### Daily Cloud Security Check

```
/posture-review --severity CRITICAL
```

### Quarterly Compliance Audit

```
/posture-review --limit 100
```

### Kubernetes Hardening

```
/posture-review --view_type KUBERNETES
```

### Identity Security Review

```
/posture-review --view_type IDENTITY
```

### Client QBR Security Summary

Run multiple reviews for a comprehensive client report:
```
/posture-review --view_type CLOUD
/posture-review --view_type KUBERNETES
/posture-review --view_type IDENTITY
/vuln-report
/alert-triage
```

## Related Commands

- `/alert-triage` - Check alerts that may result from misconfigurations
- `/vuln-report` - Vulnerabilities that compound misconfiguration risk
- `/asset-inventory` - Identify misconfigured assets in inventory
- `/hunt-threat` - Hunt for exploitation of known misconfigurations
