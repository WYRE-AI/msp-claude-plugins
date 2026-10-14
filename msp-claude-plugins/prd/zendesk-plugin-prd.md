# Plugin PRD: Zendesk

> Version: 1.1.0
> Created: 2026-08-30 (revised 2026-10-13: added Security Considerations + Testing Plan sections per CONTRIBUTING.md Tier-3 checklist; corrected Zendesk hosted-MCP-server availability claim after re-verification — see note below)
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

- **Ticketing**: search/list/get tickets, read comments, apply tags, check SLA/priority status (read-heavy; the issue's suggested skill).
- **Organizations & users**: look up organizations, organization memberships, end-users, agents, groups.
- **Knowledge Base (Guide)**: search help-center articles, sections, categories.
- **Reference data**: macros, triggers, views, SLA policies — read/lookup only, so an agent can explain "why did this ticket route here" without needing to safely reproduce write-side automation logic.
- Connecting through **Zendesk's own hosted MCP server** (`https://<subdomain>.zendesk.com/api/mcp`, OAuth-gated) rather than building and operating a new WYRE-run `zendesk-mcp` server — mirrors how this repo already handles Stripe, Slack, HubSpot, and PandaDoc.

### Out of Scope

- **Writing/updating tickets, closing tickets, or bulk actions** — the issue's suggested "Automations" skill (business rules, SLAs, schedules as *editable* config) is deferred; this PRD scopes to read/triage/lookup, matching the "confirm-before-write" pattern used elsewhere in this repo's support-desk plugins.
- **Building a WYRE-operated `zendesk-mcp` server** — *conditional on the architecture-blocking update above.* The original premise was that Zendesk ships its own official hosted MCP server (early access since summer 2026), making a WYRE-run duplicate server pointless. As of 2026-10-13 that server's availability is unconfirmed and may not exist in reachable form yet (see top of document); if it remains unavailable, this item should be promoted back **into** scope rather than left out.
- **Explore/Reporting API** (analytics, dashboards) — a possible future skill, not needed for the ticketing/KB workflows this PRD targets.
- **Side Conversations, Apps Framework, or Sunshine/CRM objects** — out of scope until there's a concrete MSP workflow that needs them.

## Technical Approach

### Connection model

Zendesk's MCP server is hosted per-tenant at `https://<subdomain>.zendesk.com/api/mcp`, OAuth-gated, advertising read and write scopes (per Zendesk's public MCP announcement, [TechRadar coverage](https://www.techradar.com/pro/zendesk-becomes-the-latest-to-adopt-mcp-to-futureproof-customers-in-the-ai-first-era) and Zendesk's own [MCP action-flow docs](https://support.zendesk.com/hc/en-us/articles/10497779528730)) — **but see the architecture-blocking update at the top of this document: whether this specific server is reachable today is unconfirmed, not merely "early access."** If it remains unreachable at implementation time, this connection model does not work and the plugin needs a WYRE-run proxy instead (the exact pattern this PRD currently avoids). This is the same shape as this repo's existing hosted-OAuth plugins (Stripe, Slack, HubSpot, PandaDoc) — no bundled `.mcp.json` pointing at a fixed URL, since the subdomain is per-tenant; the gateway would need a Zendesk vendor entry the same way it has one for those, assuming the server exists to route to.

### API surface (read/triage scope only)

| Area | REST endpoints (for reference — actual MCP tool names must come from a live `tools/list`) |
|---|---|
| Tickets | `GET /api/v2/tickets`, `GET /api/v2/tickets/{id}`, `GET /api/v2/tickets/{id}/comments`, `GET /api/v2/search?query=` |
| Organizations | `GET /api/v2/organizations`, `GET /api/v2/organizations/{id}`, `GET /api/v2/organizations/{id}/organization_memberships` |
| Users | `GET /api/v2/users`, `GET /api/v2/users/{id}`, `GET /api/v2/groups` |
| Help Center (Guide) | `GET /api/v2/help_center/articles/search.json`, `GET /api/v2/help_center/sections`, `GET /api/v2/help_center/categories` |
| Reference data | `GET /api/v2/macros`, `GET /api/v2/triggers`, `GET /api/v2/views`, `GET /api/v2/slas/policies` |

### Authentication requirements

OAuth 2.1 (PKCE), per-tenant subdomain, read + write scopes advertised by Zendesk's server — this plugin only requests read-scoped operations for the in-scope skills above.

### Data flow

Claude → gateway's Zendesk vendor route → Zendesk's own hosted MCP server (per-tenant subdomain) → Zendesk REST API. No WYRE-operated proxy/server sits in this path, unlike the PSA/RMM plugins that front a WYRE-built `*-mcp` container.

### Rate limiting

Zendesk's REST API enforces per-plan rate limits (typically 200–700 req/min depending on Zendesk plan tier); since the hosted MCP server sits in front of the same API, the same limits apply. Skills should batch/paginate rather than loop per-ticket calls.

## Security Considerations

- **Credential handling**: this plugin holds no Zendesk credentials of its own. OAuth tokens live in the gateway's existing per-tenant credential store (`mcp-gateway/src/credentials/`), the same store already used for Stripe/Slack/HubSpot/PandaDoc — no new credential-storage surface is introduced. See the Open Questions item below on requesting read-only scopes explicitly.
- **Scope narrowing**: Zendesk's server advertises combined read+write scopes. This plugin's shipped skills only call read/lookup endpoints, but unless the OAuth flow itself is asked for a narrower scope at connect time, write-capable tools remain technically reachable (just undocumented) through the same token. Request the narrowest scope Zendesk's OAuth flow allows; if Zendesk does not support scope narrowing below its default grant, document that write tools are reachable-but-unused rather than implying they are blocked.
- **Per-tenant isolation**: each MSP client's Zendesk subdomain requires its own OAuth grant (see Multi-tenant Open Question below). A credential or token mix-up across client tenants would expose one client's ticket/customer data through another client's session — this needs the same per-tenant isolation guarantee the gateway already provides for its other hosted vendors, explicitly verified for Zendesk's per-subdomain routing shape before launch, not assumed from the existing vendors' single-fixed-URL shape.
- **Data sensitivity**: ticket content, organization/user records, and macros/triggers can contain customer PII and internal support-process details. No new data leaves Zendesk's own infrastructure under this design (data flows through Zendesk's hosted server, not a WYRE-operated intermediary) — but this guarantee is contingent on the architecture-blocking update above: if a WYRE-run proxy becomes necessary instead, this data-residency property no longer holds by default and needs its own review.
- **Audit logging**: no Zendesk-specific audit requirement beyond what the gateway already logs for credential access across other hosted vendors (per this repo's existing credential-access audit logging). No new gap identified, but not independently re-verified for this vendor.

## Testing Plan

- **Live connection smoke test (blocking on the architecture question above)**: before any skill ships, connect to a real Zendesk sandbox/trial tenant and run a live `tools/list` against Zendesk's hosted MCP server to confirm it (a) is reachable at all, and (b) get the actual registered tool names — this is also what Success Criteria below already requires, and it is the same step that resolves the architecture-blocking update.
- **Read-only enforcement test**: verify that the OAuth grant obtained by this plugin cannot successfully invoke a write-scoped tool (ticket update/close) from within a shipped skill — confirms the read-only intent in Scope is actually enforced, not just documented.
- **Multi-tenant isolation test**: connect two separate sandbox Zendesk subdomains under the same gateway instance and confirm a session authenticated against tenant A cannot retrieve tenant B's tickets/organizations.
- **Tool-anchoring / drift check**: run this repo's `check-doc-references.mjs` and `check-tool-anchoring.mjs` (the #178-audit tooling) against the shipped skill docs to confirm every documented tool name matches a real, live-verified tool — not a name inferred from REST endpoints.
- **Rate-limit behavior test**: exercise a paginated bulk lookup (e.g. listing all tickets for a busy sandbox org) and confirm the skill backs off/paginates correctly rather than hammering the endpoint, given the rate limits noted above.
- **Standard plugin validation**: `claude plugin validate` passes clean, matching the Success Criteria item below.

## Success Criteria

- [ ] A maintainer confirms Zendesk should be added as a gateway vendor (i.e. this PRD is approved) before any skill/agent implementation begins.
- [ ] The plugin's `api-patterns` skill documents the **actual** registered tool names from a live `tools/list` against a connected Zendesk tenant — not names inferred from REST endpoints or from third-party community Zendesk MCP servers (several exist on GitHub with different tool surfaces than Zendesk's own official server).
- [ ] `claude plugin validate` and this repo's `check-doc-references.mjs` / `check-tool-anchoring.mjs` pass with zero un-anchored tool references.
- [ ] A technician can search open tickets by organization and read comments/tags without any write-scoped tool being reachable from the shipped skills.

## Open Questions

- **🔴 Does Zendesk's general-purpose hosted MCP server exist in reachable form yet?** This is now the PRD's lead open question, not a side detail — see the architecture-blocking update at the top of this document. Must be re-confirmed directly against Zendesk's early-access programs page immediately before any go decision, independent of this PRD's own (now corrected) claims.
- **Gateway registration**: does `mcp-gateway/src/credentials/vendor-config.ts` need a new Zendesk entry (per-tenant subdomain routing is a different shape than this repo's other hosted vendors, which route to a single fixed hosted URL)? This needs gateway-side design, not just a plugin-side `.mcp.json` — and is moot if the answer to the question above is "not yet."
- **Tool names are unverified.** This PRD deliberately does not name specific MCP tools (e.g. `zendesk_tickets_search`) because Zendesk's official server was in early access as of this PRD's writing and no live `tools/list` was available to confirm real names — the exact drift risk this repo's issue #178 audit just spent a full corrective pass fixing across 18 other plugins. Implementation must start from a live connection, not from guessed names. (See the Testing Plan's live-connection smoke test, which resolves both this item and the architecture question above in one step.)
- **Multi-tenant MSPs**: an MSP supporting several clients' Zendesk instances would need to connect multiple subdomains — does the gateway's OAuth flow support per-tenant re-auth, or does this need a "which client" disambiguation step in the skill itself?
- **Write scope**: Zendesk's server advertises write scopes even though this PRD scopes to read-only skills — should the plugin's `.mcp.json`/GOVERNANCE.md explicitly request read-only OAuth scopes if Zendesk's OAuth flow supports scope narrowing, to keep write tools unreachable by default rather than just undocumented? (Expanded in Security Considerations above.)
