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

## Which system this describes, and a naming problem

**Claims here are grounded in `WYRE-AI/conduit`**, which serves
`https://conduit.wyre.ai/v1/mcp`. Conduit is the product.

An earlier revision of this document was written against
`WYRE-AI/mcp-gateway`, which serves `mcp.wyre.ai`. Those are two
separate repositories that share ancestry and have since drifted, and
several of that revision's findings turned out to describe only the older
system. This revision re-derives every claim from Conduit's source and
says explicitly, at the end, which of the earlier findings survived.

Two pieces of stale naming followed from that split. One has since been
fixed; the other is deliberately left alone:

- **This plugin is still called `wyre-gateway`.** It is the Conduit
  plugin. Renaming it would change the install id, the `enabledPlugins`
  key, and every skill namespace that references it, so it is deliberately
  left alone.
- **This plugin's own `.mcp.json` used to point at
  `https://mcp.wyre.ai/v1/mcp`** — the *other* system — as did the
  `.mcp.json` in nine vendor plugins: `auvik`, `blackpoint`, `crewhu`,
  `freshdesk`, `immybot`, `inforcer`, `saas-alerts`, `threatlocker`, and
  `timezest`. All ten have been repointed at Conduit. **No plugin in this
  marketplace points at `mcp.wyre.ai` any more.** Twenty-one entries ship
  a `.mcp.json`: this plugin and the ten `*-pack` aggregates use the
  unified `https://conduit.wyre.ai/v1/mcp`; `ncentral` and the nine
  vendor plugins above use the per-vendor
  `https://conduit.wyre.ai/v1/<vendor>/mcp`, whose path segment must
  match the vendor's `slug` in `src/credentials/vendor-config.ts` or
  Conduit answers 404 (`src/proxy/router.ts:103`). The remaining 55 of
  the marketplace's 76 entries ship no `.mcp.json` at all.

## What it is

Conduit is a single authenticated endpoint that stands between your AI
agents and 98 connectable vendor integrations — your PSA, your RMM, your
documentation platform, your security stack
(`src/credentials/vendor-config.ts:617`, `VENDORS`). You connect each
vendor once, through a web form, and Conduit stores that credential
encrypted. From then on, a technician's Claude session authenticates to
*Conduit* — never to the vendor — and Conduit attaches the right vendor
credential to each outbound call. The practical consequence for an MSP
owner is that the credential which can read every client's tickets lives
in one place you control, instead of in twelve laptops' config files, and
that you get one log of who asked for what across every tool in the stack.

This plugin ships no skills and holds no credentials. It contributes 21
cross-vendor agents and one `.mcp.json`. Everything governed below happens
on the server side of that URL.

## The trust model

### What Conduit holds

Vendor credentials for every connected integration, encrypted at rest in
PostgreSQL across five tables that differ mainly in who owns the row:
personal (`credentials`, keyed by user), organisation (`org_credentials`),
team (`org_team_credentials`, legacy and being collapsed), service client
(`service_client_credentials`, for unattended M2M agents), and named org
keys (`org_credential_keys`, optionally team-bound). All five carry the
same `encrypted_data` / `iv` / `auth_tag` / `salt` columns.

Encryption is AES-256-GCM with a 16-byte auth tag
(`src/credentials/crypto.ts:59-61`). The key is not the master key directly —
it is derived per row with PBKDF2-SHA512 at 100,000 iterations
(`crypto.ts:42`) over `MASTER_KEY ‖ scopeId` (`crypto.ts:38-41`), with a
fresh 32-byte salt and 16-byte IV per write (`crypto.ts:55-57`). `scopeId`
is the owning user, org, team, or client id. That binding is load-bearing:
a credential row copied into another tenant's `org_id` fails the GCM
authentication tag and does not decrypt. Isolation survives a
database-level mistake, not just an application-level one.

Named org keys deliberately encrypt with `scopeId = orgId` even when
team-bound (`src/credentials/credential-service.ts:963`), so re-binding a
key to a different team does not require re-encryption.

`MASTER_KEY` is delivered as an Azure Key Vault secret reference on the
Container App (`azure/modules/gateway-app.bicep:401-402`) and injected as
an environment variable (`:843`). The process reads `process.env.MASTER_KEY`
once at construction (`credential-service.ts:220`) and holds it in memory
for the life of the process — there is no runtime Key Vault call, so
rotating the vault secret does not reach a running replica. Production
refuses to boot without a 64-hex-character key (`src/config.ts:9-19`).

Row-level security is enabled and FORCEd on the credential tables
(`migrations/007_rls_enable.sql:99-112`,
`migrations/085_org_credential_keys.sql:73-74`) — this is a real
difference from the older gateway, where isolation was application-level
`WHERE` clauses only.

### How operator identity is established

Conduit is its own OAuth 2.1 authorisation server. What the MCP client
ends up holding is an HS256 JWT with a **1-hour** lifetime, backed by a
refresh token with a **30-day** lifetime (`src/config.ts:78-79`, defaults
overridable via `ACCESS_TOKEN_TTL` / `REFRESH_TOKEN_TTL`). The JWT carries
only `sub`, `scope`, `vendor`, `iss` and `aud`
(`src/oauth/authorization-server.ts:37-50`). It deliberately does **not**
carry email, org, team, or role — every one of those is resolved by a live
database lookup on each request (`src/proxy/credential-injector.ts:571-580`
for org and team; `src/org/org-route-helpers.ts:317-321` for role), which
is why membership changes take effect immediately (see *Revocation*).

Refresh tokens are stateful, stored as SHA-256 hashes
(`src/oauth/token-store.ts:82-84`), and rotated on every use
(`authorization-server.ts:678`, `:699`).

Unattended agents authenticate as a service client whose subject is
`svc:<orgId>:<clientId>` (`credential-injector.ts:488-492`), so their calls
are attributable in the log but never join to a human user record.

The browser session is separate: a signed cookie with a 7-day sliding
window and a 30-day absolute cap (`src/lib/session-cookie.ts:14,17,27`),
with no server-side session table. Two levers reach it. A per-request
`onRequest` hook refuses any session whose user is deactivated and clears
the cookie (`src/auth/session-deactivation-guard.ts`) — a hook rather than
a check inside `requireAuth0`, so it covers every console route including
ones not yet written. The only *global* lever remains rotating
`JWT_SECRET`, which logs everyone out at once (`session-cookie.ts:24-25`).

