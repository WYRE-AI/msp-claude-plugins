# node-datto-rmm

## Product Requirements Document

**Version:** 1.0  
**Author:** Aaron / WYRE AI  
**Date:** February 4, 2026  
**Status:** Draft  
**Repository:** `kaseya/datto-rmm/node-datto-rmm`  
**Parent Project:** MSP Claude Plugin Marketplace

---

## Executive Summary

`node-datto-rmm` is a comprehensive, fully-typed Node.js/TypeScript library providing complete coverage of the Datto RMM API v2. It follows the same architectural patterns established by the existing `node-autotask` library and serves as a core dependency for the Kaseya ecosystem plugins within the MSP Claude Plugin Marketplace.

The library wraps all 50+ Datto RMM API endpoints across account, site, device, alert, audit, job, filter, and system operations. It handles OAuth 2.0 token lifecycle management, automatic pagination, rate limiting, and ships with a full test suite using mocked API responses.

---

## Problem Statement

Datto RMM is a critical tool in the Kaseya/MSP ecosystem for remote monitoring and management. Its API uses OAuth 2.0 with opaque token management (100-hour expiry, platform-specific base URLs) and has aggressive rate limiting (600 req/60s with IP blocking on persistent violations). The API returns Unix timestamps with millisecond precision and uses pagination capped at 250 results per page.

Existing tooling is limited to a PowerShell module. There is no production-quality Node.js library, creating a gap for building Claude plugins, web applications, and automation tools in the JavaScript/TypeScript ecosystem.

---

## Goals

1. **Complete API coverage** — Every documented Datto RMM v2 endpoint is implemented
2. **Strong TypeScript types** — Full type definitions for all requests, responses, and alert context types
3. **OAuth 2.0 token management** — Automatic token acquisition, caching, and refresh
4. **Platform-aware** — Support all 6 Datto RMM platforms (Pinotage, Merlot, Concord, Vidal, Zinfandel, Syrah)
5. **Automatic pagination** — Iterator/generator patterns for seamless multi-page retrieval (250/page max)
6. **Rate limit handling** — Built-in request throttling (600 req/60s) with backoff to avoid IP blocking
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
node-datto-rmm/
├── src/
│   ├── index.ts                    # Public API exports
│   ├── client.ts                   # DattoRmmClient class
│   ├── config.ts                   # Configuration types & defaults
│   ├── errors.ts                   # Custom error classes
│   ├── http.ts                     # HTTP layer (fetch wrapper)
│   ├── auth.ts                     # OAuth 2.0 token management
│   ├── pagination.ts               # Pagination utilities
│   ├── rate-limiter.ts             # Rate limiting logic
│   ├── types/
│   │   ├── index.ts                # Re-exports
│   │   ├── common.ts               # Shared types (pagination, timestamps)
│   │   ├── account.ts
│   │   ├── sites.ts
│   │   ├── devices.ts
│   │   ├── alerts.ts
│   │   ├── alert-contexts.ts       # All 25+ alert context types
│   │   ├── audit.ts
│   │   ├── jobs.ts
│   │   ├── filters.ts
│   │   ├── variables.ts
│   │   ├── system.ts
│   │   ├── users.ts
│   │   └── activity-logs.ts
│   └── resources/
│       ├── account.ts
│       ├── sites.ts
│       ├── devices.ts
│       ├── alerts.ts
│       ├── audit.ts
│       ├── jobs.ts
│       ├── filters.ts
│       ├── system.ts
│       ├── users.ts
│       ├── variables.ts
│       └── activity-logs.ts
├── tests/
│   ├── setup.ts
│   ├── fixtures/
│   │   ├── auth/
│   │   │   ├── token-success.json
│   │   │   └── token-failure.json
│   │   ├── account/
│   │   ├── sites/
│   │   ├── devices/
│   │   ├── alerts/
│   │   ├── audit/
│   │   ├── jobs/
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
│       ├── account.test.ts
│       ├── sites.test.ts
│       ├── devices.test.ts
│       ├── alerts.test.ts
│       ├── audit.test.ts
│       ├── jobs.test.ts
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

### OAuth 2.0 Flow

