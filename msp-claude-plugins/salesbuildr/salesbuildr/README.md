# Salesbuildr Plugin

CRM plugin for Salesbuildr - manage companies, contacts, products, opportunities, and quotes for MSP sales workflows.

## Installation

```
/plugin marketplace add WYRE-AI/msp-claude-plugins --plugin salesbuildr
```

## Configuration

Add to your `~/.claude/settings.json`:

```json
{
  "env": {
    "SALESBUILDR_API_KEY": "your-api-key-here"
  }
}
```

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `SALESBUILDR_API_KEY` | Yes | API key from Salesbuildr portal (Settings > API Keys) |
| `SALESBUILDR_API_URL` | No | API base URL (default: `https://portal.salesbuildr.com/public-api`) |

### Obtaining Credentials

1. Log in to your Salesbuildr portal
2. Navigate to **Settings > API Keys**
3. Generate a new API key
4. Copy the key to your settings

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
