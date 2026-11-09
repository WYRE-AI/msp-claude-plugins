# Alga PSA Plugin

Claude plugin for [Alga PSA](https://github.com/Nine-Minds/alga-psa), the open-source PSA
from Nine Minds, through the Conduit gateway. Backed by
[`WYRE-AI/alga-psa-mcp`](https://github.com/WYRE-AI/alga-psa-mcp): 42 hand-written tools
over your own Alga instance (Nine Minds hosted or self-hosted).

## Read-only

Every tool is a plain read. The connector cannot create, change or delete anything in
Alga: its HTTP client only sends `GET` requests, and Conduit's catalog marks all 42 tools
as reads. No tool is admin-gated in Conduit and there is no write tier to turn on.
Closing a ticket, approving a time sheet or sending an invoice still happens in the
Alga UI. The skills here say so where it matters, and draft the change for a human to
make instead.

## What It Does

- **Ticket triage**: open queues by board, priority and assignee, stale and unassigned
  tickets, full ticket history with comments, time and linked assets, related knowledge
  articles.
- **Client review**: one client's tickets, time, invoices, contracts, assets and projects
  over a period, for a QBR or account review.
- **Time and billing checks**: time sheets waiting for approval, non-billable time,
  overdue and draft invoices, invoice line items.
- **Project status**: projects by client, phases, tasks and the status each task sits in.

## Status

The Alga PSA connector is new in Conduit and is hidden from the catalog until its
rollout checks pass. If you can't find **Alga PSA** under Connections, ask your Conduit
admin to enable it.

## Installation

```
/plugin marketplace add WYRE-AI/msp-claude-plugins
/plugin install alga-psa
```

The plugin connects through [Conduit](https://conduit.wyre.ai) at
`https://conduit.wyre.ai/v1/alga-psa/mcp`.

## Configuration

### 1. Create a least-privilege Alga user and key

Conduit's connect note:

> Create a dedicated Alga user with a read-only role, then create an API key under that
> user's Profile → API Keys. The key gets everything its user can do, so keep the role
> read-only. Use the https:// address you sign in to Alga with and nothing after the
> domain. Leave Tenant ID blank unless Alga support gives you one.

The role needs read access to tickets, clients, contacts, time, projects, assets,
invoices and knowledge articles, plus the lookups the tools use (boards, statuses,
priorities, categories, services, contracts, users, teams). Alga's role decides which
records the tools can see: a record the user can't see comes back as not found. See the
sidecar's [least-privilege guide](https://github.com/WYRE-AI/alga-psa-mcp#least-privilege-setup-in-alga).

### 2. Connect in Conduit

Paste the values into Conduit (**Connections → Alga PSA**), or set them as environment
variables for the plugin's `.mcp.json`:

| Conduit field | Variable | Header | Required | Notes |
|---|---|---|---|---|
| Alga Instance URL | `ALGA_PSA_INSTANCE_URL` | `X-Alga-Instance-Url` | Yes | The `https://` address you sign in to Alga with, no path. Example: `https://psa.example.com` |
| API Key | `ALGA_PSA_API_KEY` | `X-Alga-Api-Key` | Yes | From the dedicated user's Profile → API Keys |
| Tenant ID | `ALGA_PSA_TENANT_ID` | `X-Alga-Tenant-Id` | No | Leave blank unless Alga support asks for it; a wrong value makes every request fail |

```bash
export ALGA_PSA_INSTANCE_URL="https://psa.example.com"
export ALGA_PSA_API_KEY="your-alga-api-key"
# export ALGA_PSA_TENANT_ID="only-if-alga-support-gave-you-one"
```

Conduit checks the instance URL when you connect: it must be a public `https://`
address. Private and internal addresses are refused, and the connector never follows
redirects.

## Skills

- `api-patterns`: auth headers, the read-only tool surface, pagination styles,
  truncation, errors, concurrency and retry limits, untrusted content.
- `ticket-triage`: queue review, stale and unassigned tickets, single-ticket deep dives.
- `client-review`: per-client activity summary for QBRs and account reviews.
- `time-and-billing`: time sheet approval backlog, billable vs non-billable time,
  overdue and draft invoices.
- `project-status`: project, phase and task status reporting.

## Agents

- `alga-client-review-analyst`: builds a full per-client review (tickets, time,
  invoices, contracts, assets, projects) for a QBR or account health check.

## Tools

All 42 tools are reads. None is admin-gated in Conduit.

| Area | Tools |
|---|---|
| Tickets | `alga_tickets_list`, `alga_tickets_get`, `alga_tickets_search`, `alga_tickets_comments_list`, `alga_tickets_time_entries_list`, `alga_tickets_assets_list`, `alga_tickets_get_by_external_link` |
| Clients | `alga_clients_list`, `alga_clients_get`, `alga_clients_locations_list`, `alga_clients_contacts_list` |
| Contacts | `alga_contacts_list`, `alga_contacts_get`, `alga_contacts_search` |
| Time | `alga_time_entries_list`, `alga_time_entries_get`, `alga_time_sheets_list` |
| Projects | `alga_projects_list`, `alga_projects_get`, `alga_projects_phases_list`, `alga_projects_tasks_list`, `alga_projects_tasks_get`, `alga_projects_task_status_mappings_list` |
| Assets | `alga_assets_list`, `alga_assets_get`, `alga_assets_search` |
| Invoices | `alga_invoices_list`, `alga_invoices_get`, `alga_invoices_items_list` |
| People and lookups | `alga_users_list`, `alga_users_get`, `alga_teams_list`, `alga_boards_list`, `alga_statuses_list`, `alga_priorities_list`, `alga_ticket_categories_list`, `alga_services_list`, `alga_contracts_list` |
| Schedules | `alga_schedules_list` |
| Knowledge base | `alga_kb_articles_list`, `alga_kb_articles_get` |
| Cross-record search | `alga_search` |

## Limitations

- Read-only. Nothing in Alga can be changed through this plugin.
- Results are only as wide as the API key's user role allows.
- One connection runs at most 4 Alga calls at once; a fifth fails straight away and
  can be retried.
- Responses over 100 KiB are trimmed, and Alga responses over 1 MiB are refused. Narrow
  filters or lower `limit` when that happens.
- Tested against mocked Alga responses in the sidecar; behaviour on your instance
  depends on your Alga version and role setup.

## License

Apache-2.0