Datto RMM uses OAuth 2.0 with API Key + API Secret Key credentials. Tokens are JWTs that expire after 100 hours.

### Configuration

```typescript
import { DattoRmmClient } from 'node-datto-rmm';

const client = new DattoRmmClient({
  apiKey: 'your-api-key',
  apiSecretKey: 'your-api-secret-key',
  platform: 'merlot',      // 'pinotage' | 'merlot' | 'concord' | 'vidal' | 'zinfandel' | 'syrah'
  // OR explicit API URL:
  // apiUrl: 'https://merlot-api.centrastage.net',
});
```

### Token Lifecycle Management

The `auth.ts` module handles:

1. **Initial token request**: POST to `{apiUrl}/auth/oauth/token` with:
   - `grant_type=password`
   - `username={apiKey}`
   - `password={apiSecretKey}`
   - Basic Auth header: `public-client:public`
2. **Token caching**: Store access token in memory with expiry tracking
3. **Automatic refresh**: When a request returns 401, or when the token is within 5 minutes of expiry, acquire a new token automatically
4. **Thread safety**: Prevent concurrent token refresh requests (single in-flight refresh)

```typescript
interface TokenInfo {
  accessToken: string;
  tokenType: string;
  expiresAt: number;       // Unix timestamp
}
```

### Platform Base URLs

| Platform | API URL |
|---|---|
| `pinotage` | `https://pinotage-api.centrastage.net` |
| `merlot` | `https://merlot-api.centrastage.net` |
| `concord` | `https://concord-api.centrastage.net` |
| `vidal` | `https://vidal-api.centrastage.net` |
| `zinfandel` | `https://zinfandel-api.centrastage.net` |
| `syrah` | `https://syrah-api.centrastage.net` |

All API requests use the base path: `{apiUrl}/api/v2/...`

---

## Rate Limiting

Datto RMM enforces 600 requests per 60-second rolling window, with escalating consequences:

| Threshold | Behavior |
|---|---|
| < 540 requests (90%) | Normal operation |
| 540-599 requests | API introduces 1-second delay in responses |
| 600+ requests | `429 Too Many Requests` |
| Persistent 429 violations | `403 Forbidden` + 5-minute IP block |

Rate limits are account-wide, not per-user.

### Implementation

```typescript
interface RateLimitConfig {
  enabled: boolean;              // default: true
  maxRequests: number;           // default: 600
  windowMs: number;              // default: 60000 (60 seconds)
  throttleThreshold: number;     // default: 0.8 (80% = 480 requests)
  retryAfterMs: number;          // default: 5000
  maxRetries: number;            // default: 3
  ipBlockCooldownMs: number;     // default: 300000 (5 minutes)
}
```

The rate limiter must:
1. Track requests within the rolling 60-second window
2. Start throttling (adding delays between requests) at 80% (480 requests)
3. On 429, back off with exponential delay
4. On 403 (IP block), pause all requests for 5 minutes
5. Expose `client.system.requestRate()` to check current rate from the API

---

## Pagination

Datto RMM returns a maximum of 250 results per page. Responses include a `pageDetails` object:

```json
{
  "pageDetails": {
    "count": 250,
    "page": 1,
    "prevPageUrl": null,
    "nextPageUrl": "https://merlot-api.centrastage.net/api/v2/account/devices?page=2"
  },
  "devices": [ ... ]
}
```

### Automatic Pagination

```typescript
// Get a single page
const page1 = await client.account.devices({ page: 1, max: 100 });

// Auto-paginate all results
for await (const device of client.account.devicesAll()) {
  console.log(device.hostname);
}

// Collect all into array
const allDevices = await client.account.devicesAll().toArray();
```

### Implementation

The pagination system follows `nextPageUrl`:
1. Fetch the first page
2. If `pageDetails.nextPageUrl` is not null, fetch the next page
3. Continue until `nextPageUrl` is null
4. Yield individual records from each page
5. Respect rate limits between page fetches

---

## Timestamp Handling

Datto RMM uses Unix timestamps with millisecond precision. The library should:

1. Accept `Date` objects or ISO strings for input parameters
2. Convert to Unix milliseconds for API requests
3. Return `Date` objects (or configurable: raw number) for response timestamps

