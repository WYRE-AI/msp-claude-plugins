# Sherweb plugin — governance and safety model

Unofficial. Community-built plugin for the Sherweb Partner API. Not
affiliated with, endorsed by, or sponsored by the vendor.

## What it connects as

This plugin does not hold credentials. It reaches Sherweb through the WYRE
Conduit gateway (`https://conduit.wyre.ai/v1/mcp`), which brokers
authentication centrally and scopes every call to the service-provider
account the operator is authorised for.

- No Sherweb client ID, client secret, or subscription key is stored on
  the technician's machine, in this repo, or in the model's context.
- The org's Sherweb credential is stored once at the gateway, so
  replacing it is one edit rather than a change on every technician's
  machine. There is no rotate action, though — you re-submit the
  connect form, which overwrites the stored credential in place, and
  nothing tracks its age or prompts you.

- Every call carries operator identity, so the gateway audit log answers
  "who changed that seat count" — Sherweb's own log records only the
  API application.
- Removing someone from the organisation clears their per-vendor grants
  and revokes their gateway refresh tokens at once; a user deactivated
  in your identity provider is refused on their very next request. A
  user only removed from the org keeps an already-issued access token
  for up to an hour, but it reaches only a personal Sherweb connection
  made with their own key — never the org's. See
  `wyre-gateway/GOVERNANCE.md`.

Sherweb's hierarchy is **Distributor → Service Provider (your MSP) →
Customer**. The credential behind the gateway determines which level you
sit at, and therefore which customers exist at all from the tool surface's
point of view.

## Tool permission tiers

> **Not classified in Conduit — every tool in the table below requires tier
> `admin` today.** Conduit derives a tool's tier from `VENDOR_TOOL_CONFIG`
> (`src/proxy/result-cache.ts`) and fails closed:
> `const requiredTier: PermissionTier = classified ?? 'admin';`
> (`src/access/access-enforcement.ts:63`). `sherweb` has no entry there, so
> the grouping below carries no enforcement meaning at present — read tools
> included. A `read` grant on this vendor admits nothing; an `admin` grant
> admits everything, including `sherweb_subscriptions_change_quantity` and
> the dispatchers that can reach it. The grouping becomes what Conduit
> actually enforces once the vendor is classified, and classifying it is a
> privilege *reduction*, not an expansion. For the live list of unclassified
> vendors see `wyre-gateway/GOVERNANCE.md`, *Fail-closed, and the vendors
> Conduit has not classified* — it is stated once there because it moves.
>
> *Editor's note: when `sherweb` gains a `VENDOR_TOOL_CONFIG` entry, delete
> this blockquote and nothing else. No other part of this document depends on
> it.*

| Tier | What it can do | Tools |
|---|---|---|
| **Read** | Cannot change Sherweb state. Safe for autonomous agents. | `sherweb_status`, `sherweb_navigate`, `sherweb_list_categories`, `sherweb_list_category_tools`, `sherweb_router`, `sherweb_customers_list`, `sherweb_customers_get`, `sherweb_customers_accounts_receivable`, `sherweb_subscriptions_list`, `sherweb_subscriptions_get`, `sherweb_billing_payable_charges`, `sherweb_billing_charge_details`, `sherweb_catalog_list_products` |
| **Write** | *Empty.* No tool in this plugin creates a customer, places an order, or edits a record. | — |
| **Destructive** | Changes what the MSP is billed and what software a customer's users can open. | `sherweb_subscriptions_change_quantity` |
| **Meta** | Dispatches another tool by name; inherits that tool's tier. | `sherweb_execute_tool` |

`sherweb_subscriptions_change_quantity` is the only mutating tool here,
and it is classified destructive rather than write on purpose. Three
reasons, none of which are visible in the HTTP verb:

1. **It costs money on the next invoice.** Seats added bill immediately,
   often prorated for the current period. A wrong quantity is not a
   record-keeping error; it is a line item the MSP pays and then has to
   argue about.
2. **Decreasing it deprovisions a user's software.** Dropping from 30 to
   25 seats does not queue a friendly request — it removes licences, and
   somebody loses access to the product they were working in.
3. **The parameter is absolute, not a delta.** `quantity: 5` means "set
   this subscription to 5 seats", not "add 5". An agent reasoning in
   deltas will cut a 30-seat client to 5 in one call. This is the single
   most likely way to cause real customer harm with this plugin.

Commitment terms compound it: annual subscriptions frequently forbid
decreases mid-term, so the failure mode is asymmetric — the increase
succeeds and bills, the correction is rejected.

