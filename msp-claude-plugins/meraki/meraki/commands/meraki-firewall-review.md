---
name: meraki-firewall-review
description: Pull and summarize a Meraki network's L3 firewall rules and flag overly-permissive (any/any allow) rules
arguments:
  - name: network_id
    description: The MX network whose L3 firewall rules to review
    required: true
---

# Meraki Firewall Review

Pull a Cisco Meraki MX network's Layer 3 outbound firewall ruleset and produce a security-focused summary. Flags overly-permissive rules -- especially any/any allows -- along with sensitive-port exposure, missing comments, and shadowed rules. This command is **read-only**; it never writes changes.

## Prerequisites

- Meraki MCP server connected with a valid Dashboard API key
- The target network has an MX appliance (product type `appliance`)
- MCP tool `meraki_appliance_firewall_l3_get` available

## Steps

1. **Fetch the current ruleset**

   Call `meraki_appliance_firewall_l3_get` with `network_id`. This returns the ordered outbound rule list. Rules are evaluated top-to-bottom, first match wins, with an implicit default-allow at the bottom.

2. **Walk the rules in order**

   For each rule capture its index, `policy`, `protocol`, `srcCidr`/`srcPort`, `destCidr`/`destPort`, `comment`, and `syslogEnabled`.

3. **Flag issues**

   - **Any/any allow** -- `policy: allow` with `protocol: any`, `srcCidr: any`, `destCidr: any`, `destPort: any` sitting above the default. Highest priority: this permits everything.
   - **Sensitive-port exposure** -- allow rules to `3389` (RDP), `22` (SSH), `445` (SMB), `23` (Telnet), `3306`/`1433`/`5432` (databases) from `any` source.
   - **Missing comments** -- unlabeled rules are unauditable.
   - **Logging gaps** -- `syslogEnabled: false` on deny rules reduces visibility.
   - **Shadowed rules** -- a broad allow above a more specific deny means the deny never fires.

4. **Summarize**

   Present a table of all rules in evaluation order, then a findings section grouping the flags by severity with the rule index, the issue, and the risk. Recommend specific remediations but do not apply them.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| network_id | string | Yes | The MX network ID (e.g. `L_123456789012345678`) |

## Output

- **Ruleset table** -- every rule in evaluation order with policy, protocol, source, destination, ports, comment, logging
- **Findings** -- flagged rules grouped by severity (any/any allow first), each with index, issue, and risk
- **Recommendations** -- specific, ordered suggestions (tighten scope, add comments, enable logging, reorder)

## Examples

### Review a network's firewall

```
/meraki-firewall-review --network_id "L_123456789012345678"
```

## Error Handling

- **Empty or 404 response:** The network has no MX appliance or the network ID is wrong -- confirm the network's product types include `appliance`
- **Authentication Error (401):** Verify `MERAKI_API_KEY` and Dashboard API access
- **Permission Error (403):** The API key's account lacks access to this network's org
- **Rate Limit (429):** Honor `Retry-After`

## Notes

This command only reads rules. To change them, use `meraki_appliance_firewall_l3_update`, which **replaces the entire ruleset** -- always re-fetch, diff, and confirm before writing (see the `security-appliance` skill).

## Related Commands

- `/meraki-network-health` - Full org/site health sweep
- `/meraki-find-device` - Locate a device across the org
