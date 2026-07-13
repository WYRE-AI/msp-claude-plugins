---
name: "HaloPSA Contracts"
description: >
  Use this skill when working with HaloPSA contracts - managing service agreements,
  recurring billing, prepaid hours, and contract renewals. Covers contract types,
  billing periods, recurring items, SLA associations, and financial workflows.
  Essential for MSP account managers handling service agreements in HaloPSA.
when_to_use: >-
  When managing service agreements, recurring billing, prepaid hours, and contract renewals. Use
  when: halopsa contract, halo contract, service agreement halopsa, recurring billing halopsa,
  prepaid hours halo, contract renewal halopsa, halopsa billing, managed services agreement halo,
  halopsa msa, or contract management halo.
---

# HaloPSA Contract Management

## Overview

Contracts in HaloPSA define the service relationship with clients - what services you provide, how you bill for them, and what service levels apply. Contracts control how time, expenses, and recurring charges flow to invoices and are critical for MSP financial management.

## Key Concepts

### Contract Types

| Type | Description | Billing Method |
|------|-------------|----------------|
| **Recurring** | Monthly/annual managed services | Fixed recurring fee |
| **Prepaid Hours** | Block hours/time bank | Deduct from balance |
| **Ad-Hoc** | Pay as you go (T&M) | Bill actual time |
| **Project** | Fixed-price project | Milestone billing |
| **Warranty** | Coverage period | No direct billing |

### Contract Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | int | System | Unique identifier |
| `ref` | string | Yes | Contract reference/name |
| `client_id` | int | Yes | Associated client |
| `startdate` | date | Yes | Contract start |
| `enddate` | date | No | Contract end |
| `status` | string | Yes | Contract status |
| `type` | string | Yes | Contract type |

### Billing Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `billingfrequency` | string | No | Monthly, Quarterly, Annual |
| `invoiceday` | int | No | Day of month to invoice |
| `taxcode` | string | No | Tax code for invoicing |
| `currency_code` | string | No | Billing currency |
| `poref` | string | No | Purchase order reference |

### Coverage Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `sla_id` | int | No | Associated SLA |
| `priority_id` | int | No | Default ticket priority |
| `includesallsites` | bool | No | Covers all client sites |
| `includesallassets` | bool | No | Covers all assets |

### Financial Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `value` | decimal | No | Contract value |
| `setupfee` | decimal | No | One-time setup fee |
| `renewalvalue` | decimal | No | Renewal amount |
| `marginpercent` | decimal | No | Target margin |

## Contract Status

| Status | Description | Billing |
|--------|-------------|---------|
| Active | In effect | Billable |
| Pending | Not yet started | Not billable |
| Expired | Past end date | Not billable |
| Cancelled | Terminated early | Not billable |
| On Hold | Temporarily paused | Not billable |

## API Patterns

### Creating a Contract

```http
POST /api/ClientContract
Authorization: Bearer {token}
Content-Type: application/json
```

```json
[
  {
    "ref": "Acme Corp - Managed Services 2024",
    "client_id": 123,
    "type": "Recurring",
    "status": "Active",
    "startdate": "2024-01-01",
    "enddate": "2024-12-31",
    "billingfrequency": "Monthly",
    "invoiceday": 1,
    "value": 2500.00,
    "sla_id": 1,
    "includesallsites": true,
    "includesallassets": true,
    "notes": "Premium support tier, includes unlimited remote support"
  }
]
```

### Response

```json
{
  "contracts": [
    {
      "id": 5001,
      "ref": "Acme Corp - Managed Services 2024",
      "client_id": 123,
      "client_name": "Acme Corporation",
      "status": "Active",
      "startdate": "2024-01-01",
      "enddate": "2024-12-31"
    }
  ]
}
```

### Searching Contracts

**By client:**
```http
GET /api/ClientContract?client_id=123
```

**Active contracts:**
```http
GET /api/ClientContract?status=Active
```

**Expiring soon:**
```http
GET /api/ClientContract?enddate_before=2024-03-31&enddate_after=2024-01-01&status=Active
```

**By type:**
```http
GET /api/ClientContract?type=Recurring
```

### Getting a Single Contract

```http
GET /api/ClientContract/5001
```

**With recurring items:**
```http
GET /api/ClientContract/5001?includerecurringinvoiceitems=true
```

### Updating a Contract

