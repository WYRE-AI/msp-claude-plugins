---
description: Run a read-only Microsoft Entra identity hygiene audit via the Graph Enterprise MCP — inactive user accounts, admins without MFA registered, unassigned/wasted licenses, and a guest user inventory
argument-hint: "[scope] [detail]"
arguments: [scope, detail]
---

# Entra Identity Hygiene Audit

Runs a focused, **read-only** audit of a client's Microsoft Entra directory through the Microsoft Graph MCP Server for Enterprise. Suitable for client check-ins, post-onboarding validation, pre-QBR prep, security reviews, and "is anything stale in this tenant?" investigations.

Every check goes through the RAG query loop — `microsoft_graph_suggest_queries` to find the right candidate Graph call, then `microsoft_graph_get` to execute it. Never hand-write Graph endpoints; see the `microsoft-graph-querying` skill.

## Arguments

- `scope` (optional) — Audit area to focus on — all (default), inactive, mfa, licenses, or guests
- `detail` (optional) — summary (default), full, or executive — controls report depth

## What it checks

Run each section unless `scope` narrows it:

1. **Inactive accounts** (`scope=inactive`) — `suggest_queries("user accounts with no recent sign-in activity")` → `get`. Lists enabled accounts with no sign-in in the trailing window. Flags licensed inactive accounts as reclaimable spend.
2. **Admins without MFA registered** (`scope=mfa`) — `suggest_queries("users with privileged directory roles")` and `suggest_queries("users who have not registered for MFA")` → `get` each, then intersect. Any account holding an admin role with no MFA method registered is a top-priority finding.
3. **Unassigned / wasted licenses** (`scope=licenses`) — `suggest_queries("subscribed SKUs and license consumption")` plus a licensed-but-inactive cross-check → `get`. Reports purchased-but-unassigned seats and licenses held by disabled or inactive accounts.
4. **Guest user inventory** (`scope=guests`) — `suggest_queries("external guest users in the directory")` → `get`. Lists guest accounts with invitation/external state; flags guests with no recent sign-in as cleanup candidates.

Use `microsoft_graph_list_properties` whenever you need an entity's schema to refine a `$select` (e.g. confirming `user` exposes `signInActivity` or `assignedLicenses`).

## Detail levels

- **summary** (default): pass/fail per section, top 5 findings, one-line hygiene verdict.
- **full**: every flagged account, every SKU, the complete guest list.
- **executive**: plain-language posture summary suitable for a client-facing email — no GUIDs, no JSON.

## Output

A prioritized finding list. For each finding give the count, the affected accounts (named, not GUIDs), the risk or cost impact, and a recommended next step. Because this MCP server is read-only, remediation steps are advisory — note which tool actually performs the change (e.g. license reclaim or account disable via the `cipp` plugin or the Entra admin center).

## When to use this vs. the agent

Use this command for a routine, structured hygiene sweep. Delegate to the `entra-reporting-analyst` agent when you need open-ended investigation, cross-tenant comparison, or a narrative report.
