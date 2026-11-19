# node-atera

## Product Requirements Document

**Version:** 1.0
**Author:** Aaron / WYRE AI
**Date:** February 4, 2026
**Status:** Draft
**Repository:** `atera/node-atera`
**Parent Project:** MSP Claude Plugin Marketplace

---

## Executive Summary

`node-atera` is a comprehensive, fully-typed Node.js/TypeScript library providing complete coverage of the Atera REST API v3. It follows the same architectural patterns established by the existing `node-autotask` library and serves as a core dependency for the Atera ecosystem plugins within the MSP Claude Plugin Marketplace.

The library wraps all 90+ Atera API endpoints across agents, tickets, devices, customers, contacts, alerts, custom values, contracts, billing, rates, and knowledge base resources. It handles API key authentication, automatic pagination, rate limiting (700 req/min), and ships with a full test suite using mocked API responses.

---

## Problem Statement

Atera is a popular all-in-one PSA+RMM platform with per-technician pricing that is attractive to MSPs. Its REST API is well-documented via OpenAPI/Swagger but lacks a production-quality Node.js library. The API uses simple header-based authentication and has a rate limit of 700 requests per minute.

Building Claude plugins and automation tools against Atera requires a reliable, well-tested foundation library that handles authentication, pagination, rate limiting, and response normalization transparently.

---

## Goals

1. **Complete API coverage** — Every documented Atera v3 endpoint is implemented
2. **Strong TypeScript types** — Full type definitions for all request/response payloads
3. **Simple authentication** — API key injection via `X-API-KEY` header
4. **Automatic pagination** — Iterator/generator patterns for seamless multi-page retrieval
5. **Rate limit handling** — Built-in request throttling (700 req/min) with backoff
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
node-atera/
├── src/
│   ├── index.ts                    # Public API exports
│   ├── client.ts                   # AteraClient class
│   ├── config.ts                   # Configuration types & defaults
│   ├── errors.ts                   # Custom error classes
│   ├── http.ts                     # HTTP layer (fetch wrapper)
│   ├── pagination.ts               # Pagination utilities
│   ├── rate-limiter.ts             # Rate limiting logic
│   ├── types/
│   │   ├── index.ts                # Re-exports
│   │   ├── common.ts               # Shared types (pagination, filters)
│   │   ├── agents.ts
│   │   ├── tickets.ts
│   │   ├── devices.ts
│   │   ├── customers.ts
│   │   ├── contacts.ts
│   │   ├── alerts.ts
│   │   ├── custom-values.ts
│   │   ├── contracts.ts
│   │   ├── billing.ts
│   │   ├── rates.ts
│   │   └── knowledge-base.ts
│   └── resources/
│       ├── agents.ts
│       ├── tickets.ts
│       ├── devices.ts
│       ├── devices-http.ts
│       ├── devices-snmp.ts
│       ├── devices-tcp.ts
│       ├── customers.ts
│       ├── contacts.ts
│       ├── alerts.ts
│       ├── custom-values.ts
│       ├── contracts.ts
│       ├── billing.ts
│       ├── rates.ts
│       └── knowledge-base.ts
├── tests/
│   ├── setup.ts                    # Test setup, mock server config
│   ├── fixtures/                   # JSON response fixtures
│   │   ├── agents/
│   │   ├── tickets/
│   │   ├── devices/
│   │   ├── customers/
│   │   ├── contacts/
│   │   ├── alerts/
│   │   └── ...
│   ├── mocks/
│   │   ├── handlers.ts
│   │   └── server.ts
│   ├── unit/
│   │   ├── client.test.ts
│   │   ├── pagination.test.ts
│   │   ├── rate-limiter.test.ts
│   │   └── ...
│   └── integration/
│       ├── agents.test.ts
│       ├── tickets.test.ts
│       ├── devices.test.ts
│       ├── customers.test.ts
│       ├── contacts.test.ts
│       ├── alerts.test.ts
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

### Configuration

```typescript
import { AteraClient } from 'node-atera';

const client = new AteraClient({
  apiKey: 'your-api-key',
  // OR explicit base URL (useful for testing):
  // baseUrl: 'https://app.atera.com/api/v3',
});
```

### Implementation Details

All requests include these headers:

```
X-API-KEY: {apiKey}
Content-Type: application/json
Accept: application/json
```

### Base URL

