---
name: "HaloPSA Contracts"
description: >
  HaloPSA contract management: contract types (recurring, prepaid hours, ad-hoc,
  project, warranty), statuses, billing and coverage fields, recurring invoice
  items, prepaid hour balances and deduction, SLA association, renewal and
  billing-reconciliation workflows.
when_to_use: >-
  When managing service agreements, recurring billing, prepaid hours, and contract renewals. Use
  when: halopsa contract, halo contract, service agreement halopsa, recurring billing halopsa,
  prepaid hours halo, contract renewal halopsa, halopsa billing, managed services agreement halo,
  halopsa msa, or contract management halo.
---

# HaloPSA Contract Management

## Overview

Contracts in HaloPSA define the service relationship with clients - what services you provide, how you bill for them, and what service levels apply. Contracts control how time, expenses, and recurring charges flow to invoices and are critical for MSP financial management.

## Anti-triggers

A HaloPSA contract is the commercial agreement — coverage, rates, and the
SLA you committed to. It is not the helpdesk configuration that computes
a deadline, and it is not the bill.

- **How a ticket's due date was calculated** — SLA policies and
  business-hours calendars in the helpdesk are
  `freshdesk-sla-business-hours`; the contract states the commitment, the
  helpdesk approximates it, and the two can legitimately disagree.
- **What has actually been billed** — issued invoices and payment status
  are `halopsa-invoices` (read-only) and `xero-invoices` for the books.
- **Contracts in another PSA** — the type taxonomy and prepaid-hour model
  differ materially; use `autotask-contracts`.
- **Which assets a contract covers** — asset records and their contract
  links are `halopsa-assets`.

## Key Concepts

### Contract Types

| Type | Description | Billing Method |
|------|-------------|----------------|
| **Recurring** | Monthly/annual managed services | Fixed recurring fee |
| **Prepaid Hours** | Block hours/time bank | Deduct from balance |
| **Ad-Hoc** | Pay as you go (T&M) | Bill actual time |
| **Project** | Fixed-price project | Milestone billing |
| **Warranty** | Coverage period | No direct billing |

### Contract Status

| Status | Description | Billing |
|--------|-------------|---------|
| Active | In effect | Billable |
| Pending | Not yet started | Not billable |
| Expired | Past end date | Not billable |
| Cancelled | Terminated early | Not billable |
| On Hold | Temporarily paused | Not billable |

### Core Fields

A contract minimally needs `ref` (reference/name), `client_id`, `startdate`, `status`, and `type`. Billing behavior comes from `billingfrequency` and `invoiceday`; coverage from `sla_id`, `includesallsites`, and `includesallassets`; financials from `value`, `setupfee`, and `renewalvalue`.

See [references/fields.md](references/fields.md) for the complete field reference (contract, billing, coverage, financial, recurring-item, and prepaid fields).

## API Patterns

Contracts live at `/api/ClientContract`; recurring line items at `/api/RecurringInvoiceItem`. As elsewhere in HaloPSA, POST bodies are arrays, and an update is a POST that includes the record's `id`.

Two non-obvious expansion flags control what a GET returns:

| Query flag | Effect |
|------------|--------|
| `includerecurringinvoiceitems=true` | Returns the contract's recurring line items |
| `includehoursummary=true` | Returns prepaid hour totals, used, and remaining |

Date-range searches use `enddate_before` / `enddate_after` (combine with `status=Active` to find contracts that are expiring rather than already lapsed).

See [references/api.md](references/api.md) for full create/search/update request and response bodies, recurring-item payloads, prepaid contract creation, SLA linking, and renewal calls.

## Recurring Items

Recurring items are the line items that generate recurring invoices. Each item belongs to a contract (`contract_id`) and carries a `description`, `quantity`, and `unitprice`. An item can override the contract's `billingfrequency` and can have its own `startdate`/`enddate`, so mid-term additions (e.g. five new workstations) bill only from the date they start.

## Prepaid Hours (Block Hours)

Prepaid contracts carry a purchased hour allocation (`prepaid_hours`) and an `hourlyrate`. Time entries logged against tickets linked to the contract automatically deduct from the balance - the ticket's time entry must carry `contract_id` for the deduction to happen. Query the balance with `includehoursummary=true` and alert before the remaining hours run out.

## Contract-SLA Association

Setting `sla_id` on a contract makes tickets under that contract inherit:
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

1. **Identify expiring contracts** - search `status=Active` with `enddate_before` set to your renewal horizon
2. **Review performance** - ticket volume, SLA compliance, hours used, profitability against contract value
3. **Generate renewal** - create a new contract in `Pending` status with the new term dates and `renewalvalue`
4. **Expire old contract** - set the prior contract's `status` to `Expired` once the renewal starts

### Prepaid Hours Management

Poll `prepaid_hours_remaining` against a low-balance threshold (commonly 10 hours) and raise a replenishment quote before the block is exhausted, otherwise time silently accrues as unbilled.

### Billing Reconciliation

For a billing period, compare expected recurring totals against invoiced amounts, then flag time entries linked to the contract that remain uninvoiced.

See [references/examples.md](references/examples.md) for working implementations of validation, performance review, prepaid balance alerting, billing reconciliation, expiring-contract reports, and contract value by client.

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

Validate client-side before POSTing: prepaid-hours contracts are rejected without an hours allocation, and end dates preceding start dates fail on the server rather than being normalized.

## Best Practices

1. **Name consistently** - "Client - Type Year" format
2. **Set end dates** - Never leave open-ended without review
3. **Review renewals quarterly** - Proactive renewal management
4. **Track profitability** - Compare budgeted vs actual
5. **Document terms** - Note special conditions in notes field
6. **Alert on low hours** - Proactive prepaid replenishment
7. **Assign SLAs** - Define service expectations
8. **Link tickets correctly** - Ensure proper contract association

## Related Skills

- [HaloPSA Tickets](../tickets/SKILL.md) - Ticket-contract association
- [HaloPSA Clients](../clients/SKILL.md) - Client relationships
- [HaloPSA Assets](../assets/SKILL.md) - Asset coverage
- [HaloPSA API Patterns](../api-patterns/SKILL.md) - Authentication and queries
