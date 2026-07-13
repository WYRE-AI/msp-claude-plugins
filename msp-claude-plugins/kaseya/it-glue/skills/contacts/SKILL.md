---
name: "IT Glue Contacts"
description: >
  Use this skill when working with IT Glue contacts - managing client contacts,
  contact types, locations, and communication details. Covers contact creation,
  organization relationships, contact notes, PSA sync, and lookup patterns for
  effective client communication management.
when_to_use: >-
  When managing client contacts, contact types, locations, and communication details. Use when: it
  glue contact, client contact, technical contact, contact lookup, contact management, it glue
  contacts, organization contacts, or contact documentation.
---

# IT Glue Contacts Management

## Overview

Contacts in IT Glue represent people associated with organizations, including clients, vendors, and partners. Proper contact management enables quick access to communication details, role information, and establishes clear points of contact for each organization.

## Key Concepts

### Contact Types

Contacts are classified by type to identify their role:

| Type | Description | Use Case |
|------|-------------|----------|
| Primary | Main point of contact | First contact for general inquiries |
| Technical | IT-related contact | Troubleshooting, technical decisions |
| Billing | Financial contact | Invoicing, payment questions |
| Executive | C-level/management | Strategic discussions, escalations |
| End User | Regular employees | Support ticket requesters |
| Vendor | External vendor contacts | Supplier communications |

### Contact Hierarchy

Organizations can have multiple contacts with different roles:

```
Organization: Acme Corporation
├── Primary Contact: John Smith (CEO)
├── Technical Contact: Jane Doe (IT Manager)
├── Billing Contact: Bob Wilson (CFO)
└── End Users:
    ├── Alice Brown (Sales)
    ├── Charlie Davis (Marketing)
    └── Diana Evans (HR)
```

## Field Reference

### Core Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | integer | System | Auto-generated unique identifier |
| `organization-id` | integer | Yes | Parent organization |
| `first-name` | string | No | First name |
| `last-name` | string | No | Last name |
| `name` | string | System | Full name (auto-generated) |
| `title` | string | No | Job title |
| `contact-type-id` | integer | No | Type classification |

### Communication Fields

| Field | Type | Description |
|-------|------|-------------|
| `contact-emails` | array | Email addresses |
| `contact-phones` | array | Phone numbers |

### Location Fields

| Field | Type | Description |
|-------|------|-------------|
| `location-id` | integer | Associated location |

### Documentation Fields

| Field | Type | Description |
|-------|------|-------------|
| `notes` | string | Contact notes (HTML) |
| `important` | boolean | VIP/important flag |

### PSA Integration Fields

| Field | Type | Description |
|-------|------|-------------|
| `psa-id` | string | PSA contact ID |
| `psa-integration-type` | string | PSA platform type |

### Metadata Fields

| Field | Type | Description |
|-------|------|-------------|
| `created-at` | datetime | Creation timestamp |
| `updated-at` | datetime | Last update timestamp |

## API Patterns

### List Contacts

```http
GET /contacts
x-api-key: YOUR_API_KEY
Content-Type: application/vnd.api+json
```

**By Organization:**
```http
GET /organizations/123/relationships/contacts
```

**With Filters:**
```http
GET /contacts?filter[organization-id]=123&filter[contact-type-id]=456
```

**With Pagination:**
```http
GET /contacts?page[size]=100&page[number]=1&sort=name
```

### Get Single Contact

```http
GET /contacts/789
x-api-key: YOUR_API_KEY
```

**With Includes:**
```http
GET /contacts/789?include=organization,location,contact-type
```

### Create Contact

```http
POST /contacts
Content-Type: application/vnd.api+json
x-api-key: YOUR_API_KEY
```

