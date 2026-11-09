# MarketSharp Plugin

Claude Code plugin for [MarketSharp](https://www.marketsharp.com/), the
CRM used by home-improvement contractors (windows, siding, roofing, baths)
to track leads, sales appointments and jobs. It connects through the
[WYRE Conduit gateway](https://conduit.wyre.ai) and is **read-only**.

## What It Does

- **Lead pipeline** - new inquiries (leads) by date, status and lead source, including the ones that never got an appointment
- **Sales appointments** - what is on the schedule, per salesperson, and how appointments resulted (Sold, No Sale, result reasons)
- **Customer history** - one customer's contact record, inquiries, appointments, jobs and notes, starting from a name, phone or address
- **Sold-job backlog** - jobs and leads changed since a date, with contract totals, contract status and balance due

Typical users are an MSP supporting a contractor client (answering "can
you pull last week's leads?" or preparing a business review), and the
contractor's own office or sales manager.

## Read-only

The MarketSharp server serves **25 tools, all read-only**. There are no
create, update or delete tools: the plugin cannot add notes, log
activities, book appointments, or change any record. Searches and
filtered lists use POST because that is how MarketSharp exposes them;
they do not change data.

In Conduit every MarketSharp tool is classified at the read tier.
**No MarketSharp tool is admin-gated.**

Conduit's connect form mentions that adding notes, activities and
appointments is "off unless an admin turns it on". The current
MarketSharp server does not serve any of those write tools, so there is
nothing to turn on today. Treat this plugin as read-only.

## Connecting

MarketSharp is in preview in Conduit: the connector stays hidden until
the MarketSharp server is released and a live connection has been tested.

You connect once in the Conduit web UI (**Connections → MarketSharp**).
Everyone in your Conduit organization shares that connection.

1. In MarketSharp, open **Admin → Apps & Add-ons Setup → API maintenance**
   and create an API key. Copy the key and its secret.
2. If MarketSharp does not show a secret, ask MarketSharp support to turn
   on API access.
3. In Conduit, fill in the connect form:

| Field | Required | Where to find it |
|-------|----------|------------------|
| **Company ID** | Yes | Shown under your username at the top right of MarketSharp |
| **API Key** | Yes | Admin → Apps & Add-ons Setup → API maintenance |
| **API Secret** | Yes | Shown with the API key. Paste it exactly as MarketSharp shows it |
| **Employee ID** | No | The MarketSharp employee Conduit acts as. Contact, inquiry and job searches and contact notes don't work without it |

Conduit checks the details against MarketSharp's sign-in before it saves
them. Use a MarketSharp employee set up for API access rather than a
person's own login, and give that employee only the permissions the
connection needs.

### Headers sent by `.mcp.json`

If you point a client at Conduit with this plugin's `.mcp.json`, it sends
the same four values as headers. Set these environment variables first:

| Variable | Header | Required |
|----------|--------|----------|
| `MARKETSHARP_COMPANY_ID` | `X-MarketSharp-Company-Id` | Yes |
| `MARKETSHARP_API_KEY` | `X-MarketSharp-Api-Key` | Yes |
| `MARKETSHARP_API_SECRET` | `X-MarketSharp-Api-Secret` | Yes |
| `MARKETSHARP_EMPLOYEE_ID` | `X-MarketSharp-Employee-Id` | No (blank is ignored) |

The endpoint is `https://conduit.wyre.ai/v1/marketsharp/mcp`.

## Installation

```
/plugin marketplace add WYRE-AI/msp-claude-plugins
/plugin install marketsharp
```

## Skills

| Skill | Description |
|-------|-------------|
| `api-patterns` | Tool surface, Conduit headers, the Employee ID requirement, paging, record caps, errors, rate limits |
| `lead-pipeline` | Inquiry (lead) volume, statuses, lead sources and product interests over a date range |
| `sales-appointments` | Appointment schedule, salesperson workload, results and close rate |
| `customer-history` | Find a customer and assemble their inquiries, appointments, jobs and notes |
| `job-backlog` | Sold jobs, contract totals, contract status and balance due from the opportunities list |

## Agents

| Agent | Use For |
|-------|---------|
| `sales-pipeline-reviewer` | A weekly or monthly sales review for one contractor: leads in, appointments set and run, close rate by salesperson and lead source, and new sold jobs |

## Tools

All 25 tools are listed flat, with no navigation step.

| Area | Tools |
|------|-------|
| Company | `marketsharp_companies_list`, `marketsharp_companies_get`, `marketsharp_search_global` |
| Contacts | `marketsharp_contacts_get`, `marketsharp_contacts_search`, `marketsharp_contacts_list` |
| Inquiries (leads) | `marketsharp_inquiries_get`, `marketsharp_inquiries_list`, `marketsharp_inquiries_search`, `marketsharp_inquiries_list_by_contact`, `marketsharp_inquiry_statuses_list`, `marketsharp_inquiry_notes_list` |
| Appointments | `marketsharp_appointments_get`, `marketsharp_appointments_list`, `marketsharp_appointments_list_by_contact`, `marketsharp_appointment_results_list` |
| Jobs | `marketsharp_jobs_get`, `marketsharp_jobs_search`, `marketsharp_opportunities_list` |
| Notes | `marketsharp_notes_list` |
| Reference lists | `marketsharp_activity_types_list`, `marketsharp_employees_list`, `marketsharp_lead_sources_list`, `marketsharp_product_interests_list`, `marketsharp_divisions_list` |

`marketsharp_contacts_search`, `marketsharp_inquiries_search`,
`marketsharp_jobs_search` and `marketsharp_notes_list` need an Employee ID
on the connection and run with that employee's MarketSharp permissions.

## Not Covered

Calendar, texting, email, PaySimple, QuickBooks, CompanyCam, automation
rules, analytics, estimates, and every admin or configuration change.

## License

Apache-2.0
