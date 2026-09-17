# Keeper Secrets Manager plugin — governance and safety model

Unofficial. Community-built plugin documentation for Keeper's
Secrets Manager MCP server. Not affiliated with, endorsed by, or
sponsored by Keeper Security beyond consuming their published
open-source server.

This is the only plugin in this repository whose entire purpose is
reading credential material. Read this file before adopting it.

## What it connects as

This plugin holds no credentials. It reaches Keeper through the WYRE
Conduit gateway, which fronts Keeper's
[ksm-mcp](https://github.com/Keeper-Security/keeper-mcp-golang-docker)
server and brokers authentication centrally.

- The credential is a **KSM application device configuration** — a
  base64 JSON blob entered once in the Conduit connection UI. Nothing is
  stored on the technician's machine, in this repo, or in model context.
- It is a machine identity, not a user identity. It carries the
  application's shares and nothing else: no vault-wide access, no admin
  console, no ability to re-share.
- Rotation happens at Keeper: add a device, re-submit the connection,
  revoke the old device. Nothing tracks credential age for you, and a
  redeemed device configuration does not expire on its own.

## The two boundaries, and where each one lives

**Breadth is set in Keeper.** The KSM application's folder and record
shares decide every record the connection can ever see. Conduit cannot
widen it and cannot narrow it. An application granted a broad shared
folder gives a read-only connection read access to everything in it —
which is the whole blast radius, and it is decided before the connection
exists. See `skills/application-setup/SKILL.md`.

**Capability is set at the bridge.** v1 exposes eleven read tools. Eight
upstream tools are blocked: `create_secret`, `update_secret`,
`delete_secret`, `create_folder`, `delete_folder`, `upload_file`,
`ksm_execute_confirmed_action`, and `get_all_secrets_unmasked`. They are
omitted from `tools/list` and refused on direct call. There is no flag,
env var or prompt that re-enables them; enabling writes would be a
reviewed, versioned change to the allowlist.

Two allowed tools have their write-capable arguments stripped from both
the advertised schema and the inbound call: `generate_password` loses
`save_to_secret` and `folder_uid`; `download_file` loses `save_path`.

`get_all_secrets_unmasked` and `ksm_execute_confirmed_action` stay
blocked permanently, independent of any future write posture. The first
dumps every secret in scope, unmasked, in one call; the second is
upstream's confirmation-bypass executor.

## Why the blocking is at the bridge and not a prompt

Upstream ksm-mcp asks a human to confirm unmasking and every write, over
a terminal. There is no terminal in a container. The upstream offers
only two settings for that situation — refuse the operations outright,
or auto-approve them all — and under the refusing setting `get_field`
with `unmask: true` fails, which makes the integration useless for its
main purpose. The deployment therefore runs in batch mode, where the
confirmations auto-approve, and the safety is moved to the allowlist
instead. That is a deliberate trade, and it is why "Keeper asked for
confirmation" is never an accurate description of what happened here.

## Tool tiers

Six tools return metadata only and are classified `read`:
`list_secrets`, `search_secrets`, `list_folders`,
`get_record_type_schema`, `health_check`, `get_server_version`.

Five can return credential material and are classified `admin`, which
outranks write in Conduit's model — a Keeper read *is* a credential
read: `get_secret`, `get_field`, `get_totp_code`, `download_file`,
`generate_password`.

Grant the two tiers separately. Finding a record and reading it are
different jobs and most people only need the first.

## What it cannot reach

- Only records shared to the one KSM application the connection
  authenticates as.
- No writes of any kind: no record, folder or attachment is created,
  modified or deleted through this integration.
- No bulk unmasked export.
- No Keeper admin console, no enterprise policy, no user or role
  administration.
- No filesystem, no shell, no other vendor's data.

## Data handling

Values returned by the five admin-tier tools pass into model context for
the session. This plugin persists nothing, but the transcript is a
disclosure surface, and the skills state the handling rules the agent is
expected to follow: prefer `get_field` over `get_secret`, do not echo a
value that was not asked for, never write secret material into tickets,
commits, logs or files, and prefer pointing at the record over repeating
its contents.

Masking is a partial control, not a redaction guarantee — see the
sharp edges below.

## Known sharp edges

- **Masking is a name match, not a sensitivity model.** A value is
  masked when its field type or custom-field label contains one of a
  fixed list of words. `Recovery Code` and `Service Account Credential`
  match nothing and are returned in clear with `unmask` unset.
- **`notes` is never masked.** In real vaults, notes routinely carry a
  second credential. A "masked" record read can disclose more through
  notes than through the field it starred out.
- **A masked value leaks six characters** — first three and last three,
  or `******` for values of six characters or fewer.
- **`unmask: true` on an MFA record exposes the TOTP seed**, not just a
  code. `get_totp_code` returns a code that expires; the seed does not.
- **`get_record_type_schema` is non-functional upstream** (v2.5.0): the
  embedded templates are loaded by a function the server never calls, so
  every call returns `record templates not loaded`. It is listed as an
  available read tool because it is exposed, not because it works.
- **`download_file` cannot return file contents** here: upstream writes
  to a server-side path and `save_path` is stripped. Attachments are not
  retrievable through this connection.
- **`search_secrets` rejects ordinary words.** Its input validator
  refuses any query containing `union`, `select`, `insert`, `update`,
  `delete` or `drop`, among others. `Union Bank` cannot be searched by
  name. That is input validation, not access control.

## No agents ship with this plugin

Deliberately. A persona agent over a read-only secrets surface would
mostly encourage breadth — sweeping records to build a picture — which is
the opposite of the posture the skills teach. Retrieval here should be
narrow, deliberate, and initiated by a person who needs a specific value.
