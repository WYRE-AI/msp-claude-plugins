# Mimecast Plugin

Claude Code plugin for Mimecast Email Security.

## Overview

This plugin provides Claude with deep knowledge of Mimecast, enabling:

- **Message Tracking** - Trace email delivery, search messages, and manage held messages
- **Threat Intelligence** - Review TTP (Targeted Threat Protection) logs for URL clicks, malicious attachments, and impersonation attempts
- **Queue Management** - Monitor the email delivery queue and identify stuck messages
- **Audit & Compliance** - Access audit event logs for security investigations

## Prerequisites

### API Credentials

Mimecast authenticates via OAuth 2.0 client credentials. The MCP Gateway injects credentials via headers:

| Header | Description |
|--------|-------------|
| `X-Mimecast-Client-ID` | OAuth 2.0 Client ID |
| `X-Mimecast-Client-Secret` | OAuth 2.0 Client Secret |
| `X-Mimecast-Region` | Regional API endpoint (us, eu, de, ca, za, au) |

To obtain credentials:

1. Log into the [Mimecast Administration Console](https://login.mimecast.com)
2. Navigate to **Services > API and Platform Integrations**
3. Select **Your Application Integrations** and register a new application
4. Note the Client ID and Client Secret

### Regional Endpoints

Mimecast operates regional API endpoints. Use the region matching your Mimecast tenant:

| Region | Base URL |
|--------|----------|
| Global / US | `https://api.services.mimecast.com` |
| UK / EU | `https://eu-api.mimecast.com` |
| Germany | `https://de-api.mimecast.com` |
| Canada | `https://ca-api.mimecast.com` |
| South Africa | `https://za-api.mimecast.com` |
| Australia | `https://au-api.mimecast.com` |

## Installation

### Via MCP Gateway (Recommended)

Use the [MCP Gateway](https://conduit.wyre.ai) to connect — enter your Client ID, Client Secret, and select your region.

### Self-Hosted (Docker)

Run the Mimecast MCP server via Docker with the MCP Gateway self-hosted option. See the [MCP Gateway documentation](https://mcp.wyre.ai) for setup instructions.

### Claude Code CLI

Add the `.mcp.json` from this plugin to your project and set the environment variables:

```bash
export MIMECAST_CLIENT_ID="your-client-id"
export MIMECAST_CLIENT_SECRET="your-client-secret"
export MIMECAST_REGION="us"
```

## Available Skills

| Skill | Description |
|-------|-------------|
| `api-patterns` | OAuth 2.0 authentication, regional endpoints, available tools, pagination |
| `message-tracking` | Search messages, trace delivery, hold and release messages |
| `threat-intelligence` | TTP logs — URL clicks, attachment analysis, impersonation, incidents |
| `queue-management` | Email delivery queue status, identifying stuck messages |

## Available Commands

| Command | Description |
|---------|-------------|
| `/trace-message` | Trace an email by sender, recipient, subject, or date range |
| `/review-threats` | Review TTP threat logs for URL clicks, malicious attachments, impersonation |
| `/check-queue` | Check email delivery queue status and identify stuck messages |

## Quick Start

### Trace a Suspicious Email

```
/trace-message --sender "phishing@example.com" --recipient "user@client.com"
```

### Review Today's Threats

```
/review-threats
```

### Check Delivery Queue

```
/check-queue
```

## Security Considerations

### Credential Handling

- Never commit Client IDs or secrets to version control
- Use environment variables for all credentials
- Rotate OAuth credentials periodically via the Mimecast Administration Console
- Use the minimum OAuth scopes necessary for your use case
- Monitor API usage in the Mimecast audit log

### HTTP Transport Security

If using the MCP server over HTTP transport, ensure:
- TLS termination via a reverse proxy
- Restrict access to trusted networks
- Use authentication at the proxy layer

## Troubleshooting

### Authentication Errors

If you see "401 Unauthorized":
1. Verify Client ID and Client Secret are correct
2. Check that your OAuth application has not been revoked
3. Verify you are using the correct regional endpoint for your tenant
4. Regenerate credentials at Mimecast Administration Console > API and Platform Integrations

### Rate Limits

Mimecast enforces rate limits per API endpoint:
1. Use date range filters to reduce result set sizes
2. If rate limited (HTTP 429), wait and retry with exponential backoff
3. Avoid polling — use targeted queries

### Wrong Region

If requests return unexpected errors or empty results:
1. Confirm your tenant's region by logging into the Mimecast console
2. Update `X-Mimecast-Region` / `MIMECAST_REGION` to match your tenant

## API Documentation

- [Mimecast API Documentation](https://developer.services.mimecast.com/api-overview)
- [Mimecast Knowledge Base](https://community.mimecast.com/s/knowledge-base)

## Contributing

See the main [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

All contributions require a PRD in the `prd/` directory before implementation.

## Changelog

### 0.1.0 (2026-03-02)

- Initial release
- 4 skills: api-patterns, message-tracking, threat-intelligence, queue-management
- 3 commands: trace-message, review-threats, check-queue
