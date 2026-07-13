---
name: "Datto RMM Sites"
description: >
  Use this skill when working with Datto RMM sites - listing, managing,
  and configuring client locations. Covers site structure, site settings,
  proxy configuration, site-level variables, device assignment, and
  site-scoped operations.
when_to_use: >-
  When listing, managing, and configuring client locations. Use when: datto site, rmm site, client
  site, site management, location management, site settings, site proxy, or site devices.
---

# Datto RMM Site Management

## Overview

Sites in Datto RMM represent client organizations or locations. Each site contains devices, has its own settings, and can have site-level variables. Sites provide organizational hierarchy and enable scoped operations - alerts, jobs, and reports can all be filtered by site.

## Key Concepts

### Site Hierarchy

```
Account
└── Sites (many)
    └── Devices (many per site)
        └── Alerts, Jobs, Audit Data
```

### Site Types

Sites can represent:
- **Client companies** - External customers
- **Internal locations** - Your own offices
- **Projects** - Temporary groupings
- **Departments** - Internal divisions

### Site Identifiers

| Identifier | Type | Description |
|------------|------|-------------|
| `siteUid` | string | Globally unique identifier |
| `siteId` | integer | Legacy numeric ID |
| `name` | string | Display name |

## Field Reference

### Site Object

```typescript
interface Site {
  // Identifiers
  uid: string;                    // Unique site ID
  siteId: number;                 // Legacy numeric ID
  name: string;                   // Site display name
  description?: string;           // Site description

  // Configuration
  onDemand: boolean;              // On-demand site (no scheduled tasks)
  splapiEnabled: boolean;         // Service Provider Level API enabled
  proxySettings?: ProxySettings;  // HTTP proxy configuration

  // Counts
  devicesCount: number;           // Number of devices
  openAlertsCount: number;        // Active alerts

  // Timestamps (Unix milliseconds)
  createdAt: number;              // When site was created
  modifiedAt: number;             // Last modification

  // Settings
  settings: SiteSettings;
}

interface ProxySettings {
  enabled: boolean;
  host: string;
  port: number;
  username?: string;
  bypassList?: string[];          // Hosts to bypass proxy
}

interface SiteSettings {
  autoPatchApproval: boolean;
  patchWindow: PatchWindow;
  notificationEmail?: string;
  timezone: string;
}

interface PatchWindow {
  dayOfWeek: number;              // 0=Sunday, 6=Saturday
  startHour: number;              // 0-23
  durationHours: number;
}
```

## API Patterns

### List All Sites

```http
GET /api/v2/sites?max=250
Authorization: Bearer {token}
```

**Response:**
```json
{
  "sites": [
    {
      "uid": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "name": "Acme Corporation",
      "description": "Main office",
      "devicesCount": 45,
      "openAlertsCount": 3,
      "onDemand": false
    }
  ],
  "pageDetails": {
    "count": 1,
    "nextPageUrl": null
  }
}
```

### Get Single Site

```http
GET /api/v2/site/{siteUid}
Authorization: Bearer {token}
```

**Response:**
```json
{
  "uid": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "siteId": 12345,
  "name": "Acme Corporation",
  "description": "Main office - Downtown",
  "devicesCount": 45,
  "openAlertsCount": 3,
  "onDemand": false,
  "splapiEnabled": true,
  "createdAt": 1680000000000,
  "modifiedAt": 1707991200000,
  "proxySettings": {
    "enabled": false
  },
  "settings": {
    "autoPatchApproval": false,
    "timezone": "America/New_York"
  }
}
```

### Get Devices for Site

```http
GET /api/v2/site/{siteUid}/devices?max=250
Authorization: Bearer {token}
```

### Get Alerts for Site

```http
GET /api/v2/site/{siteUid}/alerts/open
Authorization: Bearer {token}
```

### Get Resolved Alerts for Site

```http
GET /api/v2/site/{siteUid}/alerts/resolved?max=250
Authorization: Bearer {token}
```

### Create Site

```http
POST /api/v2/sites
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "New Client Site",
  "description": "Client headquarters",
  "onDemand": false
}
```

### Update Site

```http
POST /api/v2/site/{siteUid}
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Updated Site Name",
  "description": "Updated description"
}
```

### Delete Site

```http
DELETE /api/v2/site/{siteUid}
Authorization: Bearer {token}
```

**Warning:** Deleting a site does not delete devices - they become unassigned.

## Workflows

### Site Lookup by Name

```javascript
async function findSiteByName(client, name) {
  const response = await client.request('/api/v2/sites?max=250');
  const sites = response.sites || [];

  // Exact match first
  const exact = sites.find(s =>
    s.name.toLowerCase() === name.toLowerCase()
  );
  if (exact) return { found: true, site: exact };

  // Partial match
  const matches = sites.filter(s =>
    s.name.toLowerCase().includes(name.toLowerCase())
  );

  if (matches.length === 0) {
    return { found: false, suggestions: [] };
  }

  if (matches.length === 1) {
    return { found: true, site: matches[0] };
  }

  return {
    found: false,
    ambiguous: true,
    suggestions: matches.map(s => ({
      name: s.name,
      uid: s.uid,
      deviceCount: s.devicesCount
    }))
  };
}
```

### Site Health Overview

