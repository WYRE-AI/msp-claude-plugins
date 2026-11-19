# node-halopsa

## Product Requirements Document

**Version:** 1.0
**Author:** Aaron / WYRE AI
**Date:** February 4, 2026
**Status:** Draft
**Repository:** `halopsa/node-halopsa`
**Parent Project:** MSP Claude Plugin Marketplace

---

## Executive Summary

`node-halopsa` is a comprehensive, fully-typed Node.js/TypeScript library providing complete coverage of the HaloPSA REST API. It follows the same architectural patterns established by the existing `node-autotask` library and serves as a core dependency for the HaloPSA ecosystem plugins within the MSP Claude Plugin Marketplace.

The library wraps all HaloPSA API endpoints across tickets, clients, sites, assets, contacts, items, contracts, and other PSA entities. It handles OAuth 2.0 Client Credentials authentication, automatic token refresh, pagination, rate limiting (500 req/3min), and ships with a full test suite using mocked API responses.

---

## Problem Statement

HaloPSA is a modern Professional Services Automation (PSA) platform with strong ITIL alignment, gaining significant traction in the MSP market. Its API uses OAuth 2.0 Client Credentials flow with tenant-specific URLs and has a moderately aggressive rate limit (500 requests per 3-minute rolling window).

While HaloPSA provides comprehensive API documentation, there is no production-quality Node.js library available. Building Claude plugins, web applications, and automation tools against HaloPSA requires a reliable, well-tested foundation library that handles OAuth token lifecycle, multi-tenant URL management, pagination, and rate limiting transparently.

---

## Goals

1. **Complete API coverage** — Every documented HaloPSA endpoint is implemented
2. **Strong TypeScript types** — Full type definitions for all requests, responses, and entity types
3. **OAuth 2.0 Client Credentials** — Automatic token acquisition, caching, and refresh
4. **Multi-tenant support** — Handle company-specific subdomains (`{company}.halopsa.com`)
5. **Automatic pagination** — Iterator/generator patterns for seamless multi-page retrieval
6. **Rate limit handling** — Built-in request throttling (500 req/3min) with HTTP 429 backoff
7. **Zero live API testing** — Full test suite with mocked HTTP responses
8. **Plugin-ready** — Designed for direct integration with Claude MCP plugins

---

## Technical Specifications

### Runtime & Dependencies

| Requirement | Value |
|---|---|
| Node.js | >= 18.0.0 |
| TypeScript | >= 5.0 |
| Module system | ESM with CJS compatibility |
| HTTP client | `undici` (Node built-in fetch) or `axios` |
| Test framework | Vitest |
| Mock server | MSW (Mock Service Worker) or `nock` |
| Build tool | `tsup` |

### Package Structure

```
node-halopsa/
├── src/
│   ├── index.ts                    # Public API exports
│   ├── client.ts                   # HaloPsaClient class
│   ├── config.ts                   # Configuration types & defaults
│   ├── errors.ts                   # Custom error classes
│   ├── http.ts                     # HTTP layer (fetch wrapper)
│   ├── auth.ts                     # OAuth 2.0 Client Credentials management
│   ├── pagination.ts               # Pagination utilities
│   ├── rate-limiter.ts             # Rate limiting logic
│   ├── types/
│   │   ├── index.ts                # Re-exports
│   │   ├── common.ts               # Shared types (pagination, filters)
│   │   ├── tickets.ts
│   │   ├── clients.ts
│   │   ├── sites.ts
│   │   ├── assets.ts
│   │   ├── contacts.ts
│   │   ├── items.ts
│   │   ├── contracts.ts
│   │   ├── invoices.ts
│   │   ├── quotes.ts
│   │   ├── projects.ts
│   │   ├── actions.ts
│   │   ├── appointments.ts
│   │   ├── opportunities.ts
│   │   ├── suppliers.ts
│   │   ├── agents.ts
│   │   ├── teams.ts
│   │   ├── custom-fields.ts
│   │   ├── software-licences.ts
│   │   ├── user-roles.ts
│   │   └── ...                     # One file per resource domain
│   └── resources/
│       ├── tickets.ts
│       ├── clients.ts
│       ├── sites.ts
│       ├── assets.ts
│       ├── contacts.ts
│       ├── items.ts
│       ├── contracts.ts
│       ├── invoices.ts
│       ├── quotes.ts
│       ├── projects.ts
│       ├── actions.ts
│       ├── appointments.ts
│       ├── opportunities.ts
│       ├── suppliers.ts
│       ├── agents.ts
│       ├── teams.ts
│       ├── custom-fields.ts
│       ├── software-licences.ts
│       ├── user-roles.ts
│       ├── ticket-types.ts
│       ├── statuses.ts
│       ├── priorities.ts
│       ├── categories.ts
│       ├── slas.ts
│       ├── recurring-invoices.ts
│       └── reports.ts
├── tests/
│   ├── setup.ts
│   ├── fixtures/
│   │   ├── auth/
│   │   │   ├── token-success.json
│   │   │   └── token-failure.json
│   │   ├── tickets/
│   │   ├── clients/
│   │   ├── sites/
│   │   ├── assets/
│   │   ├── contacts/
│   │   ├── items/
│   │   └── ...
│   ├── mocks/
│   │   ├── handlers.ts
│   │   └── server.ts
│   ├── unit/
│   │   ├── client.test.ts
│   │   ├── auth.test.ts
│   │   ├── pagination.test.ts
│   │   ├── rate-limiter.test.ts
│   │   └── ...
│   └── integration/
│       ├── tickets.test.ts
│       ├── clients.test.ts
│       ├── sites.test.ts
│       ├── assets.test.ts
│       ├── contacts.test.ts
│       ├── items.test.ts
│       └── ...
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── README.md
├── CHANGELOG.md
└── LICENSE
```

