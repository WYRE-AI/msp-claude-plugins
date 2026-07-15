---
description: Search or list Clio matters by name/client and status
argument-hint: "[query] [status]"
arguments: [query, status]
---

# Search Clio Matters

Search for matters in Clio by client/matter name, optionally filtered by
status. With no arguments, lists the firm's open matters.

## Prerequisites

- Clio connected via Conduit (`https://conduit.wyre.ai/connect/clio`)
- Navigate into the `matters` domain (`clio_navigate`) before calling
  matter tools
- Tools: `clio_matters_list`, `clio_matters_get`, `clio_contacts_list`

## Steps

1. **Navigate into the matters domain** with `clio_navigate` if you
   haven't already (check `clio_status` first).

2. **Build the filter**

   - If `query` looks like a client/company name rather than a matter
     number, consider resolving it against `clio_contacts_list` first so
     you can filter matters by `client_id` rather than relying on a loose
     text match.
   - Default `status` to open matters unless the user asked for
     closed/pending/all.

3. **Call `clio_matters_list`** with the resolved filters and a sensible
   `limit`.

4. **Page if needed** — check for a next-page cursor in the response
   before declaring the result set complete (see
   [api-patterns](../skills/api-patterns/SKILL.md#pagination)).

5. **Format and return results** — matter number/display name, client
   name, status, responsible attorney, practice area.

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| query | string | No | - | Client name, company name, or matter number/description to search |
| status | string | No | open | `open` / `pending` / `closed` / `all` |

## Examples

```
/search-matters
```

```
/search-matters "Acme Corporation"
```

```
/search-matters "Acme" closed
```

```
/search-matters "" all
```

## Output

```
Found 3 matters matching "Acme"

+----------+------------------------------+----------+-------------------+--------------+
| Number   | Matter                       | Client   | Status   | Attorney           |
+----------+------------------------------+----------+----------+---------------------+
| 2024-014 | Acme v. Beta Supply           | Acme Corp | Open    | J. Rivera           |
| 2023-102 | Acme - Lease Renewal          | Acme Corp | Open    | J. Rivera           |
| 2022-047 | Acme - Trademark Registration | Acme Corp | Closed  | S. Chen             |
+----------+------------------------------+----------+----------+---------------------+

Next: /matter-summary <matter_id> for full detail on any of these.
```

## No Results

```
No matters found matching "Acme" with status=open

Suggestions:
- Try status=all to include pending/closed matters
- Search by contact instead: check /search-contacts "Acme"
- Verify the client name spelling
```

## Related Commands

- `/matter-summary` — full detail on one matter
- `/search-contacts` — find the client contact first if a matter search comes up empty
