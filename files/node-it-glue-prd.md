# node-it-glue

## Product Requirements Document

**Version:** 1.0  
**Author:** Aaron / WYRE AI  
**Date:** February 4, 2026  
**Status:** Draft  
**Repository:** `kaseya/it-glue/node-it-glue`  
**Parent Project:** MSP Claude Plugin Marketplace

---

## Executive Summary

`node-it-glue` is a comprehensive, fully-typed Node.js/TypeScript library providing complete coverage of the IT Glue API. It follows the same architectural patterns established by the existing `node-autotask` library and serves as a core dependency for the Kaseya ecosystem plugins within the MSP Claude Plugin Marketplace.

The library wraps all 70+ IT Glue API endpoints, provides automatic pagination, rate limiting, retry logic, and ships with a full test suite using mocked API responses — no live API calls required for testing.

---

## Problem Statement

IT Glue is the de facto documentation platform for MSPs. Its API follows the JSON:API specification, which introduces structural complexity (nested `data`, `attributes`, `relationships`, `included` arrays) that developers must manually navigate. Existing community libraries are incomplete, poorly typed, or abandoned.

Building Claude plugins and automation tools against IT Glue requires a reliable, well-tested foundation library that handles authentication, pagination, rate limiting, and the JSON:API envelope transparently.

---

## Goals

1. **Complete API coverage** — Every documented IT Glue endpoint is implemented
2. **Strong TypeScript types** — Full type definitions for all request/response payloads
3. **JSON:API abstraction** — Unwrap the JSON:API envelope so consumers work with clean objects
4. **Automatic pagination** — Iterator/generator patterns for seamless multi-page retrieval
5. **Rate limit handling** — Built-in request throttling (3000 req / 5 min) with backoff
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
node-it-glue/
├── src/
│   ├── index.ts                    # Public API exports
│   ├── client.ts                   # ITGlueClient class
│   ├── config.ts                   # Configuration types & defaults
│   ├── errors.ts                   # Custom error classes
│   ├── http.ts                     # HTTP layer (fetch wrapper)
│   ├── pagination.ts               # Pagination utilities
│   ├── rate-limiter.ts             # Rate limiting logic
│   ├── jsonapi.ts                  # JSON:API deserialization/serialization
│   ├── types/
│   │   ├── index.ts                # Re-exports
│   │   ├── common.ts               # Shared types (pagination, filters, etc.)
│   │   ├── organizations.ts
│   │   ├── configurations.ts
│   │   ├── contacts.ts
│   │   ├── documents.ts
│   │   ├── passwords.ts
│   │   ├── flexible-assets.ts
│   │   ├── locations.ts
│   │   ├── users.ts
│   │   └── ...                     # One file per resource domain
│   └── resources/
│       ├── organizations.ts
│       ├── organization-types.ts
│       ├── organization-statuses.ts
│       ├── configurations.ts
│       ├── configuration-types.ts
│       ├── configuration-statuses.ts
│       ├── configuration-interfaces.ts
│       ├── contacts.ts
│       ├── contact-types.ts
│       ├── documents.ts
│       ├── passwords.ts
│       ├── password-categories.ts
│       ├── password-folders.ts
│       ├── flexible-assets.ts
│       ├── flexible-asset-types.ts
│       ├── flexible-asset-fields.ts
│       ├── locations.ts
│       ├── users.ts
│       ├── user-metrics.ts
│       ├── groups.ts
│       ├── manufacturers.ts
│       ├── models.ts
│       ├── platforms.ts
│       ├── operating-systems.ts
│       ├── countries.ts
│       ├── regions.ts
│       ├── domains.ts
│       ├── expirations.ts
│       ├── attachments.ts
│       ├── related-items.ts
│       ├── exports.ts
│       ├── logs.ts
│       ├── checklists.ts
│       └── document-images.ts
├── tests/
│   ├── setup.ts                    # Test setup, mock server config
│   ├── fixtures/                   # JSON response fixtures
│   │   ├── organizations.json
│   │   ├── configurations.json
│   │   └── ...
│   ├── mocks/                      # MSW/nock handler definitions
│   │   ├── handlers.ts
│   │   └── server.ts
│   ├── unit/
│   │   ├── client.test.ts
│   │   ├── jsonapi.test.ts
│   │   ├── pagination.test.ts
│   │   ├── rate-limiter.test.ts
│   │   └── ...
│   └── integration/
│       ├── organizations.test.ts
│       ├── configurations.test.ts
│       ├── contacts.test.ts
│       ├── documents.test.ts
│       ├── passwords.test.ts
│       ├── flexible-assets.test.ts
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
import { ITGlueClient } from 'node-it-glue';

