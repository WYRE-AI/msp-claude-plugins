# IT Glue Contacts — API Reference

## List Contacts

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

## Get Single Contact

```http
GET /contacts/789
x-api-key: YOUR_API_KEY
```

**With Includes:**
```http
GET /contacts/789?include=organization,location,contact-type
```

## Create Contact

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

## Update Contact

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

## Delete Contact

```http
DELETE /contacts/789
x-api-key: YOUR_API_KEY
```

## Search by Various Fields

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

**Label Names:** Work, Personal, Other

To update emails, include the full array in your PATCH request — it replaces rather than merges.

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

**Label Names:** Office, Mobile, Home, Fax, Other
