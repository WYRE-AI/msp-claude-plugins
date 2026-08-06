# Proofpoint plugin — governance and safety model

Unofficial. Community-built plugin for the Proofpoint APIs (TAP SIEM,
Quarantine, People, Forensics/TRAP, URL Defense). Not affiliated with,
endorsed by, or sponsored by the vendor.

## What it connects as

This plugin does not hold credentials. It reaches Proofpoint through the
WYRE Conduit gateway (`https://conduit.wyre.ai/v1/mcp`), which brokers
authentication centrally and scopes every call to the tenant the
operator is authorised for.

- No Proofpoint service principal or service secret is stored on the
  technician's machine, in this repo, or in the model's context. The
  secret is displayed once at creation and cannot be re-read from the
  dashboard, which makes central custody the only sane arrangement.
- Credential rotation happens once at the gateway, not per technician.
- Every call carries operator identity, so the gateway audit log answers
  "who ordered that search-and-destroy" — Proofpoint's `initiatedBy`
  field records the service principal, which is shared.
- Revoking gateway access revokes Proofpoint access with it,
  immediately.

## Tool permission tiers

> **Not classified in Conduit — every tool in the table below requires tier
> `admin` today.** Conduit derives a tool's tier from `VENDOR_TOOL_CONFIG`
> (`src/proxy/result-cache.ts`) and fails closed:
> `const requiredTier: PermissionTier = classified ?? 'admin';`
> (`src/access/access-enforcement.ts:63`). `proofpoint` has no entry there,
> so the grouping below carries no enforcement meaning at present — read
> tools included. A `read` or `write` grant on this vendor admits nothing; an
> `admin` grant admits everything, including the search-and-destroy surface.
> The grouping becomes what Conduit actually enforces once the vendor is
> classified, and classifying it is a privilege *reduction*, not an
> expansion. For the live list of unclassified vendors see
> `wyre-gateway/GOVERNANCE.md`, *Fail-closed, and the vendors Conduit has not
> classified* — it is stated once there because it moves.
>
> *Editor's note: when `proofpoint` gains a `VENDOR_TOOL_CONFIG` entry,
> delete this blockquote and nothing else. No other part of this document
> depends on it.*

> **The tool names this table previously listed were largely invented.**
> Thirty-one of the names in the earlier revision — including the marquee
> "forensics search-and-destroy" entry — are absent from the shipped
> server. Conduit routes this vendor to `http://proofpoint-mcp`
> (`conduit/src/credentials/vendor-config.ts:3128`), which registers
> **44 tools**; the table below is that surface, tool for tool. Fourteen
> capabilities the old table advertised do not exist at all and are
> listed under *What it cannot reach*. The risk reasoning is preserved
> throughout and reattached to the tools that actually exist.

| Tier | What it can do | Tools |
|---|---|---|
| **Read** | Cannot change Proofpoint state, mail flow, or mailboxes. Safe for autonomous agents. | `proofpoint_tap_get_all_threats`, `proofpoint_tap_get_messages_blocked`, `proofpoint_tap_get_messages_delivered`, `proofpoint_tap_get_clicks_permitted`, `proofpoint_tap_get_clicks_blocked`, `proofpoint_quarantine_list`, `proofpoint_quarantine_search`, `proofpoint_people_get_vap`, `proofpoint_people_get_top_clickers`, `proofpoint_people_get_user_risk`, `proofpoint_forensics_get_threat`, `proofpoint_forensics_get_campaign`, `proofpoint_forensics_search_messages`, `proofpoint_smart_search_trace`, `proofpoint_smart_search_get_message`, `proofpoint_smart_search_get_headers`, `proofpoint_threat_get_campaign`, `proofpoint_threat_get_by_id`, `proofpoint_threat_get_iocs`, `proofpoint_threat_list_families`, `proofpoint_url_decode`, `proofpoint_url_analyze`, `proofpoint_dlp_list_incidents`, `proofpoint_dlp_get_incident`, `proofpoint_dlp_list_encrypted`, `proofpoint_events_list`, `proofpoint_events_get_details`, `proofpoint_events_get_stats`, `proofpoint_policy_list`, `proofpoint_policy_get`, `proofpoint_policy_list_routes`, `proofpoint_reports_org_summary`, `proofpoint_reports_threat_summary`, `proofpoint_reports_mail_flow`, `proofpoint_reports_executive_summary`, `proofpoint_status`, `proofpoint_list_categories`, `proofpoint_list_category_tools`, `proofpoint_router`, `proofpoint_navigate` |
| **Write** | — | *None. The server exposes no tool that changes a Proofpoint setting.* |
| **Destructive** | Delivers or destroys customer mail, including mail already sitting in mailboxes. | `proofpoint_quarantine_release`, `proofpoint_quarantine_delete`, `proofpoint_forensics_pull_messages` |
| **Passthrough** | Blast radius chosen by its argument, not by its name. | `proofpoint_execute_tool` |

