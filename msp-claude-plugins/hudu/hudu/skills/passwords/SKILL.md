---
name: "Hudu Passwords"
description: >
  Hudu secure credential storage: the /api/v1/asset_passwords endpoint
  (the UI calls these "Passwords"), company scoping and password
  folders, TOTP secrets, per-API-key password permissions, activity-log
  auditing, rotation workflows, and output-safety rules for handling
  plaintext credential values.
when_to_use: >-
  When storing, retrieving, rotating, or auditing credentials in Hudu, or when a request
  returns 403 on a password endpoint. Use when: hudu password, hudu credential, credential
  lookup, password management, secure credentials, hudu credentials, password storage,
  credential documentation, password access, or asset password.
---

# Hudu Passwords Management

## Overview

Passwords in Hudu (called "asset passwords" in the API) provide secure credential storage scoped to companies. They allow MSP technicians to store, organize, and retrieve credentials for client infrastructure, applications, and services. Password access can be restricted at the API key level, and all access is logged in Hudu's activity logs.

**Critical API naming note:** The Hudu UI calls these "Passwords," but the API endpoint is `/api/v1/asset_passwords`. Always use `asset_passwords` in API calls.

## Anti-triggers

- **A credential needed to authenticate a tool call** — Hudu passwords
  document *the customer's* credentials. They are never the connector's
  own auth: gateway credentials are brokered centrally and are not
  readable from anywhere in this plugin. An agent that reaches here to
  "find the API key" has taken a wrong turn.
- **A credential stored on an asset rather than as a password record** —
  many MSPs put licence keys and service accounts in asset custom fields.
  Those are not `asset_passwords`; use `hudu-assets`.
- **The same credential in IT Glue** — the other documentation platform in
  this marketplace stores passwords too, with its own permission model.
  Start from `itglue-api-patterns`.
- **Resetting or rotating the credential on the actual system** — this
  skill updates the documented value only. Changing the real password is a
  tenant or directory operation; use `cipp-users` or `m365-users`. Editing
  the record without changing the system leaves documentation that is
  confidently wrong.

## Key Concepts

### Password Organization

Passwords are organized by:

- **Company** - Each password belongs to a specific company
- **Password Folders** - Hierarchical folder structure within a company
- **Name** - Descriptive name identifying the credential

```
Company: Acme Corporation
+-- Passwords
    +-- Infrastructure
    |   +-- Domain Admin - ACME
    |   +-- Local Admin - Servers
    |   +-- vCenter Admin
    +-- Network
    |   +-- Firewall Admin
    |   +-- Switch Admin
    |   +-- WiFi Controller
    +-- Applications
    |   +-- ERP Admin
    |   +-- CRM Admin
    +-- Cloud Services
        +-- Microsoft 365 Global Admin
        +-- AWS Root Account
```

### API Key Password Permission

API keys in Hudu can be configured to allow or deny password access:

| Permission | Effect |
|------------|--------|
| Enabled | API key can read/write password values |
| Disabled | API key cannot access password values (403 Forbidden) |

This is configured per API key in Admin > API Keys.

### Security Audit Trail

Hudu logs all password access in the activity logs (`/api/v1/activity_logs`) — who accessed it, when, and what action (view, create, update, delete):

```http
GET /api/v1/activity_logs?resource_type=AssetPassword&resource_id=789
```

### Fields

Core fields: `company_id` (required), `name` (required), `username`, `password`, `url`, `description`, `password_type`, `otp_secret`, `password_folder_id`.

See [references/fields.md](references/fields.md) for the complete field reference.

## API Patterns

| Operation | Request |
|-----------|---------|
| List / filter | `GET /api/v1/asset_passwords?company_id=123&name=Domain Admin&page=1` |
| Get one | `GET /api/v1/asset_passwords/789` |
| Create | `POST /api/v1/asset_passwords` with `{ "asset_password": { ... } }` |
| Update | `PUT /api/v1/asset_passwords/789` |
| Delete | `DELETE /api/v1/asset_passwords/789` (requires DELETE permission) |

`GET` on a single password returns the **plaintext `password` value** in the response body. Treat every response from this endpoint as sensitive.

See [references/api.md](references/api.md) for the complete endpoint catalog with request/response examples.

## Output Safety

**Never include actual password values in:**
- Correlation summaries or reports
- Log files
- Chat output or conversation history
- Error messages
- Any output that may be visible to unauthorized users

When displaying password information, always mask the actual value:

```
Password: Domain Admin - ACME
Username: administrator@acme.local
Password: **************
URL:      https://dc01.acme.local
```

## Common Workflows

### Secure Password Creation

