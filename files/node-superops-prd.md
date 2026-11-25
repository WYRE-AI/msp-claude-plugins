# node-superops

## Product Requirements Document

**Version:** 1.0
**Author:** Aaron / WYRE AI
**Date:** February 4, 2026
**Status:** Draft
**Repository:** `superops/node-superops`
**Parent Project:** MSP Claude Plugin Marketplace

---

## Executive Summary

`node-superops` is a comprehensive, fully-typed Node.js/TypeScript library providing complete coverage of the SuperOps.ai GraphQL API. It follows the same architectural patterns established by the existing `node-autotask` library and serves as a core dependency for SuperOps ecosystem plugins within the MSP Claude Plugin Marketplace.

Unlike REST-based MSP tools, SuperOps.ai uses a GraphQL API, enabling clients to request exactly the data they need. The library wraps 80+ GraphQL queries and 50+ mutations, provides automatic pagination (cursor-based), rate limiting (800 req/min), and ships with a full test suite using mocked API responses.

---

## Problem Statement

SuperOps.ai is a modern, AI-native unified PSA+RMM platform gaining adoption among MSPs. Its GraphQL API offers flexibility but introduces complexity that developers must navigate: schema introspection, query construction, variable typing, and cursor-based pagination. There is no production-quality Node.js library for SuperOps.ai, creating a gap for building Claude plugins, web applications, and automation tools in the JavaScript/TypeScript ecosystem.

Building integrations requires understanding GraphQL concepts (queries vs mutations, fragments, variables) and handling authentication headers, regional endpoints, and error structures unique to GraphQL.

---

## Goals

1. **Complete API coverage** — Every documented SuperOps.ai query and mutation is implemented
2. **Strong TypeScript types** — Full type definitions generated from the GraphQL schema
3. **GraphQL abstraction** — Provide method-based access so consumers don't write raw GraphQL
4. **Automatic pagination** — Iterator/generator patterns for cursor-based pagination
5. **Rate limit handling** — Built-in request throttling (800 req/min) with backoff
6. **Multi-region support** — Support US and EU endpoints for both MSP and IT verticals
7. **Zero live API testing** — Full test suite with mocked GraphQL responses
8. **Plugin-ready** — Designed for direct integration with Claude MCP plugins

---

## Technical Specifications

### Runtime & Dependencies

| Requirement | Value |
|---|---|
| Node.js | >= 18.0.0 |
| TypeScript | >= 5.0 |
| Module system | ESM with CJS compatibility |
| GraphQL client | `graphql-request` |
| Schema codegen | `@graphql-codegen/cli` |
| Test framework | Vitest |
| Mock server | MSW (Mock Service Worker) with `graphql` handlers |
| Build tool | `tsup` |

### Package Structure