const client = new ITGlueClient({
  apiKey: 'ITG.xxxxxxxxxxxxxxxxxxxxxxxx',
  region: 'us',          // 'us' | 'eu' | 'au'
  // OR explicit base URL:
  // baseUrl: 'https://api.itglue.com',
});
```

### Implementation Details

All requests include these headers:

```
x-api-key: {apiKey}
Content-Type: application/vnd.api+json
Accept: application/vnd.api+json
```

Regional base URLs:

| Region | Base URL |
|---|---|
| `us` | `https://api.itglue.com` |
| `eu` | `https://api.eu.itglue.com` |
| `au` | `https://api.au.itglue.com` |

API keys auto-revoke after 90 days of inactivity. The client should surface clear errors when authentication fails (HTTP 401/403).

---

## Rate Limiting

IT Glue enforces 3000 requests per 5-minute sliding window. The library must implement:

1. **Request counter** — Track requests within the rolling 5-minute window
2. **Preemptive throttling** — Slow down when approaching the limit (e.g., at 80% threshold)
3. **429 handling** — On `429 Too Many Requests`, back off and retry with exponential delay
4. **Configurable** — Allow users to adjust thresholds and disable throttling

```typescript
interface RateLimitConfig {
  enabled: boolean;             // default: true
  maxRequests: number;          // default: 3000
  windowMs: number;             // default: 300000 (5 minutes)
  throttleThreshold: number;    // default: 0.8 (80%)
  retryAfterMs: number;         // default: 5000
  maxRetries: number;           // default: 3
}
```

---

## JSON:API Handling

IT Glue's API conforms to the JSON:API specification (jsonapi.org). This adds envelope structure that the library should abstract away.

### Raw API Response Structure

```json
{
  "data": [
    {
      "id": "123",
      "type": "organizations",
      "attributes": {
        "name": "Acme Corp",
        "organization-type-name": "Customer",
        "created-at": "2024-01-15T10:30:00.000Z",
        "updated-at": "2024-06-20T14:22:00.000Z"
      },
      "relationships": {
        "locations": {
          "data": [{ "id": "456", "type": "locations" }]
        }
      }
    }
  ],
  "meta": {
    "current-page": 1,
    "next-page": 2,
    "prev-page": null,
    "total-pages": 5,
    "total-count": 112
  }
}
```

### Deserialized Client Response

The library should deserialize JSON:API into flat, TypeScript-friendly objects:

```typescript
{
  data: [
    {
      id: '123',
      type: 'organizations',
      name: 'Acme Corp',
      organizationTypeName: 'Customer',
      createdAt: '2024-01-15T10:30:00.000Z',
      updatedAt: '2024-06-20T14:22:00.000Z',
      relationships: {
        locations: [{ id: '456', type: 'locations' }]
      }
    }
  ],
  meta: {
    currentPage: 1,
    nextPage: 2,
    prevPage: null,
    totalPages: 5,
    totalCount: 112
  }
}
```

Key transformations:
- Flatten `attributes` into the top-level object
- Convert kebab-case keys to camelCase
- Preserve `relationships` as a nested map
- Convert `meta` pagination keys to camelCase
- Optionally include `included` resources (sideloaded data) via config flag

### Serialization (for POST/PATCH)

When creating or updating resources, the library must re-wrap user-friendly objects back into the JSON:API envelope:

```typescript
// User provides:
client.organizations.create({
  name: 'New Client',
  organizationTypeId: 42,
});

// Library sends:
{
  "data": {
    "type": "organizations",
    "attributes": {
      "name": "New Client",
      "organization-type-id": 42
    }
  }
}
```

---

## Pagination

IT Glue supports up to 1000 results per page with `page[size]` and `page[number]` parameters.

### Automatic Pagination

