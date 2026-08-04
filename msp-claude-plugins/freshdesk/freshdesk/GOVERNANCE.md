# Freshdesk plugin — governance and safety model

Unofficial. Community-built plugin for the Freshdesk API. Not affiliated
with, endorsed by, or sponsored by the vendor.

## What it connects as

This plugin does not hold credentials. It reaches Freshdesk through the
WYRE Conduit gateway (`https://conduit.wyre.ai/v1/mcp`), which brokers
authentication centrally and scopes every call to the helpdesk the
operator is authorised for.

- No Freshdesk API key or helpdesk domain is stored on the technician's
  machine, in this repo, or in the model's context. The gateway holds the
  `X-Freshdesk-Domain` and `X-Freshdesk-Api-Key` pair and translates it
  into the upstream HTTP Basic `apikey:X` credential.
- Credential rotation happens once at the gateway, not per technician.
- Every call carries operator identity, so the gateway audit log answers
  "who sent that reply to the customer". Freshdesk's own activity log
  records only the API key's agent account, so without the gateway every
  action looks like it came from one shared robot.
- Revoking gateway access revokes Freshdesk access with it, immediately.

## Tool permission tiers

| Tier | What it can do | Tools |
|---|---|---|
| **Read** | Cannot change Freshdesk state. Safe for autonomous agents. | `freshdesk_status`, `freshdesk_navigate`, `freshdesk_tickets_list`, `freshdesk_tickets_get`, `freshdesk_tickets_search`, `freshdesk_tickets_list_conversations`, `freshdesk_contacts_list`, `freshdesk_contacts_get`, `freshdesk_contacts_search`, `freshdesk_contacts_autocomplete`, `freshdesk_companies_list`, `freshdesk_companies_get`, `freshdesk_companies_search`, `freshdesk_companies_autocomplete`, `freshdesk_agents_list`, `freshdesk_agents_get`, `freshdesk_agents_me`, `freshdesk_groups_list`, `freshdesk_groups_get`, `freshdesk_sla_list`, `freshdesk_business_hours_list`, `freshdesk_business_hours_get`, `freshdesk_canned_responses_list_folders`, `freshdesk_canned_responses_get_folder`, `freshdesk_canned_responses_list_responses`, `freshdesk_solutions_categories_list`, `freshdesk_solutions_categories_get`, `freshdesk_solutions_folders_list`, `freshdesk_solutions_folders_get`, `freshdesk_solutions_articles_list`, `freshdesk_solutions_articles_get` |
| **Write** | Creates or modifies records. Reversible, but visible to the customer. | `freshdesk_tickets_create`, `freshdesk_tickets_update`, `freshdesk_tickets_add_note`, `freshdesk_tickets_update_conversation`, `freshdesk_contacts_create`, `freshdesk_contacts_update`, `freshdesk_contacts_restore`, `freshdesk_companies_create`, `freshdesk_companies_update`, `freshdesk_groups_create`, `freshdesk_groups_update`, `freshdesk_agents_update`, `freshdesk_solutions_categories_create`, `freshdesk_solutions_categories_update`, `freshdesk_solutions_folders_create`, `freshdesk_solutions_folders_update`, `freshdesk_solutions_articles_create`, `freshdesk_solutions_articles_update` |
| **Destructive** | Emails a customer, deletes data, grants access, or changes billing. Requires explicit per-call human approval. | `freshdesk_tickets_reply`, `freshdesk_contacts_send_invite`, `freshdesk_contacts_merge`, `freshdesk_contacts_make_agent`, `freshdesk_agents_create`, `freshdesk_agents_delete`, `freshdesk_sla_create`, `freshdesk_sla_update`, `freshdesk_tickets_delete`, `freshdesk_tickets_delete_conversation`, `freshdesk_contacts_soft_delete`, `freshdesk_contacts_hard_delete`, `freshdesk_companies_delete`, `freshdesk_groups_delete`, `freshdesk_solutions_categories_delete`, `freshdesk_solutions_folders_delete`, `freshdesk_solutions_articles_delete` |

