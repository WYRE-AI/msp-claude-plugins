---
name: "GoGetSSL Renewal Prep"
description: >
  Getting a GoGetSSL certificate renewal or reissue ready before anyone
  places it in the client area: choosing and pricing a product, checking
  wildcard and SAN support, confirming which approver email addresses email
  domain validation will accept, decoding the client's CSR to catch
  mistakes, and confirming the prepaid balance covers the renewals.
when_to_use: >-
  When an MSP is about to renew, replace or reissue a client certificate
  bought through GoGetSSL and wants the quote, validation path and CSR
  checked first. Use when: ssl renewal quote, certificate price, which ssl
  product, wildcard certificate cost, dcv approver email, domain validation
  email, check csr, decode csr, or enough balance to renew.
---

# GoGetSSL Renewal Prep

## Overview

Renewals fail for boring reasons: the approver mailbox does not exist, the
CSR has the wrong common name or a 2048-bit key the client's policy forbids,
the product quoted does not cover the wildcard the client actually uses, or
the prepaid balance is short on the day. This skill checks each of those
with read-only GoGetSSL tools so the person placing the order in the
GoGetSSL client area gets it right first time.

This plugin **cannot place, renew or reissue an order**, resend a validation
email, or change a DCV method. Every tool used here is read tier and none is
admin-gated in Conduit.

## Anti-triggers

- **Finding which certificates expire**: use
  [certificate-expiry](../certificate-expiry/SKILL.md) first, then come back
  here for each order that needs action.
- **Reconciling what renewals cost after the fact**: use
  [billing-reconciliation](../billing-reconciliation/SKILL.md).

## Common Workflows

### 1. Start from the existing order

Call `gogetssl_orders_get_status` on the expiring order. Note:

- the product, so the renewal can match it
- the domains and SANs covered, so nothing is dropped
- the validation method used last time
- `end_date` versus `valid_till`: if the subscription runs past the
  certificate's expiry, this is a **reissue** inside the paid period, and no
  purchase is needed

### 2. Pick and price the product

| Question | Tool |
|----------|------|
| Which products exist, and which support wildcard, SAN and which DCV methods? | `gogetssl_products_list` |
| Brand, validation type (DV, OV, EV) and price per period | `gogetssl_products_list_ssl` |
| Just the partner price per product and period | `gogetssl_products_list_prices` |
| Warranty, free reissues, refund window, SAN and wildcard detail for one product | `gogetssl_products_get` |

Match the validation type of the old certificate unless the client asked to
change it. Moving from OV to DV loses the organisation name in the
certificate, which some clients notice.

The prices returned are **your partner cost**, not what you charge the
client. Add your margin before quoting.

### 3. Confirm the email validation path

If the renewal will use email domain control validation, call
`gogetssl_dcv_get_domain_emails` with the bare domain (for example
`contoso.com`, no scheme, path or `*.`). It returns the addresses GoGetSSL
will accept, typically role addresses such as `admin@` and `hostmaster@` at
the domain. Use the list the tool returns rather than assuming.

Check that at least one of those mailboxes exists and that someone can read
it. If none does, plan on DNS (CNAME) or HTTP file validation instead, and
choose that method when the order is placed. This lookup is a read-only POST
and changes no order.

### 4. Check the CSR

If the client or their hosting provider supplied a CSR, pass the
`-----BEGIN CERTIFICATE REQUEST-----` block to `gogetssl_csr_decode`.
Compare the result against the order:

- common name matches the domain being renewed
- organisation and location are right for an OV or EV product
- SANs, if any, match what the client expects
- key size meets the client's policy

Never pass a private key. The tool refuses any input containing one, and
the plugin deliberately does not expose CSR generation because that returns
a private key. CSRs are limited to 4000 characters. This tool sends no
GoGetSSL credentials.

### 5. Check the balance

Call `gogetssl_account_get_balance` and compare it with the summed partner
prices of everything due. GoGetSSL takes payment from the prepaid balance,
so a short balance stops renewals. Also call `gogetssl_orders_list_unpaid`:
an unpaid order from an earlier attempt may already cover the domain.

## Gotchas

- `gogetssl_dcv_get_domain_emails` rejects wildcards. For a `*.contoso.com`
  certificate, look up `contoso.com`.
- Prices come back per period. Multi-year subscriptions are usually cheaper
  per year, but the certificate inside still has to be reissued as each one
  expires. Check `gogetssl_products_get` for the free reissue allowance.
- An LEI order is not a certificate. For LEI renewals, read the current
  state with `gogetssl_lei_get_status` (status, LEI code and validity dates);
  the renewal itself is placed in the client area.

## Related Skills

- [certificate-expiry](../certificate-expiry/SKILL.md): find what needs renewing
- [billing-reconciliation](../billing-reconciliation/SKILL.md): balance and invoices
- [api-patterns](../api-patterns/SKILL.md): argument formats and errors
