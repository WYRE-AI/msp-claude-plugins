---
name: "Freshdesk Knowledge Base"
when_to_use: "When navigating the Freshdesk solutions knowledge base — categories, folders, and articles — or suggesting relevant KB articles for a ticket"
description: >
  Use this skill when working with the Freshdesk solutions knowledge base — the
  nested three-level hierarchy of categories -> folders -> articles. Covers
  listing the hierarchy, retrieving and searching articles, and the MSP
  workflow of suggesting relevant KB articles to deflect or resolve a ticket,
  through the Freshdesk REST API v2.
triggers:
  - freshdesk knowledge base
  - freshdesk solutions
  - freshdesk article
  - freshdesk kb
  - solution category freshdesk
  - solution folder freshdesk
  - suggest article freshdesk
  - deflect ticket freshdesk
---

# Freshdesk Knowledge Base (Solutions)

## Overview

Freshdesk's knowledge base is called **Solutions** and is organized as a
nested, three-level hierarchy. Articles live inside folders, folders live
inside categories. Surfacing the right article on a ticket deflects repeat
questions and speeds resolution. This skill covers navigating the hierarchy,
reading and searching articles, and suggesting articles for tickets through
tools named `freshdesk_solutions_<action>`.

## The Three-Level Hierarchy

```
Category            (top level — e.g. "Email & Collaboration")
  └─ Folder         (grouping — e.g. "Outlook")
       └─ Article   (the content — e.g. "Fix Outlook disconnected status")
```

| Level | Resource | Parent |
|-------|----------|--------|
| Category | `/solutions/categories` | — (top level) |
| Folder | `/solutions/folders` | Category |
| Article | `/solutions/articles` | Folder |

You traverse top-down: list categories, list the folders within a category,
then list the articles within a folder.

## Navigating the Hierarchy

### List Categories

```http
GET /api/v2/solutions/categories
```

Returns each category's `id`, `name`, and `description`.

### List Folders in a Category

```http
GET /api/v2/solutions/categories/{category_id}/folders
```

Returns each folder's `id`, `name`, `description`, and `visibility` (which
audiences can see it — e.g. all users, logged-in users, or specific
companies/agents).

### List Articles in a Folder

```http
GET /api/v2/solutions/folders/{folder_id}/articles
```

Returns article summaries within the folder.

### Get a Single Article

```http
GET /api/v2/solutions/articles/{article_id}
```

### Key Article Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | Integer | Unique identifier |
| `title` | String | Article title |
| `description` | String (HTML) | Body content |
| `status` | Integer | 1 = Draft, 2 = Published |
| `folder_id` | Integer | Parent folder |
| `category_id` | Integer | Parent category |
| `tags` | Array | Labels for retrieval |
| `hits` | Integer | View count (popularity signal) |

Only **published** articles (`status: 2`) should be suggested to customers;
drafts are internal-only.

## Searching Articles

```http
GET /api/v2/search/solutions?term=outlook%20disconnected
```

Search returns articles matching the term across titles and bodies. Use it
when you have a symptom phrase from a ticket and want candidate articles
without walking the whole hierarchy. Fall back to hierarchy navigation when
you want to browse a known category or folder rather than free-text search.

## Suggesting KB Articles for a Ticket

A high-value MSP workflow is matching an incoming ticket to existing
knowledge so the agent can resolve faster or deflect entirely:

1. **Extract the symptom** — pull the ticket subject and the first incoming
   message; identify keywords (product, error text, action).
2. **Search solutions** — run `GET /search/solutions?term=...` with the
   strongest keywords.
3. **Filter to published** — keep only `status: 2` articles; ignore drafts.
4. **Rank candidates** — prefer exact title/keyword matches and higher `hits`
   (popularity); break ties by recency.
5. **Present the top matches** — surface 1-3 articles with title and link.
6. **Act on the ticket** — either attach the article link in a customer-facing
   reply (deflection) or cite it in an internal note as the resolution path.

```text
Ticket: "Outlook shows Disconnected since this morning"
  search term: "outlook disconnected"
  candidates (published, ranked by relevance + hits):
    1. Fix Outlook disconnected status        (hits: 1,204)
    2. Rebuild the Outlook OST cache           (hits:   538)
  -> reply with article #1 link, or add internal note citing it
```

## Error Handling

| Error | Cause | Resolution |
|-------|-------|------------|
| 404 Not found | Unknown category/folder/article ID | Re-list the parent level to confirm IDs |
| 400 Bad request | Missing/empty search term | Provide a non-empty `term` |
| 403 Forbidden | Folder visibility restricts access | Check folder `visibility`; the article may be internal |

## Best Practices

- **Suggest published articles only** — never surface drafts to customers.
- **Respect folder visibility** — a folder restricted to agents or specific
  companies should not be shared more broadly.
- **Use search first for symptoms, hierarchy for browsing** — they complement
  each other.
- **Cache the hierarchy** — categories and folders change rarely; cache the
  tree within a session to reduce request volume.
- **Track deflection** — note when a suggested article resolved a ticket; it
  signals which articles to keep current.

## Related Skills

- [Freshdesk Ticketing](../ticketing/SKILL.md) - Replying with or citing KB articles on tickets
- [Freshdesk API Patterns](../api-patterns/SKILL.md) - Pagination and rate limits while walking the hierarchy
- [Freshdesk Contacts & Companies](../contacts-companies/SKILL.md) - Company-scoped folder visibility
