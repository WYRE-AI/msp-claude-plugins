# node-syncro

## Product Requirements Document

**Version:** 1.0
**Author:** Aaron / WYRE AI
**Date:** February 4, 2026
**Status:** Draft
**Repository:** `syncro/node-syncro`
**Parent Project:** MSP Claude Plugin Marketplace

---

## Executive Summary

`node-syncro` is a comprehensive, fully-typed Node.js/TypeScript library providing complete coverage of the Syncro MSP API. It follows the same architectural patterns established by the existing `node-autotask` library and serves as a core dependency for the Syncro ecosystem plugins within the MSP Claude Plugin Marketplace.

Syncro is a combined PSA (Professional Services Automation) and RMM (Remote Monitoring & Management) platform designed for MSPs. The library wraps all 30+ Syncro API endpoints across customers, contacts, tickets, assets, invoices, estimates, contracts, appointments, and more. It handles API token authentication, automatic pagination, rate limiting (180 req/min), and ships with a full test suite using mocked API responses.

---

## Problem Statement

Syncro MSP is an increasingly popular all-in-one platform combining PSA and RMM capabilities for managed service providers. Its REST API with OpenAPI/Swagger specification provides access to core business objects but lacks official Node.js SDK support. Existing community libraries are incomplete or unmaintained.

Building Claude plugins and automation tools against Syncro requires a reliable, well-tested foundation library that handles authentication, pagination, rate limiting, and response normalization transparently.

---

## Goals

1. **Complete API coverage** — Every documented Syncro API endpoint is implemented
2. **Strong TypeScript types** — Full type definitions for all request/response payloads
3. **Simple authentication** — API key passed as query parameter with automatic injection
4. **Automatic pagination** — Iterator/generator patterns for seamless multi-page retrieval
5. **Rate limit handling** — Built-in request throttling (180 req/min) with backoff
6. **Zero live API testing** — Full test suite with mocked HTTP responses
7. **Plugin-ready** — Designed for direct integration with Claude MCP plugins

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
node-syncro/
├── src/
│   ├── index.ts                    # Public API exports
│   ├── client.ts                   # SyncroClient class
│   ├── config.ts                   # Configuration types & defaults
│   ├── errors.ts                   # Custom error classes
│   ├── http.ts                     # HTTP layer (fetch wrapper)
│   ├── pagination.ts               # Pagination utilities
│   ├── rate-limiter.ts             # Rate limiting logic
│   ├── types/
│   │   ├── index.ts                # Re-exports
│   │   ├── common.ts               # Shared types (pagination, filters, etc.)
│   │   ├── customers.ts
│   │   ├── contacts.ts
│   │   ├── tickets.ts
│   │   ├── assets.ts
│   │   ├── invoices.ts
│   │   ├── estimates.ts
│   │   ├── contracts.ts
│   │   ├── appointments.ts
│   │   ├── products.ts
│   │   ├── payments.ts
│   │   ├── line-items.ts
│   │   ├── ticket-timers.ts
│   │   ├── rmm-alerts.ts
│   │   ├── leads.ts
│   │   ├── canned-responses.ts
│   │   ├── ticket-problem-types.ts
│   │   └── wiki-pages.ts
│   └── resources/
│       ├── customers.ts
│       ├── contacts.ts
│       ├── tickets.ts
│       ├── assets.ts
│       ├── invoices.ts
│       ├── estimates.ts
│       ├── contracts.ts
│       ├── appointments.ts
│       ├── products.ts
│       ├── payments.ts
│       ├── line-items.ts
│       ├── ticket-timers.ts
│       ├── rmm-alerts.ts
│       ├── leads.ts
│       ├── canned-responses.ts
│       ├── ticket-problem-types.ts
│       └── wiki-pages.ts
├── tests/
│   ├── setup.ts                    # Test setup, mock server config
│   ├── fixtures/                   # JSON response fixtures
│   │   ├── customers/
│   │   ├── contacts/
│   │   ├── tickets/
│   │   ├── assets/
│   │   ├── invoices/
│   │   └── ...
│   ├── mocks/                      # MSW/nock handler definitions
│   │   ├── handlers.ts
│   │   └── server.ts
│   ├── unit/
│   │   ├── client.test.ts
│   │   ├── pagination.test.ts
│   │   ├── rate-limiter.test.ts
│   │   └── ...
│   └── integration/
│       ├── customers.test.ts
│       ├── contacts.test.ts
│       ├── tickets.test.ts
│       ├── assets.test.ts
│       ├── invoices.test.ts
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