```typescript
// Configure timestamp handling
const client = new DattoRmmClient({
  // ...
  timestamps: 'date',  // 'date' (Date objects) | 'number' (Unix ms) | 'iso' (ISO strings)
});
```

---

## Complete Endpoint Inventory

### Account Operations

| Method | Endpoint | Library Method |
|---|---|---|
| GET | `/v2/account` | `client.account.get()` |
| GET | `/v2/account/users` | `client.account.users(params?)` |
| GET | `/v2/account/sites` | `client.account.sites(params?)` |
| GET | `/v2/account/dnet-site-mappings` | `client.account.dnetSiteMappings(params?)` |
| GET | `/v2/account/devices` | `client.account.devices(params?)` |
| GET | `/v2/account/components` | `client.account.components(params?)` |
| GET | `/v2/account/alerts/open` | `client.account.alertsOpen(params?)` |
| GET | `/v2/account/alerts/resolved` | `client.account.alertsResolved(params?)` |
| GET | `/v2/account/variables` | `client.account.variables()` |
| PUT | `/v2/account/variable` | `client.account.createVariable(data)` |
| POST | `/v2/account/variable/:variableId` | `client.account.updateVariable(variableId, data)` |
| DELETE | `/v2/account/variable/:variableId` | `client.account.deleteVariable(variableId)` |

### Site Operations

| Method | Endpoint | Library Method |
|---|---|---|
| PUT | `/v2/site` | `client.sites.create(data)` |
| GET | `/v2/site/:siteUid` | `client.sites.get(siteUid)` |
| POST | `/v2/site/:siteUid` | `client.sites.update(siteUid, data)` |
| GET | `/v2/site/:siteUid/devices` | `client.sites.devices(siteUid, params?)` |
| GET | `/v2/site/:siteUid/devices/network-interface` | `client.sites.networkInterfaces(siteUid, params?)` |
| GET | `/v2/site/:siteUid/settings` | `client.sites.settings(siteUid)` |
| GET | `/v2/site/:siteUid/filters` | `client.sites.filters(siteUid)` |
| GET | `/v2/site/:siteUid/alerts/open` | `client.sites.alertsOpen(siteUid, params?)` |
| GET | `/v2/site/:siteUid/alerts/resolved` | `client.sites.alertsResolved(siteUid, params?)` |
| GET | `/v2/site/:siteUid/variables` | `client.sites.variables(siteUid)` |
| PUT | `/v2/site/:siteUid/variable` | `client.sites.createVariable(siteUid, data)` |
| POST | `/v2/site/:siteUid/variable/:variableId` | `client.sites.updateVariable(siteUid, variableId, data)` |
| DELETE | `/v2/site/:siteUid/variable/:variableId` | `client.sites.deleteVariable(siteUid, variableId)` |
| POST | `/v2/site/:siteUid/settings/proxy` | `client.sites.setProxy(siteUid, data)` |
| DELETE | `/v2/site/:siteUid/settings/proxy` | `client.sites.deleteProxy(siteUid)` |

### Device Operations

| Method | Endpoint | Library Method |
|---|---|---|
| GET | `/v2/device/:deviceUid` | `client.devices.get(deviceUid)` |
| GET | `/v2/device/id/:deviceId` | `client.devices.getById(deviceId)` |
| GET | `/v2/device/macAddress/:macAddress` | `client.devices.getByMac(macAddress)` |
| GET | `/v2/device/:deviceUid/alerts/open` | `client.devices.alertsOpen(deviceUid, params?)` |
| GET | `/v2/device/:deviceUid/alerts/resolved` | `client.devices.alertsResolved(deviceUid, params?)` |
| PUT | `/v2/device/:deviceUid/site/:siteUid` | `client.devices.move(deviceUid, siteUid)` |
| PUT | `/v2/device/:deviceUid/quickjob` | `client.devices.createQuickJob(deviceUid, data)` |
| POST | `/v2/device/:deviceUid/warranty` | `client.devices.updateWarranty(deviceUid, data)` |
| POST | `/v2/device/:deviceUid/udf` | `client.devices.setUdf(deviceUid, data)` |

