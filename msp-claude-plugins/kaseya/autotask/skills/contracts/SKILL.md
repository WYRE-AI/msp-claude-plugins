---
name: "Autotask Contracts"
description: >
  Autotask contract and service agreement management - contract types (recurring
  services, block hours, time & materials, fixed price, retainer), service/service
  bundle associations, SLAs, and how contracts drive billing for MSP account
  managers.
when_to_use: >-
  When working with recurring services, block hours, time & materials, or contract billing in
  Autotask. Use when: autotask contract, service agreement, block hours, recurring service,
  contract renewal, contract billing, managed services agreement, or autotask billing.
---

# Autotask Contracts Management

## Overview

Contracts in Autotask define the service relationship with clients - what services you provide, how you bill for them, and what service levels apply. Contracts control how time and expenses flow to invoices and are critical for MSP financial management.

## Anti-triggers

- **The invoice or billing item a contract produced** — use
  `autotask-billing`.
- **The catalog definition behind a contract service** — services and
  bundles exist in the catalog independently of any contract; use
  `autotask-product-catalog`.
- **Kaseya BMS agreements** — BMS is a separate Kaseya PSA with its own
  contract objects that do not sync with Autotask; use
  `kaseya-bms-api-patterns`.
- **A HaloPSA agreement** — Halo models coverage, prepaid hours, and
  SLA on its own contract object, which does not sync with Autotask;
  use `halopsa-contracts`.

## Key Concepts

### Contract Types

| Type | Description | Billing Method |
|------|-------------|----------------|
| **Recurring Services** | Monthly/annual managed services | Fixed recurring fee |
| **Block Hours** | Prepaid hour bank | Deduct from balance |
| **Time & Materials** | Pay as you go | Bill actual time |
| **Fixed Price** | Project-based fixed fee | Milestone billing |
| **Retainer** | Prepaid monthly hours | Use or lose |

### Contract Fields

| Field | Description | Required |
|-------|-------------|----------|
| `id` | Unique identifier | System |
| `contractName` | Contract name | Yes |
| `companyID` | Client company | Yes |
| `contractType` | Type of contract | Yes |
| `status` | Contract status | Yes |
| `startDate` | Contract start | Yes |
| `endDate` | Contract end | Yes |
| `setupFee` | One-time setup fee | No |
| `timeReportingRequiresStartStopTimes` | Require start/stop | No |
| `serviceLevelAgreementID` | SLA assignment | No |

### Contract Status

| ID | Status | Description |
|----|--------|-------------|
| 1 | Active | Current, billable |
| 2 | Inactive | Suspended |
| 3 | Cancelled | Terminated |

### Service/Service Bundle

Services define what's included in a contract:

| Field | Description |
|-------|-------------|
| `serviceName` | Name of service |
| `unitPrice` | Price per unit |
| `unitCost` | Cost per unit |
| `periodType` | Monthly, Quarterly, Annual |
| `isOptional` | Required vs optional |

## MCP Tool Reference

The autotask-mcp server exposes typed contract tools — prefer these over
`autotask_raw_request`. Read tools return contract **header fields only**
(no service lines), keeping responses light.

### Search Contracts

```
Tool: autotask_search_contracts
Args: {
  "companyID": 12345,
  "status": 1,
  "contractType": 7,
  "endDateFrom": "2026-01-01",
  "endDateTo": "2026-12-31",
  "searchTerm": "Managed",
  "pageSize": 25
}
```

All filters optional: `searchTerm` (contains-match on contract name), `companyID`, `status`, `contractType` (picklist ID), `endDateFrom`/`endDateTo` (ISO dates bounding the end date), `pageSize` (default 25, max 500).

### Get a Single Contract

```
Tool: autotask_get_contract
Args: { "id": 54321 }
```

### Expiring / Expired Contracts Report

The renewal-pipeline tool. Lists contracts whose `endDate` falls within the next `daysAhead` days (default 60), org-wide or scoped to one company:

```
Tool: autotask_list_expiring_contracts
Args: {
  "daysAhead": 90,
  "companyID": 12345,
  "includeExpired": true,
  "status": 1,
  "pageSize": 100
}
```

- Pair with `status: 1` to get "in effect but lapsing" contracts — the renewal call list.
- `includeExpired: true` drops the today lower bound, surfacing contracts already past their end date. Autotask does **not** auto-deactivate expired contracts, so `status: 1` + `includeExpired: true` finds clients still receiving service on expired paper — the compliance-risk case.

### Create a Contract

```
Tool: autotask_create_contract
Args: {
  "companyID": 12345,
  "contractName": "Acme Corp - Managed Services",
  "contractType": 1,
  "contractCategory": 3,
  "startDate": "2026-01-01",
  "endDate": "2026-12-31",
  "status": 1
}
```

**Required:** `companyID`, `contractName`, `contractType`, `contractCategory`, `startDate`, `endDate`

### Create Contract Shells in Bulk

For multi-contract onboarding (e.g. one contract per client location), pass up to 50 shells in one call — same fields per item as `autotask_create_contract`:

```
Tool: autotask_create_contracts_bulk
Args: {
  "contracts": [
    { "companyID": 12345, "contractName": "Acme - HQ", "contractType": 1, "contractCategory": 3, "startDate": "2026-01-01", "endDate": "2026-12-31" },
    { "companyID": 12345, "contractName": "Acme - Branch", "contractType": 1, "contractCategory": 3, "startDate": "2026-01-01", "endDate": "2026-12-31" }
  ]
}
```

Shells are created sequentially (Autotask has no batch endpoint); a failure on one shell does **not** abort the rest. Each item reports `{index, contractName, success, id | error}` — retry only the failures.

