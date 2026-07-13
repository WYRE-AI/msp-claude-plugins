---
name: "RocketCyber Incidents"
description: >
  Use this skill when working with RocketCyber security incidents - searching,
  triaging, investigating, and resolving incidents. Covers incident lifecycle,
  severity levels, verdicts (Malicious/Suspicious/Benign), status transitions,
  SOC analyst triage patterns, and cross-vendor PSA ticket correlation.
when_to_use: >-
  When searching, triaging, investigating, and resolving incidents. Use when: rocketcyber
  incident, rocketcyber threat, rocketcyber security, rocketcyber soc, rocketcyber malicious,
  rocketcyber suspicious, security incident, incident triage, threat detection rocketcyber,
  incident investigation, rocketcyber verdict, or rocketcyber resolved.
---

# RocketCyber Incident Management

## Overview

Incidents are the core artifact in RocketCyber's managed SOC platform. When the SOC detects a potential threat -- through endpoint telemetry, log analysis, or behavioral detection -- it creates an incident. MSP technicians and SOC analysts use incidents to investigate threats, determine verdicts, and take remediation actions.

The incident system supports:

- **Automated Detection** - Threats identified by RocketCyber's detection engine
- **SOC Analyst Review** - Human analysts review and assign verdicts
- **MSP Triage** - MSP technicians investigate and remediate at the customer level
- **Audit Trail** - Full history of incident status changes and actions

## Key Concepts

### Incident Lifecycle

```
┌─────────┐    Analyst    ┌──────────────┐    Resolved    ┌───────────┐
│   New   │ ──────────>   │ In Progress  │ ────────────>  │ Resolved  │
└─────────┘               └──────────────┘                └───────────┘
     │                          │
     │                          │  Determined benign
     │                          ▼
     │                    ┌────────────────┐
     └──────────────────> │ False Positive │
                          └────────────────┘
```

1. **New** - Incident created by detection engine; awaiting review
2. **In Progress** - Analyst or technician actively investigating
3. **Resolved** - Threat confirmed and remediated, or determined non-threatening
4. **False Positive** - Investigated and determined to not be a real threat

### Verdicts

Verdicts represent the SOC analyst's assessment of the threat:

| Verdict | Description | Typical Action |
|---------|-------------|----------------|
| **Malicious** | Confirmed threat requiring immediate remediation | Isolate endpoint, remove threat, notify customer |
| **Suspicious** | Potentially threatening; requires further investigation | Monitor closely, gather additional evidence |
| **Benign** | Activity is legitimate and not a threat | Close incident, update detection rules if needed |

### Severity Levels

| Severity | Description | SLA Target |
|----------|-------------|------------|
| **Critical** | Active breach or imminent threat to business operations | Immediate (15 min) |
| **High** | Confirmed malicious activity requiring urgent response | 1 hour |
| **Medium** | Suspicious activity that needs investigation | 4 hours |
| **Low** | Minor anomaly or informational finding | 8 hours |

## Field Reference

| Field | Type | Description |
|-------|------|-------------|
| `id` | integer | Unique incident identifier |
| `title` | string | Short description of the incident |
| `description` | string | Detailed incident narrative from SOC |
| `status` | string | Current status: New, In Progress, Resolved, False Positive |
| `severity` | string | Severity level: Critical, High, Medium, Low |
| `verdict` | string | Analyst verdict: Malicious, Suspicious, Benign |
| `accountId` | integer | Customer account where the incident occurred |
| `accountName` | string | Customer account name (verify against API docs) |
| `createdAt` | datetime | When the incident was created |
| `updatedAt` | datetime | When the incident was last updated |
| `resolvedAt` | datetime | When the incident was resolved (if applicable) |
| `assignedTo` | string | Analyst or resource assigned to the incident (verify against API docs) |
| `eventCount` | integer | Number of related threat events (verify against API docs) |
| `affectedDevices` | array | List of endpoints involved (verify against API docs) |

> **Note:** Field names are inferred from the Celerium PowerShell wrapper and common SOC platform conventions. Verify exact field names against RocketCyber API responses.

## API Patterns

### List Incidents

```bash
# All incidents (most recent first)
curl -s "https://api-${ROCKETCYBER_REGION:-us}.rocketcyber.com/v3/incidents" \
  -H "Authorization: Bearer ${ROCKETCYBER_API_KEY}"
```

**Response (verify against API docs):**
```json
{
  "data": [
    {
      "id": 98765,
      "title": "Suspicious PowerShell execution detected",
      "status": "New",
      "severity": "High",
      "verdict": "Suspicious",
      "accountId": 12345,
      "createdAt": "2026-02-22T14:30:00Z",
      "updatedAt": "2026-02-22T14:30:00Z"
    }
  ],
  "totalCount": 245,
  "page": 1,
  "limit": 50
}
```

### Filter Incidents by Account

```bash
# Incidents for a specific customer
curl -s "https://api-us.rocketcyber.com/v3/incidents?accountId=12345" \
  -H "Authorization: Bearer ${ROCKETCYBER_API_KEY}"
```

