---
name: "OpenAI Admin Spend Review"
description: >
  Turning the OpenAI Admin usage and cost reports into a per-client spend
  review: daily cost by project, line item, user, or API key; token and
  request volume behind that cost; month-over-month comparison; spike
  attribution; and project rate-limit headroom when a client reports 429s.
when_to_use: >-
  When reviewing what a client's OpenAI organization costs, attributing
  spend to client projects or people for chargeback, explaining a cost
  spike, or preparing AI spend for a QBR. Use when: openai spend, openai
  cost, openai bill, openai usage by project, openai chargeback, token
  usage, gpt cost, openai qbr, openai spike, or openai rate limit
  headroom.
---

# OpenAI Spend Review

## Overview

`openai_admin_costs` is the money view: daily cost buckets, optionally
broken down by project, user, line item, API key, or API source. The ten
usage tools are the volume view behind it (tokens, requests, images,
seconds of audio, storage). A spend review starts from cost, then uses
usage only to explain the lines that matter.

None of these tools are admin-gated in Conduit; a `read` grant on OpenAI
Admin is enough for everything in this skill.

## Anti-triggers

- **Seat counts or who has a key**: use the
  [seat-key-inventory](../seat-key-inventory/SKILL.md) skill.
- **Billing a client in the PSA**: this skill produces the numbers; the
  invoice or agreement change happens in the PSA plugin.

## Key Concepts

| Tool | Measures | Groupable by |
|------|----------|--------------|
| `openai_admin_costs` | Cost per day (`amount.value` in `amount.currency`, normally USD) | project_id, user_id, line_item, api_key_id, api_source |
| `openai_admin_usage_completions` | Input, cached, output, and audio tokens; request counts | project_id, user_id, api_key_id, model, batch, service_tier, api_source |
| `openai_admin_usage_embeddings` | Embedding tokens | project_id, user_id, api_key_id, model |
| `openai_admin_usage_moderations` | Moderation tokens | project_id, user_id, api_key_id, model |
| `openai_admin_usage_images` | Images generated, edited, varied | project_id, user_id, api_key_id, model, size, source |
| `openai_admin_usage_audio_speeches` | Text-to-speech characters | project_id, user_id, api_key_id, model |
| `openai_admin_usage_audio_transcriptions` | Seconds of audio transcribed | project_id, user_id, api_key_id, model |
| `openai_admin_usage_vector_stores` | Vector store bytes | project_id |
| `openai_admin_usage_code_interpreter_sessions` | Code interpreter sessions | project_id |
| `openai_admin_usage_file_search_calls` | File search calls | project_id, user_id, api_key_id, vector_store_id |
| `openai_admin_usage_web_search_calls` | Web search calls | project_id, user_id, api_key_id, model, context_level, api_source |

All times are UTC Unix seconds; `start_time` is required and `end_time`
is exclusive. Cost is daily only.

## Common Workflows

### Monthly spend by client project

1. Compute the month's UTC boundaries as Unix seconds.
2. `openai_admin_costs` with `start_time`, `end_time`, `limit: 31`,
   `group_by: ["project_id"]`. Follow `next_page` while `has_more`.
3. Sum `amount.value` per `project_id` across the daily buckets.
4. `openai_admin_projects_list` (with `include_archived: true`, since
   spend can land on a project archived mid-month) to turn project IDs
   into names.
5. Repeat steps 2-3 for the previous month and show both, with the
   change in currency and percent.

Report rows that come back with no `project_id` as "unattributed"
rather than dropping them; they are still the client's money.

### Explain a spike

1. `openai_admin_costs` with `group_by: ["project_id", "line_item"]` over
   the spike window plus the same length before it. The line item names
   the model and direction (for example input vs output) that moved.
2. For the project and model that moved, `openai_admin_usage_completions`
   with `bucket_width: "1h"`, `project_ids: [...]`, and
   `group_by: ["api_key_id", "model"]` to find the key and the hour it
   started.
3. If the key is unexpected, hand off to the
   [security-review](../security-review/SKILL.md) skill to see who created
   it and whether it belongs to a removed user.

Use `"1h"` buckets for a few days at most (168 per page); use `"1d"` for
anything longer.

### Per-person usage for a client that pays per user

`openai_admin_usage_completions` with `group_by: ["user_id"]` over the
month, then `openai_admin_users_list` to map IDs to emails. Usage made
through a service account's key has no user; group by `api_key_id` as
well to see it.

### 429s and rate-limit headroom

`openai_admin_project_rate_limits_list` for the client's project returns
the per-model request, token, and image limits. Compare them with the
peak hour from `openai_admin_usage_completions` (`bucket_width: "1h"`,
`group_by: ["model"]`). Raising a limit or the organization's usage tier
is done in the OpenAI dashboard, not here.

## Gotchas

- **Ungrouped rows cannot be attributed.** `project_id`, `user_id`, and
  `api_key_id` are null unless they are in `group_by`. Always group when
  the answer has to name a client.
- **`limit` counts buckets.** A 31-day month needs `limit: 31` on daily
  buckets, or two pages at the default of 7 is not "the month".
- **Grouped long ranges get truncated.** If the output says
  `truncated: true`, repeat with a smaller `limit`; do not page on from
  `next_page`.
- **Costs are the operational view.** Late-arriving usage and credits can
  move a day's number after the fact. For an invoice dispute, the
  invoice in the client's OpenAI billing settings is authoritative; say
  which one you quoted.
- **Batch and flex pricing differ.** Group completions by `batch` or
  `service_tier` before comparing token volume to cost between months.

## Related Skills

- [api-patterns](../api-patterns/SKILL.md) - page tokens, bucket caps, errors
- [seat-key-inventory](../seat-key-inventory/SKILL.md) - map user and key IDs to people and owners
