# HaloPSA Client Field Reference

## Client

The primary entity representing a customer organization.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | int | System | Unique identifier |
| `name` | string(255) | Yes | Official company name |
| `client_to_invoice` | int | No | Parent company for billing |
| `toplevel_id` | int | No | Top-level parent in hierarchy |
| `inactive` | bool | No | Active/inactive status |
| `main_site_id` | int | No | Primary site reference |

### Client Contact Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `emailaddress` | string | No | Primary email |
| `phonenumber` | string | No | Main phone |
| `website` | string | No | Website URL |
| `accountmanager_id` | int | No | Assigned account manager |

### Client Billing Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `colour` | string | No | Client color code (hex) |
| `notes` | text | No | Internal notes |
| `taxcode` | string | No | Tax identifier |
| `currency_code` | string | No | Billing currency |
| `payment_terms` | int | No | Payment terms (days) |

## Client Types

HaloPSA supports client classification through custom fields and categories. Common patterns:

| Type | Description | Use Case |
|------|-------------|----------|
| Customer | Active paying client | Full service |
| Prospect | Potential customer | Sales pipeline |
| Lead | Marketing qualified | Pre-sales |
| Partner | Strategic partner | Collaboration |
| Vendor | Supplier | Procurement |

## Sites (Locations)

Sites represent physical locations for a client.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | int | System | Unique identifier |
| `client_id` | int | Yes | Parent client |
| `name` | string(255) | Yes | Site name |
| `line1` | string | No | Address line 1 |
| `line2` | string | No | Address line 2 |
| `line3` | string | No | Address line 3 |
| `line4` | string | No | City |
| `postcode` | string | No | Postal/ZIP code |
| `country` | string | No | Country |
| `phonenumber` | string | No | Site phone |
| `main_site` | bool | No | Is primary site |
| `inactive` | bool | No | Active status |

## Contacts (Users)

Contacts (also called Users in HaloPSA) are individuals at a client organization.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | int | System | Unique identifier |
| `client_id` | int | Yes | Associated client |
| `site_id` | int | No | Associated site |
| `name` | string(255) | Yes | Full name |
| `firstname` | string | No | First name |
| `surname` | string | No | Last name |
| `emailaddress` | string | No | Email address |
| `phonenumber` | string | No | Direct phone |
| `mobilenumber` | string | No | Mobile phone |
| `jobtitle` | string | No | Job title |
| `inactive` | bool | No | Active status |
| `isimportantcontact` | bool | No | VIP flag |
