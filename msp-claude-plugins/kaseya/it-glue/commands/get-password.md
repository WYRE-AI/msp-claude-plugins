---
description: Retrieve a password from IT Glue (with security logging)
argument-hint: "<name> <organization> [category] [show]"
arguments: [name, organization, category, show]
---

# Get IT Glue Password

Retrieve a password from IT Glue. Organization is required for security.

## Prerequisites

- Valid IT Glue API key configured (`IT_GLUE_API_KEY`)
- IT Glue region configured (`IT_GLUE_REGION`)
- User must have password read permissions
- Organization parameter is required

## Security Notice

**All password access is logged in IT Glue's audit trail.**

When you request a password with `--show`, the following is recorded:
- User who accessed the password
- Timestamp of access
- IP address of requester

## Steps

1. **Validate parameters**
   - Ensure organization is provided
   - Resolve organization name to ID
   - Validate password search term

2. **Search for password**
   - Find passwords matching name
   - Apply organization and category filters
   - Return matching passwords

3. **Display results**
   - Show password details (name, username, URL)
   - Mask password by default
   - Reveal password only with --show flag

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| name | string | Yes | - | Password name (partial match) |
| organization | string | Yes | - | Organization name (required) |
| category | string | No | - | Category filter |
| show | boolean | No | false | Show actual password value |

## Examples

### Search for Password

```
/get-password "Domain Admin" --organization "Acme Corp"
```

### Show Password Value

```
/get-password "Domain Admin" --organization "Acme Corp" --show
```

### Filter by Category

```
/get-password "firewall" --organization "Acme Corp" --category "Network"
```

### Search by Partial Name

```
/get-password "admin" --organization "Acme Corp"
```

## Output

### Password Found (Masked)

```
Found 1 password matching "Domain Admin" in Acme Corporation

Password: Domain Admin - ACME
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Organization:  Acme Corporation
Category:      Administrative
Folder:        Infrastructure > Domain Controllers

Username:      administrator@acme.local
Password:      ••••••••••••••
URL:           https://dc01.acme.local

Notes:
Primary domain administrator account. Use for:
- Domain controller management
- Group Policy changes
- AD user management

Last Updated:  2024-01-15
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

To reveal password: /get-password "Domain Admin" --organization "Acme Corp" --show

Note: Accessing passwords is logged for security audit.
```

### Password Found (Revealed)

```
Found 1 password matching "Domain Admin" in Acme Corporation

Password: Domain Admin - ACME
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Organization:  Acme Corporation
Category:      Administrative
Folder:        Infrastructure > Domain Controllers

Username:      administrator@acme.local
Password:      SecureP@ssw0rd123!
URL:           https://dc01.acme.local

Notes:
Primary domain administrator account. Use for:
- Domain controller management
- Group Policy changes
- AD user management

Last Updated:  2024-01-15
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️  This access has been logged to the IT Glue audit trail.
```

### Multiple Matches

```
Found 3 passwords matching "admin" in Acme Corporation

┌─────────────────────────┬────────────────────────┬─────────────────┬──────────────┐
│ Name                    │ Username               │ Category        │ Last Updated │
├─────────────────────────┼────────────────────────┼─────────────────┼──────────────┤
│ Domain Admin - ACME     │ administrator@acme... │ Administrative  │ 2024-01-15   │
│ Local Admin - Servers   │ .\Administrator        │ Administrative  │ 2024-02-01   │
│ Firewall Admin          │ admin                  │ Network         │ 2023-12-10   │
└─────────────────────────┴────────────────────────┴─────────────────┴──────────────┘

Refine search:
  /get-password "Domain Admin" --organization "Acme Corp"
  /get-password "admin" --organization "Acme Corp" --category "Network"
```

### No Results

```
No passwords found matching "xyz" in Acme Corporation

Suggestions:
  - Check spelling of the password name
  - Try a partial name match
  - Remove category filter to broaden search
  - Check if password exists in IT Glue

Example searches:
  /get-password "admin" --organization "Acme Corp"
  /get-password "domain" --organization "Acme Corp"
```

## Category Reference

### Common Categories

| Category | Description |
|----------|-------------|
| Administrative | Admin/root credentials |
| Application | Software logins |
| Network | Network device access |
| Service Account | Automated accounts |
| User | End-user credentials |
| Vendor | Third-party access |
| Cloud | Cloud service credentials |

## Error Handling

### Organization Required

```
Error: Organization is required for password lookup

For security, you must specify an organization:
  /get-password "Domain Admin" --organization "Acme Corp"

This ensures passwords are accessed in proper context.
```

### No Results

```
No passwords found matching "invalid" in Acme Corporation

Suggestions:
  - Verify the password name
  - Check if password exists in IT Glue
  - Try a partial match

Example:
  /get-password "admin" --organization "Acme Corp"
```

### Invalid Organization

```
Organization not found: "Acm"

Did you mean?
  - Acme Corporation
  - Acme East Division

Try: /get-password "Domain Admin" --organization "Acme Corporation"
```

### Access Denied

```
Access denied to password "Restricted Admin"

This password is restricted. Contact your IT Glue administrator
for access.
```

### API Error

```
Error connecting to IT Glue API

Possible causes:
  - Invalid API key (check IT_GLUE_API_KEY)
  - Wrong region (check IT_GLUE_REGION)
  - Network connectivity issue

Retry or check configuration.
```

## Security Best Practices

1. **Always specify organization** - Prevents accidental access to wrong org
2. **Use specific names** - Avoid overly broad searches
3. **Review audit logs** - Regularly check password access logs
4. **Don't screenshot** - Avoid capturing revealed passwords
5. **Close after use** - Clear terminal after accessing sensitive data
6. **Verify need** - Only access passwords when necessary

## Related Commands

- `/lookup-asset` - Find related configuration
- `/search-docs` - Find related documentation
- `/find-organization` - Verify organization details
