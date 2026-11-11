---
description: Create a new deal in HubSpot with company association
argument-hint: "<company> <name> <amount> [stage] [close_date] [pipeline] [contact]"
arguments: [company, name, amount, stage, close_date, pipeline, contact]
---

# Create HubSpot Deal

Create a new deal in HubSpot CRM and associate it with a company and optionally a contact. Used to track new sales opportunities through the pipeline.

## Prerequisites

- HubSpot MCP server connected with valid OAuth credentials
- MCP tools `search_crm_objects` (`objectType: "companies"`), `search_crm_objects` (`objectType: "contacts"`), `manage_crm_objects` (`createRequest`, `objectType: "deals"`), and `manage_crm_objects` (`updateRequest` with `associations`) available. `manage_crm_objects` is not classified in Conduit, so it needs the `admin` grant
- Company must exist in HubSpot
- Contact (if specified) must exist in HubSpot

## Steps

1. **Resolve company** - Find the company by name or use the provided ID

   - If a name was provided, call `search_crm_objects` (`objectType: "companies"`) with `name` filter using `CONTAINS_TOKEN`
   - If an ID was provided, call `get_crm_objects` (`objectType: "companies"`) with `objectIds: [<companyId>]`
   - Confirm the company exists before proceeding

2. **Resolve contact** (if specified) - Find the contact by name or use the provided ID

   - If a name was provided, call `search_crm_objects` (`objectType: "contacts"`) with `firstname` and `lastname` filters
   - If an ID was provided, call `get_crm_objects` (`objectType: "contacts"`) with `objectIds: [<contactId>]`

3. **Get approval** - Show the resolved company (and contact), the deal properties and the associations you will create, and wait for the user to approve. Do not call `manage_crm_objects` before approval, and ask again before any later change.

4. **Create the deal** with the approved properties

   Call `manage_crm_objects` (`createRequest`, `objectType: "deals"`) with:
   - `dealname`: The deal name
   - `amount`: The deal amount
   - `dealstage`: The pipeline stage
   - `pipeline`: The pipeline ID
   - `closedate`: The expected close date
   - `dealtype`: `newbusiness` (default)

5. **Associate with company** - Link the deal to the company

   Call `manage_crm_objects` with an `updateRequest` on the deal (`objectType: "deals"`, its `objectId`) and `associations: [{ targetObjectType: "COMPANY", targetObjectId: <id> }]`

6. **Associate with contact** (if specified) - Link the deal to the contact

   Call `manage_crm_objects` with an `updateRequest` on the deal (`objectType: "deals"`, its `objectId`) and `associations: [{ targetObjectType: "CONTACT", targetObjectId: <id> }]`

7. **Log creation note** - Document the deal creation

   Call `manage_crm_objects` (`createRequest`, `objectType: "notes"`) with a summary of the deal and associate it with the deal

8. **Present deal summary**

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| company | string | Yes | - | Company name or ID |
| name | string | Yes | - | Deal name |
| amount | number | Yes | - | Deal amount |
| stage | string | No | appointmentscheduled | Pipeline stage |
| close_date | string | No | +30 days | Close date (YYYY-MM-DD) |
| pipeline | string | No | default | Pipeline name or ID |
| contact | string | No | - | Contact name or ID |

## Examples

### Basic Deal Creation

```
/create-deal --company "Acme Corp" --name "Managed IT Services" --amount 5000
```

### Deal with Stage and Close Date

```
/create-deal --company "Acme Corp" --name "Network Upgrade Project" --amount 12000 --stage proposalpending --close_date 2026-04-15
```

### Deal with Contact Association

```
/create-deal --company "Acme Corp" --name "Endpoint Protection" --amount 2400 --contact "John Smith"
```

### Full Deal Creation

```
/create-deal --company "Beta Inc" --name "Managed IT Services" --amount 8000 --stage qualifiedtobuy --close_date 2026-05-01 --pipeline default --contact "Jane Doe"
```

## Output

### Deal Created Successfully

```
Deal Created Successfully
================================================================

Deal ID:        54321
Deal Name:      Acme Corp - Managed IT Services
Amount:         $5,000
Stage:          Appointment Scheduled (20% probability)
Pipeline:       Sales Pipeline
Close Date:     2026-03-26
Owner:          Sarah Johnson (current user)
Created:        2026-02-24

Associations:
  - Company: Acme Corporation (ID: 98765)
  - Contact: John Smith (ID: 12345)

Annual Value:   $60,000

Next Steps:
  - Update stage as conversations progress
  - Log activities: /log-activity --deal "Acme Corp - Managed IT Services"
  - View pipeline: /pipeline-summary
  - Search deals: /search-deals --company "Acme Corporation"
================================================================
```

### Company Not Found

```
Company not found: "Unknown Corp"

Suggestions:
  - Check spelling of the company name
  - Try a partial name match (e.g., "Unknown" instead of "Unknown Corp")
  - Search companies: /lookup-company "company name"
  - Create the company first in HubSpot before creating a deal
```

### Contact Not Found

```
Contact not found: "Unknown Person"

Suggestions:
  - Check spelling of the contact name
  - Search contacts: /search-contacts "person name"
  - Create the deal without a contact association (it can be added later)
  - Create the contact first in HubSpot
```

### Invalid Stage

```
Error: Invalid deal stage "badstage"

Valid stages (default pipeline):
  - appointmentscheduled (Appointment Scheduled)
  - qualifiedtobuy (Qualified to Buy)
  - presentationscheduled (Presentation Scheduled)
  - decisionmakerboughtin (Decision Maker Bought-In)
  - contractsent (Contract Sent)
  - closedwon (Closed Won)
  - closedlost (Closed Lost)

Note: Your HubSpot account may have custom stages.
```

## Error Handling

### MCP Connection Error

```
Error: Unable to connect to HubSpot MCP server

Check your MCP configuration and verify credentials at developers.hubspot.com
```

### Rate Limit

```
Error: Rate limit exceeded (429)

HubSpot allows 100 requests per 10 seconds.
Please wait a moment and try again.
```

## MCP Tools Used

| Tool | Purpose |
|------|---------|
| `search_crm_objects` (`objectType: "companies"`) | Find company by name |
| `get_crm_objects` (`objectType: "companies"`) | Get company by ID |
| `search_crm_objects` (`objectType: "contacts"`) | Find contact by name |
| `get_crm_objects` (`objectType: "contacts"`) | Get contact by ID |
| `manage_crm_objects` (`createRequest`, `objectType: "deals"`) | Create the deal record |
| `manage_crm_objects` (`updateRequest` with `associations`) | Link deal to company and contact |
| `manage_crm_objects` (`createRequest`, `objectType: "notes"`) | Log deal creation note |

## Related Commands

- `/search-deals` - Find existing deals
- `/pipeline-summary` - View full pipeline overview
- `/lookup-company` - Look up a company before creating a deal
- `/log-activity` - Log follow-up activities on the deal
