# Changelog

All notable changes to the MSP Claude Plugin Marketplace will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed

- **ConnectWise + Meraki governance tier tables re-grounded in `VENDOR_TOOL_CONFIG` (4 of the 62).** First batch of the taxonomy-debt follow-up the template realignment left open. `connectwise-automate`, `connectwise-cpq`, `connectwise-psa` (directory `connectwise/manage`) and `meraki` all map to classified Conduit slugs, so their **Read / Write / Destructive** tables have been replaced with the four groups Conduit's access editor actually presents plus an explicit `Enforcement tier` column, and **every one of the 120 documented tools was joined against `VENDOR_TOOL_CONFIG` (`conduit/src/proxy/result-cache.ts`) rather than re-judged**. No drift: all four plugins' documented tool sets match the classification table exactly — 17 automate, 51 PSA, 25 CPQ, 27 Meraki. **All 8 per-call-approval promises were deleted** — one tier-table row and one policy bullet per file, each asserting that destructive tools "require explicit per-call human approval" as though Conduit enforced it, when Conduit has no approval step, no confirmation, and no elicitation and simply compares tiers — along with the 4 "never self-approve destructive calls" house-default lines that carried the retired taxonomy (12 lines in total). Replaced with the template's framing: per-call approval is a workflow the reader imposes on their agents, and it is only as good as the agent configuration that carries it. The risk commentary that made these documents worth reading is kept as prose, now reconciled against the tier that actually enforces: where an author called a tool destructive and Conduit enforces at `write`, both facts are stated. Each file now also states the consequence an owner is least likely to guess — that granting `write` admits every delete-group tool, and only a per-tool `customTools` allowlist separates them. **The moves a reviewer should question:** Meraki's four site-outage-capable config tools (firewall-ruleset replace, switch-port update, SSID update, device reboot) enforce at `write`, identical to a network rename; ConnectWise PSA's `cw_update_ticket` (the only route to closing a ticket) and `cw_create_time_entry` (bills the customer) enforce at `write` with **both** the Delete and Admin groups empty, so that vendor's whole access editor collapses to one read-or-write decision; CPQ's `cpq_update_quote` — the only route to `isSent`/`isAccepted`/`orderPorter*` — sits in plain Write, not even the Delete group; and Automate's `cwautomate_computers_reboot` (which accepts `force: true`) is `write` while its two script-execution siblings are correctly `admin`. Meraki is the one case where the empty Delete row is *protective*: `meraki_networks_delete` and `meraki_devices_remove` carry `isAdmin`, which outranks `isWrite` and lifts them out of the write-tier bucket the Delete group is drawn from — so a `write` grant on Meraki genuinely does not include its deletes. Meraki's admin row also now carries the general rule a guard test enforces fleet-wide: **every arbitrary-request passthrough is admin-pinned, because a tool whose blast radius is chosen by its arguments cannot be gated by its name** — `meraki_raw_request` is now `isWrite` **and** `isAdmin` (fixed in `conduit#1274`), closing the window in which a `write`-tier caller could issue arbitrary DELETEs around the admin pin on the two curated delete tools. Separately surfaced while joining the tables: **`cwautomate_navigate` and `meraki_navigate` are classified `read` but are unconditionally refused by Conduit** for every identity kind, owners and personal connections included (`src/proxy/discovery-tools.ts:48`, `src/proxy/tool-call-enforcement.ts:125`) — a tier-blind menu that advertises tools the caller may not call; `conduit__my_access` replaces them, and both files now say so. `connectwise-automate` → 1.2.2, `connectwise-cpq` → 1.1.3, `connectwise-psa` → 0.3.3, `meraki` → 0.1.4
- **Five RMM/monitoring `GOVERNANCE.md` files re-tiered against Conduit's real model** (`auvik`, `domotz`, `liongard`, `ninjaone-rmm`, `syncro-msp`). Each shipped a **Read / Write / Destructive** table, which matches neither Conduit's enforcement tiers (`read`/`write`/`admin`, `src/access/permission-tier.ts:27`) nor the four groups its access editor presents (`read`/`write`/`delete`/`admin`). All five now use the presented groups with an explicit `Enforcement tier` column, every tool re-derived from `VENDOR_TOOL_CONFIG` (`src/proxy/result-cache.ts`) under the documented convention `isAdmin → admin` (outranks), `isWrite → write`, neither → `read` (`src/access/tool-classification.ts:33-38`). **Nine per-call-approval promises removed** across the five files — four in Destructive tier-table rows (`domotz`, `liongard`, `ninjaone-rmm`, `syncro-msp`), five in policy bullets — because Conduit has no approval step, no confirmation, and no elicitation; it compares tiers. Approver language survives only in *Recommended agent policy*, and only where the file states outright that Conduit will not ask. Each file now states the consequence an owner is least likely to guess: granting `write` also grants every delete-group tool, and only a per-tool `customTools` allowlist separates them.

  **Tier moves a reader should notice.** *NinjaOne* — `ninjaone_devices_reboot` and `ninjaone_alerts_reset_all` were documented Destructive; both are `isWrite` with no `isAdmin`, so they enforce at **`write`**. NinjaOne's Admin group is empty, so no tier separates "update a ticket" from "reboot a customer's server" — only a granular allowlist can. *Liongard* — `liongard_detections_list`, `liongard_inventory_devices` and `liongard_inventory_identities` were documented Read but are **`admin`** (unbounded filter-DSL; their by-id siblings stay `read`); `liongard_inspections_run` was Write but is **`admin`**; `liongard_metrics_evaluate[_systems]` were argued Read but are **`write`**. `liongard_agents_delete` is `isWrite`+`isAdmin`, so it lands in the **Admin** group, not Delete — meaning a `write` grant on Liongard does *not* admit it. That is the exception, not the rule, and the file says so. *Domotz* — `domotz_power_outlet_control` (PDU on/off/cycle, cuts mains power to customer hardware) reaches `admin` only by the fail-closed default, not by classification; its name carries no verb token Conduit recognises, so it cannot be auto-seeded and needs an explicit `isAdmin` pin whenever this vendor is classified.

  **Documented tools absent from `VENDOR_TOOL_CONFIG`, which therefore enforce at `admin` by the fail-closed coercion** (`classified ?? 'admin'`, `src/access/access-enforcement.ts:63`): **Domotz 17 of 21** (only `navigate`/`status`/`agents_list`/`agents_get` are classified — including the outlet-control tool and the whole device/topology read surface); **Syncro 14 of 21** (every write except `syncro_tickets_add_comment`, including `syncro_invoices_create` and `syncro_invoices_email`, plus every `_get`/`_search` read); **Auvik 14 of 27** (including `auvik_raw_request`, `auvik_configurations_get`, all four `auvik_statistics_*`, and `auvik_alerts_dismiss`); **NinjaOne 1 of 25** (`ninjaone_alerts_get`). Liongard is the only fully-classified plugin of the five — 24 of 24. Consequence stated in each file: a `read`-tier agent is denied tools the Read group appears to permit, and classifying them would be a **privilege reduction**, not an addition.

  Also corrected in all five: `*_navigate` and `*_back` are refused for **every** caller at every tier, org owners included (`src/proxy/tool-call-enforcement.ts:125-130`, `src/proxy/discovery-tools.ts:41-50`), despite four of them being classified `read` — the files previously listed them as ordinary read tools. `auvik_raw_request` is admin *by the unclassified fallback*, not by Conduit's arbitrary-request passthrough guard (`src/access/tool-classification.test.ts`), which only inspects tools already in the table — same tier today, weaker guarantee. Auvik's file now also flags that its `.mcp.json` points at `mcp.wyre.ai`, not the Conduit endpoint every tier claim is derived from. Risk commentary preserved as prose throughout; where the mechanical tier disagrees with the author's blast-radius judgement, both are stated. Five plugins patch-bumped.

