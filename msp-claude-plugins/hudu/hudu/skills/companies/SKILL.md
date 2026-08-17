---
name: "Hudu Companies"
description: >
  Hudu companies (clients/organizations): company field reference, parent/child
  hierarchy, PSA integration matching via id_in_integration, the /api/v1/companies
  CRUD plus archive/unarchive endpoints, onboarding and offboarding workflows, and
  how companies scope assets, passwords, articles, and websites.
when_to_use: >-
  When looking up, creating, updating, or archiving a company in Hudu, or scoping other
  Hudu records to a client. Use when: hudu
  company, hudu client, hudu organization, company lookup, company documentation, company
  management, hudu org, or client documentation.
---

# Hudu Companies Management

## Overview

Companies are the foundational entity in Hudu, representing clients, vendors, or internal entities. All documentation, assets, passwords, articles, and websites are associated with a company. In Hudu, the "Company" label is customizable per instance -- some MSPs rename it to "Organization" or "Client" -- but the API endpoint is always `/api/v1/companies`.

## Anti-triggers

- **The client record of record** — a Hudu company scopes documentation.
  Contracts, contacts, and service history live in the PSA; use
  `autotask-crm`, `connectwise-psa-companies`, or `halopsa-clients`.
  Hudu's `id_in_integration` field holds the PSA's ID precisely because
  the two are different records.
- **The same client in IT Glue** — IT Glue calls these Organizations; use
  `itglue-api-patterns` for its equivalent surface.
- **The monitored client container** — an RMM organization or site is a
  monitoring scope, not documentation; use `ninjaone-organizations`,
  `atera-customers`, or `datto-rmm-sites`.
- **The client's licence or billing entity** — use `pax8-companies`,
  `sherweb-customers`, or `qbo-customers`.

## Key Concepts

### Company Types

Unlike IT Glue, Hudu does not enforce built-in company types. Companies are typically organized using custom fields or naming conventions. Common patterns MSPs use:

| Pattern | Description | Example |
|---------|-------------|---------|
| Active Client | Currently serviced customer | Standard operational state |
| Prospect | Potential client | Pre-sales documentation |
| Vendor | Product/service supplier | Software vendors |
| Internal | Your own MSP | Internal documentation |
| Former Client | Previously serviced | Historical records |

### Company Hierarchy

Companies can have parent/child relationships for multi-location or multi-division clients:

```
Parent Company (Acme Holdings)
+-- Child: Acme East Division
+-- Child: Acme West Division
+-- Child: Acme International
```

### PSA Integration

Companies can be matched to PSA records using the `id_in_integration` and `integration_slug` fields, enabling cross-platform lookups between Hudu and tools like ConnectWise Manage, Autotask, or HaloPSA.

## Field Reference

### Core Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | integer | System | Auto-generated unique identifier |
| `name` | string | Yes | Company name |
| `nickname` | string | No | Short name or abbreviation |
| `company_type` | string | No | Type classification |
| `address_line_1` | string | No | Street address line 1 |
| `address_line_2` | string | No | Street address line 2 |
| `city` | string | No | City |
| `state` | string | No | State/province |
| `zip` | string | No | Postal code |
| `country_name` | string | No | Country |
| `phone_number` | string | No | Phone number |
| `fax_number` | string | No | Fax number |
| `website` | string | No | Company website URL |
| `notes` | string | No | Rich text notes |

### Integration Fields

| Field | Type | Description |
|-------|------|-------------|
| `id_in_integration` | integer | PSA system company ID |
| `integration_slug` | string | PSA integration identifier |

### Relationship Fields

| Field | Type | Description |
|-------|------|-------------|
| `parent_company_id` | integer | Parent company ID |
| `parent_company_name` | string | Parent company name (read-only) |

### Metadata Fields

| Field | Type | Description |
|-------|------|-------------|
| `created_at` | datetime | Creation timestamp |
| `updated_at` | datetime | Last update timestamp |
| `slug` | string | URL-friendly identifier |
| `object_type` | string | Always "Company" |

## API Patterns

### List Companies

```http
GET /api/v1/companies
x-api-key: YOUR_API_KEY
Content-Type: application/json
```

**With Filters:**
```http
GET /api/v1/companies?name=Acme
GET /api/v1/companies?city=Springfield
GET /api/v1/companies?state=IL
GET /api/v1/companies?id_in_integration=12345
GET /api/v1/companies?search=acme
```

**With Pagination:**
```http
GET /api/v1/companies?page=1
GET /api/v1/companies?page=2
```

### Get Single Company

```http
GET /api/v1/companies/123
x-api-key: YOUR_API_KEY
```

### Create Company

```http
POST /api/v1/companies
Content-Type: application/json
x-api-key: YOUR_API_KEY
```

```json
{
  "company": {
    "name": "New Client Corporation",
    "nickname": "NCC",
    "company_type": "Customer",
    "address_line_1": "123 Main Street",
    "city": "Portland",
    "state": "OR",
    "zip": "97201",
    "phone_number": "555-123-4567",
    "website": "https://newclient.com",
    "notes": "Onboarded February 2026. Primary contact: John Smith."
  }
}
```

### Update Company

```http
PUT /api/v1/companies/123
Content-Type: application/json
x-api-key: YOUR_API_KEY
```

