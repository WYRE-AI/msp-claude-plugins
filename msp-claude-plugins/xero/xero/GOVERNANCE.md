# Xero plugin — governance and safety model

Unofficial. Community-built plugin for the Xero Accounting API. Not affiliated
with, endorsed by, or sponsored by the vendor.

## What it connects as

This plugin does not hold credentials. It reaches Xero through the WYRE Conduit
gateway (`https://conduit.wyre.ai/v1/mcp`), which brokers authentication
centrally and scopes every call to the Xero organization the operator is
authorised for.

- No Xero client id, client secret, or access token is stored on the
  technician's machine, in this repo, or in the model's context. Xero Custom
  Connections mint 30-minute tokens with no refresh token; the gateway handles
  that cycle.
- Credential rotation happens once at the gateway, not per technician.
- Every call carries operator identity, so the gateway audit log answers "who
  authorised this invoice". Xero's own history attributes every change to the
  Custom Connection, which is one name for your whole team — and that matters
  more here than in most connectors, because these are accounting records.
- Revoking gateway access revokes Xero access with it, immediately.

## Tool permission tiers

| Tier | What it can do | Tools |
|---|---|---|
| **Read** | Cannot change Xero state. Safe for autonomous agents, but see Data handling. | `xero_accounts_list`, `xero_accounts_get`, `xero_contacts_list`, `xero_contacts_get`, `xero_contacts_search`, `xero_invoices_list`, `xero_invoices_get`, `xero_payments_list`, `xero_payments_get`, `xero_reports_profit_and_loss`, `xero_reports_balance_sheet`, `xero_reports_aged_receivables`, `xero_reports_aged_payables`, `xero_status`, `xero_navigate`, `xero_back` |
| **Write** | Creates a record with no financial effect. Reversible. | `xero_contacts_create` |
| **Destructive** | Creates, issues, cancels, or settles a financial obligation. Requires explicit per-call human approval. | `xero_invoices_create`, `xero_invoices_update_status`, `xero_payments_create` |

The write tier holds exactly one tool. That is not an accident of the API
surface — it reflects that in an accounting system almost nothing that changes
state is safely reversible.

- **`xero_invoices_create`** accepts `Status`, so a single call can create an
  invoice straight to `AUTHORISED`. An authorised invoice cannot be edited or
  deleted, only voided; it has consumed an invoice number, it appears on the
  client's statement, and voiding it leaves a permanent gap in the sequence
  that an auditor will ask about. Even created as `DRAFT` it is a proposed
  receivable in your books.
- **`xero_invoices_update_status`** is the tool that issues and cancels. Moving
  to `AUTHORISED` turns a draft into a legally-issued demand for payment;
  moving to `VOIDED` cancels a demand a client may already have paid against.
  Both are one-way in accounting terms.
- **`xero_payments_create`** applies money against an invoice. A Xero payment
  cannot be edited — only deleted and re-entered. A payment applied to the
  wrong invoice marks a bill as settled that is not, suppresses the dunning
  that should have chased it, and misstates AR until someone notices.

`xero_contacts_create` stays in the write tier because a contact carries no
balance and no obligation. It is the one thing here you can create and then
change your mind about.

## Recommended agent policy

The safe default is **read autonomously, propose writes, never self-approve
destructive calls.**

- Read tools: allow. Cash-flow reporting, aged-receivables review, and
  reconciliation analysis are the intended autonomous use, and are where this
  plugin earns its place.
- Write tools: agent drafts the exact call, human approves, then it runs.
- Destructive tools: require a named human approver per invocation, and the
  approver must check amounts, account codes, and the target invoice — not just
  that the call is well-formed. Do not grant these to scheduled or unattended
  agents. A monthly billing automation with `xero_invoices_create` and no human
  in the loop is a system that can bill every client twice, or bill one client
  another's amount.

## What it cannot reach

- Only the Xero organization selected by the `xero-tenant-id` the operator's
  gateway identity maps to. A Custom Connection token can address multiple
  organizations; the header, set at the gateway, picks one.
- Only the scopes granted. Reports are read-only by scope
  (`accounting.reports.read`) and cannot be made writable from this plugin.
- No filesystem, no shell, no other vendor's data.
- No bank feeds, bank transactions, or bank reconciliation. This plugin cannot
  see or touch the connected bank account.
- No payroll, no fixed assets, no purchase orders, no expense claims.
- No credit notes. A service credit must be raised in the Xero web app; this
  plugin can neither issue nor apply one.
- No delete of any kind. There is no tool to remove an invoice, a payment, or a
  contact.
- **No money movement.** Xero is a ledger. `xero_payments_create` records that
  money changed hands; it does not make it happen. Nothing here debits or
  credits a real account.

## Data handling

Responses pass through the gateway into model context for the session and are
not persisted by this plugin. This plugin returns the financial position of the
business:

- **Whole-company financials.** `xero_reports_profit_and_loss` and
  `xero_reports_balance_sheet` return revenue, costs, margin, assets, and
  liabilities. A single call discloses the company's complete financial
  position. These are the most sensitive tools in the batch and the least
  obviously so, because they are reads.
- **Client credit position.** `xero_reports_aged_receivables` returns which
  clients owe what, and how late they are — commercially sensitive about your
  customers, not just about you.
- **Supplier terms.** `xero_reports_aged_payables` exposes who you buy from and
  how you pay them.
- **Customer and supplier PII.** `xero_contacts_list`, `xero_contacts_get`, and
  `xero_contacts_search` return names, addresses, email addresses, phone
  numbers, and tax registration numbers.
- **Transaction-level detail.** `xero_invoices_*` and `xero_payments_*` return
  amounts, line items, and payment history per client.

Restrict the report tools specifically if agents run unattended or render
output where anyone outside finance could see it.

## Known sharp edges

- **Validation failures return HTTP 200.** Xero attaches `HasErrors: true` and
  a `ValidationErrors` array to the individual resource rather than failing the
  request. An agent that checks status codes will report a successful billing
  run that created nothing — or, in a batch, created some invoices and not
  others.
- **Batches hide which item broke.** Without `?summarizeErrors=false` a batch
  failure collapses into one aggregate message. Partial success plus an opaque
  error is how a monthly run ends up half-issued with nobody sure which half.
- **Authorised cannot be edited, only voided.** There is no correction path. A
  batch created straight to `AUTHORISED` with a wrong rate means voiding and
  re-issuing every invoice, each with a new number the client has to reconcile.
- **Invoice numbers are consumed permanently.** A number used by a voided
  invoice cannot be reused. Omitting `InvoiceNumber` and letting Xero assign
  one avoids a collision error that reads like a duplicate-detection failure.
- **A missing `xero-tenant-id` returns 403, not 400.** The error reads as a
  permissions problem when the header is simply absent — an agent will
  reasonably conclude its credentials were revoked and escalate.
- **Rate limits are tight and dual.** 60 requests per minute *and* 5,000 per
  day. Monthly billing plus a reporting sweep can exhaust the daily budget, and
  the degradation lands mid-task.
- **Payments are not editable.** Correcting a misapplied payment means deleting
  and re-entering, which this plugin cannot do — it becomes a manual job in the
  Xero web app.
