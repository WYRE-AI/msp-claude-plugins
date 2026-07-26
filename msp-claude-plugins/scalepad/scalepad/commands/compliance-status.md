---
description: Summarize a client's ControlMap compliance posture — risks, controls, evidence, action items
argument-hint: "[client]"
arguments: [client]
---

# ControlMap Compliance Status

Summarize a client's compliance posture from ControlMap: health score, open risks, control coverage, evidence gaps, and outstanding action items.

## Prerequisites

- ScalePad MCP server connected with a valid `X_SCALEPAD_API_KEY` and the correct `X_SCALEPAD_REGION` (us/eu/ca/au) for the tenant
- Optional discovery: `scalepad_navigate` with `domain: "controlmap"` lists the relevant tools
- Tools used: `scalepad_cm_health_list`, `scalepad_cm_risks_list_summaries`, `scalepad_cm_controls_list_summaries`, `scalepad_cm_evidence_list_summaries`, `scalepad_cm_action_items_search`

## Steps

1. **Health overview**

   Call `scalepad_cm_health_list` and locate the client's compliance health record.

2. **Risk register**

   Call `scalepad_cm_risks_list_summaries` for the client; highlight high-severity and unmitigated risks.

3. **Control coverage**

   Call `scalepad_cm_controls_list_summaries`; note controls that are failing or unmapped to framework objectives.

4. **Evidence gaps**

   Call `scalepad_cm_evidence_list_summaries`; flag stale or missing evidence.

5. **Outstanding work**

   Call `scalepad_cm_action_items_search` for open action items; sort by due date.

6. **Report**

   Output: health score, top risks (severity, status, mitigating controls), control pass/fail summary, evidence gaps, and an action item list with owners and due dates.

## Examples

```
/compliance-status "Acme Dental"
```

## Related Commands

- `/backup-health` - backup evidence for continuity controls
