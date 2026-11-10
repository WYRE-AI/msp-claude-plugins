# Huntress Plugin

Claude Code plugin for the Huntress managed threat detection and response platform.

## Overview

This plugin provides Claude with deep knowledge of Huntress, enabling:

- **Incident Management** - Triage, investigate, and resolve incidents with remediation workflows
- **Escalation Handling** - Review and resolve security escalations from Huntress SOC
- **Endpoint Agent Management** - Monitor agent health and inventory across organizations
- **Organization Management** - CRUD operations for MSP client organizations
- **Billing & Reporting** - Generate billing and summary reports for client invoicing
- **Security Signals** - Monitor and investigate security signals across the fleet

## Prerequisites

### API Credentials

Huntress authenticates via HTTP Basic Auth using an API key and secret:

1. Log into the [Huntress Dashboard](https://dashboard.huntress.io)
2. Navigate to **Settings > API Credentials**
3. Generate an API key and secret pair

### Connect through Conduit

This plugin ships no `.mcp.json` and reads no environment variables. Connect Huntress once in Conduit (**Connections → Huntress**, slug `huntress`); Conduit stores the credentials and injects them on every request. Then add the unified connector `https://conduit.wyre.ai/v1/mcp` to your MCP client (or install the `wyre-gateway` plugin); your client signs in to Conduit with OAuth.

| Conduit connection field |
|---|
| API Key |
| API Secret |

## Self-Hosted Gateway

There is no per-plugin URL setting, and setting an environment variable does not register an MCP server. To use your own gateway instead of Conduit, register it as an MCP server in your client, for example `claude mcp add --transport http huntress https://your-gateway-domain/v1/huntress/mcp`. The gateway then holds the Huntress credentials, not the client.

## Installation

### Via MCP Gateway (Recommended)

Use the [MCP Gateway](https://conduit.wyre.ai) to connect — paste your API key and secret and you're done.

### Claude Code CLI

This plugin does not ship its own `.mcp.json`. Install the `wyre-gateway` plugin (or any workflow pack), which connects Claude Code to Conduit at `https://conduit.wyre.ai/v1/mcp`, then connect Huntress in the Conduit web UI (`/connect/huntress`). Conduit stores the credentials and injects them on every request, so there are no environment variables to set.

## Available Skills

| Skill | Description |
|-------|-------------|
| `api-patterns` | Authentication, API structure, pagination, rate limiting, error handling |
| `agents` | Endpoint agent management, listing, filtering, and health monitoring |
| `organizations` | CRUD operations for organizations and key-based management |
| `incidents` | Incident lifecycle — triage, investigation, resolution, and remediations |
| `escalations` | Escalation management — review and resolve SOC escalations |
| `billing` | Billing and summary reports for MSP client reporting |
| `signals` | Security signals monitoring and investigation |

## Available Commands

| Command | Description |
|---------|-------------|
| `/incident-triage` | Triage open incidents by severity |
| `/investigate-incident` | Deep dive into a specific incident with remediations |
| `/org-health` | Organization health check (agents, incidents, escalations) |
| `/agent-inventory` | List and filter agents across organizations |
| `/billing-report` | Generate billing summary for a period |
| `/resolve-escalation` | Review and resolve an escalation |

## Quick Start

### Triage Open Incidents

```
/incident-triage
```

### Investigate a Specific Incident

```
/investigate-incident --incident_id "12345"
```

### Check Organization Health

```
/org-health --organization_id "67890"
```

### Generate Billing Report

```
/billing-report
```

## Security Considerations

### Credential Handling

- Never commit API keys or secrets to version control
- Use environment variables for all credentials
- Rotate API credentials periodically via the Huntress Dashboard
- Use the minimum scope necessary for your use case
- Monitor API usage in the Huntress audit log

### HTTP Transport Security

If using the MCP server over HTTP transport, ensure:
- TLS termination via a reverse proxy
- Restrict access to trusted networks
- Use authentication at the proxy layer

## Troubleshooting

### Authentication Errors

If you see "401 Unauthorized":
1. Verify `HUNTRESS_API_KEY` and `HUNTRESS_API_SECRET` are set correctly
2. Check that the API credentials have not been revoked
3. Regenerate credentials at Huntress Dashboard > Settings > API Credentials

### Rate Limits

Huntress enforces a rate limit of 60 requests per minute:
1. Space out requests when iterating over large datasets
2. Use pagination to limit result sizes
3. If rate limited (HTTP 429), wait before retrying

### Connection Issues

If the MCP server fails to connect:
1. Verify network connectivity to `https://conduit.wyre.ai`
2. Check that your API credentials are valid
3. Ensure the MCP Gateway service is running

## API Documentation

- [Huntress API Documentation](https://api.huntress.io/docs)
- [Huntress Knowledge Base](https://support.huntress.io/)

## Contributing

See the main [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

All contributions require a PRD in the `prd/` directory before implementation.

## Changelog

### 0.1.0 (2026-02-26)

- Initial release
- 7 skills: api-patterns, agents, organizations, incidents, escalations, billing, signals
- 6 commands: incident-triage, investigate-incident, org-health, agent-inventory, billing-report, resolve-escalation