---

## Authentication

### OAuth 2.0 Client Credentials Flow

HaloPSA uses OAuth 2.0 Client Credentials flow. This differs from password-based OAuth flows in that it uses `client_id` and `client_secret` directly without user credentials.

### Configuration

```typescript
import { HaloPsaClient } from 'node-halopsa';

const client = new HaloPsaClient({
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret',
  tenant: 'yourcompany',              // Results in https://yourcompany.halopsa.com
  // OR explicit base URL:
  // baseUrl: 'https://yourcompany.halopsa.com',
  // Optional for multi-tenant applications:
  // tenantId: 'specific-tenant-id',
  scope: 'all',                        // default: 'all', options: 'all', 'edit:tickets', etc.
});
```

### Token Lifecycle Management

The `auth.ts` module handles:

1. **Initial token request**: POST to `https://{tenant}.halopsa.com/auth/token` with:
   - `grant_type=client_credentials`
   - `client_id={clientId}`
   - `client_secret={clientSecret}`
   - `scope={scope}` (default: `all`)
   - Optional: `tenant={tenantId}` for multi-tenant apps
2. **Token caching**: Store access token in memory with expiry tracking
3. **Automatic refresh**: When a request returns 401, or when the token is within 2 minutes of expiry, acquire a new token automatically
4. **Thread safety**: Prevent concurrent token refresh requests (single in-flight refresh)

```typescript
interface TokenInfo {
  accessToken: string;
  tokenType: string;       // 'Bearer'
  expiresAt: number;       // Unix timestamp (seconds)
  expiresIn: number;       // Seconds until expiry
  scope: string;
}
```

### Token Request/Response

**Request:**
```http
POST https://{tenant}.halopsa.com/auth/token
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials&client_id={clientId}&client_secret={clientSecret}&scope=all
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "all"
}
```

### URL Structure

| Component | URL |
|---|---|
| Base URL | `https://{tenant}.halopsa.com` |
| API Base | `https://{tenant}.halopsa.com/api` |
| Token Endpoint | `https://{tenant}.halopsa.com/auth/token` |

All API requests use the path: `{baseUrl}/api/...`

---

## Rate Limiting

HaloPSA enforces 500 requests per 3-minute rolling window (180 seconds). When exceeded, the API returns HTTP 429.

| Threshold | Behavior |
|---|---|
| < 400 requests (80%) | Normal operation |
| 400-499 requests | Proactive throttling (slow down) |
| 500+ requests | `429 Too Many Requests` |

### Implementation

```typescript
interface RateLimitConfig {
  enabled: boolean;              // default: true
  maxRequests: number;           // default: 500
  windowMs: number;              // default: 180000 (3 minutes)
  throttleThreshold: number;     // default: 0.8 (80% = 400 requests)
  retryAfterMs: number;          // default: 5000
  maxRetries: number;            // default: 3
}
```

The rate limiter must:
1. Track requests within the rolling 3-minute window
2. Start throttling (adding delays between requests) at 80% (400 requests)
3. On 429, back off with exponential delay
4. Parse `Retry-After` header when present
5. Expose current request count for monitoring

---

## Pagination

HaloPSA supports offset-based pagination with configurable page sizes. Responses include pagination metadata.

### Response Structure

```json
{
  "record_count": 1250,
  "tickets": [
    { "id": 1, "summary": "Example ticket", ... },
    ...
  ]
}
```

### Query Parameters

