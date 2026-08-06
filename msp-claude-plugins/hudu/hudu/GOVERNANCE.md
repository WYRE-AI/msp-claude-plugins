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
- The org's Hudu credential is stored once at the gateway, so replacing
  it is one edit rather than a change on every technician's machine.
  There is no rotate action, though — you re-submit the connect form,
  which overwrites the stored credential in place, and nothing tracks its
  age or prompts you.

- Every call carries operator identity, so the gateway audit log answers
  "who read that credential" alongside Hudu's own activity log, which
  records only the API key.
- Removing someone from the organisation clears their per-vendor grants
  and revokes their gateway refresh tokens at once; a user deactivated in
  your identity provider is refused on their very next request. A user
  only removed from the org keeps an already-issued access token for up
  to an hour, but it reaches only a personal Hudu connection made with
  their own key — never the org's. See `wyre-gateway/GOVERNANCE.md`.

Hudu is self-hosted or Hudu-cloud per MSP, so the instance URL is part of
the gateway connection, not something the model chooses.

## Tool permission groups

Conduit's access editor presents four groups — Read, Write, Delete, Admin —
so those are the buckets an owner actually clicks. The **Enforcement tier**
column is what Conduit compares against a technician's grant, derived
mechanically from `VENDOR_TOOL_CONFIG` (`src/proxy/result-cache.ts`).

**Every tool below is classified**, and Hudu is one of only two vendors in
this batch where all four groups are populated. Read the Delete and Admin
rows twice.

| Group | What it can do | Enforcement tier | Tools |
|---|---|---|---|
| **Read** | Cannot change Hudu state. Returns documentation — see Data handling. | `read` | `hudu_test_connection`, `hudu_list_companies`, `hudu_get_company`, `hudu_list_assets`, `hudu_get_asset`, `hudu_list_asset_layouts`, `hudu_get_asset_layout`, `hudu_list_articles`, `hudu_get_article`, `hudu_list_websites`, `hudu_get_website`, `hudu_list_folders`, `hudu_list_procedures`, `hudu_list_relations`, `hudu_list_magic_dash`, `hudu_list_activity_logs` |
| **Write** | Creates or modifies documentation records. Reversible, and visible to everyone who reads the doc next. | `write` | `hudu_create_company`, `hudu_update_company`, `hudu_unarchive_company`, `hudu_create_asset`, `hudu_update_asset`, `hudu_create_article`, `hudu_update_article`, `hudu_create_website`, `hudu_update_website`, `hudu_create_asset_layout`, `hudu_update_asset_layout` |
| **Delete** | Removes documentation from the active set. | `write` — **not** a tier of its own | `hudu_delete_company`, `hudu_delete_asset`, `hudu_delete_article`, `hudu_delete_website`, `hudu_archive_company`, `hudu_archive_asset`, `hudu_archive_article` |
| **Admin** | Reads, writes, or destroys stored credentials. | `admin` | `hudu_get_asset_password`, `hudu_list_asset_passwords`, `hudu_create_asset_password`, `hudu_update_asset_password`, `hudu_delete_asset_password` |

### The Admin row is the good news on this page

The five password tools are classified `isAdmin` in `VENDOR_TOOL_CONFIG`,
which is why they land in the Admin group even though two of them only read
and one of them deletes. `isAdmin` outranks `isWrite`
(`src/access/tool-classification.ts:33-38`), and Conduit's convention puts
credential reads at `admin` deliberately.

This is exactly the tightening an earlier revision of this document asked
for in prose — *"read-tier by state change and credential-tier by
consequence"* — and it turns out Conduit already enforces it. Three
consequences:

- **A `read` grant cannot reach a password.** Neither can `write`. Only
  `admin` does.
- **A personal (BYOC) connection can never reach one at all.** Personal
  credentials are capped at tier `write` by a database CHECK constraint, so
  an admin-classified tool *"has no personal escalation path at all"*
  (`src/credentials/credential-service.ts:427-435`).
