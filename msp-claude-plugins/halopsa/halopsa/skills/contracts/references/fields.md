# HaloPSA Contract Field Reference

## Contract Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | int | System | Unique identifier |
| `ref` | string | Yes | Contract reference/name |
| `client_id` | int | Yes | Associated client |
| `startdate` | date | Yes | Contract start |
| `enddate` | date | No | Contract end |
| `status` | string | Yes | Contract status |
| `type` | string | Yes | Contract type |

## Billing Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `billingfrequency` | string | No | Monthly, Quarterly, Annual |
| `invoiceday` | int | No | Day of month to invoice |
| `taxcode` | string | No | Tax code for invoicing |
| `currency_code` | string | No | Billing currency |
| `poref` | string | No | Purchase order reference |

## Coverage Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `sla_id` | int | No | Associated SLA |
| `priority_id` | int | No | Default ticket priority |
| `includesallsites` | bool | No | Covers all client sites |
| `includesallassets` | bool | No | Covers all assets |

## Financial Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `value` | decimal | No | Contract value |
| `setupfee` | decimal | No | One-time setup fee |
| `renewalvalue` | decimal | No | Renewal amount |
| `marginpercent` | decimal | No | Target margin |

## Recurring Item Fields

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

## Prepaid Contract Fields

| Field | Type | Description |
|-------|------|-------------|
| `prepaid_hours` | decimal | Total hours purchased |
| `prepaid_hours_used` | decimal | Hours consumed |
| `prepaid_hours_remaining` | decimal | Available balance |
| `hourlyrate` | decimal | Rate per hour |
