---
name: "Keeper Credential Retrieval"
description: >
  Reading credential material out of Keeper safely: what `get_secret`
  returns and exactly which parts of it masking covers, the `fields`
  parameter, `unmask` semantics under a container deployment with no
  confirmation prompt, `get_totp_code`, why `download_file` cannot return
  attachment bytes here, and the handling rules for secret material once
  it is in an agent transcript.
when_to_use: >-
  When a Keeper value is about to be read, revealed, or passed on to
  something else. Use when: get_secret, unmask, keeper password, keeper
  totp, get_totp_code, download_file, keeper attachment, reveal secret,
  or "give me the password for".
---

# Retrieving Credentials Safely

## Overview

Four of the eleven tools return credential material. Everything in this
skill follows from one property of the environment: **a secret read into
an agent transcript has been disclosed**, to the transcript, to whatever
stores it, and to anything downstream the transcript reaches. Masking
narrows that; it does not undo it. So the discipline is to read the
least, as late as possible, and to move it onward without copying it.

## Prefer the narrowest tool

| Need | Use | Why |
|------|-----|-----|
| One value | `get_field` with notation | Returns exactly that value |
| A live second factor | `get_totp_code` | Returns a code, not the seed |
| Field names / record shape | `get_secret` **masked** | Reveals structure without values (`get_record_type_schema` is non-functional upstream) |
| A genuinely whole record | `get_secret` with `unmask: true` | Last resort — see below |

Reaching for `get_secret` because it is fewer keystrokes than composing
notation is the common failure. One record can carry a password, an API
secret, recovery codes, and notes containing a second credential; all of
it lands in context at once.

## `get_secret`

```jsonc
{ "uid": "NJ_xXSkk3xYI1h9ql5lAiQ" }                              // masked
{ "uid": "NJ_xXSkk3xYI1h9ql5lAiQ", "fields": ["login", "url"] }  // subset
{ "uid": "NJ_xXSkk3xYI1h9ql5lAiQ", "unmask": true }              // full reveal
```

`uid` must be a real UID — 16 to 32 characters — and a title fails with
`invalid UID: UID must be between 16 and 32 characters`. Resolve titles
first; see [finding-secrets](../finding-secrets/SKILL.md).

With no `fields`, the response carries `uid`, `title`, `type`, `notes` if
present, one key per standard field the record type is expected to have,
`custom_fields` keyed by label, and `files` (name, title, size, type —
metadata, never content).

With `fields`, you get `uid`, `title`, `type` and only the named fields;
`notes`, `custom_fields` and `files` are dropped entirely unless you name
`"notes"` explicitly. Naming the one or two fields you need is the cheap
way to cut exposure when notation does not fit — and, as a side effect,
the surest way to keep unread notes out of the transcript.

### What masking actually covers

With `unmask` unset, a value is masked only when its **name** matches a
fixed sensitive-word list by case-insensitive substring — `password`,
`secret`, `key`, `token`, `privateKey`, `cardNumber`,
`cardSecurityCode`, `accountNumber`, `pin`, `passphrase`, `auth`,
`routingNumber`, `licenseNumber`, `oneTimeCode`, `otp`, `answer`,
`paymentCard`, `bankAccount`, `keyPair`. For standard fields the name
tested is the field type; for custom fields it is the label the user
typed. Masked output is `first3 + "***" + last3`, or `******` for values
of six characters or fewer.

A few sub-values inside composite fields are masked by explicit rule
instead: `paymentCard.cardNumber` and `.cardSecurityCode`,
`bankAccount.routingNumber` and `.accountNumber`, `keyPair.privateKey`,
`securityQuestion.answer`, `script.command`, `appFiller.macroSequence`,
and `passkey.privateKey` (replaced outright with `***MASKED***`). Their
siblings are not — `cardExpirationDate`, `publicKey`, `accountType`,
every `address`, `phone` and `name` sub-value, and the whole `pam*`
settings family come back in clear.

Four consequences:

- **`notes` is never masked.** Notes are returned verbatim whenever
  present. In real MSP vaults notes routinely hold a second password, a
  recovery phrase, or a PIN. A "masked" `get_secret` frequently discloses
  more through notes than through the field it carefully starred out.
- **Custom fields are masked by their label.** `API Key` matches (`key`);
  `Recovery Code`, `Service Account Credential` and `Break-glass` match
  nothing and come back in clear.
- **The masked form leaks six real characters.** A masked value is not a
  redacted value. Do not paste one into a ticket on the assumption that
  it is safe.
