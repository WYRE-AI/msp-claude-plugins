---
name: "huntress-incidents"
description: "Huntress incidents and the remediation lifecycle: querying incidents by organization and status, SOC-recommended remediation details, individual and bulk approve/reject, remediation execution status, and the ordering constraint that incidents resolve only after all remediations are processed."
when_to_use: >-
  When triaging, investigating, or resolving Huntress incidents, or approving and rejecting the
  remediations attached to them. Use when: huntress incident, huntress alert, incident triage,
  incident investigation, incident resolution, incident management, remediation, approve
  remediation, reject remediation, threat response, security incident, or soc recommendation.
---

# Huntress Incidents

Manage Huntress SOC-confirmed security incidents across client organizations. Query open incidents, review SOC-recommended remediations, approve or reject remediation actions, and resolve incidents once all remediations are processed.

## Anti-triggers

- **Raw detections that have not become incidents** — the pre-triage
  detection layer is signals; use `huntress-signals`.
- **SOC notifications asking the partner to act** — those are
  escalations, a separate object with its own resolve flow; use
  `huntress-escalations`.
- **Endpoint health, deployment, or coverage questions** — use
  `huntress-agents`.
- **An incident that is not a security finding** — uptime and paging
  platforms each use the word for their own object with its own
  lifecycle. Use `betterstack-incidents` for a service outage, and
  `pagerduty-incidents` or `rootly-incidents` for a paged response.
- **A mail-borne threat** — Harmony Email has no incident object at all;
  its detections are events, not cases. Use
  `checkpoint-avanan-threats`.

## API Tools

### List Incidents

Retrieve incidents filtered by organization and status.

```python
huntress_incidents_list(organization_id='org-456', status='open', page_token=None)
# Returns: {"incidents": [...], "next_page_token": "abc123" | null}
```

Each incident object contains `id`, `title`, `severity`, `status`, `organization_id`, `created_at`, `affected_hosts`, and `remediations_count`.

### Get Incident Details

```python
huntress_incidents_get(incident_id='inc-789')
# Returns: full incident with investigation details, indicators, timeline, and affected hosts
```

### List Remediations for an Incident

```python
huntress_incidents_remediations(incident_id='inc-789')
# Returns: {"remediations": [{"id": "rem-001", "type": "scheduled_task_removal", "description": "Remove malicious scheduled task 'WindowsUpdate'", "status": "pending", "host": "ACME-WS-042"}, ...]}
```

Each remediation has a `status` field: `pending`, `approved`, `rejected`, `executing`, `completed`, or `failed`.

### Get Remediation Details

```python
huntress_incidents_remediation_get(incident_id='inc-789', remediation_id='rem-001')
# Returns: single remediation with full execution details and host context
```

### Bulk Approve Remediations

```python
huntress_incidents_bulk_approve(incident_id='inc-789', remediation_ids=['rem-001', 'rem-002'])
# Returns: per-remediation success/failure status
```

### Bulk Reject Remediations

```python
huntress_incidents_bulk_reject(incident_id='inc-789', remediation_ids=['rem-003'], reason='False positive - legitimate admin tool')
# Returns: per-remediation success/failure status
```

### Resolve Incident

```python
huntress_incidents_resolve(incident_id='inc-789')
# Fails if any remediations are still pending — approve or reject all first
```

## Workflows

### Daily Incident Triage

1. Fetch open incidents: `huntress_incidents_list(status='open')`
2. Page through results if `next_page_token` is returned
3. Sort by severity (critical > high > low), then group by `organization_id`
4. For each critical incident, call `huntress_incidents_get(incident_id=...)` to review investigation details
5. Proceed to remediation review for actionable incidents

### Incident Investigation and Remediation

1. Get full details: `huntress_incidents_get(incident_id='inc-789')`
2. List remediations: `huntress_incidents_remediations(incident_id='inc-789')`
3. Review each remediation's `type`, `description`, and `host` before approving
4. Approve safe remediations or reject with a documented reason
5. Resolve: `huntress_incidents_resolve(incident_id='inc-789')`

### Bulk Remediation with Validation

Use this workflow when an incident has multiple pending remediations.

1. **List and verify**: Call `huntress_incidents_remediations(incident_id='inc-789')` and confirm all target remediations have `status: 'pending'` — skip any already processed
2. **Separate by action**: Split remediation IDs into approve and reject lists after reviewing each action
3. **Approve batch**: `huntress_incidents_bulk_approve(incident_id='inc-789', remediation_ids=['rem-001', 'rem-002'])`
4. **Check results**: Inspect the per-remediation response — some may fail (already processed, host offline). Retry or escalate failures individually
5. **Reject remaining**: `huntress_incidents_bulk_reject(incident_id='inc-789', remediation_ids=['rem-003'], reason='...')`
6. **Verify completion**: Re-fetch `huntress_incidents_remediations(incident_id='inc-789')` and confirm no remediations remain `pending` before resolving
7. **Resolve**: `huntress_incidents_resolve(incident_id='inc-789')`

## Error Handling

| Error | Cause | Recovery |
|-------|-------|----------|
| Incident not found | Invalid ID or deleted incident | Re-list incidents to get correct IDs |
| Remediation already processed | Approve/reject on non-pending remediation | Check `status` before processing; filter to `pending` only |
| Cannot resolve with pending remediations | Unprocessed remediations remain | Approve or reject all remediations first |

## Best Practices

- **Filter before fetching**: Always pass `organization_id` and `status` to `huntress_incidents_list` to reduce response size and avoid unnecessary pagination
- **Verify remediation status before bulk operations**: Re-fetch remediations and filter to `status: 'pending'` immediately before calling bulk approve/reject to avoid already-processed errors
- **Always provide rejection reasons**: The `reason` parameter on `huntress_incidents_bulk_reject` creates an audit trail — use specific, actionable reasons (e.g., "Legitimate admin tool — verified with client IT")
- **Cross-reference with escalations**: Call the escalations skill to check if related escalations exist before resolving an incident

## Reference

See [REFERENCE.md](./REFERENCE.md) for full response examples, remediation types, incident lifecycle details, and severity level descriptions.

## Related Skills

- [api-patterns](../api-patterns/SKILL.md) — Pagination and error handling
- [escalations](../escalations/SKILL.md) — Related escalations
- [agents](../agents/SKILL.md) — Affected endpoint agents
- [organizations](../organizations/SKILL.md) — Client organization context
- [signals](../signals/SKILL.md) — Underlying security signals
