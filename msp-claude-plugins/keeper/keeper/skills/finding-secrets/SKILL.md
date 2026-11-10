---
name: "Keeper Secret Discovery"
description: >
  Locating the right Keeper record without reading any of them: the
  metadata returned by `list_secrets`, `search_secrets` and
  `list_folders`, how record UIDs, titles and folders relate, what
  `search_secrets` actually matches on (and what it silently does not),
  the query strings its validator rejects, and why an empty result set
  usually means scope rather than absence.
when_to_use: >-
  When turning a description of a credential into the record UID that
  retrieval needs, or when auditing what a Keeper connection can reach.
  Use when: find a keeper secret, search keeper, list_secrets,
  search_secrets, list_folders, keeper record uid, keeper folder, what
  secrets can you see, or "which record holds the".
---

# Finding the Right Secret

## Overview

Discovery is the half of Keeper work that involves no credential
material at all. `list_secrets`, `search_secrets` and `list_folders`
return metadata only — no passwords, no field values, nothing masked
because there is nothing sensitive to mask. Do all the narrowing here,
end up with one UID, and only then reach for a retrieval tool.

## The three discovery tools

### `list_secrets`

Every record in the application's scope, optionally filtered by folder.

```jsonc
{}                                            // everything in scope
{ "folder_uid": "kJ3v9PqR2mXwL7nBcD4sTg" }    // one folder
{ "folder_uids": ["uid1", "uid2"] }           // several — preferred
```

`folder_uids` is the multi-folder form and is pushed down to Keeper's
folder filtering; `folder_uid` exists for backward compatibility. Passing
both ignores the singular one.

Response — `count` plus one entry per record:

```json
{ "count": 2, "secrets": [
  { "uid": "NJ_xXSkk3xYI1h9ql5lAiQ", "title": "Contoso DC01 Local Admin",
    "type": "serverCredentials", "folder": "kJ3v9PqR2mXwL7nBcD4sTg" },
  { "uid": "8fQ2wKmT5vXyL9pRnB3cAa", "title": "Contoso Firewall",
    "type": "login", "folder": "kJ3v9PqR2mXwL7nBcD4sTg" }
] }
```

Four fields, and that is the whole surface: `uid`, `title`, `type`,
`folder`. `type` is the Keeper record type — it tells you which fields
the record can carry, and so which field names KSM notation is likely to
address. To see the actual names, read them off a masked `get_secret`.

### `list_folders`

Every folder shared to the application, as a flat list of
`uid` / `name` / `parent_uid`. Nesting is expressed by `parent_uid`
pointers, not by structure, so build the tree yourself if you need one.
A folder whose `parent_uid` names a folder that is not in the list is a
subfolder of something outside the application's scope — normal, not an
error.

This is also the fastest honest answer to "what can this connection
see?".

### `search_secrets`

One required `query` string. Returns the same four metadata fields under
`results`, plus a `count`.

What it actually matches — verified against the upstream implementation,
in this order, stopping at the first hit:

1. Record **title**
2. Record **notes**
3. Record **type** (so `query: "login"` matches every login record)
4. The values of four standard fields only: **`login`, `url`,
   `hostname`, `address`**
5. **Attachment** filenames and titles

All matching is case-insensitive substring. It is not a Keeper-side
search: the tool pulls every record in scope and filters locally, so
there is no pagination, no ranking and no result cap — a broad query
returns the whole scope.

## Workflow: description to UID

1. `list_folders` — orient, and confirm the scope is what you expect.
2. `search_secrets` with the most distinctive token you have (a hostname,
   a tenant name, a device name). Prefer one distinctive word over a long
   phrase; the match is a plain substring, so `"Contoso DC01"` fails
   against a record titled `"DC01 (Contoso) Local Admin"` while
   `"DC01"` succeeds.
3. If the result set is large, narrow with `list_secrets` on the folder
   the likely candidate sits in.
4. Confirm the choice by title and type, then hand the UID to
   `get_field` — not to `get_secret`, unless the whole record is
   genuinely needed.

When two candidates look equally plausible, ask the user which record
they mean. Do not disambiguate by fetching both and comparing
credentials.

## Gotchas

**`search_secrets` does not search custom fields.** The upstream code
carries an explicit TODO to that effect. A record whose only mention of
"Azure" is a custom field labelled `Tenant ID` will not be found by
searching `Azure`. Fall back to `list_secrets` over the likely folder and
read titles.

**Some perfectly ordinary queries are rejected, and client names are the
usual casualty.** The query validator refuses, case-insensitively, any
query *containing* `union`, `select`, `insert`, `update`, `delete`,
`drop`, `xp_`, `sp_`, `--`, `/*`, `*/`, `';` or `";` — plus shell
metacharacters and queries over 256 characters. It is a SQL-injection
filter applied to a search that never touches SQL, and it matches on
substrings, so it catches real business names:

| Query | Rejected because it contains |
|-------|------------------------------|
| `Union Bank` | `union` |
| `Updates Server` | `update` |
| `Select Insurance` | `select` |
| `Dropbox` | `drop` |
| `Insertech` | `insert` |

All of them fail with `search query contains suspicious patterns`. That
is input validation, not a permissions problem and not evidence the
record is missing — never report it as either. Search a different token
from the same record: a hostname, a login, part of a URL. Not a folder
name — `search_secrets` never matches those (see the match list above);
to narrow by folder use `list_secrets` with `folder_uids`.

**A hit does not mean the title matched.** Matching on notes and on
`login` / `url` / `hostname` / `address` values means a result can look
unrelated to the query. Read the returned `title` before acting, and say
which record you chose.

**`type` matching makes generic queries useless.** Searching `login`
matches every record of type `login`. Use the record type deliberately
(`search_secrets` with `"pamMachine"` is a legitimate way to enumerate
PAM machine records) or avoid type words entirely.

**Empty results are usually scope, not absence.** The application only
sees folders explicitly shared to it. Before telling a user their record
does not exist, check `list_folders` and say which folders the connection
can actually see — the record probably exists in a folder nobody shared.
See [application-setup](../application-setup/SKILL.md).

**Titles are not unique and are not identifiers.** Keeper permits
duplicates. Anything that will be re-run — a runbook, a saved command, a
scheduled job — should carry the UID, not the title.

## Related Skills

- [retrieving-credentials](../retrieving-credentials/SKILL.md) — what to do once you have the UID
- [notation-queries](../notation-queries/SKILL.md) — addressing one field on a found record
- [api-patterns](../api-patterns/SKILL.md) — tool tiers and the error vocabulary