- **`wyre-gateway/GOVERNANCE.md` re-grounded in Conduit — #177 verified the wrong codebase.** The governance document for the broker itself (added at #177) was written against `wyre-technology/mcp-gateway`, which serves `mcp.wyre.ai`. The product the plugins actually target is **Conduit** (`wyre-technology/conduit`, `conduit.wyre.ai/v1/mcp`) — a separate repository that shares ancestry and has drifted. Every claim has been re-derived from Conduit's source, and the document now names which of #177's findings survived and which described only the older system. **What survived:** the crypto (AES-256-GCM, PBKDF2-SHA512 at 100k iterations over `MASTER_KEY ‖ scopeId`, per-row salt+IV), the deny-by-default outbound header set and the fact that operator identity is never forwarded upstream (`X-Gateway-S2S` attests a timestamp, not a user), the 1-hour stateless access token with no revocation path, `revokeAllUserTokens` still sitting at **zero callers**, no API-key rotation tooling, no master-key rotation, fire-and-forget audit writes, in-memory-per-replica rate limiting with no per-org cap, fail-open prompt-injection detection, name-only policy matching that dispatchers defeat, and "the vendor credential is the data boundary." **What was gateway-only:** the six-gate request path (Conduit's `enforceToolCall` runs a different, longer sequence with a discovery-tool suppression gate and a personal-credential short-circuit ahead of everything); "permission tiers are off by default" (`ACCESS_GRANT_ENFORCEMENT_ENABLED` is **ON** in conduit-prod and staging, and `deploy.yml` fails the deploy if it isn't); "tiers only cover classified tools" (Conduit **fails closed** — unclassified coerces to `admin`, so tiers cover everything); "personal connections get an unfiltered tool surface" (Conduit caps them at `credentials.access_tier`, max `write`, admin tools denied unconditionally); "allowlist denials are not logged" (Conduit logs *every* denial with a machine-readable `denial_reason`); "argument capture exists on the unified endpoint" (Conduit captures arguments **nowhere** — `shouldCapturePrompt()` returns `false` unconditionally by product decision); "the log is append-only by convention" (`admin_audit_log` is WORM-enforced by triggers plus a hash chain); "there is no user-disable state" (Conduit has `users.active`/`deactivated_at` — though nothing on the auth path reads them); and all seven gateway-native tools, none of which exist in Conduit. `auvik_raw_request`, `superops_custom_mutation`, and `sherweb_execute_tool` do not exist in Conduit either. **Newly documented and not in #177:** SCIM's `detachMembership` drops only `org_members`, unlike console removal which also clears `org_server_access`, the grant mirror, and team rows — so a SCIM-deprovisioned user who is re-provisioned silently regains unreviewed per-vendor grants; `revokeAllForOperator` revokes only reseller *impersonation* sessions and only for reseller-scope SCIM connections; and `meraki_raw_request` is classified `isWrite` without `isAdmin`, the only arbitrary-request passthrough in the table not pinned to `admin`. Also flags that this plugin's own `.mcp.json` — plus nine vendor plugins' — still points at `mcp.wyre.ai`, the system the document does *not* describe. `wyre-gateway` bumped to 1.4.0

- **`_templates/governance-template.md` realigned to Conduit's real tier model.** The template prescribed **Read / Write / Destructive**, which matches neither Conduit's enforcement tiers (`read`/`write`/`admin`, `src/access/permission-tier.ts:27`) nor the four groups its access editor presents (`read`/`write`/`delete`/`admin`). New documents now use the **presented** groups, because those are the buckets an owner actually clicks, with an explicit `Enforcement tier` column — and the load-bearing correction stated outright: **`delete` is presentation only; a delete-group tool enforces at `write`** (`src/access/tier-group-mapping.ts`, `GROUP_ENFORCEMENT_TIER`), so granting a technician `write` on a vendor also grants every delete tool on it. The template now also forbids the claim that destructive tools "require per-call approval" — Conduit has no approval step, no confirmation, and no elicitation; that is a workflow the reader imposes on their agents. Adds a verification instruction pointing contributors at `wyre-technology/conduit` and explicitly away from `mcp-gateway`.

- **The unclassified-vendor rule is now documented — it appeared nowhere before.** Conduit derives every tool's tier from `VENDOR_TOOL_CONFIG` (`src/proxy/result-cache.ts`) and fails closed: `const requiredTier: PermissionTier = classified ?? 'admin'` (`src/access/access-enforcement.ts:63`). That table classifies **35 vendor slugs**; Conduit can connect **98**. Of the marketplace's **64 vendor plugins, 34 map to a classified slug and 30 do not** — and for those 30, *every tool requires tier `admin`*, read tools included, no matter what the plugin's own tier table says. 28 of the 30 ship a `GOVERNANCE.md` whose Read/Write/Destructive table currently has no enforcement meaning at all. Surfaced as one table in `wyre-gateway/GOVERNANCE.md` plus a pointer in the template, rather than a line hand-edited into 30 files: the list is a snapshot of a single upstream table in a single file in another repository and moves whenever a vendor is classified, so 30 copies would be 30 places to drift. Two consequences called out for operators: a read-only agent cannot use an unclassified vendor *at all* without being granted `admin`, and classifying a vendor is therefore a **privilege reduction**, not an addition.

