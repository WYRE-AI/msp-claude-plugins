---
name: "Blumira MSP"
description: >
  Blumira's MSP path group (`/msp/*`): managed-account enumeration, cross-account
  and per-account finding queries, per-account device, agent-key and user
  management, and how MSP paths differ from org paths.
when_to_use: >-
  When operating across multiple Blumira client accounts using MSP-level credentials.
  Use when: blumira msp, multi-tenant, managed accounts, client accounts,
  cross-account, msp findings, or msp overview.
---

# Blumira MSP Operations

## Overview

Blumira's MSP path group (`/msp/*`) enables managed service providers to operate across multiple client organizations from a single set of credentials. This skill covers account management, cross-account queries, and per-account operations.

## Key Concepts

### MSP vs Org Paths

| Feature | Org Path (`/org/*`) | MSP Path (`/msp/*`) |
|---------|-------------------|---------------------|
| Scope | Single organization | Multiple managed accounts |
| Findings | Own findings only | All accounts or per-account |
| Devices | Own devices only | Per-account device lists |
| Users | Own users only | Per-account user lists |
| Auth | Org-level JWT | MSP-level JWT |

### Account Context

MSP tools require an `account_id` parameter to target a specific client account. Use `blumira_msp_accounts_list` to enumerate available accounts.

## API Patterns

### List Managed Accounts

```
blumira_msp_accounts_list
  page_size=100
```

### Get Account Details

```
blumira_msp_accounts_get
  account_id=<UUID>
```

### Cross-Account Findings

```
blumira_msp_findings_all
  status.eq=10
  severity.in=HIGH,CRITICAL
  order_by=-created
```

Returns findings from ALL managed accounts with account context included.

### Per-Account Findings

```
blumira_msp_findings_list
  account_id=<UUID>
  status.eq=10
```

### Get a Finding in Account Context

```
blumira_msp_findings_get
  account_id=<UUID>
  finding_id=<UUID>
```

### Resolve an Account's Finding

```
blumira_msp_findings_resolve
  account_id=<UUID>
  finding_id=<UUID>
  resolution_type=10
  notes="Confirmed and remediated."
```

### Assign a Finding

```
blumira_msp_findings_assign
  account_id=<UUID>
  finding_id=<UUID>
  user_id=<UUID>
```

### Account Finding Comments

```
blumira_msp_findings_comments_list
  account_id=<UUID>
  finding_id=<UUID>
```

```
blumira_msp_findings_comments_add
  account_id=<UUID>
  finding_id=<UUID>
  comment="Investigation notes..."
```

### Per-Account Devices

```
blumira_msp_devices_list
  account_id=<UUID>
  page_size=50
```

```
blumira_msp_devices_get
  account_id=<UUID>
  device_id=<UUID>
```

### Per-Account Agent Keys

```
blumira_msp_keys_list
  account_id=<UUID>
```

```
blumira_msp_keys_get
  account_id=<UUID>
  key_id=<UUID>
```

### Per-Account Users

```
blumira_msp_users_list
  account_id=<UUID>
```

## Common Workflows

### MSP Dashboard Overview

1. `blumira_msp_accounts_list` to get all managed accounts
2. `blumira_msp_findings_all` with `status.eq=10` for open findings across all accounts
3. Group findings by account to produce per-account open finding counts
4. Highlight accounts with CRITICAL/HIGH severity findings

### Per-Account Triage

1. `blumira_msp_findings_list` for the target account with `status.eq=10`
2. Sort by severity to prioritize
3. Investigate with `blumira_msp_findings_get` and comments
4. Resolve with `blumira_msp_findings_resolve`

### Cross-Account Security Posture

1. `blumira_msp_accounts_list` to enumerate accounts
2. For each account, query open findings by severity
3. Query device counts with `blumira_msp_devices_list`
4. Compile into a posture report showing coverage and risk per account

### Agent Coverage Audit

1. `blumira_msp_accounts_list` to get accounts
2. For each account, `blumira_msp_devices_list` to count devices
3. Compare against known device counts per client
4. Identify coverage gaps

## Error Handling

### 403 on MSP Endpoints

**Cause:** JWT token is org-level, not MSP-level
**Solution:** Generate an MSP-scoped JWT token from the Blumira portal.

### Account Not Found

**Cause:** Invalid account ID or account not managed by this MSP
**Solution:** Use `blumira_msp_accounts_list` to verify available accounts.

### Cross-Account Query Timeout

**Cause:** Too many accounts or too broad a filter
**Solution:** Narrow filters (date range, severity) or query accounts individually.

## Best Practices

- Cache the account list at the start of MSP operations to avoid redundant calls
- Use `blumira_msp_findings_all` for overview, then drill into specific accounts
- Maintain consistent resolution standards across all managed accounts
- Document per-account context in finding comments for compliance
- Schedule regular cross-account posture reviews
- Use severity filters on cross-account queries to focus on what matters

## Related Skills

- [API Patterns](../api-patterns/SKILL.md) — Filtering and pagination
- [Findings](../findings/SKILL.md) — Finding lifecycle (org-level)
- [Agents](../agents/SKILL.md) — Device management (org-level)
- [Resolutions](../resolutions/SKILL.md) — Resolution types
- [Users](../users/SKILL.md) — User management
