---
name: "Renewal and Price-Increase Prep"
description: >
  Composes Agreement Reconciliation and Margin Analysis into per-client
  talking points for an upcoming renewal or a price-increase conversation.
  Grounds every point in returned contracts, invoices, hours, and
  marketplace data, and produces a partial brief when a source is missing
  rather than inventing rates or amounts.
when_to_use: >-
  When preparing to talk with a client about renewal or a price increase,
  and you need talking points built from agreement and margin evidence
  rather than a new reconciliation from scratch. Use when: renewal talking
  points, price-increase prep, renewal conversation brief, prepare a
  price increase discussion, what to say at renewal, margin-backed
  renewal talking points.
---

# Renewal and Price-Increase Prep

## Overview

Agreement Reconciliation already compares PSA entitlements to invoices.
Margin Analysis already turns revenue, marketplace cost, and labor into
per-client margin. This companion skill composes those two reads into a
short, per-client brief for a renewal or price-increase conversation.

Do not duplicate those skills' workflows. Follow them (or reuse their
fresh output) to gather evidence, then write talking points. Never invent
a rate, an increase percentage, or a dollar figure. If a number is not
returned, omit it and say which source was missing.

## Anti-triggers

- **Reconciling contract lines to invoices as the main job:** use
  [Agreement Reconciliation](../agreement-reconciliation/SKILL.md).
- **Computing portfolio or service-line margin as the main job:** use
  [Margin Analysis](../margin-analysis/SKILL.md).
- **License seat true-up as the main job:** use
  [License True-Up](../license-true-up/SKILL.md).
- **Building the renewal calendar itself:** use the finance-pack
  `renewal-calendar-builder` agent, or the `/finance-pack:renewals`
  command, then come back here for talking points on a chosen client.

## Connected Systems

This skill uses the same systems as the two source skills. At least one
side of the agreement picture (a PSA contract or agreement tool, or an
accounting invoice tool) is required. Margin inputs (marketplace cost,
time entries, a loaded labor rate supplied by the operator) are optional
and must be labeled when missing.

## Workflow

### Step 1: Discover what is actually connected

Call `conduit__search_tools` first. Use the exact names discovery returns.
Gateway names often look like `<vendor-slug>__<tool_name>`. Pax8's hosted
surface uses hyphenated names such as `pax8-list-subscriptions`.

Only call read-only list, get, or search tools from the allow-list
below. Never create, update, send, void, or raw/execute.

**Client roster:** `autotask_search_companies`, `cw_search_companies`,
`cw_get_company`, `halopsa_clients_list`, `halopsa_clients_get`,
`halopsa_clients_search`, `syncro_customers_list`,
`qbo_customers_list`, `qbo_customers_get`, `qbo_customers_search`,
`xero_contacts_list`, `xero_contacts_get`, `xero_contacts_search`,
`pax8-list-companies`.

**Agreements and contracts:** `autotask_search_contracts`,
`cw_search_agreements`, `cw_get_agreement`, `cw_get_agreement_additions`.
There is no `autotask_get_contract` and no
`autotask_list_expiring_contracts` tool; use `autotask_search_contracts`
and filter returned `endDate` values client-side, as the Autotask
contracts skill describes. HaloPSA MCP has no contract or agreement list
tool, and Syncro MCP has no contract list tool: when those are the only
PSA, say the contract side is unavailable.

**Invoices and billing:** `autotask_search_invoices`,
`autotask_get_invoice_details`, `autotask_search_billing_items`,
`autotask_get_billing_item`, `cw_search_invoices`, `cw_get_invoice`,
`halopsa_invoices_list`, `halopsa_invoices_get`, `syncro_invoices_list`,
`qbo_invoices_list`, `qbo_invoices_get`, `xero_invoices_list`,
`xero_invoices_get`. You may use `xero_reports_aged_receivables` or
`qbo_reports_customer_balance` as supporting collections context, not as
a substitute for line-level reconciliation.

