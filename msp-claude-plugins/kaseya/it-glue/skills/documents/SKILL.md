---
name: "IT Glue Documents"
description: >
  IT Glue documents: rich-HTML documentation records scoped to an organization,
  including document folders, multi-section content via the Document Sections
  API, embedded passwords/configurations/images, and related-item links to
  other IT Glue resources.
when_to_use: >-
  When creating, organizing, and managing documentation. Use when: it glue document,
  documentation, runbook, procedure documentation, it glue docs, document management, sop
  documentation, or knowledge base.
---

# IT Glue Documents Management

## Overview

Documents in IT Glue provide structured documentation storage for organizations, enabling technicians to create runbooks, procedures, network diagrams, and general documentation. Documents support rich HTML content, embedded passwords, and relationships to other IT Glue resources.

## Anti-triggers

- **Documentation with a fixed field schema** — repeatable, filterable
  records are flexible assets, not free-form documents; use
  `it-glue-flexible-assets`.
- **The credential a runbook refers to** — passwords are separate
  records that documents embed by reference; use `it-glue-passwords`.
- **Device facts rather than narrative** — use
  `it-glue-configurations`.

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
- **Passwords** - Inline credential display (`<div data-embedded-password-id="12345"></div>`)
- **Configurations** - Asset links (`<div data-embedded-configuration-id="67890"></div>`)
- **Contacts** - Contact information
- **Images** - Uploaded images/diagrams (`<img src="/uploads/organization/123/...">`)

### Document Sections

Multi-section documents are composed of ordered sections rather than a single `content` blob — this is what the Document Sections API reads and writes.

| Type | Description |
|------|-------------|
| `Document::Heading` | Heading element (renders as `<h2>`, etc.) |
| `Document::Text` | Rich HTML text block |

See [references/fields.md](references/fields.md) for the complete field reference.

## Common Workflows

### Restructure a Document

Sections must be replaced, not patched, and the document must be republished for changes to appear:

1. List existing sections (`GET .../relationships/sections`)
2. Delete all existing sections
3. Create new sections in the desired order
4. Publish the document with **PATCH** (not POST) to make changes visible

See [references/examples.md](references/examples.md) for the full `restructureDocument` implementation, plus runbook creation, search, export, health-check, and template-cloning workflow examples.

### New Client Runbook

Ensure the target folder exists, build HTML content section by section (overview, prerequisites, steps, embedded credentials), create the document, then create related items linking it to relevant configurations.

## API Patterns

- **List documents by organization only** — `GET /documents` (top-level) returns 404 in practice. Use `GET /organizations/:id/relationships/documents` instead.
- **Editing body content** — `PATCH /documents/:id` with a `content` attribute silently does nothing on multi-section documents. Use the Document Sections API (create/update/delete individual sections) instead.
- **Publishing** — `PATCH /documents/:id/publish` makes section edits visible. POST returns 404; no request body is required.

See [references/api.md](references/api.md) for the complete endpoint catalog: document, section, folder, and related-item CRUD with full request/response examples.

## Gotchas

- **404 on organization documents** usually means the IT Glue Documents module isn't enabled for that organization — fall back to `search_flexible_assets`, since flexible assets are the more common documentation mechanism in practice.
- **Section content updates require the Sections API**, not `PATCH /documents/:id` — the top-level `content` attribute is only honored for single-blob (non-sectioned) documents.
- **Publish is PATCH, not POST** — POSTing to `/documents/:id/publish` returns 404.

See [references/errors.md](references/errors.md) for the complete error-code and validation-error tables plus a retry pattern for invalid-folder errors.

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

## Related Skills

- [IT Glue Organizations](../organizations/SKILL.md) - Document organization scope
- [IT Glue Configurations](../configurations/SKILL.md) - Related configurations
- [IT Glue Passwords](../passwords/SKILL.md) - Embedded credentials
- [IT Glue Flexible Assets](../flexible-assets/SKILL.md) - Structured documentation
- [IT Glue API Patterns](../api-patterns/SKILL.md) - API reference
