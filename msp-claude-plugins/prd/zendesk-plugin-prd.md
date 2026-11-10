# Plugin PRD: Zendesk

> Version: 1.2.0
> Created: 2026-08-30 (revised 2026-10-13: added Security Considerations + Testing Plan sections per CONTRIBUTING.md Tier-3 checklist; corrected Zendesk hosted-MCP-server availability claim after re-verification — see note below. Revised 2026-11-10: dropped "apply tags" from the read-only scope, made the read-only test call a write tool directly, replaced the data-residency claim with explicit processing controls, reframed rate limits as an MCP-layer contract to measure, marked the endpoint and OAuth details as unverified, made the release gates apply to the fallback server too, added a live tool-name comparison, and removed private gateway source paths.)
> Status: Draft - Awaiting Review
> Requested in: #10

> **⚠️ Architecture-blocking update (2026-10-13, analyst):** This PRD's core premise — connect via Zendesk's own hosted MCP server, no WYRE-run proxy — rests on Zendesk's general-purpose, Claude-capable MCP server existing in at least early access. **It does not appear to.** Re-checked against two independent third-party trackers ([tl;dr of Zendesk MCP](https://tldv.io/blog/zendesk-mcp/), checked as of 2026-09-03; [Geckoboard's Zendesk MCP comparison](https://www.geckoboard.com/blog/zendesk-mcp-the-different-options-compared-2026), checked as of 2026-08-14): Zendesk announced this specific server at its Relate conference on 2026-05-19 with "early access in summer" guidance, but as of both check dates it has no entry on Zendesk's own early-access programs page, no public endpoint/setup docs, and no connector listing in either the Claude or ChatGPT directories. **This is a correction, not a restatement** — the PRD's original "early access since summer 2026" claim (made 2026-08-30) was already optimistic relative to what shipped; it is more wrong, not just staler, six weeks later. Two *other* Zendesk MCP products are real and shipped (the inbound-only "MCP Client" that lets Zendesk automations call out to other tools, GA since 2026-06-10; and a ChatGPT-channel MCP server that serves Help Center answers into ChatGPT, live since 2026-04-30) — **neither lets an external client like Claude read tickets**, so neither substitutes for what this PRD needs. No first-party Zendesk source was found confirming or denying current status directly; this is based on two independent secondary trackers that agree with each other and is not Zendesk-official-source-confirmed. **Recommend re-verifying directly against Zendesk's early-access programs page immediately before any go decision**, and treating "build a WYRE-run proxy instead" as a live fallback option, not a hypothetical, until Zendesk's own server is confirmed reachable.

## Summary

A Zendesk plugin for MSPs running (or supporting clients on) Zendesk for customer support — ticket triage, organization/user lookups, help-center article search, and macro-driven response workflows, connected via Zendesk's own hosted MCP server rather than a WYRE-built one. **See the architecture-blocking update above — this server's current availability is unconfirmed and may not exist in reachable form yet.**

## Problem

MSPs and their clients running Zendesk today have no way to triage tickets, check SLA/escalation status, or search the knowledge base from inside Claude — they have to context-switch into the Zendesk web UI for anything beyond what's already summarized in a PSA sync. Larger MSPs in particular run Zendesk as their primary (or a secondary, client-facing) support desk alongside their PSA, so ticket data lives in two systems with no unified agent workflow across them.

## User Stories

- As a **service desk technician**, I want to search and triage open Zendesk tickets by priority/SLA breach risk so that I can work the queue in the right order without switching to the Zendesk UI.
- As an **MSP account manager**, I want to pull a client organization's open ticket history and CSAT trend so that I can prep for a QBR without exporting a report manually.
- As a **support engineer**, I want to search the Zendesk help center for an existing KB article before writing a new reply so that I'm not duplicating documented answers.
- As an **MSP onboarding a new client's Zendesk instance**, I want to look up existing macros, triggers, and SLA policies so that I understand how their support desk is already configured before making changes.

## Scope

### In Scope

- **Ticketing**: search/list/get tickets, read comments and existing tags, check SLA/priority status (read-only; the issue's suggested skill). Applying tags changes ticket state, so it is a write and sits under Out of Scope.
- **Organizations & users**: look up organizations, organization memberships, end-users, agents, groups.
- **Knowledge Base (Guide)**: search help-center articles, sections, categories.
- **Reference data**: macros, triggers, views, SLA policies — read/lookup only, so an agent can explain "why did this ticket route here" without needing to safely reproduce write-side automation logic.
- Connecting through **Zendesk's own hosted MCP server** (endpoint and OAuth details unverified; see Connection model) rather than building and operating a new WYRE-run `zendesk-mcp` server — mirrors how this repo already handles Stripe, Slack, HubSpot, and PandaDoc.

### Out of Scope

- **Writing/updating tickets (including adding or removing tags), closing tickets, or bulk actions** — the issue's suggested "Automations" skill (business rules, SLAs, schedules as *editable* config) is deferred; this PRD scopes to read/triage/lookup, matching the "confirm-before-write" pattern used elsewhere in this repo's support-desk plugins.
- **Building a WYRE-operated `zendesk-mcp` server** — *conditional on the architecture-blocking update above.* The original premise was that Zendesk ships its own official hosted MCP server (early access since summer 2026), making a WYRE-run duplicate server pointless. As of 2026-10-13 that server's availability is unconfirmed and may not exist in reachable form yet (see top of document); if it remains unavailable, this item should be promoted back **into** scope rather than left out.
- **Explore/Reporting API** (analytics, dashboards) — a possible future skill, not needed for the ticketing/KB workflows this PRD targets.
- **Side Conversations, Apps Framework, or Sunshine/CRM objects** — out of scope until there's a concrete MSP workflow that needs them.

## Technical Approach

### Connection model

Zendesk announced a hosted MCP server ([TechRadar coverage](https://www.techradar.com/pro/zendesk-becomes-the-latest-to-adopt-mcp-to-futureproof-customers-in-the-ai-first-era)). Zendesk's [MCP action-flow docs](https://support.zendesk.com/hc/en-us/articles/10497779528730) cover Zendesk calling *out* to external MCP servers, not this server. Neither source gives the endpoint or the auth model, so this PRD's working assumptions are unverified: a per-tenant endpoint (assumed `https://<subdomain>.zendesk.com/api/mcp`), OAuth 2.1 with PKCE, and separate read and write scopes. All three are confirmed from Zendesk's own documentation or from the server's discovery metadata (the `WWW-Authenticate` challenge and RFC 9728 / RFC 8414 well-known documents) before any design work depends on them. A failed request to the assumed URL does not show the server is unavailable; it may live at another URL. **See also the architecture-blocking update at the top of this document: whether this specific server is reachable today is unconfirmed, not merely "early access."** If it remains unreachable at implementation time, this connection model does not work and the plugin needs a WYRE-run proxy instead (the exact pattern this PRD currently avoids). This is the same shape as this repo's existing hosted-OAuth plugins (Stripe, Slack, HubSpot, PandaDoc): the plugin is connector-only and ships no `.mcp.json`. The connection, including the per-tenant subdomain and the OAuth grant, is set up in the Conduit connection UI, and Conduit would need a Zendesk vendor entry the same way it has one for those, assuming the server exists to route to.

### API surface (read/triage scope only)

| Area | REST endpoints (for reference — actual MCP tool names must come from a live `tools/list`) |
|---|---|
| Tickets | `GET /api/v2/tickets`, `GET /api/v2/tickets/{id}`, `GET /api/v2/tickets/{id}/comments`, `GET /api/v2/search?query=` |
| Organizations | `GET /api/v2/organizations`, `GET /api/v2/organizations/{id}`, `GET /api/v2/organizations/{id}/organization_memberships` |
| Users | `GET /api/v2/users`, `GET /api/v2/users/{id}`, `GET /api/v2/groups` |
| Help Center (Guide) | `GET /api/v2/help_center/articles/search.json`, `GET /api/v2/help_center/sections`, `GET /api/v2/help_center/categories` |
| Reference data | `GET /api/v2/macros`, `GET /api/v2/triggers`, `GET /api/v2/views`, `GET /api/v2/slas/policies` |

### Authentication requirements

Assumed, pending the discovery check above: OAuth 2.1 (PKCE), per-tenant subdomain, separate read and write scopes. The connection requests the narrowest (read-only) scope Zendesk allows, and write tools must be blocked as described under Security Considerations, not just left out of the skills.

### Data flow

Claude → Conduit's Zendesk vendor route → Zendesk's own hosted MCP server (per-tenant subdomain) → Zendesk REST API. No WYRE-operated Zendesk server sits in this path, unlike the PSA/RMM plugins that front a WYRE-built `*-mcp` container. Ticket data still passes through Conduit and Claude on the way back; see Data sensitivity below.

### Rate limiting

Zendesk's REST API enforces per-plan rate limits (typically 200–700 req/min depending on plan tier). Zendesk has not published whether its hosted MCP server inherits those limits, adds its own, or shares a budget with the tenant's other API clients, so this PRD does not assume the REST numbers apply. The MCP-layer contract is measured during the live smoke test instead: what a throttled tool call returns (an MCP error, a tool result carrying the REST 429, or a timeout), whether rate-limit headers or a `Retry-After` value reach the client through Conduit, and how long a slow call can run before the MCP call times out. The `api-patterns` skill documents what was observed. Either way, skills batch and paginate rather than loop per-ticket calls.

## Security Considerations

- **Credential handling**: this plugin holds no Zendesk credentials of its own and ships no `.mcp.json`. OAuth tokens are held by Conduit's existing per-tenant credential storage, the same storage already used for Stripe/Slack/HubSpot/PandaDoc, so no new credential-storage surface is introduced. See the Open Questions item below on requesting read-only scopes explicitly.
- **Scope narrowing and write blocking**: Zendesk's server advertises combined read+write scopes. Leaving write tools out of the shipped skills does not stop a model from calling them, so read-only has to be enforced below the skills. Request the narrowest scope Zendesk's OAuth flow allows. If Zendesk cannot issue a read-only grant, Conduit must block every write-capable Zendesk tool at the vendor level before launch, for every role including org owners, the way the `keeper` connection withholds its write tools (absent from `tools/list` and refused on direct call). Per-role tool grants are not enough, because they do not bind org owners. Shipping with write tools reachable through the token is not an acceptable v1 state.
- **Per-tenant isolation**: each MSP client's Zendesk subdomain requires its own OAuth grant (see Multi-tenant Open Question below). A credential or token mix-up across client tenants would expose one client's ticket/customer data through another client's session — this needs the same per-tenant isolation guarantee the gateway already provides for its other hosted vendors, explicitly verified for Zendesk's per-subdomain routing shape before launch, not assumed from the existing vendors' single-fixed-URL shape.
- **Data sensitivity**: ticket content, organization/user records, and macros/triggers can contain customer PII and internal support-process details. Every tool result leaves Zendesk: it passes through Conduit and is processed by Claude, even with no WYRE-run Zendesk server in the path. Before launch, confirm and document:
  - **Conduit**: tool results are relayed, not stored. Request/response logging records the tool name, tenant, and outcome, and leaves out ticket bodies, comments, and user PII. The hosting region is stated so an MSP can compare it with its clients' residency requirements.
  - **Claude**: ticket content is processed under the MSP's own Anthropic account and that account's data-retention terms; the plugin adds no separate retention. The plugin README says so, so an MSP with residency-restricted clients can decide before connecting their Zendesk.
  - **Fallback proxy**: if the architecture-blocking update forces a WYRE-run Zendesk server, it becomes a third processor and needs its own review of hosting region, retention (none beyond the request), and logging (same rules as Conduit) before it ships.
- **Audit logging**: no Zendesk-specific audit requirement beyond what the gateway already logs for credential access across other hosted vendors (per this repo's existing credential-access audit logging). No new gap identified, but not independently re-verified for this vendor.

## Testing Plan

- **Live connection smoke test (blocking)**: before any skill ships, connect the selected MCP server to a real Zendesk sandbox/trial tenant and record two tool inventories: the **upstream** `tools/list` taken from the selected server itself, before any Conduit filtering, and the **served** `tools/list` that Conduit returns to Claude. A vendor-level block hides write tools from the served list, so the upstream inventory is the only complete list of write-capable tools and is what the read-only enforcement test works from. The selected server is Zendesk's hosted one if the architecture-blocking update resolves in its favor, or the WYRE-run fallback if it does not; the same test applies to whichever ships. Attempting the hosted server first is also what resolves the architecture-blocking update.
- **Read-only enforcement test**: from the upstream inventory, take each write-capable tool (ticket update, close, tag) and call it by name directly through Conduit with the grant this plugin's connection issued, outside any shipped skill. Run the calls from an org-owner session as well as a member session. Each call must be rejected, either by Zendesk because the grant is read-only or by Conduit's vendor-level block, and the sandbox ticket must be unchanged afterwards. An empty list of write tools fails the test unless Zendesk's documentation confirms the server has none. A skill that simply never calls a write tool does not pass this test.
- **Multi-tenant isolation test**: connect two separate sandbox Zendesk subdomains under the same gateway instance and confirm a session authenticated against tenant A cannot retrieve tenant B's tickets/organizations.
- **Live tool-name comparison**: compare every tool name the shipped skills, commands, and agents document against the smoke test's served `tools/list`, using `scripts/tool-drift-audit.mjs --live <json>`. The file is a JSON object keyed by the plugin's Conduit vendor slug, e.g. `{"zendesk": ["<tool>", ...]}`, not a raw `tools/list` response. The gate passes only when the Zendesk row is verified (not in the audit's `unverified` bucket) and reports zero drift; the script exits 0 for an unverified vendor, so its exit code alone is not the gate. Any documented name missing from the served list fails the release, so an invented or stale name (including one inferred from REST endpoints) cannot ship.
- **Repo checks**: `check-doc-references.mjs` and `check-tool-anchoring.mjs` also pass. These catch broken skill references and docs that name no tool at all; they do not validate tool names against the server, which is why the live comparison above is a separate gate.
- **Rate-limit behavior test**: exercise a paginated bulk lookup (e.g. listing all tickets for a busy sandbox org) until the sandbox throttles. Record what the MCP layer returns (error shape, any rate-limit headers or `Retry-After` value that reach the client, timeout behavior), then confirm the skill paginates and backs off on that signal rather than retrying immediately.
- **Standard plugin validation**: `claude plugin validate` passes clean, matching the Success Criteria item below.

## Success Criteria

- [ ] A maintainer confirms Zendesk should be added as a gateway vendor (i.e. this PRD is approved) before any skill/agent implementation begins.
- [ ] The plugin's `api-patterns` skill documents the **actual** registered tool names from a live `tools/list` against the selected MCP server (Zendesk's hosted one or the WYRE-run fallback) connected to a Zendesk tenant — not names inferred from REST endpoints or from third-party community Zendesk MCP servers (several exist on GitHub with different tool surfaces than Zendesk's own official server).
- [ ] The live tool-name comparison reports the Zendesk row as verified with zero documented names missing from the served `tools/list`, and `claude plugin validate`, `check-doc-references.mjs`, and `check-tool-anchoring.mjs` pass with zero un-anchored tool references.
- [ ] A technician can search open tickets by organization and read comments/tags, and the read-only enforcement test shows every write-capable tool in the upstream inventory is rejected for this connection, including from an org-owner session.

## Open Questions

- **🔴 Does Zendesk's general-purpose hosted MCP server exist in reachable form yet?** This is now the PRD's lead open question, not a side detail — see the architecture-blocking update at the top of this document. Must be re-confirmed directly against Zendesk's early-access programs page immediately before any go decision, independent of this PRD's own (now corrected) claims.
- **Conduit registration**: Zendesk needs a new Conduit vendor entry, and per-tenant subdomain routing is a different shape from this repo's other hosted vendors, which route to a single fixed hosted URL. This needs Conduit-side design (the plugin itself ships no `.mcp.json`), and is moot if the answer to the question above is "not yet."
- **Tool names are unverified.** This PRD deliberately does not name specific MCP tools (e.g. `zendesk_tickets_search`) because Zendesk's official server was in early access as of this PRD's writing and no live `tools/list` was available to confirm real names — the exact drift risk this repo's issue #178 audit just spent a full corrective pass fixing across 18 other plugins. Implementation must start from a live connection, not from guessed names. (See the Testing Plan's live-connection smoke test, which resolves both this item and the architecture question above in one step.)
- **Multi-tenant MSPs**: an MSP supporting several clients' Zendesk instances would need to connect multiple subdomains — does the gateway's OAuth flow support per-tenant re-auth, or does this need a "which client" disambiguation step in the skill itself?
- **Write scope**: does Zendesk's OAuth flow support a read-only grant? If yes, the Conduit connection requests it; if no, a vendor-level Conduit block withholds the write tools from every role. Either way GOVERNANCE.md records which mechanism applies. (See Scope narrowing and write blocking under Security Considerations.)
