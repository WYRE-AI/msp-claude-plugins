# Abnormal Security Plugin

Claude Code plugin for the Abnormal Security AI-powered email security platform.

## Overview

This plugin provides Claude with deep knowledge of Abnormal Security, enabling:

- **Threat Detection** - Investigate BEC, phishing, malware, and socially-engineered email attacks
- **Cases & Abuse Mailbox** - Read user-reported email cases and abuse-mailbox submissions for triage
- **Message Analysis** - Analyze email headers, attachments, sender reputation, and delivery context
- **Per-message Remediation** - Pull a specific message out of mailboxes, restore it, or check its status

### What this plugin does not cover

The shipped MCP server exposes ten tools and nothing else. There is **no
account-takeover domain** (no sign-in events, impossible travel, or
identity actions) and **no VendorBase/vendor-risk domain**. Cases are
read-only — case state changes happen in the Abnormal portal. Message
lookups are always scoped to a single threat; there is no tenant-wide
message search.

## Configuration

### Claude Code Settings (Recommended)

Add your credentials to `~/.claude/settings.json` (user scope, encrypted on macOS):

```json
{
  "env": {
    "ABNORMAL_API_TOKEN": "your-api-token"
  }
}
```

For project-specific configuration, use `.claude/settings.local.json` (gitignored):

```json
{
  "env": {
    "ABNORMAL_API_TOKEN": "your-api-token"
  }
}
```

### Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `ABNORMAL_API_TOKEN` | Yes | | API token from Settings > Integrations > API |
| `ABNORMAL_MCP_URL` | No | `https://conduit.wyre.ai/v1/abnormal-security/mcp` | MCP server URL -- override to use a self-hosted gateway |

## Self-Hosted Gateway

