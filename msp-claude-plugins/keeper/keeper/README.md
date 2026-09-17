# Keeper Secrets Manager Plugin

Claude Code plugin for Keeper Secrets Manager (KSM) — read-only
credential retrieval through the WYRE Conduit gateway.

## Overview

Keeper Secrets Manager is Keeper's machine-access product: an
*application* is granted access to specific shared folders in a Keeper
vault, and clients authenticate as that application rather than as a
person. This plugin gives Claude accurate knowledge of the KSM tool
surface as Conduit exposes it, and — more importantly — of how to use it
without turning a transcript into a credential dump.

- **Discovery** — find the right record from metadata alone
- **Notation** — pull one field instead of a whole record
- **Retrieval** — masking semantics, TOTP, and handling discipline
- **Scoping** — building the KSM application so the blast radius is small

## Read-only, by allowlist

v1 serves **nine tools** — five metadata-only, four that can return
credential material. **Ten upstream tools are blocked**, absent from
`tools/list` and refused on direct call:

- **Eight withheld by policy** — every write (`create_secret`,
  `update_secret`, `delete_secret`, `create_folder`, `delete_folder`,
  `upload_file`) plus `get_all_secrets_unmasked` and
  `ksm_execute_confirmed_action`, the last two permanently.
- **Two broken upstream** — `get_record_type_schema`, which returns
  `record templates not loaded` on every call at the pinned version, and
  `download_file`, which writes bytes to a server-side path and can
  never hand a file to the caller. Neither is withheld by policy; no
  policy change would make them work. **Attachments are therefore not
  retrievable through this connection.**

`generate_password` has `save_to_secret` and `folder_uid` stripped before
the model ever sees them, because they write.

See `GOVERNANCE.md` for the full safety model, including why the
enforcement lives in the allowlist rather than in a confirmation prompt.

## Prerequisites

### Connection

Keeper connects through the [WYRE Conduit gateway](https://conduit.wyre.ai).
The credential is configured **in the gateway UI**, not on your machine —
there are no local environment variables for this plugin. One field:

| Field | Value |
|-------|-------|
| **KSM Base64 Configuration** | The KSM application's device configuration, base64-encoded (starts `ewog…`) |

Get it from Keeper Vault → **Secrets Manager** → your application →
**Devices** → **Add Device**, choosing the base64 configuration output.
Keeper Commander's `secrets-manager client add --config-init b64` emits
the same thing.

The blob is the credential. Paste it into Conduit once and discard your
copy — do not put it in a ticket, a runbook, or a repo.

### Keeper

- Secrets Manager enabled on the Keeper plan and on the role
- A KSM application scoped to the folders this integration should reach
  — ideally a shared folder created for the purpose, shared **Read Only**

## Installation

### Via Conduit (Recommended)

Use [Conduit](https://conduit.wyre.ai) to connect — paste the base64
configuration into the connection form and you're done.

### Self-Hosted

Run Keeper's
[ksm-mcp](https://github.com/Keeper-Security/keeper-mcp-golang-docker)
behind the self-hosted [mcp-gateway](https://github.com/WYRE-AI/mcp-gateway).
Note that ksm-mcp is stdio-only and single-tenant per process.

## Available Skills

| Skill | Description |
|-------|-------------|
| `application-setup` | Scoping the KSM application, devices, base64 config, rotation and revocation |
| `finding-secrets` | `list_secrets`, `search_secrets`, `list_folders` — what they match and what they return |
| `notation-queries` | The KSM notation grammar `get_field` accepts, with worked examples |
| `retrieving-credentials` | `get_secret` masking semantics, TOTP, and handling rules for secret material |
| `api-patterns` | Tool surface, access tiers, blocked tools, credential contract, errors |

## Available Commands

| Command | Description |
|---------|-------------|
| `/find-secret` | Locate a record and return its UID and notation — reveals nothing |
| `/scope-audit` | Report exactly what the connection can reach, reading no values |

No agents ship with this plugin, deliberately — see `GOVERNANCE.md`.

## Quick Start

### Find the record that holds a credential

```
/find-secret --query "DC01"
```

### Check what this connection can actually see

```
/scope-audit
```

### Pull one field

Ask for the specific value, not the record:

> Get the password field from Keeper record NJ_xXSkk3xYI1h9ql5lAiQ

which resolves to `get_field` with notation
`NJ_xXSkk3xYI1h9ql5lAiQ/field/password`.

## Security Considerations

- **Scope is set in Keeper, not in Conduit.** The KSM application's
  shares are the real boundary; nothing on this side can narrow them.
  Run `/scope-audit` after connecting and after any share changes.
- **Masking is a name match, not a redaction guarantee.** Notes are never
  masked, a custom field called `Recovery Code` is not masked, and a
  masked value still shows six real characters.
- **`unmask: true` on an MFA record returns the TOTP seed, not a code.**
  Use `get_totp_code`, which returns a code that expires.
- **Prefer `get_field` over `get_secret`.** One value into context beats
  a whole record.
- **Rotate by add-swap-revoke.** Add a device, re-submit the connection,
  then revoke the old device — never delete first.
- See `GOVERNANCE.md` for the full model and the known upstream sharp
  edges, including why two tools are blocked for being broken rather
  than for being dangerous.
