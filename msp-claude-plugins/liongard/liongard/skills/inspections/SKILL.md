---
name: "Liongard Inspections"
description: >
  Use this skill when working with Liongard inspectors, launchpoints,
  inspection scheduling, or triggering inspections on demand. Covers
  inspector templates, launchpoint configuration, cron schedules,
  running inspections, and troubleshooting failed runs.
when_to_use: >-
  When working with Liongard inspectors, launchpoints, inspection scheduling, or triggering
  inspections on demand. Use when: liongard inspection, liongard inspector, launchpoint,
  inspection schedule, run inspection, liongard launchpoint, trigger inspection, inspection
  template, or liongard cron.
---

# Liongard Inspections & Launchpoints

## Overview

Inspections are the core mechanism by which Liongard captures IT documentation. The inspection system consists of three key components:

- **Inspectors** - Templates defining what to inspect (e.g., Active Directory, Office 365, Meraki)
- **Launchpoints** - Configured instances tying an inspector to an environment, agent, credentials, and schedule
- **Inspections** - Individual execution runs that produce system data and potentially trigger detections

The relationship flows: **Inspector** (template) -> **Launchpoint** (configuration) -> **Inspection** (execution) -> **System** (discovered data)

## Inspectors

### What Are Inspectors?

Inspectors are pre-built templates provided by Liongard that define what technology platform to inspect and what data to collect. Liongard provides hundreds of built-in inspectors covering:

| Category | Examples |
|----------|---------|
| **Identity & Access** | Active Directory, Azure AD, Duo Security, Okta |
| **Email & Collaboration** | Microsoft 365, Google Workspace, Exchange |
| **Networking** | Cisco Meraki, Fortinet, SonicWall, Ubiquiti |
| **Virtualization** | VMware vSphere, Hyper-V, Nutanix |
| **Backup & DR** | Datto, Veeam, Acronis, StorageCraft |
| **Security** | SentinelOne, Sophos, Bitdefender, Huntress |
| **Cloud** | AWS, Azure, GCP |
| **Infrastructure** | Windows Server, Linux, DNS, DHCP, Certificates |

### List Inspectors

```http
GET /api/v1/inspectors?page=1&pageSize=100
X-ROAR-API-KEY: {api_key}
```

**Response:**
```json
{
  "Data": [
    {
      "ID": 100,
      "Name": "Active Directory",
      "Description": "Inspects Active Directory domain controllers, users, groups, GPOs",
      "Category": "Identity & Access",
      "Version": "3.2.1",
      "RequiresAgent": true,
      "CredentialType": "Domain Admin"
    },
    {
      "ID": 101,
      "Name": "Microsoft 365",
      "Description": "Inspects M365 tenant configuration, users, licenses, security",
      "Category": "Email & Collaboration",
      "Version": "4.1.0",
      "RequiresAgent": false,
      "CredentialType": "App Registration"
    }
  ],
  "TotalRows": 250,
  "HasMoreRows": true,
  "CurrentPage": 1,
  "TotalPages": 3,
  "PageSize": 100
}
```

### Get Inspector by ID

```http
GET /api/v1/inspectors/{inspectorId}
X-ROAR-API-KEY: {api_key}
```

**Response:**
```json
{
  "ID": 100,
  "Name": "Active Directory",
  "Description": "Inspects Active Directory domain controllers, users, groups, GPOs",
  "Category": "Identity & Access",
  "Version": "3.2.1",
  "RequiresAgent": true,
  "CredentialType": "Domain Admin",
  "DataPoints": [
    "Users",
    "Groups",
    "Group Policy Objects",
    "Domain Controllers",
    "Organizational Units",
    "DNS Zones",
    "DHCP Scopes",
    "Certificate Authorities"
  ]
}
```

### Inspector Fields

| Field | Type | Description |
|-------|------|-------------|
| `ID` | int | Unique inspector identifier |
| `Name` | string | Inspector display name |
| `Description` | string | What the inspector checks |
| `Category` | string | Technology category |
| `Version` | string | Inspector version |
| `RequiresAgent` | boolean | Whether a local agent is needed |
| `CredentialType` | string | Type of credentials required |
| `DataPoints` | array | List of data points collected |

## Launchpoints

### What Are Launchpoints?

Launchpoints are the configured instances that bring together all components needed to run an inspection:

| Component | Purpose |
|-----------|---------|
| **Inspector** | Which template to use |
| **Environment** | Which customer this is for |
| **Agent** | Which agent runs the inspection |
| **Credentials** | How to authenticate to the target |
| **Schedule** | When to run inspections |
| **Configuration** | Inspector-specific settings |

