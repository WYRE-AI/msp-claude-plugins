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

### Connect through Conduit

This plugin ships no `.mcp.json` and reads no environment variables. Connect RocketCyber once in Conduit (**Connections → RocketCyber**, slug `rocketcyber`); Conduit stores the credentials and injects them on every request. Then add the unified connector `https://conduit.wyre.ai/v1/mcp` to your MCP client (or install the `wyre-gateway` plugin); your client signs in to Conduit with OAuth.

| Conduit connection field |
|---|
| API Key |
| Region |

## Self-Hosted Gateway

There is no per-plugin URL setting, and setting an environment variable does not register an MCP server. To use your own gateway instead of Conduit, register it as an MCP server in your client, for example `claude mcp add --transport http rocketcyber https://your-gateway-domain/v1/rocketcyber/mcp`. The gateway then holds the RocketCyber credentials, not the client.

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

To check the credentials directly against RocketCyber before you save them in Conduit, export them in your shell and run:

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

RocketCyber is brokered by [Conduit](https://conduit.wyre.ai) (vendor slug `rocketcyber`). This plugin does not ship its own `.mcp.json`: install the `wyre-gateway` plugin (or any workflow pack), which connects Claude Code to `https://conduit.wyre.ai/v1/mcp`, then connect RocketCyber in the Conduit web UI. Conduit stores the API key and injects it on every request.

The connector serves these tools, all read-only: `rocketcyber_get_account`, `rocketcyber_list_incidents`, `rocketcyber_list_events`, `rocketcyber_get_event_summary`, `rocketcyber_list_agents`, `rocketcyber_list_apps`, `rocketcyber_list_firewalls`, `rocketcyber_get_defender`, `rocketcyber_get_office` and `rocketcyber_test_connection`.

Reference implementation: [Celerium PowerShell wrapper](https://github.com/Celerium) provides a community-maintained PowerShell module for the RocketCyber API.

## API Reference

- **Base URL**: `https://api-{region}.rocketcyber.com/v3` (default region: `us`)
- **Auth**: `Authorization: Bearer {api_key}` header
- **Token Scope**: Per provider account (covers all sub-accounts)
- **Rate Limit**: Not publicly documented -- use conservative backoff (1-2 requests/second)
- **Pagination**: Page/limit based (verify against API docs)
- **Docs**: API documentation available within RocketCyber application; [Celerium PowerShell wrapper](https://github.com/Celerium) for community reference

## Contributing

See the main [CONTRIBUTING.md](../../../CONTRIBUTING.md) for guidelines.