### API Key Authentication

Syncro uses simple API token authentication passed as a query parameter.

### Configuration

```typescript
import { SyncroClient } from 'node-syncro';

const client = new SyncroClient({
  apiKey: 'YOUR_API_KEY',
  subdomain: 'your-company',    // Results in: https://your-company.syncromsp.com
  // OR explicit base URL:
  // baseUrl: 'https://your-company.syncromsp.com',
});
```

### Implementation Details

All requests include the API key as a query parameter:

```
GET https://{subdomain}.syncromsp.com/api/v1/customers?api_key={apiKey}
```

Request headers:

```
Content-Type: application/json
Accept: application/json
```

### API Key Generation

API keys are generated from within the Syncro admin interface under Admin > API Tokens. Keys can be scoped to specific permissions.

---

## Rate Limiting

Syncro enforces 180 requests per minute per IP address. The library must implement:

1. **Request counter** — Track requests within the rolling 60-second window
2. **Preemptive throttling** — Slow down when approaching the limit (e.g., at 80% threshold)
3. **429 handling** — On `429 Too Many Requests`, back off and retry with exponential delay
4. **Configurable** — Allow users to adjust thresholds and disable throttling

```typescript
interface RateLimitConfig {
  enabled: boolean;             // default: true
  maxRequests: number;          // default: 180
  windowMs: number;             // default: 60000 (1 minute)
  throttleThreshold: number;    // default: 0.8 (80%)
  retryAfterMs: number;         // default: 5000
  maxRetries: number;           // default: 3
}
```

---

## Pagination

Syncro uses page-based pagination with `page` and `per_page` query parameters. Responses include pagination metadata.

### Response Structure

```json
{
  "customers": [ ... ],
  "meta": {
    "total_pages": 10,
    "total_entries": 245,
    "per_page": 25,
    "page": 1
  }
}
```

### Automatic Pagination

```typescript
// Get a single page
const page1 = await client.customers.list({ page: 1, perPage: 50 });

// Auto-paginate all results (async generator)
for await (const customer of client.customers.listAll()) {
  console.log(customer.businessName);
}

// Collect all into an array
const allCustomers = await client.customers.listAll().toArray();
```

### Implementation

The `listAll()` method returns an `AsyncIterable` that:
1. Fetches the first page
2. Reads `meta.total_pages` and `meta.page` to determine if more pages exist
3. Continues fetching until all pages are retrieved
4. Yields individual records, not pages
5. Respects rate limits between page fetches

---

## Complete Endpoint Inventory

### Customers

| Method | Endpoint | Library Method |
|---|---|---|
| GET | `/api/v1/customers` | `client.customers.list(params?)` |
| GET | `/api/v1/customers/:id` | `client.customers.get(id)` |
| POST | `/api/v1/customers` | `client.customers.create(data)` |
| PUT | `/api/v1/customers/:id` | `client.customers.update(id, data)` |
| DELETE | `/api/v1/customers/:id` | `client.customers.delete(id)` |

### Contacts

| Method | Endpoint | Library Method |
|---|---|---|
| GET | `/api/v1/contacts` | `client.contacts.list(params?)` |
| GET | `/api/v1/contacts/:id` | `client.contacts.get(id)` |
| POST | `/api/v1/contacts` | `client.contacts.create(data)` |
| PUT | `/api/v1/contacts/:id` | `client.contacts.update(id, data)` |
| DELETE | `/api/v1/contacts/:id` | `client.contacts.delete(id)` |

### Tickets

| Method | Endpoint | Library Method |
|---|---|---|
| GET | `/api/v1/tickets` | `client.tickets.list(params?)` |
| GET | `/api/v1/tickets/:id` | `client.tickets.get(id)` |
| POST | `/api/v1/tickets` | `client.tickets.create(data)` |
| PUT | `/api/v1/tickets/:id` | `client.tickets.update(id, data)` |
| DELETE | `/api/v1/tickets/:id` | `client.tickets.delete(id)` |
| POST | `/api/v1/tickets/:id/comment` | `client.tickets.addComment(id, data)` |
| GET | `/api/v1/tickets/:id/timer` | `client.tickets.getTimer(id)` |
| POST | `/api/v1/tickets/:id/timer` | `client.tickets.startTimer(id, data?)` |
| PUT | `/api/v1/tickets/:id/timer` | `client.tickets.updateTimer(id, data)` |
| DELETE | `/api/v1/tickets/:id/timer` | `client.tickets.deleteTimer(id)` |

