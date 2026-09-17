---
name: "Keeper Secrets Manager API Patterns"
description: >
  The Keeper Secrets Manager tool surface as exposed through Conduit: the
  eleven read-only tools and their access tiers, the eight write and
  bulk-disclosure tools that are deliberately not exposed, the two tools
  whose write-capable arguments are stripped, how the KSM application
  bounds everything the connection can see, the `configBase64` credential,
  and the error vocabulary.
when_to_use: >-
  When calling any Keeper tool, deciding whether an operation is possible
  at all, or diagnosing a Keeper connection failure. Use when: keeper
  secrets manager, ksm, keeper mcp, keeper tools, keeper auth, keeper 401,
  configBase64, keeper read-only, or "can Claude write to Keeper".
---

# Keeper Secrets Manager Tools & API Patterns

## Overview

Keeper Secrets Manager (KSM) is Keeper's machine-access product: an
*application* is granted access to specific shared folders in a Keeper
vault, and clients authenticate as that application rather than as a
person. This plugin documents the KSM tool surface reached through the
WYRE Conduit gateway, which fronts Keeper's
[ksm-mcp](https://github.com/Keeper-Security/keeper-mcp-golang-docker)
server.

Two boundaries govern everything here, and they sit in different places:

- **What the connection can see** is set in Keeper, by the KSM
  application's folder grants. Conduit cannot widen it. See
  [application-setup](../application-setup/SKILL.md).
- **What the connection can do** is set at the bridge: v1 is
  **read-only**, enforced by an allowlist, not by a setting.

## The v1 tool surface — eleven tools

| Tool | Tier | Returns |
|------|------|---------|
| `list_secrets` | read | Record metadata for the application's scope; optional folder filter |
| `search_secrets` | read | Record metadata matching a query |
| `list_folders` | read | Folders shared to the application |
| `get_record_type_schema` | read | Static field schema for a record type — **non-functional upstream, see below** |
| `health_check` | read | Server and KSM connectivity status |
| `get_server_version` | read | Upstream server version |
| `get_secret` | **admin** | A full record; sensitive fields masked unless `unmask: true` |
| `get_field` | **admin** | One value, addressed by KSM notation |
| `get_totp_code` | **admin** | A live TOTP code for a record carrying a TOTP field |
| `download_file` | **admin** | An attachment's contents |
| `generate_password` | **admin** | A generated password string |

The tier is Conduit's access classification, not a Keeper concept. Every
tool that can return credential material is **admin**, which outranks
write in Conduit's model — a Keeper read *is* a credential read. Six
metadata tools sit at read. Grant accordingly: a technician who needs to
find records does not need the admin five.

## What is not exposed, and why

Eight upstream tools are blocked at the bridge. They are absent from
`tools/list`, and a direct call returns an error rather than executing.
Do not plan around them, offer them, or suggest a flag that re-enables
them — there isn't one.

| Blocked tool | Reason |
|--------------|--------|
| `create_secret`, `update_secret`, `delete_secret` | Vault writes |
| `create_folder`, `delete_folder` | Vault structure writes |
| `upload_file` | Vault writes |
| `get_all_secrets_unmasked` | One call dumps every secret in the application's scope, unmasked, into model context |
| `ksm_execute_confirmed_action` | Upstream's confirmation-bypass executor |

The last two stay blocked even if a later version enables writes. When a
user asks for a bulk export of their vault, the answer is that the
capability is deliberately absent — then offer the read-side equivalent:
`list_secrets` for the inventory, and `get_field` per value actually
needed.

Two allowed tools have their write-capable arguments **stripped from
both the advertised schema and the inbound call**, so the affordance is
never visible:

| Tool | Stripped | Would otherwise |
|------|----------|-----------------|
| `generate_password` | `save_to_secret`, `folder_uid` | Create a record |
| `download_file` | `save_path` | Write a tenant-controlled path into the shared container filesystem |

`generate_password` therefore always returns the password to the caller.
It cannot be used as Keeper's "generate without showing the AI" flow —
that flow requires the stripped arguments. Treat its output as secret
material like any other.

## Connection & authentication

The credential is configured **in the Conduit connection UI**, not on the
technician's machine and not in local environment variables. One field:

| Field | Label in Conduit | Value |
|-------|------------------|-------|
| `configBase64` | KSM Base64 Configuration | The KSM application's device configuration, base64-encoded (starts `ewog…`) |

Get it from Keeper Vault → **Secrets Manager** → the application →
**Devices** tab → **Add Device**, choosing the base64 configuration
output. The blob decodes to JSON containing `clientId`, `privateKey`,
`appKey` and `hostname`; the bridge validates that shape and returns
**HTTP 401** if it does not decode to it. It never falls back to any
other credential, which is what keeps one tenant's request from reaching
another tenant's vault.

The configuration is a device credential, not a user credential. It
carries the application's scope and nothing else — no vault-wide access,
no admin console access, no ability to re-share.

## Scope is the application, not the vault

Every list, search and get is bounded by the folders shared to the KSM
application. A record the application cannot see does not appear in
`list_secrets`, is not found by `search_secrets`, and returns not-found
by UID. That is correct behaviour, not a failure:

- Do not report "record not found" as an outage or a broken credential.
  Confirm scope first with `list_folders`.
- Do not conclude a vault is empty because `list_secrets` came back
  short. It reflects one application's grants.

## Two allowed tools that do not do what their name suggests

Both are upstream behaviours, not Conduit restrictions. Knowing them
saves a technician from diagnosing a working connection.

**`get_record_type_schema` returns an error, always.** The embedded
record templates are loaded by a function the shipped server never calls
(verified in upstream v2.5.0: `LoadRecordTemplates` has no non-test
caller and the package has no `init`). Every call fails with:

```
failed to get schema for record type '<type>': record templates not loaded.
Call LoadRecordTemplates first (ensure templates are loaded correctly and the type exists)
```

That message names an internal function and reads like a server fault.
It is not fixable from the client, and it is not a credential or scope
problem. To learn a record's field names, call `get_secret` on the record
with `unmask` unset — the response keys are the field names, and the
values come back masked.

**`download_file` cannot deliver file contents.** Upstream writes the
attachment to a path on the server's filesystem and returns a status
message; it never returns bytes. Conduit strips `save_path`, so there is
no destination. Report attachment metadata from `get_secret` and send the
user to the vault. See
[retrieving-credentials](../retrieving-credentials/SKILL.md).

## Error handling

| Symptom | Meaning | Action |
|---------|---------|--------|
| HTTP 401 from the gateway | `configBase64` missing, not base64, or missing a required key | Re-submit the connection in Conduit with a fresh device config |
| `no active session` | The upstream server has no usable KSM configuration | Connection-level problem; re-submit the credential |
| Tool absent from `tools/list` | Blocked by the read-only allowlist | Not recoverable client-side — see the blocked table above |
| `record not found` | Out of the application's scope, or the UID is wrong | `list_folders`, then `search_secrets` by title |
| `field '<name>' not found` | Field name is not on the record | `get_record_type_schema`, or inspect the record masked |
| `failed to parse notation: …` | Malformed KSM notation | See [notation-queries](../notation-queries/SKILL.md) |
| `invalid UID: UID must be between 16 and 32 characters` | A title was passed where a UID is required | Resolve the title to a UID first |
| `search query contains suspicious patterns` | The query contains a word the input validator rejects | Search a different token — see [finding-secrets](../finding-secrets/SKILL.md) |
| `record templates not loaded…` | `get_record_type_schema` is non-functional upstream | Read field names from a masked `get_secret` instead |
| `no TOTP field found in secret` | The record carries no TOTP seed | Record content, not permissions |

Tool failures arrive as JSON-RPC error code `-32002`; a rate-limit
rejection arrives as `-32029` with `Rate limit exceeded`.

## A note on confirmation prompts

Upstream ksm-mcp asks a human to confirm unmasking and every write, over
the terminal. There is no terminal in a container, so the upstream offers
only two settings: refuse those operations outright, or auto-approve them
all. The deployment runs in batch mode, where they auto-approve — which
is precisely why the write and bulk-disclosure tools are removed at the
bridge instead of being left to a prompt that would never be shown. Do
not describe unmasking to a user as "confirmed by Keeper"; the control
that is actually enforcing anything is the allowlist, plus the
application's own scope.

## Related Skills

- [finding-secrets](../finding-secrets/SKILL.md) — discovery and UID resolution
- [retrieving-credentials](../retrieving-credentials/SKILL.md) — masking semantics and handling discipline
- [notation-queries](../notation-queries/SKILL.md) — `get_field` notation grammar
- [application-setup](../application-setup/SKILL.md) — scoping the KSM application before connecting
