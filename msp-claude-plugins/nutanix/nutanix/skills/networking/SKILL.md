---
name: "Nutanix Networking"
description: >
  The Nutanix networking read surface: `networking_execute` for AHV
  network configuration (subnets, VPCs, vSwitch, BGP — coverage varies
  by artifact set, down to a minimal capabilities/AWS-VPC slice) and
  `microseg_execute` for Flow Network Security policies, service groups,
  and address groups.
when_to_use: >-
  When inspecting Nutanix network configuration or Flow security
  policies. Use when: nutanix network, nutanix subnet, nutanix vpc,
  ahv networking, flow network security, microsegmentation nutanix,
  microseg, service group nutanix, or address group nutanix.
---

# Nutanix Networking

## Overview

Two namespaces cover networking. `networking` is AHV network
configuration: subnets, VPCs, virtual switches, BGP, and hybrid-cloud
(AWS VPC/subnet) visibility. `microseg` is Flow Network Security:
east-west security policies between VMs, defined over service groups
(port/protocol sets) and address groups (IP ranges).

**Coverage warning:** the `networking` namespace varies more than any
other with the artifact set the server loaded. The upstream default
artifact set carries as few as 3 GET-only operations (networking
capabilities, AWS VPCs, AWS subnets), while a PC-fetched artifact set
can expose the fuller subnet/VPC/vSwitch surface. Run
`listOperations(namespace="networking")` and report what is actually
there before promising subnet-level detail.

## Key Concepts

| Concept | Namespace | Notes |
|---------|-----------|-------|
| Subnet | `networking` | VLAN-backed or overlay; VM NICs attach to subnets |
| VPC | `networking` | Overlay network container for Flow Virtual Networking |
| Security policy | `microseg` | Allow/deny rules between VM groups, usually category-scoped |
| Service group | `microseg` | Named set of ports/protocols referenced by policies |
| Address group | `microseg` | Named set of IPs/ranges referenced by policies |

## Common Workflows

### Network inventory

1. `listOperations(namespace="networking")` to see the loaded surface.
2. If subnet/VPC operations are present: `networking_execute` to list
   subnets and VPCs, joining VM NIC attachments from the `vmm`
   namespace when mapping which workloads sit where.
3. If only the minimal slice is present, report capabilities and any
   AWS VPC/subnet visibility, and say plainly that subnet-level detail
   is not exposed by this deployment.

### Flow policy review

1. Discover list operations in `microseg`.
2. `microseg_execute` to list security policies, then service groups
   and address groups they reference.
3. Report policy mode (monitor vs enforce where the entity carries it),
   scope, and any policies referencing empty or overly-broad address
   groups.

## Read-only boundary

Creating or modifying subnets, VPCs, or Flow policies is non-GET and
blocked by read-only mode. A microsegmentation review therefore ends in
recommendations, not applied policy changes.

## Gotchas

- **Do not diagnose an absent operation as an outage.** A thin
  `networking` surface is an artifact-set property, not a Prism
  Central failure.
- **Flow requires licensing.** An absent `microseg_execute` tool
  usually means Flow Network Security is not enabled on the connected
  PC.
- **Policies reference categories.** Category definitions live in the
  `prism` namespace; resolving a policy's scope may take a `prism`
  lookup.

## Related Skills

- [api-patterns](../api-patterns/SKILL.md) — discovery workflow, OData, read-only mode
- [vm-management](../vm-management/SKILL.md) — VM NIC attachments to subnets
