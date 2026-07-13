---
description: Single-tenant Auvik snapshot - devices, alerts, networks, billing usage
argument-hint: "<tenant_id>"
arguments: [tenant_id]
---

# Auvik Tenant Overview

Produce a one-page snapshot for a single Auvik-monitored client. Designed as the first command an analyst runs when picking up a ticket for an unfamiliar tenant - establishes scale, health, and current pain in under a screen of output.

## Prerequisites

- Tools: `auvik_tenants_get`, `auvik_tenants_detail`, `auvik_devices_list`, `auvik_alerts_list`, `auvik_networks_list`, `auvik_billing_client_usage`, `auvik_billing_device_usage`

## Steps

1. **Tenant header**

   Call `auvik_tenants_get` and `auvik_tenants_detail` for descriptive metadata - name, status, region, contact, contract type if exposed.

2. **Device count and breakdown**

   Call `auvik_devices_list` with a high page size and accumulate. Report total device count and the top device-type buckets (router, switch, firewall, accessPoint, server, workstation, printer, other).

3. **Open alert count**

   Call `auvik_alerts_list` with `status=open`. Report counts per severity (emergency / critical / warning / info). Highlight if any emergency or critical alerts are open.

4. **Network footprint**

   Call `auvik_networks_list`. Report network count and whether scans are healthy (any networks in error or unscanned state).

5. **Billing usage**

   Call `auvik_billing_client_usage` for the tenant for the current billing period and `auvik_billing_device_usage` for the breakdown. Report the billable device count and any growth vs the previous period if available.

6. **Output format**

   A compact card-style report:

   ```
   Tenant: <name>           Region: <region>     Status: <status>
   Devices: <N>  (routers <a>, switches <b>, firewalls <c>, APs <d>, servers <e>, ...)
   Networks: <N>            Open alerts: emergency <e> / critical <c> / warning <w> / info <i>
   Billable devices: <N>    Period: <YYYY-MM>
   ```

   Below the card, a 3-5 bullet "what to look at next" list referencing the relevant deeper commands (`/auvik:alert-triage`, `/auvik:device-inventory`, `/auvik:network-audit`, `/auvik:capacity-check`).

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| tenant_id | string | Yes | Tenant to summarize |

## Examples

```
/auvik:tenant-overview tenant_id=12345
```

## Related Commands

- `/auvik:alert-triage` - Drill into open alerts
- `/auvik:device-inventory` - Drill into the device list
- `/auvik:network-audit` - Drill into configurations and topology
- `/auvik:capacity-check` - Drill into interface utilization