### How identity is carried — and where it stops

Inside Conduit, operator identity governs everything: credential
resolution, tool scope, cache partitioning, and the audit row.

**It is not forwarded to the vendor.** The outbound request to a vendor
MCP server is built from scratch, not proxied — it carries exactly
`accept`, `content-type`, the vendor credential headers derived from that
vendor's `buildHeaders`/`headerMapping`
(`src/proxy/credential-injector.ts:230-252`), an optional `X-Gateway-S2S`
HMAC, and `mcp-session-id` for stateful vendors
(`src/proxy/router.ts:39-70`, `src/proxy/unified-router.ts:1191-1197`).
The client's own `Authorization` header is consumed and replaced
(`unified-router.ts:507`); cookies and user-agent are not forwarded. The
S2S header carries no identity at all — its value is
`t=<unixSeconds>,v1=<hmac>`, an HMAC over the timestamp only
(`src/proxy/s2s.ts:140-142`).

This is the single most important fact in the document, and it cuts both
ways. It is why Conduit's log can answer "which technician approved that
remediation" when the vendor's cannot — inside Autotask or CIPP, every
action is attributed to the one shared API user. It is also why **the
vendor cannot enforce anything per-operator on your behalf.** The vendor
sees one caller. Any per-person control has to happen at Conduit or it
does not happen.

### How a tool call is authorised

`enforceToolCall` (`src/proxy/tool-call-enforcement.ts:116`) is the single
gate for every router — unified, legacy per-vendor, CLI, and aggregated.
It returns the first denial, in this order:

| # | Gate | Line | Flag |
|---|---|---|---|
| 0 | **Discovery-tool suppression** — `*_navigate` / `*_back` are refused for everyone, owners and personal connections included | 125–130 | none |
| P | **Personal-credential short-circuit** — if the caller resolved to a personal (BYOC) credential, the only check is their `credentials.access_tier`; no org gate runs | 133–160 | none |
| — | Org id must be present, else deny | 163–170 | none |
| 1 | Resolve effective access (owner bypass detected here) | 178–185 | none |
| 2 | **Vendor tier must be at least `read`** | 192–201 | **none — unconditional** |
| 3a | Legacy per-`(org, vendor, role)` tool allowlist (`org_tool_allowlist`) | 207–215 | none |
| 3b | **Access-grant tier + `customTools` allowlist** | 216–229 | `ACCESS_GRANT_ENFORCEMENT_ENABLED` |
| 4 | Billing/service-active gate | 234–235 | `BILLING_SERVICE_GATE_ENABLED` |

The `tools/list` filter mirrors the same stages
(`src/proxy/list-visibility.ts:44`), so a tool is listed if and only if
calling it would not be denied — display equals enforcement by
construction.

**Gate 3b is ON in production.** The code default is off
(`src/config.ts:648`), but `azure/params.conduit-prod.bicepparam:108` and
`azure/params.staging.bicepparam:94` both set
`accessGrantEnforcementEnabled = true`, and `.github/workflows/deploy.yml:571`
fails the deploy if the running container reports anything else. This is
the sharpest difference from the older gateway, where the equivalent gate
was off by default and nowhere turned on.

Gates 3a and 3b are skipped for org **owners** (`ownerBypass`, line 187).
Owner bypass is exactly `role === 'owner'` (`src/access/owner-bypass.ts:20-22`),
never a service client (`:53`), and it covers allowlists and grants
**only** — never the billing gate (`tool-call-enforcement.ts:232-233`).

What none of those gates does is constrain *which of your customers' data*
comes back. Conduit adds no tenant filter to the outbound arguments, does
not rewrite the request body beyond un-prefixing the tool name, and does
not filter responses.

**The vendor credential is the data boundary.** If the Autotask API user
you connected can see all 200 of your clients, then every operator you
authorise for Autotask reaches all 200. Conduit controls *who in your
organisation may use that credential and which tools they may call* — not
which slice of the vendor's data the credential returns. Scope the
credential at the vendor if you need a narrower boundary than that.

## The tier model — and the word "destructive"

Conduit has exactly four permission tiers, and only three of them can ever
be required by a tool:

```
type PermissionTier = 'none' | 'read' | 'write' | 'admin';
```
— `src/access/permission-tier.ts:27`. They form a strict chain
(`none:0 < read:1 < write:2 < admin:3`, `:34-39`), and a caller may invoke
a tool iff their rank is at least the tool's required rank.

**There is no "destructive" tier and there never was.** The access editor
presents four *groups* — Read, Write, Delete, Admin — but `delete` is
presentation only. A delete-group tool compiles to and enforces at tier
`write`:

```ts
const GROUP_ENFORCEMENT_TIER: Record<GroupKey, ...> = {
  read: 'read', write: 'write', delete: 'write', admin: 'admin',
};
```
— `src/access/tier-group-mapping.ts`. The module says so in its own
header: *"'delete' never appears as a stored tier, because enforcement
… never returns it either. A delete-group tool still requires enforcement
tier 'write' to invoke."*

The operational consequence is the one an owner most needs and is least
likely to guess: **granting a technician `write` on a vendor grants them
every delete tool on that vendor too.** The only way to admit some write
tools but not the delete ones is a granular per-tool selection, which
compiles to an explicit `customTools` allowlist rather than a tier.

Conduit also has no approval step, no per-call confirmation, and no
interactive prompt. Any per-vendor document promising that "destructive
tools require explicit human approval per call" is describing a workflow
you must impose on your agents, not something Conduit enforces. **47 of
the 62 per-vendor documents currently make some version of that promise**
— 45 of them inside the Destructive row of the tier table itself — see
**Taxonomy debt**.

## Fail-closed, and the vendors Conduit has not classified

Tool classification derives from `VENDOR_TOOL_CONFIG`
(`src/proxy/result-cache.ts`), which `src/access/tool-classification.ts:4`
declares the **single source of truth**. The convention is `isAdmin →
admin` (outranks), `isWrite → write`, neither → `read`, unknown → `null`
(`tool-classification.ts:33-38`).

Conduit **fails closed**, in two distinct places:

- The pure decision core denies an unclassified tool outright:
  `if (!requiredTier) return false;` (`permission-tier.ts:56`).
- The enforcement gate coerces unclassified to the *highest* tier rather
  than to deny:
  ```ts
  const requiredTier: PermissionTier = classified ?? 'admin'; // UNCLASSIFIED -> ADMIN
  ```
  — `src/access/access-enforcement.ts:63`.

The coercion is deliberate flip-neutrality: an admin caller can still
invoke an unclassified tool, so enabling the gate denied no
currently-working caller. But for everyone below admin it is a hard deny.

**This is the operational fact that appears in no per-vendor governance
document.** `VENDOR_TOOL_CONFIG` classifies **35 vendor slugs**. Conduit
can connect **98**. The marketplace ships **64 vendor plugins**, of which
**34** map to a classified slug and **30 do not**. For every plugin in the
second list, *every tool it documents requires tier `admin`* — read tools
included — no matter what its own tier table says.

| Classified in `VENDOR_TOOL_CONFIG` (34 plugins) | Not classified — **all tools require `admin`** (30 plugins) |
|---|---|
| `alternative-payments`, `autotask`, `auvik`, `azure-mcp`, `blackpoint`, `checkpoint-avanan`, `cipp`, `clio`, `connectwise-automate`, `connectwise-cpq`, `connectwise-psa`, `crewhu`, `datto-rmm`, `datto-saas-protection`, `domotz`, `halopsa`, `hudu`, `huntress`, `it-glue`, `kaseya-quote-manager`, `liongard`, `m365`, `meraki`, `microsoft-graph`, `ninjaone-rmm`, `pax8`, `quickbooks-online`, `rocketcyber`, `rootly`, `saas-alerts`, `scalepad`, `sentinelone`, `syncro`, `threatlocker` | `abnormal-security`, `atera`, `betterstack`, `blumira`, `datto-bcdr`, `freshdesk`, `hubspot`, `immybot`, `inforcer`, `ironscales`, `kaseya-bms`, `kaseya-vsa`, `knowbe4`, `mimecast`, `ncentral`, `pagerduty`, `pandadoc`, `proofpoint`, `runzero`, `salesbuildr`, `sherweb`, `slack`, `spamtitan`, `spanning`, `stripe`, `superops`, `timezest`, `unitrends`, `warmly`, `xero` |

Twenty-eight of the thirty ship a `GOVERNANCE.md` with a Read / Write /
Destructive tier table that, today, has no enforcement meaning at all —
the whole table collapses to `admin`. (`slack` and `stripe` ship no
governance document.) One classified slug, `halopsa-official`, has no
marketplace plugin.

This list is a snapshot of `VENDOR_TOOL_CONFIG` and moves whenever a
vendor is classified. It is stated once, here, rather than copied into
thirty documents, precisely because it is volatile: it has one upstream
source in one file in one repository, and it should have one downstream
statement. The template
(`_templates/governance-template.md`) points new documents at this section
rather than restating it.

Two practical consequences:

1. **A read-only agent cannot use an unclassified vendor at all** unless
   you grant it `admin` — which grants it everything else on that vendor
   too. There is no safe middle setting.
2. **Classifying a vendor is a privilege reduction, not an addition.**
   Adding a vendor to `VENDOR_TOOL_CONFIG` moves its read tools down from
   `admin` to `read`. If you are waiting to classify a vendor because it
   feels like a security-relaxing change, you have it backwards.

## What central brokering actually buys

### 1. No per-technician secrets — holds

The plugin ships a URL and nothing else; its `.mcp.json` declares no
headers and no environment secrets. Credentials never travel outward: they
are read, decrypted, and projected onto outbound headers inside
`deriveVendorHeaders` (`src/proxy/credential-injector.ts:230-252`) on the
proxy path, and the outbound header set is built by construction rather
than forwarded.

### 2. Single-point rotation — holds for OAuth, weaker for keys

**There is no rotate action in Conduit, for any vendor.** No HTTP route,
no console control, no CLI command updates a stored vendor credential in
place. The only `rotate` action in the whole product is for a tunnel
enrolment token. What "rotation" means here therefore depends entirely on
the vendor's auth type, and the two cases are genuinely different.

**38 of the 98 vendors are OAuth** — they carry an `oauthConfig` in
`src/credentials/vendor-config.ts`, and `isOAuthVendor` (`:6538-6541`) is
the only discriminator there is; Conduit has no declared auth-type field.
For those 38, token refresh is genuine and automatic, by two paths:
proactive refresh when the stored token is within 60 seconds of expiry
(`credential-injector.ts:732`, `isTokenExpired` in
`src/oauth/vendor-oauth.ts:389`), and a reactive 401 → refresh →
retry-once (`src/proxy/oauth-reactive-retry.ts:45-64`). Refresh is
single-flight per `cacheScope:vendor`, and the new tokens are written back
to whichever store the key came from (`credential-injector.ts:152-216`),
including the reseller's org rather than the borrowing customer's. When
refresh fails, the caller gets a 401 naming the reconnect URL. The
reactive retry is scoped to unary JSON-RPC paths — the legacy streaming
per-vendor route is explicitly out of scope (`oauth-reactive-retry.ts:22-31`).

Note the limit of that: automatic refresh keeps a *working* token working.
It does not replace the underlying grant. Changing the actual credential
still means re-running the connect flow.

**For the other 60 vendors there is no rotation path at all beyond the
connect form.** Re-submitting it upserts the row with a fresh salt and IV.
That works, it takes effect on the very next tool call — there is no
decrypted-credential cache anywhere in the request path — but it is manual,
and nothing tracks credential age or warns you before a secret expires.

Three caveats before you rely on rotation as an incident response:

- **"Once at the gateway" means once per scope, not once per vendor.** A
  vendor credential can exist in five places at the same time: personal
  (`credentials`), org anchor (`org_credentials`), named org key
  (`org_credential_keys`, optionally team-bound), legacy team
  (`org_team_credentials`), and service client
  (`service_client_credentials`). Resolution prefers them roughly in that
  order (`credential-injector.ts:627-706`), so **a technician who connected
  the vendor personally is unaffected by an org rotation** — their own key
  wins. Rotating the anchor also does not propagate to named keys hanging
  off it (`ensureOrgAnchor` is `ON CONFLICT DO NOTHING`,
  `credential-service.ts:1184-1199`). There is no fan-out, no
  rotate-everywhere, and no admin view that enumerates every stored copy.
  If you are rotating because a credential leaked, enumerate the scopes
  yourself.
