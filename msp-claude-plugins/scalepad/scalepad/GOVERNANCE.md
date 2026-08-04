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

## Tool permission tiers

The surface is roughly 400 tools across five domains, named
`scalepad_<domain>_<resource>_<action>` with domain prefixes `core`,
`lm`, `cm`, `br`, and `quoter`. Tiering by suffix is reliable; the named
exceptions below are not.

| Tier | What it can do | Tools |
|---|---|---|
| **Read** | Cannot change ScalePad state. Safe for autonomous agents. | Every `scalepad_core_*` tool (the whole domain is read-only) and every `scalepad_br_*` tool (likewise); across `lm`, `cm`, and `quoter`: `*_list`, `*_get`, `*_search`, `*_list_summaries`, `*_lookup`; plus `scalepad_status` and `scalepad_navigate` |
| **Write** | Creates or modifies records. Reversible, but often customer-visible. | `*_create`, `*_update`, `*_map` / `*_unmap`, `*_attach` / `*_detach`, `*_upload_document`, and the targeted field updates (`scalepad_lm_initiatives_status_update`, `scalepad_lm_goals_status_update`, `scalepad_lm_action_items_completion_status_update`, and similar) |
| **Destructive** | Destroys records, exposes client data outside the tenant, or commits commercially. Requires explicit human approval per call. | Every `*_delete` across `lm`, `cm`, and `quoter` — including `scalepad_cm_evidence_delete`, `scalepad_cm_documents_delete`, `scalepad_cm_policies_delete_section`, `scalepad_lm_initiatives_delete`, `scalepad_quoter_items_delete`; plus `scalepad_quoter_quotes_publish`, `scalepad_lm_deliverables_share_link_create`, `scalepad_lm_deliverables_share_link_regenerate`, `scalepad_lm_deliverables_share_link_revoke` |

Three of those destructive entries are not deletes, and the
classification is deliberate:

- **`scalepad_quoter_quotes_publish`** makes a quote customer-visible.
  Publishing is not a status flag — it puts your pricing, margin
  structure, and product selection in front of the client. You can void
  the quote afterwards; you cannot unsee it, and a wrong number that has
  been seen becomes a commercial negotiation. Review totals with
  `scalepad_quoter_quotes_get` first.
- **`scalepad_lm_deliverables_share_link_create`** mints a link that
  exposes a client deliverable to whoever holds the URL. It is a
  `create`, but its blast radius is data leaving the tenant boundary.
  `_regenerate` compounds this by silently breaking every link already
  distributed, and `_revoke` removes access someone is currently
  relying on — the template's own definition of destructive.
- **`scalepad_cm_evidence_delete` and `scalepad_cm_documents_delete`**
  destroy compliance evidence. That is not an ordinary record delete:
  the artefact existed to prove a control was satisfied at a point in
  time, and an auditor asking for it later cannot be told it was tidied
  up by an agent.

## Recommended agent policy

The safe default is **read autonomously, propose writes, never
self-approve destructive calls.**

- Read tools: allow. Because Core and Backup Radar are read-only in
  their entirety, an agent restricted to those two domains is
  structurally incapable of changing anything — that is the right shape
  for asset reporting, warranty review, and backup sweeps.
- Write tools: agent drafts the exact call, human approves, then it
  runs. Pay particular attention to `_create` calls in ControlMap; a
  fabricated control or risk pollutes a compliance record other people
  will later rely on.
- Destructive tools: require a named human approver per invocation. Do
  not grant these to scheduled or unattended agents.

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
