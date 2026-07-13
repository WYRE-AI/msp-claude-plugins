---
name: "Liongard Overview"
description: >
  Use this skill when Claude needs context about the Liongard platform,
  terminology, capabilities, authentication patterns, or API structure.
  Covers environments, agents, inspectors, launchpoints, systems, detections,
  and common MSP workflows for automated IT documentation.
when_to_use: >-
  When claude needs context about the Liongard platform, terminology, capabilities, authentication
  patterns, or API structure. Use when: liongard, liongard overview, liongard platform, liongard
  api, roar api, liongard terminology, liongard authentication, or liongard capabilities.
---

# Liongard Platform Overview

## What Is Liongard?

Liongard is an automated IT documentation and configuration management platform built for Managed Service Providers (MSPs). It continuously inspects and documents IT environments across hundreds of technology platforms, providing:

- **Automated documentation** of customer IT infrastructure
- **Change detection** to identify configuration drift and anomalies
- **Compliance monitoring** to enforce security baselines
- **Cross-platform visibility** from a single dashboard
- **Historical snapshots** of system configurations over time

Liongard replaces manual documentation processes with automated, scheduled inspections that capture the state of servers, firewalls, cloud services, and more.

## Key Terminology

### Environments

Environments represent customer organizations or sites being monitored. Each environment contains agents, launchpoints, systems, and detections. Environments can be organized into groups and tiers for logical management.

| Field | Type | Description |
|-------|------|-------------|
| `ID` | int | Unique environment identifier |
| `Name` | string | Environment display name |
| `Description` | string | Optional description |
| `Status` | string | Active or Inactive |
| `Visible` | boolean | Visibility in UI |
| `Tier` | string | Service tier classification |
| `CreatedOn` | datetime | Creation timestamp |
| `UpdatedOn` | datetime | Last update timestamp |

### Agents

Agents are lightweight software deployed to customer sites that execute inspections. Each agent connects back to the Liongard platform and runs configured inspection tasks on a schedule.

- Agents can be installed on Windows, Linux, or macOS
- Each agent is associated with one or more environments
- Agents report status (Online, Offline, Error)
- Dynamic installer generation available via API

### Inspectors

Inspectors are templates defining what to inspect. Liongard provides hundreds of built-in inspectors for common platforms:

- **Active Directory** - Users, groups, policies, domain controllers
- **Microsoft 365** - Tenants, users, licenses, security settings
- **Cisco Meraki** - Networks, devices, VPN, firewall rules
- **VMware vSphere** - Hosts, VMs, datastores, networking
- **Fortinet FortiGate** - Firewall policies, VPN, interfaces
- **SonicWall** - Security policies, VPN, zones
- **Datto** - Backup status, agents, recovery points
- And hundreds more across networking, security, cloud, and backup platforms

### Launchpoints

Launchpoints are configured inspection instances that tie together an inspector template, a target environment, an agent, credentials, and a schedule. They represent "run this inspector against this target on this schedule."

| Component | Description |
|-----------|-------------|
| Inspector | What to inspect (template) |
| Environment | Where it belongs (customer) |
| Agent | Who runs it (deployed software) |
| Credentials | How to authenticate to the target |
| Schedule | When to run (cron expression) |

### Systems

Systems are discovered items from inspections. When a launchpoint runs, it discovers systems such as servers, firewalls, cloud services, user accounts, and other entities. Each system contains detailed configuration data captured during inspection.

### Detections

Detections are automated change and anomaly alerts generated when inspections find differences from previous runs. They enable MSPs to:

- Monitor configuration changes across all clients
- Identify unauthorized modifications
- Track compliance drift
- Alert on security-relevant changes

### Metrics

Custom metrics allow MSPs to define and track specific values across systems and environments. Metrics can be evaluated per-system or aggregated across environments.

### Timeline

The timeline provides an audit trail of all events and changes within Liongard, including inspection runs, detection triggers, user actions, and system events.

