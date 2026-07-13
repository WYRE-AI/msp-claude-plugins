---
name: "IT Glue Passwords"
description: >
  Use this skill when working with IT Glue passwords - secure credential storage,
  password categories, folders, embedded passwords, and access patterns. Covers
  security best practices, audit logging, password retrieval, and proper handling
  of sensitive credentials in documentation.
when_to_use: >-
  When working with secure credential storage, password categories, folders, embedded passwords,
  and access patterns in IT Glue passwords. Use when: it glue password, credential lookup,
  password management, secure credentials, it glue credentials, password storage, credential
  documentation, or password access.
---

# IT Glue Passwords Management

## Overview

Passwords in IT Glue provide secure credential storage with organization-level access control. This skill covers password creation, categorization, folder organization, and security best practices for managing sensitive credentials within MSP documentation.

## Key Concepts

### Password Categories

Passwords are organized by category for classification:

| Category | Description | Examples |
|----------|-------------|----------|
| Administrative | Admin/root credentials | Domain Admin, Local Admin |
| Application | Software credentials | Database logins, API keys |
| Network | Network device access | Firewall, switch, router |
| Service Account | Automated process accounts | Backup, monitoring |
| User | End-user credentials | Email, VPN |
| Vendor | Third-party access | Vendor portals, support |
| Cloud | Cloud service credentials | AWS, Azure, Microsoft 365 |

### Password Folders

Folders provide hierarchical organization within an organization:

```
Organization: Acme Corporation
└── Passwords
    ├── Infrastructure
    │   ├── Domain Controllers
    │   ├── File Servers
    │   └── Network Devices
    ├── Applications
    │   ├── ERP System
    │   └── CRM
    └── Cloud Services
        ├── Microsoft 365
        └── AWS
```

### Embedded Passwords

Passwords can be embedded directly within documents and flexible assets, providing contextual credential access alongside documentation.

## Field Reference

### Core Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | integer | System | Auto-generated unique identifier |
| `organization-id` | integer | Yes | Parent organization |
| `name` | string | Yes | Password display name |
| `username` | string | No | Account username |
| `password` | string | No | The actual password (encrypted) |
| `url` | string | No | Related URL/login page |
| `password-category-id` | integer | No | Category classification |
| `password-folder-id` | integer | No | Folder location |

### Documentation Fields

| Field | Type | Description |
|-------|------|-------------|
| `notes` | string | Additional notes (HTML) |
| `otp-secret` | string | TOTP/2FA secret |

### Relationship Fields

| Field | Type | Description |
|-------|------|-------------|
| `resource-id` | integer | Related resource ID |
| `resource-type` | string | Related resource type |

### Access Control Fields

| Field | Type | Description |
|-------|------|-------------|
| `restricted` | boolean | Restricted access flag |
| `autofill-selectors` | string | Browser autofill selectors |

### Metadata Fields

| Field | Type | Description |
|-------|------|-------------|
| `created-at` | datetime | Creation timestamp |
| `updated-at` | datetime | Last update timestamp |
| `password-updated-at` | datetime | Password last changed |

## API Patterns

### List Passwords

```http
GET /passwords
x-api-key: YOUR_API_KEY
Content-Type: application/vnd.api+json
```

**By Organization:**
```http
GET /organizations/123/relationships/passwords
```

**With Filters:**
```http
GET /passwords?filter[organization-id]=123&filter[password-category-id]=456
```

### Get Single Password

```http
GET /passwords/789
x-api-key: YOUR_API_KEY
```

**With Includes:**
```http
GET /passwords/789?include=organization,password-category,password-folder
```

**Note:** The password field is returned only when explicitly retrieving a single password.

### Show Password Value

To retrieve the actual password value, you must request with the `show_password` parameter:

```http
GET /passwords/789?show_password=true
x-api-key: YOUR_API_KEY
```

**Security Note:** This action is logged in the IT Glue audit trail.

### Create Password

```http
POST /passwords
Content-Type: application/vnd.api+json
x-api-key: YOUR_API_KEY
```

```json
{
  "data": {
    "type": "passwords",
    "attributes": {
      "organization-id": 123456,
      "name": "Domain Admin - ACME",
      "username": "administrator@acme.local",
      "password": "SecureP@ssw0rd!",
      "url": "https://dc01.acme.local",
      "password-category-id": 12,
      "notes": "<p>Primary domain administrator account</p>"
    }
  }
}
```

