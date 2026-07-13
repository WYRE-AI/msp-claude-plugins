---
name: "IT Glue Documents"
description: >
  Use this skill when working with IT Glue documents - creating, organizing,
  and managing documentation. Covers document folders, embedded passwords,
  related items, version tracking, and documentation best practices for
  comprehensive client documentation management.
when_to_use: >-
  When creating, organizing, and managing documentation. Use when: it glue document,
  documentation, runbook, procedure documentation, it glue docs, document management, sop
  documentation, or knowledge base.
---

# IT Glue Documents Management

## Overview

Documents in IT Glue provide structured documentation storage for organizations, enabling technicians to create runbooks, procedures, network diagrams, and general documentation. Documents support rich HTML content, embedded passwords, and relationships to other IT Glue resources.

## Key Concepts

### Document Structure

Documents consist of:
- **Name** - Document title
- **Content** - Rich HTML content with embedded resources
- **Folder** - Organizational hierarchy location
- **Related Items** - Links to configurations, contacts, etc.

### Document Folders

Folders provide hierarchical organization:

```
Organization: Acme Corporation
└── Documents
    ├── Onboarding
    │   ├── New User Setup
    │   └── Hardware Deployment
    ├── Procedures
    │   ├── Backup Procedures
    │   └── Disaster Recovery
    └── Network
        ├── Network Diagram
        └── IP Scheme
```

### Embedded Resources

Documents can embed:
- **Passwords** - Inline credential display
- **Configurations** - Asset links
- **Contacts** - Contact information
- **Images** - Uploaded images/diagrams

## Field Reference

### Core Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | integer | System | Auto-generated unique identifier |
| `organization-id` | integer | Yes | Parent organization |
| `name` | string | Yes | Document title |
| `content` | string | No | Rich HTML content |
| `document-folder-id` | integer | No | Folder location |

### Relationship Fields

| Field | Type | Description |
|-------|------|-------------|
| `resource-id` | integer | Related resource ID |
| `resource-type` | string | Related resource type |

### Metadata Fields

| Field | Type | Description |
|-------|------|-------------|
| `created-at` | datetime | Creation timestamp |
| `updated-at` | datetime | Last update timestamp |

## API Patterns

### List Documents

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

### Get Single Document

```http
GET /documents/789
x-api-key: YOUR_API_KEY
```

**With Includes:**
```http
GET /documents/789?include=organization,document-folder,related-items
```

### Create Document

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

### Update Document Metadata

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

### Delete Document

```http
DELETE /documents/789
x-api-key: YOUR_API_KEY
```

## Document Sections API

Use the sections API to read and edit the content of multi-section documents. This is the correct approach for modifying document body content — `PATCH /documents/:id` with a `content` attribute silently fails on multi-section documents.

### Section Types

| Type | Description |
|------|-------------|
| `Document::Heading` | Heading element (renders as `<h2>`, etc.) |
| `Document::Text` | Rich HTML text block |

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

### Full Workflow: Restructure a Document

```javascript
async function restructureDocument(docId, newSections) {
  // 1. List existing sections
  const existing = await fetch(
    `${baseUrl}/documents/${docId}/relationships/sections`,
    { headers: { 'x-api-key': apiKey } }
  ).then(r => r.json());

  // 2. Delete all existing sections
  for (const section of existing.data) {
    await fetch(
      `${baseUrl}/documents/${docId}/relationships/sections/${section.id}`,
      { method: 'DELETE', headers: { 'x-api-key': apiKey } }
    );
  }

  // 3. Create new sections in order
  for (const section of newSections) {
    await fetch(
      `${baseUrl}/documents/${docId}/relationships/sections`,
      {
        method: 'POST',
        headers: { 'x-api-key': apiKey, 'Content-Type': 'application/vnd.api+json' },
        body: JSON.stringify({
          data: {
            type: 'document-sections',
            attributes: {
              'section-type': section.type,  // 'Document::Heading' or 'Document::Text'
              content: section.content
            }
          }
        })
      }
    );
  }

  // 4. Publish to make changes visible (must use PATCH, not POST)
  await fetch(
    `${baseUrl}/documents/${docId}/publish`,
    { method: 'PATCH', headers: { 'x-api-key': apiKey } }
  );
}
```

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