| Parameter | Description | Default |
|---|---|---|
| `page_size` | Number of records per page | 50 |
| `page_no` | Page number (1-indexed) | 1 |
| `count` | Include total record count | true |

### Automatic Pagination

```typescript
// Get a single page
const page1 = await client.tickets.list({ pageSize: 50, pageNo: 1 });

// Auto-paginate all results
for await (const ticket of client.tickets.listAll()) {
  console.log(ticket.summary);
}

// Collect all into array
const allTickets = await client.tickets.listAll().toArray();
```

### Implementation

The pagination system uses `record_count` and page math:
1. Fetch the first page with `count=true`
2. Calculate total pages from `record_count` and `page_size`
3. Continue fetching until all pages retrieved
4. Yield individual records from each page
5. Respect rate limits between page fetches

---

## Complete Endpoint Inventory

### Tickets

| Method | Endpoint | Library Method |
|---|---|---|
| GET | `/api/Tickets` | `client.tickets.list(params?)` |
| GET | `/api/Tickets/{id}` | `client.tickets.get(id)` |
| POST | `/api/Tickets` | `client.tickets.create(data)` |
| PUT | `/api/Tickets/{id}` | `client.tickets.update(id, data)` |
| DELETE | `/api/Tickets/{id}` | `client.tickets.delete(id)` |
| GET | `/api/Tickets/{id}/Actions` | `client.tickets.actions(id, params?)` |
| POST | `/api/Tickets/{id}/Actions` | `client.tickets.addAction(id, data)` |
| GET | `/api/Tickets/{id}/Attachments` | `client.tickets.attachments(id)` |
| POST | `/api/Tickets/{id}/Attachments` | `client.tickets.addAttachment(id, data)` |

### Actions (Ticket Activities)

| Method | Endpoint | Library Method |
|---|---|---|
| GET | `/api/Actions` | `client.actions.list(params?)` |
| GET | `/api/Actions/{id}` | `client.actions.get(id)` |
| POST | `/api/Actions` | `client.actions.create(data)` |
| PUT | `/api/Actions/{id}` | `client.actions.update(id, data)` |
| DELETE | `/api/Actions/{id}` | `client.actions.delete(id)` |

### Clients (Companies)

| Method | Endpoint | Library Method |
|---|---|---|
| GET | `/api/Client` | `client.clients.list(params?)` |
| GET | `/api/Client/{id}` | `client.clients.get(id)` |
| POST | `/api/Client` | `client.clients.create(data)` |
| PUT | `/api/Client/{id}` | `client.clients.update(id, data)` |
| DELETE | `/api/Client/{id}` | `client.clients.delete(id)` |

### Sites

| Method | Endpoint | Library Method |
|---|---|---|
| GET | `/api/Site` | `client.sites.list(params?)` |
| GET | `/api/Site/{id}` | `client.sites.get(id)` |
| POST | `/api/Site` | `client.sites.create(data)` |
| PUT | `/api/Site/{id}` | `client.sites.update(id, data)` |
| DELETE | `/api/Site/{id}` | `client.sites.delete(id)` |

### Assets (Configuration Items)

| Method | Endpoint | Library Method |
|---|---|---|
| GET | `/api/Asset` | `client.assets.list(params?)` |
| GET | `/api/Asset/{id}` | `client.assets.get(id)` |
| POST | `/api/Asset` | `client.assets.create(data)` |
| PUT | `/api/Asset/{id}` | `client.assets.update(id, data)` |
| DELETE | `/api/Asset/{id}` | `client.assets.delete(id)` |
| GET | `/api/AssetType` | `client.assetTypes.list(params?)` |
| GET | `/api/AssetType/{id}` | `client.assetTypes.get(id)` |

### Contacts (Users)

| Method | Endpoint | Library Method |
|---|---|---|
| GET | `/api/Users` | `client.contacts.list(params?)` |
| GET | `/api/Users/{id}` | `client.contacts.get(id)` |
| POST | `/api/Users` | `client.contacts.create(data)` |
| PUT | `/api/Users/{id}` | `client.contacts.update(id, data)` |
| DELETE | `/api/Users/{id}` | `client.contacts.delete(id)` |

### Items (Products/Services)

| Method | Endpoint | Library Method |
|---|---|---|
| GET | `/api/Item` | `client.items.list(params?)` |
| GET | `/api/Item/{id}` | `client.items.get(id)` |
| POST | `/api/Item` | `client.items.create(data)` |
| PUT | `/api/Item/{id}` | `client.items.update(id, data)` |
| DELETE | `/api/Item/{id}` | `client.items.delete(id)` |

