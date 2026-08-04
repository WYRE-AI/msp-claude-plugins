---
name: "IT Glue Passwords"
description: >
  IT Glue passwords: secure, organization-scoped credential storage with
  categories, folders, restricted-access flags, OTP secrets, and embedding
  into documents and flexible assets. Covers access-control and rotation
  practices for handling sensitive credentials.
when_to_use: >-
  When working with secure credential storage, password categories, folders, embedded passwords,
  and access patterns in IT Glue passwords. Use when: it glue password, credential lookup,
  password management, secure credentials, it glue credentials, password storage, credential
  documentation, or password access.
---

# IT Glue Passwords Management

## Overview

Passwords in IT Glue provide secure credential storage with organization-level access control. This skill covers password creation, categorization, folder organization, and security best practices for managing sensitive credentials within MSP documentation.

## Anti-triggers

- **A credential stored in a flexible asset's password-type field** —
  those are not Passwords records and will not appear in
  `search_passwords`; use `it-glue-flexible-assets`.
- **A password embedded in a runbook** — the document references the
  record rather than holding it; use `it-glue-documents`.
- **The device the credential opens** — use `it-glue-configurations`.

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

Passwords can be embedded directly within documents and flexible assets (`<div data-embedded-password-id="12345"></div>`), providing contextual credential access alongside documentation.

See [references/fields.md](references/fields.md) for the complete field reference.

## API Patterns

- **The password value is not returned by default.** Retrieving the actual credential requires `GET /passwords/:id?show_password=true` — this is logged in the IT Glue audit trail.
- **List endpoints omit the `password` field entirely** — it's only present when fetching a single password with `show_password=true`.
- Passwords can be filtered by organization, category, or folder in combination (`filter[organization-id]`, `filter[password-category-id]`, `filter[password-folder-id]`).

See [references/api.md](references/api.md) for the complete endpoint catalog: password and password-folder CRUD, search, and embedding syntax.

## Common Workflows

### Secure Password Creation

Resolve or create the target folder, then create the password with a category and a notes field documenting purpose — and log the creation to your own audit system in addition to IT Glue's built-in logging.

### Password Rotation

Update the password value and append a rotation note (timestamp + reason) to the existing notes rather than overwriting them, so the credential's change history stays visible in IT Glue.

See [references/examples.md](references/examples.md) for the full `createSecurePassword` and `rotatePassword` implementations, plus context search, category reporting, and stale-password detection workflows.

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

IT Glue logs all password access automatically. Layer your own audit logging on top for actions IT Glue doesn't track natively (e.g. who copied a value in a downstream tool) — see [references/errors.md](references/errors.md) for a secure error-handling pattern that logs unexpected access failures without leaking whether a password exists.

## Gotchas

- **`show_password=true` is required** to get the actual credential — omitting it silently returns the password record without the `password` field, which looks like a missing-data bug rather than an intentional security gate.
- **Every retrieval with `show_password=true` is audit-logged** — avoid calling it in loops or bulk scripts unless you actually need the plaintext value for each record, since it generates one audit entry per call.
- **Deleting removes audit history** — archive or otherwise preserve the record instead of deleting when a credential is retired, so past access can still be reviewed.

See [references/errors.md](references/errors.md) for the complete error-code and validation-error tables.

## Best Practices

1. **Use categories** - Classify all passwords for organization
2. **Organize with folders** - Create logical folder hierarchy
3. **Document purpose** - Include notes explaining what the password is for
4. **Track URLs** - Always include login URL when applicable
5. **Embed contextually** - Place passwords in related documents
6. **Include 2FA** - Store TOTP secrets with otp-secret field

## Related Skills

- [IT Glue Organizations](../organizations/SKILL.md) - Password organization scope
- [IT Glue Configurations](../configurations/SKILL.md) - Device-related credentials
- [IT Glue Documents](../documents/SKILL.md) - Embedding passwords in docs
- [IT Glue Flexible Assets](../flexible-assets/SKILL.md) - Password fields in assets
- [IT Glue API Patterns](../api-patterns/SKILL.md) - API reference