### Audit Operations

| Method | Endpoint | Library Method |
|---|---|---|
| GET | `/v2/audit/device/:deviceUid` | `client.audit.device(deviceUid)` |
| GET | `/v2/audit/device/:deviceUid/software` | `client.audit.deviceSoftware(deviceUid)` |
| GET | `/v2/audit/device/macAddress/:macAddress` | `client.audit.deviceByMac(macAddress)` |
| GET | `/v2/audit/esxihost/:deviceUid` | `client.audit.esxiHost(deviceUid)` |
| GET | `/v2/audit/printer/:deviceUid` | `client.audit.printer(deviceUid)` |

### Alert Operations

| Method | Endpoint | Library Method |
|---|---|---|
| GET | `/v2/alert/:alertUid` | `client.alerts.get(alertUid)` |
| POST | `/v2/alert/:alertUid/resolve` | `client.alerts.resolve(alertUid)` |
| POST | `/v2/alert/:alertUid/mute` | `client.alerts.mute(alertUid)` *(deprecated 8.9.0)* |
| POST | `/v2/alert/:alertUid/unmute` | `client.alerts.unmute(alertUid)` *(deprecated 8.9.0)* |

### Job Operations

| Method | Endpoint | Library Method |
|---|---|---|
| GET | `/v2/job/:jobUid` | `client.jobs.get(jobUid)` |
| GET | `/v2/job/:jobUid/results/:deviceUid` | `client.jobs.results(jobUid, deviceUid)` |
| GET | `/v2/job/:jobUid/results/:deviceUid/stdout` | `client.jobs.stdout(jobUid, deviceUid)` |
| GET | `/v2/job/:jobUid/results/:deviceUid/stderr` | `client.jobs.stderr(jobUid, deviceUid)` |
| GET | `/v2/job/:jobUid/components` | `client.jobs.components(jobUid)` |

### Filter Operations

| Method | Endpoint | Library Method |
|---|---|---|
| GET | `/v2/filter/default-filters` | `client.filters.defaults()` |
| GET | `/v2/filter/custom-filters` | `client.filters.custom()` |

### System Operations

| Method | Endpoint | Library Method |
|---|---|---|
| GET | `/v2/system/status` | `client.system.status()` |
| GET | `/v2/system/request_rate` | `client.system.requestRate()` |
| GET | `/v2/system/pagination` | `client.system.pagination()` |

### User Operations

| Method | Endpoint | Library Method |
|---|---|---|
| POST | `/v2/user/resetApiKeys` | `client.users.resetApiKeys()` |

### Activity Logs

| Method | Endpoint | Library Method |
|---|---|---|
| GET | `/v2/activity-logs` | `client.activityLogs.list(params?)` |

---

## Alert Context Types

The Datto RMM API returns a dynamic `alertContext` property in alert responses, with the shape determined by the `@class` field. The library must provide typed discriminated unions for all alert context types:

```typescript
type AlertContext =
  | AntivirusAlertContext
  | ComponentScriptAlertContext
  | CustomSnmpAlertContext
  | DiskHealthAlertContext
  | EventLogAlertContext
  | FanAlertContext
  | FsObjectAlertContext
  | OnlineOfflineAlertContext
  | PatchAlertContext
  | DiskUsageAlertContext
  | PerfMonAlertContext
  | ResourceUsageAlertContext
  | PingAlertContext
  | ProcessResourceAlertContext
  | ProcessStatusAlertContext
  | PsuAlertContext
  | RansomwareAlertContext
  | SecurityManagementAlertContext
  | ServiceResourceAlertContext
  | ServiceStatusAlertContext
  | SoftwareActionAlertContext
  | TemperatureAlertContext
  | WmiAlertContext;

interface EventLogAlertContext {
  '@class': 'eventlog_ctx';
  eventLogSource: string;
  eventLogId: number;
  eventLogType: string;
  eventLogMessage: string;
}

interface DiskUsageAlertContext {
  '@class': 'perf_disk_usage_ctx';
  drive: string;
  threshold: number;
  usagePercent: number;
  freeSpaceBytes: number;
}

// ... all 25+ context types
```

### Alert Context Mapping

