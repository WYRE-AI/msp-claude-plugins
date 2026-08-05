# ScalePad plugin — governance and safety model

Unofficial. Community-built plugin for the ScalePad API. Not affiliated
with, endorsed by, or sponsored by the vendor.

## What it connects as

This plugin does not hold credentials. It reaches ScalePad through the
WYRE Conduit gateway (`https://conduit.wyre.ai/v1/mcp`), which brokers
authentication centrally and scopes every call to the ScalePad account
the operator is authorised for.

- No ScalePad API key — and no Quoter OAuth client secret — is stored on
  the technician's machine, in this repo, or in the model's context.
- Credential rotation happens once at the gateway, not per technician.
- Every call carries operator identity, so the gateway audit log answers
  "who published that quote" — ScalePad's own log records only the API
  account.
- Revoking gateway access revokes ScalePad access with it, immediately.

One credential, five products. A single ScalePad API key covers Core,
Lifecycle Manager, ControlMap, Backup Radar, and the hosted Quoter path.
There is no per-product key, so **you cannot grant an agent Core without
also granting it Quoter** at the credential layer. Separation has to come
from the tool tiers below, which is why they matter more here than for a
single-product vendor.

## Tool permission groups

The surface is roughly 400 tools across five domains, named
`scalepad_<domain>_<resource>_<action>` with domain prefixes `core`,
`lm`, `cm`, `br`, and `quoter`.

**Conduit classifies 41 of them. All 41 are deletes, or `_publish`, or
`_revoke`.** Nothing else on ScalePad appears in `VENDOR_TOOL_CONFIG`
(`src/proxy/result-cache.ts:1285`), and an unclassified tool fails
closed to the top tier —
`const requiredTier: PermissionTier = classified ?? 'admin';`
(`src/access/access-enforcement.ts:63`).

That produces an inversion an owner needs to see before granting
anything: **on this vendor, the only tools reachable below `admin` are
the destructive ones.**

| Group | What it can do | Enforcement tier | Tools |
|---|---|---|---|
| **Read** | Cannot change ScalePad state — but Conduit does not know these tools exist, so it demands the top tier. | `admin`, by fail-closed default | Every `scalepad_core_*` tool (the whole domain is read-only) and every `scalepad_br_*` tool (likewise); across `lm`, `cm`, and `quoter`: `*_list`, `*_get`, `*_search`, `*_list_summaries`, `*_lookup`; plus `scalepad_status` and `scalepad_navigate`. **None are classified.** |
| **Write** | Creates or modifies records. Reversible, but often customer-visible. Also unclassified. | `admin`, by fail-closed default | `*_create`, `*_update`, `*_map` / `*_unmap`, `*_attach` / `*_detach`, `*_upload_document`, the targeted field updates (`scalepad_lm_initiatives_status_update`, `scalepad_lm_goals_status_update`, `scalepad_lm_action_items_completion_status_update`, and similar), **and `scalepad_lm_deliverables_share_link_create` / `_regenerate`**. **None are classified.** |
| **Delete** | Destroys records, revokes access someone is relying on, or commits commercially. **The only group Conduit classifies.** | `write` — **not** a tier of its own | All 19 Lifecycle Manager deletes (`scalepad_lm_initiatives_delete`, `scalepad_lm_goals_delete`, `scalepad_lm_meetings_delete`, `scalepad_lm_action_items_delete`, `scalepad_lm_assessments_delete`, `scalepad_lm_deliverables_delete` and its section/component/template siblings, `scalepad_lm_contracts_delete`, `scalepad_lm_notes_delete`, `scalepad_lm_deliverables_share_link_revoke`); all 12 ControlMap deletes (`scalepad_cm_risks_delete`, `scalepad_cm_controls_delete`, `scalepad_cm_evidence_delete`, `scalepad_cm_evidence_delete_schedule`, `scalepad_cm_evidence_requests_delete`, `scalepad_cm_documents_delete`, `scalepad_cm_governance_delete`, `scalepad_cm_policies_delete`, `scalepad_cm_policies_delete_section`, `scalepad_cm_procedures_delete`, `scalepad_cm_assessments_delete_response`, `scalepad_cm_action_items_delete`); 9 Quoter catalog deletes; plus `scalepad_quoter_quotes_publish` (41 total) |
| **Admin** | *Empty by classification* — no ScalePad tool is marked `isAdmin`. Every tool not in the Delete row nonetheless requires `admin`, for the reason above. | — | None. |

