# Proofpoint Email Protection Plugin

Claude Code plugin for Proofpoint Email Protection integration.

## Overview

This plugin provides Claude with deep knowledge of Proofpoint Email Protection, enabling:

- **Targeted Attack Protection (TAP)** - Monitor threat events, blocked/delivered messages, click tracking
- **Quarantine Management** - List, search, release, and delete quarantined messages
- **Threat Intelligence** - Campaign lookup, threat families, IOCs
- **Forensics & Threat Response** - Search and destroy (auto-pull), evidence collection
- **People-Centric Security** - Very Attacked People reports, top clickers, user risk scoring
- **URL Defense** - Decode and analyze Proofpoint-rewritten URLs
- **Smart Search** - Trace messages through mail flow, retrieve headers and processing detail
- **DLP** - Data-loss incidents and encrypted-message status
- **Policy** - Read email security policies and routing rules
- **Reports** - Organization, threat, mail-flow, and executive summaries
- **Events** - Spam, phishing and malware detection events with statistics

## MCP Tools

The 44 tools the shipped server registers. Skills exist for the first six
groups; the remaining groups are reachable but have no skill of their own
yet, so consult the schemas via `proofpoint_list_category_tools`.

| Group | Tools |
|---|---|
| TAP (SIEM) | `proofpoint_tap_get_all_threats`, `proofpoint_tap_get_messages_blocked`, `proofpoint_tap_get_messages_delivered`, `proofpoint_tap_get_clicks_permitted`, `proofpoint_tap_get_clicks_blocked` |
| Quarantine | `proofpoint_quarantine_list`, `proofpoint_quarantine_search`, `proofpoint_quarantine_release`, `proofpoint_quarantine_delete` |
| Threat intelligence | `proofpoint_threat_get_campaign`, `proofpoint_threat_get_by_id`, `proofpoint_threat_get_iocs`, `proofpoint_threat_list_families` |
| Forensics | `proofpoint_forensics_get_threat`, `proofpoint_forensics_get_campaign`, `proofpoint_forensics_search_messages`, `proofpoint_forensics_pull_messages` |
| People | `proofpoint_people_get_vap`, `proofpoint_people_get_top_clickers`, `proofpoint_people_get_user_risk` |
| URL Defense | `proofpoint_url_decode`, `proofpoint_url_analyze` |
| Smart Search | `proofpoint_smart_search_trace`, `proofpoint_smart_search_get_message`, `proofpoint_smart_search_get_headers` |
| DLP | `proofpoint_dlp_list_incidents`, `proofpoint_dlp_get_incident`, `proofpoint_dlp_list_encrypted` |
| Policy | `proofpoint_policy_list`, `proofpoint_policy_get`, `proofpoint_policy_list_routes` |
| Reports | `proofpoint_reports_org_summary`, `proofpoint_reports_threat_summary`, `proofpoint_reports_mail_flow`, `proofpoint_reports_executive_summary` |
| Events | `proofpoint_events_list`, `proofpoint_events_get_details`, `proofpoint_events_get_stats` |
| Discovery / meta | `proofpoint_status`, `proofpoint_list_categories`, `proofpoint_list_category_tools`, `proofpoint_router`, `proofpoint_navigate`, `proofpoint_execute_tool` |

`proofpoint_execute_tool` runs any of the above by name, so granting it
grants the destructive tools too — see [GOVERNANCE.md](GOVERNANCE.md).
`proofpoint_navigate` is refused by the gateway for every caller.

**Not available through this plugin** — each was documented as a tool in an
earlier revision and does not exist: organization enumeration, VIP flag
read/write, quarantine message preview or get-by-ID, bulk quarantine
release/delete, remediation operation status or history, TRAP auto-pull
configuration, campaign search, reverse IOC lookup, threat-actor and
per-family lookup, and per-URL click attribution. GOVERNANCE.md lists what
to use instead.

## Configuration

### Claude Code Settings (Recommended)

Add your credentials to `~/.claude/settings.json` (user scope, encrypted on macOS):

