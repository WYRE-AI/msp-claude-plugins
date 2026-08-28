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

### Claude Code Settings (Recommended)

Add your credentials to `~/.claude/settings.json` (user scope, encrypted on macOS):

```json
{
  "env": {
    "LIONGARD_INSTANCE": "yourcompany",
    "LIONGARD_API_KEY": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
  }
}
```

For project-specific configuration, use `.claude/settings.local.json` (gitignored):

```json
{
  "env": {
    "LIONGARD_INSTANCE": "yourcompany",
    "LIONGARD_API_KEY": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
  }
}
```

### Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `LIONGARD_INSTANCE` | Yes | Instance name (subdomain from `https://{instance}.app.liongard.com`) |
| `LIONGARD_API_KEY` | Yes | API key from Settings > Access Keys |

### Obtaining API Credentials

1. **Log into Liongard**
   - Navigate to `https://yourcompany.app.liongard.com`

2. **Generate an API Key**
   - Go to **Settings > Access Keys**
   - Click **Create Access Key**
   - Copy the generated key (store securely)

3. **Find Your Instance Name**
   - Your instance is the first part of your Liongard URL
   - Example: If your URL is `https://acmemsp.app.liongard.com`, your instance is `acmemsp`

### Testing Your Connection

Once configured in Claude Code settings, test the connection (env vars injected by Claude Code):

```bash
# Test connection
curl -s "https://${LIONGARD_INSTANCE}.app.liongard.com/api/v1/environments/count" \
  -H "X-ROAR-API-KEY: ${LIONGARD_API_KEY}" \
  -H "Content-Type: application/json" | jq
```

## Installation

```bash
# Clone the repository
git clone https://github.com/WYRE-AI/msp-claude-plugins.git

# Navigate to plugin
cd msp-claude-plugins/liongard/liongard

# Use with Claude Code
claude --plugin .
```

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

The Liongard MCP server provides tool-based access to Liongard APIs with a decision-tree architecture:

```json
{
  "mcpServers": {
    "liongard-mcp": {
      "command": "npx",
      "args": ["-y", "@wyre-technology/liongard-mcp"],
      "env": {
        "LIONGARD_INSTANCE": "yourcompany",
        "LIONGARD_API_KEY": "your-api-key"
      }
    }
  }
}
```

The MCP server exposes a `liongard_navigate` root tool that lets you select a domain (environments, agents, inspections, systems, detections, alerts, metrics, timeline, inventory) and then dynamically loads domain-specific tools.

## API Reference

- **Base URL (v1)**: `https://{instance}.app.liongard.com/api/v1`
- **Base URL (v2)**: `https://{instance}.app.liongard.com/api/v2`
- **Auth**: `X-ROAR-API-KEY` header
- **Rate Limit**: ~300 requests per minute (conservative)
- **Pagination**: `page`/`pageSize` params (GET), `Pagination` object (POST), max 2000 per page
- **Docs**: [Liongard Developer Guide](https://docs.liongard.com/reference/developer-guide)

## Contributing

See the main [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.
