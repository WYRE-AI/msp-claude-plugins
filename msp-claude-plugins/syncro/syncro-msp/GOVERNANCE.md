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
- Removing a technician's Conduit org membership stops their Syncro
  access on their next call, because membership is re-read per request.
  It does **not** revoke an already-issued token, and it does not touch
  credentials they connected personally. Full offboarding is more than
  one step — see `wyre-gateway/GOVERNANCE.md`, *Revocation*.

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
| **Admin** | Everything else the server serves, by fail-closed default rather than by judgement — including invoice creation and invoice emailing. | `admin` | see below |

Five readable tools and one write. That is the whole of Syncro's
classified surface in Conduit, and it is the most important fact in this
document.

### Fourteen tools require `admin` because Conduit has not classified them

The Syncro MCP server registers 21 tools. Conduit's `VENDOR_TOOL_CONFIG`
(`src/proxy/result-cache.ts`) classifies **7**. Classification is
fail-closed: an unclassified tool is coerced to the highest tier at the
enforcement gate —
`const requiredTier: PermissionTier = classified ?? 'admin';`
(`src/access/access-enforcement.ts:63`).

| Unclassified tool | What it does | Tier it enforces at today |
|---|---|---|
| `syncro_assets_get`, `syncro_assets_search` | Asset detail and search | `admin` |
| `syncro_customers_get`, `syncro_customers_search` | Customer detail and search | `admin` |
| `syncro_contacts_list`, `syncro_contacts_get` | Contact records | `admin` |
| `syncro_tickets_get` | One ticket, with its body | `admin` |
| `syncro_invoices_get` | One invoice | `admin` |
| `syncro_customers_create`, `syncro_contacts_create` | Creates client records | `admin` |
| `syncro_tickets_create`, `syncro_tickets_update` | Creates and edits tickets | `admin` |
| `syncro_invoices_create` | Creates a financial record | `admin` |
| `syncro_invoices_email` | **Sends an invoice to the client** | `admin` |

Two consequences an owner should not have to infer:

1. **A `read`-tier agent cannot open a ticket or an invoice.** It can
   list them and nothing more. The `_list` form of each entity is
   classified; the `_get` and `_search` forms are not. If a reporting
   agent is denied a call this document's Read group appears to permit,
   that inconsistency is the reason. Classifying the missing reads would
   be a privilege reduction, not an addition.
2. **`admin` is the only tier that can write anything but a ticket
   comment — and it is indivisible.** Granting `admin` so a technician
   can create an invoice grants them `syncro_invoices_email` in the same
   motion. Conduit has no tier between them. The only way to admit
   invoice creation without invoice emailing is a granular per-tool
   grant, which compiles to an explicit `customTools` allowlist
   (`src/access/tier-group-mapping.ts`). For Syncro that allowlist is
   not an optimisation; it is the only usable configuration.

`syncro_navigate` is classified `read` but is refused for *every* caller
at *every* tier, org owners included: Conduit suppresses `*_navigate`
and `*_back` unconditionally before any tier check
(`src/proxy/tool-call-enforcement.ts:125-130`,
`src/proxy/discovery-tools.ts:41-50`). Use `conduit__my_access`.

### Where the mechanical tier and the risk judgement disagree

- **`syncro_invoices_email` is the sharpest tool here, and it currently
  enforces at `admin` by accident.** It sends a finished invoice to the
  client's billing contact — plus any `cc_emails` the caller supplies,
  with a caller-supplied subject and body. There is no unsend. An agent
  that emails a draft, a duplicate, or the wrong client's invoice creates
  a commercial incident that a human has to apologise for, and the damage
  is done the instant the call returns. Nothing else in this plugin
  leaves the MSP's own systems.

  When Syncro is classified, this tool should be pinned
  `isWrite: true, isAdmin: true` deliberately rather than left to a verb
  heuristic. `send` is in Conduit's write-verb set
  (`src/access/tool-naming.ts:60-68`) but not its delete-verb set, so a
  name-based pass would seed it as an ordinary `write` — landing it in
  the Write group beside ticket comments, where the first technician
  granted `write` gets it silently. That would be a real regression
  against today's accidental `admin`.

- **`syncro_invoices_create` is the closest call in this batch.** It
  creates a financial record that flows into revenue reporting and, in
  most Syncro deployments, syncs onward to QuickBooks or Xero. It is
  reversible inside Syncro, so `write` is the right classification — but
  treat a batch of them as if it were not.

**No script execution and no delete tools are exposed.** Syncro's REST
API supports running scripts on managed assets
(`POST /customer_assets/{id}/run_script`, documented in the
`syncro-assets` skill) and deleting assets, customers, and tickets. This
MCP surface exposes none of them, so nothing here reaches a customer's
production machine. If script execution is added later, classify it
`isWrite: true, isAdmin: true` on day one — `run` is already in
Conduit's admin-verb set, and `datto_run_quickjob` and
`cwautomate_scripts_execute` are the precedents.

### What granting `write` means generally

Conduit's enforcement tiers are only `read`, `write`, and `admin` (plus
`none`, meaning deny) — `src/access/permission-tier.ts:27`. "Delete" is a
presentation group in the access editor, and a delete-group tool compiles
to and enforces at tier `write` (`src/access/tier-group-mapping.ts`,
`GROUP_ENFORCEMENT_TIER`). **Granting a technician `write` for a vendor
also grants every delete tool on it**, and only a per-tool `customTools`
allowlist separates them. Syncro's Delete group is empty today, so a
`write` grant here buys exactly one tool — but that will change the
moment this vendor is classified.

Conduit has no approval step, no per-call confirmation, and no
interactive prompt. It compares tiers. The per-call approval discipline
below is a workflow you impose on your agents, and it is only as good as
the agent configuration that carries it.

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
- **A denial at tier `read` or `write` is expected, not a
  misconfiguration.** Two thirds of Syncro's tools are unclassified and
  enforce at `admin`. Check `conduit__my_access` before assuming a
  credential or connection problem.
