---
description: View or toggle email security policies in Checkpoint Harmony Email
argument-hint: "<action> [policy-id] [type] [reason]"
arguments: [action, policy-id, type, reason]
---

# Manage Email Security Policies

View and manage email security policies in Checkpoint Harmony Email & Collaboration (Avanan). List all policies, view details, or enable/disable specific policies.

## Prerequisites

- Valid Checkpoint Harmony API credentials configured (CHECKPOINT_CLIENT_ID, CHECKPOINT_CLIENT_SECRET)
- API key must have policy read permissions (read for list/show, write for enable/disable)

## Steps

### List Policies

1. **Fetch policy list**
   ```http
   GET /app/hec-api/v1.0/policies?type=...
   Authorization: Bearer <token>
   ```

2. **Format and display** policy summary table

### Show Policy Details

1. **Fetch policy configuration**
   ```http
   GET /app/hec-api/v1.0/policies/<policy-id>
   Authorization: Bearer <token>
   ```

2. **Display** full configuration including scope, action, and exceptions

### Enable/Disable Policy

1. **Validate policy exists** and check current state
2. **Confirm action** with safety warning for disable
3. **Execute state change**
   ```http
   POST /app/hec-api/v1.0/policies/<policy-id>/enable
   Authorization: Bearer <token>
   ```
   or
   ```http
   POST /app/hec-api/v1.0/policies/<policy-id>/disable
   Authorization: Bearer <token>
   Content-Type: application/json

   { "reason": "..." }
   ```

4. **Report result**

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| action | string | Yes | - | list/show/enable/disable |
| policy-id | string | Conditional | - | Required for show/enable/disable |
| type | string | No | - | Policy type filter (for list action) |
| reason | string | Conditional | - | Required when disabling a policy |

## Examples

### List All Policies

```
/manage-policy list
```

### List Anti-Phishing Policies

```
/manage-policy list --type anti-phishing
```

### Show Policy Details

```
/manage-policy show --policy-id pol-abc123
```

### Enable a Policy

```
/manage-policy enable --policy-id pol-abc123
```

### Disable a Policy

```
/manage-policy disable --policy-id pol-abc123 --reason "Generating false positives on partner domain"
```

## Output

### Policy List

```
/manage-policy list
```

```
Email Security Policies (8 total)

+--------------+---------------------------+-----------------+---------+----------+------------+
| Policy ID    | Name                      | Type            | Action  | Enabled  | Priority   |
+--------------+---------------------------+-----------------+---------+----------+------------+
| pol-001      | Inbound Anti-Phishing     | Anti-Phishing   | Quarant.| Yes      | 1          |
| pol-002      | Inbound Anti-Malware      | Anti-Malware    | Quarant.| Yes      | 2          |
| pol-003      | Executive BEC Protection  | Anti-BEC        | Quarant.| Yes      | 3          |
| pol-004      | URL Click Protection      | URL Rewrite     | Rewrite | Yes      | 4          |
| pol-005      | Anti-Spam Filtering       | Anti-Spam       | Junk    | Yes      | 5          |
| pol-006      | Outbound DLP - PII        | DLP             | Block   | Yes      | 6          |
| pol-007      | Outbound DLP - Financial  | DLP             | Notify  | Yes      | 7          |
| pol-008      | Account Takeover Detect   | ATO Protection  | Alert   | No       | 8          |
+--------------+---------------------------+-----------------+---------+----------+------------+

Summary:
- Enabled: 7 | Disabled: 1
- Types: Anti-Phishing (1), Anti-Malware (1), Anti-BEC (1),
         URL Rewrite (1), Anti-Spam (1), DLP (2), ATO (1)

Quick Actions:
- View details: /manage-policy show --policy-id <id>
- Enable policy: /manage-policy enable --policy-id <id>
```

### Policy Details

```
/manage-policy show --policy-id pol-003
```

```
========================================================
POLICY: pol-003 - Executive BEC Protection
========================================================

CONFIGURATION
  Type:         Anti-BEC
  Action:       Quarantine
  Enabled:      Yes
  Priority:     3
  Direction:    Inbound
  Created:      2024-01-15 10:00:00 UTC
  Modified:     2024-02-10 14:30:00 UTC
  Modified By:  admin@company.com

SCOPE
  Level:        Group
  Targets:      executives@company.com (12 members)
                - CEO, CFO, CTO, VP-level and above

DETECTION SETTINGS
  Display Name Match:     Enabled (threshold: 85%)
  Domain Typosquatting:   Enabled
  Reply-To Mismatch:      Enabled
  Financial Language:     Enabled
  Urgency Detection:      Enabled
  New Sender Detection:   Enabled (first-time senders flagged)

EXCEPTIONS (Allow List)
  - board@partner-firm.com (Board meeting notifications)
  - noreply@bank.com (Legitimate banking alerts)

STATISTICS (Last 30 Days)
  Triggered:      23 times
  True Positives: 19 (83%)
  False Positives: 4 (17%)
  Released:        4

Quick Actions:
- Disable: /manage-policy disable --policy-id pol-003 --reason "..."
- Search related quarantine: /search-quarantine --reason bec
========================================================
```

### Enable Confirmation

```
/manage-policy enable --policy-id pol-008
```

```
Policy enabled successfully

Policy ID:    pol-008
Name:         Account Takeover Detection
Type:         ATO Protection
Action:       Alert
Status:       ENABLED

Note: This policy is now active. Monitor for the next 24-48 hours
to assess impact. Use /search-threats --type ato to review detections.
```

### Disable with Warning

```
/manage-policy disable --policy-id pol-001 --reason "Testing"
```

```
WARNING: Disabling a critical security policy

Policy:   pol-001 - Inbound Anti-Phishing
Type:     Anti-Phishing
Scope:    Global (all users)
Action:   Quarantine

This policy protects ALL users from phishing attacks.
Disabling it will allow phishing emails to reach inboxes.

Last 30 days: Blocked 156 phishing attempts

Proceeding with disable...

Policy disabled successfully

Policy ID:    pol-001
Name:         Inbound Anti-Phishing
Status:       DISABLED
Reason:       Testing
Disabled By:  Current API user
Disabled At:  2024-02-15 15:00:00 UTC

IMPORTANT: Remember to re-enable this policy after testing.
Use: /manage-policy enable --policy-id pol-001
```

## Filter Reference

### Policy Types

| Text | API Code |
|------|----------|
| anti-phishing | ANTI_PHISHING |
| anti-malware | ANTI_MALWARE |
| anti-bec | ANTI_BEC |
| anti-spam | ANTI_SPAM |
| dlp | DLP |
| url-rewrite | URL_REWRITE |
| ato | ATO_PROTECTION |
| custom | CUSTOM |

## Error Handling

### Policy Not Found

```
Error: Policy not found: pol-invalid123

Use /manage-policy list to see all available policies.
```

### Already Enabled/Disabled

```
Policy pol-001 is already enabled. No changes made.
```

### Missing Reason for Disable

```
Error: A reason is required when disabling a policy

Provide a reason with --reason "your explanation here"

This is required for audit trail and change management purposes.
```

### Permission Denied

```
Error: Insufficient permissions to modify policies

Your API key has read-only access to policies.
Contact your Checkpoint administrator to update API key scopes.
```

### Rate Limiting

```
Rate limited by Checkpoint API

Retrying in 30 seconds...
```

## Related Commands

- `/search-quarantine` - See emails caught by policies
- `/search-threats` - See threats detected by policies
- `/check-threat` - Analyze specific threat details
