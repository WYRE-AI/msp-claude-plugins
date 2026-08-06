# QuickBooks Online plugin — governance and safety model

Unofficial. Community-built plugin for the QuickBooks Online API. Not
affiliated with, endorsed by, or sponsored by Intuit.

## What it connects as

This plugin does not hold credentials. It reaches QuickBooks Online
through the WYRE Conduit gateway (`https://conduit.wyre.ai/v1/mcp`), which
brokers OAuth 2.0 centrally and scopes every call to the QBO company
(realm) the operator is authorised for.

- No Intuit client ID, client secret, access token, or refresh token is
  stored on the technician's machine, in this repo, or in the model's
  context. The gateway holds the OAuth grant and refreshes it.
- Credential rotation happens once at the gateway, not per technician.
- Every call carries operator identity, so the gateway audit log answers
  "who posted that journal entry" — QBO's own audit log records only the
  connected app.
- Revoking gateway access revokes QuickBooks access with it, immediately.

The gateway connection also selects **sandbox vs production**. A sandbox
connection is the correct default for anyone evaluating agent behaviour
against the tiers below.

## Tool permission groups

Tool names follow `qbo_<entity>_<operation>`. Entities include
`customers`, `invoices`, `payments`, `bills`, `bill_payments`, `purchases`,
`purchase_orders`, `vendors`, `vendor_credits`, `journal_entries`,
`deposits`, `transfers`, `estimates`, `credit_memos`, `refund_receipts`,
`sales_receipts`, `time_activities`, `items`, `accounts`, `classes`,
`departments`, `employees`, `terms`, `payment_methods`, `tax_codes`,
`tax_rates`, `company_info`, and `attachables`.

Conduit's access editor presents four groups — Read, Write, Delete, Admin —
so those are the buckets an owner actually clicks. The **Enforcement tier**
column is a separate thing: it is what Conduit compares against a
technician's grant, derived mechanically from `VENDOR_TOOL_CONFIG`
(`src/proxy/result-cache.ts`) rather than from the risk judgement in the
second column. Note that Conduit's slug for this vendor is **`qbo`**, not
`quickbooks-online`.

| Group | What it can do | Enforcement tier | Tools |
|---|---|---|---|
| **Read** | Cannot change the books. Safe for autonomous agents. | `read` for four tools, `admin` for everything else — see below | `qbo_status`, `qbo_customers_list`, `qbo_invoices_list`, `qbo_reports_aged_receivables`; every other `qbo_<entity>_list`, `qbo_<entity>_get`, and `qbo_<entity>_search`; `qbo_expenses_list_bills`, `qbo_expenses_list_purchases`, `qbo_expenses_get_bill`, `qbo_expenses_get_purchase`; and the rest of the report set — `qbo_reports_profit_and_loss`, `qbo_reports_balance_sheet`, `qbo_reports_aged_payables`, `qbo_reports_cash_flow`, `qbo_reports_trial_balance`, `qbo_reports_general_ledger`, `qbo_reports_customer_sales`, `qbo_reports_customer_balance`, `qbo_reports_vendor_expenses` |
| **Write** | Creates or edits records that post to the books but do not move money or leave the building. | `admin` — Conduit classifies none of them | `qbo_customers_create`, `qbo_vendors_create`, `qbo_vendors_update`, `qbo_items_create`, `qbo_items_update`, `qbo_accounts_create`, `qbo_accounts_update`, `qbo_classes_create`, `qbo_classes_update`, `qbo_departments_create`, `qbo_departments_update`, `qbo_employees_create`, `qbo_employees_update`, `qbo_terms_create`, `qbo_terms_update`, `qbo_payment_methods_create`, `qbo_payment_methods_update`, `qbo_estimates_create`, `qbo_estimates_update`, `qbo_purchase_orders_create`, `qbo_purchase_orders_update`, `qbo_invoices_create`, `qbo_bills_create`, `qbo_bills_update`, `qbo_purchases_create`, `qbo_purchases_update`, `qbo_time_activities_create`, `qbo_time_activities_update`, `qbo_vendor_credits_create`, `qbo_vendor_credits_update`, `qbo_attachables_create`, `qbo_attachables_update`, `qbo_attachables_upload`, and the money-moving set below |
| **Delete** | *Empty.* There is no delete tool and no void tool anywhere in this plugin. | — | — |
| **Admin** | *Empty by design.* This connector exposes no passthrough, dispatcher, or credential-reading tool. | — | — |

The money-moving tools — `qbo_invoices_send`, `qbo_payments_create`,
`qbo_bill_payments_create`, `qbo_bill_payments_update`,
`qbo_journal_entries_create`, `qbo_journal_entries_update`,
`qbo_deposits_create`, `qbo_deposits_update`, `qbo_transfers_create`,
`qbo_transfers_update`, `qbo_refund_receipts_create`,
`qbo_refund_receipts_update`, `qbo_credit_memos_create`,
`qbo_credit_memos_update`, `qbo_sales_receipts_create`,
`qbo_sales_receipts_update` — sit in the **Write** group, because Conduit has
no group for them. They are unclassified, so they enforce at `admin` today;
were they classified they would sit at `write` alongside
`qbo_customers_create`. That collapse is the single most important thing on
this page and it is discussed below.

