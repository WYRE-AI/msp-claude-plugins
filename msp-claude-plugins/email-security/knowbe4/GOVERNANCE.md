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
- Credential rotation happens once at the gateway, not per technician.
- Every call carries operator identity, so the gateway audit log answers
  "who pulled the list of employees who failed" — KnowBe4's own logging
  sees a single API token.
- Revoking gateway access revokes KnowBe4 access with it, immediately.

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
| **Read** | Cannot change KnowBe4 state. Safe for autonomous agents. | `knowbe4_phishing_list_campaigns`, `knowbe4_phishing_get_campaign`, `knowbe4_phishing_list_security_tests`, `knowbe4_phishing_get_security_test`, `knowbe4_phishing_list_recipients`, `knowbe4_phishing_get_recipient`, `knowbe4_phishing_list_templates`, `knowbe4_phishing_get_template`, `knowbe4_training_list_campaigns`, `knowbe4_training_get_campaign`, `knowbe4_training_list_enrollments`, `knowbe4_training_get_enrollment`, `knowbe4_training_list_modules`, `knowbe4_training_get_module`, `knowbe4_training_list_store_purchases`, `knowbe4_training_get_store_purchase`, `knowbe4_users_list`, `knowbe4_users_get`, `knowbe4_users_risk_score_history`, `knowbe4_users_list_events`, `knowbe4_groups_list`, `knowbe4_groups_get`, `knowbe4_groups_list_members`, `knowbe4_groups_risk_score_history`, `knowbe4_reporting_account_summary`, `knowbe4_reporting_phishing_summary`, `knowbe4_reporting_training_summary`, `knowbe4_reporting_risk_overview`, `knowbe4_reporting_ppp_trend`, `knowbe4_reporting_department_breakdown` |
| **Write** | — | None. |
| **Destructive** | — | None. |

**This plugin is read-only.** Every tool it exposes is a GET against the
KnowBe4 Reporting API. It cannot launch a phishing simulation, enroll a
user in training, create or archive a user, or change a group. An agent
using this plugin cannot send email to a customer's staff under any
circumstances.

That is a genuinely strong safety property and it is worth stating to a
buyer plainly, because the skills in this plugin describe workflows —
"launch campaign", "enroll failed users", "archive the user" — that a
human performs in the KnowBe4 console. An agent can plan and recommend
those actions; it cannot execute them. Do not read the presence of a
workflow in a skill as evidence a tool exists for it.

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
- **Recipient and event data is individual behavioural monitoring.**
  `knowbe4_phishing_list_recipients` and `knowbe4_phishing_get_recipient`
  return, per named employee, whether they opened a simulated phish,
  whether they clicked, whether they entered credentials on the landing
  page, the timestamp of each, plus the IP address and browser used.
  `knowbe4_users_risk_score_history` turns that into a per-person
  trendline.
- In several jurisdictions this class of data is subject to
  works-council agreement or employee-monitoring rules independent of
  any security justification. Restrict the user, recipient, and event
  tools for unattended agents; `knowbe4_reporting_*` answers most
  MSP reporting questions at department granularity without naming
  individuals.

## Known sharp edges

- **The daily rate limit is small and shared.** KnowBe4 allows roughly
  1,000 requests per day per token, and under the gateway that single
  token is shared by every technician and every agent working that
  account. One unattended agent paginating users at the default
  `per_page=25` can consume the whole day's budget before anyone else
  starts. Use `per_page=500` and cache; treat a sudden 429 as "a
  colleague's agent is looping", not as a KnowBe4 outage.
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
