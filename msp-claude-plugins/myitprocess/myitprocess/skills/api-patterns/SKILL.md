---
name: "myITprocess API Patterns"
description: >
  myITprocess MCP fundamentals: the single X-MyITprocess-Api-Key header Conduit
  sends (forwarded upstream as MITP-API-KEY), the nine read-only list tools and
  their shared page / page_size / filters / sort parameters, the
  {page, pageSize, totalCount, items} response shape, the 50 requests per
  minute account-wide rate limit, and the error messages the server returns.
  Every other myITprocess skill assumes these patterns.
when_to_use: >-
  When connecting to myITprocess through Conduit, building a filtered or sorted
  myITprocess query, paging through results, or diagnosing a failed myITprocess
  tool call. Use when: myitprocess api, myitprocess api key, myitprocess
  pagination, myitprocess filters, myitprocess rate limit, or myitprocess 429.
---

# myITprocess MCP Tools & API Patterns

## Overview

myITprocess (Kaseya) is the vCIO platform MSPs use to run alignment reviews
against their own standards, turn the gaps into findings and roadmap
recommendations, and present them to clients in QBRs. The public API, and
therefore this MCP server, is **read-only**: nine list tools, all `GET`, no
create, update or delete. Nothing in this plugin can change myITprocess data;
review status, recommendation status and meetings are all edited in the
myITprocess UI.

## Connection & Authentication

Conduit stores one credential for the connector, entered in the Conduit web UI
(`/connect/myitprocess`), and sends it on one header. Nothing is set on the
client, and Conduit drops any `X-MyITprocess-Api-Key` header a client sends:

| Conduit field | Gateway header |
|---------------|----------------|
| API Key | `X-MyITprocess-Api-Key` |

The MCP server forwards the key upstream as myITprocess's own `MITP-API-KEY`
header to the fixed host `https://reporting.live.myitprocess.com`. There is no
base URL or region to configure.

Creating the key (from Conduit's connect note):

1. In myITprocess go to **My Account > Account Settings > API Keys > Add API key**.
2. Copy the key immediately; myITprocess masks it after you save.
3. Paste it into the myITprocess connector in Conduit.

The key covers the **whole MSP account** (every client), not one client, and can
be revoked from the same screen. Conduit checks the key on connect by listing
one user; a 401/403 there means the key is inactive or mistyped.

## Tool surface and Conduit permission tiers

| Tool | Returns |
|------|---------|
| `myitprocess_clients_list` | Clients (active and inactive) with alignment score, last review date, last assigned-member activity |
| `myitprocess_reviews_list` | Alignment reviews with status, assigned engineer / vCIO, due and completion dates |
| `myitprocess_reviews_overdue_categories_list` | Standards categories up for review or overdue, per client |
| `myitprocess_users_list` | The MSP's own active myITprocess staff, role and last login |
| `myitprocess_initiatives_list` | Roadmap initiatives and the recommendation IDs grouped under them |
| `myitprocess_findings_list` | Assessment findings from reviews, with linked recommendation ID |
| `myitprocess_meetings_list` | Client meetings (QBRs, strategy) with agenda recommendation IDs |
| `myitprocess_recommendations_list` | Roadmap recommendations with budget, hours, type, status, priority |
| `myitprocess_recommendations_configurations_list` | IT Glue configurations attached to one recommendation |

All nine are classified **read** in Conduit. **None is admin-gated and none is a
write tool**, so any Conduit member with read access to the connector can call
every tool. That still means anyone with access can read every client's
findings, which can describe security gaps; treat output accordingly.

## Shared parameters

Every tool takes the same optional parameters. Unknown parameters are dropped
before the request leaves the server.

| Parameter | Type | Notes |
|-----------|------|-------|
| `page` | integer ≥ 1 | Default 1 |
| `page_size` | integer 1-100 | Default and maximum 100; larger values are capped |
| `filters` | array, max 10 | Each `{field, predicate, condition, operator?}` |
| `sort` | array, max 5 | Each `{field, direction?}`; `direction` is `asc` (default) or `desc` |

`myitprocess_recommendations_configurations_list` also **requires**
`recommendation_id` (a positive integer from `myitprocess_recommendations_list`).

### Filters

- `field` must be one of the tool's filterable fields (the enum in the tool's
  input schema). Nested fields use dot notation: `client.id`, `client.name`,
  `assignedVCIO.fullName`, `review.id`, `initiative.id`.
