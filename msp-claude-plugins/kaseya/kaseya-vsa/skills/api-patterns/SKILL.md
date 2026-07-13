---
name: "Kaseya VSA API Patterns"
when_to_use: >-
  When working with the Kaseya VSA REST API — authentication, pagination, rate limits, error
  handling, or planning Kaseya VSA integrations. Use when: kaseya vsa, vsa api, kaseya rmm, kaseya
  patch management, agent procedures, kaseya one, or vsa authentication.
description: >
  Use this skill when working with the Kaseya VSA REST API. Covers two-step token-based
  authentication, the /api/v1.0 surface, pagination ($skip/$top), filtering ($filter),
  request/response envelope, error codes, and Kaseya One SSO bearer-token auth for
  unified-login tenants.
---

# Kaseya VSA API Patterns

## Status note

The MCP server (`kaseya-vsa-mcp`) and SDK (`@wyre-technology/node-kaseya-vsa`) are in development. This skill is reference documentation for the API surface and authentication flow; the implementation will follow the patterns described here.

## Overview

Kaseya VSA exposes a REST API at `/api/v1.0/` on every VSA tenant. Modern VSA 10 / VSA X tenants additionally support Kaseya One SSO bearer tokens issued by `https://one.kaseya.com`, sharing identity with Autotask, BMS, IT Glue (partial), and Datto EDR.

Reference: <https://help.vsa10.kaseya.com/>

## Authentication

VSA uses a **two-step token exchange** for API key auth:

1. `GET /api/v1.0/auth` with HTTP basic-auth-style headers built from a SHA-256/SHA-1 hash of the user password + a per-request random nonce.
2. The response contains a session token that is sent as `Authorization: Bearer <token>` on subsequent calls. Token TTL is short (default 15 minutes); the server returns `Token-Expires-In` in the response.

For Kaseya One SSO tenants, skip the password-hash dance and exchange a Kaseya One JWT for a VSA session token instead.

### Auth header construction (legacy/local users)

The full Authorization string is **six** comma-separated fields. Both the
"covered" hashes (raw + nonce, re-hashed) and the raw hashes must be sent —
omitting `rpass2`/`rpass1` silently 401s every login. Source:
<https://help.vsa9.kaseya.com/help/Content/Modules/rest-api/37334.htm>

```
RawSHA256           = SHA-256(password + username)
RawSHA1             = SHA-1(password + username)
CoveredSHA256       = SHA-256(RawSHA256 + RandomString)
CoveredSHA1         = SHA-1(RawSHA1 + RandomString)

Authorization: Basic user=<username>,
                     pass2=<CoveredSHA256>,
                     pass1=<CoveredSHA1>,
                     rpass2=<RawSHA256>,
                     rpass1=<RawSHA1>,
                     rand2=<RandomString>
```

Capture the returned `Token` field, then send `Authorization: Bearer <Token>` on every subsequent call.

### Kaseya One bearer flow

```
POST https://one.kaseya.com/oauth/token
  grant_type=client_credentials
  client_id=<integration client id>
  client_secret=<secret>
  scope=vsa.api

→ access_token (JWT)

GET https://<tenant>/api/v1.0/auth/sso
  Authorization: Bearer <access_token>

→ VSA session token usable as Bearer on subsequent /api/v1.0 calls
```

## Base URL

Each MSP has a private VSA tenant URL — there is no shared regional endpoint. Examples:

- `https://vsa.exampleMSP.com/api/v1.0`
- `https://kaseya.exampleMSP.com/api/v1.0`

The MCP server takes the tenant URL as a credential field; never hard-code.

## Pagination

VSA uses **OData-style** `$skip` + `$top` (not cursor-based). Every list endpoint accepts:

| Parameter | Default | Max  | Description |
|-----------|---------|------|-------------|
| `$top`    | 100     | 1000 | Page size |
| `$skip`   | 0       | —    | Records to skip |
| `$filter` | none    | —    | OData filter expression |
| `$orderby`| none    | —    | Sort, e.g. `MachineName asc` |

Pagination loop:

```
loop:
  GET /api/v1.0/assetmgmt/agents?$top=1000&$skip=<offset>
  read response.Result (the array of records)
  read response.TotalRecords (total count)
  offset += 1000
  if offset >= TotalRecords: stop
```

## Response envelope

All VSA responses use this shape:

```json
{
  "Result": [ /* records */ ] or { /* single record */ },
  "ResponseCode": 0,
  "TotalRecords": 1234,
  "Code": "0",
  "Status": "Ok",
  "Error": null
}
```

A `ResponseCode != 0` or non-null `Error` indicates failure even with HTTP 200. **Always** check both the HTTP status and `Result.ResponseCode` / `Result.Error`.

## Common endpoints

| Domain | Endpoint | Notes |
|--------|----------|-------|
| Agents | `GET /assetmgmt/agents` | Returns endpoints with org/group context |
| Agent details | `GET /assetmgmt/agents/{agentId}` | Hardware, OS, network |
| Software audit | `GET /assetmgmt/audit/{agentId}/software` | Installed apps |
| Patch status | `GET /assetmgmt/patch/status/{agentId}` | Pending/installed patches |
| Patch deploy | `POST /assetmgmt/patch/{agentId}/deploypatchnow` | Force a deploy now |
| Procedures (scripts) | `GET /automation/agentprocs/{agentId}` | Available procedures |
| Run procedure | `POST /automation/agentprocs/{agentId}/{procId}/runnow` | Execute |
| Tickets (SD) | `GET /servicedesk/tickets` | If Service Desk enabled |
| Alarms | `GET /assetmgmt/alarms` | Active monitor alarms |
| Organizations | `GET /system/orgs` | Tenant organizations |
| Machine groups | `GET /system/machinegroups` | Hierarchy under an org |

## Rate limits

Kaseya does not publish hard rate limits but throttles aggressively under load. Defensive defaults:

- Cap concurrent requests per tenant at **4**
- Token-bucket at **120 req/min sustained**
- Always handle HTTP 429 with `Retry-After` (seconds)
- Back off and retry on HTTP 503; treat 504 as transient

## Error handling

| HTTP | VSA `ResponseCode` | Meaning | Action |
|------|--------------------|---------|--------|
| 200 | 0 | Success | Continue |
| 200 | non-zero | Application error in `Error` field | Surface message; do not retry |
| 401 | — | Token expired | Re-auth, retry once |
| 403 | — | User lacks scope on this resource | Surface; do not retry |
| 404 | — | Endpoint or record missing | Surface; check tenant URL |
| 429 | — | Throttled | Back off per `Retry-After` |
| 500-503 | — | Transient | Exponential backoff, max 3 retries |

## Known gotchas (from sister Kaseya APIs)

- **Silent IP blocking**: Like Autotask, VSA can drop requests from non-allowlisted IPs as 30s timeouts (no 403). When tools/list works but tools/call hangs, suspect the egress IP. (See gateway memory: ACA egress vs ingress IP — `staticIp` is for inbound; outbound uses a different IP.)
- **Tenant URL trailing slash**: Some VSA versions redirect `/api/v1.0/agents` → `/api/v1.0/agents/` (301), which strips the `Authorization` header. Normalize all paths to end with `/`.
- **Token race in concurrent flows**: Re-auth on 401 races between concurrent requests can cause both to refresh and one to clobber the other. Wrap re-auth in a single-flight mutex.

## Related skills

When the build-out lands, expect domain-specific skills under this plugin for: agents, patches, procedures, tickets, alarms, organizations.