**There is no delete tool anywhere in this plugin**, and no void tool
either. That sounds reassuring and mostly is — but it also means every
mistake below is a correction posted on top of an error, visible in the
QBO audit log forever, and frequently requiring the MSP's accountant to
unwind. "Not deletable" is not the same as "not harmful".

### What Conduit actually classifies

`VENDOR_TOOL_CONFIG` carries **four** entries under the slug `qbo`, all of
them `read`: `qbo_status`, `qbo_customers_list`, `qbo_invoices_list`, and
`qbo_reports_aged_receivables`.

Every other tool this document names is unclassified, and Conduit is
fail-closed per tool, not per vendor. The enforcement gate coerces an
unclassified tool to the highest tier —
`const requiredTier: PermissionTier = classified ?? 'admin';`
(`src/access/access-enforcement.ts:63`). So as things stand:

- `qbo_journal_entries_create`, `qbo_payments_create`, `qbo_invoices_send`,
  `qbo_transfers_*`, `qbo_deposits_*`, `qbo_refund_receipts_*` and
  `qbo_credit_memos_*` require tier `admin`.
- So do `qbo_reports_profit_and_loss`, `qbo_reports_balance_sheet`,
  `qbo_reports_general_ledger`, and every other report except aged
  receivables.

The second bullet is the operational problem. The bundled
`billing-reconciler` and `profitability-reporter` subagents are read-only by
design, and the reports they need require `admin` — a tier that also admits
posting a journal entry. **There is no safe middle setting until these tools
are classified**; build one by hand with a granular per-tool `customTools`
allowlist naming exactly the report and list tools. Classifying them is a
privilege *reduction*, not a relaxation: it moves the read tools down from
`admin`.

`qbo_navigate` is not listed above because it is unreachable regardless of
tier. Conduit refuses every `*_navigate` and `*_back` tool before any tier
check, for every caller including org owners and personal connections
(`src/proxy/tool-call-enforcement.ts:123-129`,
`src/proxy/discovery-tools.ts:41-50`). `conduit__my_access` replaces it.
`qbo_status` is deliberately kept.

### Where the mechanical tier disagrees with the judgement

Conduit's tiers are a function of `isWrite`/`isAdmin`. "Moves money on the
books" is not a distinction it can express, so the reasoning has to live
here as prose. It has not changed:

- **`qbo_invoices_send` leaves the building.** It emails the invoice to
  the customer. There is no unsend. A wrong amount, a wrong customer, or a
  duplicate send is a client-facing incident, not a data-entry fix.
- **`qbo_journal_entries_create` writes straight to the general ledger**,
  bypassing the sub-ledgers that normally keep AR and AP consistent. A
  bad JE misstates the financials and, in a closed period, can change
  figures that have already been filed.
- **`qbo_payments_create` changes what a customer owes.** Applying cash to
  the wrong invoice corrupts accounts receivable and the statement the
  client receives; collections then chase an invoice that was paid.
- **`qbo_deposits_*` and `qbo_transfers_*` move balances between accounts**
  and break bank reconciliation, which is the control that would otherwise
  catch the rest of this list.
- **`qbo_credit_memos_*` and `qbo_refund_receipts_*` give money back.** A
  credit memo reduces revenue; a refund receipt records cash leaving.
- **`qbo_sales_receipts_*` books revenue and cash in one document.**
  Unlike an invoice, a sales receipt asserts the sale was already paid, so
  a mistaken one overstates both income and the deposit account without
  ever appearing in accounts receivable where an AR review would catch it.
- **`qbo_vendor_credits_*` reduce what the business owes a vendor**, and
  flow into the same aged-payables figure the MSP pays from. A wrong
  vendor credit shows up as an underpayment to the supplier, not as an
  obvious error in QBO.

### What a `write` grant would mean here

Once these tools are classified, `write` on this vendor admits
`qbo_customers_create` and `qbo_journal_entries_create` equally. Conduit's
enforcement tiers are only `read`, `write` and `admin` (plus `none`, meaning
deny) — `src/access/permission-tier.ts:27` — and the access editor's
"Delete" group is presentation only, compiling to and enforcing at tier
`write` (`src/access/tier-group-mapping.ts`, `GROUP_ENFORCEMENT_TIER`). This
plugin has no delete tools, so that particular trap does not bite here; the
equivalent trap does. **A single `write` grant covers creating a customer
record and posting to the general ledger, and no setting separates them.**
The only way to admit some and not the others is a granular per-tool
selection, which compiles to an explicit `customTools` allowlist.

