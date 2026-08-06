# Ironscales Plugin

Claude Code plugin for Ironscales, an AI-powered anti-phishing platform.

## Overview

This plugin provides Claude with deep knowledge of Ironscales, enabling:

- **Incident Triage** - List phishing incidents by status and severity, and pull full detail on any one of them
- **Email Analysis** - Submit a raw email to Ironscales' AI and get a phishing/spam/legitimate verdict back
- **Remediation** - Quarantine, delete, block a sender, mark a false positive, or report a message to Microsoft
- **Allowlist Management** - Manage email, domain, and IP allowlist entries to reduce false positives
- **Dashboard & Reporting** - Access company-wide phishing statistics and trends

### What it does not do

- **It cannot set a verdict on an incident.** `ironscales_email_classify` takes a
  raw email, not an incident ID. It is stateless: it returns a verdict and
  changes nothing. The only tool that changes incident state is
  `ironscales_remediation_act`.
- **It cannot block a domain.** `block_sender` blocks one address. Campaign-wide
  domain blocking has to be done in the Ironscales console or the upstream mail
  filter.
- **It cannot filter incidents by source.** There is no `source` parameter — a
  user-reported versus AI-detected split has to be partitioned client-side from
  the records returned.

## Prerequisites

### API Credentials

Ironscales authenticates via API key and company ID:

| Header | Description |
|--------|-------------|
| `X-IronScales-API-Key` | Your Ironscales API key |
| `X-IronScales-Company-ID` | Your Ironscales company ID |

To obtain credentials:

1. Log into the [Ironscales Platform](https://app.ironscales.com)
2. Navigate to **Settings > API**
3. Generate an API key and note your Company ID

## Installation

### Via MCP Gateway (Recommended)

Use the [MCP Gateway](https://mcp.wyre.ai) to connect — enter your API key and Company ID.

### Self-Hosted (Docker)

Run the Ironscales MCP server via Docker with the MCP Gateway self-hosted option. See the [MCP Gateway documentation](https://mcp.wyre.ai) for setup instructions.

### Claude Code CLI

Add the `.mcp.json` from this plugin to your project and set the environment variables:

```bash
export IRONSCALES_API_KEY="your-api-key"
export IRONSCALES_COMPANY_ID="your-company-id"
```

## Available Skills

| Skill | Description |
|-------|-------------|
| `api-patterns` | API key + company ID authentication, the nine tools, pagination, error handling |
| `incidents` | Phishing incident lifecycle, remediation, email classification, allowlist management |

## Available Commands

| Command | Description |
|---------|-------------|
| `/triage-incidents` | Triage open phishing incidents — list by status and severity, investigate, remediate |
| `/classify-email` | Get an Ironscales AI verdict on a raw email, then act on it separately |

## Quick Start

### Triage Open Incidents

```
/triage-incidents
```

### Classify an Email

```
/classify-email --sender "billing@suspicious-domain.net" --subject "Your invoice is ready"
```

### Quarantine a Confirmed Phish

```
Ask Claude: "Quarantine incident inc-10042 in Ironscales"
```

### View Dashboard Statistics

```
Ask Claude: "Show me the Ironscales dashboard statistics for this company"
```

## Security Considerations

### Credential Handling

- Never commit API keys or company IDs to version control
- Use environment variables for all credentials
- Rotate API keys periodically via the Ironscales Platform
- Use the minimum permissions necessary for your use case

### Irreversible and Outbound Actions

- `delete` permanently removes a message from **all** mailboxes and destroys the
  evidence with it. `quarantine` is the recoverable default.
- `mark_false_positive` **restores** a contained message to its recipients — it
  reverses containment rather than tightening it.
- `report_to_microsoft` cannot be recalled.
- `notify_users: true` mails the customer's end users and cannot be unsent.
  It defaults to `false`; leave it there unless asked.
- `ironscales_email_classify` sends customer message content — subject, plain
  text and HTML bodies, URLs, headers — outbound to Ironscales. Its
  `attachments` schema is metadata only (`filename`, `content_type`,
  `size_bytes`); never put file contents in it.
- An allowlist `domain` entry exempts every sender on that domain from phishing
  detection company-wide — a far larger grant than an `email` entry, and one
  that produces no alert until someone spoofs it.

### HTTP Transport Security

If using the MCP server over HTTP transport, ensure:
- TLS termination via a reverse proxy
- Restrict access to trusted networks
- Use authentication at the proxy layer

## Troubleshooting

### Authentication Errors

If you see "401 Unauthorized":
1. Verify `IRONSCALES_API_KEY` is set correctly
2. Confirm `IRONSCALES_COMPANY_ID` matches your tenant
3. Check that the API key has not been revoked at Ironscales Platform > Settings > API

### Classification Returned a Verdict but Nothing Changed

Working as designed. `ironscales_email_classify` is stateless — it analyses raw
email content and returns a verdict without touching any incident. If you
wanted incident state to change, call `ironscales_remediation_act`.

### Remediation Rejected or Partially Applied

1. Verify you have the correct `incident_id` (snake_case, not `incidentId`)
2. Confirm the incident is not already `closed` — the resulting error often
   reads like a permissions failure. Valid statuses are `open`,
   `in_progress`, `pending`, and `closed`; there is no `resolved`
3. Check that your API key has write permissions
4. Partial success is normal: remediation reach depends on the customer's
   M365/Exchange integration, not on this plugin. Verify that integration and
   clear the remaining mailboxes manually

### Empty Incident List When Incidents Exist

1. Verify the `status` filter is correct — default may be filtering to a specific status
2. Confirm `IRONSCALES_COMPANY_ID` matches the tenant where incidents are located
3. Remember there is no total count in the response — page by `offset` until a
   call returns fewer records than `limit`

## API Documentation

- [Ironscales API Documentation](https://ironscales.com/api-docs)
- [Ironscales Knowledge Base](https://support.ironscales.com)

## Contributing

See the main [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

All contributions require a PRD in the `prd/` directory before implementation.

## Changelog

### 0.1.0 (2026-03-02)

- Initial release
- 2 skills: api-patterns, incidents
- 2 commands: triage-incidents, classify-email