## Common Workflows

### Create Comprehensive Runbook

```javascript
async function createRunbook(orgId, runbookData) {
  // Ensure folder exists
  const folder = await ensureDocumentFolder(orgId, runbookData.folderPath);

  // Build content with embedded resources
  let content = `
    <h1>${runbookData.title}</h1>
    <h2>Overview</h2>
    <p>${runbookData.overview}</p>
  `;

  // Add prerequisites section
  if (runbookData.prerequisites?.length) {
    content += `
      <h2>Prerequisites</h2>
      <ul>${runbookData.prerequisites.map(p => `<li>${p}</li>`).join('')}</ul>
    `;
  }

  // Add procedure steps
  if (runbookData.steps?.length) {
    content += `
      <h2>Procedure</h2>
      <ol>${runbookData.steps.map(s => `<li>${s}</li>`).join('')}</ol>
    `;
  }

  // Embed related passwords
  if (runbookData.passwordIds?.length) {
    content += `
      <h2>Required Credentials</h2>
      ${runbookData.passwordIds.map(id =>
        `<div data-embedded-password-id="${id}"></div>`
      ).join('')}
    `;
  }

  // Create the document
  const doc = await createDocument({
    'organization-id': orgId,
    name: runbookData.title,
    'document-folder-id': folder?.id,
    content: content
  });

  // Create related items
  for (const configId of runbookData.relatedConfigs || []) {
    await createRelatedItem({
      'resource-id': doc.id,
      'resource-type': 'Document',
      'destination-id': configId,
      'destination-type': 'Configuration'
    });
  }

  return doc;
}
```

### Document Search

```javascript
async function searchDocuments(orgId, query) {
  const docs = await fetchDocuments({
    filter: { 'organization-id': orgId }
  });

  const queryLower = query.toLowerCase();
  return docs.filter(doc =>
    doc.attributes.name.toLowerCase().includes(queryLower) ||
    doc.attributes.content?.toLowerCase().includes(queryLower)
  );
}
```

### Export Documentation

```javascript
async function exportOrgDocumentation(orgId) {
  const docs = await fetchDocuments({
    filter: { 'organization-id': orgId },
    include: 'document-folder'
  });

  return docs.map(doc => ({
    name: doc.attributes.name,
    folder: doc.included?.find(i =>
      i.type === 'document-folders' &&
      i.id === doc.relationships['document-folder']?.data?.id
    )?.attributes?.name || 'Root',
    content: doc.attributes.content,
    createdAt: doc.attributes['created-at'],
    updatedAt: doc.attributes['updated-at']
  }));
}
```

### Documentation Health Check

```javascript
async function documentationHealthCheck(orgId) {
  const docs = await fetchDocuments({
    filter: { 'organization-id': orgId }
  });

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  return {
    totalDocuments: docs.length,
    recentlyUpdated: docs.filter(d =>
      new Date(d.attributes['updated-at']) > thirtyDaysAgo
    ).length,
    stale: docs.filter(d => {
      const updated = new Date(d.attributes['updated-at']);
      const yearAgo = new Date();
      yearAgo.setFullYear(yearAgo.getFullYear() - 1);
      return updated < yearAgo;
    }).map(d => ({
      name: d.attributes.name,
      lastUpdated: d.attributes['updated-at']
    })),
    empty: docs.filter(d =>
      !d.attributes.content || d.attributes.content.trim().length < 50
    ).map(d => d.attributes.name)
  };
}
```

### Clone Document Template

