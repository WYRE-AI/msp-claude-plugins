# RunZero Plugin

Claude Code plugin for the RunZero asset discovery and network security platform.

## Overview

This plugin provides Claude with deep knowledge of RunZero, enabling:

- **Asset Inventory** - Discover, search, and inspect assets with OS fingerprinting and attribute details
- **Network Scanning** - Initiate scans, configure scan parameters, manage explorers
- **Site Management** - Organize assets into sites, manage scoping and agent deployment
- **Service Discovery** - Enumerate discovered services, ports, protocols, and vulnerabilities
- **Wireless Detection** - Discover wireless networks and detect rogue access points
- **Export & Reporting** - Leverage the RunZero Export API for bulk data retrieval and reporting

## Prerequisites

### API Credentials

RunZero authenticates via Bearer token using an Account API Token:

1. Log into the [RunZero Console](https://console.runzero.com)
2. Navigate to **Account > API Keys**
3. Generate an Account API Token

### Environment Variables

```bash
export RUNZERO_API_TOKEN="your-account-api-token"
```

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `RUNZERO_API_TOKEN` | Yes | | Account API Token from Account > API Keys |
| `RUNZERO_MCP_URL` | No | `https://conduit.wyre.ai/v1/runzero/mcp` | MCP server URL — override to use a self-hosted gateway |

## Self-Hosted Gateway

If you run the [mcp-gateway](https://github.com/wyre-technology/mcp-gateway), set `RUNZERO_MCP_URL` to your gateway's endpoint:

```
RUNZERO_MCP_URL=https://your-gateway-domain/v1/runzero/mcp
```

**Setting env vars in Claude.ai:** Go to your org -> Settings -> Integrations -> RunZero -> Configure and add the variable.

**Setting env vars in Claude Code:** Add to `~/.claude/settings.json`:
```json
{
  "env": {
    "RUNZERO_MCP_URL": "https://your-gateway-domain/v1/runzero/mcp"
  }
}
```

## Installation

### Via MCP Gateway (Recommended)

Use the [MCP Gateway](https://conduit.wyre.ai) to connect — paste your API token and you're done.

### Self-Hosted (Docker)

Run the RunZero MCP server via Docker with the MCP Gateway self-hosted option. See the [MCP Gateway documentation](https://mcp.wyre.ai) for setup instructions.

### Claude Code CLI

Add the `.mcp.json` from this plugin to your project and set the environment variables:

```bash
export RUNZERO_API_TOKEN="your-account-api-token"
```

## Available Skills

| Skill | Description |
|-------|-------------|
| `api-patterns` | Authentication, Export API, pagination, rate limiting, error handling |
| `assets` | Asset inventory, search, attributes, OS fingerprinting |
| `tasks` | Scan tasks, scheduling, explorers, scan configuration |
| `sites` | Organization sites, scoping, agent deployment |
| `services` | Discovered services, ports, protocols, vulnerabilities |
| `wireless` | Wireless network discovery, rogue AP detection |

## Available Commands

| Command | Description |
|---------|-------------|
| `/asset-search` | Search for assets by criteria (hostname, IP, OS, site) |
| `/scan-network` | Initiate a network scan on a site |
| `/site-overview` | Overview of a site's assets, services, and health |
| `/service-inventory` | List discovered services across assets |
| `/vuln-report` | Vulnerability summary report across sites |

## Quick Start

### Search for Assets

```
/asset-search --query "os:Windows Server"
```

### Initiate a Network Scan

```
/scan-network --site_id "site-abc" --targets "192.168.1.0/24"
```

### View Site Overview

```
/site-overview --site_id "site-abc"
```

### List Discovered Services

```
/service-inventory --protocol "rdp"
```

### Generate Vulnerability Report

```
/vuln-report
```

## Security Considerations

### Credential Handling

- Never commit API tokens to version control
- Use environment variables for all credentials
- Rotate API tokens periodically via the RunZero Console
- Use the minimum scope necessary for your use case
- Monitor API usage in the RunZero audit log

### HTTP Transport Security

If using the MCP server over HTTP transport, ensure:
- TLS termination via a reverse proxy
- Restrict access to trusted networks
- Use authentication at the proxy layer

## Troubleshooting

### Authentication Errors

If you see "401 Unauthorized":
1. Verify `RUNZERO_API_TOKEN` is set correctly
2. Check that the API token has not been revoked
3. Regenerate the token at RunZero Console > Account > API Keys

### Rate Limits

RunZero enforces API rate limits:
1. Space out requests when iterating over large datasets
2. Use the Export API for bulk data retrieval
3. If rate limited (HTTP 429), wait before retrying

### Connection Issues

If the MCP server fails to connect:
1. Verify network connectivity to `https://conduit.wyre.ai`
2. Check that your API token is valid
3. Ensure the MCP Gateway service is running

## API Documentation

- [RunZero API Documentation](https://www.runzero.com/docs/api/)
- [RunZero Knowledge Base](https://www.runzero.com/docs/)

## Contributing

See the main [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

All contributions require a PRD in the `prd/` directory before implementation.

## Changelog

### 0.1.0 (2026-03-27)

- Initial release
- 6 skills: api-patterns, assets, tasks, sites, services, wireless
- 5 commands: asset-search, scan-network, site-overview, service-inventory, vuln-report
