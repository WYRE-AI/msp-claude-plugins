---
description: Search RocketCyber security incidents by account, status, severity, verdict, and date range
argument-hint: "[account] [status] [severity] [verdict] [limit]"
arguments: [account, status, severity, verdict, limit]
---

# Search RocketCyber Incidents

Search security incidents across RocketCyber with filtering by account, status, severity, verdict, and date range.

## Prerequisites

- Valid RocketCyber API key configured (`ROCKETCYBER_API_KEY`)
- User must have read permissions on the provider account

## Steps

1. **Resolve account (if provided)**
   - If account is a number, use as `accountId` directly
   - If account is text, search accounts by name:
   ```bash
   curl -s "https://api-${ROCKETCYBER_REGION:-us}.rocketcyber.com/v3/accounts" \
     -H "Authorization: Bearer ${ROCKETCYBER_API_KEY}" \
     | jq '.data[] | select(.name | test("ACCOUNT_NAME"; "i"))'
   ```
   - If multiple matches, list them and ask the user to specify

2. **Query incidents with filters**
   ```bash
   curl -s "https://api-${ROCKETCYBER_REGION:-us}.rocketcyber.com/v3/incidents?accountId={id}&status={status}&severity={severity}&limit={limit}" \
     -H "Authorization: Bearer ${ROCKETCYBER_API_KEY}"
   ```

   > **Note:** Query parameter names and values should be verified against the API docs. The exact filter syntax (e.g., `status=open` vs `status=New`) may differ.

3. **Apply verdict filter client-side (if needed)**
   - If the API does not support verdict filtering natively, filter results after retrieval
   ```bash
   | jq '[.data[] | select(.verdict == "Malicious")]'
   ```

4. **Format results as a table**
   - Display: ID, Title, Severity, Verdict, Status, Account, Created Date
   - Sort by severity (Critical first) then by creation date (newest first)

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| account | string/int | No | all accounts | Account name or ID to scope results |
| status | string | No | open | Status filter: open, resolved, false-positive, all |
| severity | string | No | all | Severity filter: critical, high, medium, low, all |
| verdict | string | No | all | Verdict filter: malicious, suspicious, benign, all |
| limit | integer | No | 25 | Maximum results to return |

## Examples

### All Open Incidents

```
/search-incidents
```

### Incidents for a Specific Account

```
/search-incidents account="Acme Corporation"
```

### Critical Incidents Only

```
/search-incidents severity=critical
```

### Malicious Verdicts Only

```
/search-incidents verdict=malicious
```

### Resolved Incidents for an Account

```
/search-incidents account=12345 status=resolved limit=50
```

### All Filters Combined

```
/search-incidents account="Acme" status=open severity=high verdict=suspicious limit=10
```

## Output

### Results Found

```
RocketCyber Incident Search
============================
Filters: status=open, severity=all, verdict=all
Account: All accounts
Results: 12 incidents found

| ID    | Title                                    | Severity | Verdict    | Status      | Account           | Created            |
|-------|------------------------------------------|----------|------------|-------------|-------------------|--------------------|
| 98765 | Suspicious PowerShell execution          | Critical | Malicious  | In Progress | Acme Corporation  | 2026-02-22 14:30   |
| 98760 | Unauthorized remote access tool detected | High     | Suspicious | New         | Beta LLC          | 2026-02-22 10:15   |
| 98755 | Multiple failed login attempts           | High     | Suspicious | New         | Acme Corporation  | 2026-02-21 22:00   |
| 98750 | Unusual outbound connection              | Medium   | Suspicious | In Progress | Gamma Inc         | 2026-02-21 16:45   |
| 98745 | New scheduled task created               | Medium   | Benign     | New         | Beta LLC          | 2026-02-21 09:30   |
| 98740 | Browser extension installed              | Low      | Benign     | New         | Delta Corp        | 2026-02-20 14:00   |
| ...   |                                          |          |            |             |                   |                    |

Summary: 1 Critical, 2 High, 2 Medium, 7 Low
Verdicts: 1 Malicious, 3 Suspicious, 4 Benign, 4 Pending
```

### No Results

```
RocketCyber Incident Search
============================
Filters: status=open, severity=critical, verdict=all
Account: Acme Corporation (ID: 12345)

No incidents found matching the specified filters.
```

### Account Not Found

```
Account not found: "Acm"

Did you mean one of these?
- Acme Corporation (ID: 12345)
- Acme Industries (ID: 12350)

Rerun with the correct account name or ID.
```

## Error Handling

### Authentication Failed

```
Authentication failed (401 Unauthorized)

Please verify your RocketCyber credentials:
- ROCKETCYBER_API_KEY: Your API key from Provider Settings > API tab
- Ensure the key has not been revoked or regenerated
```

### Rate Limited

```
Rate limited during incident search. Please wait 30 seconds and try again.
```

## Related Commands

- `/account-summary` - Security posture summary for a specific account
