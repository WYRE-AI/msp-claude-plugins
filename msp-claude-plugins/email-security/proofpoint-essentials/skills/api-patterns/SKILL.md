---
name: "Proofpoint Essentials API Patterns"
description: >
  Proofpoint Essentials API fundamentals: X-User/X-Password header authentication
  with org-admin credentials, regional pod resolution via the endpoint discovery
  API, base URL construction, batch-create 207 multi-status handling, and error
  codes.
when_to_use: >-
  When authenticating to or calling any Proofpoint Essentials API endpoint directly
  or through MCP tools. Use when: proofpoint essentials api, proofpoint essentials
  authentication, proofpoint essentials auth, X-User X-Password, endpoint discovery,
  regional pod, proofpoint essentials base url, proofpoint essentials region,
  proofpoint essentials credentials, 207 multi-status, or proofpoint essentials
  error.
---

# Proofpoint Essentials API Patterns

## Overview

Proofpoint Essentials is Proofpoint's SMB/MSP-tier email security product — a
distinct product, API, and credential model from Proofpoint TAP (Targeted
Attack Protection). Essentials is managed through a REST API scoped to
**customer organizations** under an MSP's reseller account: get/activate/
deactivate/delete an org, manage its domains and mailbox users, toggle
features, adjust licensing and package tier, and pull inbound/outbound mail
flow reports. This skill covers authentication, regional routing, base URL
construction, batch semantics, and error handling shared by every other skill
in this plugin.

## Anti-triggers

- **Proofpoint TAP, quarantine, forensics, URL Defense, or VAP/people-risk
  data** — that is a completely different product, API, and auth model
  (service-principal HTTP Basic Auth against `tap-api.proofpoint.com`). Use
  the sibling `proofpoint` plugin's `proofpoint-api-patterns` skill instead.
- **Checkpoint Harmony (Avanan), Abnormal, Mimecast, or another vendor's
  email-security API** — this skill only speaks the Proofpoint Essentials
  API.

## Key Concepts

### One credential shape, two admin scopes

Every Essentials API call carries the same two headers regardless of which
resource it touches:

```http
X-User: admin@msp-reseller.com
X-Password: ***
```

**Org-admin credentials only.** Unlike TAP's per-request service principal,
Essentials authenticates as an actual admin login — either a reseller-level
admin (who can act on any customer org the reseller manages) or a
customer-org admin (scoped to that one org). There is no separate API
key/secret pair to generate; the credentials are the same ones used to sign
into the Essentials web console, so credential rotation means a password
change, not a re-issued key.

### Region and base URL

```
https://{region}.proofpointessentials.com/api/v1/
```

| Region | Notes |
|--------|-------|
| `us1` | Default / anchor pod — also answers endpoint-discovery requests for orgs hosted elsewhere |
| `us2`, `eu1`, and other regional pods | Where a given customer org's data actually lives |

Every customer organization is homed on exactly one regional pod. Calling
the wrong pod for an org's resource endpoints (domains, users, reporting,
etc.) fails — it does not proxy or redirect. `us1` is the default entry
point and also the endpoint-discovery anchor: even for an org that lives on
`eu1`, you resolve its pod by asking `us1` first (see below), then send every
subsequent call for that org to the resolved pod.

### Endpoint discovery — resolve the pod before doing anything else

Before calling any org-scoped resource for an organization you have not
already resolved, call `proofpoint_essentials_endpoint_resolve` (backed by
the discovery endpoint under `us1`) with the org's primary domain or org
name. The response identifies the regional pod that hosts the org. Cache
that mapping for the session — do not re-resolve on every call, but do not
assume yesterday's mapping still holds after a reseller migrates a customer
between pods.

**Every workflow in this plugin starts here.** `org-management`,
`user-management`, and `reporting` all assume the caller already knows which
region an org lives on. If you skip discovery and guess `us1`, an org on
`eu1` fails outright rather than silently returning empty data.

## Common Workflows

### First contact with an unfamiliar org

1. Call `proofpoint_essentials_endpoint_resolve` with the org's primary
   domain to get its regional pod.
2. Build every subsequent request's base URL from that region.
3. Call `proofpoint_essentials_org_get` to confirm the org resolves and pull
   its domain list before doing anything else.

### Batch operations and 207 Multi-Status

`proofpoint_essentials_users_create` and `proofpoint_essentials_domains_create`
both accept an array of objects in a single call — creating many mailbox
users or adding many domains at once. The API replies with **HTTP 207
Multi-Status**, not a single success/failure code: the response body carries
a per-item result, and a partial batch can contain both successes and
failures in the same response.

**Never treat a 207 as a blanket success.** Iterate the per-item results and
report exactly which entries succeeded and which failed (and why) — a batch
of 50 users where 3 failed on a duplicate mailbox address is not "created 50
users." Retry only the failed entries; resubmitting the whole batch will
re-fail (or duplicate) the entries that already succeeded.

## Error Handling

| Code | Meaning | Action |
|------|---------|--------|
| 200 | Success | Process response |
| 207 | Multi-status (batch create) | Inspect each item's result individually |
| 400 | Malformed request / invalid field value | Check request body against the field reference for that resource |
| 401 | Invalid `X-User`/`X-Password` | Re-verify credentials; a customer-org admin cannot authenticate against a different org |
| 403 | Authenticated but not authorized for this org | The credential is scoped to a different org than the one requested |
| 404 | Org, domain, or user not found | Confirm the identifier and that the request went to the correct regional pod |
| 429 | Rate limited | Back off and retry; Essentials does not publish fixed numeric limits, so treat 429 as authoritative rather than pre-computing a budget |
| 5xx | Upstream/pod error | Retry with backoff; if persistent, the regional pod itself may be degraded |

### Common mistakes

| Symptom | Cause | Fix |
|---------|-------|-----|
| 404 on an org you know exists | Calling the wrong regional pod | Re-run endpoint discovery; the org may have moved pods |
| 401 with credentials that work in the console | Reseller vs. customer-org admin mismatch | Reseller admins can act on any managed org; customer-org admins cannot act outside their own org |
| Batch call "succeeds" but half the users are missing | 207 was treated as 200 | Parse per-item results, not just the top-level status code |
| Reporting call returns empty for a known-active org | Region resolved to the wrong pod, or the date range is outside retained data | Re-check regional resolution first, then narrow the date range |

## Related Skills

- [Proofpoint Essentials Org Management](../org-management/SKILL.md) - Organizations, domains, features, licensing, package tier
- [Proofpoint Essentials User Management](../user-management/SKILL.md) - Mailbox user CRUD
- [Proofpoint Essentials Reporting](../reporting/SKILL.md) - Inbound/outbound mail flow metrics
