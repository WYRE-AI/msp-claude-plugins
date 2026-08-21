---
description: Resolve a 3CX contact or extension by email, extension, or name
argument-hint: "<email, extension, or name>"
arguments: [identifier]
---

# Find Contact

Resolve who a phone identifier belongs to inside 3CX — by email address,
exact extension, or name — checking exact-match lookups first and falling
back to phonebook and CRM-integrated contact search.

## Prerequisites

- A 3CX PBX connected (directly or through Conduit's BYO connector) with a
  valid, authenticated MCP session — see the `api-patterns` skill
- The identifier's type known ahead of time if possible: email, extension
  number, or name — this changes which lookup to try first

## Steps

1. **Try the exact-match lookup that fits the identifier**

   If given an email address, use the find-contact-by-email capability. If
   given a number that looks like an extension, use the
   find-contact-by-exact-extension capability. Exact-match lookups don't
   fuzzy match, so a wrong or partial extension returns nothing rather
   than a close guess.

2. **Fall back to phonebook and CRM search on a miss, or if given a name**

   Search 3CX phonebooks and search CRM-integrated contacts in parallel.
   Treat an empty CRM-integrated result as "not synced on this PBX," not
   "doesn't exist in the CRM" — see the `directory` skill for why.

3. **If still unresolved, list PBX users/extensions**

   Useful when the identifier is close to a known extension but doesn't
   match exactly, or when confirming a name against the raw user list.

4. **Report what was found**

   State which lookup resolved it (email match, extension match, phonebook,
   or CRM sync) so the requester knows how current the result is — a
   CRM-synced match is only as fresh as that PBX's CRM connector.

## Examples

```
/find-contact jane@acmecorp.com
/find-contact 1042
/find-contact "Jane Smith"
```

## Error Handling

- **No match anywhere:** Confirm the identifier's exact spelling/format
  with the requester before concluding the contact doesn't exist — exact
  lookups are unforgiving of typos.
- **CRM-integrated search returns nothing but the contact should exist in
  the CRM:** That PBX's CRM connector may not be configured or may be
  stale — this is a sync-scope limitation, not proof the contact is
  missing from the CRM itself.

## Related Commands

- `/queue-status` — check whether a resolved contact's extension is currently in a queue or on a call