- **The result cache is not evicted on revoke or rotate.** The tool-schema
  cache (5 min, `src/proxy/tool-cache.ts:86`) and the MCP session pool
  (10 min, `src/proxy/mcp-session-pool.ts:19`) both key on a hash of the
  credential headers, so a rotated credential simply misses them and the
  stale entries become unreachable. The **result cache does not** — it
  keys on the *scope* (`user:<id>` / `org:<id>` / …), which is invariant
  across rotation and revocation, and its `invalidate()` early-returns
  unless the tool is a write tool (`src/proxy/result-cache.ts:2056-2058`).
  Its only callers are the routers' post-write path; nothing in
  deprovisioning, token revocation, credential update, or connection
  delete touches it, and `CacheStore` exposes no delete operation to call.
  So previously-cached read results for that scope stay readable for up to
  the tool's TTL — 30 seconds for tickets, up to 24 hours for picklists.

  Two things bound this. **It is not an authorisation bypass**: every
  cache hit still runs `injectCredentials` and `enforceToolCall` first, so
  a deprovisioned or deactivated user is refused before the lookup. And
  caching is currently on for only four vendors — `connectwise-psa`,
  `autotask`, `connectwise-cpq` and `itglue`; every other classified
  vendor is `ttlMs: 0`, and credential-plaintext tools are non-cacheable by
  construction. The exposure is a still-authorised caller reading data
  fetched with a credential you have since rotated.
- **There is no master-key rotation tooling**, and because `MASTER_KEY` is
  read into memory once at boot, changing the Key Vault secret does not
  reach a running replica.

### 3. Per-operator audit the vendor cannot produce — holds, with one large caveat

Every proxied tool call writes a row to `request_log`
(`src/org/org-service.ts:775-786`) carrying the operator's user id, org id,
vendor slug, tool name, HTTP status, response time, source, and — since
migration 108 — a `denial_reason`.

This is the claim the vendor genuinely cannot match, and the reason is
mechanical: as established above, no operator identity is forwarded
upstream, so the vendor's own log has nothing to record but the shared API
account.

Its real limits, and one genuine strength:

- **Tool-call arguments are not recorded at all.** This is a deliberate
  product decision, not a gap in coverage:
  `shouldCapturePrompt()` returns `false` unconditionally
  (`src/audit/prompt-capture.ts:17-27`), because *"no prompt-capture
  strategy is compatible with 'we can't see your data'."* Every write site
  is gated on it, so `tool_arguments`, `prompt_context`, and
  `response_summary` are always null. Redaction machinery exists and would
  run first if capture were ever re-enabled
  (`src/observability/redact.ts:28-48`), and the
  `organizations.prompt_capture_enabled` column is now vestigial. **The
  audit answers who called what, never with what arguments.** For a
  dispatcher or passthrough tool, that is the difference between an audit
  trail and a tool name (see *Passthrough tools*).
- **Denials are logged — all of them.** A single writer
  (`src/proxy/tool-call-enforcement.ts:260-290`) records status 403 plus a
  machine-readable reason for every gate: `discovery`, `access`,
  `vendor-access`, `scope`, `service`. This is a real improvement over the
  older gateway, where allowlist denials left no trace. (Minor drift: the
  reader's docblock at `src/audit/audit-service.ts:30-38` enumerates four
  reasons while the gate emits five.)
- **`request_log` writes are fire-and-forget.** The insert promise is
  detached and every failure is caught and logged, never propagated
  (`src/observability/request-log.ts:43-60`). A tool call can succeed while
  its audit row silently fails to write.
- **Retention has two conflicting mechanisms.** A boot-time sweep deletes
  rows older than **90 days** (`src/index.ts:739`), while a `pg_cron` job
  purges at **395 days** (`migrations/038_request_log_retention.sql:105-140`).
  The 90-day sweep is stricter and wins on any deployment that restarts
  regularly, notwithstanding the migration's stated 13-month SOC 2 intent.
  Ship logs to your own SIEM if you need longer — per-org log shipping
  exists for Loki, Graylog and LogScale
  (`src/log-shipping/log-shipping-service.ts:69-81`), org-scoped by SQL
  predicate (`:277`, `:307`), polling every 30 seconds
  (`src/log-shipping/shipper.ts:17-22`).
- **`admin_audit_log` is genuinely append-only.** Migration 107 enforces it
  with UPDATE and DELETE triggers plus a `prev_hash`/`row_hash` chain and a
  `verify_admin_audit_chain()` tamper detector
  (`migrations/107_admin_audit_log_tamper_evidence_enforce.sql:19-35`), and
  the cleanup function now throws rather than deleting
  (`src/audit/admin-audit-service.ts:473-481`). Control-plane events are
  WORM. Its writes are still fail-open — a failed audit write is warned and
  swallowed so it cannot fail the business operation (`:328-332`).
- Operator email and name are not stored on the row; they are joined from
  the `users` table at read time. Delete the user and the trail degrades to
  an opaque id.

### 4. Revocation that revokes — holds, with one residual gap

This section was rewritten against `WYRE-AI/conduit#1303` (merged
2026-08-06), which closed most of what an earlier revision listed here as
four exceptions. Two of the four — unrevoked refresh tokens, and a
`users.active` flag nothing read — are simply gone. One, the unrevocable
access token, is narrowed to a stated one-hour window. One, personal
credentials, is unchanged and still true. Both survivors are below.

Three mechanisms carry the claim — live membership resolution,
refresh-token revocation, and the deactivation check — and they are worth
separating because they fail differently.

**Membership-derived access is resolved live, on every request.** Because
the JWT carries no org, team, or role, all three are re-read from the
database on every single call (`credential-injector.ts:589-598` for org and
team; `org-route-helpers.ts:317-321` for role). Remove someone from the
org, revoke their per-vendor grant, or delete the credential row, and the
very next call cannot resolve the org credential — no cache sits in front
of that lookup.

