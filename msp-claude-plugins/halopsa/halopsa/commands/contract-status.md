---
description: Check contract status, service entitlements, and billing information for a client
argument-hint: "[client_id] [contract_id] [include_services] [include_usage]"
arguments: [client_id, contract_id, include_services, include_usage]
---

# Check HaloPSA Contract Status

Check contract status, service entitlements, and billing information for a client.

## Prerequisites

- Valid HaloPSA OAuth credentials configured
- User must have contract read permissions
- Either client_id or contract_id must be provided

## Steps

1. **Authenticate with OAuth 2.0**
   - Obtain access token using client credentials flow
   - Token endpoint: `{base_url}/auth/token?tenant={tenant}`
   ```bash
   # Get OAuth token
   TOKEN=$(curl -s -X POST "{base_url}/auth/token?tenant={tenant}" \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "grant_type=client_credentials" \
     -d "client_id={client_id}" \
     -d "client_secret={client_secret}" \
     -d "scope=all" | jq -r '.access_token')
   ```

2. **Fetch contracts**
   ```bash
   # By client
   curl -s -X GET "{base_url}/api/Contract?client_id={client_id}" \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json"

   # Or by contract ID
   curl -s -X GET "{base_url}/api/Contract/{contract_id}" \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json"
   ```

3. **Fetch service lines (if requested)**
   ```bash
   curl -s -X GET "{base_url}/api/RecurringInvoice?contract_id={contract_id}" \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json"
   ```

4. **Fetch usage/block hours (if requested)**
   ```bash
   curl -s -X GET "{base_url}/api/ContractBlock?contract_id={contract_id}" \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json"
   ```

5. **Format and display results**
   - Contract overview
   - Service entitlements
   - Usage statistics
   - Billing information

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| client_id | integer | No* | - | Client ID to check contracts |
| contract_id | integer | No* | - | Specific contract ID |
| include_services | boolean | No | false | Include service line details |
| include_usage | boolean | No | false | Include usage/hours consumed |

*Either client_id or contract_id is required

## Examples

### Client Contracts Overview

```
/contract-status --client_id 12345
```

### Specific Contract

```
/contract-status --contract_id 9876
```

### With Service Details

```
/contract-status --client_id 12345 --include_services true
```

### Full Usage Report

```
/contract-status --contract_id 9876 --include_services true --include_usage true
```

### Check Before Ticket Creation

```
/contract-status --client_id 12345 --include_usage true
```

## Output

### Client Contracts Overview

```
================================================================================
Contract Status: Acme Corporation (ID: 123)
================================================================================

ACTIVE CONTRACTS (2)
--------------------------------------------------------------------------------

1. Managed Services Agreement
   ────────────────────────────────────────────────────────────────────────────
   Contract ID:      9876
   Type:             All-Inclusive
   Status:           ✓ Active
   Start Date:       2023-01-01
   End Date:         2024-12-31
   Auto-Renewal:     Yes (Annual)

   SLA:              Premium
   Billing:          Monthly ($5,500.00)
   Next Invoice:     2024-03-01

   Coverage:         Unlimited support for covered items
   Exclusions:       Project work, after-hours (overtime rates apply)

2. Block Hours Agreement
   ────────────────────────────────────────────────────────────────────────────
   Contract ID:      9877
   Type:             Pre-Paid Hours
   Status:           ✓ Active
   Start Date:       2024-01-01
   End Date:         2024-12-31

   Hours Purchased:  100 hours
   Hours Used:       67.5 hours
   Hours Remaining:  32.5 hours

   Billing:          Prepaid ($12,500.00)
   Rollover:         No

EXPIRED/INACTIVE CONTRACTS (1)
--------------------------------------------------------------------------------

3. Implementation Project
   ────────────────────────────────────────────────────────────────────────────
   Contract ID:      9800
   Type:             Fixed Price Project
   Status:           Completed
   Duration:         2022-06-01 to 2022-12-31
   Value:            $45,000.00

================================================================================

Quick Actions:
- View contract:    /contract-status --contract_id <id>
- Client tickets:   /search-tickets --client 123
- Create ticket:    /create-ticket 123 "Summary"
```