The classifications that a reviewer might argue with:

**`proofpoint_forensics_pull_messages` is the single highest-blast-radius
tool in this plugin.** It is auto-pull / search-and-destroy: it removes
messages that have already been delivered to real mailboxes, and there is
no un-pull. The shape of the risk is *not* what the previous revision of
this document described, and the difference matters for how you gate it.
The destructive call is **not** criteria-based. Its input schema is
`message_ids` (an array) plus a `reason` string
(`proofpoint-mcp/src/domains/forensics.ts:89-107`) — the scope is fixed by
the ID list you hand it, and it is knowable in full before the call. There
is also **no `action` parameter**: no soft-delete/hard-delete/move-to-junk
choice is exposed, so an agent cannot pick the recoverable variant, and the
tenant's TRAP configuration decides what "pull" means.

**The over-broad-criteria hazard is real, but it lives one step upstream.**
The criteria search — sender, subject, message ID, threat ID, date range —
is `proofpoint_forensics_search_messages`, which is read-only and changes
nothing. The failure mode is an agent that runs a criterion one field too
broad ("subject contains Invoice"), collects every returned ID, and pipes
the whole list into `proofpoint_forensics_pull_messages` without ever
looking at it. That is the same accident the old text warned about, and the
warning still applies — but it is now catchable, because the ID list is
visible between the two calls. **Gate the pair, not just the destructive
half:** require the approver to see the resolved ID list and its length,
not the search criteria and not a summary. Never grant
`proofpoint_forensics_pull_messages` to an unattended agent.

**`proofpoint_execute_tool` is a passthrough and belongs at the highest
tier you grant on this vendor.** It executes any Proofpoint tool by name
(`proofpoint-mcp/src/index.ts:205`), so an allowlist that permits it
permits `proofpoint_forensics_pull_messages` and
`proofpoint_quarantine_delete` along with it. A tool whose blast radius is
chosen by its arguments cannot be gated by its name. The same applies to
`proofpoint_router`, which is advisory only — it returns suggestions, not
calls — but which will happily point an agent at the destructive tools.

**`proofpoint_navigate` is listed for completeness and is not callable.**
Conduit refuses every `*_navigate` tool for every identity kind, owners
included (`conduit/src/proxy/discovery-tools.ts:41-49`) — a tier-blind menu
that advertises tools the caller may not call is itself a disclosure. Use
`conduit__my_access` to see what you actually hold.

**Releasing is destructive even though the API treats it as a state
change.** `proofpoint_quarantine_release` delivers a message Proofpoint
already classified as malware, phishing, or impostor into a person's
inbox. There is no un-deliver. It takes a single `message_id` — the
server exposes no bulk-release tool — so the multiplied version of this
mistake is an agent looping the single call over IDs it collected from a
search it misfiltered. The loop is the thing to gate; the per-call schema
will not stop it.

**`proofpoint_quarantine_delete` destroys the only copy.** A quarantined
message was never delivered, so the quarantine store is the sole
artifact. Deleting it forecloses any later forensic question about the
campaign. Single `message_id` here too, and the same looping caveat.

