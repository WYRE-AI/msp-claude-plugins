# KnowBe4 plugin — governance and safety model

Unofficial. Community-built plugin for the KnowBe4 Reporting API. Not
affiliated with, endorsed by, or sponsored by the vendor.

## What it connects as

This plugin does not hold credentials. It reaches KnowBe4 through the
WYRE Conduit gateway (`https://conduit.wyre.ai/v1/mcp`), which brokers
authentication centrally and scopes every call to the tenant the
operator is authorised for.

- No KnowBe4 API token is stored on the technician's machine, in this
  repo, or in the model's context. This matters more than usual here:
  a KnowBe4 token grants full read access to the entire account,
  including every employee record, and KnowBe4 does not offer
  per-technician tokens.
- The org's KnowBe4 credential is stored once at the gateway, so
  replacing it is one edit rather than a change on every technician's
  machine. There is no rotate action, though — you re-submit the
  connect form, which overwrites the stored credential in place, and
  nothing tracks its age or prompts you.

- Every call carries operator identity, so the gateway audit log answers
  "who pulled the list of employees who failed" — KnowBe4's own logging
  sees a single API token.
- Removing someone from the organisation clears their per-vendor grants
  and revokes their gateway refresh tokens at once; a user deactivated
  in your identity provider is refused on their very next request. A
  user only removed from the org keeps an already-issued access token
  for up to an hour, but it reaches only a personal KnowBe4 connection
  made with their own key — never the org's. See
  `wyre-gateway/GOVERNANCE.md`.

## Tool permission tiers

> **Not classified in Conduit — every tool in the table below requires
> tier `admin` today.** Conduit derives each tool's tier from
> `VENDOR_TOOL_CONFIG` (`src/proxy/result-cache.ts`) and fails closed for
> anything absent from it:
> `const requiredTier: PermissionTier = classified ?? 'admin';`
> (`src/access/access-enforcement.ts:63`). `knowbe4` has no entry, so the
> grouping below carries no enforcement weight right now — read tools
> require `admin` exactly as the rest do, and there is no narrower grant
> that admits them. The grouping is still the right *risk* reading, and it
> becomes the enforcement reading on the day this vendor is classified.
> The list of unclassified vendors moves whenever one of them is
> classified, so it is stated in one place only:
> `wyre-gateway/GOVERNANCE.md`, *Fail-closed, and the vendors Conduit has
> not classified*.
>
> *This blockquote is the whole of the not-classified caveat. When
> `knowbe4` appears in `VENDOR_TOOL_CONFIG`, delete this blockquote and
> change nothing else.*

| Tier | What it can do | Tools |
|---|---|---|
| **Read** | Cannot change KnowBe4 state. Safe for autonomous agents. | *Account:* `knowbe4_account_get`, `knowbe4_account_risk_score_history`. *Users:* `knowbe4_users_list`, `knowbe4_users_get`, `knowbe4_users_risk_score_history`. *Groups:* `knowbe4_groups_list`, `knowbe4_groups_get`, `knowbe4_groups_members`, `knowbe4_groups_risk_score_history`. *Phishing:* `knowbe4_phishing_campaigns_list`, `knowbe4_phishing_campaigns_get`, `knowbe4_phishing_campaign_tests`, `knowbe4_phishing_security_tests_list`, `knowbe4_phishing_security_test_get`, `knowbe4_phishing_security_test_recipients`, `knowbe4_phishing_security_test_recipient`. *Training:* `knowbe4_training_campaigns_list`, `knowbe4_training_campaigns_get`, `knowbe4_training_enrollments_list`, `knowbe4_training_enrollments_get`, `knowbe4_store_purchases_list`, `knowbe4_store_purchases_get`, `knowbe4_policies_list`, `knowbe4_policies_get`. *Reporting:* `knowbe4_reporting_phishing_summary`, `knowbe4_reporting_training_summary`, `knowbe4_reporting_risk_overview` |
| **Write** | — | None. |
| **Destructive** | — | None. |

