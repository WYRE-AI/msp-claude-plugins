# 3CX plugin — governance and safety model

Unofficial. Community-built plugin for 3CX's native PBX MCP server. Not
affiliated with, endorsed by, or sponsored by 3CX.

## What it connects as

**3CX is a catalog vendor in WYRE's Conduit gateway** — slug `3cx`,
category `communications`, shown as *Communications & Telephony*.

It does not fit the catalog's *commonest* shape, and the difference is
worth understanding. Most catalog vendors point at one fixed endpoint
shared by every customer. 3CX can't: every PBX is its own origin
(`https://yourpbx.3cx.eu/mcp`, or whatever FQDN that customer's PBX
actually uses) with its own OAuth authorization server. Conduit's catalog
handles that case directly — the `3cx` entry in
`src/credentials/vendor-config.ts` supplies a `resolveContainerUrl` that
proxies to the tenant's own MCP URL verbatim, plus an
`oauthConfig.perTenantOAuth` that treats each PBX as its own authorization
server. `hudu-official` is the only other vendor with that same
combination.

Two connection paths exist, and this plugin's `api-patterns` skill
documents both:

1. **Through Conduit's vendor catalog** (recommended) — `/connect/3cx`, or
   **3CX** under *Communications & Telephony* in the org catalog at
   `/org/catalog`. There is one field, **MCP Server URL**: the URL exactly
   as the PBX console shows it (Admin → Integrations → MCP Clients).
   Conduit discovers that PBX's OAuth endpoints from the PBX's own
   metadata at connect time — RFC 9728 protected-resource metadata, then
   RFC 8414 authorization-server metadata — registers a client dynamically
   (RFC 7591 DCR) as a public client using PKCE, and persists what it
   discovered so later refreshes resolve the same endpoints. The operator
   signs in **as a 3CX user**, and the connection can do only what that
   user's 3CX role allows. Requires 3CX V20 Update 10 or later with the
   MCP Server enabled, and the PBX reachable from the internet on port 443.
2. **Direct, standalone** (no gateway) — `claude mcp add --transport http`
   pointed straight at that PBX's own MCP URL, with the technician
   completing 3CX's own OAuth flow in the browser. Nothing brokers this:
   the technician's Claude session holds a token scoped to that one PBX by
   that PBX's own authorization server, and 3CX's own Admin Console
   (**Admin → Integrations → MCP Clients**) is the audit and revocation
   surface for it — not Conduit.

Conduit's **BYO MCP** feature (`/connect/byo`) is a third, generic path,
but it exists for MCP servers with *no* catalog entry. 3CX has one, so BYO
is no longer the right route for a PBX — and specifically should not be
used to sidestep the classification gap described in the next section.

Consequences worth stating plainly, for whichever path is used:

- **Catalog connection:** the PBX's OAuth tokens are stored at Conduit like
  any other credential (see `wyre-gateway/GOVERNANCE.md`), so an org gets
  the usual centrally-brokered story — no per-technician secret, one place
  to see who's connected, Conduit's access grants and per-tool allowlists,
  `conduit__my_access`, the org audit views, and Conduit's usual
  revocation-on-org-removal behavior.
- **Direct connection:** no credential is brokered anywhere. The OAuth
  token lives only in that technician's local Claude Code state, scoped to
  that one PBX, revocable from that PBX's own Admin Console. There is no
  org-wide audit log across technicians for this path, and none of
  Conduit's grants, allowlists, or `conduit__my_access` apply — each
  connection is its own island.

## Tool permission tiers

**3CX has no `VENDOR_TOOL_CONFIG` entry yet, so every one of its tools is
currently unclassified.** This is a tracked backlog item, not a structural
limit: 3CX documents roughly 42 tools by display name only and has not
published the wire names, so there is nothing to key a classification table
on until a real connection confirms them.

Conduit derives every tool's tier from `VENDOR_TOOL_CONFIG` and is
fail-closed — an unclassified tool falls back to requiring `admin`:
`const requiredTier: PermissionTier = classified ?? 'admin';`
(`src/access/access-enforcement.ts:63`). On a catalog connection, the
concrete effect today is:

| Caller | What they see and can call today |
|---|---|
| Org **owner** | Every 3CX tool. Owner access bypasses the grant and tier gates, so classification does not affect owners at all. |
| Any **non-owner** member | **Nothing.** A `read` or even `write` grant does not reach an unclassified tool, because the tool requires `admin`. |

Two things follow, and both are easy to get backwards:

1. **This is temporary and tracked.** When 3CX is classified, its read
   tools move *down* from `admin` to `read`. Classifying a vendor is a
   privilege reduction, not an addition — if it feels like a
   security-relaxing change, you have it backwards.
2. **Do not route around it via BYO.** Connecting the PBX at
   `/connect/byo` would swap a hand-curated classification (pending) for a
   name-guessing heuristic (immediate), and would give up the catalog's
   grants, allowlists, `conduit__my_access`, and audit views in the
   process. That is a worse posture, not a better one. If a non-owner
   genuinely needs access before classification lands, grant it
   deliberately — `admin` on this vendor, or an explicit per-tool
   `customTools` allowlist.

`wyre-gateway/GOVERNANCE.md`, *Fail-closed, and the vendors Conduit has not
classified*, is the single upstream statement of this behavior and carries
the current list of affected vendors. It is deliberately not restated per
vendor, because it moves whenever a vendor is classified.

**Direct connection:** no Conduit tier gate sits in this path at all. What
Claude can call is bounded only by the 3CX account's own role inside that
PBX (see *Permission Model* in the `api-patterns` skill) — there is no
read/write/admin layer on top of it.

### What classification should produce

