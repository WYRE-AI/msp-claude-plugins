---
description: List computers in ConnectWise Automate with optional filters
argument-hint: "[client] [location] [status] [os] [limit]"
arguments: [client, location, status, os, limit]
---

# List Computers

List computers in ConnectWise Automate with optional filters for client, location, status, and OS type.

## Prerequisites

- Valid ConnectWise Automate API credentials configured
- `CONNECTWISE_AUTOMATE_SERVER` environment variable set
- `CONNECTWISE_AUTOMATE_USERNAME` and `CONNECTWISE_AUTOMATE_PASSWORD` environment variables set

## Steps

1. **Build filter condition**
   - Start with empty condition
   - Add client filter if specified
   - Add location filter if specified
   - Add status filter if specified
   - Add OS filter if specified

2. **Construct API request**
   ```http
   GET /cwa/api/v1/Computers?condition={encoded_condition}&pageSize={limit}
   Authorization: Bearer {token}
   ```

3. **Build filter examples**
   ```javascript
   // Client filter
   if (client) {
     conditions.push(`Client.Name contains '${client}'`);
   }

   // Status filter
   if (status === 'online') {
     conditions.push("Status = 'Online'");
   } else if (status === 'offline') {
     conditions.push("Status = 'Offline'");
   }

   // OS filter
   if (os === 'server') {
     conditions.push("OS contains 'Server'");
   } else if (os === 'workstation') {
     conditions.push("OS contains 'Windows' and not (OS contains 'Server')");
   }

   const condition = conditions.join(' and ');
   ```

4. **Execute request with pagination**
   - Use pageSize from limit or default 50
   - Handle pagination if more results exist

5. **Format and return results**
   - Computer name
   - Client name
   - Location
   - Status
   - IP address
   - OS
   - Last contact

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| client | string | No | - | Filter by client name (partial match) |
| location | string | No | - | Filter by location name (partial match) |
| status | string | No | - | Filter: `online`, `offline` |
| os | string | No | - | Filter: `windows`, `server`, `workstation`, `macos`, `linux` |
| limit | number | No | 50 | Max results to return (max 500) |

## Examples

### List All Computers

```
/list-computers
```

### List Online Computers

```
/list-computers --status online
```

### List Computers for Client

```
/list-computers --client "Acme Corp"
```

### List Windows Servers

```
/list-computers --os server
```

### List Offline Computers for Client

```
/list-computers --client "Acme Corp" --status offline
```

### List Workstations at Location

```
/list-computers --client "Acme Corp" --location "Main Office" --os workstation
```

### List with Limit

```
/list-computers --status online --limit 100
```

## Output

### Success - Multiple Computers

```
Computers Found: 45

 # | Computer        | Client           | Location    | Status  | IP Address     | OS                          | Last Contact
---+-----------------+------------------+-------------+---------+----------------+-----------------------------+------------------
 1 | ACME-DC01       | Acme Corporation | Main Office | Online  | 192.168.1.10   | Windows Server 2022 Standard| 2 minutes ago
 2 | ACME-DC02       | Acme Corporation | Main Office | Online  | 192.168.1.11   | Windows Server 2022 Standard| 3 minutes ago
 3 | ACME-WKS001     | Acme Corporation | Main Office | Online  | 192.168.1.100  | Windows 11 Pro              | 5 minutes ago
 4 | ACME-WKS002     | Acme Corporation | Main Office | Offline | 192.168.1.101  | Windows 10 Pro              | 2 hours ago
 5 | ACME-REMOTE01   | Acme Corporation | Remote      | Online  | 10.0.0.50      | Windows 11 Pro              | 1 minute ago

Summary:
  Total: 45
  Online: 42
  Offline: 3

Use /list-computers --limit 100 to see more results.
```

### Success - With Filters

```
Computers Found: 12 (filtered: client="Acme", status="offline")

 # | Computer        | Location        | IP Address     | OS                 | Last Contact
---+-----------------+-----------------+----------------+--------------------+------------------
 1 | ACME-WKS002     | Main Office     | 192.168.1.101  | Windows 10 Pro     | 2 hours ago
 2 | ACME-WKS015     | Main Office     | 192.168.1.115  | Windows 11 Pro     | 4 hours ago
 3 | ACME-LAPTOP03   | Remote          | (No recent IP) | Windows 11 Pro     | 18 hours ago

Summary:
  Offline computers for Acme Corporation: 12 of 45 total

Consider:
- Checking if devices are powered on
- Verifying network connectivity
- Running wake-on-LAN if available
```

### Success - Single Computer

```
Computer Found: 1

Computer:     ACME-DC01
Computer ID:  12345
Client:       Acme Corporation
Location:     Main Office
Status:       Online
IP Address:   192.168.1.10
External IP:  203.0.113.50
OS:           Windows Server 2022 Standard
Last Contact: 2 minutes ago

Agent:        v2023.1.0.123
Uptime:       10 days, 4 hours
```

### No Computers Found

```
No computers found matching criteria

Filters applied:
- Client: "Acme Corp"
- Status: online
- OS: server

Suggestions:
- Verify the client name spelling
- Try a broader search without filters
- Check if computers exist in Automate
```

## Error Handling

### Invalid API Credentials

```
Authentication failed

Unable to authenticate with ConnectWise Automate API.
Please verify your credentials:
- CONNECTWISE_AUTOMATE_SERVER
- CONNECTWISE_AUTOMATE_USERNAME
- CONNECTWISE_AUTOMATE_PASSWORD

Documentation: https://developer.connectwise.com/Products/ConnectWise_Automate
```

### Invalid Filter Value

```
Invalid filter value

The filter "os=mac" is not recognized.

Valid OS filters:
- windows    All Windows computers
- server     Windows Server only
- workstation Windows 10/11 only
- macos      macOS computers
- linux      Linux computers
```

### Rate Limited

```
Rate limit exceeded

The ConnectWise Automate API rate limit has been reached.
Waiting 60 seconds before retrying...

[Progress bar or countdown]
```

### Server Unreachable

```
Server connection failed

Unable to connect to ConnectWise Automate server:
  Server: automate.example.com

Please verify:
- Server hostname is correct
- Server is online and accessible
- Network/firewall allows the connection
```

## Filter Details

### Status Filter Values

| Value | Description |
|-------|-------------|
| `online` | Currently checking in |
| `offline` | No recent agent contact |

### OS Filter Values

| Value | API Condition |
|-------|---------------|
| `windows` | `OS contains 'Windows'` |
| `server` | `OS contains 'Server'` |
| `workstation` | `OS contains 'Windows' and not (OS contains 'Server')` |
| `macos` | `OS contains 'macOS' or OS contains 'Mac OS'` |
| `linux` | `OS contains 'Linux' or OS contains 'Ubuntu' or OS contains 'CentOS'` |

## Related Commands

- `/run-script` - Run a script on a computer from this list
- `/device-lookup` - Get detailed info for a specific computer

## Related Skills

- [Computers Skill](../skills/computers/SKILL.md) - Computer management patterns
- [API Patterns Skill](../skills/api-patterns/SKILL.md) - Authentication and filtering
