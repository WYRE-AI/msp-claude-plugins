---
description: Retrieve a password from Hudu (with security logging)
argument-hint: "<name> <company> [type] [show]"
arguments: [name, company, type, show]
---

# Get Hudu Password

Retrieve a password from Hudu. Company is required for security.

## Prerequisites

- Valid Hudu API key configured (`HUDU_API_KEY`)
- Hudu base URL configured (`HUDU_BASE_URL`)
- API key must have password access permission enabled
- Company parameter is required

## Security Notice

**All password access is logged in Hudu's activity logs.**

When you retrieve a password, the following is recorded:
- API key used to access the password
- Timestamp of access
- Action performed (view, update, etc.)

**NEVER include actual password values in summaries, reports, or logs.**

## Steps

1. **Validate parameters**
   - Ensure company is provided
   - Resolve company name to ID
   - Validate password search term

2. **Search for password**
   - Find asset passwords matching name
   - Apply company and type filters
   - Return matching passwords

3. **Display results**
   - Show password details (name, username, URL)
   - Mask password by default
   - Reveal password only with --show flag

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| name | string | Yes | - | Password name (partial match) |
| company | string | Yes | - | Company name (required) |
| type | string | No | - | Password type filter |
| show | boolean | No | false | Show actual password value |

## Examples

### Search for Password

```
/get-password "Domain Admin" --company "Acme Corp"
```

### Show Password Value

```
/get-password "Domain Admin" --company "Acme Corp" --show
```

### Filter by Type

```
/get-password "firewall" --company "Acme Corp" --type "Network"
```

### Search by Partial Name

```
/get-password "admin" --company "Acme Corp"
```

## Output

### Password Found (Masked)

```
Found 1 password matching "Domain Admin" in Acme Corporation

Password: Domain Admin - ACME
------------------------------------------------------------
Company:       Acme Corporation
Type:          Administrative
Folder:        Infrastructure > Domain Controllers

Username:      administrator@acme.local
Password:      **************
URL:           https://dc01.acme.local

Description:
Primary domain administrator account. Use for:
- Domain controller management
- Group Policy changes
- AD user management

Last Updated:  2025-11-15
------------------------------------------------------------

To reveal password: /get-password "Domain Admin" --company "Acme Corp" --show

Note: Accessing passwords is logged for security audit.
```

### Password Found (Revealed)

```
Found 1 password matching "Domain Admin" in Acme Corporation

Password: Domain Admin - ACME
------------------------------------------------------------
Company:       Acme Corporation
Type:          Administrative
Folder:        Infrastructure > Domain Controllers

Username:      administrator@acme.local
Password:      SecureP@ssw0rd123!
URL:           https://dc01.acme.local

Description:
Primary domain administrator account. Use for:
- Domain controller management
- Group Policy changes
- AD user management

Last Updated:  2025-11-15
------------------------------------------------------------

WARNING: This access has been logged to Hudu's activity logs.
```

### Multiple Matches

```
Found 3 passwords matching "admin" in Acme Corporation

+----------------------------+------------------------+-----------------+--------------+
| Name                       | Username               | Type            | Last Updated |
+----------------------------+------------------------+-----------------+--------------+
| Domain Admin - ACME        | administrator@acme...  | Administrative  | 2025-11-15   |
| Local Admin - Servers      | .\Administrator        | Administrative  | 2025-12-01   |
| Firewall Admin             | admin                  | Network         | 2025-10-10   |
+----------------------------+------------------------+-----------------+--------------+

Refine search:
  /get-password "Domain Admin" --company "Acme Corp"
  /get-password "admin" --company "Acme Corp" --type "Network"
```

### No Results

```
No passwords found matching "xyz" in Acme Corporation

Suggestions:
  - Check spelling of the password name
  - Try a partial name match
  - Remove type filter to broaden search
  - Check if password exists in Hudu

Example searches:
  /get-password "admin" --company "Acme Corp"
  /get-password "domain" --company "Acme Corp"
```

## Type Reference

### Common Password Types

| Type | Description |
|------|-------------|
| Administrative | Admin/root credentials |
| Application | Software logins |
| Network | Network device access |
| Service Account | Automated accounts |
| User | End-user credentials |
| Vendor | Third-party access |
| Cloud | Cloud service credentials |

Note: Password types are custom per Hudu instance.

## Error Handling

### Company Required

```
Error: Company is required for password lookup

For security, you must specify a company:
  /get-password "Domain Admin" --company "Acme Corp"

This ensures passwords are accessed in proper context.
```

### No Results

```
No passwords found matching "invalid" in Acme Corporation

Suggestions:
  - Verify the password name
  - Check if password exists in Hudu
  - Try a partial match

Example:
  /get-password "admin" --company "Acme Corp"
```

### Invalid Company

```
Company not found: "Acm"

Did you mean?
  - Acme Corporation
  - Acme East Division

Try: /get-password "Domain Admin" --company "Acme Corporation"
```

### Access Denied

```
Access denied to passwords

The API key does not have password access permission.
Contact your Hudu administrator to enable password access
for this API key in Admin > API Keys.
```

### API Error

```
Error connecting to Hudu API

Possible causes:
  - Invalid API key (check HUDU_API_KEY)
  - Wrong base URL (check HUDU_BASE_URL)
  - Network connectivity issue

Retry or check configuration.
```

## Security Best Practices

1. **Always specify company** - Prevents accidental access to wrong company
2. **Use specific names** - Avoid overly broad searches
3. **Review activity logs** - Regularly check password access logs
4. **Don't screenshot** - Avoid capturing revealed passwords
5. **Close after use** - Clear terminal after accessing sensitive data
6. **Verify need** - Only access passwords when necessary
7. **Never share output** - Password values must not appear in summaries or reports

## Related Commands

- `/lookup-asset` - Find related asset
- `/search-articles` - Find related documentation
- `/find-company` - Verify company details