```typescript
// Get a single page
const page1 = await client.organizations.list({ page: { size: 50, number: 1 } });

// Auto-paginate all results (async generator)
for await (const org of client.organizations.listAll()) {
  console.log(org.name);
}

// Collect all into an array
const allOrgs = await client.organizations.listAll().toArray();
```

### Implementation

The `listAll()` method returns an `AsyncIterable` that:
1. Fetches the first page
2. Reads `meta.next-page` to determine if more pages exist
3. Continues fetching until `next-page` is `null`
4. Yields individual records, not pages
5. Respects rate limits between page fetches

---

## Complete Endpoint Inventory

### Organizations

| Method | Endpoint | Library Method |
|---|---|---|
| GET | `/organizations` | `client.organizations.list(params?)` |
| GET | `/organizations/:id` | `client.organizations.get(id, params?)` |
| POST | `/organizations` | `client.organizations.create(data)` |
| PATCH | `/organizations/:id` | `client.organizations.update(id, data)` |
| DELETE | `/organizations/:id` | `client.organizations.delete(id)` |

### Organization Types

| Method | Endpoint | Library Method |
|---|---|---|
| GET | `/organization_types` | `client.organizationTypes.list(params?)` |
| POST | `/organization_types` | `client.organizationTypes.create(data)` |
| PATCH | `/organization_types/:id` | `client.organizationTypes.update(id, data)` |

### Organization Statuses

| Method | Endpoint | Library Method |
|---|---|---|
| GET | `/organization_statuses` | `client.organizationStatuses.list(params?)` |
| POST | `/organization_statuses` | `client.organizationStatuses.create(data)` |
| PATCH | `/organization_statuses/:id` | `client.organizationStatuses.update(id, data)` |

### Locations

| Method | Endpoint | Library Method |
|---|---|---|
| GET | `/organizations/:org_id/relationships/locations` | `client.locations.listByOrg(orgId, params?)` |
| GET | `/locations` | `client.locations.list(params?)` |
| GET | `/locations/:id` | `client.locations.get(id, params?)` |
| POST | `/locations` | `client.locations.create(data)` |
| PATCH | `/locations/:id` | `client.locations.update(id, data)` |
| DELETE | `/locations/:id` | `client.locations.delete(id)` |

### Contacts

| Method | Endpoint | Library Method |
|---|---|---|
| GET | `/contacts` | `client.contacts.list(params?)` |
| GET | `/organizations/:org_id/relationships/contacts` | `client.contacts.listByOrg(orgId, params?)` |
| GET | `/contacts/:id` | `client.contacts.get(id, params?)` |
| POST | `/contacts` | `client.contacts.create(data)` |
| PATCH | `/contacts/:id` | `client.contacts.update(id, data)` |
| DELETE | `/contacts/:id` | `client.contacts.delete(id)` |

### Contact Types

| Method | Endpoint | Library Method |
|---|---|---|
| GET | `/contact_types` | `client.contactTypes.list(params?)` |
| POST | `/contact_types` | `client.contactTypes.create(data)` |
| PATCH | `/contact_types/:id` | `client.contactTypes.update(id, data)` |

### Configurations (Assets)

| Method | Endpoint | Library Method |
|---|---|---|
| GET | `/configurations` | `client.configurations.list(params?)` |
| GET | `/organizations/:org_id/relationships/configurations` | `client.configurations.listByOrg(orgId, params?)` |
| GET | `/configurations/:id` | `client.configurations.get(id, params?)` |
| POST | `/configurations` | `client.configurations.create(data)` |
| PATCH | `/configurations/:id` | `client.configurations.update(id, data)` |
| DELETE | `/configurations/:id` | `client.configurations.delete(id)` |

### Configuration Types

| Method | Endpoint | Library Method |
|---|---|---|
| GET | `/configuration_types` | `client.configurationTypes.list(params?)` |
| POST | `/configuration_types` | `client.configurationTypes.create(data)` |
| PATCH | `/configuration_types/:id` | `client.configurationTypes.update(id, data)` |

### Configuration Statuses

| Method | Endpoint | Library Method |
|---|---|---|
| GET | `/configuration_statuses` | `client.configurationStatuses.list(params?)` |
| POST | `/configuration_statuses` | `client.configurationStatuses.create(data)` |
| PATCH | `/configuration_statuses/:id` | `client.configurationStatuses.update(id, data)` |

