---
name: "LastPass Privileged Access Review"
description: >
  Reviewing who holds LastPass admin rights: admin levels (RBAC roles)
  and their permissions, the users in each level, the MSP cross-tenant
  admin-user report, and how to cross-check admins for MFA, dormancy and
  leaver status. Produces an access-review record suitable for SOC 2,
  ISO 27001 or cyber-insurance evidence.
when_to_use: >-
  When running a periodic access review of LastPass admins for one
  client or across the whole client book, or answering "who can
  administer this client's LastPass". Use when: lastpass admins,
  lastpass admin levels, lastpass rbac, privileged access review
  lastpass, who is a lastpass admin, super admin lastpass, or access
  review evidence password manager.
---

# LastPass Privileged Access Review

## Overview

A LastPass admin can change policies, reset or remove users, and
manage shared folders, so admin membership is the access worth
reviewing most often. LastPass models admin rights as **admin levels**:
named roles with a permission set. Each user has at most one
`adminLevelId`.

Every tool here is tier **read** in Conduit; none is admin-gated.
Removing an admin level happens in the LastPass Admin Console.

## Anti-triggers

- **MFA and score coverage for all users** - use
  [security-posture](../security-posture/SKILL.md); this skill only
  looks at admins.
- **One departing admin** - use
  [offboarding-review](../offboarding-review/SKILL.md), which covers the
  rest of their access too.

## Common Workflows

### Whole client book (MSP key)

1. Pull `lastpass_reports_admin_users_list` with `max_results: 500`,
   paging with `page_token`. Each row is `userEmail`, `adminLevel` and
   `company`, across every child and grandchild company. This is the
   fastest view of every admin the MSP is responsible for.
2. Group by company. Flag companies with zero admins (nobody can manage
   them except the MSP) and companies with an unusually high admin
   count.
3. Flag admins whose email domain does not match the client's domain.
   MSP technicians are expected; anyone else (a former vendor, a
   personal address) needs an owner.
4. For any company that needs detail, run the single-company workflow.

### One company

1. List the roles: `lastpass_managed_company_admin_levels_list` (or
   `lastpass_admin_levels_list` for the key's own company).
2. For each level, read its permissions with
   `lastpass_managed_company_admin_level_get` (or
   `lastpass_admin_level_get`) and its holders with
   `lastpass_managed_company_admin_level_users_list` (or
   `lastpass_admin_level_users_list`). Page members with `page_token`.
3. For each holder, read the user with
   `lastpass_managed_company_user_get` (or `lastpass_user_get`) and
   check `accountStatus`, `advancedMfaStatus`, `lastLoginTime` and
   `masterPasswordScore`.
4. Record the review.

## What to Flag

| Finding | Why it matters |
|---------|----------------|
| Admin without MFA | One phished master password exposes the whole tenant |
| Admin with a weak `masterPasswordScore` | Same exposure |
| Admin not logged in for 90+ days | Standing privilege nobody uses; remove it |
| Admin who is `disabled` but still holds the level | Clean-up was half done |
| Custom level with broad permissions held by many users | Role sprawl |
| Shared or generic admin mailbox (`it@`, `admin@`) | No individual accountability |
| Admin outside the client's domain and not MSP staff | Unknown third party |

## Output

An access-review record per company: date of review, reviewer, each
admin level with its permissions summarised, each holder with status,
MFA, last login and a keep or remove recommendation, and the list of
Admin Console changes to make. Keep it factual so it can be filed as
audit evidence; note that the review was read-only and no changes were
made by the reviewer.

## Gotchas

- **Business key**: `lastpass_reports_admin_users_list` and the
  `lastpass_managed_company_*` tools need an MSP key (403 otherwise).
  With a Business key, use the own-company admin-level tools.
- **The cross-tenant report has no MFA data.** It names the admin and
  level only. Pull the user record for MFA and last login.
- **Level names are tenant-defined.** Read the permissions, not just the
  name; a level called "Helpdesk" can hold super-admin rights.
- **Page every list.** Admin level member lists cap at 50 per page.

## Related Skills

- [api-patterns](../api-patterns/SKILL.md) - pagination, filters, errors