Two more tools ship but are not risk-bearing: `knowbe4_status` (reports
whether credentials are configured) and `knowbe4_navigate` / `knowbe4_back`
(discovery aids). The latter two are unreachable through the gateway
regardless of tier — Conduit refuses every `*_navigate` and `*_back` tool
before any tier check, for every caller including org owners
(`src/proxy/tool-call-enforcement.ts:123-129`,
`src/proxy/discovery-tools.ts:41-50`). `conduit__my_access` replaces them.
`knowbe4_status` is deliberately kept.

A further four meta-tools — `knowbe4_list_categories`,
`knowbe4_list_category_tools`, `knowbe4_execute_tool`, `knowbe4_router` —
exist only when the server is started with `LAZY_LOADING=true`, which is
not how it is deployed here; in the default flattened mode the full tool
list is advertised directly and these are absent. `knowbe4_execute_tool`
is worth naming explicitly because it is a **dispatcher**: it invokes any
tool by name. That does not widen the surface — the pool it dispatches
into is exactly the read-only set above — but an allowlist written against
tool names should not assume a dispatcher is absent if lazy-loading is
ever enabled.

**This plugin is read-only, and that claim is enforced at the transport
layer rather than by convention.** The shared HTTP client accepts a
`method` option, but every domain call leaves it at the default `GET` —
there is no `POST`, `PUT`, `PATCH`, or `DELETE` anywhere in
`src/domains/`. It cannot launch a phishing simulation, enroll a user in
training, create or archive a user, or change a group. An agent using this
plugin cannot send email to a customer's staff under any circumstances.

That is a genuinely strong safety property and it is worth stating to a
buyer plainly, because the skills in this plugin describe workflows —
"launch campaign", "enroll failed users", "archive the user" — that a
human performs in the KnowBe4 console. An agent can plan and recommend
those actions; it cannot execute them. Do not read the presence of a
workflow in a skill as evidence a tool exists for it.

**KnowBe4 PhishER is not part of this surface.** PhishER is a separate
KnowBe4 product for triaging real user-reported phishing, and none of it
is exposed here — no message queue, no verdict lookup, no purge or
bulk-action tool. Earlier revisions of this plugin's
`security-awareness-analyst` agent described a PhishER triage workflow
that purged mail from customer mailboxes; no such tool has ever existed in
this server, and that description has been removed. If an agent proposes
purging or blocking anything, it has hallucinated a capability.

## Recommended agent policy

Because there is no write or destructive tier, the policy reduces to a
data-access question rather than a blast-radius one.

- Read tools: allow for reporting, trend analysis, and campaign review.
- The control that matters here is **who may read employee behavioural
  data**, not what an agent may change. See Data handling below, and
  consider restricting the user- and recipient-level tools while
  leaving the aggregate reporting tools open.

## What it cannot reach

- Only the KnowBe4 account mapped to the operator's gateway identity.
  KnowBe4 tokens are account-scoped; there is no reseller token that
  spans MSP clients, so each client account is a separate connection.
- No filesystem, no shell, no other vendor's data.
- No mail flow. KnowBe4 is a training platform. Nothing here inspects,
  quarantines, releases, or deletes real customer email — a real
  phishing attack is invisible to every tool in this plugin.
- No identity system. KnowBe4 user records are training records. This
  plugin cannot disable an account, reset a password, or revoke a
  session.
- No writes at all, including no ability to correct data it reports.

## Data handling

- Responses pass through the gateway into model context for the session
  and are not persisted by this plugin.
- **This plugin's read tier carries more personal data than most
  vendors' write tiers.** `knowbe4_users_list` and `knowbe4_users_get`
  return a near-complete HR record for every employee: full name, work
  email, employee number, job title, department, division, office
  location, manager name and email, hire date, last sign-in, and custom
  fields frequently mapped to further HR attributes.