If you run the [mcp-gateway](https://github.com/WYRE-AI/mcp-gateway), set `ABNORMAL_MCP_URL` to your gateway's endpoint:

```
ABNORMAL_MCP_URL=https://your-gateway-domain/v1/abnormal-security/mcp
```

**Setting env vars in Claude.ai:** Go to your org > Settings > Integrations > Abnormal Security > Configure and add the variable.

**Setting env vars in Claude Code:** Add to `~/.claude/settings.json`:
```json
{
  "env": {
    "ABNORMAL_MCP_URL": "https://your-gateway-domain/v1/abnormal-security/mcp"
  }
}
```

### Obtaining API Credentials

1. **Log into the Abnormal Security Portal**
   - Navigate to [https://portal.abnormalsecurity.com](https://portal.abnormalsecurity.com)
   - Sign in with your administrator account

2. **Generate API Token**
   - Go to **Settings > Integrations > API**
   - Click **Generate Token**
   - Copy the API token immediately (it is only shown once)

3. **Configure Permissions**
   - Ensure the API token has access to:
     - Threats (read)
     - Cases (read)
     - Abuse Mailbox (read)
     - Messages (read)
     - Remediation (write — required only if you intend to remediate)

### Testing Your Connection

Once configured in Claude Code settings, test the connection:

```bash
# Report server and credential status (takes no arguments)
mcp-cli call abnormal-security/abnormal_status '{}'
```

### API Documentation

- [Abnormal Security API Documentation](https://app.swaggerhub.com/apis/abnormal-security/abx)
- [Abnormal Security Portal](https://portal.abnormalsecurity.com)

## Installation

1. Clone this plugin to your Claude plugins directory
2. Configure environment variables
3. The MCP server will be automatically started when needed

## Available Skills

| Skill | Description |
|-------|-------------|
| `threats` | Threat detection, email threat analysis (BEC, phishing, malware), and per-message remediation |
| `cases` | Abuse mailbox case triage — read-only |
| `messages` | Message analysis, headers, attachments, sender reputation |
| `api-patterns` | Abnormal Security REST API authentication, pagination, and error handling |

## Available Commands

| Command | Description |
|---------|-------------|
| `/threat-triage` | Triage recent email threats by severity and attack type |
| `/search-threats` | Search for specific threat patterns by sender, recipient, or type |
| `/case-review` | Review and triage abuse mailbox cases |

## MCP Tools

All ten tools are available at all times — there is no progressive
disclosure.

| Tool | Tier | Notes |
|------|------|-------|
| `abnormal_navigate` | read | Domain discovery: `threats`, `messages`, `remediation`, `abuse`, `cases` |
| `abnormal_status` | read | Server and credential status; no arguments |
| `abnormal_threats_list` | read | `pageSize`, `pageNumber`, `filter` (OData) |
| `abnormal_threats_get` | read | `threatId` (UUID string) |
| `abnormal_messages_list` | read | `threatId` |
| `abnormal_messages_get` | read | `threatId`, `messageId` — headers, URLs, attachments and AI analysis in one payload |
| `abnormal_cases_list` | read | `pageSize`, `pageNumber`, `filter` (OData) |
| `abnormal_cases_get` | read | `caseId` (**number**, unlike the UUID `threatId`) |
| `abnormal_abuse_list` | read | `pageSize`, `pageNumber`, `filter` (OData) |
| `abnormal_remediation_manage` | destructive | `threatId`, `messageId`, `action` (`remediate` \| `unremediate` \| `status`) |

Remediation acts on **one message**, not a threat. Removing a campaign
means listing the threat's messages and looping — a partial failure
leaves it half-remediated. See [GOVERNANCE.md](GOVERNANCE.md).

## Quick Start

### Triage Recent Threats

```
/threat-triage
```

### Search for BEC Threats

```
/search-threats --type bec
```

### Review Abuse Mailbox Cases

```
/case-review
```

## Security Considerations

### Credential Handling

- Never commit API tokens to version control
- Use environment variables for all credentials
- Rotate API tokens periodically via the Abnormal Security portal
- Use the minimum scope necessary for your use case
- Monitor API usage in the Abnormal Security audit log

### HTTP Transport Security

If using the MCP server over HTTP transport, ensure:
- TLS termination via a reverse proxy
- Restrict access to trusted networks
- Use authentication at the proxy layer

## Troubleshooting

### Authentication Errors

If you see "401 Unauthorized":
1. Verify `ABNORMAL_API_TOKEN` is set correctly
2. Check that the API token has not been revoked
3. Regenerate the token at Abnormal Security Portal > Settings > Integrations > API

### Rate Limits

Abnormal Security enforces API rate limits:
1. Space out requests when iterating over large datasets
2. Use pagination with `pageSize` to limit result sizes
3. If rate limited (HTTP 429), wait before retrying

### Connection Issues

If the MCP server fails to connect:
1. Verify network connectivity to `https://conduit.wyre.ai`
2. Check that your API token is valid
3. Ensure the MCP Gateway service is running

## Contributing

See the main [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

All contributions require a PRD in the `prd/` directory before implementation.

## Changelog

### Unreleased

#### Removed

- Skill `account-takeover` and command `/account-audit` — the shipped MCP
  server has no account-takeover domain, and the ATO tools they
  documented never existed.
- Skill `vendors` and command `/vendor-risk` — there is no VendorBase
  domain, and the vendor tools they documented never existed.
- Documented case-action and case-actions tools. Cases are read-only;
  nothing changes a case's state, assigns it, or closes it. That happens
  in the Abnormal portal.
- Documented threat-level action, remediate, and unremediate tools. There
  is no threat-level action tool; remediation is per message, through
  `abnormal_remediation_manage`.
- A documented standalone message-headers tool. Headers are returned
  inline by `abnormal_messages_get`, in the same payload as URLs,
  attachments and the AI analysis.

#### Fixed

- Tool names across skills, agents, commands and docs now match the
  shipped server: `abnormal_threats_list`, `abnormal_threats_get`,
  `abnormal_messages_list`, `abnormal_messages_get`,
  `abnormal_cases_list`, `abnormal_abuse_list`,
  `abnormal_remediation_manage`.
- Remediation documented as per-message (`threatId` + `messageId`)
  rather than per-threat, including the partial-failure hazard of the
  required N-call loop.
- `abnormal_cases_get` documented as taking a **numeric** `caseId`,
  distinct from the UUID `threatId`.

### 0.1.0 (2026-03-27)

- Initial release
- 6 skills: threats, cases, messages, vendors, account-takeover, api-patterns
- 5 commands: threat-triage, search-threats, case-review, vendor-risk, account-audit