```
node-superops/
├── src/
│   ├── index.ts                    # Public API exports
│   ├── client.ts                   # SuperOpsClient class
│   ├── config.ts                   # Configuration types & defaults
│   ├── errors.ts                   # Custom error classes
│   ├── graphql-client.ts           # GraphQL request layer
│   ├── pagination.ts               # Cursor-based pagination utilities
│   ├── rate-limiter.ts             # Rate limiting logic
│   ├── generated/
│   │   ├── graphql.ts              # Generated types from schema
│   │   ├── operations.ts           # Generated query/mutation types
│   │   └── sdk.ts                  # Generated SDK methods
│   ├── types/
│   │   ├── index.ts                # Re-exports
│   │   ├── common.ts               # Shared types (pagination, filters)
│   │   ├── assets.ts
│   │   ├── tickets.ts
│   │   ├── clients.ts
│   │   ├── alerts.ts
│   │   ├── knowledge-base.ts
│   │   ├── contracts.ts
│   │   ├── technicians.ts
│   │   └── ...                     # One file per domain
│   ├── operations/
│   │   ├── assets.graphql          # GraphQL operation definitions
│   │   ├── tickets.graphql
│   │   ├── clients.graphql
│   │   ├── alerts.graphql
│   │   └── ...
│   └── resources/
│       ├── assets.ts               # Asset queries & mutations
│       ├── tickets.ts
│       ├── clients.ts
│       ├── sites.ts
│       ├── alerts.ts
│       ├── knowledge-base.ts
│       ├── contracts.ts
│       ├── technicians.ts
│       ├── runbooks.ts
│       └── ...
├── tests/
│   ├── setup.ts                    # Test setup, mock server config
│   ├── fixtures/                   # GraphQL response fixtures
│   │   ├── assets/
│   │   ├── tickets/
│   │   ├── clients/
│   │   └── ...
│   ├── mocks/
│   │   ├── handlers.ts             # MSW GraphQL handlers
│   │   └── server.ts
│   ├── unit/
│   │   ├── client.test.ts
│   │   ├── pagination.test.ts
│   │   ├── rate-limiter.test.ts
│   │   └── ...
│   └── integration/
│       ├── assets.test.ts
│       ├── tickets.test.ts
│       ├── clients.test.ts
│       ├── alerts.test.ts
│       └── ...
├── codegen.yml                     # GraphQL codegen config
├── schema.graphql                  # Cached SuperOps schema
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
import { SuperOpsClient } from 'node-superops';

const client = new SuperOpsClient({
  apiToken: 'your-api-token',
  customerSubDomain: 'your-company',
  region: 'us',           // 'us' | 'eu'
  vertical: 'msp',        // 'msp' | 'it'
  // OR explicit endpoint:
  // endpoint: 'https://api.superops.ai/msp',
});
```

### Implementation Details

All GraphQL requests include these headers:

```
Authorization: Bearer {apiToken}
CustomerSubDomain: {customerSubDomain}
Content-Type: application/json
```

### Regional Endpoints

| Region | Vertical | GraphQL Endpoint |
|---|---|---|
| `us` | `msp` | `https://api.superops.ai/msp` |
| `us` | `it` | `https://api.superops.ai/it` |
| `eu` | `msp` | `https://euapi.superops.ai/msp` |
| `eu` | `it` | `https://euapi.superops.ai/it` |

The library determines the endpoint from region + vertical or uses an explicit endpoint if provided.

---

## Rate Limiting

SuperOps.ai enforces 800 requests per minute. The library must implement:

1. **Request counter** — Track requests within the rolling 60-second window
2. **Preemptive throttling** — Slow down when approaching the limit (e.g., at 80% threshold)
3. **429 handling** — On rate limit responses, back off and retry with exponential delay
4. **Configurable** — Allow users to adjust thresholds and disable throttling

```typescript
interface RateLimitConfig {
  enabled: boolean;              // default: true
  maxRequests: number;           // default: 800
  windowMs: number;              // default: 60000 (1 minute)
  throttleThreshold: number;     // default: 0.8 (80% = 640 requests)
  retryAfterMs: number;          // default: 5000
  maxRetries: number;            // default: 3
}
```

---

## GraphQL Handling

### Query/Mutation Abstraction

The library abstracts GraphQL complexity behind method calls:

```typescript
// User writes:
const asset = await client.assets.get('asset-123');

// Library executes:
const query = gql`
  query GetAsset($id: ID!) {
    getAsset(id: $id) {
      id
      name
      type
      status
      client {
        id
        name
      }
      ...
    }
  }
`;
```

### Type Generation

TypeScript types are generated from the SuperOps GraphQL schema using `@graphql-codegen`:

```yaml
# codegen.yml
schema: schema.graphql
generates:
  src/generated/graphql.ts:
    plugins:
      - typescript
      - typescript-operations
      - typescript-graphql-request
```

### Error Handling in GraphQL

GraphQL responses may contain both `data` and `errors`. The library must:

1. Check for `errors` array in response
2. Parse GraphQL error extensions for status codes and details
3. Throw appropriate typed errors
4. Return data when partial success is acceptable (configurable)

```typescript
interface GraphQLErrorExtension {
  code: string;
  statusCode?: number;
  message: string;
}
```