**Marketplace (optional cost and subscription context):**
`pax8-list-subscriptions`, `pax8-get-subscription-by-uuid`,
`pax8-list-invoices`, `pax8-get-invoice-by-uuid`,
`sherweb_subscriptions_list`, `sherweb_subscriptions_get`. Pax8 get-by-uuid
and some invoice tools may require a higher Conduit grant than the list
tools; only call them when discovery shows they are callable. Never call
`pax8_orders_create`, `pax8_subscriptions_update`, or
`sherweb_subscriptions_change_quantity` (the first two are not served on
the hosted Pax8 path anyway).

**Labor (optional):** `autotask_search_time_entries`,
`cw_search_time_entries`, `cw_get_time_entry`. If the operator does not
supply a loaded labor rate, say labor cost could not be estimated. Do
not invent a rate.

If a vendor is connected but the needed tool is not in this list, treat
that input as unavailable.

### Step 2: Reuse the source skills

For the chosen client (or each client in an upcoming renewal window):

1. Follow [Agreement Reconciliation](../agreement-reconciliation/SKILL.md)
   for entitlement versus invoice findings, including under-billing,
   over-billing, lapsed agreements still invoiced, and lines that already
   match.
2. Follow [Margin Analysis](../margin-analysis/SKILL.md) for revenue,
   marketplace cost, and labor, with the same missing-input labels that
   skill already requires.

Do not redo those skills' report formats. Extract the findings you need
for the conversation.

### Step 3: Write per-client talking points

Produce a brief the account manager can take into a renewal or
price-increase conversation:

1. **Renewal context.** What is renewing, and when, from returned
   contract or agreement dates. If end dates are missing, say so.
2. **Billing accuracy.** A short, plain-language summary of
   reconciliation findings that should be cleaned up or acknowledged
   before any commercial conversation. Do not surprise a client with an
   increase while an over-billing finding is still open.
3. **Value and delivery evidence.** Hours and closed work only as
   returned by time or ticket tools already gathered. If those were not
   connected, omit this section and say why.
4. **Margin picture.** Directional only, and only from Margin Analysis
   output (for example, "margin on this agreement is thin because
   marketplace cost rose," citing the returned figures). If cost or labor
   is missing, say the picture is incomplete.
5. **Conversation prompts.** Questions and points to cover, not a script
   that invents an increase. If the operator asked for a price-increase
   recommendation, you may show the arithmetic from returned current
   amounts, but you must not invent a target percentage or a new price.
   Leave the decision to the operator.
6. **Sources and gaps.** Which tools were used, and which checks were
   unavailable (including the HaloPSA and Syncro contract-list gaps).

Amounts in the brief must be copied from tool output or from the two
source skills' evidence, with the source named. Do not convert, round
into a "cleaner" made-up number, or add a "typical increase."

## Error Handling

### No client and no renewal window

Ask which client or window to prepare. You may consult the finance-pack
renewals command or `renewal-calendar-builder` for the list, then
continue here.

### Agreement or margin sources are only partly connected

Write a partial brief and list the missing inputs. Do not fill cost,
rate, or invoice gaps with estimates unless the operator supplies them
and you label them as operator-supplied, not tool-returned.

### Reconciliation finds over-billing or a lapsed agreement

Put that finding first in the brief. Do not lead with a price-increase
prompt in that situation.

## Best Practices

- One client per brief unless the operator asked for a batch of upcoming
  renewals, in which case keep each client's section self-contained.
- This is an internal talking-points document, not a client-facing
  proposal.
- Oxford commas, and no em dashes.

## Related Skills

- [Agreement Reconciliation](../agreement-reconciliation/SKILL.md)
- [Margin Analysis](../margin-analysis/SKILL.md)
- [License True-Up](../license-true-up/SKILL.md), when seat counts are
  part of the renewal conversation
