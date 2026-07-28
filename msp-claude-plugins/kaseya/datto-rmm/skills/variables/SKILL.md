---
name: "Datto RMM Variables"
description: >
  Datto RMM account-level and site-level variables: scoping and
  inheritance (site overrides account), naming conventions and reserved
  prefixes, CRUD operations, and referencing variables from component
  scripts.
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

### Naming Conventions

**Recommended Format:** `SCREAMING_SNAKE_CASE` (e.g. `BACKUP_PATH`, `ADMIN_EMAIL`, `LOG_RETENTION_DAYS`).

**Reserved prefixes** - names starting with these are rejected (400 `Invalid name`):
- `CS_` - Datto internal use
- `DATTO_` - System variables

### Field Reference

A `Variable` has `id`, `name`, `value`, optional `description`, `scope`
(`account`|`site`), and `siteUid` when site-scoped. See
[references/fields.md](references/fields.md) for the full interface.

## Common Workflows

### Get Effective Variable Value

Account variables can be overridden by site variables - check site scope first, then fall back to account:

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

Bulk site-variable setup, an account+site audit report, an override
finder that scans every site for a given variable name, a template
applier for standardized onboarding, and a create-or-update "safe set"
helper are in [references/examples.md](references/examples.md).

## API Patterns

- `GET /api/v2/account/variables` - list account-scoped variables
- `GET /api/v2/site/{siteUid}/variables` - list site-scoped variables
- `POST /api/v2/account/variables` / `POST /api/v2/site/{siteUid}/variables` - create
- `PUT /api/v2/account/variable/{variableId}` / `PUT /api/v2/site/{siteUid}/variable/{variableId}` - update
- `DELETE .../variable/{variableId}` - delete (account or site path)

See [references/api.md](references/api.md) for full request/response examples.

## Gotchas

- **Creating a duplicate name fails with 400** - there's no upsert endpoint; check for an existing variable and use `PUT` to update instead of retrying `POST`.
- **Update uses `PUT`, not `POST`** - unlike variable creation, which is `POST`.
- **Reserved prefixes (`CS_`, `DATTO_`) are rejected outright** - validate names client-side before submitting to avoid a wasted round trip.
- **Site variables silently shadow account variables of the same name** - there's no warning when a site override exists; always resolve effective value via site-then-account lookup, never assume account value applies.
- **Avoid storing credentials directly** - variables are plain strings with no secret handling; use a secure alternative for sensitive values.

See [references/errors.md](references/errors.md) for the full variable API error table.

## Common Variable Categories

| Category | Examples | Purpose |
|----------|----------|---------|
| Backup | `BACKUP_PATH`, `BACKUP_RETENTION_DAYS` | Backup configuration |
| Logging | `LOG_PATH`, `LOG_LEVEL` | Log settings |
| Alerting | `ALERT_EMAIL`, `ALERT_THRESHOLD` | Alert configuration |
| Security | `AV_SCAN_SCHEDULE`, `FIREWALL_ENABLED` | Security settings |
| Client | `CLIENT_CODE`, `CLIENT_CONTACT` | Client identification |

## Using Variables in Components

Variables are referenced in component scripts as environment variables:

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
