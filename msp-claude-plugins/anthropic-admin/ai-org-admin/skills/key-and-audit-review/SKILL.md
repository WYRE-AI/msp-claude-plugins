---
name: "Anthropic Admin Key and Audit Review"
description: >
  Security review of a client's Anthropic organization from the two
  admin-gated surfaces: the API key inventory (status, workspace scope,
  creator, principal, expiry, partial hint; never the secret) and the
  compliance activity feed (sign-ins, membership and role changes, key
  lifecycle events). Covers key hygiene checks, leaver key sweeps, and
  incident-response timelines. Every tool here needs the admin tier in Conduit.
when_to_use: >-
  When auditing a client's Anthropic API keys, finding keys a departed user created,
  checking for keys that never expire, or building a timeline of admin activity in an
  Anthropic org. Use when: anthropic api keys, anthropic key inventory, leaked anthropic
  key, anthropic key owner, anthropic audit log, anthropic compliance activities, who
  changed anthropic roles, or anthropic security review.
---

# Anthropic Key and Audit Review

## Overview

API keys are the part of an Anthropic org that leaks, outlives its owner,
and runs up spend. This skill inventories them and reads the compliance
feed to explain how the org got into its current state. It never sees a
secret and cannot archive or rotate a key; it produces findings for a
client admin to act on in Claude Console.

**Admin-gated in Conduit.** All three tools in this skill require the
`admin` tier: `anthropic_admin_api_keys_list`,
`anthropic_admin_api_key_get`, and
`anthropic_admin_compliance_activities_list`. With an ordinary `read`
grant they are not listed at all. Check `conduit__my_access` and ask an
org owner for the grant rather than working around it.

## Anti-triggers

- **Which keys are spending the money** — that is cost and usage grouped
  by `api_key_id`; use [spend-review](../spend-review/SKILL.md), which is
  read-tier.
- **Who is a member right now** — use
  [seat-inventory](../seat-inventory/SKILL.md).

## Key Concepts

- **Key status:** `active`, `inactive`, `archived`, or `expired`. Filter
  with `status`. Only `active` keys can call the API.
- **Scope:** a key belongs to a workspace (`scope.workspace_id`) or, for a
  principal-bound key, to the organization.
- **Creator and principal:** `created_by` is who made the key (a user or a
  service account; `null` for legacy or system keys). `principal` is who
  the key acts as. They can differ.
- **`expires_at`:** `null` means the key never expires.
- **`partial_key_hint`:** a redacted fragment (`sk-ant-api03-R2D...igAA`).
  It is how you match a key found in a repo, a log, or a leaked-secret
  alert to a key ID without ever handling the secret.
- The key list does not include a last-used date. To tell whether a key
  is in use, group spend or usage by `api_key_id` (read-tier, see
  [spend-review](../spend-review/SKILL.md)).

## Workflows

### Key hygiene review

1. `anthropic_admin_organization_get` - confirm the org.
2. `anthropic_admin_api_keys_list` with `status: "active"`, `limit: 1000`,
   paging `after_id` to the end.
3. Flag, in this order:
   - active keys created by someone no longer in
     `anthropic_admin_users_list` (orphaned keys);
   - active keys with `expires_at: null`;
   - active keys in the default workspace, where they are hardest to
     attribute to a client or project;
   - generic names (`test`, `key`, `my key`) that nobody can own.
4. Cross-check which flagged keys have spent anything in the last 30 days
   with `anthropic_admin_analytics_cost` or
   `anthropic_admin_usage_report_messages`, both grouped by `api_key_id`
   (the legacy `anthropic_admin_cost_report` cannot split by key). An
   orphaned key with spend is urgent; one with none is cleanup.

### Leaver key sweep

1. Resolve the leaver's user ID (from `anthropic_admin_users_list` before
   removal, or from the compliance feed if they are already gone).
2. `anthropic_admin_api_keys_list` with `created_by_user_id` and
   `status: "active"`.
3. Report each key with name, workspace, and partial hint, and recommend
   the client archive it in Claude Console. Keys a leaver created keep
   working after their seat is removed.

### Leaked key triage

Given a key fragment from a secret-scanning alert:

1. `anthropic_admin_api_keys_list` (all statuses), match on
   `partial_key_hint`.
2. `anthropic_admin_api_key_get` on the match for full metadata.
3. Pull recent spend and usage for that `api_key_id` to see whether it was
   used.
4. Recommend immediate archive in Console. Do not ask anyone to paste the
   full key to "confirm".

### Activity timeline

1. `anthropic_admin_compliance_activities_list` with
   `created_at_gte` / `created_at_lt` around the window, `order: "asc"`,
   and `limit` up to 5000, paging `after_id`.
2. Narrow with `user_ids`, `actor_ids`, or `activity_types` once you see
   which types the org emits. Use `exclude_activity_types` to drop noisy
   sign-in events when you are after role or key changes.
3. Present a time-ordered table: when, actor, activity type, target.

## Gotchas

- An empty or 403/404 compliance feed can mean the feature is not
  available to this org rather than "nothing happened". Say which.
- The compliance feed and the key inventory are sensitive. Keep raw
  output inside the MSP; client reports carry findings, not dumps.
- A key list from one page is not an inventory. Page to the end.

## Related Skills

- [api-patterns](../api-patterns/SKILL.md) - tiers, pagination, errors
- [seat-inventory](../seat-inventory/SKILL.md) - who is still a member
- [spend-review](../spend-review/SKILL.md) - which keys are spending