### Configuration Interfaces

| Method | Endpoint | Library Method |
|---|---|---|
| GET | `/configurations/:config_id/relationships/configuration_interfaces` | `client.configurationInterfaces.listByConfig(configId, params?)` |
| POST | `/configuration_interfaces` | `client.configurationInterfaces.create(data)` |
| PATCH | `/configuration_interfaces/:id` | `client.configurationInterfaces.update(id, data)` |
| DELETE | `/configuration_interfaces/:id` | `client.configurationInterfaces.delete(id)` |

### Documents

| Method | Endpoint | Library Method |
|---|---|---|
| GET | `/documents` | `client.documents.list(params?)` |
| GET | `/organizations/:org_id/relationships/documents` | `client.documents.listByOrg(orgId, params?)` |
| GET | `/documents/:id` | `client.documents.get(id, params?)` |
| POST | `/documents` | `client.documents.create(data)` |
| PATCH | `/documents/:id` | `client.documents.update(id, data)` |
| PATCH | `/documents/:id/publish` | `client.documents.publish(id)` |
| DELETE | `/documents/:id` | `client.documents.delete(id)` |

### Document Sections

| Method | Endpoint | Library Method |
|---|---|---|
| GET | `/documents/:doc_id/relationships/sections` | `client.documentSections.listByDoc(docId, params?)` |
| POST | `/documents/:doc_id/relationships/sections` | `client.documentSections.create(docId, data)` |
| PATCH | `/documents/:doc_id/relationships/sections/:id` | `client.documentSections.update(docId, id, data)` |
| DELETE | `/documents/:doc_id/relationships/sections/:id` | `client.documentSections.delete(docId, id)` |

### Document Images

| Method | Endpoint | Library Method |
|---|---|---|
| GET | `/document_images` | `client.documentImages.list(params?)` |
| POST | `/document_images` | `client.documentImages.create(data)` |
| DELETE | `/document_images/:id` | `client.documentImages.delete(id)` |

### Passwords

| Method | Endpoint | Library Method |
|---|---|---|
| GET | `/passwords` | `client.passwords.list(params?)` |
| GET | `/organizations/:org_id/relationships/passwords` | `client.passwords.listByOrg(orgId, params?)` |
| GET | `/passwords/:id` | `client.passwords.get(id, params?)` |
| POST | `/passwords` | `client.passwords.create(data)` |
| PATCH | `/passwords/:id` | `client.passwords.update(id, data)` |
| DELETE | `/passwords/:id` | `client.passwords.delete(id)` |

### Password Categories

| Method | Endpoint | Library Method |
|---|---|---|
| GET | `/password_categories` | `client.passwordCategories.list(params?)` |
| POST | `/password_categories` | `client.passwordCategories.create(data)` |
| PATCH | `/password_categories/:id` | `client.passwordCategories.update(id, data)` |

### Password Folders

| Method | Endpoint | Library Method |
|---|---|---|
| GET | `/organizations/:org_id/relationships/password_folders` | `client.passwordFolders.listByOrg(orgId, params?)` |
| POST | `/organizations/:org_id/relationships/password_folders` | `client.passwordFolders.create(orgId, data)` |
| PATCH | `/organizations/:org_id/relationships/password_folders/:id` | `client.passwordFolders.update(orgId, id, data)` |
| DELETE | `/organizations/:org_id/relationships/password_folders/:id` | `client.passwordFolders.delete(orgId, id)` |

### Flexible Asset Types

| Method | Endpoint | Library Method |
|---|---|---|
| GET | `/flexible_asset_types` | `client.flexibleAssetTypes.list(params?)` |
| GET | `/flexible_asset_types/:id` | `client.flexibleAssetTypes.get(id, params?)` |
| POST | `/flexible_asset_types` | `client.flexibleAssetTypes.create(data)` |
| PATCH | `/flexible_asset_types/:id` | `client.flexibleAssetTypes.update(id, data)` |

### Flexible Asset Fields

