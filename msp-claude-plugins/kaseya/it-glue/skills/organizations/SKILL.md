---
name: "IT Glue Organizations"
description: >
  IT Glue organizations (companies/clients): the foundational entity all
  documentation, configurations, contacts, passwords, and flexible assets
  attach to. Covers organization types, statuses, parent/child relationships,
  PSA sync fields, and quick notes.
when_to_use: >-
  When creating, searching, updating, and managing client documentation. Use when: it glue
  organization, it glue company, client documentation, organization lookup, it glue client,
  organization management, it glue org, or company documentation.
---

# IT Glue Organizations Management

## Overview

Organizations are the foundational entity in IT Glue, representing companies, clients, vendors, or internal entities. All documentation, configurations, contacts, passwords, and flexible assets are associated with an organization. Proper organization management enables comprehensive client documentation and cross-platform integration with PSA tools.

## Key Concepts

### Organization Types

Organizations are classified by type for categorization:

| Type | Description | Use Case |
|------|-------------|----------|
| Customer | Active client organizations | Primary service clients |
| Vendor | Product/service suppliers | Software vendors, hardware suppliers |
| Partner | Business partners | MSP partnerships, referral partners |
| Internal | Your own organization | Internal documentation |
| Prospect | Potential clients | Pre-sales documentation |

### Organization Statuses

| Status | Description | Business Logic |
|--------|-------------|----------------|
| Active | Currently serviced | Standard operational state |
| Inactive | Not currently active | Suspended or paused accounts |
| Archived | Historical only | No longer serviced, read-only |

### Parent/Child Relationships

Organizations can have hierarchical relationships:

```
Parent Organization (Acme Holdings)
├── Child: Acme East Division
├── Child: Acme West Division
└── Child: Acme International
```

This enables:
- Centralized management documentation
- Shared configurations across divisions
- Hierarchical reporting
- Inherited security settings

## Field Reference

### Core Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | integer | System | Auto-generated unique identifier |
| `name` | string | Yes | Organization name (unique) |
| `description` | string | No | Detailed description |
| `quick-notes` | string | No | Quick reference notes |
| `organization-type-id` | integer | No | Type classification |
| `organization-status-id` | integer | No | Status classification |

### Relationship Fields

| Field | Type | Description |
|-------|------|-------------|
| `parent-id` | integer | Parent organization ID |
| `primary-contact-id` | integer | Primary contact for org |
| `primary-location-id` | integer | Primary location ID |

### PSA Integration Fields

| Field | Type | Description |
|-------|------|-------------|
| `psa-id` | string | PSA system company ID |
| `psa-integration-type` | string | PSA type (autotask, connectwise, etc.) |

### Metadata Fields

| Field | Type | Description |
|-------|------|-------------|
| `created-at` | datetime | Creation timestamp |
| `updated-at` | datetime | Last update timestamp |
| `short-name` | string | Abbreviated name |
| `alert` | string | Alert/warning message |

## API Patterns

### List Organizations

```http
GET /organizations
x-api-key: YOUR_API_KEY
Content-Type: application/vnd.api+json
```

**With Filters:**
```http
GET /organizations?filter[name]=Acme&filter[organization-status-id]=1
```

**With Pagination:**
```http
GET /organizations?page[size]=100&page[number]=1&sort=name
```

### Get Single Organization

```http
GET /organizations/123456
x-api-key: YOUR_API_KEY
```

**With Includes:**
```http
GET /organizations/123456?include=configurations,contacts,passwords
```

### Create Organization

```http
POST /organizations
Content-Type: application/vnd.api+json
x-api-key: YOUR_API_KEY
```

```json
{
  "data": {
    "type": "organizations",
    "attributes": {
      "name": "New Client Corporation",
      "description": "IT services client since 2024",
      "quick-notes": "Primary contact: John Smith (555-123-4567)",
      "organization-type-id": 37,
      "organization-status-id": 1
    }
  }
}
```

### Update Organization

```http
PATCH /organizations/123456
Content-Type: application/vnd.api+json
x-api-key: YOUR_API_KEY
```

```json
{
  "data": {
    "type": "organizations",
    "attributes": {
      "quick-notes": "Updated: New primary contact is Jane Doe",
      "alert": "Contract renewal due March 2024"
    }
  }
}
```

### Delete Organization

```http
DELETE /organizations/123456
x-api-key: YOUR_API_KEY
```

**Warning:** Deleting an organization removes all associated resources (configurations, passwords, documents, etc.)

### Search by PSA ID

```http
GET /organizations?filter[psa-id]=12345
```

## Common Workflows

### New Client Onboarding

1. **Create organization** with basic info
2. **Set organization type** (Customer)
3. **Add quick notes** for reference
4. **Link to PSA** with psa-id
5. **Create primary contact**
6. **Add initial configurations**
7. **Document passwords**