| `@class` | Alert Type | TypeScript Type |
|---|---|---|
| `antivirus_ctx` | Antivirus Status | `AntivirusAlertContext` |
| `comp_script_ctx` | Component Script | `ComponentScriptAlertContext` |
| `custom_snmp_ctx` | SNMP | `CustomSnmpAlertContext` |
| `disk_health_ctx` | ESXi Disk Health | `DiskHealthAlertContext` |
| `eventlog_ctx` | Event Log | `EventLogAlertContext` |
| `fan_ctx` | ESXi Fan | `FanAlertContext` |
| `fs_object_ctx` | File/Folder Size | `FsObjectAlertContext` |
| `online_offline_status_ctx` | Online Status | `OnlineOfflineAlertContext` |
| `patch_ctx` | Patch | `PatchAlertContext` |
| `perf_disk_usage_ctx` | Disk Usage | `DiskUsageAlertContext` |
| `perf_mon_ctx` | Windows Performance | `PerfMonAlertContext` |
| `perf_resource_usage_ctx` | CPU / Memory / SNMP Throughput | `ResourceUsageAlertContext` |
| `ping_ctx` | Ping | `PingAlertContext` |
| `process_resource_usage_ctx` | Process CPU / Memory | `ProcessResourceAlertContext` |
| `process_status_ctx` | Process Status | `ProcessStatusAlertContext` |
| `psu_ctx` | ESXi PSU | `PsuAlertContext` |
| `ransomware_ctx` | Ransomware | `RansomwareAlertContext` |
| `sec_management_ctx` | Webroot Security | `SecurityManagementAlertContext` |
| `srvc_resource_usage_ctx` | Service CPU / Memory | `ServiceResourceAlertContext` |
| `srvc_status_ctx` | Service Status | `ServiceStatusAlertContext` |
| `sw_action_ctx` | Software | `SoftwareActionAlertContext` |
| `temperature_ctx` | ESXi Temperature | `TemperatureAlertContext` |
| `wmi_ctx` | WMI | `WmiAlertContext` |

---

## Quick Job Support

Creating quick jobs is a key use case. The library provides a typed interface:

```typescript
const job = await client.devices.createQuickJob('device-uid-here', {
  jobName: 'Restart Print Spooler',
  componentUid: 'component-uid-here',
  variables: {
    serviceName: 'Spooler',
    action: 'restart',
  },
});

// Track job status
const status = await client.jobs.get(job.uid);
console.log(status.status); // 'active' | 'completed'

// Get results
if (status.status === 'completed') {
  const stdout = await client.jobs.stdout(job.uid, 'device-uid-here');
  const stderr = await client.jobs.stderr(job.uid, 'device-uid-here');
}
```

---

## User-Defined Fields (UDF)

Datto RMM supports 30 user-defined fields per device (UDF1-UDF30):

```typescript
await client.devices.setUdf('device-uid-here', {
  udf1: 'Building A',
  udf2: 'Floor 3',
  udf15: 'Critical Asset',
});
```

---

## Variables

Account-level and site-level variables with CRUD operations:

```typescript
// Account-level
await client.account.createVariable({ name: 'BackupServer', value: '10.0.1.50' });
const vars = await client.account.variables();

// Site-level
await client.sites.createVariable('site-uid', { name: 'LocalDC', value: '10.0.2.1' });
await client.sites.updateVariable('site-uid', 'variable-id', { value: '10.0.2.2' });
await client.sites.deleteVariable('site-uid', 'variable-id');
```

---

## Error Handling

### Error Classes

```typescript
class DattoRmmError extends Error {
  statusCode: number;
  response: any;
}

class DattoRmmAuthenticationError extends DattoRmmError {}   // 400 (bad creds), 401
class DattoRmmNotFoundError extends DattoRmmError {}          // 404
class DattoRmmRateLimitError extends DattoRmmError {}         // 429
class DattoRmmIpBlockedError extends DattoRmmError {}         // 403 (rate limit IP block)
class DattoRmmForbiddenError extends DattoRmmError {}         // 403 (permission)
class DattoRmmServerError extends DattoRmmError {}            // 500+
```

### Error Behavior

