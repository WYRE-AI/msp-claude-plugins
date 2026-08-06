# PandaDoc plugin — governance and safety model

Unofficial. Community-built plugin for the PandaDoc API. Not affiliated with,
endorsed by, or sponsored by the vendor.

## What it connects as

This plugin does not hold credentials. It reaches PandaDoc through the WYRE
Conduit gateway (`https://conduit.wyre.ai/v1/mcp`), which brokers
authentication centrally and scopes every call to the workspace the operator is
authorised for.

- No PandaDoc API key is stored on the technician's machine, in this repo, or
  in the model's context.
- The org's PandaDoc connection is stored once at the gateway, so replacing
  it is one edit rather than a change on every technician's machine. PandaDoc
  is OAuth: Conduit refreshes the token itself as it nears expiry, and asks
  you to reconnect only when that refresh fails.

- Every call carries operator identity, so the gateway audit log answers "who
  sent this contract". PandaDoc's own audit trail records the API key's owner,
  which is the same name for every technician.
- Removing someone from the organisation clears their per-vendor grants and
  revokes their gateway refresh tokens at once; a user deactivated in your
  identity provider is refused on their very next request. A user only removed
  from the org keeps an already-issued access token for up to an hour, but it
  reaches only a personal PandaDoc connection made with their own key — never
  the org's. See `wyre-gateway/GOVERNANCE.md`.

## Tool permission tiers

> **Not classified in Conduit — every tool in the table below requires tier
> `admin` today.** Conduit derives a tool's tier from `VENDOR_TOOL_CONFIG`
> (`src/proxy/result-cache.ts`) and fails closed:
> `const requiredTier: PermissionTier = classified ?? 'admin';`
> (`src/access/access-enforcement.ts:63`). `pandadoc` has no entry there, so
> the grouping below carries no enforcement meaning at present — read tools
> included. A `read` or `write` grant on this vendor admits nothing; an
> `admin` grant admits everything, including `pandadoc-send-document`. The
> grouping becomes what Conduit actually enforces once the vendor is
> classified, and classifying it is a privilege *reduction*, not an
> expansion. For the live list of unclassified vendors see
> `wyre-gateway/GOVERNANCE.md`, *Fail-closed, and the vendors Conduit has
> not classified* — it is stated once there because it moves.
>
> *Editor's note: when `pandadoc` gains a `VENDOR_TOOL_CONFIG` entry, delete
> this blockquote and nothing else. No other part of this document depends on
> it.*

| Tier | What it can do | Tools |
|---|---|---|
| **Read** | Cannot change PandaDoc state. Safe for autonomous agents. | `pandadoc-list-documents`, `pandadoc-get-document`, `pandadoc-get-document-status`, `pandadoc-list-templates`, `pandadoc-get-template`, `pandadoc-download-document`, `pandadoc-search-docs`, `pandadoc-get-code-sample` |
| **Write** | Creates or modifies drafts. Not yet visible to the customer. | `pandadoc-create-document`, `pandadoc-add-recipient` |
| **Destructive** | Emails a real customer a document to sign. | `pandadoc-send-document` |

`pandadoc-send-document` is the entire reason this plugin needs a governance
document. It does not modify a record in a database an operator can correct —
it emails a named person at a client an executable agreement, priced with
whatever the pricing table contained, and opens it for signature. The blast
radius is a commitment your business is bound by if the recipient signs, and
there is no unsend: the email has left, and voiding the document afterwards
still leaves the customer holding a copy of a price you did not intend to
offer. Treat it exactly as you would treat a delete tool in another vendor.

`silent=true` does not downgrade it. That flag suppresses the notification
email but still transitions the document out of draft into a signable state
behind a live link. It reduces the noise, not the commitment.

`pandadoc-create-document` stays in the write tier because a draft is inert:
it exists in your workspace, nobody outside it can see it, and it can be
discarded. `pandadoc-add-recipient` likewise only stages who *would* receive
the document when it is eventually sent.

**Conduit does not enforce per-call approval.** It compares tiers — there is
no approval step, no per-call confirmation, and no interactive prompt
anywhere in its enforcement path. Nothing sits between an agent and
`pandadoc-send-document` once its tier is granted. Where this document asks
for a named human approver, that is a policy you impose on your agents, and
it is only as good as the agent configuration that carries it.

## Recommended agent policy

The safe default is **read autonomously, propose writes, never self-approve
destructive calls.**

- Read tools: allow. Proposal-pipeline reporting, stale-document sweeps, and
  template audits are the intended autonomous use.
- Write tools: agent drafts the exact call, human approves, then it runs. The
  approver must read the pricing table and the recipient list, not just the
  tool name.
- Destructive tools: `pandadoc-send-document` requires a named human approver
  per invocation, every time. Do not grant it to scheduled or unattended
  agents under any configuration — a nightly "chase stale proposals" job with
  send access is a system that emails clients contracts at 3am.

## What it cannot reach

- Only the PandaDoc workspace the operator's gateway identity maps to.
- No filesystem, no shell, no other vendor's data.
- No void, delete, or expire tool. A document sent in error cannot be
  withdrawn through this plugin; that is a manual action in the PandaDoc web
  app, and it does not recall the email.
- No template authoring. Templates can be read and used, never created or
  edited.
- No payment collection. Documents can reach `document.waiting_pay`, but this
  plugin cannot take the payment.
- No live event stream. Status is point-in-time; PandaDoc webhooks carry the
  push feed.

## Data handling

- Responses pass through the gateway into model context for the session and are
  not persisted by this plugin.
- `pandadoc-download-document` returns the **signed PDF** — an executed
  contract containing signatures, signer identity, and the full commercial
  terms. It is read-tier by verb and highly sensitive by content. Restrict it
  if agents render output anywhere it could be retained.
- `pandadoc-get-document` and `pandadoc-list-documents` return recipient PII
  (names, email addresses) and `grand_total` — the value of every deal in the
  pipeline. An unfiltered list is a complete revenue disclosure.
- `pandadoc-get-template` returns the pricing structure of your standard
  offers, including default rates.
- `pandadoc-search-docs` and `pandadoc-get-code-sample` touch PandaDoc's public
  developer documentation only and carry no customer data.

## Known sharp edges

- **Send is irreversible and this plugin cannot void.** Covered above. It is the
  single control that matters.
- **Two tools that look like document search are not.**
  `pandadoc-search-docs` searches PandaDoc's developer documentation, not your
  documents. An agent that reaches for it to find a client's contract will
  return confident, wrong results drawn from public API docs.
- **Only drafts can be sent.** Attempting to send a document in any other
  status fails. An agent retrying that error will not succeed by retrying — the
  document needs recreating.
- **Voided, expired, and declined are terminal.** None of them can be re-sent.
  The recovery is always a new document, which means a new number and a new
  audit trail entry the customer can see.
- **Token names are exact-match and silent on failure.** A token whose name
  does not match the template is not populated and does not error, so the
  document goes out with a visible placeholder where the client's company name
  should be.
- **Signing order controls who sees what, when.** Getting the order wrong on a
  multi-party MSA can expose your countersignature block, or your pricing, to a
  party who should have seen it only after another approved.