**Deprovisioning is one primitive, and the invariant is enforced by a
test.** `src/auth/deprovisioning.ts` owns two of the three durable
artifacts a deprovisioned person can be holding: their gateway refresh
tokens (`revokeGatewayTokensForUser` `:93`, `revokeGatewayTokensForOrgMembers`
`:117`) and the `users.active` flag (`isUserDeactivated` `:144`). Every
teardown path goes through it:

| Path | Source | Clears per-vendor grants | Revokes refresh tokens |
|---|---|---|---|
| Console member removal | `org/member-service.ts:141`, `:147` | yes | yes |
| SCIM `active:false` (PATCH/PUT) and `DELETE /Users/:id` | `scim/users-handler.ts:470-478` | yes, tenant scope | yes |
| Reseller operator removal | `org/reseller-member-service.ts:352` | n/a — the `reseller_members` row *is* the authority | yes |
| Org hard-delete / soft-delete / suspend | `org/org-service.ts:1838`, `:1913`, `:1991` | by cascade | yes |

`revokeAllUserTokens` (`src/oauth/token-store.ts:300`) no longer has zero
callers; it is reached from every row above. The revoke is deliberately
global rather than per-org — a refresh token carries no org binding, so
there is no narrower revocation that is correct, and a user removed from
one of two orgs must re-run the OAuth flow (`deprovisioning.ts:85-91`).

The invariant is mechanical rather than conventional:
`src/auth/__tests__/deprovisioning.invariant.test.ts` source-scans the tree
for membership-teardown SQL (`DELETE FROM org_members`, `reseller_members`,
`users`, `organizations`) and fails any file that tears membership down
without going through `deprovisioning.ts`. A future offboarding route that
forgets gets a red test with the reason in it, rather than a fourth silent
gap.

**SCIM teardown previously ran where it could not delete.** A SCIM request
authenticates with an opaque connection token, so it runs on the
NOBYPASSRLS request pool with `conduit.current_user_id = ''`. Every table
the teardown touches gates its DELETE on that GUC, so **every one of those
DELETEs matched zero rows and reported success.** The whole transaction now
runs under `runAsSystem` (`scim/users-handler.ts:470`), which is what makes
SCIM deprovisioning actually deprovision. If you tested SCIM offboarding
before 2026-08-06 and it appeared to succeed, it did not.

**`users.active` is now read at four layers.** It was previously written by
SCIM and read by nothing:

| # | Layer | Source | What it stops |
|---|---|---|---|
| 1 | Authorisation-code grant | `oauth/authorization-server.ts:608` | minting a token at login |
| 2 | Refresh grant | `authorization-server.ts:698` | minting a token from a refresh token — and because rotation destroys the presented token first (`:690`), the chain **terminates** rather than being refused once |
| 3 | `injectCredentials` | `proxy/credential-injector.ts:432` | every vendor-bound request — the choke point all four routers pass through |
| 4 | Browser session | `auth/session-deactivation-guard.ts:57` | console access; nulls the user and clears the cookie |

Layer 4 closed the sharpest of the old gaps. The session cookie is a pure
signed-cookie decode with a sliding 7-day window and a 30-day cap, so
before this a deactivated user kept **full console access for up to 30
days** — reading and rotating org credentials, granting vendor access,
inviting members. That is a higher-privilege surface than the MCP endpoint.

Layer 3 is the load-bearing one for the MCP path: it is what makes an
*already-issued* token stop working, rather than surviving to its `exp`.

One deliberate design note: `isUserDeactivated` **fails open on a missing
`users` row** (`deprovisioning.ts:124-143`). Every human who completed an
OAuth login has a row and no production path hard-deletes one, so "row
absent" is not a state a deprovisioned user can reach.

**The residual gap: an access token issued before an org-removal.** The
access token is a stateless HS256 JWT verified by signature only — no store
check, no `jti`, no denylist, no introspection endpoint
(`credential-injector.ts:404-407`). Revoking refresh tokens stops
re-issuance; it cannot reach a JWT already in a client's hands. The
deactivation check does reach it, but only for the deactivation event.

So: a user **deactivated in your IdP** is refused on their very next
request, everywhere. A user **only removed from an organisation** keeps
their last access token until it expires — one hour by default
(`config.ts:78`, `ACCESS_TOKEN_TTL`). During that window it can no longer
reach anything through the organisation's credentials, because those are
resolved from live membership on every request. It can still reach vendors
the person connected **personally**, with their own key.

Closing the general case needs either a `jti` denylist or introspection on
the verify path, both of which convert a deliberately stateless design into
a stateful one. That is a product decision, and it is stated as still open
in the module's own header (`deprovisioning.ts:49-57`).

**Personal credentials still survive deprovisioning.** Nothing in SCIM or
member removal deletes them — the only `DELETE` against `credentials` is
keyed on the user's own disconnect
(`src/credentials/credential-service.ts:504`). A deprovisioned user whose
org membership is gone falls through to the `user-personal` branch and
keeps proxying to the vendor with their own key, subject to the deactivation
check at layer 3.

They are not unrestricted, though: personal connections are gated by
`credentials.access_tier`, which migration 080's CHECK constraint limits to
`'read'` or `'write'`, defaulting to read-only. Admin-classified tools
*"have no personal escalation path at all … and are denied unconditionally
for personal connections"*
(`src/credentials/credential-service.ts:427-435`). A personal connection is
a real bypass of org *policy*, but not of the tier model.

**In-flight reseller impersonation is revoked separately.**
`revokeAllForOperator` (`src/reseller/acting-as-session-service.ts:204`)
clears `acting_as_sessions` and is wired beside the token revoke at each
deprovisioning event. It is deliberately not folded into
`deprovisioning.ts` — it is reseller-scoped and emits its own audit event
(`deprovisioning.ts:13-19`). If you add a sixth deprovisioning path, the
invariant test enforces the token half; the acting-as half is still on you.

**Practical guidance.** Offboarding is now two steps, not four:

1. **Deactivate the person in your identity provider** (or delete them)
   whenever SCIM is wired up. This is the strongest lever: it revokes
   refresh tokens, clears per-vendor grants, and refuses their very next
   request to both the console and the gateway.
2. **Confirm they hold no personal connections.** These are the one thing
   deprovisioning does not remove on their behalf, and the audit is worth
   doing at offboarding rather than discovering later.

