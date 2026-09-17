---
name: "Keeper KSM Notation Queries"
description: >
  The KSM notation string grammar accepted by `get_field`: the three-part
  `<record>/<type>/<field-path>` shape, the four field-path forms
  (plain, indexed, property, indexed-property), `field` vs `custom_field`
  vs `file` selectors, how the record segment is classified as a UID or a
  title, which characters the validator rejects outright, and how the
  returned value is masked.
when_to_use: >-
  When pulling a single value out of a Keeper record instead of fetching
  the whole record, or when a notation string is being rejected. Use when:
  ksm notation, keeper notation, get_field, keeper field path,
  custom_field, keeper://, field[0], notation parse error, or "get just
  the password from".
---

# KSM Notation Queries

## Overview

`get_field` takes one string — a KSM notation query — and returns one
value. It is the narrowest retrieval path in the Keeper surface: where
`get_secret` returns an entire record (every field, every custom field,
notes, file list) into the transcript, notation returns the single value
that was asked for. When a task needs one credential, notation is the
correct tool, and the difference is measured in how much secret material
ends up in context.

## Grammar

Verified against the upstream parser (`internal/ksm/notation.go`,
`ParseNotation`), which splits the string on `/` and requires at least
two segments:

```
<record>/<selector>/<field-path>
```

**`<record>`** — a record UID *or* a record title. The parser classifies
it as a UID when it is 16–32 characters of `[A-Za-z0-9_-]` only;
anything else is treated as a title. Titles with spaces are fine.

**`<selector>`** — exactly one of three literals. Anything else fails
with `unknown notation type: <selector>`.

| Selector | Meaning |
|----------|---------|
| `field` | A standard typed field on the record (`password`, `login`, `url`, `notes`, …) |
| `custom_field` | A user-added field, addressed by its **label** |
| `file` | A file attachment, addressed by filename — the third segment is taken whole, no path syntax. Note that attachment *contents* are not retrievable through this connection at all |

**`<field-path>`** — four accepted forms, tried in this order:

| Form | Pattern | Example | Returns |
|------|---------|---------|---------|
| Indexed property | `name[N][prop]` | `phone[0][number]` | Property `number` of the first `phone` entry |
| Indexed | `name[N]` | `url[0]` | The first `url` value |
| Property | `name[prop]` | `name[first]` | The `first` sub-value of the `name` field |
| Plain | `name` | `password` | The field's value |

The index must be digits. The property must match `[a-zA-Z_]\w*` — a
letter or underscore followed by word characters.

## Worked examples

```jsonc
// The password of a record, by UID — the single most common query
{ "notation": "NJ_xXSkk3xYI1h9ql5lAiQ/field/password", "unmask": true }

// The same record's login, by title instead of UID
{ "notation": "Contoso DC01 Local Admin/field/login" }

// First URL on a record that carries several
{ "notation": "NJ_xXSkk3xYI1h9ql5lAiQ/field/url[0]" }

// A sub-value of a composite field
{ "notation": "NJ_xXSkk3xYI1h9ql5lAiQ/field/name[first]" }

// A property inside an indexed composite field
{ "notation": "NJ_xXSkk3xYI1h9ql5lAiQ/custom_field/phone[0][number]" }

// A custom field addressed by its label — spaces are legal
{ "notation": "NJ_xXSkk3xYI1h9ql5lAiQ/custom_field/Tenant ID" }

// An attachment, addressed by filename
{ "notation": "NJ_xXSkk3xYI1h9ql5lAiQ/file/vpn-profile.ovpn" }
```

## Finding the field name to query

Field names are the record type's field *types*, not the labels shown in
the vault UI, and guessing produces `field '<name>' not found` — which
reads like a permissions problem and is not one.

The reliable way to see them is **`get_secret` on the record with
`unmask` unset**: the response keys are exactly the names notation
addresses, and sensitive values come back masked. Read the keys, then
compose notation against the one you want.

There is no separate schema tool to consult: the upstream's
`get_record_type_schema` is blocked because it never works. A masked
`get_secret` is not a workaround for its absence — it is the better
source, because it reports the fields this record actually has rather
than the ones its type could have. See
[api-patterns](../api-patterns/SKILL.md).

Custom fields are the exception to all of this: they are addressed by the
label the vault shows, through the `custom_field` selector, and appear
under `custom_fields` in a `get_secret` response.

## Masking of the returned value

`unmask` defaults to false. When it is false the value is masked **only
if the field name looks sensitive** — the upstream check is a
case-insensitive substring match of the field name against a fixed list
(`password`, `secret`, `key`, `token`, `privateKey`, `cardNumber`,
`cardSecurityCode`, `accountNumber`, `pin`, `passphrase`, `auth`,
`routingNumber`, `licenseNumber`, `oneTimeCode`, `otp`, `answer`,
`paymentCard`, `bankAccount`, `keyPair`).

Two consequences, both worth internalising:

- A custom field labelled `Service Account Credential` matches nothing
  on that list and comes back **in clear text with `unmask` unset**.
  Masking is not a guarantee that a value is safe to echo.
- A masked value is `first3 + "***" + last3`, or `******` when the value
  is six characters or shorter. Those six leaked characters are real.
  Do not paste a masked value into a ticket on the theory that it is
  redacted.

Ask for `unmask: true` only when the value is actually going to be used,
and handle the result per `keeper-retrieving-credentials`.

## Gotchas

**There is no `keeper://` scheme.** `keeper://UID/field/password` splits
to `["keeper:", "", "UID", ...]`, the second segment is empty, and the
call fails with `failed to parse notation: unknown notation type:`.
The URI-style form appears in some Keeper SDK and CLI documentation;
this tool does not accept it. Pass the bare `UID/field/password`.

**Some characters are rejected before parsing.** The validator refuses a
notation string containing `;`, `&`, `|`, a backtick, `$(`, `${`, `<`,
`>`, `<<`, `>>`, a newline, or a null byte, and refuses any segment
containing `..`. A record whose title contains one of those — `Firewall
& VPN Admin` is the realistic case — cannot be addressed by title at
all. Look the UID up with `search_secrets` and address it by UID.

**A 16–32 character title is read as a UID.** A title like
`ProdDatabaseAdmin` (17 characters, no spaces) satisfies the UID
heuristic. Primary record resolution is delegated to the Keeper SDK, but
the classification does drive the duplicate-title fallback path, so a
title-shaped-like-a-UID is an avoidable ambiguity. Prefer UIDs in
anything reused — a saved runbook step, a command, a scheduled job.

**Duplicate titles resolve to an arbitrary record.** When the SDK reports
multiple records matching a title, ksm-mcp falls back to listing every
record in the application's scope and returning the field from the
**first** match. It does not error and it does not tell you it happened.
Titles are not unique in Keeper; UIDs are.

**A malformed bracket expression is not an error.** `name[my prop]`
matches none of the four patterns — the space fails the property
pattern — so the parser falls through and treats the whole literal
string `name[my prop]` as the field name. The result is
`field 'name[my prop]' not found`, which looks like a missing field
rather than a syntax mistake.

**An empty third segment fails.** `UID/field/` returns
`field name cannot be empty`; `UID/` alone returns
`unknown notation type:`.

## Related Skills

- [retrieving-credentials](../retrieving-credentials/SKILL.md) — `get_secret` masking, TOTP, and the handling rules for a value once you have it
- [finding-secrets](../finding-secrets/SKILL.md) — resolving a title to the UID that notation should use
