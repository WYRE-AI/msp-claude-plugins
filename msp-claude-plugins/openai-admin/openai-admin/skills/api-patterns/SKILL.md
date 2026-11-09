---
name: "OpenAI Admin API Patterns"
description: >
  OpenAI Admin MCP fundamentals: the Admin key sent as the
  `X-OpenAI-Admin-Key` header through Conduit, the 30-tool read-only
  surface and which five tools Conduit admin-gates, the two pagination
  styles (object cursors for lists, page tokens for usage and cost
  reports), Unix-second time ranges, truncated pages, and the error and
  429 shapes the server returns.
when_to_use: >-
  When connecting to or calling OpenAI Admin through Conduit, paging
  through results, or diagnosing a failed OpenAI Admin tool call. Use
  when: openai admin api, openai admin key, X-OpenAI-Admin-Key, openai
  admin pagination, openai admin 401, openai admin 403, openai admin 429,
  truncated openai page, or openai admin tools.
---

# OpenAI Admin MCP Tools & API Patterns

## Overview

The OpenAI Admin MCP server is a read-only view of one OpenAI
organization through the OpenAI Admin API. Every one of its 30 tools is a
GET against the fixed host `https://api.openai.com/v1`. Nothing in this
plugin can invite, remove, or change a user, create or delete a key, or
change a project or rate limit. If a request needs a change, the answer is
"do it in the OpenAI dashboard", not a tool call.

## Connection & Authentication

| Header | Value |
|--------|-------|
| `X-OpenAI-Admin-Key` | An OpenAI **Admin** key (`sk-admin-...`) |

In Conduit the connector has one field, **Admin Key**. Conduit maps it
onto `X-OpenAI-Admin-Key`; the server then calls OpenAI with
`Authorization: Bearer <key>`. When you use this plugin's `.mcp.json`
directly, the header is filled from the `OPENAI_ADMIN_KEY` environment
variable.

- An organization owner creates the key at
  platform.openai.com/settings/organization/admin-keys.
- A project key (`sk-proj-...`) is refused before any request with "This
  is not an OpenAI Admin key". So is anything that does not start with
  `sk-`.
- OpenAI has no read-only Admin key. The key Conduit holds could invite or
  remove users and delete keys in the OpenAI dashboard or API, even though
  this server only reads. Use a dedicated Admin key for Conduit so it can
  be revoked on its own.
- No `OpenAI-Organization` header is sent. The organization is whichever
  one the Admin key belongs to. **One connection reaches exactly one
  OpenAI organization.** A client with its own OpenAI organization needs
  its own Admin key; a client that is a project inside the MSP's
  organization is reviewed through that organization's key.

## Tool Surface and Conduit Gating

Tool names follow `openai_admin_<area>_<action>`: collections end in
`_list`, single objects in `_get`, project-scoped tools start with
`project_`.

| Area | Tools |
|------|-------|
| Seats | `openai_admin_users_list`, `openai_admin_user_get`, `openai_admin_invites_list`, `openai_admin_invite_get` |
| Projects | `openai_admin_projects_list`, `openai_admin_project_get`, `openai_admin_project_users_list`, `openai_admin_project_user_get`, `openai_admin_project_service_accounts_list`, `openai_admin_project_service_account_get`, `openai_admin_project_rate_limits_list` |
| Keys (admin-gated) | `openai_admin_project_api_keys_list`, `openai_admin_project_api_key_get`, `openai_admin_admin_api_keys_list`, `openai_admin_admin_api_key_get` |
| Audit (admin-gated) | `openai_admin_audit_logs_list` |
| Certificates | `openai_admin_certificates_list`, `openai_admin_certificate_get`, `openai_admin_project_certificates_list` |
| Usage | `openai_admin_usage_completions`, `openai_admin_usage_embeddings`, `openai_admin_usage_moderations`, `openai_admin_usage_images`, `openai_admin_usage_audio_speeches`, `openai_admin_usage_audio_transcriptions`, `openai_admin_usage_vector_stores`, `openai_admin_usage_code_interpreter_sessions`, `openai_admin_usage_file_search_calls`, `openai_admin_usage_web_search_calls` |
| Cost | `openai_admin_costs` |