The Atera API has a single base URL:

| Environment | Base URL |
|---|---|
| Production | `https://app.atera.com/api/v3` |

### API Key Management

API keys are generated in Atera's admin settings. The key provides full access to the account's data. The client should surface clear errors when authentication fails (HTTP 401).

---

## Rate Limiting

Atera enforces 700 requests per minute. The library must implement:

1. **Request counter** — Track requests within the rolling 60-second window
2. **Preemptive throttling** — Slow down when approaching the limit (e.g., at 80% threshold)
3. **429 handling** — On `429 Too Many Requests`, back off and retry with exponential delay
4. **Configurable** — Allow users to adjust thresholds and disable throttling

```typescript
interface RateLimitConfig {
  enabled: boolean;             // default: true
  maxRequests: number;          // default: 700
  windowMs: number;             // default: 60000 (1 minute)
  throttleThreshold: number;    // default: 0.8 (80% = 560 requests)
  retryAfterMs: number;         // default: 5000
  maxRetries: number;           // default: 3
}
```

---

## Pagination

Atera uses page-based pagination with `Page` and `ItemsInPage` query parameters. Responses include pagination metadata:

```json
{
  "items": [...],
  "totalItemCount": 150,
  "page": 1,
  "itemsInPage": 50,
  "totalPages": 3,
  "prevLink": null,
  "nextLink": "https://app.atera.com/api/v3/agents?Page=2&ItemsInPage=50"
}
```

### Automatic Pagination

```typescript
// Get a single page
const page1 = await client.agents.list({ page: 1, itemsInPage: 50 });

// Auto-paginate all results (async generator)
for await (const agent of client.agents.listAll()) {
  console.log(agent.MachineName);
}

// Collect all into an array
const allAgents = await client.agents.listAll().toArray();
```

### Implementation

The `listAll()` method returns an `AsyncIterable` that:
1. Fetches the first page
2. Reads `nextLink` to determine if more pages exist
3. Continues fetching until `nextLink` is `null`
4. Yields individual records, not pages
5. Respects rate limits between page fetches

---

## Complete Endpoint Inventory

### Agents (5 endpoints)

| Method | Endpoint | Library Method |
|---|---|---|
| GET | `/agents` | `client.agents.list(params?)` |
| GET | `/agents/{agentId}` | `client.agents.get(agentId)` |
| GET | `/agents/machine/{machineName}` | `client.agents.getByMachineName(machineName)` |
| DELETE | `/agents/{agentId}` | `client.agents.delete(agentId)` |
| POST | `/agents/{agentId}/powershell/runtime/{runtimeId}` | `client.agents.runPowerShell(agentId, runtimeId, data)` |

### Tickets (14 endpoints)

| Method | Endpoint | Library Method |
|---|---|---|
| GET | `/tickets` | `client.tickets.list(params?)` |
| GET | `/tickets/{ticketId}` | `client.tickets.get(ticketId)` |
| POST | `/tickets` | `client.tickets.create(data)` |
| POST | `/tickets/{ticketId}` | `client.tickets.update(ticketId, data)` |
| DELETE | `/tickets/{ticketId}` | `client.tickets.delete(ticketId)` |
| GET | `/tickets/{ticketId}/comments` | `client.tickets.listComments(ticketId, params?)` |
| POST | `/tickets/{ticketId}/comments` | `client.tickets.createComment(ticketId, data)` |
| GET | `/tickets/{ticketId}/workhours` | `client.tickets.listWorkHours(ticketId, params?)` |
| POST | `/tickets/{ticketId}/workhours` | `client.tickets.createWorkHours(ticketId, data)` |
| GET | `/tickets/{ticketId}/billabledurations` | `client.tickets.listBillableDurations(ticketId, params?)` |
| GET | `/tickets/{ticketId}/timesheets` | `client.tickets.listTimesheets(ticketId, params?)` |
| POST | `/tickets/{ticketId}/timesheets` | `client.tickets.createTimesheet(ticketId, data)` |
| GET | `/tickets/filters` | `client.tickets.listFilters()` |
| GET | `/tickets/statuses` | `client.tickets.listStatuses()` |

### Devices - Generic (5 endpoints)