Conduit compares tiers. It has **no approval step, no per-call confirmation,
and no elicitation.** Nothing here can be read as "the gateway will stop an
agent before it emails a client an invoice." Per-call approval is a policy
you impose on your agents, and it is only as good as the agent configuration
that carries it.

## Recommended agent policy

The safe default is **read autonomously, propose writes, never self-approve
deletes** — with the caveat that Conduit cannot currently express the first
half of that on this connector (see *What Conduit actually classifies*).

- Read tools: allow. Aged-receivables review, per-client profitability,
  and reconciliation reporting are the intended autonomous use, and are
  what the bundled `billing-reconciler` and `profitability-reporter`
  subagents do. Today only `qbo_reports_aged_receivables`,
  `qbo_customers_list`, `qbo_invoices_list` and `qbo_status` are reachable
  at tier `read`; grant the rest through a granular `customTools` allowlist
  rather than by handing the agent `admin`.
- Write tools: agent drafts the exact call, human approves, then it runs.
  Note that creating an invoice is the lower-risk half of a two-step
  sequence — `qbo_invoices_create` followed by `qbo_invoices_send` reaches
  the customer, and Conduit sees two ordinary calls.
- Money-moving tools: require a named human approver per invocation, and
  require that approver to be someone who would sign off on the underlying
  transaction anyway. Do not grant them to scheduled or unattended agents.
  Conduit cannot enforce this separation for you — once these tools are
  classified, a `write` grant admits them alongside the harmless creates —
  so it has to live in the agent's own configuration.
- Admin tools: none exist here, but the fail-closed coercion means an
  `admin` grant is currently the only tier that reaches most of this
  surface, and it admits the general ledger with it. Treat holding it as
  equivalent to full bookkeeper access.
- **Never grant any write tool against a production realm during a close
  period** unless the approver is the person doing the close.

## What it cannot reach

- Only the QBO company (realm) mapped to the operator's gateway identity.
  One connection is one set of books; a multi-entity MSP needs one
  connection per entity.
- No filesystem, no shell, no other vendor's data.
- **No banking rails.** Nothing here initiates an ACH transfer, charges a
  card, or moves real money. `qbo_payments_create` and `qbo_transfers_*`
  record that money moved; they do not move it. QuickBooks Payments,
  payroll, and bill-pay are outside this tool surface.
- No delete, no void, no period close, no chart-of-accounts deletion.
- No user, role, or app-connection administration inside QBO.

## Data handling

- Responses pass through the gateway into model context for the session
  and are not persisted by this plugin.
- **This is the MSP's own books.** `qbo_reports_profit_and_loss`,
  `qbo_reports_balance_sheet`, `qbo_reports_trial_balance`, and
  `qbo_reports_general_ledger` return the whole financial position of the
  business — revenue, margin, payroll-adjacent expense. Restrict these if
  agents run in a shared or client-visible context.
- `qbo_customers_*` and `qbo_vendors_*` return contact PII and billing
  addresses; `qbo_employees_*` returns staff records.
- `qbo_payments_*` and `qbo_bill_payments_*` return payment-method
  references and deposit accounts. Intuit tokenises card data, so full
  card numbers do not come back — but bank account references and payment
  history do.
- `qbo_attachables_*` can return receipt and invoice attachments, whose
  contents this plugin cannot inspect or classify.

## Known sharp edges

- **SyncToken is optimistic locking, not a formality.** Every update needs
  the current `SyncToken`, fetched immediately before. A stale token
  returns an error that reads like a permissions problem; an agent that
  "retries with a fresh fetch" in a loop can end up applying an update on
  top of someone else's concurrent edit.
- **Updates are sparse — but only if you say so.** The tools set
  `sparse: true`, meaning omitted fields are left alone. If that ever
  changes, an omitted field becomes a cleared field. Never assume a
  partial payload is safe on an entity you have not read first.
- **Invoices and customers have no update tool here.** Most entities get
  a generated `_update`; invoices and customers do not.
  `qbo_invoices_get`, `qbo_invoices_create`, `qbo_invoices_list` and
  `qbo_invoices_send` are the whole invoice surface, and customers stop at
  `qbo_customers_list`, `qbo_customers_get`, `qbo_customers_create` and
  `qbo_customers_search`. An agent asked to "fix the invoice" must not
  improvise with a journal entry — that reaches the general ledger
  sideways — and must not assume the missing tool is a naming problem it
  can guess its way around.
- **Reports are point-in-time and macro-dependent.** Date macros like
  "This Fiscal Year-to-date" resolve against the realm's fiscal calendar,
  not the calendar year. Two reports pulled minutes apart across a period
  boundary will not tie out.
- **Rate limits degrade mid-task** (Intuit throttles per realm). A
  truncated report or list sweep is incomplete, not empty — do not let an
  agent conclude a client has no outstanding invoices from a 429.
