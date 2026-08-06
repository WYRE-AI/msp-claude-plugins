# Abnormal Security plugin — governance and safety model

Unofficial. Community-built plugin for the Abnormal Security API. Not
affiliated with, endorsed by, or sponsored by the vendor.

## What it connects as

This plugin does not hold credentials. It reaches Abnormal Security
through the WYRE Conduit gateway (`https://conduit.wyre.ai/v1/mcp`),
which brokers authentication centrally and scopes every call to the
tenant the operator is authorised for.

- No Abnormal API token is stored on the technician's machine, in this
  repo, or in the model's context.
- The org's Abnormal Security credential is stored once at the
  gateway, so replacing it is one edit rather than a change on every
  technician's machine. There is no rotate action, though — you
  re-submit the connect form, which overwrites the stored credential
  in place, and nothing tracks its age or prompts you.

- Every call carries operator identity, so the gateway audit log answers
  "who pulled that message out of the CFO's inbox" — Abnormal's own log
  records only the API token.
- Removing someone from the organisation clears their per-vendor grants
  and revokes their gateway refresh tokens at once; a user deactivated
  in your identity provider is refused on their very next request. A
  user only removed from the org keeps an already-issued access token
  for up to an hour, but it reaches only a personal Abnormal connection
  made with their own key — never the org's. See
  `wyre-gateway/GOVERNANCE.md`.

## Tool permission tiers

> **Not classified in Conduit — every tool in the table below requires
> tier `admin` today.** Conduit derives each tool's tier from
> `VENDOR_TOOL_CONFIG` (`src/proxy/result-cache.ts`) and fails closed for
> anything absent from it:
> `const requiredTier: PermissionTier = classified ?? 'admin';`
> (`src/access/access-enforcement.ts:63`). `abnormal-security` has no
> entry, so the grouping below carries no enforcement weight right now —
> read tools require `admin` exactly as the rest do, and there is no
> narrower grant that admits them. The grouping is still the right *risk*
> reading, and it becomes the enforcement reading on the day this vendor
> is classified. The list of unclassified vendors moves whenever one of
> them is classified, so it is stated in one place only:
> `wyre-gateway/GOVERNANCE.md`, *Fail-closed, and the vendors Conduit has
> not classified*.
>
> *This blockquote is the whole of the not-classified caveat. When
> `abnormal-security` appears in `VENDOR_TOOL_CONFIG`, delete this
> blockquote and change nothing else.*

| Tier | What it can do | Tools |
|---|---|---|
| **Read** | Cannot change mailbox or Abnormal state. Safe for autonomous agents. | `abnormal_threats_list`, `abnormal_threats_get`, `abnormal_messages_list`, `abnormal_messages_get`, `abnormal_cases_list`, `abnormal_cases_get`, `abnormal_abuse_list`, `abnormal_navigate`, `abnormal_status` |
| **Write** | Empty. Abnormal exposes no reversible bookkeeping write — the only mutating tool acts directly on customer mailboxes. | — |
| **Destructive** | Moves real mail into or out of a user's mailbox. | `abnormal_remediation_manage` |

### The tier depends on an argument, not on the tool name

`abnormal_remediation_manage` is a single tool carrying three actions of
very different blast radius. `status` is a GET. `remediate` and
`unremediate` are POSTs that move real mail into or out of mailboxes.

The gateway tiers by tool name, not by argument, so the whole tool sits
in the destructive tier. That is the correct conservative reading, and it
is worth being explicit about why: the tiering mechanism cannot see the
distinction that matters here. Every grant that admits the safe read also
admits the destructive write. There is no configuration on the gateway
side that separates them — if you need a status-only capability, it has
to be enforced in the agent's own instructions, and that is a much weaker
guarantee than a tier.

`unremediate` deserves separate attention. It reads like an undo, but
what it actually does is deliver a message Abnormal classified as an
attack into a user's inbox. Treat it as a delivery decision, not a
correction.

### Remediation is per-message, so the hazard is a loop

`abnormal_remediation_manage` requires **both** `threatId` and
`messageId`. There is no campaign-level call. Acting on a threat means:
`abnormal_messages_list` to enumerate its messages, then one
`abnormal_remediation_manage` call per message.

This changes the shape of the governance problem. It is not one
blast-radius decision to approve; it is an N-call loop, and a loop can
stop halfway:

- A 429 (60 requests/minute) or any mid-loop error leaves the campaign
  **half-remediated** — some recipients cleared, others still holding the
  mail. There is no completion signal at campaign level, only per-message
  results.
