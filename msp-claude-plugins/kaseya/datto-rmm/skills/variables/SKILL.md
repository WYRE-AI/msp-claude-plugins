---
name: "Datto RMM Variables"
description: >
  Use this skill when working with Datto RMM variables - account-level and
  site-level variables for storing configuration data. Covers variable
  CRUD operations, using variables in jobs/scripts, naming conventions,
  and variable management patterns.
when_to_use: >-
  When working with account-level and site-level variables for storing configuration data in Datto
  RMM variables. Use when: datto variable, rmm variable, account variable, site variable, script
  variable, component variable, or configuration variable.
---

# Datto RMM Variables

## Overview

Variables in Datto RMM store key-value configuration data at account or site level. They're used to customize component scripts, store configuration values, and maintain environment-specific settings. This skill covers variable management, scoping, and usage patterns.

## Key Concepts

### Variable Scopes

| Scope | Description | Use Case |
|-------|-------------|----------|
| **Account** | Available to all sites | Global configuration |
| **Site** | Available to specific site | Client-specific settings |

### Variable Inheritance

```
Account Variables (Global)
        │
        ▼ (inherited by)
   Site Variables
        │
        ▼ (used in)
   Jobs/Components
```

Site variables can override account variables with the same name.

### Variable Types

All variables are stored as strings but can represent:
- Configuration paths
- Credentials (use secure alternatives when possible)
- Feature flags
- Threshold values
- Client-specific data

## Field Reference

### Variable Object

```typescript
interface Variable {
  id: number;                   // Variable ID
  name: string;                 // Variable name
  value: string;                // Variable value
  description?: string;         // Optional description
  scope: VariableScope;         // "account" or "site"
  siteUid?: string;             // Site UID (for site variables)
  createdAt: number;            // Creation timestamp
  modifiedAt: number;           // Last modification
}

type VariableScope = 'account' | 'site';
```

### Naming Conventions

**Recommended Format:** `SCREAMING_SNAKE_CASE`

Examples:
- `BACKUP_PATH`
- `ADMIN_EMAIL`
- `LOG_RETENTION_DAYS`
- `ANTIVIRUS_SCAN_SCHEDULE`

**Reserved Prefixes:**
- `CS_` - Datto internal use
- `DATTO_` - System variables

## API Patterns

### List Account Variables

```http
GET /api/v2/account/variables
Authorization: Bearer {token}
```

**Response:**
```json
{
  "variables": [
    {
      "id": 1,
      "name": "BACKUP_PATH",
      "value": "D:\\Backups",
      "description": "Default backup destination",
      "scope": "account",
      "createdAt": 1680000000000,
      "modifiedAt": 1707991200000
    },
    {
      "id": 2,
      "name": "ADMIN_EMAIL",
      "value": "alerts@msp.com",
      "scope": "account"
    }
  ]
}
```

### List Site Variables

```http
GET /api/v2/site/{siteUid}/variables
Authorization: Bearer {token}
```

**Response:**
```json
{
  "variables": [
    {
      "id": 101,
      "name": "BACKUP_PATH",
      "value": "E:\\ClientBackups",
      "description": "Client-specific backup path",
      "scope": "site",
      "siteUid": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
    },
    {
      "id": 102,
      "name": "CLIENT_CODE",
      "value": "ACME",
      "scope": "site",
      "siteUid": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
    }
  ]
}
```

### Create Account Variable

```http
POST /api/v2/account/variables
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "NEW_VARIABLE",
  "value": "variable_value",
  "description": "Description of the variable"
}
```

### Create Site Variable

```http
POST /api/v2/site/{siteUid}/variables
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "SITE_SPECIFIC_VAR",
  "value": "site_value",
  "description": "Site-specific configuration"
}
```

### Update Variable

```http
PUT /api/v2/account/variable/{variableId}
Authorization: Bearer {token}
Content-Type: application/json

{
  "value": "updated_value",
  "description": "Updated description"
}
```

For site variables:
```http
PUT /api/v2/site/{siteUid}/variable/{variableId}
```

### Delete Variable

```http
DELETE /api/v2/account/variable/{variableId}
Authorization: Bearer {token}
```

For site variables:
```http
DELETE /api/v2/site/{siteUid}/variable/{variableId}
```

## Workflows

### Get Effective Variable Value

Account variables can be overridden by site variables:

