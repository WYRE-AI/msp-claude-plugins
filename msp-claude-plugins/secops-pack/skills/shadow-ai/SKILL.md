---
name: "Shadow AI"
description: >
  Per-client comparison of observed RMM installed software with Microsoft 365 /
  Entra application and service principal inventory, conservative AI product
  matching, unsanctioned-tool findings, optional consent-risk review, and
  explicit source-coverage limitations.
when_to_use: >-
  When an MSP wants to identify unapproved AI tools across client endpoints
  and tenants. Use when: shadow AI, unsanctioned AI, unauthorized AI software,
  AI tool sprawl, AI governance scan, or endpoint AI approval review.
---

# Shadow AI

## Overview

Compare each client's observed AI software with that same client's Entra
enterprise apps / service principals. A usable comparison requires at least
one installed-software source and one readable app-inventory source for that
client. This is an inventory-based sanction proxy, not proof of formal policy
approval, actual AI usage, or data exposure. Browser-only AI use is outside
endpoint installed-software coverage.

## Anti-triggers

- **A single vendor's device or software record:** use `superops-assets`,
  `ncentral-devices`, `immybot-software-deployment`, `datto-rmm-audit`, or
  `ninjaone-devices`.
- **Graph connection or admin-consent setup:** use `microsoft-graph-connection`.
- **General Graph directory queries (users, groups, or licenses):** use
  `microsoft-graph-querying`.
- **CIPP user or BEC investigation:** use `cipp-users`, `cipp-security`, or
  `secops-pack-bec-response`.
- **License seat true-up:** use `finance-pack-license-true-up`.

## Step Zero: Discover and Scope

Start every workflow with `conduit__search_tools`. Search for client/tenant
mapping, installed software, and application/service principal inventory.
Use only the exact discovered names and schemas, often
`<vendor-slug>__<tool_name>`. The names below are canonical MCP names, not
assumed gateway spellings. Never assume any listed vendor is connected.

Use read-only list/get/search tools only. Never create, update, delete,
install, publish, reboot, run scripts, or use raw, execute, passthrough, or
custom-mutation tools, even if discovered. Do not substitute vendor REST
recipes for missing MCP capabilities.

Resolve the client-to-RMM-organization and client-to-tenant mapping before
joining records. Available mapping examples are `autotask_search_companies`,
`halopsa_clients_list`, `cw_search_companies`, `syncro_customers_list`,
`superops_clients_list`, `ninjaone_organizations_list`, `atera_customers_list`,
`cwautomate_clients_list`, `datto_list_sites`, `cipp_list_tenants`, and
`cipp_get_tenant_details`. Ask the operator to resolve ambiguous mappings;
do not join clients on a similar name alone. Keep each client's evidence separate.

CIPP can map customer tenants. Graph is typically scoped to the consented
tenant(s), so one Graph connection does not imply portfolio coverage. Verify
that each connection belongs to the target tenant. No consented, callable
app-inventory connection means Entra inventory is unavailable for that client.

## Collect Endpoint Evidence

| Connected source | Allowed software evidence and limits |
|------------------|--------------------------------------|
| SuperOps | `superops_assets_list` / `superops_assets_get` for scope, then `superops_assets_software` for installed software. |
| N-central | `ncentral_list_devices`, `ncentral_list_devices_by_org_unit`, or `ncentral_get_device` for scope; `ncentral_get_device_assets` includes installed software. |
| ImmyBot | `immybot_computers_list` / `immybot_computers_get` and `immybot_computers_inventory` for observed inventory. `immybot_software_list`, `immybot_software_search`, and `immybot_software_get` describe the catalog; `immybot_deployments_for_computer` / `immybot_deployments_for_software` describe intended/deployed software. Label these separately; catalog or deployment records alone do not prove observed installs. |
| Datto RMM | `datto_list_devices`, `datto_get_device`, and `datto_find_device` scope devices only. `datto_get_device_audit` can return software-only audit data but is admin-tier (forensics-class inventory). Use it only when discovery shows it is actually callable for this org. A read-only Datto grant cannot call it; otherwise report software inventory unavailable because an admin grant is required. |