If you can only remove them from the org — no SCIM, no IdP deactivation —
that revokes shared access reliably and immediately, and leaves them at
most one hour of a token that can reach only their own personal
connections. `POST /oauth/revoke` is no longer a required offboarding step,
though it still works on a single caller-supplied token.

## Conduit's own tools

Five tools are served by Conduit itself rather than proxied to any vendor.
They are far narrower than the older gateway's seven — there is **no
`get_admin_metrics`, no `get_usage_summary`, no `store_entity_mapping`, no
`resolve_entity`, no `list_entity_mappings`, no `list_connections`, and no
`search_tools`** in Conduit. The entire cross-tenant-disclosure and
entity-mapping analysis in the previous revision of this document
described the other system.

| Tool | Source | What it does |
|---|---|---|
| `conduit__my_access` | `src/access/my-access.ts:52` | Reports the caller's *own* effective access. Read-only by construction — *"only resolver/explain reads, never a grant write"* (`src/proxy/unified-router.ts:2683-2685`). |
| `conduit__list_skills` | `src/skills/skill-serving.ts:22` | Lists servable skills. |
| `conduit__get_skill` | `src/skills/skill-serving.ts:23` | Fetches one skill's content. |
| `conduit__memory_search` | `src/orgmem/memory-serving.ts:10` | Searches org memory. |
| `conduit__memory_lookup` | `src/orgmem/memory-serving.ts:11` | Fetches an org memory entry. |

Two things about this table matter more than the table.

**None of the five passes through `enforceToolCall`.** They are
intercepted early in the unified router — skills at
`src/proxy/unified-router.ts:814-829`, memory at `:838-851`, `my_access` at
`:859-870` — while the `vendor__tool` split does not happen until `:872`
and the gate is not reached until `:1146`. The ordering is deliberate and
documented as load-bearing (`:808-813`). There is no `conduit` key in
`VENDOR_TOOL_CONFIG`, so if one of them *did* reach the gate it would be
unclassified and fail closed to `admin`.

**They are not ungoverned, only governed differently.** Skills run a
parallel binary (non-tiered) access model — `skillAccessAllowsSkill`
(`src/skills/skill-enforcement.ts:23`) with an `allowed` flag plus a
`customSkills` list where `null` means unrestricted and `[]` means
deny-all — applied at `visibleSkills` / `loadServableSkill`
(`unified-router.ts:2487-2537`). `my_access` discloses only the caller's
own access. The practical gap is that none of the five can be restricted
by the tier model an owner configures for everything else.

## Where Conduit is the only enforcement point

Vendor MCP servers publish safety metadata and implement their own
confirmation prompts. Both are **advisory** to a gateway client, and two
verified findings make the class concrete. These are facts about the
vendor repositories, so they hold regardless of which gateway is in front
of them.

**Annotations are metadata, not gates.** `meraki-mcp` shipped six tools
carrying `destructiveHint: true` whose handlers called
`guardWrite({ destructive: false })` — so no confirmation was required
and the call proceeded: `meraki_devices_reboot`, `meraki_networks_update`,
`meraki_clients_update_policy`, `meraki_switch_ports_update`,
`meraki_wireless_ssids_update`, and `meraki_appliance_firewall_l3_update`.
Several can take a site off the network — replacing a firewall ruleset or
changing an uplink port is not a routine update — and the annotation
saying so was precisely the part not enforced.

Fixed in `WYRE-AI/meraki-mcp#3` (merged 2026-08-04): all six are
now gated, and a surface-wide test asserts every tool annotated
`destructiveHint: true` both declares `confirm_destructive_action` and is
refused without it. The enumeration was the wrong fix — the PR originally
covered four, and an audit found two more — so the invariant replaced it.

**Keep the general lesson even though this instance is closed.** An
annotation is advice to the model; only a runtime check is a control.
When a vendor document claims a tool "confirms first", that claim is
about the vendor server's own behaviour, and it is worth verifying rather
than inheriting. The same pattern held in `connectwise-cpq-mcp`, where
elicitation returned `unavailable` for clients that do not declare
form-elicitation capability and the code treated that as consent — so the
prompt existed for interactive clients and silently did not for Conduit
(fixed in `connectwise-cpq-mcp#3`).

**Interactive confirmations do not exist for a non-interactive client.**
In `connectwise-cpq-mcp`, confirmation is implemented through MCP
elicitation, which degrades gracefully by design: if the caller never
declared a form-elicitation capability, the helper returns `unavailable`,
and callers treat `unavailable` the same as approval in order to preserve
pre-elicitation behaviour. Conduit is a non-interactive client. The
confirmation is therefore never asked, and the delete proceeds.

Both are now fixed (`meraki-mcp#3`, `connectwise-cpq-mcp#3`, merged
2026-08-04). Neither was a bug in isolation — both were defensible local
designs that became gaps only once a gateway was the client. The class is
what matters, and the class outlives the instances:

> **A control that depends on the client being interactive, or on the
> client reading and acting on annotations, is not a control when the
> client is a gateway.** Assume every vendor-side confirmation, read-only
> default, and destructive-hint is documentation. Conduit's tier model,
> and your approval workflow above it, are the enforcement.

Two corollaries worth stating:

- Vendor-side "read-only mode" switches — `meraki-mcp` defaults to
  read-only until `READ_ONLY_MODE=false` — are container environment
  variables. They are fleet-wide on/off settings, not per-operator or
  per-org policy. They cannot express "Priya may write, the overnight agent
  may not."
- Conduit can sign requests to vendor sidecars with an HMAC `X-Gateway-S2S`
  header (`src/proxy/s2s.ts:140-142`), but the value attests only a
  timestamp, and most vendor images do not verify it. Treat the vendor
  container fleet as trusting its network, not its caller.

**Prompt-injection detection on vendor responses is explicitly
fail-open.** `src/proxy/response-inspector.ts` matches 13 conservative
patterns (`:36-50`) and replaces a matched leaf with
`[GATEWAY: suspicious content removed from tool response]` (`:53`). Its
own header says it *"never blocks, drops, or throws … The result is always
still forwarded to the client"* (`:16-20`). The separate `securityTap`
(`src/security/security-tap.ts`) records TOFU identity drift and taint
events but is observe-only, wrapped in a try/catch commented *"security
scanning must never affect the request path."*

## Passthrough and dispatcher tools defeat per-tool policy

