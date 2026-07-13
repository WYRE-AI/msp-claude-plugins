---
name: "Datto BCDR API Patterns"
when_to_use: >-
  When working with the Datto BCDR / SIRIS / Alto Backup Portal API — auth, pagination, screenshot
  retrieval, recovery point queries. Use when: datto bcdr, datto backup, datto siris, datto alto,
  bcdr api, screenshot verification, recovery point, or datto portal.
description: >
  Use this skill when integrating with the Datto BCDR (Backup Portal) REST API. Covers
  the public/private key HMAC-SHA256 signing flow, the /v1 endpoint surface, pagination,
  appliance/agent hierarchy, screenshot verification retrieval, and known gotchas.
---

# Datto BCDR API Patterns

## Status note

The MCP server (`datto-bcdr-mcp`) and SDK (`@wyre-technology/node-datto-bcdr`) are in development. This skill is reference documentation; the implementation will follow these patterns.

## Overview

The Datto BCDR API (also known as the Datto Backup Portal API or "RESTful Reporting API") exposes the state of every SIRIS/Alto appliance and protected agent in a partner's fleet. Base URL:

```
https://api.datto.com/v1
```

Reference: <https://continuity.datto.com/help/Content/kb/DBMA/KB400000010980.htm>

This is a **separate API from Datto RMM**. Different keys, different signing scheme, different endpoint surface.

## Authentication

Datto BCDR uses **HMAC-SHA256 request signing** with a public + private key pair, not bearer tokens.

### Key issuance

1. Log into the Datto Partner Portal (`partners.datto.com`)
2. Settings → Integrations → API Keys → Create Key
3. Capture the **public key** and **private key** — the private key is shown once
4. (Optional) Restrict the key to specific appliances or read-only

### Request signing

Every request includes three headers:

| Header | Value |
|--------|-------|
| `X-Datto-API-Key` | The public key |
| `X-Datto-API-Timestamp` | Unix epoch seconds (UTC) |
| `X-Datto-API-Signature` | Hex-encoded HMAC-SHA256 |

The signature input string is:

```
<METHOD> + "\n" + <URL_PATH> + "\n" + <TIMESTAMP> + "\n" + <REQUEST_BODY>
```

Body is the empty string for GET requests. Signed with the **private key** as the HMAC secret.

```js
import { createHmac } from 'node:crypto';

function signRequest({ method, urlPath, body = '', publicKey, privateKey }) {
  const ts = Math.floor(Date.now() / 1000).toString();
  const stringToSign = `${method.toUpperCase()}\n${urlPath}\n${ts}\n${body}`;
  const signature = createHmac('sha256', privateKey).update(stringToSign).digest('hex');
  return {
    'X-Datto-API-Key': publicKey,
    'X-Datto-API-Timestamp': ts,
    'X-Datto-API-Signature': signature,
  };
}
```

Clock skew tolerance is **5 minutes**. NTP-sync the host or expect 401s.

## Endpoint surface

| Domain | Endpoint | Notes |
|--------|----------|-------|
| Devices (appliances) | `GET /bcdr/device` | Full fleet view |
| Single device | `GET /bcdr/device/{serialNumber}` | Appliance-level health |
| Agents on device | `GET /bcdr/device/{serialNumber}/asset` | Protected machines |
| Agent details | `GET /bcdr/device/{sn}/asset/{agentId}` | Per-agent backup state |
| Recovery points | `GET /bcdr/device/{sn}/asset/{agentId}/backup` | List restore points |
| Screenshots | `GET /bcdr/device/{sn}/asset/{agentId}/screenshot` | Verification screenshots |
| Single screenshot | `GET /bcdr/device/{sn}/asset/{agentId}/screenshot/{epoch}` | PNG body |
| Off-site sync | `GET /bcdr/device/{sn}/offsite` | Cloud sync status |
| Alerts | `GET /report/v2/alert` | Aggregated portal alerts |
| Activity log | `GET /report/v2/activity-log` | Per-device activity |

## Pagination

Use `_page` (1-based) and `_perPage` (max 250). Responses include a `pagination` object:

```json
{
  "items": [ /* ... */ ],
  "pagination": {
    "page": 1,
    "perPage": 250,
    "totalPages": 4,
    "totalItems": 877
  }
}
```

## Screenshot verification

Screenshots are PNG bodies, retrieved by epoch timestamp from the `screenshot` list endpoint. Datto runs hourly screenshot verification against virtualized recovery points; the screenshot is the visual proof that the backup is bootable.

```
1. GET /bcdr/device/{sn}/asset/{agentId}/screenshot
   → list of {timestamp, status, errorMessage}
2. GET /bcdr/device/{sn}/asset/{agentId}/screenshot/{timestamp}
   → image/png body
```

For LLM display, base64-encode and embed; or store and link.

## Rate limits

Datto BCDR throttles at **120 req/min per partner**. Above that, expect HTTP 429 with `Retry-After` (seconds). Long-running list operations should batch — avoid blasting per-agent screenshot fetches in parallel.

## Error handling

| HTTP | Meaning | Action |
|------|---------|--------|
| 200 | OK | Continue |
| 400 | Malformed request, e.g. bad timestamp format | Validate inputs |
| 401 | Bad signature, expired timestamp, or wrong key | Re-sign; check clock skew |
| 403 | Key lacks permission for this appliance | Surface message |
| 404 | Serial / agent / restore point unknown | Verify identifiers |
| 429 | Rate limited | Back off per `Retry-After` |
| 500-503 | Transient | Exponential backoff, ≤3 retries |

## Gotchas

- **Clock skew**: 5 minutes max. Containerized clients must use NTP.
- **Path canonicalization**: The `URL_PATH` in the signature must match the request line **exactly** including query string ordering. Sort query params before signing.
- **Body in signature**: Always include the literal request body — even an empty string for GET.
- **Distinct from Datto RMM**: A user with Datto RMM API keys cannot call BCDR endpoints; different key types entirely.
- **Status semantics**: A "successful" backup can still have a failed screenshot verification. Always inspect both `lastBackup` and `lastScreenshotVerification` per agent for full health.

## Related skills

Domain-specific skills for backups, screenshots, virtualization, and alerts will land alongside the MCP server build-out.