```json
{
  "env": {
    "PROOFPOINT_SERVICE_PRINCIPAL": "your-service-principal",
    "PROOFPOINT_SERVICE_SECRET": "your-service-secret"
  }
}
```

For project-specific configuration, use `.claude/settings.local.json` (gitignored):

```json
{
  "env": {
    "PROOFPOINT_SERVICE_PRINCIPAL": "your-service-principal",
    "PROOFPOINT_SERVICE_SECRET": "your-service-secret"
  }
}
```

### Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PROOFPOINT_SERVICE_PRINCIPAL` | Yes | | Service principal from Proofpoint TAP dashboard |
| `PROOFPOINT_SERVICE_SECRET` | Yes | | Service secret associated with the principal |
| `PROOFPOINT_MCP_URL` | No | `https://proofpoint-mcp.wyre.workers.dev/mcp` | MCP server URL -- override to use a self-hosted gateway |

## Self-Hosted Gateway

If you run the [mcp-gateway](https://github.com/WYRE-AI/mcp-gateway), set `PROOFPOINT_MCP_URL` to your gateway's endpoint:

```
PROOFPOINT_MCP_URL=https://your-gateway-domain/v1/proofpoint/mcp
```

**Setting env vars in Claude.ai:** Go to your org > Settings > Integrations > Proofpoint > Configure and add the variable.

**Setting env vars in Claude Code:** Add to `~/.claude/settings.json`:
```json
{
  "env": {
    "PROOFPOINT_MCP_URL": "https://your-gateway-domain/v1/proofpoint/mcp"
  }
}
```

### Obtaining API Credentials

1. **Log into the TAP Dashboard**
   - Navigate to `https://threatinsight.proofpoint.com`
   - Use your Proofpoint administrator account

2. **Create Connected Application Credentials**
   - Go to **Settings > Connected Applications**
   - Click **Create New Credential**
   - Copy the **Service Principal** and **Service Secret**
   - Store securely -- the secret is shown only once

3. **Verify API Access**
   - Ensure your Proofpoint license includes TAP API access
   - For People and Forensics APIs, additional licensing may be required

### Testing Your Connection

Once configured in Claude Code settings, test the connection:

```bash
# Test TAP API access (using curl)
curl -u "${PROOFPOINT_SERVICE_PRINCIPAL}:${PROOFPOINT_SERVICE_SECRET}" \
  "https://tap-api.proofpoint.com/v2/siem/all?format=json&sinceSeconds=300"
```

### API Documentation

- [Proofpoint TAP API Documentation](https://help.proofpoint.com/Threat_Insight_Dashboard/API_Documentation)
- [Proofpoint People API](https://help.proofpoint.com/Threat_Insight_Dashboard/API_Documentation/People_API)
- [Proofpoint Campaign API](https://help.proofpoint.com/Threat_Insight_Dashboard/API_Documentation/Campaign_API)

## Installation

1. Clone this plugin to your Claude plugins directory
2. Configure environment variables
3. The MCP server will be automatically started when needed

## Available Skills

| Skill | Description |
|-------|-------------|
| `tap` | Targeted Attack Protection - threat events, click tracking, message disposition |
| `quarantine` | Email quarantine management - search, release, delete |
| `threat-intel` | Threat intelligence - campaigns, IOCs, threat families |
| `forensics` | Forensics and threat response - search and destroy, auto-pull |
| `people` | People-centric security - VAP reports, top clickers, user risk |
| `url-defense` | URL Defense - URL decoding, analysis, click-time protection |
| `api-patterns` | Proofpoint API patterns - authentication, rate limits, pagination |

## Available Commands

| Command | Description |
|---------|-------------|
| `/search-quarantine` | Search quarantined messages by sender, recipient, subject, or reason |
| `/release-quarantine` | Release quarantined messages to their intended recipients |
| `/check-threats` | View recent TAP threat events and activity summary |
| `/investigate-threat` | Deep-dive threat investigation with forensics and campaign context |
| `/vap-report` | Get Very Attacked People report and user risk profiles |
| `/decode-url` | Decode a Proofpoint URL Defense rewritten URL |

## Contributing

See the main [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

All contributions require a PRD in the `prd/` directory before implementation.
