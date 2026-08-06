# ConnectWise CPQ plugin — governance and safety model

Unofficial. Community-built plugin for the ConnectWise CPQ (Sell/Quosal)
API. Not affiliated with, endorsed by, or sponsored by the vendor.

## What it connects as

This plugin does not hold credentials. It reaches ConnectWise CPQ through
the WYRE Conduit gateway (`https://conduit.wyre.ai/v1/mcp`), which brokers
authentication centrally and scopes every call to the tenant the operator
is authorised for.

- No access key, public key or private key is stored on the technician's
  machine, in this repo, or in the model's context. The three arrive at
  the MCP server as `X-CPQ-*` headers and the server assembles the
  upstream Basic token itself.
- The org's CPQ credential is stored once at Conduit, so replacing it is
  one edit rather than a change on every technician's machine. There is no
  rotate action, though — you re-submit the connect form. This matters more
  in CPQ than most: the private key is displayed once, at creation, and
  losing it means regenerating the pair for everyone.
- Every call carries operator identity, so Conduit's audit log answers
  "who repriced that quote". CPQ's own trail records only the single API
  user the key pair belongs to, so without Conduit every agent action
  looks like one shared robot. Conduit records *who called what*, never
  with what arguments — for a JSON Patch tool, the patch body is exactly
  what the log will not show you.
- Removing a technician's Conduit org membership stops their CPQ access on
  their next call, because membership is re-read per request. It does
  **not** revoke an already-issued token, and it does not touch
  credentials they connected personally. Full offboarding is more than one
  step — see `wyre-gateway/GOVERNANCE.md`, *Revocation*.

## Tool permission groups

Conduit's access editor presents four groups — Read, Write, Delete, Admin
— so these are the buckets an owner actually clicks. Enforcement knows
only three tiers, `read`, `write` and `admin` (plus `none`, meaning deny)
— `src/access/permission-tier.ts:27`. All 25 tools below are classified in
`VENDOR_TOOL_CONFIG` under the slug `connectwise-cpq`.

| Group | What it can do | Enforcement tier | Tools |
|---|---|---|---|
| **Read** | Cannot change CPQ state. Safe for autonomous agents. | `read` | `cpq_test_connection`, `cpq_search_quotes`, `cpq_get_quote`, `cpq_get_quote_versions`, `cpq_search_quote_items`, `cpq_get_quote_item`, `cpq_search_quote_tabs`, `cpq_list_quote_customers`, `cpq_list_quote_terms`, `cpq_list_templates`, `cpq_list_tax_codes`, `cpq_list_recurring_revenues`, `cpq_list_users` |
| **Write** | Builds and prices quote content, and sets the quote's own status fields. | `write` | `cpq_create_quote_from_template`, `cpq_update_quote`, `cpq_create_quote_item`, `cpq_update_quote_item`, `cpq_create_quote_term`, `cpq_update_quote_term`, `cpq_update_quote_customer` |
| **Delete** | Removes priced content with no undo through this toolset. | `write` — **not** a tier of its own | `cpq_delete_quote`, `cpq_delete_quote_version`, `cpq_delete_quote_item`, `cpq_delete_quote_term`, `cpq_delete_quote_customer` |
| **Admin** | **Empty.** No passthrough, dispatcher, or org-level tool in this surface — `PATCH /settings/user` is deliberately not exposed. | `admin` | *(none)* |

**The Delete row is the one to read twice.** Delete is a presentation
group in the access editor, and a delete-group tool compiles to and
enforces at tier `write` (`src/access/tier-group-mapping.ts`,
`GROUP_ENFORCEMENT_TIER`). So **granting a technician `write` for CPQ also
grants all five delete tools above** — including `cpq_delete_quote`, which
cascades. There is no setting that separates them; the only way to admit
the quote-building tools but not the deletes is a granular per-tool grant,
which compiles to an explicit `customTools` allowlist.

With the Admin group empty, `write` is the ceiling for this vendor, and it
is a wide ceiling: twelve tools, five of them destructive, one decision.

Conduit has no approval step, no per-call confirmation, and no interactive
prompt. It compares tiers. Any per-call human approval described below is
a workflow you impose on your agents, and it is only as good as the agent
configuration that carries it.

### Where blast radius and tier diverge

The tier column is a mechanical function of `isWrite`/`isAdmin` in
`VENDOR_TOOL_CONFIG`, not a risk judgement. Three notes on where the two
part company.

**`cpq_update_quote` is the plugin's most consequential tool and it sits
in the plain Write group.** It is the only route to `isSent`, `isAccepted`,
`isLost`, `quoteStatus`, `approvalStatus` and the `orderPorter*` fields —
the record of what the customer was sent, what they agreed to, and what
the published proposal shows them. Setting `isAccepted` on the wrong quote
does not just misfile a row; it is the signal the forecast, the commission
run and the port-to-PSA step all read as truth. The tool also accepts raw
JSON Patch, so `op: "remove"` can strip a field outright, and
classification is per-tool — the gate never reads arguments
(`ToolCallGateInput` has no `arguments` field), so the whole tool carries
the blast radius of its worst operation. If your agent framework can gate
on argument values, the narrower rule is: allow `cpq_update_quote` freely
for `name`, `expectedCloseDate` and the `zCustom*` slots, and require
approval for any patch touching `quoteStatus`, `isSent`, `isAccepted`,
`isLost`, `isArchive`, `expirationDate`, the approval fields, or
`orderPorter*`. Conduit cannot express that rule; only your agent
configuration can.

**`cpq_delete_quote_term` and `cpq_delete_quote_customer` deserve the care
their verb implies, and more than their tier does.** A term carries
`interestRate`, `downPayment` and `periodPaymentAmount` — the financing the
customer was offered, and `isSelected` marks the one they were offered
*specifically*. A quote customer is who the proposal is addressed to and
who holds the Order Porter link. Neither is recoverable from this toolset,
and both enforce at `write` exactly like `cpq_create_quote_item`.

