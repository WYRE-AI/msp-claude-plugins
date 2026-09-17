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

**Capability is set at the bridge.** v1 serves nine read tools. Ten
upstream tools are blocked — omitted from `tools/list`, refused on direct
call, with no flag, env var or prompt that re-enables them. The reason
differs, and the difference matters to anyone deciding whether to ask for
one to be turned on.

*Withheld by policy (8):* `create_secret`, `update_secret`,
`delete_secret`, `create_folder`, `delete_folder`, `upload_file`,
`get_all_secrets_unmasked`, `ksm_execute_confirmed_action`. Enabling
writes would be a reviewed, versioned change to the allowlist. The last
two stay blocked permanently regardless: the first dumps every secret in
scope, unmasked, in one call; the second is upstream's
confirmation-bypass executor.

*Broken at the pinned upstream version (2):* `get_record_type_schema` and
`download_file`. These are not a policy position and no policy change
would make them functional — see the sharp edges below. They were exposed
in an earlier draft of this integration and removed once the upstream
source was read.

`generate_password` has its write-capable arguments stripped from both
the advertised schema and the inbound call: `save_to_secret` and
`folder_uid`.

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

Five tools return metadata only and are classified `read`:
`list_secrets`, `search_secrets`, `list_folders`, `health_check`,
`get_server_version`.

Four can return credential material and are classified `admin`, which
outranks write in Conduit's model — a Keeper read *is* a credential
read: `get_secret`, `get_field`, `get_totp_code`, `generate_password`.

Grant the two tiers separately. Finding a record and reading it are
different jobs and most people only need the first.

## What it cannot reach

- Only records shared to the one KSM application the connection
  authenticates as.
- No writes of any kind: no record, folder or attachment is created,
  modified or deleted through this integration.
- No bulk unmasked export.
- No attachment contents — `download_file` is blocked and nothing else
  can fetch them.
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
- **`get_record_type_schema` is non-functional upstream** (v2.5.0):
  `LoadRecordTemplates` has no non-test caller and the package has no
  `init`, so every call returns `record templates not loaded` — a message
  naming an internal function, which reads like a server fault. Blocked
  for that reason. Nothing is lost: a masked `get_secret` reports the
  fields a record actually has, which is the better answer anyway.
- **`download_file` cannot return file contents in any configuration.**
  Upstream's signature is `DownloadFile(uid, fileUID, savePath) error` —
  it returns an error and writes bytes to a server-side path. Passing
  `save_path` through would let one tenant write attacker-chosen paths
  into a container shared with every other tenant's child process;
  stripping it leaves no destination. Blocked for that reason.
  **Attachments are not retrievable through this connection.**
- **`get_secret` does not guarantee a complete field list.** With no
  `fields` argument it iterates a hard-coded list per record type, so a
  standard field outside that list is simply absent. "Not in the
  response" never means "not on the record".
- **`search_secrets` rejects ordinary words.** Its input validator
  refuses any query containing `union`, `select`, `insert`, `update`,
  `delete` or `drop`, among others — a SQL-injection filter on a search
  that never touches SQL. `Union Bank`, `Updates Server` and `Dropbox`
  cannot be searched by name. That is input validation, not access
  control, and not evidence a record is missing.

## No agents ship with this plugin

Deliberately. A persona agent over a read-only secrets surface would
mostly encourage breadth — sweeping records to build a picture — which is
the opposite of the posture the skills teach. Retrieval here should be
narrow, deliberate, and initiated by a person who needs a specific value.
