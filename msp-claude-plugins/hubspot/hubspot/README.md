# HubSpot Plugin

Claude Code plugin for the HubSpot CRM platform integration.

## Overview

This plugin provides Claude with deep knowledge of HubSpot CRM, enabling:

- **Contact Management** - Search, create, and update contacts for MSP clients and prospects
- **Company Management** - Manage company records with industry, revenue, and lifecycle tracking
- **Deal Pipeline** - Track deals through pipeline stages, forecast revenue, and manage sales workflows
- **Ticket Management** - Create and manage support tickets for client service delivery
- **Activities & Tasks** - Log notes, create follow-up tasks, and track engagement history
- **Associations** - Link contacts, companies, deals, and tickets together for full relationship context

## Prerequisites

### OAuth 2.0 Setup

HubSpot uses OAuth 2.0 with PKCE for MCP authentication. You need a client ID and client secret:

1. Go to [developers.hubspot.com](https://developers.hubspot.com)
2. Navigate to **Development > MCP Auth Apps**
3. Create a new MCP Auth App
4. Copy the **Client ID** and **Client Secret**
5. Set the credentials as environment variables

### Environment Variables

```bash
export HUBSPOT_CLIENT_ID="your-client-id"
export HUBSPOT_CLIENT_SECRET="your-client-secret"
```

## Installation

### Via MCP Gateway (Recommended)

Use the [MCP Gateway](https://conduit.wyre.ai) to connect -- just paste your OAuth credentials and you're done.

### Self-Hosted (Claude Desktop)

Add to your Claude Desktop config:

```json
{
  "mcpServers": {
    "hubspot": {
      "command": "npx",
      "args": [
        "-y", "mcp-remote",
        "https://mcp.hubspot.com/"
      ],
      "env": {
        "HUBSPOT_CLIENT_ID": "YOUR_CLIENT_ID",
        "HUBSPOT_CLIENT_SECRET": "YOUR_CLIENT_SECRET"
      }
    }
  }
}
```

> **Note:** HubSpot hosts their own MCP server at `https://mcp.hubspot.com/`. The `mcp-remote` bridge handles OAuth 2.0 + PKCE automatically. This plugin adds MSP-specific skills, commands, and workflow knowledge on top of HubSpot's official server.

## Available Skills

| Skill | Description |
|-------|-------------|
| `api-patterns` | HubSpot MCP connection, OAuth 2.0 + PKCE, scopes, transport, and rate limits |
| `contacts` | Contact management -- search, create, update, and associate contacts |
| `companies` | Company management -- search, create, update, and audit company records |
| `deals` | Deal and pipeline management -- track deals, update stages, forecast revenue |
| `tickets` | Support ticket management -- create, search, and update service tickets |
| `activities` | Tasks, notes, and associations -- log activities and link CRM objects together |

## Available Commands

| Command | Description |
|---------|-------------|
| `/search-contacts` | Search HubSpot contacts by name, email, or company |
| `/search-deals` | Search deals by name, stage, or company |
| `/create-deal` | Create a new deal with company association |
| `/log-activity` | Log a note or create a task on a contact, company, or deal |
| `/pipeline-summary` | Summarize deal pipeline -- deals per stage, total value, expected close dates |
| `/lookup-company` | Find a company by name or domain, show associated contacts and deals |

## Quick Start

### Search for a Contact

```
/search-contacts "John Smith"
```

### Look Up a Company

```
/lookup-company "Acme Corp"
```

### Create a Deal

```
/create-deal --company "Acme Corp" --name "Managed IT Services" --amount 5000 --stage "Proposal"
```

### Summarize Pipeline

```
/pipeline-summary
```

## Security Considerations

### OAuth Tokens

- Never commit client IDs or client secrets to version control
- Use environment variables for all credentials
- Rotate client secrets periodically via the HubSpot Developer Portal
- Monitor for unexpected API activity in HubSpot account settings
- OAuth tokens are scoped -- the MCP server automatically derives required scopes from the tools used

## API Rate Limits

HubSpot enforces rate limits:

- 100 requests per 10 seconds per OAuth app
- 500,000 requests per day (varies by HubSpot plan tier)

The plugin automatically handles rate limiting with exponential backoff.

## Troubleshooting

### Authentication Errors

If you see "401 Unauthorized":
1. Verify `HUBSPOT_CLIENT_ID` and `HUBSPOT_CLIENT_SECRET` are set correctly
2. Check that the MCP Auth App has not been revoked in the Developer Portal
3. Re-authenticate by restarting the MCP connection (OAuth tokens may have expired)
4. Create a new MCP Auth App at [developers.hubspot.com](https://developers.hubspot.com)

### Scope Errors

If you see "403 Forbidden" or scope-related errors:
1. HubSpot MCP automatically derives scopes from the tools you use
2. Ensure your HubSpot account plan supports the required API features
3. Check that the MCP Auth App has the necessary permissions
4. Some features (e.g., custom objects) require higher-tier HubSpot plans

### Rate Limiting

If you see "429 Too Many Requests":
1. Wait for the rate limit window to reset (10 seconds)
2. Reduce the frequency of requests
3. Use search tools instead of listing all records to reduce total call count

## API Documentation

- [HubSpot MCP Server](https://developers.hubspot.com/docs/guides/apps/mcp)
- [HubSpot CRM API Documentation](https://developers.hubspot.com/docs/api/crm)
- [HubSpot Developer Portal](https://developers.hubspot.com)
- [HubSpot App Marketplace](https://ecosystem.hubspot.com/marketplace/apps)

## Contributing

See the main [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

All contributions require a PRD in the `prd/` directory before implementation.

## Changelog

### 0.1.0 (2026-02-24)

- Initial release
- 6 skills: api-patterns, contacts, companies, deals, tickets, activities
- 6 commands: search-contacts, search-deals, create-deal, log-activity, pipeline-summary, lookup-company
