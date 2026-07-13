---
description: Audit a tenant's networks, interfaces, and saved configurations; flag drift and missing backups
argument-hint: "<tenant_id>"
arguments: [tenant_id]
---

# Auvik Network Audit

Walk a tenant's networks, interfaces, and configuration backups end-to-end. The output is meant to support a renewal conversation or a quarterly health check - what does the network look like, are configurations being backed up, and is anything drifting from a known-good state.

## Prerequisites

- Tools: `auvik_networks_list`, `auvik_networks_get`, `auvik_interfaces_list`, `auvik_configurations_list`, `auvik_configurations_get`, `auvik_devices_list`, `auvik_entities_list_audits`

## Steps

1. **Enumerate networks**

   Call `auvik_networks_list` for the tenant. Note the count, the IP ranges in use, and any networks marked private vs internet. Call `auvik_networks_get` on the largest few for detail (gateway, DHCP, scan status).

2. **List interfaces**

   Call `auvik_interfaces_list` for the tenant. Bucket by interface type (ethernet, wireless, virtual, etc.) and by `adminStatus` / `operStatus`. Flag any interface that is admin-up but oper-down for more than a transient period.

3. **Audit saved configurations**

   Call `auvik_configurations_list` for the tenant. For each managed network device (router, switch, firewall, accessPoint), check:
   - Is there at least one saved configuration? Devices with zero saved configs are a backup gap - call them out.
   - When was the most recent configuration saved? Anything > 30 days old on a device that should be actively managed is stale.

4. **Spot configuration drift**

   For devices with multiple saved configurations, call `auvik_configurations_get` on the two most recent for any device that has changed in the last 7 days. Surface a one-line summary of what changed. Frequent unexpected changes on infrastructure devices warrant a conversation with the customer.

5. **Cross-reference with audit history**

   Call `auvik_entities_list_audits` on the tenant or on suspect devices to surface who or what triggered recent changes - human edits, automation, or Auvik-driven actions.

6. **Produce the audit report**

   Sections in order:
   - Tenant summary - network count, device count, interface count
   - Configuration backup coverage - devices with backups vs without, list the gaps
   - Stale backups - devices with most-recent-config older than 30 days
   - Recent configuration changes - last 7 days, who changed what
   - Flapping / down interfaces - with the owning device and last change time
   - Recommendations - explicit next actions, assigned to the customer or to the MSP

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| tenant_id | string | Yes | Tenant to audit |

## Examples

```
/auvik:network-audit tenant_id=12345
```

## Related Commands

- `/auvik:device-inventory` - For the hardware side of the audit
- `/auvik:capacity-check` - For the performance side of the audit