### Detailed Contract with Services

```
================================================================================
Contract Details: Managed Services Agreement
================================================================================

CONTRACT INFORMATION
--------------------------------------------------------------------------------
Contract ID:      9876
Client:           Acme Corporation (ID: 123)
Type:             All-Inclusive Managed Services
Status:           ✓ Active

Start Date:       2023-01-01
End Date:         2024-12-31
Term:             2 years
Auto-Renewal:     Yes (Annual, 90-day notice required)

SLA Profile:      Premium
Account Manager:  John Manager
Sales Rep:        Jane Sales

BILLING INFORMATION
--------------------------------------------------------------------------------
Billing Cycle:    Monthly
Amount:           $5,500.00 /month
Payment Terms:    Net 30
Tax Status:       Taxable

Next Invoice:     2024-03-01
Last Invoice:     2024-02-01 (#INV-2024-0234)
Invoice Status:   Paid

Annual Value:     $66,000.00
Contract Total:   $132,000.00 (2 years)

SERVICE LINES
--------------------------------------------------------------------------------
┌─────────────────────────────────────┬──────────────┬────────────────────────┐
│ Service                             │ Quantity     │ Unit Price             │
├─────────────────────────────────────┼──────────────┼────────────────────────┤
│ Managed Endpoints - Workstation     │ 120 units    │ $25.00 /unit           │
│ Managed Endpoints - Server          │ 12 units     │ $75.00 /unit           │
│ Microsoft 365 Management            │ 120 users    │ $5.00 /user            │
│ Network Monitoring - Basic          │ 8 devices    │ $15.00 /device         │
│ Backup Management - Server          │ 6 units      │ $50.00 /unit           │
│ Security Monitoring                 │ 1 (flat)     │ $500.00 /month         │
│ Virtual CIO Services                │ 4 hours      │ $200.00 /hour          │
├─────────────────────────────────────┼──────────────┼────────────────────────┤
│ MONTHLY TOTAL                       │              │ $5,500.00              │
└─────────────────────────────────────┴──────────────┴────────────────────────┘

COVERAGE & ENTITLEMENTS
--------------------------------------------------------------------------------
✓ Unlimited remote support (business hours)
✓ Unlimited on-site visits (4 included/month)
✓ 24/7 critical issue support
✓ Quarterly business reviews
✓ Annual security assessment

✗ Project work (separate SOW required)
✗ After-hours non-critical (overtime rates)
✗ Hardware procurement (pass-through + 10%)
✗ Third-party software licensing

SUPPORT STATISTICS (This Contract Period)
--------------------------------------------------------------------------------
Total Tickets:        156
Open Tickets:         4
Avg Resolution Time:  2.3 hours
SLA Compliance:       98.2%

On-Site Visits:       12 (4 remaining this month)
Remote Sessions:      234

CONTRACT NOTES
--------------------------------------------------------------------------------
- 2024-01-15: Added 20 additional workstations
- 2023-10-01: Upgraded to Premium SLA
- 2023-06-01: Added security monitoring service

================================================================================

URL: https://yourcompany.halopsa.com/contracts?id=9876
```

### Block Hours Usage Report