```javascript
async function getSiteHealth(client, siteUid) {
  const [site, devices, alerts] = await Promise.all([
    client.request(`/api/v2/site/${siteUid}`),
    client.request(`/api/v2/site/${siteUid}/devices?max=250`),
    client.request(`/api/v2/site/${siteUid}/alerts/open`)
  ]);

  const deviceList = devices.devices || [];
  const alertList = alerts.alerts || [];

  // Device status breakdown
  const deviceStatus = {
    online: deviceList.filter(d => d.status === 'online').length,
    offline: deviceList.filter(d => d.status === 'offline').length,
    total: deviceList.length
  };

  // Alert priority breakdown
  const alertsByPriority = {
    Critical: alertList.filter(a => a.priority === 'Critical').length,
    High: alertList.filter(a => a.priority === 'High').length,
    Moderate: alertList.filter(a => a.priority === 'Moderate').length,
    Low: alertList.filter(a => a.priority === 'Low').length
  };

  // Calculate health score
  const healthScore = calculateSiteHealthScore(deviceStatus, alertsByPriority);

  return {
    site: {
      name: site.name,
      uid: site.uid
    },
    devices: deviceStatus,
    alerts: {
      total: alertList.length,
      byPriority: alertsByPriority
    },
    healthScore,
    status: healthScore >= 80 ? 'healthy' : healthScore >= 50 ? 'warning' : 'critical'
  };
}

function calculateSiteHealthScore(devices, alerts) {
  let score = 100;

  // Deduct for offline devices
  const offlinePercent = (devices.offline / devices.total) * 100;
  score -= offlinePercent * 0.5;

  // Deduct for alerts
  score -= alerts.Critical * 15;
  score -= alerts.High * 5;
  score -= alerts.Moderate * 2;
  score -= alerts.Low * 0.5;

  return Math.max(0, Math.round(score));
}
```

### Multi-Site Summary

```javascript
async function getAllSitesSummary(client) {
  const response = await client.request('/api/v2/sites?max=250');
  const sites = response.sites || [];

  return sites.map(site => ({
    name: site.name,
    uid: site.uid,
    devices: site.devicesCount,
    openAlerts: site.openAlertsCount,
    status: site.openAlertsCount === 0 ? 'healthy' :
            site.openAlertsCount <= 5 ? 'warning' : 'critical'
  })).sort((a, b) => b.openAlerts - a.openAlerts);
}
```

### Site Onboarding Checklist

```javascript
async function validateSiteSetup(client, siteUid) {
  const site = await client.request(`/api/v2/site/${siteUid}`);
  const devices = await client.request(`/api/v2/site/${siteUid}/devices?max=250`);
  const variables = await client.request(`/api/v2/site/${siteUid}/variables`);

  const checks = [];

  // Check site has description
  checks.push({
    item: 'Site description',
    status: site.description ? 'pass' : 'fail',
    message: site.description || 'No description set'
  });

  // Check site has devices
  checks.push({
    item: 'Devices enrolled',
    status: devices.devices?.length > 0 ? 'pass' : 'fail',
    message: `${devices.devices?.length || 0} devices`
  });

  // Check critical variables are set
  const requiredVars = ['BACKUP_PATH', 'ADMIN_EMAIL'];
  requiredVars.forEach(varName => {
    const v = variables.variables?.find(v => v.name === varName);
    checks.push({
      item: `Variable: ${varName}`,
      status: v?.value ? 'pass' : 'fail',
      message: v?.value || 'Not set'
    });
  });

  return {
    siteUid,
    siteName: site.name,
    checks,
    passed: checks.filter(c => c.status === 'pass').length,
    total: checks.length
  };
}
```

## Error Handling

### Common Site API Errors

| Error | Status | Cause | Resolution |
|-------|--------|-------|------------|
| Site not found | 404 | Invalid siteUid | Verify site exists |
| Name already exists | 400 | Duplicate site name | Use unique name |
| Cannot delete | 400 | Site has devices | Move devices first |
| Permission denied | 403 | API restrictions | Check permissions |

### Error Handling Pattern

```javascript
async function safeSiteOperation(client, operation, siteUid, data) {
  try {
    switch (operation) {
      case 'get':
        return await client.request(`/api/v2/site/${siteUid}`);

      case 'update':
        return await client.request(`/api/v2/site/${siteUid}`, {
          method: 'POST',
          body: JSON.stringify(data)
        });

      case 'delete':
        // Check for devices first
        const devices = await client.request(`/api/v2/site/${siteUid}/devices`);
        if (devices.devices?.length > 0) {
          throw new Error(`Cannot delete site with ${devices.devices.length} devices`);
        }
        return await client.request(`/api/v2/site/${siteUid}`, {
          method: 'DELETE'
        });
    }
  } catch (error) {
    if (error.status === 404) {
      return { error: 'Site not found', siteUid };
    }
    throw error;
  }
}
```

## Best Practices

1. **Use meaningful names** - Include client name and location
2. **Set descriptions** - Document site purpose and contacts
3. **Configure timezone** - Ensure accurate patch windows
4. **Review device counts** - Monitor for unexpected changes
5. **Check alert totals** - High counts may indicate issues
6. **Use site variables** - Store site-specific configuration
7. **Audit site access** - Review who can access which sites
8. **Plan site structure** - Consider future growth
9. **Document onboarding** - Checklist for new sites
10. **Regular site reviews** - Quarterly health assessments

## Site Naming Conventions

**Recommended Format:** `{ClientName} - {Location/Purpose}`

Examples:
- `Acme Corp - Main Office`
- `Acme Corp - Remote Workers`
- `TechStart Inc - Data Center`
- `Internal - IT Department`

## Related Skills

- [Datto RMM Devices](../devices/SKILL.md) - Site device management
- [Datto RMM Alerts](../alerts/SKILL.md) - Site alert views
- [Datto RMM Variables](../variables/SKILL.md) - Site variables
- [Datto RMM API Patterns](../api-patterns/SKILL.md) - Authentication and pagination
