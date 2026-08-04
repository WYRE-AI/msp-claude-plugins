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
- Credential rotation happens once at the gateway, not per technician.
- Every call carries operator identity, so the gateway audit log answers
  "who pulled that message out of the CFO's inbox" — Abnormal's own log
  records only the API token.
- Revoking gateway access revokes Abnormal access with it, immediately.

## Tool permission tiers

| Tier | What it can do | Tools |
|---|---|---|
| **Read** | Cannot change mailbox or Abnormal state. Safe for autonomous agents. | `abnormal_threats_list`, `abnormal_threats_get`, `abnormal_messages_list`, `abnormal_messages_get`, `abnormal_cases_list`, `abnormal_cases_get`, `abnormal_abuse_list`, `abnormal_navigate`, `abnormal_status` |
| **Write** | Empty. Abnormal exposes no reversible bookkeeping write — the only mutating tool acts directly on customer mailboxes. | — |
| **Destructive** | Moves real mail into or out of a user's mailbox. Requires explicit per-call human approval. | `abnormal_remediation_manage` |

`abnormal_remediation_manage` is a single tool carrying three actions of
very different blast radius: `status` reads, `remediate` pulls a message
out of every mailbox that received it, and `unremediate` puts it back.
The gateway tiers by tool name, not by argument, so the whole tool sits
in the destructive tier. That is the correct conservative reading — an
agent that can call it for `status` can call it for `unremediate`.

`unremediate` deserves separate attention. It reads like an undo, but
what it actually does is deliver a message Abnormal classified as an
attack into a user's inbox. Treat it as a delivery decision, not a
correction.

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
- No identity actions. The account-takeover skill describes password
  resets, session revocation, and inbox-rule removal, but no tool here
  performs them — those run through CIPP or Microsoft Graph against the
  M365 tenant.
- No pre-delivery view. Abnormal inspects mail after Microsoft has
  delivered it; anything a gateway blocked upstream is invisible.
- No live stream. Every tool is point-in-time.

## Data handling

- Responses pass through the gateway into model context for the session
  and are not persisted by this plugin.
- `abnormal_messages_get` and `abnormal_messages_list` return the
  substance of a customer's email: subject lines, To/CC/BCC addresses,
  full header sets including `Authentication-Results`, attachment
  filenames and types, and every URL in the body.
- `abnormal_threats_get` and `abnormal_threats_list` return sender and
  recipient addresses, sender IP, the impersonated party, and whether
  the recipient read the message.
- `abnormal_cases_get`, `abnormal_cases_list`, and `abnormal_abuse_list`
  return the reporting employee's address plus the reported message's
  sender and subject.
- In practice every non-navigation tool here returns recipient PII.
  There is no PII-free read tier; scope accordingly rather than assuming
  "read-only" means "safe to log".

## Known sharp edges

- **Remediation is not recall of a single copy.** It targets every
  mailbox that received the message. A false positive removed
  organisation-wide is a customer-visible event.
- **`isRead` is a snapshot, not proof.** A message remediated after
  delivery may still have been opened, clicked, and acted on. Do not let
  an agent conclude "no exposure" from a remediated status.
- **Skills document tools the server does not expose.** The skill files
  reference `abnormal_ato_*`, `abnormal_vendors_*`,
  `abnormal_threats_remediate`, `abnormal_cases_action`, and
  `abnormal_messages_headers`. The shipped MCP server exposes only the
  ten tools tiered above. Calls to the others fail with an unknown-tool
  response — tier the real names, not the documented ones.
- **Rate limits degrade mid-task.** 60 requests/minute per token; a
  broad multi-tenant sweep will hit 429 partway through and return
  partial results that look complete.
