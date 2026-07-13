---
name: "RocketCyber Apps"
description: >
  Use this skill when working with RocketCyber application inventory - detecting,
  categorizing, and monitoring applications across managed endpoints. Covers
  application discovery, approved vs unapproved applications, app-level threat
  detection, and software compliance reporting.
when_to_use: >-
  When detecting, categorizing, and monitoring applications across managed endpoints. Use when:
  rocketcyber app, rocketcyber application, rocketcyber software, rocketcyber inventory,
  application detection rocketcyber, software compliance rocketcyber, rocketcyber installed
  software, or app monitoring rocketcyber.
---

# RocketCyber Application Inventory

## Overview

RocketCyber tracks applications detected across managed endpoints through its agent telemetry. The application inventory provides visibility into what software is installed and running in customer environments, supporting security compliance, threat investigation, and software governance.

Key capabilities:

- **Application Discovery** - Automatic detection of installed and running applications
- **Categorization** - Applications categorized by type and risk level
- **Compliance Monitoring** - Track approved vs unapproved software
- **Threat Context** - Application data provides context during incident investigation
- **Per-Account Inventory** - Software inventory scoped to individual customer accounts

## Key Concepts

### Application Detection

RocketAgent continuously monitors endpoints and reports detected applications back to the RocketCyber platform. Detection covers:

- **Installed applications** - Software present on the system
- **Running processes** - Active applications and services
- **Browser extensions** - Web browser add-ons (verify against API docs)
- **Services** - Windows services and daemons (verify against API docs)

### Application Categories

Applications may be categorized by type (verify categories against API docs):

| Category | Description | Examples |
|----------|-------------|---------|
| **Security** | Security and antivirus tools | Windows Defender, CrowdStrike, SentinelOne |
| **Remote Access** | Remote control and access tools | TeamViewer, AnyDesk, LogMeIn |
| **Productivity** | Business and productivity software | Microsoft Office, Google Workspace |
| **Communication** | Messaging and collaboration | Slack, Teams, Zoom |
| **Development** | Development tools and IDEs | Visual Studio, VS Code, Git |
| **System** | OS and system utilities | Windows Update, .NET Runtime |
| **Unknown/Other** | Uncategorized applications | Custom or niche software |

### Security Relevance

Application inventory matters for security because:

- **Unauthorized remote access tools** (e.g., unexpected TeamViewer) may indicate compromise
- **Missing security software** (e.g., no AV present) indicates coverage gaps
- **Shadow IT** applications may introduce vulnerabilities
- **Outdated software** may have known CVEs

## Field Reference

| Field | Type | Description |
|-------|------|-------------|
| `id` | integer | Unique application record identifier (verify against API docs) |
| `name` | string | Application name |
| `version` | string | Application version (verify against API docs) |
| `publisher` | string | Application publisher/vendor (verify against API docs) |
| `category` | string | Application category (verify against API docs) |
| `accountId` | integer | Customer account where the app was detected |
| `agentId` | integer | Agent/endpoint where the app was detected (verify against API docs) |
| `hostname` | string | Endpoint hostname (verify against API docs) |
| `detectedAt` | datetime | When the application was first detected (verify against API docs) |
| `lastSeen` | datetime | Most recent detection timestamp (verify against API docs) |

> **Note:** Field names are inferred from common SOC platform conventions. Verify exact field names against RocketCyber API responses.

## API Patterns

### List Applications by Account

```bash
# Applications for a specific customer
curl -s "https://api-${ROCKETCYBER_REGION:-us}.rocketcyber.com/v3/apps?accountId=12345" \
  -H "Authorization: Bearer ${ROCKETCYBER_API_KEY}"
```

**Response (verify against API docs):**
```json
{
  "data": [
    {
      "id": 7001,
      "name": "TeamViewer",
      "version": "15.40.0",
      "publisher": "TeamViewer GmbH",
      "category": "Remote Access",
      "accountId": 12345,
      "hostname": "WORKSTATION-01",
      "detectedAt": "2026-01-15T08:00:00Z",
      "lastSeen": "2026-02-23T09:00:00Z"
    },
    {
      "id": 7002,
      "name": "Windows Defender",
      "version": "4.18.24010",
      "publisher": "Microsoft",
      "category": "Security",
      "accountId": 12345,
      "hostname": "WORKSTATION-01",
      "detectedAt": "2025-06-15T09:00:00Z",
      "lastSeen": "2026-02-23T09:00:00Z"
    }
  ],
  "totalCount": 150,
  "page": 1,
  "limit": 50
}
```

### List All Applications (Provider-Wide)

```bash
# All applications across all customer accounts
curl -s "https://api-us.rocketcyber.com/v3/apps" \
  -H "Authorization: Bearer ${ROCKETCYBER_API_KEY}"
```

## Common Workflows

### Unauthorized Software Audit

1. **List all applications** across accounts (or for a specific account)
2. **Filter for remote access tools** -- TeamViewer, AnyDesk, LogMeIn, Splashtop, etc.
3. **Cross-reference** against approved remote access policy
4. **Flag unauthorized** remote access tools for investigation
5. **Check incidents** -- correlate with any security incidents on the same endpoints

### Security Software Coverage

1. **List all agents** for a customer account
2. **List all applications** for the same account
3. **For each agent/endpoint**, check for required security tools:
   - Antivirus / EDR present
   - Backup agent present
   - Patch management agent present
4. **Report gaps** where required software is missing

### Application Inventory Report

1. Query applications by account
2. Group by category
3. Count unique applications per category
4. Identify most common applications
5. Flag any known-vulnerable software versions

### Incident Investigation Context

When investigating a security incident:

1. Get the affected device hostname from the incident
2. Query applications for that endpoint
3. Check for suspicious applications:
   - Unexpected remote access tools
   - Hacking tools or penetration testing software
   - Cryptocurrency miners
   - Unauthorized VPN software
4. Note recently detected applications (may correlate with incident timeline)

## Error Handling

### Common Errors

| Scenario | HTTP Code | Resolution |
|----------|-----------|------------|
| Invalid API key | 401 | Verify key in Provider Settings > API |
| Account has no apps | 200 (empty) | Agents may not have reported yet, or no agents deployed |
| Rate limited | 429 | Back off 30 seconds, retry |

### No Applications Found

```
No applications found for account ID 12345.

This could mean:
- Agents have not yet reported application data
- No agents are deployed to this customer
- The account ID is incorrect (verify with /accounts endpoint)
```

## Related Skills

- [api-patterns](../api-patterns/SKILL.md) - Authentication, pagination, error handling
- [agents](../agents/SKILL.md) - Agents that report application telemetry
- [incidents](../incidents/SKILL.md) - Application context during incident investigation
- [accounts](../accounts/SKILL.md) - Account scoping for application queries
