---
name: "HaloPSA Clients"
description: >
  HaloPSA CRM data model: client records and their billing/contact fields,
  sites (locations), contacts (Users), client classification, and parent-child
  client hierarchy. Covers the Client/Site/Users API surface, onboarding and
  deactivation workflows, duplicate prevention, and common validation errors.
when_to_use: >-
  When creating, updating, searching, or managing customer relationships in HaloPSA.
  Use when: halopsa client, halo client, halopsa customer, halo customer, client management
  halopsa, create client halopsa, halopsa site, halopsa location, halopsa contact, client
  onboarding halo, or halopsa crm.
---

# HaloPSA Client Management

## Overview

Clients (customers) are the foundation of HaloPSA. All tickets, contracts, assets, and invoices are associated with clients. Proper client data management is critical for accurate service delivery and billing.

## Key Concepts

Three linked entities make up the CRM layer:

| Entity | Endpoint | Key relationship |
|--------|----------|------------------|
| Client | `/api/Client` | Root record; owns sites, contacts, tickets, assets, contracts |
| Site | `/api/Site` | `client_id` -> Client; one site may be flagged `main_site` |
| Contact (User) | `/api/Users` | `client_id` -> Client, optional `site_id` -> Site |

Most-used client fields: `id`, `name` (required), `emailaddress`, `phonenumber`,
`website`, `accountmanager_id`, `inactive`, `client_to_invoice`, `toplevel_id`.
Most-used contact fields: `name` (required), `client_id` (required), `site_id`,
`emailaddress`, `jobtitle`, `isimportantcontact`, `inactive`.

Clients are classified (Customer, Prospect, Lead, Partner, Vendor) via custom fields
and categories rather than a built-in type enum.

See [references/fields.md](references/fields.md) for the complete field reference for clients, sites, contacts, and client types.

## Client Hierarchy

HaloPSA supports parent-child client relationships via two separate fields:

- `client_to_invoice` — the client that receives the invoice
- `toplevel_id` — the top-level parent in the reporting hierarchy

Set both when a child should both roll up for reporting and bill to the parent.

### Hierarchy Use Cases

- **Franchise operations** - Parent company, individual locations
- **Multi-site organizations** - Headquarters with branch offices
- **Billing consolidation** - Invoice parent, service children

## API Patterns

- **Create and update use the same call.** `POST /api/Client` (also `/api/Site`,
  `/api/Users`) creates when no `id` is present and updates when `id` is supplied.
  There is no `PUT`/`PATCH`.
- **The body is always a JSON array**, even for a single record. This is also how
  you batch multiple creates/updates in one request.
- **Updates are partial** — send only `id` plus the fields you are changing.
- **Related data is opt-in** on single-record GETs: `GET /api/Client/123?includesites=true&includeusers=true`.
- **Pagination and sorting** use `page_no`, `page_size`, `order`, `orderdesc`.

See [references/api.md](references/api.md) for full request/response examples covering client, site, and contact create/search/update.

## Common Workflows

### Client Onboarding

1. **Create client record**
   - Set name and contact information
   - Assign account manager
   - Configure billing settings

2. **Create primary site**
   - Add main location address
   - Set as main_site

3. **Create primary contact**
   - Add key stakeholder
   - Set as important contact
   - Verify email address

4. **Set up contract**
   - Link to client
   - Define service levels
   - Configure billing

5. **Deploy assets** (if applicable)
   - Link devices to client
   - Associate with site

Search for an existing record by name or email before each create step — HaloPSA
does not enforce uniqueness on client names or contact emails across clients.
See [references/examples.md](references/examples.md) for a contact-onboarding
routine that does the duplicate check.

### Client Deactivation

When a client churns:

1. **Mark client inactive**
   ```json
   [{ "id": 123, "inactive": true }]
   ```

2. **Close open tickets**
   - Resolve or cancel pending tickets
   - Document reason

3. **End contracts**
   - Update contract end dates
   - Process final billing

4. **Update assets**
   - Return or reassign devices
   - Update RMM status

Never delete a client that has related records — HaloPSA returns 409 and
deactivation is the supported path.

## Error Handling

| Code | Message | Resolution |
|------|---------|------------|
| 400 | Name is required | Client must have a name |
| 400 | Invalid client_id | Parent client doesn't exist |
| 400 | Duplicate email | Contact email already in use |
| 404 | Client not found | Verify client ID |
| 409 | Cannot delete - has related records | Deactivate instead |

See [references/examples.md](references/examples.md) for client validation and
duplicate-detection helpers.

## Data Quality Queries

### Find clients without contacts
```http
GET /api/Client?hasusers=false&inactive=false
```

### Find contacts without email
```http
GET /api/Users?emailaddress=null&inactive=false
```

Duplicate client names are not detectable via a query parameter — fetch and
normalize names client-side (see [references/examples.md](references/examples.md)).

## Best Practices

1. **Standardize naming** - Use consistent company name formats
2. **Verify before creating** - Always search first to prevent duplicates
3. **Use classifications** - Categorize clients for reporting
4. **Track account managers** - Assign for accountability
5. **Keep contacts current** - Deactivate departed employees
6. **Document relationships** - Use notes for key account information
7. **Set up hierarchy correctly** - Proper parent-child for billing

## Related Skills

- [HaloPSA Tickets](../tickets/SKILL.md) - Service tickets for clients
- [HaloPSA Contracts](../contracts/SKILL.md) - Service agreements
- [HaloPSA Assets](../assets/SKILL.md) - Client assets
- [HaloPSA API Patterns](../api-patterns/SKILL.md) - Authentication and queries
