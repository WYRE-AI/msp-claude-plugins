---
name: "Hudu Articles"
description: >
  Hudu knowledge base articles: HTML content format, company-scoped vs
  global articles, article folders (including nesting), drafts vs
  published, the /api/v1/articles endpoint surface, and search,
  templating, and documentation-health patterns.
when_to_use: >-
  When creating, searching, updating, or managing Hudu documentation articles and their folders.
  Use when: hudu article, hudu knowledge base, hudu kb, hudu documentation, hudu runbook, hudu
  procedure, knowledge base article, article management, or hudu docs.
---

# Hudu Articles Management

## Overview

Articles in Hudu serve as the knowledge base, providing a place for runbooks, procedures, network diagrams, SOPs, and general documentation. Articles support rich HTML content, can be organized into folders, and can be scoped to specific companies or kept as global (shared across all companies). MSP technicians rely on articles to quickly find procedures and reference documentation during troubleshooting.

## Anti-triggers

- **The same knowledge base in IT Glue** — IT Glue calls these Documents;
  use `it-glue-documents`. Both platforms say "article", "document", and
  "runbook" interchangeably, so the vendor name is the only signal.
- **A structured record rather than prose** — if the thing has fields
  (make, model, IP, expiry) it belongs on an asset layout, not in article
  HTML; use `hudu-assets`.
- **A credential mentioned in a runbook** — passwords have their own
  endpoint and their own audit trail; use `hudu-passwords`. Do not let an
  agent paste a credential into article body HTML to "keep it together".
- **A ticket resolution note** — work notes belong on the ticket in the
  PSA, not in the knowledge base; use `autotask-ticket-notes-attachments`
  or `connectwise-psa-tickets`.

## Key Concepts

### Article Scope

Articles can be scoped in two ways:

| Scope | Description | Use Case |
|-------|-------------|---------|
| Company-specific | Tied to a single company | Network diagram for Acme Corp |
| Global | Available across all companies | Standard new user setup procedure |

Scope is controlled entirely by `company_id` — omit it (or set it to null) to create a global article.

### Article Folders

Folders organize articles within a company or globally, and can be nested via `parent_folder_id`:

```
Company: Acme Corporation
+-- Articles
    +-- Procedures
    |   +-- Backup Procedure
    |   +-- Disaster Recovery Plan
    +-- Network
    |   +-- Network Overview
    |   +-- IP Addressing Scheme
    +-- Onboarding
        +-- New User Setup
        +-- Hardware Deployment
```

### Article Content

Article content is stored as HTML. Hudu's editor supports:

- Headings, paragraphs, lists
- Tables
- Images (inline and uploaded)
- Code blocks
- Embedded passwords (referenced by ID)
- Links to other Hudu resources

### Draft vs Published

Articles can be saved as drafts before publishing:

| State | Description |
|-------|-------------|
| Draft | Work in progress, not visible to all users |
| Published | Visible to users with appropriate permissions |

### Fields

Key fields: `id`, `company_id`, `name` (required), `content` (HTML), `folder_id`, `draft`, `slug`, `created_at`, `updated_at`, `url`.

See [references/fields.md](references/fields.md) for the complete field reference.

## API Patterns

| Operation | Request |
|-----------|---------|
| List / filter | `GET /api/v1/articles?company_id=123&name=backup&page=1` |
| Get one | `GET /api/v1/articles/456` |
| Create | `POST /api/v1/articles` with `{ "article": { ... } }` |
| Update | `PUT /api/v1/articles/456` |
| Delete | `DELETE /api/v1/articles/456` |
| Archive | `PUT /api/v1/articles/456/archive` |
| Folders | `GET|POST /api/v1/folders` (filter with `?company_id=`) |

All requests use the `x-api-key` header. Request and response bodies are wrapped in a singular resource key (`article`, `folder`).

See [references/api.md](references/api.md) for the complete endpoint catalog with request/response examples.

## Common Workflows

### Create Comprehensive Runbook