### Update a Contract

```
Tool: autotask_update_contract
Args: { "id": 54321, "endDate": "2027-12-31", "status": 1 }
```

Only fields provided change — the typical renewal move is extending `endDate`.

### Contract Service Lines

`autotask_create_contract_service` (required: `contractID`, `serviceID`, `unitPrice`) and `autotask_update_contract_service` (required: `id`, `contractID`) manage the ContractServices line items on a contract.

## API Patterns

Raw REST shapes for reference — the typed tools above cover these; reach for `autotask_raw_request` only for entities without typed tools (ContractBlocks, ContractRetainers, etc.).

### Creating a Contract

```http
POST /v1.0/Contracts
Content-Type: application/json
```

```json
{
  "contractName": "Acme Corp - Managed Services",
  "companyID": 12345,
  "contractType": 1,
  "status": 1,
  "startDate": "2024-01-01",
  "endDate": "2024-12-31",
  "setupFee": 500.00,
  "timeReportingRequiresStartStopTimes": true,
  "serviceLevelAgreementID": 1
}
```

### Adding Services to Contract

```http
POST /v1.0/ContractServices
Content-Type: application/json
```

```json
{
  "contractID": 54321,
  "serviceID": 111,
  "unitPrice": 150.00,
  "adjustedPrice": 150.00,
  "quantity": 50,
  "effectiveDate": "2024-01-01"
}
```

### Creating Block Hours Contract

```http
POST /v1.0/Contracts
Content-Type: application/json
```

```json
{
  "contractName": "Acme Corp - Block Hours",
  "companyID": 12345,
  "contractType": 4,
  "status": 1,
  "startDate": "2024-01-01",
  "endDate": "2024-06-30"
}
```

Then add block hours:

```http
POST /v1.0/ContractBlocks
Content-Type: application/json
```

```json
{
  "contractID": 54322,
  "datePurchased": "2024-01-01",
  "hoursPurchased": 40,
  "hourlyRate": 150.00,
  "isPaid": true
}
```

### Searching Contracts

**Active contracts for a company:**
```json
{
  "filter": [
    {"field": "companyID", "op": "eq", "value": 12345},
    {"field": "status", "op": "eq", "value": 1}
  ]
}
```

**Contracts expiring soon:**
```json
{
  "filter": [
    {"field": "status", "op": "eq", "value": 1},
    {"field": "endDate", "op": "lte", "value": "2024-03-31"},
    {"field": "endDate", "op": "gte", "value": "2024-01-01"}
  ]
}
```

### Checking Block Hour Balance

```http
GET /v1.0/ContractBlocks/query?search={"filter":[{"field":"contractID","op":"eq","value":54322}]}
```

Calculate remaining hours:
- Sum `hoursPurchased` - Sum of time entries against contract

### Renewing a Contract

1. Create new contract with updated dates
2. Copy services from old contract
3. Update old contract status to Inactive
4. Link any ongoing tickets to new contract

## Common Workflows

### Contract Setup

1. **Create contract**
   - Set type, dates, status
   - Assign SLA

2. **Add services**
   - Define included services
   - Set pricing and quantities

3. **Configure billing**
   - Invoice frequency
   - Payment terms

4. **Assign to tickets**
   - Set as default for company
   - Route work appropriately

### Contract Renewal

1. **Identify expiring contracts**
   - `autotask_list_expiring_contracts` with `daysAhead` 30/60/90 windows
   - Add `includeExpired: true` to catch already-lapsed contracts still marked active

2. **Review contract performance**
   - Compare budgeted vs actual hours
   - Analyze profitability

3. **Negotiate renewal**
   - Adjust pricing if needed
   - Update service scope

4. **Create renewal**
   - New contract with new dates
   - Update company default contract

### Block Hours Management

1. **Monitor balance**
   - Track hours remaining
   - Alert at threshold (e.g., 10 hours)

2. **Replenish as needed**
   - Add new block purchase
   - Invoice for new hours

3. **Handle overages**
   - Bill at T&M rate
   - Or convert to new block

## Service Level Agreements (SLAs)

Contracts can be linked to SLAs:

| SLA Metric | Description |
|------------|-------------|
| Response Time | Time to first response |
| Resolution Time | Time to resolve |
| Uptime | System availability % |
| Business Hours | When SLA applies |

SLA violations trigger alerts and can affect contract terms.

## Error Handling

### Common API Errors

| Code | Message | Resolution |
|------|---------|------------|
| 400 | Invalid contract type | Use valid contract type ID |
| 400 | EndDate before StartDate | Fix date sequence |
| 409 | Cannot modify - has billing | Adjust dates only |
| 404 | ServiceID not found | Verify service exists |

### Validation Errors

**"CompanyID is required"** - Must associate with a company

**"StartDate is required"** - All contracts need start date

**"Invalid service for contract type"** - Service must match contract type

## Best Practices

1. **Name consistently** - "Company - Contract Type" format
2. **Set end dates** - Never leave end date empty
3. **Review renewals** - Quarterly expiration review
4. **Track profitability** - Compare budgeted vs actual
5. **Document terms** - Note special conditions
6. **Alert on block hours** - Proactive replenishment
7. **Assign SLAs** - Define service expectations
8. **Audit regularly** - Ensure tickets use correct contracts

## Related Skills

- [Autotask Tickets](../tickets/SKILL.md) - Ticket-contract association
- [Autotask CRM](../crm/SKILL.md) - Company relationships
- [Autotask Projects](../projects/SKILL.md) - Project billing
