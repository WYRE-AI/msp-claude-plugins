---
name: "ScalePad ControlMap"
description: >
  ScalePad ControlMap per-client compliance management: risk registers, control
  libraries, evidence collection, policies and procedures, framework objectives,
  assessments, and remediation action items across regions us, eu, ca, and au.
when_to_use: >-
  When managing compliance in ControlMap — risks, controls, evidence, policies,
  procedures, governance, framework objectives, assessments, or compliance action items.
  Use when: controlmap, scalepad compliance, scalepad risks, scalepad controls, scalepad
  evidence, scalepad policies.
---

# ScalePad ControlMap (Compliance)

## Overview

ControlMap is ScalePad's compliance product: per-client risk
registers, control libraries mapped to framework objectives, evidence
collection, policies/procedures/governance documents, assessments,
and action items. Regional: set `X-ScalePad-Region` to `us` (default),
`eu`, `ca`, or `au` to match the tenant's data residency. Discover
this domain's tools with `scalepad_navigate` (domain `controlmap`).
Search endpoints are
POST with filter bodies upstream — the tools accept normal filter
arguments.

## Anti-triggers

- **Assessments and action items on a vCIO roadmap** — Lifecycle
  Manager has identically named objects under `scalepad_lm_*`. An LM
  assessment scores a client's IT maturity for a QBR; a ControlMap
  assessment answers a framework questionnaire. Use
  `scalepad-lifecycle-manager` for the roadmap side.
- **A misconfigured tenant setting rather than a control** —
  "conditional access is off", "MFA is not enforced" is a
  configuration baseline, not a framework control. Use `cipp`
  (`cipp-standards`), `inforcer`
  (`inforcer-baseline-alignment`), or `m365-security`.
- **Vendor-agnostic evidence-mapping and questionnaire workflow** — the
  cross-platform method lives in the `compliance-pack`
  (`evidence-mapping`, `insurance-questionnaires`); this skill is the
  ControlMap tool calls behind it.
- **Backup evidence** — proving backups run is `scalepad-backup-radar`
  or the `backup-pack`; attach the result here as evidence afterwards.

## API Tools (~100; the high-value subset)

### Health & Reports

| Tool | Purpose |
|------|---------|
| `scalepad_cm_health_list` / `scalepad_cm_health_get` | Compliance health per client |
| `scalepad_cm_reports_list` / `scalepad_cm_reports_get_signed_url` | Generated reports and signed download URLs |

### Risks

| Tool | Purpose |
|------|---------|
| `scalepad_cm_risks_search` / `scalepad_cm_risks_get` / `scalepad_cm_risks_list_summaries` | Find and inspect risks |
| `scalepad_cm_risks_create` / `scalepad_cm_risks_update` / `scalepad_cm_risks_delete` | Risk CRUD (delete is irreversible) |
| `scalepad_cm_risks_map` / `scalepad_cm_risks_unmap` | Map risks to controls/objectives |
| `scalepad_cm_risks_get_category` / `scalepad_cm_risks_list_departments` | Risk taxonomy |

### Controls & Frameworks

| Tool | Purpose |
|------|---------|
| `scalepad_cm_controls_search` / `scalepad_cm_controls_get` / `scalepad_cm_controls_list_summaries` | Find and inspect controls |
| `scalepad_cm_controls_create` / `scalepad_cm_controls_update` / `scalepad_cm_controls_delete` | Control CRUD |
| `scalepad_cm_controls_map` / `scalepad_cm_controls_unmap` | Map controls to framework objectives |
| `scalepad_cm_controls_list_sets` / `scalepad_cm_controls_list_families` | Control sets and families |
| `scalepad_cm_objectives_search` / `scalepad_cm_objectives_get` / `scalepad_cm_objectives_list_summaries` | Framework objectives (read-only) |

### Evidence & Documents

| Tool | Purpose |
|------|---------|
| `scalepad_cm_evidence_search` / `scalepad_cm_evidence_get` / `scalepad_cm_evidence_list_summaries` | Find evidence |
| `scalepad_cm_evidence_create` / `scalepad_cm_evidence_update` / `scalepad_cm_evidence_delete` | Evidence CRUD |
| `scalepad_cm_evidence_requests_create` / `scalepad_cm_evidence_requests_upload_document` / `scalepad_cm_evidence_requests_create_link` | Evidence requests (multipart up to 10 MB, or signed URLs) |
| `scalepad_cm_evidence_map` / `scalepad_cm_evidence_unmap` | Map evidence to controls |
| `scalepad_cm_documents_get_signed_url` / `scalepad_cm_documents_delete` | Document access and removal |

### Policies, Procedures & Governance

| Tool | Purpose |
|------|---------|
| `scalepad_cm_policies_search` / `scalepad_cm_policies_create` / `scalepad_cm_policies_update` / `scalepad_cm_policies_delete` | Policy CRUD |
| `scalepad_cm_policies_upsert_section` / `scalepad_cm_policies_delete_section` | Policy section editing |
| `scalepad_cm_procedures_*` | Procedure CRUD + mapping (same verbs as policies) |
| `scalepad_cm_governance_*` | Governance document CRUD + mapping |

### Assessments & Action Items

| Tool | Purpose |
|------|---------|
| `scalepad_cm_assessments_list_summaries` / `scalepad_cm_assessments_search_questions` | Assessment surface |
| `scalepad_cm_assessments_save_answer` / `scalepad_cm_assessments_clear_answer` | Answer questions |
| `scalepad_cm_assessments_create_response` / `scalepad_cm_assessments_update_response` / `scalepad_cm_assessments_delete_response` | Response CRUD |
| `scalepad_cm_action_items_search` / `scalepad_cm_action_items_create` / `scalepad_cm_action_items_update` / `scalepad_cm_action_items_delete` | Remediation action items |
| `scalepad_cm_action_items_upload_document` / `scalepad_cm_action_items_generate_signed_urls` | Action item attachments |

## Common Workflows

1. **Compliance posture check** — `scalepad_cm_health_list`, then
   `scalepad_cm_risks_list_summaries` and
   `scalepad_cm_controls_list_summaries` for the weak spots.
2. **Evidence chase** — `scalepad_cm_evidence_search` for stale or
   missing evidence, then `scalepad_cm_evidence_requests_create` to
   request updates from the client.
3. **Risk remediation** — `scalepad_cm_risks_search` for high
   severity, `scalepad_cm_action_items_create` for each remediation,
   `scalepad_cm_risks_map` to link mitigating controls.

## Error Handling

402 means no active ControlMap subscription. A 404 on a known-good ID
usually means the wrong region — verify `X-ScalePad-Region` matches
the tenant. Deletes are irreversible.

## Best Practices

- Always confirm the region before a write; ControlMap data is
  region-partitioned (us/eu/ca/au).
- Prefer `*_list_summaries` tools for dashboards — they are cheaper
  than full search + get loops.
- Use signed-URL tools for documents instead of re-uploading.

## Related Skills

- [api-patterns](../api-patterns/SKILL.md) - auth, regions, errors
- [lifecycle-manager](../lifecycle-manager/SKILL.md) - roadmap the remediation work
