# Alternative Payments plugin — governance and safety model

Unofficial. Community-built plugin for the Alternative Payments API. Not
affiliated with, endorsed by, or sponsored by the vendor.

## What it connects as

This plugin does not hold credentials. It reaches Alternative Payments through
the WYRE Conduit gateway (`https://conduit.wyre.ai/v1/mcp`), which brokers
authentication centrally and scopes every call to the account the operator is
authorised for.

- No OAuth client id or client secret is stored on the technician's machine, in
  this repo, or in the model's context. The gateway forwards credentials as
  headers and the MCP server mints the short-lived bearer token internally.
- The org's Alternative Payments credential is stored once at the gateway, so
  replacing it is one edit rather than a change on every technician's machine.
  There is no rotate action, though — you re-submit the connect form, which
  overwrites the stored credential in place, and nothing tracks its age or
  prompts you.

- Every call carries operator identity, so the gateway audit log answers "who
  raised this invoice" — the payment processor's own log records one API key.
- Removing someone from the organisation clears their per-vendor grants and
  revokes their gateway refresh tokens at once; a user deactivated in your
  identity provider is refused on their very next request. A user only removed
  from the org keeps an already-issued access token for up to an hour, but it
  reaches only a personal Alternative Payments connection made with their own
  key — never the org's. See `wyre-gateway/GOVERNANCE.md`.

## Tool permission groups

Conduit's access editor presents four groups — Read, Write, Delete, Admin —
so those are the buckets an owner actually clicks. The **Enforcement tier**
column is a separate thing: it is what Conduit compares against a
technician's grant, derived mechanically from `VENDOR_TOOL_CONFIG`
(`src/proxy/result-cache.ts`) rather than from the risk judgement in the
second column. On this connector the two disagree more than on any other in
the marketplace, and the disagreement runs in the *strict* direction — read
that as luck, not as design.

| Group | What it can do | Enforcement tier | Tools |
|---|---|---|---|
| **Read** | Cannot change vendor state. Safe for autonomous agents, but see Data handling. | `read` for four tools, `admin` for the other twelve — see below | `ap_list_customers`, `ap_get_customer`, `ap_list_invoices`, `ap_list_transactions`, `ap_list_customer_users`, `ap_get_invoice`, `ap_get_invoice_payment_link`, `ap_get_invoice_pdf_link`, `ap_get_payment_request`, `ap_get_transaction`, `ap_list_payouts`, `ap_get_payout`, `ap_list_payout_transactions`, `ap_list_webhooks`, `ap_list_webhook_events`, `ap_status` |
| **Write** | Creates records. Two of them ask a named customer for money. | `admin` — Conduit classifies none of them | `ap_create_customer`, `ap_add_customer_user`, `ap_create_webhook`, `ap_retry_webhooks`, `ap_create_invoice`, `ap_create_payment_request` |
| **Delete** | Removes a billing record or an event feed. | `admin` today; `write` — **not** a tier of its own — the moment they are classified | `ap_archive_invoice`, `ap_archive_customer`, `ap_delete_webhook` |
| **Admin** | *Empty by design.* This connector exposes no passthrough, dispatcher, or credential-reading tool. | — | — |

### What Conduit actually classifies

`VENDOR_TOOL_CONFIG` carries five entries for `alternative-payments`, all of
them `read`:

`ap_list_customers`, `ap_get_customer`, `ap_list_invoices`,
`ap_list_transactions`, and `ap_navigate`.

**Every other tool in the table above is unclassified, and Conduit is
fail-closed per tool, not per vendor.** The enforcement gate coerces an
unclassified tool to the highest tier —
`const requiredTier: PermissionTier = classified ?? 'admin';`
(`src/access/access-enforcement.ts:63`) — so today `ap_create_invoice`,
`ap_create_payment_request`, `ap_archive_invoice`, `ap_archive_customer` and
`ap_delete_webhook` all require tier `admin`, as do most of the read tools.
Two consequences follow, and the second is the one to act on:

1. **A read-only agent cannot do the job this connector exists for.** A
   `read` grant reaches four tools. Reconciliation needs `ap_list_payouts`,
   `ap_list_payout_transactions`, and `ap_get_transaction`, and all three
   require `admin` — which also admits every money-moving tool. There is no
   safe middle setting until these are classified, and a per-tool
   `customTools` allowlist is the only way to build one by hand.
2. **Classifying them is a privilege reduction, not a relaxation.** Adding
   the read tools to `VENDOR_TOOL_CONFIG` moves them *down* from `admin`.

`ap_navigate` is classified `read` and is still unreachable: Conduit refuses
every `*_navigate` and `*_back` tool before any tier check, for every caller
including org owners and personal connections
(`src/proxy/tool-call-enforcement.ts:123-129`,
`src/proxy/discovery-tools.ts:41-50`). `conduit__my_access` replaces it.
`ap_status` is deliberately kept.

### Where the mechanical tier disagrees with the judgement

Two of the Write entries are `create_` calls that this document deliberately
treated as the most dangerous things here, and that judgement stands
regardless of what tier they enforce at:

- **`ap_create_invoice` does not produce a draft.** The invoice is created at
  status `open` — issued and awaiting payment. It is a live
  accounts-receivable demand against a named client from the moment the call
  returns, with a payment link attached. Getting the amount wrong is not a
  data-entry error an operator quietly fixes; it is a bill your client
  received.
- **`ap_create_payment_request` creates a standalone hosted checkout link for
  an arbitrary amount.** The vendor's own tool description is careful that it
  "does not charge anyone" — true, and not the risk. The risk is that anyone
  holding the URL can pay it, for the amount the agent chose.

`ap_archive_invoice` and `ap_archive_customer` are the vendor's own
high-impact operations; archiving an open invoice removes the customer's
ability to pay it, which reads as a resolved bill and is not.
`ap_delete_webhook` is irreversible and stops payment-event delivery
silently — reconciliation keeps running and keeps being wrong.

The vendor's sidecar prompts for confirmation on the archive operations.
**That confirmation never fires behind Conduit.** Vendor-side confirmation is
implemented through MCP elicitation, and Conduit is a non-interactive client;
see `wyre-gateway/GOVERNANCE.md`, *Where Conduit is the only enforcement
point*.

**No direct-charge tool exists here at all.** `POST /payments` is excluded
from this integration by design, so nothing in this plugin can debit a card
or bank account. Money only moves when a customer chooses to pay a hosted
link.

### What a `write` grant would mean here

If these tools are classified as this document expects, a `write` grant would
admit `ap_archive_invoice`, `ap_archive_customer` and `ap_delete_webhook`
alongside the ordinary creates. Conduit's enforcement tiers are only `read`,
`write` and `admin` (plus `none`, meaning deny) —
`src/access/permission-tier.ts:27`. "Delete" is a presentation group in the
access editor; a delete-group tool compiles to and enforces at tier `write`
(`src/access/tier-group-mapping.ts`, `GROUP_ENFORCEMENT_TIER`). **There is no
setting that separates them.** The only way to admit some write tools but not
the delete ones is a granular per-tool selection, which compiles to an
explicit `customTools` allowlist.

Conduit compares tiers. It has **no approval step, no per-call confirmation,
and no elicitation.** Nothing in this document can be read as "the gateway
will stop an agent before it invoices a client." Per-call approval is a
policy you impose on your agents, and it is only as good as the agent
configuration that carries it — which matters more here than on any
read-only connector, because the failure mode is a bill a customer received.

## Recommended agent policy

The safe default is **read autonomously, propose writes, never self-approve
deletes** — with the caveat that Conduit cannot currently express the first
half of that on this connector (see *What Conduit actually classifies*).

- Read tools: allow. Reconciliation, payout tracing, and overdue-invoice
  reporting are the intended autonomous use. Today most of them need an
  `admin` grant to run at all, so prefer a granular `customTools` allowlist
  naming exactly the read tools over granting `admin` outright.
