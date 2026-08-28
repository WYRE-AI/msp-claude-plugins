# ConnectWise PSA Plugin

Claude Code plugin for ConnectWise PSA (formerly Manage) - the industry-leading professional services automation platform for MSPs.

## Overview

This plugin provides Claude with deep knowledge of ConnectWise PSA, enabling:

- **Ticket Management** - Create, search, update, and manage service tickets with full workflow support
- **Company Management** - Company CRUD, sites, types, and custom fields
- **Contact Management** - Contact operations, communication items, and portal access
- **Project Management** - Project creation, phases, templates, and resource allocation
- **Time Entry Tracking** - Log billable and non-billable time with work types

## Configuration

### Claude Code Settings (Recommended)

Add your credentials to `~/.claude/settings.json` (user scope, encrypted on macOS):

```json
{
  "env": {
    "CW_COMPANY_ID": "acmemsp",
    "CW_PUBLIC_KEY": "xxxxxxxxxxxxxxxx",
    "CW_PRIVATE_KEY": "xxxxxxxxxxxxxxxx",
    "CW_CLIENT_ID": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    "CW_API_URL": "api-na.myconnectwise.net"
  }
}
```

For project-specific configuration, use `.claude/settings.local.json` (gitignored):

```json
{
  "env": {
    "CW_COMPANY_ID": "acmemsp",
    "CW_PUBLIC_KEY": "xxxxxxxxxxxxxxxx",
    "CW_PRIVATE_KEY": "xxxxxxxxxxxxxxxx",
    "CW_CLIENT_ID": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    "CW_API_URL": "api-na.myconnectwise.net"
  }
}
```

### Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `CW_COMPANY_ID` | Yes | | Your ConnectWise company identifier (codebase) |
| `CW_PUBLIC_KEY` | Yes | | API member public key |
| `CW_PRIVATE_KEY` | Yes | | API member private key |
| `CW_CLIENT_ID` | Yes | | Registered application client ID |
| `CW_API_URL` | Yes | | Regional API endpoint (e.g., `api-na.myconnectwise.net`) |
| `CONNECTWISE_MANAGE_MCP_URL` | No | `https://connectwise-manage-mcp.wyre.workers.dev/mcp` | MCP server URL — override to use a self-hosted gateway |

## Self-Hosted Gateway

