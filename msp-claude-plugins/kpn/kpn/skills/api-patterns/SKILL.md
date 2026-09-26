---
name: "KPN API Patterns"
description: >
  How the KPN tool surface behaves through Conduit: the X-KPN-* credential
  headers and the two OAuth token realms (API Store vs Mobile Services
  Management), why a valid key can still fail with 401/403 (product
  entitlement), quota headers and 429 handling, the write-confirmation
  flow, and why failed MSM writes are never retried automatically.
when_to_use: >-
  When calling any KPN tool, diagnosing a KPN connection or permission
  failure, or deciding whether a KPN operation is possible. Use when: kpn
  credentials, kpn 401, kpn 403, kpn not entitled, kpn quota, kpn test
  connection, kpn mobile services management access, developer.kpn.com keys.
---

# KPN API Patterns

## Overview

KPN exposes its APIs through an Apigee gateway at `api-prd.kpn.com`. The
kpn-mcp sidecar mints and caches OAuth2 client-credentials tokens itself;
Conduit only forwards the stored keys as headers. Start any troubleshooting
with `kpn_test_connection`.

## Credentials and token realms

| Conduit field | Header | Used for |
|---|---|---|
| Client ID / Secret (required) | `X-KPN-Client-Id`, `X-KPN-Client-Secret` | Disturbance Check, Speed Check, SIM Swap; also MSM when no MSM pair is set |
| MSM Client ID / Secret (optional, both or neither) | `X-KPN-MSM-Client-Id`, `X-KPN-MSM-Client-Secret` | Mobile Services Management (`kpn_mobile_*`) |

The two realms mint tokens from different endpoints. MSM access is tied to a
KPN business-mobile customer and may need an app that KPN set up for that
customer, which is why it has its own optional pair.

## Key concepts

- **A valid key is not an entitled key.** KPN mints a token for any valid
  project, even if the product was never added to it. The call then fails
  with 401 or 403. Tell the user to add the product to their project on
  developer.kpn.com rather than to re-enter credentials.
- **Quotas are per project and unpublished.** Responses carry `quota-*`
  headers; `kpn_test_connection` reports the last seen values. On 429 the
  error includes when the quota resets.
- **Test and production share one host.** The account tier (demo/prod)
  is a property of the project, reported by `kpn_test_connection`.

## Writes

The five MSM write tools and `kpn_mobile_contracts_get_puk` ask the user to
confirm before running. Clients that cannot show a prompt must pass
`confirm_destructive_action: true`, and should only do so after the user has
agreed in the conversation.

MSM writes create **orders**. Success means KPN accepted the order, not that
the SIM is already blocked or replaced; the order may sit in `UNAUTHORIZED`
until someone approves it (`kpn_mobile_orders_authorize`).

A failed write is never retried automatically, because a duplicate block or
authorize is a real side effect. Before retrying after an error, check
`kpn_mobile_orders_list` for an order that already went through.

## Common errors

| Symptom | Likely cause | Action |
|---|---|---|
| `kpn_test_connection` fails on the main realm | Wrong client ID/secret | Re-check the project keys on developer.kpn.com |
| Token mints, tool returns 401/403 | Product not added to the project | Add the product to the project |
| MSM token fails, network tools work | MSM needs a customer-bound app | Ask KPN for MSM access; set the optional MSM pair |
| 404 on SIM Swap | Not a KPN mobile number | SIM Swap only covers KPN NL numbers |
| 429 | Project quota reached | Wait for the reset time in the error |
