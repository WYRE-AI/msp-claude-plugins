# Freshdesk Plugin

Claude Code plugin for [Freshdesk](https://www.freshworks.com/freshdesk/) - cloud helpdesk/PSA ticketing for MSP teams: tickets, conversations, contacts, companies, knowledge base, SLA policies, and business hours.

## What It Does

- **Ticketing** - List, search, create, update, reply, and add notes to tickets; pull full conversation threads
- **Contacts & companies** - Resolve requesters to contacts and contacts to companies; CRUD, merge, and make-agent operations
- **Knowledge base** - Navigate the nested solutions hierarchy (categories -> folders -> articles) and suggest KB articles for tickets
- **SLA & business hours** - Inspect SLA policies and business-hours calendars that drive `due_by` / `fr_due_by` and breach detection

## Installation

```
/plugin marketplace add wyre-technology/msp-claude-plugins
/plugin install freshdesk
```

The plugin connects through the [WYRE MCP Gateway](https://mcp.wyre.ai) at `https://mcp.wyre.ai/v1/freshdesk/mcp`.

## Configuration

| Variable | Required | Description |
|----------|----------|-------------|
| `FRESHDESK_DOMAIN` | Yes | Freshdesk account subdomain (sent as the `X-Freshdesk-Domain` header) |
| `FRESHDESK_API_KEY` | Yes | Freshdesk API key (sent as the `X-Freshdesk-Api-Key` header) |

The gateway maps `FRESHDESK_DOMAIN` onto the `X-Freshdesk-Domain` header and `FRESHDESK_API_KEY` onto the `X-Freshdesk-Api-Key` header. The MCP server translates these into the upstream Freshdesk HTTP Basic auth (`apikey:X`) automatically.

```bash
export FRESHDESK_DOMAIN="yourcompany"
export FRESHDESK_API_KEY="your-freshdesk-api-key"
```

## Skills

- `api-patterns` - Auth headers, base URL, pagination, rate limits, and the search query language
- `ticketing` - Tickets, conversations, replies, notes; status/priority/source encodings and triage workflow
- `contacts-companies` - Contacts and companies; resolving requester -> contact -> company
- `knowledge-base` - Nested solutions (categories -> folders -> articles); suggesting KB articles for tickets
- `sla-business-hours` - SLA policies and business hours; how targets drive `due_by` / `fr_due_by` and breach detection

## Agents

- `freshdesk-triage` - Searches and summarizes open tickets, then suggests routing and priority

## Commands

- `/search-tickets` - Search Freshdesk tickets via the query language (query, status, priority)
- `/ticket-summary` - Pull a ticket and its conversations and produce a concise summary with a next-action suggestion

## Tools

Provided by the Freshdesk MCP server through the WYRE MCP Gateway. Tool names follow `freshdesk_<domain>_<action>` and are illustrative of the MCP surface.

### Tickets
- `freshdesk_tickets_list`, `freshdesk_tickets_get`, `freshdesk_tickets_search`
- `freshdesk_tickets_create`, `freshdesk_tickets_update`
- `freshdesk_tickets_reply`, `freshdesk_tickets_add_note`, `freshdesk_tickets_conversations`

### Contacts & Companies
- `freshdesk_contacts_list`, `freshdesk_contacts_get`, `freshdesk_contacts_search`
- `freshdesk_contacts_create`, `freshdesk_contacts_update`, `freshdesk_contacts_merge`, `freshdesk_contacts_make_agent`
- `freshdesk_companies_list`, `freshdesk_companies_get`, `freshdesk_companies_search`
- `freshdesk_companies_create`, `freshdesk_companies_update`

### Agents & Groups
- `freshdesk_agents_list`, `freshdesk_agents_get`
- `freshdesk_groups_list`, `freshdesk_groups_get`

### Knowledge Base (Solutions)
- `freshdesk_solutions_categories_list`, `freshdesk_solutions_folders_list`
- `freshdesk_solutions_articles_list`, `freshdesk_solutions_articles_get`, `freshdesk_solutions_articles_search`

### SLA & Business Hours
- `freshdesk_sla_policies_list`, `freshdesk_business_hours_list`

## License

Apache-2.0
