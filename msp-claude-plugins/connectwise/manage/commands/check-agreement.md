---
description: View agreement status and entitlements for a company in ConnectWise PSA
argument-hint: "[company_id] [agreement_id] [include_additions] [active_only]"
arguments: [company_id, agreement_id, include_additions, active_only]
---

# Check ConnectWise PSA Agreement

View agreement status, covered products, and remaining hours/incidents for a company.

## Prerequisites

- Valid ConnectWise PSA API credentials configured
- User must have agreement read permissions
- Either company_id or agreement_id is required

## Steps

1. **Validate input**
   - Require either company_id or agreement_id
   - Validate IDs are numeric

2. **Retrieve agreements**

   If agreement_id provided:
   ```http
   GET /finance/agreements/{id}
   ```

   If company_id provided:
   ```http
   GET /finance/agreements?conditions=company/id={company_id}
   ```

   Add active filter if active_only=true:
   ```
   conditions=...and cancelledFlag=false and (endDate>=2026-02-04 or endDate is null)
   ```

3. **Retrieve agreement additions (if include_additions=true)**
   ```http
   GET /finance/agreements/{id}/additions
   ```

4. **Retrieve covered work types**
   ```http
   GET /finance/agreements/{id}/workTypes
   ```

5. **Retrieve covered work roles**
   ```http
   GET /finance/agreements/{id}/workRoles
   ```

6. **Format and return agreement details**

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| company_id | integer | No* | - | Company ID to check |
| agreement_id | integer | No* | - | Specific agreement ID |
| include_additions | boolean | No | true | Include additions |
| active_only | boolean | No | true | Only show active |

*Either company_id or agreement_id is required

## Examples

### Check Company Agreements

```
/check-agreement --company_id 12345
```

### Check Specific Agreement

```
/check-agreement --agreement_id 9876
```

### Include All Agreements (Including Expired)

```
/check-agreement --company_id 12345 --active_only false
```

### Minimal View (No Additions)

```
/check-agreement --agreement_id 9876 --include_additions false
```

## Output

### Company Agreements Summary

```
================================================================================
Agreements for Acme Corporation
================================================================================

Found 2 active agreements

--------------------------------------------------------------------------------
1. Managed Services Agreement (ID: 9876)
--------------------------------------------------------------------------------
Type:           Managed Services
Status:         Active
Start Date:     2025-01-01
End Date:       2025-12-31

Billing:
  Cycle:        Monthly
  Amount:       $2,500.00/month
  Next Invoice: 2026-03-01

Prepaid Hours:
  Purchased:    40.0 hours
  Used:         24.5 hours
  Remaining:    15.5 hours

Coverage:
  Work Types:   Remote Support, On-site Support
  Work Roles:   All Roles

Additions (3):
  - Azure Management (+$500/month)
  - 24/7 Monitoring (+$300/month)
  - Additional Block Hours - 10 hrs (+$1,250, one-time)

--------------------------------------------------------------------------------
2. Break/Fix Agreement (ID: 9877)
--------------------------------------------------------------------------------
Type:           Time & Materials
Status:         Active
Start Date:     2024-01-01
End Date:       None (Perpetual)

Billing:
  Rate:         $175.00/hour
  Minimum:      0.25 hours

Coverage:
  Work Types:   All Types
  Work Roles:   All Roles

Note: Used for non-covered work.

================================================================================
```

### Detailed Single Agreement

```
================================================================================
Agreement: Managed Services Agreement
================================================================================

Basic Information:
  ID:             9876
  Name:           Managed Services Agreement
  Type:           Managed Services
  Parent:         None

Company:
  Name:           Acme Corporation
  ID:             12345

Status:
  Active:         Yes
  Start Date:     2025-01-01
  End Date:       2025-12-31
  Auto Renew:     Yes
  Days Until Exp: 300 days

================================================================================
Financial Summary
================================================================================

Billing Information:
  Cycle:          Monthly
  Amount:         $2,500.00
  Terms:          Net 30
  Next Invoice:   2026-03-01

Annual Value:     $30,000.00

================================================================================
Prepaid Hours/Block Time
================================================================================

Block Hours Summary:
  Total Purchased:   50.0 hours
  Total Used:        34.5 hours
  Remaining:         15.5 hours

Block Hours Breakdown:
  +40.0 hrs - Initial Agreement Block (Jan 2025)
  +10.0 hrs - Additional Block Purchase (Jan 2026)
  -34.5 hrs - Used to date

Utilization:        69% used

Warning: 15.5 hours remaining. Consider upselling additional block.

================================================================================
Covered Work Types
================================================================================

| Work Type        | Hourly Rate | Effective Rate | Limit      |
|------------------|-------------|----------------|------------|
| Remote Support   | $150.00     | Covered        | Unlimited  |
| On-site Support  | $175.00     | Covered        | Unlimited  |
| Phone Support    | $125.00     | Covered        | Unlimited  |
| Project Work     | $175.00     | Not Covered    | N/A        |

================================================================================
Covered Work Roles
================================================================================

| Work Role         | Covered | Notes                    |
|-------------------|---------|--------------------------|
| Technician        | Yes     | Standard coverage        |
| Engineer          | Yes     | Standard coverage        |
| Senior Engineer   | Yes     | Standard coverage        |
| Consultant        | No      | Bill at T&M rates        |

================================================================================
Agreement Additions
================================================================================

1. Azure Management
   Type:       Recurring
   Amount:     $500.00/month
   Start:      2025-01-01
   Status:     Active

2. 24/7 Monitoring
   Type:       Recurring
   Amount:     $300.00/month
   Start:      2025-01-01
   Status:     Active

3. Additional Block Hours
   Type:       One-Time
   Amount:     $1,250.00
   Quantity:   10 hours
   Added:      2026-01-15
   Status:     Active

Total Additions: $800.00/month recurring + $1,250.00 one-time

================================================================================
Recent Usage (Last 30 Days)
================================================================================

| Date       | Ticket   | Hours | Work Type       | Technician |
|------------|----------|-------|-----------------|------------|
| 2026-02-04 | #54321   | 1.5   | Remote Support  | J. Smith   |
| 2026-02-03 | #54320   | 2.0   | Remote Support  | J. Smith   |
| 2026-02-01 | #54310   | 0.5   | Phone Support   | M. Johnson |
| 2026-01-30 | #54305   | 3.0   | On-site Support | J. Smith   |

Last 30 Days Total: 7.0 hours

================================================================================
```

