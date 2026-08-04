---
name: "IT Glue Contacts"
description: >
  IT Glue contacts — the people (clients, vendors, partners) associated with
  an organization. Covers contact types, the emails/phones array structure,
  location linkage, PSA sync, and lookup patterns.
when_to_use: >-
  When managing client contacts, contact types, locations, and communication details. Use when: it
  glue contact, client contact, technical contact, contact lookup, contact management, it glue
  contacts, organization contacts, or contact documentation.
---

# IT Glue Contacts Management

## Overview

Contacts in IT Glue represent people associated with organizations, including clients, vendors, and partners. Proper contact management enables quick access to communication details, role information, and establishes clear points of contact for each organization.

## Anti-triggers

- **The contact record that drives tickets and invoices** — the PSA is
  the system of record; use `autotask-crm`.
- **The organization rather than the people in it** — use
  `it-glue-organizations`.
- **A credential belonging to a person** — use `it-glue-passwords`.

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

### Field Reference

Core identification, communication (`contact-emails`, `contact-phones`), location, documentation, PSA, and metadata fields. See [references/fields.md](references/fields.md) for the complete field reference.

## API Patterns

Contacts support the standard list/get/create/update/delete verbs, plus organization-scoped listing (`/organizations/:id/relationships/contacts`) and search by name/organization-id/psa-id. `contact-emails` and `contact-phones` are arrays of `{value, label-name, primary}` objects — a PATCH replaces the whole array rather than merging, so always resend the full list including entries you aren't changing. See [references/api.md](references/api.md) for full request/response examples and the email/phone label-name values.

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

## Gotchas

- `contact-emails` and `contact-phones` PATCH updates replace the entire array — omitting an existing entry deletes it, so always send the full set.
- `name` is system-generated from `first-name`/`last-name`; it cannot be set directly.
- `contact-type-id` references an org-specific lookup table, not a fixed enum — an unrecognized ID returns a 422, not a descriptive "invalid type" error.

See [references/errors.md](references/errors.md) for the common error/validation tables and an error-recovery pattern that filters invalid emails and looks up valid contact types on 422.

## Best Practices

1. **Use contact types** - Classify all contacts for filtering and organization
2. **Set primary contact** - Each organization should have a primary contact
3. **Include multiple methods** - Add both email and phone when available
4. **Mark VIPs** - Use important flag for key stakeholders
5. **Link to PSA** - Set psa-id for cross-platform lookups
6. **Associate locations** - Link contacts to their physical location

## Related Skills

- [IT Glue Organizations](../organizations/SKILL.md) - Parent organization management
- [IT Glue Passwords](../passwords/SKILL.md) - Contact-related credentials
- [IT Glue Documents](../documents/SKILL.md) - Contact documentation
- [IT Glue API Patterns](../api-patterns/SKILL.md) - API reference
