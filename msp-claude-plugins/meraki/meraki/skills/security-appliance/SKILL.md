---
name: "Meraki Security Appliance"
description: >
  Cisco Meraki MX security appliance: the L3 outbound firewall rule model
  and the full-ruleset replacement semantics of
  meraki_appliance_firewall_l3_update, plus Auto VPN site-to-site peer
  status via meraki_appliance_vpn_status_get.
when_to_use: >-
  When working with the Meraki MX appliance -- reviewing/updating L3 firewall rules and checking
  site-to-site VPN status. Use when: meraki firewall, meraki mx, l3 firewall, firewall rules,
  meraki vpn, site-to-site vpn, autovpn, security appliance, firewall review, or vpn status.
---

# Meraki Security Appliance (MX)

## Overview

The Meraki **MX** is a cloud-managed security appliance combining routing, stateful firewall, SD-WAN, and Auto VPN. This skill covers the two curated MX capabilities: reviewing and updating the **Layer 3 outbound firewall** ruleset, and checking **site-to-site VPN** status. Firewall changes are high-impact -- the update tool replaces the entire ruleset, so read before you write.

## Anti-triggers

- **A firewall that is not a Meraki MX** — these rules are MX L3
  outbound only. A Fortinet, SonicWall, or Palo Alto ruleset is not
  reachable from this plugin at all; `auvik-devices` can tell you what
  the firewall is, not change it.
- **Inbound port forwarding, content filtering, or L7 rules** — the
  curated tools cover the L3 outbound list alone; everything else on
  the MX goes through `meraki_raw_request`, documented in
  `meraki-api-patterns`.
- **Client VPN or a remote-access VPN user** —
  `meraki_appliance_vpn_status_get` reports site-to-site Auto VPN peers
  only.
- **A tunnel that is down because the appliance is** — check the MX and
  its uplinks before diagnosing VPN config; use
  `meraki-troubleshooting`.

## L3 Outbound Firewall

### Rule Model

MX L3 outbound rules are an **ordered list** evaluated top-to-bottom; the first match wins. Each rule has:

| Field | Values | Notes |
|-------|--------|-------|
| `policy` | `allow` / `deny` | Action on match |
| `protocol` | `tcp` / `udp` / `icmp` / `icmp6` / `any` | Layer 4 protocol |
| `srcCidr` | CIDR / `any` / VLAN object | Source network |
| `srcPort` | port / range / `any` | Source port(s) |
| `destCidr` | CIDR / `any` / FQDN | Destination network |
| `destPort` | port / range / `any` | Destination port(s) |
| `comment` | free text | Human label -- always populate |
| `syslogEnabled` | bool | Log matches to syslog |

There is always an implicit **default allow** rule at the bottom of the outbound list. Rules you configure sit above it.

### Get Current Rules

```
meraki_appliance_firewall_l3_get
```

Parameters:
- `network_id` -- The MX network (required)

**Example response:**

```json
{
  "rules": [
    {
      "comment": "Block outbound SMB to internet",
      "policy": "deny",
      "protocol": "tcp",
      "srcCidr": "any",
      "srcPort": "any",
      "destCidr": "any",
      "destPort": "445",
      "syslogEnabled": true
    },
    {
      "comment": "Default rule",
      "policy": "allow",
      "protocol": "any",
      "srcCidr": "any",
      "srcPort": "any",
      "destCidr": "any",
      "destPort": "any"
    }
  ]
}
```

### Update Rules (High-Impact)

```
meraki_appliance_firewall_l3_update
```

Parameters:
- `network_id` -- The MX network (required)
- `rules` -- The **complete** ordered ruleset (required)

> **CRITICAL:** The update **replaces the entire ruleset**. It is not additive. Any existing rule you omit is deleted. Always:
> 1. `meraki_appliance_firewall_l3_get` to fetch the current rules
> 2. Modify the list in place (add/remove/reorder)
> 3. Send the full modified list back
> 4. Do not include the implicit default rule unless the Dashboard shows it as editable
>
> A mistake here can cut off a site's internet or open it up. Present a clear before/after diff and require explicit user confirmation before writing.

### Reviewing for Overly-Permissive Rules

Flag rules that weaken the security posture:

- **Any/any allow** above the default -- `policy: allow`, `protocol: any`, `srcCidr: any`, `destCidr: any`, `destPort: any`. This is effectively "allow everything" and usually redundant or dangerous.
- **Broad inbound-equivalent exposure** -- allow rules to sensitive destination ports (`3389` RDP, `22` SSH, `445` SMB, `23` Telnet) from `any` source.
- **Missing comments** -- unlabeled rules are unauditable; flag them for documentation.
- **Disabled logging on deny rules** -- `syslogEnabled: false` on security-relevant denies reduces visibility.
- **Shadowed rules** -- a broad allow above a more specific deny means the deny never matches.

## Site-to-Site VPN Status

### Auto VPN Model

Meraki **Auto VPN** builds IPsec tunnels between MX appliances in the same org automatically. An MX participates as a `hub` or `spoke` (or is `disabled`). The status endpoint reports peer connectivity and export/import of subnets.

### Get VPN Status

```
meraki_appliance_vpn_status_get
```

Parameters:
- `network_id` -- The MX network (required)

**Example response:**

```json
{
  "networkId": "L_123456789012345678",
  "networkName": "HQ",
  "deviceStatus": "online",
  "vpnMode": "hub",
  "exportedSubnets": [
    { "subnet": "192.168.1.0/24", "name": "HQ LAN" }
  ],
  "merakiVpnPeers": [
    { "networkId": "L_222", "networkName": "Branch-A", "reachability": "reachable" },
    { "networkId": "L_333", "networkName": "Branch-B", "reachability": "unreachable" }
  ],
  "thirdPartyVpnPeers": []
}
```

### Interpreting VPN Status

- `reachability: unreachable` on a peer means the tunnel is down -- the two sites cannot route the exported subnets between them.
- A `spoke` that cannot reach its `hub` is isolated from the VPN mesh.
- Check `deviceStatus` first -- if the local MX is `offline`, every tunnel will read down and the real problem is the appliance/uplink, not VPN config.

## Common Workflows

### Firewall Rule Audit

1. Call `meraki_appliance_firewall_l3_get` for the network
2. Walk the ordered list; flag any/any allows, sensitive-port exposure, unlabeled and shadowed rules
3. Summarize findings with the rule index, the issue, and the risk
4. Recommend specific changes -- do **not** write unless asked and confirmed

### Safe Firewall Change

1. `meraki_appliance_firewall_l3_get` and show the current rules
2. Propose the exact new ordered list with a before/after diff
3. Get explicit user confirmation
4. `meraki_appliance_firewall_l3_update` with the full modified ruleset
5. Re-`get` to verify the change landed as intended

### VPN Health Check

1. Call `meraki_appliance_vpn_status_get` per MX network (or sweep across networks)
2. Confirm `deviceStatus` is `online` before trusting peer reachability
3. Flag any peer with `reachability: unreachable`
4. For hubs, confirm all expected spokes are reachable; for spokes, confirm the hub is reachable

## Error Handling

### 400 on Firewall Update

**Cause:** Malformed rule (bad CIDR, invalid port range, unknown protocol) or missing required field
**Solution:** Validate each rule against the schema; re-`get` to compare against a known-good shape

### Empty / 404 Firewall or VPN Response

**Cause:** The network has no MX appliance, or the network ID is wrong
**Solution:** Confirm the network's product types include `appliance`; verify the network ID

### VPN Shows All Peers Down

**Cause:** The local MX is offline or its uplink failed -- not necessarily a VPN misconfiguration
**Solution:** Check device and uplink status (see the troubleshooting skill) before diagnosing VPN config

## Best Practices

- Always `get` the current firewall ruleset before any `update` -- the update replaces everything
- Present a before/after diff and require explicit confirmation for firewall changes
- Keep every rule commented so the ruleset stays auditable
- Flag any/any allows and sensitive-port exposure during reviews
- Enable syslog on security-relevant deny rules for visibility
- Verify MX `deviceStatus` is online before interpreting VPN peer reachability
- Treat firewall and VPN changes as change-controlled, high-impact operations

## Related Skills

- [api-patterns](../api-patterns/SKILL.md) - Auth, read-only model, rate limiting
- [devices](../devices/SKILL.md) - MX device status and uplinks
- [troubleshooting](../troubleshooting/SKILL.md) - Uplink and connectivity live tools