### What that means when you actually set a grant

- **Tier `read` gets you nothing.** Not one ScalePad tool is classified
  `read`. A read-only agent is denied the entire vendor.
- **Tier `write` gets you the 41 deletes and nothing else.** Conduit's
  tiers are only `read`, `write`, and `admin` (plus `none`, meaning
  deny) — `src/access/permission-tier.ts:27`. "Delete" is a presentation
  group in the access editor; a delete-group tool compiles to and
  enforces at tier `write` (`src/access/tier-group-mapping.ts`,
  `GROUP_ENFORCEMENT_TIER`). So **granting a technician `write` on
  ScalePad grants every delete tool listed above — and, today, grants
  them *only* those.** An agent at `write` can destroy a compliance
  evidence record but cannot list one first. Read that sentence twice
  before you set it.
- **Tier `admin` is what asset reporting requires**, because every
  `_list` and `_get` is unclassified. And `admin` subsumes `write`, so
  the grant you make to run a warranty report also admits all 41
  deletes plus `scalepad_quoter_quotes_publish`.
- **The only thing that separates them is a granular per-tool grant**,
  which compiles to an explicit `customTools` allowlist. There is no
  tier setting that admits the reads and withholds the deletes.

Classifying ScalePad's read tools would be a **privilege reduction**: it
moves several hundred `_list`/`_get` calls down from `admin` to `read`
and removes the only reason to hand out `admin` on this vendor. Worth
raising with whoever maintains `VENDOR_TOOL_CONFIG`.

### Where the mechanical tier and the author's judgement disagree

Conduit's model grades exactly one thing — can this call change vendor
state — and grades it by tool name, never by arguments
(`src/proxy/tool-call-enforcement.ts:69-79`). Three places where that
diverges from how these tools actually behave:

- **`scalepad_quoter_quotes_publish`** makes a quote customer-visible.
  Publishing is not a status flag — it puts your pricing, margin
  structure, and product selection in front of the client. You can void
  the quote afterwards; you cannot unsee it, and a wrong number that has
  been seen becomes a commercial negotiation. Conduit classifies it
  `isWrite: true`, so it enforces at `write` alongside the deletes, which
  is the right neighbourhood by accident rather than by design. Review
  totals with `scalepad_quoter_quotes_get` first — a call that itself
  needs `admin`.
- **The three share-link tools are split across two tiers, backwards.**
  `scalepad_lm_deliverables_share_link_create` mints a link that exposes
  a client deliverable to whoever holds the URL; `_regenerate` silently
  breaks every link already distributed. Both are unclassified, so both
  require `admin` — higher than this document would ask for, but by
  fail-closed accident, not judgement. `_revoke` **is** classified, at
  `write`, making the cheapest of the three to reach the one that
  removes access someone is currently relying on.
- **`scalepad_cm_evidence_delete` and `scalepad_cm_documents_delete`**
  destroy compliance evidence. That is not an ordinary record delete:
  the artefact existed to prove a control was satisfied at a point in
  time, and an auditor asking for it later cannot be told it was tidied
  up by an agent. Conduit tiers them `write`, identical to
  `scalepad_lm_notes_delete`.

### Read-only is not the same as harmless

The tier model has no opinion about disclosure, and on this vendor that
gap is commercially sharp. `scalepad_quoter_items_get` and
`scalepad_quoter_items_list` return **cost**. Set against the sell price
on a quote line from `scalepad_quoter_quotes_get`, they yield **gross
margin per line, per customer** — the number an MSP least wants in a
transcript, a shared channel, or a customer-facing summary. Every tool
involved changes nothing and would be tier `read` on a vendor where
these were classified. `scalepad_lm_budget_*` and
`scalepad_lm_warranty_pricing_list` are the same shape against client
budgets and forecasts.

Nothing in a blast-radius model expresses this. If it matters, it has to
be a granular grant or a rule in the agent's own configuration.

## Recommended agent policy

The safe default is **read autonomously, propose writes, never
self-approve deletes** — but note that on this vendor "read
autonomously" currently costs an `admin` grant, so the default is
harder to implement here than the sentence suggests.

- Read tools: allow. Because Core and Backup Radar are read-only in
  their entirety, an agent restricted to those two domains is
  structurally incapable of changing anything — that is the right shape
  for asset reporting, warranty review, and backup sweeps. Implement it
  as a granular `customTools` allowlist rather than a tier, because a
  tier that admits those reads (`admin`) also admits every delete.
