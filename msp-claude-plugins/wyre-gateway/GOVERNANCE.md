# Wyre MSP Gateway — governance and safety model

Every other governance document in this marketplace says some version of
the same four sentences: credentials are brokered centrally, so there are
no secrets on the technician's machine; rotation happens once; every call
carries operator identity; revoking gateway access revokes vendor access
with it.

This is the document that has to substantiate those claims rather than
repeat them, because this plugin *is* the thing making them. Where a
claim holds, the mechanism is named. Where it holds only partly, the gap
is stated. Where it does not hold, it is corrected — see **Corrections to
the per-vendor documents** at the end.

Everything below was written against the gateway source, not its
marketing. Claims are grounded in `wyre-technology/mcp-gateway`, which is
what serves `mcp.wyre.ai`. `conduit.wyre.ai` is a **separate repository**
that carries copies of much of this code; the two deployments have
drifted before. Statements here describe the `mcp-gateway` codebase.

## What it is

The Wyre MSP Gateway is a single authenticated endpoint that stands
between your AI agents and roughly 61 vendor APIs — your PSA, your RMM,
your documentation platform, your security stack. You connect each vendor
once, through a web form, and the gateway stores that credential
encrypted. From then on, a technician's Claude session authenticates to
*the gateway* — never to the vendor — and the gateway attaches the right
vendor credential to each outbound call. The practical consequence for an
MSP owner is that the credential which can read every client's tickets
lives in one place you control, instead of in twelve laptops' config
files, and that you get one log of who asked for what across every tool
in the stack.

This plugin ships no skills and holds no credentials. It contributes 22
cross-vendor agents and one `.mcp.json` pointing at
`https://mcp.wyre.ai/v1/mcp`. Everything governed below happens on the
server side of that URL.

## The trust model

### What the gateway holds

Vendor credentials for every connected integration, encrypted at rest in
PostgreSQL across four tables that differ only in who owns the row:
personal (`credentials`, keyed by user), organisation (`org_credentials`),
team (`org_team_credentials`), and service client
(`service_client_credentials`, for unattended M2M agents).

Encryption is AES-256-GCM. The key is not the master key directly — it is
derived per row with PBKDF2-SHA512 at 100,000 iterations over
`MASTER_KEY ‖ scopeId`, with a fresh 32-byte salt and 16-byte IV per
write. `scopeId` is the owning user, org, team, or client id. That
binding is load-bearing: a credential row copied into another tenant's
`org_id` fails the GCM authentication tag and does not decrypt. Isolation
survives a database-level mistake, not just an application-level one.

`MASTER_KEY` is supplied to the container as a deploy-time secret, not
fetched from a key vault at runtime, and is held in process memory for
the life of the process.

### How operator identity is established

The gateway is its own OAuth 2.1 authorisation server. PKCE with `S256`
is mandatory — an authorize request without a valid `code_challenge` is
rejected outright. Human login is delegated upstream to Auth0 or Entra
ID; the gateway never sees a password.

What the MCP client ends up holding is an HS256 JWT with a **1-hour**
lifetime, backed by a refresh token with a **30-day** lifetime. The JWT
carries only `sub`, `scope`, `vendor`, `iss` and `aud`. It deliberately
does **not** carry email, org, team, or role — every one of those is
resolved by a live database lookup on each request, which is why
membership changes take effect immediately (see *Revocation*).

Unattended agents authenticate with `client_credentials` against a
service client whose secret is stored as a SHA-256 hash and compared in
constant time. Their subject is `svc:<orgId>:<clientId>`, so their calls
are attributable in the log but never join to a human user record.

### How identity is carried — and where it stops

Inside the gateway, operator identity governs everything: credential
resolution, tool scope, cache partitioning, and the audit row.

**It is not forwarded to the vendor.** The outbound request to a vendor
MCP server carries exactly four things: `accept`, `content-type`, the
vendor credential headers built from that vendor's `headerMapping` (or
its `buildHeaders`/`buildHeadersAsync` function), and `mcp-session-id`
for stateful vendors. This is a deny-by-default allowlist, and it
replaced an earlier implementation that forwarded client headers
verbatim.

