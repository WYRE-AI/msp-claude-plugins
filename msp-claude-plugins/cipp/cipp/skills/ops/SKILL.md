---
name: "cipp-ops"
description: "CIPP's own operational layer rather than the tenants it manages: GDAP role definitions and pending invites, the CIPP scheduler, and the ping/version/log endpoints used to diagnose why other CIPP tools fail silently."
when_to_use: >-
  When checking GDAP delegation status, managing scheduled CIPP tasks, verifying CIPP server
  health, or reading CIPP application logs. Use when: gdap, granular delegated admin, delegated
  admin, cipp scheduled, schedule task cipp, cipp ping, cipp version, cipp logs, or cipp health.
---

# CIPP Operations

The meta-layer — tools for managing CIPP itself rather than the tenants it manages. GDAP for the delegation chain, scheduler for recurring jobs, and health/version/log endpoints for verifying CIPP is reachable and functioning.

## Anti-triggers

- **"Who did what" inside a customer tenant** — `cipp_list_logs` here
  is CIPP's own application log, not the M365 unified audit log. The
  near-identically named `cipp_list_audit_logs` lives in `cipp-alerts`;
  loading the wrong one is the most common CIPP mis-route.
- **Entra role assignments inside a tenant** — GDAP roles are what the
  *partner* may delegate, a different object from the roles a tenant's
  own users hold; use `inforcer-identity-governance` or the `m365`
  plugin.
- **Forcing a standards evaluation now** — the CIPP scheduler runs it
  on a recurrence, but the on-demand call is
  `cipp_run_standards_check` in `cipp-standards`.

## GDAP

### `cipp_list_gdap_roles`

```
cipp_list_gdap_roles()
```

Returns the GDAP (Granular Delegated Admin Privileges) role definitions available — the AAD roles your CSP relationship can grant to your MSP technicians per-tenant.

### `cipp_list_gdap_invites`

```
cipp_list_gdap_invites()
```

Returns pending GDAP relationship invites that customers have not yet accepted. Stale invites > 14 days are usually customers who lost the email — re-send via the CIPP UI.

GDAP is the modern replacement for AOBO/DAP. Each invite grants the MSP partner tenant a specific set of AAD roles in the customer tenant for a fixed duration. CIPP relies on active GDAP relationships for nearly every multi-tenant operation; broken GDAP = silent failures across the rest of the toolkit.

## Scheduler

### `cipp_list_scheduled_items`

```
cipp_list_scheduled_items()
```

Lists CIPP's scheduled tasks: recurring standards checks, BPA refreshes, alert evaluations, custom user-defined schedules.

### `cipp_add_scheduled_item`

```
cipp_add_scheduled_item(name, command, parameters?, recurrence?, scheduledTime?)
```

Creates a new scheduled task in CIPP. Use cases:

- Schedule a daily BPA refresh for a high-risk tenant
- Schedule an end-of-quarter offboarding cleanup
- Run a recurring CSP license reconciliation

Pick `recurrence` deliberately — CIPP doesn't dedupe scheduled items, so re-running this tool with the same name creates a duplicate.

## Health & diagnostics

### `cipp_ping`

```
cipp_ping()
```

Liveness probe for the CIPP API. Returns immediately if CIPP is reachable. First call when troubleshooting "tools aren't working" — separates "MCP can't reach CIPP" from "CIPP can't reach Microsoft."

### `cipp_get_version`

```
cipp_get_version()
```

Returns the deployed CIPP version (frontend + backend). Useful when reporting an issue to CIPP maintainers or comparing against the [release notes](https://github.com/KelvinTegelaar/CIPP/releases) for known regressions.

### `cipp_list_logs`

```
cipp_list_logs(severity?, count?)
```

Application logs from the CIPP backend. Use for diagnosing failed background jobs, GDAP errors, or rate-limit hits against the Graph API.

## Workflow patterns

### Pre-flight check (before bulk operations)

```
ping = cipp_ping()
version = cipp_get_version()
gdap_invites = cipp_list_gdap_invites()
```

If any are unhealthy, halt the bulk operation. Bulk standards deployments or user creation against a CIPP with stale GDAP will silently fail or partially apply.

### GDAP hygiene

Run weekly:

1. `cipp_list_gdap_invites` — chase pending > 14 days
2. Compare `cipp_list_tenants` against expected onboarded list — gaps usually mean revoked GDAP
3. `cipp_list_gdap_roles` — verify the MSP role template hasn't been altered (drift here breaks fine-grained access)

### Diagnosing a failing tool call

When any other CIPP tool returns an error:

1. `cipp_ping` — is CIPP reachable at all?
2. `cipp_get_version` — is it the version you think it is?
3. `cipp_list_logs(severity='error', count=50)` — what does CIPP itself report?
4. Check `cipp_list_gdap_invites` and the affected tenant in `cipp_list_tenants` — broken GDAP is the #1 cause of partial failures.

## Caveats

- `cipp_add_scheduled_item` doesn't validate the `command` parameter against CIPP's known job types — typos create scheduled items that fail silently. Verify with `cipp_list_scheduled_items` after creation.
- `cipp_list_logs` is bounded by what CIPP itself retains — for long-term log retention, ship CIPP logs to an external SIEM via the CIPP integrations panel.
