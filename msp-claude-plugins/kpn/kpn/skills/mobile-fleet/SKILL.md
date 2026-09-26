---
name: "KPN Mobile Fleet"
description: >
  KPN business mobile through Mobile Services Management (MSM v11):
  subscribers, contracts (lines/SIMs), allowed operations per contract,
  orders and service requests, invoices and invoice PDFs, the customer's
  organisation tree and usage thresholds; plus the confirmed writes (SIM
  block, unblock, replace; order authorize and cancel) and PIN/PUK handling.
when_to_use: >-
  When managing a customer's KPN business-mobile fleet: finding who has
  which number or SIM, handling a lost or stolen phone, replacing a SIM or
  moving to eSIM, approving or cancelling KPN orders, pulling KPN mobile
  invoices, or unlocking a PUK-locked phone. Use when: kpn zakelijk mobiel,
  block sim, lost phone, stolen phone, replace sim, esim, puk code, kpn
  order approval, kpn invoice, mobile subscribers.
---

# KPN Mobile Fleet

## Overview

MSM is KPN's business-mobile management API. All `kpn_mobile_*` tools use
the MSM token realm (see the api-patterns skill). Identifiers are MSM ids:
look a contract up before acting on it.

## Finding the right record

| Starting from | Tool |
|---|---|
| A person's name or employee number | `kpn_mobile_subscribers_list` → `kpn_mobile_subscribers_get` (includes their contracts) |
| A phone number, ICCID or IMEI | `kpn_mobile_contracts_list` with `mobileNumber` / `simCardNumber` / `imei` |
| A contract id | `kpn_mobile_contracts_get` |
| Cost centres, debtors, locations | `kpn_mobile_hierarchy_list` (omit `parentId` for the roots) |

Lists page with `offset`/`limit` (max 100). If the result says there are more
items, page before concluding something doesn't exist.

## Before any write: check allowed operations

`kpn_mobile_contracts_get_operations` shows which actions (block, unblock,
replace, ...) are currently allowed on a contract and which open orders block
them. The write tools check this themselves and refuse when the operation is
not allowed, but calling it first gives the user a clear answer instead of
a refusal.

## Writes

All five write tools ask for confirmation first and create a KPN **order**:

| Tool | Effect | Notes |
|---|---|---|
| `kpn_mobile_sim_block` | Calls, SMS and data stop | For lost/stolen phones; reversible |
| `kpn_mobile_sim_unblock` | Restores service | Only once the device is back with its owner |
| `kpn_mobile_sim_replace` | New physical SIM (`newSimCardNumber`) or eSIM (`esim: true` + `email` for the QR code) | Old SIM stops when the order completes |
| `kpn_mobile_orders_authorize` | Approves an `UNAUTHORIZED` order | May commit the customer to costs |
| `kpn_mobile_orders_cancel` | Cancels an open order | Cannot be resumed |

Report the order id and status after a write, and say plainly that the change
takes effect when KPN completes the order. If the status is `UNAUTHORIZED`,
someone with approval rights still has to authorize it.

Every write accepts a `referenceNumber` (max 25 characters, defaults to
`WYRE-<timestamp>`). Put the ticket number there so the KPN order traces
back to the PSA.

## PIN and PUK

Contract output always masks PIN and PUK. `kpn_mobile_contracts_get_puk`
reveals one PUK after confirmation. A PUK lets someone take over a locked
SIM: verify who is asking first (call back on a known number; consider
`kpn_sim_swap_get_date`), and give it only to the SIM's user.

## Orders, service requests, invoices

- `kpn_mobile_orders_list` / `kpn_mobile_service_requests_list` default to
  open items (`NEW`, `IN_PROGRESS`, `UNAUTHORIZED`). Pass `status` for others.
- `kpn_mobile_invoices_list` filters by `debtorId` (from the hierarchy) and a
  `searchFrom`/`searchTo` date range; `kpn_mobile_invoices_get_pdf` returns
  the PDF as an embedded resource.
- `kpn_mobile_thresholds_list` shows daily usage caps (data, voice, roaming
  cost); pass `thresholdId` to see which contracts a cap applies to.

## Anti-triggers

Outages, address availability and SIM-swap lookups belong to the
network-checks skill; they don't use MSM.
