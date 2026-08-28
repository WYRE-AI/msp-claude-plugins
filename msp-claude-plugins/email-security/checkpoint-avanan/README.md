# Checkpoint Harmony Email & Collaboration (Avanan) Plugin

Claude Code plugin for Checkpoint Harmony Email & Collaboration (formerly Avanan) integration.

## Overview

This plugin provides Claude with deep knowledge of Checkpoint Harmony Email & Collaboration, enabling:

- **Threat Detection** - Query and investigate phishing, malware, DLP, anomaly and shadow-IT detections
- **Message Search** - Locate mail and SaaS entities by sender, subject, recipient or attachment hash
- **Quarantine Actions** - Quarantine and restore mail, with asynchronous task tracking
- **Exception Management** - Maintain the whitelist and blacklist sender exceptions

The plugin speaks the `hec_*` tool surface of the Harmony Email Smart API v1.50.
It has **no policy or incident surface** — Harmony Email exposes neither through
this API, and both are console-only. See [GOVERNANCE.md](GOVERNANCE.md) for the
full tool inventory and permission model.

## Configuration

### Claude Code Settings (Recommended)

Add your credentials to `~/.claude/settings.json` (user scope, encrypted on macOS):

```json
{
  "env": {
    "CHECKPOINT_CLIENT_ID": "your-client-id",
    "CHECKPOINT_CLIENT_SECRET": "your-client-secret"
  }
}
```

For project-specific configuration, use `.claude/settings.local.json` (gitignored):

```json
{
  "env": {
    "CHECKPOINT_CLIENT_ID": "your-client-id",
    "CHECKPOINT_CLIENT_SECRET": "your-client-secret"
  }
}
```

### Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `CHECKPOINT_CLIENT_ID` | Yes | | OAuth2 client ID from Infinity Portal |
| `CHECKPOINT_CLIENT_SECRET` | Yes | | OAuth2 client secret (sent as `accessKey`) |
| `CHECKPOINT_AVANAN_MCP_URL` | No | `https://checkpoint-avanan-mcp.wyre.workers.dev/mcp` | MCP server URL -- override to use a self-hosted gateway |

## Self-Hosted Gateway

If you run the [mcp-gateway](https://github.com/WYRE-AI/mcp-gateway), set `CHECKPOINT_AVANAN_MCP_URL` to your gateway's endpoint:

```
CHECKPOINT_AVANAN_MCP_URL=https://your-gateway-domain/v1/checkpoint-avanan/mcp
```

**Setting env vars in Claude.ai:** Go to your org > Settings > Integrations > Checkpoint Avanan > Configure and add the variable.

**Setting env vars in Claude Code:** Add to `~/.claude/settings.json`:
```json
{
  "env": {
    "CHECKPOINT_AVANAN_MCP_URL": "https://your-gateway-domain/v1/checkpoint-avanan/mcp"
  }
}
```

### Obtaining API Credentials

1. **Log into the Checkpoint Infinity Portal**
   - Navigate to [https://portal.checkpoint.com](https://portal.checkpoint.com)
   - Sign in with your administrator account

2. **Create API Keys**
   - Go to **Settings > API Keys**
   - Click **Create New Key**
   - Select the appropriate scope (Email & Collaboration)
   - Copy the Client ID and Client Secret immediately (secret is only shown once)

3. **Confirm the key has a farm association**
   - The key must resolve to at least one `farm:customer` scope
     (e.g. `mt-prod-cp-eu-1:yourorg`). A key with no farm association
     authenticates successfully but returns zero records on every call.

### Testing Your Connection

Once configured, the cheapest read-only check is listing an exception list —
it needs no date range and returns quickly:

```bash
mcp-cli call checkpoint-avanan/hec_list_exceptions '{"excType": "whitelist"}'
```

### API Documentation

- [Checkpoint Harmony Email API Documentation](https://sc1.checkpoint.com/documents/Harmony_Email_Collaboration/SmartGuide/Topics-HEC-EG/API/API-Reference.htm)
- [Infinity Portal](https://portal.checkpoint.com)

## Installation

1. Clone this plugin to your Claude plugins directory
2. Configure environment variables
3. The MCP server will be automatically started when needed

## Available Skills

| Skill | Description |
|-------|-------------|
| `threats` | Security events: types, states, severities, and triage |
| `quarantine` | Entity search, quarantine and restore actions |
| `exceptions` | Whitelist and blacklist sender exceptions |
| `api-patterns` | Tool surface, event/entity ids, paging, auth and regions |

## Available Commands

| Command | Description | Tools |
|---------|-------------|-------|
| `/search-threats` | Sweep detections by type, state, severity and window | `hec_query_events` |
| `/check-threat` | Full detail for one detection and the message behind it | `hec_get_event`, `hec_get_email`, `hec_search_emails` |
| `/search-quarantine` | Find messages by sender, subject, hash or quarantine state | `hec_search_emails` |
| `/release-quarantine` | Deliver held mail back to recipients, with task polling | `hec_restore_emails`, `hec_restore_events`, `hec_get_task_status` |

`/manage-policy` was removed in 0.4.0. Harmony Email exposes no policy tools
through this API, so the command described a capability that did not exist.
Allow and block lists — the nearest real capability — are the `whitelist` and
`blacklist` values of `excType` on the four `hec_*_exception` tools; see the
`exceptions` skill.

## Available Agents

| Agent | Description |
|-------|-------------|
| `cloud-email-defender` | Detection triage, message search, quarantine and restore, exception management |
| `exception-hygiene-auditor` | Read-only periodic review of allow and block entries for age, scope and justification |

## Contributing

See the main [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

All contributions require a PRD in the `prd/` directory before implementation.