### Update Password

```http
PATCH /passwords/789
Content-Type: application/vnd.api+json
x-api-key: YOUR_API_KEY
```

```json
{
  "data": {
    "type": "passwords",
    "attributes": {
      "password": "NewSecureP@ssw0rd!",
      "notes": "<p>Password updated on 2024-02-15</p>"
    }
  }
}
```

### Delete Password

```http
DELETE /passwords/789
x-api-key: YOUR_API_KEY
```

**Warning:** Consider archiving instead of deleting for audit purposes.

### Search Passwords

**By Name:**
```http
GET /passwords?filter[name]=Domain Admin
```

**By Category:**
```http
GET /passwords?filter[password-category-id]=12
```

**By Folder:**
```http
GET /passwords?filter[password-folder-id]=34
```

## Password Folders

### List Folders

```http
GET /password-folders
x-api-key: YOUR_API_KEY
```

**By Organization:**
```http
GET /organizations/123/relationships/password-folders
```

### Create Folder

```http
POST /password-folders
Content-Type: application/vnd.api+json
```

```json
{
  "data": {
    "type": "password-folders",
    "attributes": {
      "organization-id": 123456,
      "name": "Infrastructure",
      "parent-id": null
    }
  }
}
```

### Nested Folders

```json
{
  "data": {
    "type": "password-folders",
    "attributes": {
      "organization-id": 123456,
      "name": "Domain Controllers",
      "parent-id": 789
    }
  }
}
```

## Embedded Passwords

### In Documents

Passwords can be embedded in documents using IT Glue's embedded password syntax:

```html
<p>Login credentials:</p>
<div data-embedded-password-id="12345"></div>
```

### In Flexible Assets

Flexible asset types can include password fields that reference or store passwords directly.

## Common Workflows

### Secure Password Creation

```javascript
async function createSecurePassword(orgId, data) {
  // Create or get appropriate folder
  const folder = await ensureFolder(orgId, data.folderPath);

  // Create password with category
  const password = await createPassword({
    'organization-id': orgId,
    name: data.name,
    username: data.username,
    password: data.password,
    url: data.url,
    'password-category-id': data.categoryId,
    'password-folder-id': folder?.id,
    notes: `<p>Created: ${new Date().toLocaleDateString()}</p>
            <p>Purpose: ${data.purpose}</p>`
  });

  // Log the creation (your audit system)
  await logPasswordAction({
    action: 'created',
    passwordId: password.id,
    passwordName: data.name,
    organizationId: orgId,
    timestamp: new Date()
  });

  return password;
}
```

### Password Rotation Workflow

```javascript
async function rotatePassword(passwordId, newPassword, reason) {
  // Get current password info
  const current = await getPassword(passwordId);

  // Update with new password
  const updated = await updatePassword(passwordId, {
    password: newPassword,
    notes: `${current.attributes.notes || ''}
            <p><strong>Rotated:</strong> ${new Date().toLocaleDateString()}</p>
            <p><strong>Reason:</strong> ${reason}</p>`
  });

  // Log rotation
  await logPasswordAction({
    action: 'rotated',
    passwordId: passwordId,
    passwordName: current.attributes.name,
    reason: reason,
    timestamp: new Date()
  });

  return updated;
}
```

### Password Search by Context

```javascript
async function findPasswordForServer(orgId, serverName) {
  // Search for passwords mentioning this server
  const passwords = await fetchPasswords({
    filter: { 'organization-id': orgId }
  });

  // Filter by server name in name or notes
  return passwords.filter(p =>
    p.attributes.name.toLowerCase().includes(serverName.toLowerCase()) ||
    p.attributes.notes?.toLowerCase().includes(serverName.toLowerCase())
  );
}
```

### Password Category Report

```javascript
async function generatePasswordReport(orgId) {
  const passwords = await fetchPasswords({
    filter: { 'organization-id': orgId },
    include: 'password-category,password-folder'
  });

  const byCategory = {};
  passwords.forEach(p => {
    const category = p.relationships['password-category']?.data?.id || 'Uncategorized';
    if (!byCategory[category]) byCategory[category] = [];
    byCategory[category].push({
      name: p.attributes.name,
      username: p.attributes.username,
      url: p.attributes.url,
      lastUpdated: p.attributes['password-updated-at']
    });
  });

  return byCategory;
}
```