- **`unmask: true` on a record with MFA exposes the TOTP seed.** The
  `oneTimeCode` / `otp` fields hold the full `otpauth://` URI. Masked,
  it is starred; unmasked, the record's permanent second factor is in
  the transcript. This is the strongest single reason to use
  `get_totp_code` rather than unmasking a record to read a code off it.

### `unmask` in this deployment

Upstream ksm-mcp is built to stop here and ask a human, over a terminal,
with the warning *"This will expose all requested fields of the secret,
including the password if present, directly TO THE AI MODEL and its
context."* There is no terminal in a container, so that prompt is never
shown and `unmask: true` executes directly.

Treat the warning as addressed to you instead. Before setting `unmask`,
have an answer to: which field is needed, what is it for, and does the
person who asked have a use for it right now. If the answer is
"so I can show them the record", that is not a use — offer the masked
view plus the record's title and location.

### Completeness is not guaranteed

With no `fields` argument, `get_secret` iterates a **hard-coded list of
field types per record type** — for a `login` record that is `login`,
`password`, `url`, `oneTimeCode`, `otp`, and nothing else. A standard
field outside its type's list is simply absent from the response. If a
field you can see in the vault UI does not appear, it was not omitted for
security; address it directly with `get_field` notation or name it in
`fields`.

## `get_totp_code`

Takes a `uid` only — no title, no notation — and returns
`{ "code": "123456", "time_left": 21 }`, where `time_left` is seconds
until the code rotates. The seed never leaves Keeper, which makes this
strictly safer than reading the `oneTimeCode` field: a code is useless in
about half a minute, a seed is a permanent second factor.

The record must carry a TOTP field (an `otpauth://` URL, either as the
password field or as a `oneTimeCode` field); otherwise the call fails
with `no TOTP field found in secret`. That is a record-content answer,
not a permissions answer.

Deliver a code, its `time_left`, and stop. Do not cache it, restate it
later in the conversation, or write it anywhere — by the time it is read
twice it is usually expired anyway.

## `download_file` does not return file contents here

Upstream, `download_file` writes the attachment to a path on the server's
filesystem and returns a status message — it never returns bytes to the
caller. Conduit strips the `save_path` argument, because a
tenant-controlled write path inside a shared container is not something
to hand out, so there is no destination left to write to.

The practical position: **attachments cannot be retrieved through this
connection.** Use `get_secret` to confirm an attachment exists and report
its name, size and which record holds it, then point the user at the
Keeper vault to download it themselves. Do not report a success message
as a delivered file.

If you call it anyway, `file_uid` matches the attachment's UID or its
**title** — exact, case-sensitive, and never its filename. `get_secret`
lists `name`, `title`, `size` and `type` per attachment but no UID, so
`title` is the only handle available, and a mismatch returns
`file not found`.

## `generate_password`

Returns `{ "password": "…", "length": 32, "warning": "Password is
exposed to AI model. Consider using save_to_secret parameter." }`.
Defaults to 32 characters with no per-class minimums unless `lowercase` /
`uppercase` / `digits` / `special` are set.

The warning is not actionable here: `save_to_secret` and `folder_uid`
are stripped because they write, so Keeper's "generate straight into a
new record without showing the AI" flow is unavailable and anything
generated is disclosed by definition. Do not relay the warning as advice
— treat the output as secret material and hand it over the same way as
any other.

## Handling rules

These apply to every value returned by the four tools above.

- **Do not echo a secret you were not asked to produce.** Confirming
  "retrieved the password for DC01" is the report; repeating the value
  back in a summary, a recap, or a status line is a second disclosure.
- **Never write secret material into durable artifacts** — ticket notes,
  commit messages, PR descriptions, code comments, config files,
  scratch files, or logs. This includes masked values.
- **Never move a secret between systems on your own initiative.** If a
  workflow seems to call for pasting a credential into another tool, say
  what is needed and let the human do it.
- **Prefer a pointer to a payload.** "The credential is in Keeper record
  `Contoso DC01 Local Admin`, folder `Contoso / Infrastructure`" is
  usually the more useful answer and discloses nothing.
- **Re-read rather than remember.** A second `get_field` call is cheaper
  than a transcript that carries a credential through a long session.
- **Report what you read.** Keeper audits the application's access, but
  the person in the conversation should be told which records were
  opened, which is also how an unnecessary read gets caught.

## Related Skills

- [notation-queries](../notation-queries/SKILL.md) — the single-field retrieval path this skill keeps pointing at
- [finding-secrets](../finding-secrets/SKILL.md) — resolving a title to a UID without reading anything
- [api-patterns](../api-patterns/SKILL.md) — tool tiers, blocked tools, and error handling
