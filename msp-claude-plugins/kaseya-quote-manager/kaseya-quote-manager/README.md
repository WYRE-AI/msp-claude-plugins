# Kaseya Quote Manager Plugin

Read-only plugin for Kaseya Quote Manager (formerly Datto Commerce) - navigate
quotes, sales orders, purchasing, catalog, CRM, and org data for MSP sales and
distribution workflows.

## Installation

```
/plugin marketplace add WYRE-AI/msp-claude-plugins --plugin kaseya-quote-manager
```

## Configuration

This plugin is served through [Conduit](https://conduit.wyre.ai) (vendor slug `kaseya-quote-manager`). Connect Kaseya Quote Manager once in the Conduit web UI; Conduit stores the key and injects it on every request as `X-Kaseya-Quote-Manager-API-Key`, and the MCP server sends it upstream as the `apiKey` header. Nothing is set on the client.

### Conduit Connection

| Field | Required | Description |
|-------|----------|-------------|
| API Key | Yes | API key from Quote Manager (Settings > API) |

### Obtaining Credentials

1. Log in to Kaseya Quote Manager
2. Navigate to **Settings > API**
3. Generate a new API key
4. Paste the key into the **API Key** field of the Kaseya Quote Manager connection in Conduit

## Read-Only

The entire tool surface is read-only. Every tool is a `kqm_<entity>_list` or
`kqm_<entity>_get` - there are no write tools.

## Available Skills

| Skill | Description |
|-------|-------------|
| [api-patterns](skills/api-patterns/) | Authentication (apiKey header), pagination, rate limits, read-only tool surface |
| [quotes](skills/quotes/) | Quotes -> sections -> lines, and sales orders/lines/payments |
| [purchasing](skills/purchasing/) | Purchase orders, costs, suppliers, product-supplier pricing |

## Available Commands

| Command | Description |
|---------|-------------|
| `/list-quotes` | List quotes, optionally scoped with modifiedAfter |
| `/get-quote` | Get a quote with sections and line items |
| `/get-sales-order` | Get a sales order with lines and payments |

## Tool Domains

- **sales**: quote, quote_section, quote_line, sales_order, sales_order_line, sales_order_payment
- **procurement**: purchase_order, purchase_order_line, purchase_order_cost, supplier, product_supplier
- **catalog**: product, product_image (list only), category, brand
- **crm**: customer, customer_address, contact
- **org**: employee, warehouse

## API Documentation

- [Kaseya Quote Manager API](https://help.quotemanager.kaseya.com/help/Content/2-integrate/api.htm)
- Base URL: `https://api.kaseyaquotemanager.com/v1/`

## Rate Limits

- 60 requests per minute
- 20,000 requests per day
