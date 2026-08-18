---
name: "Mailprotector Users & Groups"
description: >
  User groups as the service container (services get/update with its
  deactivate-what-you-omit semantics), user CRUD including create_many and
  find_by_address, user aliases, password resets, and user syncs — LDAP/AD
  source creation, Entra/Google console-only sources, sync schedules, and
  comparison-type filters.
when_to_use: >-
  When managing Mailprotector user groups, users, aliases, services, or
  directory syncs. Use when: mailprotector user, user group, create users,
  find by address, user alias, reset password, user sync, AD sync, Entra
  sync, LDAP sync, mailprotector services, provision bracket.
---

# Mailprotector Users & Groups

## Overview

Users live in user groups; user groups live under domains and are the
unit of **service provisioning** — which products (CloudFilter, Bracket,
SafeSend, XtraMail, SecureStore, hosting) a set of users gets. Manual
user CRUD and directory sync are alternative population strategies for
the same groups.

## Key Concepts

| Concept | Detail |
|---------|--------|
| User group | `{id, name, domain, user_count}` — created under a domain with just `name` |
| Services | Per user group; split into one `hosting` option plus any number of `addons` |
| `user_type` | `1` User, `2` Alias, `3` Mailing List, `11` Unlicensed User |
| Primary address | Generated as `<name>@<domain>`; one extra address per domain alias |
| User sync | Domain-level directory import into a `destination_user_group` |
| Sync source types | `UserSync::LdapSource` (API-creatable), `UserSync::GoogleSource` and `UserSync::MicrosoftGraphSource` (Entra/O365 — **console-only**) |

## Common Workflows

### User groups and services

1. Create: `POST /domains/{domain_id}/user_groups` `{"name": "..."}`;
   list with `mailprotector_user_groups_list`.
2. Read services: `GET /user_groups/{user_group_id}/services` → array of
   `{id, service_type, user_group, domain}`.
3. Update services: `PUT /user_groups/{user_group_id}/services` with

   ```json
   {"service_types": {"hosting": "other", "addons": ["bracket", "securestore"]}}
   ```

   One `hosting` value, any number of `addons`. **Any currently active
   service not present in the body is deactivated** — always GET the
   current services, merge, then PUT the full desired set.
4. Rename: `PUT /user_groups/{id}`; delete: `DELETE /user_groups/{id}` —
   **deletes every user in the group**. Move users to another group
   first to preserve them.

### Creating users

- Single: `POST /user_groups/{user_group_id}/users` with
  `{"name": "username", "password": "...", "first_name": "...",
  "last_name": "...", "user_type_id": 1, "aliases": ["alias1"]}`.
  Responds 201 with an **array** containing the created user.
- Bulk: `POST /user_groups/{user_group_id}/users/create_many` with
  `{"users": [ {...}, {...} ]}` — same per-user shape.
- Each user gets `<name>@<domain>` plus one address per domain alias.
- Lookup: `mailprotector_users_list` (filterable, e.g.
  `?first_name=Bob`), `mailprotector_users_get`, and
  `mailprotector_users_find_by_address`
  (`POST /users/find_by_address` `{"address": "someone@domain.com"}`) —
  searching an alias address returns the **root** user.

### Maintaining users

- Update: `PUT /users/{user_id}` — `first_name`, `last_name`, `phone`,
  `user_type_id`.
- Reset password: `POST /users/{user_id}/reset_password`
  `{"password": "..."}` — sets it to the supplied value (high-impact;
  confirm with the operator).
- Delete: `DELETE /users/{user_id}` — irreversible.
- Aliases: `GET /users/{user_id}/aliases`;
  `POST /users/{user_id}/aliases` with the **nested** body
  `{"alias": {"name": "alias-username"}}` (unlike the flat `aliases`
  array on user create). The parent must be `user_type` "User" —
  mailing lists and equipment accounts cannot take aliases. An alias
  address is created for the domain and each domain alias.

### Directory sync (AD / Entra)

1. List: `GET /domains/{domain_id}/user_syncs`; single:
   `GET /user_syncs/{user_sync_id}`.
2. Create (LDAP/AD only):
   `POST /domains/{domain_id}/user_syncs` with
   `destination_user_group_id`, `source_type: "UserSync::LdapSource"`,
   `enabled: "true"`, and
   `source: {host, port, use_ssl, username, password, search_base}`.
   New syncs are **disabled by default** unless `enabled` is passed.
   Google Workspace and Microsoft Graph (Entra ID / Office 365) sources
   must be provisioned in the web console — but once they exist, their
   schedule and filters are managed via the API like any other sync.
3. Schedule (per domain, not per sync):
   `GET`/`PUT /domains/{domain_id}/user_sync_schedule` with
   `{"interval": 30, "enabled": true}` — `interval` is minutes between
   runs; the response carries `last_run_at`/`next_run_at`.
4. Filters: `GET`/`POST /user_syncs/{user_sync_id}/filters` with
   `{"field": "Department", "value": "Accounting", "filter_group":
   "all", "comparison_type_id": 1}`; delete via
   `DELETE /user_sync_filters/{id}`. `filter_group` is `all` (AND) or
   `any` (OR). Comparison types:

   | id | Comparison | id | Comparison |
   |----|------------|----|------------|
   | 1 | Equals | 5 | Contains |
   | 2 | Does not equal | 6 | Does not contain |
   | 3 | Greater than | 7 | Matches |
   | 4 | Less than | 8 | Does not match |

## Gotchas

- **The services PUT is declarative, not additive.** Omitting an active
  addon deactivates it. This is the highest-risk write in this skill —
  read-merge-write, always.
- **Sync health**: `alive: false` on a sync means the source stopped
  answering; check host/credentials before touching filters.
- **`enabled` on sync create is the string `"true"`** in the documented
  body; the update accepts a boolean. Send what the endpoint shows.
- **User create returns an array**, even for a single user — index
  `[0]` for the created record.
- **Deleting a user group deletes its users** — the API will not warn.

## Related Skills

- [customers-and-domains](../customers-and-domains/SKILL.md) — the domain must be Active before users receive mail
- [quarantine-and-messages](../quarantine-and-messages/SKILL.md) — per-user quarantine once users exist