- `predicate` is one of `equal`, `notEqual`, `greaterThan`, `lessThan`,
  `contains`. Which predicates work depends on the field's type.
- `condition` is a string, number, boolean, or `null` (`null` matches an empty
  value, e.g. a review with no `vcioCompleteDate`).
- `operator` (`and` / `or`, default `and`) says how this filter combines with
  the **previous** one.
- **Array fields cannot be filtered or sorted.** The recommendation IDs on a
  meeting or initiative, and the finding IDs and feedback on a recommendation,
  come back in the results but are not in any tool's field list.

Example: a client's high-priority recommendations that have not been discussed,
largest budget first.

```json
{
  "filters": [
    { "field": "client.id", "predicate": "equal", "condition": 1234 },
    { "field": "priority", "predicate": "equal", "condition": "High" },
    { "field": "status", "predicate": "equal", "condition": "NotDiscussed" }
  ],
  "sort": [{ "field": "budget", "direction": "desc" }]
}
```

## Pagination

Each call returns exactly **one page**:

```json
{ "page": 1, "pageSize": 100, "totalCount": 237, "items": [ ... ] }
```

The server never auto-pages. Compare `totalCount` with what you have fetched and
request `page: 2`, `page: 3`, ... until you have it all, or narrow with filters.
Do not report a total from `items.length` when `totalCount` is larger.

## Rate limit

myITprocess allows **50 requests per minute per MSP account**, and that budget
is shared with every other integration using the same key. The MCP server does
**not** retry a 429; it reports it. Practical consequences:

- Prefer one filtered call over paging through everything.
- Use `page_size: 100` (the default) so each request carries as much as possible.
- For a portfolio sweep, list clients once and work from that list instead of
  re-querying per client where a single filtered call would do.
- On a 429, stop and wait (the error includes `Retry after Ns.` when myITprocess
  sends it) rather than immediately calling again.

## Errors

Errors come back as tool results starting `Error:`. The ones you will see:

| Message contains | Cause | Action |
|------------------|-------|--------|
| `HTTP 401` / `HTTP 403` `the API key is invalid, revoked, or missing` | Key revoked, mistyped, or not set | Create a new key and update the Conduit connector |
| `No myITprocess API key on this request` | Connector has no stored key | Connect myITprocess in Conduit |
| `HTTP 400` `the request parameters were rejected` / `invalid fields: ...` | Filter or sort myITprocess did not accept | Check the field name and predicate type; drop the filter and filter client-side if needed |
| `must be one of: ...` | `field`, `predicate`, `operator` or `direction` outside the allowed list | Use a value from the listed set |
| `HTTP 404` `not found` | Unknown `recommendation_id` | Re-list recommendations to confirm the ID |
| `HTTP 429` `rate limited` | Account-wide 50/min budget used up | Wait (see `Retry after`), then continue with fewer, filtered calls |
| `response exceeded N bytes` | Page too large for the server's response cap | Lower `page_size` or add filters |
| `timed out or was cancelled` | Slow upstream or client cancel | Retry once with a smaller page |

The filter and sort encoding follows the myITprocess OpenAPI spec as Swagger UI
sends it. If a filter that looks right comes back 400 or appears to be ignored,
fall back to fetching the page unfiltered and filtering the `items` yourself,
and mention that you did.

## Gotchas

- **Findings have no client field.** Scope findings to a client through
  `review.id` (from `myitprocess_reviews_list` filtered by `client.id`) or
  through `recommendationId` back to a recommendation's client.
- **`myitprocess_users_list` is your staff, not the client's.** It lists the
  MSP's own active myITprocess users. It is not an audit log and has no client
  contacts.
- **Inactive clients are included.** `myitprocess_clients_list` returns both;
  filter `isActive` equal `true` for portfolio work.
- **IDs are integers.** `client.id`, `review.id`, `recommendation_id` and
  friends are numbers; pass them unquoted where you can.

## Related Skills

- [alignment-reviews](../alignment-reviews/SKILL.md) - review pipeline, overdue categories, stale clients
- [roadmap](../roadmap/SKILL.md) - findings, recommendations, initiatives and budget forecasting
- [qbr-prep](../qbr-prep/SKILL.md) - one-client brief for an upcoming QBR or strategy meeting