```http
POST /api/ClientContract
Authorization: Bearer {token}
Content-Type: application/json
```

```json
[
  {
    "id": 5001,
    "status": "On Hold",
    "notes": "Client requested temporary pause - resume Feb 2024"
  }
]
```

## Recurring Items

Recurring items are the line items that generate recurring invoices.

### Recurring Item Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | int | System | Unique identifier |
| `contract_id` | int | Yes | Parent contract |
| `description` | string | Yes | Line item description |
| `quantity` | decimal | Yes | Quantity |
| `unitprice` | decimal | Yes | Price per unit |
| `billingfrequency` | string | No | Override contract frequency |
| `startdate` | date | No | Item start date |
| `enddate` | date | No | Item end date |

### Creating Recurring Items

```http
POST /api/RecurringInvoiceItem
Authorization: Bearer {token}
Content-Type: application/json
```

```json
[
  {
    "contract_id": 5001,
    "description": "Managed Workstation Support",
    "quantity": 25,
    "unitprice": 50.00,
    "startdate": "2024-01-01"
  },
  {
    "contract_id": 5001,
    "description": "Server Management",
    "quantity": 3,
    "unitprice": 200.00,
    "startdate": "2024-01-01"
  },
  {
    "contract_id": 5001,
    "description": "M365 Business Premium Licenses",
    "quantity": 25,
    "unitprice": 25.00,
    "startdate": "2024-01-01"
  }
]
```

### Updating Recurring Items

```json
[
  {
    "id": 10001,
    "quantity": 30,
    "notes": "Added 5 workstations in March"
  }
]
```

## Prepaid Hours (Block Hours)

### Prepaid Contract Fields

| Field | Type | Description |
|-------|------|-------------|
| `prepaid_hours` | decimal | Total hours purchased |
| `prepaid_hours_used` | decimal | Hours consumed |
| `prepaid_hours_remaining` | decimal | Available balance |
| `hourlyrate` | decimal | Rate per hour |

### Creating Prepaid Contract

```json
[
  {
    "ref": "Acme Corp - Prepaid Hours Q1 2024",
    "client_id": 123,
    "type": "Prepaid Hours",
    "status": "Active",
    "startdate": "2024-01-01",
    "enddate": "2024-03-31",
    "prepaid_hours": 40,
    "hourlyrate": 150.00,
    "value": 6000.00
  }
]
```

### Checking Hours Balance

```http
GET /api/ClientContract/5002?includehoursummary=true
```

Response includes:
```json
{
  "prepaid_hours": 40,
  "prepaid_hours_used": 12.5,
  "prepaid_hours_remaining": 27.5
}
```

### Hours Deduction

Time entries against tickets linked to prepaid contracts automatically deduct hours:

```json
{
  "ticket_id": 54321,
  "timetaken": 60,
  "contract_id": 5002
}
```

## Contract-SLA Association

Link contracts to Service Level Agreements:

```json
[
  {
    "id": 5001,
    "sla_id": 1
  }
]
```

### SLA Enforcement

Tickets under contract inherit SLA settings:
- Response time targets
- Resolution time targets
- Business hours definitions
- Escalation rules

## Common Workflows

### Contract Setup

1. **Create contract**
   - Set type, dates, status
   - Associate SLA
   - Configure billing

2. **Add recurring items**
   - Define services included
   - Set pricing and quantities

3. **Link to assets** (optional)
   - Covered devices
   - License tracking

4. **Configure billing**
   - Invoice frequency
   - Payment terms
   - Tax settings

### Contract Renewal

1. **Identify expiring contracts**
   ```http
   GET /api/ClientContract?enddate_before=2024-03-31&status=Active
   ```

2. **Review performance**
   ```javascript
   async function reviewContractPerformance(contractId) {
     const contract = await getContract(contractId);
     const tickets = await getContractTickets(contractId);

     return {
       totalTickets: tickets.length,
       slaCompliance: calculateSLACompliance(tickets),
       hoursUsed: calculateHoursUsed(tickets),
       profitability: calculateProfitability(contract, tickets)
     };
   }
   ```

3. **Generate renewal**
   ```json
   [
     {
       "ref": "Acme Corp - Managed Services 2025",
       "client_id": 123,
       "type": "Recurring",
       "status": "Pending",
       "startdate": "2025-01-01",
       "enddate": "2025-12-31",
       "renewalvalue": 2750.00,
       "notes": "Renewal from contract 5001"
     }
   ]
   ```

