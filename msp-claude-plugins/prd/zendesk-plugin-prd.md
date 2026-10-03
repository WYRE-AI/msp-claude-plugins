# Plugin PRD: Zendesk

> Version: 1.0.0
> Created: 2026-08-30
> Status: Draft - Awaiting Review
> Requested in: #10

## Summary

A Zendesk plugin for MSPs running (or supporting clients on) Zendesk for customer support — ticket triage, organization/user lookups, help-center article search, and macro-driven response workflows, connected via Zendesk's own hosted MCP server rather than a WYRE-built one.

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
- **Building a WYRE-operated `zendesk-mcp` server.** Zendesk ships its own official hosted MCP server (early access since summer 2026); duplicating that as a local server would mean maintaining an integration Zendesk already maintains, for no real benefit.
- **Explore/Reporting API** (analytics, dashboards) — a possible future skill, not needed for the ticketing/KB workflows this PRD targets.
- **Side Conversations, Apps Framework, or Sunshine/CRM objects** — out of scope until there's a concrete MSP workflow that needs them.

## Technical Approach

### Connection model

Zendesk's MCP server is hosted per-tenant at `https://<subdomain>.zendesk.com/api/mcp`, OAuth-gated, advertising read and write scopes (confirmed via Zendesk's public MCP announcement, [TechRadar coverage](https://www.techradar.com/pro/zendesk-becomes-the-latest-to-adopt-mcp-to-futureproof-customers-in-the-ai-first-era) and Zendesk's own [MCP action-flow docs](https://support.zendesk.com/hc/en-us/articles/10497779528730)). This is the same shape as this repo's existing hosted-OAuth plugins (Stripe, Slack, HubSpot, PandaDoc) — no bundled `.mcp.json` pointing at a fixed URL, since the subdomain is per-tenant; the gateway would need a Zendesk vendor entry the same way it has one for those.

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

## Success Criteria

- [ ] A maintainer confirms Zendesk should be added as a gateway vendor (i.e. this PRD is approved) before any skill/agent implementation begins.
- [ ] The plugin's `api-patterns` skill documents the **actual** registered tool names from a live `tools/list` against a connected Zendesk tenant — not names inferred from REST endpoints or from third-party community Zendesk MCP servers (several exist on GitHub with different tool surfaces than Zendesk's own official server).
- [ ] `claude plugin validate` and this repo's `check-doc-references.mjs` / `check-tool-anchoring.mjs` pass with zero un-anchored tool references.
- [ ] A technician can search open tickets by organization and read comments/tags without any write-scoped tool being reachable from the shipped skills.

## Open Questions

- **Gateway registration**: does `mcp-gateway/src/credentials/vendor-config.ts` need a new Zendesk entry (per-tenant subdomain routing is a different shape than this repo's other hosted vendors, which route to a single fixed hosted URL)? This needs gateway-side design, not just a plugin-side `.mcp.json`.
- **Tool names are unverified.** This PRD deliberately does not name specific MCP tools (e.g. `zendesk_tickets_search`) because Zendesk's official server was in early access as of this PRD and no live `tools/list` was available to confirm real names — the exact drift risk this repo's issue #178 audit just spent a full corrective pass fixing across 18 other plugins. Implementation must start from a live connection, not from guessed names.
- **Multi-tenant MSPs**: an MSP supporting several clients' Zendesk instances would need to connect multiple subdomains — does the gateway's OAuth flow support per-tenant re-auth, or does this need a "which client" disambiguation step in the skill itself?
- **Write scope**: Zendesk's server advertises write scopes even though this PRD scopes to read-only skills — should the plugin's `.mcp.json`/GOVERNANCE.md explicitly request read-only OAuth scopes if Zendesk's OAuth flow supports scope narrowing, to keep write tools unreachable by default rather than just undocumented?
