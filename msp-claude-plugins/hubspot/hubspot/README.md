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

## Installation

The plugin uses Conduit's `hubspot` connector, which is HubSpot's own hosted MCP server (`https://mcp.hubspot.com/anthropic/v1/mcp`). This plugin does not ship a `.mcp.json`:

1. Install the `wyre-gateway` plugin (or any workflow pack) to connect Claude Code to Conduit at `https://conduit.wyre.ai/v1/mcp`.
2. Connect **HubSpot** in the Conduit web UI and complete HubSpot's OAuth consent. Conduit stores and refreshes the token; there are no client IDs, secrets or environment variables on your machine.

The live tools are generic over object type: `search_crm_objects`, `get_crm_objects`, `manage_crm_objects` (create/update and associations), `search_properties`, `get_properties`, `search_owners`, `get_user_details` and `query_crm_data`, plus marketing and CMS tools. See `skills/api-patterns/SKILL.md` for the full list and call shapes, and `GOVERNANCE.md` for permission tiers.

## Available Skills

| Skill | Description |
|-------|-------------|
| `api-patterns` | The live HubSpot connector tools, call shapes, Conduit OAuth connection, scopes, and rate limits |
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
- Keep credentials in the Conduit connection, never in files, environment variables or chat
- Rotate client secrets periodically via the HubSpot Developer Portal
- Monitor for unexpected API activity in HubSpot account settings
- OAuth tokens are scoped -- the MCP server automatically derives required scopes from the tools used

## API Rate Limits

HubSpot enforces rate limits:

- 100 requests per 10 seconds per OAuth app
- 500,000 requests per day (varies by HubSpot plan tier)

On a 429, wait for the window to reset rather than retrying immediately.

## Troubleshooting

### Authentication Errors

If you see "401 Unauthorized":
1. Reconnect HubSpot in the Conduit web UI (the HubSpot user may have revoked the app or lost access)
2. Call `get_user_details` to confirm which HubSpot user the connection acts as. If it still returns 401, the connection is not fixed: resolve it in Conduit instead of retrying

### Scope Errors

If you see "403 Forbidden" or scope-related errors:
1. `discover_hubspot_schema` shows which object types the connected user can read and write
2. Ensure your HubSpot account plan supports the required API features
3. Reconnect HubSpot in Conduit and approve the requested scopes; the HubSpot user must also have access to the object in HubSpot
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