### Launchpoint Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `ID` | int | System | Unique launchpoint identifier |
| `InspectorID` | int | Yes | Associated inspector template |
| `EnvironmentID` | int | Yes | Target environment |
| `AgentID` | int | Conditional | Agent to use (if inspector requires) |
| `Name` | string | Yes | Launchpoint display name |
| `Status` | string | No | Active, Inactive, Error |
| `Schedule` | string | No | Cron expression for scheduling |
| `LastInspection` | datetime | System | Last successful inspection |
| `NextInspection` | datetime | System | Next scheduled inspection |
| `CreatedOn` | datetime | System | Creation timestamp |
| `UpdatedOn` | datetime | System | Last update timestamp |

### List Launchpoints

```http
GET /api/v1/launchpoints?page=1&pageSize=100
X-ROAR-API-KEY: {api_key}
```

**Response:**
```json
{
  "Data": [
    {
      "ID": 5001,
      "InspectorID": 100,
      "EnvironmentID": 1234,
      "AgentID": 501,
      "Name": "Acme Corp - Active Directory",
      "Status": "Active",
      "Schedule": "0 2 * * *",
      "LastInspection": "2024-02-15T02:00:00Z",
      "NextInspection": "2024-02-16T02:00:00Z",
      "CreatedOn": "2023-06-01T10:00:00Z",
      "UpdatedOn": "2024-02-15T02:15:00Z"
    }
  ],
  "TotalRows": 500,
  "HasMoreRows": true,
  "CurrentPage": 1,
  "TotalPages": 5,
  "PageSize": 100
}
```

### Filter Launchpoints by Environment

```http
GET /api/v1/launchpoints?environmentId={environmentId}&page=1&pageSize=100
X-ROAR-API-KEY: {api_key}
```

### Get Launchpoint by ID

```http
GET /api/v1/launchpoints/{launchpointId}
X-ROAR-API-KEY: {api_key}
```

### Create Launchpoint

```http
POST /api/v1/launchpoints
X-ROAR-API-KEY: {api_key}
Content-Type: application/json
```

```json
{
  "InspectorID": 100,
  "EnvironmentID": 1234,
  "AgentID": 501,
  "Name": "Acme Corp - Active Directory",
  "Schedule": "0 2 * * *",
  "Configuration": {
    "DomainController": "dc01.acme.local",
    "Username": "admin@acme.local",
    "Password": "encrypted-credential-reference"
  }
}
```

**Response:**
```json
{
  "ID": 5002,
  "InspectorID": 100,
  "EnvironmentID": 1234,
  "AgentID": 501,
  "Name": "Acme Corp - Active Directory",
  "Status": "Active",
  "Schedule": "0 2 * * *",
  "CreatedOn": "2024-02-15T09:00:00Z"
}
```

### Update Launchpoint

```http
PUT /api/v1/launchpoints/{launchpointId}
X-ROAR-API-KEY: {api_key}
Content-Type: application/json
```

```json
{
  "Schedule": "0 3 * * *",
  "Name": "Acme Corp - Active Directory (Updated)"
}
```

### Delete Launchpoint

```http
DELETE /api/v1/launchpoints/{launchpointId}
X-ROAR-API-KEY: {api_key}
```

**Warning:** Deleting a launchpoint removes all associated systems and historical inspection data.

## Scheduling

### Cron Expression Format

Launchpoints use standard cron expressions for scheduling:

```
┌───────── minute (0-59)
│ ┌─────── hour (0-23)
│ │ ┌───── day of month (1-31)
│ │ │ ┌─── month (1-12)
│ │ │ │ ┌─ day of week (0-6, Sun=0)
│ │ │ │ │
* * * * *
```

### Common Schedules

| Cron Expression | Description |
|-----------------|-------------|
| `0 2 * * *` | Daily at 2:00 AM |
| `0 */6 * * *` | Every 6 hours |
| `0 0 * * 0` | Weekly on Sunday at midnight |
| `0 8 1 * *` | Monthly on the 1st at 8:00 AM |
| `*/30 * * * *` | Every 30 minutes |
| `0 2 * * 1-5` | Weekdays at 2:00 AM |

### Scheduling Best Practices

1. **Stagger inspection times** - Avoid running all launchpoints at the same time
2. **Use off-peak hours** - Schedule during client off-hours (e.g., 2:00 AM)
3. **Match frequency to change rate** - Daily for AD/O365, weekly for static infrastructure
4. **Consider agent load** - Don't overload agents with concurrent inspections
5. **Account for time zones** - Schedule based on the client's local time

## Running Inspections On Demand

### Trigger Immediate Inspection

```http
POST /api/v1/launchpoints/{launchpointId}/run
X-ROAR-API-KEY: {api_key}
```

**Response:**
```json
{
  "InspectionID": 99001,
  "LaunchpointID": 5001,
  "Status": "Queued",
  "QueuedAt": "2024-02-15T14:30:00Z"
}
```

### Inspection Status Values

