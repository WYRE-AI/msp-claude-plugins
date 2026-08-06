# PandaDoc Plugin

Claude Code plugin for PandaDoc document automation and e-signature integration.

## Overview

This plugin provides Claude with deep knowledge of PandaDoc, enabling:

- **Document Management** - Create, send, and track proposals, contracts, and quotes
- **Template Library** - Browse and use reusable document templates for MSAs, SOWs, and proposals
- **E-Signature Workflows** - Send documents for signature, track completion, and download signed copies
- **Recipient Management** - Add recipients, set signing order, and monitor signature status
- **Proposal Pipeline** - Track document status across your MSP sales pipeline

## Prerequisites

### API Key

PandaDoc provides a hosted MCP server that uses API key authentication:

1. Log into PandaDoc at [app.pandadoc.com](https://app.pandadoc.com)
2. Navigate to **Settings > Integrations > API** (or visit [app.pandadoc.com/a/#/settings/integrations/api](https://app.pandadoc.com/a/#/settings/integrations/api))
3. Generate an API key
4. Set the key as an environment variable

### Environment Variables

```bash
export PANDADOC_API_KEY="your-api-key"
```

## Installation

### Via MCP Gateway (Recommended)

Use the [MCP Gateway](https://conduit.wyre.ai) to connect -- just paste your API key and you're done.

### Self-Hosted (Claude Desktop)

Add to your Claude Desktop config:

```json
{
  "mcpServers": {
    "pandadoc": {
      "command": "npx",
      "args": [
        "-y", "mcp-remote",
        "https://developers.pandadoc.com/mcp",
        "--header", "Authorization:API-Key YOUR_API_KEY"
      ]
    }
  }
}
```

> **Note:** PandaDoc hosts their own MCP server at `https://developers.pandadoc.com/mcp`. This plugin adds MSP-specific skills, commands, and workflow knowledge on top of PandaDoc's official server.

## Available Skills

| Skill | Description |
|-------|-------------|
| `api-patterns` | PandaDoc MCP connection, API key auth, tools reference, and best practices |
| `documents` | Document creation, sending, status tracking, and download |
| `templates` | Template library browsing and template-based document creation |
| `recipients` | Recipient management, signing order, and completion tracking |
| `proposals` | MSP proposal workflows -- MSAs, SOWs, hardware quotes, and project proposals |

## Available Commands

| Command | Description |
|---------|-------------|
| `/create-document` | Create a new document from a PandaDoc template |
| `/send-document` | Send a document for signature |
| `/document-status` | Check the status of a document and its recipients |
| `/list-templates` | List all available PandaDoc templates |
| `/proposal-pipeline` | Summarize the proposal pipeline by status, value, and age |

## Quick Start

### Create a Document from Template

```
/create-document --template "Managed Services Agreement" --recipient_email "client@acme.com" --recipient_name "John Smith"
```

### Send a Document for Signature

```
/send-document --document_name "Acme Corp MSA" --message "Please review and sign the attached agreement."
```

### Check Document Status

```
/document-status --document_name "Acme Corp MSA"
```

### View Proposal Pipeline

```
/proposal-pipeline
```

## Security Considerations

### API Key

- Never commit API keys to version control
- Use environment variables for all credentials
- Rotate keys periodically via PandaDoc Settings > API
- Monitor for unexpected API activity in the PandaDoc dashboard
- API keys have full access to your PandaDoc workspace -- treat them like passwords

## Troubleshooting

### Authentication Errors

If you see "401 Unauthorized":
1. Verify `PANDADOC_API_KEY` is set correctly
2. Check that the key has not been revoked in PandaDoc Settings > API
3. Ensure the key is prefixed with `API-Key ` in the Authorization header (the MCP config handles this automatically)
4. Generate a new key at [app.pandadoc.com](https://app.pandadoc.com) > Settings > Integrations > API

### Document Errors

If documents fail to create or send:
1. Verify the template exists and is active
2. Check that all required template fields/variables are provided
3. Ensure recipient email addresses are valid
4. Confirm your PandaDoc plan supports the requested features (e-signatures, API access)

### Rate Limiting

If you see "429 Too Many Requests":
1. Wait for the rate limit window to reset
2. Reduce the frequency of requests
3. Use pagination to reduce total call count

## API Documentation

- [PandaDoc API Documentation](https://developers.pandadoc.com/reference)
- [PandaDoc MCP Server](https://developers.pandadoc.com/mcp)
- [PandaDoc Developer Portal](https://developers.pandadoc.com)
- [PandaDoc Help Center](https://support.pandadoc.com)

## Contributing

See the main [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

All contributions require a PRD in the `prd/` directory before implementation.

## Changelog

### 0.1.0 (2026-02-24)

- Initial release
- 5 skills: api-patterns, documents, templates, recipients, proposals
- 5 commands: create-document, send-document, document-status, list-templates, proposal-pipeline
