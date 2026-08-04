---
name: "ConnectWise CPQ API Patterns"
description: >
  ConnectWise CPQ (Sell/Quosal) API fundamentals: three-part Basic auth built
  from an access key plus an API key pair, the versioned content type, the flat
  25-tool `cpq_*` surface, Manage-style `conditions` filtering, `includeFields`
  trimming of the 200+ property views, page/pageSize paging over bare arrays,
  RFC 6902 JSON Patch updates, and the endpoints CPQ deliberately does not expose.
when_to_use: >-
  When connecting to ConnectWise CPQ or shaping a CPQ request — authentication,
  filtering, paging, field selection, patch bodies, or error handling. Use when:
  connectwise cpq api, cpq authentication, cpq access key, cpq conditions, cpq
  pagination, cpq includeFields, cpq json patch, quosal api, connectwise sell api,
  or sellapi.quosalsell.com.
---

# ConnectWise CPQ MCP Tools & API Patterns

## Overview

ConnectWise CPQ (formerly ConnectWise Sell, originally Quosal) is the quoting and
proposal tool in the ConnectWise stack. The REST API is deliberately small and
quote-centric: 19 paths / 29 operations covering quotes, their line items, tabs,
customers and payment terms, plus a handful of lookup lists. The MCP server exposes
it as 25 flat tools, all prefixed `cpq_`.

CPQ is not ConnectWise PSA. It has its own host, its own auth scheme (no `clientId`),
and a much narrower surface — pair it with the `connectwise-psa` plugin when a workflow
needs opportunities, products, or agreements.

## Anti-triggers

"ConnectWise" brands three products with three unrelated APIs, and their credentials are
not interchangeable. PSA's and CPQ's Basic tokens are the trap: both are
`base64(<something>+<publicKey>:<privateKey>)`, so a company ID and an access key look
identical in the same slot. Authenticating against the wrong product fails as a `401` —
or a `500` when a header is absent entirely — which reads like a permissions problem on
an account that is in fact fine.

- **ConnectWise PSA (Manage)** — regional `api-{na,eu,au}.myconnectwise.net` hosts, a
  `companyId` in the Basic string, and a mandatory `clientId` header CPQ does not use.
  Use `connectwise-psa-api-patterns`.
- **ConnectWise Automate** — on-premise RMM server, `/cwa/api/v1/` base path,
  Bearer-token auth, singular `condition=` filters. Use
  `connectwise-automate-api-patterns`.

## Connection & Authentication

Upstream CPQ uses HTTP Basic with a **three-part** credential:

```
username = <accessKey>+<publicKey>      # note the literal "+" between them
password = <privateKey>
Authorization: Basic base64(<accessKey>+<publicKey>:<privateKey>)
```

| Credential | Where it comes from |
|---|---|
| Access key | The Sell URL while logged in: `.../QuosalWeb/home?accesskey=<this>`. Not the Manage company ID. |
| Public key | Settings > Organization Settings > API Keys |
| Private key | Shown **once**, at key creation. Regenerate the pair if lost. |

Requirements: **CPQ 2022.2 or newer**, and the CPQ user owning the key pair must be
flagged as an **API user** (`isApiUser` on the user record). A non-API user's keys
authenticate as nobody and every call fails.

Through the WYRE MCP gateway the three credentials are supplied as gateway fields and
arrive at the MCP server as headers — the server builds the Basic token itself:

| Gateway header | Credential |
|---|---|
| `X-CPQ-Access-Key` | Access key |
| `X-CPQ-Public-Key` | Public key |
| `X-CPQ-Private-Key` | Private key |

If any of the three headers is missing the server answers `401` (JSON-RPC error
`-32001`) before the tool runs; it never falls back to server-side environment
credentials. Running the server directly instead of through the gateway, the same
values come from `CPQ_ACCESS_KEY`, `CPQ_PUBLIC_KEY`, and `CPQ_PRIVATE_KEY`.

Two things that trip people coming from ConnectWise PSA/Manage:

- **No `clientId` header.** CPQ's spec defines Basic auth only. Sending Manage-style
  client registration headers is harmless but pointless — do not copy Manage auth code.
