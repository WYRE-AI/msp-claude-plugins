---
name: "LastPass API Patterns"
description: >
  The LastPass Business and MSP admin tool surface as exposed through
  Conduit: the 23 read-only tools and their Conduit tier, Business key
  versus MSP key scope, the `X-LastPass-API-Key` header, `max_results` /
  `page_token` pagination, wildcard and `[from:to]` range filters, the
  users LastPass silently omits from lists, the user record fields, and
  the error vocabulary (401 early access, 403 wrong key type, 429 shared
  limits, oversize pages).
when_to_use: >-
  When calling any LastPass tool, deciding whether something is possible
  through this connector at all, or diagnosing a LastPass connection or
  tool failure. Use when: lastpass api, lastpass mcp, lastpass api key,
  lpkey, lastpass 401, lastpass 403, lastpass pagination, nextPageToken,
  lastpass msp key, or "can Claude change LastPass".
---

# LastPass API Patterns

## Overview

This plugin reaches the LastPass REST API (Business and MSP admin,
`https://api.lastpass.com/business`) through the WYRE Conduit gateway.
Every tool is a read. Nothing in this connector can create, change,
disable or delete a user, send an invite, grant an admin level, or touch
a managed company, and the API never returns vault contents or
passwords.

What you can see: users and their security posture, pending invites,
user groups and members, admin levels (RBAC roles) and who holds them,
and for an MSP key the managed companies, a cross-tenant admin-user
report, and billing reports.

What you cannot see here: shared folders, vault items, policies, and
event or security reports. LastPass only exposes those through its
legacy Enterprise API, which this connector does not use. Say so plainly
when a request needs them; do not infer them from other data.

## Connection & Authentication

| Header | Value |
|--------|-------|
| `X-LastPass-API-Key` | The bare LastPass API key (starts with `lpkey_`) |

Conduit injects that header from the LastPass connection; nothing is set
on the client, and Conduit drops any `X-LastPass-API-Key` header a client
sends. In the Conduit web UI (`/connect/lastpass`), paste the key into the
LastPass connector's **LastPass API key** field. Paste the bare key, not
`Api-Key lpkey_...`: Conduit rejects anything that does not start with
`lpkey_`.

An admin creates the key in the LastPass Admin Console under
**Advanced > LastPass API**. The LastPass API is in early access: the
account has to be enrolled by LastPass before a key works, and an
unenrolled account gets HTTP 401 or 403.

The key has no read-only scope in LastPass. Conduit and the connector
only ever send GET requests, but the key itself could write if used
elsewhere, so create one just for Conduit and revoke it in the Admin
Console if it is ever exposed.

### Business key versus MSP key

