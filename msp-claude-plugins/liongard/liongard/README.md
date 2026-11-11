# Liongard Plugin

Claude Code plugin for Liongard automated IT documentation platform.

## Overview

This plugin provides Claude with deep knowledge of Liongard, enabling:

- **Environment Management** - Create, search, update, and manage customer environments and groups
- **Inspection Operations** - Configure inspectors, launchpoints, scheduling, and trigger inspections
- **System Discovery** - Query discovered systems, system details, and extract data via dataprints
- **Change Detection** - Monitor detections, configure alerts, evaluate compliance metrics
- **Timeline & Audit** - Query timeline events for audit trails and troubleshooting

## Configuration

### Connect through Conduit

This plugin ships no `.mcp.json` and reads no environment variables. Connect Liongard once in Conduit at `https://conduit.wyre.ai/connect/liongard` (**Connections → Liongard**, slug `liongard`); Conduit stores the credentials and injects them on every request. Then install the `wyre-gateway` plugin (or add the unified connector `https://conduit.wyre.ai/v1/mcp` to your MCP client); your client signs in to Conduit with OAuth.

| Conduit connection field | Notes |
|---|---|
| Instance Name | Your Liongard subdomain, e.g. `us7` or `eu1`. Pasting `eu1.app.liongard.com` or the full instance URL works too. |
| Access Key ID | From **Profile > Account Settings > Access Tokens** |
| Access Key Secret | Shown once, when the token is generated |

Conduit checks the key against your Liongard instance when you save the connection.

### Obtaining API Credentials

1. **Log into Liongard**
   - Open your Liongard instance, e.g. `https://us7.app.liongard.com`

2. **Generate an Access Key**
   - Open the profile menu (upper right) and go to **Account Settings > Access Tokens**
   - Click **Generate New Token**
   - Copy the Access Key ID and the Access Key Secret (the secret is not shown again after you leave the page)

3. **Find Your Instance Name**
   - Your instance is the first part of your Liongard URL
   - Example: if your URL is `https://us7.app.liongard.com`, your instance is `us7`

## Self-Hosted Gateway

There is no per-plugin URL setting, and setting an environment variable does not register an MCP server. To use your own gateway instead of Conduit, register it as an MCP server in your client, for example `claude mcp add --transport http liongard https://your-gateway-domain/v1/liongard/mcp`. The gateway then holds the Liongard credentials, not the client. In that case install only this plugin (`/plugin install liongard@msp-claude-plugins`) and skip `wyre-gateway` and the Conduit connection.

## Installation

```
/plugin marketplace add WYRE-AI/msp-claude-plugins
/plugin install wyre-gateway@msp-claude-plugins
/plugin install liongard@msp-claude-plugins
```

Then connect Liongard in Conduit (see **Connect through Conduit**). The plugin adds skills and commands; the tools come from the Conduit connector.

## Available Skills

| Skill | Description |
|-------|-------------|
| `overview` | Platform overview, terminology, authentication, API structure |
| `environments` | Environment CRUD, groups, related entities, bulk operations |
| `inspections` | Inspector templates, launchpoint config, scheduling, triggering runs |
| `systems` | Discovered systems, system details, dataprints, asset inventory |
| `detections` | Change detection, alerts, metrics, timeline events |

## Available Commands

| Command | Description |
|---------|-------------|
| `/liongard-health-check` | Check API connectivity and system health summary |
| `/liongard-environment-summary` | Detailed summary of a specific environment |

## MCP Server

Conduit runs the Liongard MCP server for you; there is nothing to install or configure locally. The server lists every domain tool (environments, agents, inspections, systems, detections, alerts, metrics, timeline, inventory) up front, so there is no domain to select first. Its `liongard_navigate` helper is refused by Conduit for every caller; use `conduit__my_access` to see which tools you can call.

## API Reference

- **Base URL (v1)**: `https://{instance}.app.liongard.com/api/v1`
- **Base URL (v2)**: `https://{instance}.app.liongard.com/api/v2`
- **Auth**: Access Key ID and Secret, stored on the Conduit connection
- **Rate Limit**: ~300 requests per minute (conservative)
- **Pagination**: `page`/`pageSize` params (GET), `Pagination` object (POST), max 2000 per page
- **Docs**: [Liongard Developer Guide](https://docs.liongard.com/reference/developer-guide)

## Troubleshooting

### Authentication Errors

If a tool call returns "401 Unauthorized":
1. Open the Liongard connection in Conduit (`https://conduit.wyre.ai/connect/liongard`) and check the Instance Name, Access Key ID and Access Key Secret
2. Check that the token has not been deleted: in Liongard, sign in as the user who generated it and open **Profile > Account Settings > Access Tokens**
3. Generate a new token if needed, then update the Conduit connection

## Contributing

See the main [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.