**Conduit does not enforce per-call approval.** It compares tiers — there
is no approval step, no per-call confirmation, and no interactive prompt
anywhere in its enforcement path. Nothing sits between an agent and a
30-to-5 seat cut once the tier is granted. Where this document asks for a
named human approver, that is a policy you impose on your agents, and it
is only as good as the agent configuration that carries it.

## Recommended agent policy

The safe default is **read autonomously, never self-approve the quantity
change.**

- Read tools: allow. Billing reconciliation, margin analysis,
  accounts-receivable review, and licence inventory are the intended
  autonomous use, and are what the bundled `billing-reconciler` and
  `customer-account-auditor` subagents do.
- `sherweb_subscriptions_change_quantity`: require a named human approver
  per invocation, and require the approval to restate the **absolute
  target quantity and the current quantity**, not the intended change. Do
  not grant this tool to scheduled or unattended agents — including the
  bundled `subscription-provisioner` subagent, which should propose the
  call and stop.
- **Gate on the dispatcher too.** `sherweb_execute_tool` and
  `sherweb_router` can reach `sherweb_subscriptions_change_quantity` by
  name. An allowlist that blocks the quantity-change tool but permits
  `sherweb_execute_tool` has not blocked anything.

## What it cannot reach

- Only the Sherweb customers under the service-provider account mapped to
  the operator's gateway identity. A service-provider credential cannot
  see peer MSPs' customers; a distributor-scoped credential sees more.
- No filesystem, no shell, no other vendor's data.
- **No provisioning path into the vendor product.** Sherweb resells
  Microsoft 365 and other SaaS; this connector adjusts what is purchased,
  never what is configured inside the customer's tenant.
- No customer creation, no order placement, no cancellation, no invoice
  payment. Those happen in the Sherweb partner portal.
- No live event stream. Every tool is point-in-time.

## Data handling

- Responses pass through the gateway into model context for the session
  and are not persisted by this plugin.
- `sherweb_billing_payable_charges` and `sherweb_billing_charge_details`
  return the MSP's own cost structure — list price, net price, promotional
  and performance deductions. That is margin data; do not let an agent
  surface it into a client-facing document.
- `sherweb_customers_accounts_receivable` returns aged balances per
  customer: who owes what and how overdue. Commercially sensitive in both
  directions.
- `sherweb_customers_get` and `sherweb_customers_list` return client
  organisation records with address and contact PII.

## Known sharp edges

- **Quantity is absolute.** Repeated for emphasis because it is the one
  mistake here that costs a customer their working day. See the tier
  justification above.
- **Progressive disclosure hides the tool surface.** Domain tools are
  discovered through `sherweb_navigate` / `sherweb_list_categories`. A
  tool that appears "missing" is usually just not yet discovered — an
  agent should not conclude the capability does not exist.
- **Two billing capabilities do not exist, and earlier revisions of this
  plugin claimed both.** The tool names have been corrected throughout, but
  the absences are permanent and worth stating plainly, because an operator
  will ask for each of them by name.

  *No billing-period enumeration.* Nothing on this server lists billing
  periods, their IDs, or their open/closed status. `sherweb_billing_payable_charges`
  takes `periodFrom`/`periodTo` plus `billingCycleType`
  (`sherweb-mcp/src/domains/billing.ts:20-52`) — you supply the window, and
  nothing validates it against a real period. An agent that "looks up the
  latest period first" is calling a tool that has never existed.

  *No invoice surface whatsoever.* No tool lists invoices, fetches one by ID,
  or returns invoice line items. Two things are invoice-adjacent and neither
  is a substitute: `sherweb_billing_charge_details` returns the line items of
  a single charge, and `sherweb_customers_accounts_receivable` returns one
  customer's outstanding balance and aging. Presenting either as "the
  invoice" misstates what the operator is looking at — the charge view omits
  everything not on that charge, and the AR view is a balance, not a
  document. Invoices live in the Sherweb partner portal.

  Trust `sherweb_list_category_tools` over prose.
- **Pagination is 1-based here** (`page`, `pageSize`, default 25) while
  the neighbouring Pax8 connector is 0-based. Copying a paging pattern
  between the two silently changes which records you get.
- **Proration makes the invoice preview a poor confirmation.** The charge
  for a mid-period seat change does not equal the list price times the
  delta. Do not let an agent reassure an operator about cost from
  arithmetic; read the charge back from
  `sherweb_billing_payable_charges` after the period closes.