| Method | Endpoint | Library Method |
|---|---|---|
| GET | `/flexible_asset_types/:type_id/relationships/flexible_asset_fields` | `client.flexibleAssetFields.listByType(typeId, params?)` |
| POST | `/flexible_asset_fields` | `client.flexibleAssetFields.create(data)` |
| PATCH | `/flexible_asset_fields/:id` | `client.flexibleAssetFields.update(id, data)` |
| DELETE | `/flexible_asset_fields/:id` | `client.flexibleAssetFields.delete(id)` |

### Flexible Assets

| Method | Endpoint | Library Method |
|---|---|---|
| GET | `/flexible_assets` | `client.flexibleAssets.list(params?)` |
| GET | `/flexible_assets/:id` | `client.flexibleAssets.get(id, params?)` |
| POST | `/flexible_assets` | `client.flexibleAssets.create(data)` |
| PATCH | `/flexible_assets/:id` | `client.flexibleAssets.update(id, data)` |
| DELETE | `/flexible_assets/:id` | `client.flexibleAssets.delete(id)` |

### Users

| Method | Endpoint | Library Method |
|---|---|---|
| GET | `/users` | `client.users.list(params?)` |
| GET | `/users/:id` | `client.users.get(id, params?)` |
| PATCH | `/users/:id` | `client.users.update(id, data)` |
| PATCH | `/users` | `client.users.bulkUpdate(data)` |

### User Metrics

| Method | Endpoint | Library Method |
|---|---|---|
| GET | `/user_metrics` | `client.userMetrics.list(params?)` |

### Manufacturers

| Method | Endpoint | Library Method |
|---|---|---|
| GET | `/manufacturers` | `client.manufacturers.list(params?)` |
| GET | `/manufacturers/:id` | `client.manufacturers.get(id, params?)` |
| POST | `/manufacturers` | `client.manufacturers.create(data)` |
| PATCH | `/manufacturers/:id` | `client.manufacturers.update(id, data)` |

### Models

| Method | Endpoint | Library Method |
|---|---|---|
| GET | `/manufacturers/:mfg_id/relationships/models` | `client.models.listByManufacturer(mfgId, params?)` |
| POST | `/models` | `client.models.create(data)` |
| PATCH | `/models/:id` | `client.models.update(id, data)` |

### Platforms

| Method | Endpoint | Library Method |
|---|---|---|
| GET | `/platforms` | `client.platforms.list(params?)` |

### Operating Systems

| Method | Endpoint | Library Method |
|---|---|---|
| GET | `/operating_systems` | `client.operatingSystems.list(params?)` |

### Countries

| Method | Endpoint | Library Method |
|---|---|---|
| GET | `/countries` | `client.countries.list(params?)` |
| GET | `/countries/:id` | `client.countries.get(id, params?)` |

### Regions

| Method | Endpoint | Library Method |
|---|---|---|
| GET | `/countries/:country_id/relationships/regions` | `client.regions.listByCountry(countryId, params?)` |

### Domains

| Method | Endpoint | Library Method |
|---|---|---|
| GET | `/organizations/:org_id/relationships/domains` | `client.domains.listByOrg(orgId, params?)` |

### Expirations

| Method | Endpoint | Library Method |
|---|---|---|
| GET | `/expirations` | `client.expirations.list(params?)` |
| GET | `/expirations/:id` | `client.expirations.get(id, params?)` |

### Attachments

| Method | Endpoint | Library Method |
|---|---|---|
| GET | `/:resource_type/:resource_id/relationships/attachments` | `client.attachments.list(resourceType, resourceId, params?)` |
| POST | `/:resource_type/:resource_id/relationships/attachments` | `client.attachments.create(resourceType, resourceId, data)` |
| PATCH | `/:resource_type/:resource_id/relationships/attachments/:id` | `client.attachments.update(resourceType, resourceId, id, data)` |
| DELETE | `/:resource_type/:resource_id/relationships/attachments/:id` | `client.attachments.delete(resourceType, resourceId, id)` |

### Related Items

| Method | Endpoint | Library Method |
|---|---|---|
| POST | `/:resource_type/:resource_id/relationships/related_items` | `client.relatedItems.create(resourceType, resourceId, data)` |
| PATCH | `/:resource_type/:resource_id/relationships/related_items/:id` | `client.relatedItems.update(resourceType, resourceId, id, data)` |
| DELETE | `/:resource_type/:resource_id/relationships/related_items/:id` | `client.relatedItems.delete(resourceType, resourceId, id)` |

