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

### Connect through Conduit

This plugin ships no `.mcp.json` and reads no environment variables. Connect ConnectWise PSA once in Conduit (**Connections → ConnectWise PSA**, slug `connectwise-psa`); Conduit stores the credentials and injects them on every request. Then add the unified connector `https://conduit.wyre.ai/v1/mcp` to your MCP client (or install the `wyre-gateway` plugin); your client signs in to Conduit with OAuth.

| Conduit connection field |
|---|
| Company ID |
| Public Key |
| Private Key |
| Client ID |
| Server URL (self-hosted / regional) |

## Self-Hosted Gateway

There is no per-plugin URL setting, and setting an environment variable does not register an MCP server. To use your own gateway instead of Conduit, register it as an MCP server in your client, for example `claude mcp add --transport http connectwise-psa https://your-gateway-domain/v1/connectwise-psa/mcp`. The gateway then holds the ConnectWise PSA credentials, not the client.

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

To check the credentials directly against ConnectWise PSA before you save them in Conduit, export them in your shell and run:

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
| `scheduling` | Schedule entries: booking, moving and reviewing technician time |
| `procurement` | Purchase and sales orders, procurement products, warehouses, inventory adjustments |
| `api-patterns` | Authentication, pagination, conditions syntax, rate limiting |

Contact communication type ids and names differ per ConnectWise tenant. Use `cw_list_communication_types` to see them; `cw_create_contact` also accepts `emailTypeId`, `emailTypeName`, `phoneTypeId`, `phoneTypeName`. See the `contacts` skill.

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