```javascript
async function getEffectiveVariable(client, siteUid, variableName) {
  // Try site variable first
  const siteVars = await client.request(`/api/v2/site/${siteUid}/variables`);
  const siteVar = siteVars.variables?.find(v => v.name === variableName);

  if (siteVar) {
    return {
      name: variableName,
      value: siteVar.value,
      scope: 'site',
      source: `Site: ${siteUid}`
    };
  }

  // Fall back to account variable
  const accountVars = await client.request('/api/v2/account/variables');
  const accountVar = accountVars.variables?.find(v => v.name === variableName);

  if (accountVar) {
    return {
      name: variableName,
      value: accountVar.value,
      scope: 'account',
      source: 'Account'
    };
  }

  return {
    name: variableName,
    value: null,
    error: 'Variable not found'
  };
}
```

### Bulk Variable Setup

```javascript
async function setupSiteVariables(client, siteUid, variables) {
  const results = [];

  for (const [name, value] of Object.entries(variables)) {
    try {
      await client.request(`/api/v2/site/${siteUid}/variables`, {
        method: 'POST',
        body: JSON.stringify({
          name,
          value,
          description: `Auto-created: ${new Date().toISOString()}`
        })
      });
      results.push({ name, success: true });
    } catch (error) {
      results.push({ name, success: false, error: error.message });
    }

    await sleep(100);
  }

  return results;
}
```

### Variable Audit Report

```javascript
async function auditVariables(client, siteUids) {
  const report = {
    account: [],
    sites: {}
  };

  // Get account variables
  const accountVars = await client.request('/api/v2/account/variables');
  report.account = accountVars.variables || [];

  // Get site variables
  for (const siteUid of siteUids) {
    try {
      const siteVars = await client.request(`/api/v2/site/${siteUid}/variables`);
      report.sites[siteUid] = siteVars.variables || [];
    } catch (error) {
      report.sites[siteUid] = { error: error.message };
    }

    await sleep(100);
  }

  return report;
}
```

### Find Variable Usage

```javascript
async function findVariableOverrides(client, variableName) {
  const accountVars = await client.request('/api/v2/account/variables');
  const accountVar = accountVars.variables?.find(v => v.name === variableName);

  const sitesResponse = await client.request('/api/v2/sites?max=250');
  const sites = sitesResponse.sites || [];

  const overrides = [];

  for (const site of sites) {
    try {
      const siteVars = await client.request(`/api/v2/site/${site.uid}/variables`);
      const siteVar = siteVars.variables?.find(v => v.name === variableName);

      if (siteVar) {
        overrides.push({
          siteName: site.name,
          siteUid: site.uid,
          value: siteVar.value,
          isOverride: accountVar ? true : false
        });
      }
    } catch (error) {
      // Skip sites with errors
    }

    await sleep(100);
  }

  return {
    variableName,
    accountValue: accountVar?.value || null,
    overrides,
    overrideCount: overrides.length
  };
}
```

### Variable Template Application

```javascript
async function applyVariableTemplate(client, siteUid, template) {
  /*
   * Template format:
   * {
   *   "BACKUP_PATH": "D:\\Backups\\{SITE_NAME}",
   *   "LOG_RETENTION_DAYS": "30",
   *   "ADMIN_EMAIL": "{inherit}"
   * }
   */

  const site = await client.request(`/api/v2/site/${siteUid}`);
  const results = [];

  for (const [name, valueTemplate] of Object.entries(template)) {
    // Skip inherited variables
    if (valueTemplate === '{inherit}') {
      results.push({ name, action: 'inherited' });
      continue;
    }

    // Replace placeholders
    const value = valueTemplate
      .replace('{SITE_NAME}', site.name)
      .replace('{SITE_UID}', siteUid);

    try {
      await client.request(`/api/v2/site/${siteUid}/variables`, {
        method: 'POST',
        body: JSON.stringify({ name, value })
      });
      results.push({ name, action: 'created', value });
    } catch (error) {
      if (error.message?.includes('already exists')) {
        // Update existing
        const existing = await findVariableByName(client, siteUid, name);
        if (existing) {
          await client.request(`/api/v2/site/${siteUid}/variable/${existing.id}`, {
            method: 'PUT',
            body: JSON.stringify({ value })
          });
          results.push({ name, action: 'updated', value });
        }
      } else {
        results.push({ name, action: 'error', error: error.message });
      }
    }

    await sleep(100);
  }

  return results;
}

async function findVariableByName(client, siteUid, name) {
  const response = await client.request(`/api/v2/site/${siteUid}/variables`);
  return response.variables?.find(v => v.name === name);
}
```