### Contracts

| Method | Endpoint | Library Method |
|---|---|---|
| GET | `/api/ClientContract` | `client.contracts.list(params?)` |
| GET | `/api/ClientContract/{id}` | `client.contracts.get(id)` |
| POST | `/api/ClientContract` | `client.contracts.create(data)` |
| PUT | `/api/ClientContract/{id}` | `client.contracts.update(id, data)` |
| DELETE | `/api/ClientContract/{id}` | `client.contracts.delete(id)` |

### Invoices

| Method | Endpoint | Library Method |
|---|---|---|
| GET | `/api/Invoice` | `client.invoices.list(params?)` |
| GET | `/api/Invoice/{id}` | `client.invoices.get(id)` |
| POST | `/api/Invoice` | `client.invoices.create(data)` |
| PUT | `/api/Invoice/{id}` | `client.invoices.update(id, data)` |
| DELETE | `/api/Invoice/{id}` | `client.invoices.delete(id)` |
| POST | `/api/Invoice/{id}/Send` | `client.invoices.send(id)` |

### Quotes

| Method | Endpoint | Library Method |
|---|---|---|
| GET | `/api/Quotation` | `client.quotes.list(params?)` |
| GET | `/api/Quotation/{id}` | `client.quotes.get(id)` |
| POST | `/api/Quotation` | `client.quotes.create(data)` |
| PUT | `/api/Quotation/{id}` | `client.quotes.update(id, data)` |
| DELETE | `/api/Quotation/{id}` | `client.quotes.delete(id)` |
| POST | `/api/Quotation/{id}/Send` | `client.quotes.send(id)` |
| POST | `/api/Quotation/{id}/ConvertToInvoice` | `client.quotes.convertToInvoice(id)` |

### Projects

| Method | Endpoint | Library Method |
|---|---|---|
| GET | `/api/Projects` | `client.projects.list(params?)` |
| GET | `/api/Projects/{id}` | `client.projects.get(id)` |
| POST | `/api/Projects` | `client.projects.create(data)` |
| PUT | `/api/Projects/{id}` | `client.projects.update(id, data)` |
| DELETE | `/api/Projects/{id}` | `client.projects.delete(id)` |
| GET | `/api/Projects/{id}/Tasks` | `client.projects.tasks(id, params?)` |

### Appointments

| Method | Endpoint | Library Method |
|---|---|---|
| GET | `/api/Appointment` | `client.appointments.list(params?)` |
| GET | `/api/Appointment/{id}` | `client.appointments.get(id)` |
| POST | `/api/Appointment` | `client.appointments.create(data)` |
| PUT | `/api/Appointment/{id}` | `client.appointments.update(id, data)` |
| DELETE | `/api/Appointment/{id}` | `client.appointments.delete(id)` |

### Opportunities (Sales)

| Method | Endpoint | Library Method |
|---|---|---|
| GET | `/api/Opportunities` | `client.opportunities.list(params?)` |
| GET | `/api/Opportunities/{id}` | `client.opportunities.get(id)` |
| POST | `/api/Opportunities` | `client.opportunities.create(data)` |
| PUT | `/api/Opportunities/{id}` | `client.opportunities.update(id, data)` |
| DELETE | `/api/Opportunities/{id}` | `client.opportunities.delete(id)` |

### Suppliers

| Method | Endpoint | Library Method |
|---|---|---|
| GET | `/api/Supplier` | `client.suppliers.list(params?)` |
| GET | `/api/Supplier/{id}` | `client.suppliers.get(id)` |
| POST | `/api/Supplier` | `client.suppliers.create(data)` |
| PUT | `/api/Supplier/{id}` | `client.suppliers.update(id, data)` |
| DELETE | `/api/Supplier/{id}` | `client.suppliers.delete(id)` |

### Agents (Technicians)

| Method | Endpoint | Library Method |
|---|---|---|
| GET | `/api/Agent` | `client.agents.list(params?)` |
| GET | `/api/Agent/{id}` | `client.agents.get(id)` |
| POST | `/api/Agent` | `client.agents.create(data)` |
| PUT | `/api/Agent/{id}` | `client.agents.update(id, data)` |
| DELETE | `/api/Agent/{id}` | `client.agents.delete(id)` |

### Teams

| Method | Endpoint | Library Method |
|---|---|---|
| GET | `/api/Team` | `client.teams.list(params?)` |
| GET | `/api/Team/{id}` | `client.teams.get(id)` |
| POST | `/api/Team` | `client.teams.create(data)` |
| PUT | `/api/Team/{id}` | `client.teams.update(id, data)` |
| DELETE | `/api/Team/{id}` | `client.teams.delete(id)` |

