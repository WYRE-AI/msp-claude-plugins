---
name: "Microsoft 365 Licensing"
description: >
  Use this skill when managing Microsoft 365 licenses - checking available seats,
  assigning or removing licenses, auditing license usage, finding unused licenses,
  or planning license optimization for a customer tenant. Covers SKUs, service
  plans, and license cost efficiency for MSP account management.
when_to_use: >-
  When managing Microsoft 365 licenses - checking available seats, assigning or removing licenses,
  auditing license usage, finding unused licenses. Use when: m365 license, microsoft 365 license,
  m365 seats, m365 sku, license audit, license usage m365, unused license m365, license assignment
  m365, m365 subscription, or license optimization.
---

# Microsoft 365 Licensing

## Overview

M365 licensing is a top billing concern for MSPs. Licenses are purchased as SKU subscriptions, each containing bundles of service plans (Exchange, Teams, SharePoint, etc.). Efficient license management — finding unused seats, rightsizing SKUs, ensuring all users have what they need — directly impacts both the MSP's margin and the customer's costs.

## Core Concepts

### Subscription → SKU → Service Plans

```
M365 Business Premium (subscription)
  └── GUID: cbdc14ab-d96c-4c30-b9f4-6ada7cdc1d46
       ├── Exchange Online (service plan)
       ├── Microsoft Teams (service plan)
       ├── SharePoint Online (service plan)
       ├── Intune (service plan)
       └── Entra ID P1 (service plan)
```

### License States

| State | Meaning |
|-------|---------|
| `Enabled` | Service plan is active and usable |
| `Disabled` | Plan is turned off for this user (license still assigned) |
| `Error` | Assignment failed — usually missing `usageLocation` |
| `LockedOut` | Tenant billing issue |
| `PendingInput` | Waiting for additional configuration |

## Graph API Patterns

### Get All SKUs Available in Tenant

```http
GET /v1.0/subscribedSkus?$select=skuPartNumber,skuId,consumedUnits,prepaidUnits,servicePlans
```

**Response:**
```json
{
  "value": [
    {
      "skuPartNumber": "SPE_E3",
      "skuId": "05e9a617-0261-4cee-bb44-138d3ef5d965",
      "consumedUnits": 42,
      "prepaidUnits": {
        "enabled": 50,
        "suspended": 0,
        "warning": 0
      },
      "servicePlans": [...]
    }
  ]
}
```

**Available seats = `prepaidUnits.enabled` - `consumedUnits`**

### Get All Users With Their Assigned Licenses

```http
GET /v1.0/users?$select=id,displayName,userPrincipalName,accountEnabled,assignedLicenses,usageLocation&$top=999
```

### Find Users With a Specific License

Filter by SKU GUID:
```http
GET /v1.0/users?$filter=assignedLicenses/any(x:x/skuId eq cbdc14ab-d96c-4c30-b9f4-6ada7cdc1d46)&$select=id,displayName,userPrincipalName,accountEnabled
```

### Find Unlicensed Users

```http
GET /v1.0/users?$filter=assignedLicenses/$count eq 0&$count=true&$select=id,displayName,userPrincipalName,accountEnabled
```
> Requires `ConsistencyLevel: eventual` header and `$count=true`

### Assign a License to a User

```http
POST /v1.0/users/{userId}/assignLicense
Content-Type: application/json

{
  "addLicenses": [
    {
      "skuId": "cbdc14ab-d96c-4c30-b9f4-6ada7cdc1d46",
      "disabledPlans": []
    }
  ],
  "removeLicenses": []
}
```

> `usageLocation` must be set on the user before assigning. Use `PATCH /v1.0/users/{id}` with `"usageLocation": "US"` first.

### Remove a License from a User

```http
POST /v1.0/users/{userId}/assignLicense
Content-Type: application/json

{
  "addLicenses": [],
  "removeLicenses": ["cbdc14ab-d96c-4c30-b9f4-6ada7cdc1d46"]
}
```