```json
{
  "data": {
    "type": "contacts",
    "attributes": {
      "organization-id": 123456,
      "first-name": "John",
      "last-name": "Smith",
      "title": "IT Manager",
      "contact-type-id": 12,
      "contact-emails": [
        {
          "value": "john.smith@acme.com",
          "label-name": "Work",
          "primary": true
        },
        {
          "value": "john.smith@gmail.com",
          "label-name": "Personal",
          "primary": false
        }
      ],
      "contact-phones": [
        {
          "value": "555-123-4567",
          "label-name": "Office",
          "primary": true
        },
        {
          "value": "555-987-6543",
          "label-name": "Mobile",
          "primary": false
        }
      ],
      "notes": "<p>Primary technical contact. Available M-F 9-5.</p>",
      "important": true
    }
  }
}
```

### Update Contact

```http
PATCH /contacts/789
Content-Type: application/vnd.api+json
x-api-key: YOUR_API_KEY
```

```json
{
  "data": {
    "type": "contacts",
    "attributes": {
      "title": "Senior IT Manager",
      "notes": "<p>Promoted to Senior IT Manager. Still primary contact.</p>"
    }
  }
}
```

### Delete Contact

```http
DELETE /contacts/789
x-api-key: YOUR_API_KEY
```

### Search by Various Fields

**By Name:**
```http
GET /contacts?filter[name]=John Smith
```

**By Organization:**
```http
GET /contacts?filter[organization-id]=123
```

**By PSA ID:**
```http
GET /contacts?filter[psa-id]=54321
```

## Contact Emails

### Email Structure

```json
{
  "contact-emails": [
    {
      "value": "user@example.com",
      "label-name": "Work",
      "primary": true
    }
  ]
}
```

**Label Names:**
- Work
- Personal
- Other

### Update Email

To update emails, include the full array in your PATCH request.

## Contact Phones

### Phone Structure

```json
{
  "contact-phones": [
    {
      "value": "555-123-4567",
      "label-name": "Office",
      "primary": true,
      "extension": "123"
    }
  ]
}
```

**Label Names:**
- Office
- Mobile
- Home
- Fax
- Other

## Common Workflows

### New Contact Creation

```javascript
async function createOrgContact(orgId, contactData) {
  const emails = contactData.emails.map((email, i) => ({
    value: email.address,
    'label-name': email.type || 'Work',
    primary: i === 0
  }));

  const phones = contactData.phones.map((phone, i) => ({
    value: phone.number,
    'label-name': phone.type || 'Office',
    primary: i === 0,
    extension: phone.extension
  }));

  return await createContact({
    'organization-id': orgId,
    'first-name': contactData.firstName,
    'last-name': contactData.lastName,
    title: contactData.title,
    'contact-type-id': contactData.typeId,
    'contact-emails': emails,
    'contact-phones': phones,
    notes: contactData.notes,
    important: contactData.isVip
  });
}
```

### Find Primary Contact

```javascript
async function getPrimaryContact(orgId) {
  const contacts = await fetchContacts({
    filter: {
      'organization-id': orgId,
      'contact-type-id': PRIMARY_CONTACT_TYPE
    }
  });

  // Return first primary contact or null
  return contacts[0] || null;
}
```

### Contact Directory

```javascript
async function generateContactDirectory(orgId) {
  const contacts = await fetchContacts({
    filter: { 'organization-id': orgId },
    include: 'contact-type,location'
  });

  return contacts.map(contact => ({
    name: contact.attributes.name,
    title: contact.attributes.title,
    type: contact.included?.find(i =>
      i.type === 'contact-types' &&
      i.id === contact.relationships['contact-type']?.data?.id
    )?.attributes?.name,
    emails: contact.attributes['contact-emails']?.map(e => ({
      email: e.value,
      type: e['label-name'],
      primary: e.primary
    })),
    phones: contact.attributes['contact-phones']?.map(p => ({
      number: p.value,
      type: p['label-name'],
      ext: p.extension,
      primary: p.primary
    })),
    important: contact.attributes.important
  }));
}
```

### PSA Contact Sync