---

## Pagination

SuperOps.ai uses cursor-based pagination with connection/edge patterns:

```graphql
query GetAssetList($first: Int, $after: String) {
  getAssetList(first: $first, after: $after) {
    edges {
      node {
        id
        name
        ...
      }
      cursor
    }
    pageInfo {
      hasNextPage
      endCursor
    }
    totalCount
  }
}
```

### Automatic Pagination

```typescript
// Get a single page
const page1 = await client.assets.list({ first: 50 });

// Auto-paginate all results (async generator)
for await (const asset of client.assets.listAll()) {
  console.log(asset.name);
}

// Collect all into an array
const allAssets = await client.assets.listAll().toArray();
```

### Implementation

The `listAll()` method returns an `AsyncIterable` that:
1. Fetches the first page
2. Reads `pageInfo.hasNextPage` and `pageInfo.endCursor`
3. Continues fetching with `after: endCursor` until `hasNextPage` is false
4. Yields individual nodes from each page
5. Respects rate limits between page fetches

---

## Complete Operation Inventory

### Asset Operations

| Type | Operation | Library Method |
|---|---|---|
| Query | `getAsset(id: ID!)` | `client.assets.get(id)` |
| Query | `getAssetList(...)` | `client.assets.list(params?)` |
| Query | `getAssetsByClient(clientId: ID!)` | `client.assets.listByClient(clientId, params?)` |
| Query | `getAssetsBySite(siteId: ID!)` | `client.assets.listBySite(siteId, params?)` |
| Mutation | `createAsset(input: AssetInput!)` | `client.assets.create(data)` |
| Mutation | `updateAsset(id: ID!, input: AssetInput!)` | `client.assets.update(id, data)` |
| Mutation | `deleteAsset(id: ID!)` | `client.assets.delete(id)` |

### Ticket Operations

| Type | Operation | Library Method |
|---|---|---|
| Query | `getTicket(id: ID!)` | `client.tickets.get(id)` |
| Query | `getTicketList(...)` | `client.tickets.list(params?)` |
| Query | `getTicketsByClient(clientId: ID!)` | `client.tickets.listByClient(clientId, params?)` |
| Query | `getTicketsByStatus(status: TicketStatus!)` | `client.tickets.listByStatus(status, params?)` |
| Query | `getTicketsByTechnician(techId: ID!)` | `client.tickets.listByTechnician(techId, params?)` |
| Mutation | `createTicket(input: TicketInput!)` | `client.tickets.create(data)` |
| Mutation | `updateTicket(id: ID!, input: TicketInput!)` | `client.tickets.update(id, data)` |
| Mutation | `addTicketNote(ticketId: ID!, note: String!)` | `client.tickets.addNote(ticketId, note)` |
| Mutation | `addTicketTimeEntry(ticketId: ID!, input: TimeEntryInput!)` | `client.tickets.addTimeEntry(ticketId, data)` |
| Mutation | `changeTicketStatus(id: ID!, status: TicketStatus!)` | `client.tickets.changeStatus(id, status)` |
| Mutation | `assignTicket(id: ID!, technicianId: ID!)` | `client.tickets.assign(id, technicianId)` |

### Client Operations

| Type | Operation | Library Method |
|---|---|---|
| Query | `getClient(id: ID!)` | `client.clients.get(id)` |
| Query | `getClientList(...)` | `client.clients.list(params?)` |
| Query | `searchClients(query: String!)` | `client.clients.search(query, params?)` |
| Mutation | `createClient(input: ClientInput!)` | `client.clients.create(data)` |
| Mutation | `updateClient(id: ID!, input: ClientInput!)` | `client.clients.update(id, data)` |
| Mutation | `archiveClient(id: ID!)` | `client.clients.archive(id)` |

### Site Operations

