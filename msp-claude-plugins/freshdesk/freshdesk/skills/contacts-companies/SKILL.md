---
name: "Freshdesk Contacts & Companies"
when_to_use: "When working with Freshdesk contacts and companies — looking up, creating, updating, merging, or converting them, and resolving a ticket requester to a contact and company"
description: >
  Use this skill when working with Freshdesk contacts and companies — contact
  CRUD, merge, make_agent, and search; company CRUD and search; and the common
  MSP workflow of resolving a ticket requester to a contact and then to its
  parent company through the Freshdesk REST API v2.
triggers:
  - freshdesk contact
  - freshdesk company
  - freshdesk requester
  - merge contact freshdesk
  - make agent freshdesk
  - search contacts freshdesk
  - resolve requester freshdesk
  - freshdesk customer
---

# Freshdesk Contacts & Companies

## Overview

In Freshdesk, **contacts** are the people who raise tickets (requesters) and
**companies** group those contacts into the organizations an MSP serves.
Resolving a ticket's requester to a contact, and that contact to its company,
is the foundation for account-level context, SLA association, and reporting.
This skill covers contact and company operations through tools named
`freshdesk_contacts_<action>` and `freshdesk_companies_<action>`.

## Contacts

### Key Contact Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | Integer | System | Auto-generated unique identifier |
| `name` | String | Yes | Full name |
| `email` | String | One of email/phone/mobile | Primary email |
| `phone` | String | One of email/phone/mobile | Landline |
| `mobile` | String | One of email/phone/mobile | Mobile number |
| `company_id` | Integer | No | Associated company |
| `job_title` | String | No | Role at the company |
| `tags` | Array | No | Free-form labels |

A contact must have at least one of `email`, `phone`, `mobile`, `twitter_id`,
or `unique_external_id`.

### Contact Operations

| Action | Endpoint | Notes |
|--------|----------|-------|
| List | `GET /api/v2/contacts` | Filter with `email`, `mobile`, `phone`, `company_id`, `updated_since` |
| Get | `GET /api/v2/contacts/{id}` | Single contact |
| Search | `GET /api/v2/search/contacts?query="..."` | Query language; 300-result cap |
| Create | `POST /api/v2/contacts` | `name` + one contact channel required |
| Update | `PUT /api/v2/contacts/{id}` | Partial update |
| Merge | `POST /api/v2/contacts/merge` | Combine duplicates into a primary |
| Make agent | `PUT /api/v2/contacts/{id}/make_agent` | Convert a contact into an agent |

### Create a Contact

```json
{
  "name": "John Smith",
  "email": "john.smith@acme.com",
  "company_id": 5001,
  "job_title": "Office Manager"
}
```

### Search Contacts

```http
GET /api/v2/search/contacts?query="email:'john.smith@acme.com'"
```

The query language wraps the expression in double quotes and quotes string
values. Search returns up to 30 results per page and a maximum of 10 pages
(300 records).

### Merge Duplicate Contacts

```http
POST /api/v2/contacts/merge
```
```json
{
  "primary_contact_id": 1001,
  "secondary_contact_ids": [1002, 1003]
}
```

Tickets and history from the secondary contacts are re-pointed at the primary.
Confirm which record should be primary before merging — merges are not easily
reversible.

### Make a Contact an Agent

```http
PUT /api/v2/contacts/{id}/make_agent
```

Converts a customer contact into a Freshdesk agent. This is a privileged,
billing-affecting change — flag it explicitly before invoking.

## Companies

### Key Company Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | Integer | System | Auto-generated unique identifier |
| `name` | String | Yes | Company name (unique) |
| `domains` | Array | No | Email domains used to auto-associate contacts |
| `description` | String | No | Notes about the company |
| `note` | String | No | Internal note |
| `health_score` | String | No | Account health indicator |
| `account_tier` | String | No | Service tier |

### Company Operations

| Action | Endpoint | Notes |
|--------|----------|-------|
| List | `GET /api/v2/companies` | Paginated with `page` / `per_page` |
| Get | `GET /api/v2/companies/{id}` | Single company |
| Search | `GET /api/v2/search/companies?query="..."` | Query language; 300-result cap |
| Create | `POST /api/v2/companies` | `name` required and unique |
| Update | `PUT /api/v2/companies/{id}` | Partial update |

### Search Companies

```http
GET /api/v2/search/companies?query="name:'Acme'"
```

You can also locate a company by an autocomplete-style name lookup:

```http
GET /api/v2/companies/autocomplete?name=Acme
```

## Resolving Requester -> Contact -> Company

A core MSP workflow is enriching a ticket with full account context:

1. **Start from the ticket** — a ticket carries `requester_id` and, when set,
   `company_id`. Read the ticket first.
2. **Resolve the contact** — `GET /api/v2/contacts/{requester_id}` (or search
   by `email` if you only have an address). This yields the contact's
   `company_id`, `job_title`, and contact channels.
3. **Resolve the company** — `GET /api/v2/companies/{company_id}` for the
   organization's `domains`, `account_tier`, and `health_score`.
4. **Use domains to disambiguate** — if a contact has no `company_id`, match
   the email domain against company `domains` to infer the right account.
5. **Cache reference data** — companies and frequent contacts change rarely;
   cache lookups within a session to stay under the per-minute rate limit.

```text
Ticket #4821
  requester_id: 1001  ->  Contact "John Smith" (john.smith@acme.com)
                            company_id: 5001
                              ->  Company "Acme Corporation"
                                    domains: ["acme.com"], tier: "Gold"
```

## Error Handling

| Error | Cause | Resolution |
|-------|-------|------------|
| 400 Validation failed | Missing name or contact channel; duplicate company name | Supply required fields; pick a unique company name |
| 404 Not found | Unknown contact/company ID | Re-list or re-search to confirm |
| 409 Conflict | Email/company already exists | Search for and reuse the existing record |
| 403 Forbidden | API key lacks scope | Check agent permissions (especially for make_agent) |

## Best Practices

- **Search before creating** — avoid duplicate contacts by checking `email`
  first; let ticket creation auto-create only when intentional.
- **Maintain company domains** — accurate `domains` let Freshdesk
  auto-associate new contacts to the right company.
- **Confirm the primary on merge** — merges re-point history and are hard to
  undo.
- **Treat make_agent as privileged** — it affects licensing; flag it before
  running.
- **Cache company lookups** — they rarely change and reduce request volume.

## Related Skills

- [Freshdesk Ticketing](../ticketing/SKILL.md) - Tickets reference requesters and companies
- [Freshdesk API Patterns](../api-patterns/SKILL.md) - Search query language and pagination
- [Freshdesk SLA & Business Hours](../sla-business-hours/SKILL.md) - Company/tier-driven SLA association
