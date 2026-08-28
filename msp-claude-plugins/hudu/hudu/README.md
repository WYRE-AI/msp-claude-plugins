# Hudu Plugin

Claude Code plugin for the Hudu documentation platform integration.

## Overview

This plugin provides Claude with deep knowledge of Hudu, enabling:

- **Company Management** - Find and manage client companies
- **Asset Management** - Track servers, workstations, network devices, and other assets via asset layouts
- **Knowledge Base Articles** - Search and manage documentation articles
- **Password Management** - Securely retrieve and manage credentials (asset passwords)
- **Website Monitoring** - Track website records, SSL, and email security (DMARC, DKIM, SPF)

## Prerequisites

### API Credentials

You need a Hudu API key with appropriate permissions:

1. Log into Hudu as an administrator
2. Navigate to Admin > API Keys
3. Create a new API key with required permissions
4. Optionally restrict by IP whitelist or company scope

### Environment Variables

Set the following environment variables:

```bash
export HUDU_BASE_URL="https://your-company.huducloud.com"
export HUDU_API_KEY="your-api-key-here"
```

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `HUDU_BASE_URL` | Yes | | Your Hudu instance URL (e.g., `https://your-company.huducloud.com`) |
| `HUDU_API_KEY` | Yes | | API key from Admin > API Keys |
| `HUDU_MCP_URL` | No | `https://hudu-mcp.wyre.workers.dev/mcp` | MCP server URL — override to use a self-hosted gateway |

## Self-Hosted Gateway

If you run the [mcp-gateway](https://github.com/WYRE-AI/mcp-gateway), set `HUDU_MCP_URL` to your gateway's endpoint:

```
HUDU_MCP_URL=https://your-gateway-domain/v1/hudu/mcp
```

**Setting env vars in Claude.ai:** Go to your org → Settings → Integrations → Hudu → Configure and add the variable.

**Setting env vars in Claude Code:** Add to `~/.claude/settings.json`:
```json
{
  "env": {
    "HUDU_MCP_URL": "https://your-gateway-domain/v1/hudu/mcp"
  }
}
```

## Installation

1. Clone this plugin to your Claude plugins directory
2. Configure environment variables
3. The MCP server will be automatically started when needed

## Available Skills

| Skill | Description |
|-------|-------------|
| `companies` | Company (client/organization) management |
| `assets` | Asset and asset layout management |
| `articles` | Knowledge base article management |
| `passwords` | Secure credential storage and retrieval (asset passwords) |
| `websites` | Website record and monitoring management |
| `api-patterns` | Hudu API patterns and best practices |

## Available Commands

| Command | Description |
|---------|-------------|
| `/lookup-asset` | Find an asset by name, hostname, serial number, or IP |
| `/search-articles` | Search knowledge base articles by keyword |
| `/get-password` | Retrieve a password (with security logging) |
| `/find-company` | Find a company by name |

## Quick Start

### Find a Company

```
/find-company "Acme"
```

### Look Up an Asset

```
/lookup-asset "DC-01" --company "Acme Corp"
```

### Search Articles

```
/search-articles "backup procedure" --company "Acme Corp"
```

### Get a Password

```
/get-password "Domain Admin" --company "Acme Corp"
```

## Security Considerations

### Password Access

- All password access is logged in Hudu's activity logs
- Company parameter is required for password lookups
- Passwords are masked by default; use `--show` to reveal
- API keys can be scoped to restrict password access
- Review password access logs regularly

### API Key Security

- Never commit API keys to version control
- Use environment variables for credentials
- Rotate API keys periodically
- Use minimum required permissions
- Restrict API keys by IP whitelist when possible

## API Rate Limits

Hudu enforces rate limits:

- 300 requests per minute

The plugin automatically handles rate limiting with exponential backoff.

## API Naming Differences

Hudu's UI names differ from API endpoint names in some cases:

| Hudu UI Name | API Endpoint |
|---|---|
| Company (customizable label) | `/api/v1/companies` |
| Password | `/api/v1/asset_passwords` |
| Knowledge Base Article | `/api/v1/articles` |
| Process | `/api/v1/procedures` |

## Troubleshooting

### Authentication Errors

If you see "401 Unauthorized":
1. Verify `HUDU_API_KEY` is set correctly
2. Check the API key hasn't been revoked
3. Confirm the key has required permissions
4. Verify your IP is on the API key's whitelist (if configured)

### Wrong Base URL

If you see "404 Not Found" or connection errors:
1. Verify `HUDU_BASE_URL` matches your Hudu instance URL
2. Ensure the URL does not have a trailing slash
3. For self-hosted instances, confirm the instance is reachable

### Rate Limiting

If you see "429 Too Many Requests":
1. Wait for the rate limit window to reset (1 minute)
2. Reduce the frequency of requests
3. Use pagination for large data sets

### Permission Denied

If you see "403 Forbidden":
1. Check if the API key has access to the requested resource
2. Verify company-scoped API keys include the target company
3. Confirm password access is enabled if retrieving passwords

## API Documentation

- [Hudu API Documentation](https://your-hudu-instance.com/developer)
- [Hudu Developer Portal](https://www.hudu.com/)

## Contributing

See the main [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

All contributions require a PRD in the `prd/` directory before implementation.

## Changelog

### 0.1.0 (2026-02-23)

- Initial release
- 6 skills: companies, assets, articles, passwords, websites, api-patterns
- 4 commands: lookup-asset, search-articles, get-password, find-company
