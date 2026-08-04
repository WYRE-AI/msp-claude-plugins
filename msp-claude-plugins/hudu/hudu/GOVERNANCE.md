# Hudu plugin — governance and safety model

Unofficial. Community-built plugin for the Hudu API. Not affiliated with,
endorsed by, or sponsored by the vendor.

## What it connects as

This plugin does not hold credentials. It reaches Hudu through the WYRE
Conduit gateway (`https://conduit.wyre.ai/v1/mcp`), which brokers
authentication centrally and scopes every call to the Hudu instance the
operator is authorised for.

- No Hudu API key is stored on the technician's machine, in this repo, or
  in the model's context.
- Credential rotation happens once at the gateway, not per technician.
- Every call carries operator identity, so the gateway audit log answers
  "who read that credential" alongside Hudu's own activity log, which
  records only the API key.
- Revoking gateway access revokes Hudu access with it, immediately.

Hudu is self-hosted or Hudu-cloud per MSP, so the instance URL is part of
the gateway connection, not something the model chooses.

## Tool permission tiers

| Tier | What it can do | Tools |
|---|---|---|
| **Read** | Cannot change Hudu state. Returns documentation — including credentials, see Data handling. | `hudu_test_connection`, `hudu_list_companies`, `hudu_get_company`, `hudu_list_assets`, `hudu_get_asset`, `hudu_list_asset_layouts`, `hudu_get_asset_layout`, `hudu_list_articles`, `hudu_get_article`, `hudu_list_websites`, `hudu_get_website`, `hudu_list_asset_passwords`, `hudu_get_asset_password`, `hudu_list_folders`, `hudu_list_procedures`, `hudu_list_relations`, `hudu_list_magic_dash`, `hudu_list_activity_logs` |
| **Write** | Creates or modifies documentation records. Reversible, and visible to everyone who reads the doc next. | `hudu_create_company`, `hudu_update_company`, `hudu_unarchive_company`, `hudu_archive_company`, `hudu_create_asset`, `hudu_update_asset`, `hudu_create_article`, `hudu_update_article`, `hudu_create_website`, `hudu_update_website`, `hudu_create_asset_password`, `hudu_update_asset_password`, `hudu_create_asset_layout` |
| **Destructive** | Removes documentation, or changes a schema that every asset under it depends on. Requires explicit per-call human approval. | `hudu_delete_company`, `hudu_delete_asset`, `hudu_delete_article`, `hudu_delete_website`, `hudu_delete_asset_password`, `hudu_archive_asset`, `hudu_archive_article`, `hudu_update_asset_layout` |

Three of those classifications are not obvious from the HTTP verb, so they
are stated explicitly:

- **`hudu_archive_asset` and `hudu_archive_article` are one-way through
  this integration.** `hudu_unarchive_company` exists; there is no
  unarchive tool for assets or articles. An agent that archives a runbook
  cannot put it back, and the technician looking for it at 2am will not
  find it.
- **`hudu_update_asset_layout` is a schema change, not a record edit.**
  Layouts are templates. Renaming or removing a field changes every asset
  built on that layout at once, and the data in a removed field does not
  come back. Blast radius is the whole asset type across every client.
- **`hudu_delete_asset_password` destroys the credential and its
  context.** Hudu keeps no rotation history of its own, so the deleted
  record takes the "what was this for" description with it — the
  credential may still work on the customer's system, now undocumented.

## Recommended agent policy

The safe default is **read autonomously, propose writes, never
self-approve destructive calls** — with one Hudu-specific tightening.

- Read tools: allow, **except the password tools**. Grant
  `hudu_get_asset_password` and `hudu_list_asset_passwords` only to
  attended sessions. They are read-tier by state change and
  credential-tier by consequence.
- Write tools: agent drafts the exact call, human approves, then it runs.
  Documentation writes are low-risk to undo but high-visibility — a wrong
  runbook is worse than a missing one.
- Destructive tools: require a named human approver per invocation. Do not
  grant these to scheduled or unattended agents, including the bundled
  `documentation-auditor` and `runbook-freshness-auditor` subagents, which
  only need read access to do their jobs.

## What it cannot reach

- Only the Hudu instance and the companies the operator's gateway identity
  maps to. Hudu API keys can additionally be scoped per company and
  IP-whitelisted at the Hudu end; the gateway does not widen that.
- **Password access is a separate per-API-key toggle in Hudu.** If the key
  behind the gateway connection has password access disabled, every
  password tool returns 403 while everything else works. That is a
  deliberate configuration, not a broken connection — and it is the
  cheapest way to take credential exposure off the table entirely.
- No filesystem, no shell, no other vendor's data.
- No user, group, or API-key administration. Hudu's own admin surface is
  not exposed here.

## Data handling

Hudu is the highest-sensitivity connector in this marketplace. Responses
pass through the gateway into model context for the session and are not
persisted by this plugin, but what they contain matters:

- **`hudu_get_asset_password` returns the plaintext credential value** in
  the response body, plus `otp_secret` where a TOTP seed is stored.
  Anything that reaches model context reaches the conversation transcript.
  Never echo the value into a summary, report, ticket note, or log — mask
  it and reference the record by name.
- `hudu_list_asset_passwords` enumerates which credentials exist, for
  which company, under which name. That inventory is itself a targeting
  map even without the values.
- **Every password read is logged in Hudu's activity log**, visible to the
  MSP's Hudu admins. A broad sweep is not invisible; scope reads by
  `company_id` rather than enumerating the tenant.
- `hudu_get_company`, `hudu_get_asset`, and `hudu_get_article` return
  whatever the MSP documented, which in practice includes client contact
  PII, network topology, licence keys, and credentials pasted into article
  bodies or asset custom fields. Treat the whole surface as confidential,
  not just the password endpoints.
- `hudu_list_activity_logs` is the audit trail. It is read-only and should
  stay that way; it is the record that answers questions about the tools
  above.

## Known sharp edges

- **The API name is `asset_passwords`, not `passwords`.** The Hudu UI says
  "Passwords". An agent that reasons from the UI label will construct a
  path that does not exist.
- **403 on a password tool is a key-permission problem, not a bad key.**
  The same connection works everywhere else. Do not let an agent
  "diagnose" this as an expired credential and prompt for a rotation.
- **Delete is unrecoverable and there is no trash.** Prefer archiving —
  but see above: archive is one-way for assets and articles through this
  integration.
- **Rate limit is 300 requests/minute.** Documentation sweeps across a
  large tenant will hit it and return partial results; a truncated sweep
  is incomplete, not empty.
- **`url` means two different things** in password payloads — the
  credential's login URL on create/update, and the Hudu record URL in the
  read response metadata. Round-tripping a read into an update corrupts
  the field.
