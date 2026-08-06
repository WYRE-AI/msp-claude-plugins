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
- The org's ScalePad credential is stored once at the gateway, so
  replacing it is one edit rather than a change on every technician's
  machine. There is no rotate action, though — you re-submit the connect
  form, which overwrites the stored credential in place, and nothing
  tracks its age or prompts you.

- Every call carries operator identity, so the gateway audit log answers
  "who published that quote" — ScalePad's own log records only the API
  account.
- Removing someone from the organisation clears their per-vendor grants
  and revokes their gateway refresh tokens at once; a user deactivated
  in your identity provider is refused on their very next request. A
  user only removed from the org keeps an already-issued access token
  for up to an hour, but it reaches only a personal ScalePad connection
  made with their own key — never the org's. See
  `wyre-gateway/GOVERNANCE.md`.

One credential, five products. A single ScalePad API key covers Core,
Lifecycle Manager, ControlMap, Backup Radar, and the hosted Quoter path.
There is no per-product key, so **you cannot grant an agent Core without
also granting it Quoter** at the credential layer. Separation has to come
from the tool tiers below, which is why they matter more here than for a
single-product vendor.

## Tool permission groups

The surface is **381 tools**: 24 Core, 193 Lifecycle Manager, 98
ControlMap, 3 Backup Radar, 61 Quoter, plus `scalepad_navigate` and
`scalepad_status`. They are named `scalepad_<domain>_<resource>_<action>`
with domain prefixes `core`, `lm`, `cm`, `br`, and `quoter`. Every one
is listed in [references/tool-inventory.md](references/tool-inventory.md).

Conduit classifies **all 381** in `VENDOR_TOOL_CONFIG`
(`src/proxy/result-cache.ts`): **177 read, 201 write, 3 admin**. That
matters because an unclassified tool fails closed to the top tier —
`const requiredTier: PermissionTier = classified ?? 'admin';`
(`src/access/access-enforcement.ts:63`) — so a partial block does not
degrade gracefully, it inverts. This one was partial until 2026-08-04:
it held 41 entries and every one was a delete, a revoke or a publish,
which meant `write` bought only the ability to destroy and `read` bought
nothing at all. **If a ScalePad grant on your org predates 2026-08-04,
re-check it** — an owner who needed asset reporting had no choice but
`admin` then, and that grant still says `admin` now.

The read/write split is derived from the container, not guessed from
names: scalepad-mcp attaches `{readOnlyHint: false, destructiveHint:
true}` to exactly its 202 mutating tools and nothing to its 179
read-only ones. Cross-checked against the resolved HTTP verb of every
tool — no mutating tool uses `GET`.