### Dataprints

Dataprints provide JMESPath-evaluated data extraction from system details. They allow precise querying of nested configuration data captured during inspections.

### Asset Inventory

Asset Inventory (v2) provides identity and device profile management across all inspected environments, aggregating user accounts and devices discovered through inspections.

## Authentication

### API Key Authentication

Liongard uses API key authentication via the `X-ROAR-API-KEY` header:

```http
GET /api/v1/environments
X-ROAR-API-KEY: YOUR_API_KEY
Content-Type: application/json
```

**Required Headers:**

| Header | Value | Description |
|--------|-------|-------------|
| `X-ROAR-API-KEY` | `{api_key}` | API key from Liongard portal |
| `Content-Type` | `application/json` | For POST/PUT requests |

### Instance-Based URLs

Liongard uses instance-based URLs where each customer has a unique subdomain:

```
https://{instance}.app.liongard.com/api/v1
https://{instance}.app.liongard.com/api/v2
```

For example, if your instance is `acmemsp`:
```
https://acmemsp.app.liongard.com/api/v1/environments
```

### Obtaining API Credentials

1. Log into your Liongard instance
2. Navigate to **Settings > Access Keys**
3. Click **Create Access Key**
4. Copy the API key (store securely)
5. Note your instance name from the URL

### Environment Variable Setup

```bash
export LIONGARD_INSTANCE="yourcompany"
export LIONGARD_API_KEY="your-api-key-here"
```

### Security Best Practices

1. **Never commit API keys** - Use environment variables or secret managers
2. **Rotate keys periodically** - Generate new keys on a regular schedule
3. **Use HTTPS only** - All Liongard API calls require HTTPS
4. **Limit key access** - Only share with necessary services
5. **Monitor usage** - Watch for unauthorized access patterns

## Dual API Versions

Liongard provides two API versions with different entity coverage:

### v1 Endpoints

Most entities are accessed through v1:

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/api/v1/environments` | GET, POST, PUT, DELETE | Environment management |
| `/api/v1/environments/count` | GET | Environment count |
| `/api/v1/agents` | GET, DELETE | Agent management |
| `/api/v1/inspectors` | GET | Inspector templates |
| `/api/v1/launchpoints` | GET, POST, PUT, DELETE | Configured inspections |
| `/api/v1/launchpoints/{id}/run` | POST | Trigger inspection |
| `/api/v1/systems` | GET | Discovered systems |
| `/api/v1/systems/{id}/detail` | GET | System detail data |
| `/api/v1/detections` | POST | Query detections |
| `/api/v1/alerts` | GET, POST, PUT, DELETE | Alert rules |
| `/api/v1/alerts/triggered` | GET | Triggered alerts |
| `/api/v1/metrics` | GET, POST, PUT, DELETE | Custom metrics |
| `/api/v1/timeline` | GET | Timeline events |
| `/api/v1/users` | GET | User management |
| `/api/v1/groups` | GET | Group management |
| `/api/v1/accesskeys` | GET, POST, DELETE | API key management |

### v2 Endpoints

Newer and enhanced endpoints are available through v2:

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/api/v2/environments` | GET, POST, PUT, DELETE | Enhanced environment management |
| `/api/v2/environment-groups` | GET, POST, PUT, DELETE | Environment grouping |
| `/api/v2/agents` | GET, DELETE | Enhanced agent management |
| `/api/v2/agents/installer` | POST | Dynamic installer generation |
| `/api/v2/detections` | POST | Enhanced detection queries |
| `/api/v2/metrics` | GET, POST, PUT, DELETE | Enhanced metrics |
| `/api/v2/metrics/evaluate` | POST | Metric evaluation |
| `/api/v2/metrics/evaluate-systems` | POST | Per-system metric evaluation |
| `/api/v2/timelines-query` | POST | Enhanced timeline queries |
| `/api/v2/inventory/identities` | GET | Identity profiles |
| `/api/v2/inventory/devices` | GET | Device profiles |
| `/api/v2/dataprints-evaluate-systemdetailid` | POST | JMESPath data extraction |
| `/api/v2/webhooks` | GET, POST, PUT, DELETE | Webhook management |

