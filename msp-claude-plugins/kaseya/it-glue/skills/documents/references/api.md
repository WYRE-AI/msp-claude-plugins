# Documents API Reference

## List Documents

**Always use the organization-scoped relationship endpoint** — `GET /documents` (top-level) returns 404 in practice. Use:

```http
GET /organizations/123/relationships/documents
x-api-key: YOUR_API_KEY
Content-Type: application/vnd.api+json
```

**With Name Filter:**
```http
GET /organizations/123/relationships/documents?filter[name]=backup
```

**With Pagination:**
```http
GET /organizations/123/relationships/documents?page[size]=100&page[number]=1&sort=name
```

> **Note:** If documents return 404 for an organization, that organization likely does not have the IT Glue Documents module enabled. Use `search_flexible_assets` instead — flexible assets are the more common way documentation is stored in IT Glue.

## Get Single Document

```http
GET /documents/789
x-api-key: YOUR_API_KEY
```

**With Includes:**
```http
GET /documents/789?include=organization,document-folder,related-items
```

## Create Document

```http
POST /documents
Content-Type: application/vnd.api+json
x-api-key: YOUR_API_KEY
```

```json
{
  "data": {
    "type": "documents",
    "attributes": {
      "organization-id": 123456,
      "name": "New User Setup Procedure",
      "document-folder-id": 789,
      "content": "<h1>New User Setup Procedure</h1><h2>Overview</h2><p>This procedure covers the steps for setting up a new user account.</p><h2>Prerequisites</h2><ul><li>Active Directory access</li><li>Microsoft 365 admin access</li></ul><h2>Steps</h2><ol><li>Create AD account</li><li>Assign Microsoft 365 license</li><li>Configure email signature</li></ol>"
    }
  }
}
```

## Update Document Metadata

```http
PATCH /documents/789
Content-Type: application/vnd.api+json
x-api-key: YOUR_API_KEY
```

```json
{
  "data": {
    "type": "documents",
    "attributes": {
      "name": "Updated Document Title"
    }
  }
}
```

> **Important:** `PATCH /documents/:id` with a `content` attribute does **not** work for multi-section documents. Use the Document Sections API below instead.

## Delete Document

```http
DELETE /documents/789
x-api-key: YOUR_API_KEY
```

## Document Sections API

Use the sections API to read and edit the content of multi-section documents. This is the correct approach for modifying document body content — `PATCH /documents/:id` with a `content` attribute silently fails on multi-section documents.

### List Sections

```http
GET /documents/789/relationships/sections
x-api-key: YOUR_API_KEY
Content-Type: application/vnd.api+json
```

Response:

```json
{
  "data": [
    {
      "id": "1001",
      "type": "document-sections",
      "attributes": {
        "content": "<h2>Overview</h2>",
        "section-type": "Document::Heading",
        "position": 1
      }
    },
    {
      "id": "1002",
      "type": "document-sections",
      "attributes": {
        "content": "<p>This procedure covers...</p>",
        "section-type": "Document::Text",
        "position": 2
      }
    }
  ]
}
```

### Create Section

```http
POST /documents/789/relationships/sections
Content-Type: application/vnd.api+json
x-api-key: YOUR_API_KEY
```

```json
{
  "data": {
    "type": "document-sections",
    "attributes": {
      "section-type": "Document::Text",
      "content": "<p>New section content here.</p>"
    }
  }
}
```

### Update Section

```http
PATCH /documents/789/relationships/sections/1002
Content-Type: application/vnd.api+json
x-api-key: YOUR_API_KEY
```

```json
{
  "data": {
    "type": "document-sections",
    "attributes": {
      "content": "<p>Updated HTML content.</p>"
    }
  }
}
```

### Delete Section

```http
DELETE /documents/789/relationships/sections/1002
x-api-key: YOUR_API_KEY
```

### Publish Document

After editing sections, publish the document to make changes visible. Use **PATCH** — POST returns 404.

```http
PATCH /documents/789/publish
x-api-key: YOUR_API_KEY
```

No request body is required. A successful response is HTTP 200 with the updated document.

### Search Documents

**By Name:**
```http
GET /documents?filter[name]=backup
```

**By Folder:**
```http
GET /documents?filter[document-folder-id]=456
```

## Document Folders

### List Folders

```http
GET /document-folders
x-api-key: YOUR_API_KEY
```

**By Organization:**
```http
GET /organizations/123/relationships/document-folders
```

### Create Folder

```http
POST /document-folders
Content-Type: application/vnd.api+json
```

```json
{
  "data": {
    "type": "document-folders",
    "attributes": {
      "organization-id": 123456,
      "name": "Procedures",
      "parent-id": null
    }
  }
}
```

### Nested Folders

```json
{
  "data": {
    "type": "document-folders",
    "attributes": {
      "organization-id": 123456,
      "name": "Disaster Recovery",
      "parent-id": 789
    }
  }
}
```

## Embedding Resources

### Embedded Passwords

Include password references in document content:

```html
<h2>Login Credentials</h2>
<p>Domain Admin:</p>
<div data-embedded-password-id="12345"></div>
```

### Embedded Configurations

Reference configurations in documents:

```html
<h2>Related Servers</h2>
<div data-embedded-configuration-id="67890"></div>
```

### Embedded Images

Include uploaded images:

```html
<h2>Network Diagram</h2>
<img src="/uploads/organization/123/network-diagram.png" alt="Network Diagram">
```

## Related Items

### Create Related Item

```http
POST /related-items
Content-Type: application/vnd.api+json
```

```json
{
  "data": {
    "type": "related-items",
    "attributes": {
      "resource-id": 789,
      "resource-type": "Document",
      "destination-id": 456,
      "destination-type": "Configuration",
      "notes": "This document describes the configuration of this server"
    }
  }
}
```

### List Related Items

```http
GET /documents/789/relationships/related-items
```