```json
{
  "company": {
    "nickname": "NCC-UPDATED",
    "notes": "Updated: New primary contact is Jane Doe (555-987-6543)."
  }
}
```

### Delete Company

```http
DELETE /api/v1/companies/123
x-api-key: YOUR_API_KEY
```

**Warning:** Deleting a company removes all associated resources (assets, passwords, articles, etc.). Requires DELETE permission on the API key.

### Archive / Unarchive Company

```http
PUT /api/v1/companies/123/archive
x-api-key: YOUR_API_KEY
```

```http
PUT /api/v1/companies/123/unarchive
x-api-key: YOUR_API_KEY
```

### Search by PSA Integration ID

```http
GET /api/v1/companies?id_in_integration=12345
```

## Common Workflows

### New Client Onboarding

1. **Create company** with basic info (name, address, phone, website)
2. **Set integration ID** to link with PSA
3. **Add notes** for quick reference (primary contact, contract info)
4. **Create initial assets** (servers, workstations, network devices)
5. **Document passwords** for the company
6. **Create articles** (network overview, procedures)
7. **Add website records** for monitoring

```javascript
async function onboardClient(clientData) {
  // Step 1: Create company
  const company = await createCompany({
    name: clientData.companyName,
    nickname: clientData.nickname,
    company_type: 'Customer',
    address_line_1: clientData.address,
    city: clientData.city,
    state: clientData.state,
    zip: clientData.zip,
    phone_number: clientData.phone,
    website: clientData.website,
    notes: `Onboarded: ${new Date().toLocaleDateString()}\nPrimary contact: ${clientData.primaryContact}`
  });

  // Step 2: Link to PSA
  if (clientData.psaId) {
    await updateCompany(company.id, {
      id_in_integration: clientData.psaId
    });
  }

  return company;
}
```

### Client Offboarding

1. **Review and export** critical documentation if needed
2. **Archive passwords** (do not delete for audit purposes)
3. **Archive the company** instead of deleting
4. **Add offboarding notes** with date and reason

```javascript
async function offboardClient(companyId, reason) {
  // Add offboarding notes
  await updateCompany(companyId, {
    notes: `ARCHIVED: ${new Date().toLocaleDateString()} - ${reason}`
  });

  // Archive the company
  await archiveCompany(companyId);
}
```

### PSA Sync Verification

```javascript
async function verifyPsaSync() {
  const companies = await fetchAllCompanies();

  const syncStatus = {
    synced: [],
    unsynced: [],
    mismatched: []
  };

  for (const company of companies) {
    if (!company.id_in_integration) {
      syncStatus.unsynced.push(company);
    } else {
      const psaCompany = await lookupPsaCompany(company.id_in_integration);
      if (psaCompany) {
        syncStatus.synced.push(company);
      } else {
        syncStatus.mismatched.push(company);
      }
    }
  }

  return syncStatus;
}
```

### Bulk Company Report

```javascript
async function generateCompanyReport() {
  const companies = await fetchAllCompanies();

  return companies.map(company => ({
    name: company.name,
    nickname: company.nickname,
    city: company.city,
    state: company.state,
    psaSynced: !!company.id_in_integration,
    hasWebsite: !!company.website,
    createdAt: company.created_at,
    updatedAt: company.updated_at
  }));
}
```

## Error Handling

### Common API Errors

| Code | Message | Resolution |
|------|---------|------------|
| 400 | Name can't be blank | Provide company name |
| 400 | Name has already been taken | Use unique name |
| 401 | Invalid API key | Check HUDU_API_KEY |
| 404 | Company not found | Verify company ID and HUDU_BASE_URL |
| 422 | Validation failed | Check required fields |

### Validation Errors

| Error | Cause | Fix |
|-------|-------|-----|
| Name required | Missing name field | Add name to request body |
| Name not unique | Duplicate company name | Use a different name |
| Invalid parent ID | Non-existent parent company | Verify parent_company_id |

### Error Recovery Pattern

```javascript
async function safeCreateCompany(data) {
  try {
    return await createCompany(data);
  } catch (error) {
    if (error.status === 422 && error.message?.includes('already been taken')) {
      // Company exists - find and return it
      const existing = await findCompanyByName(data.name);
      return existing;
    }

    if (error.status === 401) {
      throw new Error('API key invalid or expired. Check HUDU_API_KEY.');
    }

    throw error;
  }
}
```

## Best Practices

1. **Use descriptive names** - Include location or identifier if needed for uniqueness
2. **Set nicknames** - Short abbreviations for quick reference
3. **Maintain notes** - Keep emergency contact info and contract details readily available
4. **Link to PSA** - Always set `id_in_integration` for cross-platform lookups
5. **Use parent/child** - Organize multi-location or division clients
6. **Archive, don't delete** - Preserve historical documentation
7. **Include address info** - Useful for dispatch and site visit planning
8. **Document website** - Track the company's primary website URL

## Related Skills

- [Hudu Assets](../assets/SKILL.md) - Asset management for companies
- [Hudu Articles](../articles/SKILL.md) - Knowledge base articles
- [Hudu Passwords](../passwords/SKILL.md) - Credential storage
- [Hudu Websites](../websites/SKILL.md) - Website monitoring
- [Hudu API Patterns](../api-patterns/SKILL.md) - API reference