**`proofpoint_forensics_get_threat` stays in the read tier, but read the
caveat.** It changes no vendor state, so by blast radius it is read. What
it returns is forensic evidence for a threat — behavioural analysis,
network activity, file modifications, and the sandbox detonation record.
Where the tenant's forensic data includes a malware sample or a packet
capture, retrieving it pulls a weaponized artifact into the session and
onto whatever the operator does with it next. Retrieving does not execute,
but treat it as read-tier for approval purposes and handle the output like
the malware it is. `proofpoint_forensics_get_campaign` returns the same
class of material aggregated across every threat in a campaign, so it is
the larger version of the same exposure.

**Conduit does not enforce per-call approval.** It compares tiers — there is
no approval step, no per-call confirmation, and no interactive prompt
anywhere in its enforcement path. Nothing sits between an agent and a
release loop or a message pull once the tier is granted. Where this document
asks for a named human approver, that is a policy you impose on your agents,
and it is only as good as the agent configuration that carries it.

## Recommended agent policy

The safe default is **read autonomously, never self-approve destructive
calls.**

- Read tools: allow. TAP polling, VAP reporting, quarantine triage, and
  campaign correlation are the intended autonomous uses.
- Write tools: there are none to propose. The server changes no
  Proofpoint setting.
- Destructive tools: require a named human approver per invocation. For
  `proofpoint_forensics_pull_messages`, require the approver to review the
  **resolved `message_ids` list and its length** — the output of the
  `proofpoint_forensics_search_messages` call that produced it — not the
  search criteria and not a count the agent asserts. Do not grant these to
  scheduled or unattended agents.
- `proofpoint_execute_tool`: treat as equivalent to granting every tool
  above it, because it is.

## What it cannot reach

- Only the Proofpoint organizations mapped to the operator's gateway
  identity. Proofpoint service credentials are scoped to a single
  organization — each MSP client requires its own set — so there is no
  cross-client credential that could leak one customer's mail into
  another's session. There is also **no organization-enumeration tool**:
  an agent cannot discover which orgs it can see, only use the one its
  credential is bound to.
- No filesystem, no shell, no other vendor's data.
- Mailbox reach is limited to what TRAP is integrated with. If the
  Microsoft 365 or Google Workspace connector is not configured,
  `proofpoint_forensics_pull_messages` fails rather than silently doing
  nothing — but it also means an operator may believe remediation is
  available when it is not.
- Licensing gates several surfaces. People, Threat Response, and URL
  Defense APIs return 403 when the tenant's licence does not include
  them; that is a licensing boundary, not a permissions bug.

### Capabilities this plugin does not have

Each of these was documented in an earlier revision as a named tool. None
of them exists on the shipped server, and no near-miss should be
substituted — the correct answer to a request for one is that Proofpoint
is not reachable this way through this plugin.

| Absent capability | What is actually available |
|---|---|
| Poll or list remediation operations (`get_operation`, `list_operations`) | Nothing. `proofpoint_forensics_pull_messages` returns no operation ID and there is no status surface — the call's own response is all the confirmation there is. |
| Read or verify TRAP auto-pull configuration (`auto_pull_status`) | Nothing. Auto-pull settings are not exposed; check them in the Proofpoint console. |
| Enumerate Proofpoint organizations (`list_orgs`) | Nothing. One credential, one organization. |
| List or set VIP flags (`people_list_vip`, `people_set_vip`) | Nothing. `proofpoint_people_get_vap` returns Very Attacked People — a computed attack ranking, **not** the VIP flag, which is a different concept and is not readable or writable here. |
| Fetch or preview one quarantined message (`quarantine_get`, `quarantine_preview`) | `proofpoint_quarantine_list` / `_search` return metadata only. Message *bodies* are not retrievable; `proofpoint_smart_search_get_message` and `_get_headers` give headers and processing detail, not content. An analyst cannot preview before releasing. |
| Bulk release or bulk delete (`quarantine_bulk_release`, `quarantine_bulk_delete`) | Single-`message_id` calls only. |
| Threat-actor lookup (`threat_get_actor`) | Nothing. Actor names appear inside `proofpoint_threat_get_campaign` output; there is no actor-keyed tool. |
| Per-family lookup (`threat_get_family`) | `proofpoint_threat_list_families` lists families; there is no get-by-name. |
| Search campaigns by criteria (`threat_search_campaigns`) | `proofpoint_threat_get_campaign` is get-by-ID only. Campaign IDs come from TAP events. |
| Reverse IOC lookup — "which campaigns contain this indicator" (`threat_search_indicators`) | `proofpoint_threat_get_iocs` runs the other direction: campaign or time window in, indicators out. |
| Per-URL click attribution (`url_get_clicks`) | The URL Defense surface is decode and analyse only. Click records live in TAP: `proofpoint_tap_get_clicks_permitted` / `_blocked`, keyed by time window, not by URL. |