**Admin-gated in Conduit.** The four key-inventory tools and
`openai_admin_audit_logs_list` are read-only, but Conduit classifies them
as sensitive and requires the `admin` tier to call them. A user or agent
granted only `read` on OpenAI Admin can call the other 25 tools and gets a
denial on these five. Confirm the live grant in the Conduit access editor
before planning a workflow around them, and say so in the output when a
step was skipped for this reason rather than reporting "no keys found".

## Pagination

Two styles. The server never pages automatically, so check for more
before calling a result complete.

**List tools** (users, invites, projects, project members, service
accounts, keys, rate limits, certificates, audit log):

- Take `after` (and `before` on the audit log and rate limits) plus
  `limit` (1-100, default 20; larger values are capped).
- Return `data`, `first_id`, `last_id`, and `has_more` unchanged.
- Next page: call again with `after` set to the previous `last_id` while
  `has_more` is true.

**Usage and cost tools**:

- `start_time` is required; `end_time` is optional and exclusive. Both are
  Unix seconds (integers), e.g. `1730419200` for 2024-11-01T00:00:00Z.
- `limit` counts **time buckets**, not rows. For usage it depends on
  `bucket_width`: `1d` default 7 / max 31, `1h` default 24 / max 168, `1m`
  default 60 / max 1440. `openai_admin_costs` is daily only, default 7,
  max 180.
- Next page: pass the previous response's `next_page` as `page` while
  `has_more` is true.

A month of daily usage fits in one call with `bucket_width: "1d"` and
`limit: 31`. A month of daily cost fits with `limit: 31`.

## Truncated Pages

Tool output is capped (about 60,000 characters by default). When a page
is too large, the server drops items from the end of `data` and says
`truncated: true`, `returned_items`, and `total_items_in_page`. The
cursors (`last_id`, `next_page`) still describe the **full** page, so
paging on from them would silently skip the dropped items. Repeat the
same request with a smaller `limit` instead. Grouped usage queries over
long ranges are the usual cause.

## Error Handling

Every non-2xx answer is a tool error carrying the HTTP status, OpenAI's
error type and message, `param`/`code` when present, and a `request_id`
to quote in an OpenAI support ticket.

| Status | Meaning | Action |
|--------|---------|--------|
| 401 / 403 | The key is invalid, revoked, not an Admin key, or lacks permission for this endpoint | Ask the org owner to check the Admin key; reconnect in Conduit with a new one |
| 404 | Unknown user, project, key, invite, or certificate ID | Re-list to get a current ID |
| 429 | Rate limited by OpenAI | Wait the `Retry after Ns` the error states, then retry once; do not fan out parallel calls |
| Conduit denial | Tool is admin-gated and the caller has `read` | Report the gap; a Conduit admin grants `admin` if appropriate |

Argument problems (an enum value the endpoint does not accept, a
non-integer time, a malformed ID) are rejected before any request is
sent, with a message naming the parameter.

## Gotchas

- **Grouping fields are null unless you group by them.** A usage or cost
  row only carries `project_id`, `user_id`, `api_key_id`, or `model` when
  that field is in `group_by`. Ungrouped results cannot be attributed to a
  client project.
- **Times are UTC Unix seconds.** Compute month boundaries in UTC; a
  local-midnight boundary shifts a day of spend between months.
- **The Conduit key shows up in the inventory.** The Admin key you
  connected appears in `openai_admin_admin_api_keys_list` with a recent
  `last_used_at`. Identify it before flagging "unknown Admin keys".
- **Secrets are never returned.** Key tools return names, owners, dates,
  and a redacted hint only.
- **The audit log must be enabled** for the organization. If
  `openai_admin_audit_logs_list` errors, or returns nothing over a period
  where you know keys or members changed, report "audit logging is off or
  unavailable" as a finding, not "no events".

## Related Skills

- [seat-key-inventory](../seat-key-inventory/SKILL.md) - who has access and which keys exist
- [spend-review](../spend-review/SKILL.md) - usage, cost, and chargeback by project
- [security-review](../security-review/SKILL.md) - audit log, orphaned keys, certificates
