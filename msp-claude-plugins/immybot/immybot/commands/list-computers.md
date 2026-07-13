---
description: List and filter ImmyBot-managed computers, optionally scoped to a tenant
argument-hint: "[scope]"
arguments: [scope]
---

# ImmyBot List Computers

List ImmyBot-managed Windows endpoints, scoped to "$ARGUMENTS.scope"
when a tenant is given.

## Arguments

- `scope` (optional) — Tenant name to scope to (optional; omit for the whole fleet)

## Prerequisites

- ImmyBot MCP server connected
- Tools: `immybot_tenants_search`, `immybot_computers_list`,
  `immybot_computers_get`

## Instructions

1. If a scope is given, `immybot_tenants_search` to resolve the
   tenant ID.
2. Call `immybot_computers_list` — filtered by tenant ID when scoped,
   otherwise fleet-wide.
3. Present a table:
   - Computer name / hostname
   - Tenant
   - OS
   - Online status
   - Last seen
4. Summarize: total computers, count online vs offline.

## Example Output

| Computer | Tenant | OS | Status | Last Seen |
|----------|--------|-----|--------|-----------|
| WS-ACCT-04 | Acme Corp | Windows 11 Pro | Online | 3 min ago |
| SRV-DC01 | Acme Corp | Windows Server 2022 | Offline | 2 days ago |

If no computers match, confirm the tenant name and ImmyBot agent
enrollment.

## Example

```
/list-computers "Acme Corp"
```

## Related Commands

- `/deploy-software` — deploy to these computers
- `/run-script` — run a remediation script on a computer