### Ticket Timers

| Method | Endpoint | Library Method |
|---|---|---|
| GET | `/api/v1/ticket_timers` | `client.ticketTimers.list(params?)` |
| GET | `/api/v1/ticket_timers/:id` | `client.ticketTimers.get(id)` |
| POST | `/api/v1/ticket_timers` | `client.ticketTimers.create(data)` |
| PUT | `/api/v1/ticket_timers/:id` | `client.ticketTimers.update(id, data)` |
| DELETE | `/api/v1/ticket_timers/:id` | `client.ticketTimers.delete(id)` |

### Ticket Problem Types

| Method | Endpoint | Library Method |
|---|---|---|
| GET | `/api/v1/ticket_problem_types` | `client.ticketProblemTypes.list(params?)` |
| GET | `/api/v1/ticket_problem_types/:id` | `client.ticketProblemTypes.get(id)` |

### Assets

| Method | Endpoint | Library Method |
|---|---|---|
| GET | `/api/v1/customer_assets` | `client.assets.list(params?)` |
| GET | `/api/v1/customer_assets/:id` | `client.assets.get(id)` |
| POST | `/api/v1/customer_assets` | `client.assets.create(data)` |
| PUT | `/api/v1/customer_assets/:id` | `client.assets.update(id, data)` |
| DELETE | `/api/v1/customer_assets/:id` | `client.assets.delete(id)` |

### Invoices

| Method | Endpoint | Library Method |
|---|---|---|
| GET | `/api/v1/invoices` | `client.invoices.list(params?)` |
| GET | `/api/v1/invoices/:id` | `client.invoices.get(id)` |
| POST | `/api/v1/invoices` | `client.invoices.create(data)` |
| PUT | `/api/v1/invoices/:id` | `client.invoices.update(id, data)` |
| DELETE | `/api/v1/invoices/:id` | `client.invoices.delete(id)` |
| POST | `/api/v1/invoices/:id/email` | `client.invoices.email(id, data?)` |
| POST | `/api/v1/invoices/:id/print` | `client.invoices.print(id)` |
| PUT | `/api/v1/invoices/:id/mark_sent` | `client.invoices.markSent(id)` |

### Estimates

| Method | Endpoint | Library Method |
|---|---|---|
| GET | `/api/v1/estimates` | `client.estimates.list(params?)` |
| GET | `/api/v1/estimates/:id` | `client.estimates.get(id)` |
| POST | `/api/v1/estimates` | `client.estimates.create(data)` |
| PUT | `/api/v1/estimates/:id` | `client.estimates.update(id, data)` |
| DELETE | `/api/v1/estimates/:id` | `client.estimates.delete(id)` |
| POST | `/api/v1/estimates/:id/email` | `client.estimates.email(id, data?)` |
| POST | `/api/v1/estimates/:id/convert_to_invoice` | `client.estimates.convertToInvoice(id)` |

### Contracts

| Method | Endpoint | Library Method |
|---|---|---|
| GET | `/api/v1/contracts` | `client.contracts.list(params?)` |
| GET | `/api/v1/contracts/:id` | `client.contracts.get(id)` |
| POST | `/api/v1/contracts` | `client.contracts.create(data)` |
| PUT | `/api/v1/contracts/:id` | `client.contracts.update(id, data)` |
| DELETE | `/api/v1/contracts/:id` | `client.contracts.delete(id)` |

### Appointments

| Method | Endpoint | Library Method |
|---|---|---|
| GET | `/api/v1/appointments` | `client.appointments.list(params?)` |
| GET | `/api/v1/appointments/:id` | `client.appointments.get(id)` |
| POST | `/api/v1/appointments` | `client.appointments.create(data)` |
| PUT | `/api/v1/appointments/:id` | `client.appointments.update(id, data)` |
| DELETE | `/api/v1/appointments/:id` | `client.appointments.delete(id)` |