| Type | Operation | Library Method |
|---|---|---|
| Query | `getSite(id: ID!)` | `client.sites.get(id)` |
| Query | `getSitesByClient(clientId: ID!)` | `client.sites.listByClient(clientId, params?)` |
| Mutation | `createClientSite(clientId: ID!, input: SiteInput!)` | `client.sites.create(clientId, data)` |
| Mutation | `updateSite(id: ID!, input: SiteInput!)` | `client.sites.update(id, data)` |
| Mutation | `deleteSite(id: ID!)` | `client.sites.delete(id)` |

### Contract Operations

| Type | Operation | Library Method |
|---|---|---|
| Query | `getContract(id: ID!)` | `client.contracts.get(id)` |
| Query | `getContractsByClient(clientId: ID!)` | `client.contracts.listByClient(clientId, params?)` |
| Mutation | `createClientContract(clientId: ID!, input: ContractInput!)` | `client.contracts.create(clientId, data)` |
| Mutation | `updateContract(id: ID!, input: ContractInput!)` | `client.contracts.update(id, data)` |
| Mutation | `renewContract(id: ID!, input: RenewalInput!)` | `client.contracts.renew(id, data)` |

### Alert Operations

| Type | Operation | Library Method |
|---|---|---|
| Query | `getAlertList(...)` | `client.alerts.list(params?)` |
| Query | `getAlertsForAsset(assetId: ID!)` | `client.alerts.listByAsset(assetId, params?)` |
| Query | `getAlertsByClient(clientId: ID!)` | `client.alerts.listByClient(clientId, params?)` |
| Query | `getAlertsBySeverity(severity: AlertSeverity!)` | `client.alerts.listBySeverity(severity, params?)` |
| Mutation | `createAlert(input: AlertInput!)` | `client.alerts.create(data)` |
| Mutation | `acknowledgeAlert(id: ID!)` | `client.alerts.acknowledge(id)` |
| Mutation | `resolveAlert(id: ID!)` | `client.alerts.resolve(id)` |
| Mutation | `dismissAlert(id: ID!)` | `client.alerts.dismiss(id)` |

### Knowledge Base Operations

| Type | Operation | Library Method |
|---|---|---|
| Query | `getKbArticle(id: ID!)` | `client.knowledgeBase.getArticle(id)` |
| Query | `getKbCollection(id: ID!)` | `client.knowledgeBase.getCollection(id)` |
| Query | `searchKnowledgeBase(query: String!)` | `client.knowledgeBase.search(query, params?)` |
| Mutation | `createKbCollection(input: KbCollectionInput!)` | `client.knowledgeBase.createCollection(data)` |
| Mutation | `createKbArticle(input: KbArticleInput!)` | `client.knowledgeBase.createArticle(data)` |
| Mutation | `updateKbArticle(id: ID!, input: KbArticleInput!)` | `client.knowledgeBase.updateArticle(id, data)` |
| Mutation | `publishKbArticle(id: ID!)` | `client.knowledgeBase.publishArticle(id)` |

### Technician Operations

| Type | Operation | Library Method |
|---|---|---|
| Query | `getTechnician(id: ID!)` | `client.technicians.get(id)` |
| Query | `getTechnicianList(...)` | `client.technicians.list(params?)` |
| Query | `getTechnicianAvailability(id: ID!, date: Date!)` | `client.technicians.getAvailability(id, date)` |
| Mutation | `updateTechnician(id: ID!, input: TechnicianInput!)` | `client.technicians.update(id, data)` |

### Runbook Operations

| Type | Operation | Library Method |
|---|---|---|
| Query | `getRunbook(id: ID!)` | `client.runbooks.get(id)` |
| Query | `getRunbookList(...)` | `client.runbooks.list(params?)` |
| Mutation | `executeRunbook(id: ID!, targetIds: [ID!]!)` | `client.runbooks.execute(id, targetIds)` |
| Mutation | `getRunbookExecutionStatus(executionId: ID!)` | `client.runbooks.getExecutionStatus(executionId)` |

### Patch Management Operations

