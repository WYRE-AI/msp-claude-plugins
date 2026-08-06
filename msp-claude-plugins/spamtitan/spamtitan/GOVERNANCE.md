# SpamTitan plugin — governance and safety model

Unofficial. Community-built plugin for the SpamTitan (TitanHQ) API. Not
affiliated with, endorsed by, or sponsored by the vendor.

## What it connects as

This plugin does not hold credentials. It reaches SpamTitan through the
WYRE Conduit gateway (`https://conduit.wyre.ai/v1/mcp`), which brokers
authentication centrally and scopes every call to the tenant the
operator is authorised for.

- No SpamTitan API key is stored on the technician's machine, in this
  repo, or in the model's context.
- The org's SpamTitan credential is stored once at the gateway, so
  replacing it is one edit rather than a change on every technician's
  machine. There is no rotate action, though — you re-submit the
  connect form, which overwrites the stored credential in place, and
  nothing tracks its age or prompts you.

- Every call carries operator identity, so the gateway audit log answers
  "who allowlisted that domain" — SpamTitan records only the API key.
- Removing someone from the organisation clears their per-vendor grants
  and revokes their gateway refresh tokens at once; a user deactivated
  in your identity provider is refused on their very next request. A
  user only removed from the org keeps an already-issued access token
  for up to an hour, but it reaches only a personal SpamTitan connection
  made with their own key — never the org's. See
  `wyre-gateway/GOVERNANCE.md`.

## Tool permission tiers

> **Not classified in Conduit — every tool in the table below requires tier
> `admin` today.** Conduit derives a tool's tier from `VENDOR_TOOL_CONFIG`
> (`src/proxy/result-cache.ts`) and fails closed:
> `const requiredTier: PermissionTier = classified ?? 'admin';`
> (`src/access/access-enforcement.ts:63`). `spamtitan` has no entry there, so
> the grouping below carries no enforcement meaning at present — read tools
> included. A `read` grant on this vendor admits nothing; an `admin` grant
> admits everything, including `spamtitan_delete_message`. The grouping
> becomes what Conduit actually enforces once the vendor is classified, and
> classifying it is a privilege *reduction*, not an expansion. For the live
> list of unclassified vendors see `wyre-gateway/GOVERNANCE.md`,
> *Fail-closed, and the vendors Conduit has not classified* — it is stated
> once there because it moves.
>
> *Editor's note: when `spamtitan` gains a `VENDOR_TOOL_CONFIG` entry, delete
> this blockquote and nothing else. No other part of this document depends on
> it.*

| Tier | What it can do | Tools |
|---|---|---|
| **Read** | Cannot change mail flow or filter policy. Safe for autonomous agents. | `spamtitan_get_queue`, `spamtitan_get_message`, `spamtitan_get_stats`, `spamtitan_navigate`, `spamtitan_status` |
| **Write** | Empty. Every mutating tool here either delivers mail or changes what the filter will do to a customer's future mail. | — |
| **Destructive** | Delivers held mail, destroys evidence, or silently changes deliverability. | `spamtitan_release_message`, `spamtitan_delete_message`, `spamtitan_manage_allowlist`, `spamtitan_manage_blocklist` |

Why each of the four is destructive:

- **`spamtitan_release_message`** — the message is in quarantine because
  the filter classified it as spam, phishing, or malware. Releasing
  overrides that and delivers the payload to the recipient's inbox. Once
  delivered, this plugin cannot take it back. Nothing in the verb warns
  you; it reads like an undo and behaves like a delivery.
- **`spamtitan_delete_message`** — irreversible, and it removes the only
  copy of the evidence. If the message turns out to be part of a
  campaign under investigation, the headers, links, and score breakdown
  are gone. The MCP server marks this `destructiveHint: true`.
- **`spamtitan_manage_blocklist`** — one call can silently stop a
  customer's legitimate mail. There is no bounce visible to the
  recipient and no alert; the sender simply stops arriving, sometimes
  for weeks before anyone notices. A domain-scoped entry against a
  shared sending service takes out every customer using it. The MCP
  server marks this `destructiveHint: true`.
- **`spamtitan_manage_allowlist`** — the tier call most likely to be
  argued down, and we would keep it here. Allowlisting bypasses spam
  scoring entirely for that sender, and spoofed mail claiming to be the
  allowlisted sender inherits the exemption. It is a durable hole in the
  customer's filtering that produces no visible symptom until it is
  used. The server does not annotate it as destructive; blast radius
  says it is.

Both `manage_*` tools accept a read-only `action: "list"` alongside `add`
and `remove` — reading a sender list and rewriting it are the same tool.
The gateway tiers by tool name, not by argument, so the whole tool takes
the highest tier its arguments can reach. That is the correct conservative
reading, and its practical consequence is that **there is no read-only view
of either sender list**: anyone granted enough to list the blocklist is
granted enough to add to it.

**Conduit does not enforce per-call approval.** It compares tiers — there
is no approval step, no per-call confirmation, and no interactive prompt
anywhere in its enforcement path. Nothing sits between an agent and a
quarantine delete once the tier is granted. Where this document asks for a
named human approver, that is a policy you impose on your agents, and it
is only as good as the agent configuration that carries it.

## Recommended agent policy

The safe default is **read autonomously, propose writes, never
self-approve destructive calls.**

- Read tools: allow. Daily quarantine review, per-domain statistics, and
  false-positive hunting are the intended autonomous use. Note that only the
  statistics are actually per-domain — `spamtitan_get_queue` is not, so any
  agent presenting quarantine results as belonging to one customer must be
  filtering them itself. See the sharp edge below.