## Data handling

- Responses pass through the gateway into model context for the session
  and are not persisted by this plugin.
- **`proofpoint_quarantine_search` / `_list` return correspondent PII**:
  sender, recipient list, subject, and reply-to for every matching
  message. Message bodies are not retrievable through this plugin at all
  — which removes the "analyst previews before releasing" workflow an
  earlier revision described, and means a release decision here is made
  on metadata alone.
- **`proofpoint_smart_search_get_message` / `_get_headers` return full
  RFC 822 headers**, including internal routing hops and any
  header-embedded addressing the sender did not expect to be read back.
- **`proofpoint_people_*` returns employee records and behavioural
  data**: name, department, job title, and the individual's click history
  on malicious links. `proofpoint_people_get_top_clickers` is, in effect,
  a ranked list of which named employees fall for attacks, and
  `proofpoint_people_get_vap` ranks them by how hard they are targeted.
  Handle both as employee-performance data; in some jurisdictions they
  are subject to works-council or data-protection constraints.
- **`proofpoint_forensics_get_threat` / `_get_campaign` can return live
  malware samples and packet captures.** See the tier note above.
- **`proofpoint_dlp_list_incidents` / `_get_incident` return the
  sensitive data that triggered the DLP rule** — matched rule, detected
  data types, and message metadata. A DLP incident list is a map of where
  a customer's regulated data travels, and it is tier `read`.
- `proofpoint_tap_get_clicks_permitted` / `_blocked` attribute clicks to
  named recipients with IP address and user agent.

## Known sharp edges

- **TAP's 24-hour ceiling produces false all-clears.** The SIEM API
  cannot look back further than 24 hours. Asked "were we hit by this
  campaign last month", it returns an empty result set — which reads
  like "no threats found" rather than "no data available". An agent that
  reports all-clear from a TAP query outside the window is wrong, not
  reassuring. Historical questions belong to `proofpoint-forensics` or
  `proofpoint-threat-intel`.
- **A 204 is normal.** No content means no events in the window, not a
  failure. Agents that retry on 204 burn the rate limit.
- **Partial remediation failure is invisible from here.** Mailboxes on
  legal hold cannot be pulled from, and the pull can fail per-mailbox for
  permissions or integration reasons while the call as a whole succeeds.
  Because there is no operation-status tool — the `get_operation` call an
  earlier revision described was never real — an agent has no second call
  with which to confirm the outcome. **Never report a
  remediation as complete on the strength of the pull call returning.**
  Confirm in the Proofpoint console, or by re-running
  `proofpoint_forensics_search_messages` with the same criteria and
  checking the messages are gone.
- **The recoverability of a pull is a tenant setting, not an argument.**
  `proofpoint_forensics_pull_messages` exposes no action parameter, so
  whether a pulled message lands in a recoverable location or is removed
  outright is decided by the tenant's TRAP configuration. An agent cannot
  choose the safe variant, and an operator who assumes soft-delete
  semantics because a previous tenant behaved that way will be wrong
  without warning.
- **Rate limits are per-API, not per-plugin.** TAP and URL Defense allow
  1000 requests/hour; People, Quarantine, and Forensics allow 500. A
  polling loop tuned for TAP will exhaust the quarantine budget at twice
  the expected rate.
- **Campaign correlation lags.** `proofpoint_threat_get_campaign` can
  404 for a genuinely valid campaign ID that has not been correlated
  yet. Absence of a campaign is not evidence the threat is isolated.
