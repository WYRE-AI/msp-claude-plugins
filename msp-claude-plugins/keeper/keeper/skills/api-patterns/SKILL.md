---
name: "Keeper Secrets Manager API Patterns"
description: >
  The Keeper Secrets Manager tool surface as exposed through Conduit: the
  nine read-only tools and their access tiers, the ten blocked tools and
  whether each is withheld by policy or broken upstream, the arguments
  stripped from `generate_password`, how the KSM application bounds
  everything the connection can see, the `configBase64` credential, and
  the error vocabulary.
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

## The v1 tool surface — nine tools

| Tool | Tier | Returns |
|------|------|---------|
| `list_secrets` | read | Record metadata for the application's scope; optional folder filter |
| `search_secrets` | read | Record metadata matching a query |
| `list_folders` | read | Folders shared to the application |
| `health_check` | read | Server and KSM connectivity status |
| `get_server_version` | read | Upstream server version |
| `get_secret` | **admin** | A full record; sensitive fields masked unless `unmask: true` |
| `get_field` | **admin** | One value, addressed by KSM notation |
| `get_totp_code` | **admin** | A live TOTP code for a record carrying a TOTP field |
| `generate_password` | **admin** | A generated password string |

The tier is Conduit's access classification, not a Keeper concept. Every
tool that can return credential material is **admin**, which outranks
write in Conduit's model — a Keeper read *is* a credential read. Five
metadata tools sit at read. Grant accordingly: a technician who needs to
find records does not need the admin four.

## What is not exposed, and why

Ten upstream tools are blocked at the bridge. They are absent from
`tools/list`, and a direct call returns an error rather than executing.
Do not plan around them or offer them.

The **reason** column matters when someone asks for one to be turned on.
Eight are withheld by policy — a decision that could in principle be
revisited. Two are blocked because they do not work at the pinned
upstream version; no policy change would make them functional.

| Blocked tool | Why | Category |
|--------------|-----|----------|
| `create_secret`, `update_secret`, `delete_secret` | Vault writes | Policy |
| `create_folder`, `delete_folder` | Vault structure writes | Policy |
| `upload_file` | Vault writes | Policy |
| `get_all_secrets_unmasked` | One call dumps every secret in the application's scope, unmasked, into model context | Policy — permanent |
| `ksm_execute_confirmed_action` | Upstream's confirmation-bypass executor | Policy — permanent |
| `get_record_type_schema` | Returns `record templates not loaded` on every call at the pinned version | **Broken upstream** |
| `download_file` | Cannot return file contents, in any configuration | **Broken upstream** |

The two permanent entries stay blocked even if a later version enables
writes. When a user asks for a bulk export of their vault, the answer is
that the capability is deliberately absent — then offer the read-side
equivalent: `list_secrets` for the inventory, and `get_field` per value
actually needed.

### The two broken-upstream entries, in detail

Both were exposed in an earlier draft of this integration and removed
after the upstream source was read. Knowing *why* saves a technician from
diagnosing a healthy connection, and saves anyone from filing a request
to re-enable them.

**`get_record_type_schema`** would have returned a record type's field
schema. The embedded templates are loaded by a function the shipped
server never calls — `LoadRecordTemplates` has no non-test caller and the
package has no `init` — so `GetSchema` always takes its
templates-are-nil branch and every call fails with
`record templates not loaded. Call LoadRecordTemplates first`. A message
naming an internal function reads like a server fault; it is not one, and
it is not fixable from the client.

Nothing is lost: **`get_secret` with `unmask` unset is the better answer
anyway.** Its response keys *are* the field names KSM notation addresses,
read from the actual record rather than from a type template, with
sensitive values masked. Skills route field-name discovery there not as a
workaround but because it is the correct tool for the question.

**`download_file`** would have fetched an attachment. Upstream's client
signature is `DownloadFile(uid, fileUID, savePath string) error` — it
returns only an error and writes the bytes to `savePath` on the server's
filesystem, so the caller never receives file content under any
argument. Passing `save_path` through would let one tenant write
attacker-chosen paths into a container shared with every other tenant's
child process; stripping it leaves no destination. There is no
configuration of this tool that both works and is safe, so it is out.

**Attachments are therefore not retrievable through this connection at
all.** `get_secret` still lists them — `name`, `title`, `size`, `type` —
so the correct response to "send me the VPN profile from that record" is
to confirm the attachment exists, name it and its size, say which record
holds it, and send the user to the Keeper vault to download it.

### Stripped arguments

One allowed tool has its write-capable arguments **stripped from both the
advertised schema and the inbound call**, so the affordance is never
visible:

| Tool | Stripped | Would otherwise |
|------|----------|-----------------|
| `generate_password` | `save_to_secret`, `folder_uid` | Create a record |

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

## Error handling

| Symptom | Meaning | Action |
|---------|---------|--------|
| HTTP 401 from the gateway | `configBase64` missing, not base64, or missing a required key | Re-submit the connection in Conduit with a fresh device config |
| `no active session` | The upstream server has no usable KSM configuration | Connection-level problem; re-submit the credential |
| Tool absent from `tools/list` | Either blocked by the read-only allowlist (policy) or broken in the pinned upstream — the two are not the same and only one could ever be revisited | Not recoverable client-side — check the blocked table above for which reason applies |
| `record not found` | Out of the application's scope, or the UID is wrong | `list_folders`, then `search_secrets` by title |
| `field '<name>' not found` | Field name is not on the record | Inspect the record with a masked `get_secret`; its keys are the field names |
| `failed to parse notation: …` | Malformed KSM notation | See [notation-queries](../notation-queries/SKILL.md) |
| `invalid UID: UID must be between 16 and 32 characters` | A title was passed where a UID is required | Resolve the title to a UID first |
| `search query contains suspicious patterns` | The query contains a word the input validator rejects | Search a different token — see [finding-secrets](../finding-secrets/SKILL.md) |
| Tool named in a request is not in the list above | Blocked — see the table for whether it is policy or broken upstream | Do not retry; say which it is |
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
