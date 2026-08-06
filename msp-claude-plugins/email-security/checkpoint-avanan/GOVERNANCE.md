# Checkpoint Harmony Email (Avanan) plugin — governance and safety model

Unofficial. Community-built plugin for the Checkpoint Harmony Email &
Collaboration API. Not affiliated with, endorsed by, or sponsored by
the vendor.

## What it connects as

This plugin does not hold credentials. It reaches Harmony Email through
the WYRE Conduit gateway (`https://conduit.wyre.ai/v1/mcp`), which
brokers authentication centrally and scopes every call to the tenant the
operator is authorised for.

- No Checkpoint client ID, access key, or bearer token is stored on the
  technician's machine, in this repo, or in the model's context.
- The org's Harmony Email credential is stored once at the gateway, so
  replacing it is one edit rather than a change on every technician's
  machine. There is no rotate action, though — you re-submit the connect
  form, and nothing tracks the credential's age. The hourly Infinity-portal
  token is minted by the Harmony Email connector itself from that stored
  client id and secret; Conduit's own OAuth refresh does not apply here,
  because Harmony Email is a key-based vendor to it.
- Every call carries operator identity, so the gateway audit log answers
  "who released that message" — Harmony Email's own log records only the
  API application, and the `releasedBy` field on a quarantine entry will
  show the shared integration account for every release.
- Removing someone from the organisation clears their per-vendor grants
  and revokes their gateway refresh tokens at once; a user deactivated
  in your identity provider is refused on their very next request. A
  user only removed from the org keeps an already-issued access token
  for up to an hour, but it reaches only a personal Harmony Email
  connection made with their own key — never the org's. See
  `wyre-gateway/GOVERNANCE.md`.

## Tool permission groups

> **The tool names this document previously listed do not exist.** Every
> `avanan_*` name in the earlier revision of this table — 34 of them —
> is absent from both shipped servers. Conduit routes this vendor to
> `http://avanan-mcp` (`conduit/src/credentials/vendor-config.ts:3035`),
> whose tools are named `hec_*`. The separate `avanan-legacy-mcp` uses
> `avanan_*` names, but for MSP-partner, tenant and licence management —
> not quarantine, threats, incidents or policies. The table below is the
> real surface.

Conduit's access editor presents four groups; enforcement uses only
`read`, `write` and `admin`.

| Group | What it can do | Enforcement tier | Tools |
|---|---|---|---|
| **Read** | Cannot change Harmony Email state or mail flow. | `read` | `hec_query_events`, `hec_list_exceptions`, `hec_search_emails` |
| **Write** | — | `write` | *None classified.* |
| **Delete** | — | `write` | *None classified.* |
| **Admin** | Everything else, by fail-closed coercion — see below. | `admin` | `hec_get_email`, `hec_get_event`, `hec_get_task_status`, `hec_add_exception`, `hec_update_exception`, `hec_delete_exception`, `hec_quarantine_emails`, `hec_quarantine_events`, `hec_restore_emails`, `hec_restore_events` |

**Conduit classifies 3 of the server's 13 tools.** The other ten have no
`VENDOR_TOOL_CONFIG` entry, and Conduit fails closed per *tool*, not per
vendor: `const requiredTier: PermissionTier = classified ?? 'admin';`
(`conduit/src/access/access-enforcement.ts:63`). So the ten sit at
`admin` today by coercion rather than by judgement — including
`hec_get_email`, an ordinary read, which a `read` grant cannot reach.

The coercion is currently protective by accident. `hec_restore_emails`
delivers quarantined mail to a user's inbox and `hec_delete_exception`
removes a standing detection bypass; both would land in **Write** the
moment someone classifies this vendor by verb alone, and the first
`write` grant would pick them up silently. Whoever classifies Avanan
should pin the quarantine/restore family and the exception writes
deliberately rather than letting name inference decide.

**Conduit does not enforce per-call approval.** It compares tiers — there
is no approval step, no per-call confirmation, and no interactive prompt
anywhere in its enforcement path. Where this document asks for a named
human approver, that is a policy you impose on your agents, and it is
only as good as the agent configuration that carries it.

Two of the coerced-`admin` tools deserve the tier on their merits, not
just by fail-closed accident. The reasoning below was written against the
previous revision's invented tool names; it is retained because the
hazards are real, remapped onto the tools that actually exist.

**`hec_restore_emails` / `hec_restore_events` are the sharp ones.**
Restoring is not un-quarantining a record — it delivers a message the
security stack already judged malicious into a real person's inbox, and
there is no un-deliver. When the quarantine reason is malware or BEC, an
erroneous restore is the exact outcome the product exists to prevent.
These are the tools that would land in **Write** under verb-based
classification, which is why Avanan should be classified deliberately.

