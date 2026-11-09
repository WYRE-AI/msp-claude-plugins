# LastPass Plugin

Claude Code plugin for [LastPass](https://www.lastpass.com) Business and
MSP admin, connected through Conduit.

## What It Does

- **Offboarding review** - Find what LastPass access a leaver still
  holds: account status, admin level, groups, outstanding invites
- **Security posture** - MFA coverage, Security Challenge and master
  password scores, dormant accounts, and staff who never enrolled
- **Privileged access review** - Every admin level and who holds it, per
  client or across the whole client book in one report
- **MSP billing reconciliation** - Billing cycles, daily average license
  counts, license limits and add-ons per managed company

**Read-only.** All 23 tools are GET requests. Nothing in this plugin can
create, disable or delete users, send or revoke invites, change admin
levels, or edit managed companies; those actions stay in the LastPass
Admin Console. The LastPass API never returns vault contents or
passwords. Shared folders, policies and event reports are not in the
LastPass REST API, so this plugin cannot see them.

## Installation

```
/plugin marketplace add WYRE-AI/msp-claude-plugins
/plugin install lastpass
```

This plugin ships no `.mcp.json`. Install the `wyre-gateway` plugin (or
any workflow pack), which connects Claude Code to
[Conduit](https://conduit.wyre.ai) at `https://conduit.wyre.ai/v1/mcp`,
then connect LastPass in the Conduit web UI (`/connect/lastpass`) as
described below. Conduit stores the key and injects it on every request,
so there are no environment variables or headers to set on the client.

## Connecting LastPass in Conduit

You need a LastPass API key (it starts with `lpkey_`).

1. In the LastPass Admin Console, go to **Advanced > LastPass API** and
   create a key. A Business key reads its own company; an MSP key can
   also read your managed companies.
2. The key has no read-only scope, so create one just for Conduit and
   revoke it there if it is ever exposed.
3. In Conduit, open the **LastPass (Business + MSP admin)** connector and
   paste the bare key into **LastPass API key**. Do not add an `Api-Key`
   prefix. Conduit checks the key against LastPass before saving it.

The LastPass API is in early access: LastPass has to enable it for your
account before a key works. A 401 on a new account usually means the
account is not enrolled yet. If the LastPass connector is not in your
Conduit catalog yet, it is still rolling out.

## Conduit connection field

| Field | Required | Description |
|-------|----------|-------------|
| LastPass API key | Yes | LastPass API key, `lpkey_...` |

Conduit passes the key to the MCP server as the `X-LastPass-API-Key`
header. Nothing is configured on the client: Conduit drops any
`X-LastPass-API-Key` header a client sends.

## Business Key vs MSP Key

| Key | Tools that work |
|-----|-----------------|
| Business | The 9 own-company tools (users, invites, groups, admin levels) |
| MSP | All 23: the own-company tools for the MSP's own company, plus the 14 managed-company and report tools |

A Business key gets HTTP 403 from the `lastpass_managed_company_*` and
`lastpass_reports_*` tools.

## Skills

| Skill | Purpose |
|-------|---------|
| `api-patterns` | Auth, key types, pagination, filters, omitted users, errors |
| `offboarding-review` | Leaver access check and Admin Console checklist |
| `security-posture` | MFA, score, dormancy and adoption review |
| `privileged-access` | Admin-level review, single client or whole book |
| `msp-billing` | License consumption and billing reconciliation (MSP key) |

## Agents

| Agent | Purpose |
|-------|---------|
| `posture-sweep` | Ranked LastPass posture review across every managed client |

## Tools

All 23 tools are tier **read** in Conduit. None is admin-gated.

### Own company (Business or MSP key)
- `lastpass_users_list`, `lastpass_user_get`
- `lastpass_invites_list`
- `lastpass_user_groups_list`, `lastpass_user_group_get`, `lastpass_user_group_users_list`
- `lastpass_admin_levels_list`, `lastpass_admin_level_get`, `lastpass_admin_level_users_list`

### Managed companies (MSP key)
- `lastpass_managed_companies_list`, `lastpass_managed_company_get`
- `lastpass_managed_company_users_list`, `lastpass_managed_company_user_get`
- `lastpass_managed_company_invites_list`
- `lastpass_managed_company_user_groups_list`, `lastpass_managed_company_user_group_get`, `lastpass_managed_company_user_group_users_list`
- `lastpass_managed_company_admin_levels_list`, `lastpass_managed_company_admin_level_get`, `lastpass_managed_company_admin_level_users_list`

### MSP reports (MSP key)
- `lastpass_reports_admin_users_list`
- `lastpass_reports_billing_cycles_list`, `lastpass_reports_billing_list`

## Data Sensitivity

Tool output includes names, email addresses, MFA status, last login and
security scores. Treat it as sensitive and keep each client's results to
that client.

## Links

- [LastPass API docs](https://developer.lastpass.com/business/docs)
- [Create an API key](https://admin.lastpass.com/advanced/enterpriseApi/lastpass-api)

## License

Apache-2.0
