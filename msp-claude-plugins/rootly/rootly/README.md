# Rootly Plugin

Claude Code plugin for the Rootly incident management and response platform.

## Overview

This plugin provides Claude with deep knowledge of Rootly, enabling:

- **Incident Management** - Create, triage, escalate, and resolve incidents with full lifecycle tracking
- **Postmortems** - Generate retrospectives, track action items, and apply templates
- **Service Catalog** - Manage services, dependencies, ownership, and health status
- **Alert Routing** - Configure alert rules, escalation policies, and monitoring integrations
- **Workflow Automation** - Build and manage automated incident response workflows

## Prerequisites

### API Credentials

Rootly authenticates via Bearer token using an API key:

1. Log into [Rootly](https://rootly.com)
2. Navigate to **Account > Manage API Keys**
3. Generate an API token

### Environment Variables

```bash
export ROOTLY_API_TOKEN="your-api-token"
```

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `ROOTLY_API_TOKEN` | Yes | | API token from Account > Manage API Keys |
| `ROOTLY_MCP_URL` | No | `https://conduit.wyre.ai/v1/rootly/mcp` | MCP server URL -- override to use a self-hosted gateway |

## Self-Hosted Gateway

If you run the [mcp-gateway](https://github.com/wyre-technology/mcp-gateway), set `ROOTLY_MCP_URL` to your gateway's endpoint:

```
ROOTLY_MCP_URL=https://your-gateway-domain/v1/rootly/mcp
```

**Setting env vars in Claude.ai:** Go to your org > Settings > Integrations > Rootly > Configure and add the variable.

**Setting env vars in Claude Code:** Add to `~/.claude/settings.json`:
```json
{
  "env": {
    "ROOTLY_MCP_URL": "https://your-gateway-domain/v1/rootly/mcp"
  }
}
```

## Installation

### Via MCP Gateway (Recommended)

Use the [MCP Gateway](https://conduit.wyre.ai) to connect -- paste your API token and you're done.

### Direct Connection

Rootly hosts their own MCP server at `https://mcp.rootly.com`. See [Rootly MCP docs](https://docs.rootly.com/integrations/mcp-server) for direct setup.

### Claude Code CLI

Add the `.mcp.json` from this plugin to your project and set the environment variables:

```bash
export ROOTLY_API_TOKEN="your-api-token"
```

## Available Skills

| Skill | Description |
|-------|-------------|
| `api-patterns` | Authentication, API structure, pagination, rate limiting, error handling |
| `incidents` | Incident lifecycle -- creation, triage, severity, roles, timeline, resolution |
| `postmortems` | Retrospectives, action items, templates, and blameless review |
| `services` | Service catalog, dependencies, ownership, and health status |
| `alerts` | Alert routing, escalation policies, and monitoring integrations |
| `workflows` | Automated workflows, triggers, actions, and conditions |

## Available Commands

| Command | Description |
|---------|-------------|
| `/incident-triage` | Triage active incidents by severity and status |
| `/create-incident` | Create a new incident with title, severity, and services |
| `/postmortem-summary` | Generate a postmortem summary for a resolved incident |
| `/service-status` | Check service health and dependency status |
| `/action-items` | List outstanding action items from postmortems |

## Quick Start

### Triage Active Incidents

```
/incident-triage
```

### Create a New Incident

```
/create-incident --title "Database connection pool exhaustion" --severity critical
```

### Generate Postmortem Summary

```
/postmortem-summary --incident_id "inc-123"
```

### Check Service Health

```
/service-status
```

### List Outstanding Action Items

```
/action-items
```

## Security Considerations

### Credential Handling

- Never commit API tokens to version control
- Use environment variables for all credentials
- Rotate API tokens periodically via Rootly Account settings
- Use the minimum scope necessary for your use case
- Monitor API usage in Rootly audit logs

### HTTP Transport Security

If using the MCP server over HTTP transport, ensure:
- TLS termination via a reverse proxy
- Restrict access to trusted networks
- Use authentication at the proxy layer

## Troubleshooting

### Authentication Errors

If you see "401 Unauthorized":
1. Verify `ROOTLY_API_TOKEN` is set correctly
2. Check that the API token has not been revoked
3. Regenerate the token at Account > Manage API Keys

### Rate Limits

If you encounter HTTP 429 responses:
1. Space out requests when iterating over large datasets
2. Use pagination to limit result sizes
3. Wait before retrying with exponential backoff

### Connection Issues

If the MCP server fails to connect:
1. Verify network connectivity to `https://conduit.wyre.ai`
2. Check that your API token is valid
3. Ensure the MCP Gateway service is running

## API Documentation

- [Rootly API Documentation](https://docs.rootly.com/api)
- [Rootly MCP Server](https://docs.rootly.com/integrations/mcp-server)
- [Rootly Knowledge Base](https://docs.rootly.com)

## Contributing

See the main [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

All contributions require a PRD in the `prd/` directory before implementation.

## Changelog

### 0.1.0 (2026-03-27)

- Initial release
- 6 skills: api-patterns, incidents, postmortems, services, alerts, workflows
- 5 commands: incident-triage, create-incident, postmortem-summary, service-status, action-items
