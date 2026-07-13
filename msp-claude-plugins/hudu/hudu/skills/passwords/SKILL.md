---
name: "Hudu Passwords"
description: >
  Use this skill when working with Hudu passwords (asset passwords) -
  secure credential storage, retrieval, folders, and access patterns.
  Covers security best practices, audit logging, password retrieval,
  and proper handling of sensitive credentials. The API endpoint is
  /api/v1/asset_passwords despite the UI calling them "Passwords."
when_to_use: >-
  When working with secure credential storage, retrieval, folders, and access patterns in Hudu
  passwords (asset passwords). Use when: hudu password, hudu credential, credential lookup,
  password management, secure credentials, hudu credentials, password storage, credential
  documentation, password access, or asset password.
---

# Hudu Passwords Management

## Overview

Passwords in Hudu (called "asset passwords" in the API) provide secure credential storage scoped to companies. They allow MSP technicians to store, organize, and retrieve credentials for client infrastructure, applications, and services. Password access can be restricted at the API key level, and all access is logged in Hudu's activity logs.

**Critical API naming note:** The Hudu UI calls these "Passwords," but the API endpoint is `/api/v1/asset_passwords`. Always use `asset_passwords` in API calls.

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

Hudu logs all password access in the activity logs (`/api/v1/activity_logs`). This includes:

- Who accessed the password
- When it was accessed
- What action was performed (view, create, update, delete)

## Field Reference

### Core Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | integer | System | Auto-generated unique identifier |
| `company_id` | integer | Yes | Parent company |
| `name` | string | Yes | Password display name |
| `username` | string | No | Account username |
| `password` | string | No | The actual password value |
| `url` | string | No | Related URL/login page |
| `description` | string | No | Additional notes |
| `password_type` | string | No | Category/type label |
| `otp_secret` | string | No | TOTP/2FA secret |

### Password Folder Fields

| Field | Type | Description |
|-------|------|-------------|
| `password_folder_id` | integer | Folder location |
| `password_folder_name` | string | Folder name (read-only) |

### Metadata Fields

| Field | Type | Description |
|-------|------|-------------|
| `created_at` | datetime | Creation timestamp |
| `updated_at` | datetime | Last update timestamp |
| `slug` | string | URL-friendly identifier |
| `url` | string | Full URL in Hudu |
| `object_type` | string | Always "AssetPassword" |

## API Patterns

### List Passwords

```http
GET /api/v1/asset_passwords
x-api-key: YOUR_API_KEY
Content-Type: application/json
```

**By Company:**
```http
GET /api/v1/asset_passwords?company_id=123
```

**By Name:**
```http
GET /api/v1/asset_passwords?name=Domain Admin
```

**With Pagination:**
```http
GET /api/v1/asset_passwords?company_id=123&page=1
```

**Combined:**
```http
GET /api/v1/asset_passwords?company_id=123&name=admin
```

### Get Single Password

```http
GET /api/v1/asset_passwords/789
x-api-key: YOUR_API_KEY
```

**Response:**
```json
{
  "asset_password": {
    "id": 789,
    "company_id": 123,
    "company_name": "Acme Corporation",
    "name": "Domain Admin - ACME",
    "username": "administrator@acme.local",
    "password": "SecureP@ssw0rd123!",
    "url": "https://dc01.acme.local",
    "description": "Primary domain administrator account.\nUse for:\n- Domain controller management\n- Group Policy changes\n- AD user management",
    "password_type": "Administrative",
    "password_folder_id": 45,
    "password_folder_name": "Infrastructure",
    "otp_secret": null,
    "slug": "domain-admin-acme",
    "created_at": "2024-01-15T10:30:00.000Z",
    "updated_at": "2025-11-15T14:22:00.000Z",
    "url": "https://your-company.huducloud.com/passwords/789"
  }
}
```

**IMPORTANT: The password value is returned in the response. Never expose password values in correlation summaries, logs, or output visible to unauthorized users.**

### Create Password

```http
POST /api/v1/asset_passwords
Content-Type: application/json
x-api-key: YOUR_API_KEY
```

