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

### Connect through Conduit

This plugin ships no `.mcp.json` and reads no environment variables. Connect Abnormal Security once in Conduit at `https://conduit.wyre.ai/connect/abnormal-security` (**Connections → Abnormal Security**, slug `abnormal-security`); Conduit stores the credentials and injects them on every request. Then install the `wyre-gateway` plugin (or add the unified connector `https://conduit.wyre.ai/v1/mcp` to your MCP client); your client signs in to Conduit with OAuth.

| Conduit connection field |
|---|
| API Token |

Conduit checks the token against the Abnormal API when you save the connection.

## Self-Hosted Gateway

There is no per-plugin URL setting, and setting an environment variable does not register an MCP server. To use your own gateway instead of Conduit, register it as an MCP server in your client, for example `claude mcp add --transport http abnormal-security https://your-gateway-domain/v1/abnormal-security/mcp`. The gateway then holds the Abnormal Security credentials, not the client. In that case install only this plugin (`/plugin install abnormal-security@msp-claude-plugins`) and skip `wyre-gateway` and the Conduit connection.

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

After connecting Abnormal Security in Conduit, ask Claude to run `abnormal_status`. It takes no arguments and reports the server and credential status.

### API Documentation

- [Abnormal Security API Documentation](https://app.swaggerhub.com/apis/abnormal-security/abx)
- [Abnormal Security Portal](https://portal.abnormalsecurity.com)

## Installation

```
/plugin marketplace add WYRE-AI/msp-claude-plugins
/plugin install wyre-gateway@msp-claude-plugins
/plugin install abnormal-security@msp-claude-plugins
```

Then connect Abnormal Security in Conduit (see **Connect through Conduit**). The plugin adds skills and commands; the tools come from the Conduit connector.

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

Nine tools are available at all times through Conduit — there is no progressive
disclosure. The server's tenth tool, the `abnormal_navigate` menu, is refused
by Conduit for every caller; use `conduit__my_access` to see which tools you
can call.

| Tool | Tier | Notes |
|------|------|-------|
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
- Keep the token in the Conduit connection, not in local files or environment variables
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
1. Open the Abnormal Security connection in Conduit (`https://conduit.wyre.ai/connect/abnormal-security`) and check the API Token
2. Check that the API token has not been revoked
3. Regenerate the token at Abnormal Security Portal > Settings > Integrations > API, then update the Conduit connection

### Rate Limits

Abnormal Security enforces API rate limits:
1. Space out requests when iterating over large datasets
2. Use pagination with `pageSize` to limit result sizes
3. If rate limited (HTTP 429), wait before retrying

### Connection Issues

If the MCP server fails to connect:
1. Verify network connectivity to `https://conduit.wyre.ai`
2. Check that Abnormal Security shows as connected in Conduit
3. Make sure your client is still signed in to Conduit; re-authenticate the connector if its OAuth sign-in has expired

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
