---
name: "OpenAI Admin Security Review"
description: >
  Security and offboarding review of a client's OpenAI organization from
  the audit log (logins, membership and role changes, key and project
  lifecycle), the key inventory (keys left behind by removed users, unused
  and over-privileged Admin keys), and mTLS certificate expiry, plus how to
  scope an incident question to an actor, a project, or a time window.
when_to_use: >-
  When offboarding someone from a client's OpenAI organization, running a
  periodic AI access review, or answering an incident question such as who
  created a key or when a member was added. Use when: openai audit log,
  openai offboarding, openai access review, who created this openai key,
  openai failed logins, openai role change, leaked openai key, openai
  certificate expiry, or openai incident.
---

# OpenAI Security Review

## Overview

Three sources answer security questions about an OpenAI organization:
the audit log (what happened and who did it), the key inventory (what
can still spend money or administer the org), and the certificate list
(mTLS that is about to expire). All of it is read-only. Revoking a key,
removing a member, or changing a role is done by an organization owner
in the OpenAI dashboard; this skill finds what needs doing and says so.

**Admin-gated in Conduit:** `openai_admin_audit_logs_list`,
`openai_admin_project_api_keys_list`, `openai_admin_project_api_key_get`,
`openai_admin_admin_api_keys_list`, and `openai_admin_admin_api_key_get`
need the `admin` tier on OpenAI Admin in Conduit. Most of this skill
depends on them. With only `read`, say that the review could not be
completed and list what was checked (members, invites, certificates).

## Anti-triggers

- **A plain list of who has access**: use the
  [seat-key-inventory](../seat-key-inventory/SKILL.md) skill.
- **A cost spike with no security angle**: use the
  [spend-review](../spend-review/SKILL.md) skill first; come back here if
  the key behind it is unexpected.

## Key Concepts

`openai_admin_audit_logs_list` filters:

| Parameter | Use |
|-----------|-----|
| `effective_at_gte`, `effective_at_lt` (also `_gt`, `_lte`) | Time window, UTC Unix seconds |
| `actor_emails`, `actor_ids` | Everything one person, service account, or key did |
| `event_types` | Narrow to a kind of event, e.g. `api_key.created`, `user.updated`, `login.failed` |
| `project_ids`, `resource_ids` | Everything that touched one project or object |
| `tenant_only` | Tenant-scoped events such as role bindings; when true, every `event_types` value must be tenant-scoped |

Pages with `after` / `before` and `limit` (max 100). Always set a time
window; paging the whole history of a busy organization is slow and
mostly irrelevant.

## Common Workflows

### Offboard a departed user

1. `openai_admin_users_list` with `emails: ["person@client.com"]` to get
   the user ID and org role. Not found: check
   `openai_admin_invites_list` for a pending invite to cancel.
2. `openai_admin_projects_list`, then per project
   `openai_admin_project_users_list` to list the projects they belong to.
3. Per project, `openai_admin_project_api_keys_list` and pick out the
   keys they own. After they are removed, the same call with
   `owner_project_access: "inactive"` finds keys they left behind.
4. `openai_admin_admin_api_keys_list` for any Admin key they own.
5. `openai_admin_audit_logs_list` with `actor_emails: [...]` over the last
   30 days to see recent activity (keys created, members invited).
6. Output an owner-facing checklist: remove from the organization, revoke
   these keys by name and project, cancel these invites, rotate any
   service-account key they are known to have copied.

### Periodic access review

1. Admin keys: `openai_admin_admin_api_keys_list`. Flag keys with no
   `last_used_at` or none in 90 days, and keys owned by people who are no
   longer staff. Exclude the key Conduit itself uses.
2. Orphaned project keys: per active project,
   `openai_admin_project_api_keys_list` with
   `owner_project_access: "inactive"`.
3. Owners: count `owner` members from `openai_admin_users_list`.
4. Role and membership changes since the last review:
   `openai_admin_audit_logs_list` with a time window and
   `event_types` covering user and invite changes (start from
   `user.updated`; widen with the event types listed in OpenAI's audit
   log reference).
5. Failed logins: `openai_admin_audit_logs_list` with
   `event_types: ["login.failed"]` over the period; a burst against one
   account is worth a call to the client.
6. Certificates: `openai_admin_certificates_list`; flag anything expiring
   within 30 days. `openai_admin_project_certificates_list` shows which
   projects use it.

### "Who created this key?"

1. Get the key ID from `openai_admin_project_api_keys_list` (or
   `openai_admin_project_api_key_get` if you have it). The owner field
   answers "who owns it"; it does not prove who created it.
2. `openai_admin_audit_logs_list` with `resource_ids: ["key_..."]`, or
   `event_types: ["api_key.created"]` and a window around the key's
   created date, gives the actor and time.

### Suspected leaked key

Treat it as an incident: the fix (revoke and replace) happens in the
OpenAI dashboard immediately, not after the review. Then use the
[spend-review](../spend-review/SKILL.md) hourly usage by `api_key_id` to
size the exposure, and the audit log for the key's lifecycle.

## Gotchas

- **No events is not proof of nothing.** If the audit log errors, or is
  empty across a period where you know changes happened, audit logging is
  off or unavailable. Report that, and recommend enabling it.
- **Key owner is not key creator.** Ownership can sit with a service
  account created by a person; the audit log is the only record of who.
- **Removed users' keys look like any other key.** The default listing
  mixes them in with live ones. Use `owner_project_access: "inactive"` to
  isolate them.
- **Certificate content is opt-in.** `openai_admin_certificate_get`
  returns the PEM only with `include: ["content"]`; dates are enough for
  an expiry check.
- **The Conduit Admin key is a real Admin key.** It appears in the
  inventory, and if it leaked it could change the organization. Recommend
  rotating it on the same schedule as any other Admin key.

## Related Skills

- [api-patterns](../api-patterns/SKILL.md) - Conduit gating, paging, errors
- [seat-key-inventory](../seat-key-inventory/SKILL.md) - the full access inventory
- [spend-review](../spend-review/SKILL.md) - size the cost of a misused key