For reference, the capability groups this plugin's skills document sort
into Conduit's four presentation buckets as below. **None of this is
enforced today** — every row collapses to `admin` for non-owners until 3CX
is classified — but it is the shape to expect, and to configure against the
moment classification lands.

| Group | Capabilities | Enforcement tier |
|---|---|---|
| **Read** | contacts, calls, recordings, voicemail, queues, departments, profiles, server time, event log, services, app logs, DIDs, blocklists, peers, tables, SIP trunks, call flow apps, and the `Query` tool | `read` |
| **Write** | drop a call, select/activate a profile, set/clear a profile message, apply a temporary profile override, log an agent or the current user in/out of queues, assign a DID, add an IP blocklist entry, add a phone blacklist entry | `write` |
| **Delete** | remove an IP blocklist entry, remove a phone blacklist entry | `write` — **not** a tier of its own |
| **Admin** | none — 3CX exposes no credential-read or raw-passthrough tool. The `Query` tool is the only query surface, and the PBX caps it at `SELECT` | `admin` |

The Delete row is the one to read twice: Conduit's enforcement tiers are
only `read`, `write`, and `admin` (plus `none`), so a delete-group tool
enforces at `write`. Granting a technician `write` on this vendor will also
grant the blocklist/blacklist removals. The only way to admit some write
tools but not those is a granular per-tool grant, which compiles to an
explicit `customTools` allowlist.

The `Query` tool belongs in the read group on its merits: 3CX enforces
`SELECT`-only server-side regardless of the connecting account's role (see
the `pbx-admin` skill), so it cannot write anything no matter how it is
eventually tiered.

Conduit compares tiers; it has no approval step, no per-call confirmation,
and no interactive prompt on any path. Per-call approval is a workflow
imposed on agent configuration, not something Conduit enforces.

## Recommended agent policy

The safe default is **read autonomously, propose writes, never
self-approve a call-affecting action.**

- Read tools (directory, calls/queue visibility, diagnostics, inventory,
  the `Query` tool): safe to allow autonomously once connected.
- `calls-queues` write tools (drop a call, switch a profile, log a queue
  agent in/out): agent drafts the exact call — target extension, queue, or
  call ID named explicitly — a human confirms, then it runs. Never grant to
  a scheduled or unattended agent; the effect on a live caller or a queue's
  staffing is immediate and has no undo.
- `pbx-admin` write/delete tools (blocklist/blacklist entries, DID
  assignment): the same discipline as any production network-ACL or
  call-routing change — a named human approver, the exact value confirmed,
  never unattended.
- **On a catalog connection today, none of these tier distinctions are
  live for non-owners** — every 3CX tool requires `admin` until the vendor
  is classified (see *Tool permission tiers*). Treat the policy above as
  what to configure the moment classification lands. In the meantime, keep
  3CX work under an owner account or an explicit `customTools` allowlist
  rather than widening grants to `admin` across the board, and don't move
  the PBX to BYO to get finer tiers sooner.

## What it cannot reach

- Only the one PBX the connection (catalog or direct) was set up against.
  There is no cross-PBX aggregation anywhere in this plugin — an MSP
  managing multiple customers' 3CX systems needs a separate connection per
  PBX.
- Only what the connecting 3CX account's own role permits inside 3CX.
  Neither this plugin nor Conduit narrows that further — a broad 3CX role
  is a broad grant here too. Conduit's tier gate can only ever subtract
  from what that 3CX role already permits, never add to it.
- No filesystem, no shell, no other vendor's data.
- Nothing beyond what 3CX shipped in the V20 Update 10 Alpha tool set — no
  extension provisioning, no license/billing surface, and no write access
  to anything not explicitly listed in the *Write/Delete Capabilities*
  sections of the `calls-queues` and `pbx-admin` skills.

## Data handling

- Responses pass into the model's context for the session; a catalog
  connection additionally passes through Conduit, but nothing is persisted
  there beyond the credential itself.
- Directory and contact lookups return PII — names, emails, and (via
  CRM-integrated search) whatever the connected CRM syncs to that PBX.
- Recordings and voicemail lists are scoped to "available to the
  authenticated user" per 3CX's own documentation — that is the account
  that approved the connection, so what a technician sees through this
  plugin can differ from what they would see logged into 3CX under their
  own account.
- Event log and application log search can surface configuration detail
  and internal IP addressing — treat it as internal infrastructure data,
  not something to paste into a customer-facing document unreviewed.

## Known sharp edges

- **This is Alpha software.** 3CX's own release notes describe Update 10
  Alpha as "intended for testing and evaluation only." Tool names, the
  permissions reference, and enforcement behavior can all change before
  GA — re-verify against `tools/list` on the actual PBX rather than
  trusting this document indefinitely.
- **3CX has not published exact tool-name strings.** Every skill in this
  plugin describes tools by capability rather than an invented snake_case
  identifier, and the tier table above is conditioned on that rather than
  asserted as verified fact.
- **Every 3CX tool requires `admin` for non-owners right now.** The vendor
  is not yet classified in `VENDOR_TOOL_CONFIG`, and Conduit fails closed
  to `admin` for unclassified tools, so a non-owner with a `read` grant
  sees nothing. Owners are unaffected. This is tracked and temporary — and
  BYO is not the workaround. See *Tool permission tiers*.
- **The direct-connection path has no cross-technician audit trail.**
  Unlike a Conduit-brokered vendor, a directly-connected PBX only shows
  that one technician's connection in 3CX's own Admin Console — there is
  no org-wide "who connected which PBX" view unless every connection goes
  through Conduit's catalog instead.
- **Don't conflate this with the community *3cx-mcp-server* project.**
  Different codebase, different auth model, different tool surface —
  including a licensing claim ("Enterprise/Enterprise Plus required") that
  belongs to that project and is not confirmed for 3CX's native MCP
  server.
