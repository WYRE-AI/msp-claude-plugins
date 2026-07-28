---
name: "Containment Playbooks"
description: >
  Ordered first-response containment sequences for the most common MSP
  incident classes — compromised account, malware/ransomware detection,
  business email compromise, and exposed credential — including why the
  order matters, which connected tool family (RMM, EDR, CIPP/Entra, PSA,
  documentation) handles each step, and the evidence-preservation principles
  that apply across all of them.
when_to_use: >-
  When an incident is confirmed or strongly suspected and immediate
  first-response action is needed. Use when: contain this incident, isolate
  device, compromised account, malware detected, ransomware, exposed
  credential, what do I do first, containment steps, incident response,
  first response playbook, lock down this account.
---

# Containment Playbooks

## Overview

The first thirty minutes after an incident is confirmed determine whether it
stays a single-endpoint or single-mailbox event or becomes a portfolio-wide
one. This skill is the first-response sequence for the incident classes an
MSP sees most often. It is deliberately ordered — containment before
eradication, eradication before recovery, recovery before notification —
because doing these out of order (for example, resetting a compromised
password before revoking active sessions) leaves an attacker's live session
valid even after the "fix."

This skill does not replace a full incident response plan or a client's own
IR contract terms. It is the playbook for the first response actions a
technician or agent takes the moment an incident class is identified, before
a deeper investigation or a formal incident report is built (see
[Incident Timeline Builder](../../agents/incident-timeline-builder.md) for
that phase).

## Step Zero: Confirm What's Connected

Call `conduit__search_tools` before assuming which tool handles which step
below. A client with Datto RMM but no CIPP connection can still isolate a
device but cannot revoke M365 sessions through this pack — that step must be
flagged as unavailable and handed to whatever manual/console process the
MSP uses instead. Never silently skip a containment step; if the connector
for it isn't present, say so explicitly and name the fallback (manual
console action, PSA ticket note, or escalation).

## Playbook: Compromised Account

| Order | Action | Tool family |
|-------|--------|-------------|
| 1 | Revoke all active sessions/refresh tokens for the account | CIPP / Entra (session revocation) |
| 2 | Disable the account (do not delete — preserves forensic state) | CIPP / Entra |
| 3 | Review and remove any inbox rules, forwarding rules, or delegate access created during the compromise window | CIPP / M365 mailbox rules |
| 4 | Reset the account password to a fresh, non-reused value | CIPP / Entra |
| 5 | Force MFA re-enrollment, invalidating any attacker-registered MFA method | CIPP / Entra |
| 6 | Check for lateral movement — other accounts with new sign-ins from the same source IP/ASN in the compromise window | CIPP audit logs / SIEM |
| 7 | Re-enable the account only after 1–5 are confirmed complete | CIPP / Entra |
| 8 | Document the timeline and notify the affected user and any downstream recipients of attacker-sent mail | PSA / documentation |

Order matters: reset the password (step 4) only after revoking sessions
(step 1) — a password reset alone does not invalidate an already-issued
session token.

## Playbook: Malware / Ransomware Detection

| Order | Action | Tool family |
|-------|--------|-------------|
| 1 | Isolate the affected device from the network (network isolation, not shutdown — shutdown destroys volatile forensic evidence) | EDR (SentinelOne/Huntress) or RMM |
| 2 | Confirm isolation succeeded — device shows isolated/quarantined in the console | EDR |
| 3 | Check for the same file hash / indicator on other endpoints in the same tenant | EDR |
| 4 | If ransomware behavior is confirmed: check backup job status and last-known-good restore point immediately — do not wait for full eradication to check this | RMM / backup platform |
| 5 | Identify patient zero and initial access vector (phishing, exposed RDP, exploited service) where evidence allows | EDR / RMM / documentation |
| 6 | Run the EDR's remediation/rollback action if available; otherwise scope for reimage | EDR |
| 7 | Re-image or reissue credentials for any accounts that were active on the device during the infection window | RMM + CIPP/Entra |
| 8 | Hold the device off the network until a clean scan and patch baseline are confirmed | EDR / RMM |

Never skip step 4 for ransomware-classified events, even if eradication
looks straightforward — backup viability is the single fact that most
changes the client conversation, and it degrades the longer it's unchecked
(some ransomware families delay backup-target encryption).

## Playbook: Business Email Compromise (BEC)

See [BEC Response](../bec-response/SKILL.md) for the full detection and
response sequence. In summary, the containment order is: revoke sessions →
audit and remove forwarding/inbox rules → reset password → force MFA
re-enrollment → identify and notify any recipients of attacker-sent
financial-fraud email before the client's own outreach does.

## Playbook: Exposed Credential

| Order | Action | Tool family |
|-------|--------|-------------|
| 1 | Determine scope — is this a single account's password, or a shared/service account credential that touches multiple systems? | Documentation (IT Glue/Hudu) / PSA |
| 2 | Revoke active sessions for the affected account(s) | CIPP / Entra, or the relevant vendor console for non-M365 credentials |
| 3 | Rotate the credential everywhere it is used — check documentation for every system referencing it before declaring rotation complete | Documentation / CIPP / relevant vendor |
| 4 | If the credential had elevated or admin scope, review recent activity for signs of misuse before rotation (rotation can end an active session but won't retroactively reveal what already happened) | Audit logs (CIPP / EDR / SIEM) |
| 5 | Force MFA re-enrollment if the credential belongs to an MFA-protected account | CIPP / Entra |
| 6 | Update the credential's record in documentation and note the rotation date/reason | Documentation platform |

A credential found in a public breach dump or paste site should be treated
as exposed even with no confirmed misuse — rotate on discovery, don't wait
for evidence of use.

## Common Principles Across All Playbooks

1. **Contain before you investigate deeply.** Stopping the bleeding comes
   before root-cause analysis. A device can stay isolated while forensics
   continues.
2. **Preserve evidence.** Prefer network isolation over shutdown, disable
   over delete, and log every action taken with a timestamp — this becomes
   the incident timeline.
3. **Notify only after containment is underway**, not before — a premature
   notification without a stated containment status creates client anxiety
   without giving them anything actionable.

## Related Skills

- [Alert Severity Normalization](../alert-severity-normalization/SKILL.md) —
  how to decide whether an incident warrants this playbook's urgency.
- [BEC Response](../bec-response/SKILL.md) — the detailed BEC-specific
  sequence.
