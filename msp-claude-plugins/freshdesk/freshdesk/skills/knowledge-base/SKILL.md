---
name: "Freshdesk Knowledge Base"
description: >
  Freshdesk Solutions knowledge base: the three-level categories -> folders ->
  articles hierarchy, article fields and draft/published status, finding an
  article by walking that tree (there is no KB search tool), and the MSP
  workflow of suggesting relevant KB articles to deflect or resolve a ticket,
  through the Freshdesk REST API v2.
when_to_use: >-
  When navigating the Freshdesk solutions knowledge base — categories, folders, and articles — or
  suggesting relevant KB articles for a ticket. Use when: freshdesk knowledge base, freshdesk
  solutions, freshdesk article, freshdesk kb, solution category freshdesk, solution folder
  freshdesk, suggest article freshdesk, or deflect ticket freshdesk.
---

# Freshdesk Knowledge Base (Solutions)

## Overview

Freshdesk's knowledge base is called **Solutions** and is organized as a
nested, three-level hierarchy. Articles live inside folders, folders live
inside categories. Surfacing the right article on a ticket deflects repeat
questions and speeds resolution. This skill covers navigating the hierarchy,
reading articles, and suggesting articles for tickets through tools named
`freshdesk_solutions_<action>`.

## Anti-triggers

Freshdesk Solutions is a **customer-facing** knowledge base published to
the support portal. Writing internal MSP documentation here exposes it to
customers.

- **Internal runbooks, network diagrams, and client documentation** —
  those belong in an MSP documentation platform; use `hudu-articles` or
  `it-glue-documents`. Never draft an internal procedure into a
  Solutions article.
- **Credentials or secrets referenced by a procedure** — use
  `hudu-passwords` or `it-glue-passwords`; nothing in the
  Solutions hierarchy is a safe place for them.
- **Attaching the article to a ticket or replying with it** — ticket
  replies and notes are `freshdesk-ticketing`; this skill finds the
  article, it does not send it.

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

## Finding an Article — There Is No KB Search

Freshdesk's REST API exposes `GET /api/v2/search/solutions?term=...`, but
**this plugin cannot reach it.** The MCP server registers no knowledge-base
search handler — only list/get/create/update/delete over categories, folders
and articles (`freshdesk-mcp/src/domains/solutions.ts`). Tickets, contacts and
companies each get a search tool, so search reads as a house pattern; the
knowledge base is the one surface that does not have it.

The real path to an article is the walk:

1. `freshdesk_solutions_categories_list` — the top level.
2. `freshdesk_solutions_folders_list` for the category that plausibly owns
   the topic (takes the parent `category_id`).
3. `freshdesk_solutions_articles_list` for that folder (takes `folder_id`),
   then `freshdesk_solutions_articles_get` on the candidates worth reading.

You do the keyword matching yourself, against article `title` and `tags` as
you walk. The tree is small and changes rarely, so cache it for the session
rather than re-listing it per ticket. When a request genuinely needs
full-text search across article bodies, say the plugin cannot do it and point
the operator at the Freshdesk portal search — do not present a walk as if it
were an exhaustive search.

## Suggesting KB Articles for a Ticket

A high-value MSP workflow is matching an incoming ticket to existing
knowledge so the agent can resolve faster or deflect entirely:

1. **Extract the symptom** — pull the ticket subject and the first incoming
   message; identify keywords (product, error text, action).
2. **Walk to candidates** — pick the category and folder that plausibly own
   the topic and list their articles. There is no KB search tool; see above.
3. **Filter to published** — keep only `status: 2` articles; ignore drafts.
4. **Rank candidates** — prefer exact title/`tags` keyword matches and higher
   `hits` (popularity); break ties by recency.
5. **Present the top matches** — surface 1-3 articles with title and link.
6. **Act on the ticket** — either attach the article link in a customer-facing
   reply (deflection) or cite it in an internal note as the resolution path.

```text
Ticket: "Outlook shows Disconnected since this morning"
  walk: category "Email & Collaboration" -> folder "Outlook" -> articles
  candidates (published, ranked by title/tag match + hits):
    1. Fix Outlook disconnected status        (hits: 1,204)
    2. Rebuild the Outlook OST cache           (hits:   538)
  -> reply with article #1 link, or add internal note citing it
```

## Error Handling

| Error | Cause | Resolution |
|-------|-------|------------|
| 404 Not found | Unknown category/folder/article ID | Re-list the parent level to confirm IDs |
| 400 Bad request | `freshdesk_solutions_articles_create` missing a required field | Supply all of `folder_id`, `title`, `description`, `status` |
| 403 Forbidden | Folder visibility restricts access | Check folder `visibility`; the article may be internal |

## Best Practices

- **Respect folder visibility** — a folder restricted to agents or specific
  companies should not be shared more broadly.
- **Cache the hierarchy** — categories and folders change rarely; cache the
  tree within a session to reduce request volume.
- **Track deflection** — note when a suggested article resolved a ticket; it
  signals which articles to keep current.

## Related Skills

- [Freshdesk Ticketing](../ticketing/SKILL.md) - Replying with or citing KB articles on tickets
- [Freshdesk API Patterns](../api-patterns/SKILL.md) - Pagination and rate limits while walking the hierarchy
- [Freshdesk Contacts & Companies](../contacts-companies/SKILL.md) - Company-scoped folder visibility