### Find Stale Passwords

```javascript
async function findStalePasswords(orgId, daysOld = 90) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  const passwords = await fetchPasswords({
    filter: { 'organization-id': orgId }
  });

  return passwords
    .filter(p => {
      const updated = p.attributes['password-updated-at'];
      return !updated || new Date(updated) < cutoffDate;
    })
    .map(p => ({
      id: p.id,
      name: p.attributes.name,
      lastUpdated: p.attributes['password-updated-at'] || 'Never',
      daysSinceUpdate: p.attributes['password-updated-at']
        ? Math.floor((new Date() - new Date(p.attributes['password-updated-at'])) / (1000 * 60 * 60 * 24))
        : 'Unknown'
    }));
}
```

## Security Best Practices

### Access Control

1. **Principle of least privilege** - Only grant password access to those who need it
2. **Regular access reviews** - Periodically audit who has access to passwords
3. **Use restricted flag** - Mark sensitive passwords as restricted
4. **Folder permissions** - Organize passwords into folders with appropriate access

### Password Hygiene

1. **Regular rotation** - Rotate passwords on schedule (90 days recommended)
2. **Strong passwords** - Enforce complexity requirements
3. **Unique passwords** - Never reuse passwords across systems
4. **Track changes** - Document when and why passwords change
5. **Monitor stale passwords** - Alert on passwords not updated recently

### Audit Logging

IT Glue logs all password access. Additionally:

```javascript
// Your own audit logging
async function logPasswordAccess(passwordId, action, user) {
  await auditLog.create({
    resource: 'password',
    resourceId: passwordId,
    action: action, // 'viewed', 'copied', 'updated', 'created', 'deleted'
    user: user,
    timestamp: new Date(),
    ipAddress: getCurrentIp()
  });
}
```

## Error Handling

### Common API Errors

| Code | Message | Resolution |
|------|---------|------------|
| 400 | Name can't be blank | Provide password name |
| 400 | Organization required | Include organization-id |
| 401 | Invalid API key | Check IT_GLUE_API_KEY |
| 403 | Access denied | User lacks permission |
| 404 | Password not found | Verify password ID |
| 422 | Invalid category | Query valid category IDs |

### Validation Errors

| Error | Cause | Fix |
|-------|-------|-----|
| Name required | Missing name | Add name to request |
| Organization required | No org ID | Include organization-id |
| Invalid category | Bad category ID | Query /password-categories |
| Invalid folder | Bad folder ID | Query /password-folders |

### Secure Error Handling

```javascript
async function safeGetPassword(passwordId) {
  try {
    return await getPassword(passwordId, { show_password: true });
  } catch (error) {
    if (error.status === 403) {
      // Don't leak that the password exists
      console.log('Password access denied or not found');
      return null;
    }

    if (error.status === 404) {
      console.log('Password not found');
      return null;
    }

    // Log security event for unexpected errors
    await logSecurityEvent({
      event: 'password_access_error',
      passwordId: passwordId,
      error: error.status,
      timestamp: new Date()
    });

    throw error;
  }
}
```

## Best Practices

1. **Use categories** - Classify all passwords for organization
2. **Organize with folders** - Create logical folder hierarchy
3. **Document purpose** - Include notes explaining what the password is for
4. **Track URLs** - Always include login URL when applicable
5. **Regular rotation** - Establish password rotation schedules
6. **Monitor access** - Review password access logs regularly
7. **Use restricted** - Mark high-security passwords as restricted
8. **Embed contextually** - Place passwords in related documents
9. **Avoid deletion** - Archive instead of delete for audit trails
10. **Include 2FA** - Store TOTP secrets with otp-secret field

## Related Skills

- [IT Glue Organizations](../organizations/SKILL.md) - Password organization scope
- [IT Glue Configurations](../configurations/SKILL.md) - Device-related credentials
- [IT Glue Documents](../documents/SKILL.md) - Embedding passwords in docs
- [IT Glue Flexible Assets](../flexible-assets/SKILL.md) - Password fields in assets
- [IT Glue API Patterns](../api-patterns/SKILL.md) - API reference