- **400** (token request): Throw `DattoRmmAuthenticationError` — bad API Key/Secret
- **401**: Attempt token refresh once, then throw `DattoRmmAuthenticationError`
- **403**: Distinguish between IP block (rate limit escalation) and permission denied
- **404**: Throw `DattoRmmNotFoundError`
- **429**: Back off with exponential delay, respect rate limiter cooldown
- **500+**: Retry once, then throw `DattoRmmServerError`

---

## Test Strategy

### Principles

1. **Zero live API calls** — All tests use mocked HTTP responses
2. **Fixture-based** — JSON response fixtures match real Datto RMM response structures
3. **Coverage targets** — Minimum 90% line coverage, 100% of public methods tested
4. **OAuth flow testing** — Token acquisition, caching, refresh, and failure paths
5. **Rate limit escalation testing** — 429 → retry, 403 → IP block cooldown
6. **Pagination testing** — Multi-page scenarios with `nextPageUrl` chains

### Mock Architecture

```typescript
// tests/mocks/handlers.ts
import { http, HttpResponse } from 'msw';

const BASE = 'https://merlot-api.centrastage.net/api';

export const handlers = [
  // OAuth token endpoint
  http.post(`${BASE.replace('/api', '')}/auth/oauth/token`, async ({ request }) => {
    const body = await request.text();
    if (body.includes('bad-key')) {
      return HttpResponse.json({ error: 'invalid_grant' }, { status: 400 });
    }
    return HttpResponse.json({
      access_token: 'mock-jwt-token',
      token_type: 'bearer',
      expires_in: 360000,
    });
  }),

  // Account data
  http.get(`${BASE}/v2/account`, () => {
    return HttpResponse.json(fixtures.account.data);
  }),

  // Paginated devices
  http.get(`${BASE}/v2/account/devices`, ({ request }) => {
    const url = new URL(request.url);
    const page = url.searchParams.get('page') || '1';
    return HttpResponse.json(fixtures.devices[`page${page}`]);
  }),

  // Rate limit simulation
  http.get(`${BASE}/v2/rate-limited`, () => {
    return new HttpResponse(null, { status: 429 });
  }),

  // IP block simulation
  http.get(`${BASE}/v2/ip-blocked`, () => {
    return new HttpResponse(null, { status: 403 });
  }),
];
```

### Test Categories

| Category | Description | Example Tests |
|---|---|---|
| **Unit — Auth** | OAuth 2.0 flow | Token acquisition, caching, refresh on 401, bad credentials |
| **Unit — Client** | Client initialization | Platform URL mapping, config validation |
| **Unit — Pagination** | pageDetails traversal | nextPageUrl following, null termination, empty results |
| **Unit — Rate Limiter** | Throttling & backoff | 429 retry, 403 IP block cooldown, threshold detection |
| **Unit — Timestamps** | Date conversion | Unix ms → Date, Date → Unix ms, ISO string handling |
| **Integration — Account** | Account operations | Account data, users, sites, devices, alerts, variables |
| **Integration — Sites** | Site operations | CRUD, devices, settings, proxy, variables |
| **Integration — Devices** | Device operations | Get by UID/ID/MAC, move, quick job, UDF, warranty |
| **Integration — Alerts** | Alert operations | Get, resolve, context type parsing |
| **Integration — Audit** | Audit operations | Device audit, software, ESXi, printer |
| **Integration — Jobs** | Job operations | Status, results, stdout, stderr |
| **Integration — Filters** | Filter operations | Default filters, custom filters |
| **Integration — System** | System operations | Status, request rate, pagination info |
| **Integration — Activity** | Activity log retrieval | List with date filters |

### Fixture Structure

