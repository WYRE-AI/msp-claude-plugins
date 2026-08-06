# HubSpot plugin — governance and safety model

Unofficial. Community-built plugin for the HubSpot API. Not affiliated with,
endorsed by, or sponsored by the vendor.

## What it connects as

This plugin does not hold credentials. It reaches HubSpot through the WYRE
Conduit gateway (`https://conduit.wyre.ai/v1/mcp`), which brokers
authentication centrally and scopes every call to the portal the operator is
authorised for.

- No HubSpot client ID, client secret, or access token is stored on the
  technician's machine, in this repo, or in the model's context.
- The org's HubSpot connection is stored once at the gateway, so
  replacing it is one edit rather than a change on every technician's
  machine. HubSpot is OAuth: Conduit refreshes the token itself as it
  nears expiry, and asks you to reconnect only when that refresh fails.

- Every call carries operator identity, so the gateway audit log answers "who
  changed this record". HubSpot's own history attributes the change to the
  integration's app user, not to a person.
- Removing someone from the organisation clears their per-vendor grants and
  revokes their gateway refresh tokens at once; a user deactivated in your
  identity provider is refused on their very next request. A user only
  removed from the org keeps an already-issued access token for up to an
  hour, but it reaches only a personal HubSpot connection made with their own
  key — never the org's. See `wyre-gateway/GOVERNANCE.md`.

## Tool permission tiers

> **Not classified in Conduit — every tool in the table below requires
> tier `admin` today.** Conduit derives each tool's tier from
> `VENDOR_TOOL_CONFIG` (`src/proxy/result-cache.ts`) and fails closed for
> anything absent from it:
> `const requiredTier: PermissionTier = classified ?? 'admin';`
> (`src/access/access-enforcement.ts:63`). `hubspot` has no entry, so the
> grouping below carries no enforcement weight right now — read tools
> require `admin` exactly as the rest do, and there is no narrower grant
> that admits them. The grouping is still the right *risk* reading, and it
> becomes the enforcement reading on the day this vendor is classified.
> The list of unclassified vendors moves whenever one of them is
> classified, so it is stated in one place only:
> `wyre-gateway/GOVERNANCE.md`, *Fail-closed, and the vendors Conduit has
> not classified*.
>
> *This blockquote is the whole of the not-classified caveat. When
> `hubspot` appears in `VENDOR_TOOL_CONFIG`, delete this blockquote and
> change nothing else.*

| Tier | What it can do | Tools |
|---|---|---|
| **Read** | Cannot change HubSpot state. Safe for autonomous agents. | `hubspot_retrieve_contact`, `hubspot_list_contacts`, `hubspot_list_contact_properties`, `hubspot_search_contacts`, `hubspot_retrieve_company`, `hubspot_list_company_properties`, `hubspot_search_companies`, `hubspot_retrieve_deal`, `hubspot_list_deal_properties`, `hubspot_search_deals`, `hubspot_retrieve_ticket`, `hubspot_access_associations`, `hubspot_get_user_details`, `hubspot_open_hubspot_ui` |
| **Write** | Creates or modifies records. Reversible, internally visible. | `hubspot_create_company`, `hubspot_update_company`, `hubspot_create_deal`, `hubspot_update_deal`, `hubspot_create_ticket`, `hubspot_update_ticket`, `hubspot_create_task`, `hubspot_create_note`, `hubspot_create_association` |
| **Destructive** | Can cause HubSpot to email a real person. | `hubspot_create_contact`, `hubspot_update_contact` |

There is no delete tool in this plugin, so the destructive tier is not defined
by data loss — it is defined by outbound reach.

`hubspot_create_contact` and `hubspot_update_contact` sit in the destructive
tier deliberately. HubSpot workflows enrol on contact creation and on contact
property changes. In a portal with any lifecycle-stage, lead-status, or
list-membership workflow that has an email action, writing a contact property
hands a real named prospect to a marketing sequence. The plugin sends nothing;
HubSpot does, on the strength of the write — and a sent email cannot be
recalled. Company, deal, and ticket objects carry no email address of their
own, which is why they stay in the write tier.

Conduit does not enforce any of that as an approval requirement. It compares
tiers — it has no approval step, no per-call confirmation, and no interactive
prompt. Per-call approval is a workflow you impose on your agents, and it is
only as good as the agent configuration that carries it.

## Recommended agent policy

The safe default is **read autonomously, propose writes, never self-approve
destructive calls.**

- Read tools: allow. Pipeline reporting, contact lookup, and cross-object
  audits are the intended autonomous use.
- Write tools: agent drafts the exact call, human approves, then it runs.
- Destructive tools: require a named human approver per invocation. Do not
  grant contact writes to scheduled or unattended agents — a nightly enrichment
  job is exactly the shape that mass-enrols prospects by accident.

## What it cannot reach

- Only the HubSpot portals mapped to the operator's gateway identity.
- Only the objects the granted OAuth scopes cover. HubSpot derives scopes from
  the tools in use; an unscoped object returns a permissions error rather than
  partial data.
- No filesystem, no shell, no other vendor's data.
- No marketing email, workflow, sequence, form, or CMS surface. This plugin
  reads and writes CRM objects only — it cannot author, inspect, or disable the
  workflows that a contact write may trigger.
- No sensitive-data (PHI) fields. HubSpot excludes them from the MCP surface
  regardless of portal configuration.

## Data handling

- Responses pass through the gateway into model context for the session and are
  not persisted by this plugin.
- `hubspot_retrieve_contact`, `hubspot_list_contacts`, and
  `hubspot_search_contacts` return customer and prospect PII — names, email
  addresses, phone numbers, job titles.
- `hubspot_retrieve_deal` and `hubspot_search_deals` return commercial data:
  contract values, MRR, forecast category, and close dates across the whole
  pipeline. A single unfiltered search can return the company's entire
  forecast.
- `hubspot_get_user_details` returns staff identity and the portal ID.
- `hubspot_search_*` with a permissive `filterGroups` will page through the
  entire object set. Restrict these if your agents run unattended.

## Known sharp edges

- **Writes fan out to workflows.** Covered above, and it is the single most
  important thing to understand before granting write access. Audit the portal's
  active workflows before letting an agent touch contact properties.
- **`hubspot_update_*` is a partial update, but stage changes are not.** Moving
  a deal to a closed stage can trigger internal notifications, revenue
  recognition, and renewal automation that no longer key off the original
  close date.
- **Domain-based auto-association is silent.** Creating a contact whose email
  domain matches an existing company attaches it to that company without a
  separate association call — and to the wrong company if two clients share a
  parent domain.
- **Search is eventually consistent.** A record created through this plugin may
  not appear in `hubspot_search_*` results for several seconds. An agent that
  creates then immediately searches will conclude the write failed and retry,
  producing duplicates.
- **`hubspot_open_hubspot_ui` is read-tier but leaves the model's world.** It
  hands a URL to the technician; it does not verify that the technician is
  authorised to view what is behind it.
