---
name: "Cyber Insurance Questionnaires"
description: >
  Use this skill when drafting answers to a cyber-insurance renewal or new-business
  questionnaire for an MSP client. Covers the standard recurring question set (MFA
  everywhere, EDR deployed, backups tested, incident response plan documented,
  employee security training) and how to answer each type by pulling live evidence
  from connected tools rather than guessing, plus how to flag questions that cannot
  be answered with current tool coverage instead of submitting an unverified answer.
when_to_use: >-
  When answering or drafting responses to a cyber-insurance questionnaire, renewal
  application, or underwriter security questionnaire for a client. Use when: insurance
  questionnaire, cyber insurance form, security questionnaire, underwriter questions,
  insurance renewal, fill out insurance application, cyber policy renewal, what's our
  MFA coverage for insurance.
---

# Cyber Insurance Questionnaires

## Overview

Cyber-insurance underwriters ask a fairly repetitive set of questions across carriers, because the same handful of controls (MFA, EDR, backup integrity, incident response readiness, security awareness training) drive the overwhelming majority of claims. The recurring failure mode in how these get answered is not malice — it's that whoever fills out the form is often answering from general impression ("yeah, we've got MFA everywhere") rather than a live query, and a policy gets bound or renewed on an answer that turns out to be wrong when a claim is filed. A wrong answer on a bound policy can be grounds for denial of a claim. This skill exists to replace impression-based answers with tool-verified ones, and to make "we can't verify this" a normal, expected answer rather than something to paper over.

## The Standard Question Set and How to Answer Each

### "Is multi-factor authentication enforced for all users, including privileged/admin accounts?"

Pull `cipp__list_mfa_users` for per-user registration/enforcement state and `cipp__list_conditional_access_policies` for policy-level enforcement (conditional access scoped to "All users" is a stronger answer than per-user MFA alone — say which mechanism is in place). Cross-check privileged accounts specifically via `cipp__list_gdap_roles` / admin role assignments — underwriters increasingly ask about admin/privileged accounts as a distinct sub-question. Answer with the actual coverage percentage and any known exceptions (service accounts, break-glass accounts), not a flat yes/no.

### "Is Endpoint Detection and Response (EDR) deployed across all endpoints?"

Pull agent/device counts from whichever EDR/MDR connector is present (Huntress, SentinelOne, RocketCyber, or similar — check via `conduit__search_tools`). Compare deployment count against the client's known device inventory (RMM device count, or Liongard `liongard__inventory_devices` if RMM isn't connected) to state coverage as a fraction, not just "yes, deployed." A vendor being "connected" is not the same as 100% of endpoints having an active agent — report the actual ratio.

### "Are backups tested via periodic restore tests, and are backups isolated/immutable?"

This is the hardest question in the standard set to answer with high confidence from this pack's core grounding (CIPP/Liongard/IT Glue), because backup platforms are not always gateway-connected as a distinct vendor. Approach in this order: (1) check `conduit__search_tools` for a connected backup or RMM-integrated backup tool and pull job/test-restore history directly if one exists; (2) if Liongard has an inspector configured against the client's backup platform, `liongard__systems_list` / `liongard__inspections_run` may surface job status as part of its general system inspection — check before assuming it's unavailable; (3) fall back to IT Glue/Hudu documentation (`itglue__search_documents` for a backup/DR runbook or test-restore log) — but label this as documented evidence only, not verified testing, per the evidence-mapping skill's configured-vs-documented distinction. If none of these resolve it, flag the question as unable to verify and recommend the MSP confirm manually before the form is submitted.

### "Is there a documented and tested incident response plan?"

Two sub-claims here, answer them separately. "Documented": search IT Glue/Hudu for an incident response plan document (`itglue__search_documents`) — if found, cite it with last-updated date (a plan last touched three years ago is a weaker answer than one updated this year, say so). "Tested": this pack has no direct evidence source for tabletop exercises or IR drills unless they're logged as a document or PSA ticket — treat "tested" as unable to verify unless explicit evidence exists, and do not infer testing from the plan's mere existence.

### "Do employees receive regular security awareness training, including phishing simulations?"

There is no security-awareness-training vendor connector grounded in this pack's core tool surface (CIPP/Liongard/IT Glue do not carry this data). Check `conduit__search_tools` in case a training platform is connected for this client; if not, this question should be flagged as unable to verify from tool evidence, with a note to check IT Glue for a training-program document as documented-only evidence, and a recommendation that the MSP confirm the current state directly with whatever training platform (if any) is actually in use.

## General Answering Discipline

- Every answer falls into one of three buckets: **evidence-backed** (cite the tool call and the actual data), **documented-only** (cite the document, label explicitly as unverified configuration), or **unable to verify** (name the missing connector or data source). Never produce a plain "Yes" or "No" without one of these three labels attached.
- Underwriters penalize vague answers less than they penalize answers that turn out to be false during a claim investigation. When coverage is partial, say the actual percentage — "MFA enforced for 94% of users; 3 service accounts and 2 legacy accounts excluded" is a better and more defensible answer than "Yes."
- Never round a partial answer up to a clean "Yes" to make the form look better. That is the single most common way an MSP client ends up with a denied claim.

## Common Workflows

1. Confirm connected tools via `conduit__search_tools` before starting, so gaps are known up front rather than discovered mid-draft.
2. Walk the standard question set above in order, pulling live evidence per question.
3. Draft each answer with its evidence label (evidence-backed / documented-only / unable to verify) and the underlying citation.
4. Produce a short "cannot answer with current tool coverage" list at the end, separate from the drafted answers, so the MSP knows exactly what to verify manually or what connector would close the gap.

## Related Skills

- [Evidence Mapping](../evidence-mapping/SKILL.md) — the configured-vs-documented distinction underpinning every answer here.
- [Standards Drift](../standards-drift/SKILL.md) — if a control has drifted since the last check, that changes how confidently a questionnaire answer can be given.