- A human approver asked to authorise "remediate this threat" is
  approving an indeterminate number of writes, not one. Approval
  workflows that assume one call per approval mis-model this.
- The enumeration is point-in-time. A live campaign can land in more
  mailboxes mid-loop, so the message list must be re-read afterwards
  rather than trusted.

An agent must record which `messageId`s succeeded rather than reporting
"remediated" from a partial loop.

Conduit does not enforce any of that as an approval requirement. It
compares tiers — it has no approval step, no per-call confirmation, and
no interactive prompt. Per-call approval is a workflow you impose on your
agents, and it is only as good as the agent configuration that carries
it.

## Recommended agent policy

The safe default is **read autonomously, propose writes, never
self-approve destructive calls.**

- Read tools: allow. Cross-tenant threat triage and abuse-mailbox
  reporting are the intended autonomous use.
- Write tools: none exist here.
- Destructive tools: require a named human approver per invocation. Do
  not grant `abnormal_remediation_manage` to scheduled or unattended
  agents, including for `status` checks.

## What it cannot reach

- Only the Abnormal tenants mapped to the operator's gateway identity.
  An Abnormal API token is issued per tenant; multi-customer coverage
  means multiple tokens, each separately mapped.
- No filesystem, no shell, no other vendor's data.
- No account-takeover surface at all. The server has no ATO domain: no
  sign-in events, no impossible-travel detection, no inbox-rule
  inventory, and no identity actions. Password resets, session
  revocation, and inbox-rule removal run through CIPP or Microsoft Graph
  against the M365 tenant.
- No vendor-risk surface. There is no VendorBase domain and no vendor
  tool; supply-chain compromise is visible only as an ordinary threat
  record.
- No case writes. `abnormal_cases_list` and `abnormal_cases_get` are
  reads. Nothing changes a case's state, assigns it, or closes it —
  that happens in the Abnormal portal.
- No tenant-wide message search. Every message lookup is scoped to one
  `threatId`.
- No pre-delivery view. Abnormal inspects mail after Microsoft has
  delivered it; anything a gateway blocked upstream is invisible.
- No live stream. Every tool is point-in-time.

## Data handling

- Responses pass through the gateway into model context for the session
  and are not persisted by this plugin.
- `abnormal_messages_get` is the widest single call on this server. It
  returns the substance of a customer's email in one payload: subject
  line, To/CC/BCC addresses, the header set including
  `Authentication-Results`, attachment filenames and types, every URL in
  the body, and the AI analysis. There is no narrower variant — no
  headers-only tool — so an agent that wants one header pulls the whole
  message into context.
- `abnormal_messages_list` and `abnormal_threats_list` are narrower by
  design: IDs plus summary. Prefer them for enumeration, and reach for
  the `_get` calls only on the records you actually intend to examine.
- `abnormal_threats_get` returns sender and recipient addresses, sender
  IP, the impersonated party, and whether the recipient read the message.
- `abnormal_cases_get`, `abnormal_cases_list`, and `abnormal_abuse_list`
  return the reporting employee's address plus the reported message's
  sender and subject.
- In practice every non-navigation tool here returns recipient PII.
  There is no PII-free read tier; scope accordingly rather than assuming
  "read-only" means "safe to log".

## Known sharp edges

- **Remediation is not recall of a single copy.** One call targets one
  `messageId`, but that message's removal affects every mailbox that
  received it. A false positive removed organisation-wide is a
  customer-visible event.
- **"Remediate the threat" is not a call you can make.** See
  *Remediation is per-message*. Any policy, runbook, or approval prompt
  phrased at threat level is describing something the API does not do.
- **`isRead` is a snapshot, not proof.** A message remediated after
  delivery may still have been opened, clicked, and acted on. Do not let
  an agent conclude "no exposure" from a remediated status.
- **`caseId` and `threatId` are different types.** `abnormal_cases_get`
  takes a **numeric** `caseId`; `abnormal_threats_get` takes a **UUID
  string** `threatId`. Prose calls both "the ID" and the two vocabularies
  sit next to each other in every workflow. Passing one where the other
  belongs is a type error, not a retryable lookup miss — an agent that
  retries it will burn rate limit on a call that can never succeed.
- **Rate limits degrade mid-task.** 60 requests/minute per token; a
  broad multi-tenant sweep will hit 429 partway through and return
  partial results that look complete. This is the same limit that
  truncates a per-message remediation loop.