- Write tools: none exist here.
- Destructive tools: require a named human approver per invocation. Do
  not grant any of the four to scheduled or unattended agents. An agent
  running "clear the quarantine backlog" on a schedule is an agent
  deleting mail nobody reviewed.
- Note that `spamtitan_manage_allowlist`, `spamtitan_manage_blocklist`,
  and `spamtitan_get_queue` will elicit a missing argument from the
  caller. An unattended agent cannot answer an elicitation, so these
  calls stall rather than proceeding — useful, but not a safety control
  you should rely on.

## What it cannot reach

- Only the SpamTitan appliance and domains the operator's gateway
  identity is scoped to. In multi-tenant deployments the API key is the
  only tenant boundary — see the sharp edge below.
- No filesystem, no shell, no other vendor's data.
- No mailbox-side actions. SpamTitan filters in front of the tenant; it
  cannot reach a message that has already been delivered.
- No filter-rule or policy configuration. Scoring thresholds, content
  rules, and appliance settings stay in the SpamTitan admin interface —
  only the sender lists are reachable from here.

## Data handling

- Responses pass through the gateway into model context for the session
  and are not persisted by this plugin.
- `spamtitan_get_queue` returns sender, recipient, subject, and
  quarantine reason for every held message — inbound mail metadata in bulk,
  including personal mail that happens to have been caught. On a multi-tenant
  appliance this is **every tenant's** mail metadata, not one customer's,
  because the call takes no domain filter. Pulling it puts other customers'
  data into model context.
- `spamtitan_get_message` returns the same plus the spam score
  breakdown, header set including `Reply-To` and SPF/DKIM results, and
  every link in the body.
- `spamtitan_manage_allowlist` and `spamtitan_manage_blocklist` with
  `action: list` return the customer's full sender-policy configuration,
  including any free-text notes previous technicians left on entries.
- Every read tool here returns recipient PII. There is no PII-free read
  tier.

## Known sharp edges

- **`spamtitan_get_queue` has no domain filter — the quarantine listing is
  not tenant-scoped.** This is a tenant-isolation property of the connector,
  not a usage tip, and it is the sharpest thing in this document.

  The tool's shipped input schema is exactly `page`, `per_page`, `sender`,
  `recipient`, `subject`, `reason`
  (`spamtitan-mcp/src/domains/quarantine.ts:21-53`). Earlier revisions of this
  plugin's skills documented a `domain` parameter. There is none.

  On a multi-tenant appliance that means an operator who asks for "customer
  X's quarantine" receives **the appliance-wide queue, across every tenant**.
  Any per-customer filtering has to be done client-side on the `recipient`
  field after the fetch, by whatever is reading the result — the server
  applies no boundary beyond the API key. The release or delete that follows
  is scoped only by `message_id`, so a cross-tenant listing leads directly to
  a cross-tenant action on mail belonging to a customer nobody was looking at.

  The asymmetry is what makes this easy to miss: the sibling
  `spamtitan_get_stats` **does** accept `domain`
  (`spamtitan-mcp/src/domains/stats.ts:28-31`), so a reader who has just
  scoped statistics to one customer reasonably assumes the queue beside it
  behaves the same way. It does not.

  There is no workaround the server can perform. Use `recipient` filters
  deliberately, treat every listing as cross-tenant until narrowed, never let
  an agent act on "the first result" from an unfiltered listing, and never
  label an unfiltered listing as one customer's quarantine.
- **Virus-quarantined messages refuse to release.** SpamTitan blocks it
  server-side. Treat a release failure on a virus item as the control
  working, not as an error to route around.
- **Deleted means gone.** There is no soft delete and no retention
  fallback once the message is removed from quarantine storage.
- **The retention window is a deadline.** Quarantined mail is purged
  automatically after the configured period, typically 30 days. A
  false positive nobody reviewed in time is unrecoverable, and its
  absence looks identical to a message that never arrived.
- **Listing is an argument, not a tool — and that changes what a grant
  buys.** Earlier revisions of the skills named three tools that do not
  exist — a list-allowlist tool, a list-blocklist tool, and a
  get-domain-stats tool. There is no separate tool for any of the three.
  Reading a sender list is `action: "list"` on
  `spamtitan_manage_allowlist` / `spamtitan_manage_blocklist`
  (`spamtitan-mcp/src/domains/lists.ts:15-79`), and per-domain statistics
  are the `domain` argument on `spamtitan_get_stats`. The tool names in this
  document are the real ones and are what to tier.

  The consequence for tiering is above, under *Why each of the four is
  destructive*: because reading a list means calling the tool that can also
  write it, and the gateway tiers by tool name rather than by argument, there
  is no way to grant read-only access to a sender list. Anyone who can list
  the blocklist can add to it.

- **Neither `manage_*` tool takes a `domain` or `scope` parameter.** Their
  complete input schema is `action`, `sender`, `note`. An entry added through
  this connector lands at whatever scope the appliance and API key give it,
  so a blocklist addition intended for one client may apply to every client
  the gateway filters for. Per-client list scoping has to be done in the
  SpamTitan admin interface.

- **No bulk operations.** `spamtitan_release_message` and
  `spamtitan_delete_message` each act on a single `message_id`. There is no
  tool that clears a queue. That is a safety property worth keeping: an agent
  working a backlog has to decide once per message.