### Software Licences (Subscriptions)

| Method | Endpoint | Library Method |
|---|---|---|
| GET | `/api/SoftwareLicence` | `client.softwareLicences.list(params?)` |
| GET | `/api/SoftwareLicence/{id}` | `client.softwareLicences.get(id)` |
| POST | `/api/SoftwareLicence` | `client.softwareLicences.create(data)` |
| PUT | `/api/SoftwareLicence/{id}` | `client.softwareLicences.update(id, data)` |
| DELETE | `/api/SoftwareLicence/{id}` | `client.softwareLicences.delete(id)` |

### Ticket Types

| Method | Endpoint | Library Method |
|---|---|---|
| GET | `/api/TicketType` | `client.ticketTypes.list(params?)` |
| GET | `/api/TicketType/{id}` | `client.ticketTypes.get(id)` |

### Statuses

| Method | Endpoint | Library Method |
|---|---|---|
| GET | `/api/Status` | `client.statuses.list(params?)` |
| GET | `/api/Status/{id}` | `client.statuses.get(id)` |

### Priorities

| Method | Endpoint | Library Method |
|---|---|---|
| GET | `/api/Priority` | `client.priorities.list(params?)` |
| GET | `/api/Priority/{id}` | `client.priorities.get(id)` |

### Categories

| Method | Endpoint | Library Method |
|---|---|---|
| GET | `/api/Category` | `client.categories.list(params?)` |
| GET | `/api/Category/{id}` | `client.categories.get(id)` |

### SLAs

| Method | Endpoint | Library Method |
|---|---|---|
| GET | `/api/SLA` | `client.slas.list(params?)` |
| GET | `/api/SLA/{id}` | `client.slas.get(id)` |

### Custom Fields

| Method | Endpoint | Library Method |
|---|---|---|
| GET | `/api/FieldInfo` | `client.customFields.list(params?)` |
| GET | `/api/FieldInfo/{id}` | `client.customFields.get(id)` |

### User Roles

| Method | Endpoint | Library Method |
|---|---|---|
| GET | `/api/Role` | `client.userRoles.list(params?)` |
| GET | `/api/Role/{id}` | `client.userRoles.get(id)` |

### Reports

| Method | Endpoint | Library Method |
|---|---|---|
| GET | `/api/Report` | `client.reports.list(params?)` |
| GET | `/api/Report/{id}` | `client.reports.get(id)` |
| POST | `/api/Report/{id}/Run` | `client.reports.run(id, params?)` |

### Knowledge Base

| Method | Endpoint | Library Method |
|---|---|---|
| GET | `/api/KBArticle` | `client.knowledgeBase.list(params?)` |
| GET | `/api/KBArticle/{id}` | `client.knowledgeBase.get(id)` |
| POST | `/api/KBArticle` | `client.knowledgeBase.create(data)` |
| PUT | `/api/KBArticle/{id}` | `client.knowledgeBase.update(id, data)` |
| DELETE | `/api/KBArticle/{id}` | `client.knowledgeBase.delete(id)` |

### Recurring Invoices

| Method | Endpoint | Library Method |
|---|---|---|
| GET | `/api/RecurringInvoice` | `client.recurringInvoices.list(params?)` |
| GET | `/api/RecurringInvoice/{id}` | `client.recurringInvoices.get(id)` |
| POST | `/api/RecurringInvoice` | `client.recurringInvoices.create(data)` |
| PUT | `/api/RecurringInvoice/{id}` | `client.recurringInvoices.update(id, data)` |
| DELETE | `/api/RecurringInvoice/{id}` | `client.recurringInvoices.delete(id)` |

---

## Key Entity Types

### Ticket

```typescript
interface Ticket {
  id: number;
  summary: string;
  details: string;
  client_id: number;
  client_name?: string;
  site_id?: number;
  site_name?: string;
  user_id?: number;
  user_name?: string;
  agent_id?: number;
  agent_name?: string;
  team_id?: number;
  team_name?: string;
  tickettype_id: number;
  tickettype_name?: string;
  status_id: number;
  status_name?: string;
  priority_id: number;
  priority_name?: string;
  category_1?: string;
  category_2?: string;
  category_3?: string;
  category_4?: string;
  sla_id?: number;
  sla_name?: string;
  dateoccurred: string;           // ISO datetime
  datecreated: string;
  datelastupdate?: string;
  deadlinedate?: string;
  responsedate?: string;
  resolutiondate?: string;
  closeddate?: string;
  customfields?: CustomField[];
  // ... additional fields
}
```

### Client

