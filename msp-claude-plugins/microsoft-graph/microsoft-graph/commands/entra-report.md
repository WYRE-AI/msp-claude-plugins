---
description: Conversational Microsoft Entra directory reporting via the Graph Enterprise MCP — license usage, user and group counts, application inventory, and directory composition, formatted for client check-ins and QBRs
argument-hint: "[topic] [audience]"
arguments: [topic, audience]
---

# Entra Directory Report

Produces a conversational, **read-only** snapshot of a client's Microsoft Entra directory through the Microsoft Graph MCP Server for Enterprise. Built for client check-ins, Quarterly Business Reviews, onboarding handoffs, and "give me the state of this tenant" requests.

Unlike `/microsoft-graph:entra-audit` (which hunts for problems), this command describes what's *there* — composition and consumption, not findings. All data is gathered through the RAG loop: `microsoft_graph_suggest_queries` → pick the candidate → `microsoft_graph_get`. Never invent Graph endpoints.

## Arguments

- `topic` (optional) — What to report on — overview (default), licenses, users, groups, or apps
- `audience` (optional) — technical (default) or executive — controls framing and whether raw detail is shown

## What it reports

Run the sections relevant to `topic` (default `overview` runs all):

1. **License usage** (`topic=licenses`) — `suggest_queries("subscribed SKUs and license consumption")` → `get`. Per-SKU: purchased seats, assigned, available. Highlights near-exhausted SKUs and large pools of unused seats.
2. **User counts** (`topic=users`) — `suggest_queries("count of all users in the tenant")` and `suggest_queries("count of guest users")` → `get`. Member vs guest split, enabled vs disabled, and recently created accounts.
3. **Group counts** (`topic=groups`) — `suggest_queries("groups in the directory by type")` → `get`. Security groups, Microsoft 365 groups, distribution lists, and dynamic vs assigned membership.
4. **Application inventory** (`topic=apps`) — `suggest_queries("registered applications and enterprise applications")` → `get`. App registrations and service principals — useful for spotting unfamiliar third-party apps with directory access.

Use `microsoft_graph_list_properties` when you need an entity's schema to pick the right properties.

## Audience framing

- **technical** (default): counts, SKU part numbers, group types, app display names. Concise tables.
- **executive**: plain-language narrative — "Contoso has 412 staff accounts and pays for 50 unused Microsoft 365 E3 seats." No GUIDs, no SKU part numbers, no JSON. Lead with the headline, then a short bulleted detail list.

## Output

A directory snapshot organized by section, each with the headline number and a one-line interpretation. For QBR use, close with one or two observations the account team can act on (e.g. "50 unassigned E3 seats — candidate for a true-down at renewal"). Keep it descriptive; this is a status report, not an audit.

## Notes

- Read-only — this reports the directory, it never changes it.
- Results honor the caller's Entra RBAC; per-tenant admin consent must be in place (see the `microsoft-graph-connection` skill).
- Preview service — verify anything material in the Entra admin center before acting on it.
