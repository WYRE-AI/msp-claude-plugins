# 3CX plugin — governance and safety model

Unofficial. Community-built plugin for 3CX's native PBX MCP server. Not
affiliated with, endorsed by, or sponsored by 3CX.

## What it connects as

3CX doesn't fit this marketplace's usual shape. Every other "reaches
through the WYRE Conduit gateway" plugin points at one vendor-config entry
and one fixed proxy URL. 3CX can't: every PBX is its own origin
(`https://yourpbx.3cx.eu/mcp`, or whatever FQDN that customer's PBX
actually uses) with its own OAuth authorization server, so there is no
single endpoint for a `VENDOR_TOOL_CONFIG` entry to describe — and none
exists. `src/credentials/vendor-config.ts` carries no `3cx` entry.

Two real connection paths exist instead, and this plugin's `api-patterns`
skill documents both:

1. **Direct, standalone** (no gateway) — `claude mcp add --transport http`
   pointed straight at that PBX's own MCP URL, with the technician
   completing 3CX's own OAuth flow in the browser. Nothing brokers this:
   the technician's Claude session holds a token scoped to that one PBX by
   that PBX's own authorization server, and 3CX's own Admin Console
   (**Admin → Integrations → MCP Clients**) is the audit and revocation
   surface for it — not Conduit.
2. **Through Conduit's BYO MCP feature** (`/connect/byo`), for an MSP who
   wants this PBX's tools alongside their other Conduit-brokered vendors.
   This is generic, vendor-agnostic code (`src/byo/*`), not anything
   3CX-specific: Conduit discovers the PBX's own authorization server at
   request time — RFC 9728 protected-resource metadata, then RFC 8414
   authorization-server metadata (`src/byo/byo-oauth.ts:8-11`) — registers
   a client dynamically (RFC 7591 DCR), and validates the callback's `iss`
   against the discovered issuer before persisting tokens (RFC 9207,
   `byo-oauth.ts:22-25`). `src/byo/byo-registration-routes.ts` is the real
   route table: `GET`/`POST /connect/byo`, `POST /connect/byo/:id/delete`,
   `POST /connect/byo/:id/tools/tier`.

Consequences worth stating plainly, for whichever path is used:

- **Direct connection:** no credential is brokered anywhere. The OAuth
  token lives only in that technician's local Claude Code state, scoped to
  that one PBX, revocable from that PBX's own Admin Console. There is no
  org-wide audit log across technicians for this path — each connection is
  its own island.
- **Conduit BYO connection:** the PBX's OAuth tokens are stored at Conduit
  like any other credential (see `wyre-gateway/GOVERNANCE.md`), so an org
  gets the usual centrally-brokered story — no per-technician secret, one
  place to see who's connected, and Conduit's usual
  revocation-on-org-removal behavior applies. But Conduit is standing in
  front of a vendor it has never specifically classified, which is the
  point of the next section.

## Tool permission tiers

**3CX has no `VENDOR_TOOL_CONFIG` entry, and structurally cannot get the
normal kind** — that table is keyed by a fixed vendor slug pointing at a
fixed endpoint, and 3CX has neither. That puts it in a different bucket
than the classified-vs-unclassified catalog-vendor list in
`wyre-gateway/GOVERNANCE.md`, *Fail-closed, and the vendors Conduit has not
classified* — that list is catalog vendors that merely haven't been
classified yet. 3CX isn't a catalog vendor at all.

**Direct connection:** no Conduit tier gate sits in this path at all. What
Claude can call is bounded only by the 3CX account's own role inside that
PBX (see *Permission Model* in the `api-patterns` skill) — there is no
read/write/admin layer on top of it.

**Conduit BYO connection:** every BYO tool instead goes through
`classifyByoTool` (`src/byo/byo-tool-classifier.ts:115`), a heuristic that
infers a tier from the tool's name and description because there is no
hand-curated config to read for an uncataloged vendor. It is deliberately
conservative:

| Signal | Effect | Source |
|---|---|---|
| Leading verb in a fixed read-shaped set (`get`, `list`, `search`, `find`, `query`, `read`, `fetch`, `describe`, `show`, `view`, `lookup`, `count`, `export`, `download`, `status`, `check`, and a few more) | tiers `read` | `byo-tool-classifier.ts:41-46` |
| Any other leading verb, including one the heuristic has simply never seen | tiers `write` — **unrecognized verbs are never silently treated as read** | `byo-tool-classifier.ts:132-134` |
| A secret/credential noun anywhere in the name or description (`secret`, `password`, `credential`, `token`, `apikey`, …) | escalates to `admin` regardless of verb | `byo-tool-classifier.ts:76-80, 129` |
| A mutating verb on a privileged-account noun (`role`, `member`, `billing`, `apikey`, `org`, `setting`, …) | escalates to `admin` | `byo-tool-classifier.ts:62-69, 130` |

Mapped against the tool groups this plugin's skills document:

- The read-only lookups (find/search/list/get/describe-shaped capabilities —
  contacts, calls, recordings, voicemail, queues, departments, profiles,
  server time, event log, services, app logs, DIDs, blocklists, peers,
  tables, SIP trunks, call flow apps) tier `read` **as long as 3CX's real
  tool names actually lead with one of the recognized read verbs.** This
  plugin describes them by capability, not by an exact name, precisely
  because that hasn't been verified — see the `api-patterns` skill.
- The write actions (drop a call, select/activate a profile, set/clear a
  profile message, apply a temporary override, log an agent or the current
  user in/out of queues, add/remove a blocklist or blacklist entry, assign
  a DID) all use non-read-shaped verbs, so they tier `write` under this
  heuristic — conservatively correct, not something this plugin had to
  argue for.
- **The `Query` tool is the one genuine ambiguity in this table.** 3CX
  enforces `SELECT`-only server-side no matter what (see the `pbx-admin`
  skill), but the BYO classifier tiers on the tool's *name*, not the PBX's
  own enforcement. If 3CX's real tool name for it is built around a
  generic "run" or "execute" action rather than a `get`/`list`/`query`-style
  read verb, Conduit will tier it `write` despite it being incapable of
  writing anything, and it would never
  escalate to `admin` either way since no privileged/secret noun applies.
  That is a usability gap (a `read`-tier grant might not reach it), not a
  safety gap — the PBX's own `SELECT`-only enforcement is the real
  backstop regardless of how Conduit tiers the name.

Conduit compares tiers; it has no approval step, no per-call confirmation,
and no interactive prompt on the BYO path any more than on the catalog
path. Per-call approval is a workflow imposed on agent configuration, not
something Conduit enforces.

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
- If connected via Conduit BYO, remember the `Query`-tool tiering gap
  above: a `read`-tier grant may not reach it even though it can never
  write anything. Use a `customTools` allowlist if a read-only analyst
  needs the `Query` tool specifically without also granting `write` on
  this PBX.

## What it cannot reach

- Only the one PBX the connection (direct or BYO) was set up against.
  There is no cross-PBX aggregation anywhere in this plugin — an MSP
  managing multiple customers' 3CX systems needs a separate connection per
  PBX.
- Only what the connecting 3CX account's own role permits inside 3CX.
  Neither this plugin nor Conduit narrows that further — a broad 3CX role
  is a broad grant here too.
- No filesystem, no shell, no other vendor's data.
- Nothing beyond what 3CX shipped in the V20 Update 10 Alpha tool set — no
  extension provisioning, no license/billing surface, and no write access
  to anything not explicitly listed in the *Write/Delete Capabilities*
  sections of the `calls-queues` and `pbx-admin` skills.

## Data handling

- Responses pass into the model's context for the session; the BYO path
  additionally passes through Conduit but is not persisted there beyond
  the credential itself.
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
- **The direct-connection path has no cross-technician audit trail.**
  Unlike a Conduit-brokered vendor, a directly-connected PBX only shows
  that one technician's connection in 3CX's own Admin Console — there is
  no org-wide "who connected which PBX" view unless every connection goes
  through Conduit's BYO path instead.
- **Don't conflate this with the community *3cx-mcp-server* project.**
  Different codebase, different auth model, different tool surface —
  including a licensing claim ("Enterprise/Enterprise Plus required") that
  belongs to that project and is not confirmed for 3CX's native MCP
  server.