```typescript
interface Client {
  id: number;
  name: string;
  inactive: boolean;
  toplevel_id?: number;
  main_site_id?: number;
  website?: string;
  notes?: string;
  phonenumber?: string;
  email?: string;
  colour?: string;
  customfields?: CustomField[];
  // ... additional fields
}
```

### Site

```typescript
interface Site {
  id: number;
  name: string;
  client_id: number;
  client_name?: string;
  inactive: boolean;
  phonenumber?: string;
  addressline1?: string;
  addressline2?: string;
  addressline3?: string;
  addressline4?: string;
  postcode?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  customfields?: CustomField[];
  // ... additional fields
}
```

### Asset

```typescript
interface Asset {
  id: number;
  inventory_number?: string;
  assettype_id: number;
  assettype_name?: string;
  client_id: number;
  client_name?: string;
  site_id?: number;
  site_name?: string;
  user_id?: number;
  user_name?: string;
  key_field?: string;
  key_field2?: string;
  key_field3?: string;
  status_id?: number;
  status_name?: string;
  inactive: boolean;
  datepurchased?: string;
  warrantyexpires?: string;
  notes?: string;
  customfields?: CustomField[];
  // ... additional fields
}
```

### Contact (User)

```typescript
interface Contact {
  id: number;
  name: string;
  emailaddress?: string;
  phonenumber?: string;
  mobilephone?: string;
  client_id: number;
  client_name?: string;
  site_id?: number;
  site_name?: string;
  inactive: boolean;
  isimportantcontact: boolean;
  isserviceaccount: boolean;
  notes?: string;
  customfields?: CustomField[];
  // ... additional fields
}
```

### Custom Field

```typescript
interface CustomField {
  id: number;
  name: string;
  label?: string;
  value: string | number | boolean | null;
  type: 'text' | 'number' | 'date' | 'checkbox' | 'dropdown' | 'multiline';
}
```

---

## Filtering & Query Parameters

HaloPSA supports extensive filtering via query parameters:

```typescript
// Direct filter params
const tickets = await client.tickets.list({
  client_id: 123,
  status_id: 1,
  agent_id: 45,
  tickettype_id: 2,
  dateoccurred_start: '2025-01-01',
  dateoccurred_end: '2025-12-31',
  search: 'network issue',
  pageSize: 100,
  pageNo: 1,
  order: 'dateoccurred',
  orderdesc: true,
  includedetails: true,
  includeactions: false,
});
```

### Common Query Parameters

| Parameter | Description | Example |
|---|---|---|
| `page_size` | Records per page | `50` |
| `page_no` | Page number (1-indexed) | `1` |
| `order` | Sort field | `datecreated` |
| `orderdesc` | Sort descending | `true` |
| `search` | Full-text search | `"network"` |
| `count` | Include total count | `true` |
| `includedetails` | Include full entity details | `true` |
| `includeactions` | Include related actions | `false` |

### Entity-Specific Filters

Each entity type supports relevant filters:

**Tickets:**
- `client_id`, `site_id`, `user_id`, `agent_id`, `team_id`
- `status_id`, `priority_id`, `tickettype_id`, `category_1`
- `dateoccurred_start`, `dateoccurred_end`
- `open_only`, `closed_only`

**Assets:**
- `client_id`, `site_id`, `user_id`, `assettype_id`, `status_id`
- `inactive`

**Invoices:**
- `client_id`, `status`, `invoice_date_start`, `invoice_date_end`
- `sent`, `paid`

---

## Error Handling

### Error Classes

```typescript
class HaloPsaError extends Error {
  statusCode: number;
  response: any;
}

class HaloPsaAuthenticationError extends HaloPsaError {}   // 400, 401
class HaloPsaForbiddenError extends HaloPsaError {}         // 403
class HaloPsaNotFoundError extends HaloPsaError {}          // 404
class HaloPsaValidationError extends HaloPsaError {         // 400 (validation)
  errors: Array<{ field: string; message: string }>;
}
class HaloPsaRateLimitError extends HaloPsaError {}         // 429
class HaloPsaServerError extends HaloPsaError {}            // 500+
```

### Error Behavior

- **400** (token request): Throw `HaloPsaAuthenticationError` — bad credentials
- **400** (validation): Throw `HaloPsaValidationError` with parsed error details
- **401**: Attempt token refresh once, then throw `HaloPsaAuthenticationError`
- **403**: Throw `HaloPsaForbiddenError` — insufficient permissions (hybrid permission model)
- **404**: Throw `HaloPsaNotFoundError`
- **429**: Back off with exponential delay, respect `Retry-After` header, throw `HaloPsaRateLimitError`
- **500+**: Retry once, then throw `HaloPsaServerError`