| Key type | Can call |
|----------|----------|
| Business (or the MSP's own company) | The 9 own-company tools: `lastpass_users_list`, `lastpass_user_get`, `lastpass_invites_list`, `lastpass_user_groups_list`, `lastpass_user_group_get`, `lastpass_user_group_users_list`, `lastpass_admin_levels_list`, `lastpass_admin_level_get`, `lastpass_admin_level_users_list` |
| MSP | All of the above for the MSP's own company, plus the 14 managed-company and report tools |

A Business key calling a `lastpass_managed_company_*` or
`lastpass_reports_*` tool gets HTTP 403. That is the key type, not a
permissions bug. One MSP key reaches every child and grandchild company.

## Tool Surface and Conduit Tiers

All 23 tools are tier **read** in Conduit. **None is admin-gated**, and
there are no write, delete or admin tools to withhold.

| Area | Tools (own company) | Tools (client company, MSP key) |
|------|---------------------|---------------------------------|
| Users | `lastpass_users_list`, `lastpass_user_get` | `lastpass_managed_company_users_list`, `lastpass_managed_company_user_get` |
| Invites | `lastpass_invites_list` | `lastpass_managed_company_invites_list` |
| Groups | `lastpass_user_groups_list`, `lastpass_user_group_get`, `lastpass_user_group_users_list` | `lastpass_managed_company_user_groups_list`, `lastpass_managed_company_user_group_get`, `lastpass_managed_company_user_group_users_list` |
| Admin levels | `lastpass_admin_levels_list`, `lastpass_admin_level_get`, `lastpass_admin_level_users_list` | `lastpass_managed_company_admin_levels_list`, `lastpass_managed_company_admin_level_get`, `lastpass_managed_company_admin_level_users_list` |
| Companies | n/a | `lastpass_managed_companies_list`, `lastpass_managed_company_get` |
| MSP reports | n/a | `lastpass_reports_admin_users_list`, `lastpass_reports_billing_cycles_list`, `lastpass_reports_billing_list` |

Every client-company tool takes `child_company_id`. Get it from
`lastpass_managed_companies_list` (filter with `name`, e.g. `%contoso%`).
Path IDs (`child_company_id`, `user_id`, `group_id`, `admin_level_id`)
must be numeric.

## Key Fields

A user record carries: `id`, `name`, `email`, `accountStatus`,
`advancedMfaStatus`, `enabledMfa`, `federatedStatus`, `creationTime`,
`lastLoginTime`, `lastMasterPasswordChangeTime`, `lastInvitationTime`,
`securityChallengeScore`, `masterPasswordScore`, `adminLevelId`.

`accountStatus` values: `enrolled`, `disabled`, `staged`,
`pending-invitation`, `expired-invitation`, `awaiting-approval`.

A managed company carries `id`, `parentId`, `name`, `licenseLimit`,
`type` (`managed` or `managed-msp`), `addons` (`mfa`, `sso`) and
`status` (`active` = billed this month, `suspended` = not billed).

## Pagination

List tools return `{ items, nextPageToken }`. Pass `nextPageToken` back
as `page_token` to get the next page; when it is absent you have the
last page. The connector never pages for you.

| Tool family | `max_results` cap | Vendor default |
|-------------|-------------------|----------------|
| Users lists, `lastpass_managed_companies_list`, `lastpass_reports_admin_users_list` | 500 | 10 |
| Everything else that pages (invites, groups, members, admin levels, billing report) | 50 | 10 |

The default of 10 is small. Set `max_results` explicitly, and keep
paging until `nextPageToken` is gone before saying a user, group or
admin does not exist.

If a page is too large for the connector's output limit, the call fails
with an error naming a `max_results` that fits. Retry with that value; a
page is never silently cut short.

## Filters

- **Wildcards**: `name` and `email` filters use `%`. `%@contoso.com`
  finds a domain, `jane%` a prefix, `%smith%` a substring. Without `%`
  the match is exact.
- **Ranges**: `security_challenge_score`, `last_invitation_time`,
  `last_invitation` and `license_limit` take `[from:to]` with either
  side optional. `[:50]` means 50 or lower; `[2026-01-01:]` means on or
  after that date.
- **Sort**: `field:direction`. The documented examples are `name:asc`,
  `email:desc` and `id:asc` (`name:asc` for groups and admin levels).
  For a worst-first list, filter with the score range and order the
  results yourself.
- **Arrays** (`status`, `type`, `addon` on `lastpass_managed_companies_list`)
  take a list of enum values, e.g. `["active"]`.
- `account_status` takes one value.

## Users LastPass Leaves Out

The user list tools never return users in **Awaiting approval** status,
and they omit **Staged** and **Pending invitation** users whose email
already has a LastPass subscription. The invite tools omit Awaiting
approval and Staged users. So:

- An empty `account_status: awaiting-approval` result does not mean
  there are none.
- To find people who were invited but never enrolled, use
  `lastpass_invites_list` (or `lastpass_managed_company_invites_list`)
  as well as the users list.
- Do not present a users list as a complete headcount. Say which
  statuses can be missing.

## Error Handling

Errors come back as tool errors with the HTTP status, LastPass's title
and detail, and a request ID when LastPass sends one.

| Status | Meaning | Action |
|--------|---------|--------|
| 400 | Bad parameter or filter (often a malformed `[from:to]` range or date) | Fix the argument; field errors are listed |
| 401 | Key missing, invalid, or the account is not enrolled in the API early access | Check the key in Advanced > LastPass API; confirm early-access enrollment |
| 402 | LastPass subscription expired | Tell the user; nothing to retry |
| 403 | Key lacks permission, usually a Business key on an MSP tool | Use an own-company tool or connect an MSP key |
| 404 | Unknown company, user, group or admin level ID | Re-list to get a current ID |
| 429 | Rate limit; some limits are shared by every key in the company | Wait for the `Retry after Ns` value, then retry. Slow down sweeps |

Before the first call, Conduit refuses keys that do not start with
`lpkey_` with "This is not a LastPass API key".

## Gotchas

- **EU-hosted accounts**: the connector only calls `api.lastpass.com`.
  It is not confirmed that EU data-center accounts are served there, so
  a 401 on an EU account may be the region, not the key.
- **Scores are numbers, not grades.** `securityChallengeScore` and
  `masterPasswordScore` are 0 to 100. Report the number and say what
  threshold you used.
- **Responses are sensitive.** User lists carry names, emails, MFA
  status and security scores. Keep each client's results scoped to that
  client.

## Related Skills

- [offboarding-review](../offboarding-review/SKILL.md) - leaver access check
- [security-posture](../security-posture/SKILL.md) - MFA and security-score review
- [privileged-access](../privileged-access/SKILL.md) - admin-level review
- [msp-billing](../msp-billing/SKILL.md) - license and billing reconciliation