The MCP annotations invert the same hazard. The two quarantine tools
carry `destructiveHint: true`; the two restore tools carry no annotations
at all. A client that gates confirmation on `destructiveHint` will stop
on a quarantine and wave a restore through.

**`hec_add_exception` / `hec_update_exception` create standing detection
bypasses.** An exception is the allowlist: it exempts a sender or domain
from the engines that would otherwise catch it, permanently and
tenant-wide, and it is the first thing an attacker wants. Spoofed mail
claiming to be the exempted sender inherits the exemption.
`hec_delete_exception` is equally sharp in reverse — removing an
exception re-admits detection for a sender someone deliberately exempted,
which may be the correct fix or may break a customer's mail flow.

The default matching modes widen entries beyond what an operator
typically intends: `senderDomainMatching` defaults to `endswith` and
`subjectMatching` to `contains`, so a domain exemption for `example.com`
also covers `notexample.com`.

**`hec_quarantine_emails` / `hec_quarantine_events` can cause a mail-flow
outage.** Quarantining in bulk on a bad query buries legitimate inbound
mail with no bounce visible to the recipient. The blast radius is the
tenant's mail flow, not a settings table.

**Concerns with no corresponding tool.** The previous revision described
policy enable/disable/update. The shipped server exposes none of it —
there are no policy tools at all. If you need that surface, it is in the
Harmony Email console, not through this plugin. Allow and block lists,
by contrast, *are* reachable: they are the `whitelist` and `blacklist`
values of `excType` on the four `hec_*_exception` tools, not a separate
list API.

## Recommended agent policy

The safe default is **read autonomously, propose writes, never
self-approve destructive calls.**

- Read tools: allow. Cross-tenant quarantine triage, threat sweeps, and
  reporting are the intended autonomous use.
- Write tools: agent drafts the exact call, human approves, then it
  runs.
- Destructive tools: require a named human approver per invocation. Do
  not grant these to scheduled or unattended agents. In particular, do
  not give an unattended agent a standing "release false positives"
  policy — false-positive judgement is exactly the judgement being
  delegated.

## What it cannot reach

- Only the Harmony Email tenants mapped to the operator's gateway
  identity.
- No filesystem, no shell, no other vendor's data.
- No mailbox. Harmony Email quarantine holds mail before delivery;
  nothing in this plugin can reach into Microsoft 365 or Google
  Workspace to retrieve a message that was already delivered.
- No live event stream. Every tool is point-in-time.
- Regional scope. A tenant provisioned in the EU or AP region is served
  by a different API gateway; credentials for one region return
  authentication errors against another, so a misconfigured connection
  fails closed rather than reading the wrong tenant.

## Data handling

- Responses pass through the gateway into model context for the session
  and are not persisted by this plugin.
- **The search and read tools return message content and correspondent
  PII.** `hec_search_emails` and `hec_get_email` reach subject, sender,
  recipients, attachment names, and body content; `hec_query_events` and
  `hec_get_event` carry sender IP addresses, recipient lists, and
  attachment hashes. For a DLP-quarantined outbound message, that content
  is by definition what the DLP rule matched.
- Note the tier split here works against you: `hec_search_emails` is one
  of the three tools classified `read`, so it is reachable by the lowest
  grant, while `hec_get_email` — arguably less sensitive, since it needs
  an id you already hold — sits at `admin` by coercion.

Restrict the search and event reads if your agents run unattended, or
scope them to the tenants that specific operator supports.

## Known sharp edges

- **Release and delete are capped at 100 entities per call.** An agent
  splitting a 500-message action into batches is performing five
  separate irreversible operations; a failure partway through leaves the
  tenant in a mixed state with no transaction to roll back.
- **Actions are asynchronous.** Quarantine and restore return one
  `taskId` per entity and report acceptance, not completion. An agent
  that reports "released" without polling `hec_get_task_status` is
  reporting an intention.
- **Queries silently truncate.** The date range maxes at 90 days and any
  single query returns at most 10,000 results. "Show me every threat
  this year" returns a confident partial answer with no error. Do not
  let an agent draw all-clear conclusions from an unbounded query.
- **Quarantine expiry is a hard deletion.** Entries auto-delete after
  the retention period (default 30 days) and cannot be recovered. The
  documented way to extend retention — release and re-quarantine —
  means briefly delivering the message.
- **A wrong region looks like a bad credential.** Pointing at the US
  gateway for an EU-provisioned tenant returns 401, which invites an
  agent to "fix" working credentials. A key with no farm association
  fails differently again — every call returns zero records rather than
  an error.
- **Exception writes are security decisions, not bookkeeping.**
  `hec_add_exception` and `hec_update_exception` change no mail flow at
  the moment they run, which is exactly why they read as harmless — but
  they exempt a sender from detection from then on. Treat a pattern of
  agent-driven exception creation as a signal to review.