### Exports

| Method | Endpoint | Library Method |
|---|---|---|
| GET | `/exports` | `client.exports.list(params?)` |
| GET | `/exports/:id` | `client.exports.get(id, params?)` |
| POST | `/exports` | `client.exports.create(data)` |
| DELETE | `/exports/:id` | `client.exports.delete(id)` |

### Groups

| Method | Endpoint | Library Method |
|---|---|---|
| GET | `/groups` | `client.groups.list(params?)` |
| GET | `/groups/:id` | `client.groups.get(id, params?)` |
| POST | `/groups` | `client.groups.create(data)` |
| PATCH | `/groups/:id` | `client.groups.update(id, data)` |
| DELETE | `/groups/:id` | `client.groups.delete(id)` |

### Logs

| Method | Endpoint | Library Method |
|---|---|---|
| GET | `/logs` | `client.logs.list(params?)` |

### Checklists

| Method | Endpoint | Library Method |
|---|---|---|
| GET | `/organizations/:org_id/relationships/checklists` | `client.checklists.listByOrg(orgId, params?)` |
| GET | `/checklists/:id` | `client.checklists.get(id, params?)` |
| PATCH | `/checklists/:id` | `client.checklists.update(id, data)` |
| DELETE | `/checklists/:id` | `client.checklists.delete(id)` |

---

## Filtering & Query Parameters

IT Glue supports extensive filtering via query parameters. The library should provide a typed filter builder:

```typescript
// Direct filter params
const orgs = await client.organizations.list({
  filter: {
    name: 'Acme',
    organizationTypeId: 42,
    organizationStatusId: 1,
    excludeId: [100, 200],
    createdAt: { gt: '2024-01-01' },
    updatedAt: { lt: '2025-01-01' },
  },
  sort: 'name',          // or '-name' for descending
  page: { size: 100, number: 1 },
  include: 'locations',  // sideload related resources
});
```

The library should transform these into IT Glue's query parameter format:
- `filter[name]=Acme`
- `filter[organization-type-id]=42`
- `filter[exclude][id]=100,200`
- `sort=name`
- `page[size]=100`
- `page[number]=1`
- `include=locations`

---

## Error Handling

### Error Classes

```typescript
class ITGlueError extends Error {
  statusCode: number;
  response: any;
}

class ITGlueAuthenticationError extends ITGlueError {}     // 401, 403
class ITGlueNotFoundError extends ITGlueError {}            // 404
class ITGlueValidationError extends ITGlueError {           // 422
  errors: Array<{ title: string; detail: string; source?: any }>;
}
class ITGlueRateLimitError extends ITGlueError {}           // 429
class ITGlueServerError extends ITGlueError {}              // 500+
```

### Error Behavior

- **401/403**: Throw `ITGlueAuthenticationError` immediately (no retry)
- **404**: Throw `ITGlueNotFoundError`
- **422**: Throw `ITGlueValidationError` with parsed error details from the JSON:API `errors` array
- **429**: Retry with exponential backoff (up to `maxRetries`), then throw `ITGlueRateLimitError`
- **500+**: Retry once with delay, then throw `ITGlueServerError`

---

## Test Strategy

### Principles

1. **Zero live API calls** — All tests use mocked HTTP responses
2. **Fixture-based** — JSON response fixtures match real IT Glue API response structures
3. **Coverage targets** — Minimum 90% line coverage, 100% of public methods tested
4. **Error path testing** — Every error class has dedicated test cases
5. **Pagination testing** — Multi-page scenarios with mock page sequences

### Mock Architecture

Using `nock` or MSW to intercept HTTP requests:

```typescript
// tests/mocks/handlers.ts
import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('https://api.itglue.com/organizations', ({ request }) => {
    const url = new URL(request.url);
    const page = url.searchParams.get('page[number]') || '1';
    return HttpResponse.json(fixtures.organizations[`page${page}`]);
  }),

  http.post('https://api.itglue.com/organizations', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json(fixtures.organizations.created, { status: 201 });
  }),

  // Rate limit simulation
  http.get('https://api.itglue.com/rate-limited', () => {
    return new HttpResponse(null, { status: 429 });
  }),
];
```

