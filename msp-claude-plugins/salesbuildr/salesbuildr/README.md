# Salesbuildr Plugin

CRM plugin for Salesbuildr - manage companies, contacts, products, opportunities, and quotes for MSP sales workflows.

## Installation

```
/plugin marketplace add WYRE-AI/msp-claude-plugins
/plugin install wyre-gateway@msp-claude-plugins
/plugin install salesbuildr@msp-claude-plugins
```

Then connect Salesbuildr in Conduit (see **Connect through Conduit**). The plugin adds skills and commands; the tools come from the Conduit connector.

## Configuration

### Connect through Conduit

This plugin ships no `.mcp.json` and reads no environment variables. Connect Salesbuildr once in Conduit at `https://conduit.wyre.ai/connect/salesbuildr` (**Connections → SalesBuildr**, slug `salesbuildr`); Conduit stores the credentials and injects them on every request. Then install the `wyre-gateway` plugin (or add the unified connector `https://conduit.wyre.ai/v1/mcp` to your MCP client); your client signs in to Conduit with OAuth.

| Conduit connection field |
|---|
| API Key |

Conduit checks the key against the Salesbuildr public API (`https://portal.salesbuildr.com/public-api`) when you save the connection.

### Obtaining Credentials

1. Log in to your Salesbuildr portal
2. Navigate to **Settings > API Keys**
3. Generate a new API key
4. Paste the key into the Conduit connection

## Self-Hosted Gateway

There is no per-plugin URL setting, and setting an environment variable does not register an MCP server. To use your own gateway instead of Conduit, register it as an MCP server in your client, for example `claude mcp add --transport http salesbuildr https://your-gateway-domain/v1/salesbuildr/mcp`. The gateway then holds the Salesbuildr credentials, not the client. In that case install only this plugin (`/plugin install salesbuildr@msp-claude-plugins`) and skip `wyre-gateway` and the Conduit connection.

## Available Skills

| Skill | Description |
|-------|-------------|
| [api-patterns](skills/api-patterns/) | Salesbuildr API authentication, pagination, and error handling |
| [companies-contacts](skills/companies-contacts/) | Company and contact search, lookup, and creation |
| [products](skills/products/) | Product catalog search and pricing |
| [opportunities](skills/opportunities/) | Sales pipeline and opportunity management |
| [quotes](skills/quotes/) | Quote creation, search, and line item management |

## Available Commands

| Command | Description |
|---------|-------------|
| `/search-companies` | Search for companies in Salesbuildr |
| `/search-contacts` | Search for contacts, optionally filtered by company |
| `/create-contact` | Create a new contact |
| `/search-products` | Search the product catalog |
| `/search-opportunities` | Search and filter opportunities |
| `/create-opportunity` | Create a new sales opportunity |
| `/create-quote` | Create a new quote with line items |
| `/search-quotes` | Search for quotes |
| `/get-quote` | Get detailed quote information with line items |
| `/update-opportunity` | Update an opportunity's status or details |

## API Documentation

- [Salesbuildr Public API](https://portal.salesbuildr.com/public-api)

## Rate Limits

- 500 requests per 10 minutes
- Plugin implements conservative request patterns

## Troubleshooting

### Authentication Errors

If a tool call returns "401 Unauthorized":
1. Open the Salesbuildr connection in Conduit (`https://conduit.wyre.ai/connect/salesbuildr`) and check the API Key
2. Check that the key has not been revoked in Salesbuildr under **Settings > API Keys**
3. Generate a new key if needed, then update the Conduit connection
