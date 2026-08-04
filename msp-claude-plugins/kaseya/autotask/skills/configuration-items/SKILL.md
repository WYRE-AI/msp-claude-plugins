---
name: "Autotask Configuration Items"
description: >
  Autotask Configuration Item (CI) asset management: CI types and
  categories, lifecycle status codes, the CI field schema, related-item
  relationships, DNS records, notes, and contract/billing associations for
  MSP infrastructure tracking.
when_to_use: >-
  When working with asset management, inventory tracking, warranty monitoring, lifecycle
  management, and relationship mapping in Autotask Configuration Items (CIs). Use when: autotask
  configuration item, autotask asset, autotask ci, configuration item, asset management, device
  inventory, warranty tracking, asset lifecycle, network device, server inventory, workstation
  tracking, ssl certificate tracking, or dns management.
---

# Autotask Configuration Items Management

## Overview

Configuration Items (CIs) are the backbone of MSP asset management in Autotask. CIs represent any trackable asset—servers, workstations, network devices, software licenses, domains, and more. Proper CI management enables warranty tracking, lifecycle planning, ticket context, and contract-based billing.

## Anti-triggers

- **The same asset as documentation rather than as a billable record**
  — IT Glue holds the documentation copy with its own type schema; use
  `it-glue-configurations`.
- **Live endpoint state — online/offline, last check-in, agent health**
  — a CI is a static PSA record that does not know whether the machine
  is running; use `datto-rmm-devices`, or `kaseya-vsa-api-patterns` for
  VSA-managed endpoints.
- **Installed software or hardware specs** — CIs carry procurement and
  warranty fields, not collected inventory; use `datto-rmm-audit`.

## CI Status Codes

| Status ID | Name | Description | Business Logic |
|-----------|------|-------------|----------------|
| **1** | Active | Currently in use | Standard operational state |
| **2** | Inactive | Not currently in use | May be spare/storage |
| **3** | Retired | End of life | Historical record only |
| **4** | Missing | Cannot be located | Requires investigation |
| **5** | On Order | Procurement in progress | Expected arrival tracking |

### CI Lifecycle Workflow

```
On Order (5) ────> Active (1) ────> Inactive (2) ────> Retired (3)
                      │                    ↑
                      └────────────────────┘
                      (temporary deactivation)

      Active (1) ────> Missing (4) ────> (investigation)
                            │
                            ├──> Active (1)    (found)
                            └──> Retired (3)   (write-off)
```

## Configuration Item Field Reference

Key fields on most CIs: `referenceTitle` (name), `companyID`, `configurationItemType`, `configurationItemCategoryID`, `serialNumber`, `installDate` / `purchaseDate` / `warrantyExpirationDate`, and `rmmDeviceID` for RMM-synced assets.

See [references/fields.md](references/fields.md) for the complete field reference (identification, hardware, network, lifecycle, contract/billing, RMM integration, and user-defined fields) plus the CI category hierarchy and DNS record fields.

## CI Types

Configuration Item Types classify assets at the highest level:

| Type ID | Common Name | Examples |
|---------|-------------|----------|
| 1 | Server | Physical servers, VMs, cloud instances |
| 2 | Workstation | Desktops, laptops |
| 3 | Network Device | Routers, switches, firewalls, APs |
| 4 | Printer | Network printers, MFPs |
| 5 | Mobile Device | Phones, tablets |
| 6 | Software | Licenses, subscriptions |
| 7 | Domain | Domain names |
| 8 | SSL Certificate | SSL/TLS certificates |
| 9 | Cloud Service | SaaS subscriptions |
| 10 | Other | Miscellaneous assets |

**Note:** Actual type IDs vary by Autotask instance. Query `/v1.0/ConfigurationItemTypes` to get your instance's specific values.

```http
POST /v1.0/ConfigurationItemTypes/query
Content-Type: application/json
```
```json
{
  "filter": [
    {"field": "isActive", "op": "eq", "value": true}
  ]
}
```

## CI Categories

Categories provide secondary classification within types — e.g. Server → Physical Server / Virtual Server / Cloud Server; Network Device → Firewall / Switch / Wireless. See [references/fields.md](references/fields.md) for the full category hierarchy and examples.

## Related Items (CI Relationships)

Related Items establish connections between Configuration Items — Parent/Child, Dependency, Peer, Backup, and Network relationships:

```http
POST /v1.0/ConfigurationItemRelatedItems
Content-Type: application/json
```
```json
{
  "configurationItemID": 12345,
  "relatedConfigurationItemID": 67890,
  "relationshipDescription": "Hosted virtual machines",
  "relationshipTypeID": 1
}
```

## DNS Records

Track DNS records (A, AAAA, CNAME, MX, TXT, etc.) associated with domain CIs:

