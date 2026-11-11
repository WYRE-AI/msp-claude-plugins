---
name: "OpenAI Admin Seat and Key Inventory"
description: >
  Building the access inventory of a client's OpenAI organization:
  organization members and their roles, pending and expired invites,
  projects and their members, service accounts, project API keys and
  Admin keys with owner and last-used dates, and how to reconcile that
  inventory against the client's staff list to find stale seats and
  orphaned keys.
when_to_use: >-
  When answering who has access to a client's OpenAI organization, which
  API keys exist and who owns them, or preparing a seat count for billing
  or a renewal. Use when: openai seats, openai users, who has chatgpt api
  access, openai invites, openai projects, openai service accounts, openai
  api keys inventory, openai admin keys, unused openai keys, or openai
  seat reconciliation.
---

# OpenAI Seat and Key Inventory

## Overview

An MSP that manages a client's OpenAI organization is answerable for two
lists: the people who can sign in to it, and the credentials that can
spend money in it. This skill builds both from the Admin API, then
reconciles them against the client's staff list so departed users and
keys nobody owns show up before they become a bill or an incident.

Everything here is read-only. Removing a member or revoking a key is done
by an organization owner in the OpenAI dashboard.

## Anti-triggers

- **Spend, tokens, or "why is the bill high"**: use the
  [spend-review](../spend-review/SKILL.md) skill.
- **"What happened" questions, failed logins, who created a key**: use
  the [security-review](../security-review/SKILL.md) skill.

## Key Concepts

| Object | Tool | What matters for an MSP |
|--------|------|-------------------------|
| Organization member | `openai_admin_users_list`, `openai_admin_user_get` | name, email, org role (owner or reader), when added |
| Invite | `openai_admin_invites_list`, `openai_admin_invite_get` | email, role, status (pending, accepted, expired), expiry |
| Project | `openai_admin_projects_list`, `openai_admin_project_get` | how the org splits usage, keys, and limits per team or end client; active or archived |
| Project member | `openai_admin_project_users_list`, `openai_admin_project_user_get` | per-project role (owner or member) |
| Service account | `openai_admin_project_service_accounts_list`, `openai_admin_project_service_account_get` | non-human identity inside one project; owns keys used by apps |
| Project API key | `openai_admin_project_api_keys_list`, `openai_admin_project_api_key_get` | name, owner (user or service account), created and last-used dates, redacted hint |
| Admin key | `openai_admin_admin_api_keys_list`, `openai_admin_admin_api_key_get` | who can administer the org through the API |

**Admin-gated in Conduit:** `openai_admin_project_api_keys_list`,
`openai_admin_project_api_key_get`, `openai_admin_admin_api_keys_list`,
and `openai_admin_admin_api_key_get` need the `admin` tier on OpenAI
Admin in Conduit. With only `read`, build the seat half of the inventory
and state plainly that the key half was not collected.

## Common Workflows

### Full access inventory for one client organization

1. `openai_admin_users_list` with `limit: 100`; follow `after` = `last_id`
   while `has_more`. Record email, role, added date.
2. `openai_admin_invites_list`, same paging. Keep pending and expired
   invites; accepted ones already appear as members.
3. `openai_admin_projects_list`. Add `include_archived: true` only if the
   question covers history; archived projects normally drop out of a
   current-state inventory.
4. For each active project:
   - `openai_admin_project_users_list` for members and project roles.
   - `openai_admin_project_service_accounts_list` for machine identities.
   - `openai_admin_project_api_keys_list` (admin-gated) for keys.
5. `openai_admin_admin_api_keys_list` (admin-gated) for Admin keys.
6. Present: a seat table (member, org role, projects, added), a key table
   (project, key name, owner, created, last used), and the open invites.

For a large organization, run step 4 project by project and summarise as
you go rather than holding every page in context.

### Reconcile against the client's staff list

Given a list of current staff emails (from the client, the PSA, or the
identity provider):

1. Members whose email is not on the list: **stale seat** candidates.
   Check the domain first; contractors and the MSP's own staff are often
   legitimate.
2. Pending invites to addresses not on the list: cancel candidates.
   Expired invites are noise unless there are many.
3. `openai_admin_project_api_keys_list` with
   `owner_project_access: "inactive"` per project: keys whose owner no
   longer has access to the project. These keep working after the person
   is gone and are the highest-value finding in this workflow.
4. Keys with no `last_used_at`, or not used in 90+ days: revoke
   candidates. Confirm with the client before recommending revocation of
   anything owned by a service account; an app may use it monthly.

### Seat count for billing or renewal

Count organization members by role from `openai_admin_users_list`, and
members per project from `openai_admin_project_users_list` when the
client is billed per project. Report pending invites separately: they are
not seats yet.

## Gotchas

- **Project membership is separate from org membership.** Removing
  someone from a project does not remove them from the organization, and
  the reverse leaves their project keys behind. Check both lists.
- **Service account keys outlive people.** They have no human owner to
  offboard, so they only surface through the key inventory.
- **The Conduit key is in the Admin key list.** Identify the key you
  connected with (recent `last_used_at`, the name you gave it) before
  reporting unknown Admin keys.
- **Org owners can see and do everything.** More than two or three
  `owner` members in a small client organization is worth a line in the
  report.
- **Redacted hints are not identifiers.** Match keys by `id`, not by the
  visible `sk-...` fragment.

## Related Skills

- [api-patterns](../api-patterns/SKILL.md) - paging, gating, and errors
- [security-review](../security-review/SKILL.md) - confirm who created or used a key via the audit log