### Products

| Method | Endpoint | Library Method |
|---|---|---|
| GET | `/api/v1/products` | `client.products.list(params?)` |
| GET | `/api/v1/products/:id` | `client.products.get(id)` |
| POST | `/api/v1/products` | `client.products.create(data)` |
| PUT | `/api/v1/products/:id` | `client.products.update(id, data)` |
| DELETE | `/api/v1/products/:id` | `client.products.delete(id)` |

### Payments

| Method | Endpoint | Library Method |
|---|---|---|
| GET | `/api/v1/payments` | `client.payments.list(params?)` |
| GET | `/api/v1/payments/:id` | `client.payments.get(id)` |
| POST | `/api/v1/payments` | `client.payments.create(data)` |
| PUT | `/api/v1/payments/:id` | `client.payments.update(id, data)` |
| DELETE | `/api/v1/payments/:id` | `client.payments.delete(id)` |

### Line Items

| Method | Endpoint | Library Method |
|---|---|---|
| GET | `/api/v1/line_items` | `client.lineItems.list(params?)` |
| GET | `/api/v1/line_items/:id` | `client.lineItems.get(id)` |
| POST | `/api/v1/line_items` | `client.lineItems.create(data)` |
| PUT | `/api/v1/line_items/:id` | `client.lineItems.update(id, data)` |
| DELETE | `/api/v1/line_items/:id` | `client.lineItems.delete(id)` |

### RMM Alerts

| Method | Endpoint | Library Method |
|---|---|---|
| GET | `/api/v1/rmm_alerts` | `client.rmmAlerts.list(params?)` |
| GET | `/api/v1/rmm_alerts/:id` | `client.rmmAlerts.get(id)` |
| PUT | `/api/v1/rmm_alerts/:id/mute` | `client.rmmAlerts.mute(id)` |
| PUT | `/api/v1/rmm_alerts/:id/resolve` | `client.rmmAlerts.resolve(id)` |

### Leads

| Method | Endpoint | Library Method |
|---|---|---|
| GET | `/api/v1/leads` | `client.leads.list(params?)` |
| GET | `/api/v1/leads/:id` | `client.leads.get(id)` |
| POST | `/api/v1/leads` | `client.leads.create(data)` |
| PUT | `/api/v1/leads/:id` | `client.leads.update(id, data)` |
| DELETE | `/api/v1/leads/:id` | `client.leads.delete(id)` |
| POST | `/api/v1/leads/:id/convert` | `client.leads.convert(id, data?)` |

### Canned Responses

| Method | Endpoint | Library Method |
|---|---|---|
| GET | `/api/v1/canned_responses` | `client.cannedResponses.list(params?)` |
| GET | `/api/v1/canned_responses/:id` | `client.cannedResponses.get(id)` |

### Wiki Pages

| Method | Endpoint | Library Method |
|---|---|---|
| GET | `/api/v1/wiki_pages` | `client.wikiPages.list(params?)` |
| GET | `/api/v1/wiki_pages/:id` | `client.wikiPages.get(id)` |
| POST | `/api/v1/wiki_pages` | `client.wikiPages.create(data)` |
| PUT | `/api/v1/wiki_pages/:id` | `client.wikiPages.update(id, data)` |
| DELETE | `/api/v1/wiki_pages/:id` | `client.wikiPages.delete(id)` |

### Settings / Reference Data

| Method | Endpoint | Library Method |
|---|---|---|
| GET | `/api/v1/settings` | `client.settings.get()` |
| GET | `/api/v1/me` | `client.me()` |

---

## Key Entity Types

### Customer

```typescript
interface Customer {
  id: number;
  businessName: string;
  businessAndFullName: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  mobile: string;
  address: string;
  address2: string;
  city: string;
  state: string;
  zip: string;
  latitude: number;
  longitude: number;
  notes: string;
  referredBy: string;
  taxable: boolean;
  disabled: boolean;
  noEmail: boolean;
  invoiceTermId: number;
  invoiceCcEmails: string;
  createdAt: string;
  updatedAt: string;
  properties: Record<string, string>;
}
```

### Contact

```typescript
interface Contact {
  id: number;
  customerId: number;
  name: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  zip: string;
  email: string;
  phone: string;
  mobile: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}
```

