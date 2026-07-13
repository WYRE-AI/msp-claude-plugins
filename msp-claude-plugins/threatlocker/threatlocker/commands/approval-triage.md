---
description: Triage pending ThreatLocker approval requests with approve/deny recommendations
argument-hint: "[organization_id] [limit]"
arguments: [organization_id, limit]
---

# ThreatLocker Approval Triage

Triage pending ThreatLocker application approval requests across the managed fleet. This is the killer daily workflow for MSP SOC analysts working ThreatLocker tenants - surface what's waiting, group it logically, and recommend approve/deny based on signer reputation and request context.

## Prerequisites

- ThreatLocker MCP server connected with a valid `THREATLOCKER_API_KEY`
- Tools available: `threatlocker_approvals_pending_count`, `threatlocker_approvals_list`, `threatlocker_approvals_get`

## Steps

1. **Get the pending count first**

   Call `threatlocker_approvals_pending_count` (optionally scoped via `organization_id`). Use this as a sanity check on volume before pulling the full list - if there are hundreds, recommend the analyst narrow scope before continuing.

2. **List pending approvals**

   Call `threatlocker_approvals_list` with `status=Pending`, paginating up to `limit`. Include `organization_id` if provided.

3. **Group by application / computer**

   Aggregate by application name + file hash. Multiple requests for the same hash from many endpoints almost always resolve as a single approve-once decision. Note the affected computer count per group.

4. **Classify each group**

   Split into two buckets:

   - **High confidence (auto-approve candidates):** signed by well-known publisher (Microsoft, Adobe, Google, Citrix, etc.), known good hash, common business app
   - **Needs review:** unsigned, novel/uncommon hash, unusual install path (`%TEMP%`, `%APPDATA%`), unfamiliar publisher, request justification missing or suspicious

5. **Surface the key fields per request**

   For each approval (or representative request per group): requester user, computer name, application name, file path, file hash, signer, and the requester's justification text.

6. **Recommend a disposition**

   For each group provide approve / deny / investigate with one-line reasoning. Call out anything that looks like a phishing dropper, LOLBin abuse, or remote-access tool installed outside policy.

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| organization_id | string | No | primary org | Scope to a child organization (MSP usage) |
| limit | integer | No | 100 | Max pending requests to fetch |

## Examples

### Triage all pending approvals

```
/approval-triage
```

### Triage approvals for a specific child org

```
/approval-triage --organization_id "org-abc-123"
```

## Related Commands

- `/audit-investigation` - Investigate the actions around a suspicious approval request
- `/tenant-overview` - See pending counts across all child orgs first