| Type | Operation | Library Method |
|---|---|---|
| Query | `getPatchList(...)` | `client.patches.list(params?)` |
| Query | `getPatchesByAsset(assetId: ID!)` | `client.patches.listByAsset(assetId, params?)` |
| Query | `getPatchComplianceReport(...)` | `client.patches.getComplianceReport(params?)` |
| Mutation | `approvePatch(id: ID!)` | `client.patches.approve(id)` |
| Mutation | `schedulePatchDeployment(input: PatchDeploymentInput!)` | `client.patches.scheduleDeployment(data)` |

### Remote Access Operations

| Type | Operation | Library Method |
|---|---|---|
| Query | `getRemoteSession(id: ID!)` | `client.remoteSessions.get(id)` |
| Mutation | `initiateRemoteSession(assetId: ID!, type: SessionType!)` | `client.remoteSessions.initiate(assetId, type)` |
| Mutation | `terminateRemoteSession(id: ID!)` | `client.remoteSessions.terminate(id)` |

### Reporting Operations

| Type | Operation | Library Method |
|---|---|---|
| Query | `getTicketMetrics(dateRange: DateRange!)` | `client.reports.ticketMetrics(dateRange)` |
| Query | `getAssetSummary(...)` | `client.reports.assetSummary(params?)` |
| Query | `getTechnicianPerformance(dateRange: DateRange!)` | `client.reports.technicianPerformance(dateRange)` |
| Query | `getClientHealthScores(...)` | `client.reports.clientHealthScores(params?)` |

---

## Filtering & Query Parameters

SuperOps.ai GraphQL queries support rich filtering:

```typescript
// Using filter objects
const tickets = await client.tickets.list({
  first: 50,
  filter: {
    status: ['OPEN', 'IN_PROGRESS'],
    priority: 'HIGH',
    createdAfter: '2025-01-01T00:00:00Z',
    clientId: 'client-123',
  },
  orderBy: {
    field: 'CREATED_AT',
    direction: 'DESC',
  },
});
```

The library transforms these into GraphQL variables:

```graphql
query GetTicketList(
  $first: Int
  $filter: TicketFilterInput
  $orderBy: TicketOrderInput
) {
  getTicketList(first: $first, filter: $filter, orderBy: $orderBy) {
    edges {
      node { ... }
    }
    pageInfo { ... }
  }
}
```

---

## Date Handling

SuperOps.ai uses ISO 8601 date strings in UTC. The library should:

1. Accept `Date` objects, ISO strings, or Unix timestamps for input
2. Convert all to ISO 8601 strings for GraphQL variables
3. Return `Date` objects (or configurable: raw string) for response fields

```typescript
// Configure date handling
const client = new SuperOpsClient({
  // ...
  dates: 'date',  // 'date' (Date objects) | 'string' (ISO strings)
});
```

---

## Error Handling

### Error Classes

```typescript
class SuperOpsError extends Error {
  code: string;
  response: any;
  graphqlErrors?: Array<GraphQLError>;
}

class SuperOpsAuthenticationError extends SuperOpsError {}   // Invalid token / missing header
class SuperOpsNotFoundError extends SuperOpsError {}          // Resource not found
class SuperOpsValidationError extends SuperOpsError {         // Input validation failure
  validationErrors: Array<{ field: string; message: string }>;
}
class SuperOpsRateLimitError extends SuperOpsError {}         // Rate limit exceeded
class SuperOpsServerError extends SuperOpsError {}            // Server errors
```

### Error Behavior

- **Authentication errors**: Throw `SuperOpsAuthenticationError` immediately (no retry)
- **Not found**: Throw `SuperOpsNotFoundError`
- **Validation errors**: Throw `SuperOpsValidationError` with parsed field-level errors
- **Rate limit**: Retry with exponential backoff (up to `maxRetries`), then throw `SuperOpsRateLimitError`
- **Server errors**: Retry once with delay, then throw `SuperOpsServerError`

---

## Test Strategy

### Principles

