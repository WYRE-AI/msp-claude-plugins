# Syncro plugin — governance and safety model

Unofficial. Community-built plugin for the Syncro MSP API. Not
affiliated with, endorsed by, or sponsored by the vendor.

## What it connects as

The supported deployment reaches Syncro through the WYRE Conduit gateway
(`https://conduit.wyre.ai/v1/syncro/mcp`), which brokers authentication
centrally and scopes every call to the tenant the operator is authorised
for.

- No Syncro API token or subdomain is stored on the technician's
  machine, in this repo, or in the model's context.
- Credential rotation happens once at the gateway, not per technician.
- Every call carries operator identity, so the gateway audit log answers
  "who emailed that invoice". Syncro records only the token's owner.
- Revoking a technician's gateway access revokes Syncro access with it,
  immediately.

**If you run without the gateway**, the plugin README documents a direct
mode where `SYNCRO_API_KEY` sits in the technician's Claude settings.
That mode gives up all four properties above, and Syncro's token
permissions are coarse — see "Known sharp edges".

## Tool permission tiers

Grouped by blast radius, not HTTP verb.

| Tier | What it can do | Tools |
|---|---|---|
| **Read** | Cannot change Syncro or endpoint state. Safe for autonomous agents. | `syncro_navigate`, `syncro_status`, `syncro_assets_list`, `syncro_assets_get`, `syncro_assets_search`, `syncro_customers_list`, `syncro_customers_get`, `syncro_customers_search`, `syncro_contacts_list`, `syncro_contacts_get`, `syncro_tickets_list`, `syncro_tickets_get`, `syncro_invoices_list`, `syncro_invoices_get` |
| **Write** | Creates or modifies records. Reversible, but customer-visible. | `syncro_customers_create`, `syncro_contacts_create`, `syncro_tickets_create`, `syncro_tickets_update`, `syncro_tickets_add_comment`, `syncro_invoices_create` |
| **Destructive** | Sends money documents to the customer. Requires explicit per-call human approval. | `syncro_invoices_email` |

`syncro_invoices_email` is classified destructive despite being an
ordinary POST, because the tier is about blast radius. It sends a
finished invoice to the client's billing contact (plus any `cc_emails`
the caller supplies, with a caller-supplied subject and body). There is
no unsend. An agent that emails a draft, a duplicate, or the wrong
client's invoice creates a commercial incident that a human has to
apologise for, and the damage is done the instant the call returns.
Nothing else in this plugin leaves the MSP's own systems.

`syncro_invoices_create` stays in Write, but it is the closest call in
this batch. It creates a financial record that flows into revenue
reporting and, in most Syncro deployments, syncs onward to QuickBooks or
Xero. It is reversible inside Syncro, which is why it is not
destructive — but treat a batch of them as if it were.

**No script execution and no delete tools are exposed.** Syncro's REST
API supports running scripts on managed assets
(`POST /customer_assets/{id}/run_script`, documented in the
`syncro-assets` skill) and deleting assets, customers, and tickets. This
MCP surface exposes none of them, so nothing here reaches a customer's
production machine. If script execution is added later it belongs in the
destructive tier on day one.

## Recommended agent policy

The safe default is **read autonomously, propose writes, never
self-approve destructive calls.**

- Read tools: allow. Asset audits, ticket reporting, and AR ageing
  reviews across customers are the intended autonomous use.
- Write tools: agent drafts the exact call, human approves, then it
  runs. Invoice creation deserves a second reader.
- Destructive tools: `syncro_invoices_email` requires a named human
  approver per invocation who has seen the invoice total, the recipient,
  and the CC list. Do not grant it to scheduled or unattended agents —
  "email last month's invoices" is exactly the automation that goes
  wrong at scale.

## What it cannot reach

- Only the Syncro subdomain mapped to the operator's gateway identity.
  Syncro tokens are single-tenant.
- No filesystem, no shell, no other vendor's data.
- No endpoint. There is no remote-execution, remote-access, patch,
  reboot, or wipe tool in this surface, even though the Syncro product
  has all of them.
- No payment capture. Recording or taking payment is not exposed; only
  invoice creation, retrieval, and emailing.
- No live event stream. Every tool is point-in-time.

## Data handling

- Syncro responses pass through the gateway into model context for the
  session and are not persisted by this plugin.
- `syncro_invoices_*` returns commercial data: line items, totals,
  balances, and payment terms per client. `syncro_customers_*` and
  `syncro_contacts_*` return client PII including addresses and phone
  numbers. `syncro_assets_*` returns hostnames, serial numbers, and RMM
  inventory. Restrict all three if agents run unattended.
- Invoice data is the most commercially sensitive payload in this
  batch: an agent with read access to `syncro_invoices_list` can
  reconstruct the MSP's entire revenue book by client.

## Known sharp edges

- **The rate limit is per IP, not per key — 180 requests/minute.**
  Behind a gateway every operator shares one egress address, so a single
  unattended agent running a full-fleet sweep throttles every other
  technician and every other integration on that address. This is the
  one vendor in this batch where the gateway concentrates the risk
  rather than reducing it. Scope sweeps, and do not schedule them.
- **Emailing is not idempotent.** A retried `syncro_invoices_email`
  after a timeout sends the invoice twice. If a call's outcome is
  uncertain, verify in Syncro before retrying — do not let an agent
  retry automatically.
- **A running ticket timer inflates the next invoice.** Tickets carry
  `timer_active` and `total_time_seconds`; this plugin cannot start or
  stop a timer, but it can read one. An agent reporting effort or
  drafting an invoice should check `timer_active` rather than trusting
  `total_time_seconds` as final.
- **Invoices sync onward.** In deployments wired to QuickBooks or Xero,
  an invoice created here propagates to the ledger. Correcting it means
  correcting it in two systems.