### Filter Incidents by Status

```bash
# Only open (New + In Progress) incidents
curl -s "https://api-us.rocketcyber.com/v3/incidents?status=open" \
  -H "Authorization: Bearer ${ROCKETCYBER_API_KEY}"

# Only resolved incidents
curl -s "https://api-us.rocketcyber.com/v3/incidents?status=resolved" \
  -H "Authorization: Bearer ${ROCKETCYBER_API_KEY}"
```

> **Note:** The exact query parameter values for status filtering (e.g., `status=open` vs `status=New`) should be verified against the API documentation.

### Filter Incidents by Severity

```bash
# Critical incidents only
curl -s "https://api-us.rocketcyber.com/v3/incidents?severity=critical" \
  -H "Authorization: Bearer ${ROCKETCYBER_API_KEY}"
```

### Filter Incidents by Date Range

```bash
# Incidents from the last 7 days (verify date parameter format)
curl -s "https://api-us.rocketcyber.com/v3/incidents?startDate=2026-02-16T00:00:00Z&endDate=2026-02-23T00:00:00Z" \
  -H "Authorization: Bearer ${ROCKETCYBER_API_KEY}"
```

### Get Incident Details

```bash
# Single incident with full details
curl -s "https://api-us.rocketcyber.com/v3/incidents/98765" \
  -H "Authorization: Bearer ${ROCKETCYBER_API_KEY}"
```

**Response (verify against API docs):**
```json
{
  "id": 98765,
  "title": "Suspicious PowerShell execution detected",
  "description": "Encoded PowerShell command detected on WORKSTATION-01. The command attempts to download and execute a remote script from an external IP address.",
  "status": "In Progress",
  "severity": "High",
  "verdict": "Malicious",
  "accountId": 12345,
  "accountName": "Acme Corporation",
  "createdAt": "2026-02-22T14:30:00Z",
  "updatedAt": "2026-02-22T15:45:00Z",
  "resolvedAt": null,
  "eventCount": 3,
  "affectedDevices": [
    {
      "hostname": "WORKSTATION-01",
      "os": "Windows 11",
      "lastSeen": "2026-02-22T15:30:00Z"
    }
  ]
}
```

## Common Workflows

### SOC Analyst Triage Pattern

1. **Query new incidents** -- filter by status=New, sort by severity descending
2. **Review highest severity first** -- Critical and High take priority
3. **Check incident details** -- review description, affected devices, event count
4. **Investigate threat events** -- cross-reference with events endpoint
5. **Assign verdict** -- Malicious, Suspicious, or Benign
6. **Take action** -- remediate (Malicious), monitor (Suspicious), or close (Benign)
7. **Update status** -- move to Resolved or False Positive

### Daily Security Review

1. List all incidents created in the last 24 hours
2. Count by severity: Critical / High / Medium / Low
3. Count by verdict: Malicious / Suspicious / Benign / Pending
4. Identify any unreviewed Critical or High incidents
5. Check for recurring incident patterns across accounts

### Customer Security Report

1. Filter incidents by `accountId` for the target customer
2. Summarize incidents by severity and verdict for the reporting period
3. Highlight resolved Malicious incidents with remediation details
4. Note any ongoing Suspicious incidents requiring monitoring
5. Include agent health status and coverage metrics

### Cross-Vendor PSA Ticket Correlation

RocketCyber incidents often need to be correlated with PSA tickets for billing and tracking:

1. When a Malicious or Suspicious incident is confirmed, create a corresponding ticket in your PSA (Autotask, ConnectWise, HaloPSA, etc.)
2. Include the RocketCyber incident ID in the PSA ticket for cross-reference
3. Use the incident severity to set PSA ticket priority
4. When the RocketCyber incident is resolved, update the PSA ticket accordingly

> See also: shared incident correlation skills if available in `shared/skills/`

## Error Handling

### Common Errors

| Scenario | HTTP Code | Resolution |
|----------|-----------|------------|
| Invalid API key | 401 | Verify key in Provider Settings > API |
| Account not found | 404 | Check account ID with `/accounts` endpoint |
| Incident not found | 404 | Verify incident ID; it may have been purged |
| Rate limited | 429 | Back off 30 seconds, retry with exponential backoff |
| Invalid filter value | 400 | Check query parameter values against API docs |

### Authentication Error

```
401 Unauthorized

Verify your RocketCyber credentials:
- ROCKETCYBER_API_KEY: Your API key from Provider Settings > API tab
- Ensure the key has not been revoked or regenerated
```

## Related Skills

- [api-patterns](../api-patterns/SKILL.md) - Authentication, pagination, error handling
- [agents](../agents/SKILL.md) - Agent deployment and health (affected devices context)
- [accounts](../accounts/SKILL.md) - Account hierarchy (incident scoping)
- [apps](../apps/SKILL.md) - Application inventory (application-layer threats)