### Disable Specific Service Plans (Partial License)

Assign a license but disable specific plans (e.g., give E3 without Teams):

```http
POST /v1.0/users/{userId}/assignLicense
Content-Type: application/json

{
  "addLicenses": [
    {
      "skuId": "05e9a617-0261-4cee-bb44-138d3ef5d965",
      "disabledPlans": ["57ff2da0-773e-42df-b2af-ffb7a2317929"]
    }
  ],
  "removeLicenses": []
}
```

## License Audit Workflow

### Step 1: Inventory Available SKUs

Pull `subscribedSkus` and calculate:
- Total purchased per SKU
- Consumed seats
- Available seats
- SKUs in `warning` state (near renewal, overallocated)

### Step 2: Cross-Reference With Active Users

Find licenses assigned to disabled accounts — these are reclaim candidates:

```http
GET /v1.0/users?$filter=accountEnabled eq false and assignedLicenses/$count ne 0&$count=true&$select=id,displayName,userPrincipalName,assignedLicenses
```

### Step 3: Find Inactive Licensed Users

Users licensed but not signing in (90+ days):
```http
GET /v1.0/users?$filter=accountEnabled eq true&$select=id,displayName,userPrincipalName,assignedLicenses,signInActivity
```
Filter results where `signInActivity.lastSignInDateTime < (today - 90 days)`.

### Step 4: Produce Optimization Report

| Optimization | Estimated Saving |
|--------------|----------------|
| Remove licenses from disabled accounts | # disabled × monthly seat cost |
| Downgrade inactive users to lighter SKU | SKU price delta × count |
| Recover unused purchased seats | (purchased - consumed) seats available |

## Common SKU GUIDs Reference

| SKU Part Number | GUID | Notes |
|-----------------|------|-------|
| `SPE_E3` | `05e9a617-0261-4cee-bb44-138d3ef5d965` | M365 E3 |
| `SPE_E5` | `06ebc4ee-1bb5-47dd-8120-11324bc54e06` | M365 E5 |
| `O365_BUSINESS_PREMIUM` | `cbdc14ab-d96c-4c30-b9f4-6ada7cdc1d46` | M365 Business Premium |
| `ENTERPRISEPACK` | `6fd2c87f-b296-42f0-b197-1e91e994b900` | Office 365 E3 |
| `AAD_PREMIUM` | `078d2b04-f1bd-4111-bbd4-b4b1b354cef4` | Entra ID P1 |
| `AAD_PREMIUM_P2` | `84a661c4-e949-4bd2-a560-ed7766fcaf2b` | Entra ID P2 |
| `EMS` | `efccb6f7-5641-4e0e-bd10-b4976e1bf68e` | EMS E3 |

## Error Handling

| Error | Cause | Resolution |
|-------|-------|------------|
| `LicenseAssignmentError` | No `usageLocation` on user | Set `usageLocation` first |
| `MutuallyExclusiveLicenses` | Two conflicting SKUs | Remove old SKU before assigning new |
| `Request_ResourceNotFound` | Invalid SKU GUID | Verify GUID against `subscribedSkus` |
| `Authorization_RequestDenied` | Missing `Directory.ReadWrite.All` | Grant admin consent |

## Permissions Required

| Task | Microsoft Graph Permission |
|------|---------------------------|
| View subscribed SKUs | `Directory.Read.All` |
| View user licenses | `User.Read.All` |
| Assign/remove licenses | `User.ReadWrite.All` or `Directory.ReadWrite.All` |
| Sign-in activity | `AuditLog.Read.All` |

## Related Skills

- [M365 Users](../users/SKILL.md) - User management and usageLocation
- [M365 Security](../security/SKILL.md) - License impact on security features (P1/P2)
- [M365 API Patterns](../api-patterns/SKILL.md) - Advanced filter, count queries