---

## Hybrid Permission Model

HaloPSA uses a hybrid permission model where access is controlled by both:
1. **Application permissions** — Defined when creating the API application
2. **Agent permissions** — The underlying agent account's access level

Both must allow the operation. The library should surface clear errors when permission is denied.

```typescript
// Check current authenticated context
const me = await client.agents.me();
console.log(me.permissions); // Agent's permission set
```

---

## Test Strategy

### Principles

1. **Zero live API calls** — All tests use mocked HTTP responses
2. **Fixture-based** — JSON response fixtures match real HaloPSA response structures
3. **Coverage targets** — Minimum 90% line coverage, 100% of public methods tested
4. **OAuth flow testing** — Token acquisition, caching, refresh, and failure paths
5. **Rate limit testing** — 429 retry with backoff
6. **Pagination testing** — Multi-page scenarios with record_count tracking

### Mock Architecture

```typescript
// tests/mocks/handlers.ts
import { http, HttpResponse } from 'msw';

const BASE = 'https://testcompany.halopsa.com';

export const handlers = [
  // OAuth token endpoint
  http.post(`${BASE}/auth/token`, async ({ request }) => {
    const body = await request.text();
    if (body.includes('bad-client-id')) {
      return HttpResponse.json({ error: 'invalid_client' }, { status: 400 });
    }
    return HttpResponse.json({
      access_token: 'mock-jwt-token',
      token_type: 'Bearer',
      expires_in: 3600,
      scope: 'all',
    });
  }),

  // Tickets list
  http.get(`${BASE}/api/Tickets`, ({ request }) => {
    const url = new URL(request.url);
    const page = url.searchParams.get('page_no') || '1';
    return HttpResponse.json(fixtures.tickets[`page${page}`]);
  }),

  // Tickets get
  http.get(`${BASE}/api/Tickets/:id`, ({ params }) => {
    return HttpResponse.json(fixtures.tickets.single);
  }),

  // Rate limit simulation
  http.get(`${BASE}/api/rate-limited`, () => {
    return new HttpResponse(null, {
      status: 429,
      headers: { 'Retry-After': '60' },
    });
  }),
];
```

### Test Categories

| Category | Description | Example Tests |
|---|---|---|
| **Unit — Auth** | OAuth 2.0 flow | Token acquisition, caching, refresh on 401, bad credentials |
| **Unit — Client** | Client initialization | Tenant URL construction, config validation |
| **Unit — Pagination** | Record count traversal | Page calculation, empty results, single page |
| **Unit — Rate Limiter** | Throttling & backoff | 429 retry, Retry-After parsing, threshold detection |
| **Integration — Tickets** | Ticket operations | CRUD, actions, attachments, filtering |
| **Integration — Clients** | Client operations | CRUD, related sites, contacts |
| **Integration — Sites** | Site operations | CRUD, related assets |
| **Integration — Assets** | Asset operations | CRUD, asset types |
| **Integration — Contacts** | Contact operations | CRUD, filtering |
| **Integration — Items** | Item operations | CRUD |
| **Integration — Contracts** | Contract operations | CRUD |
| **Integration — Invoices** | Invoice operations | CRUD, send |
| **Integration — Quotes** | Quote operations | CRUD, send, convert |
| **Integration — Projects** | Project operations | CRUD, tasks |
| **Integration — Reference** | Reference data | Types, statuses, priorities, categories |

### Fixture Structure

```
tests/fixtures/
├── auth/
│   ├── token-success.json
│   └── token-failure.json
├── tickets/
│   ├── list-page1.json
│   ├── list-page2.json
│   ├── single.json
│   ├── created.json
│   ├── actions.json
│   └── errors/
│       ├── not-found.json
│       └── validation.json
├── clients/
│   ├── list.json
│   ├── single.json
│   └── created.json
├── sites/
│   ├── list.json
│   ├── single.json
│   └── created.json
├── assets/
│   ├── list.json
│   ├── single.json
│   ├── asset-types.json
│   └── created.json
├── contacts/
│   ├── list.json
│   ├── single.json
│   └── created.json
├── items/
│   ├── list.json
│   └── single.json
├── contracts/
│   ├── list.json
│   └── single.json
├── invoices/
│   ├── list.json
│   └── single.json
├── quotes/
│   ├── list.json
│   └── single.json
└── reference/
    ├── ticket-types.json
    ├── statuses.json
    ├── priorities.json
    └── categories.json
```

---

## Usage Examples

### Basic CRUD Operations