```http
POST /v1.0/ConfigurationItemDnsRecords
Content-Type: application/json
```
```json
{
  "configurationItemID": 12345,
  "recordType": "A",
  "hostname": "mail.acmecorp.com",
  "value": "192.168.1.100",
  "ttl": 3600
}
```

See [references/fields.md](references/fields.md) for the DNS record field table and [references/examples.md](references/examples.md) for query patterns (e.g. finding CIs with expiring SSL certificates).

## CI Notes

Attach notes to Configuration Items for documentation:

```http
POST /v1.0/ConfigurationItemNotes
Content-Type: application/json
```
```json
{
  "configurationItemID": 12345,
  "title": "Firmware Update Log",
  "description": "Updated to firmware v2.1.4 on 2024-02-15. Resolved memory leak issue.",
  "noteType": 1
}
```

`noteType`: 1 = Internal (MSP only), 2 = External (client visible).

## Billing Product Associations

Link CIs to billing products for recurring revenue via `configurationItemID`, `productID`, `quantity`, `unitPrice`, and `effectiveDate`. See [references/api.md](references/api.md) for a full example.

## API Patterns

### Creating a Configuration Item

```http
POST /v1.0/ConfigurationItems
Content-Type: application/json
```

**Server Example:**
```json
{
  "companyID": 12345,
  "referenceTitle": "ACME-DC-SQL01",
  "referenceNumber": "SN-ABC123456",
  "configurationItemType": 1,
  "configurationItemCategoryID": 3,
  "make": "Dell",
  "model": "PowerEdge R750",
  "serialNumber": "ABC123456789",
  "ipAddress": "192.168.1.50",
  "hostname": "SQL01.acmecorp.local",
  "installDate": "2024-01-15",
  "purchaseDate": "2024-01-01",
  "warrantyExpirationDate": "2027-01-01",
  "isActive": true
}
```

See [references/api.md](references/api.md) for the workstation create example, retire/update patterns, and additional query patterns (expiring warranties, servers by type/location, CIs without RMM integration).

### Query Patterns

**All active CIs for a company:**
```json
{
  "filter": [
    {"field": "companyID", "op": "eq", "value": 12345},
    {"field": "isActive", "op": "eq", "value": true}
  ],
  "includeFields": ["Company.companyName"]
}
```

## Common Workflows

### Asset Onboarding

1. **Create CI** with basic info
2. **Set type and category** for classification
3. **Link to company location**
4. **Record warranty** dates
5. **Create relationships** (if part of infrastructure)
6. **Associate billing** (if recurring)
7. **Sync with RMM** for ongoing monitoring

### Warranty Tracking Report

Query CIs where `warrantyExpirationDate` is not null and `lte` a future cutoff date, then sort by days remaining. See [references/examples.md](references/examples.md) for the implementation.

### Lifecycle Planning

Compare each CI's age (from `purchaseDate`) against standard replacement cycles (servers ~5yr, workstations ~4yr, network devices ~7yr, printers ~5yr) to flag `REPLACE` / `PLAN_REPLACEMENT` / `HEALTHY`. See [references/examples.md](references/examples.md) for the implementation.

### RMM Sync Verification

Query active servers/workstations for a company and split by whether `rmmDeviceID` is set, to find assets missing RMM coverage. See [references/examples.md](references/examples.md) for the implementation.

## Error Handling

### Common API Errors

| Code | Message | Resolution |
|------|---------|------------|
| 400 | CompanyID required | All CIs must have a company |
| 400 | Invalid configuration type | Query ConfigurationItemTypes first |
| 400 | Duplicate reference number | Reference numbers must be unique |
| 404 | Configuration item not found | Verify CI ID exists |
| 409 | Cannot delete active CI | Retire or inactivate first |

### Validation Errors

| Error | Cause | Fix |
|-------|-------|-----|
| ReferenceTitle required | Missing name | Add referenceTitle |
| Invalid IP format | Bad IP address | Use valid IPv4/IPv6 |
| Invalid date format | Wrong date format | Use YYYY-MM-DD |
| Category not valid for type | Mismatched category | Check type/category relationship |

## Best Practices

1. **Standardize naming** - Use consistent referenceTitle format (e.g., COMPANY-TYPE-NAME)
2. **Track serial numbers** - Enable warranty lookups and asset verification
3. **Set warranty dates** - Proactive renewal planning
4. **Link to RMM** - Enable automated inventory sync
5. **Document relationships** - Map infrastructure dependencies
6. **Use categories** - Enable meaningful reporting
7. **Track purchase dates** - Lifecycle planning
8. **Associate contracts** - Enable billing automation
9. **Maintain DNS records** - Track hosted services

## Related Skills

- [Autotask Tickets](../tickets/SKILL.md) - Link tickets to CIs
- [Autotask Contracts](../contracts/SKILL.md) - Contract associations
- [Autotask CRM](../crm/SKILL.md) - Company and location management
- [Autotask API Patterns](../api-patterns/SKILL.md) - Query builder and authentication
