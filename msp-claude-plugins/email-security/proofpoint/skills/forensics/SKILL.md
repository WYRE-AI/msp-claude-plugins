---
name: "Proofpoint Forensics"
description: >
  Proofpoint Forensics and Threat Response (TRAP) fundamentals: auto-pull and
  search-and-destroy remediation actions, evidence collection, message trace, and
  post-delivery incident response workflows for email-borne threats.
when_to_use: >-
  When investigating or remediating email-borne threats after delivery using Proofpoint forensics
  or TRAP. Use when: proofpoint forensics, proofpoint search and destroy, proofpoint auto-pull,
  email forensics, message investigation, proofpoint remediation, threat response, email incident
  response, message trace, proofpoint trap, proofpoint evidence, or post-delivery remediation.
---

# Proofpoint Forensics & Threat Response

## Overview

Proofpoint Forensics provides deep investigation capabilities for email-borne threats. When a threat is detected after delivery, Proofpoint Threat Response Auto-Pull (TRAP) can automatically or manually remediate messages that have already reached user mailboxes. This skill covers evidence collection, message investigation, search and destroy operations, and incident response workflows.

TRAP integrates with Microsoft 365 and Google Workspace to move or delete messages from user mailboxes after delivery, closing the gap between detection and remediation.

## Anti-triggers

- **Stopping a message before it is delivered** — everything here acts
  after delivery. Releasing or deleting mail still held pre-delivery is
  `proofpoint-quarantine`.
- **The threat event that prompted the investigation** — GUIDs,
  dispositions, scores, and click records come from `proofpoint-tap`;
  this skill starts once you already have a GUID or threat ID.
- **Campaign attribution, actor names, and IOC context** — use
  `proofpoint-threat-intel`.
- **"Search and destroy" on endpoints rather than mailboxes** — TRAP
  reaches Microsoft 365 and Google Workspace mailboxes only. Killing
  processes or removing persistence on a host is `huntress-incidents`.

## Key Concepts

### Remediation is a two-step sequence, not one call

The single most important thing to know about this domain: **finding
messages and removing them are separate tools.**

1. `proofpoint_forensics_search_messages` — read-only. Takes criteria
   (`sender`, `subject`, `message_id`, `threat_id`, `startDate`,
   `endDate`) and returns matching delivered messages. Changes nothing.
2. `proofpoint_forensics_pull_messages` — destructive. Takes
   `message_ids` (an explicit array) plus a `reason` string for the audit
   trail, and removes those messages from mailboxes.