```javascript
async function onboardClient(clientData) {
  // Step 1: Create organization
  const org = await createOrganization({
    name: clientData.companyName,
    description: clientData.description,
    'quick-notes': clientData.notes,
    'organization-type-id': CUSTOMER_TYPE_ID,
    'organization-status-id': ACTIVE_STATUS_ID
  });

  // Step 2: Create primary contact
  await createContact(org.id, {
    name: clientData.primaryContact.name,
    email: clientData.primaryContact.email,
    phone: clientData.primaryContact.phone,
    'contact-type-id': PRIMARY_CONTACT_TYPE
  });

  // Step 3: Create initial documentation
  await createDocument(org.id, {
    name: 'Client Overview',
    content: generateOverviewContent(clientData)
  });

  return org;
}
```

### Client Offboarding

1. **Archive passwords** (don't delete for audit)
2. **Export documentation** if needed
3. **Update organization status** to Archived
4. **Add offboarding notes** with date and reason

```javascript
async function offboardClient(orgId, reason) {
  // Update status to archived
  await updateOrganization(orgId, {
    'organization-status-id': ARCHIVED_STATUS_ID,
    alert: `ARCHIVED: ${new Date().toISOString().split('T')[0]} - ${reason}`
  });

  // Add final note
  await addQuickNote(orgId, `
    Client offboarded on ${new Date().toLocaleDateString()}
    Reason: ${reason}
    Final contact: [Record contact name and handoff details]
  `);
}
```

### PSA Sync Verification

```javascript
async function verifyPsaSync() {
  // Get all active organizations
  const orgs = await fetchOrganizations({
    filter: { 'organization-status-id': ACTIVE_STATUS_ID }
  });

  const syncStatus = {
    synced: [],
    unsynced: [],
    mismatched: []
  };

  for (const org of orgs) {
    if (!org.attributes['psa-id']) {
      syncStatus.unsynced.push(org);
    } else {
      // Verify PSA record exists
      const psaCompany = await lookupPsaCompany(org.attributes['psa-id']);
      if (psaCompany) {
        syncStatus.synced.push(org);
      } else {
        syncStatus.mismatched.push(org);
      }
    }
  }

  return syncStatus;
}
```

### Bulk Organization Report

```javascript
async function generateOrgReport() {
  const orgs = await fetchAllOrganizations();

  return orgs.map(org => ({
    name: org.attributes.name,
    type: org.relationships['organization-type']?.data?.id,
    status: org.relationships['organization-status']?.data?.id,
    hasConfigurations: org.relationships.configurations?.data?.length > 0,
    hasPasswords: org.relationships.passwords?.data?.length > 0,
    psaSynced: !!org.attributes['psa-id'],
    createdAt: org.attributes['created-at'],
    updatedAt: org.attributes['updated-at']
  }));
}
```

## Error Handling

### Common API Errors

| Code | Message | Resolution |
|------|---------|------------|
| 400 | Name can't be blank | Provide organization name |
| 400 | Name has already been taken | Use unique name |
| 401 | Invalid API key | Check IT_GLUE_API_KEY |
| 404 | Organization not found | Verify organization ID |
| 422 | Invalid organization type | Query valid type IDs first |

### Validation Errors

| Error | Cause | Fix |
|-------|-------|-----|
| Name required | Missing name field | Add name to request |
| Name not unique | Duplicate name | Use different name |
| Invalid type ID | Non-existent type | Query /organization-types first |
| Invalid status ID | Non-existent status | Query /organization-statuses first |

### Error Recovery Pattern

```javascript
async function safeCreateOrganization(data) {
  try {
    return await createOrganization(data);
  } catch (error) {
    if (error.status === 422 && error.detail?.includes('already been taken')) {
      // Organization exists - find and return it
      const existing = await findOrganizationByName(data.name);
      return existing;
    }

    if (error.status === 401) {
      throw new Error('API key invalid or expired. Check IT_GLUE_API_KEY.');
    }

    throw error;
  }
}
```

## Best Practices

1. **Use descriptive names** - Include location or identifier if needed for uniqueness
2. **Maintain quick notes** - Keep emergency contact info readily available
3. **Set organization types** - Enable meaningful filtering and reporting
4. **Link to PSA** - Always set psa-id for cross-platform lookups
5. **Use parent/child** - Organize multi-location or division clients
6. **Archive, don't delete** - Preserve historical documentation
7. **Document alerts** - Use alert field for critical client notices
8. **Primary contact** - Always set a primary contact for each org
9. **Standardize naming** - Use consistent naming conventions

## Related Skills

- [IT Glue Configurations](../configurations/SKILL.md) - Asset management for organizations
- [IT Glue Contacts](../contacts/SKILL.md) - Contact management
- [IT Glue Passwords](../passwords/SKILL.md) - Credential storage
- [IT Glue Documents](../documents/SKILL.md) - Documentation
- [IT Glue API Patterns](../api-patterns/SKILL.md) - API reference
