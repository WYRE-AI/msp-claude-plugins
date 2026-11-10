---
description: Locate a Keeper record by description and return its UID and metadata without revealing any credential
argument-hint: "<query> [folder_uid]"
arguments: [query, folder_uid]
---

# Find Secret

Turn a description of a credential into the one Keeper record UID that
holds it, using metadata only. This command deliberately stops short of
retrieval: it hands back a UID and a ready-to-use notation string, so
whoever needs the value asks for exactly the field they need.

## Prerequisites

- Keeper connected in the Conduit gateway with a valid KSM base64 configuration
- Tools available: `list_folders`, `search_secrets`, `list_secrets`

## Steps

1. **Establish scope**

   Call `list_folders`. Keep the folder names and UIDs — they are what
   turns "not found" into a useful answer later.

2. **Search**

   Call `search_secrets` with the most distinctive single token from the
   request: a hostname, a tenant name, a device name. Matching is a
   case-insensitive substring over title, notes, record type, the
   `login` / `url` / `hostname` / `address` field values, and attachment
   names — so prefer one specific word to a long phrase.

   If the query is refused with `search query contains suspicious
   patterns`, the validator rejected a word in it (`update`, `select`,
   `delete`, `drop`, `union`, `insert`, and a few punctuation
   sequences). Pick a different token from the same record; do not
   report it as an access problem.

3. **Narrow if needed**

   If `folder_uid` was supplied, or the result set is large, call
   `list_secrets` with `folder_uids` to list that folder and match on
   title.

4. **Disambiguate — do not guess**

   Titles are not unique in Keeper. If more than one candidate is
   plausible, present them (title, type, folder) and ask which one is
   meant. Never open both records to compare their contents.

5. **Report**

   For the chosen record, give: title, UID, record type, folder name.
   Then give the notation string the caller would use to pull the field
   they are actually after, e.g.
   `<uid>/field/password` or `<uid>/field/login`.

   Retrieve nothing. If the caller wants the value, that is a separate,
   deliberate request.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| query | string | Yes | Distinctive token to search for |
| folder_uid | string | No | Restrict the search to one folder |

## Examples

```
/find-secret --query "DC01"
/find-secret --query "Contoso" --folder_uid "kJ3v9PqR2mXwL7nBcD4sTg"
```

## Error Handling

- **No results:** Report which folders the connection can actually see
  (from step 1) before concluding the record does not exist — the usual
  cause is that its folder was never shared to the KSM application.
- **`search query contains suspicious patterns`:** Input validation, not
  permissions. Retry with a different token.
- **Nothing from `list_folders`:** The application has no shares at all;
  this is a Keeper-side scoping problem.

## Related Commands

- `/scope-audit` - What can this connection see in total?
