---
name: "SmileBack API Patterns"
description: >
  The SmileBack tool surface as exposed through Conduit: the 12 read-only
  tools over the Data Replication API v3, the five-header credential (OAuth2
  password grant run by the server), the US/EU region, Conduit access tiers
  (all read, none admin-gated), limit/offset pagination, response truncation,
  client-side filtering because the API has no per-company or date-range
  filter, the error vocabulary, and the personal data the responses carry.
when_to_use: >-
  When calling any SmileBack tool, paging through reviews or NPS responses,
  or diagnosing a SmileBack connection failure. Use when: smileback api,
  smileback mcp, smileback auth, smileback credentials, smileback 401,
  invalid_grant, invalid_client, smileback pagination, smileback region, or
  "can Claude write to SmileBack".
---

# SmileBack API Patterns

## Overview

SmileBack collects customer feedback for MSPs: a one-click CSAT reaction
on each closed PSA ticket, NPS campaigns, and project surveys. The
Conduit connector reads that data through SmileBack's Data Replication
API v3. The API itself is read-only (OAuth scopes `read` and
`read_recent`), so every tool is a GET. Nothing can create, change or
delete data in SmileBack. Follow-up actions happen in the PSA.

## Connection

The plugin connects to `https://conduit.wyre.ai/v1/smileback/mcp` with
five headers. Conduit stores the same five values when you connect
SmileBack in the Conduit UI and maps them to these headers:

| Conduit field | Header | Env var in `.mcp.json` | Required |
|---|---|---|---|
| Client ID | `X-SmileBack-Client-Id` | `SMILEBACK_CLIENT_ID` | Yes |
| Client Secret | `X-SmileBack-Client-Secret` | `SMILEBACK_CLIENT_SECRET` | Yes |
| Username (email) | `X-SmileBack-Username` | `SMILEBACK_USERNAME` | Yes |
| Password | `X-SmileBack-Password` | `SMILEBACK_PASSWORD` | Yes |
| Region | `X-SmileBack-Region` | `SMILEBACK_REGION` | No (`us` or `eu`, default `us`) |

- **Client ID and Client Secret** come from the SmileBack Account menu >
  API Credentials (one pair per account).
- **Username and password** are the email and native SmileBack password
  of the user Conduit signs in as. Native credentials work even when
  ConnectWise SSO is on. They also sign in to the SmileBack web app, so
  use a dedicated user for API access.
- **Region**: `us` is `app.smileback.io`. Pick `eu` only if the account
  lives on `app.smileback.eu`. There is no base-URL field; the server
  only ever calls one of those two hosts.

The server runs the OAuth2 password grant itself, caches the access
token, and on a 401 fetches one fresh token and retries once. Refresh
tokens are not used.

SmileBack is in Conduit's catalog as a hidden connector until its
release is complete. If it is not in your Conduit connector list yet,
it is not generally available.

## Conduit Access Tiers

All 12 tools are classified **read** in Conduit. None is admin-gated and
none is a write, so any Conduit role that can read the SmileBack
connector sees the whole surface. Two consequences the tier does not
show:

- One credential set reads the MSP's entire SmileBack dataset across
  every client. SmileBack has no per-client scoping.
- Reviews, NPS responses, contacts and project responses contain end
  customers' personal data: names, emails, titles, locations, free-text
  comments and marketing-permission flags. Share output only with people
  allowed to see it, and strip emails from anything client-facing.

Conduit does not cache SmileBack results, so every call reaches
SmileBack.

## Tool Surface

| Tool | Endpoint | Parameters | Paged |
|---|---|---|---|
| `smileback_reviews_list` | `GET /reviews/` | `modified_since`, `include_unrated`, `limit`, `offset` | Yes |
| `smileback_reviews_list_recent` | `GET /reviews/recent/` | `limit`, `offset` | Yes |
| `smileback_reviews_get` | `GET /reviews/{review_id}/` | `review_id` (required) | No |
| `smileback_nps_responses_list` | `GET /nps-responses/` | `created_since`, `campaign_name`, `score_gt`, `score_lt`, `score_exact`, `limit`, `offset` | Yes |
| `smileback_nps_responses_get` | `GET /nps-responses/{response_id}/` | `response_id` (required) | No |
| `smileback_nps_campaigns_list` | `GET /nps-campaigns/` | none | No |
| `smileback_csat_companies_list` | `GET /csat-companies/` | none | No |
| `smileback_csat_contacts_list` | `GET /csat-contacts/` | none | No |
| `smileback_csat_agents_list` | `GET /csat-agents/` | none | No |
| `smileback_csat_boards_list` | `GET /csat-boards/` | none | No |
| `smileback_project_surveys_list` | `GET /prj-surveys/` | none | No |
| `smileback_project_responses_list` | `GET /prj-responses/` | `created_since` | No |

