# HaloPSA MCP Server

MCP server for HaloPSA, enabling Claude to interact with your HaloPSA instance.

## Features

- **Ticket Management**: List, create, update tickets and add actions/notes
- **Client Management**: List, view, and create clients
- **Asset Management**: List, view, and create assets/configuration items
- **Agent Management**: List and view agents/technicians
- **Site Management**: List and view sites
- **Reference Data**: Access ticket types, statuses, priorities, teams, and asset types
- **Search**: Search across tickets, clients, assets, agents, and sites

## Installation

### Via MCP Gateway (Recommended)

This server is designed to work with the [MCP Gateway](https://github.com/WYRE-AI/mcp-gateway) which handles authentication and credential management.

### Local Development

```bash
npm install
npm run build
npm start
```

## Configuration

The server accepts OAuth 2.0 credentials via environment variables:

| Variable | Description |
|----------|-------------|
| `HALOPSA_CLIENT_ID` | OAuth 2.0 Client ID |
| `HALOPSA_CLIENT_SECRET` | OAuth 2.0 Client Secret |
| `HALOPSA_TENANT` | Tenant name (used to construct URL: `https://{tenant}.halopsa.com`) |
| `HALOPSA_BASE_URL` | Alternative: explicit base URL (instead of tenant) |

When used with the MCP Gateway, credentials are injected via `X_CLIENT_ID`, `X_CLIENT_SECRET`, and `X_TENANT` environment variables.

### OAuth Setup in HaloPSA

1. Go to **Configuration > Integrations > HaloPSA API**
2. Create a new API application
3. Set the authentication method to **Client Credentials**
4. Note the Client ID and Client Secret
5. Configure the required permissions/scopes for your use case

## Available Tools

### Ticket Operations

| Tool | Description |
|------|-------------|
| `halopsa_list_tickets` | List tickets with optional filters (client, status, priority, etc.) |
| `halopsa_get_ticket` | Get ticket details by ID |
| `halopsa_create_ticket` | Create a new ticket |
| `halopsa_update_ticket` | Update an existing ticket |
| `halopsa_add_ticket_action` | Add an action/note to a ticket |

### Client Operations

| Tool | Description |
|------|-------------|
| `halopsa_list_clients` | List clients/customers |
| `halopsa_get_client` | Get client details by ID |
| `halopsa_create_client` | Create a new client |

### Asset Operations

| Tool | Description |
|------|-------------|
| `halopsa_list_assets` | List assets/configuration items |
| `halopsa_get_asset` | Get asset details by ID |
| `halopsa_create_asset` | Create a new asset |

### Agent Operations

| Tool | Description |
|------|-------------|
| `halopsa_list_agents` | List agents/technicians |
| `halopsa_get_agent` | Get agent details by ID |

### Site Operations

| Tool | Description |
|------|-------------|
| `halopsa_list_sites` | List sites |
| `halopsa_get_site` | Get site details by ID |

### Reference Data

| Tool | Description |
|------|-------------|
| `halopsa_list_ticket_types` | List available ticket types |
| `halopsa_list_statuses` | List available statuses |
| `halopsa_list_priorities` | List available priorities |
| `halopsa_list_teams` | List teams |
| `halopsa_list_asset_types` | List available asset types |

### Search

| Tool | Description |
|------|-------------|
| `halopsa_search` | Search across tickets, clients, assets, agents, or sites |

## Rate Limiting

HaloPSA enforces a rate limit of **500 requests per 3 minutes**. The underlying `@asachs01/node-halopsa` library includes built-in rate limiting and automatic retry handling.

## Docker

```bash
docker build -t halopsa-mcp .
docker run \
  -e HALOPSA_CLIENT_ID=your-client-id \
  -e HALOPSA_CLIENT_SECRET=your-client-secret \
  -e HALOPSA_TENANT=yourcompany \
  halopsa-mcp
```

## Usage Examples

### List Open Tickets for a Client

```json
{
  "tool": "halopsa_list_tickets",
  "arguments": {
    "client_id": 123,
    "open_only": true
  }
}
```

### Create a New Ticket

```json
{
  "tool": "halopsa_create_ticket",
  "arguments": {
    "summary": "Network connectivity issues",
    "details": "User reports intermittent network drops",
    "client_id": 123,
    "tickettype_id": 1,
    "priority_id": 2
  }
}
```

### Add a Note to a Ticket

```json
{
  "tool": "halopsa_add_ticket_action",
  "arguments": {
    "ticket_id": 456,
    "note": "Contacted user and confirmed the issue is resolved",
    "timetaken": 15
  }
}
```

### Search for Assets

```json
{
  "tool": "halopsa_search",
  "arguments": {
    "entity": "assets",
    "search": "laptop"
  }
}
```

## Error Handling

The server provides helpful error messages for common scenarios:

- **Authentication errors (401)**: Verify your client ID and secret
- **Authorization errors (403)**: Check your OAuth application permissions
- **Rate limit errors (429)**: Wait and retry (automatic retry is built-in)

## License

Apache-2.0
