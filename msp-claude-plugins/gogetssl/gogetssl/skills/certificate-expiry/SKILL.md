---
name: "GoGetSSL Certificate Expiry"
description: >
  Tracking SSL certificate expiry across every client domain in a GoGetSSL
  reseller account: which order fields carry the expiry date, how to treat
  unissued orders, grouping certificates by client domain, renewal tiers,
  batch status checks for a known set of orders, and reading one order's
  validity and renewal flags.
when_to_use: >-
  When an MSP needs to know which client certificates bought through GoGetSSL
  are expiring, already expired, or stuck before issuance. Use when: ssl
  expiry, certificate expiry report, expiring certificates, cert renewal
  list, which certs expire this month, expired ssl, gogetssl orders, or
  certificate inventory.
---

# GoGetSSL Certificate Expiry

## Overview

An expired certificate is one of the most visible outages an MSP can let
happen: the client's site or mail shows a browser warning and the client
notices before you do. GoGetSSL holds the record of every certificate bought
through the reseller account, so it is the right source for a monthly expiry
sweep. Every tool here is read tier and none is admin-gated in Conduit.

## Anti-triggers

- **Pricing a renewal, checking DCV approver emails or decoding a CSR**: use
  [renewal-prep](../renewal-prep/SKILL.md). This skill finds what expires;
  that one gets a renewal ready.
- **Certificates not bought through GoGetSSL** (Let's Encrypt, a client's own
  CA account, another reseller): GoGetSSL has no record of them. Only orders
  in this reseller account appear.

## Key Concepts

| Field | Source | Meaning |
|-------|--------|---------|
| `order_id` | all order tools | Numeric GoGetSSL order ID |
| `common_name` | `gogetssl_orders_list`, `gogetssl_orders_get_status` | Primary domain on the certificate |
| `valid_from` / `valid_till` | `gogetssl_orders_list`, `gogetssl_orders_get_status` | Certificate validity, `YYYY-MM-DD`. `null` or `0000-00-00` until issued |
| `expires` | `gogetssl_orders_get_statuses` | Expiry date, returned only for active orders |
| `begin_date` / `end_date` | `gogetssl_orders_get_status` | The order's subscription period, which can be longer than one certificate's validity on a multi-year order |
| `status` | all order tools | `active`, `processing`, `expired`, `revoked`, `rejected` (plus other vendor statuses on single-order detail) |

**Certificate validity versus subscription.** Public TLS certificate
lifetimes are capped by the CA/Browser Forum, and that cap keeps shrinking,
but GoGetSSL sells multi-year subscriptions.
On such an order, `valid_till` is when the current certificate expires and
`end_date` is when the subscription ends. A certificate expiring inside a
paid subscription needs a reissue, not a new purchase. Check
`gogetssl_orders_get_status` before telling anyone to buy.

## Common Workflows

### Monthly expiry sweep

1. Call `gogetssl_orders_list` with `status: "active"`. The vendor does not
   page this list, so the status filter is what keeps it inside the response
   limit.
2. Drop rows whose `valid_till` is `null` or `0000-00-00`. Those were never
   issued; handle them in the stuck-order check below.
3. Compute days to expiry from today and sort ascending.
4. Bucket into tiers:

   | Tier | Days left | Action |
   |------|-----------|--------|
   | Critical | 14 or fewer | Renew or reissue now; validation can take days |
   | Due | 15-30 | Start renewal this week |
   | Upcoming | 31-60 | Quote the client, confirm the domain is still in use |
   | Healthy | over 60 | No action |

5. Group by registrable domain under `common_name` and map domains to
   clients. Flag domains you cannot map.
6. For each Critical and Due order, call `gogetssl_orders_get_status` to read
   `end_date`, the reissue and renew flags, and the domains and SANs covered.
   That separates "reissue inside the subscription" from "buy a renewal".

### Recently expired certificates

Call `gogetssl_orders_list` with `status: "expired"` and keep rows whose
`valid_till` is within the last 30-60 days. These are either sites that went
dark or certificates that were replaced by a new order. Check whether an
active order now covers the same `common_name` before raising an alarm.

### Stuck orders

Call `gogetssl_orders_list` with `status: "processing"`. An order that has
sat in processing for days usually failed domain validation. Read it with
`gogetssl_orders_get_status`: the domain validation status and method fields
tell you whether it is waiting on an approver email, a DNS record or an HTTP
file. Fixing it (resending the email, switching the DCV method) happens in
the GoGetSSL client area; this plugin cannot do it.

### Checking a known list of orders

When you already have order IDs (from a previous report or a PSA
configuration item), call `gogetssl_orders_get_statuses` with up to 100 IDs
in `cids`. It returns each order's status and, for active orders, `expires`.
That is one call instead of one per order.

## Gotchas

- `gogetssl_orders_list_ssl` returns order IDs and statuses but **no expiry
  dates**. Use it only to page through a very large account, then feed the
  IDs to `gogetssl_orders_get_statuses` in batches of 100.
- `gogetssl_orders_list` without a `status` filter returns every order the
  account has ever placed, and on an older account can hit the response size
  limit. Always filter.
- `gogetssl_orders_get_status` returns the issued certificate (`crt_code`)
  and CA bundle (`ca_code`). These are public, but they are long; summarise
  rather than echo them. Personal admin and tech contact fields are removed
  by the server; organisation names are kept.
- A SAN certificate covers several domains under one `common_name`. Read the
  SAN list from `gogetssl_orders_get_status` before telling a client which
  of their hostnames are affected.
- `gogetssl_account_get_total_orders` counts active orders only. Use it as a
  sanity check against the length of your active-order sweep.

## Related Skills

- [renewal-prep](../renewal-prep/SKILL.md): get each expiring order ready to renew
- [api-patterns](../api-patterns/SKILL.md): paging, size limits and errors
