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
- Credential rotation happens once at the gateway, not per technician.
  This matters more in CPQ than most: the private key is displayed once,
  at creation, and losing it means regenerating the pair for everyone.
- Every call carries operator identity, so the gateway audit log answers
  "who repriced that quote". CPQ's own trail records only the single API
  user the key pair belongs to, so without the gateway every agent action
  looks like one shared robot.
- Revoking gateway access revokes CPQ access with it, immediately.

## Tool permission tiers

25 tools, all prefixed `cpq_`. Tiering is by blast radius, not HTTP verb.

| Tier | What it can do | Tools |
|---|---|---|
| **Read** | Cannot change CPQ state. Safe for autonomous agents. | `cpq_test_connection`, `cpq_search_quotes`, `cpq_get_quote`, `cpq_get_quote_versions`, `cpq_search_quote_items`, `cpq_get_quote_item`, `cpq_search_quote_tabs`, `cpq_list_quote_customers`, `cpq_list_quote_terms`, `cpq_list_templates`, `cpq_list_tax_codes`, `cpq_list_recurring_revenues`, `cpq_list_users` |
| **Write** | Builds and prices quote content. Reversible while the quote is still internal. | `cpq_create_quote_from_template`, `cpq_create_quote_item`, `cpq_update_quote_item`, `cpq_update_quote_customer`, `cpq_create_quote_term`, `cpq_update_quote_term` |
| **Destructive** | Rewrites what a customer has been shown or told, or removes priced content with no undo. Requires explicit per-call human approval. | `cpq_update_quote`, `cpq_delete_quote`, `cpq_delete_quote_version`, `cpq_delete_quote_item`, `cpq_delete_quote_term`, `cpq_delete_quote_customer` |

`cpq_update_quote` sits in the destructive tier despite being the plugin's
plainest-looking write. It is the only route to `isSent`, `isAccepted`,
`isLost`, `quoteStatus`, `approvalStatus` and the `orderPorter*` fields —
the record of what the customer was sent, what they agreed to, and what
the published proposal shows them. Setting `isAccepted` on the wrong quote
does not just misfile a row; it is the signal the forecast, the commission
run and the port-to-PSA step all read as truth. The tool also accepts raw
JSON Patch, so `op: "remove"` can strip a field outright, and tiering is
per-tool — the gateway cannot see which `path` an agent intends, so the
whole tool inherits the blast radius of its worst operation. If your
gateway can gate on argument values, the narrower rule is: allow
`cpq_update_quote` freely for `name`, `expectedCloseDate` and the
`zCustom*` slots, and require approval for any patch touching
`quoteStatus`, `isSent`, `isAccepted`, `isLost`, `isArchive`,
`expirationDate`, the approval fields, or `orderPorter*`.

`cpq_delete_quote_term` and `cpq_delete_quote_customer` are in the same
tier for the same reason rather than for their verb. A term carries
`interestRate`, `downPayment` and `periodPaymentAmount` — the financing
the customer was offered, and `isSelected` marks the one they were offered
*specifically*. A quote customer is who the proposal is addressed to and
who holds the Order Porter link. Neither is recoverable from this toolset.

Line pricing (`cpq_update_quote_item`, `cpq_update_quote_term`) is
deliberately **not** destructive. CPQ's API has no send, publish or e-sign
verb, so a price change reaches nobody until a human publishes the quote
in the web app — the customer-facing act stays behind a person either way.
Tiering every pricing edit as destructive would leave the tier unable to
discriminate, which is the failure mode that gets tiers ignored. The
edits are still money, so they belong in the propose-and-approve loop
below.

## Recommended agent policy

The safe default is **read autonomously, propose writes, never
self-approve destructive calls.**

- Read tools: allow. Pipeline reporting, margin analysis across open
  quotes, and reconciling quoted vs. contracted spend are the intended
  autonomous use.
- Write tools: agent drafts the exact call, human approves, then it runs.
  Because these move money on the page, have the agent state the before
  and after figures in its proposal, not just the patch body.
- Destructive tools: require a named human approver per invocation. Do not
  grant these to scheduled or unattended agents, and specifically do not
  let a housekeeping agent hold `cpq_delete_quote` or
  `cpq_delete_quote_version`.

## What it cannot reach

- Only the CPQ tenant the operator's gateway identity maps to. There is
  one global host (`https://sellapi.quosalsell.com`) and no regional
  variants — tenancy is carried entirely by the access key.
- Within that tenant, only what the API user's own CPQ permissions allow.
  `canAccessAllQuotes` on the user record is the real scope boundary; a
  restricted API user makes the tiers above fail at CPQ, not at the
  gateway.
- No filesystem, no shell, no other vendor's data.
- Not ConnectWise PSA and not ConnectWise Automate. Separate products,
  separate APIs, separate gateway connectors, despite the shared brand.
  `crmOpportunityId` on a quote is a pointer into the PSA, not a join this
  plugin can follow.
- **No delivery.** There is no send, publish, e-sign, PDF or attachment
  verb, and no port-to-PSA. An agent holding every tool here still cannot
  email a customer or put a document in front of one — that is the CPQ web
  app and the CPQ↔PSA integration engine.
- No live event stream. CPQ has no webhooks; every tool is point-in-time
  and change detection means polling `modifyDate`.

## Data handling

- Responses pass through the gateway into model context for the session
  and are not persisted by this plugin.
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

## Known sharp edges

- **The delete confirmation is not a control.** The delete tools ask the
  caller to confirm through MCP elicitation, but a client that does not
  declare form-elicitation support gets no prompt and the delete proceeds.
  Treat the gateway tier as the only enforced gate; the prompt is a
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
