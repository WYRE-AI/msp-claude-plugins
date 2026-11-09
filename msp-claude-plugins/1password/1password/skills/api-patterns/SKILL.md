---
name: "1Password API Patterns"
description: >
  1Password MCP fundamentals through Conduit: the region plus two independent
  credential halves (Events Reporting token, Users API client) and their
  X-OnePassword-* headers, which of the six read-only tools needs which half,
  which three are admin-gated in Conduit, cursor paging on the Events feeds,
  page-token paging on users, time windows and 120-day retention, rate limits,
  and how vendor errors come back.
when_to_use: >-
  When calling any 1Password tool, setting up a 1Password connection, or diagnosing a failed
  1Password call. Use when: 1password api, 1password connection, 1password events token,
  1password users api, 1password pagination, 1password cursor, 1password 403, 1password rate
  limit, or 1password region.
---

# 1Password API Patterns

## Overview

The 1Password connector is a read-only security view of one 1Password Business or
Enterprise account per connection. It wraps two official APIs: the Events API (audit
trail, shared-vault item usage, sign-in attempts) and the Users API (user inventory).
Neither returns secret values, and vault contents are never reachable.

## Credentials and headers

Each client account is one Conduit connection. Conduit sends the stored values as headers:

| Field | Header | Required |
|---|---|---|
| Region (`us`, `ent`, `ca`, `eu`) | `X-OnePassword-Region` | Always |
| Events Reporting token | `X-OnePassword-Events-Token` | For the Events tools |
| Users API client ID | `X-OnePassword-Client-Id` | For the Users tools |
| Users API client secret | `X-OnePassword-Client-Secret` | For the Users tools |
| Account ID (26 characters) | `X-OnePassword-Account-Id` | For the Users tools |

A connection can carry the Events token, the Users API client, or both. A tool whose half
is missing fails with a credential error; it never falls back to the other half.

## Tools, credentials and Conduit tiers

| Tool | Credential | Conduit tier |
|---|---|---|
| `1password_events_introspect` | Events token | read |
| `1password_audit_events_list` | Events token with `auditevents` | admin |
| `1password_item_usages_list` | Events token with `itemusages` | admin |
| `1password_signin_attempts_list` | Events token with `signinattempts` | admin |
| `1password_users_list` | Users API client + account ID | read |
| `1password_users_get` | Users API client + account ID | read |

The three Events feeds are admin-gated in Conduit because they are the account's audit
trail. A member with only the read tier will not see them in the tool list. If a workflow
needs them and they are missing, say that the Conduit admin tier is required rather than
reporting "no events".

None of the six tools writes. The feeds send their query in the request body, which is why
they are not plain reads at the HTTP level; they change nothing.

## Start with introspection

Call `1password_events_introspect` first when an Events token is configured. It returns the
token's `features` (some of `auditevents`, `itemusages`, `signinattempts`), `issued_at` and
the `account_uuid`. Use it to:

- confirm you are looking at the right client account before reporting anything;
- skip feeds the token was not given, instead of collecting 403s.

If only the Users API half is configured, introspection fails; go straight to
`1password_users_list`.

## Paging the Events feeds

All three feeds take the same arguments and page the same way.

**First call (a new query):** pass `limit` (1-1000, default 100), and optionally
`start_time` and `end_time` in RFC 3339 (`2026-11-01T00:00:00Z`). Without `start_time` the
window is only the last hour, so always set it for a review.

**Next pages:** each response is `{cursor, has_more, items}`. While `has_more` is true, call
again with `cursor` alone. Passing `cursor` together with `limit`, `start_time` or
`end_time` is rejected.

Nothing pages automatically. Keep calling until `has_more` is false, or stop at a page
budget you state in the report ("first 500 events of the window").

Events are retained for 120 days. A window that starts earlier simply returns nothing for
the missing days; say so instead of implying the period was quiet.

## Paging users

`1password_users_list` returns `{results, next_page_token}`. Pass `next_page_token` as
`page_token` on the next call, with the same `filter`. `max_page_size` is 1-1000 (default
100) and is ignored when `page_token` is set. An empty page comes back as `{}`.

`filter` takes exactly `user.isActive()` or `user.isSuspended()` (case-sensitive). Omit it
to get both.

`1password_users_get` takes `user_id`, the 26-character uppercase ID from the list. It does
not take an email address; find the user in the list first.

## Output size

Tool output is capped at 60,000 characters, and an upstream response over 4 MiB is refused
with an error asking you to narrow the query. Keep `limit` at a few hundred on busy
accounts and narrow the time window rather than raising the limit to 1000.

## Rate limits

| API | Limit |
|---|---|
| Events API | 600 requests per minute, 30,000 per hour |
| Users API, list users | 100 requests per minute, 6,000 per hour |

Each Users tool call also mints a short-lived token, which counts as a request. On HTTP 429
the error carries `Retry after Ns.`; wait that long before the next call.

## Errors

Vendor errors come back as tool errors with the HTTP status, the vendor code and message,
and a request ID when 1Password sends one.

| Status | Usual cause | What to do |
|---|---|---|
| 400 | Bad argument (time format, cursor combined with limit) | Fix the argument |
| 401 | Token expired or revoked, or wrong region | Ask for a new Events token or check the region in the connection |
| 403 | Events token lacks that feature, or the Users API client lacks View users | Run introspection; ask the client's owner to issue a token with the feature |
| 404 | Unknown user ID | Re-list users |
| 429 | Rate limited | Wait for `Retry-After` |

A credential error that says the OAuth client is refused means the Users API application
has more than the View users permission. It must be recreated with only View users;
1Password does not allow changing permissions afterwards.

## Gotchas

- **Region mismatch looks like a bad token.** A token issued for `eu` fails with 401 against
  `us`. Check the region before asking for a new token.
- **Expired Events tokens.** Owners are told to set a 90- or 180-day expiry, so a connection
  that worked last quarter can start returning 401. That is expected; request a new token.
- **UUIDs, not names.** Item usage events carry vault and item UUIDs. No tool resolves them
  to names, so report the UUIDs and let the technician map them in the console.
- **Times are UTC.** Convert to the client's local time zone in any report.