The tier model and both allowlists match on **tool name only**. Arguments
are never inspected — `ToolCallGateInput`
(`src/proxy/tool-call-enforcement.ts:69-79`) carries `identity`,
`vendorSlug`, `toolName` and services, and has no `arguments` field at all.
The only component that reads arguments is the observe-only
`securityTap` (`src/security/security-tap.ts:138`), which never denies.

That is fine for `autotask_search_tickets` and fatal for anything whose
blast radius is chosen at call time. Conduit classifies most of these
correctly:

| Tool | Line in `result-cache.ts` | Classification | Tier |
|---|---|---|---|
| `autotask_raw_request` | 192 | `isWrite`, `isAdmin` | **admin** |
| `autotask_execute_tool` | 193 | `isWrite`, `isAdmin` | **admin** |
| `autotask_router` | 194 | `isWrite`, `isAdmin` | **admin** |
| `cwautomate_scripts_execute` | 997 | `isWrite`, `isAdmin` | **admin** |
| `datto_run_quickjob` | 476–480 | `isWrite`, `isAdmin` | **admin** |
| `cipp_run_standards_check` | 516 | `isWrite`, `isAdmin` | **admin** |
| `powerquery` / `purple_ai` (SentinelOne) | 845, 848 | `isAdmin` | **admin** |
| `microsoft_graph_get` | 1043 | `isAdmin` | **admin** |
| `meraki_raw_request` | 1496 | `isWrite`, `isAdmin` | **admin** |

**`meraki_raw_request` was the one outlier, and it has been fixed**
(`WYRE-AI/conduit#1274`, merged 2026-08-04). It was `isWrite`
only, so a `write`-tier caller could issue arbitrary Meraki API calls —
including the DELETEs that `meraki_networks_delete` and
`meraki_devices_remove` pin to `admin` twelve lines above it — and no
gate reads arguments to notice.