### Ticket

```typescript
interface Ticket {
  id: number;
  number: string;
  subject: string;
  customerId: number;
  contactId: number;
  problemType: string;
  status: string;
  resolvedAt: string | null;
  startAt: string | null;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  userId: number;
  ticketTypeId: number;
  locationId: number;
  assetIds: number[];
  comments: TicketComment[];
  properties: Record<string, string>;
}

interface TicketComment {
  id: number;
  subject: string;
  body: string;
  hidden: boolean;
  doNotEmail: boolean;
  createdAt: string;
  updatedAt: string;
  userId: number;
}
```

### Asset

```typescript
interface Asset {
  id: number;
  customerId: number;
  contactId: number;
  name: string;
  assetType: string;
  serialNumber: string;
  manufacturer: string;
  model: string;
  purchaseDate: string;
  warrantyExpires: string;
  notes: string;
  syncroUuid: string;
  rmmComputerId: number;
  kabescoEnabled: boolean;
  createdAt: string;
  updatedAt: string;
  properties: Record<string, string>;
}
```

### Invoice

```typescript
interface Invoice {
  id: number;
  number: string;
  customerId: number;
  date: string;
  dueDate: string;
  subtotal: number;
  total: number;
  tax: number;
  balance: number;
  status: 'draft' | 'sent' | 'viewed' | 'partial' | 'paid' | 'void';
  sentAt: string | null;
  paidAt: string | null;
  notes: string;
  createdAt: string;
  updatedAt: string;
  lineItems: LineItem[];
}
```

### Estimate

```typescript
interface Estimate {
  id: number;
  number: string;
  customerId: number;
  date: string;
  expirationDate: string;
  subtotal: number;
  total: number;
  tax: number;
  status: 'draft' | 'sent' | 'viewed' | 'won' | 'lost';
  sentAt: string | null;
  notes: string;
  createdAt: string;
  updatedAt: string;
  lineItems: LineItem[];
}
```

### Contract

```typescript
interface Contract {
  id: number;
  customerId: number;
  name: string;
  contractType: string;
  startDate: string;
  endDate: string;
  value: number;
  billingFrequency: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}
```

### Appointment

```typescript
interface Appointment {
  id: number;
  customerId: number;
  ticketId: number;
  startAt: string;
  endAt: string;
  allDay: boolean;
  notes: string;
  userId: number;
  createdAt: string;
  updatedAt: string;
}
```

### RMM Alert

```typescript
interface RmmAlert {
  id: number;
  customerId: number;
  assetId: number;
  alertType: string;
  description: string;
  status: 'active' | 'muted' | 'resolved';
  severity: string;
  triggeredAt: string;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
```

---

## Filtering & Query Parameters

Syncro supports filtering via query parameters. The library should provide a typed filter interface:

```typescript
// Direct filter params
const tickets = await client.tickets.list({
  customerId: 123,
  status: 'open',
  userId: 456,
  since: '2024-01-01T00:00:00Z',
  page: 1,
  perPage: 50,
});

// Customer filters
const customers = await client.customers.list({
  includeDisabled: true,
  query: 'Acme',        // search term
  page: 1,
  perPage: 100,
});

// Invoice filters
const invoices = await client.invoices.list({
  customerId: 123,
  status: 'sent',
  sinceDate: '2024-01-01',
  page: 1,
  perPage: 50,
});
```

Common filter parameters:
- `page` — Page number (starts at 1)
- `perPage` — Results per page (max varies by endpoint, typically 100)
- `customerId` — Filter by customer ID
- `since` / `sinceDate` — Filter by date range
- `status` — Filter by status
- `query` / `search` — Free text search

---

## Error Handling

### Error Classes

```typescript
class SyncroError extends Error {
  statusCode: number;
  response: any;
}

class SyncroAuthenticationError extends SyncroError {}    // 401, 403
class SyncroNotFoundError extends SyncroError {}          // 404
class SyncroValidationError extends SyncroError {         // 422
  errors: Array<{ field: string; message: string }>;
}
class SyncroRateLimitError extends SyncroError {}         // 429
class SyncroServerError extends SyncroError {}            // 500+
```

### Error Behavior

