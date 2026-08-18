---
name: "Mailprotector Customers & Domains"
description: >
  Customer lifecycle (create/edit/delete under the reseller), domain
  creation with the Pending → Active verification flow and
  verification_token, domain aliases, moving domains between customers,
  address discovery, and mail routing via email destinations and email
  sources.
when_to_use: >-
  When creating or managing Mailprotector customers, domains, domain
  aliases, or mail routing. Use when: mailprotector customer, mailprotector
  domain, domain verification, verification token, domain alias, move
  domain, email destination, email source, mailprotector onboarding.
---

# Mailprotector Customers & Domains

## Overview

Customers are the client organizations under the MSP's reseller; domains
hang off customers and carry the actual mail routing. Onboarding a client
is: create the customer, create the domain, verify it, then point mail
flow at it (destinations for inbound delivery, sources for outbound
authorization).

## Key Concepts

| Concept | Detail |
|---------|--------|
| Customer | `{id, name, provider, reseller, created_at, updated_at}` — created with just `name` and contact `email` |
| Domain status | `domain_status`: `{id: 1, name: "Pending"}` or `{id: 2, name: "Active"}` |
| `verification_token` | Returned on domain create while Pending; `null` once Active |
| Domain alias | A domain with `parent` set to the primary domain; goes through its own Pending/verification |
| `address_discovery_enabled` | Domain flag; auto-discovers addresses from mail flow (defaults on for new domains) |
| Email destination | Where filtered inbound mail is delivered — domain, hostname, or IP, with `priority` ordering |
| Email source | An IP authorized to relay outbound mail through Mailprotector |

## Common Workflows

### Customer lifecycle

1. Create: `POST /resellers/{reseller_id}/customers` with
   `{"name": "...", "email": "contact@..."}` → 201 with the new `id`
   (tool: `mailprotector_customers_create`).
2. Read: `mailprotector_customers_list` (from the bound reseller) and
   `mailprotector_customers_get`.
3. Edit: `PUT /customers/{customer_id}` with `name`/`email` (via
   `mailprotector_execute_tool`).
4. Delete: `DELETE /customers/{customer_id}` — **removes all domains and
   users under the customer**. Irreversible; confirm explicitly.

### Domain creation and verification

1. `POST /customers/{customer_id}/domains` with `{"name": "domain.com"}`
   (tool: `mailprotector_domains_create`).
2. The response is 201 with `domain_status` **Pending** and a
   `verification_token`. Mail is **not filtered** for a Pending domain.
3. Surface the `verification_token` to the operator — ownership is
   proven with it before Mailprotector activates the domain. Re-fetch
   the domain (`mailprotector_domains_get`) to watch for
   `domain_status` id 2 (Active) / `verification_token: null`.
4. After activation, add email destinations and sources (below), then
   repoint MX records.

### Domain aliases

`POST /domains/{domain_id}/aliases` with `{"name": "domain-alias.com"}`.
The alias appears in `GET /domains/{domain_id}/aliases` with `parent`
set to the primary domain and its own Pending status + token. Every user
under the primary domain automatically accepts mail at the alias domain
(user `email_addresses` extend to each alias), so create aliases before
bulk-creating users when you want alias addresses generated.

### Moving a domain between customers

`POST /domains/{domain_id}/move` with `{"customer_id": 16998}` — only
within the **same reseller**. User groups, users, and rules travel with
the domain. Use this to fix a domain created under the wrong customer
instead of delete + recreate (which would destroy users).

### Mail routing

- Destinations: `GET`/`POST /domains/{domain_id}/email_destinations`
  with `{"address": "mail.domain.com"}` — address may be a domain,
  hostname, or IP. `priority` is assigned in creation order (0 first);
  lower priority is tried first.
- Sources: `GET`/`POST /domains/{domain_id}/email_sources` with
  `{"address": "192.0.2.1"}` — the IPs allowed to relay outbound.
- Both also exist at user-group scope
  (`/user_groups/{id}/email_destinations` and `_sources`) for groups
  that deliver somewhere other than the domain default — the MCP tool
  takes `scope: domain|user_group`.

## Gotchas

- **Pending domains silently drop the onboarding.** Everything after
  domain creation (groups, users, MX cutover) can proceed, but no mail
  is filtered until the domain is verified. Always report the
  verification state, and never call an onboarding done while
  `domain_status` is Pending.
- **Customer delete cascades.** Domains and users go with it. Prefer
  domain move or user-group edits for restructuring.
- **`PUT /domains/{domain_id}`** is for flags like
  `address_discovery_enabled` — you cannot rename a domain; create the
  correct one and move users.
- **Customer managers** (`POST /customers/{customer_id}/managers`)
  create console logins, but **roles cannot be assigned via the API** —
  a new manager has an empty `roles` array until someone assigns the
  role in the console. Listing customer managers excludes
  reseller-level managers.
- **Statements** (`GET /resellers/{id}/statements`,
  `GET /customers/{id}/statements`) are billing history
  (`amount`, `currency`, `statement_status`, billing/due dates) — read
  them for reconciliation, not for provisioning state.

## Related Skills

- [users-and-groups](../users-and-groups/SKILL.md) — the next onboarding step after the domain is Active
- [api-patterns](../api-patterns/SKILL.md) — hierarchy, auth, and error handling