It was not an oversight. `tool-naming-exceptions.ts` recorded the
decision as *"narrower than Autotask's raw/execute surfaces; kept
as-classified"*, which was not accurate: both take an arbitrary method
and path. The convention at `tool-classification.ts:15-17` (*"unbounded
passthrough/query surfaces"* → admin) was correct and the entry
contradicted it.

The convention is now enforced rather than merely stated: a guard in
`conduit/src/access/tool-classification.test.ts` asserts every
arbitrary-request passthrough is admin-pinned, and it was verified to
fail without the fix. **A tool whose blast radius is chosen by its
arguments cannot be gated by its name** — that is the general rule this
row exists to illustrate.

Three tools the previous revision listed **do not exist in Conduit**:
`auvik_raw_request` (Auvik's block, `result-cache.ts:886-902`, contains no
write tool at all — its only non-read entry is
`auvik_entities_list_audits`, classified `admin` at `:896`),
`superops_custom_mutation`, and `sherweb_execute_tool`. Neither `superops`
nor `sherweb` has a `VENDOR_TOOL_CONFIG` entry at all, so every tool on
both fails closed to `admin`. All three were gateway-only artifacts.

`autotask_router` returns only a *suggestion* and executes nothing, so the
Autotask document's read-tier description of it is editorially reasonable —
but note that Conduit itself classifies it `admin`, so the document and the
enforcement disagree in the safe direction.

**How a policy should handle a tool with no fixed blast radius:**

1. **Never put a dispatcher or passthrough tool in a `customTools` list you
   are using to restrict anything.** Admitting `autotask_execute_tool`
   grants the entire Autotask surface, including every tool you
   deliberately left out of that same list. The restriction becomes
   decorative.
2. If the capability is genuinely needed, give it **its own grant** whose
   `customTools` contains that tool and nothing else, and treat holding
   that grant as equivalent to full vendor administrator.
3. Never grant one to a scheduled or unattended agent, or to a service
   client, at any tier.
4. Do not plan to review these after the fact. Because argument capture is
   off unconditionally, `autotask_execute_tool` is the *only* thing the
   audit trail will ever show you — never what it dispatched.

## Recommended agent policy

The house default applies here too — **read autonomously, propose writes,
never self-approve deletes** — with four additions specific to the control
plane:

- **Grant enforcement is on; use it.** Unlike the older gateway, Conduit's
  access-grant gate is live in production. Configure grants rather than
  relying on the legacy `org_tool_allowlist`, which is documented as
  retiring (`src/access/access-explain.ts:13-19`).
- **Know that owners bypass grants.** An org owner resolves to
  `{ tier: 'admin', customTools: null }` before any grant query
  (`src/access/access-grant-service.ts:260-262`). Do not run day-to-day
  agent work under an owner account.
- **Know what `write` includes.** It includes every delete-group tool on
  that vendor. If that is not what you meant, use a granular selection.
- **Audit for personal connections.** They bypass org policy entirely,
  though they are capped at `write` and can never reach an admin tool.

For unattended agents, use a service client rather than a human's token:
it can never hold owner bypass (`src/access/owner-bypass.ts:53`), its calls
are attributable to a non-human subject, and it cannot inherit a
technician's personal connections. Note that a service client with no
explicit grant now *inherits* team and `all_members` access
(`access-grant-service.ts:316-318`) — a deliberate change from the earlier
explicit-grant-only behaviour, and one to check when you provision one.

## Honest limits

Consolidated, so you can read them without reading the rest:

- **The credential is the data boundary.** Conduit does not scope which
  customers a vendor call can reach. Scope at the vendor.
- **35 of 98 connectable vendors are classified.** For the rest — 30 of the
  marketplace's 64 vendor plugins — every tool requires `admin`.
- **There is no "destructive" enforcement tier.** `write` includes delete.
- **There is no approval, confirmation, or elicitation step** anywhere in
  Conduit.
- **Owners bypass grants and allowlists**; personal connections bypass org
  policy (but are capped at `write`).
- **Policy ignores arguments**, so dispatchers and passthrough tools defeat
  it. Every such tool is now pinned to `admin` and a guard keeps it that
  way (`conduit#1274`), but that is containment, not a fix: granting
  `admin` on a vendor with a passthrough grants that vendor's whole API.
- **Tool-call arguments are never audited**, by deliberate design.
- **`request_log` writes are best-effort** and can be lost silently.
- **`request_log` retention is effectively 90 days** (boot sweep), despite
  a 395-day `pg_cron` job.
- **An already-issued access token is still not revocable in the general
  case** — stateless JWT, no `jti`, no denylist. Deprovisioning revokes
  refresh tokens, so the *chain* ends immediately, but a token already in
  a client's hands survives to its `exp`: one hour by default. IdP
  deactivation is the exception that reaches it, at all four layers.
- **That residual hour reaches only personal connections.** Org, team and
  role are resolved live per request, so an ex-member's surviving token
  cannot use the organisation's credentials — only ones they connected
  themselves, which deprovisioning does not delete on their behalf.
- **There is no rotate action for any vendor.** OAuth vendors get
  automatic token refresh; the other 60 require re-submitting the connect
  form, and nothing tracks credential age.
- **A credential can exist in five scopes at once**, and rotating one does
  not reach the others — a personal connection outranks the org's.
- **The result cache is not evicted on revoke or rotate**, per replica, for
  up to 24 hours on long-TTL tools — though every hit is still
  authorisation-checked first, and only four vendors cache at all.
- **No master-key rotation path exists**, and the key is read once at boot.
- **Rate limiting is throughput protection, not a security control.** A
  global 600/minute backstop (`src/rate-limit-backstop.ts:21-22`) and a
  flat per-user 5,000/hour ceiling (`src/billing/prices.ts:104`) are both
  stored in-process per replica — there is no Redis in the repository — so
  the real ceiling is N × the configured number across N replicas. There is
  no per-org aggregate cap.
- **Vendor-side controls are advisory** (above).
- **Prompt-injection detection on vendor responses is fail-open**, and the
  security tap is observe-only.
- **Conduit is a single point of compromise.** That is the deliberate
  trade: one hardened, audited, monitored place holding the credentials
  instead of twelve unmonitored ones. It is a better trade, not a free one.
  Judge it on how that one place is run — key handling, admin access, patch
  cadence — because those are now the controls that matter most.

## Corrections to the per-vendor documents

Each of the 62 vendor governance documents contains a variant of four
claims. Measured against Conduit's code:

| Claim | Verdict |
|---|---|
| "No API key or secret is stored on the technician's machine, in this repo, or in the model's context." | **Accurate.** |
| "Credential rotation happens once at the gateway, not per technician." | **Was overstated; now corrected in all 59 documents that carried it.** There is no rotate action for *any* vendor. The 38 OAuth vendors get automatic token refresh; the other 60 require re-submitting the connect form, with no age tracking. "Once" is also per *scope*, not per vendor — a personal connection outranks the org's and is not touched by an org rotation. Cached *results* survive rotation for up to the tool's TTL. |
| "Every call carries operator identity, so the gateway audit log answers 'who asked for this' — the vendor's own log cannot." | **Accurate, and mechanically explained** by the built-from-scratch outbound header set. Qualify with: `request_log` writes are best-effort, and **arguments are never captured**, so the log answers *who called what*, never *with what*. |
| "Revoking gateway access revokes vendor access with it, immediately." | **Was false when written; now true with one stated exception, and the 38 documents carrying it have been rewritten.** `conduit#1303` made deprovisioning revoke refresh tokens and clear per-vendor grants on every teardown path, fixed SCIM's teardown (which had been matching zero rows and reporting success), and made `users.active` readable at four layers including the console session. The one residual: a user *only* removed from an org keeps an already-issued access token for up to an hour, reaching only their own personal connections. |

Two further corrections apply to the documents' shared structure, both of
which the template has now been changed to prevent:

- **"The gateway enforces these tiers" is true in Conduit, but the tiers
  are wrong.** Conduit does enforce a tier model in production — that part
  is no longer aspirational. But the enforced tiers are `read` / `write` /
  `admin`, and the presented groups are Read / Write / Delete / Admin.
  Neither is Read / Write / Destructive.
- **"Destructive tools require explicit human approval per call" is not
  enforced by anything.** Conduit has no approval mechanism. The sentence
  describes a workflow the reader must build.

## Taxonomy debt — not fixed here

All 62 per-vendor documents use the Read / Write / **Destructive** tier
table this document has just retired, and none of them mentions the
unclassified-vendor rule. Realigning them is a large, partly-editorial
follow-up, deliberately out of scope for this correction:

- **62 files**, 269 case-insensitive occurrences of "destructive": 62 tier
  table rows, 44 "Destructive tools" policy bullets, 7 sub-headings, and 46
  copies of the "never self-approve destructive calls" house-default line.
  Separately, 47 files promise per-call human approval (45 of those inside
  the tier table), which Conduit cannot enforce at all.
- **It is not a find-and-replace.** "Destructive" in these documents is a
  *risk* judgement about blast radius in the customer's tenant — CIPP's
  document, for instance, puts `cipp_reset_mfa` there with a careful
  justification — while Conduit's tiers are a mechanical function of
  `isWrite`/`isAdmin` in `VENDOR_TOOL_CONFIG`. Converting the tables means
  joining each documented tool against that table, keeping the risk
  commentary as prose, and accepting that many tools an author called
  destructive enforce at `write`.
- **28 of the 62 are for vendors Conduit has not classified**, where the
  correct table today is a single row saying every tool requires `admin`.
  Those should probably wait for classification rather than be rewritten
  twice.

## Where this document departs from the template, and why

The vendor template assumes a connector: one vendor, one credential, a
tool table, and a boundary statement. Four departures were unavoidable.

1. **No "unofficial / not affiliated" notice.** This is first-party WYRE
   software. The disclaimer would be false here.
2. **A trust-model section the template has no slot for.** For a vendor
   connector, "what it connects as" is one paragraph because Conduit is
   doing the work. For Conduit, that paragraph *is* the document —
   credential storage, identity, and the gate sequence replace it.
3. **A section on unclassified vendors.** It is a property of the fleet,
   not of any one vendor, and it has one upstream source file. Stating it
   once here beats copying a volatile list into thirty documents.
4. **"Honest limits" replaces "Known sharp edges," and is longer than the
   strengths.** A vendor document lists operational hazards. A control
   plane has to publish the boundaries of its own controls, or the 62
   documents that point at it are unsupported assertions. The
   **Corrections** section exists for the same reason — the discrepancies
   found while writing this belong in the open, not in a commit message.
