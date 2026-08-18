---
name: "Mailprotector API Patterns"
description: >
  Mailprotector MCP fundamentals: gateway header authentication
  (`X-Mailprotector-Api-Key` / `X-Mailprotector-Reseller-Id`) and its
  translation to the upstream Bearer token, the Provider → Reseller →
  Customer → Domain → User Group → User entity hierarchy, the router-pattern
  tool surface with `mailprotector_execute_tool` for the long tail,
  scope/scope_id consolidation, field-based list filtering, `page`
  pagination (max 50 on messages), and error handling.
when_to_use: >-
  When working with Mailprotector authentication, entity hierarchy, tool
  routing, pagination, or error handling. Use when: mailprotector api,
  mailprotector authentication, mailprotector mcp, mailprotector token,
  emailservice.io, mailprotector pagination, mailprotector scope.
---

# Mailprotector MCP Tools & API Patterns

## Overview

Mailprotector is an email-security platform for MSPs (products:
CloudFilter filtering, Bracket encryption, SafeSend outbound protection,
XtraMail continuity). The MCP server wraps its REST API at
`https://emailservice.io/api/v1` and scopes every session to one
reseller — the MSP's own account.

## Connection & Authentication

The gateway passes two vendor headers to the MCP server:

| Header | Value |
|--------|-------|
| `X-Mailprotector-Api-Key` | The Mailprotector API key (secret) |
| `X-Mailprotector-Reseller-Id` | The MSP's reseller ID (not secret) |

The MCP server translates the API key into the upstream
`Authorization: Bearer <api_key>` header on every request to
`emailservice.io` — the raw Bearer form never appears at the gateway
boundary. In env mode (stdio/local) the same two values come from:

```bash
export MAILPROTECTOR_API_KEY="your-api-key"
export MAILPROTECTOR_RESELLER_ID="12345"
# optional, defaults to https://emailservice.io
export MAILPROTECTOR_BASE_URL="https://emailservice.io"
```

API keys are issued **per manager role**: in the Mailprotector console,
open your profile, pick the role, and choose "View API Key". Credential
validity is checked with `GET /api/v1/resellers/{reseller_id}` — a 200
means the key can see the bound reseller. Most keys can only read their
own reseller; provider-level operations (creating resellers) need a
provider-scoped key.

## Entity Hierarchy

```
Provider → Reseller (the MSP) → Customer → Domain → User Group → User
```

- **Reseller** — the MSP account the session is bound to.
- **Customer** — a client organization under the reseller.
- **Domain** — a mail domain under a customer; can have alias domains.
- **User Group** — the service container under a domain; products
  (CloudFilter, Bracket, ...) are provisioned per group.
- **User** — a mailbox; owns addresses, aliases, quarantine, and rules.

In API responses both resellers and customers appear with
`entity_type: "Account"` — disambiguate by position, not by type name.

## Tool Surface (router pattern)

A compact first-class surface handles the common operations:

- **Router/meta**: `mailprotector_status`, `mailprotector_list_categories`,
  `mailprotector_list_category_tools`, `mailprotector_execute_tool`
- **Customers**: `mailprotector_customers_list` / `_get` / `_create`
- **Domains**: `mailprotector_domains_list` / `_get` / `_create`
- **Users**: `mailprotector_users_list` / `_get` / `_find_by_address`
- **User groups**: `mailprotector_user_groups_list`
- **Messages**: `mailprotector_messages_list` / `_release` / `_release_many`
- **Rules**: `mailprotector_allow_block_rules_list` / `_create` / `_delete`
- **Logs/config**: `mailprotector_logs_list`, `mailprotector_configuration_get`

Everything else — updates, deletes, managers, statements, email
destinations/sources, user syncs, notification destinations, aliases,
domain move/verify, password resets, user-group services — is reachable
via `mailprotector_execute_tool(category, tool, args)`. Discover the
long tail with `mailprotector_list_categories` then
`mailprotector_list_category_tools`. `tools/list` is identical and
deterministic for every caller.

## Scope Consolidation

Many operations exist at up to five levels of the hierarchy. Instead of
five tools, one tool takes:

- `scope`: `reseller` | `customer` | `domain` | `user_group` | `user`
- `scope_id`: the entity ID (defaults to the bound reseller when
  `scope=reseller`)

This applies to **messages**, **allow_block_rules**, and **logs** (all
five scopes), **configuration** (reseller/customer/domain/user_group),
**statements** (reseller/customer), **email destinations/sources**
(domain/user_group), **aliases** (domain/user), and **notification
destinations** (user/manager).

## List Filtering & Pagination

- List endpoints filter by field-named query params, e.g.
  `?first_name=Bob` on users. Filter server-side rather than pulling
  whole collections.
- Pagination is a `page` query param. Message listings cap at **50 per
  page** — a quiet first page does not mean an empty quarantine; walk
  pages until a short page comes back.

## Error Handling

| Status | Meaning | Action |
|--------|---------|--------|
| 200 / 201 | Success (201 on creates) | — |
| 204 | Success with empty body — deletes and single-message release | Do not treat the empty body as a failure |
| 401 | Missing or invalid API key | Re-check `MAILPROTECTOR_API_KEY` / gateway credential |
| 403 | Key valid but not permitted for this entity (e.g. another reseller's data, provider-only op) | Verify the entity is under your reseller |
| 404 | Unknown ID | Re-list from the parent entity to confirm |
| 422 | Validation failure on a create/update body | Fix the named field and retry |

## Destructive Operations

- **Irreversible** (require explicit human confirmation): every
  `delete_*` — customer, domain, user, user group, reseller, manager,
  allow/block rule, user sync, notification destination. Deleting a
  customer cascades to its domains and users; deleting a user group
  deletes its users.
- **High-impact but reversible**: message release (single and bulk),
  password resets, configuration updates, allow/block rule creation,
  user-group services updates. Say what will change before invoking.

## Related Skills

- [customers-and-domains](../customers-and-domains/SKILL.md) — customer and domain lifecycle
- [users-and-groups](../users-and-groups/SKILL.md) — user groups, users, syncs
- [quarantine-and-messages](../quarantine-and-messages/SKILL.md) — quarantine triage
- [allow-block-rules](../allow-block-rules/SKILL.md) — sender rules and inheritance
