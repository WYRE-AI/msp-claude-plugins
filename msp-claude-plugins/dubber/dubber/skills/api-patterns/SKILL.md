---
name: "Dubber API Patterns"
description: >
  How the Dubber tool surface behaves through Conduit: the five X-Dubber-*
  credential headers and the password-grant token they mint, region
  selection, the account/group/Dub.Point/recording hierarchy, how
  dubber_recordings_list pages and filters, which list tools return a single
  page, the error and rate-limit behaviour, the confirm_destructive_action
  flow, and which tools Conduit treats as read, write or admin.
when_to_use: >-
  When calling any Dubber tool, diagnosing a Dubber connection or permission
  failure, or deciding whether a Dubber operation is possible. Use when:
  dubber credentials, dubber 401, dubber 403, account inactive, dubber region,
  dubber test connection, dubber paging, dubber rate limit, dubber admin tier.
---

# Dubber API Patterns

## Overview

Dubber records calls from telecom systems (for example BroadWorks) and keeps them as
compliance records. The dubber-mcp sidecar mints and caches Dubber OAuth tokens
itself; Conduit stores the customer's credentials and forwards them as headers on every
call. Start any troubleshooting with `dubber_test_connection`.

Dubber is a **preview** vendor in Conduit: wired and catalog-visible, but not yet confirmed
by a live customer call. Report unexpected response shapes as findings, not as user error.

## Credentials

The fields are entered once in the Conduit web UI (`/connect/dubber`). Nothing is set on
the client, and Conduit drops any `X-Dubber-*` header a client sends.

| Conduit field | Header | Notes |
|---|---|---|
| Client ID | `X-Dubber-Client-Id` | Mashery application key (developer.dubber.net) |
| Client Secret | `X-Dubber-Client-Secret` | Mashery application secret |
| Auth ID | `X-Dubber-Auth-Id` | Dubber portal, API tab. Not a person's login. |
| Auth Token | `X-Dubber-Auth-Token` | Dubber portal, API tab |
| Region (optional) | `X-Dubber-Region` | `sandbox` (default), `us`, `au`, `eu`, `uk` |

The token request is an OAuth password grant where `username`/`password` are the Auth
ID/Auth Token pair. All four required values must be present; the sidecar answers 401
before any tool runs if one is missing.

Region picks the host path `api.dubber.net/<region>/v1`. A blank region means
**sandbox**, so a production customer connected without a region is talking to the
sandbox, not their tenant. If every call returns empty or 403, check the region first.

## Key concepts

- **Hierarchy.** Group, then account, then users and Dub.Points, then recordings. There is
  no "list all accounts" or "list all groups" tool. Ask the user for the account ID (or a
  group ID and use `dubber_groups_get`). `dubber_profile_get` shows the authenticated
  identity, which can help confirm whose credentials are connected.
- **Dub.Point.** One recorded line or endpoint, connected to an external telecom system.
  Recordings belong to a Dub.Point. A Dub.Point's `user` field is a URL ending in
  `/users/<USER_ID>`, not a bare ID. `dubber_dub_points_find` looks one up by
  external-system identifiers.
- **Unidentified recordings.** Calls Dubber captured but could not match to an account or
  Dub.Point. They sit on the group: `dubber_groups_list_unidentified_recordings`.
- **A token proves the credentials, not access.** `dubber_test_connection` succeeding does
  not prove the token can read any particular account.

## Pagination

`dubber_recordings_list` is the only paged tool:

- Newest first. `limit` 1 to 500 (default 100), `offset` skips matching recordings.
- `startTimeFrom` (inclusive) and `startTimeTo` (exclusive for date-times; a date-only
  value includes the whole day) filter on `start_time`. Values without an offset are UTC;
  pass an explicit offset for a customer's local day.
- `dubPointId` or `teamId`, never both. There is no user filter on recordings.
- Dubber has no server-side date filter, so the sidecar filters after fetching. One call
  scans at most 2,500 recordings (25 Dubber requests). When `hasMore` is true, call again
  with `cursor=<nextCursor>`, `offset=<remainingOffset>` and the same filters.
  `scanCapReached=true` means the cap stopped the scan, not the end of the data.

`dubber_dub_points_list`, `dubber_users_list`, `dubber_notifications_list`,
`dubber_groups_list_unidentified_recordings` and `dubber_notifications_list_unclaimed` take
no paging arguments and return one Dubber page. Dubber's default page for Dub.Points is 20
items, so a Dub.Point list of exactly 20 may be truncated. Say so in any report built from
it.

## Errors and rate limits

| Symptom | Likely cause | Action |
|---|---|---|
| `dubber_test_connection` fails | Wrong Client ID/Secret or Auth ID/Token, or wrong region | Re-check the values and the region in Conduit |
| 403 "Account Inactive" | Mashery app or Dubber account not active for that region | Confirm the region and app status with Dubber |
| Token works, a tool returns 403 or 404 | Credentials cannot see that account, user or recording | Confirm the ID belongs to the connected tenant |
| 429 | Rate limit reached | Wait; reads are retried automatically |
| Tool refuses with a confirmation message | Gated tool called without consent | See "Confirmation" below |

Dubber's getting-started guide documents a limit of 500 calls per token in 24 hours. A
token lasts about 24 hours. Each `dubber_recordings_list` call can make up to 25 Dubber
requests, so a wide multi-account sweep can use a large share of the day's budget. Narrow
by `dubPointId` and a date window before scanning everything.

The sidecar retries reads (GET) on 429 and 5xx. It never retries a write. After a failed
write, check the current state with a read before trying again.

## Confirmation

`dubber_recordings_delete`, `dubber_recordings_delete_tags`, `dubber_users_delete`,
`dubber_notifications_delete` and `dubber_oauth_revoke_token` ask before acting. Conduit
cannot show that prompt, so they refuse unless the call includes
`confirm_destructive_action: true`. Only pass it after the user has agreed to that specific
action in the conversation.

## Conduit permission tiers

| Tier | Tools |
|---|---|
| Admin | `dubber_users_delete`, `dubber_oauth_revoke_token` |
| Write | every create, update, activate, tag, upload and delete tool other than the two above, including `dubber_recordings_delete` |
| Read | every get, list and find tool, plus `dubber_test_connection` and `dubber_profile_get` |

A caller below the required tier is refused by Conduit before the call reaches Dubber.
`dubber_recordings_delete` is only write tier even though it is irreversible.

## Gotchas

- `dubber_oauth_revoke_token` revokes the token every in-flight call is using. The next
  call mints a new one, but parallel work fails in the meantime. It is not a credential
  rotation; the Auth ID/Token stay valid.
- The plugin cannot fetch audio. Send the user to the Dubber portal to listen.
- `data`, `metadata` and `query` object arguments are passed to Dubber as-is. Dubber does
  not publish a full schema, so read the current object with a get tool first and change
  only the fields you need.