Four of those destructive entries look like ordinary writes in the API and
are worth justifying:

- **`freshdesk_tickets_reply`** does not write a record — it sends an
  email to the customer, from your helpdesk, in your company's name.
  There is no unsend. Treat it exactly as you would treat letting an
  agent send mail from a shared mailbox. `freshdesk_contacts_send_invite`
  is the same hazard pointed at the customer portal.
- **`freshdesk_contacts_merge`** re-points the ticket history of every
  secondary contact at the primary and is not reversible through the API.
  Merging the wrong pair silently rewrites who asked for what.
- **`freshdesk_contacts_make_agent` and `freshdesk_agents_create`** each
  consume a licensed seat, which changes your Freshdesk bill, and grant a
  human access to every ticket in the account. That is an access grant,
  not a profile edit.
- **`freshdesk_sla_create` / `freshdesk_sla_update`** re-compute `due_by`
  and `fr_due_by` across the live queue. A single policy edit can put
  tickets into breach retrospectively and change what your SLA reports —
  and any contractual credits derived from them — say.

## Recommended agent policy

The safe default is **read autonomously, propose writes, never
self-approve destructive calls.**

- Read tools: allow. Triage sweeps, SLA-risk reporting, and requester
  enrichment are the intended autonomous use.
- Write tools: agent drafts the exact call, human approves, then it runs.
- Destructive tools: require a named human approver per invocation. Do
  not grant these to scheduled or unattended agents. In particular, an
  unattended agent with `freshdesk_tickets_reply` is an unattended agent
  that emails your customers.

## What it cannot reach

- Only the Freshdesk helpdesk domain mapped to the operator's gateway
  identity. Freshdesk credentials are per-helpdesk; there is no
  cross-account or reseller view, so one credential means one tenant.
- The API key inherits the permissions of the agent it belongs to. A
  restricted agent's key cannot see tickets outside its groups, and tools
  will return 403 rather than partial data.
- No filesystem, no shell, no other vendor's data.
- No live event stream. Every tool is point-in-time; Freshdesk webhooks
  and automations carry the push feed.

## Data handling

- Responses pass through the gateway into model context for the session
  and are not persisted by this plugin.
- Customer PII is the default payload here, not an edge case.
  `freshdesk_contacts_*` returns names, email addresses, phone and mobile
  numbers, and job titles. `freshdesk_companies_*` returns account
  domains and commercial health/tier fields.
- `freshdesk_tickets_get` with conversations, and
  `freshdesk_tickets_list_conversations`, return the full customer
  message thread. End users paste passwords, account numbers, and
  screenshots into tickets; assume this content is sensitive regardless
  of what the ticket is about.
- `freshdesk_agents_*` returns your own staff's PII.
- Restrict all of the above if your agents run unattended.

## Known sharp edges

- **Closing a ticket is a reporting event, not a state flag.** Setting
  `status` to Resolved (4) or Closed (5) via `freshdesk_tickets_update`
  stops the SLA clock and stamps the resolution timestamps that
  attainment reports read as final. Reopening restores the ticket but not
  the original measurement. Bulk-closing a stale queue will quietly
  rewrite last month's numbers.
- **Public notes are not private notes.** `freshdesk_tickets_add_note`
  defaults matter: `private: false` publishes the note to the requester
  in the portal. An agent that drops its internal reasoning into a note
  without setting `private: true` has just shown the customer its
  working.
- **Publishing is a status field.** `freshdesk_solutions_articles_update`
  can move an article from draft to published, putting content on the
  public support portal. The tool name gives no hint that it does this.
- **Search silently truncates.** Ticket and contact search cap at 30
  results per page and 10 pages — 300 records total. An agent that
  reasons over "all matching tickets" from an unnarrowed query is
  reasoning over an arbitrary subset, with no error to signal it.
- **Rate limits are per-minute and per-plan.** Long autonomous sweeps
  degrade mid-task with 429s; honour `Retry-After` rather than retrying
  tightly.