```
tests/fixtures/
├── auth/
│   ├── token-success.json
│   └── token-failure.json
├── account/
│   ├── data.json
│   ├── users.json
│   ├── sites-page1.json
│   ├── sites-page2.json
│   ├── devices-page1.json
│   ├── devices-page2.json
│   ├── alerts-open.json
│   ├── alerts-resolved.json
│   └── variables.json
├── sites/
│   ├── get.json
│   ├── created.json
│   ├── devices.json
│   ├── settings.json
│   └── filters.json
├── devices/
│   ├── get-by-uid.json
│   ├── get-by-id.json
│   ├── get-by-mac.json
│   ├── quickjob-created.json
│   └── alerts-open.json
├── alerts/
│   ├── get-eventlog.json
│   ├── get-diskusage.json
│   ├── get-online-offline.json
│   └── ...                        # One per alert context type
├── audit/
│   ├── device.json
│   ├── device-software.json
│   ├── esxihost.json
│   └── printer.json
├── jobs/
│   ├── get-active.json
│   ├── get-completed.json
│   ├── results.json
│   ├── stdout.json
│   └── stderr.json
└── system/
    ├── status.json
    ├── request-rate.json
    └── pagination.json
```

---

## Usage Examples

### Basic Operations

```typescript
import { DattoRmmClient } from 'node-datto-rmm';

const client = new DattoRmmClient({
  apiKey: process.env.DATTO_API_KEY!,
  apiSecretKey: process.env.DATTO_API_SECRET!,
  platform: 'merlot',
});

// Get account info
const account = await client.account.get();

// List all sites
const sites = await client.account.sites();

// Get a specific device
const device = await client.devices.get('device-uid-here');

// Resolve an alert
await client.alerts.resolve('alert-uid-here');
```

### Pagination

```typescript
// Auto-paginate all devices in account
for await (const device of client.account.devicesAll()) {
  console.log(device.hostname, device.operatingSystem);
}

// All open alerts for a site
for await (const alert of client.sites.alertsOpenAll('site-uid')) {
  console.log(alert.alertUid, alert.alertContext['@class']);
}
```

### Quick Jobs

```typescript
const job = await client.devices.createQuickJob('device-uid', {
  jobName: 'Clear Temp Files',
  componentUid: 'component-uid',
  variables: { path: 'C:\\Temp', olderThanDays: '30' },
});

// Poll for completion
let status;
do {
  await new Promise(r => setTimeout(r, 5000));
  status = await client.jobs.get(job.uid);
} while (status.status === 'active');

const output = await client.jobs.stdout(job.uid, 'device-uid');
```

### Device Audit

```typescript
const audit = await client.audit.device('device-uid');
const software = await client.audit.deviceSoftware('device-uid');

// ESXi host audit
const esxi = await client.audit.esxiHost('esxi-device-uid');
```

---

## Implementation Phases

### Phase 1 — Core Foundation
- Client class with config and platform mapping
- OAuth 2.0 token management (acquire, cache, refresh)
- HTTP layer with auth header injection
- Rate limiter
- Pagination utilities
- Error classes
- Account operations (reference implementation)
- Full test infrastructure with mocks

### Phase 2 — Sites & Devices
- Site CRUD, settings, proxy, variables
- Device get (by UID, ID, MAC), move, quick job, warranty, UDF
- All paginated list variants

### Phase 3 — Alerts & Audit
- Alert get, resolve, mute/unmute (deprecated)
- All 25+ alert context type definitions
- Audit: device, software, ESXi, printer

### Phase 4 — Jobs, Filters, System
- Job status, results, stdout, stderr, components
- Default and custom filters
- System status, request rate, pagination

### Phase 5 — Remaining Resources
- User operations (resetApiKeys)
- Activity logs
- Account/site variables CRUD

### Phase 6 — Polish & Release
- README documentation with examples
- CHANGELOG
- NPM publish configuration
- CI/CD pipeline (GitHub Actions)
- 90%+ test coverage verification
- Deprecation warnings for mute/unmute endpoints

---

## Acceptance Criteria

1. Every endpoint in the inventory has a corresponding library method
2. Every library method has at least one passing test
3. OAuth 2.0 token lifecycle works correctly (acquire, cache, auto-refresh)
4. All 6 platform base URLs are correctly mapped
5. Pagination follows `nextPageUrl` chains until null
6. Rate limiter prevents exceeding 600 req/60s and handles 403 IP blocks
7. All 25+ alert context types have TypeScript definitions
8. Timestamp conversion works for Unix ms ↔ Date ↔ ISO string
9. No test makes a live API call
10. TypeScript strict mode compiles with zero errors
11. Test coverage >= 90%