## API Authentication

```bash
# Base64 encode credentials: company+publicKey:privateKey
AUTH=$(echo -n "${CW_COMPANY}+${CW_PUBLIC_KEY}:${CW_PRIVATE_KEY}" | base64)

# Get agreements for company
curl -s -X GET \
  "https://${CW_HOST}/v4_6_release/apis/3.0/finance/agreements?conditions=company/id=12345%20and%20cancelledFlag=false" \
  -H "Authorization: Basic ${AUTH}" \
  -H "clientId: ${CW_CLIENT_ID}" \
  -H "Content-Type: application/json"

# Get specific agreement
curl -s -X GET \
  "https://${CW_HOST}/v4_6_release/apis/3.0/finance/agreements/9876" \
  -H "Authorization: Basic ${AUTH}" \
  -H "clientId: ${CW_CLIENT_ID}" \
  -H "Content-Type: application/json"

# Get agreement additions
curl -s -X GET \
  "https://${CW_HOST}/v4_6_release/apis/3.0/finance/agreements/9876/additions" \
  -H "Authorization: Basic ${AUTH}" \
  -H "clientId: ${CW_CLIENT_ID}" \
  -H "Content-Type: application/json"

# Get agreement work types
curl -s -X GET \
  "https://${CW_HOST}/v4_6_release/apis/3.0/finance/agreements/9876/workTypes" \
  -H "Authorization: Basic ${AUTH}" \
  -H "clientId: ${CW_CLIENT_ID}" \
  -H "Content-Type: application/json"
```

## Error Handling

### Missing Required Parameter

```
Error: Either company_id or agreement_id is required

Examples:
  /check-agreement --company_id 12345
  /check-agreement --agreement_id 9876
```

### Company Not Found

```
Error: Company ID 99999 not found

The company may have been deleted or you may not have permission to access it.
Use /search-company to find the correct company ID.
```

### Agreement Not Found

```
Error: Agreement ID 99999 not found

The agreement may have been deleted or you may not have permission to access it.
```

### No Agreements Found

```
No active agreements found for Acme Corporation (ID: 12345)

Options:
- Include expired agreements: /check-agreement --company_id 12345 --active_only false
- Create new agreement in ConnectWise PSA
- Check if company ID is correct
```

### Permission Denied

```
Error: Permission denied

You do not have permission to view agreements.
Contact your ConnectWise administrator.
```

### Expired Agreement Warning

```
Warning: Agreement is expired

Agreement: Managed Services Agreement (ID: 9876)
End Date:  2026-01-31 (4 days ago)

This agreement is no longer active. Time logged may not be covered.

View anyway? [Y/n]
```

### Low Hours Warning

```
Alert: Low prepaid hours remaining

Agreement: Managed Services Agreement
Remaining: 3.5 hours (of 40.0 total)
Utilization: 91%

Recommend contacting customer about purchasing additional hours.
```

### Expiring Soon Warning

```
Alert: Agreement expiring soon

Agreement: Managed Services Agreement
End Date:  2026-02-28 (24 days remaining)
Auto Renew: No

Recommend initiating renewal discussion with customer.
```

## Output Includes

- Agreement name, type, and status
- Covered work types and work roles
- Prepaid hours remaining (for block agreements)
- Incident packs remaining
- Covered configuration types
- Expiration date and billing information
- Agreement additions
- Recent usage summary

## Related Commands

- `/log-time` - Log time against ticket (uses agreement)
- `/close-ticket` - Close ticket with time entry
- `/lookup-config` - View configurations covered by agreement
- `/create-ticket` - Create ticket (checks agreement coverage)
