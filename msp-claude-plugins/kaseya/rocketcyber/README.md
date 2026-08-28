# RocketCyber Plugin

Claude Code plugin for RocketCyber managed SOC and threat detection platform.

## Overview

This plugin provides Claude with deep knowledge of RocketCyber (a Kaseya product), enabling:

- **Incident Management** - Search, triage, and investigate security incidents across customer accounts
- **Agent Monitoring** - Track RocketAgent deployment, health, and communication status
- **Account Hierarchy** - Navigate provider and customer account structures
- **Application Inventory** - Monitor detected applications and categorization per account
- **SOC Workflows** - Support analyst triage patterns, threat investigation, and compliance reporting

## Configuration

### Claude Code Settings (Recommended)

Add your credentials to `~/.claude/settings.json` (user scope, encrypted on macOS):

```json
{
  "env": {
    "ROCKETCYBER_API_KEY": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
  }
}
```

For project-specific configuration, use `.claude/settings.local.json` (gitignored):

```json
{
  "env": {
    "ROCKETCYBER_API_KEY": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    "ROCKETCYBER_REGION": "us"
  }
}
```

### Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `ROCKETCYBER_API_KEY` | Yes | | API key from Provider Settings > API tab |
| `ROCKETCYBER_REGION` | No | `us` | Region prefix for base URL. Determines base URL: `https://api-{region}.rocketcyber.com/v3` |
| `ROCKETCYBER_MCP_URL` | No | `https://rocketcyber-mcp.wyre.workers.dev/mcp` | MCP server URL — override to use a self-hosted gateway |

## Self-Hosted Gateway

If you run the [mcp-gateway](https://github.com/WYRE-AI/mcp-gateway), set `ROCKETCYBER_MCP_URL` to your gateway's endpoint:

```
ROCKETCYBER_MCP_URL=https://your-gateway-domain/v1/rocketcyber/mcp
```

**Setting env vars in Claude.ai:** Go to your org → Settings → Integrations → RocketCyber → Configure and add the variable.

**Setting env vars in Claude Code:** Add to `~/.claude/settings.json`:
```json
{
  "env": {
    "ROCKETCYBER_MCP_URL": "https://your-gateway-domain/v1/rocketcyber/mcp"
  }
}
```

### Obtaining API Credentials

1. **Log into RocketCyber**
   - Navigate to the RocketCyber web application

2. **Generate an API Key**
   - Go to **Provider Settings > API** tab
   - Generate or copy your API key
   - Store securely -- the key is scoped to the provider account and grants access to all sub-accounts

3. **Note Your Region**
   - US region (default): `https://api-us.rocketcyber.com/v3`
   - Other regions may use different subdomains (verify with RocketCyber documentation)

### Testing Your Connection

Once configured in Claude Code settings, test the connection:

```bash
# Test connection - list accounts
curl -s "https://api-${ROCKETCYBER_REGION:-us}.rocketcyber.com/v3/accounts" \
  -H "Authorization: Bearer ${ROCKETCYBER_API_KEY}" \
  -H "Content-Type: application/json" | jq
```

## Installation

```bash
# Clone the repository
git clone https://github.com/WYRE-AI/msp-claude-plugins.git

# Navigate to plugin
cd msp-claude-plugins/kaseya/rocketcyber

# Use with Claude Code
claude --plugin .
```

## Available Skills

| Skill | Description |
|-------|-------------|
| `api-patterns` | Authentication, base URL, pagination, rate limiting, error handling |
| `incidents` | Security incident lifecycle, triage, verdicts, severity, investigation |
| `agents` | RocketAgent deployment, health, communication status, troubleshooting |
| `accounts` | Provider/customer account hierarchy, configuration, sub-accounts |
| `apps` | Application inventory, detection, categorization, monitoring |

## Available Commands

| Command | Description |
|---------|-------------|
| `/search-incidents` | Search security incidents by account, status, severity, verdict |
| `/account-summary` | Get a security posture summary for a specific account |

## MCP Server

No community MCP server exists yet for RocketCyber. The `.mcp.json` file contains a placeholder configuration pointing to the REST API base URL.

Reference implementation: [Celerium PowerShell wrapper](https://github.com/Celerium) provides a community-maintained PowerShell module for the RocketCyber API.

```json
{
  "mcpServers": {
    "rocketcyber": {
      "type": "http",
      "url": "https://api-us.rocketcyber.com/v3",
      "headers": {
        "Authorization": "Bearer ${ROCKETCYBER_API_KEY}"
      },
      "note": "No community MCP server exists yet."
    }
  }
}
```

## API Reference

- **Base URL**: `https://api-{region}.rocketcyber.com/v3` (default region: `us`)
- **Auth**: `Authorization: Bearer {api_key}` header
- **Token Scope**: Per provider account (covers all sub-accounts)
- **Rate Limit**: Not publicly documented -- use conservative backoff (1-2 requests/second)
- **Pagination**: Page/limit based (verify against API docs)
- **Docs**: API documentation available within RocketCyber application; [Celerium PowerShell wrapper](https://github.com/Celerium) for community reference

## Contributing

See the main [CONTRIBUTING.md](../../../CONTRIBUTING.md) for guidelines.
