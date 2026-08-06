# Blumira Plugin

Claude Code plugin for Blumira SIEM platform integration via the Blumira MCP server.

## Overview

This plugin provides Claude with deep knowledge of Blumira, enabling:

- **Finding Management** - Triage, investigate, resolve, assign, and comment on security findings
- **MSP Multi-Tenant Operations** - Manage findings, devices, and users across multiple client organizations
- **Device & Agent Inventory** - Monitor agent deployments, device health, and coverage gaps
- **User Management** - List and look up users for finding assignment and access auditing
- **Resolution Workflows** - Apply proper resolution types (Valid, Not Applicable, False Positive) with audit trails
- **Security Posture Analysis** - Cross-cutting views of open findings, severity distribution, and agent coverage

> **Note:** This plugin supports both read and write operations. Resolution, assignment, and commenting actions modify finding state. Review actions before confirming.

## Prerequisites

### JWT Token

Blumira MCP authenticates with a JWT token:

1. Log into your Blumira Portal
2. Navigate to **Settings > API Access**
3. Generate a JWT token with appropriate scope

> **IMPORTANT:** For MSP operations, the token must have MSP-level permissions. Org-level tokens only access the single organization.

### Environment Variables

```bash
export BLUMIRA_JWT_TOKEN="your-jwt-token"
```

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `BLUMIRA_JWT_TOKEN` | Yes | | JWT token from Settings > API Access |
| `BLUMIRA_MCP_URL` | No | `https://conduit.wyre.ai/v1/blumira/mcp` | MCP server URL — override to use a self-hosted gateway |

## Self-Hosted Gateway

If you run the [mcp-gateway](https://github.com/wyre-technology/mcp-gateway), set `BLUMIRA_MCP_URL` to your gateway's endpoint:

```
BLUMIRA_MCP_URL=https://your-gateway-domain/v1/blumira/mcp
```

**Setting env vars in Claude.ai:** Go to your org → Settings → Integrations → Blumira → Configure and add the variable.

**Setting env vars in Claude Code:** Add to `~/.claude/settings.json`:
```json
{
  "env": {
    "BLUMIRA_MCP_URL": "https://your-gateway-domain/v1/blumira/mcp"
  }
}
```

## Installation

### Via MCP Gateway (Recommended)

Use the [MCP Gateway](https://conduit.wyre.ai) to connect — just paste your JWT token and you're done.

### Self-Hosted (Docker)

Add to your MCP configuration:

```json
{
  "mcpServers": {
    "blumira": {
      "type": "http",
      "url": "https://conduit.wyre.ai/v1/blumira/mcp",
      "headers": {
        "X-Blumira-JWT-Token": "${BLUMIRA_JWT_TOKEN}"
      }
    }
  }
}
```

### Claude Code CLI

Install as a Claude Code plugin:

```bash
claude plugin add /path/to/msp-claude-plugins/blumira/blumira
```

## Available Skills

| Skill | Description |
|-------|-------------|
| `api-patterns` | JWT auth, dual path groups (org vs MSP), rich filtering syntax, pagination, and error handling |
| `findings` | Finding lifecycle — listing, filtering, investigating, resolving, assigning, and commenting |
| `agents` | Device inventory and agent key management, monitoring agent health |
| `users` | User listing and lookup for finding assignment and access auditing |
| `resolutions` | Resolution types (Valid, Not Applicable, False Positive) and their impact on metrics |
| `msp` | MSP multi-tenant operations — account management, cross-account queries, per-account management |

## Available Commands

| Command | Description |
|---------|-------------|
| `/finding-triage` | Triage open findings by severity |
| `/investigate-finding` | Deep investigation of a specific finding with details and comments |
| `/resolve-finding` | Resolve a finding with proper resolution type and notes |
| `/msp-overview` | MSP dashboard — accounts with open finding counts |
| `/agent-inventory` | List devices and agents across the organization |
| `/security-posture` | Overall security posture review with severity distribution |

## Quick Start

### Triage Open Findings

```
/finding-triage
```

### Investigate a Specific Finding

```
/investigate-finding --finding_id "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
```

### Resolve a Finding

```
/resolve-finding --finding_id "a1b2c3d4-..." --resolution_type valid --notes "Confirmed and remediated."
```

### MSP Dashboard

```
/msp-overview
```

### Review Security Posture

```
/security-posture --days 7
```

## Security Considerations

### Token Handling

- Never commit JWT tokens to version control
- Use environment variables for all credentials
- Rotate tokens periodically via the Blumira Portal
- Use minimum necessary scope — org tokens for single-org, MSP tokens only when needed
- Monitor token usage in the Blumira audit log

### Write Operations

Unlike read-only plugins, Blumira supports write operations:
- **Resolving findings** changes their status permanently
- **Assigning findings** notifies the assigned user
- **Adding comments** creates an audit trail

Review all write actions before confirming. Use investigation and triage commands (read-only) before taking action.

### HTTP Transport Security

When using the MCP Gateway, connections are secured via HTTPS. If self-hosting:
- Use TLS for all API communication
- Restrict access to trusted networks
- Use authentication at the proxy layer

## Troubleshooting

### Authentication Errors

If you see "401 Unauthorized" or "Forbidden":
1. Verify the JWT token has not expired
2. Check that `BLUMIRA_JWT_TOKEN` is set correctly
3. Regenerate the token from Blumira Portal > Settings > API Access
4. For MSP endpoints, ensure the token has MSP-level permissions

### MSP Endpoints Return 403

MSP endpoints (`/msp/*`) require MSP-scoped credentials:
1. Verify your account has MSP access enabled
2. Generate an MSP-level JWT token
3. Org-level tokens cannot access MSP endpoints

### Filtering Syntax Errors

Blumira uses a rich filtering syntax with operators like `.eq`, `.in`, `.gt`, `.lt`:
1. Ensure operator suffixes are correct (e.g., `status.eq=10`, not `status=10`)
2. Use commas for `.in` lists (e.g., `severity.in=HIGH,CRITICAL`)
3. Negate with `!` prefix (e.g., `!status.eq=30`)

### Rate Limits

If you encounter rate limiting:
1. Reduce page sizes in list operations
2. Space out requests when iterating over large datasets
3. Use filters to narrow result sets before fetching
4. For MSP operations, query accounts individually rather than using cross-account endpoints

### No Findings Returned

If queries return empty results:
1. Check filter values match expected formats (status codes are numeric: 10, 20, 30)
2. Verify date ranges are in correct format
3. Ensure the token has access to the targeted organization

## API Documentation

- [Blumira Public API](https://api.blumira.com/public-api/v1)
- [Blumira Knowledge Base](https://support.blumira.com/)

## Contributing

See the main [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

All contributions require a PRD in the `prd/` directory before implementation.

## Changelog

### 0.1.0 (2026-02-26)

- Initial release
- 6 skills: api-patterns, findings, agents, users, resolutions, msp
- 6 commands: finding-triage, investigate-finding, resolve-finding, msp-overview, agent-inventory, security-posture