What the records hold:

- **Review** (CSAT): `rating`, `comment`, `ticket` (`id`, `title`,
  `segment` = the PSA board, `agents`, `closed_on`), `contact`,
  `company` (`id`, `name`, `territory`, `market`), `status`, `tags`,
  `rated_on`, `permalink`, `last_modified`.
- **NPS response**: `score` (0-10), `comment`,
  `has_marketing_permission`, `contact` (name, email, company, title,
  location), `contact_remote_id`, `campaign_name`, `created_at`.
- **CSAT company**: the MSP's end clients, with territory, market and
  PSA remote IDs.
- **CSAT agent**: the MSP's active technicians. **CSAT board**: PSA
  service boards (a review's `ticket.segment`).

SmileBack's CSAT reaction is a three-point scale (positive, neutral,
negative). Read the `rating` values on the first page you fetch before
computing anything, rather than assuming how they are encoded.

## Filtering Happens Client-Side

The API has no per-company filter, no aggregate endpoint and no date
upper bound. To get a client's CSAT for a quarter:

1. Call `smileback_reviews_list` with `modified_since` set to the start
   of the window and page to the end.
2. Keep reviews whose `company.id` matches and whose `rated_on` falls
   inside the window.

`modified_since` filters on `last_modified`, not `rated_on`. A review
rated last year but edited this week comes back, so the `rated_on` filter
in step 2 is required. Every review rated inside the window has
`last_modified` at or after `rated_on`, so nothing is missed.

NPS responses are grouped by `contact.company`, which is a name, not the
CSAT company ID. Match names carefully and report any responses whose
company you could not match.

Dates are ISO 8601 dates or date-times (`2026-10-01` or
`2026-10-01T00:00:00Z`). NPS score filters are integers 0-10;
detractors are `score_lt: 7`.

## Pagination

`smileback_reviews_list`, `smileback_reviews_list_recent` and
`smileback_nps_responses_list` use `limit`/`offset` and return
`{count, next, previous, results}` as SmileBack sent it.

- `limit` defaults to 50 and is capped at 100.
- The server never pages for you. Keep calling with a larger `offset`
  until `next` is null, and compare the rows you collected with `count`
  before calling a set complete.
- The other lists are not paginated. `smileback_project_responses_list`
  returns everything since `created_since`, so always pass it.

## Truncated Responses

Output is capped at about 60,000 characters. When a page is larger,
items are dropped from the end of `results` and the response adds
`truncated: true`, `returned_items`, `total_items_in_page` and a
`truncation_hint`. `count`, `next` and `previous` are kept unchanged.

On a truncated page, the next offset is the current `offset` plus
`returned_items`. The `next` URL assumes the whole page arrived, so
following it skips the dropped rows. Lower `limit` (25 works well for
reviews with long comments) and continue. If even the first item is too
large, `results` is empty and `first_item_truncated` holds the start of
it; fetch that record on its own with `smileback_reviews_get` or
`smileback_nps_responses_get`.

## Errors

Vendor errors come back as tool errors with the HTTP status, the OAuth
error code from the token endpoint, and SmileBack's message.

| Error | Meaning | Fix |
|---|---|---|
| `invalid_client` | Client ID or Client Secret wrong, or the wrong region | Copy both again from Account > API Credentials; confirm `us` or `eu` |
| `invalid_grant` | Username or password wrong, or the wrong region | Use the user's email and native SmileBack password; confirm the region |
| HTTP 401 with no SmileBack status | A required header is missing | Set all four required env vars |
| 404 | Unknown review or response ID | Re-list; IDs are integers |
| Argument error | Bad date, score outside 0-10, empty campaign name | Fixed client-side; never reached SmileBack |

## Rate Limits

SmileBack publishes no rate limit but asks integrators to keep bandwidth
low. The server retries only a 401. On a 429 or a 5xx, wait before
retrying and do not loop. Use `modified_since` and `created_since` to
read only what changed rather than re-pulling full history, and pull a
quarter once, then compute every client from that one pull.

## Related Skills

- `smileback-csat-qbr-summary` builds a per-client CSAT/NPS review.
- `smileback-detractor-follow-up` triages negative reviews and NPS
  detractors.
- `smileback-technician-csat` reports CSAT by technician and board.
