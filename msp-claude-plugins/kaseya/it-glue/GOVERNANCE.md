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
- Credential rotation happens once at the gateway, not per technician.
- Every call carries operator identity, so the gateway audit log answers
  "who read this password" — IT Glue's own log records only the API key.
- Revoking gateway access revokes IT Glue access with it, immediately.

## Tool permission tiers

| Tier | What it can do | Tools |
|---|---|---|
| **Read** | Cannot change IT Glue state. Safe for autonomous agents — with the password exception below. | `search_organizations`, `get_organization`, `search_configurations`, `get_configuration`, `search_documents`, `get_document`, `list_document_folders`, `list_document_sections`, `list_flexible_asset_types`, `search_flexible_assets`, `search_locations`, `get_location`, `search_passwords`, `get_password`, `itglue_health_check` |
| **Write** | Creates or modifies documentation. Reversible, visible to everyone with tenant access. | `create_document`, `create_document_section`, `update_document_section`, `publish_document`, `create_location`, `update_location`, `unarchive_document` |
| **Destructive** | Removes documentation, irreversibly or near-irreversibly. Requires explicit per-call human approval. | `delete_document_section`, `archive_document` |

`archive_document` sits in the destructive tier despite being a soft
delete. Archiving hides a document from search and from normal views, so
the practical effect during an incident is that the runbook is gone —
and nobody discovers this until they need it at 2am. It is reversible
via `unarchive_document`, but only by someone who knows the document
existed and what it was called.

`delete_document_section` is flagged irreversible by the server itself.
There is no undo.

## `get_password` is a read tool that returns secrets

This is the sharpest edge in the plugin and it does not fit the tier
model cleanly:

- `search_passwords` returns **metadata only** — names, categories,
  usernames, and IDs. No secret values.
- `get_password` returns **the actual password value** for the record.

Both are technically read-only against IT Glue, so both sit in the read
tier. But `get_password` pulls a live production credential into model
context. Treat it as its own tier:

- Do not grant `get_password` to autonomous, scheduled, or unattended
  agents.
- Grant it per-session to an interactive operator who is already
  entitled to that credential.
- Assume anything it returns is exposed for the life of the session.

## Recommended agent policy

The safe default is **read autonomously, propose writes, never
self-approve destructive calls** — plus the `get_password` carve-out
above.

- Read tools: allow, except `get_password`.
- Write tools: agent drafts the exact call, human approves, then it runs.
- Destructive tools: require a named human approver per invocation.

## What it cannot reach

- Only the IT Glue account mapped to the operator's gateway identity, on
  that account's regional endpoint (US, EU, or AU).
- Whatever the API key's tier forbids. IT Glue issues both full-access
  and password-excluded keys; with a password-excluded key the password
  tools fail server-side regardless of what this plugin exposes.
- Records flagged restricted-access in IT Glue, which the API does not
  return.
- No filesystem, no shell, no other vendor's data.

## Tool names are unprefixed

Unlike every sibling plugin in this family, IT Glue's tools carry no
vendor prefix — `create_document`, not `itglue_create_document`. When
writing allowlists, denylists, or audit queries, match on the exact
names above; a rule keyed on an `itglue_` prefix will match only
`itglue_health_check` and silently permit everything else.

## Tool surface is narrower than the skills

The plugin ships an `it-glue-contacts` skill, but **there are no contact
tools**. Contact data is reachable only as a side effect of other
queries. The skill is API reference; treat it as such.

## Data handling

- Responses pass through the gateway into model context for the session
  and are not persisted by this plugin.
- `get_password` returns live credentials. See above.
- `search_passwords` returns usernames and the systems they belong to —
  a complete target list even without the secrets.
- `search_organizations` and the document tools surface client PII
  wherever it was written into the documentation.
- Flexible assets frequently contain credentials in password-type
  fields. Those values come back through `search_flexible_assets`
  without passing through the password tools or their access controls.

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