| Method | Endpoint | Library Method |
|---|---|---|
| GET | `/devices` | `client.devices.list(params?)` |
| GET | `/devices/{deviceId}` | `client.devices.get(deviceId)` |
| POST | `/devices` | `client.devices.create(data)` |
| POST | `/devices/{deviceId}` | `client.devices.update(deviceId, data)` |
| DELETE | `/devices/{deviceId}` | `client.devices.delete(deviceId)` |

### Devices - HTTP Monitors (3 endpoints)

| Method | Endpoint | Library Method |
|---|---|---|
| GET | `/devices/httpdevices` | `client.devicesHttp.list(params?)` |
| POST | `/devices/httpdevices` | `client.devicesHttp.create(data)` |
| DELETE | `/devices/httpdevices/{deviceId}` | `client.devicesHttp.delete(deviceId)` |

### Devices - SNMP (3 endpoints)

| Method | Endpoint | Library Method |
|---|---|---|
| GET | `/devices/snmpdevices` | `client.devicesSnmp.list(params?)` |
| POST | `/devices/snmpdevices` | `client.devicesSnmp.create(data)` |
| DELETE | `/devices/snmpdevices/{deviceId}` | `client.devicesSnmp.delete(deviceId)` |

### Devices - TCP Monitors (3 endpoints)

| Method | Endpoint | Library Method |
|---|---|---|
| GET | `/devices/tcpdevices` | `client.devicesTcp.list(params?)` |
| POST | `/devices/tcpdevices` | `client.devicesTcp.create(data)` |
| DELETE | `/devices/tcpdevices/{deviceId}` | `client.devicesTcp.delete(deviceId)` |

### Customers (7 endpoints)

| Method | Endpoint | Library Method |
|---|---|---|
| GET | `/customers` | `client.customers.list(params?)` |
| GET | `/customers/{customerId}` | `client.customers.get(customerId)` |
| POST | `/customers` | `client.customers.create(data)` |
| POST | `/customers/{customerId}` | `client.customers.update(customerId, data)` |
| DELETE | `/customers/{customerId}` | `client.customers.delete(customerId)` |
| GET | `/customers/{customerId}/agents` | `client.customers.listAgents(customerId, params?)` |
| GET | `/customers/{customerId}/alerts` | `client.customers.listAlerts(customerId, params?)` |

### Contacts (6 endpoints)

| Method | Endpoint | Library Method |
|---|---|---|
| GET | `/contacts` | `client.contacts.list(params?)` |
| GET | `/contacts/{contactId}` | `client.contacts.get(contactId)` |
| POST | `/contacts` | `client.contacts.create(data)` |
| POST | `/contacts/{contactId}` | `client.contacts.update(contactId, data)` |
| DELETE | `/contacts/{contactId}` | `client.contacts.delete(contactId)` |
| GET | `/contacts/customer/{customerId}` | `client.contacts.listByCustomer(customerId, params?)` |

### Alerts (4 endpoints)

| Method | Endpoint | Library Method |
|---|---|---|
| GET | `/alerts` | `client.alerts.list(params?)` |
| GET | `/alerts/{alertId}` | `client.alerts.get(alertId)` |
| GET | `/alerts/agent/{agentId}` | `client.alerts.listByAgent(agentId, params?)` |
| GET | `/alerts/device/{deviceId}` | `client.alerts.listByDevice(deviceId, params?)` |

### Custom Values (26 endpoints)

Custom values are key-value pairs stored at agent, ticket, customer, contact, or contract level.

#### Agent Custom Values (5 endpoints)

| Method | Endpoint | Library Method |
|---|---|---|
| GET | `/customvalues/agentfield` | `client.customValues.listAgentFields()` |
| GET | `/customvalues/agent/{agentId}` | `client.customValues.listByAgent(agentId)` |
| GET | `/customvalues/agentfieldname/{fieldName}` | `client.customValues.getAgentFieldByName(fieldName)` |
| POST | `/customvalues/agent/{agentId}` | `client.customValues.setAgentValue(agentId, data)` |
| DELETE | `/customvalues/agent/{agentId}/field/{fieldId}` | `client.customValues.deleteAgentValue(agentId, fieldId)` |

#### Ticket Custom Values (5 endpoints)

