---
description: Report exactly what the connected Keeper KSM application can reach - folders, record counts, and record types - reading no credential values
argument-hint: ""
arguments: []
---

# Keeper Scope Audit

Answer the question that actually determines blast radius: *what can
this connection see?* The KSM application's shares are set in Keeper and
cannot be inspected from Conduit, so the only honest answer comes from
asking the connection itself.

Run this after first connecting, after anyone changes a share, and as
part of periodic access review.

## Prerequisites

- Keeper connected in the Conduit gateway
- Tools available: `health_check`, `list_folders`, `list_secrets`

This command reads metadata only. It must not call `get_secret`,
`get_field` or `get_totp_code` — a scope audit that reads credentials has
defeated its own purpose.

## Steps

1. **Confirm the connection**

   Call `health_check`. A non-`healthy` status carries a `checks` object
   naming the failing component; report it and stop.

2. **Enumerate folders**

   Call `list_folders`. Each entry has `uid`, `name` and `parent_uid`.
   Rebuild the hierarchy from the `parent_uid` pointers. A `parent_uid`
   that names a folder absent from the list means the parent is outside
   the application's scope — normal, worth noting.

3. **Enumerate records**

   Call `list_secrets` with no filter for the total, then once per
   folder with `folder_uids` to attribute records to folders. Each entry
   gives `uid`, `title`, `type` and `folder` — no values.

   A KSM application can be granted **individual records** as well as
   shared folders, and a directly-granted record belongs to no folder —
   it appears in the unfiltered call and in none of the per-folder ones.
   Subtract the folder-attributed records from the unfiltered total to
   get that set; do not let it vanish between the two calls.

4. **Report**

   - Total folders and total records in scope
   - A table per folder: folder name, record count, and the record types
     present (`login`, `serverCredentials`, `pamMachine`, …)
   - **Directly-granted records, listed separately** — record-level
     shares are invisible in the folder view, so a folder-only report
     under-states the blast radius, which is the one error a scope audit
     must not make. State the count even when it is zero, so a reader
     knows it was checked rather than omitted.
   - The reconciliation: folder-attributed + directly-granted should
     equal the unfiltered total. If it does not, say so rather than
     presenting either number as the scope.
   - A flag on anything that reads as over-broad: a folder with a
     generic name like "IT Passwords", a record count far larger than
     the connection's purpose implies, or PAM record types where none
     were expected

5. **Recommend**

   Where scope looks wider than the use case, recommend narrowing in
   Keeper — a purpose-built shared folder for the integration, or a
   record-level share — not a client-side workaround. There isn't one.

## Examples

```
/scope-audit
```

## Error Handling

- **`health_check` reports unhealthy:** Report the failing check name
  rather than retrying the audit.
- **`no active session`:** The connection has no usable KSM
  configuration; re-submit it in Conduit.
- **Zero folders:** The application exists but nothing is shared to it.
- **Records returned with an empty `folder`:** Expected for records
  shared to the application directly rather than through a folder.

## Related Commands

- `/find-secret` - Locate one record within that scope
