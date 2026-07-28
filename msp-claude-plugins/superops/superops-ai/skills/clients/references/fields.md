# SuperOps.ai Client Field Reference

## Core Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `accountId` | ID | System | Unique identifier |
| `name` | String | Yes | Client/company name |
| `stage` | Enum | No | Lead, Prospect, Customer, Churned |
| `status` | Enum | No | Active, Inactive, Archived |
| `emailDomains` | [String] | No | Associated email domains |
| `website` | String | No | Company website |
| `phone` | String | No | Primary phone number |

## Business Fields

| Field | Type | Description |
|-------|------|-------------|
| `industry` | String | Industry type |
| `employeeCount` | Int | Number of employees |
| `annualRevenue` | Decimal | Annual revenue |
| `accountManager` | Technician | Assigned account manager |
| `primaryContact` | Contact | Main point of contact |

## Address Fields

| Field | Type | Description |
|-------|------|-------------|
| `address` | String | Street address |
| `city` | String | City |
| `state` | String | State/province |
| `country` | String | Country |
| `postalCode` | String | ZIP/postal code |

## Client Stage Values

| Stage | Description |
|-------|-------------|
| **Lead** | Prospective client |
| **Prospect** | Qualified lead |
| **Customer** | Active paying client |
| **Churned** | Former client |

## Client Status Values

| Status | Description |
|--------|-------------|
| **Active** | Current client |
| **Inactive** | Temporarily suspended |
| **Archived** | No longer serviced |
