---
name: "BEC Response"
description: >
  Business Email Compromise detection and first response: the signals that
  reveal it in CIPP/M365 audit logs, mailbox and forwarding rules, and
  connected email security vendor alerts; the order-dependent response
  sequence (session revocation, forwarding-rule audit, mailbox rule and
  delegate cleanup, password reset, MFA re-enrollment, lateral-spread check,
  recipient notification); and what a defensible incident timeline must
  capture for insurance or bank-fraud claims.
when_to_use: >-
  When Business Email Compromise is suspected or confirmed, or when signs of
  it need to be checked for proactively. Use when: BEC, business email
  compromise, invoice fraud, wire fraud email, suspicious forwarding rule,
  mailbox compromised, executive email compromised, phishing led to account
  takeover, someone is impersonating our client's email.
---

# BEC Response

## Overview

Business Email Compromise is the highest financial-impact incident class
most MSPs handle, and it is also one of the easiest to miss early because
the attacker's goal is to look exactly like the legitimate mailbox owner for
as long as possible. There is rarely a malware payload to detect — the
"malware" is a valid session token and a quietly added inbox rule. This
skill covers how to detect BEC from the connected M365 tenant and any
connected email security vendor, and the response sequence once it's
confirmed or strongly suspected.

## Step Zero: Confirm What's Connected

Call `conduit__search_tools` to confirm which of CIPP, the M365/Entra
connector, and an email security vendor (Mimecast / Proofpoint / Abnormal /
Ironscales / Avanan / SpamTitan) are actually connected for this client. CIPP
is the primary source for this skill — it exposes M365 audit logs, mailbox
rules, and BEC-specific checks directly. If CIPP is not connected, note that
explicitly: the detection signs below still apply conceptually, but they
must be checked through whatever admin console access is available instead.
An email security vendor, if connected, adds inbound-side signal (the
phishing message that led to the compromise) that CIPP alone won't show.

## Detecting the Signs

Pull these signals — do not wait for all of them before acting on strong
individual signals, but corroborate wherever possible:

| Signal | Where to look | What it looks like |
|--------|---------------|---------------------|
| Anomalous sign-in | CIPP / Entra audit logs | Impossible travel, sign-in from an unfamiliar ASN/country, sign-in immediately followed by mailbox configuration changes |
| New or modified inbox rule | CIPP mailbox rule listing | A rule that forwards, deletes, or moves messages matching finance/invoice/wire-related keywords — especially rules that move matching mail straight to an obscure folder or delete it, hiding replies from the real recipient |
| External forwarding rule | CIPP mailbox rule / forwarding configuration | Auto-forward to an external domain the organization doesn't use, often silently enabled without a visible rule in the client UI |
| BEC-pattern indicators | CIPP's BEC-focused check (e.g. `cipp__bec_check`-style tooling — confirm the exact tool name via `conduit__search_tools`) | Correlated signals CIPP flags specifically as BEC-shaped: new inbox rule plus anomalous sign-in plus external forwarding in the same session |
| Inbound phishing / impersonation alert | Connected email security vendor | A message that impersonates a vendor, executive, or the client's own domain, especially one referencing an invoice, wire transfer, or payment change |
| Reported anomaly from the client | PSA ticket / direct report | "This doesn't look like an email I sent," a client asking to confirm a wire change, or a vendor asking whether a payment-details email was legitimate |

Any one of these alone is enough to open an investigation. The combination
of an anomalous sign-in plus a new inbox/forwarding rule in the same session
is close to a confirmed BEC and should move straight to the response
sequence below rather than waiting for further corroboration.

## Immediate Response Sequence

Order matters — earlier steps stop later damage; doing them out of order
leaves gaps:

1. **Revoke active sessions.** Invalidate all refresh tokens/sessions for
   the account immediately. This is the single highest-leverage first step
   — it ends the attacker's access to the mailbox in real time, before
   anything else is touched.
2. **Audit and remove forwarding rules.** Pull every inbox rule and
   forwarding configuration for the account. Document each one found
   (rule name, condition, action, creation timestamp) before deleting —
   this becomes part of the incident timeline and may be needed for a
   fraud claim. Remove any rule that forwards, hides, or deletes mail in a
   way the legitimate user didn't set up.
3. **Clean up mailbox rules and delegate access.** Beyond forwarding rules,
   check for new mailbox delegates, new mail-flow rules at the tenant
   level (if the attacker had elevated access), and any newly created
   mailbox on the tenant that could be used to continue impersonation.
4. **Reset the password.** Only after sessions are revoked — a password
   reset alone does not invalidate a live session token.
5. **Force MFA re-enrollment.** Invalidate any MFA method the attacker may
   have registered during the compromise window (a common BEC persistence
   technique is registering an attacker-controlled authenticator app or
   phone number as a second MFA method).
6. **Check for lateral spread.** Look for the same source IP/ASN or the
   same inbox-rule pattern against other mailboxes in the tenant — BEC
   actors frequently compromise one mailbox and use it to phish others
   internally.
7. **Identify and notify affected recipients.** Determine who received
   attacker-sent mail during the compromise window — especially anything
   referencing invoices, wire instructions, or payment changes — and get
   ahead of it with a direct warning before the attacker's message gets
   acted upon. This step has the highest financial-loss-prevention value of
   the entire sequence and should not be delayed until the technical
   cleanup is finished; run it in parallel once the compromise window is
   known.

## Documenting the Incident Timeline

A BEC incident report needs a defensible, chronological record — clients
frequently need this for a cyber-insurance claim or a bank fraud dispute.
Capture, with timestamps for each:

- First anomalous sign-in (source, location if available)
- Each mailbox rule/forwarding rule created, with its exact configuration
- Each message sent or received during the compromise window that is
  relevant to the incident (especially anything with financial content)
- Containment actions taken, in the order taken, with timestamps
- Notification actions taken (who was told, when, by what channel)

For building the full client-facing report, hand this off to the
[Incident Timeline Builder](../../agents/incident-timeline-builder.md) agent
or the `/secops-pack:incident-report` command — this skill covers detection
and first response; the timeline builder assembles the complete
chronological narrative across every connected system.

## Related Skills

- [Containment Playbooks](../containment-playbooks/SKILL.md) — the general
  compromised-account playbook this skill specializes for BEC.
- [Alert Severity Normalization](../alert-severity-normalization/SKILL.md) —
  BEC indicators typically normalize to Critical or High; see the mapping
  reference for the reasoning.