```javascript
async function createRunbook(companyId, runbookData) {
  // Ensure folder exists
  const folder = await ensureFolder(companyId, runbookData.folderPath);

  // Build content
  let content = `<h1>${runbookData.title}</h1>`;
  content += `<h2>Overview</h2><p>${runbookData.overview}</p>`;

  if (runbookData.prerequisites?.length) {
    content += `<h2>Prerequisites</h2><ul>`;
    content += runbookData.prerequisites.map(p => `<li>${p}</li>`).join('');
    content += `</ul>`;
  }

  if (runbookData.steps?.length) {
    content += `<h2>Procedure</h2><ol>`;
    content += runbookData.steps.map(s => `<li>${s}</li>`).join('');
    content += `</ol>`;
  }

  // Create the article
  return await createArticle({
    name: runbookData.title,
    company_id: companyId,
    folder_id: folder?.id,
    content: content
  });
}
```

### Article Search

The API filters on `name` only — full-text search across `content` must be done client-side after fetching.

```javascript
async function searchArticles(companyId, query) {
  const articles = await fetchArticles({ company_id: companyId });

  const queryLower = query.toLowerCase();
  return articles.filter(article =>
    article.name.toLowerCase().includes(queryLower) ||
    article.content?.toLowerCase().includes(queryLower)
  );
}
```

### Documentation Health Check

```javascript
async function documentationHealthCheck(companyId) {
  const articles = await fetchArticles({ company_id: companyId });

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const yearAgo = new Date();
  yearAgo.setFullYear(yearAgo.getFullYear() - 1);

  return {
    totalArticles: articles.length,
    drafts: articles.filter(a => a.draft).length,
    recentlyUpdated: articles.filter(a =>
      new Date(a.updated_at) > thirtyDaysAgo
    ).length,
    stale: articles.filter(a =>
      new Date(a.updated_at) < yearAgo
    ).map(a => ({
      name: a.name,
      lastUpdated: a.updated_at
    })),
    empty: articles.filter(a =>
      !a.content || a.content.trim().length < 50
    ).map(a => a.name)
  };
}
```

### Clone Article to Another Company

Folder IDs are company-scoped, so do not carry `folder_id` across companies — resolve or create a folder in the target company first.

```javascript
async function cloneArticle(articleId, targetCompanyId, newName) {
  const template = await getArticle(articleId);

  return await createArticle({
    name: newName || template.name,
    company_id: targetCompanyId,
    content: template.content
  });
}
```

## Article Templates

Standard HTML skeletons for Network Overview and Disaster Recovery Plan articles are in
[references/templates.md](references/templates.md).

## Gotchas

- **Folder IDs are scoped to a company.** Passing a `folder_id` belonging to another company yields a 422; on failure, retry without `folder_id` to create at root level.
- **A missing `company_id` is not an error** — it silently creates a global article visible to every company. Double-check before creating client-specific content.
- **Content is raw HTML.** Values interpolated into `content` are not escaped by the API; sanitize any untrusted input before writing.
- **Archive is a distinct verb** (`PUT /articles/:id/archive`), not an `archived` field on update.

See [references/errors.md](references/errors.md) for the complete error and validation table plus a recovery pattern.

## Best Practices

1. **Use consistent structure** - Follow templates for standard articles
2. **Organize with folders** - Create a logical folder hierarchy per company
3. **Use global articles** - Share standard procedures across all companies
4. **Include visual aids** - Add diagrams, screenshots, and tables
5. **Include metadata** - Add last reviewed date and author at the top
6. **Link related resources** - Reference assets and passwords

## Related Skills

- [Hudu Companies](../companies/SKILL.md) - Article company scope
- [Hudu Assets](../assets/SKILL.md) - Related asset references
- [Hudu Passwords](../passwords/SKILL.md) - Embedded credentials
- [Hudu Websites](../websites/SKILL.md) - Website documentation
- [Hudu API Patterns](../api-patterns/SKILL.md) - API reference
