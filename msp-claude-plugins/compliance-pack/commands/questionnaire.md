---
description: Draft evidence-backed answers to the standard cyber-insurance questionnaire for a client
argument-hint: "<client>"
arguments: [client]
---

# Questionnaire

Walk the standard cyber-insurance renewal question set (MFA, EDR, backups, incident response, security awareness training) for a client and draft evidence-backed answers, flagging anything that can't be answered with current tool coverage.

## Prerequisites

- Conduit MCP Gateway connected (`conduit`)
- CIPP connected at minimum (covers the MFA question, the strongest-weighted question in most questionnaires); Liongard, IT Glue/Hudu, and any EDR/PSA connectors strengthen coverage of the remaining questions

## Steps

1. **Discover available tools.** Call `conduit__search_tools` to determine which connectors are available for this client — MFA/CIPP, EDR/MDR (Huntress, SentinelOne, RocketCyber), documentation (IT Glue/Hudu), and PSA (HaloPSA, Autotask) if present.
2. **Resolve the client** against the connected tenant/documentation records.
3. **Invoke the `questionnaire-autofiller` agent** for the resolved client. The agent walks the standard question set from the `insurance-questionnaires` skill, pulling live evidence per question and labeling each answer evidence-backed, documented-only, or unable to verify.
4. **Present the draft answers** followed by a clearly separated "cannot answer with current tool coverage" list, each with a recommended next step.

## Arguments

| Argument | Required | Default | Description |
|---|---|---|---|
| `client` | Yes | — | The client/organization name to draft the questionnaire for |

## Examples

### Draft the standard questionnaire for a renewal

```
/compliance-pack:questionnaire "Acme Corp"
```

## Output

```
================================================================================
Cyber Insurance Questionnaire Draft — Acme Corp
================================================================================
Draft Date:            2026-07-14
Connectors used:       CIPP, IT Glue
Connectors unavailable: Huntress, SentinelOne, RocketCyber (no EDR/MDR connected)

--------------------------------------------------------------------------------
Drafted Answers
--------------------------------------------------------------------------------
Q: Is MFA enforced for all users, including privileged/admin accounts?
A: MFA is enforced for 39 of 41 users (95%) via conditional access policy
   "Require MFA - All Users." 2 exceptions: 1 break-glass account (by design),
   1 legacy service account pending remediation.
Evidence: Evidence-backed
Citation: cipp__list_mfa_users, cipp__list_conditional_access_policies

Q: Is EDR deployed across all endpoints?
A: Unable to verify — no EDR/MDR connector is currently connected for this client.
Evidence: Unable to Verify
Citation: conduit__search_tools (no match)

Q: Are backups tested via periodic restore tests?
A: A backup/DR runbook is documented, last updated 2025-11-03. No live
   test-restore evidence source is connected; testing cadence cannot be
   confirmed from tooling.
Evidence: Documented-only
Citation: itglue__search_documents ("Backup & DR Runbook")

--------------------------------------------------------------------------------
Cannot Answer With Current Tool Coverage
--------------------------------------------------------------------------------
1. EDR/endpoint coverage — connect Huntress, SentinelOne, or RocketCyber to close this gap.
2. Backup restore-testing cadence — connect a backup platform, or confirm manually before submission.
3. Security awareness training — no training platform connector available; confirm current
   program status directly before answering.

--------------------------------------------------------------------------------
Notes for the MSP
--------------------------------------------------------------------------------
Underwriter is likely to follow up on the 2 MFA exceptions and the unverified
backup-testing cadence — have specifics ready before submitting.
================================================================================
```

## Error Handling

### No compliance connectors available

```
No compliance-relevant connectors found for this client via conduit__search_tools.

At minimum, connect CIPP to answer the MFA question with live evidence. Without
any connector, every question in this draft will be flagged Unable to Verify.
```

### Client not found

```
Client "Acme Corp" not found in connected tenant or documentation records.

Verify the client name matches the connected PSA/tenant naming, or check
conduit__search_tools output for the correct org identifier.
```

## Related Commands

- `/compliance-pack:evidence-pack` — build the full underlying evidence package this draft's answers are sourced from
- `/compliance-pack:drift-report` — check whether any answer here is at risk of going stale due to recent configuration drift
