# Better Stack Plugin

Claude Code plugin for the Better Stack observability platform (formerly Logtail/Better Uptime).

## Overview

This plugin provides Claude with deep knowledge of Better Stack, enabling:

- **Uptime Monitoring** - Create and manage uptime monitors, heartbeats, and check types
- **Incident Management** - Triage, acknowledge, and resolve incidents
- **Status Pages** - Manage status pages, components, and maintenance windows
- **On-Call Schedules** - Configure on-call rotations and escalation policies
- **Log Management** - Search and query logs via Logtail
- **API Patterns** - Authentication, pagination, rate limiting, and error handling

## Prerequisites

### API Credentials

Better Stack authenticates via a Bearer token:

1. Log into [Better Stack](https://betterstack.com)
2. Navigate to **API tokens** in your account settings
3. Generate a new API token

### Environment Variables

```bash
export BETTERSTACK_API_TOKEN="your-api-token"
```

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `BETTERSTACK_API_TOKEN` | Yes | | API token from Better Stack > API tokens |
| `BETTERSTACK_MCP_URL` | No | `https://conduit.wyre.ai/v1/betterstack/mcp` | MCP server URL -- override to use a self-hosted gateway |

## Self-Hosted Gateway

If you run the [mcp-gateway](https://github.com/wyre-technology/mcp-gateway), set `BETTERSTACK_MCP_URL` to your gateway's endpoint:

```
BETTERSTACK_MCP_URL=https://your-gateway-domain/v1/betterstack/mcp
```

**Setting env vars in Claude.ai:** Go to your org > Settings > Integrations > Better Stack > Configure and add the variable.

**Setting env vars in Claude Code:** Add to `~/.claude/settings.json`:
```json
{
  "env": {
    "BETTERSTACK_MCP_URL": "https://your-gateway-domain/v1/betterstack/mcp"
  }
}
```

## Installation

### Via MCP Gateway (Recommended)

Use the [MCP Gateway](https://conduit.wyre.ai) to connect -- paste your API token and you're done.

### Self-Hosted (Docker)

Run the Better Stack MCP server via Docker with the MCP Gateway self-hosted option. See the [MCP Gateway documentation](https://mcp.wyre.ai) for setup instructions.

### Claude Code CLI

Add the `.mcp.json` from this plugin to your project and set the environment variables:

```bash
export BETTERSTACK_API_TOKEN="your-api-token"
```

## Available Skills

| Skill | Description |
|-------|-------------|
| `api-patterns` | Authentication, API structure, pagination, rate limiting, error handling |
| `monitors` | Uptime monitors, heartbeats, check types, and monitor groups |
| `incidents` | Incident lifecycle -- triage, acknowledgment, resolution |
| `status-pages` | Status page management, components, and maintenance windows |
| `oncall` | On-call schedules, escalation policies, and team management |
| `logging` | Log management, queries, sources, and alerting via Logtail |

## Available Commands

| Command | Description |
|---------|-------------|
| `/monitor-status` | Check all monitor statuses and identify downtime |
| `/create-monitor` | Create a new uptime monitor |
| `/incident-triage` | Triage current open incidents by severity |
| `/search-logs` | Search logs via Logtail with structured queries |
| `/status-page-update` | Update status page components and post maintenance |

## Quick Start

### Check Monitor Status

```
/monitor-status
```

### Create a New Monitor

```
/create-monitor --url "https://example.com" --check_type "http"
```

### Triage Incidents

```
/incident-triage
```

### Search Logs

```
/search-logs --query "level:error" --source "production"
```

### Update Status Page

```
/status-page-update --status_page_id "12345"
```

## Security Considerations

### Credential Handling

- Never commit API tokens to version control
- Use environment variables for all credentials
- Rotate API tokens periodically via Better Stack settings
- Use the minimum scope necessary for your use case
- Monitor API usage in the Better Stack audit log

### HTTP Transport Security

If using the MCP server over HTTP transport, ensure:
- TLS termination via a reverse proxy
- Restrict access to trusted networks
- Use authentication at the proxy layer

## Troubleshooting

### Authentication Errors

If you see "401 Unauthorized":
1. Verify `BETTERSTACK_API_TOKEN` is set correctly
2. Check that the API token has not been revoked
3. Regenerate the token at Better Stack > API tokens

### Rate Limits

Better Stack enforces API rate limits:
1. Space out requests when iterating over large datasets
2. Use pagination to limit result sizes
3. If rate limited (HTTP 429), wait before retrying

### Connection Issues

If the MCP server fails to connect:
1. Verify network connectivity to `https://conduit.wyre.ai`
2. Check that your API token is valid
3. Ensure the MCP Gateway service is running

## API Documentation

- [Better Stack API Documentation](https://betterstack.com/docs/uptime/api/)
- [Logtail API Documentation](https://betterstack.com/docs/logs/api/)
- [Better Stack MCP Integration](https://betterstack.com/docs/getting-started/integrations/mcp/)

## Contributing

See the main [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

All contributions require a PRD in the `prd/` directory before implementation.

## Changelog

### 0.1.0 (2026-03-27)

- Initial release
- 6 skills: api-patterns, monitors, incidents, status-pages, oncall, logging
- 5 commands: monitor-status, create-monitor, incident-triage, search-logs, status-page-update
