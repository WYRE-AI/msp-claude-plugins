---
name: "Domotz Power Outlets"
description: >
  Domotz PDU and smart-outlet control: listing outlets and their power state,
  and the one non-GET tool the Domotz server exposes — switching an outlet
  on, off, or cycling it. Covers the confirm argument, why it is advisory,
  and the pre-flight checks that belong before a mains interruption.
when_to_use: >-
  When reading or changing the power state of an outlet on a Domotz-monitored
  PDU or smart plug. Use when: domotz power, power outlet, pdu, smart plug,
  power cycle, outlet on, outlet off, reboot via pdu, hard power cycle,
  remote power, or cut power to a device.
---

# Domotz Power Outlets

## Overview

Domotz can read and switch outlets on PDUs and smart plugs it has
discovered as devices. This is the **only** part of the Domotz MCP surface
that changes anything — every other tool the server registers is a `GET`.
It does not restart a service or reboot an operating system. It interrupts
mains power to whatever is physically plugged into that outlet.

Both tools are device-scoped: the PDU itself is a discovered device, so you
need the `agent_id` of the site and the `device_id` of the PDU before you
can address an outlet.

## Anti-triggers

- **Rebooting a managed endpoint or server gracefully** — an OS-level
  restart that flushes buffers and runs shutdown hooks is an RMM job;
  use `ncentral` or `atera`. Reach for the outlet only when the device
  is unreachable by every softer means.
- **Rebooting Meraki hardware** — the Dashboard reboots its own devices
  by serial and brings them back cleanly; use `meraki-devices`.
- **A device that is merely offline in the inventory** — offline in
  `domotz-devices` means it stopped answering scans, which is not the
  same as needing power cut. Diagnose first.
- **Anything about the outlet's own metrics** — draw, load, and SNMP
  counters on the PDU are `domotz-network`.

## Tools

| Tool | Effect | Arguments |
|------|--------|-----------|
| `domotz_power_outlets_list` | Read. Lists outlets on a PDU/smart-plug device and their current power state. | `agent_id` (number, required), `device_id` (number, required) |
| `domotz_power_outlet_control` | **Destructive.** Switches one outlet. | `agent_id` (number, required), `device_id` (number, required), `outlet_id` (number, required), `action` (`on` \| `off` \| `cycle`, required), `confirm` (boolean, required) |

`device_id` is the PDU, not the equipment plugged into it. Domotz has no
mapping from "the file server" to "the outlet the file server is plugged
into" — that association lives in your documentation, not in the API.

## The `confirm` argument is not a safety control

`domotz_power_outlet_control` refuses to run unless `confirm: true` is
passed, and the server prefixes its own description with
`DESTRUCTIVE ACTION`. Both are worth knowing about and neither is an
enforcement point:

- `confirm` is an ordinary boolean in the tool's input schema. The model
  supplies it. A model that has decided to cycle the outlet will supply
  `true` in the same call — it is a spelling requirement, not a second
  pair of eyes.
- Conduit is a non-interactive client. Vendor-side destructive hints and
  confirmation flags are advisory to it; it compares permission tiers and
  nothing else. See `wyre-gateway/GOVERNANCE.md`, *Where Conduit is the
  only enforcement point*.

Treat the real gate as the one in `GOVERNANCE.md`: a named human approver
per invocation, and never this tool for an unattended agent.

## Before any `off` or `cycle`

1. **Confirm which outlet.** Call `domotz_power_outlets_list` and read
   the outlet's own label and current state. Do not infer the outlet
   number from position or from a previous site.
2. **Confirm what is on it.** The API will not tell you. Check the
   customer's documentation, and if it is not documented, do not proceed.
3. **Confirm the site is attended, or that it does not need to be.**
   There is no confirmation that connected equipment came back — only
   that the outlet is energised again. If the device does not boot, the
   recovery is someone physically on site.
4. **Confirm the agent is online.** Check `domotz_agents_get`. A stale
   collector means the outlet state you just read may not be current.
5. **Prefer `cycle` over `off`** when the intent is a restart. An `off`
   with nobody to turn it back on strands the device; `cycle` at least
   ends in the energised state.

## Blast radius

`off` and `cycle` are mains interruptions with no undo:

- Unbuffered writes on servers and storage arrays are lost; filesystem
  and database corruption is a real outcome, not a theoretical one.
- A firewall, switch, or router on that outlet takes the whole site's
  connectivity with it — including the Domotz agent itself, which is how
  you would have observed the result.
- Cutting power to the agent's own uplink removes your ability to turn
  the outlet back on remotely.

The Domotz audit log records that the API account called the tool. It does
not record which outlet. Conduit's log records *who* called it, also
without arguments. Neither log will reconstruct what you switched, so the
ticket note is the only durable record — write it before the call, not
after.

## Common Workflows

### Read outlet state for a PDU

1. Call `domotz_devices_list` for the site and find the PDU device.
2. Call `domotz_power_outlets_list` with that `agent_id` and `device_id`.
3. Report each outlet's label and state. Stop here for anything
   read-only.

### Human-approved power cycle

1. Establish the device is unreachable by softer means and that an RMM
   restart is not available.
2. Run the pre-flight checks above.
3. Name the approver and record the site, PDU, outlet, and reason.
4. Call `domotz_power_outlet_control` with `action: "cycle"` and
   `confirm: true`.
5. Re-read with `domotz_power_outlets_list` to confirm the outlet is
   energised — and separately with `domotz_devices_get` to see whether
   the equipment actually came back. The outlet reporting `on` is not
   evidence that the device booted.

## Error Handling

### `Power control requires confirm: true`

**Cause:** `confirm` was omitted or false. The server returns this before
issuing any request.
**Solution:** Do not simply retry with `confirm: true`. This is the point
at which to check that a human approved this specific outlet.

### Outlet action returns success but the device stays offline

**Cause:** The equipment did not boot, or it is not on the outlet you
switched.
**Solution:** Re-read the outlet list; check `domotz_devices_get` for the
target device; escalate to on-site. Do not cycle repeatedly.

### 404 on the outlet path

**Cause:** The device is not a PDU, or `outlet_id` does not exist on it.
**Solution:** Re-run `domotz_power_outlets_list` for valid outlet IDs.

## Related Skills

- [devices](../devices/SKILL.md) - Finding the PDU in the device inventory
- [agents](../agents/SKILL.md) - Collector health, which gates trusting outlet state
- [network](../network/SKILL.md) - SNMP metrics from the PDU
- [api-patterns](../api-patterns/SKILL.md) - Authentication and error codes
