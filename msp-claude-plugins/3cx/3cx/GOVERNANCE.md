# 3CX plugin — governance and safety model

Unofficial. Community-built plugin for 3CX's native PBX MCP server. Not
affiliated with, endorsed by, or sponsored by 3CX.

## What it connects as

3CX is not a catalog vendor on the gateway, so there is no fixed proxy URL for it.

Two real connection paths exist instead, and this plugin's `api-patterns`
skill documents both:

1. **Direct, standalone** (no gateway) — `claude mcp add --transport http`
   pointed straight at that PBX's own MCP URL, with the technician
   completing 3CX's own OAuth flow in the browser. Nothing brokers this:
   the technician's Claude session holds a token scoped to that one PBX by
   that PBX's own authorization server, and 3CX's own Admin Console
   (**Admin → Integrations → MCP Clients**) is the audit and revocation
   surface for it — not Conduit.
2. **Through Conduit's BYO MCP feature** (`/connect/byo`), for an MSP who wants this PBX's tools alongside their other Conduit-brokered vendors.

Consequences worth stating plainly, for whichever path is used:

- **Direct connection:** no credential is brokered anywhere. The OAuth
  token lives only in that technician's local Claude Code state, scoped to
  that one PBX, revocable from that PBX's own Admin Console. There is no
  org-wide audit log across technicians for this path — each connection is
  its own island.
Confirm the live permission grant in the gateway access editor before you rely on a tier in this document. This note does not describe gateway enforcement internals.

## Tool permission tiers

**Direct connection:** no gateway tier gate sits in this path. What Claude
can call is bounded only by the 3CX account's own role inside that PBX
(see *Permission Model* in the `api-patterns` skill).

Treat the lists below as descriptions of capability, not as verified tool
names. Confirm the live grant after connecting.

- Read-only lookups: contacts, calls, recordings, voicemail, queues,
  departments, profiles, server time, event log, services, app logs, DIDs,
  blocklists, peers, tables, SIP trunks, call flow apps.
- Write actions: drop a call, select or activate a profile, set or clear a
  profile message, apply a temporary override, log an agent or the current
  user in or out of queues, add or remove a blocklist entry, assign a DID.
- **`Query` is SELECT-only on the PBX** (see the `pbx-admin` skill). Do not
  describe a workaround that reaches past that restriction.

Per-call approval is a workflow you impose on your agents, and it is only
as good as the agent configuration that carries it.

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
- If connected via Conduit BYO, remember the `Query`-tool tiering gap above: a `read`-tier grant may not reach it even though it can never write anything.

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