```javascript
async function syncContactFromPsa(psaContact, orgId) {
  // Check if contact already exists
  const existing = await findContactByPsaId(psaContact.id);

  if (existing) {
    // Update existing contact
    return await updateContact(existing.id, {
      'first-name': psaContact.firstName,
      'last-name': psaContact.lastName,
      title: psaContact.title,
      'contact-emails': [{
        value: psaContact.email,
        'label-name': 'Work',
        primary: true
      }],
      'contact-phones': [{
        value: psaContact.phone,
        'label-name': 'Office',
        primary: true
      }]
    });
  } else {
    // Create new contact
    return await createContact({
      'organization-id': orgId,
      'psa-id': psaContact.id,
      'first-name': psaContact.firstName,
      'last-name': psaContact.lastName,
      title: psaContact.title,
      'contact-emails': [{
        value: psaContact.email,
        'label-name': 'Work',
        primary: true
      }],
      'contact-phones': [{
        value: psaContact.phone,
        'label-name': 'Office',
        primary: true
      }]
    });
  }
}
```

### VIP Contact Alert

```javascript
async function getVipContacts() {
  const contacts = await fetchAllContacts({
    filter: { important: true },
    include: 'organization'
  });

  return contacts.map(c => ({
    name: c.attributes.name,
    organization: c.included?.find(i =>
      i.type === 'organizations' &&
      i.id === c.relationships.organization?.data?.id
    )?.attributes?.name,
    title: c.attributes.title,
    email: c.attributes['contact-emails']?.find(e => e.primary)?.value,
    phone: c.attributes['contact-phones']?.find(p => p.primary)?.value
  }));
}
```

## Error Handling

### Common API Errors

| Code | Message | Resolution |
|------|---------|------------|
| 400 | Organization required | Include organization-id |
| 401 | Invalid API key | Check IT_GLUE_API_KEY |
| 404 | Contact not found | Verify contact ID |
| 422 | Invalid contact type | Query valid type IDs first |
| 422 | Invalid email format | Check email syntax |

### Validation Errors

| Error | Cause | Fix |
|-------|-------|-----|
| Organization required | No org ID | Include organization-id |
| Invalid type | Bad type ID | Query /contact-types |
| Invalid email | Malformed email | Use valid email format |
| Name required | No first or last name | Provide at least one name |

### Error Recovery Pattern

```javascript
async function safeCreateContact(data) {
  try {
    return await createContact(data);
  } catch (error) {
    if (error.status === 422) {
      const errors = error.errors || [];

      // Handle invalid email
      if (errors.some(e => e.detail?.includes('email'))) {
        console.log('Invalid email format. Removing invalid emails.');
        data['contact-emails'] = data['contact-emails']?.filter(
          e => isValidEmail(e.value)
        );
        return await createContact(data);
      }

      // Handle missing contact type
      if (errors.some(e => e.detail?.includes('contact-type'))) {
        const types = await getContactTypes();
        console.log('Valid contact types:', types);
      }
    }

    throw error;
  }
}
```

## Best Practices

1. **Use contact types** - Classify all contacts for filtering and organization
2. **Set primary contact** - Each organization should have a primary contact
3. **Include multiple methods** - Add both email and phone when available
4. **Mark VIPs** - Use important flag for key stakeholders
5. **Document notes** - Include availability, preferences, special instructions
6. **Link to PSA** - Set psa-id for cross-platform lookups
7. **Verify emails** - Ensure email addresses are current
8. **Associate locations** - Link contacts to their physical location
9. **Regular cleanup** - Remove departed employees promptly
10. **Maintain titles** - Keep job titles current for proper escalation

## Related Skills

- [IT Glue Organizations](../organizations/SKILL.md) - Parent organization management
- [IT Glue Passwords](../passwords/SKILL.md) - Contact-related credentials
- [IT Glue Documents](../documents/SKILL.md) - Contact documentation
- [IT Glue API Patterns](../api-patterns/SKILL.md) - API reference
