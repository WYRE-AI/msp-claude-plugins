---
description: Get a security posture summary for a RocketCyber customer account
argument-hint: "<account>"
arguments: [account]
---

# RocketCyber Account Summary

Generate a comprehensive security posture summary for a specific customer account, including active incidents, agent health, and recent threat activity.

## Prerequisites

- Valid RocketCyber API key configured (`ROCKETCYBER_API_KEY`)
- User must have read permissions on the provider account
- Account must exist in RocketCyber

## Steps

1. **Resolve account by name or ID**
   - If numeric, use as `accountId` directly
   ```bash
   curl -s "https://api-${ROCKETCYBER_REGION:-us}.rocketcyber.com/v3/accounts/{id}" \
     -H "Authorization: Bearer ${ROCKETCYBER_API_KEY}"
   ```
   - If text, search accounts by name
   ```bash
   curl -s "https://api-${ROCKETCYBER_REGION:-us}.rocketcyber.com/v3/accounts" \
     -H "Authorization: Bearer ${ROCKETCYBER_API_KEY}" \
     | jq '.data[] | select(.name | test("ACCOUNT_NAME"; "i"))'
   ```
   - If multiple matches, list them and ask the user to specify

2. **Get agent status for the account**
   ```bash
   curl -s "https://api-${ROCKETCYBER_REGION:-us}.rocketcyber.com/v3/agents?accountId={id}" \
     -H "Authorization: Bearer ${ROCKETCYBER_API_KEY}"
   ```
   - Count total agents, online agents, offline agents

3. **Get active incidents for the account**
   ```bash
   curl -s "https://api-${ROCKETCYBER_REGION:-us}.rocketcyber.com/v3/incidents?accountId={id}&status=open" \
     -H "Authorization: Bearer ${ROCKETCYBER_API_KEY}"
   ```
   - Count by severity: Critical, High, Medium, Low
   - Count by verdict: Malicious, Suspicious, Benign, Pending

4. **Get recent incidents (last 30 days) for trend context**
   ```bash
   curl -s "https://api-${ROCKETCYBER_REGION:-us}.rocketcyber.com/v3/incidents?accountId={id}&limit=100" \
     -H "Authorization: Bearer ${ROCKETCYBER_API_KEY}"
   ```
   - Filter for incidents in the last 30 days
   - Count resolved vs still open

5. **Get application inventory (optional, for completeness)**
   ```bash
   curl -s "https://api-${ROCKETCYBER_REGION:-us}.rocketcyber.com/v3/apps?accountId={id}" \
     -H "Authorization: Bearer ${ROCKETCYBER_API_KEY}"
   ```
   - Count total detected applications
   - Flag remote access tools

6. **Format results as a comprehensive summary**

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| account | string/int | Yes | - | Account name or ID to summarize |

## Examples

### By Account Name

```
/account-summary account="Acme Corporation"
```

### By Account ID

```
/account-summary account=12345
```

### Partial Name Match

```
/account-summary account="Acme"
```

## Output

### Full Summary

```
================================================================================
RocketCyber Security Summary: Acme Corporation
================================================================================

ACCOUNT INFORMATION
--------------------------------------------------------------------------------
Account ID:     12345
Account Name:   Acme Corporation
Status:         Active

AGENT STATUS
--------------------------------------------------------------------------------
Total Agents:   47
Online:         45
Offline:        2   ** WARNING: 2 agents offline **

Offline Agents:
  - WORKSTATION-15  (last seen: 2026-02-20 08:30)
  - SERVER-BACKUP   (last seen: 2026-02-19 14:00)

ACTIVE INCIDENTS
--------------------------------------------------------------------------------
Total Open:     5

By Severity:
  Critical:     0
  High:         1
  Medium:       2
  Low:          2

By Verdict:
  Malicious:    0
  Suspicious:   2
  Benign:       1
  Pending:      2

Top Active Incidents:
| ID    | Title                                    | Severity | Verdict    | Created            |
|-------|------------------------------------------|----------|------------|--------------------|
| 98760 | Unauthorized remote access tool detected | High     | Suspicious | 2026-02-22 10:15   |
| 98750 | Unusual outbound connection              | Medium   | Suspicious | 2026-02-21 16:45   |
| 98745 | New scheduled task created               | Medium   | Pending    | 2026-02-21 09:30   |
| 98740 | Browser extension installed              | Low      | Benign     | 2026-02-20 14:00   |
| 98735 | USB device connected                     | Low      | Pending    | 2026-02-20 11:00   |

LAST 30 DAYS
--------------------------------------------------------------------------------
Total Incidents:    18
Resolved:           13
False Positives:    4
Still Open:         5
Malicious Verdicts: 1

APPLICATIONS (Top Categories)
--------------------------------------------------------------------------------
Total Detected:     152
Remote Access:      3  (TeamViewer, AnyDesk, Splashtop)
Security Tools:     47 (Windows Defender, RocketAgent)

================================================================================

Security Posture: MODERATE
  - 2 offline agents need attention
  - 1 High severity incident requires review
  - 1 confirmed malicious incident resolved in last 30 days

Recommended Actions:
1. Investigate the 2 offline agents (WORKSTATION-15, SERVER-BACKUP)
2. Review High severity incident #98760 (unauthorized remote access tool)
3. Verify the 3 remote access tools are authorized
```

### Clean Summary (No Issues)

```
================================================================================
RocketCyber Security Summary: Beta LLC
================================================================================

ACCOUNT INFORMATION
--------------------------------------------------------------------------------
Account ID:     12346
Account Name:   Beta LLC
Status:         Active

AGENT STATUS
--------------------------------------------------------------------------------
Total Agents:   15
Online:         15
Offline:        0

ACTIVE INCIDENTS
--------------------------------------------------------------------------------
Total Open:     0

LAST 30 DAYS
--------------------------------------------------------------------------------
Total Incidents:    3
Resolved:           3
False Positives:    2
Malicious Verdicts: 0

APPLICATIONS
--------------------------------------------------------------------------------
Total Detected:     85
Remote Access:      1  (ConnectWise Control - authorized)
Security Tools:     15 (Windows Defender on all endpoints)

================================================================================

Security Posture: HEALTHY
  - All agents online
  - No active incidents
  - Full security coverage
```

## Error Handling

### Account Not Found

```
Account not found: "Acm"

Did you mean one of these?
- Acme Corporation (ID: 12345)
- Acme Industries (ID: 12350)

Rerun with the correct account name or ID.
```

### Authentication Error

```
Authentication failed (401 Unauthorized)

Please verify your RocketCyber credentials:
- ROCKETCYBER_API_KEY: Your API key from Provider Settings > API tab
- Ensure the key has not been revoked or regenerated
```

### Rate Limited

```
Rate limited during account summary generation.

Partial results retrieved:
- Account details: OK
- Agent status: OK
- Incidents: Rate limited
- Applications: Rate limited

Retry in 30 seconds for full results.
```

### No Agents Deployed

```
================================================================================
RocketCyber Security Summary: New Client Inc
================================================================================

ACCOUNT INFORMATION
--------------------------------------------------------------------------------
Account ID:     12350
Account Name:   New Client Inc
Status:         Active

No agents deployed to this account.

This account appears to be newly created. Next steps:
1. Download the RocketAgent installer from the RocketCyber console
2. Deploy agents to all customer endpoints
3. Verify agents check in with Online status
4. Run /account-summary again to confirm coverage
```

## Related Commands

- `/search-incidents` - Search and filter incidents across accounts
