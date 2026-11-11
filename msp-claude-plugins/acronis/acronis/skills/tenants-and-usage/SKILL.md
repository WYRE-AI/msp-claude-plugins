---
name: "Acronis Tenants and Usage"
description: >
  The Acronis Cyber Protect Cloud tenant hierarchy as an MSP sees it: finding
  the partner tenant, listing and searching customer tenants, mapping them to
  PSA companies, reading per-customer usage for billing reconciliation,
  listing a customer's Acronis users and their roles for access reviews, and
  checking MFA enrollment. All read-only; tenant, user and pricing changes
  are not available through this connector.
when_to_use: >-
  When an MSP needs to find an Acronis customer tenant, list all Acronis
  customers, reconcile Acronis usage against PSA contracts or invoices,
  review who has access to a customer's Acronis tenant, or check MFA
  enforcement. Use when: acronis customers, acronis tenant id, acronis usage,
  acronis billing reconciliation, acronis seat count, acronis users, acronis
  MFA, or acronis access review.
---

# Acronis Tenants and Usage

## Overview

Everything in Acronis lives in a tenant. Most workflows in this plugin start
with "which tenant UUID is this client?", so this skill covers how to find
it, plus the account-level jobs an MSP does monthly: usage reconciliation,
user access reviews and MFA posture.

## Key Concepts

| Tenant kind | What it is |
|-------------|-----------|
| Partner | The MSP's own tenant. A partner-level API client sees everything under it. |
| Folder | An optional grouping of customers under a partner |
| Customer | One client organization. Backups, alerts and incidents live here. |
| Unit | An optional sub-division inside a customer |

## Workflow: Find the Partner Tenant

1. Call `acronis_fetch_current_user_info`. Its result names the tenant the
   API client signs in as.
2. If that doesn't give a tenant ID, ask the operator for the partner tenant
   ID. Don't guess one.
3. Confirm it with `acronis_fetch_tenant` (`path.tenant_id`). Check that its
   kind is partner, not customer. A customer-level API client sees only that
   one customer.

## Workflow: List and Map Customers

1. `acronis_fetch_tenants_batch` with `parent_id` set to the partner tenant
   and `lod: "basic"` returns the direct children with names. Use
   `subtree_root_id` instead when customers sit inside folders, which returns
   the whole hierarchy.
2. Page with `limit` and `after` (from `paging.cursors.after`) until there is
   no next cursor.
3. To find one client by name, use `acronis_search` with `tenant` set to the
   partner tenant and `text` set to the name. It searches tenants and users.
4. Map each customer to its PSA company by name and save the mapping.
   Acronis tenant names are free text, so expect near-misses ("Acme Inc" vs.
   "Acme, Inc.") and confirm the ambiguous ones with the operator.

`acronis_fetch_tenant_children` returns only child **IDs**. Follow it with
`acronis_fetch_tenants_batch` (`uuids`, up to 100 per call) for names.

## Workflow: Monthly Usage Reconciliation

1. For each customer, call `acronis_fetch_tenant_usages` with
   `path.tenant_id`. It returns the tenant's usage metrics, one per usage
   name (for example `workstations`). Narrow with `usage_names` or `editions`
   (both comma-separated) once you know which ones you bill for.
2. Compare each metric against the quantity on the client's PSA agreement or
   last invoice.
3. Report three lists: under-billed (Acronis usage higher than billed),
   over-billed (billed for more than is used), and matches.
4. Run reconciliation on the same day each month so the numbers compare
   like for like.

Pricing, editions and offering items can't be changed through this
connector. Report differences; changes happen in the console or PSA.

## Workflow: User Access Review

1. `acronis_fetch_users_batch` with `subtree_root_tenant_id` set to the
   customer tenant, `lod: "full"` and `with_access_policies: true` returns
   the customer's users (including those in its units) with their details and
   access policies, which carry their roles. Page with `limit` and `after`.
2. Alternatively, `acronis_fetch_tenant_users` returns user **UUIDs** only
   (pass `include_grand_children: true` for users in units). Follow it with
   `acronis_fetch_users_batch` using `uuids`, up to 100 per call.
3. Flag: users who left the client, shared or generic logins, and anyone
   with an administrator role who doesn't need it.
4. Check the MSP side too: run the same steps on the partner tenant to see
   which technicians have partner-level access.

Disabling or deleting users can't be done through this connector. Give the
operator the list to act on in the console.

## Workflow: MFA Posture

`acronis_fetch_tenant_mfa_status` with `path.tenant_id` reports whether MFA
is on for the tenant and how many users have set up TOTP. Run it on the
partner tenant first: an MSP's own Acronis logins reach every client's
backups, so partner-level MFA matters most. Then run it per customer for
clients whose staff log in to Acronis.

## Gotchas

- `uuids`, `parent_id` and `subtree_root_id` on `acronis_fetch_tenants_batch`
  can't be combined. Pick one.
- Deleted tenants and users are hidden unless you pass `allow_deleted: true`.
  Leave it off for reconciliation, or retired clients show up as live.
- `acronis_fetch_user` takes one user. For more than a handful, use
  `acronis_fetch_users_batch`. Its `uuids`, `tenant_id` and
  `subtree_root_tenant_id` filters can't be combined.
- Tenant and user IDs must be 36-character UUIDs. The tools reject anything
  else, such as a tenant name.

## Related Skills

- [api-patterns](../api-patterns/SKILL.md) - Headers, pagination and errors
- [backup-health](../backup-health/SKILL.md) - Alert triage per customer
- [protection-coverage](../protection-coverage/SKILL.md) - Coverage audit per customer