- **Recipient data is individual behavioural monitoring.**
  `knowbe4_phishing_security_test_recipients` and
  `knowbe4_phishing_security_test_recipient` return, per named employee,
  whether they opened a simulated phish, whether they clicked, whether
  they entered credentials on the landing page, the timestamp of each,
  plus the IP address and browser used.
  `knowbe4_users_risk_score_history` turns that into a per-person
  trendline. Both recipient tools are scoped to one Phishing Security
  Test and require its `pst_id`, so reaching this data takes a deliberate
  two-step (list tests, then pull recipients) rather than a single sweep —
  a small friction worth preserving in agent design, not engineering
  around.
- In several jurisdictions this class of data is subject to
  works-council agreement or employee-monitoring rules independent of
  any security justification. Restrict the user and recipient tools for
  unattended agents. **The aggregate alternative is narrower than it
  looks:** `knowbe4_reporting_phishing_summary`,
  `knowbe4_reporting_training_summary` and `knowbe4_reporting_risk_overview`
  aggregate at the *account* level and take no filter arguments at all, and
  `knowbe4_account_get` is likewise account-wide. There is **no
  department-level reporting tool** — the finest non-individual grain
  available is the KnowBe4 group, via `knowbe4_groups_list` and
  `knowbe4_groups_risk_score_history`. A KnowBe4 group is not a
  department: departments live as a free-text field on the user record,
  so any genuine per-department figure has to be derived by reading
  individual users, which defeats the point of avoiding them. Say so to
  the client rather than promising department reporting this connector
  cannot produce.

## Known sharp edges

- **The daily rate limit is small and shared.** KnowBe4 allows roughly
  1,000 requests per day per token, and under the gateway that single
  token is shared by every technician and every agent working that
  account. The list tools default to `per_page=100` against a ceiling of
  500, so an unattended agent that paginates a large account without
  raising it spends five times the requests it needs to. Pass
  `per_page=500` and cache; treat a sudden 429 as "a colleague's agent is
  looping", not as a KnowBe4 outage.
- **The reporting summaries are page-scoped, not account-scoped.**
  `knowbe4_reporting_phishing_summary` describes itself as fetching all
  Phishing Security Tests, but it retrieves a single page — default
  `per_page=500` — and computes its averages over just that page.
  `knowbe4_reporting_training_summary` behaves the same way over training
  campaigns. On an account with more than 500 tests the
  `average_phish_prone_percentage` it returns is an average of an
  arbitrary subset while presenting as a whole-account figure, with
  nothing in the response marking it as partial beyond the echoed `page`
  and `per_page`. Check those two fields before quoting a summary to a
  client, and never trend two summaries against each other without
  confirming both covered the same span.
- **Most tools take no filters.** `knowbe4_training_enrollments_list` has
  no campaign or status argument, and the three `knowbe4_reporting_*`
  tools take no date range — `knowbe4_reporting_risk_overview` takes no
  arguments at all. "Overdue enrollments for campaign X this quarter" is
  a client-side filter over a full paginated read, not a query. An agent
  that assumes a filter parameter exists will silently report on the
  whole account instead of the slice it was asked about, which is the
  more dangerous failure because the answer still looks well-formed.
- **A wrong region reads as "the user doesn't exist".** The account's
  region (US, EU, CA, UK, DE) is fixed at creation and cannot be
  changed. Querying the wrong regional base URL returns 404 for valid
  IDs, which invites an agent to conclude a user or campaign was
  deleted.
- **Risk scores are stale by design.** They are recalculated
  periodically, not in real time; allow 24–48 hours. An agent comparing
  a risk score against an event that happened this morning is comparing
  across a gap.
- **Archived users remain in historical reports.** This is intentional —
  it preserves reporting integrity — but it means headcount derived from
  KnowBe4 will not match the customer's active-user count. Do not let an
  agent "reconcile" licence counts from KnowBe4 data.
- **Phish-prone percentage measures simulations, not attacks.** It is
  routinely mistaken for a security-outcome metric in client-facing
  reporting. A falling PPP says training is working; it says nothing
  about how many real threats reached the tenant. That number comes from
  the mail-security vendor, not from here.
- **Opened counts can exceed delivered counts.** Security scanners and
  mail-client preview panes fire the tracking pixel. An agent computing
  an open rate above 100% has hit a known artifact, not a data error.