## Pagination

### GET Request Pagination

For GET requests, use `page` and `pageSize` query parameters:

```http
GET /api/v1/environments?page=1&pageSize=100
X-ROAR-API-KEY: {api_key}
```

### POST Request Pagination

For POST-based queries (detections, timelines), include a `Pagination` object in the request body:

```json
{
  "Pagination": {
    "Page": 1,
    "PageSize": 100
  },
  "conditions": []
}
```

### Pagination Parameters

| Parameter | Type | Default | Max | Description |
|-----------|------|---------|-----|-------------|
| `page` / `Page` | int | 1 | - | Page number (1-indexed) |
| `pageSize` / `PageSize` | int | 50 | 2000 | Items per page |

### Pagination Response

```json
{
  "Data": [...],
  "TotalRows": 1500,
  "HasMoreRows": true,
  "CurrentPage": 1,
  "TotalPages": 15,
  "PageSize": 100
}
```

### Efficient Pagination Pattern

```javascript
async function fetchAllItems(endpoint) {
  const allItems = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const response = await fetch(
      `https://${instance}.app.liongard.com/api/v1/${endpoint}?page=${page}&pageSize=500`,
      {
        headers: {
          'X-ROAR-API-KEY': process.env.LIONGARD_API_KEY
        }
      }
    );

    const data = await response.json();
    allItems.push(...data.Data);

    hasMore = data.HasMoreRows;
    page++;

    // Respect rate limits
    if (hasMore) {
      await sleep(200);
    }
  }

  return allItems;
}
```

## Filtering

### Condition-Based Filtering

For POST-based endpoints, Liongard supports JSON condition filters:

```json
{
  "conditions": [
    {
      "path": "Status",
      "op": "eq",
      "value": "Active"
    },
    {
      "path": "Tier",
      "op": "eq",
      "value": "Premium"
    }
  ]
}
```

### Filter Operators

| Operator | Description | Example |
|----------|-------------|---------|
| `eq` | Equals | `{"op": "eq", "value": "Active"}` |
| `ne` | Not equals | `{"op": "ne", "value": "Inactive"}` |
| `gt` | Greater than | `{"op": "gt", "value": 100}` |
| `lt` | Less than | `{"op": "lt", "value": 50}` |
| `gte` | Greater than or equal | `{"op": "gte", "value": 10}` |
| `lte` | Less than or equal | `{"op": "lte", "value": 100}` |
| `contains` | String contains | `{"op": "contains", "value": "Acme"}` |
| `in` | Value in list | `{"op": "in", "value": [1, 2, 3]}` |

### Field Selection

Use `fields[]` to limit returned fields:

```json
{
  "fields": ["ID", "Name", "Status"],
  "conditions": []
}
```

### Sorting

Use `orderBy[]` to control result ordering:

```json
{
  "orderBy": [
    {
      "path": "Name",
      "direction": "asc"
    }
  ]
}
```

## Rate Limiting

### Conservative Default: 300 Requests per Minute

Liongard does not publicly document specific rate limits. A conservative default of **300 requests per minute** is recommended to avoid throttling.

### Retry Strategy with Exponential Backoff

```javascript
async function requestWithRetry(url, options, maxRetries = 5) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);

      if (response.status === 429) {
        const retryAfter = parseInt(response.headers.get('Retry-After')) || 30;
        const jitter = Math.random() * 1000;
        console.log(`Rate limited. Waiting ${retryAfter}s...`);
        await sleep(retryAfter * 1000 + jitter);
        continue;
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      if (attempt === maxRetries - 1) throw error;

      const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
      console.log(`Attempt ${attempt + 1} failed. Retrying in ${delay}ms...`);
      await sleep(delay);
    }
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
```

## Error Handling

### HTTP Status Codes

| Code | Meaning | Action |
|------|---------|--------|
| 200 | Success | Process response |
| 201 | Created | Entity created successfully |
| 400 | Bad Request | Check request format/values |
| 401 | Unauthorized | Verify API key |
| 403 | Forbidden | Check permissions |
| 404 | Not Found | Entity doesn't exist |
| 429 | Rate Limited | Implement backoff |
| 500 | Server Error | Retry with backoff |

### Error Handling Pattern

```javascript
async function handleLiongardRequest(endpoint, options = {}) {
  const baseUrl = `https://${process.env.LIONGARD_INSTANCE}.app.liongard.com/api/v1`;

  const response = await fetch(`${baseUrl}/${endpoint}`, {
    ...options,
    headers: {
      'X-ROAR-API-KEY': process.env.LIONGARD_API_KEY,
      'Content-Type': 'application/json',
      ...options.headers
    }
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));

    switch (response.status) {
      case 401:
        throw new Error('Invalid API key. Check LIONGARD_API_KEY.');
      case 403:
        throw new Error('Permission denied. Check API key permissions.');
      case 404:
        throw new Error(`Resource not found: ${endpoint}`);
      case 429:
        throw new Error('Rate limit exceeded. Implement backoff.');
      default:
        throw new Error(error.Message || `API error: ${response.status}`);
    }
  }

  return response.json();
}
```

## Common MSP Workflows

### New Client Onboarding

1. **Create environment** - Add new customer organization
2. **Deploy agent** - Install Liongard agent on client site
3. **Configure launchpoints** - Set up inspectors for AD, O365, firewalls, etc.
4. **Run initial inspections** - Trigger immediate inspection runs
5. **Review systems** - Verify discovered systems and data quality
6. **Configure detections** - Set up change monitoring and alerts
7. **Set up metrics** - Define compliance and health metrics

### Change Monitoring

1. **Review detections** - Check recent detection alerts
2. **Investigate changes** - Drill into system details for specifics
3. **Compare snapshots** - View before/after configuration data
4. **Document findings** - Record change context and approvals
5. **Update baselines** - Accept changes or flag for remediation

### Compliance Reporting

1. **Define metrics** - Create metrics for compliance requirements
2. **Evaluate across environments** - Run metric evaluations
3. **Generate reports** - Export metric results and trends
4. **Identify gaps** - Flag non-compliant systems
5. **Track remediation** - Monitor progress toward compliance

### Inspection Troubleshooting

1. **Check agent status** - Verify agent is online
2. **Review launchpoint** - Check configuration and credentials
3. **Check last inspection** - Look at most recent run status
4. **Review timeline** - Check for errors or warnings
5. **Re-run inspection** - Trigger manual inspection via API

## Data Relationships

```
Environment (ID)
    |
    +-- Agents (AgentID)
    |       +-- Installer Generation
    |
    +-- Launchpoints (LaunchpointID)
    |       +-- Inspector (InspectorID)
    |       +-- Schedule (Cron)
    |       +-- Systems (SystemID)
    |               +-- System Details
    |               +-- Dataprints
    |               +-- Inspections (InspectionID)
    |
    +-- Detections (DetectionID)
    |
    +-- Metrics (MetricID)
    |       +-- Metric Evaluations
    |
    +-- Timeline Events
    |
    +-- Asset Inventory
            +-- Identities
            +-- Device Profiles
```

## Related Skills

- [Liongard Environments](../environments/SKILL.md) - Environment management
- [Liongard Inspections](../inspections/SKILL.md) - Inspectors and launchpoints
- [Liongard Systems](../systems/SKILL.md) - Systems and dataprints
- [Liongard Detections](../detections/SKILL.md) - Change detection and alerts