```
================================================================================
Block Hours Contract: Acme Corporation
================================================================================

CONTRACT OVERVIEW
--------------------------------------------------------------------------------
Contract ID:      9877
Client:           Acme Corporation (ID: 123)
Type:             Pre-Paid Block Hours
Status:           ✓ Active

Start Date:       2024-01-01
End Date:         2024-12-31
Rollover:         No (unused hours expire)

HOURS SUMMARY
--------------------------------------------------------------------------------
Hours Purchased:  100.0 hours
Hours Used:       67.5 hours
Hours Remaining:  32.5 hours

███████████████████████████████░░░░░░░░░░░░░░ 67.5% Used

Average Monthly:  13.5 hours
Projected Usage:  162 hours (will exceed by 62 hours)

⚠️  WARNING: At current rate, hours will be exhausted by October 2024

USAGE BREAKDOWN (Last 30 Days)
--------------------------------------------------------------------------------
┌─────────────┬────────────────────────────────────────┬─────────────┐
│ Date        │ Ticket / Description                   │ Hours       │
├─────────────┼────────────────────────────────────────┼─────────────┤
│ 2024-02-15  │ #12345 - Email troubleshooting         │ 1.5         │
│ 2024-02-14  │ #12340 - VPN configuration             │ 2.0         │
│ 2024-02-12  │ #12335 - New user setup                │ 1.0         │
│ 2024-02-10  │ #12330 - Server maintenance            │ 3.0         │
│ 2024-02-08  │ #12325 - Printer installation          │ 0.5         │
│ 2024-02-05  │ #12320 - Software deployment           │ 2.5         │
│ 2024-02-01  │ #12315 - Network troubleshooting       │ 4.0         │
├─────────────┼────────────────────────────────────────┼─────────────┤
│ SUBTOTAL    │ Last 30 days                           │ 14.5        │
└─────────────┴────────────────────────────────────────┴─────────────┘

MONTHLY TREND
--------------------------------------------------------------------------------
January 2024:     15.0 hours
February 2024:    14.5 hours (projected: 16.0)

RECOMMENDATIONS
--------------------------------------------------------------------------------
⚠️  Consider purchasing additional hours block
⚠️  Review for conversion to managed services agreement
⚠️  High usage categories: Network (35%), Server (25%), User Support (20%)

================================================================================
```

## Error Handling

### No Parameters Provided

```
Error: Either client_id or contract_id is required

Examples:
  /contract-status --client_id 12345
  /contract-status --contract_id 9876
  /contract-status --client_id 12345 --include_services true
```

### Client Not Found

```
Client not found: ID 99999

Use /search-clients to find the correct client ID.
```

### No Contracts Found

```
No contracts found for client: Acme Corporation (ID: 123)

This client has no active or historical contracts.
All work will be billed as ad-hoc (Time & Materials).

Create contract: https://yourcompany.halopsa.com/contracts/new?client_id=123
```

### Contract Not Found

```
Contract not found: ID 99999

Use /contract-status --client_id <id> to list all contracts for a client.
```

### Authentication Error

```
Authentication failed

Please verify your HaloPSA credentials:
- HALOPSA_CLIENT_ID
- HALOPSA_CLIENT_SECRET
- HALOPSA_BASE_URL
- HALOPSA_TENANT (for cloud-hosted)

Ensure the API application has 'read:contracts' permission.
```

### Rate Limiting

```
Rate limited by HaloPSA API (429)

HaloPSA allows 500 requests per 3 minutes.
Retrying in 5 seconds...
```

### Permission Denied

```
Permission denied (403)

Your API credentials do not have permission to view contracts.
Contract access may be restricted to:
- Account managers
- Billing team
- Administrators

Contact your HaloPSA administrator.
```

## API Reference

### GET /api/Contract

Query parameters:
- `client_id={id}` - Filter by client
- `active_only={bool}` - Only active contracts

### GET /api/Contract/{id}

Retrieves specific contract details.

### GET /api/RecurringInvoice

Query parameters:
- `contract_id={id}` - Get service lines for contract

### GET /api/ContractBlock

Query parameters:
- `contract_id={id}` - Get block hour usage

**Response:**
```json
{
  "contracts": [
    {
      "id": 9876,
      "client_id": 123,
      "client_name": "Acme Corporation",
      "ref": "MSA-2023-001",
      "type": "All-Inclusive",
      "status": "Active",
      "start_date": "2023-01-01",
      "end_date": "2024-12-31",
      "billing_cycle": "Monthly",
      "value": 5500.00,
      "sla_id": 1
    }
  ],
  "record_count": 1
}
```

## Related Commands

- `/search-clients` - Find client ID
- `/search-tickets` - View client tickets
- `/create-ticket` - Create ticket for client
- `/sla-dashboard` - View SLA status