```typescript
import { HaloPsaClient } from 'node-halopsa';

const client = new HaloPsaClient({
  clientId: process.env.HALOPSA_CLIENT_ID!,
  clientSecret: process.env.HALOPSA_CLIENT_SECRET!,
  tenant: process.env.HALOPSA_TENANT!,
});

// List tickets for a client
const tickets = await client.tickets.list({
  client_id: 123,
  open_only: true,
  pageSize: 50,
});

// Get a specific ticket
const ticket = await client.tickets.get(456);

// Create a new ticket
const newTicket = await client.tickets.create({
  summary: 'Network connectivity issue',
  details: 'User cannot access shared drives',
  client_id: 123,
  tickettype_id: 1,
  status_id: 1,
  priority_id: 2,
});

// Update a ticket
await client.tickets.update(newTicket.id, {
  status_id: 2,
  agent_id: 45,
});

// Add an action/note
await client.tickets.addAction(newTicket.id, {
  note: 'Investigating network connectivity',
  outcome: 'In Progress',
  timetaken: 15,
});
```

### Pagination

```typescript
// Auto-paginate all open tickets
for await (const ticket of client.tickets.listAll({ open_only: true })) {
  console.log(ticket.id, ticket.summary);
}

// Collect all assets for a client
const assets = await client.assets.listAll({ client_id: 123 }).toArray();
```

### Working with Clients and Sites

```typescript
// Create a new client
const newClient = await client.clients.create({
  name: 'Acme Corporation',
  website: 'https://acme.com',
  phonenumber: '+1 555-1234',
});

// Add a site to the client
const site = await client.sites.create({
  name: 'Headquarters',
  client_id: newClient.id,
  addressline1: '123 Main St',
  postcode: '12345',
});

// Add a contact at the site
const contact = await client.contacts.create({
  name: 'John Smith',
  emailaddress: 'john.smith@acme.com',
  client_id: newClient.id,
  site_id: site.id,
  isimportantcontact: true,
});
```

### Working with Assets

```typescript
// Get asset types
const assetTypes = await client.assetTypes.list();

// Create a new asset
const asset = await client.assets.create({
  key_field: 'LAPTOP-001',
  assettype_id: assetTypes.find(t => t.name === 'Laptop')!.id,
  client_id: 123,
  site_id: 456,
  user_id: 789,
  notes: 'Dell XPS 15, assigned to John Smith',
});
```

### Invoicing

```typescript
// Create an invoice
const invoice = await client.invoices.create({
  client_id: 123,
  invoicedate: '2026-02-01',
  items: [
    { item_id: 1, quantity: 2, unitprice: 100 },
    { item_id: 2, quantity: 1, unitprice: 50 },
  ],
});

// Send the invoice
await client.invoices.send(invoice.id);
```

---

## Implementation Phases

### Phase 1 — Core Foundation
- Client class with config and tenant URL construction
- OAuth 2.0 Client Credentials token management (acquire, cache, refresh)
- HTTP layer with auth header injection
- Rate limiter (500 req/3min)
- Pagination utilities
- Error classes
- Tickets CRUD (reference implementation)
- Full test infrastructure with mocks

### Phase 2 — Client Management
- Clients CRUD
- Sites CRUD
- Contacts CRUD
- All related filtering and pagination

### Phase 3 — Asset Management
- Assets CRUD
- Asset Types
- Software Licences

### Phase 4 — Service Delivery
- Actions (ticket activities)
- Appointments
- Projects and Tasks
- Knowledge Base

### Phase 5 — Financial
- Items (Products/Services)
- Contracts
- Invoices (CRUD, send)
- Quotes (CRUD, send, convert)
- Recurring Invoices

### Phase 6 — Reference Data & Admin
- Ticket Types, Statuses, Priorities, Categories
- SLAs
- Agents, Teams
- User Roles
- Custom Fields
- Reports

### Phase 7 — Polish & Release
- README documentation with examples
- CHANGELOG
- NPM publish configuration
- CI/CD pipeline (GitHub Actions)
- 90%+ test coverage verification

---

## Acceptance Criteria

1. Every endpoint in the inventory has a corresponding library method
2. Every library method has at least one passing test
3. OAuth 2.0 Client Credentials token lifecycle works correctly (acquire, cache, auto-refresh)
4. Multi-tenant URL construction works for any company subdomain
5. Pagination correctly calculates pages from `record_count`
6. Rate limiter prevents exceeding 500 req/3min and handles HTTP 429 with backoff
7. Hybrid permission model errors are surfaced clearly
8. Custom fields are properly typed and handled
9. No test makes a live API call
10. TypeScript strict mode compiles with zero errors
11. Test coverage >= 90%
