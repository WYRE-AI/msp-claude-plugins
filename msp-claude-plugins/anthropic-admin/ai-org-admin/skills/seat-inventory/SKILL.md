---
name: "Anthropic Admin Seat Inventory"
description: >
  Seat and access inventory for a client's Anthropic organization:
  members and their organization roles, pending and expired invites,
  workspaces and per-workspace membership, and how to turn them into a
  seat count, an admin-role review, and an offboarding check against the
  client's leaver list. All tools are read-tier.
when_to_use: >-
  When counting a client's Anthropic or Claude Console seats, reviewing who holds admin
  roles, checking pending invites, or confirming a leaver no longer has access.
  Use when: anthropic seats, claude console users, anthropic org members, who has
  anthropic access, anthropic invites, anthropic workspace members, anthropic offboarding
  check, or anthropic admin roles.
---

# Anthropic Seat Inventory

## Overview

An MSP that supplies or manages Claude for a client needs to answer three
questions on a schedule: how many seats are in use, who holds the
powerful roles, and whether people who left still have access. This skill
answers them from the Admin API. It reads only; removing a user or
revoking an invite is done by a client admin in Claude Console.

## Anti-triggers

- **API keys a leaver created** — keys outlive their creator's seat; use
  [key-and-audit-review](../key-and-audit-review/SKILL.md) (admin-gated).
- **Who is actually using Claude Code** — membership is not usage; use
  [claude-code-adoption](../claude-code-adoption/SKILL.md).

## Key Concepts

- **Organization role** (`role` on a user). Console and API orgs use
  `user`, `developer`, `billing`, `admin`, and `claude_code_user`. Claude
  Enterprise orgs use `user`, `owner`, `primary_owner`,
  `membership_admin`, and `managed`. Filter with the `roles` argument.
- **Invites** have a status of `pending`, `accepted`, or `expired`. A
  pending invite is a seat about to be taken; an old pending invite to a
  departed person is still a way in once accepted.
- **Workspaces** split keys, usage, and limits. A user can belong to the
  org but to only some workspaces, each with its own workspace role. The
  default workspace is hidden unless you pass `include_default: true`;
  archived workspaces need `include_archived: true`.

## Workflows

### Seat count

1. `anthropic_admin_organization_get` - confirm the org.
2. `anthropic_admin_users_list` with `limit: 1000`, paging `after_id` until
   `has_more` is false.
3. Group by `role` and count. Report the total, the count per role, and
   the newest `added_at` dates (recent additions explain a jump since the
   last review).
4. `anthropic_admin_invites_list` with `statuses: ["pending"]` - pending
   seats, listed separately from active ones.

### Admin-role review

1. `anthropic_admin_users_list` with `roles: ["admin"]` (Console org) or
   `roles: ["owner", "primary_owner", "membership_admin"]` (Enterprise).
2. Compare against the people the client says should administer the org.
   Flag anyone extra, and flag personal email domains on admin seats.
3. For workspace-level admin, `anthropic_admin_workspaces_list`, then
   `anthropic_admin_workspace_members_list` per workspace, and look at the
   workspace role on each membership.

### Offboarding check

Given a leaver's email address:

1. `anthropic_admin_users_list` with `email` - still a member?
2. `anthropic_admin_invites_list` with `email` - any invite still pending?
3. If a user ID came back, `anthropic_admin_workspace_member_get` for each
   workspace, or note the org membership alone if they have no workspaces.
4. Report "still has access: yes/no" with the evidence, and hand the
   removal to the client admin. If the caller has the admin tier, continue
   with the leaver's API keys in
   [key-and-audit-review](../key-and-audit-review/SKILL.md).

A person missing from `anthropic_admin_users_list` has no Console seat in
this org, but may still be a member of a different Anthropic org the
client owns. Say which org you checked.

## Gotchas

- `anthropic_admin_users_list` filters by exact email. Aliases and plus
  addresses do not match; when the client's identity provider uses
  aliases, list everyone and match yourself.
- Counting seats from one page undercounts silently. Page to the end.
- Workspace membership is per workspace. There is no single call for "all
  workspaces this user is in"; loop the workspaces.
- Invite and user records hold names and email addresses. Keep reports
  that leave the MSP to counts and roles unless the client asked for
  names.

## Related Skills

- [api-patterns](../api-patterns/SKILL.md) - pagination, tiers, errors
- [key-and-audit-review](../key-and-audit-review/SKILL.md) - keys a member created, and role-change history