```javascript
async function cloneDocumentToOrg(templateDocId, targetOrgId, newName) {
  // Get template document
  const template = await getDocument(templateDocId);

  // Create new document with template content
  return await createDocument({
    'organization-id': targetOrgId,
    name: newName || template.attributes.name,
    content: template.attributes.content
  });
}
```

## Document Templates

### Standard Documentation Structure

**Network Overview:**
```html
<h1>Network Overview</h1>

<h2>Network Topology</h2>
<p>[Network diagram embedded here]</p>

<h2>IP Addressing</h2>
<table>
  <tr><th>Subnet</th><th>VLAN</th><th>Purpose</th></tr>
  <tr><td>192.168.1.0/24</td><td>1</td><td>Servers</td></tr>
  <tr><td>192.168.10.0/24</td><td>10</td><td>Workstations</td></tr>
</table>

<h2>Core Infrastructure</h2>
<p>[Embedded configuration items]</p>

<h2>Firewall Rules Summary</h2>
<p>[Rule overview]</p>

<h2>Related Credentials</h2>
<p>[Embedded passwords]</p>
```

**Disaster Recovery:**
```html
<h1>Disaster Recovery Plan</h1>

<h2>Contact Information</h2>
<p>[Primary contacts embedded]</p>

<h2>Critical Systems</h2>
<ol>
  <li>Domain Controller</li>
  <li>Email Server</li>
  <li>File Server</li>
</ol>

<h2>Recovery Procedures</h2>
<h3>Complete Site Failure</h3>
<ol>
  <li>Activate backup site</li>
  <li>Restore from cloud backup</li>
  <li>Verify DNS failover</li>
</ol>

<h2>Required Credentials</h2>
<p>[Recovery passwords embedded]</p>

<h2>Vendor Contacts</h2>
<p>[Vendor contact information]</p>
```

## Error Handling

### Common API Errors

| Code | Message | Resolution |
|------|---------|------------|
| 400 | Name can't be blank | Provide document name |
| 400 | Organization required | Include organization-id |
| 401 | Invalid API key | Check IT_GLUE_API_KEY |
| 404 | Document not found | Verify document ID |
| 404 | POST /publish returns 404 | Use **PATCH** not POST for publish |
| 422 | Invalid folder | Query valid folder IDs |

### Validation Errors

| Error | Cause | Fix |
|-------|-------|-----|
| Name required | Missing name | Add name to request |
| Organization required | No org ID | Include organization-id |
| Invalid folder | Bad folder ID | Query /document-folders |
| Content too large | Exceeds size limit | Reduce content size |

### Error Recovery Pattern

```javascript
async function safeCreateDocument(data) {
  try {
    return await createDocument(data);
  } catch (error) {
    if (error.status === 422) {
      const errors = error.errors || [];

      // Handle invalid folder
      if (errors.some(e => e.detail?.includes('folder'))) {
        console.log('Invalid folder. Creating at root level.');
        delete data['document-folder-id'];
        return await createDocument(data);
      }
    }

    throw error;
  }
}
```

## Best Practices

1. **Use consistent structure** - Follow templates for standard documents
2. **Organize with folders** - Create logical folder hierarchy
3. **Keep content current** - Review and update regularly
4. **Embed credentials** - Use embedded passwords instead of plain text
5. **Link related items** - Connect documents to configurations
6. **Use meaningful names** - Clear, descriptive document titles
7. **Include metadata** - Add last reviewed date, author, version
8. **Standardize formatting** - Consistent headings and structure
9. **Add visual aids** - Include diagrams and screenshots
10. **Regular audits** - Review documentation quarterly

## Related Skills

- [IT Glue Organizations](../organizations/SKILL.md) - Document organization scope
- [IT Glue Configurations](../configurations/SKILL.md) - Related configurations
- [IT Glue Passwords](../passwords/SKILL.md) - Embedded credentials
- [IT Glue Flexible Assets](../flexible-assets/SKILL.md) - Structured documentation
- [IT Glue API Patterns](../api-patterns/SKILL.md) - API reference
