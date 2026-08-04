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
- Credential rotation happens once at the gateway, not per technician.
- Every call carries operator identity, so the gateway audit log answers "who
  raised this invoice" — the payment processor's own log records one API key.
- Revoking gateway access revokes Alternative Payments access with it,
  immediately.

## Tool permission tiers

| Tier | What it can do | Tools |
|---|---|---|
| **Read** | Cannot change vendor state. Safe for autonomous agents, but see Data handling. | `ap_list_customers`, `ap_get_customer`, `ap_list_customer_users`, `ap_list_invoices`, `ap_get_invoice`, `ap_get_invoice_payment_link`, `ap_get_invoice_pdf_link`, `ap_get_payment_request`, `ap_list_transactions`, `ap_get_transaction`, `ap_list_payouts`, `ap_get_payout`, `ap_list_payout_transactions`, `ap_list_webhooks`, `ap_list_webhook_events`, `ap_status`, `ap_navigate` |
| **Write** | Creates records with no financial demand attached. | `ap_create_customer`, `ap_add_customer_user`, `ap_create_webhook`, `ap_retry_webhooks` |
| **Destructive** | Asks a customer for money, or removes a billing record or event feed. Requires explicit per-call human approval. | `ap_create_invoice`, `ap_create_payment_request`, `ap_archive_invoice`, `ap_archive_customer`, `ap_delete_webhook` |

Two of the destructive entries are `create_` calls, and that is the point of
classifying by blast radius rather than verb:

- **`ap_create_invoice`** does not produce a draft. The invoice is created at
  status `open` — issued and awaiting payment. It is a live accounts-receivable
  demand against a named client from the moment the call returns, with a
  payment link attached. Getting the amount wrong is not a data-entry error an
  operator quietly fixes; it is a bill your client received.
- **`ap_create_payment_request`** creates a standalone hosted checkout link for
  an arbitrary amount. The vendor's own tool description is careful that it
  "does not charge anyone" — true, and not the risk. The risk is that anyone
  holding the URL can pay it, for the amount the agent chose.

`ap_archive_invoice` and `ap_archive_customer` are the vendor's own high-impact
operations and prompt for confirmation server-side; archiving an open invoice
removes the customer's ability to pay it, which reads as a resolved bill and is
not. `ap_delete_webhook` is irreversible and stops payment-event delivery
silently — reconciliation keeps running and keeps being wrong.

**No direct-charge tool exists here at all.** `POST /payments` is excluded from
this integration by design, so nothing in this plugin can debit a card or bank
account. Money only moves when a customer chooses to pay a hosted link.

## Recommended agent policy

The safe default is **read autonomously, propose writes, never self-approve
destructive calls.**

- Read tools: allow. Reconciliation, payout tracing, and overdue-invoice
  reporting are the intended autonomous use.
- Write tools: agent drafts the exact call, human approves, then it runs.
- Destructive tools: require a named human approver per invocation, and the
  approver must check the amount and the customer, not just the tool name. Do
  not grant these to scheduled or unattended agents. An automated monthly
  billing run that can call `ap_create_invoice` is a system that can invoice
  every client twice.

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
  `quickbooks-online-payments`.

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
