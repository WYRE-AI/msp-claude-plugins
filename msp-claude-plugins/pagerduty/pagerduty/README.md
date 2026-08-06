# PagerDuty Plugin

Claude Code plugin for the PagerDuty incident management and on-call scheduling platform.

## Overview

This plugin provides Claude with deep knowledge of PagerDuty, enabling:

- **Incident Management** - Create, triage, escalate, acknowledge, and resolve incidents
- **On-Call Scheduling** - View on-call schedules, overrides, and escalation policies
- **Service Health** - Monitor service catalog, dependencies, and maintenance windows
- **Alert Management** - Manage alerts, grouping rules, and suppression
- **Analytics** - Track MTTA/MTTR metrics, incident frequency, and team performance

## Prerequisites

### API Credentials

PagerDuty authenticates via a User API Token:

1. Log into [PagerDuty](https://app.pagerduty.com)
2. Navigate to **My Profile > User Settings > API Access**
3. Click **Create New API Key**
4. Copy the generated token

### Environment Variables

```bash
export PAGERDUTY_API_TOKEN="your-api-token"
```

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PAGERDUTY_API_TOKEN` | Yes | | User API Token from My Profile > User Settings > API Access |
| `PAGERDUTY_MCP_URL` | No | `https://conduit.wyre.ai/v1/pagerduty/mcp` | MCP server URL -- override to use a self-hosted gateway |

## Self-Hosted Gateway

If you run the [mcp-gateway](https://github.com/wyre-technology/mcp-gateway), set `PAGERDUTY_MCP_URL` to your gateway's endpoint:

```
PAGERDUTY_MCP_URL=https://your-gateway-domain/v1/pagerduty/mcp
```

**Setting env vars in Claude.ai:** Go to your org > Settings > Integrations > PagerDuty > Configure and add the variable.

**Setting env vars in Claude Code:** Add to `~/.claude/settings.json`:
```json
{
  "env": {
    "PAGERDUTY_MCP_URL": "https://your-gateway-domain/v1/pagerduty/mcp"
  }
}
```

## Installation

### Via MCP Gateway (Recommended)

Use the [MCP Gateway](https://conduit.wyre.ai) to connect -- paste your API token and you're done.

### Self-Hosted (Docker)

Run the PagerDuty MCP server via Docker with the MCP Gateway self-hosted option. See the [MCP Gateway documentation](https://mcp.wyre.ai) for setup instructions.

### Claude Code CLI

Add the `.mcp.json` from this plugin to your project and set the environment variables:

```bash
export PAGERDUTY_API_TOKEN="your-api-token"
```

## Available Skills

| Skill | Description |
|-------|-------------|
| `api-patterns` | REST API v2 patterns, authentication, pagination, rate limiting, error handling |
| `incidents` | Incident lifecycle -- creation, acknowledgement, escalation, resolution |
| `services` | Service catalog, dependencies, integrations, and maintenance windows |
| `oncall` | On-call schedules, overrides, and escalation policies |
| `alerts` | Alert management, grouping, suppression, and event routing |
| `analytics` | Incident analytics, MTTA/MTTR metrics, and reporting |

## Available Commands

| Command | Description |
|---------|-------------|
| `/incident-triage` | Triage current open incidents by urgency and priority |
| `/oncall-schedule` | Show who is currently on call |
| `/create-incident` | Create a new incident on a service |
| `/escalate-incident` | Escalate an incident to the next level |
| `/service-health` | Check service health and recent incident activity |

## Quick Start

### Triage Open Incidents

```
/incident-triage
```

### Check Who Is On Call

```
/oncall-schedule
```

### Create a New Incident

```
/create-incident --service_name "Payment API" --title "High error rate on checkout" --urgency high
```

### Escalate an Incident

```
/escalate-incident --incident_id "P1234ABC"
```

### Check Service Health

```
/service-health --service_name "Payment API"
```

## Security Considerations

### Credential Handling

- Never commit API tokens to version control
- Use environment variables for all credentials
- Rotate API tokens periodically via the PagerDuty dashboard
- Use the minimum scope necessary for your use case
- Monitor API usage in the PagerDuty audit log

### HTTP Transport Security

If using the MCP server over HTTP transport, ensure:
- TLS termination via a reverse proxy
- Restrict access to trusted networks
- Use authentication at the proxy layer

## Troubleshooting

### Authentication Errors

If you see "401 Unauthorized":
1. Verify `PAGERDUTY_API_TOKEN` is set correctly
2. Check that the API token has not been revoked
3. Regenerate the token at My Profile > User Settings > API Access
4. Ensure the token type is correct (User Token vs. Account-level API Key)

### Rate Limits

PagerDuty enforces rate limits (varies by endpoint, typically 960 requests/minute for most REST API endpoints):
1. Space out requests when iterating over large datasets
2. Use pagination to limit result sizes
3. If rate limited (HTTP 429), wait before retrying using the `Retry-After` header

### Connection Issues

If the MCP server fails to connect:
1. Verify network connectivity to `https://conduit.wyre.ai`
2. Check that your API token is valid
3. Ensure the MCP Gateway service is running
4. For EU accounts, verify the correct region URL is configured

## API Documentation

- [PagerDuty REST API v2 Reference](https://developer.pagerduty.com/api-reference/)
- [PagerDuty Developer Documentation](https://developer.pagerduty.com/docs/)
- [PagerDuty Knowledge Base](https://support.pagerduty.com/)

## Contributing

See the main [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

All contributions require a PRD in the `prd/` directory before implementation.

## Changelog

### 0.1.0 (2026-03-27)

- Initial release
- 6 skills: api-patterns, incidents, services, oncall, alerts, analytics
- 5 commands: incident-triage, oncall-schedule, create-incident, escalate-incident, service-health