- **An org owner reaches them regardless.** Owner bypass resolves to
  `{ tier: 'admin', customTools: null }` before any grant query
  (`src/access/access-grant-service.ts:260-262`). Do not run day-to-day
  agent work under an owner account on this vendor.

### The Delete row is the bad news

**Granting a technician `write` on Hudu also grants every tool in the Delete
row.** Conduit's enforcement tiers are only `read`, `write` and `admin`
(plus `none`, meaning deny) — `src/access/permission-tier.ts:27`. "Delete"
is a presentation group in the access editor, and a delete-group tool
compiles to and enforces at tier `write` (`src/access/tier-group-mapping.ts`,
`GROUP_ENFORCEMENT_TIER`). There is no setting that separates them. The only
way to admit `hudu_update_article` but not `hudu_delete_article` is a
granular per-tool selection, which compiles to an explicit `customTools`
allowlist.

The grouping is derived from the verb token in the name
(`DELETE_TOKENS = delete, remove, dismiss, archive`,
`src/access/tool-naming.ts`), which is why `hudu_archive_*` sits in Delete
and `hudu_unarchive_company` sits in Write. That is the right call on this
vendor for a reason the token rule does not know about — see below.

Conduit compares tiers. It has **no approval step, no per-call confirmation,
and no elicitation.** Nothing at the gateway will pause an agent before it
deletes a runbook. Per-call approval is a policy you impose on your agents,
and it is only as good as the agent configuration that carries it.

### Where the mechanical tier disagrees with the judgement

Three classifications are not obvious from the HTTP verb, and two of them
are cases where the risk is higher than the enforcement tier suggests:

- **`hudu_archive_asset` and `hudu_archive_article` are one-way through
  this integration.** `hudu_unarchive_company` exists; there is no
  unarchive tool for assets or articles. An agent that archives a runbook
  cannot put it back, and the technician looking for it at 2am will not
  find it. They group under Delete, which is correct, and enforce at
  `write`, which is the whole point of the paragraph above.
- **`hudu_update_asset_layout` is a schema change, not a record edit.**
  Layouts are templates. Renaming or removing a field changes every asset
  built on that layout at once, and the data in a removed field does not
  come back. Blast radius is the whole asset type across every client — and
  because its name carries `update` rather than a delete token, it sits in
  the **Write** group, alongside editing a single article. Of everything on
  this page, this is the widest gap between where a tool sits and what it
  can do. Keep it out of any `customTools` list you hand an unattended
  agent.
- **`hudu_delete_asset_password` destroys the credential and its
  context.** Hudu keeps no rotation history of its own, so the deleted
  record takes the "what was this for" description with it — the
  credential may still work on the customer's system, now undocumented. It
  is classified `admin`, so it is out of reach of a `write` grant; that is
  the correct outcome and it is worth knowing it is deliberate rather than
  incidental.

## Recommended agent policy

The safe default is **read autonomously, propose writes, never
self-approve deletes** — with two Hudu-specific tightenings.

- Read tools: allow. The bundled `documentation-auditor` and
  `runbook-freshness-auditor` subagents need nothing more than this.
- Password tools: these require `admin`, and `admin` on this vendor is the
  tier that admits everything else too. If an agent genuinely needs to read
  a credential, give it **its own grant** whose `customTools` names exactly
  the password tools it needs and nothing else, and treat holding that grant
  as equivalent to holding the credentials themselves.
- Write tools: agent drafts the exact call, human approves, then it runs.
  Documentation writes are low-risk to undo but high-visibility — a wrong
  runbook is worse than a missing one. Remember that
  `hudu_update_asset_layout` rides in this group with a blast radius that
  does not belong to it.
- Delete tools: require a named human approver per invocation. Do not grant
  these to scheduled or unattended agents. Conduit cannot enforce this
  separation for you — a `write` grant already admits them — so unattended
  agents need a granular `customTools` allowlist, not a tier.
- Admin tools: treat the grant as equivalent to full Hudu administrator,
  because for a credential-reading surface that is exactly what it is.

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
