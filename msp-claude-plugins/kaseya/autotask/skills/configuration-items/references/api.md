# Autotask Configuration Items — Extended API Reference

## Creating a Configuration Item

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

## Query Patterns

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

## Updating a Configuration Item

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

## Billing Product Associations

### Association Fields

| Field | Type | Description |
|-------|------|-------------|
| `configurationItemID` | int | The CI |
| `productID` | int | Billing product |
| `quantity` | decimal | Quantity units |
| `unitPrice` | decimal | Price per unit |
| `effectiveDate` | date | Billing start date |

### Creating a Billing Association

```json
{
  "configurationItemID": 12345,
  "productID": 999,
  "quantity": 1,
  "unitPrice": 49.99,
  "effectiveDate": "2024-02-01"
}
```
