# ConnectWise CPQ REST Endpoint Catalog

The complete public surface: 19 paths, 29 operations, all on
`https://sellapi.quosalsell.com`. Every request needs
`Authorization: Basic base64(<accessKey>+<publicKey>:<privateKey>)` and
`Content-Type: application/json; version=1.0`.

Shared list query parameters: `conditions`, `includeFields`, `page`, `pageSize`,
and — where noted — `showAllVersions`.

## Quotes (`QuoteView`, ~204 properties)

| Verb | Path | Notes |
|---|---|---|
| GET | `/api/quotes` | List. Supports `showAllVersions`. Bare array response. |
| GET | `/api/quotes/{id}` | Get by GUID. |
| PATCH | `/api/quotes/{id}` | RFC 6902 ops array. Returns the updated QuoteView. |
| DELETE | `/api/quotes/{id}` | 204. Takes tabs, items and terms with it. |
| POST | `/api/quotes/copyById/{id}` | The **only** create path. No body. Returns the new QuoteView. |
| GET | `/api/quotes/{quoteNumber}/versions` | All versions of a quote number. |
| GET | `/api/quotes/{quoteNumber}/versions/latest` | Latest version. |
| GET | `/api/quotes/{quoteNumber}/versions/{quoteVersion}` | A specific version. |
| DELETE | `/api/quotes/{quoteNumber}/versions/{quoteVersion}` | 204. |

There is no `POST /api/quotes`.

## Quote Items (`QuoteItemView`, ~224 properties)

| Verb | Path | Notes |
|---|---|---|
| GET | `/api/quoteItems` | List across quotes. Supports `showAllVersions`. Filter with `conditions=idQuote = "<guid>"`. |
| POST | `/api/quoteItems` | Create. Body needs `idQuote` and `idQuoteTabs` to place the line. |
| GET | `/api/quoteItems/{id}` | Get. |
| PATCH | `/api/quoteItems/{id}` | RFC 6902 ops array. |
| DELETE | `/api/quoteItems/{id}` | 204. |

## Quote Customers (`CustomerView`, 33 properties)

| Verb | Path | Notes |
|---|---|---|
| GET | `/api/quotes/{quoteId}/customers` | Customer records attached to this quote. |
| PUT | `/api/quotes/{quoteId}/customers/{id}` | Full replace — the only PUT in the API. |
| PATCH | `/api/quotes/{quoteId}/customers/{id}` | RFC 6902 ops array. |
| DELETE | `/api/quotes/{quoteId}/customers/{id}` | 204. |

No global customer directory endpoint exists.

## Quote Tabs (`QuoteTabView`, ~175 properties)

| Verb | Path | Notes |
|---|---|---|
| GET | `/api/quoteTabs` | List. Supports `showAllVersions`. Filter with `conditions=idQuote = "<guid>"`. |
| GET | `/api/quoteTabs/{id}/quoteItems` | Items on one tab. |

Read-only: no POST/PATCH/DELETE for tabs.

## Quote Terms (`QuoteTermView`, 61 properties)

| Verb | Path | Notes |
|---|---|---|
| GET | `/api/quotes/{quoteId}/quoteTerms` | List. |
| POST | `/api/quotes/{quoteId}/quoteTerms` | Create. |
| PATCH | `/api/quotes/{quoteId}/quoteTerms/{id}` | RFC 6902 ops array. |
| DELETE | `/api/quotes/{quoteId}/quoteTerms/{id}` | 204. |

## Lookups and settings

| Verb | Path | Shape |
|---|---|---|
| GET | `/api/templates` | `QuoteView[]` — templates are quotes. No query parameters. |
| GET | `/api/taxCodes` | `{ id, taxCode, taxRate, gstRate, pstRate, taxExternalXref, isCalculatedExternally }` |
| GET | `/api/recurringRevenues` | `{ id, description, periodType, duration, externalXref, cycle }` |
| GET | `/settings/user` | `UserView` — 39 properties including `userName`, `emailAddress`, `isApiUser`, `isAdministrator`, `isApprover`, `canAccessAllQuotes`. Note the non-`/api` prefix. |
| PATCH | `/settings/user/{id}` | RFC 6902 on `UserView`. Not exposed as an MCP tool. |

## Worked requests

Credential ping:

```bash
curl -s "https://sellapi.quosalsell.com/api/taxCodes?pageSize=1" \
  -H "Authorization: Basic $(printf '%s+%s:%s' "$CPQ_ACCESS_KEY" "$CPQ_PUBLIC_KEY" "$CPQ_PRIVATE_KEY" | base64)" \
  -H "Content-Type: application/json; version=1.0" \
  -H "Accept: application/json"
```

Search quotes:

```bash
curl -sG "https://sellapi.quosalsell.com/api/quotes" \
  --data-urlencode 'conditions=isArchive = False AND createDate >= [2026-07-01]' \
  --data-urlencode 'includeFields=id,name,quoteNumber,quoteVersion,quoteStatus,quoteTotal' \
  --data-urlencode 'page=1' --data-urlencode 'pageSize=100' \
  -H "Authorization: Basic $TOKEN" -H "Content-Type: application/json; version=1.0"
```

Create a quote by copying a template, then rename it:

```bash
curl -s -X POST "https://sellapi.quosalsell.com/api/quotes/copyById/$TEMPLATE_ID" \
  -H "Authorization: Basic $TOKEN" -H "Content-Type: application/json; version=1.0"

curl -s -X PATCH "https://sellapi.quosalsell.com/api/quotes/$NEW_ID" \
  -H "Authorization: Basic $TOKEN" -H "Content-Type: application/json; version=1.0" \
  -d '[{"op":"replace","path":"/name","value":"Acme — Managed Services FY27"}]'
```

Add a line item:

```bash
curl -s -X POST "https://sellapi.quosalsell.com/api/quoteItems" \
  -H "Authorization: Basic $TOKEN" -H "Content-Type: application/json; version=1.0" \
  -d '{"idQuote":"<quote-guid>","idQuoteTabs":"<tab-guid>","mfgPartNumber":"ABC-123","quantity":2,"basePrice":199.0,"cost":120.0}'
```
