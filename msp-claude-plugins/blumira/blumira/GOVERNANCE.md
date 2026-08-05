# Blumira plugin — governance and safety model

Unofficial. Community-built plugin for the Blumira API. Not affiliated
with, endorsed by, or sponsored by the vendor.

## What it connects as

This plugin does not hold credentials. It reaches Blumira through the
WYRE Conduit gateway (`https://conduit.wyre.ai/v1/mcp`), which brokers
authentication centrally and scopes every call to the organization — or,
with an MSP-scoped token, the managed accounts — the operator is
authorised for.

- No Blumira JWT is stored on the technician's machine, in this repo, or
  in the model's context.
- Credential rotation happens once at the gateway, not per technician.
- Every call carries operator identity, so the gateway audit log answers
  "who closed this finding as a false positive" — Blumira's own log
  records only the API principal.
- Revoking gateway access revokes Blumira access with it, immediately.

## Tool permission tiers

> **Not classified in Conduit — every tool in the table below requires
> tier `admin` today.** Conduit derives each tool's tier from
> `VENDOR_TOOL_CONFIG` (`src/proxy/result-cache.ts`) and fails closed for
> anything absent from it:
> `const requiredTier: PermissionTier = classified ?? 'admin';`
> (`src/access/access-enforcement.ts:63`). `blumira` has no entry, so the
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
> `blumira` appears in `VENDOR_TOOL_CONFIG`, delete this blockquote and
> change nothing else.*

| Tier | What it can do | Tools |
|---|---|---|
| **Read** | Cannot change Blumira state. Safe for autonomous agents. | `blumira_status`, `blumira_navigate`, `blumira_back`, `blumira_findings_list`, `blumira_findings_get`, `blumira_findings_details`, `blumira_findings_comments_list`, `blumira_resolutions_list`, `blumira_users_list`, `blumira_agents_devices_list`, `blumira_agents_devices_get`, `blumira_agents_keys_list`, `blumira_agents_keys_get`, `blumira_msp_accounts_list`, `blumira_msp_accounts_get`, `blumira_msp_findings_all`, `blumira_msp_findings_list`, `blumira_msp_findings_get`, `blumira_msp_findings_comments_list`, `blumira_msp_devices_list`, `blumira_msp_devices_get`, `blumira_msp_keys_list`, `blumira_msp_keys_get`, `blumira_msp_users_list` |
| **Write** | Changes the finding record. Reversible, but visible to anyone reading the security queue. | `blumira_findings_assign`, `blumira_findings_resolve`, `blumira_findings_comments_add`, `blumira_msp_findings_assign`, `blumira_msp_findings_resolve`, `blumira_msp_findings_comments_add` |
| **Destructive** | — | *Empty.* |

**There is no destructive tier.** Blumira's API cannot isolate a host,
block an IP, kill a process, disable an account, or delete a record. The
blast radius of every write stops at the Blumira finding queue.

`blumira_findings_resolve` is deliberately **not** in the destructive
tier, unlike Huntress's `huntress_incidents_bulk_approve`. Approving a
Huntress remediation instructs software to act on a customer endpoint;
resolving a Blumira finding closes a record. The status is reversible
and no customer machine changes.

That said, it is the write worth watching. A resolve carries a
disposition code, and `30` (False Positive) feeds Blumira's detection
tuning. An agent that batch-closes a noisy rule as False Positive is
not just clearing a queue — it is training the platform to stop
detecting that behaviour.

## Recommended agent policy

The safe default is **read autonomously, propose writes, never
self-approve destructive calls.**

- Read tools: allow. Cross-account triage sweeps, coverage audits, and
  posture reporting are the intended autonomous use — with the agent-key
  exception below.
- Write tools: agent drafts the exact call — finding ID, resolution
  code, and notes — human approves, then it runs. Require a human on
  every resolve that uses code `30`, however small the batch.
- Destructive tools: none exist. Do not let that be read as "Blumira is
  safe to automate end-to-end" — the risk here is a *silenced* detection,
  not a broken endpoint.

## What it cannot reach

- Only the Blumira organization mapped to the operator's gateway
  identity. `/msp/*` tools additionally require an **MSP-scoped** JWT;
  an org-level token returns 403 on every one of them, and cannot see
  another account's data at all.
- No filesystem, no shell, no other vendor's data.
- No response or containment capability of any kind — Blumira detects
  and reports; remediation happens in the EDR, firewall, or identity
  provider.
- No live event stream. Every tool is point-in-time; Blumira's own
  notification channels carry the push feed.

## Data handling

- Responses pass through the gateway into model context for the session
  and are not persisted by this plugin.
- **`blumira_agents_keys_get`, `blumira_agents_keys_list`,
  `blumira_msp_keys_get`, and `blumira_msp_keys_list` return agent
  deployment keys — credential material.** They sit in the read tier
  because they change nothing, but a read that emits an enrolment token
  into a transcript is the sharpest exposure in this plugin. Restrict
  them from unattended agents and from any shared transcript.
- `blumira_users_list` and `blumira_msp_users_list` return analyst PII
  (names, email addresses, roles).
- `blumira_findings_details` returns enriched evidence — source IPs,
  usernames, hostnames, and the log excerpts that triggered the
  detection.
- `blumira_msp_accounts_list` returns the MSP's full client roster.

## Known sharp edges

- **Two parallel tool families, one wrong answer.** `/org/*` and
  `/msp/*` tools take near-identical arguments. Calling an `/org/*` tool
  with MSP credentials does not error usefully — it answers about the
  *MSP's own* organization, so an agent can confidently report "no open
  findings" for a client it never queried.
- **Resolution codes are integers with no guardrail.** `10` Valid, `20`
  Not Applicable, `30` False Positive. A transposed digit records the
  opposite security conclusion and is not flagged by the API.
- **Cross-account queries time out rather than page.**
  `blumira_msp_findings_all` across a large portfolio fails on breadth;
  the fix is narrower filters, not a retry.
- **Status codes, not labels.** Findings use `10`/`20`/`30` for
  Open/In Progress/Resolved. Filtering on the wrong integer returns a
  clean empty set that reads as "nothing to triage."