| Method | Endpoint | Library Method |
|---|---|---|
| GET | `/customvalues/ticketfield` | `client.customValues.listTicketFields()` |
| GET | `/customvalues/ticket/{ticketId}` | `client.customValues.listByTicket(ticketId)` |
| GET | `/customvalues/ticketfieldname/{fieldName}` | `client.customValues.getTicketFieldByName(fieldName)` |
| POST | `/customvalues/ticket/{ticketId}` | `client.customValues.setTicketValue(ticketId, data)` |
| DELETE | `/customvalues/ticket/{ticketId}/field/{fieldId}` | `client.customValues.deleteTicketValue(ticketId, fieldId)` |

#### Customer Custom Values (5 endpoints)

| Method | Endpoint | Library Method |
|---|---|---|
| GET | `/customvalues/customerfield` | `client.customValues.listCustomerFields()` |
| GET | `/customvalues/customer/{customerId}` | `client.customValues.listByCustomer(customerId)` |
| GET | `/customvalues/customerfieldname/{fieldName}` | `client.customValues.getCustomerFieldByName(fieldName)` |
| POST | `/customvalues/customer/{customerId}` | `client.customValues.setCustomerValue(customerId, data)` |
| DELETE | `/customvalues/customer/{customerId}/field/{fieldId}` | `client.customValues.deleteCustomerValue(customerId, fieldId)` |

#### Contact Custom Values (5 endpoints)

| Method | Endpoint | Library Method |
|---|---|---|
| GET | `/customvalues/contactfield` | `client.customValues.listContactFields()` |
| GET | `/customvalues/contact/{contactId}` | `client.customValues.listByContact(contactId)` |
| GET | `/customvalues/contactfieldname/{fieldName}` | `client.customValues.getContactFieldByName(fieldName)` |
| POST | `/customvalues/contact/{contactId}` | `client.customValues.setContactValue(contactId, data)` |
| DELETE | `/customvalues/contact/{contactId}/field/{fieldId}` | `client.customValues.deleteContactValue(contactId, fieldId)` |

#### Contract Custom Values (6 endpoints)

| Method | Endpoint | Library Method |
|---|---|---|
| GET | `/customvalues/contractfield` | `client.customValues.listContractFields()` |
| GET | `/customvalues/contract/{contractId}` | `client.customValues.listByContract(contractId)` |
| GET | `/customvalues/contractfieldname/{fieldName}` | `client.customValues.getContractFieldByName(fieldName)` |
| POST | `/customvalues/contractfield` | `client.customValues.createContractField(data)` |
| POST | `/customvalues/contract/{contractId}` | `client.customValues.setContractValue(contractId, data)` |
| DELETE | `/customvalues/contract/{contractId}/field/{fieldId}` | `client.customValues.deleteContractValue(contractId, fieldId)` |

### Contracts (3 endpoints)

| Method | Endpoint | Library Method |
|---|---|---|
| GET | `/contracts` | `client.contracts.list(params?)` |
| GET | `/contracts/{contractId}` | `client.contracts.get(contractId)` |
| GET | `/contracts/customer/{customerId}` | `client.contracts.listByCustomer(customerId, params?)` |

### Billing (2 endpoints)

| Method | Endpoint | Library Method |
|---|---|---|
| GET | `/billing/invoices` | `client.billing.listInvoices(params?)` |
| GET | `/billing/invoices/{invoiceId}` | `client.billing.getInvoice(invoiceId)` |

### Rates (9 endpoints)

| Method | Endpoint | Library Method |
|---|---|---|
| GET | `/rates` | `client.rates.list(params?)` |
| GET | `/rates/{rateId}` | `client.rates.get(rateId)` |
| POST | `/rates` | `client.rates.create(data)` |
| POST | `/rates/{rateId}` | `client.rates.update(rateId, data)` |
| DELETE | `/rates/{rateId}` | `client.rates.delete(rateId)` |
| GET | `/rates/products` | `client.rates.listProducts(params?)` |
| GET | `/rates/products/{productId}` | `client.rates.getProduct(productId)` |
| GET | `/rates/expenses` | `client.rates.listExpenses(params?)` |
| GET | `/rates/expenses/{expenseId}` | `client.rates.getExpense(expenseId)` |

### Knowledge Base (1 endpoint)

| Method | Endpoint | Library Method |
|---|---|---|
| GET | `/knowledgebase` | `client.knowledgeBase.list(params?)` |

---

## Core Entity Types

### Agent