### Test Categories

| Category | Description | Example Tests |
|---|---|---|
| **Unit — Client** | Client initialization, config validation | Region URL mapping, missing API key error |
| **Unit — JSON:API** | Serialization/deserialization | Flatten attributes, camelCase conversion, relationship parsing |
| **Unit — Pagination** | Iterator behavior | Multi-page traversal, empty results, single page |
| **Unit — Rate Limiter** | Throttling logic | Counter tracking, threshold delay, reset after window |
| **Integration — Resources** | Each resource's CRUD operations | List, get, create, update, delete for every resource |
| **Integration — Filters** | Query parameter construction | Filter objects → query string conversion |
| **Integration — Errors** | Error handling paths | 401, 404, 422, 429, 500 response handling |

### Fixture Generation

Each fixture file contains realistic response payloads structured as JSON:API:

```
tests/fixtures/
├── organizations/
│   ├── list-page1.json      # First page of organizations
│   ├── list-page2.json      # Second page (for pagination tests)
│   ├── get-single.json      # Single organization response
│   ├── created.json         # POST response
│   └── errors/
│       ├── not-found.json   # 404 response
│       └── validation.json  # 422 response with errors array
├── configurations/
│   ├── list.json
│   ├── get-single.json
│   └── ...
└── ...
```

---

## Usage Examples

### Basic CRUD

```typescript
import { ITGlueClient } from 'node-it-glue';

const client = new ITGlueClient({
  apiKey: process.env.IT_GLUE_API_KEY!,
  region: 'us',
});

// List organizations
const orgs = await client.organizations.list({
  filter: { organizationStatusId: 1 },
  page: { size: 50 },
});

// Get single organization
const org = await client.organizations.get('12345');

// Create configuration
const config = await client.configurations.create({
  organizationId: 12345,
  name: 'DC-01',
  configurationTypeId: 7,
  configurationStatusId: 1,
});

// Update a password
await client.passwords.update('67890', {
  password: 'new-secure-password',
  notes: 'Rotated on 2026-02-04',
});

// Delete a flexible asset
await client.flexibleAssets.delete('11111');
```

### Pagination

```typescript
// Auto-paginate all configurations for an org
for await (const config of client.configurations.listAll({
  filter: { organizationId: 12345 },
})) {
  console.log(config.name, config.serialNumber);
}
```

### Flexible Assets

```typescript
// Query flexible assets by type
const networkAssets = await client.flexibleAssets.list({
  filter: {
    flexibleAssetTypeId: 42,
    organizationId: 12345,
  },
});
```

---

## Implementation Phases

### Phase 1 — Core Foundation
- Client class with auth, config, HTTP layer
- JSON:API serialization/deserialization
- Rate limiter
- Pagination utilities
- Error classes
- Organizations CRUD (reference implementation)
- Full test infrastructure with mocks

### Phase 2 — Configuration Management
- Configurations, Configuration Types, Configuration Statuses, Configuration Interfaces
- Manufacturers, Models, Platforms, Operating Systems

### Phase 3 — Documentation & Knowledge Base
- Documents, Document Sections, Document Images
- Flexible Asset Types, Flexible Asset Fields, Flexible Assets
- Passwords, Password Categories, Password Folders

### Phase 4 — Contacts, Locations, & Metadata
- Contacts, Contact Types
- Locations
- Users, User Metrics, Groups
- Countries, Regions

### Phase 5 — Remaining Resources
- Domains, Expirations, Logs
- Attachments, Related Items
- Exports, Checklists

### Phase 6 — Polish & Release
- README documentation with examples
- CHANGELOG
- NPM publish configuration
- CI/CD pipeline (GitHub Actions)
- 90%+ test coverage verification

---

## Acceptance Criteria

1. Every endpoint in the inventory has a corresponding library method
2. Every library method has at least one passing test
3. JSON:API deserialization produces clean, camelCased TypeScript objects
4. JSON:API serialization correctly wraps outbound payloads
5. Pagination iterators correctly traverse multi-page results
6. Rate limiter prevents exceeding 3000 req / 5 min
7. All error classes are thrown for their corresponding HTTP status codes
8. No test makes a live API call
9. TypeScript strict mode compiles with zero errors
10. Test coverage >= 90%
