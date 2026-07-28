---
name: "Liongard Overview"
description: >
  Liongard platform fundamentals: the entity model (environments, agents,
  inspectors, launchpoints, systems, detections, metrics, timeline,
  dataprints, asset inventory), X-ROAR-API-KEY authentication against
  instance-scoped URLs, the split between the v1 and v2 APIs, and the
  shared pagination, filtering, and rate-limit conventions.
when_to_use: >-
  When orienting in the Liongard/ROAR API for the first time, resolving Liongard
  terminology, setting up credentials, or deciding which API version and shared
  request conventions apply. Use when: liongard, liongard overview, liongard platform, liongard
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

Environments represent customer organizations or sites being monitored. Each environment contains agents, launchpoints, systems, and detections, and can be organized into groups and tiers for logical management. See [references/api.md](references/api.md) for the environment core field table.

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
3. **Monitor usage** - Watch for unauthorized access patterns

## API Patterns

The complete v1 and v2 endpoint catalogs, pagination parameter table, and full
filter-operator table live in [references/api.md](references/api.md). The
conventions worth knowing up front:

- **Two API versions coexist, split by entity rather than by recency.** Environment/agent/launchpoint/system CRUD and detection queries are v1; environment groups, agent installer generation, metric evaluation, timeline queries, asset inventory, dataprints, and webhooks are v2-only. Some entities (environments, agents, detections, metrics) exist in both, where v2 adds filtering and field selection.
- **Pagination style depends on HTTP method.** GET endpoints take lowercase `page` / `pageSize` query params; POST-based query endpoints take a nested PascalCase `Pagination: {Page, PageSize}` object in the body. Default `pageSize` is 50, max is 2000.
- **Response envelopes are always PascalCase** — `Data`, `TotalRows`, `HasMoreRows`, `CurrentPage`, `TotalPages`, `PageSize`. Loop on `HasMoreRows` rather than computing page counts.
- **POST endpoints filter with `conditions: [{path, op, value}]`** and support `fields[]` for field selection plus `orderBy: [{path, direction}]` for sorting. Operators: `eq`, `ne`, `gt`, `lt`, `gte`, `lte`, `contains`, `in`.
- **Rate limits are undocumented; 300 requests/minute is the safe working ceiling.** Honor `Retry-After` on 429 and add jitter to backoff.

See [references/examples.md](references/examples.md) for reusable pagination, retry-with-backoff, and error-handling client implementations, and [references/errors.md](references/errors.md) for the HTTP status code table.

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