- Write tools: agent drafts the exact call, human approves, then it
  runs. Pay particular attention to `_create` calls in ControlMap; a
  fabricated control or risk pollutes a compliance record other people
  will later rely on.
- Delete tools: require a named human approver per invocation. Do not
  grant these to scheduled or unattended agents. Conduit cannot enforce
  this separation for you — a `write` grant already admits them, and an
  `admin` grant does too.
- Admin: there is no ScalePad tool Conduit marks `isAdmin`, so an
  `admin` grant here is not "the dangerous tools" — it is *every* tool,
  because everything unclassified lands there.

Do not read the approval steps above as something Conduit performs.
Conduit compares tiers. It has no approval step, no per-call
confirmation, and no interactive prompt. Per-call approval is a workflow
you impose on your agents, and it is only as good as the agent
configuration that carries it.

## What it cannot reach

- Only the ScalePad account mapped to the operator's gateway identity.
- No filesystem, no shell, no other vendor's data.
- **Only the products the account subscribes to.** Endpoints for
  unsubscribed products return HTTP 402 — a licensing boundary, not a
  permissions failure.
- **Only one data-residency region per call.** ControlMap partitions
  across `us`/`eu`/`ca`/`au` and Backup Radar across `us`/`eu`; Core and
  Lifecycle Manager are US-only. Records in another region are invisible,
  not absent.
- No live device state. ScalePad asset rows are lifecycle records synced
  from RMM and PSA integrations, not telemetry — the RMM is the source
  of truth for what a machine is doing right now.

## Data handling

- Responses pass through the gateway into model context for the session
  and are not persisted by this plugin.
- **End-customer PII.** `scalepad_core_contacts_*`,
  `scalepad_lm_contacts_*`, and `scalepad_quoter_contacts_*` return
  client contact names and email addresses.
  `scalepad_core_saas_users_*` is more sensitive still: it maps named
  individuals to the SaaS seats they hold, which is an employee-level
  inventory of a customer's staff and their tooling.
- **MSP staff PII.** `scalepad_core_members_*` and
  `scalepad_lm_active_users_list` return your own team's records.
- **Commercial data.** `scalepad_quoter_*` exposes cost, margin, and
  supplier pricing; `scalepad_lm_budget_*` and
  `scalepad_lm_warranty_pricing_list` expose client budgets and
  forecasts. Restrict these if agents post output into shared channels.
- **Signed URLs behave like credentials.**
  `scalepad_cm_documents_get_signed_url`,
  `scalepad_cm_reports_get_signed_url`,
  `scalepad_cm_action_items_generate_signed_urls`,
  `scalepad_cm_evidence_requests_signed_urls`, and the
  `scalepad_lm_*_pdf_get` / `_csv_get` exports return artefacts that
  grant access to anyone holding them for their lifetime. Treat a signed
  URL in a transcript the way you would treat a password in a
  transcript.
- **Compliance content is regulated content.** ControlMap holds risk
  registers, audit evidence, and policy documents. Its confidentiality
  obligations usually exceed those of the surrounding MSP tooling.

## Known sharp edges

- **402 is not an auth failure.** It means the account has no
  subscription for that product. An agent that retries with different
  credentials, or reports "authentication problem", sends the operator
  down the wrong path. Surface it as a licensing answer and stop.
- **A 404 on a known-good ID is usually the wrong region.** Verify
  `X-ScalePad-Region` before concluding a record was deleted — and
  before *re-creating* it, which is how duplicates get made.
- **Deletes are irreversible; attach/detach is not.** Detaching an asset
  from an initiative is a relationship change you can redo. `*_delete`
  removes the record. Prefer detach when the intent is "not this one".
- **Core IDs and Lifecycle Manager keys are different namespaces.** LM
  addresses hardware by opaque `hardware_key` and clients by
  `client_key`; these are not the Core asset and client IDs. Carrying an
  ID across domains fails, or worse, resolves to the wrong record.
- **One rate limit for everything: 50 requests per 5 seconds per key.**
  Every domain shares it, so a compliance sweep can throttle the quoting
  agent working alongside it. Honour `Retry-After`.
- **Two Quoter access paths.** The hosted ScalePad path is the default.
  The standalone `api.quoter.com` path uses separate OAuth client
  credentials — a second secret with its own rotation and its own blast
  radius. Only configure it if the tenant genuinely uses standalone
  Quoter.