The scope of the destructive step is therefore fixed and inspectable
*before* you call it. Always look at the ID list the search returned, and
its length, before passing it on. Piping step 1 straight into step 2
without reading the result is how an over-broad criterion ("subject
contains Invoice") turns into hundreds of deleted legitimate messages.

### Remediation actions are a tenant setting, not a parameter

Proofpoint TRAP can move a pulled message to junk, soft-delete it,
hard-delete it, or quarantine it. **None of these is selectable through
this plugin** — `proofpoint_forensics_pull_messages` exposes no action
argument, so what "pull" does is whatever the tenant's TRAP policy says.
Do not promise a user that a removal is recoverable; check the tenant's
configuration in the Proofpoint console, because no tool here reports it.

### Evidence types

`proofpoint_forensics_get_threat` returns forensic evidence for one
threat, and `proofpoint_forensics_get_campaign` returns it aggregated
across a campaign. Depending on what the tenant's analysis produced, the
response may contain any of:

| Type | Contents |
|------|----------|
| `screenshot` | PNG of the rendered threat page or attachment |
| `pcap` | Full packet capture from sandbox detonation |
| `sample` | The original malicious file |
| `headers` | Full RFC 822 headers |
| `urls` | All URLs found in the message |
| `attachments` | File names, hashes, sizes |
| `sandbox_report` | Behavioural analysis results |

These are response contents, not arguments — there is no per-type fetch.
`sample` and `pcap` are live malware; pulling one into the session is
read-tier by blast radius and handled-as-malware by common sense.

## Field Reference

### Forensic Report Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique forensic report identifier |
| `GUID` | string | Message GUID (links to TAP events) |
| `scope` | string | `online` (cloud analysis) or `sandbox` (detonation) |
| `type` | string | Type of forensic evidence |
| `name` | string | Display name for the evidence |
| `threatTime` | datetime | When the threat was classified |
| `engineResults` | object[] | Results from analysis engines |
| `platforms` | object[] | Platforms where evidence was collected |

### Engine Result Fields

| Field | Type | Description |
|-------|------|-------------|
| `engine` | string | Analysis engine name |
| `verdict` | string | `malicious`, `suspicious`, `benign` |
| `score` | int | Confidence score (0-100) |
| `details` | string | Detailed analysis findings |
| `iocs` | object[] | IOCs extracted by this engine |

### Message Trace Fields

| Field | Type | Description |
|-------|------|-------------|
| `GUID` | string | Message GUID |
| `messageId` | string | RFC 822 Message-ID header |
| `sender` | string | Envelope sender |
| `recipients` | string[] | All recipients |
| `subject` | string | Message subject |
| `receivedTime` | datetime | When Proofpoint received the message |
| `deliveryTime` | datetime | When delivered to mailbox |
| `disposition` | string | Final message disposition |
| `policyActions` | string[] | Policy actions applied |
| `routingPath` | string[] | Mail routing hops |

## MCP Tools

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `proofpoint_forensics_get_threat` | Forensic evidence for one threat — behavioural analysis, network activity, file modifications, sandbox results | `threat_id` (required), `includeCampaignForensics` |
| `proofpoint_forensics_get_campaign` | The same evidence aggregated across every threat in a campaign | `campaign_id` (required) |
| `proofpoint_forensics_search_messages` | Find delivered messages to remediate. Read-only | `sender`, `subject`, `message_id`, `threat_id`, `startDate`, `endDate` |
| `proofpoint_forensics_pull_messages` | ⚠ **Destructive.** Auto-pull / search-and-destroy: removes delivered messages from mailboxes | `message_ids` (required, array), `reason` |
| `proofpoint_smart_search_trace` | Trace messages through mail flow — delivery status and processing history | `sender`, `recipient`, `subject`, `message_id`, `startDate`, `endDate`, `status` |

### Not available through this plugin

Do not substitute a near-miss for any of these; the correct answer is that
Proofpoint is not reachable this way here.

- **Polling a remediation's progress.** `proofpoint_forensics_pull_messages`
  returns no operation ID and there is no status, list, or history tool.
  The call's own response is the only confirmation you get.
- **Reading TRAP auto-pull configuration.** No tool exposes whether
  auto-pull is on, or in which mode. Check the Proofpoint console.
- **Choosing the removal action.** See above — no action parameter exists.
- **A standalone sandbox-report call.** Sandbox behavioural analysis comes
  back inside `proofpoint_forensics_get_threat`; there is no separate
  fetch.

## Common Workflows

### Investigate a Delivered Threat

1. From a TAP delivered-message event, get the `threat_id`
2. Call `proofpoint_forensics_get_threat` for the full forensic analysis,
   including sandbox results and extracted IOCs
3. Set `includeCampaignForensics` (or call
   `proofpoint_forensics_get_campaign`) if the threat belongs to a
   campaign and you need the wider picture
4. Determine impact with `proofpoint_forensics_search_messages` — how many
   mailboxes actually hold the message
5. If remediation is needed, proceed to the sequence below

### Search and Destroy

1. Identify the message to remediate — sender, subject, `message_id`, or
   the `threat_id` from the investigation above
2. Call `proofpoint_forensics_search_messages` with those criteria
3. **Read the result.** Check the returned message IDs and their count
   against what you expected. If the count is surprising, the criteria
   were wrong — narrow them and search again. This is the only point at
   which the mistake is still free
4. Get human approval on the resolved ID list, not on the criteria
5. Call `proofpoint_forensics_pull_messages` with those `message_ids` and
   a `reason` for the audit trail
6. Confirm the outcome by re-running the search — the pull reports no
   per-mailbox result, and mailboxes on legal hold will silently not be
   remediated
7. Record the criteria, the ID list, and the reason in the incident notes

### Post-Incident Evidence Collection

1. Call `proofpoint_forensics_get_threat` for the threat
2. Review the returned evidence — screenshots, pcaps, samples, sandbox
   behavioural analysis all arrive in that one response
3. Call `proofpoint_forensics_get_campaign` for campaign-wide context
4. Extract IOCs from the forensic response
5. Cross-reference with `proofpoint_threat_get_iocs`
6. Package evidence for the incident report

### Message Trace Investigation

1. User reports a suspicious message they received
2. Call `proofpoint_smart_search_trace` with sender and recipient
3. Review the routing path and policy actions applied
4. Check if TAP flagged the message and what disposition was applied
5. If the message was delivered and is malicious, run the search-and-destroy
   sequence above
6. If the message was blocked, confirm with the user

## Error Handling

### Common API Errors

| Code | Message | Resolution |
|------|---------|------------|
| 400 | Invalid search criteria | `proofpoint_forensics_search_messages` needs at least one criterion |
| 400 | `message_ids` required | `proofpoint_forensics_pull_messages` will not run without an explicit ID array — there is no "pull everything matching" form |
| 401 | Authentication failed | Verify service principal and secret |
| 403 | TRAP access not enabled | Ensure your license includes Threat Response |
| 404 | Forensic data not found | `proofpoint_forensics_get_threat` has no data for every threat ID; absence is not a clean bill of health |
| 429 | Rate limit exceeded | Forensics allows 500 requests/hour — back off rather than retrying tightly |

### Search-and-Destroy Failures

| Failure Reason | Resolution |
|----------------|------------|
| Mailbox not accessible | Check Microsoft 365/Google Workspace integration credentials |
| Message already deleted | User may have deleted the message manually |
| Permission denied | Service account needs impersonation rights |
| Mailbox on hold | Legal hold prevents deletion; use move-to-junk instead |
| Timeout | Large-scope operations may timeout; use narrower criteria |

## Best Practices

1. **Read the ID list before you pull it** - The search result is the last
   point at which an over-broad criterion costs nothing. Check the count
2. **Narrow your scope** - Use specific criteria (`message_id` + `sender`)
   rather than a bare subject match
3. **Never assume the removal is recoverable** - No action parameter is
   exposed; the tenant's TRAP policy decides. Do not tell a user their
   mail can be restored unless you have checked the console
4. **Verify, do not trust the return** - Re-run
   `proofpoint_forensics_search_messages` after pulling. There is no
   operation-status tool and per-mailbox failures (legal hold, missing
   integration) do not surface in the pull response
5. **Document everything** - Record the criteria, the resolved ID list,
   and the `reason` string you passed; that reason is the audit trail
6. **Collect evidence first** - Call `proofpoint_forensics_get_threat`
   before remediating. Once the messages are pulled you cannot go back for
   what you did not capture
7. **Coordinate with users** - Notify affected users that messages were
   removed and explain why
8. **Use message trace for debugging** - When users report missing
   legitimate email, trace the path with `proofpoint_smart_search_trace`

## Related Skills

- [Proofpoint TAP](../tap/SKILL.md) - Threat events that trigger forensic investigation
- [Proofpoint Quarantine](../quarantine/SKILL.md) - Pre-delivery message management
- [Proofpoint Threat Intelligence](../threat-intel/SKILL.md) - Campaign and IOC context
- [Proofpoint API Patterns](../api-patterns/SKILL.md) - Authentication and rate limits
