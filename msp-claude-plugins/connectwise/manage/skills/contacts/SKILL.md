---
name: "ConnectWise Manage Contacts"
description: >
  ConnectWise PSA contact management: contact records, contact types, communication
  items (email, phone), portal access, and relationships to companies. Essential
  for MSP customer relationship management in ConnectWise PSA.
when_to_use: >-
  When creating, updating, searching, or managing contact records. Use when: connectwise contact,
  contact management, create contact connectwise, contact email, contact phone, customer portal,
  portal access, communication items, contact type, or primary contact.
---

# ConnectWise PSA Contact Management

## Overview

Contacts in ConnectWise PSA represent individuals at your client companies. Contacts can be ticket requestors, agreement signers, project stakeholders, and portal users. This skill covers contact CRUD operations, communication items, contact types, and portal access management.

## API Endpoint

```
Base: /company/contacts
```

## Contact Types

Standard contact types in ConnectWise PSA:

| Type ID | Name | Description |
|---------|------|-------------|
| 1 | Admin | Administrative contact |
| 2 | Primary | Main point of contact |
| 3 | Billing | Billing/accounts payable |
| 4 | Technical | Technical contact |
| 5 | Sales | Sales contact |

**Note:** Contact types are configurable. Query `/company/contacts/types` for your instance's types.

## Complete Contact Field Reference

### Core Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | int | System | Auto-generated unique identifier |
| `firstName` | string(30) | Yes | Contact first name |
| `lastName` | string(30) | No | Contact last name |
| `company` | object | Yes | `{id: companyId}` - Parent company |
| `site` | object | No | `{id: siteId}` - Company site |
| `type` | object | No | `{id: typeId}` - Contact type |

### Contact Information

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string(50) | No | Job title |
| `department` | object | No | `{id: departmentId}` |
| `relationship` | object | No | `{id: relationshipId}` |
| `nickName` | string(30) | No | Nickname/alias |
| `school` | string(50) | No | School/university |
| `marriedFlag` | boolean | No | Marital status |
| `childrenFlag` | boolean | No | Has children |
| `significantOther` | string(30) | No | Spouse/partner name |
| `anniversary` | date | No | Anniversary date |
| `birthDay` | date | No | Birth date |

### Address Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `addressLine1` | string(50) | No | Street address |
| `addressLine2` | string(50) | No | Suite/unit |
| `city` | string(50) | No | City |
| `state` | string(50) | No | State/province |
| `zip` | string(12) | No | Postal code |
| `country` | object | No | `{id: countryId}` |

### Portal Access Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `portalSecurityLevel` | int | No | Portal access level (1-6) |
| `disablePortalLoginFlag` | boolean | No | Disable portal access |
| `unsubscribeFlag` | boolean | No | Opt out of emails |

### Tracking Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `inactiveFlag` | boolean | No | Contact is inactive |
| `defaultMergeContactId` | int | No | ID for merge operations |
| `managerContactId` | int | No | Manager contact ID |
| `assistantContactId` | int | No | Assistant contact ID |
| `_info` | object | System | Metadata |

## Communication Items

Communication items store contact methods (email, phone, fax, etc.) for a contact.

### Communication Item Endpoint

```
/company/contacts/{contactId}/communications
```

### Communication Item Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | int | System | Communication ID |
| `type` | object | Yes | `{id: typeId}` - Email, Phone, Fax, etc. |
| `value` | string(250) | Yes | The email/phone/etc. value |
| `extension` | string(15) | No | Phone extension |
| `defaultFlag` | boolean | No | Is primary for this type |
| `communicationType` | string | No | Direct, Fax, Cell, Pager, etc. |

### Communication Types

| Type ID | Name | Description |
|---------|------|-------------|
| 1 | Email | Email address |
| 2 | Phone | Phone number |
| 3 | Fax | Fax number |
| 4 | Cell | Mobile phone |
| 5 | Pager | Pager (legacy) |
| 6 | Direct | Direct line |

### Add Communication Item

```http
POST /company/contacts/{contactId}/communications
Content-Type: application/json

{
  "type": {"id": 1},
  "value": "john.smith@acme.com",
  "defaultFlag": true,
  "communicationType": "Email"
}
```

### Add Phone Number

```http
POST /company/contacts/{contactId}/communications
Content-Type: application/json

{
  "type": {"id": 2},
  "value": "555-123-4567",
  "extension": "101",
  "defaultFlag": true,
  "communicationType": "Direct"
}
```

