---
name: "Meraki Security Appliance"
description: >
  Cisco Meraki MX security appliance review through the hosted Meraki MCP:
  L3, L7 and inbound firewall rules, port forwarding and 1:1 / 1:many NAT,
  firewalled services, organization-wide policy rulesets, site-to-site VPN
  status, VPN firewall rules, third-party peers, threat protection and
  security events, and SSID L3 firewall rules. Changes are produced as an
  exact proposed ruleset diff for a human to apply.
when_to_use: >-
  When reviewing or auditing a Meraki MX -- firewall rules, NAT and port forwards, exposed
  services, site-to-site VPN health, IDS/IPS and malware events -- or when a firewall change is
  requested and needs to be written up for a human. Use when: meraki firewall, meraki mx, l3
  firewall, l7 firewall, port forwarding, 1:1 nat, firewall review, firewall audit, meraki vpn,
  site-to-site vpn, autovpn, vpn down, security events, ids, intrusion, ssid firewall, or
  security appliance.
---

# Meraki Security Appliance (MX)

## Overview

The Meraki MX is a cloud-managed security appliance combining routing, stateful firewall, NAT, SD-WAN and Auto VPN. Its policy is spread across several rule lists, each read with its own capability through `execute_api`. Tool schemas and pagination are in `meraki-api-patterns`.

The hosted server is read-only, so firewall, NAT and VPN changes cannot be made from here. A change request becomes the exact proposed ruleset, with a diff against the current one, for a human to apply in the Dashboard.

## Anti-triggers

- **A firewall that is not a Meraki MX** -- a Fortinet, SonicWall or Palo Alto ruleset is not reachable from this plugin; `auvik-devices` can identify the firewall but not read its policy.
- **A tunnel that is down because the appliance or its WAN is down** -- check the MX and its uplinks first with `meraki-troubleshooting`.
- **Locating a device or client** -- use `meraki-devices`, or the client search in `meraki-troubleshooting`.

## Where MX Policy Lives

Firewall capabilities take `networkId` for an MX network; find those with `getOrganizationNetworks` and keep networks whose `productTypes` include `appliance`. VPN and org-wide rules take `organizationId`.

| What | `capability_id` | Dashboard location |
|------|-----------------|--------------------|
| L3 outbound rules | `getNetworkApplianceFirewallL3FirewallRules` | Security & SD-WAN > Configure > Firewall > Outbound rules |
| L7 application rules | `getNetworkApplianceFirewallL7FirewallRules` | Security & SD-WAN > Configure > Firewall > Layer 7 |
| Inbound rules | `getNetworkApplianceFirewallInboundFirewallRules` | Security & SD-WAN > Configure > Firewall > Inbound rules |
| Port forwarding | `getNetworkApplianceFirewallPortForwardingRules` | Security & SD-WAN > Configure > Firewall > Forwarding rules |
| 1:1 NAT | `getNetworkApplianceFirewallOneToOneNatRules` | Security & SD-WAN > Configure > Firewall > Forwarding rules |
| 1:many NAT | `getNetworkApplianceFirewallOneToManyNatRules` | Security & SD-WAN > Configure > Firewall > Forwarding rules |
| Services on the MX itself | `getNetworkApplianceFirewallFirewalledServices` | Security & SD-WAN > Configure > Firewall > Security appliance services |
| Org-wide policy rulesets | `getOrganizationPoliciesGlobalFirewallRulesets`, `getOrganizationPoliciesGlobalFirewallRulesetsRules` | Organization-wide policies |
| Site-to-site VPN firewall | `getOrganizationApplianceVpnVpnFirewallRules` | Security & SD-WAN > Configure > Site-to-site VPN |
| VPN mode and exported subnets | `getNetworkApplianceVpnSiteToSiteVpn` | Security & SD-WAN > Configure > Site-to-site VPN |
| Third-party VPN peers | `getOrganizationApplianceVpnThirdPartyVPNPeers` | Security & SD-WAN > Configure > Site-to-site VPN |
| IDS/IPS and malware settings | `getNetworkApplianceSecurityIntrusion`, `getNetworkApplianceSecurityMalware` | Security & SD-WAN > Configure > Threat protection |
| Content filtering | `getNetworkApplianceContentFiltering` | Security & SD-WAN > Configure > Content filtering |
| SSID L3 rules | `getNetworkWirelessSsidFirewallL3FirewallRules` (`networkId` and SSID `number`, 0-14) | Wireless > Configure > Firewall & traffic shaping |

