---
name: "Autotask Configuration Items"
description: >
  Use this skill when working with Autotask Configuration Items (CIs) - asset
  management, inventory tracking, warranty monitoring, lifecycle management,
  and relationship mapping. Covers CI types, categories, DNS records, SSL
  certificates, related items, notes, and contract billing associations.
  Essential for MSP asset documentation and infrastructure tracking.
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

### Core Identification Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | int | System | Auto-generated unique identifier |
| `referenceTitle` | string(100) | Yes | Primary name/identifier |
| `referenceNumber` | string(50) | No | Serial number or reference |
| `companyID` | int | Yes | Owner company |
| `companyLocationID` | int | No | Location within company |
| `configurationItemType` | int | Yes | Type classification |
| `configurationItemCategoryID` | int | No | Category classification |

### Hardware Specification Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `productID` | int | No | Link to Autotask product |
| `serialNumber` | string(100) | No | Manufacturer serial number |
| `make` | string(50) | No | Manufacturer |
| `model` | string(100) | No | Model name/number |

### Network Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `ipAddress` | string(50) | No | Primary IP address |
| `macAddress` | string(50) | No | MAC address |
| `hostname` | string(100) | No | Network hostname |

### Lifecycle Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `isActive` | boolean | System | Active status flag |
| `installDate` | date | No | When installed/deployed |
| `purchaseDate` | date | No | When purchased |
| `warrantyExpirationDate` | date | No | Warranty end date |
| `endOfLifeDate` | date | No | EOL date from manufacturer |
| `retirementDate` | date | No | When retired from service |
| `lastPhysicalLocationDate` | date | No | Last physical audit |

### Contract & Billing Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `contractID` | int | No | Associated contract |
| `contractServiceID` | int | No | Service on contract |
| `contractServiceBundleID` | int | No | Service bundle |
| `monthlyUnitCost` | decimal | No | Monthly recurring cost |
| `setupFee` | decimal | No | One-time setup fee |
| `hourlyRate` | decimal | No | Hourly rate for T&M work |

### RMM Integration Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `rmmDeviceID` | int | No | RMM platform device ID |
| `rmmDeviceUID` | string | No | RMM unique identifier |
| `rmmDeviceAuditID` | int | No | RMM audit record ID |
| `rmmDeviceAuditLastUser` | string | No | Last logged-in user from RMM |
| `rmmDeviceAuditOperatingSystem` | string | No | OS from RMM audit |
| `rmmDeviceAuditDeviceNetworkAddress` | string | No | IP from RMM |

### User-Defined Fields

CIs support custom user-defined fields (UDFs) for organization-specific tracking:
- Asset tags
- Cost centers
- Business criticality
- Compliance tags
- Custom lifecycle flags

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

### Querying Types

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

Categories provide secondary classification within types:

| Category Examples | Parent Type | Description |
|-------------------|-------------|-------------|
| Physical Server | Server | On-premises physical |
| Virtual Server | Server | VMware, Hyper-V |
| Cloud Server | Server | AWS, Azure, GCP |
| Windows Workstation | Workstation | Windows PCs |
| Mac Workstation | Workstation | Apple devices |
| Firewall | Network Device | Security appliances |
| Managed Switch | Network Device | L2/L3 switches |
| Wireless AP | Network Device | Access points |

### Category Hierarchy

```
Type: Server
├── Category: Physical Server
│   ├── Rack Mount
│   └── Tower
├── Category: Virtual Server
│   ├── VMware
│   └── Hyper-V
└── Category: Cloud Server
    ├── AWS EC2
    ├── Azure VM
    └── GCP Compute

Type: Network Device
├── Category: Firewall
│   ├── Hardware Firewall
│   └── Virtual Firewall
├── Category: Switch
│   ├── Core Switch
│   └── Access Switch
└── Category: Wireless
    ├── Access Point
    └── Controller
```

## Related Items (CI Relationships)

Related Items establish connections between Configuration Items:

### Relationship Types

| Relationship | Description | Example |
|--------------|-------------|---------|
| Parent/Child | Hierarchical | VM → Host server |
| Dependency | Depends on | Application → Database server |
| Peer | Equal relationship | Clustered servers |
| Backup | Backup target | Primary → Backup NAS |
| Network | Network connection | Server → Switch port |

### Creating Relationships

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

### Querying Relationships

```json
{
  "filter": [
    {"field": "configurationItemID", "op": "eq", "value": 12345}
  ]
}
```

## DNS Records

Track DNS records associated with CIs:

### DNS Record Fields

| Field | Type | Description |
|-------|------|-------------|
| `configurationItemID` | int | Parent CI |
| `recordType` | string | A, AAAA, CNAME, MX, TXT, etc. |
| `hostname` | string | Record hostname |
| `value` | string | Record value |
| `ttl` | int | Time to live |
| `priority` | int | Priority (for MX) |

### Creating DNS Records

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

### Common DNS Tracking Patterns

```javascript
// Track all DNS records for a domain CI
const dnsRecords = await queryDnsRecords({
  filter: [
    {field: 'configurationItemID', op: 'eq', value: domainCiId}
  ]
});

// Find CIs with expiring SSL certs
const expiringSSL = await queryCIs({
  filter: [
    {field: 'configurationItemType', op: 'eq', value: SSL_CERT_TYPE},
    {field: 'warrantyExpirationDate', op: 'lte', value: thirtyDaysFromNow}
  ]
});
```

## CI Notes

Attach notes to Configuration Items for documentation:

### Creating CI Notes

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

### Note Types

| Type | Description | Visibility |
|------|-------------|------------|
| 1 | Internal | MSP only |
| 2 | External | Client visible |

## Billing Product Associations

Link CIs to billing products for recurring revenue:

### Association Fields

| Field | Type | Description |
|-------|------|-------------|
| `configurationItemID` | int | The CI |
| `productID` | int | Billing product |
| `quantity` | decimal | Quantity units |
| `unitPrice` | decimal | Price per unit |
| `effectiveDate` | date | Billing start date |

### Creating Billing Association

```json
{
  "configurationItemID": 12345,
  "productID": 999,
  "quantity": 1,
  "unitPrice": 49.99,
  "effectiveDate": "2024-02-01"
}
```

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

**Workstation Example:**
```json
{
  "companyID": 12345,
  "referenceTitle": "ACME-WS-JSmith",
  "configurationItemType": 2,
  "make": "Dell",
  "model": "Latitude 5540",
  "serialNumber": "XYZ789012345",
  "rmmDeviceAuditLastUser": "jsmith@acmecorp.com",
  "purchaseDate": "2024-02-01",
  "warrantyExpirationDate": "2027-02-01",
  "isActive": true
}
```

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

**CIs with expiring warranties (next 90 days):**
```json
{
  "filter": [
    {"field": "warrantyExpirationDate", "op": "isNotNull"},
    {"field": "warrantyExpirationDate", "op": "lte", "value": "2024-05-15"},
    {"field": "warrantyExpirationDate", "op": "gte", "value": "2024-02-15"},
    {"field": "isActive", "op": "eq", "value": true}
  ]
}
```

**Servers by type and location:**
```json
{
  "filter": [
    {"field": "configurationItemType", "op": "eq", "value": 1},
    {"field": "companyLocationID", "op": "eq", "value": 99}
  ]
}
```

**CIs without RMM integration:**
```json
{
  "filter": [
    {"field": "rmmDeviceID", "op": "isNull"},
    {"field": "isActive", "op": "eq", "value": true},
    {"field": "configurationItemType", "op": "in", "value": [1, 2]}
  ]
}
```

### Updating a Configuration Item

```http
PATCH /v1.0/ConfigurationItems
Content-Type: application/json
```

**Retire an asset:**
```json
{
  "id": 12345,
  "isActive": false,
  "retirementDate": "2024-02-15"
}
```

**Update warranty information:**
```json
{
  "id": 12345,
  "warrantyExpirationDate": "2028-01-01"
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

```javascript
async function getExpiringWarranties(daysAhead = 90) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + daysAhead);

  const cis = await queryCIs({
    filter: [
      {field: 'warrantyExpirationDate', op: 'isNotNull'},
      {field: 'warrantyExpirationDate', op: 'lte', value: futureDate.toISOString().split('T')[0]},
      {field: 'isActive', op: 'eq', value: true}
    ],
    includeFields: ['Company.companyName']
  });

  return cis.map(ci => ({
    name: ci.referenceTitle,
    company: ci.companyName,
    expires: ci.warrantyExpirationDate,
    daysRemaining: Math.ceil(
      (new Date(ci.warrantyExpirationDate) - new Date()) / (1000 * 60 * 60 * 24)
    )
  })).sort((a, b) => a.daysRemaining - b.daysRemaining);
}
```

### Lifecycle Planning

```javascript
function calculateAssetAge(ci) {
  if (!ci.purchaseDate) return null;

  const purchase = new Date(ci.purchaseDate);
  const now = new Date();
  const ageYears = (now - purchase) / (1000 * 60 * 60 * 24 * 365);

  // Standard lifecycle recommendations
  const lifecycles = {
    server: 5,
    workstation: 4,
    networkDevice: 7,
    printer: 5
  };

  const expectedLife = lifecycles[ci.typeCategory] || 5;
  const remainingLife = expectedLife - ageYears;

  return {
    ageYears: Math.round(ageYears * 10) / 10,
    expectedLife,
    remainingLife: Math.round(remainingLife * 10) / 10,
    status: remainingLife <= 0 ? 'REPLACE' :
            remainingLife <= 1 ? 'PLAN_REPLACEMENT' :
            'HEALTHY'
  };
}
```

### RMM Sync Verification

```javascript
async function findUnmatchedAssets(companyId) {
  const cis = await queryCIs({
    filter: [
      {field: 'companyID', op: 'eq', value: companyId},
      {field: 'isActive', op: 'eq', value: true},
      {field: 'configurationItemType', op: 'in', value: [1, 2]} // Servers, workstations
    ]
  });

  return {
    withRMM: cis.filter(ci => ci.rmmDeviceID),
    withoutRMM: cis.filter(ci => !ci.rmmDeviceID),
    coverage: `${Math.round((cis.filter(ci => ci.rmmDeviceID).length / cis.length) * 100)}%`
  };
}
```

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
6. **Regular audits** - Verify CI accuracy quarterly
7. **Use categories** - Enable meaningful reporting
8. **Track purchase dates** - Lifecycle planning
9. **Associate contracts** - Enable billing automation
10. **Maintain DNS records** - Track hosted services

## Related Skills

- [Autotask Tickets](../tickets/SKILL.md) - Link tickets to CIs
- [Autotask Contracts](../contracts/SKILL.md) - Contract associations
- [Autotask CRM](../crm/SKILL.md) - Company and location management
- [Autotask API Patterns](../api-patterns/SKILL.md) - Query builder and authentication