```typescript
interface Agent {
  AgentID: number;
  AgentName: string;
  MachineName: string;
  CustomerID: number;
  CustomerName: string;
  FolderID: number;
  FolderName: string;
  AgentType: string;
  LastSeenDate: string;       // ISO 8601 date
  Online: boolean;
  OS: string;
  OSVersion: string;
  OSType: string;
  Domain: string;
  CurrentUser: string;
  IPAddresses: string[];
  ReportedFromIP: string;
  Processor: string;
  TotalMemory: number;
  LastReboot: string;         // ISO 8601 date
  AgentVersion: string;
  HardwareSerialNumber: string;
  Vendor: string;
  Model: string;
  Office: string;
  OfficeVersion: string;
  AntivirusDefinitionUpdateDate: string;
  HasAntivirusConflicts: boolean;
}
```

### Ticket

```typescript
interface Ticket {
  TicketID: number;
  TicketTitle: string;
  TicketNumber: string;
  TicketPriority: string;
  TicketImpact: string;
  TicketStatus: string;
  TicketType: string;
  TicketSource: string;
  CustomerID: number;
  CustomerName: string;
  CustomerBusinessNumber: string;
  ContactID: number;
  ContactFullName: string;
  ContactEmail: string;
  ContractID: number;
  ContractName: string;
  TechnicianContactID: number;
  TechnicianFullName: string;
  FirstComment: string;
  LastEndUserComment: string;
  OnSiteVisits: number;
  SLAName: string;
  SLAStatus: string;
  DueDate: string;            // ISO 8601 date
  FirstResponseDueDate: string;
  FirstResponseDate: string;
  ResolvedDate: string;
  ClosedDate: string;
  CreatedDate: string;
  LastUpdatedDate: string;
  Tags: string[];
}
```

### Customer

```typescript
interface Customer {
  CustomerID: number;
  CustomerName: string;
  BusinessNumber: string;
  Domain: string;
  Address: string;
  City: string;
  State: string;
  Country: string;
  ZipCode: string;
  Phone: string;
  Fax: string;
  Notes: string;
  Website: string;
  CreatedDate: string;
  LastModifiedDate: string;
  Logo: string;
  PrimaryContact: {
    ContactID: number;
    ContactName: string;
    Email: string;
    Phone: string;
  };
}
```

### Alert

```typescript
interface Alert {
  AlertID: number;
  AlertCategoryID: number;
  AlertMessage: string;
  AlertSeverity: 'Information' | 'Warning' | 'Critical';
  Created: string;            // ISO 8601 date
  AgentID: number;
  AgentName: string;
  DeviceID: number;
  DeviceName: string;
  CustomerID: number;
  CustomerName: string;
  Archived: boolean;
  AlertTitle: string;
  Code: number;
  Source: string;
  TicketID: number;
  FolderID: number;
  PollingCyclesCount: number;
  Snoozed: boolean;
}
```

### Device (Generic)

```typescript
interface Device {
  DeviceID: number;
  DeviceName: string;
  DeviceType: string;
  CustomerID: number;
  CustomerName: string;
  Online: boolean;
  LastSeenDate: string;
  CreatedDate: string;
  Description: string;
  Hostname: string;
  IPAddress: string;
  Port: number;
}
```

### Contact

```typescript
interface Contact {
  ContactID: number;
  CustomerID: number;
  CustomerName: string;
  Email: string;
  FirstName: string;
  LastName: string;
  FullName: string;
  JobTitle: string;
  Phone: string;
  MobilePhone: string;
  IsContactPerson: boolean;
  InIgnoreMode: boolean;
  CreatedDate: string;
  LastModifiedDate: string;
}
```

### Contract

```typescript
interface Contract {
  ContractID: number;
  ContractName: string;
  CustomerID: number;
  CustomerName: string;
  ContractType: string;
  StartDate: string;
  EndDate: string;
  Value: number;
  Currency: string;
  BillingPeriod: string;
  Active: boolean;
  AutoRenew: boolean;
  CreatedDate: string;
  LastModifiedDate: string;
}
```

---

## Query Parameters & Filtering

Atera supports filtering via query parameters on list endpoints:

```typescript
// Agents with filtering
const agents = await client.agents.list({
  page: 1,
  itemsInPage: 50,
  customerId: 123,          // Filter by customer
});

// Tickets with filtering
const tickets = await client.tickets.list({
  page: 1,
  itemsInPage: 50,
  ticketStatus: 'Open',
  customerId: 123,
  technicianId: 456,
  dateFrom: '2024-01-01',
  dateTo: '2024-12-31',
});

// Alerts with filtering
const alerts = await client.alerts.list({
  page: 1,
  itemsInPage: 50,
  alertSeverity: 'Critical',
  customerId: 123,
  archived: false,
});
```

---

## Error Handling

### Error Classes

```typescript
class AteraError extends Error {
  statusCode: number;
  response: any;
}

class AteraAuthenticationError extends AteraError {}      // 401
class AteraNotFoundError extends AteraError {}             // 404
class AteraValidationError extends AteraError {            // 400
  errors: Array<{ message: string; field?: string }>;
}
class AteraRateLimitError extends AteraError {}            // 429
class AteraServerError extends AteraError {}               // 500+
```

### Error Behavior

- **400**: Throw `AteraValidationError` with parsed error details
- **401**: Throw `AteraAuthenticationError` immediately (no retry)
- **404**: Throw `AteraNotFoundError`
- **429**: Retry with exponential backoff (up to `maxRetries`), then throw `AteraRateLimitError`
- **500+**: Retry once with delay, then throw `AteraServerError`

---

## Test Strategy

### Principles

1. **Zero live API calls** — All tests use mocked HTTP responses
2. **Fixture-based** — JSON response fixtures match real Atera API response structures
3. **Coverage targets** — Minimum 90% line coverage, 100% of public methods tested
4. **Error path testing** — Every error class has dedicated test cases
5. **Pagination testing** — Multi-page scenarios with mock page sequences

### Mock Architecture

Using `nock` or MSW to intercept HTTP requests:

```typescript
// tests/mocks/handlers.ts
import { http, HttpResponse } from 'msw';

const BASE = 'https://app.atera.com/api/v3';

export const handlers = [
  http.get(`${BASE}/agents`, ({ request }) => {
    const url = new URL(request.url);
    const apiKey = request.headers.get('X-API-KEY');

    if (!apiKey) {
      return HttpResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const page = url.searchParams.get('Page') || '1';
    return HttpResponse.json(fixtures.agents[`page${page}`]);
  }),

  http.post(`${BASE}/tickets`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json(fixtures.tickets.created, { status: 201 });
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
| **Unit — Client** | Client initialization, config validation | API key validation, base URL config |
| **Unit — Pagination** | Iterator behavior | Multi-page traversal, empty results, single page |
| **Unit — Rate Limiter** | Throttling logic | Counter tracking, threshold delay, reset after window |
| **Integration — Agents** | Agent operations | List, get, delete, PowerShell execution |
| **Integration — Tickets** | Ticket operations | CRUD, comments, work hours, timesheets |
| **Integration — Devices** | Device operations | Generic, HTTP, SNMP, TCP devices |
| **Integration — Customers** | Customer operations | CRUD, list agents, list alerts |
| **Integration — Contacts** | Contact operations | CRUD, list by customer |
| **Integration — Alerts** | Alert operations | List, get, filter by agent/device |
| **Integration — Custom Values** | Custom value operations | All entity types CRUD |
| **Integration — Contracts** | Contract operations | List, get, list by customer |
| **Integration — Billing** | Billing operations | Invoice listing and retrieval |
| **Integration — Rates** | Rate operations | Rates, products, expenses |
| **Integration — Errors** | Error handling paths | 401, 404, 400, 429, 500 response handling |

### Fixture Structure

```
tests/fixtures/
├── agents/
│   ├── list-page1.json
│   ├── list-page2.json
│   ├── get-single.json
│   └── errors/
│       ├── not-found.json
│       └── unauthorized.json
├── tickets/
│   ├── list.json
│   ├── get-single.json
│   ├── created.json
│   ├── comments.json
│   ├── work-hours.json
│   └── timesheets.json
├── devices/
│   ├── generic/
│   ├── http/
│   ├── snmp/
│   └── tcp/
├── customers/
│   ├── list.json
│   ├── get-single.json
│   ├── created.json
│   └── agents.json
├── contacts/
│   ├── list.json
│   ├── get-single.json
│   └── created.json
├── alerts/
│   ├── list.json
│   ├── get-single.json
│   └── by-agent.json
├── custom-values/
│   ├── agent-fields.json
│   ├── ticket-fields.json
│   ├── customer-fields.json
│   ├── contact-fields.json
│   └── contract-fields.json
├── contracts/
│   ├── list.json
│   └── get-single.json
├── billing/
│   ├── invoices-list.json
│   └── invoice-single.json
├── rates/
│   ├── list.json
│   ├── products.json
│   └── expenses.json
└── knowledge-base/
    └── list.json