```
execute_api { "capability_id": "getNetworkApplianceFirewallL3FirewallRules", "parameters": { "networkId": "<networkId>" } }
```

## Rule Models

### L3 outbound

An ordered list evaluated top to bottom; the first match wins. It governs traffic leaving a VLAN, both to the internet and between VLANs. Traffic over site-to-site VPN is governed by the VPN firewall instead.

| Field | Values |
|-------|--------|
| `policy` | `allow` / `deny` |
| `protocol` | `tcp`, `udp`, `icmp`, `icmp6`, `any` |
| `srcCidr` / `destCidr` | CIDR list, `any`, or a VLAN or object reference (FQDNs allowed as destination) |
| `srcPort` / `destPort` | port, range or `any` |
| `comment` | free text |
| `syslogEnabled` | log matches to syslog |

The last rule returned is the built-in default allow (comment "Default rule"). It cannot be removed, so a deny posture needs an explicit deny above it.

```json
{ "rules": [
  { "comment": "Block outbound SMB", "policy": "deny", "protocol": "tcp", "srcCidr": "any", "srcPort": "any", "destCidr": "any", "destPort": "445", "syslogEnabled": true },
  { "comment": "Default rule", "policy": "allow", "protocol": "any", "srcCidr": "any", "srcPort": "any", "destCidr": "any", "destPort": "any" }
] }
```

### The other lists

- **Inbound rules and the site-to-site VPN firewall** use the same ordered rule shape as L3 outbound.
- **L7 rules** are deny-only. Each rule has a `type` (`application`, `applicationCategory`, `host`, `port`, `ipRange`) and a `value`.
- **Port forwarding** rules map a `publicPort` on an uplink to a `lanIp` and `localPort`; `allowedIps` restricts who can reach it, and `["any"]` means the whole internet.
- **1:1 NAT** rules map a `publicIp` to a `lanIp`; each rule's `allowedInbound` entries list the protocol, destination ports and `allowedIps` admitted.
- **Firewalled services** control access to the MX's own services (ICMP ping, web/local status page, SNMP); each has an `access` of `blocked`, `restricted` (only `allowedIps`) or `unrestricted`.
- **Org-wide policy rulesets** may also apply to the network. If any exist, include them in the review and confirm in the Dashboard how they combine with the network's own rules before drawing conclusions.

## Rule Review Checklist

Read every list for the network before judging any one of them, then flag:

1. **Any/any allow** above the default rule -- `allow`, protocol `any`, source and destination `any`. It makes every rule below it dead.
2. **Shadowed rules** -- a broad allow above a narrower deny, so the deny never matches.
3. **Broad inbound exposure** -- inbound rules, port forwards or 1:1 NAT `allowedInbound` entries with `allowedIps` of `any`.
4. **Management ports exposed** -- forwards or inbound allows to 22 (SSH), 23 (Telnet), 3389 (RDP), 5900 (VNC), 445 (SMB), 161 (SNMP), 1433/3306 (databases) or a device's web admin port.
5. **MX services wide open** -- web or SNMP set to `unrestricted` in firewalled services.
6. **Flat segmentation** -- no L3 rules separating guest, IoT or camera VLANs from corporate subnets.
7. **Lateral movement over VPN** -- a VPN firewall left at its default allow while guest or IoT subnets are exported into Auto VPN (check the subnet list from `getNetworkApplianceVpnSiteToSiteVpn`).
8. **Guest SSIDs reaching the LAN** -- in the SSID L3 rules, the "Local LAN" rule set to `allow` on a guest SSID.
9. **Threat protection off** -- intrusion `mode` of `disabled` or detection-only, or malware protection disabled.
10. **Unlabelled rules and silent denies** -- rules without a `comment`, and security-relevant denies with `syslogEnabled` false.