- **Content type carries a version parameter:** `Content-Type: application/json; version=1.0`
  on every request, mirroring Manage's media-type versioning.

Verify a connection with `cpq_test_connection`, which performs the cheapest
authenticated read (the user list) and reports who the API user is.

## Base URL

```
https://sellapi.quosalsell.com
```

One global host — there are no regional variants (`api-eu`, `api-au`, staging) the way
Manage has them. Tenancy is carried by the **access key**, not the hostname. The base
URL is overridable only if ConnectWise support tells you to change it.

Paths are not uniformly prefixed: entity endpoints live under `/api/...`, but users live
under `/settings/user`.

## Tool Surface

25 flat tools, no router. Reads first, then writes.

| Tool | Purpose |
|---|---|
| `cpq_test_connection` | Verify credentials, report the authenticated API user |
| `cpq_search_quotes` | Search quotes (`conditions`, `includeFields`, `page`, `pageSize`, `showAllVersions`) |
| `cpq_get_quote` | Get a quote by GUID (full QuoteView; renders the quote card) |
| `cpq_get_quote_versions` | List versions of a quote number, or get `latest`/a specific version |
| `cpq_search_quote_items` | Search line items across quotes/tabs |
| `cpq_get_quote_item` | Get one line item by GUID |
| `cpq_list_quote_customers` | Customer records attached to a quote |
| `cpq_search_quote_tabs` | Search quote tabs/sections |
| `cpq_list_quote_terms` | Payment/financing term options on a quote |
| `cpq_list_templates` | Quote templates (the source objects for quote creation) |
| `cpq_list_tax_codes` | Tax codes and rates |
| `cpq_list_recurring_revenues` | Recurring-revenue period definitions |
| `cpq_list_users` | CPQ users (API users, approvers, admins) |
| `cpq_create_quote_from_template` | Copy a template or existing quote — the only create path |
| `cpq_update_quote` | HIGH-IMPACT. Patch quote fields |
| `cpq_create_quote_item` | Add a line item to a tab |
| `cpq_update_quote_item` | Patch a line item |
| `cpq_update_quote_customer` | Patch a customer record on a quote |
| `cpq_create_quote_term` | Add a payment/financing term |
| `cpq_update_quote_term` | Patch a term |
| `cpq_delete_quote_item` | DESTRUCTIVE — irreversible |
| `cpq_delete_quote_term` | DESTRUCTIVE — irreversible |
| `cpq_delete_quote_customer` | DESTRUCTIVE — irreversible |
| `cpq_delete_quote_version` | DESTRUCTIVE — irreversible |
| `cpq_delete_quote` | DESTRUCTIVE — irreversible; takes the tabs, items and terms with it |

See [references/api.md](references/api.md) for the underlying REST endpoint catalog.

## Filtering with `conditions`

List tools take a Manage-style condition string. The syntax is unforgiving about
literal formatting:

| Value type | Form | Example |
|---|---|---|
| String | double quotes | `accountName = "Acme Corp"` |
| Boolean | capitalised `True` / `False` | `isArchive = False` |
| Number | bare | `quoteNumber > 1000` |
| Date | **square brackets, date-only** | `createDate >= [2026-07-01]` |
| List | parenthesised | `quoteStatus in ("Open", "Sent")` |

Operators: `=` `!=` `<` `<=` `>` `>=` `contains` `like` `in` `not in`. Combine with
`AND` / `OR`, parentheses allowed. Nested fields use a slash: `customer/accountName`.

```
conditions: isArchive = False AND createDate >= [2026-07-01]
conditions: idQuote = "3f1c8d2e-1b44-4a90-9f6a-1d0f2e5b7c11"
```

Called with no `conditions`, `cpq_search_quotes` asks for a created-since date and, if
the client cannot answer, defaults to the last 90 days and says so in the result.

## Field Selection

`includeFields` is a comma-separated allowlist and is worth using on nearly every call —
QuoteView carries ~204 properties (60+ of them empty `zCustom*` custom-field slots),
QuoteItemView ~224, QuoteTabView ~175.

