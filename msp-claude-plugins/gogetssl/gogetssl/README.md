# GoGetSSL Plugin

Claude Code plugin for [GoGetSSL](https://www.gogetssl.com), the SSL certificate reseller platform many MSPs use to buy and renew client certificates.

## What It Does

- **Certificate expiry tracking**: lists every certificate order with its expiry date, grouped by client domain, and sorted into renewal tiers
- **Renewal preparation**: product and price lookups for a renewal quote, the approver email addresses GoGetSSL accepts for email domain validation, and CSR checks before a reissue
- **Balance and invoice reconciliation**: prepaid balance, unpaid orders and invoices, and invoice line items by date window for per-client billing
- **LEI status**: status and validity of Legal Entity Identifier orders

The plugin is **read-only**. Conduit exposes 20 GoGetSSL tools and none of them places, renews, reissues, cancels or pays for an order, or changes a domain validation method. Those steps stay in the GoGetSSL client area.

## Installation

```
/plugin marketplace add WYRE-AI/msp-claude-plugins
/plugin install gogetssl
```

This plugin ships no `.mcp.json`. Install the `wyre-gateway` plugin (or any workflow pack), which connects Claude Code to [Conduit](https://conduit.wyre.ai) at `https://conduit.wyre.ai/v1/mcp`, then connect GoGetSSL in the Conduit web UI (`/connect/gogetssl`). Conduit stores the credentials and injects them on every request, so there are no environment variables or headers to set on the client.

> The GoGetSSL connector is new in Conduit. If it does not appear in your Conduit catalog yet, it is still rolling out.

## Connecting GoGetSSL in Conduit

Conduit asks for two fields:

| Conduit field | Header sent to the server | Where to find it |
|---------------|---------------------------|------------------|
| Client-area username | `X-GoGetSSL-Username` | The username you sign in to my.gogetssl.com with |
| API password | `X-GoGetSSL-Api-Password` | Client area > Reseller Modules > API settings |

Things to know before you connect:

- **Use the API password, not your account password.** GoGetSSL issues a separate API password under Reseller Modules > API settings. Your normal sign-in password is rejected.
- **The API password can spend money.** It can also place orders and spend your prepaid balance through GoGetSSL's API, even though Conduit only reads. Treat it like a payment credential, and regenerate it in Reseller Modules > API settings if it is ever exposed.
- **IP restrictions.** If you restrict API access by IP in GoGetSSL, add Conduit's egress IP to the list or every call fails.

The credentials live only in the Conduit connection. Conduit drops any `X-GoGetSSL-*` header a client sends, so there is nothing to configure outside the Conduit UI.

API reference: [GoGetSSL API (Postman)](https://documenter.getpostman.com/view/5593375/T1LHFp7m).

## Skills

| Skill | Covers |
|-------|--------|
| `api-patterns` | Auth through the Conduit connection, the single-account model, paging, response limits, errors |
| `certificate-expiry` | Expiry sweeps across every client domain, renewal tiers, batch status checks |
| `renewal-prep` | Product and price lookup, DCV approver emails, CSR decoding, balance check before renewing |
| `billing-reconciliation` | Balance, unpaid orders and invoices, invoice line items by period, per-client rebilling |

## Agents

| Agent | Purpose |
|-------|---------|
| `ssl-renewal-planner` | Runs the monthly sweep: finds expiring certificates, checks each one's renewal readiness, prices the renewals against the balance, and produces a renewal plan |

## Tools

All 20 tools are read tier. None is admin-gated in Conduit, so any member with access to the GoGetSSL connector can call them.

### Account
- `gogetssl_account_get`: reseller account details; also the connection test
- `gogetssl_account_get_balance`: prepaid balance and currency
- `gogetssl_account_get_total_orders`: count of active orders

### Orders and certificates
- `gogetssl_orders_list`: every order with `valid_from`, `valid_till` and `common_name`; the main expiry tool
- `gogetssl_orders_list_ssl`: order IDs and statuses, paged with `limit` and `offset`
- `gogetssl_orders_get_status`: full detail for one order (domains, SANs, validation status, certificate and CA bundle); personal admin and tech contact fields are removed
- `gogetssl_orders_get_statuses`: status and expiry for up to 100 orders in one call
- `gogetssl_orders_list_unpaid`: unpaid orders
- `gogetssl_orders_get_invoice`: the invoice for one order

### Invoices
- `gogetssl_invoices_list`: all invoices
- `gogetssl_invoices_list_unpaid`: unpaid invoices
- `gogetssl_invoices_list_by_period`: invoices with line items for a window of up to 365 days
- `gogetssl_invoices_get`: one invoice with line items

### Products
- `gogetssl_products_list`: product catalog with periods and wildcard, SAN and DCV support
- `gogetssl_products_list_ssl`: SSL products with brand, validation type and prices
- `gogetssl_products_list_prices`: partner price per product and period
- `gogetssl_products_get`: full spec of one product

### LEI, DCV and CSR
- `gogetssl_lei_get_status`: LEI order status, code and validity
- `gogetssl_dcv_get_domain_emails`: approver addresses accepted for email validation of a domain
- `gogetssl_csr_decode`: decode and check a CSR (public block only; input containing a private key is refused)

## Limits

- **No per-client scoping.** A GoGetSSL reseller account is one flat list of orders. The skills group certificates by domain (`common_name`); mapping domains to clients is up to you or your PSA.
- **No writes.** Ordering, renewing, reissuing, adding SANs, cancelling, resending validation email and changing a DCV method are not available through this plugin.
- **No private keys.** CSR generation is not exposed because it returns a private key, and `gogetssl_csr_decode` refuses any input containing one.

## License

Apache-2.0
