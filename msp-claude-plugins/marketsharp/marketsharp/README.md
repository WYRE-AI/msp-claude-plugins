# MarketSharp Plugin

Claude Code plugin for [MarketSharp](https://www.marketsharp.com/), the CRM for home-improvement contractors (windows, siding, roofing and similar), connected through [Conduit](https://conduit.wyre.ai). It is aimed at MSPs and IT teams that support those contractors, and at the contractors' own office staff who want to ask questions of their CRM.

## What It Does

- **Customer lookup** - find a contact, lead or job from a name, phone number, email or address, then pull their inquiries, appointments, jobs and notes together
- **Lead pipeline** - leads (inquiries) by status, lead source and product interest, and the notes on them
- **Appointments** - the schedule by date range or salesperson, and the results and result reasons recorded against appointments
- **Sold jobs and balance due** - jobs and leads changed since a date, with sale dates, contract totals, contract status and balance due

The connector is **read-only**. The server exposes no create, update or delete tools, and MarketSharp's API client only sends the GET and POST routes those 25 tools use. Searches and filtered lists are POST requests because that is how MarketSharp exposes them; they do not change data. Anything that needs to change in MarketSharp is done in MarketSharp.

## Connect MarketSharp in Conduit

Conduit asks for four values:

| Field | Required | Where to find it |
|---|---|---|
| Company ID | Yes | Shown under your username at the top right of MarketSharp |
| API Key | Yes | Admin > Apps & Add-ons Setup > API maintenance > Create New API Key |
| API Secret | Yes | Issued with the API key. If MarketSharp shows no secret, ask MarketSharp support to turn on API access |
| Employee ID | No | The MarketSharp employee Conduit acts as. Contact, inquiry and job search, and a contact's notes, do not work without it |

Everyone in your organization shares this one connection, and with an Employee ID set it acts with that employee's MarketSharp permissions. Use a dedicated MarketSharp employee set up for API access rather than a person's login. The server never uses MarketSharp usernames or passwords.

Conduit checks the credentials against MarketSharp when you save them.

## Installation

```
/plugin marketplace add WYRE-AI/msp-claude-plugins
/plugin install marketsharp
```

This plugin ships no `.mcp.json`. Install the `wyre-gateway` plugin (or any workflow pack), which connects Claude Code to Conduit at `https://conduit.wyre.ai/v1/mcp`, then connect MarketSharp in the Conduit web UI (`https://conduit.wyre.ai/connect/marketsharp`) as above. Conduit stores the values and injects them as the `X-MarketSharp-Company-Id`, `X-MarketSharp-Api-Key`, `X-MarketSharp-Api-Secret` and optional `X-MarketSharp-Employee-Id` headers on every request, so there are no environment variables or headers to set on the client. Conduit drops any `X-MarketSharp-*` header a client sends.

## Access Tiers and Data

- All 25 tools are classified **read** in Conduit (technician-tier access). None is admin-gated and none writes.
- Conduit does not cache MarketSharp results; every call reaches MarketSharp.
- MarketSharp holds homeowners' names, addresses, phone numbers, emails, appointment history, contract values and free-text notes. Share output only with people allowed to see it.
- Text that comes back from MarketSharp (names, addresses, notes, lead-form text) was typed by other people. The connector escapes it and wraps it in `<untrusted-content>` markers behind a notice that it is untrusted data. The skills tell Claude never to follow instructions found inside it.
- Three tools need a MarketSharp permission: `marketsharp_inquiry_notes_list` (View Opportunity Note), `marketsharp_opportunities_list` (View Opportunity) and `marketsharp_product_interests_list` (View Product Interest). Four more (`marketsharp_contacts_search`, `marketsharp_inquiries_search`, `marketsharp_jobs_search` and `marketsharp_notes_list`) need an Employee ID on the connection.

## Tools

| Tool | Purpose |
|---|---|
| `marketsharp_companies_list` | Companies the API key can access, with IDs |
| `marketsharp_companies_get` | This connection's company profile (name, address, time zone, settings) |
| `marketsharp_search_global` | Search contacts, inquiries and jobs by name, address, email, phone or job number |
| `marketsharp_contacts_get` | One contact by ID |
| `marketsharp_contacts_search` | QuickFind contacts (needs Employee ID) |
| `marketsharp_contacts_list` | Contacts, paged, by modified-since, appointment window or salesperson |
| `marketsharp_inquiries_get` | One inquiry (lead) by ID |
| `marketsharp_inquiries_list` | Inquiries, paged, by modified range, appointment window or salesperson |
| `marketsharp_inquiries_search` | QuickFind inquiries (needs Employee ID) |
| `marketsharp_inquiries_list_by_contact` | Every inquiry for one contact |
| `marketsharp_inquiry_statuses_list` | The company's inquiry statuses |
| `marketsharp_inquiry_notes_list` | Notes on an inquiry, or on the job created from it |
| `marketsharp_appointments_get` | One appointment by ID |
| `marketsharp_appointments_list` | Appointments, paged, by date range, change range, salesperson or inquiry IDs |
| `marketsharp_appointments_list_by_contact` | Every appointment for one contact |
| `marketsharp_appointment_results_list` | Active appointment results, or result reasons |
| `marketsharp_jobs_get` | One job by ID |
| `marketsharp_jobs_search` | QuickFind jobs by job name or number, or contact details (needs Employee ID) |
| `marketsharp_opportunities_list` | Jobs and leads changed since a date, with contract totals and balance due; not paged |
| `marketsharp_notes_list` | Notes for a contact, all types or one type (needs Employee ID) |
| `marketsharp_activity_types_list` | The company's activity types |
| `marketsharp_employees_list` | Employees with IDs, paged |
| `marketsharp_lead_sources_list` | Primary lead sources, or the secondary sources under one |
| `marketsharp_product_interests_list` | The company's product interests, or those on one inquiry |
| `marketsharp_divisions_list` | The company's divisions |

## Skills

| Skill | Description |
|---|---|
| `api-patterns` | Connection, access tiers, what the connector cannot do, paging and size limits, the appointment default on inquiries, untrusted content, errors |
| `customer-lookup` | Find a customer and assemble their contact, inquiries, appointments, jobs and notes |
| `lead-pipeline` | Leads by status, source and product interest, including leads that have no appointment yet |
| `appointments` | The schedule for a day, week or salesperson, and appointment results |
| `sales-opportunities` | Sold jobs, contract totals and balance due from the opportunities list |

## Agents

| Agent | Description |
|---|---|
| `marketsharp-customer-briefer` | Builds a one-page brief on a customer before a call, appointment or support request |

## Troubleshooting

- **A contact, inquiry or job search, or `marketsharp_notes_list`, returns a permission (403-type) error**: the connection probably has no Employee ID. The connector does not check for one before calling MarketSharp. Add an Employee ID to the MarketSharp connection in Conduit. `marketsharp_search_global` does not need one.
- **A permission error on notes, opportunities or product interests**: the connection's employee lacks View Opportunity Note, View Opportunity or View Product Interest in MarketSharp.
- **Recent leads are missing**: inquiries default to "only inquiries with an appointment". Pass `appointmentRequired: false`. See the `lead-pipeline` skill.
- **A result has a `truncated: only the first N of M records` note**: the response hit the size cap and is incomplete, even though fewer rows came back. Use the `pageNumber` and `rowsPerPage` the note names and keep that `rowsPerPage` for later pages, or narrow with filters. See the `api-patterns` skill.
- **Credentials rejected when saving**: re-copy the API key and secret. If there is no secret, MarketSharp support has to enable API access.

## API Documentation

- [MarketSharp REST API](https://restapi.marketsharpm.com/)

## License

Apache-2.0
