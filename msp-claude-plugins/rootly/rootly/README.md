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

If you run the [mcp-gateway](https://github.com/WYRE-AI/mcp-gateway), set `ROOTLY_MCP_URL` to your gateway's endpoint:

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

Rootly is a hosted vendor with no bundled `.mcp.json` in this plugin -- it is routed entirely through the MCP Gateway. Connect via the [MCP Gateway](https://conduit.wyre.ai) as described above, or point `ROOTLY_MCP_URL` at your own gateway deployment and set the environment variable:

```bash
export ROOTLY_API_TOKEN="your-api-token"
```

## Available Skills

| Skill | Description |
|-------|-------------|
| `api-patterns` | Authentication, API structure, pagination, rate limiting, error handling |
| `incidents` | Incident lifecycle -- creation, triage, severity, roles, timeline, resolution |
| `postmortems` | Retrospective processes/steps, action items, and blameless review |
| `services` | Service catalog, dependencies, ownership, and health status |
| `alerts` | Alert routing, escalation policies, and monitoring integrations |
| `workflows` | Automated workflows, triggers, actions, and conditions |
| `oncall` | On-call handoffs, shift metrics, and burnout health risk |

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

All notable changes to this plugin are documented here, following
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) conventions.

### Unreleased

- Fixed a fleet-wide tool-name-drift audit finding (#178): the `postmortems`, `services`,
  `alerts`, and `workflows` skills documented an invented Rootly tool surface that matched
  neither the local `rootly-mcp` repo nor the real hosted `mcp.rootly.com` server (253
  tools). Rewrote all four skills, plus `api-patterns` and `incidents`, against verified
  real tool names (`list_incidents`, `create_incident`, `list_retrospective_processes`,
  `get_incident_retrospective_step`, `list_services`, `list_alerts`, `list_workflows`,
  etc.)
- Corrected `api-patterns`' "25 dynamically generated tools" claim to the real ~253-tool
  hosted surface
- Removed the invented "service tier" and single-object "postmortem" claims that have no
  real Rootly API equivalent, in favor of Rootly's actual ownership/dependency and
  retrospective-process/step models
- Added `mcp__rootly__*` MCP tool access to both agents' frontmatter so they can actually
  reach the Rootly tools their prose references
- Corrected this README's Claude Code CLI install instructions (no `.mcp.json` ships with
  this plugin -- Rootly is routed entirely through the MCP Gateway) and added the missing
  `oncall` skill to the skills table

### 0.2.11 (2026-08-27)

- docs: update wyre-technology org refs to WYRE-AI

### 0.2.10 (2026-08-17)

- fix: align plugin name to Conduit vendor slug for catalog linkage

### 0.2.9 (2026-08-06)

- fix(governance): make every revocation and rotation claim true

### 0.2.8 (2026-08-06)

- fix(docs): repoint reader-facing gateway prose from mcp.wyre.ai to Conduit

### 0.2.7 (2026-08-05)

- fix(governance): re-tier finance/PSA docs against Conduit's real model

### 0.2.6 (2026-08-04)

- fix(skills): repair dangling skill references

### 0.2.5 (2026-08-04)

- fix(skills): make anti-trigger routing reciprocal where confusion runs both ways

### 0.2.4 (2026-08-04)

- feat(psa-incident): add anti-triggers and governance docs

### 0.2.3 (2026-07-27)

- refactor(skills): restructure all skills per Claude 5 context-engineering guidance

### 0.2.2 (2026-07-13)

- refactor: migrate plugin frontmatter to official Claude Code formats

### 0.2.1 (2026-04-15)

- fix(agents): use JSON array format for `tools` field and `model: inherit`

### 0.2.0 (2026-04-15)

- chore: bump plugin version to trigger update detection (agents release)

### 0.1.0 (2026-03-27)

- Initial release
- 6 skills: api-patterns, incidents, postmortems, services, alerts, workflows
- 5 commands: incident-triage, create-incident, postmortem-summary, service-status, action-items