- Write tools: agent drafts the exact call, human approves, then it runs.
- Delete tools: require a named human approver per invocation, and the
  approver must check the amount and the customer, not just the tool name. Do
  not grant these to scheduled or unattended agents. An automated monthly
  billing run that can call `ap_create_invoice` is a system that can invoice
  every client twice. Remember that Conduit cannot enforce this separation
  for you — once these tools are classified, a `write` grant already admits
  them — so it has to live in the agent's own configuration.
- Admin tools: none exist here, but note that the fail-closed coercion means
  an `admin` grant on this vendor is currently the *only* way to reach most
  of the surface, and it admits the money-moving tools with it. Treat holding
  it as equivalent to full billing-system access.

## What it cannot reach

- Only the Alternative Payments account the operator's gateway identity maps
  to, and only the environment (`production` or `demo`) the gateway header
  selects.
- No filesystem, no shell, no other vendor's data.
- **No direct charge.** `POST /payments` and the Web-SDK checkout-auth
  initialiser are not exposed. There is no path from this plugin to debiting a
  customer.
- No refund, chargeback, or payout-initiation surface. Payouts can be read, not
  triggered or redirected.
- No bank account or payment-method management. Stored payment credentials are
  neither readable nor writable here.
- No accounting ledger. Nothing here posts to a GL; that is `xero-payments` or
  `qbo-payments`.

## Data handling

Responses pass through the gateway into model context for the session and are
not persisted by this plugin. Nearly everything this plugin returns is
financial or personal:

- **Live payment URLs.** `ap_get_invoice_payment_link` and
  `ap_create_payment_request` return hosted checkout URLs that require no
  further authentication to use. Treat the URL itself as sensitive — anyone who
  obtains it from a transcript, a log, or a shared artifact can act on it.
- **Signed document URLs.** `ap_get_invoice_pdf_link` returns a signed download
  link to the invoice PDF, which carries the client's name, addresses, and full
  line-item detail.
- **Transaction and payout data.** `ap_list_transactions`, `ap_get_transaction`,
  `ap_list_payouts`, `ap_get_payout`, and `ap_list_payout_transactions` return
  amounts, payment-method descriptors, statuses, and settlement detail across
  your whole customer base.
- **Customer PII.** `ap_list_customers`, `ap_get_customer`, and
  `ap_list_customer_users` return client business details and the individual
  billing contacts attached to them.
- **Webhook configuration.** `ap_list_webhooks` returns your endpoint URLs,
  which map your internal reconciliation architecture.

Restrict the payment-link, PDF-link, and transaction tools if agents run
unattended or render output anywhere it is retained.

## Known sharp edges

- **`create` is not `draft`.** Covered above. This is the most common wrong
  assumption an agent brings from other billing systems, where creating an
  invoice produces something a human still has to approve and send.
- **Archive looks like delete but is not undo.** Archiving an invoice removes
  it from active lists; it does not credit the customer, reverse a payment, or
  cancel an obligation. An agent "cleaning up" overdue invoices by archiving
  them destroys your AR position while appearing to tidy it.
- **`ap_retry_webhooks` releases a backlog.** It resumes failed delivery of
  queued events. If a downstream consumer is not idempotent, a large backlog
  arriving at once can double-apply payments in whatever system consumes the
  feed. Fix the consumer before retrying.
- **Deleting a webhook fails silently downstream.** Payments keep succeeding;
  nothing tells you they stopped being recorded. The failure surfaces weeks
  later as an unexplained reconciliation gap.
- **The transactions resource lives at `GET /payments`.** The path implies a
  write surface that does not exist. An agent inferring `POST /payments` from
  the read path will construct a call this integration deliberately does not
  offer.
- **Rate limit is 5 requests per second.** A reconciliation sweep that walks
  payouts and then each payout's transactions will hit it, back off, and return
  partial results that look complete.