## Portal Access

### Portal Security Levels

| Level | Name | Access |
|-------|------|--------|
| 1 | Admin | Full access to all company tickets/data |
| 2 | Manager | Access to department tickets |
| 3 | User | Access to own tickets only |
| 4 | Limited | View only |
| 5 | Read Only | Read only, no create |
| 6 | Restricted | Minimal access |

### Enable Portal Access

```http
PATCH /company/contacts/{id}
Content-Type: application/json

{
  "portalSecurityLevel": 2,
  "disablePortalLoginFlag": false
}
```

### Portal Password Reset

Portal passwords are managed through the ConnectWise portal. The API does not expose password fields.

### Portal Invitation

To invite a contact to the portal:
1. Ensure contact has valid email
2. Set `portalSecurityLevel` > 0
3. Set `disablePortalLoginFlag` = false
4. Portal sends automatic invitation email

## API Operations

### Create Contact

```http
POST /company/contacts
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Smith",
  "company": {"id": 12345},
  "title": "IT Director",
  "type": {"id": 4}
}
```

### Create Contact with Communication Items

```http
POST /company/contacts
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Smith",
  "company": {"id": 12345},
  "title": "IT Director",
  "type": {"id": 4},
  "communicationItems": [
    {
      "type": {"id": 1},
      "value": "john.smith@acme.com",
      "defaultFlag": true
    },
    {
      "type": {"id": 2},
      "value": "555-123-4567",
      "extension": "101",
      "defaultFlag": true
    }
  ]
}
```

### Get Contact

```http
GET /company/contacts/{id}
```

### Update Contact

```http
PATCH /company/contacts/{id}
Content-Type: application/json

{
  "title": "CTO",
  "type": {"id": 2}
}
```

### Search Contacts

```http
GET /company/contacts?conditions=company/id=12345 and inactiveFlag=false
```

### Delete Contact

```http
DELETE /company/contacts/{id}
```

**Note:** Contacts with related records (tickets, etc.) cannot be deleted. Mark as inactive instead.

## Common Query Patterns

**All contacts for a company:**
```
conditions=company/id=12345
```

**Active contacts only:**
```
conditions=inactiveFlag=false
```

**Contacts by type:**
```
conditions=type/id=2
```

**Contacts with portal access:**
```
conditions=portalSecurityLevel>0 and disablePortalLoginFlag=false
```

**Search by name:**
```
conditions=firstName contains "John" or lastName contains "Smith"
```

**Contacts by email:**
```
conditions=communicationItems/value="john@acme.com"
```

**Primary contacts only:**
```
conditions=type/id=2 and inactiveFlag=false
```

## Contact Relationships

### Related Entities

| Entity | Relationship |
|--------|-------------|
| Company | `/company/companies/{companyId}` |
| Tickets | `/service/tickets?conditions=contact/id={id}` |
| Notes | `/company/contacts/{id}/notes` |
| Communications | `/company/contacts/{id}/communications` |
| Groups | `/company/contacts/{id}/groups` |

### Contact Notes

```http
GET /company/contacts/{id}/notes
POST /company/contacts/{id}/notes
```

Note Fields:
| Field | Type | Description |
|-------|------|-------------|
| `text` | string | Note content |
| `type` | object | `{id: noteTypeId}` |
| `flagged` | boolean | Flagged for attention |

## Best Practices

1. **Always include company** - Contacts must belong to a company
2. **Add communication items** - Email/phone essential for notifications
3. **Set contact type** - Helps identify primary contacts
4. **Use portal access wisely** - Grant minimum necessary access
5. **Link to site** - Important for multi-site companies
6. **Avoid duplicates** - Search before creating new contacts

## Error Handling

| Error | Cause | Resolution |
|-------|-------|------------|
| Company required | Missing company reference | Include `company: {id: x}` |
| firstName required | Missing first name | Provide firstName field |
| Invalid company | Company doesn't exist | Verify company ID |
| Cannot delete | Has related records | Mark as inactive instead |
| Email exists | Duplicate email | Use existing contact |

## Related Skills

- [ConnectWise Companies](../companies/SKILL.md) - Company management
- [ConnectWise Tickets](../tickets/SKILL.md) - Service tickets
- [ConnectWise API Patterns](../api-patterns/SKILL.md) - Query syntax and auth