4. **Expire old contract**
   ```json
   [{ "id": 5001, "status": "Expired" }]
   ```

### Prepaid Hours Management

```javascript
async function checkPrepaidBalance(contractId) {
  const contract = await getContract(contractId);
  const threshold = 10; // hours

  if (contract.prepaid_hours_remaining <= threshold) {
    return {
      alert: true,
      message: `Only ${contract.prepaid_hours_remaining} hours remaining`,
      suggestedAction: 'Create replenishment quote'
    };
  }

  return { alert: false };
}
```

### Billing Reconciliation

```javascript
async function reconcileContractBilling(contractId, period) {
  const contract = await getContract(contractId);
  const invoices = await getContractInvoices(contractId, period);
  const timeEntries = await getContractTime(contractId, period);

  const expectedRecurring = calculateRecurringTotal(contract);
  const actualBilled = invoices.reduce((sum, i) => sum + i.total, 0);
  const unbilledTime = timeEntries.filter(t => !t.invoiced);

  return {
    contract_id: contractId,
    period,
    expected_recurring: expectedRecurring,
    actual_billed: actualBilled,
    unbilled_time_entries: unbilledTime.length,
    unbilled_amount: unbilledTime.reduce((sum, t) => sum + (t.amount || 0), 0)
  };
}
```

## Error Handling

### Common API Errors

| Code | Message | Resolution |
|------|---------|------------|
| 400 | ref required | Contract needs a reference name |
| 400 | client_id required | Must associate with a client |
| 400 | Invalid type | Use valid contract type |
| 400 | enddate before startdate | Fix date sequence |
| 404 | Contract not found | Verify contract ID |
| 409 | Cannot delete - has invoices | Cancel instead of delete |

### Validation Patterns

```javascript
function validateContract(contract) {
  const errors = [];

  if (!contract.ref || contract.ref.trim() === '') {
    errors.push('Contract reference is required');
  }

  if (!contract.client_id) {
    errors.push('Client ID is required');
  }

  if (!contract.startdate) {
    errors.push('Start date is required');
  }

  if (contract.enddate && contract.startdate > contract.enddate) {
    errors.push('End date must be after start date');
  }

  if (contract.type === 'Prepaid Hours' && !contract.prepaid_hours) {
    errors.push('Prepaid hours contracts require hours allocation');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}
```

## Best Practices

1. **Name consistently** - "Client - Type Year" format
2. **Set end dates** - Never leave open-ended without review
3. **Review renewals quarterly** - Proactive renewal management
4. **Track profitability** - Compare budgeted vs actual
5. **Document terms** - Note special conditions in notes field
6. **Alert on low hours** - Proactive prepaid replenishment
7. **Assign SLAs** - Define service expectations
8. **Link tickets correctly** - Ensure proper contract association

## Contract Reports

### Contracts by Status
```http
GET /api/ClientContract?groupby=status&count=true
```

### Expiring Contracts Report
```javascript
async function getExpiringContracts(days = 90) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);

  const contracts = await searchContracts({
    status: 'Active',
    enddate_before: futureDate.toISOString().split('T')[0]
  });

  return contracts.map(c => ({
    id: c.id,
    ref: c.ref,
    client_name: c.client_name,
    enddate: c.enddate,
    value: c.value,
    days_remaining: Math.ceil(
      (new Date(c.enddate) - new Date()) / (1000 * 60 * 60 * 24)
    )
  }));
}
```

### Contract Value by Client
```javascript
async function getContractValueByClient() {
  const clients = await fetchAllClients();
  const results = [];

  for (const client of clients) {
    const contracts = await getClientContracts(client.id, { status: 'Active' });
    const totalValue = contracts.reduce((sum, c) => sum + (c.value || 0), 0);

    results.push({
      client_id: client.id,
      client_name: client.name,
      active_contracts: contracts.length,
      annual_value: totalValue
    });
  }

  return results.sort((a, b) => b.annual_value - a.annual_value);
}
```

## Related Skills

- [HaloPSA Tickets](../tickets/SKILL.md) - Ticket-contract association
- [HaloPSA Clients](../clients/SKILL.md) - Client relationships
- [HaloPSA Assets](../assets/SKILL.md) - Asset coverage
- [HaloPSA API Patterns](../api-patterns/SKILL.md) - Authentication and queries