Report each finding with the list, the rule position, the rule as written, the risk and the recommended change.

## Site-to-Site VPN Health

Meraki Auto VPN builds IPsec tunnels between MXs in the same org. Each MX is a `hub`, a `spoke` or not participating (`getNetworkApplianceVpnSiteToSiteVpn` shows its mode, hubs and exported subnets).

1. `getOrganizationApplianceVpnStatuses` (`perPage` up to 300; filter with `networkIds`) returns, per network, `networkName`, `deviceStatus`, `uplinks`, and `merakiVpnPeers[]` and `thirdPartyVpnPeers[]` each with a `reachability`.
2. Check `deviceStatus` first. If the local MX is offline every tunnel reads down, and the problem is the appliance or its WAN (`meraki-troubleshooting`), not VPN configuration.
3. Flag any peer that is not reachable. A spoke that cannot reach its hub is cut off from the mesh.
4. `getOrganizationApplianceVpnStats` with a `timespan` (default 1 day, max 31 days) gives per-peer latency, loss and jitter history for unstable tunnels.
5. For third-party peers, compare the configured peers in `getOrganizationApplianceVpnThirdPartyVPNPeers` with what the remote side expects; mismatched subnets or IKE settings must be fixed on one side by a human.

```
execute_api { "capability_id": "getOrganizationApplianceVpnStatuses", "parameters": { "organizationId": "<orgId>", "perPage": 100 } }
```

## Security Events

`getOrganizationApplianceSecurityEvents` (org-wide) or `getNetworkApplianceSecurityEvents` (one network) return IDS/IPS and malware events. They default to the last 31 days in ascending order, so pass `sortOrder: "descending"`, a `timespan` and a `perPage` to see the newest first. For a single client, use `getNetworkApplianceClientSecurityEvents` with `networkId` and `clientId`.

```
execute_api { "capability_id": "getNetworkApplianceSecurityEvents", "parameters": { "networkId": "<networkId>", "timespan": 604800, "sortOrder": "descending", "perPage": 100 } }
```

Group events by signature or file and by client before reporting; a single infected host often produces most of the volume.

## Proposing a Firewall Change

1. Read the complete current list (and any related lists, e.g. port forwarding when tightening inbound access).
2. Write the complete proposed ordered list, not just the new rule -- position decides behaviour.
3. Show a diff and explain what each changed line allows or blocks.
4. Name the network, its ID and the Dashboard location for the human to apply it.
5. After the human confirms it is applied, read the list again and confirm it matches.

```
Network: Branch-12 (L_123456789012345678)
Dashboard: Security & SD-WAN > Configure > Firewall > Outbound rules

  #  Policy  Proto  Source          Dest           Dst port  Comment
  1  deny    tcp    any             any            445       Block outbound SMB
- 2  allow   any    any             any            any       temp allow all
+ 2  deny    tcp    10.20.0.0/24    10.10.0.0/16   3389      Guest VLAN cannot RDP to corp
     (default rule unchanged: allow any to any)
```

## Error Handling

| Symptom | Likely cause | What to do |
|---------|--------------|------------|
| Error or empty result for a firewall capability | The network has no MX, or the ID is wrong | Check the network's `productTypes` include `appliance` |
| All VPN peers unreachable | Local MX offline or WAN failed | Diagnose the appliance first with `meraki-troubleshooting` |
| SSID firewall capability fails | Missing or invalid SSID `number` | List SSIDs with `getNetworkWirelessSsids` and use the `number` field |

## Related Skills

- `meraki-api-patterns` -- tool schemas, pagination, Conduit access tiers
- `meraki-devices` -- MX inventory and availability
- `meraki-troubleshooting` -- uplink loss and latency, outages, client lookup
