---
description: Triage open Auvik alerts, rank by severity, and recommend dismissals for known noise
argument-hint: "[tenant_id] [severity]"
arguments: [tenant_id, severity]
---

# Auvik Alert Triage

Run the daily Auvik alert queue: pull what's open, rank it, recommend dismissals for confirmed noise, and surface the alerts that need human action. Designed for MSP NOC analysts working a multi-tenant queue.

## Prerequisites

- Tools: `auvik_alerts_list`, `auvik_alerts_get`, `auvik_alerts_dismiss`, `auvik_devices_get`, `auvik_tenants_list`

## Steps

1. **List open alerts**

   Call `auvik_alerts_list` with `status=open` (and `tenant_id` if scoped). Filter to severity >= the requested minimum (default `warning`). Paginate to completion.

2. **Bucket by severity**

   Order: `emergency`, `critical`, `warning`, `info`. Within each bucket, group by `alertName` and `entityType` - duplicate alerts on the same device usually collapse to a single decision.

3. **Pull full details for the top of the queue**

   For each of the top 20 alerts (or all emergency/critical alerts, whichever is larger), call `auvik_alerts_get` to retrieve the full record - description, detected time, dispatch reason, and the referenced entity ID.

4. **Resolve the entity for context**

   For alerts referencing a device, call `auvik_devices_get` on the entity to retrieve `deviceName`, `deviceType`, and `manageStatus`. Unmanaged devices with critical alerts are usually false-positives from Auvik discovery, not real incidents.

5. **Classify each alert**

   Into one of:
   - **Action required** - confirmed real condition on a managed device (down switch, saturated interface, failed config backup, etc.)
   - **Investigate** - the entity context is ambiguous - device recently changed, alert is new pattern, signal quality unclear
   - **Dismiss (noise)** - known false-positive pattern: link flap on user-port access switches, scheduled reboot windows, transient SNMP timeouts, alerts on `manageStatus = unmanaged` devices

6. **Recommend dismissals - do not dismiss automatically**

   Surface the dismiss candidates as a list with one-line justifications and the `auvik_alerts_dismiss` call you would make. Wait for the user to confirm before dismissing. Dismissal acknowledges and hides - it does not fix - so a real condition that's still active will re-alert anyway.

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| tenant_id | string | No | all | Scope to a single tenant |
| severity | string | No | warning | Minimum severity filter |

## Examples

```
/auvik:alert-triage
```

```
/auvik:alert-triage tenant_id=12345 severity=critical
```

## Related Commands

- `/auvik:tenant-overview` - To see alert counts per tenant before drilling in
- `/auvik:capacity-check` - When a wave of saturation alerts comes in
