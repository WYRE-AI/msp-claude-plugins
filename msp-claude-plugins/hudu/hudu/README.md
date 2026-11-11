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

### Connect through Conduit

This plugin ships no `.mcp.json` and reads no environment variables. Connect Hudu once in Conduit (**Connections → Hudu (API Key)**, slug `hudu`); Conduit stores the credentials and injects them on every request. Then add the unified connector `https://conduit.wyre.ai/v1/mcp` to your MCP client (or install the `wyre-gateway` plugin); your client signs in to Conduit with OAuth.

| Conduit connection field |
|---|
| Base URL |
| API Key |

## Self-Hosted Gateway

There is no per-plugin URL setting, and setting an environment variable does not register an MCP server. To use your own gateway instead of Conduit, register it as an MCP server in your client, for example `claude mcp add --transport http hudu https://your-gateway-domain/v1/hudu/mcp`. The gateway then holds the Hudu credentials, not the client.

## Installation

```
/plugin marketplace add WYRE-AI/msp-claude-plugins
/plugin install hudu@msp-claude-plugins
```

Then connect Hudu in Conduit (see **Connect through Conduit**). The plugin adds skills and commands; the tools come from the Conduit connector.

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
- Keep credentials in the Conduit connection, never in files, environment variables or chat
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
1. Check the Hudu connection in Conduit (**Connections → Hudu (API Key)**): reconnect it, or re-enter the credentials
2. Check the API key hasn't been revoked
3. Confirm the key has required permissions
4. Verify your IP is on the API key's whitelist (if configured)

### Wrong Base URL

If you see "404 Not Found" or connection errors:
1. Verify the Base URL on the Hudu connection in Conduit matches your Hudu instance URL
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
