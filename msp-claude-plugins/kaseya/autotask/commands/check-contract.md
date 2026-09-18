---
description: View contract status, entitlements, and remaining hours for a company or specific contract
argument-hint: "[company_id] [contract_id] [include_expired]"
arguments: [company_id, contract_id, include_expired]
---

# Check Autotask Contract

View contract status, entitlements, and remaining hours for a company or specific contract to verify coverage before work.

## Prerequisites

- Valid Autotask API credentials configured
- User must have contract read permissions
- Either company_id or contract_id is required

## Steps

1. **Validate parameters**
   - Ensure either company_id or contract_id is provided
   - Verify company/contract exists

2. **Query contracts**
   - If company_id: Use `autotask-mcp/autotask_search_contracts` with `companyID` to find all contracts for that company
   - If contract_id: autotask-mcp exposes no single-contract-by-ID getter — use `autotask-mcp/autotask_search_contracts` (scoped by `companyID` if known) and match the target `id` from the returned records
   - If include_expired: `autotask_search_contracts` has no `includeExpired` parameter — it returns every contract matching `companyID`/`status` regardless of expiry, so filter the results client-side by `endDate` to include or exclude expired ones

3. **Get contract details**
   - Fetch contract type and terms
   - Get service entitlements
   - Calculate remaining block hours if applicable

4. **Display contract information**
   - Show contract summary
   - Display entitlements and limits
   - Show remaining hours/units

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| company_id | integer | No* | - | Company ID to check |
| contract_id | integer | No* | - | Specific contract ID |
| include_expired | boolean | No | false | Include expired contracts |

*Either company_id or contract_id is required

## Examples

### Check Company Contracts

```
/check-contract --company_id 12345
```

### Check Specific Contract

```
/check-contract --contract_id 9876
```

### Include Expired Contracts

```
/check-contract --company_id 12345 --include_expired true
```

## Output

### Company Contracts Overview

```
Contracts for Acme Corporation (ID: 12345)

Active Contracts: 2
Expired Contracts: 1 (not shown)

+--------+--------------------------------+-------------+------------+------------+
| ID     | Contract Name                  | Type        | Status     | Expires    |
+--------+--------------------------------+-------------+------------+------------+
| 9876   | Managed Services Agreement     | Recurring   | Active     | 2027-01-01 |
| 9877   | Microsoft 365 Licenses         | Per Device  | Active     | 2026-12-31 |
+--------+--------------------------------+-------------+------------+------------+

Detailed View: /check-contract --contract_id <id>
```

### Contract Detail View

```
Contract Details

Contract: Managed Services Agreement
ID: 9876
Company: Acme Corporation (ID: 12345)

Status: Active
Type: Recurring Service
Category: Managed Services

Dates:
  Start Date: 2024-01-01
  End Date: 2027-01-01
  Billing Cycle: Monthly (1st of month)

Financial:
  Contract Value: $3,500/month
  Setup Fee: $0
  Overage Rate: $175/hour

Block Hours:
  Monthly Allocation: 20 hours
  Used This Period: 12.5 hours
  Remaining: 7.5 hours
  Rollover: No

  [=============>      ] 62.5% used

Services Included:
  - Remote Support (Unlimited)
  - On-Site Support (Up to 4 hours/month)
  - Monitoring & Alerting (Included)
  - Patch Management (Included)
  - Backup Monitoring (Included)

Exclusions:
  - Hardware procurement
  - Project work (separate SOW)
  - After-hours support (billed at 1.5x)

SLA Terms:
  Critical Response: 1 hour
  High Response: 4 hours
  Medium Response: 8 hours
  Low Response: 24 hours

Notes:
  Auto-renews annually. 60-day cancellation notice required.

Primary Contact: John Smith (IT Director)
Account Manager: Jane MSP
```

### Block Hours Summary

```
Contract Block Hours

Contract: Block Hours Agreement
ID: 9878
Company: TechStart Inc (ID: 12346)

Block Hours Status:
  Total Purchased: 100 hours
  Used to Date: 67.25 hours
  Remaining: 32.75 hours

  [===================>     ] 67.25% used

Current Period (February 2026):
  Hours Used: 8.5 hours

Period Breakdown:
  Week 1: 3.25 hours
  Week 2: 5.25 hours
  Week 3: (in progress)

Expiration: 2026-06-30
Rate: $150/hour | Overage: $175/hour

Warning: 32.75 hours remaining - consider renewal discussion
```

### Per-Device Contract

```
Contract Details

Contract: Microsoft 365 Licenses
ID: 9877
Company: Acme Corporation (ID: 12345)

Status: Active
Type: Per Device/User
Category: Software Licensing

Licensed Users: 45
  Active: 42
  Available: 3

License Types:
  - Microsoft 365 Business Premium: 30 users ($22/user/mo)
  - Microsoft 365 Business Basic: 15 users ($6/user/mo)

Monthly Cost: $750

Renewal: 2026-12-31 (auto-renew enabled)
```

### Including Expired

```
All Contracts for Acme Corporation (ID: 12345)

Active Contracts: 2
Expired Contracts: 1

+--------+--------------------------------+-------------+------------+------------+
| ID     | Contract Name                  | Type        | Status     | Expires    |
+--------+--------------------------------+-------------+------------+------------+
| 9876   | Managed Services Agreement     | Recurring   | Active     | 2027-01-01 |
| 9877   | Microsoft 365 Licenses         | Per Device  | Active     | 2026-12-31 |
| 9875   | Legacy Support Contract        | Block Hours | Expired    | 2023-12-31 |
+--------+--------------------------------+-------------+------------+------------+
```

## Error Handling

### Missing Parameter

```
Error: Either company_id or contract_id is required

Usage:
  /check-contract --company_id 12345
  /check-contract --contract_id 9876
```

### Company Not Found

```
Error: Company not found: ID 99999

Verify the company ID and try again.
Use /lookup-company to find the correct ID.
```

### Contract Not Found

```
Error: Contract not found: ID 99999

Verify the contract ID and try again.
Use /check-contract --company_id <id> to list all contracts.
```

### No Contracts

```
No Contracts Found

Company: Acme Corporation (ID: 12345)

This company has no active contracts.

Options:
  - Include expired: /check-contract --company_id 12345 --include_expired true
  - Time & Materials billing will apply to tickets
```

### Permission Denied

```
Error: Permission denied

You do not have permission to view contracts.
Contact your Autotask administrator for access.
```

## Contract Type Reference

| Type | Description |
|------|-------------|
| Recurring Service | Fixed monthly fee for defined services |
| Block Hours | Pre-purchased hours bank |
| Time & Materials | Billed as used at hourly rate |
| Per Device | Per-device/user pricing |
| Fixed Price | Project-based fixed price |
| Retainer | Monthly retainer with rollover |

## MCP Tool Usage

This command uses the following autotask-mcp tools:
- `autotask_search_contracts` - Search contracts by `searchTerm`, `companyID`, `status`, and `pageSize`. Since autotask-mcp exposes no single-contract-by-ID getter and no expiring-contracts report, this same tool is also used to fetch a specific contract (match `id` in the results) and to power `include_expired` (filter results by `endDate` client-side)
- `autotask_search_companies` - Verify company exists

## Related Commands

- `/lookup-company` - Find company information
- `/create-ticket` - Create ticket (checks contract coverage)
- `/lookup-asset` - Find assets covered by contract
- `/search-tickets` - Find tickets billed to contract