```

---

## Usage Examples

### Basic CRUD

```typescript
import { AteraClient } from 'node-atera';

const client = new AteraClient({
  apiKey: process.env.ATERA_API_KEY!,
});

// List agents
const agents = await client.agents.list({
  page: 1,
  itemsInPage: 50,
});

// Get single agent
const agent = await client.agents.get(12345);

// Create a ticket
const ticket = await client.tickets.create({
  TicketTitle: 'Email not working',
  CustomerID: 123,
  ContactID: 456,
  TicketType: 'Problem',
  TicketPriority: 'High',
});

// Update a ticket
await client.tickets.update(ticket.TicketID, {
  TicketStatus: 'In Progress',
  TechnicianContactID: 789,
});

// Add a comment
await client.tickets.createComment(ticket.TicketID, {
  Comment: 'Working on this issue now.',
  IsInternal: true,
});
```

### Pagination

```typescript
// Auto-paginate all agents
for await (const agent of client.agents.listAll()) {
  console.log(agent.MachineName, agent.CustomerName);
}

// Auto-paginate all open tickets
for await (const ticket of client.tickets.listAll({ ticketStatus: 'Open' })) {
  console.log(ticket.TicketNumber, ticket.TicketTitle);
}
```

### Custom Values

```typescript
// List available agent custom fields
const agentFields = await client.customValues.listAgentFields();

// Set a custom value on an agent
await client.customValues.setAgentValue(agentId, {
  FieldName: 'Location',
  Value: 'Building A - Floor 3',
});

// Get all custom values for a customer
const customerValues = await client.customValues.listByCustomer(customerId);
```

### Device Monitoring

```typescript
// Create an HTTP monitor
const httpMonitor = await client.devicesHttp.create({
  DeviceName: 'Company Website',
  URL: 'https://example.com',
  CustomerID: 123,
  CheckIntervalMinutes: 5,
  Timeout: 30,
});

// Create a TCP monitor
const tcpMonitor = await client.devicesTcp.create({
  DeviceName: 'SMTP Server',
  Hostname: 'mail.example.com',
  Port: 25,
  CustomerID: 123,
});

// List all SNMP devices
const snmpDevices = await client.devicesSnmp.list();
```

### Alerts Management

```typescript
// List critical alerts
const criticalAlerts = await client.alerts.list({
  alertSeverity: 'Critical',
  archived: false,
});

// Get alerts for a specific agent
const agentAlerts = await client.alerts.listByAgent(agentId);

// Get alerts for a specific device
const deviceAlerts = await client.alerts.listByDevice(deviceId);
```

---

## Implementation Phases

### Phase 1 — Core Foundation
- Client class with auth and config
- HTTP layer with API key header injection
- Rate limiter
- Pagination utilities
- Error classes
- Agents CRUD (reference implementation)
- Full test infrastructure with mocks

### Phase 2 — Tickets & Customers
- Tickets CRUD with comments, work hours, timesheets
- Ticket filters and statuses
- Customers CRUD with agents and alerts listing

### Phase 3 — Devices & Monitoring
- Generic devices CRUD
- HTTP device monitors
- SNMP device monitors
- TCP device monitors

### Phase 4 — Contacts & Alerts
- Contacts CRUD
- Alerts listing with filters
- Alerts by agent and device

### Phase 5 — Custom Values
- Agent custom values
- Ticket custom values
- Customer custom values
- Contact custom values
- Contract custom values

### Phase 6 — Billing & Contracts
- Contracts listing
- Billing invoices
- Rates, products, expenses
- Knowledge base

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
3. API key authentication works correctly via `X-API-KEY` header
4. Pagination iterators correctly traverse multi-page results using `nextLink`
5. Rate limiter prevents exceeding 700 req/min
6. All error classes are thrown for their corresponding HTTP status codes
7. No test makes a live API call
8. TypeScript strict mode compiles with zero errors
9. Test coverage >= 90%
10. All custom value operations work for all entity types (agent, ticket, customer, contact, contract)
