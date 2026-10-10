# IT Glue plugin — governance and safety model

Unofficial. Community-built plugin for the IT Glue API. Not affiliated
with, endorsed by, or sponsored by the vendor.

## What it connects as

This plugin does not hold credentials. It reaches IT Glue through the
WYRE Conduit gateway (`https://conduit.wyre.ai/v1/mcp`), which brokers
authentication centrally and scopes every call to the tenant the
operator is authorised for.

- No IT Glue API key is stored on the technician's machine, in this
  repo, or in the model's context.
- The org's IT Glue credential is stored once at the gateway, so
  replacing it is one edit rather than a change on every
  technician's machine. There is no rotate action, though — you
  re-submit the connect form, which overwrites the stored credential
  in place, and nothing tracks its age or prompts you.

- Every call carries operator identity, so the gateway audit log answers
  "who read this password" — IT Glue's own log records only the API key.
- Complete offboarding in the gateway console, and confirm the person no longer has access before you treat it as done.

Confirm the live permission grant in the gateway access editor before you rely on a tier in this document. This note does not describe gateway enforcement internals.

## Tool permission groups

| Group | What it can do | Enforcement tier | Tools |
|---|---|---|---|
| **Read** | Cannot change IT Glue state. Safe for autonomous agents — but see the flexible-asset caveat below. | `read` | `search_organizations`, `get_organization`, `search_configurations`, `get_configuration`, `search_documents`, `get_document`, `list_document_folders`, `list_document_sections`, `list_flexible_asset_types`, `search_flexible_assets`, `search_locations`, `get_location`, `itglue_health_check` |
| **Write** | Creates or modifies documentation. Reversible, visible to everyone with tenant access. | `write` | `create_document`, `create_document_section`, `update_document_section`, `publish_document`, `create_location`, `update_location`, `unarchive_document` |
| **Delete** | Removes documentation, irreversibly or near-irreversibly. | `write` — **not** a tier of its own | `delete_document_section`, `archive_document` |
| **Admin** | Reads stored credentials, or the list of them. | `admin` | `get_password`, `search_passwords` |

Per-call approval for anything below is a policy you impose on your agents, and it is only as good as the agent configuration that carries it.

### The delete group, and why its two members are unequal

`archive_document` enforces at `write` and is a soft delete — the tier
is arguably right. But archiving hides a document from search and from
normal views, so the practical effect during an incident is that the
runbook is gone, and nobody discovers this until they need it at 2am. It
is reversible via `unarchive_document`, but only by someone who knows
the document existed and what it was called. (`unarchive_document` sits
in the Write group, not Delete, because its name carries no delete-ish
verb token — a naming artefact, not a judgement.)

`delete_document_section` also enforces at `write`, and it is flagged
irreversible by the server itself. There is no undo. A `write` grant on
IT Glue admits it.

## The password tools enforce at `admin`

- `search_passwords` returns **metadata only** — names, categories,
  usernames, and IDs. No secret values. It is still `admin`: the
  username-plus-system list is a complete target list on its own.
- `get_password` returns **the actual password value**. Conduit also
  pins its cache TTL to zero so the plaintext is never held in the
  result cache.

This is the one place the mechanical tier is *stricter* than a naive read/write reading, and it is the right call. The consequence for operators: a technician granted `read` or even `write` on IT Glue cannot call either password tool. Granting `admin` to reach them also grants every other tool on this vendor, including the deletes.

Regardless of tier, assume anything `get_password` returns is exposed
for the life of the session, and do not grant it to scheduled or
unattended agents.

### The credential path the tiering does not close

`search_flexible_assets` enforces at `read`. Flexible assets frequently
carry credentials in password-type fields, and those values come back
through that tool without passing through the password tools or their
`admin` gate. A read-only agent on IT Glue can reach secrets this way.
If that matters to you, restrict `search_flexible_assets` explicitly —
the tier model will not do it for you.

## Recommended agent policy

The safe default is **read autonomously, propose writes, never
self-approve deletes.**

- Read tools: allow, with `search_flexible_assets` reviewed separately
  for the reason above.
- Write tools: agent drafts the exact call, human approves, then it runs.
- Delete tools: require a named human approver per invocation.
- Admin tools: `get_password` and `search_passwords` sit here, and
  granting `admin` to reach them grants everything else on the vendor
  too. Prefer a per-tool grant to an interactive operator who is already
  entitled to that credential.

## What it cannot reach

- Only the IT Glue account mapped to the operator's gateway identity, on
  that account's regional endpoint (US, EU, or AU).
- Whatever the API key's tier forbids. IT Glue issues both full-access
  and password-excluded keys; with a password-excluded key the password
  tools fail server-side regardless of what this plugin exposes.
- Records flagged restricted-access in IT Glue, which the API does not
  return.
- No filesystem, no shell, no other vendor's data.

## Tool names are unprefixed, and the vendor slug is not the plugin name

Unlike every sibling plugin in this family, IT Glue's tools carry no vendor prefix — `create_document`, not `itglue_create_document`. When writing allowlists, denylists, or audit queries, match on the exact names above; a rule keyed on an `itglue_` prefix will match only `itglue_health_check` and silently permit everything else.

Two names are in play and they differ. Look the vendor up under `itglue` when checking classification.

## Tool surface is narrower than the skills

The plugin ships an `itglue-contacts` skill, but **there are no contact
tools**. Contact data is reachable only as a side effect of other
queries. The skill is API reference; treat it as such.

## Data handling

- Responses pass through the gateway into model context for the session
  and are not persisted by this plugin.
- `get_password` returns live credentials; `search_passwords` returns
  usernames and the systems they belong to, a complete target list even
  without the secrets. Both enforce at `admin` — see above.
- `search_organizations` and the document tools surface client PII
  wherever it was written into the documentation.
- Flexible assets frequently contain credentials in password-type
  fields. Those values come back through `search_flexible_assets`, which
  enforces at `read`, without passing through the password tools or
  their `admin` gate.

## Known sharp edges

- **Section edits are invisible until published.** Creating, updating,
  or deleting a document section changes nothing a human can see until
  `publish_document` runs. An agent that stops after the edit leaves the
  work half-done and the document unchanged.
- **Two credential stores, one search.** Credentials stored in a
  flexible asset's password-type field are not Passwords records and
  will never appear in `search_passwords`. "Not found" is not "does not
  exist."
- **Archive is not delete and delete is not archive.** `archive_document`
  hides a whole document reversibly; `delete_document_section` destroys
  part of one permanently. The names suggest a severity ordering that is
  the reverse of the truth.
- **IT Glue is documentation, not truth.** Every record reflects what
  someone wrote down. Do not let an agent treat a configuration record
  as evidence of a machine's current state.
