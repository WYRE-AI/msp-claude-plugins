---
description: Search Clio contacts by name, company, or email
argument-hint: "<query>"
arguments: [query]
---

# Search Clio Contacts

Search for people and companies in Clio's contact list. Useful for
resolving a client before creating a matter or logging a time entry, or
for checking whether a contact already exists before creating a new one.

## Prerequisites

- Clio connected via Conduit
- Navigate into the `contacts` domain (`clio_navigate`)
- Tools: `clio_contacts_list`, `clio_contacts_get`

## Steps

1. **Navigate into the contacts domain** if you haven't already.

2. **Search** — call `clio_contacts_list` with the query matched against
   name, company, and email. Law firms commonly have multiple contacts
   with similar or identical names across different matters, so don't
   assume the first hit is the right one.

3. **Page if needed** before declaring results complete.

4. **Format and return results**, distinguishing people from companies,
   and noting matter associations if the user's context needs
   disambiguation (e.g. "which Acme contact — the one on the 2024
   litigation matter or the 2023 lease matter?").

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| query | string | Yes | Name, company name, or email to search |

## Examples

```
/search-contacts "Acme"
```

```
/search-contacts "jsmith@acmecorp.com"
```

```
/search-contacts "John Smith"
```

## Output

```
Found 2 contacts matching "John Smith"

+-------------+------+----------------------------+------------------------+
| Name        | Type | Email                      | Notes                  |
+-------------+------+----------------------------+------------------------+
| John Smith  | Person | jsmith@acmecorp.com      | Client — Acme Corp     |
| John Smith  | Person | j.smith@betasupply.com   | Opposing party — Beta  |
+-------------+------+----------------------------+------------------------+

These are different people with the same name — confirm which one before
using either in a matter or time entry.
```

## No Results

```
No contacts found matching "Jane Doe"

Suggestions:
- Check spelling
- Try searching by email instead of name
- If this is a brand-new client, create the contact rather than searching further
```

## Related Commands

- `/search-matters` — find matters once you've resolved the right contact
- `/matter-summary` — see a matter's client and related contacts