If you run the [mcp-gateway](https://github.com/WYRE-AI/mcp-gateway), set `CONNECTWISE_MANAGE_MCP_URL` to your gateway's endpoint:

```
CONNECTWISE_MANAGE_MCP_URL=https://your-gateway-domain/v1/connectwise-manage/mcp
```

**Setting env vars in Claude.ai:** Go to your org → Settings → Integrations → ConnectWise PSA → Configure and add the variable.

**Setting env vars in Claude Code:** Add to `~/.claude/settings.json`:
```json
{
  "env": {
    "CONNECTWISE_MANAGE_MCP_URL": "https://your-gateway-domain/v1/connectwise-manage/mcp"
  }
}
```

### Obtaining API Credentials

1. **Get Your Company ID**
   - Your company ID (codebase) is visible in your ConnectWise URL
   - Example: In `https://na.myconnectwise.net/v4_6_release/services/system_io/router/openrecord.rails?companyName=acmemsp`, the company ID is `acmemsp`

2. **Create an API Member**
   - Log into ConnectWise PSA as an administrator
   - Navigate to **System > Members > API Members**
   - Click **+** to create a new API member
   - Fill in required fields (First Name, Last Name, Member ID)
   - Set appropriate security role and permissions
   - Save the member

3. **Generate API Keys**
   - Open the API member you just created
   - Navigate to the **API Keys** tab
   - Click **+** to generate a new key pair
   - Copy the **Public Key** and **Private Key** (private key shown only once)

4. **Register for Client ID**
   - Go to [ConnectWise Developer Portal](https://developer.connectwise.com/)
   - Create an account or log in
   - Register a new application to get your **Client ID**

5. **Determine Your API URL**
   - **North America**: `api-na.myconnectwise.net`
   - **Europe**: `api-eu.myconnectwise.net`
   - **Australia**: `api-au.myconnectwise.net`

### Testing Your Connection

Once configured in Claude Code settings, test the connection (env vars injected by Claude Code):

```bash
# Build authorization header (Base64 of company+publicKey:privateKey)
AUTH=$(echo -n "${CW_COMPANY_ID}+${CW_PUBLIC_KEY}:${CW_PRIVATE_KEY}" | base64)

# Test connection
curl -s "https://${CW_API_URL}/v4_6_release/apis/3.0/system/info" \
  -H "Authorization: Basic ${AUTH}" \
  -H "clientId: ${CW_CLIENT_ID}" \
  -H "Content-Type: application/json" | jq
```

## Installation

1. Clone this plugin to your Claude plugins directory
2. Configure environment variables
3. Skills and commands will be automatically available

## Available Skills

| Skill | Description |
|-------|-------------|
| `tickets` | Service ticket management, statuses, priorities, boards, notes, SLA |
| `companies` | Company CRUD, types, sites, custom fields |
| `contacts` | Contact management, communication items, portal access |
| `projects` | Project CRUD, phases, templates, resource allocation |
| `time-entries` | Time entry CRUD, billable/non-billable, work types |
| `api-patterns` | Authentication, pagination, conditions syntax, rate limiting |

## Available Commands

| Command | Description |
|---------|-------------|
| `/create-ticket` | Create a new service ticket with company lookup and board selection |
| `/search-tickets` | Search tickets with filters (company, status, priority, date, assignee) |

## API Reference

### Base URLs

| Region | URL |
|--------|-----|
| North America | `https://api-na.myconnectwise.net/{codebase}/apis/3.0/` |
| Europe | `https://api-eu.myconnectwise.net/{codebase}/apis/3.0/` |
| Australia | `https://api-au.myconnectwise.net/{codebase}/apis/3.0/` |

Replace `{codebase}` with your company identifier.

### Authentication

ConnectWise PSA uses Basic Authentication with a combined credential string:

```
Authorization: Basic base64({companyId}+{publicKey}:{privateKey})
clientId: {your-client-id}
```

**Example Header:**
```http
GET /v4_6_release/apis/3.0/service/tickets
Authorization: Basic Y29tcGFueStwdWJsaWNrZXk6cHJpdmF0ZWtleQ==
clientId: your-client-id-here
Content-Type: application/json
```

### Pagination

ConnectWise uses `page` and `pageSize` query parameters:

| Parameter | Description | Default | Max |
|-----------|-------------|---------|-----|
| `page` | Page number (1-based) | 1 | - |
| `pageSize` | Records per page | 25 | 1000 |

**Example:**
```http
GET /service/tickets?page=1&pageSize=100
```

### Conditions Syntax

Filter results using the `conditions` query parameter:

**Syntax:** `conditions=field operator value`

**Operators:**
| Operator | Description | Example |
|----------|-------------|---------|
| `=` | Equals | `status/id=1` |
| `!=` | Not equals | `status/id!=5` |
| `<` | Less than | `priority/id<3` |
| `<=` | Less than or equal | `priority/id<=2` |
| `>` | Greater than | `dateEntered>2024-01-01` |
| `>=` | Greater than or equal | `dateEntered>=2024-01-01` |
| `contains` | Contains substring | `summary contains "email"` |
| `like` | Pattern match | `summary like "%email%"` |
| `in` | In list | `status/id in (1,2,3)` |
| `not in` | Not in list | `status/id not in (5)` |

**Combining Conditions:**
```
conditions=company/id=12345 and status/id!=5 and priority/id<=2
```

**URL Encoding:**
```http
GET /service/tickets?conditions=company/id%3D12345%20and%20status/id!%3D5
```

### Rate Limiting

- **Limit:** 60 requests per minute per API member
- **Headers:** Rate limit info returned in response headers
- **429 Response:** Retry after the specified time

**Rate Limit Headers:**
| Header | Description |
|--------|-------------|
| `X-RateLimit-Limit` | Maximum requests per minute |
| `X-RateLimit-Remaining` | Remaining requests in window |
| `X-RateLimit-Reset` | Seconds until limit resets |

### Common Endpoints

| Resource | Endpoint |
|----------|----------|
| Tickets | `/service/tickets` |
| Companies | `/company/companies` |
| Contacts | `/company/contacts` |
| Projects | `/project/projects` |
| Time Entries | `/time/entries` |
| Service Boards | `/service/boards` |
| Members | `/system/members` |

## Error Handling

### HTTP Status Codes

| Code | Meaning | Action |
|------|---------|--------|
| 200 | Success | Process response |
| 201 | Created | Entity created |
| 400 | Bad Request | Check request format |
| 401 | Unauthorized | Verify credentials |
| 403 | Forbidden | Check permissions |
| 404 | Not Found | Entity doesn't exist |
| 429 | Rate Limited | Wait and retry |
| 500 | Server Error | Retry with backoff |

### Error Response Format

```json
{
  "code": "InvalidArgument",
  "message": "The value 'invalid' is not valid for field 'status/id'.",
  "errors": [
    {
      "code": "InvalidArgument",
      "message": "status/id must be a valid integer"
    }
  ]
}
```

## API Documentation

- [ConnectWise Developer Portal](https://developer.connectwise.com/)
- [ConnectWise PSA REST API](https://developer.connectwise.com/Products/ConnectWise_PSA)
- [API Schema Browser](https://developer.connectwise.com/Products/ConnectWise_PSA/REST)

## Contributing

See the main [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

All contributions require a PRD in the `prd/` directory before implementation.