```javascript
async function createSecurePassword(companyId, data) {
  const password = await createAssetPassword({
    company_id: companyId,
    name: data.name,
    username: data.username,
    password: data.password,
    url: data.url,
    description: `Created: ${new Date().toLocaleDateString()}\nPurpose: ${data.purpose}`,
    password_type: data.type,
    password_folder_id: data.folderId
  });

  return password;
}
```

### Password Rotation Workflow

Hudu keeps no rotation history of its own — append rotation dates to `description` so the audit trail survives.

```javascript
async function rotatePassword(passwordId, newPassword, reason) {
  // Get current password info (for logging, not the value)
  const current = await getAssetPassword(passwordId);

  // Update with new password
  const updated = await updateAssetPassword(passwordId, {
    password: newPassword,
    description: `${current.description || ''}\nRotated: ${new Date().toLocaleDateString()} - ${reason}`
  });

  return updated;
}
```

### Password Search by Context

The API filters only on `name` and `company_id`; matching against description or URL requires a client-side pass.

```javascript
async function findPasswordsForServer(companyId, serverName) {
  const passwords = await fetchAssetPasswords({ company_id: companyId });

  return passwords.filter(p =>
    p.name.toLowerCase().includes(serverName.toLowerCase()) ||
    p.description?.toLowerCase().includes(serverName.toLowerCase()) ||
    p.url?.toLowerCase().includes(serverName.toLowerCase())
  );
}
```

### Find Stale Passwords

```javascript
async function findStalePasswords(companyId, daysOld = 90) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  const passwords = await fetchAssetPasswords({ company_id: companyId });

  return passwords
    .filter(p => new Date(p.updated_at) < cutoffDate)
    .map(p => ({
      id: p.id,
      name: p.name,
      username: p.username,
      lastUpdated: p.updated_at,
      daysSinceUpdate: Math.floor(
        (new Date() - new Date(p.updated_at)) / (1000 * 60 * 60 * 24)
      )
    }));
}
```

### Password Inventory Report

```javascript
async function generatePasswordReport(companyId) {
  const passwords = await fetchAssetPasswords({ company_id: companyId });

  const byType = {};
  passwords.forEach(p => {
    const type = p.password_type || 'Uncategorized';
    if (!byType[type]) byType[type] = [];
    byType[type].push({
      name: p.name,
      username: p.username,
      url: p.url,
      lastUpdated: p.updated_at
      // NEVER include actual password values in reports
    });
  });

  return byType;
}
```

## Gotchas

- **Endpoint is `asset_passwords`, not `passwords`.** The UI name and the API name differ; `/api/v1/passwords` does not exist.
- **403 on this endpoint is a key-permission problem, not a bad key.** Password access is a per-API-key toggle in Admin > API Keys — a key that works everywhere else can still 403 here.
- **`url` appears twice in responses** with different meanings: the credential's login URL on create/update, and the Hudu record URL in the read payload's metadata. Do not round-trip it blindly.
- **Every read is logged.** Bulk enumeration of passwords generates a visible audit trail; scope by `company_id` rather than sweeping the tenant.
- **Deletion is unrecoverable and drops the audit context.** Prefer keeping stale credentials with a rotation note.

See [references/errors.md](references/errors.md) for the complete error and validation table plus a secure error-handling pattern.

## Security Best Practices

### Access Control

1. **Restrict API key permissions** - Only enable password access on keys that need it
2. **Use company-scoped keys** - Limit API keys to specific companies when possible
3. **IP whitelist** - Restrict API key usage to known IPs
4. **Regular access reviews** - Audit who has API keys with password access

### Password Hygiene

1. **Regular rotation** - Rotate passwords on schedule (90 days recommended)
2. **Unique passwords** - Never reuse passwords across systems
3. **Track changes** - Update description when passwords are rotated
4. **Monitor stale passwords** - Alert on passwords not updated recently

### Documentation Hygiene

1. **Use descriptive names** - Include system name and account type (e.g., "Domain Admin - ACME")
2. **Set password type** - Classify passwords (Administrative, Network, Application, etc.)
3. **Organize with folders** - Create a logical folder hierarchy per company
4. **Document purpose** - Use the description field to explain what the password is for
5. **Track URLs** - Always include the login URL when applicable
6. **Include 2FA** - Store TOTP secrets with the `otp_secret` field

## Related Skills

- [Hudu Companies](../companies/SKILL.md) - Password company scope
- [Hudu Assets](../assets/SKILL.md) - Device-related credentials
- [Hudu Articles](../articles/SKILL.md) - Embedding passwords in articles
- [Hudu Websites](../websites/SKILL.md) - Website credentials
- [Hudu API Patterns](../api-patterns/SKILL.md) - API reference