```json
{
  "asset_password": {
    "company_id": 123,
    "name": "Domain Admin - ACME",
    "username": "administrator@acme.local",
    "password": "SecureP@ssw0rd123!",
    "url": "https://dc01.acme.local",
    "description": "Primary domain administrator account",
    "password_type": "Administrative",
    "password_folder_id": 45
  }
}
```

### Update Password

```http
PUT /api/v1/asset_passwords/789
Content-Type: application/json
x-api-key: YOUR_API_KEY
```

```json
{
  "asset_password": {
    "password": "NewSecureP@ssw0rd456!",
    "description": "Password rotated on 2026-02-15. Previous rotation: 2025-11-15."
  }
}
```

### Delete Password

```http
DELETE /api/v1/asset_passwords/789
x-api-key: YOUR_API_KEY
```

**Warning:** Consider keeping passwords for audit purposes. Deletion requires DELETE permission on the API key.

### Search Passwords

**By Name:**
```http
GET /api/v1/asset_passwords?name=Domain Admin
```

**By Company:**
```http
GET /api/v1/asset_passwords?company_id=123
```

**Combined:**
```http
GET /api/v1/asset_passwords?company_id=123&name=firewall
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

## Security Best Practices

### Access Control

1. **Restrict API key permissions** - Only enable password access on keys that need it
2. **Use company-scoped keys** - Limit API keys to specific companies when possible
3. **IP whitelist** - Restrict API key usage to known IPs
4. **Regular access reviews** - Audit who has API keys with password access

### Password Hygiene

1. **Regular rotation** - Rotate passwords on schedule (90 days recommended)
2. **Strong passwords** - Enforce complexity requirements
3. **Unique passwords** - Never reuse passwords across systems
4. **Track changes** - Update description when passwords are rotated
5. **Monitor stale passwords** - Alert on passwords not updated recently

### Output Safety

**CRITICAL: Never include actual password values in:**
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

### Audit Logging

Monitor password access using Hudu's activity logs:

```http
GET /api/v1/activity_logs?resource_type=AssetPassword&resource_id=789
```

## Error Handling

### Common API Errors

| Code | Message | Resolution |
|------|---------|------------|
| 400 | Name can't be blank | Provide password name |
| 400 | Company is required | Include company_id |
| 401 | Invalid API key | Check HUDU_API_KEY |
| 403 | Password access denied | API key lacks password permission |
| 404 | Password not found | Verify password ID |
| 422 | Validation failed | Check required fields |

### Validation Errors

| Error | Cause | Fix |
|-------|-------|-----|
| Name required | Missing name | Add name to request |
| Company required | No company_id | Include company_id |
| Access denied | API key lacks permission | Enable password access on API key |
| Invalid folder | Bad folder_id | Query password folders first |

### Secure Error Handling

```javascript
async function safeGetPassword(passwordId) {
  try {
    return await getAssetPassword(passwordId);
  } catch (error) {
    if (error.status === 403) {
      console.log('Password access denied. API key may lack password permission.');
      return null;
    }

    if (error.status === 404) {
      console.log('Password not found.');
      return null;
    }

    throw error;
  }
}
```

## Best Practices

1. **Use descriptive names** - Include system name and account type (e.g., "Domain Admin - ACME")
2. **Set password type** - Classify passwords (Administrative, Network, Application, etc.)
3. **Organize with folders** - Create a logical folder hierarchy per company
4. **Document purpose** - Use the description field to explain what the password is for
5. **Track URLs** - Always include the login URL when applicable
6. **Regular rotation** - Establish password rotation schedules
7. **Monitor access** - Review activity logs for password access
8. **Avoid deletion** - Archive or keep passwords for audit trails
9. **Include 2FA** - Store TOTP secrets with the otp_secret field
10. **Never expose values** - Never include password values in summaries or logs

## Related Skills

- [Hudu Companies](../companies/SKILL.md) - Password company scope
- [Hudu Assets](../assets/SKILL.md) - Device-related credentials
- [Hudu Articles](../articles/SKILL.md) - Embedding passwords in articles
- [Hudu Websites](../websites/SKILL.md) - Website credentials
- [Hudu API Patterns](../api-patterns/SKILL.md) - API reference
