# Axcient Plugin

Claude Code plugin for the Axcient x360Recover BCDR platform.

## Overview

This plugin provides Claude with deep knowledge of Axcient x360Recover,
enabling:

- **Client Management** - List and inspect clients, health rollups, and protected-system counts across appliance-based, D2C, and cloud-archive tiers
- **Device Inventory** - Full device detail, health status, recovery-point freshness across local/vault/cloud tiers, and AutoVerify screenshot boot-test results
- **Backup Job Tracking** - Per-device job status, thresholds, and run history
- **Vault Management** - Private and cloud vault capacity, and connectivity-loss alert thresholds — including the one write tool in this plugin
- **Appliance Inventory** - Hardware detail and device rosters for appliance-based protection
- **API Integration** - x360Recover API authentication, error handling, and pagination patterns

This is a young, mostly-read-only public API. Of the 20 tools this server
registers, only two mutate anything: setting a vault's connectivity
threshold, and minting a new direct-to-cloud agent enrollment token.

## Prerequisites

### API Credentials

x360Recover authenticates via an API key:

1. Log into [partner.axcient.com](https://partner.axcient.com)
2. Navigate to **Settings > API Keys**
3. Click **Add API Key**, fill in the details, and generate

### Environment Variables

```bash
export AXCIENT_API_KEY="your-api-key"
```

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `AXCIENT_API_KEY` | Yes | | API key from Settings > API Keys |
| `AXCIENT_MCP_URL` | No | `https://conduit.wyre.ai/v1/axcient/mcp` | MCP server URL -- override to use a self-hosted gateway |

## Self-Hosted Gateway

If you run the [mcp-gateway](https://github.com/wyre-technology/mcp-gateway), set `AXCIENT_MCP_URL` to your gateway's endpoint:

```
AXCIENT_MCP_URL=https://your-gateway-domain/v1/axcient/mcp
```

**Setting env vars in Claude.ai:** Go to your org -> Settings -> Integrations -> Axcient -> Configure and add the variable.

**Setting env vars in Claude Code:** Add to `~/.claude/settings.json`:
```json
{
  "env": {
    "AXCIENT_MCP_URL": "https://your-gateway-domain/v1/axcient/mcp"
  }
}
```

## Installation

### Via MCP Gateway (Recommended)

Use the [MCP Gateway](https://conduit.wyre.ai) to connect -- paste your API key, and you're done.

### Self-Hosted (Docker)

Run the Axcient MCP server via Docker with the MCP Gateway self-hosted option. See the [MCP Gateway documentation](https://mcp.wyre.ai) for setup instructions.

### Claude Code CLI

Add the `.mcp.json` from this plugin to your project and set the environment variable:

```bash
export AXCIENT_API_KEY="your-api-key"
```

## Available Skills

| Skill | Description |
|-------|-------------|
| `api-patterns` | Authentication, the 20-tool catalog, call scoping, error handling |
| `clients` | Client health, protected-system counters, D2C enrollment |
| `devices` | Device inventory, health status, recovery points, AutoVerify |
| `jobs` | Backup job status, thresholds, and run history |
| `vaults` | Private/cloud vault capacity and connectivity thresholds |
| `appliances` | Appliance inventory and device rosters |

## Available Commands

| Command | Description |
|---------|-------------|
| `/backup-health-check` | Full health check for one device — status, recovery points, AutoVerify, job history |
| `/client-backup-overview` | Backup health rollup across every device for one client |

## Quick Start

### Check One Device's Backup Health

```
/backup-health-check --device_id 12345
```

### Client-Wide Backup Overview

```
/client-backup-overview --client_id 26
```

## Security Considerations

### Credential Handling

- Never commit API keys to version control
- Use environment variables for all credentials
- Rotate API keys periodically via partner.axcient.com
- Use the minimum scope necessary for your use case

### HTTP Transport Security

If using the MCP server over HTTP transport, ensure:
- TLS termination via a reverse proxy
- Restrict access to trusted networks
- Use authentication at the proxy layer

## Troubleshooting

### Authentication Errors

If you see "401 Unauthorized":
1. Verify `AXCIENT_API_KEY` is set correctly
2. Check that the API key has not been revoked in partner.axcient.com
3. Note that a malformed path parameter (e.g. a non-numeric ID) also
   surfaces as 401 in this API — see the `api-patterns` skill before
   assuming the key itself is bad

### Job History Looks Empty or Wrong

x360Recover's job-history endpoint has documented upstream reliability
issues. Corroborate against `axcient_get_device_restore_points` before
concluding a job has never run.

### Connection Issues

If the MCP server fails to connect:
1. Verify network connectivity to `https://conduit.wyre.ai`
2. Check that your API credentials are valid
3. Ensure the MCP Gateway service is running

## API Documentation

- [Axcient Developer Network](https://developer.axcient.com/x360recover/)
- [Axcient Support / Knowledge Base](https://help.axcient.com/)
- [Generating and Managing API Keys](https://help.axcient.com/360001190313-Axcient-x360Portal-/generating-and-managing-api-keys)

## Contributing

See the main [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

All contributions require a PRD in the `prd/` directory before implementation.

## Changelog

### 0.1.0

- Initial release
- 6 skills: api-patterns, clients, devices, jobs, vaults, appliances
- 2 commands: backup-health-check, client-backup-overview
