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
- Credential rotation happens once at the gateway, not per technician.
- Every call carries operator identity, so the gateway audit log answers
  "who allowlisted that domain" — SpamTitan records only the API key.
- Revoking gateway access revokes SpamTitan access with it, immediately.

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

All four `manage_*` and disposition tools accept a read-only `list`
action or otherwise behave benignly under some arguments. The gateway
tiers by tool name, not by argument, so the whole tool takes the
highest tier its arguments can reach. That is the correct conservative
reading.

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
  false-positive hunting are the intended autonomous use.
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
  quarantine reason for every held message — a customer's inbound mail
  metadata in bulk, including personal mail that happens to have been
  caught.
- `spamtitan_get_message` returns the same plus the spam score
  breakdown, header set including `Reply-To` and SPF/DKIM results, and
  every link in the body.
- `spamtitan_manage_allowlist` and `spamtitan_manage_blocklist` with
  `action: list` return the customer's full sender-policy configuration,
  including any free-text notes previous technicians left on entries.
- Every read tool here returns recipient PII. There is no PII-free read
  tier.

## Known sharp edges

- **`spamtitan_get_queue` has no domain filter.** The skill documents a
  `domain` parameter; the shipped server accepts only page, per_page,
  sender, recipient, subject, and reason. In a multi-tenant appliance
  the quarantine listing is therefore not scoped by customer, and the
  release or delete that follows it is scoped only by the API key. Use
  recipient filters deliberately, and never let an agent act on "the
  first result" from an unfiltered listing.
  `spamtitan_get_stats` does accept `domain`.
- **Virus-quarantined messages refuse to release.** SpamTitan blocks it
  server-side. Treat a release failure on a virus item as the control
  working, not as an error to route around.
- **Deleted means gone.** There is no soft delete and no retention
  fallback once the message is removed from quarantine storage.
- **The retention window is a deadline.** Quarantined mail is purged
  automatically after the configured period, typically 30 days. A
  false positive nobody reviewed in time is unrecoverable, and its
  absence looks identical to a message that never arrived.
- **Skills document tools the server does not expose.** The skills
  reference `spamtitan_list_allowlist`, `spamtitan_list_blocklist`, and
  `spamtitan_get_domain_stats`. The shipped server covers those through
  the `list` action on the `manage_*` tools and the `domain` argument on
  `spamtitan_get_stats`. Tier the real names.