NinjaOne, Atera, ConnectWise Automate, and Syncro have no dedicated installed-
software MCP tool for this workflow. Their device/asset lists do not establish
software coverage. If these are the only connected RMM sources, report endpoint
software inventory unavailable through the connected MCP tools.

Follow discovered pagination for the authorized client/device scope. Preserve
source, device identifier, software name, publisher, version, and inventory
timestamp when returned. Record unreadable devices, stale snapshots, and
unfinished pages as coverage gaps, not clean devices. Never invent installs.

## Collect Entra Evidence

Use discovered `microsoft_graph_suggest_queries` to obtain vetted reads for
`application` and `servicePrincipal` inventory. Use
`microsoft_graph_list_properties` to confirm selectable properties and
relationships, and `microsoft_graph_get` to execute the returned candidates
with their discovered schema. Do not hand-write endpoints. Limit all Graph
reads in this workflow to applications, service principals, and their related
consent/grant properties when present. Collect display name, publisher, and
stable identifiers when returned, keeping app registrations distinct from
tenant enterprise apps / service principals. An application registration alone
is not a matching sanctioned enterprise app.

`microsoft_graph_get` is admin-tier in Conduit, despite being read-only. If it
is not callable under the current grant, report Entra inventory unavailable.
Results depend on the existing connection's consented scopes, caller's Entra
roles, and per-tenant admin consent. For empty results or permission errors,
report that inventory could not be read or verified, and refer the operator
to `microsoft-graph-connection`. Do not introduce new app registrations,
permission requirements, secrets, or consent URLs. Finish available pages;
a partial inventory cannot prove an app is absent.

CIPP has no enterprise-app or service-principal inventory tool.
`cipp_list_audit_logs` may optionally show "Consent to application" events;
label them as weaker, time-bounded evidence with the queried window, never
as a complete inventory or a substitute for Graph. A CIPP user investigation
is not a portfolio app scan. For the Softeria `m365` sidecar, if discovery
returns no real app-inventory capability, explicitly report that gap; do not
invent an application-list tool.

## Match and Classify Per Client

1. Build an illustrative, incomplete AI watchlist from software names and
   publishers, such as ChatGPT, Claude, Copilot, Gemini, and Cursor. Accept
   operator additions. Broad names such as Copilot require product/publisher
   validation; a keyword alone does not establish an AI install.
2. Normalize case and minor name variations, but retain original evidence.
   Match observed software to the client's enterprise apps / service
   principals conservatively using display name and publisher. Record the
   matching rationale. Ambiguous aliases, publishers, or product families
   are **needs review**, not unsanctioned.
3. Label **unsanctioned** only when an observed AI install has no matching
   sanctioned enterprise app / service principal in a successfully read,
   complete tenant inventory. Label confident matches **matched in Entra**,
   with the inventory-based sanction caveat. If either side is unavailable
   or incomplete, report the available side as **incomplete inventory** and
   withhold absence-based findings. Never invent directory apps.
4. Optionally review consent risk only when Graph actually returns related
   grant/consent data for service principals. Cite the actual granted roles
   or scopes before flagging high privilege; distinguish available roles
   from granted roles. Unusual publishers and recent consent timestamps
   can add review context when returned, but are not proof of abuse. If
   grant/consent properties are not returned, say optional consent review
   was unavailable. Do not infer grants from an app's presence.

## Per-client Report

Use placeholders only for the template below; fill results solely from reads.

| Client / tenant | Coverage | Observed AI software | Entra match | Classification | Evidence / next review |
|-----------------|----------|----------------------|-------------|----------------|------------------------|
| [Client] / [Tenant] | [Sources, timestamps, devices read / in scope, pagination status] | [Software, publisher, version, N devices] | [Returned app and match rationale, no match, or unavailable] | [Matched in Entra, unsanctioned, needs review, or incomplete inventory] | [Source record references, limitations, and operator review] |

For each client, state unavailable signals and reasons separately, including
endpoint software, Entra inventory, and optional consent review. Include
intended/deployed-only records separately from observed installs. An incomplete
scan is not a clean bill of health. Recommend human policy review of findings;
this workflow does not remove software, revoke consent, or change tenant state.
