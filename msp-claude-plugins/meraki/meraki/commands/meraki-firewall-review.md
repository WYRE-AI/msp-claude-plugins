---
description: Review a Meraki MX network's L3, L7, inbound, and port-forwarding rules and flag overly permissive ones
argument-hint: "<network_id>"
arguments: [network_id]
---

# Meraki Firewall Review

Pull a Cisco Meraki MX network's firewall configuration — L3 outbound rules, L7 application rules, inbound rules, and port forwarding — and produce a security-focused review. Flags any/any allows, services exposed to the internet, shadowed rules, and unauditable rules. Cisco's hosted Meraki server is read-only, so this command never changes anything: each finding comes with the exact change for a human to make in the Meraki Dashboard.

## Prerequisites

- Meraki connected in Conduit (or Cisco's hosted server configured directly)
- `execute_api` available — it is admin-tier in Conduit, see `meraki-api-patterns`
- The target network contains an MX appliance

## Steps

1. **Confirm the network**

   ```
   execute_api { "capability_id": "getNetwork", "parameters": { "networkId": "<networkId>" } }
   ```

   Check that `productTypes` includes `appliance`; if not, stop and say so. If `isBoundToConfigTemplate` is true, the rules come from the template, and any fix belongs on the template rather than the network.

2. **Fetch the rulesets**

   ```
   execute_api { "capability_id": "getNetworkApplianceFirewallL3FirewallRules", "parameters": { "networkId": "<networkId>" } }
   execute_api { "capability_id": "getNetworkApplianceFirewallL7FirewallRules", "parameters": { "networkId": "<networkId>" } }
   execute_api { "capability_id": "getNetworkApplianceFirewallInboundFirewallRules", "parameters": { "networkId": "<networkId>" } }
   execute_api { "capability_id": "getNetworkApplianceFirewallPortForwardingRules", "parameters": { "networkId": "<networkId>" } }
   ```

   If the site uses 1:1 NAT, `getNetworkApplianceFirewallOneToOneNatRules` shows those inbound exposures as well.

3. **Walk the L3 outbound rules in order**

   Capture each rule's index, `policy`, `protocol`, `srcCidr`, `srcPort`, `destCidr`, `destPort`, `comment`, and `syslogEnabled`. Values such as `Any` may be capitalized; compare case-insensitively. Rules evaluate top to bottom and the first match wins. The ruleset ends in the built-in default allow (usually listed last as `Default rule`), which is expected and not a finding on its own.

4. **Flag issues**

   | Severity | Finding |
   |----------|---------|
   | Critical | A port forward with `allowedIps` including `any` whose `localPort` or `publicPort` is a sensitive service — RDP 3389, SSH 22, SMB 445, Telnet 23, databases 1433/3306/5432. This publishes the service to the whole internet; a remapped public port does not hide it. |
   | High | An inbound rule with `policy: allow` from a `srcCidr` of any to a sensitive port. |
   | High | An explicit L3 any/any allow (protocol, source, and destination all any) placed above deny rules — every deny below it is dead. |
   | Medium | A port forward with `allowedIps` of `any` on a non-sensitive port; confirm it is intended and restrict sources where possible. |
   | Medium | Shadowed rules — a broad allow above a narrower deny that it fully covers. |
   | Medium | Outbound SMB 445 or Telnet 23 to the internet is never denied, so the default allow lets it out. |
   | Low | Rules with no `comment` — unlabeled rules cannot be audited later. |
   | Low | `syslogEnabled` false on deny rules, which hides blocked traffic. |
   | Info | L7 rules are deny-only on the MX; list what is blocked. An empty L7 ruleset is a posture note, not a vulnerability. |

   Most findings have a plausible reason — a forward to a mail or VPN server is often deliberate — so state what the rule allows and let the reader judge intent.

5. **Write recommendations**

   For each finding give the exact Dashboard change (Security & SD-WAN > Configure > Firewall, or the template for template-bound networks): which rule, by index and comment, to narrow, reorder, comment, or remove, and the replacement values. Keep rule order in mind — a new deny only works if it sits above the allow it is meant to block.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| network_id | string | Yes | The MX network ID (e.g. `L_123456789012345678`) |

## Output

- **Ruleset tables** — L3 rules in evaluation order (policy, protocol, source, destination, ports, comment, logging); inbound rules; port forwards (name, protocol, public port, LAN IP and local port, allowed IPs); L7 blocks
- **Findings** — grouped by severity, each with ruleset, rule index or name, the issue, and the risk
- **Recommendations** — ordered, specific Dashboard edits for a human to apply

## Examples

### Review a network's firewall

```
/meraki-firewall-review L_123456789012345678
```

## Error Handling

- **Network has no appliance:** `productTypes` lacks `appliance`; the firewall capabilities will return nothing useful
- **404:** The network ID is wrong or the key cannot see it — find it with `getOrganizationNetworks`
- **Permission error (403):** The Dashboard admin behind the API key lacks access to this network's org
- **Authentication error (401):** The Dashboard API key in Conduit is invalid or revoked — reconnect Meraki in Conduit

## Related Commands

- `/meraki-network-health` - Full org/site health sweep
- `/meraki-find-device` - Locate a device across the org
