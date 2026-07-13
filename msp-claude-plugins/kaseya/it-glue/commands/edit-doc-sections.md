---
description: Read, edit, and restructure sections of an IT Glue document
argument-hint: "<document_id> <action> [section_id] [content] [section_type]"
arguments: [document_id, action, section_id, content, section_type]
---

# Edit IT Glue Document Sections

Read and edit the sections that make up an IT Glue document's body content.

> **Note:** Use this command to modify document content — `PATCH /documents/:id` with a `content` attribute does not work for multi-section documents.

## Arguments

- `document_id` (required) — IT Glue document ID
- `action` (required) — Action to perform: list, create, update, delete, publish
- `section_id` (optional) — Section ID (required for update and delete)
- `content` (optional) — HTML content for the section (required for create and update)
- `section_type` (optional; default: `text`) — Section type: heading or text (default: text)

## Prerequisites

- Valid IT Glue API key configured (`IT_GLUE_API_KEY`)
- IT Glue region configured (`IT_GLUE_REGION`)
- Document ID of the target document

## Actions

### list — List All Sections

Show all sections in a document in order.

```
/edit-doc-sections <document_id> list
```

**API call:**

```http
GET /documents/{document_id}/relationships/sections
x-api-key: YOUR_API_KEY
```

**Output:**

```
Document 789 — Sections (3)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[1001] Heading  (pos 1)
  <h2>Overview</h2>

[1002] Text     (pos 2)
  <p>This procedure covers the steps for setting up a new user...</p>

[1003] Heading  (pos 3)
  <h2>Prerequisites</h2>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### create — Add a New Section

Append a new section to the document.

```
/edit-doc-sections <document_id> create --content "<p>New content.</p>" --section_type text
```

**Section types:**

| Value | API type | Description |
|-------|----------|-------------|
| `heading` | `Document::Heading` | Heading element |
| `text` | `Document::Text` | Rich HTML text block |

**API call:**

```http
POST /documents/{document_id}/relationships/sections
Content-Type: application/vnd.api+json
x-api-key: YOUR_API_KEY
```

```json
{
  "data": {
    "type": "document-sections",
    "attributes": {
      "section-type": "Document::Text",
      "content": "<p>New content.</p>"
    }
  }
}
```

After creating sections, publish the document with the `publish` action.

### update — Edit an Existing Section

Update the content of a specific section.

```
/edit-doc-sections <document_id> update --section_id 1002 --content "<p>Updated content.</p>"
```

**API call:**

```http
PATCH /documents/{document_id}/relationships/sections/{section_id}
Content-Type: application/vnd.api+json
x-api-key: YOUR_API_KEY
```

```json
{
  "data": {
    "type": "document-sections",
    "attributes": {
      "content": "<p>Updated content.</p>"
    }
  }
}
```

After updating sections, publish the document with the `publish` action.

### delete — Remove a Section

Delete a specific section from the document.

```
/edit-doc-sections <document_id> delete --section_id 1002
```

**API call:**

```http
DELETE /documents/{document_id}/relationships/sections/{section_id}
x-api-key: YOUR_API_KEY
```

### publish — Publish the Document

Make all section changes visible. **Always use PATCH — POST returns 404.**

```
/edit-doc-sections <document_id> publish
```

**API call:**

```http
PATCH /documents/{document_id}/publish
x-api-key: YOUR_API_KEY
```

## Typical Workflow

To restructure a document to match a template:

```
1. /edit-doc-sections 789 list
   → see current sections and their IDs

2. /edit-doc-sections 789 update --section_id 1001 --content "<h2>New Heading</h2>"
3. /edit-doc-sections 789 update --section_id 1002 --content "<p>Updated body text.</p>"

4. /edit-doc-sections 789 publish
   → changes are now live in IT Glue
```

## Error Handling

| Situation | Action |
|-----------|--------|
| 404 on publish | Make sure you used PATCH, not POST |
| 404 on document | Verify the document ID exists |
| 401 Unauthorized | Check `IT_GLUE_API_KEY` value |
| Sections not updating | Did you call publish after editing? |

## Related Commands

- `/search-docs` — Find the document ID by name
- `/find-organization` — Look up the organization owning the document
