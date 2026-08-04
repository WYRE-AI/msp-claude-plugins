---
name: "Evidence Mapping"
description: >
  Tracing a compliance control (CIS, SOC 2, HIPAA, or a cyber-insurance
  questionnaire line item) to concrete, retrievable tool evidence: which vendor
  family can observe what — CIPP for live M365/Entra configuration, Liongard
  for point-in-time infrastructure state, IT Glue/Hudu for documentation — a
  representative control-to-tool-call map, and the evidentiary weights that
  separate Configured from Documented, Contradicted, and Unable to Verify.
when_to_use: >-
  When mapping a named control or questionnaire line item to live tool evidence, when
  deciding whether a piece of evidence proves configuration or only proves
  documentation, or when assembling a source-cited evidence package for an audit. Use
  when: compliance evidence, control evidence, evidence mapping, map this control, what
  proves this control, audit evidence, evidence source, is this control met, documented
  vs enforced, policy vs configuration.
---

# Evidence Mapping

## Overview

Every compliance framework and every cyber-insurance questionnaire ultimately reduces to the same operation: take a control statement in English ("MFA is enforced for all users," "access to PHI systems is logged," "endpoint detection and response is deployed fleet-wide") and produce evidence that either supports or contradicts it. The failure mode this skill exists to prevent is answering from a policy document, a vendor's marketing claim, or a technician's recollection when a live tool query would give a verifiable answer. If a tool can answer it, pull the tool. If no connected tool can answer it, say so explicitly — never fill the gap with an assumption.

Evidence in an MSP's toolchain comes from three vendor families, each proving a different kind of thing:

- **CIPP** (M365 / Entra ID) proves *live tenant configuration* — what is actually turned on, enforced, and assigned right now in the identity and productivity plane.
- **Liongard** proves *live infrastructure state* — what an automated inspection observed on a server, network device, or cloud resource at last inspection time.
- **IT Glue / Hudu** proves *what is documented* — the policy, procedure, or configuration record an engineer wrote down. This may or may not match reality.

Treat these as different evidentiary weights, not interchangeable sources.

## Anti-triggers

- **ControlMap's own control library and evidence store** — ScalePad already
  models risks, controls, evidence, policies, and framework objectives per
  client; use `scalepad-controlmap` when working inside that product. This
  skill maps a control statement onto live queries across whatever happens
  to be connected.
- **Reading a single evidence source** — pulling standards results,
  inspection state, or a document is that connector's surface; use
  `cipp-standards`, `liongard-systems`, or `it-glue-documents`.

## Key Concept: Configured vs. Documented Evidence

This is the single most important judgment call in evidence mapping, and getting it wrong is what turns an evidence package into a liability during an actual audit.

- **Configured evidence** (highest weight) — a live query against the system of record shows the control is active right now. Example: `cipp__list_mfa_users` returns per-user MFA registration state, or `cipp__list_conditional_access_policies` shows a policy requiring MFA scoped to "All users." This is evidence the control is *met*.
- **Documented evidence** (lower weight, different claim) — IT Glue/Hudu has a document titled "MFA Policy" stating MFA is required for all users. This is evidence the control is *written down as policy*. It says nothing about whether the policy is actually enforced anywhere. A written MFA policy with no corresponding conditional access policy is a paper control, not a met control.
- **Contradicted** — configured evidence directly conflicts with documented evidence (e.g., the policy document says MFA is required, but `cipp__list_mfa_users` shows 40% of users unregistered). This is the most actionable finding of all — surface it prominently, never average it away.

When assembling an evidence package, always label each piece of evidence with which of these three states it represents. Never let a documentation hit stand in for a configuration check when a configuration check is possible. If only documentation is available (no connector exists for the underlying system), say the control is "documented, unverified" — not "met."

## Control-to-Evidence Map (representative examples)

| Control (typical phrasing) | Vendor family | Tool calls | Evidence type |
|---|---|---|---|
| MFA enforced for all users | CIPP | `cipp__list_mfa_users`, `cipp__list_conditional_access_policies` | Configured |
| Conditional access restricts legacy auth / risky sign-in | CIPP | `cipp__list_conditional_access_policies`, `cipp__list_named_locations` | Configured |
| Tenant meets baseline security standards (CIS-aligned) | CIPP | `cipp__list_standards`, `cipp__run_standards_check`, `cipp__list_bpa` | Configured |
| Email authentication (SPF/DKIM/DMARC) configured | CIPP | `cipp__list_domain_health` | Configured |
| Privileged/admin access is scoped and reviewed | CIPP | `cipp__list_gdap_roles`, `cipp__list_groups`, `cipp__list_users` | Configured |
| Access and admin activity is logged | CIPP | `cipp__list_audit_logs`, `cipp__list_logs` | Configured |
| Server/network baseline configuration is known and current | Liongard | `liongard__systems_list`, `liongard__inspections_run`, `liongard__environments_get` | Configured (point-in-time) |
| Device and identity inventory is current | Liongard | `liongard__inventory_devices`, `liongard__inventory_identities` | Configured |
| A named policy/procedure exists (IR plan, access policy, patch policy) | IT Glue / Hudu | `itglue__search_documents`, `itglue__get_document` | Documented |
| Configuration item is recorded with current state | IT Glue | `itglue__search_configurations`, `itglue__get_configuration` | Documented (should be cross-checked against Liongard/CIPP if both exist) |
| Credential storage/rotation practice exists | IT Glue | `itglue__search_passwords` (existence and metadata only — never surface secret contents) | Documented |

This table is representative, not exhaustive — the same pattern (resolve the control's subject matter to the vendor family that can observe it, then pick configured evidence over documented evidence whenever both are possible) applies to any control not listed here.

## Handling an Unconnected Vendor Family

A given client will rarely have every vendor family connected. When a vendor family needed for a control is not connected in Conduit (confirm via `conduit__search_tools`), the control is neither "met" nor "failed" — it is **unable to verify**. Report it as such, name the specific vendor family that would resolve it, and move on. Never substitute a documented-evidence hit for a missing configured-evidence source without flagging the substitution explicitly.

## Common Workflows

1. **Single-control lookup**: parse the control statement → identify subject matter (identity, infra, documentation) → identify vendor family → confirm connector present via `conduit__search_tools` → call the specific tool(s) → classify result as Configured / Documented / Contradicted / Unable to Verify.
2. **Bulk control-set mapping** (used by the evidence-packager agent): iterate a framework's control list, apply the single-control lookup per item, and roll results into a source-cited table.
3. **Cross-checking documentation against configuration**: when both IT Glue and CIPP/Liongard have relevant records, always run the configuration check and compare — this is where drift and contradictions surface (see the `standards-drift` skill for the deeper pattern).

## Error Handling

- If a tool call returns empty results, do not infer the control is unmet — an empty MFA list could mean zero users have MFA, or it could mean the query scope was wrong. Re-verify scope (tenant ID, client mapping) before recording a Fail.
- If `conduit__search_tools` shows no compliance-relevant connector for a control's subject matter, record Unable to Verify and name the missing connector type (e.g., "no EDR connector available for this client").
- Never fabricate a plausible-sounding tool name. If unsure whether a tool exists, call `conduit__search_tools` to confirm before referencing it in output.

## Related Skills

- [Standards Drift](../standards-drift/SKILL.md) — what to do when configured evidence no longer matches a previously accepted baseline.
- [Insurance Questionnaires](../insurance-questionnaires/SKILL.md) — applies this same mapping discipline to the standard cyber-insurance question set.