- **401/403**: Throw `SyncroAuthenticationError` immediately (no retry)
- **404**: Throw `SyncroNotFoundError`
- **422**: Throw `SyncroValidationError` with parsed error details
- **429**: Retry with exponential backoff (up to `maxRetries`), then throw `SyncroRateLimitError`
- **500+**: Retry once with delay, then throw `SyncroServerError`

---

## Test Strategy

### Principles

1. **Zero live API calls** — All tests use mocked HTTP responses
2. **Fixture-based** — JSON response fixtures match real Syncro API response structures
3. **Coverage targets** — Minimum 90% line coverage, 100% of public methods tested
4. **Error path testing** — Every error class has dedicated test cases
5. **Pagination testing** — Multi-page scenarios with mock page sequences

### Mock Architecture

Using `nock` or MSW to intercept HTTP requests:

```typescript
// tests/mocks/handlers.ts
import { http, HttpResponse } from 'msw';

const BASE = 'https://test-company.syncromsp.com/api/v1';

export const handlers = [
  http.get(`${BASE}/customers`, ({ request }) => {
    const url = new URL(request.url);
    const page = url.searchParams.get('page') || '1';

    // Verify API key is present
    if (!url.searchParams.get('api_key')) {
      return new HttpResponse(null, { status: 401 });
    }

    return HttpResponse.json(fixtures.customers[`page${page}`]);
  }),

  http.post(`${BASE}/customers`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json(fixtures.customers.created, { status: 201 });
  }),

  // Rate limit simulation
  http.get(`${BASE}/rate-limited`, () => {
    return new HttpResponse(null, { status: 429 });
  }),
];
```

### Test Categories

| Category | Description | Example Tests |
|---|---|---|
| **Unit — Client** | Client initialization, config validation | Subdomain URL building, missing API key error |
| **Unit — Pagination** | Iterator behavior | Multi-page traversal, empty results, single page |
| **Unit — Rate Limiter** | Throttling logic | Counter tracking, threshold delay, reset after window |
| **Integration — Customers** | Customer CRUD operations | List, get, create, update, delete |
| **Integration — Contacts** | Contact CRUD operations | List, get, create, update, delete |
| **Integration — Tickets** | Ticket operations | CRUD, comments, timers |
| **Integration — Assets** | Asset CRUD operations | List, get, create, update, delete |
| **Integration — Invoices** | Invoice operations | CRUD, email, print, mark sent |
| **Integration — Estimates** | Estimate operations | CRUD, email, convert to invoice |
| **Integration — Contracts** | Contract CRUD operations | List, get, create, update, delete |
| **Integration — Appointments** | Appointment CRUD operations | List, get, create, update, delete |
| **Integration — RMM Alerts** | RMM alert operations | List, get, mute, resolve |
| **Integration — Errors** | Error handling paths | 401, 404, 422, 429, 500 response handling |

### Fixture Structure

```
tests/fixtures/
├── customers/
│   ├── list-page1.json
│   ├── list-page2.json
│   ├── get-single.json
│   ├── created.json
│   └── errors/
│       ├── not-found.json
│       └── validation.json
├── contacts/
│   ├── list.json
│   ├── get-single.json
│   └── ...
├── tickets/
│   ├── list-page1.json
│   ├── list-page2.json
│   ├── get-single.json
│   ├── comments.json
│   └── ...
├── assets/
│   ├── list.json
│   ├── get-single.json
│   └── ...
├── invoices/
│   ├── list.json
│   ├── get-single.json
│   └── ...
├── estimates/
│   ├── list.json
│   └── ...
├── contracts/
│   ├── list.json
│   └── ...
├── appointments/
│   ├── list.json
│   └── ...
├── rmm-alerts/
│   ├── list.json
│   └── ...
└── settings/
    └── get.json
```

---

## Usage Examples

### Basic CRUD

```typescript
import { SyncroClient } from 'node-syncro';

const client = new SyncroClient({
  apiKey: process.env.SYNCRO_API_KEY!,
  subdomain: 'mycompany',
});

// List customers
const customers = await client.customers.list({
  query: 'Acme',
  perPage: 50,
});

// Get single customer
const customer = await client.customers.get(12345);

// Create a ticket
const ticket = await client.tickets.create({
  customerId: 12345,
  subject: 'Network issue',
  problemType: 'Network',
  status: 'New',
});

// Update a ticket
await client.tickets.update(ticket.id, {
  status: 'In Progress',
  userId: 789,
});

// Delete an asset
await client.assets.delete(67890);
```

