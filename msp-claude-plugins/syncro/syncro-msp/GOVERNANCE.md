# Syncro plugin — governance and safety model

Unofficial. Community-built plugin for the Syncro MSP API. Not
affiliated with, endorsed by, or sponsored by the vendor.

## What it connects as

The supported deployment reaches Syncro through the WYRE Conduit gateway
(`https://conduit.wyre.ai/v1/syncro/mcp`), which brokers authentication
centrally and scopes every call to the tenant the operator is authorised
for.

Consequences worth stating plainly:

- No Syncro API token or subdomain is stored on the technician's
  machine, in this repo, or in the model's context.
- Credential rotation happens once at Conduit, not per technician.
  Syncro is an API-key vendor, not OAuth, so "rotation" means
  re-submitting the connect form — there is no rotate action.
- Every call carries operator identity, so Conduit's audit log answers
  "who emailed that invoice". Syncro records only the token's owner. The
  log records *who called what*, never with what arguments — so it will
  name `syncro_invoices_email` but not the invoice or the recipients.
- Complete offboarding in the gateway console, and confirm the person no longer has access before you treat it as done.

**If you run without the gateway**, the plugin README documents a direct
mode where `SYNCRO_API_KEY` sits in the technician's Claude settings.
That mode gives up all four properties above, no tier is enforced at
all, and Syncro's own token permissions are coarse — see "Known sharp
edges".

## Tool permission groups

Grouped into the four buckets Conduit's access editor presents, with the
tier each bucket actually enforces at.

| Group | What it can do | Enforcement tier | Tools |
|---|---|---|---|
| **Read** | Cannot change Syncro or endpoint state. Safe for autonomous agents. | `read` | `syncro_status`, `syncro_assets_list`, `syncro_customers_list`, `syncro_tickets_list`, `syncro_invoices_list` |
| **Write** | Adds a customer-visible note to a ticket. | `write` | `syncro_tickets_add_comment` |
| **Delete** | — | `write` — **not** a tier of its own | **Empty.** No Syncro tool name carries a delete-verb token. |
| **Admin** |including invoice creation and invoice emailing.| `admin` | see below |

Five readable tools and one write. That is the whole of Syncro's
classified surface in Conduit, and it is the most important fact in this
document.

Confirm the live permission grant in the gateway access editor before you rely on a tier in this document. This note does not describe gateway enforcement internals.

### Where the mechanical tier and the risk judgement disagree

- **`syncro_invoices_email` is the sharpest tool here, and it currently
  enforces at `admin` by accident.** It sends a finished invoice to the
  client's billing contact — plus any `cc_emails` the caller supplies,
  with a caller-supplied subject and body. There is no unsend. An agent
  that emails a draft, a duplicate, or the wrong client's invoice creates
  a commercial incident that a human has to apologise for, and the damage
  is done the instant the call returns. Nothing else in this plugin
  leaves the MSP's own systems.

That would be a real regression against today's accidental `admin`.

- **`syncro_invoices_create` is the closest call in this batch.** It
  creates a financial record that flows into revenue reporting and, in
  most Syncro deployments, syncs onward to QuickBooks or Xero. It is
  reversible inside Syncro, so `write` is the right classification — but
  treat a batch of them as if it were not.

**No script execution and no delete tools are exposed.** Syncro's REST API supports running scripts on managed assets (`POST /customer_assets/{id}/run_script`, documented in the `syncro-assets` skill) and deleting assets, customers, and tickets. This MCP surface exposes none of them, so nothing here reaches a customer's production machine.

## Recommended agent policy

The safe default is **read autonomously, propose writes, never
self-approve deletes.**

- Read tools: allow. Asset audits, ticket reporting, and AR ageing
  reviews across customers are the intended autonomous use — noting that
  a `read` agent can only list, not open.
- Write tools: agent drafts the exact call, human approves, then it
  runs. Invoice creation deserves a second reader.
- Admin tools: today this grant is the whole write surface plus every
  detail read, so it is close to "full Syncro operator". Do not give it
  to a scheduled or unattended agent. If an agent genuinely needs to
  create tickets, give it a granular grant listing exactly those tools
  and omitting `syncro_invoices_email`.
- For `syncro_invoices_email`: a named human approver per invocation who
  has seen the invoice total, the recipient, and the CC list. Conduit
  will not ask, and will not record the arguments afterwards. "Email
  last month's invoices" is exactly the automation that goes wrong at
  scale.

## What it cannot reach

- Only the Syncro subdomain the connected credential can reach; Syncro
  tokens are single-tenant. Conduit controls *who in your organisation
  may use that credential and which tools they may call*, not which
  slice of Syncro's data comes back.
- No filesystem, no shell, no other vendor's data.
- No endpoint. There is no remote-execution, remote-access, patch,
  reboot, or wipe tool in this surface, even though the Syncro product
  has all of them.
- No arbitrary-request passthrough. There is no `syncro_raw_request` or
  `syncro_execute_tool`, so nothing here has a blast radius chosen by
  its arguments.
- No payment capture. Recording or taking payment is not exposed; only
  invoice creation, retrieval, and emailing.
- No live event stream. Every tool is point-in-time.

## Data handling

- Syncro responses pass through Conduit into model context for the
  session and are not persisted by this plugin.
- `syncro_invoices_*` returns commercial data: line items, totals,
  balances, and payment terms per client. `syncro_customers_*` and
  `syncro_contacts_*` return client PII including addresses and phone
  numbers. `syncro_assets_*` returns hostnames, serial numbers, and RMM
  inventory. Restrict all three if agents run unattended.
- Invoice data is the most commercially sensitive payload in this
  batch: an agent with read access to `syncro_invoices_list` — which is
  classified `read`, so a plain read grant reaches it — can reconstruct
  the MSP's entire revenue book by client.

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
- Check `conduit__my_access` before assuming a credential or connection problem.