```
includeFields: id,name,quoteNumber,quoteVersion,quoteStatus,quoteTotal
```

## Pagination

`page` is 1-based; `pageSize` maxes out at 1000. Responses are **bare JSON arrays** —
no envelope, no total count, no next-page link.

Walk pages until a page returns fewer rows than `pageSize`. The MCP tools wrap results
as `{ count, quotes }` (or `items`, `terms`, ...) — that `count` is the length of the
current page, never a collection total, so never treat it as "how many exist".

`showAllVersions: true` on the quote, quote-item and quote-tab searches includes
superseded quote versions; the default returns latest versions only.

## Updates Are JSON Patch

Every update endpoint takes an **RFC 6902 patch array**, not a merge-patch object.
Sending `{"name": "..."}` where an array of ops is expected fails.

The update tools accept either shape and build the ops for you:

- `fields` — a partial object; each entry becomes a `replace` op
- `patch` — raw RFC 6902 ops, when you need `add`, `remove`, `move`, `copy`, or `test`

Pass one or the other, never both, and never an empty one.

```json
fields: { "name": "Acme — Managed Services FY27", "expirationDate": "2026-09-30T00:00:00Z" }
patch:  [{ "op": "replace", "path": "/name", "value": "Acme — Managed Services FY27" }]
```

Quote customers are the sole resource that also accepts a full-replace PUT upstream; the
MCP surface exposes only the patch path.

## Errors

| Symptom | Cause | Resolution |
|---|---|---|
| `401` + `"An unknown error has occured during basic auth validation"` (vendor typo included) | Wrong access key, wrong key pair, key pair not on an API user, or CPQ older than 2022.2 | Re-copy the access key from the Sell URL; confirm the key owner is flagged as an API user |
| `500` + `"An error has occurred."` | Frequently a **missing** Authorization header, not a server fault — CPQ answers 500, not 401, when credentials are absent entirely | Confirm all three credentials reached the server |
| `-32001` JSON-RPC error from the gateway | One or more `X-CPQ-*` headers missing | Re-enter the CPQ credentials in the gateway |
| Empty array on a search you expected to match | `conditions` formatting — unquoted string, lowercase `true`, or a date with a time component | Re-read the conditions table above |
| `400`/`500` on an update | Merge-patch object sent where an RFC 6902 array is required | Use `fields` or a proper ops array |

Error bodies carry a single `message` key with no error code and no field-level detail.
Successful writes return the entity; `DELETE` returns `204 No Content`.

Rate limits are undocumented for CPQ and no `Retry-After` has been observed. Treat
`429`, `502`, `503` and `504` as retryable with exponential backoff and keep concurrency
modest.

## What CPQ's API Does Not Have

Confirmed absent from the official spec — do not go looking for these tools, and route
the workflow elsewhere:

| Missing | Where it actually lives |
|---|---|
| Create a quote from scratch (`POST /api/quotes`) | Copy a template or existing quote instead — see the quotes skill |
| Product catalog / price sourcing (Etilize, distributor feeds) | The CPQ web app; products reach the API only as already-created quote items |
| Opportunities | The attached PSA/CRM; quotes link out via `crmOpportunityId` |
| Publish / deliver / e-sign / Order Porter verbs | The CPQ web app. `orderPorter*`, `isSent` and approval fields are readable (and some patchable) state, but there is no publish endpoint |
| Order porting to PSA (won quote → sales order) | The CPQ↔PSA integration engine |
| Attachments and PDF generation | The CPQ web app |
| Global customer directory | Customers exist only per quote, synced from the CRM/PSA |
| Quote tab create/update/delete | Read-only over REST; manage tabs in the CPQ web app |
| Webhooks | None — poll with `modifyDate`/`createDate` conditions |

## Related Skills

- [ConnectWise CPQ Quotes](../quotes/SKILL.md) — the quote lifecycle, versions, customers, terms
- [ConnectWise CPQ Quote Items](../quote-items/SKILL.md) — line items, tabs, and pricing fields