### Pagination

```typescript
// Auto-paginate all tickets for a customer
for await (const ticket of client.tickets.listAll({
  customerId: 12345,
})) {
  console.log(ticket.number, ticket.subject);
}

// Collect all open tickets into an array
const openTickets = await client.tickets.listAll({
  status: 'open',
}).toArray();
```

### Invoice Operations

```typescript
// Create an invoice
const invoice = await client.invoices.create({
  customerId: 12345,
  date: '2026-02-04',
  dueDate: '2026-03-04',
});

// Add line item
await client.lineItems.create({
  invoiceId: invoice.id,
  name: 'IT Support - 2 hours',
  quantity: 2,
  price: 150.00,
});

// Send invoice via email
await client.invoices.email(invoice.id, {
  ccEmails: 'accounting@example.com',
});
```

### Ticket Workflow

```typescript
// Create ticket
const ticket = await client.tickets.create({
  customerId: 12345,
  subject: 'Printer not working',
  problemType: 'Hardware',
});

// Add comment
await client.tickets.addComment(ticket.id, {
  body: 'Checked the printer, needs new toner cartridge.',
  hidden: false,
});

// Start timer
await client.tickets.startTimer(ticket.id, {
  notes: 'On-site visit',
});

// ... do work ...

// Stop timer and log time
await client.tickets.deleteTimer(ticket.id);

// Create time entry (via ticket timer)
await client.ticketTimers.create({
  ticketId: ticket.id,
  startTime: '2026-02-04T10:00:00Z',
  endTime: '2026-02-04T11:30:00Z',
  notes: 'Replaced toner cartridge, tested printing',
});
```

### RMM Alert Management

```typescript
// List active RMM alerts
const alerts = await client.rmmAlerts.list({
  status: 'active',
});

// Process alerts
for (const alert of alerts.rmmAlerts) {
  if (alert.alertType === 'disk_space') {
    // Investigate...
    await client.rmmAlerts.resolve(alert.id);
  } else {
    // Mute non-critical alert
    await client.rmmAlerts.mute(alert.id);
  }
}
```

---

## Implementation Phases

### Phase 1 — Core Foundation
- Client class with auth, config, HTTP layer
- API key injection as query parameter
- Rate limiter
- Pagination utilities
- Error classes
- Customers CRUD (reference implementation)
- Full test infrastructure with mocks

### Phase 2 — Ticket Management
- Tickets CRUD with comments
- Ticket timers (start, stop, get)
- Ticket problem types
- Canned responses

### Phase 3 — Customer Assets & Contacts
- Contacts CRUD
- Assets CRUD
- Wiki pages

### Phase 4 — Billing & Invoicing
- Invoices CRUD with email/print actions
- Estimates CRUD with convert to invoice
- Line items CRUD
- Payments CRUD
- Products CRUD

### Phase 5 — Contracts, Appointments & RMM
- Contracts CRUD
- Appointments CRUD
- RMM alerts (list, get, mute, resolve)
- Leads CRUD with convert

### Phase 6 — Polish & Release
- Settings and reference data endpoints
- README documentation with examples
- CHANGELOG
- NPM publish configuration
- CI/CD pipeline (GitHub Actions)
- 90%+ test coverage verification

---

## Acceptance Criteria

1. Every endpoint in the inventory has a corresponding library method
2. Every library method has at least one passing test
3. API key is correctly injected as a query parameter on all requests
4. Pagination iterators correctly traverse multi-page results using meta data
5. Rate limiter prevents exceeding 180 req/min
6. All error classes are thrown for their corresponding HTTP status codes
7. No test makes a live API call
8. TypeScript strict mode compiles with zero errors
9. Test coverage >= 90%
10. Complete TypeScript definitions for all request/response types

---

## API Reference Links

- **API Documentation**: https://api-docs.syncromsp.com/
- **OpenAPI/Swagger Spec**: https://api-docs.syncromsp.com/swagger.json
- **Rate Limits**: 180 requests per minute per IP
- **Authentication**: API key as query parameter (`?api_key=YOUR_API_KEY`)
