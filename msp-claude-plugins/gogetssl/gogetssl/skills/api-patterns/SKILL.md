---
name: "GoGetSSL API Patterns"
description: >
  GoGetSSL MCP fundamentals: the username plus API-password credential pair
  Conduit sends as X-GoGetSSL-* headers, the sidecar's cached auth-key login,
  the flat 20-tool read-only surface (none admin-gated), the single reseller
  account model with no client scoping, which list tools page and which do
  not, response-size limits, and GoGetSSL's error envelope.
when_to_use: >-
  When connecting GoGetSSL through Conduit, debugging a failed GoGetSSL tool
  call, or deciding which GoGetSSL list tool to page through. Use when:
  gogetssl api, gogetssl authentication, gogetssl api password, gogetssl
  connection error, gogetssl pagination, gogetssl mcp, or gogetssl tools.
---

# GoGetSSL MCP Tools & API Patterns

## Overview

GoGetSSL is an SSL certificate reseller. An MSP holds one reseller account,
tops up a prepaid balance, and buys certificates for client domains from it.
The GoGetSSL MCP server (`gogetssl-mcp`) wraps the GoGetSSL API v1 at the
fixed host `https://my.gogetssl.com/api` and exposes 20 read tools. It never
orders, renews, reissues, cancels or pays for anything.

## Connection & Authentication

Conduit asks for two fields in its web UI (`/connect/gogetssl`), stores them,
and forwards them to the MCP server as headers. Nothing is set on the client,
and Conduit drops any `X-GoGetSSL-*` header a client sends:

| Conduit field | Header |
|---------------|--------|
| Client-area username | `X-GoGetSSL-Username` |
| API password | `X-GoGetSSL-Api-Password` |

There is no `Authorization` header and no Bearer token. GoGetSSL's API uses a
two-step login: the server posts the username and API password to the
vendor's auth endpoint, gets back a session key, and sends that key as the
`auth_key` query parameter on every later call. The sidecar does this for
you, caches the key in memory for 12 hours, and if GoGetSSL rejects a cached
key it logs in again and retries once. You never handle the key.

Connect-time gotchas, all from Conduit's connect note:

- **API password, not account password.** The API password lives in Client
  area > Reseller Modules > API settings. Conduit validates the pair by
  logging in, and the account password fails with "GoGetSSL rejected the
  username or API password".
- **The credential can spend money.** The same API password can place orders
  and spend the balance through GoGetSSL's own API. Conduit only reads, but
  if the password is exposed, regenerate it in Reseller Modules > API
  settings.
- **IP allowlist.** If the GoGetSSL account restricts API access by IP,
  Conduit's egress IP must be on the list, or every call fails at login.

Use `gogetssl_account_get` as the connection test. It returns the company,
contact email, reseller plan and currency, which also confirms which account
the credentials belong to.

## Tool Surface

All 20 tools are listed flat in `tools/list`, all are read tier, and **none
is admin-gated in Conduit** (no tool is marked `isAdmin`). Conduit does not
cache GoGetSSL results yet, so every call goes to the vendor.

| Domain | Tools |
|--------|-------|
| Account | `gogetssl_account_get`, `gogetssl_account_get_balance`, `gogetssl_account_get_total_orders` |
| Orders | `gogetssl_orders_list`, `gogetssl_orders_list_ssl`, `gogetssl_orders_get_status`, `gogetssl_orders_get_statuses`, `gogetssl_orders_list_unpaid`, `gogetssl_orders_get_invoice` |
| Invoices | `gogetssl_invoices_list`, `gogetssl_invoices_list_unpaid`, `gogetssl_invoices_list_by_period`, `gogetssl_invoices_get` |
| Products | `gogetssl_products_list`, `gogetssl_products_list_ssl`, `gogetssl_products_list_prices`, `gogetssl_products_get` |
| LEI | `gogetssl_lei_get_status` |
| Validation | `gogetssl_dcv_get_domain_emails` |
| CSR | `gogetssl_csr_decode` |

`gogetssl_orders_get_statuses` and `gogetssl_dcv_get_domain_emails` are POST
requests at the vendor, but both are lookups that change nothing.
`gogetssl_csr_decode` is also a POST and is the one tool that sends no auth
key: it only decodes the CSR you pass it.

## One Account, No Client Scoping

GoGetSSL has no concept of a client or sub-account inside a reseller
account. Every order sits in one flat list. To report per client:

1. Pull orders with `gogetssl_orders_list`.
2. Group by `common_name` (and the registrable domain under it, so
   `www.contoso.com` and `mail.contoso.com` land together).
3. Map domains to clients from your PSA or documentation platform. Say so in
   the output when a domain could not be mapped instead of guessing.

## Paging and Response Size

| Tool | Paging |
|------|--------|
| `gogetssl_orders_list` | Not paged by the vendor. Narrow it with `status` (`active`, `processing`, `expired`, `revoked`, `rejected`). |
| `gogetssl_orders_list_ssl` | `limit` 1-1000 (larger values are capped, vendor default 1000) and `offset`. The response echoes `limit`, `offset` and `count`. The server never pages for you: call again with `offset + limit` until a page comes back short. |
| `gogetssl_orders_get_statuses` | `cids` takes 1-100 numeric order IDs. Batch larger sets in groups of 100. |
| `gogetssl_invoices_list_by_period` | `date_from` / `date_till` in `YYYY-MM-DD`, at most 365 days apart. Without dates it returns the last 365 days. |

Two size limits apply. The server refuses a vendor response over 4 MB, with
an error telling you to narrow the query with a status filter, a limit, or a
shorter date range. Tool output is also truncated at about 60,000 characters,
so on a large account always pass `status` to `gogetssl_orders_list` rather
than pulling every order ever placed.

## Errors

GoGetSSL reports errors as `{error: true, message, description}`, sometimes
with HTTP 200. The server checks the body as well as the status, so an error
envelope always surfaces as a tool error of the form
`GoGetSSL API error (HTTP <status>) on <method> <path>: <hint>. <message>`.

| Status / message | Meaning | Action |
|------------------|---------|--------|
| "GoGetSSL login failed" | Username or API password rejected at login | Check the pair in Conduit; confirm it is the API password; check the IP allowlist |
| 401 / 403, or a message about the auth key | Session key rejected | The server already re-logged in and retried once. If it still fails, the API password was likely regenerated: update it in Conduit |
| 404 | Unknown order, invoice or product ID | Re-list to confirm the ID |
| 429 | Rate limited | Wait for the `Retry after Ns` value in the message, then retry |
| "timed out or was cancelled" | Request exceeded 30 seconds | Narrow the query and retry |
| "redirect ... refusing to follow it" | GoGetSSL answered with a redirect | Treat as a vendor-side issue; retry later |

Argument errors come back before any vendor call: order IDs must be numeric,
dates must be `YYYY-MM-DD`, domains must be a bare FQDN (no scheme, path or
wildcard), and a CSR containing a private key is refused.

## Rate Limits

GoGetSSL publishes no rate limit. Keep sweeps serial rather than firing many
calls at once, prefer one `gogetssl_orders_get_statuses` call over 100
separate `gogetssl_orders_get_status` calls, and back off on a 429.

## Related Skills

- [certificate-expiry](../certificate-expiry/SKILL.md): expiry sweeps and renewal tiers
- [renewal-prep](../renewal-prep/SKILL.md): pricing, DCV approver emails and CSR checks
- [billing-reconciliation](../billing-reconciliation/SKILL.md): balance, unpaid items and per-client rebilling