| Status | Description |
|--------|-------------|
| `Queued` | Inspection is waiting to be picked up by agent |
| `Running` | Inspection is currently executing |
| `Completed` | Inspection finished successfully |
| `Failed` | Inspection encountered an error |
| `Timeout` | Inspection exceeded maximum runtime |

### Batch Run Inspections

To trigger multiple inspections for an environment:

```javascript
async function runAllInspections(environmentId) {
  // Get all launchpoints for the environment
  const response = await fetch(
    `https://${instance}.app.liongard.com/api/v1/launchpoints?environmentId=${environmentId}&pageSize=500`,
    {
      headers: { 'X-ROAR-API-KEY': process.env.LIONGARD_API_KEY }
    }
  );

  const data = await response.json();
  const results = [];

  for (const lp of data.Data) {
    if (lp.Status !== 'Active') continue;

    const runResult = await fetch(
      `https://${instance}.app.liongard.com/api/v1/launchpoints/${lp.ID}/run`,
      {
        method: 'POST',
        headers: { 'X-ROAR-API-KEY': process.env.LIONGARD_API_KEY }
      }
    );

    results.push({
      launchpointId: lp.ID,
      name: lp.Name,
      success: runResult.ok
    });

    // Stagger requests
    await sleep(500);
  }

  return results;
}
```

## Common Workflows

### Setting Up New Inspections for a Client

1. **Identify platforms** - Determine what technologies the client uses
2. **Find inspectors** - Look up the matching inspector templates
3. **Verify agent** - Ensure an agent is deployed and online
4. **Gather credentials** - Collect authentication details for each target
5. **Create launchpoints** - Configure one launchpoint per inspector/target
6. **Set schedules** - Assign appropriate cron schedules
7. **Run initial inspections** - Trigger immediate runs
8. **Verify data** - Check that systems are being discovered correctly

### Troubleshooting Failed Inspections

1. **Check launchpoint status** - Is the launchpoint Active?
2. **Verify agent status** - Is the agent Online?
3. **Review credentials** - Have passwords expired or been rotated?
4. **Check network connectivity** - Can the agent reach the target?
5. **Review timeline** - Look for error messages in the timeline
6. **Check inspector version** - Is a newer version available?
7. **Re-run inspection** - Try triggering a manual run
8. **Check system logs** - Review agent logs on the deployed system

### Migrating Inspections Between Agents

1. **Deploy new agent** - Install at the new location
2. **Verify new agent** - Confirm it's online and healthy
3. **Update launchpoints** - Change AgentID to the new agent
4. **Test inspections** - Trigger manual runs on updated launchpoints
5. **Decommission old agent** - Remove once migration is verified

## Error Handling

### Common API Errors

| Code | Message | Resolution |
|------|---------|------------|
| 400 | Invalid launchpoint data | Check required fields |
| 401 | Unauthorized | Verify API key |
| 404 | Launchpoint not found | Confirm launchpoint ID |
| 404 | Inspector not found | Verify inspector ID exists |
| 409 | Duplicate launchpoint | Name must be unique per environment |
| 422 | Invalid schedule | Check cron expression syntax |
| 429 | Rate limited | Wait and retry (300 req/min) |

### Inspection Run Errors

| Error | Cause | Resolution |
|-------|-------|------------|
| Agent offline | Agent not reporting | Check agent host connectivity |
| Authentication failed | Bad credentials | Update launchpoint credentials |
| Target unreachable | Network issue | Verify firewall rules and DNS |
| Timeout | Inspection took too long | Check target system performance |
| Inspector error | Bug in inspector | Update inspector or contact support |

## Best Practices

1. **Name launchpoints clearly** - Use format: "ClientName - InspectorName"
2. **Stagger schedules** - Distribute inspections across time windows
3. **Monitor inspection health** - Regularly review failed inspections
4. **Keep credentials current** - Update when passwords change
5. **Use appropriate frequency** - Daily for dynamic, weekly for static
6. **Test before production** - Run manual inspections before scheduling
7. **Document configurations** - Note any inspector-specific settings
8. **Group by environment** - Keep related inspections organized

## Data Relationships

```
Inspector (InspectorID)
    |
    +-- Launchpoint (LaunchpointID)
            |
            +-- Environment (EnvironmentID)
            +-- Agent (AgentID)
            +-- Schedule (Cron Expression)
            +-- Configuration (Credentials, Settings)
            |
            +-- Inspections (InspectionID)
            |       +-- Status (Queued/Running/Completed/Failed)
            |       +-- Duration
            |       +-- Timestamp
            |
            +-- Systems (SystemID)
                    +-- System Details
                    +-- Dataprints
```

## Related Skills

- [Liongard Overview](../overview/SKILL.md) - Platform overview and terminology
- [Liongard Environments](../environments/SKILL.md) - Environment management
- [Liongard Systems](../systems/SKILL.md) - Systems and dataprints
- [Liongard Detections](../detections/SKILL.md) - Change detection and alerts