1. **Zero live API calls** — All tests use mocked GraphQL responses
2. **Fixture-based** — JSON response fixtures match real SuperOps API response structures
3. **Coverage targets** — Minimum 90% line coverage, 100% of public methods tested
4. **Error path testing** — Every error class has dedicated test cases
5. **Pagination testing** — Multi-page cursor scenarios with mock sequences

### Mock Architecture

Using MSW with GraphQL handlers:

```typescript
// tests/mocks/handlers.ts
import { graphql, HttpResponse } from 'msw';

const superopsApi = graphql.link('https://api.superops.ai/msp');

export const handlers = [
  superopsApi.query('GetAsset', ({ variables }) => {
    const { id } = variables;
    if (id === 'not-found') {
      return HttpResponse.json({
        errors: [{ message: 'Asset not found', extensions: { code: 'NOT_FOUND' } }]
      });
    }
    return HttpResponse.json({ data: fixtures.assets.single });
  }),

  superopsApi.query('GetAssetList', ({ variables }) => {
    const { after } = variables;
    if (!after) {
      return HttpResponse.json({ data: fixtures.assets.listPage1 });
    }
    return HttpResponse.json({ data: fixtures.assets.listPage2 });
  }),

  superopsApi.mutation('CreateTicket', ({ variables }) => {
    return HttpResponse.json({ data: fixtures.tickets.created });
  }),

  // Rate limit simulation
  superopsApi.query('RateLimited', () => {
    return HttpResponse.json({
      errors: [{
        message: 'Rate limit exceeded',
        extensions: { code: 'RATE_LIMITED' }
      }]
    });
  }),
];
```

### Test Categories

| Category | Description | Example Tests |
|---|---|---|
| **Unit — Client** | Client initialization, config validation | Region/vertical URL mapping, missing token error |
| **Unit — GraphQL** | Query construction | Variable injection, operation naming |
| **Unit — Pagination** | Cursor-based traversal | `hasNextPage` following, empty results, single page |
| **Unit — Rate Limiter** | Throttling logic | Counter tracking, threshold delay, reset after window |
| **Integration — Assets** | Asset queries & mutations | Get, list, create, update, delete |
| **Integration — Tickets** | Ticket operations | CRUD, notes, time entries, status changes |
| **Integration — Clients** | Client operations | CRUD, search, archive |
| **Integration — Alerts** | Alert operations | List, acknowledge, resolve, dismiss |
| **Integration — KB** | Knowledge base operations | Collections, articles, search |
| **Integration — Errors** | Error handling paths | Auth errors, validation errors, rate limits |

### Fixture Structure

```
tests/fixtures/
├── assets/
│   ├── single.json               # Single asset response
│   ├── listPage1.json            # First page of assets
│   ├── listPage2.json            # Second page (for pagination tests)
│   ├── created.json              # Create mutation response
│   └── errors/
│       ├── not-found.json
│       └── validation.json
├── tickets/
│   ├── single.json
│   ├── listPage1.json
│   ├── listPage2.json
│   ├── created.json
│   ├── updated.json
│   └── ...
├── clients/
│   ├── single.json
│   ├── list.json
│   ├── search-results.json
│   └── ...
├── alerts/
│   ├── list.json
│   ├── by-asset.json
│   └── ...
├── knowledge-base/
│   ├── article.json
│   ├── collection.json
│   └── search-results.json
└── ...
```

---

## Usage Examples

### Basic CRUD

```typescript
import { SuperOpsClient } from 'node-superops';

const client = new SuperOpsClient({
  apiToken: process.env.SUPEROPS_API_TOKEN!,
  customerSubDomain: process.env.SUPEROPS_SUBDOMAIN!,
  region: 'us',
  vertical: 'msp',
});

// Get an asset
const asset = await client.assets.get('asset-123');

// List tickets with filters
const tickets = await client.tickets.list({
  first: 50,
  filter: {
    status: ['OPEN'],
    priority: 'HIGH',
  },
});

// Create a ticket
const newTicket = await client.tickets.create({
  subject: 'Server down',
  description: 'Production server is unresponsive',
  clientId: 'client-456',
  priority: 'CRITICAL',
});

// Update ticket status
await client.tickets.changeStatus(newTicket.id, 'IN_PROGRESS');

// Add a note
await client.tickets.addNote(newTicket.id, 'Investigating the issue');

// Resolve an alert
await client.alerts.resolve('alert-789');
```

