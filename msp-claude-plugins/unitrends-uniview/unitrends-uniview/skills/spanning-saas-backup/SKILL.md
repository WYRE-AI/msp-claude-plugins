---
name: "Unitrends UniView Spanning SaaS Backup"
description: >
  Spanning SaaS backup data in Unitrends UniView: Microsoft 365 and Google
  Workspace domains with their mapped customer, user and license counts and
  expiration, per-user last backup status, the v1 and v2 tool shapes, and the
  personal-data handling the user tools need. Covers license true-up, renewal
  and per-user backup failure reviews.
when_to_use: >-
  When reviewing Spanning backup for a customer's Microsoft 365 or Google
  Workspace tenant: license usage, upcoming expirations, or which users are not
  backing up. Use when: spanning backup, m365 backup, google workspace backup,
  spanning licenses, spanning expiration, saas backup users, or user not backed
  up.
---

# Unitrends UniView Spanning SaaS Backup

## Overview

Spanning protects Microsoft 365 and Google Workspace mailboxes, drives and
sites. UniView lists each Spanning domain (tenant) with its origin, mapped
customer, user and license counts and expiration, and each domain's users with
their last backup status. All four Spanning tools are plain reads in Conduit;
none is admin-gated. Two of them return personal data.

## Anti-triggers

- **Appliance or endpoint backups**: use `unitrends-uniview-backup-health-triage` or
  `unitrends-uniview-protection-coverage`.
- **The user accounts themselves** (licenses assigned in Microsoft 365, sign-in
  state, offboarding): that is the tenant's own admin data, not Spanning's.
  Use a Microsoft 365 plugin.

## Key Concepts

| Tool | Returns | Personal data |
|------|---------|---------------|
| `unitrends_uniview_spanning_domains_list` | Domains: origin, mapped customer, user and license counts, expiration | Only with `include: {"users": "true"}` |
| `unitrends_uniview_spanning_domain_users_list` | One domain's users, active and archived, with last backup status and time | Yes |
| `unitrends_uniview_spanning_domains_list_v1` | Older v1 shape of the domain list | Only with `include: {"users": "true"}` |
| `unitrends_uniview_spanning_domain_users_list_v1` | Older v1 shape of the user list | Yes |

Use the v2 tools (no `_v1` suffix). Fall back to the v1 tools only when a field
you need is missing from v2.

## Common Workflows

### License and renewal review (all customers)

1. `unitrends_uniview_spanning_domains_list` with `order_by: "number_of_users"`,
   `order_direction: "desc"`. Leave `include` unset so no user lists are
   embedded. Page through every page.
2. For each domain compare users with licenses:
   - more users than licenses: users may be unprotected; true-up needed;
   - far fewer users than licenses: over-licensed; reduce at renewal.
3. List domains whose expiration falls in the next 60 days, by customer.
4. List domains with no mapped customer; they are missing from per-customer
   reporting and billing reconciliation.

### Which users are not backing up (one domain)

1. Find the domain in `unitrends_uniview_spanning_domains_list` and take its ID.
2. `unitrends_uniview_spanning_domain_users_list` with that `domain_id`. Page
   through every page.
3. Report active users whose last backup status is not successful, or whose
   last backup time is older than 48 hours. Archived users are expected to
   stop backing up; list them separately.

### Offboarding check

When a customer offboards a user, confirm the user's mailbox and drive were
backed up recently before the account is deleted: page through
`unitrends_uniview_spanning_domain_users_list` for the domain (the tool has no
user filter), find the user, and report the last backup time and status. The
API is read-only; archiving or restoring is done in Spanning.

## Gotchas

- **Do not embed users in the domain list.** `include: {"users": "true"}` adds
  every user of every domain to one response. It is personal data and is often
  too large to return. Use the per-domain user tool instead.
- **The user tools return email addresses.** Summarize counts in shared
  channels and customer-facing reports; list names only to the technician who
  needs them.
- **`domain_id` comes from the domain list.** It is the Spanning domain or
  tenant ID, not the customer UUID.
- **Read every page.** Large tenants have thousands of users; the default page
  is 50.

## Related Skills

- [api-patterns](../api-patterns/SKILL.md): headers, paging, truncation, errors
- [protection-coverage](../protection-coverage/SKILL.md): all protection for one customer
