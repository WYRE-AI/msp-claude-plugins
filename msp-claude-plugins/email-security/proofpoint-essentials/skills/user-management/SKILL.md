---
name: "Proofpoint Essentials User Management"
description: >
  Proofpoint Essentials mailbox user management within a customer org: list,
  get, create (including batch create), update, and delete
  mailbox-protected users.
when_to_use: >-
  When listing, creating, updating, or removing mailbox-protected users in a
  Proofpoint Essentials customer org. Use when: proofpoint essentials user,
  add mailbox, remove mailbox, proofpoint essentials user create, bulk create
  users, update user, delete user, or proofpoint essentials mailbox.
---

# Proofpoint Essentials User Management

## Overview

A **user** in Proofpoint Essentials is a mailbox that Essentials filters
mail for — not a console login. Users live inside exactly one org and are
identified by their email address. This skill covers the user CRUD surface;
the org and domain container it lives in is `org-management`. As with every
other resource, resolve the org's regional pod first (see `api-patterns`)
before calling any tool below.

## Anti-triggers

- **The org, its domains, features, licensing, or package tier** — that is
  `org-management`. This skill only covers individual mailbox users.
- **Mail flow volume or delivery statistics for a user's mailbox** — that
  is `reporting`, which reports at the org level, not per-mailbox.

## Key Concepts

### User identity

A user is addressed by email address within its org — there is no separate
numeric user ID to look up first. `proofpoint_essentials_users_get`,
`_update`, and `_delete` all take the user's email address directly.

### A domain must exist before its users can

Creating a user on a domain the org hasn't added yet fails. Confirm the
domain is present (`proofpoint_essentials_domains_list` in `org-management`)
before batch-creating users on it — a common failure mode when onboarding a
customer with domains and users in the same session but domain creation
hasn't propagated yet.

## MCP Tools

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `proofpoint_essentials_users_list` | List users in an org | `org_name` |
| `proofpoint_essentials_users_get` | Get one user by email address | `org_name`, `email` |
| `proofpoint_essentials_users_create` | Create one or more users in an org | `org_name`, `users[]` |
| `proofpoint_essentials_users_update` | Update a user's settings | `org_name`, `email` |
| `proofpoint_essentials_users_delete` | Remove a user from an org | `org_name`, `email` |

`proofpoint_essentials_users_create` follows the batch-create / 207
Multi-Status pattern described in `api-patterns` when given more than one
user — always inspect per-user results rather than treating the call as a
single pass/fail.

## Common Workflows

### Bulk-onboard a customer's mailboxes

1. Confirm the target domain already exists on the org
   (`proofpoint_essentials_domains_list`, in `org-management`).
2. Call `proofpoint_essentials_users_create` with the full list of mailbox
   addresses in one batch call.
3. Walk the 207 response per user. For any failure (duplicate address,
   malformed email, domain mismatch), record the specific address and
   reason rather than reporting an aggregate "N users created."
4. Retry only the failed entries after correcting them — do not resubmit
   the full batch, or the already-created users may fail as duplicates.

### Offboard a departing employee

1. Call `proofpoint_essentials_users_get` to confirm the mailbox exists and
   note any settings worth recording before removal.
2. Call `proofpoint_essentials_users_delete` with the user's email address.
3. **This removes Essentials' filtering configuration for that mailbox; it
   does not delete the mailbox itself** (that's the mail platform's job —
   Microsoft 365, Google Workspace, etc.). Coordinate with whichever
   workflow handles actual mailbox deprovisioning.

### Audit users across an org

1. Call `proofpoint_essentials_users_list` for the org.
2. Cross-reference against the domain list from `org-management` to spot
   users on domains that were since removed, or domains with unexpectedly
   few/no users registered.

## Error Handling

| Symptom | Cause | Resolution |
|---------|-------|------------|
| `users_create` fails for every entry on a domain | Domain not yet added to the org, or not yet verified | Add/verify the domain first (`org-management`) |
| `users_get` 404 for a user you can see in the console | Wrong regional pod, or a typo in the email address | Re-run endpoint discovery; confirm the exact address |
| 207 batch shows partial duplicates | Address already registered (possibly under a different case) | Essentials addresses are not always case-sensitive in practice — check `users_list` before assuming a fresh address |
| `users_delete` succeeds but mail still filters | Stale local/cached org state | Re-run `users_list` to confirm current state rather than trusting a prior read |

## Related Skills

- [Proofpoint Essentials API Patterns](../api-patterns/SKILL.md) - Auth, regional pod resolution, batch semantics
- [Proofpoint Essentials Org Management](../org-management/SKILL.md) - Org, domain, feature, and licensing management
- [Proofpoint Essentials Reporting](../reporting/SKILL.md) - Inbound/outbound mail flow metrics
