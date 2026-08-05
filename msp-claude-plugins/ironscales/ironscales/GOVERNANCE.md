# IRONSCALES plugin — governance and safety model

Unofficial. Community-built plugin for the IRONSCALES API. Not
affiliated with, endorsed by, or sponsored by the vendor.

## What it connects as

This plugin does not hold credentials. It reaches IRONSCALES through the
WYRE Conduit gateway (`https://conduit.wyre.ai/v1/mcp`), which brokers
authentication centrally and scopes every call to the tenant the
operator is authorised for.

- No IRONSCALES API key or company ID is stored on the technician's
  machine, in this repo, or in the model's context.
- Credential rotation happens once at the gateway, not per technician.
- Every call carries operator identity, so the gateway audit log answers
  "who classified that as legitimate" — IRONSCALES records only the API
  account.
- Revoking gateway access revokes IRONSCALES access with it,
  immediately.

## Tool permission tiers

> **Not classified in Conduit — every tool in the table below requires
> tier `admin` today.** Conduit derives each tool's tier from
> `VENDOR_TOOL_CONFIG` (`src/proxy/result-cache.ts`) and fails closed for
> anything absent from it:
> `const requiredTier: PermissionTier = classified ?? 'admin';`
> (`src/access/access-enforcement.ts:63`). `ironscales` has no entry, so
> the grouping below carries no enforcement weight right now — read tools
> require `admin` exactly as the rest do, and there is no narrower grant
> that admits them. The grouping is still the right *risk* reading, and it
> becomes the enforcement reading on the day this vendor is classified.
> The list of unclassified vendors moves whenever one of them is
> classified, so it is stated in one place only:
> `wyre-gateway/GOVERNANCE.md`, *Fail-closed, and the vendors Conduit has
> not classified*.
>
> *This blockquote is the whole of the not-classified caveat. When
> `ironscales` appears in `VENDOR_TOOL_CONFIG`, delete this blockquote and
> change nothing else.*

| Tier | What it can do | Tools |
|---|---|---|
| **Read** | Cannot change mailbox, incident, or policy state. Safe for autonomous agents. | `ironscales_incidents_list`, `ironscales_incidents_get`, `ironscales_stats_company`, `ironscales_email_classify`, `ironscales_navigate`, `ironscales_status`, `ironscales_back` |
| **Write** | Empty. Nothing here changes a record without also changing mail delivery or detection coverage. | — |
| **Destructive** | Deletes mail, alters what the filter will catch in future, or notifies end users. | `ironscales_remediation_act`, `ironscales_allowlist_manage` |

`ironscales_remediation_act` is destructive under every value of its
`action` argument, not only `delete`:

- `delete` removes the message from all mailboxes permanently — the
  evidence goes with it.
- `quarantine` moves mail out of inboxes across the tenant.
- `block_sender` changes deliverability for every future message from
  that address.
- `mark_false_positive` restores a message that was classified as
  phishing back to the users who received it.
- `report_to_microsoft` transmits a customer's email to a third party
  and cannot be recalled.

It also accepts `notify_users`, which fans out mail to affected end
users. That notification cannot be unsent.

`ironscales_allowlist_manage` sits in the destructive tier as a
judgement call. Adding an entry permanently exempts a sender, domain, or
IP from phishing detection for the whole company — a silent, durable
reduction in the customer's protection that produces no alert and no
visible change until an attacker spoofs the exempted sender. The verb is
benign; the blast radius is not. Reasonable operators may argue this
belongs in Write; we would rather it require an approver.

Conduit does not enforce any of that as an approval requirement. It
compares tiers — it has no approval step, no per-call confirmation, and
no interactive prompt. Per-call approval is a workflow you impose on your
agents, and it is only as good as the agent configuration that carries
it.

## Recommended agent policy

The safe default is **read autonomously, propose writes, never
self-approve destructive calls.**

- Read tools: allow. Triage sweeps, backlog review, and weekly
  statistics reporting are the intended autonomous use.
- Write tools: none exist here.
- Destructive tools: require a named human approver per invocation. Do
  not grant either destructive tool to scheduled or unattended agents.
  In particular, an agent that auto-classifies high-confidence incidents
  and then auto-remediates them is one model error away from deleting a
  customer's legitimate mail.

## What it cannot reach

- Only the IRONSCALES company ID mapped to the operator's gateway
  identity. IRONSCALES scopes credentials per company, so an MSP with
  many customers has many mappings — there is no cross-tenant query.
- No filesystem, no shell, no other vendor's data.
- No pre-delivery queue. IRONSCALES acts on mail already sitting in
  mailboxes; anything a gateway held upstream is out of scope.
- No identity actions. Remediation removes mail and blocks senders; it
  cannot reset a credential a phish harvested.
- Remediation reach depends on the customer's M365/Exchange integration,
  not on this plugin's permissions. Partial success is normal and
  reported as such.

## Data handling

- Responses pass through the gateway into model context for the session
  and are not persisted by this plugin.
- `ironscales_incidents_get` and `ironscales_incidents_list` return
  subject lines, sender and reply-to addresses, sender IP, per-URL
  verdicts, and recipient counts for a customer's real mail.
- `ironscales_stats_company` returns `topTargetedUsers` — a named list
  of the customer's most-attacked employees. Treat it as sensitive
  security information, not a metric.
- `ironscales_email_classify` is the inverse flow: the operator supplies
  raw headers, plain-text and HTML bodies, and URLs, which are sent to
  IRONSCALES for analysis. It changes no state, so it is tiered Read,
  but it exports customer email content outbound. Do not paste content
  from a tenant the operator is not authorised for.

## Known sharp edges

- **Classification fires remediation automatically.** Classifying an
  incident as phishing can trigger the configured remediation without a
  second call. An agent that "just labels" the backlog may find it has
  deleted mail. Check `remediationTriggered` before assuming a
  classification was inert.
- **Closed incidents cannot be reclassified.** The resulting error reads
  like a permissions failure. Verify status first.
- **Allowlist scope is narrower than it looks.** An entry for a single
  address does not cover other addresses on the same domain; an agent
  told to "allowlist this vendor" will under-deliver unless it uses a
  domain entry — which is a much larger trust grant.
- **Federated learning is one-way but not private-by-default.**
  Classification decisions feed IRONSCALES' cross-tenant model. That is
  the product working as designed, and worth stating to customers with
  data-residency requirements.
