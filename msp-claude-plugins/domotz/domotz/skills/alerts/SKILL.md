---
name: "Domotz Alert Profiles"
description: >
  Domotz alerting configuration: what an alert profile defines, the two
  tools that read profiles and their per-device bindings, monitoring
  coverage audits, and the important limit — this server exposes alert
  configuration only, never fired alerts.
when_to_use: >-
  When reviewing Domotz alert profile configuration or auditing which devices
  are covered by which profile. Use when: domotz alert profile, alert
  configuration, alert coverage, monitoring coverage, alert binding, which
  devices are alerting on, or domotz notification setup.
---

# Domotz Alert Profiles

## Overview

Domotz alert profiles define what conditions the platform watches and where
it sends notifications when they trigger. This skill covers reading that
configuration and auditing coverage across a site.

## What this server does NOT expose

**There is no tool that returns a fired alert.** The Domotz MCP server
registers exactly two alert tools, and both describe configuration:
`domotz_alerts_profiles_list` (what profiles exist) and
`domotz_alerts_device_list` (which profiles are bound to one device).

Neither returns an alert instance, an alert ID, a severity, a timestamp,
or an active/resolved state. There is no alert feed, no alert history, and
no way to ask "what is alerting right now" through this integration.

That is a limit worth stating rather than working around, because the
obvious workaround is wrong in a specific way. You can approximate current
site health from `domotz_devices_list` status plus `domotz_devices_history`
and `domotz_devices_uptime` — but that is *device state*, not *alert
state*. It will not tell you what Domotz notified on, whether anyone
acknowledged it, or whether a profile was even bound to that device. Do not
present a device-status roll-up as an alert report. If the question is
genuinely "what did Domotz alert on", the answer comes from the Domotz
portal or the notification channel, not from here.

## Anti-triggers

- **A live alert feed or triage queue** — not available here at all, see
  above. Incident queues with acknowledgement and escalation are
  `betterstack-incidents`, `pagerduty-incidents`, or `rootly-incidents`.
- **A security detection** — Domotz alerts are availability and
  threshold conditions, never threat findings; use `huntress-incidents`.
- **The same condition seen across every client** — if the question
  spans tenants rather than one site, use `auvik-alerts`.
- **Changing a profile** — every Domotz tool here is read-only. Profiles
  are created and edited in the Domotz portal.

## Key Concepts

### Alert Profiles

A profile bundles a trigger condition with a notification target and a
scope. Profiles are defined once at the account level and then bound to
the devices they should watch, which is why coverage is a two-step
question: what profiles exist, and what is each device bound to.

Typical conditions Domotz profiles cover include device online/offline
transitions, SNMP threshold breaches, and new-device discovery. The exact
set available depends on the Domotz plan and how the profile was built in
the portal — read the profile rather than assuming.

### Bindings

`domotz_alerts_device_list` answers the per-device half: given an
`agent_id` and `device_id`, which profiles apply. A device with no
bindings is monitored for inventory purposes but will generate no
notifications, which is the coverage gap most audits are looking for.

## Tools

| Tool | Description | Arguments |
|------|-------------|-----------|
| `domotz_alerts_profiles_list` | Every alert profile configured on the account | *(none)* |
| `domotz_alerts_device_list` | Alert profile bindings for one device | `agent_id`, `device_id` |

`domotz_alerts_profiles_list` takes no arguments — it is account-wide, not
per-agent, and cannot be filtered server-side. Both are read-only.

## Common Workflows

### Monitoring coverage audit for a site

1. Call `domotz_alerts_profiles_list` to establish what profiles exist.
2. Call `domotz_devices_list` for the agent.
3. For each device that matters — infrastructure first — call
   `domotz_alerts_device_list`.
4. Flag devices with no bindings, and devices whose only binding is a
   profile that does not cover their failure mode.
5. Recommend profile changes; they are made in the Domotz portal, not
   through this integration.

Step 3 is one call per device with no batch form, so scope the audit to
the devices worth auditing rather than the whole census.

### Verifying a specific device is watched

1. Call `domotz_alerts_device_list` with the device's `agent_id` and
   `device_id`.
2. An empty result means no profile is bound — the device is discovered
   and inventoried but silent on failure.
3. Cross-reference against `domotz_alerts_profiles_list` to identify
   which existing profile should cover it.

### Answering "is anything wrong at this site right now"

This is not an alert question against this server — it is a device-state
question. Use `domotz_devices_list` for current ONLINE/OFFLINE status,
`domotz_devices_history` for recent transitions, and
`domotz_network_ip_conflicts` for addressing faults. Say explicitly that
the answer is derived from device state and does not reflect what Domotz
alerted on.

## Error Handling

### Empty profile list

**Cause:** No profiles configured on the account, or the credential's
scope does not include them.
**Solution:** Verify in the Domotz portal. An empty list means nothing is
being notified on, which is itself the finding.

### Empty binding list for a device

**Cause:** Usually genuine — no profile is bound. Occasionally the wrong
`agent_id`/`device_id` pair.
**Solution:** Confirm the pair against `domotz_devices_list` before
reporting a coverage gap.

### Asked for an alert ID or alert severity

**Cause:** The request assumes a fired-alert surface that does not exist.
**Solution:** Say so plainly and offer the coverage audit or the
device-state view instead. Do not synthesise alert records from device
status.

## Best Practices

- Audit coverage on infrastructure first — switches, routers, firewalls,
  PDUs — where an unnoticed failure takes the site with it
- Treat "no bindings" as the default failure mode, not an edge case
- Never report device status as alert status
- Re-audit after a site adds devices; new discoveries are not
  automatically bound to a profile

## Related Skills

- [api-patterns](../api-patterns/SKILL.md) - Authentication, tool catalog, error codes
- [agents](../agents/SKILL.md) - Collector health
- [devices](../devices/SKILL.md) - Device status and history
- [network](../network/SKILL.md) - SNMP metrics behind threshold conditions
- [power](../power/SKILL.md) - PDU outlet control
