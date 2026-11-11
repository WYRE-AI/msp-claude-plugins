---
name: "KPN API Patterns"
description: >
  How the KPN tool surface behaves through Conduit: the Grexx (IRMA) wholesale
  interface behind the kpn_grexx_* tools, the client-ID/secret credential pair
  and the optional Grexx URL fields, the IRMA customer/order model, the one
  write tool, and common errors.
when_to_use: >-
  When calling any KPN tool, diagnosing a KPN connection or permission
  failure, or deciding whether a KPN operation is possible. Use when: kpn
  credentials, kpn grexx, kpn irma, kpn 401, kpn test connection, kpn order id,
  or grexx api gegevens.
---

# KPN API Patterns

## Overview

Conduit's `kpn` connector talks to KPN's **Grexx** wholesale interface (the IRMA ordering platform used by KPN partners), not to the developer.kpn.com API Store. Every tool is named `kpn_grexx_*`. The kpn-mcp sidecar mints and caches an OAuth 2.0 client-credentials token against Grexx itself; Conduit only supplies the stored credentials. Start any troubleshooting with `kpn_grexx_test_connection`.

## Credentials

| Conduit field | Required | Sent to the sidecar as | Notes |
|---|---|---|---|
| Client ID (Grexx username) | Yes | `X-KPN-Grexx-Username` | From the Grexx portal, **API Gegevens** |
| Client secret (Grexx password) | Yes | `X-KPN-Grexx-Password` | |
| Grexx API URL / token URL | No (both or neither) | Validated by Conduit on every call | Leave both blank to use KPN's Grexx **test** environment (acceptatie). Set both for production. |

Nothing is set on the client. A connection that works but returns test data is almost always one with the URL fields left blank.

## Tools

| Tool | Tier | Purpose |
|---|---|---|
| `kpn_grexx_test_connection` | read | Verify the credentials mint a token |
| `kpn_grexx_zipcode_check` | read | Technology and speeds at a Dutch address, per supplier |
| `kpn_grexx_prequalification` | read | Product-type availability per supplier at an address |
| `kpn_grexx_carrier_info` | read | Infrastructure at an address: connection points, line details, planned work |
| `kpn_grexx_customer_data` | read | Search IRMA customer cards (paged, `take` up to 100) |
| `kpn_grexx_order_summary` | read | Orders for a customer card, filterable by state, product group, dates, label or attribute |
| `kpn_grexx_order_data` | read | Customer, product code and quantity for one order |
| `kpn_grexx_radius_check` | read | RADIUS login history of a connectivity order's modem, last 7 days |
| `kpn_grexx_ras_check` | read | Whether a PPP session is up and its IP address |
| `kpn_grexx_mobile_orders` | read | Number, SIM, subscription and bundles for 1-50 mobile orders |
| `kpn_grexx_get_sim` | read | Active SIM / eSIM on a mobile order (ICCID, type; PUK and eSIM codes masked) |
| `kpn_grexx_mobile_settings` | read | Blocks and limits on a mobile number |
| `kpn_grexx_mobile_usage` | read | Current data, voice and SMS usage |
| `kpn_grexx_available_portings` | read | Number portings available for a customer's mobile subscriptions or a HIP group |
| `kpn_grexx_start_line_diagnose` | write | Start a KPN line diagnose on an xDSL order |

## Object model

```
IRMA customer card (customerId)
 └── Order (orderId) — product group: Connectivity, Internet, Voip, Mobile, ...
      ├── Connectivity order → radius_check, ras_check, start_line_diagnose
      └── Mobile order       → mobile_orders, get_sim, mobile_settings, mobile_usage
```

Almost every per-line tool takes an IRMA **order ID**. Find it with `kpn_grexx_order_summary` (filter by `customerId`, `productGroup`, or `attribute` such as a phone number), after resolving the customer with `kpn_grexx_customer_data`.

## The write tool

`kpn_grexx_start_line_diagnose` starts a test on KPN's side for an xDSL order that is out of sync, with a `symptomCode` of `Sym103`, `Sym104`, `Sym105` or `Sym111`. It is not retried automatically. Confirm the order and symptom with the user before starting it, and do not start a second diagnose while one is running.

There are no tools to block or replace a SIM, authorise orders, or read invoices. Those operations happen in the Grexx portal.

## Common errors

| Symptom | Likely cause | Action |
|---|---|---|
| `kpn_grexx_test_connection` fails | Wrong client ID/secret | Re-copy both from Grexx portal → API Gegevens |
| Works, but data looks like test data | URL fields blank (acceptatie) | Set both production Grexx URLs on the connection |
| Mobile settings or usage empty | Order activated less than 5 minutes ago | Retry after activation settles |
| Unknown order ID | Wrong customer card | Re-run `kpn_grexx_order_summary` for the customer |
