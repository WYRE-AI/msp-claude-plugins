---
description: Generate an ImmyBot software-compliance scorecard for a tenant or the whole fleet
argument-hint: "[scope]"
arguments: [scope]
---

# ImmyBot Compliance Report

Produce an ImmyBot software-compliance report for "$ARGUMENTS.scope"
when a tenant is given, or a fleet-wide scorecard otherwise.

## Arguments

- `scope` (optional) — Tenant name to report on (optional; omit for a fleet-wide scorecard)

## Prerequisites

- ImmyBot MCP server connected
- Tools: `immybot_tenants_list`, `immybot_tenants_search`,
  `immybot_tenants_stats`, `immybot_tenants_compliance`,
  `immybot_tenants_deployments`, `immybot_deployments_compliance`,
  `immybot_tasks_failed`

## Instructions

### Fleet-wide (no scope)

1. `immybot_tenants_list` for the portfolio.
2. For each tenant: `immybot_tenants_stats` and
   `immybot_tenants_compliance`.
3. Build a scorecard sorted lowest compliance first.
4. `immybot_tasks_failed` to attribute failed tasks per tenant.

### Single tenant (scope given)

1. `immybot_tenants_search` to resolve the tenant.
2. `immybot_tenants_compliance` for the rollup.
3. `immybot_tenants_deployments` + `immybot_deployments_compliance`
   to detail failing deployments and affected computers.

## Example Output

**Portfolio:** 14 tenants · 1,210 computers · 3 below 90% compliance

| Tenant | Computers | Compliance | Failing Deployments | Failed Tasks |
|--------|-----------|------------|---------------------|--------------|
| Contoso | 88 | 74% | 3 | 11 |
| Acme Corp | 142 | 96% | 1 | 2 |

For each below-threshold tenant, list the failing deployments and the
recommended next step (maintenance session, deployment fix).

## Example

```
/compliance-report "Contoso"
```

## Related Commands

- `/maintenance-status` — monitor remediation sessions
- `/deploy-software` — fix a failing deployment
