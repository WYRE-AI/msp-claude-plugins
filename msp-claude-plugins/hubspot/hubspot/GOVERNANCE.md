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
- Removing someone from the organisation clears their per-vendor grants and revokes their gateway refresh tokens at once; a user deactivated in your identity provider is refused on their very next request.

Confirm the live permission grant in the gateway access editor before you rely on a tier in this document. This note does not describe gateway enforcement internals.

## Tool permission tiers

> **Confirm the live grant in the access editor.** The grouping below is a risk reading of what these tools can do. It is not a description of gateway enforcement. Confirm the live permission grant before you rely on a tier in this table.

| Tier | What it can do | Tools |
|---|---|---|
| **Read** | Cannot change HubSpot state. Safe for autonomous agents. | `search_crm_objects`, `get_crm_objects`, `query_crm_data`, `discover_hubspot_schema`, `search_properties`, `get_properties`, `search_owners`, `get_user_details`, `tool_guidance`, and the marketing reads (`read_campaign_data`, `read_social_posts`, `query_segments`, `get_*` report and analytics tools) |
| **Write** | Creates or modifies CRM records and associations. Reversible, internally visible. | `manage_crm_objects` for companies, deals, tickets, notes and tasks |
| **Destructive** | Can cause HubSpot to email a real person, or publishes content. | `manage_crm_objects` on **contacts**; `manage_social_posts`, `manage_blog_post`, `manage_landing_page`, `manage_website_page`, `manage_campaign_objects`, `manage_segment` |

The live connector is HubSpot's own hosted MCP server. Its CRM write tool is
generic: one `manage_crm_objects` call creates or updates any object type,
so the tier above depends on the `objectType` in the arguments, not on the
tool name. **Conduit classifies the 22 read tools above as `read`** (conduit#2480).
`manage_crm_objects` and the other `manage_*` tools are not classified, so they
fail closed to `admin` in the access editor: an agent that writes to HubSpot
needs the `admin` grant, and a `read` grant gives no HubSpot write access.

There is no delete tool, so the destructive tier is not defined by data loss —
it is defined by outbound reach.

Contact writes sit in the destructive tier deliberately. HubSpot workflows
enrol on contact creation and on contact property changes. In a portal with
any lifecycle-stage, lead-status, or list-membership workflow that has an
email action, writing a contact property hands a real named prospect to a
marketing sequence. The plugin sends nothing; HubSpot does, on the strength of
the write — and a sent email cannot be recalled. Company, deal, and ticket
objects carry no email address of their own, which is why writes to them stay
in the write tier by default. A company-, deal- or ticket-based workflow can
still email the contacts associated with the record, so check the portal's
workflows: if any of them sends email on these objects, treat those writes as
destructive too.

`manage_crm_objects` takes a `confirmationStatus`. An agent can set
`CONFIRMED` itself, so treat it as a record of approval, not as a control.

Conduit does not enforce any of that as an approval requirement. Per-call approval is a workflow you impose on your agents, and it is only as good as the agent configuration that carries it.

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
- Only the objects the granted OAuth scopes cover. Scopes are granted at the
  Conduit connect step; an unscoped object returns a permissions error rather than
  partial data.
- No filesystem, no shell, no other vendor's data.
- No workflow, sequence or marketing-email surface. The connector can manage
  campaigns, social posts, segments and CMS pages, but it cannot author,
  inspect, or disable the workflows that a contact write may trigger.
- No sensitive-data (PHI) fields. HubSpot excludes them from the MCP surface
  regardless of portal configuration.

## Data handling

- Responses pass through the gateway into model context for the session and are
  not persisted by this plugin.
- `search_crm_objects` and `get_crm_objects` on contacts return customer and
  prospect PII — names, email addresses, phone numbers, job titles.
- The same tools on deals return commercial data: contract values, MRR,
  forecast category, and close dates across the whole pipeline. A single
  unfiltered search can return the company's entire forecast, and
  `query_crm_data` can aggregate across every object in one SQL call.
- `get_user_details` returns staff identity and the portal ID.
- `search_crm_objects` with a permissive `filterGroups` will page through the
  entire object set. Restrict these if your agents run unattended.

## Known sharp edges

- **Writes fan out to workflows.** Covered above, and it is the single most
  important thing to understand before granting write access. Audit the portal's
  active workflows before letting an agent touch contact properties.
- **`manage_crm_objects` updates are partial, but stage changes are not.** Moving
  a deal to a closed stage can trigger internal notifications, revenue
  recognition, and renewal automation that no longer key off the original
  close date.
- **Domain-based auto-association is silent.** Creating a contact whose email
  domain matches an existing company attaches it to that company without a
  separate association call — and to the wrong company if two clients share a
  parent domain.
- **Search is eventually consistent.** A record created through this plugin may
  not appear in `search_crm_objects` results for several seconds. An agent that
  creates then immediately searches will conclude the write failed and retry,
  producing duplicates.
