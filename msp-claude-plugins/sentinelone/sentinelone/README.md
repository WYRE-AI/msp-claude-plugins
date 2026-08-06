# SentinelOne Plugin

Claude Code plugin for SentinelOne XDR platform integration via the Purple AI MCP server.

## Overview

This plugin provides Claude with deep knowledge of SentinelOne, enabling:

- **Purple AI Threat Hunting** - Natural language cybersecurity investigation and PowerQuery generation
- **Unified Alert Management** - Triage, investigate, and search alerts across cloud, Kubernetes, identity, and infrastructure
- **Vulnerability Tracking** - XSPM vulnerability management with CVE details, EPSS scores, and remediation guidance
- **Misconfiguration Detection** - Cloud security posture management across AWS, Azure, GCP, Kubernetes, and identity
- **Asset Inventory** - Unified inventory of endpoints, cloud resources, identities, and network-discovered devices
- **Threat Hunting** - Execute PowerQuery against the Singularity Data Lake for deep forensic analysis

> **READ-ONLY:** This plugin is for investigation and reporting only. It cannot modify alerts, remediate vulnerabilities, isolate endpoints, or take any active response actions.

## Prerequisites

### Service User Token

SentinelOne Purple MCP authenticates with a Service User token:

1. Log into your SentinelOne Management Console
2. Navigate to **Policy & Settings > User Management > Service Users**
3. Create a new Service User with appropriate scope
4. Generate an API token for the Service User

> **IMPORTANT:** The token must be **Account** or **Site** level. **Global-level tokens do NOT work** with the Purple MCP server and will return authentication errors.

### Console Base URL

Your SentinelOne console URL, typically `https://your-console.sentinelone.net`.

### Python Package Manager

The Purple MCP server is a Python package installed via `uvx` (from the `uv` package manager). This is **not** a Node.js package -- you need `uv`/`uvx` installed, not `npx`.

Install `uv`:

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

### Environment Variables

```bash
export SENTINELONE_TOKEN="your-service-user-token"
export SENTINELONE_BASE_URL="https://your-console.sentinelone.net"
```

## Installation

### Via MCP Gateway (Recommended)

Use the [MCP Gateway](https://conduit.wyre.ai) to connect -- just paste your Service User token and console URL and you're done.

### Self-Hosted (Claude Desktop)

Add to your Claude Desktop config:

```json
{
  "mcpServers": {
    "sentinelone": {
      "command": "uvx",
      "args": [
        "--from", "git+https://github.com/Sentinel-One/purple-mcp.git",
        "purple-mcp",
        "--mode", "stdio"
      ],
      "env": {
        "PURPLEMCP_CONSOLE_TOKEN": "YOUR_SERVICE_USER_TOKEN",
        "PURPLEMCP_CONSOLE_BASE_URL": "https://your-console.sentinelone.net"
      }
    }
  }
}
```

> **Note:** The Purple MCP server is installed from GitHub via `uvx`. This plugin adds MSP-specific skills, commands, and workflow knowledge on top of SentinelOne's official Purple MCP server.

## Available Skills

| Skill | Description |
|-------|-------------|
| `api-patterns` | Purple MCP connection, authentication, tool reference, dual API architecture, and error handling |
| `purple-ai` | Natural language threat investigation and PowerQuery generation via Purple AI |
| `alerts` | Unified alert management -- triage, investigate, search, and review alert history |
| `vulnerabilities` | XSPM vulnerability management with CVE details, EPSS scores, and remediation |
| `misconfigurations` | Cloud security posture -- misconfigurations across cloud, Kubernetes, identity, and IaC |
| `inventory` | Unified asset inventory -- endpoints, cloud resources, identities, and network discovery |
| `threat-hunting` | PowerQuery execution against the Singularity Data Lake for deep forensic analysis |

## Available Commands

| Command | Description |
|---------|-------------|
| `/alert-triage` | Triage new and unresolved alerts by severity |
| `/investigate-alert` | Deep investigation of a specific alert with timeline and context |
| `/vuln-report` | Vulnerability summary report with severity breakdown and top CVEs |
| `/hunt-threat` | Threat hunting via Purple AI and PowerQuery execution |
| `/asset-inventory` | Asset inventory summary by surface type |
| `/posture-review` | Cloud security posture review with compliance gap analysis |

## Quick Start

### Triage New Alerts

```
/alert-triage
```

### Investigate a Specific Alert

```
/investigate-alert --alert_id "1234567890"
```

### Hunt for a Threat

```
/hunt-threat --description "PowerShell processes connecting to external IP addresses on non-standard ports"
```

### Review Cloud Security Posture

```
/posture-review --severity CRITICAL
```

## Security Considerations

### Token Handling

- Never commit Service User tokens to version control
- Use environment variables for all credentials
- Rotate tokens periodically via the SentinelOne Console
- Use Account or Site-scoped tokens with minimum necessary permissions
- Monitor Service User activity in the SentinelOne audit log

### Read-Only Nature

All Purple MCP tools are read-only. They cannot:
- Modify alert status or assignments
- Remediate vulnerabilities or misconfigurations
- Isolate, quarantine, or take action on endpoints
- Change policies or configurations
- Delete or modify any data

### HTTP Transport Security

If using SSE or Streamable HTTP transport modes instead of stdio, the MCP server exposes an HTTP endpoint. In production:
- Place behind a reverse proxy with TLS termination
- Restrict access to trusted networks
- Use authentication at the proxy layer

## Troubleshooting

### Authentication Errors

If you see "401 Unauthorized" or "Forbidden":
1. Verify the token is an **Account** or **Site** level token -- **Global tokens do NOT work**
2. Check that `SENTINELONE_TOKEN` and `SENTINELONE_BASE_URL` are set correctly
3. Verify the Service User has not been disabled or deleted
4. Generate a new token at SentinelOne Console > Policy & Settings > User Management > Service Users

### PowerQuery Syntax Errors

PowerQuery uses SentinelOne's Scalyr-based pipeline query language. It is **NOT**:
- Splunk SPL
- SQL
- KQL (Kusto)
- Elasticsearch Query DSL

If queries fail, use the `purple_ai` tool with a natural language description to generate correct PowerQuery syntax.

### Rate Limits

SentinelOne enforces rate limits on API calls:
1. Space out requests when iterating over large datasets
2. Use pagination parameters to limit result set sizes
3. If rate limited, wait before retrying
4. For large inventories, filter by surface type to reduce result counts

### Connection Issues

If the MCP server fails to start:
1. Verify `uv`/`uvx` is installed: `uvx --version`
2. Check Python is available: `python3 --version`
3. Try installing manually: `uvx --from git+https://github.com/Sentinel-One/purple-mcp.git purple-mcp --help`
4. Check network connectivity to your SentinelOne console URL

## API Documentation

- [SentinelOne Purple MCP Server (GitHub)](https://github.com/Sentinel-One/purple-mcp)
- [SentinelOne API Documentation](https://usea1-partners.sentinelone.net/api-doc/)
- [SentinelOne Knowledge Base](https://support.sentinelone.com/)

## Contributing

See the main [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

All contributions require a PRD in the `prd/` directory before implementation.

## Changelog

### 0.1.0 (2026-02-24)

- Initial release
- 7 skills: api-patterns, purple-ai, alerts, vulnerabilities, misconfigurations, inventory, threat-hunting
- 6 commands: alert-triage, investigate-alert, vuln-report, hunt-threat, asset-inventory, posture-review