| Group | What it can do | Enforcement tier | Tools |
|---|---|---|---|
| **Read** | Cannot change ScalePad state. | `read` | 177 tools: every `scalepad_core_*` (the whole domain is read-only) and every `scalepad_br_*` (likewise); across `lm`, `cm`, and `quoter` the `*_list`, `*_get`, `*_search`, `*_list_summaries`, `*_lookup` family; the PDF/CSV/spreadsheet exports, including the three `scalepad_lm_roadmap_*_generate` tools, which POST but only render; plus `scalepad_status`. |
| **Write** | Creates or modifies records. Reversible, but often customer-visible. | `write` | 201 tools: `*_create`, `*_update`, `*_map` / `*_unmap`, `*_attach` / `*_detach`, `*_upload_document`, the targeted field updates (`scalepad_lm_initiatives_status_update`, `scalepad_lm_goals_status_update`, `scalepad_lm_action_items_completion_status_update`, …), the share-link mutators, and `scalepad_quoter_quotes_publish`. |
| **Delete** | Destroys records or revokes access someone is relying on. Presentation group in the access editor, **not** a tier of its own. | `write` | The 39 record-destroying tools — 18 Lifecycle Manager (`scalepad_lm_initiatives_delete`, `_goals_delete`, `_meetings_delete`, `_action_items_delete`, `_assessments_delete`, `_deliverables_delete` and its section/component/template siblings, `_contracts_delete`, `_notes_delete`), 12 ControlMap (`scalepad_cm_risks_delete`, `_controls_delete`, `_evidence_delete`, `_evidence_delete_schedule`, `_evidence_requests_delete`, `_documents_delete`, `_governance_delete`, `_policies_delete`, `_policies_delete_section`, `_procedures_delete`, `_assessments_delete_response`, `_action_items_delete`), 9 Quoter catalog — plus `scalepad_lm_deliverables_share_link_revoke`. |
| **Admin** | Mints a credential. | `admin` | Exactly three: `scalepad_quoter_auth_authorize`, `scalepad_quoter_auth_refresh`, `scalepad_lm_enrollment_tokens_create`. See [Credential-minting tools](#credential-minting-tools) below. |

### What that means when you actually set a grant

- **Tier `read` now works.** 176 of the 177 read tools are grantable
  and sufficient for asset reporting, warranty review, backup sweeps,
  and compliance posture reads. (`scalepad_navigate` is classified
  `read` but refused for every caller at stage 0 of both gates, as with
  every vendor's discovery tool — a container-side menu cannot know the
  caller's tier. Do not plan around it.)
- **Tier `write` subsumes `read` and adds all 201 mutators — including
  every delete.** Conduit's tiers are `read`, `write`, and `admin`
  (plus `none`, meaning deny) — `src/access/permission-tier.ts:27`.
  "Delete" is a presentation group in the access editor; a delete-group
  tool compiles to and enforces at tier `write`
  (`src/access/tier-group-mapping.ts`, `GROUP_ENFORCEMENT_TIER`).
  **There is no tier that admits creates and updates but withholds
  deletes.** If that separation matters, it has to be a granular
  per-tool grant, which compiles to an explicit `customTools`
  allowlist.
- **Tier `admin` is only three tools wider than `write`** — and all
  three mint credentials. Nothing routine needs it.
- **Do not use the HTTP verb as a proxy for "destroys a record."** 51
  tools issue `DELETE`, but 12 of them only sever a relationship —
  the `*_detach` family, `scalepad_cm_assessments_clear_answer`, and
  `scalepad_cm_assessments_unmap_question`. Those are reversible by
  re-attaching, and belong with Write. The 39 in the Delete row are the
  ones that remove the record itself.

### Where the mechanical tier and the author's judgement disagree

Conduit's model grades exactly one thing — can this call change vendor
state — and grades it by tool name, never by arguments
(`src/proxy/tool-call-enforcement.ts:69-79`). Three places where that
diverges from how these tools actually behave:

- **`scalepad_quoter_quotes_publish`** makes a quote customer-visible.
  Publishing is not a status flag — it puts your pricing, margin
  structure, and product selection in front of the client. You can void
  the quote afterwards; you cannot unsee it, and a wrong number that has
  been seen becomes a commercial negotiation. It sits at `write`
  alongside `scalepad_quoter_items_update`, which is not the same kind
  of act. Review totals with `scalepad_quoter_quotes_get` (tier `read`)
  before every publish.
- **The share-link hazard is a read, not a write.** There are four
  tools, not three: `scalepad_lm_deliverables_share_link_create` mints
  a link exposing a client deliverable to whoever holds the URL,
  `_regenerate` silently breaks every link already distributed, and
  `_revoke` removes access someone is currently relying on — all three
  are `write`, uniformly, so the old "cheapest to reach is the one that
  breaks things" inversion is gone. What remains is
  **`scalepad_lm_deliverables_share_link_get`, which returns the live
  URL and is tier `read`.** Minting the link is gated; *reading out the
  already-minted link* is not. A read-only agent summarising
  deliverables can therefore emit a working, unauthenticated URL into a
  transcript. Treat that tool as disclosure, not inventory.
- **`scalepad_cm_evidence_delete` and `scalepad_cm_documents_delete`**
  destroy compliance evidence. That is not an ordinary record delete:
  the artefact existed to prove a control was satisfied at a point in
  time, and an auditor asking for it later cannot be told it was tidied
  up by an agent. Conduit tiers them `write`, identical to
  `scalepad_lm_notes_delete`.

### Credential-minting tools

Three tools produce a credential. Two of them are the one place the
container's own read/write invariant under-reports risk, and are worth
understanding rather than trusting:

- **`scalepad_quoter_auth_authorize`** — `POST /v1/auth/oauth/authorize`
  against **`api.quoter.com`, a different host from every other tool in
  this plugin** — and through an HTTP client configured with *no* auth,
  because the credentials travel in the body. It exchanges OAuth client
  credentials for an `access_token` (1 hour TTL) **and a
  `refresh_token`**, and its `client_id` / `secret` arguments are
  optional: supply them and they **override the configured
  credentials**, so the tool will mint tokens for a Quoter tenant that
  has nothing to do with this connection.
- **`scalepad_quoter_auth_refresh`** — `POST /v1/auth/refresh`, same
  host. Exchanges a `refresh_token` for a fresh access/refresh pair,
  which extends possession indefinitely without ever re-presenting the
  client secret.
- **`scalepad_lm_enrollment_tokens_create`** — mints a SaaS-management
  enrollment token for a client, which grants device enrollment until
  it expires. Access-granting, so `admin` for the same reason.

**scalepad-mcp attaches no annotations to the first two** — the
container itself reports them read-only, because from its point of view
they read a token rather than writing a record. Deriving tiers from
annotations alone would have put credential minting behind a `read`
grant, so both are pinned `admin` by hand in `VENDOR_TOOL_CONFIG`, and
the tier model is now more conservative than the container's own
metadata. Two consequences worth carrying:

1. **Do not infer "safe" from an absent `destructiveHint`** on this
   vendor, or from `read` in the inventory, without checking these
   three by name.
2. **The minted tokens land in model context.** Their response bodies
   are bearer credentials for another system. Treat a transcript
   containing one the way you would treat a transcript containing a
   password — and note that the refresh token has no useful expiry.

The two Quoter tools are needed only if the tenant genuinely uses the
standalone `api.quoter.com` path — and even then the server exchanges
and refreshes the token itself on the calls that need it, so an agent
never has cause to invoke them directly. On the default ScalePad-hosted
path they are dead weight. `scalepad_lm_enrollment_tokens_create` is
needed only when someone is actively onboarding client devices into
SaaS management. For almost every deployment the correct grant is
`write`, which excludes all three.

### Read-only is not the same as harmless

The tier model has no opinion about disclosure, and on this vendor that
gap is commercially sharp. `scalepad_quoter_items_get` and
`scalepad_quoter_items_list` return **cost**. Set against the sell price
on a quote line from `scalepad_quoter_quotes_get`, they yield **gross
margin per line, per customer** — the number an MSP least wants in a
transcript, a shared channel, or a customer-facing summary. Every tool
involved changes nothing and is correctly tier `read`, which is exactly
the problem: a `read` grant is the one people hand out without thinking.
The nine `scalepad_lm_budget_*` tools and
`scalepad_lm_warranty_pricing_list` are the same shape against client
budgets and forecasts, and `scalepad_lm_deliverables_share_link_get`
(above) is the same shape against a live URL.

Nothing in a blast-radius model expresses this. If it matters, it has to
be a granular grant or a rule in the agent's own configuration.

### What is *not* a hazard here

Two absences worth stating, because they are the first things a review
looks for:

- **No arbitrary-request surface.** Zero tools declare
  `additionalProperties: true`, there is no `raw_request`,
  `execute_tool` or passthrough, and the SDK builds every URL from a
  hardcoded path template with the base URL from configuration — never
  from a tool argument. There is no call whose blast radius is chosen
  by argument rather than by name, which is the shape a tier check
  structurally cannot gate.
- **The 61 freeform `{type: "object"}` properties are bounded.** 43 of
  them are the `filter` object that maps to `filter[<key>]` query
  params. They are unvalidated body/query shaping, but each is pinned
  to one fixed endpoint, so they widen what a call *says*, not what it
  can *reach*.

## Recommended agent policy

The safe default is **read autonomously, propose writes, never
self-approve deletes**, and on this vendor the tier model now supports
the first two thirds of that directly.

- Read tools: allow, at tier `read`. Because Core and Backup Radar are
  read-only in their entirety, an agent restricted to those two domains
  is structurally incapable of changing anything — that is the right
  shape for asset reporting, warranty review, and backup sweeps. Add a
  disclosure rule for the margin, budget, and share-link reads called
  out above; the tier will not do it for you.
- Write tools: agent drafts the exact call, human approves, then it
  runs. Pay particular attention to `_create` calls in ControlMap; a
  fabricated control or risk pollutes a compliance record other people
  will later rely on.
- Delete tools: require a named human approver per invocation. Do not
  grant these to scheduled or unattended agents. Conduit cannot enforce
  this separation for you — `write` already admits them, and so does
  `admin`. A granular `customTools` allowlist is the only mechanism
  that admits creates and updates while withholding deletes.
- Admin: three tools, all credential minting, none of them needed for
  ordinary work. Grant `write` rather than `admin` unless the tenant
  genuinely runs standalone Quoter or issues SaaS enrollment tokens.

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
- **Signed URLs and share links behave like credentials.**
  `scalepad_cm_documents_get_signed_url`,
  `scalepad_cm_reports_get_signed_url`,
  `scalepad_cm_action_items_generate_signed_urls`,
  `scalepad_cm_evidence_requests_signed_urls`,
  `scalepad_lm_deliverables_share_link_get`, and the
  `scalepad_lm_*_pdf_get` / `_csv_get` exports return artefacts that
  grant access to anyone holding them for their lifetime. Treat a signed
  URL in a transcript the way you would treat a password in a
  transcript. Note that the first two and the share-link getter are
  tier `read` — a read-only agent can emit them.
- **OAuth tokens are returned into context.**
  `scalepad_quoter_auth_authorize` and `scalepad_quoter_auth_refresh`
  respond with an access token and a refresh token for
  `api.quoter.com`. The refresh token has no useful expiry. Both are
  tier `admin`; see [Credential-minting tools](#credential-minting-tools).
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
  radius, reachable through the only two tools in this plugin that talk
  to a host other than ScalePad. Only configure it if the tenant
  genuinely uses standalone Quoter, and see
  [Credential-minting tools](#credential-minting-tools) before granting
  them.
