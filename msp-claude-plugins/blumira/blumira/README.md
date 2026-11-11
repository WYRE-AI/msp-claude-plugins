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

## Configuration

### Connect through Conduit

This plugin ships no `.mcp.json` and reads no environment variables. Connect Blumira once in Conduit at `https://conduit.wyre.ai/connect/blumira` (**Connections → Blumira**, slug `blumira`); Conduit stores the credentials and injects them on every request. Then install the `wyre-gateway` plugin (or add the unified connector `https://conduit.wyre.ai/v1/mcp` to your MCP client); your client signs in to Conduit with OAuth.

| Conduit connection field |
|---|
| JWT Token |

Conduit checks the token against the Blumira API when you save the connection.

### Obtaining the JWT Token

1. Log into your Blumira Portal
2. Navigate to **Settings > API Access**
3. Generate a JWT token with appropriate scope

> **IMPORTANT:** For MSP operations, the token must have MSP-level permissions. Org-level tokens only access the single organization.

## Self-Hosted Gateway

There is no per-plugin URL setting, and setting an environment variable does not register an MCP server. To use your own gateway instead of Conduit, register it as an MCP server in your client, for example `claude mcp add --transport http blumira https://your-gateway-domain/v1/blumira/mcp`. The gateway then holds the Blumira credentials, not the client. In that case install only this plugin (`/plugin install blumira@msp-claude-plugins`) and skip `wyre-gateway` and the Conduit connection.

## Installation

```
/plugin marketplace add WYRE-AI/msp-claude-plugins
/plugin install wyre-gateway@msp-claude-plugins
/plugin install blumira@msp-claude-plugins
```

Then connect Blumira in Conduit (see **Connect through Conduit**). The plugin adds skills and commands; the tools come from the Conduit connector.

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
- Keep the token in the Conduit connection, not in local files or environment variables
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

Connections to Conduit are secured via HTTPS. If self-hosting:
- Use TLS for all API communication
- Restrict access to trusted networks
- Use authentication at the proxy layer

## Troubleshooting

### Authentication Errors

If you see "401 Unauthorized" or "Forbidden":
1. Verify the JWT token has not expired
2. Open the Blumira connection in Conduit (`https://conduit.wyre.ai/connect/blumira`) and check the JWT Token
3. Regenerate the token from Blumira Portal > Settings > API Access, then update the Conduit connection
4. For MSP endpoints, ensure the token has MSP-level permissions

### MSP Endpoints Return 403

MSP endpoints (`/msp/*`) require MSP-scoped credentials:
1. Verify your account has MSP access enabled
2. Generate an MSP-level JWT token and save it on the Conduit connection
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