## Error Handling

### Common Variable API Errors

| Error | Status | Cause | Resolution |
|-------|--------|-------|------------|
| Variable exists | 400 | Duplicate name | Use PUT to update |
| Variable not found | 404 | Invalid ID | Verify variable exists |
| Invalid name | 400 | Reserved prefix or invalid chars | Use valid naming |
| Permission denied | 403 | API restrictions | Check permissions |

### Safe Variable Operations

```javascript
async function safeSetVariable(client, scope, siteUid, name, value) {
  // Validate name
  if (name.startsWith('CS_') || name.startsWith('DATTO_')) {
    return { success: false, error: 'Reserved prefix' };
  }

  if (!/^[A-Z][A-Z0-9_]*$/.test(name)) {
    return { success: false, error: 'Invalid name format. Use SCREAMING_SNAKE_CASE' };
  }

  const baseUrl = scope === 'site'
    ? `/api/v2/site/${siteUid}/variables`
    : '/api/v2/account/variables';

  try {
    // Try to create
    await client.request(baseUrl, {
      method: 'POST',
      body: JSON.stringify({ name, value })
    });
    return { success: true, action: 'created' };
  } catch (error) {
    if (error.status === 400) {
      // Try to update
      const existing = scope === 'site'
        ? await findVariableByName(client, siteUid, name)
        : await findAccountVariableByName(client, name);

      if (existing) {
        const updateUrl = scope === 'site'
          ? `/api/v2/site/${siteUid}/variable/${existing.id}`
          : `/api/v2/account/variable/${existing.id}`;

        await client.request(updateUrl, {
          method: 'PUT',
          body: JSON.stringify({ value })
        });
        return { success: true, action: 'updated' };
      }
    }

    return { success: false, error: error.message };
  }
}

async function findAccountVariableByName(client, name) {
  const response = await client.request('/api/v2/account/variables');
  return response.variables?.find(v => v.name === name);
}
```

## Best Practices

1. **Use SCREAMING_SNAKE_CASE** - Consistent naming for all variables
2. **Document variables** - Use description field
3. **Prefer account-level** - For truly global settings
4. **Override at site level** - For client-specific needs
5. **Avoid sensitive data** - Use secure alternatives for credentials
6. **Audit regularly** - Review variable usage
7. **Template common setups** - Standardize site onboarding
8. **Prefix by category** - e.g., `BACKUP_*`, `ALERT_*`, `LOG_*`
9. **Version control templates** - Track variable configurations
10. **Clean up unused** - Remove obsolete variables

## Common Variable Categories

| Category | Examples | Purpose |
|----------|----------|---------|
| Backup | `BACKUP_PATH`, `BACKUP_RETENTION_DAYS` | Backup configuration |
| Logging | `LOG_PATH`, `LOG_LEVEL` | Log settings |
| Alerting | `ALERT_EMAIL`, `ALERT_THRESHOLD` | Alert configuration |
| Security | `AV_SCAN_SCHEDULE`, `FIREWALL_ENABLED` | Security settings |
| Client | `CLIENT_CODE`, `CLIENT_CONTACT` | Client identification |

## Using Variables in Components

Variables are referenced in component scripts using Datto's syntax:

**PowerShell:**
```powershell
$backupPath = $env:BACKUP_PATH
$retentionDays = $env:LOG_RETENTION_DAYS

# Use the variables
Get-ChildItem -Path $backupPath -Recurse |
  Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-$retentionDays) } |
  Remove-Item
```

**Bash:**
```bash
BACKUP_PATH="${BACKUP_PATH:-/backup}"
RETENTION_DAYS="${LOG_RETENTION_DAYS:-30}"

find "$BACKUP_PATH" -type f -mtime +$RETENTION_DAYS -delete
```

## Related Skills

- [Datto RMM Sites](../sites/SKILL.md) - Site-level variable management
- [Datto RMM Jobs](../jobs/SKILL.md) - Using variables in jobs
- [Datto RMM API Patterns](../api-patterns/SKILL.md) - Authentication and pagination