This is the single most important fact in the document, and it cuts both
ways. It is why the gateway's log can answer "which technician approved
that remediation" when the vendor's cannot — inside Autotask or CIPP,
every action is attributed to the one shared API user. It is also why
**the vendor cannot enforce anything per-operator on your behalf.** The
vendor sees one caller. Any per-person control has to happen at the
gateway or it does not happen.

### How tenant scoping is enforced — honestly

Six gates run in order before a vendor tool call is dispatched:

1. **JWT verification** — signature, issuer and audience pinned to the
   gateway's own base URL.
2. **Token-to-vendor binding** — a token minted during the connect flow
   for vendor A is rejected at vendor B's endpoint, so a token issued for
   a read-only documentation vendor cannot be swapped for one that
   reaches your PSA. The unified `/v1/mcp` endpoint deliberately opts out
   of this check, because it mints intentionally multi-vendor tokens.
3. **Credential resolution** — personal, then team (only when the user
   belongs to exactly one team holding credentials for that vendor), then
   org. The org tier additionally requires a per-user, per-vendor grant
   (`org_server_access`); without it the org credential is skipped
   entirely and the call fails with 403.
4. **Per-tool allowlist** — `org_tool_allowlist`, keyed by
   `(org, vendor, role)`. Enforced both when listing tools and again when
   calling one.
5. **Team allowlist intersection** — least-privilege `team ∩ org`. Behind
   `GATEWAY_TEAM_SCOPING`, **off by default**.
6. **Permission tiers** — `read < write < admin` from
   `org_members.permission_tier`, fail-closed on an unresolvable caller
   or an unclassified tool. Behind `GATEWAY_PERMISSION_TIERS`, **off by
   default**, and even when enabled it only applies to tools explicitly
   classified `isWrite` or `isAdmin` in the gateway's tool-classification
   table, which does not yet cover the whole fleet.

What none of those six gates does is constrain *which of your customers'
data* comes back. The gateway adds no tenant filter to the outbound
arguments, does not rewrite the request body beyond un-prefixing the tool
name, and does not filter responses. There is no row-level security in
the database; isolation is application-level `WHERE` clauses throughout.

**The vendor credential is the data boundary.** If the Autotask API user
you connected can see all 200 of your clients, then every operator you
authorise for Autotask reaches all 200. The gateway controls *who in your
organisation may use that credential and which tools they may call* — not
which slice of the vendor's data the credential returns. Scope the
credential at the vendor if you need a narrower boundary than that.

## What central brokering actually buys

### 1. No per-technician secrets — holds

The plugin ships a URL and nothing else; its `.mcp.json` declares no
headers and no environment secrets. Credentials never travel outward:
connect forms are never pre-filled from stored values, the connections UI
checks only for presence, `gateway__list_connections` returns vendor
slugs with no credential material, and error messages carry a vendor name
and a reconnect link only. Tool-call arguments are redacted before they
reach the audit table.

**Mechanism:** credentials are read, decrypted, and projected onto
outbound headers inside a single function on the proxy path, and that
function logs nothing.

### 2. Single-point rotation — holds for OAuth, weaker for keys

For the 10 OAuth vendors, rotation is genuine and automatic. Expiry is
checked with a 60-second safety margin, the refresh happens inline, a
rotated refresh token is honoured, and the new tokens are re-persisted at
the same scope they came from. A refresh failure raises a structured
"reconnect" error rather than a generic 401.

For API-key and shared-secret vendors there is **no rotate endpoint**.
Rotation means re-submitting the connect form, which upserts the row with
a fresh salt and IV. That works, but it is a manual action and there is
nothing that tracks credential age or prompts you.

Two caveats worth knowing before you rely on rotation as an incident
response:

- **In-memory caches are keyed by a hash of the credentials and are not
  evicted on rotation or deletion.** The tool-schema cache (5 minutes),
  the MCP session pool (10 minutes), and the upstream bearer-token cache
  (up to the vendor's stated expiry — an hour for HaloPSA) all persist
  independently, per replica. After you revoke a credential, the gateway
  can still be holding a live upstream vendor token in process memory
  until that entry expires. It is not reachable through the gateway's own
  request path — credential lookup fails first — but it is un-revoked
  material retained past the revoke.
- **There is no master-key rotation tooling.** Changing `MASTER_KEY`
  would silently orphan every stored credential; decryption failures are
  swallowed and surface as "not connected."

### 3. Per-operator audit the vendor cannot produce — holds

Every proxied tool call writes a row to `request_log` carrying the
operator's user id, org id, vendor slug, tool name, HTTP status, and
response time. On the unified `/v1/mcp` endpoint it additionally stores
the **redacted call arguments** and a bounded response summary
(`isError`, content-item count, byte size, cache-hit flag) — enough to
reconstruct what was asked and whether it failed, without storing
customer data wholesale. Redaction runs before the write and covers both
sensitive key names and credential-shaped values; the vendor still
receives the original arguments, only the audit copy is scrubbed.

This is the claim the vendor genuinely cannot match, and the reason is
mechanical: as established above, no operator identity is forwarded
upstream, so the vendor's own log has nothing to record but the shared
API account.

Its real limits:

- **Audit writes are fire-and-forget.** Every insert on the request path
  is an un-awaited query with a `.catch` that logs a warning. A tool call
  can succeed — credential injected, vendor record changed, result
  returned — while its audit row silently fails to write. There is no
  retry, no queue, no dead-letter, and no failure counter. The database
  pool is capped at 5 connections per replica on a tier hard-capped at
  50, so connection pressure is a realistic failure mode, and it drops
  audit rows rather than requests.
- **Argument capture is not uniform.** Only the unified `/v1/mcp` path
  records arguments. The legacy per-vendor route, the CLI route, and all
  gateway-native tool calls write the 7-column form with no `arguments`
  at all.
- **Allowlist denials are not logged.** A permission-tier denial writes a
  403 row; a tool-allowlist denial returns an error and writes nothing.
  Someone probing for tools outside their allowlist leaves no trace.
- **Retention is 90 days**, pruned daily by a hard `DELETE`. Ship logs
  to your own SIEM if you need longer; per-org log shipping exists and
  forwards arguments and response summaries verbatim.
- **The log is append-only by convention, not by enforcement.** There are
  no database grants, triggers, or rules restricting it, and the
  application connects with a role that runs DDL at boot. No code path
  updates or deletes individual rows — but nothing prevents it either.
- Operator email and name are not stored on the row; they are joined from
  the `users` table at read time. Delete the user and the trail degrades
  to an opaque id.

### 4. Revocation that revokes — holds for org credentials, with two named exceptions

The reason it works is architectural: because the JWT carries no org,
team, or role, all three are re-read from the database on every single
request. Remove someone from the org, revoke their per-vendor grant, or
delete the credential row, and the very next call fails — no cache sits
in front of that lookup, and the credential check runs before the result
cache, so stale cached reads are not served to a revoked caller either.

The exceptions:

- **The access token is never revoked.** It is a stateless JWT valid for
  up to an hour. A method to revoke all of a user's refresh tokens exists
  in the token store and **has no callers anywhere in the codebase** —
  member removal deletes the membership row and syncs the seat count,
  nothing more. So a removed member keeps a valid *token* for up to an
  hour and a valid *refresh* token for up to 30 days unless someone
  separately calls the OAuth revoke endpoint.
- **Personal credentials survive org removal entirely.** Credential
  resolution checks personal credentials *first*, before any membership
  or grant check, and a personal-credential caller gets an unfiltered
  tool surface. Removing a technician from your organisation does not
  touch anything they connected under their own account.

There is also no "disabled" state for a user — the schema has no
`disabled`, `is_active`, or `deleted_at` column. Offboarding is
expressed as removal from the org, which is why the two exceptions above
matter operationally rather than theoretically.

**Practical guidance:** treat "remove from org" as revoking shared access
promptly and reliably. Treat full offboarding as three steps — remove
from the org, revoke the refresh token, and confirm the person holds no
personal connections.

## The gateway's own tools

Seven tools are served by the gateway itself rather than proxied to any
vendor. Tiered by blast radius, as everywhere else in this marketplace:

| Tier | What it can do | Tools |
|---|---|---|
| **Read** | Changes nothing. Disclosure surface only — but see the notes, several are org-wide. | `search_tools`, `list_connections`, `resolve_entity`, `list_entity_mappings`, `get_usage_summary` |
| **Write** | Writes org-wide state that later calls trust. | `store_entity_mapping` |
| **Platform admin** | Cross-tenant disclosure across every customer on the platform. Not reachable by MSP staff. | `get_admin_metrics` |

Three things about this table matter more than the table.

**None of the six non-admin gateway tools is subject to the tool
allowlist or the permission-tier gate.** They dispatch earlier in the
request path than both checks. The only gate is a valid JWT. You cannot
currently restrict them per role.

**`get_admin_metrics` is cross-tenant by nature, and that is a disclosure
surface rather than a write surface.** It returns platform-wide
operational data — active organisation names and plans, tool-call volume,
recent signups *including owner email addresses*, trial end dates, and
Stripe customer ids — with no per-org filter. It is gated to Wyre
platform staff by an email allowlist that also requires the identity
provider to attest the address is verified; the tool name is filtered out
of `tools/list` for everyone else and the check is repeated at dispatch,
so calling it by name without having seen it listed still fails. It is
**not** available to an MSP's own org admins or owners. Denials are
audited — though only when the caller belongs to an org, and the
equivalent HTTP endpoint returns the same data with no audit entry at
all.

**`get_usage_summary` is the one to think about internally.** It is
correctly scoped to a single organisation you belong to — not
cross-tenant — but it is org-wide with no role check, so any member sees
the whole organisation's call volume and top tools, which is a reasonable
proxy for what every colleague has been doing. For users who belong to
more than one org it always reports the first one, silently.

**`store_entity_mapping` deserves its write tier.** It maintains the
canonical-name-to-vendor-id map that `resolve_entity` serves back, and
whose description instructs the model to trust it before searching vendor
tools directly. The write is org-wide, gated only by a valid JWT, and
merges shallowly and last-writer-wins — so overwriting one vendor's id
for "Acme Corp" leaves the other vendors' ids intact and the record still
looks well-formed. The upsert refreshes `confirmed_at`, so a bad write
also resets the 30-day staleness flag to "fresh." There is no MCP tool to
delete a mapping, no version history, and — because gateway-native calls
log no arguments — **no record anywhere of what was written**. The audit
shows that someone called `store_entity_mapping`, not what it said.

The realistic path to that is not a malicious employee. It is prompt
injection: a hostile string in a ticket body persuading an agent to write
a mapping. The gateway does inspect vendor responses for injection
patterns, but detection is explicitly **fail-open** — matches are
annotated and logged, and the response is still forwarded.

## Where the gateway is the only enforcement point

Vendor MCP servers publish safety metadata and implement their own
confirmation prompts. Both are **advisory** to a gateway client, and two
verified findings make the class concrete.

**Annotations are metadata, not gates.** In `meraki-mcp`, six tools carry
`destructiveHint: true` in their annotations while their handlers call
`guardWrite({ destructive: false })` — which means no confirmation is
required and the call proceeds:
`meraki_devices_reboot`, `meraki_networks_update`,
`meraki_clients_update_policy`, `meraki_switch_ports_update`,
`meraki_wireless_ssids_update`, and
`meraki_appliance_firewall_l3_update`. Only `meraki_devices_remove`,
`meraki_networks_delete`, and `meraki_raw_request` on a DELETE method
actually require the `confirm_destructive_action` flag. Several of those
six can take a site off the network — replacing a firewall ruleset or
changing an uplink port is not a routine update — and the annotation that
says so is the part that is not enforced.

**Interactive confirmations do not exist for a non-interactive client.**
In `connectwise-cpq-mcp`, confirmation is implemented through MCP
elicitation, which degrades gracefully by design: if the caller never
declared a form-elicitation capability, the helper returns `unavailable`,
and callers treat `unavailable` the same as approval in order to preserve
pre-elicitation behaviour. The gateway is a non-interactive client. The
confirmation is therefore never asked, and the delete proceeds.

Neither of these is a bug in isolation — both are defensible local
designs, and both have fixes in flight. The class is what matters, and
the class outlives the instances:

> **A control that depends on the client being interactive, or on the
> client reading and acting on annotations, is not a control when the
> client is a gateway.** Assume every vendor-side confirmation, read-only
> default, and destructive-hint is documentation. The gateway's
> allowlist, and your approval workflow above it, are the enforcement.

Two corollaries worth stating:

- Vendor-side "read-only mode" switches — `meraki-mcp` defaults to
  read-only until `READ_ONLY_MODE=false` — are container environment
  variables. They are fleet-wide on/off settings, not per-operator or
  per-org policy. They cannot express "Priya may write, the overnight
  agent may not."
- Nothing today proves to a vendor sidecar that a request came from the
  gateway. The gateway can now sign requests with an HMAC
  `X-Gateway-S2S` header, but the feature is dark unless a shared secret
  is configured, and most vendor images do not yet verify it. Treat the
  vendor container fleet as trusting its network, not its caller.

## Passthrough and dispatcher tools defeat per-tool allowlists

The allowlist matches on **tool name only**. Arguments are never
inspected. That is fine for `autotask_search_tickets` and fatal for
anything whose blast radius is chosen at call time.

Three shapes exist, and they are not equally dangerous:

| Shape | Tools | Effect |
|---|---|---|
| **Dispatcher** — runs another tool by name, in-process | `autotask_execute_tool`, `sherweb_execute_tool` | Inherits the full tool surface of that server. The gateway sees only the dispatcher's name. |
| **Raw HTTP passthrough** — arbitrary REST against the vendor API | `autotask_raw_request`, `meraki_raw_request`, `auvik_raw_request` | Inherits the full privilege of the credential, including endpoints no tool exposes. |
| **Arbitrary query language** | `superops_custom_mutation` | Unbounded write access to the tenant. |

`autotask_router` and `sherweb_router` are **not** in this category
despite the name. Both take a plain-language intent and return a
*suggestion*; neither executes anything. Tiering them as reads, as the
Autotask and Sherweb documents do, is correct.

**How a gateway policy should handle a tool with no fixed blast radius:**

1. **Never place a dispatcher or passthrough tool in an allowlist you are
   using to restrict anything.** Allowlisting `autotask_execute_tool`
   grants the entire Autotask surface — including every tool you
   deliberately left out of that same allowlist. The restriction becomes
   decorative.
2. If the capability is genuinely needed, give it **its own role or team**
   whose allowlist contains that tool and nothing else, and treat
   membership of that role as equivalent to full vendor administrator.
3. Never grant one to a scheduled or unattended agent, or to a service
   client, at any tier.
4. In review, read the *arguments*, not the tool name. `autotask_execute_tool`
   is the only line the audit trail will show you, and on the legacy and
   CLI paths not even the arguments are recorded.

## Recommended agent policy

The house default applies here too — **read autonomously, propose writes,
never self-approve destructive calls** — with three additions specific to
the control plane:

- **Turn the allowlist on.** With no rows in `org_tool_allowlist`, the
  effective policy is allow-all. Restriction is opt-in, per
  `(org, vendor, role)`. An org that never configures one has the
  tiering in all 62 vendor documents as *advice*, not as enforcement.
- **Know that owners bypass it.** An org owner resolves to unrestricted
  scope regardless of the allowlist. Do not run day-to-day agent work
  under an owner account.
- **Know that personal connections bypass everything.** A user with their
  own credential for a vendor gets an unfiltered tool surface and no
  membership check. If you want org policy to mean something, connect
  vendors at the org and audit for personal connections.

For unattended agents, use a service client rather than a human's token:
its vendor list is enforced independently, its calls are attributable to
a non-human subject, and it cannot inherit a technician's personal
connections.

## Honest limits

Consolidated, so you can read them without reading the rest:

- **The credential is the data boundary.** The gateway does not scope
  which customers a vendor call can reach. Scope at the vendor.
- **Permission tiers are off by default** and cover only classified
  tools. The read/write/destructive tables in the other 62 documents
  describe intent; the gateway-side enforcement of them is the
  allowlist, which is separate and also opt-in.
- **Default policy is allow-all.** No allowlist rows means every tool.
- **Owners and personal connections bypass tool policy.**
- **Allowlists are per-role, not per-person** — only `admin` and `member`
  lists exist.
- **The allowlist ignores arguments**, so dispatchers and passthrough
  tools defeat it (above).
- **Audit writes are best-effort** and can be lost silently under
  database pressure.
- **Argument-level audit exists only on the unified endpoint** — not on
  the legacy per-vendor route, the CLI route, or gateway-native tools.
- **Allowlist denials produce no audit record.**
- **Audit retention is 90 days**, and the log is not immutable at the
  database level. The admin audit log has a cleanup function with no
  scheduled caller and grows unbounded.
- **Access tokens are not revocable** and last up to an hour; refresh
  tokens last 30 days and no offboarding path revokes them.
- **There is no user-disable state.**
- **Credential caches are not evicted on revoke or rotate**, per replica.
- **No master-key rotation path exists.**
- **Rate limiting is throughput protection, not a security control.** It
  is per-user per-hour (100 free / 1000 paid), stored in-memory
  per-replica with no shared backend, on a service that scales to three
  replicas — so the real ceiling is up to three times the configured
  number and resets on every deploy. There is no per-org, per-tool, or
  aggregate cap: an org of ten gets ten times one person's limit.
- **Vendor-side controls are advisory** (above).
- **Prompt-injection detection on vendor responses is fail-open.**
- **The gateway is a single point of compromise.** That is the deliberate
  trade: one hardened, audited, monitored place holding the credentials
  instead of twelve unmonitored ones. It is a better trade, not a free
  one. Judge it on how that one place is run — key handling, admin
  access, patch cadence — because those are now the controls that matter
  most.

## Corrections to the per-vendor documents

Each of the 62 vendor governance documents contains a variant of four
claims. Measured against the code:

| Claim | Verdict |
|---|---|
| "No API key or secret is stored on the technician's machine, in this repo, or in the model's context." | **Accurate.** |
| "Credential rotation happens once at the gateway, not per technician." | **Accurate for OAuth vendors. Overstated for key-based vendors** — there is no rotate action, only re-submitting the connect form, and cached upstream tokens survive it briefly. |
| "Every call carries operator identity, so the gateway audit log answers 'who asked for this' — the vendor's own log cannot." | **Accurate, and mechanically explained** by the deny-by-default outbound header allowlist. Qualify with: audit writes are best-effort, and full argument capture exists only on the unified endpoint. |
| "Revoking gateway access revokes vendor access with it, immediately." | **Accurate for org-credential access** — membership and grants are re-read per request. **Not accurate as an unqualified statement**: the issued access token remains valid for up to an hour, refresh tokens for up to 30 days with no revocation on removal, and personal connections are unaffected. |

One further correction, applying to the template itself: "The gateway
enforces these tiers" is not yet true as written. What the gateway
enforces is the per-tool **allowlist** — which an org must configure, and
which is expressed as tool names rather than tiers. The read / write /
destructive tiering is the model you should use to *build* that
allowlist, and once `GATEWAY_PERMISSION_TIERS` is enabled fleet-wide with
full tool classification, it becomes enforcement in its own right.

## Where this document departs from the template, and why

The vendor template assumes a connector: one vendor, one credential, a
tool table, and a boundary statement. Four departures were unavoidable.

1. **No "unofficial / not affiliated" notice.** This is first-party WYRE
   software. The disclaimer would be false here.
2. **A trust-model section the template has no slot for.** For a vendor
   connector, "what it connects as" is one paragraph because the gateway
   is doing the work. For the gateway, that paragraph *is* the document —
   credential storage, identity, and the six-gate request path replace
   it.
3. **The tool table is tiered by disclosure as well as by write.** The
   template's three tiers assume blast radius means changed vendor state.
   The gateway's most sensitive tool changes nothing and reads across
   every tenant on the platform, so "cross-tenant disclosure" had to
   become a tier of its own.
4. **"Honest limits" replaces "Known sharp edges," and is longer than the
   strengths.** A vendor document lists operational hazards. A control
   plane has to publish the boundaries of its own controls, or the 62
   documents that point at it are unsupported assertions. The
   **Corrections** section exists for the same reason — the discrepancies
   found while writing this belong in the open, not in a commit message.