**Line pricing (`cpq_update_quote_item`, `cpq_update_quote_term`) is
genuinely lower risk than its neighbours, and the tier cannot say so.**
CPQ's API has no send, publish or e-sign verb, so a price change reaches
nobody until a human publishes the quote in the web app — the
customer-facing act stays behind a person either way. These edits are
still money, so they belong in the propose-and-approve loop below, but
they are not the tools to build a granular allowlist around excluding.

## Recommended agent policy

The safe default is **read autonomously, propose writes, never
self-approve deletes.**

- **Read tools: allow.** Pipeline reporting, margin analysis across open
  quotes, and reconciling quoted vs. contracted spend are the intended
  autonomous use.
- **Write tools: agent drafts the exact call, human approves, then it
  runs.** Because these move money on the page, have the agent state the
  before and after figures in its proposal, not just the patch body.
- **Delete tools: require a named human approver per invocation.** Do not
  grant these to scheduled or unattended agents, and specifically do not
  let a housekeeping agent hold `cpq_delete_quote` or
  `cpq_delete_quote_version`. Remember that Conduit cannot enforce this
  separation for you — a `write` grant already admits them — so it has to
  live in the agent's own configuration, or in a granular `customTools`
  grant that lists the seven write tools and omits the five deletes.
- Treat `cpq_update_quote` as belonging to the delete policy rather than
  the write policy whenever a patch touches a status or `orderPorter*`
  field, since that is the operation you cannot walk back.

## What it cannot reach

- Only the CPQ tenant the operator's Conduit identity maps to. There is
  one global host (`https://sellapi.quosalsell.com`) and no regional
  variants — tenancy is carried entirely by the access key.
- Within that tenant, only what the API user's own CPQ permissions allow.
  `canAccessAllQuotes` on the user record is the real scope boundary.
  Conduit controls *who in your organisation may use that credential and
  which tools they may call*, not which quotes come back; a restricted API
  user makes the write and delete tools fail at CPQ rather than at
  Conduit. Scope the credential at the vendor if you need a narrower
  boundary.
- No filesystem, no shell, no other vendor's data.
- Not ConnectWise PSA and not ConnectWise Automate. Separate products,
  separate APIs, separate Conduit connectors, despite the shared brand.
  `crmOpportunityId` on a quote is a pointer into the PSA, not a join this
  plugin can follow.
- **No delivery.** There is no send, publish, e-sign, PDF or attachment
  verb, and no port-to-PSA. An agent holding every tool here still cannot
  email a customer or put a document in front of one — that is the CPQ web
  app and the CPQ↔PSA integration engine.
- No live event stream. CPQ has no webhooks; every tool is point-in-time
  and change detection means polling `modifyDate`.

## Data handling

- Responses pass through Conduit into model context for the session and
  are not persisted by this plugin.
- `cpq_list_quote_customers` returns customer contact records (33
  properties of `CustomerView`) — client PII.
- `cpq_list_users` returns your own staff (`userName`, `emailAddress`)
  together with `isAdministrator`, `isApprover` and `canAccessAllQuotes`.
  That is a map of who can approve a quote, which is worth restricting
  independently of the PII.
- Every quote read carries commercial data: `cost`, `grossMargin`,
  `costModifier` and per-line cost sit alongside sell price. Restrict
  these if agent transcripts are shared beyond the people allowed to see
  your margins.
- `orderPorterPasscode` is the access code for a customer's published
  proposal and is returned by `cpq_get_quote` unless `includeFields`
  excludes it.
- All of the above are `read`-tier, so a plain `read` grant includes every
  one of them. Separating them requires a granular `customTools` grant.

## Known sharp edges

- **The delete confirmation is not a control.** The delete tools ask the
  caller to confirm through MCP elicitation, but a client that does not
  declare form-elicitation support gets no prompt and the delete proceeds.
  Conduit is a non-interactive client, so the confirmation is never asked.
  Treat the Conduit tier as the only enforced gate; the prompt is a
  courtesy for interactive clients.
- **`cpq_delete_quote` cascades.** It removes the quote and every tab,
  line item and term on it. Setting `isArchive: True` is the reversible
  way to retire a dead deal, and is almost always what was actually
  wanted.
- **Two different deletes, two different addresses.**
  `cpq_delete_quote_version` targets `quoteNumber` + `quoteVersion` and
  removes one revision; `cpq_delete_quote` targets a GUID and takes the
  whole quote. An agent that conflates them destroys far more than it
  meant to.
- **Reads under-report by default, and silently.** `cpq_search_quotes`
  called with no `conditions` falls back to the last 90 days, and searches
  return latest versions only unless `showAllVersions: true` is passed.
  The `count` in a result is the length of that page, never a collection
  total. An agent that concludes "this account has no open quotes" from a
  defaulted search is wrong, and that conclusion is exactly what bulk
  decisions get built on.
- **Order Porter changes cannot be walked back from here.** There is no
  unpublish verb, so a bad `orderPorter*` patch has to be corrected by a
  human in the CPQ web app while the customer may already be looking at
  the page.
- **Rate limits are undocumented.** CPQ publishes no limit and no
  `Retry-After` has been observed. Treat `429`, `502`, `503` and `504` as
  retryable with exponential backoff and keep concurrency modest —
  a wide agent sweep has no documented ceiling to stay under.
- **A missing credential answers `500`, not `401`.** When the
  Authorization header is absent entirely, CPQ returns
  `500 "An error has occurred."` — which reads as a vendor outage rather
  than a configuration problem, and sends operators looking in the wrong
  place.