- **Anti-trigger routing is now reciprocal where the confusion genuinely runs both ways.** The 14-batch pass that added `## Anti-triggers` to 309 skills (#161–#174) had each batch owning disjoint plugin directories and forbidden from editing others, so every edge it wrote was one-directional: skill A routed the reader to skill B, but B rarely pointed back. Routing only worked if you happened to load the right skill first. Parsing every anti-trigger bullet into a directed graph found **1,397 edges, 837 of them asymmetric**. Reciprocity was applied selectively — **37 bullets across 32 skills, closing 62 asymmetric pairs (~7%)** — because most one-directional edges are correct: a specific skill routing *up* to a general one (`x-tickets` → `x-api-patterns`), a hub or overview skill routing *down* to its details, and a workflow pack routing *out* to the vendor API surface it consumes are all altitude hops, and mirroring them would make every vendor skill enumerate its consumers — exactly the boilerplate `_standards/skill-quality-checklist.md` bans. The reverse bullet was added only where two skills are **peers competing for the same question**: cross-vendor near-substitutes over the same entity (`autotask-tickets` ↔ the other five PSA/RMM ticket queues; `huntress-incidents` ↔ the uptime/paging/email-security objects that share the word "incident"; `huntress-agents` ↔ `halopsa-agents`, where one is a software sensor and the other a human technician), same-plugin siblings split at an arbitrary point (`huntress-incidents` ↔ `huntress-escalations`, `threatlocker-computers` ↔ `threatlocker-computer-groups`, `proofpoint-tap` ↔ `proofpoint-url-defense`), and the three cases where a vendor product *is* the packaged version of a cross-vendor workflow (`scalepad-backup-radar` ↔ `backup-pack` `backup-job-health`, `rootly-postmortems` ↔ `devops-pack-incident-postmortem`, `cipp-standards` ↔ `compliance-pack-standards-drift`). Where a destination already routed the same class of query outward at plugin granularity, no bullet was added. `huntress-escalations` and `timezest-appointment-types` gained the section outright — both were the target of sibling edges and had none. Reverse bullets that name several peers in one bullet (rather than one bullet per source) keep the fan-in destinations readable. 21 plugins patch-bumped.

  Also surfaced by the graph, and **left unedited** because this pass is additive-only: 14 anti-trigger bullets name a skill that does not exist — `quickbooks-*` (22 occurrences, the plugin is `quickbooks-online`), `shared-*` (15, the plugin is `shared-skills`), and `ninjaone-*` (12, the plugin is `ninjaone-rmm`) — plus 17 `connectwise-manage-*` references that resolve only via the plugin's directory name, not its marketplace name `connectwise-psa`. Two skills (`connectwise-psa-tickets`, `ninjaone-rmm-devices`) carry slug-style `name:` frontmatter that does not match their canonical plugin id, which is what makes some of those references appear to work. These want a separate rename/repair pass.

### Changed

- **All 341 skills restructured per the Claude 5 context-engineering guidance** ([blog post](https://claude.com/blog/the-new-rules-of-context-engineering-for-claude-5-generation-models)). Frontmatter deduplicated across every skill: `description` now states coverage only, `when_to_use` carries the trigger conditions and keyword list (all existing trigger keywords preserved — skill discovery depends on them). The 62 skills over 400 lines were split via progressive disclosure: SKILL.md keeps concepts, workflows, and gotchas (~350-line cap); exhaustive field tables, endpoint catalogs, error-code tables, and long request/response examples moved into 180 new linked `references/*.md` files (~20.7k lines moved, ~2.5k lines of generic filler and in-file duplicates removed — no domain knowledge deleted). Five skills that were missing `name:` frontmatter (halopsa agents/invoices; autotask billing/picklists/ticket-notes-attachments) got it added, and `halopsa-tickets` was normalized to the `"[Vendor] [Topic]"` name convention. The skill template, `_standards/skill-quality-checklist.md` (which still demanded the long-banned `triggers:` array), CONTRIBUTING.md, and the contributor LLM prompts now encode the new rules for future skills. All 72 touched plugins patch-bumped. Marketplace version bumped to 1.25.0
- **Docs site: "Get Started" / "Sign up" CTAs now route to Conduit's 14-day trial, not gateway signup.** Gateway signups are turned off (see `wyre-technology/mcp-gateway` #358); new customers start on Conduit (`conduit.wyre.ai/signup`, which provisions the trial automatically). The landing page and pricing page plan CTAs now point at a single `signupUrl` const (env `CONDUIT_SIGNUP_URL`, default `https://conduit.wyre.ai/signup`); the landing hero's "Use the Gateway" CTA becomes "Start free trial". The Header **"Sign in"** buttons still point at `mcp.wyre.ai` for existing customers, and Enterprise still contacts sales — only the new-account CTAs moved.
- **Docs site: all gateway usage-credit content removed — the gateway is now all-you-can-eat on every plan.** Mirrors the credit-system removal in `wyre-technology/mcp-gateway` (PR #351). Pricing page + landing page plan cards drop `2,000/4,000 credits/seat/month` and `Custom credit packages` in favor of `Unlimited tool calls` / `Custom rate limits`; the PricingMatrix "Credits / month" row becomes "Tool calls: Unlimited" and its "1 credit = 1 successful vendor tool call" footnote now explains rate limits instead; the "What's a credit?" and "What happens when I run out of credits?" FAQs are replaced by an "Are tool calls really unlimited?" FAQ. Billing guides updated: plan comparison drops the credits row and the credit-limit section, plan-changes drops credit-allowance language (Stripe *proration* credit language is untouched — different meaning), refunds drops the partially-consumed-credit-blocks clause. The **Gateway Usage & Anomaly Auditor** advanced workflow is reworked: `get_credit_balance` no longer exists on the gateway, so the build/routine prompts now use only `get_admin_metrics`, `get_usage_summary`, and `list_connections` (steps renumbered, self-attribution note now says three calls, credit-runway analysis/delivery sections and the low-runway-alert extension removed). Warmly's "credit balance" plugin copy is untouched — that's Warmly's own API credits, not gateway credits.

### Removed

- **`wyre-site-editor`** — removed from this public marketplace (Aaron-directed, 2026-07-14): it's an internal-only plugin (Angela's conversational editor for the wyre.ai website), and was public in error for ~8.5 hours (added at #140, 13:04Z same day). No secrets/credentials were exposed — the plugin only contained skill docs, workflow instructions, and internal-process names (repo name, Cloudflare Pages project slug, a GitHub handle). Migrated intact to the new private `WYRE-AI/wyre-ai-plugins` marketplace; install now requires access to that repo. Marketplace version bumped to 1.20.0

### Added

- **`wyre-gateway/GOVERNANCE.md` — the governance document for the broker itself.** The #161–#174 pass added a per-vendor `GOVERNANCE.md` to 62 plugins, each of which asserts that authentication is brokered centrally at the gateway: no local secrets, one-place rotation, per-operator audit identity, revocation that revokes. `wyre-gateway` was excluded from that pass for having no skills — but it is the plugin those 62 documents point *at*, so it needed the one document that substantiates the claim rather than repeating it. Written against the `mcp-gateway` source (not its marketing), and it **corrects the shared claim where the code does not support it**: rotation is genuine for the 10 OAuth vendors but has no rotate action for key-based ones; "revocation is immediate" holds for org credentials (membership, per-vendor grants, and credential rows are re-read from the database on every request, with no cache in front) but not as an unqualified statement — the issued access token is a stateless JWT valid for up to an hour, refresh tokens last 30 days and no offboarding path revokes them (`revokeAllUserTokens` exists with zero callers), and personal connections resolve *before* any membership check, so removing someone from the org does not touch them. Also states plainly that the template's "the gateway enforces these tiers" is not yet accurate: what the gateway enforces is the per-`(org, vendor, role)` tool allowlist, which is opt-in and defaults to allow-all (and which org owners and personal-credential callers bypass), while `GATEWAY_PERMISSION_TIERS` is off by default; and that the vendor credential — not the gateway — is the tenant data boundary. Documents the gateway's own 7 tools tiered by blast radius, adding a **cross-tenant disclosure** tier the vendor template has no slot for (`get_admin_metrics` changes nothing and reads across every tenant on the platform; it is Wyre-staff-only and not reachable by an MSP's own owners). Records two classes of vendor-side control as advisory-only for a gateway client, with the verified instances behind them: MCP annotations are metadata, not gates (six `meraki-mcp` tools carry `destructiveHint: true` while their handlers call `guardWrite({ destructive: false })`, so no confirmation is required), and elicitation-based confirmations degrade to consent for non-interactive callers (`connectwise-cpq-mcp` treats `unavailable` as approval, and the gateway declares no elicitation capability). Fixes for both are in flight; the class outlives them. Finally, a policy rule for tools with no fixed blast radius — `autotask_execute_tool`, `sherweb_execute_tool`, `autotask_raw_request`, `meraki_raw_request`, `auvik_raw_request`, `superops_custom_mutation` — since the allowlist matches tool *names* and never inspects arguments, allowlisting a dispatcher grants everything it can dispatch, including the tools deliberately left out of that same allowlist. (`autotask_router` and `sherweb_router` only return suggestions and execute nothing; their existing read-tier classification is correct.) `wyre-gateway` bumped to 1.3.0

- **`scripts/tool-drift-audit.mjs` + `scripts/probe-mcp-tools.mjs`** — a fleet-wide checker for the failure this repo had no way to catch: a skill documenting an MCP tool name its shipped server does not register, so an agent following the skill calls a tool that doesn't exist. `probe-mcp-tools.mjs` spawns each `<vendor>-mcp/dist/index.js` over stdio and captures a real `tools/list`; `tool-drift-audit.mjs` diffs that against every backtick-quoted tool name in a plugin's `skills/**/SKILL.md`, `references/`, `agents/`, `commands/`, `README.md` and `GOVERNANCE.md`, and exits 1 on drift so it can gate CI. Ground truth is the union of four sources because no single one is sufficient: the runtime probe is authoritative but under-reports the 12 progressive-disclosure servers that hide their surface behind a `*_navigate` call (`pax8-mcp` advertises exactly `pax8_navigate` at init); the static `src/` scan recovers that surface but misses generated registries (`qbo-mcp`, `scalepad-mcp`); `mcp-gateway/schemas/<vendor>.json` covers 12 vendors pinned to prod image digests; and a `--live` JSON carries tool names observed on the live gateway, which is the only source that resolved `sentinelone`. Hosted vendors are handled by reading `vendor-config.ts` `containerUrl` — where that points at a vendor host the local repo is ignored entirely, which is how the rootly and pax8 determinations in #178 were reached. Deliberately **not** wired into `validate.yml`: it needs the sibling `*-mcp` checkouts, which CI does not have. Wiring it up means either a multi-repo checkout job or a committed ground-truth snapshot — a follow-up, tracked in #178. First run reported 18 drifted plugins / 34 clean / 12 unverified.

- **`## Anti-triggers` section and a per-plugin `GOVERNANCE.md` contract.** Follow-on to the #158 restructure, which left skill routing one-directional: `when_to_use` routes work *into* a skill, but nothing routed it back out. Across 345 skills the common failure is not a wild mismatch but a near-miss sibling — Huntress `signals` vs `incidents` vs `escalations` all match "huntress security event", and "incident" alone names three different objects in this marketplace (a PagerDuty/Rootly service incident, a Huntress/SentinelOne security incident, and a PSA ticket typed `Incident`). The skill template and `_standards/skill-quality-checklist.md` now define an optional `## Anti-triggers` section placed immediately after the overview, where every bullet must name the destination skill to load instead. **Deliberately optional**: the checklist already requires that sections holding only boilerplate be omitted, so a bullet that merely negates `when_to_use` is filler and is cut — hit rates across the fleet ranged from 40% (huntress) to 97% (workflow packs) depending on how much vocabulary a plugin genuinely shares with its neighbours. Separately, `_templates/governance-template.md` adds a per-plugin `GOVERNANCE.md`: what the plugin authenticates as, its tools grouped by **blast radius rather than HTTP verb**, and a recommended agent policy (read autonomously, propose writes, never self-approve destructive calls), written for an MSP owner deciding what to let an agent do against a live production tenant. Because authentication is brokered centrally at the Conduit gateway rather than held per-technician, these documents cover tool permission tiers and what central brokering buys (no local secrets, one-place rotation, per-operator audit identity, revocation that actually revokes) instead of local secret handling. Worked exemplar shipped on `huntress`, including the classification of `huntress_incidents_bulk_approve` as destructive — approving a SOC remediation instructs Huntress to act on a customer endpoint, so it is not the bookkeeping change its verb implies. `huntress` bumped to 0.3.0

- **`connectwise-cpq`** (`connectwise/cpq/`) — ConnectWise CPQ, formerly ConnectWise Sell, originally Quosal: the quoting/proposal tool in the ConnectWise stack, joining `connectwise-psa` and `connectwise-automate` under the ConnectWise vendor. Backed by the `connectwise-cpq-mcp` sidecar (gateway slug `connectwise-cpq`, category `sales`) and its flat 25-tool `cpq_*` surface. 3 skills (`api-patterns`, `quotes`, `quote-items`, two with linked `references/`) and 4 commands (`/search-quotes`, `/get-quote`, `/create-quote`, `/list-templates`). The skills carry the non-obvious parts of this API: three-part Basic auth built as `base64(accessKey+publicKey:privateKey)` with the access key read out of the Sell URL and **no `clientId`** (unlike every other ConnectWise API), the `application/json; version=1.0` content type, RFC 6902 JSON Patch — not merge-patch — on every update, Manage-style `conditions` strings with bracketed date-only literals and `True`/`False` booleans, `page`/`pageSize` paging over bare arrays with no total count, and `includeFields` as the practical defense against 204/224-property views. Two structural constraints get called out repeatedly because they reshape the workflow: **there is no create-from-scratch endpoint** (every quote is a copy of a template or an existing quote via `POST /api/quotes/copyById/{id}`, then patched), and **there is no product catalog, opportunity, attachment, publish/deliver, order-porting, or webhook surface** — those live in the CPQ web app or the attached PSA, so the skills route the reader to `connectwise-psa` rather than inventing tools. No per-plugin `.mcp.json` (gateway connection is `wyre-gateway`'s job). Marketplace version bumped to 1.26.0

- **`clio`** (`clio/clio/`) — the first entry in a new **legal** vertical for this marketplace (every other plugin here is MSP/IT tooling). Vendor-shaped, single-plugin depth matching plugins like `halopsa`/`ncentral`: 4 skills (`api-patterns`, `matters`, `contacts`, `time-billing`) and 4 commands (`/search-matters`, `/matter-summary`, `/log-time`, `/search-contacts`). Connects via OAuth 2.0 Authorization Code through Conduit's `/connect/clio` flow — no API key. Deliberately conservative v1 tool surface reflecting Clio's privileged attorney-client data: no delete tool on any entity, documents are read-only/metadata-only (no file content), and communications/calendar/bills are read-only; only `matters`, `contacts`, and `activities` (time/expense entries — create only) support writes. The optional Clio Region field (US/CA/EU/AU) only selects the regional API host — it does not yet guarantee the OAuth flow works correctly for non-US regions, stated plainly as a known v1 limitation rather than glossed over. New `legal` marketplace category. Marketplace version bumped to 1.23.0
- **Industry workflow packs** — cross-vendor, job-shaped plugins (as distinct from the existing vendor-shaped catalog): `ops-pack` (MSP Operations — board health, dispatch prioritization, SLA monitoring, shift handoffs), `secops-pack` (Security Operations — alert severity normalization, containment playbooks, BEC response, incident timelines), `finance-pack` (Finance & Billing — agreement reconciliation, license true-up, margin analysis), and `compliance-pack` (Compliance — evidence mapping, standards drift, cyber-insurance questionnaires). Each ships 3 skills, 3 agents, and 3 commands, wired to Conduit (`https://conduit.wyre.ai/v1/mcp`) rather than a per-vendor MCP server — packs compose whatever PSA/RMM/security/accounting tools an org has connected via `conduit__search_tools` discovery, and degrade explicitly (not silently) when a relevant vendor family isn't connected. New `workflow-pack` marketplace category. Marketplace version bumped to 1.16.0
- **`sales-pack`** (Sales & Deal Desk) — a fifth industry workflow pack, added to the same initiative: the sales motion end to end (pipeline health, quote-to-close tracking, proposal follow-up, warm-lead routing) across whatever CRM, proposal, distribution, and scheduling tools are connected (HubSpot, PandaDoc, Pax8/Sherweb, Calendly, Warmly, SalesBuildr/Kaseya Quote Manager). Same shape as its siblings: 3 skills (`pipeline-health`, `quote-to-close-tracking`, `warm-lead-routing`), 3 agents (`pipeline-auditor`, `proposal-follow-up-tracker`, `warm-lead-router`), 3 commands (`/sales-pack:pipeline-pulse`, `/sales-pack:stalled-deals`, `/sales-pack:warm-leads`). Distinct from `finance-pack` (billing/reconciliation *after* the sale) and complementary to — not duplicative of — the existing `hubspot` vendor plugin's HubSpot-only `pipeline-health-reporter` agent and `wyre-gateway`'s `renewal-risk-analyzer` (existing-client churn risk, not new-deal pipeline); see the pack README for the full comparison. Marketplace version bumped to 1.17.0
- **`devops-pack`** (DevOps & Reliability) — a sixth industry workflow pack, targeting MSPs that also build/ship software (their own SaaS, or a dev-shop client's) rather than pure break/fix IT: `oncall-handoff` (shift handoff structure — what's paging, escalated-without-owner, known-flaky alerts), `incident-postmortem` (blameless postmortem timeline reconstruction correlating incident-tool events with observability and deploy history, root cause vs. contributing factors), and `error-budget-tracking` (SLO burn-rate math with graceful fallback to raw error-rate/uptime trend reporting when no formal SLO is defined). 3 skills, 3 agents (`oncall-handoff-builder`, `postmortem-drafter`, `reliability-scorecard`), 3 commands. Wired to whatever incident-management (Rootly, PagerDuty, BetterStack) and observability (Sentry, Datadog, Grafana) tools are connected via `conduit__search_tools` discovery — deliberately scoped to engineering/platform reliability, distinct from `secops-pack`'s client-facing security-threat response. Marketplace version bumped to 1.18.0
- **`cloudops-pack`** (Cloud & Network Infrastructure) — a seventh industry workflow pack, added to the same initiative: the infrastructure substrate itself (is the network healthy, is capacity adequate, is cloud spend under control) across whatever network-monitoring tools (Auvik, Meraki, Domotz) and cloud platforms (Azure via Azure MCP, DigitalOcean) are connected. 3 skills (`network-health-sweep` — normalizes Auvik's device/interface model, Meraki's dashboard-org/network model, and Domotz's agent-based collector model into one health view; `cloud-capacity-planning` — right-sizing and growth-trend forecasting with an explicit genuine-risk-vs-normal-variance discipline; `cloud-cost-management` — spend-anomaly detection and orphaned/idle resource discovery), 3 agents (`network-health-auditor`, `capacity-forecaster`, `cost-anomaly-detector`), 3 commands (`/cloudops-pack:network-sweep`, `/cloudops-pack:capacity-check [resource_type]`, `/cloudops-pack:cost-report [window]`). Distinct from `ops-pack` (service-desk/ticket focus, not infrastructure) and from `devops-pack` (application-layer incident/deploy/SLO reliability, not the network/cloud substrate underneath it) — see the pack README's Boundary section for the full comparison. Marketplace version bumped to 1.19.0
- **`awareness-pack`** (Security Awareness & Training) — an eighth industry workflow pack, added to the same initiative: the human/culture layer of security — training completion tracking, phishing simulation results, and per-user/per-org human risk scoring — across whatever security-awareness and training tools are connected (KnowBe4 as the primary training/phishing-simulation platform; Proofpoint and Checkpoint Avanan as optional secondary sources of real-world phishing-click data where connected). 3 skills (`training-completion-tracking` — overdue-training detection, per-org completion rates, cadence-compliance flagging; `phishing-simulation-analysis` — click-rate trends, repeat-clicker identification, optional correlation with real-world incidents; `risk-scoring` — a simple, explainable per-user/per-org human risk score with graceful degradation when simulation data isn't available), 3 agents (`training-compliance-auditor`, `phishing-simulation-analyst`, `human-risk-scorer`), 3 commands (`/awareness-pack:training-status [client]`, `/awareness-pack:phishing-results [window]`, `/awareness-pack:risk-report [client]`). Distinct from `secops-pack` (technical threat response — EDR/MDR/SIEM, containment, BEC response *after* an incident) — `awareness-pack` is prevention through training and culture, not incident response; see the pack README's boundary section for the worked example. Marketplace version bumped to 1.20.1
- **`backup-pack`** (Backup & DR Assurance) — a ninth industry workflow pack, added to the same initiative: backup job health monitoring, restore-test verification, retention/RPO compliance, and DR readiness across whatever backup/BCDR tools (Datto BCDR, Datto SaaS Protection, Spanning, Unitrends) are connected. 3 skills (`backup-job-health` — success/failure/missed-backup detection and storage trending, normalizing image-based appliance backup and SaaS-data snapshot backup into one comparable view; `restore-test-verification` — a ranked restore-evidence hierarchy and data-criticality-tiered testing cadence, distinguishing "backed up" from "recoverable"; `retention-rpo-compliance` — contracted-vs-configured retention math and achievable-RPO calculation from actual job cadence), 3 agents (`backup-health-auditor`, `restore-readiness-checker`, `retention-compliance-auditor`), 3 commands (`/backup-pack:backup-status`, `/backup-pack:restore-check [client]`, `/backup-pack:retention-audit [client]`). Explicitly complementary to — not duplicative of — `wyre-gateway`'s `dr-readiness-auditor` (a one-shot, periodic composite DR-readiness score) and the single-vendor `kaseya/datto-bcdr`, `kaseya/datto-saas-protection`, `kaseya/spanning`, and `kaseya/unitrends` API-reference plugins; see the pack README for the full comparison. Marketplace version bumped to 1.21.0
- **`assets-pack`** (IT Asset Lifecycle) — a tenth industry workflow pack, added to the same initiative: physical/endpoint hardware lifecycle management (warranty tracking, EOL/EOS flagging, refresh-cycle planning) across whatever RMM platforms (Datto RMM, NinjaOne, N-central, Kaseya VSA, ConnectWise Automate, Atera, SuperOps, Syncro, Action1, ImmyBot) are connected, with IT Glue/Hudu as an optional warranty-data fallback. 3 skills (`warranty-tracking` — normalizes warranty-data reliability across RMMs (OEM-resolved vs. manually-maintained vs. missing) and cross-references documentation platforms for gaps; `eol-eos-flagging` — combines live device/OS inventory with general EOL/EOS knowledge (always caveated for vendor-lifecycle-page verification) and prioritizes by device criticality; `refresh-cycle-planning` — combines warranty + EOL/EOS + device age into replace-now/plan-this-year/monitor tiers laid out on a forward calendar), 3 agents (`warranty-status-auditor`, `eol-risk-assessor`, `refresh-planner`), 3 commands (`/assets-pack:warranty-status [client]`, `/assets-pack:eol-report [client]`, `/assets-pack:refresh-calendar [window]`). Distinct from `cloudops-pack` (network/cloud infrastructure operational health, not endpoint hardware lifecycle — see the pack README's Boundary section for the full comparison, including how the two packs can both legitimately report on the same physical device for different reasons) and from `ops-pack` (service-desk/ticket operations, not asset inventory). Does not duplicate single-vendor RMM lifecycle primitives (e.g. N-central's `ncentral_get_device_lifecycle`/`ncentral_update_device_lifecycle`) — normalizes and acts across whichever RMM(s) an org has connected instead. Marketplace version bumped to 1.22.0
- CI: new `Validate` workflow — root `claude plugin validate .` (hard fail), a per-plugin `claude plugin validate` loop (advisory until the repo-wide agent-frontmatter cleanup lands), and `scripts/check-marketplace-drift.mjs` enforcing entry-name === plugin.json-name, no per-entry `version` fields, no unrecognized fields, and a version bump gate: PRs that change files under a plugin directory fail unless that plugin's `plugin.json` version was bumped (plugin updates only reach installed users on a version-string change)

### Changed

- `marketplace.json` aligned with the official Claude Code marketplace schema: `$schema` now points at the real SchemaStore `claude-code-marketplace` schema; `owner` is the org identity (WYRE Technology); per-entry `version` fields removed — `plugin.json` is the sole version authority (entry versions were silently ignored at install time and had drifted on sherweb, blackpoint, immybot, timezest, threatlocker, wyre-gateway); the unrecognized `mcpRepo` field moved to `repository` (cipp, freshdesk, inforcer). Marketplace version bumped to 1.14.0
- Plugin manifest names aligned to their public marketplace entry names (the entry name is what `/plugin install`, `enabledPlugins` keys, and skill namespacing use): `kaseya-autotask` → `autotask` (0.4.2), `kaseya-datto-rmm` → `datto-rmm` (1.1.2), `kaseya-it-glue` → `it-glue` (1.1.2), `kaseya-rocketcyber` → `rocketcyber` (0.2.2), `superops-ai` → `superops` (0.2.2), `syncro-msp` → `syncro` (0.2.2)
- `wyre-gateway` plugin manifest: name is now kebab-case `wyre-gateway` (the validator rejects names with spaces, as does claude.ai marketplace sync), human label moved to `displayName` ("Wyre MSP Gateway"), unrecognized `icon` field dropped (1.2.1)
- README: replaced the nonexistent `/plugin marketplace add … --plugin <name>` examples with the real two-step flow (`/plugin marketplace add wyre-technology/msp-claude-plugins`, then `/plugin install <name>@msp-claude-plugins`)

### Fixed

- `kaseya-quote-manager` (1.0.1) and `salesbuildr` (1.1.2) manifests declared `author` as a string; the plugin schema requires an object — `claude plugin validate` errored on both

### Added

- Docs: **findability pass for connections, security & anchor links** — the docs site now surfaces its two most-requested destinations in the primary nav. The top nav and footer link to the Security Architecture page (previously reachable only from the desktop sidebar), and the plugin catalog is promoted as a top-nav **Connections** entry with new homepage CTAs ("Read our security model", "Browse all connections"). Every docs-page heading now gets an auto-generated, copyable `#` anchor via a single shared `DocsLayout` script — existing hand-authored anchors (e.g. `#supported-vendors`) are preserved — so any section is deep-linkable. The drifting hand-maintained gateway vendor table is collapsed into a link to the canonical auto-generated catalog
- Docs: **Advanced Workflows batch 3** — three more scheduled-routine guides, all grounded against live gateway connectors: **IT Glue Documentation Auditor** (monthly documentation completeness/freshness debt report), **M365 Identity Auditor** (monthly per-tenant MFA/conditional-access/admin-exposure posture via CIPP — distinct from the Compliance Drift Reporter's standards-drift view), and **Gateway Usage & Anomaly Auditor** (weekly meta-routine that audits the WYRE MCP Gateway's own usage, connection health, and credit consumption). Agent → Routine Catalog rows annotated
- Docs: **Advanced Workflows batch 2** — seven new scheduled-routine guides picked from the Agent → Routine Catalog backlog, spanning connectors not covered by batch 1: **Contract Renewal Tracker** (Autotask — weekly expiring-contract/MRR-at-risk pipeline), **Service Desk SLA Triage** (HaloPSA — hourly SLA-breach triage, idempotent via a per-ticket triage note), **Cash Flow Analyzer** (QuickBooks Online — weekly cash-position + aged-receivables digest, with Xero documented as a connector swap), **Client Profitability Reporter** (QuickBooks Online — monthly revenue-ranked client report with company net-margin context; true cost-allocated margin lives in the `service-profitability-auditor` portfolio agent), **Pax8 Renewal & License Optimizer** (weekly Pax8 renewal calendar + over-provisioning reclaim digest), **Sales Pipeline Pulse** (weekly HubSpot pipeline value + stalled-deal flagging), and **Pending-Proposal Tracker** (weekly PandaDoc aging + expiry digest). The Agent → Routine Catalog rows for all of these are annotated accordingly
- `wyre-gateway` portfolio plugin: **12 new multi-vendor portfolio agents** (v1.1.1 → 1.2.0), each a single-prompt workflow spanning five to ten connected systems: `offboarding-orchestrator`, `user-lifecycle-orchestrator`, `asset-reconciliation-auditor`, `license-true-up-reconciler`, `service-profitability-auditor`, `portfolio-threat-sweep`, `vulnerability-remediation-prioritizer`, `change-drift-sentinel`, `dr-readiness-auditor`, `book-of-business-pulse`, `ticket-deflection-analyzer`, and `client-discovery-agent` (an on-demand cross-system onboarding discovery sweep — deliberately a subagent, not a scheduled routine, since discovery is event-triggered per new client and human-in-the-loop). Marketplace version bumped to 1.8.0
- Kaseya Quote Manager plugin (sales): read-only access to Kaseya Quote Manager (Datto Commerce). 3 skills (api-patterns, quotes, purchasing) + 3 commands (list-quotes, get-quote, get-sales-order). Tools follow `kqm_<entity>_list` / `kqm_<entity>_get` across sales, procurement, catalog, CRM, and org domains. Marketplace version bumped to 1.7.0
- Docs: new **Advanced Workflows** section in the gateway docs, with its first guide — the Autotask Ticket Triage Agent (a Claude-managed scheduled agent that classifies new Autotask tickets by priority, advances them to In Progress, and notifies Slack)
- Docs: **Advanced Workflows batch 1** — six new workflow guides, each a Claude-managed scheduled routine built and verified against WYRE's MCP Gateway: Patch Drift Reporter (Datto RMM), Device Health Auditor (Datto RMM), M365 License Auditor (CIPP), Compliance Drift Reporter (Liongard), Billing Reconciler (QuickBooks Online), and QBR Prep (Autotask + Datto RMM + CIPP + Liongard + IT Glue). Plus a **Delivery Adapters** reference (how a routine delivers its report — Slack, IT Glue — and the adapter contract for new targets) and an **Agent → Routine Catalog** classifying every marketplace subagent by routine-fitness archetype
- Subagent coverage for four previously thin plugins, bringing them to parity with the strongest sibling plugins. All content grounded in the real MCP server tool surface:
  - `timezest`: +3 subagents (scheduling-dispatcher, psa-integration-specialist, booking-pipeline-auditor), +4 skills, +4 commands → 6 skills / 3 agents / 5 commands (v1.1.0)
  - `immybot`: +3 subagents (software-deployment-orchestrator, endpoint-remediation-specialist, compliance-auditor), +4 skills, +5 commands → 6 skills / 3 agents / 6 commands (v1.1.0)
  - `blackpoint`: +3 subagents (detection-investigator, alert-response-coordinator, exposure-analyst), +3 skills, +4 commands → 5 skills / 3 agents / 5 commands (v1.1.0)
  - `sherweb`: +3 subagents (subscription-provisioner, billing-reconciler, customer-account-auditor) → 4 skills / 3 agents / 4 commands (v0.3.0)

### Changed

- Docs: the **Compliance Drift Reporter** Advanced Workflow now also reports CIPP baseline drift (assigned Standards) and tenant delegated-access health, alongside the existing Liongard configuration-change detections

### Fixed

- `cipp` plugin docs pointed `CIPP_BASE_URL` at the Static Web App / custom-domain UI URL (`https://cipp.yourdomain.com`). The SWA redirects bearer-token requests to its interactive login page, so API calls fail. The README setup steps and `.env.example` now use the CIPP-API Azure Function App URL (`https://<function-app-name>.azurewebsites.net`) and explain the distinction
- Gateway URL drift: flipped `blackpoint`, `crewhu`, `immybot`, `timezest`, `threatlocker` plugin READMEs and `.mcp.json` files from `mcp.wyretechnology.com` to canonical `mcp.wyre.ai` (closes #73)

### Added

- Checkpoint Avanan plugin (email-security): 5 skills + 5 commands for quarantine, threats, policies, incidents, API patterns
- Proofpoint plugin (email-security): 7 skills + 6 commands for TAP, quarantine, threat intel, forensics, people/VAP, URL defense, API patterns
- KnowBe4 plugin (email-security): 5 skills + 5 commands for phishing simulation, training, users, reporting, API patterns
- Sherweb plugin (marketplace): 4 skills + 4 commands for billing, customers, subscriptions, API patterns
- New `email-security` plugin category in marketplace.json

#### Kaseya Portfolio Expansion — 6 New Plugin Scaffolds (`kaseya/`)
- **kaseya-vsa** (`kaseya/kaseya-vsa/`) — RMM. API patterns skill covers two-step token auth, Kaseya One SSO bridging, OData pagination, response envelope semantics
- **datto-bcdr** (`kaseya/datto-bcdr/`) — Backup/DR. API patterns skill covers HMAC-SHA256 request signing, screenshot verification retrieval, recovery point queries
- **kaseya-bms** (`kaseya/kaseya-bms/`) — PSA. API patterns skill covers tenant subdomain routing, API token vs Kaseya One JWT, ticket workflow gotchas
- **datto-saas-protection** (`kaseya/datto-saas-protection/`) — SaaS backup (M365 / Google Workspace). API patterns skill covers region selection (US/EU), seat hierarchy, async restore polling
- **unitrends** (`kaseya/unitrends/`) — Backup. API patterns skill covers session-token login, appliance/asset hierarchy, MSP Console drift, self-signed cert handling
- **spanning** (`kaseya/spanning/`) — SaaS backup (M365 / GWS / Salesforce). API patterns skill covers per-platform URL bases, admin-email + token auth, Salesforce object ID quirks
- All plugins are version `0.1.0` and tagged `scaffolding` — content is reference documentation; matching MCP servers (`*-mcp`) and SDKs (`node-*`) are in development
- Registered in `.claude-plugin/marketplace.json` under categories `rmm`, `psa`, and `bcdr` (new category for backup/disaster-recovery products)

#### Kaseya Autotask Plugin (`kaseya/autotask/`) - v0.2.0
- **Expenses Skill** - Expense report and expense item management, approval workflow (New/Submitted/Approved/Paid/Rejected/InReview), billable vs reimbursable tracking, picklist discovery for categories and payment types
- **Quotes Skill** - Quote creation and line item management, product/service/service bundle linking, discount structures (unit, line, percentage), optional items, opportunity integration
- **Tool Discovery Skill** - Progressive discovery pattern for lazy-loaded MCP connections, meta-tool usage (list_categories, list_category_tools, execute_tool), intelligent router for natural language tool lookup
- **expenses command** - Create expense reports, add expense items, search by status/submitter, get report details
- **create-quote command** - Build quotes with catalog items, company/contact resolution, pricing and discount application

### Changed

#### Pax8 Plugin (`pax8/pax8/`)
- **Switched to Pax8's official hosted MCP server** at `https://mcp.pax8.com/v1/mcp` — replaces our custom pax8-mcp server
- **Simplified authentication** from OAuth2 client_id/client_secret to single MCP token (generated at `app.pax8.com/integrations/mcp`)
- Updated `.mcp.json`, API patterns skill, README, and gateway vendor config

### Added

#### Shared: Billing Reconciliation Skill (`shared/skills/billing-reconciliation/`)
- **Cross-vendor billing reconciliation** - Compares PSA time/ticket data against accounting invoices to find revenue leakage, unbilled work, and billing discrepancies
- **reconcile-billing command** - Guided workflow for pulling PSA contracts, matching to accounting invoices, identifying gaps, and generating reconciliation reports
- Supports Autotask, ConnectWise, HaloPSA (PSA side) and Xero, QuickBooks Online (accounting side)

#### Xero Plugin (`xero/xero/`)
- **Contacts Skill** - Contact CRUD, customer/supplier types, address and phone types, financial summary fields, PSA cross-referencing via ContactNumber/AccountNumber, contact groups
- **Invoices Skill** - Sales invoices (ACCREC) and supplier bills (ACCPAY), full status lifecycle (DRAFT to PAID/VOIDED), line items with tracking categories, batch invoicing workflows
- **Payments Skill** - Payment recording (AR/AP), partial payments, batch payment creation, collections summary, bank reconciliation workflow, overpayment handling
- **Accounts Skill** - Chart of accounts structure, MSP-specific COA layout (revenue 200-299, COGS 400-499, expenses 500-699), account CRUD, revenue breakdown
- **Reports Skill** - P&L, Balance Sheet, Aged Receivables/Payables, Trial Balance, Bank Summary reports with MSP financial review workflows
- **API Patterns Skill** - OAuth2 Custom Connection auth, xero-tenant-id header, where clause filtering, page-based pagination (100/page), 60 req/min + 5000/day rate limits

#### Xero Commands
- **create-invoice** - Create sales invoices with contact lookup, MSP account codes, and date calculation
- **search-contacts** - Search contacts by name/email/account number with type and status filtering
- **payment-status** - Outstanding balance and payment history with aging breakdown and severity indicators
- **reconciliation-summary** - Billing completeness check — identifies unbilled clients, aged receivables, month-over-month comparison

#### QuickBooks Online Plugin (`quickbooks/quickbooks-online/`)
- **Customers Skill** - Customer entity with parent/sub-customer hierarchy, payment terms, balance tracking, MSP client onboarding/offboarding workflows
- **Invoices Skill** - Invoice lifecycle (draft through paid/voided), line item types, MSP invoice types (recurring, project, T&M, hardware), batch send workflow
- **Expenses Skill** - Purchase and Bill entities, per-client cost allocation via CustomerRef, billable status tracking, profitability analysis
- **Payments Skill** - Full/partial/multi-invoice/unapplied payments, Credit Memos for SLA credits, collections workflow
- **Reports Skill** - P&L, Balance Sheet, A/R Aging, A/P Aging, General Ledger, Customer Sales, Cash Flow with MSP financial dashboard workflows
- **API Patterns Skill** - OAuth2 with token refresh, Intuit query language (SQL-like), minorversion header, SyncToken optimistic locking, 500 req/min rate limits

#### QuickBooks Online Commands
- **create-invoice** - Invoice creation with customer resolution, item lookup, optional email send
- **search-customers** - Customer search with LIKE matching, status/balance filtering
- **get-balance** - Outstanding balances across all MSP clients with A/R aging breakdown
- **expense-summary** - Per-client expense breakdown with billable/non-billable split and profitability context

#### Pax8 Plugin (`pax8/pax8/`)
- **Companies Skill** - Company CRUD, contact management, billing configuration (billOnBehalfOf, selfService, orderApproval), PSA integration via externalId
- **Products Skill** - Product catalog search, vendor filtering, pricing endpoint, provisioning types, billing terms, margin calculation
- **Subscriptions Skill** - Full lifecycle with all 9 subscription states, quantity management, license optimization, renewal management, usage summaries
- **Orders Skill** - Order creation with line items, multi-product orders, provisioning tracking, pre-order validation
- **Invoices Skill** - Invoice retrieval, line item breakdown by company, billing reconciliation, margin analysis, trend analysis
- **API Patterns Skill** - OAuth2 client credentials flow, 0-based pagination (max 200/page), sorting, 1000 req/min rate limits

#### Pax8 Commands
- **search-products** - Search product catalog by name/vendor with optional pricing display
- **subscription-status** - Company subscription report with status and product filtering
- **create-order** - Place orders with validation, pricing confirmation, and commitment warnings
- **license-summary** - Aggregated cross-client license report with optimization recommendations and annual savings estimates

- Cross-vendor incident correlation skill and `/correlate-incident` command — correlates PSA tickets, RMM device state, documentation assets, and config monitoring changes into a unified incident summary (issue #20)
- Vendor field mappings and normalization tables for priority, status, company, and device fields across Autotask, Datto RMM, IT Glue, Liongard, and other vendors

#### Hudu Plugin (`hudu/hudu/`)
- **Companies Skill** - Company CRUD, archive/unarchive, PSA integration matching via `id_in_integration`, parent/child relationships, onboarding/offboarding workflows
- **Assets Skill** - Asset management with asset layouts (custom field templates), custom field types (Text, RichText, Number, Date, CheckBox, Dropdown, AssetTag), layout management, warranty tracking
- **Articles Skill** - Knowledge base article CRUD, folder management, draft vs published state, company-specific vs global articles, HTML content format
- **Passwords Skill** - Secure credential storage via `/api/v1/asset_passwords`, password folders, OTP secrets, security audit logging, API key permission requirements
- **Websites Skill** - Website records with SSL/TLS monitoring, email security tracking (DMARC/DKIM/SPF status and policy), DNS records
- **API Patterns Skill** - `x-api-key` header authentication, page-based pagination (25/page), 300 req/min rate limiting, API naming differences (UI "Password" → API `asset_passwords`, UI "Process" → API `procedures`)

#### Hudu Commands
- **lookup-asset** - Find assets by name, hostname, serial number, or IP with company and layout filters
- **search-articles** - Search knowledge base articles by keyword with company filter and result limit
- **find-company** - Find companies by name with status filter (active/archived/all)
- **get-password** - Retrieve credentials with mandatory company parameter, mask-by-default with `--show` flag

#### RocketCyber Plugin (`kaseya/rocketcyber/`)
- **Incidents Skill** - Security incident lifecycle (New → In Progress → Resolved/False Positive), severity levels, verdicts (Malicious/Suspicious/Benign), SOC analyst triage workflow, PSA ticket cross-correlation
- **Agents Skill** - RocketAgent deployment and monitoring, communication status (Online/Offline), platform support (Windows/macOS/Linux), health audits, offline agent troubleshooting
- **Accounts Skill** - Provider/customer account hierarchy, account types and statuses, new customer setup, account-level security posture assessment
- **Apps Skill** - Application discovery and categorization (Security, Remote Access, Productivity), unauthorized software auditing, security coverage checks
- **API Patterns Skill** - Bearer token authentication, regional base URL (`https://api-{region}.rocketcyber.com/v3`), provider-scoped API keys, conservative rate limiting

#### RocketCyber Commands
- **search-incidents** - Search security incidents by account, status, severity, and verdict
- **account-summary** - Security posture summary with agent status, active incidents, application inventory, and health assessment (HEALTHY/MODERATE/DEGRADED)

- Documentation site using Astro with Starlight theme (in progress)
- GitHub issues for additional PSA/RMM provider plugins (planned)

## [1.1.0] - 2026-02-04

### Added

#### Datto RMM Plugin (`kaseya/datto-rmm/`)
- **Devices Skill** - Device management with identifiers (UID, hostname, MAC, IP), device types (Desktop, Laptop, Server, ESXi Host, Network Device, Printer), status monitoring, user-defined fields (UDF1-30), and device health workflows
- **Alerts Skill** - Comprehensive alert handling with all 25+ alert context types including antivirus_ctx, comp_script_ctx, eventlog_ctx, online_offline_status_ctx, patch_ctx, perf_disk_usage_ctx, perf_resource_usage_ctx, ping_ctx, process_status_ctx, ransomware_ctx, srvc_status_ctx, and more
- **Sites Skill** - Site management with device assignment, site settings, proxy configuration, and site-level operations
- **Jobs Skill** - Quick job execution, component scripts, job variables, status monitoring, and results retrieval
- **Audit Skill** - Hardware inventory (CPU, RAM, disks), software inventory, network interfaces, ESXi host audits, and audit freshness tracking
- **Variables Skill** - Account-level and site-level variables, CRUD operations, variable templates, and inheritance patterns
- **API Patterns Skill** - OAuth 2.0 authentication, 6 regional platforms (Pinotage, Merlot, Concord, Vidal, Zinfandel, Syrah), token lifecycle (100-hour TTL), pagination (nextPageUrl), rate limiting (600 req/min), and Unix millisecond timestamp handling

#### Datto RMM Commands
- **device-lookup** - Find devices by hostname, IP address, or MAC address with site filtering
- **resolve-alert** - Resolve open alerts with context-aware recommendations
- **run-job** - Run quick jobs on devices with variable support and completion waiting
- **site-devices** - List devices at a site with status, type, and alert filtering

#### IT Glue Plugin (`kaseya/it-glue/`)
- **Organizations Skill** - Organization CRUD, relationships, and hierarchies
- **Configuration Types Skill** - Asset types and custom field definitions
- **Passwords Skill** - Secure password management and retrieval
- **Flexible Assets Skill** - Custom documentation templates and fields
- **API Patterns Skill** - X-API-KEY authentication, filtering, embedding related resources

#### Syncro Plugin (`syncro/syncro-msp/`)
- **Tickets Skill** - Ticket CRUD with status (New, In Progress, Resolved), priority levels, timers, comments
- **Customers Skill** - Customer and contact management, onboarding workflows
- **Assets Skill** - Asset tracking with RMM properties, patch management, remote access
- **Invoices Skill** - Invoice creation, line items, payments, email sending
- **API Patterns Skill** - Bearer token auth, page-based pagination (180 req/min)

#### Syncro Commands
- **create-ticket** - Create tickets with customer validation and duplicate detection
- **search-tickets** - Search with filters for customer, status, priority, date range

#### Atera Plugin (`atera/atera/`)
- **Tickets Skill** - Ticket management with SLA tracking, work hours, comments
- **Agents Skill** - RMM agent monitoring, PowerShell execution, lifecycle management
- **Customers Skill** - Customer CRUD with custom values
- **Alerts Skill** - Alert triage with severity levels (Critical, Warning, Information)
- **Devices Skill** - HTTP/SNMP/TCP monitor configuration with common OIDs
- **API Patterns Skill** - X-API-KEY header auth, OData pagination (700 req/min)

#### Atera Commands
- **create-ticket** - Create tickets with customer/contact resolution
- **search-agents** - Search RMM agents by customer or machine name

#### SuperOps.ai Plugin (`superops/superops-ai/`)
- **Tickets Skill** - Ticket CRUD, notes, time entries, status workflows (GraphQL)
- **Assets Skill** - Asset inventory, software, disk details, script execution
- **Clients Skill** - Client CRUD, sites, contacts, custom fields
- **Alerts Skill** - Alert acknowledgment, resolution, ticket creation
- **Runbooks Skill** - Script discovery, execution (single/bulk/scheduled), status monitoring
- **API Patterns Skill** - Bearer token + CustomerSubDomain, cursor pagination (800 req/min)

#### SuperOps.ai Commands
- **create-ticket** - Create tickets via GraphQL mutation
- **list-assets** - Query assets with filtering

#### HaloPSA Plugin (`halopsa/halopsa/`)
- **Tickets Skill** - Ticket management with actions (notes), attachments, SLA calculations
- **Clients Skill** - Client hierarchy, sites, contacts
- **Assets Skill** - Asset tracking, device management, RMM integration
- **Contracts Skill** - Recurring billing, prepaid hours, renewal workflows
- **API Patterns Skill** - OAuth 2.0 client credentials, offset pagination (500 req/3min)

#### HaloPSA Commands
- **create-ticket** - Create tickets with contract validation
- **search-tickets** - Multi-filter search with status/priority/date options

## [1.0.0] - 2026-02-04

### Added

#### Autotask Plugin (`kaseya/autotask/`)
- **Tickets Skill** - Comprehensive ticket management with status codes (NEW, IN_PROGRESS, COMPLETE, WAITING_CUSTOMER, WAITING_MATERIALS, ESCALATED), SLA calculations, escalation rules, and ticket metrics/KPIs
- **CRM Skill** - Company and contact management for client relationship tracking
- **Projects Skill** - Project management with phases, tasks, and resource allocation
- **Contracts Skill** - Service agreements, billing configurations, and contract lifecycle management
- **Time Entries Skill** - Time tracking with approval workflows (DRAFT, SUBMITTED, APPROVED, REJECTED), billing calculations, utilization analytics, and budget validation
- **API Patterns Skill** - Comprehensive REST API documentation covering all 14 query operators (eq, ne, gt, gte, lt, lte, contains, startsWith, endsWith, in, notIn, isNull, isNotNull, between), header-based authentication, automatic zone detection, pagination, rate limiting, and error handling
- **Configuration Items Skill** - Asset management with CI types, categories, DNS records, SSL tracking, related items, warranty tracking, and lifecycle management

#### Autotask Commands
- **create-ticket** - Create new service tickets with company lookup, duplicate detection, contract validation, and queue routing
- **search-tickets** - Search and filter tickets using comprehensive query patterns
- **time-entry** - Log time against tickets or projects with billing calculations and approval submission

#### Shared Skills (`shared/`)
- **MSP Terminology** - Vendor-agnostic MSP vocabulary and acronyms
- **Ticket Triage** - Best practices for ticket prioritization and routing

#### ConnectWise Manage Plugin (`connectwise/manage/`)
- Plugin placeholder structure with manifest and MCP configuration
- README documenting planned features

#### Marketplace Infrastructure
- Vendor-organized directory structure (`vendor/product/` pattern)
- Plugin manifest format (`.claude-plugin/plugin.json`)
- MCP server configuration (`.mcp.json`)
- Skill template with frontmatter schema
- Command template with argument definitions

#### Contribution Framework
- **CONTRIBUTING.md** - Contribution guidelines with PRD requirements
- **CODE_OF_CONDUCT.md** - Contributor Covenant code of conduct
- **LICENSE** - Apache 2.0 license
- **README.md** - Project documentation and quick start guide

#### Quality Standards (`_standards/`)
- PRD requirements checklist
- Skill quality checklist
- API documentation guide

#### Templates (`_templates/`)
- Plugin PRD template
- Skill template with example structure
- Command template
- LLM prompts for skill, command, and PRD generation

### Security
- All Autotask API patterns document secure authentication via header-based credentials (not Basic Auth)
- Rate limiting guidance to prevent API abuse
- Input validation patterns for API operations

---

## Release Notes Format

Each release entry should include:
- **Added** for new features
- **Changed** for changes in existing functionality
- **Deprecated** for soon-to-be removed features
- **Removed** for now removed features
- **Fixed** for any bug fixes
- **Security** in case of vulnerabilities

---

[Unreleased]: https://github.com/asachs01/msp-claude-plugins/compare/v1.1.0...HEAD
[1.1.0]: https://github.com/asachs01/msp-claude-plugins/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/asachs01/msp-claude-plugins/releases/tag/v1.0.0
