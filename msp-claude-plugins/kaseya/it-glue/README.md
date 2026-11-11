# Kaseya IT Glue Plugin

Claude Code plugin for Kaseya IT Glue documentation platform integration.

## Overview

This plugin provides Claude with deep knowledge of IT Glue, enabling:

- **Organization Management** - Find and manage client organizations
- **Configuration Items** - Track servers, workstations, network devices, and other assets
- **Contact Management** - Access client contacts and communication details
- **Password Management** - Securely retrieve and manage credentials
- **Documentation** - Search and manage documents and runbooks
- **Flexible Assets** - Work with custom documentation templates

## Prerequisites

### API Credentials

You need an IT Glue API key with appropriate permissions:

1. Log into IT Glue as an administrator
2. Navigate to Account > API Keys
3. Create a new API key with required permissions
4. Note your region (US, EU, or AU)

### Connect through Conduit

This plugin ships no `.mcp.json` and reads no environment variables. Connect IT Glue once in Conduit (**Connections → IT Glue**, slug `itglue`); Conduit stores the credentials and injects them on every request. Then add the unified connector `https://conduit.wyre.ai/v1/mcp` to your MCP client (or install the `wyre-gateway` plugin); your client signs in to Conduit with OAuth.

| Conduit connection field |
|---|
| API Key |
| Region |
| API host |

## Installation

```
/plugin marketplace add WYRE-AI/msp-claude-plugins
/plugin install itglue@msp-claude-plugins
```

Then connect IT Glue in Conduit (see **Connect through Conduit**). The plugin adds skills and commands; the tools come from the Conduit connector.

## Available Skills

| Skill | Description |
|-------|-------------|
| `organizations` | Organization (company/client) management |
| `configurations` | Configuration item (asset) management |
| `contacts` | Contact management |
| `passwords` | Secure credential storage and retrieval |
| `documents` | Documentation management |
| `flexible-assets` | Custom structured documentation |
| `api-patterns` | IT Glue API patterns and best practices |

## Available Commands

| Command | Description |
|---------|-------------|
| `/lookup-asset` | Find a configuration by name, hostname, serial, or IP |
| `/search-docs` | Search documentation by keyword |
| `/get-password` | Retrieve a password (with security logging) |
| `/find-organization` | Find an organization by name |

## Quick Start

### Find an Organization



### Look Up an Asset



### Search Documentation



### Get a Password



## Working with Flexible Assets

Flexible asset type IDs are **instance-specific** — every IT Glue account has different IDs. Always discover types before searching:



## Documents vs Flexible Assets

IT Glue has two documentation systems:

- **Documents** — Free-form HTML documents (runbooks, SOPs, network diagrams). Requires the Documents module to be enabled on your IT Glue subscription. Returns 404 if not enabled.
- **Flexible Assets** — Structured templates with typed fields. Available on all plans. Most documentation lives here.

If `search_documents` returns 404, use `list_flexible_asset_types` + `search_flexible_assets` instead.

## Security Considerations

### Password Access

- All password access is logged in IT Glue's audit trail
- Organization parameter is required for password lookups
- Passwords are masked by default; use `--show` to reveal
- Review password access logs regularly

### API Key Security

- Never commit API keys to version control
- Keep credentials in the Conduit connection, never in files, environment variables or chat
- Rotate API keys periodically
- Use minimum required permissions

## Regional Endpoints

IT Glue operates in multiple regions:

| Region | Base URL | Conduit Region value |
|--------|----------|------------------------|
| US | `https://api.itglue.com` | `us` (default) |
| EU | `https://api.eu.itglue.com` | `eu` |
| AU | `https://api.au.itglue.com` | `au` |

## Self-Hosted Gateway

There is no per-plugin URL setting, and setting an environment variable does not register an MCP server. To use your own gateway instead of Conduit, register it as an MCP server in your client, for example `claude mcp add --transport http itglue https://your-gateway-domain/v1/itglue/mcp`. The gateway then holds the IT Glue credentials, not the client.

## API Rate Limits

IT Glue enforces rate limits:

- 3000 requests per 5 minutes
- ~100 requests per second burst limit

## Troubleshooting

### Authentication Errors (401)

1. Check the IT Glue connection in Conduit (**Connections → IT Glue**): reconnect it, or re-enter the credentials
2. Check the API key hasn't expired
3. Confirm the key has required permissions

### Wrong Region (404 on valid resources)

1. Verify the Region on the IT Glue connection in Conduit matches your IT Glue account
2. Try `us`, `eu`, or `au` if unsure

### Documents return 404

Your IT Glue subscription doesn't include the Documents module. Use `search_flexible_assets` instead — that's where documentation lives on most plans.

### Rate Limiting (429)

1. Wait for the rate limit window to reset
2. Reduce request frequency
3. Use pagination for large data sets

## API Documentation

- [IT Glue API Documentation](https://api.itglue.com/developer/)
- [JSON:API Specification](https://jsonapi.org/)

## Contributing

See the main [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

## Changelog

### 1.0.2 (2026-03-05)

- Added `list_flexible_asset_types` tool to discover type IDs
- Fixed flexible assets skill to document type discovery workflow
- Fixed documents skill to use correct org-scoped endpoint

### 1.0.1 (2026-03-05)

- Fixed documents skill: use `/organizations/{id}/relationships/documents` (not top-level `/documents`)

### 1.0.0 (2026-02-04)

- Initial release
- 7 skills: organizations, configurations, contacts, passwords, documents, flexible-assets, api-patterns
- 4 commands: lookup-asset, search-docs, get-password, find-organization