### Pagination

```typescript
// Auto-paginate all assets for a client
for await (const asset of client.assets.listByClientAll('client-123')) {
  console.log(asset.name, asset.type);
}

// Collect all open alerts
const allAlerts = await client.alerts.listAll({
  filter: { status: 'OPEN' }
}).toArray();
```

### Knowledge Base

```typescript
// Search knowledge base
const results = await client.knowledgeBase.search('password reset');

// Create an article
const article = await client.knowledgeBase.createArticle({
  title: 'How to Reset Passwords',
  content: '# Steps\n1. Go to settings...',
  collectionId: 'collection-123',
  tags: ['passwords', 'self-service'],
});

// Publish it
await client.knowledgeBase.publishArticle(article.id);
```

### Runbooks & Automation

```typescript
// Execute a runbook on multiple assets
const execution = await client.runbooks.execute('runbook-123', [
  'asset-001',
  'asset-002',
  'asset-003',
]);

// Check status
const status = await client.runbooks.getExecutionStatus(execution.id);
console.log(status.progress, status.completed, status.failed);
```

---

## Implementation Phases

### Phase 1 — Core Foundation
- Client class with config, region/vertical mapping
- GraphQL client setup with `graphql-request`
- Authentication header injection
- Rate limiter
- Cursor-based pagination utilities
- Error classes with GraphQL error parsing
- GraphQL codegen setup
- Assets CRUD (reference implementation)
- Full test infrastructure with MSW GraphQL mocks

### Phase 2 — Ticket Management
- Ticket queries and mutations
- Time entries, notes, status changes
- Assignment operations
- Ticket search and filtering

### Phase 3 — Client & Site Management
- Client CRUD and search
- Site operations
- Contract management

### Phase 4 — Alert & Monitoring
- Alert queries
- Alert acknowledgment, resolution, dismissal
- Alert creation for custom monitoring

### Phase 5 — Knowledge Base & Automation
- Knowledge base collections and articles
- Search functionality
- Runbook operations
- Patch management

### Phase 6 — Polish & Release
- Comprehensive type generation from schema
- README documentation with examples
- CHANGELOG
- NPM publish configuration
- CI/CD pipeline (GitHub Actions)
- 90%+ test coverage verification
- Schema introspection utilities

---

## Acceptance Criteria

1. Every query and mutation in the inventory has a corresponding library method
2. Every library method has at least one passing test
3. TypeScript types are generated from the GraphQL schema
4. All 4 regional endpoints (US/EU x MSP/IT) are correctly mapped
5. Cursor-based pagination correctly follows `hasNextPage`/`endCursor`
6. Rate limiter prevents exceeding 800 req/min
7. GraphQL errors are parsed and thrown as typed exceptions
8. Date handling works for ISO 8601 ↔ Date object conversion
9. No test makes a live API call
10. TypeScript strict mode compiles with zero errors
11. Test coverage >= 90%

---

## Appendix: GraphQL vs REST

Key differences from REST-based MSP libraries:

| Aspect | REST (IT Glue, Datto RMM) | GraphQL (SuperOps) |
|---|---|---|
| Endpoint structure | Multiple URL paths | Single endpoint |
| Data fetching | Fixed response shapes | Client-defined fields |
| Pagination | Page numbers or links | Cursors (`after`/`before`) |
| Mutations | POST/PATCH/DELETE verbs | Named mutation operations |
| Type generation | Manual from docs | Automatic from schema |
| Error format | HTTP status + JSON body | `errors` array in response |
| Batching | Multiple HTTP requests | Multiple operations in one request |

The library should leverage GraphQL's strengths (precise data fetching, schema-based types) while providing the same developer-friendly interface as REST-based libraries.
