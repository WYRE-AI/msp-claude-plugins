---
name: "N-central Organizations"
when_to_use: >-
  When navigating the N-central service organization / customer / site hierarchy, working with org
  units, registration tokens, or org- and device-level custom properties. Use when: ncentral
  customer, ncentral site, ncentral service organization, ncentral org unit, ncentral hierarchy,
  ncentral registration token, ncentral custom property, or ncentral custom properties.
description: >
  Use this skill when working with N-central org units — the service
  organization → customer → site hierarchy, the org-unit vs customer
  distinction, agent registration tokens (credential-sensitive), and
  custom properties at both org and device level.
---

# N-central Organizations

N-central models the MSP's world as a three-level hierarchy of **org
units**. Almost every other object — devices, active issues, tasks, custom
properties, access groups — is scoped to an org unit, so getting the
hierarchy right is the first step of any workflow.

## The Hierarchy

```
Service Organization (SO)          — the MSP itself (usually one)
└── Customer                       — a client company
    └── Site                       — a client location (optional level)
```

| Tool | Use For |
|------|---------|
| `ncentral_list_service_orgs` | Top-level SOs |
| `ncentral_list_customers` / `ncentral_get_customer` | Client companies |
| `ncentral_list_sites` / `ncentral_get_site` | Locations under customers |
| `ncentral_list_org_units` / `ncentral_get_org_unit` | Type-agnostic view of all three levels |
| `ncentral_list_org_unit_children` | Direct children of any org unit |
| `ncentral_get_registration_token` | Agent install token for an org unit |

## Org Units vs Customers

"Org unit" is the umbrella type: an org unit's `orgUnitType` is `SO`,
`CUSTOMER`, or `SITE`, and every one has an `orgUnitId` in the same ID
space. The typed tools (`ncentral_list_customers`, `ncentral_list_sites`)
are convenience views over that same data.

Practical rules:

- When a tool takes an `orgUnitId` (device listings, active issues,
  custom properties), any level's ID is syntactically valid — but
  semantics differ. Devices live at customer/site level; an SO-level
  query may aggregate or reject depending on the endpoint.
- **Active issues can only be listed for customers and sites**, not for
  the SO. Sweep customers in a loop rather than querying the SO.
- Use `ncentral_list_org_unit_children` to walk the tree top-down when
  building a full map (SO → customers → sites).
- Names are not unique across the tree; always carry the `orgUnitId`
  through a workflow rather than re-resolving by name.

## Registration Tokens — Treat Like Credentials

`ncentral_get_registration_token` returns the token embedded in agent
installers for that org unit. **Anyone holding it can register a device
into the customer's environment** — treat it exactly like a password:

- Only fetch it when the user explicitly needs it (agent deployment).
- Never write it to files, tickets, or chat logs; paste it directly to the
  user and say nothing more.
- Tokens expire and can be regenerated in the UI; if one leaks, tell the
  user to rotate it there.

## Custom Properties

Custom properties are typed key/value fields attached at two levels:

| Level | Tools |
|-------|-------|
| Org unit | `ncentral_list_org_custom_properties`, `ncentral_get_org_custom_property`, `ncentral_update_org_custom_property` |
| Device | `ncentral_list_device_custom_properties`, `ncentral_get_device_custom_property`, `ncentral_update_device_custom_property` |

MSPs use them as the glue layer: PSA company IDs, billing codes, patch
rings, backup policies, onboarding status. Patterns that matter:

- Properties are *defined* at the SO or customer level and *valued* per
  org unit or device — a property can exist but be empty for a given
  target. Empty is a finding, not an error.
- Updates (`ncentral_update_*_custom_property`) overwrite the value with
  no history. Echo the current value before writing and confirm bulk
  updates with the user.
- Automation policies and filters in N-central often key off custom
  property values — changing one can silently change which policies apply
  to a device. Mention this when updating properties that look
  policy-related (e.g. "Patch Ring", "Maintenance Group").
- Property IDs are stable per server; property *names* are what humans
  know. List first, resolve name → `propertyId`, then get/update.

## Best Practices

- Cache the org tree (IDs + names) at the start of a multi-customer
  workflow instead of re-listing per step.
- For "across all customers" questions, iterate customers explicitly and
  aggregate — report per-customer, then the rollup.
- When the user says "customer X", resolve by name via
  `ncentral_list_customers` and confirm if more than one match.

## Related Skills

- [api-patterns](../api-patterns/SKILL.md) - auth, pagination, preview endpoints
- [devices](../devices/SKILL.md) - device listings scoped by org unit
- [monitoring-tasks](../monitoring-tasks/SKILL.md) - per-customer active-issue sweeps
