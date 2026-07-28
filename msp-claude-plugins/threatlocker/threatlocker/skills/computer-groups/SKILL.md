---
name: "ThreatLocker Computer Groups"
description: >
  ThreatLocker computer groups — the policy-scoping boundary that determines which
  allow/deny rules apply to which endpoints. Covers listing groups, mapping a computer
  to its group, and the difference between the dropdown and full list endpoints.
when_to_use: >-
  When scoping policies, mapping computers to groups, choosing a target group for new
  endpoints, or auditing global vs org-specific group usage. Use when: threatlocker
  computer group, threatlocker policy scope, threatlocker group dropdown, threatlocker
  groups list, threatlocker ostype, assign computer group, or threatlocker policy
  targeting.
---

# ThreatLocker Computer Groups

Computer groups are the policy-scoping unit in ThreatLocker. Policies
are applied at the group level, never at the individual computer level.
A computer must belong to exactly one group, and moving a computer
between groups changes which policy set applies to it. Groups can be
**global** (visible across all child organizations) or **org-specific**.

## API Tools

### List Computer Groups (Full)

```
threatlocker_computer_groups_list
```

Full list with metadata — group name, ID, OS type, parent org,
computer count, and policy associations. Use this for audits and
reports.

### List Computer Groups (Dropdown)

```
threatlocker_computer_groups_dropdown
```

Slim list intended for selection UIs — typically just `id`, `name`, and
`osType`. Use this when you only need to map an ID to a name or pick a
target group for a move.

### Why two endpoints?

The full list is heavier and includes counts and metadata that requires
more lookups server-side. The dropdown returns immediately and is the
right choice when you are about to issue another call (move, assign)
and just need the IDs.

## Key Concepts

### `osType` Enum

| Value | Meaning |
|-------|---------|
| 0 | All / Any |
| 1 | Windows |
| 2 | macOS |
| 3 | Linux |

A group's `osType` constrains which computers can be assigned to it —
you cannot put a Mac into a Windows-only group.

### Global vs Org-Specific Groups

- **Global groups** are defined at the partner level and inherited by
  all child organizations. Useful for fleet-wide baselines (e.g.
  "All Windows Servers").
- **Org-specific groups** live inside a single child org. Most
  client-specific policy customization lives here.

The full list endpoint exposes the parent organization on each row, so
you can filter or group by it.

## Common Workflows

### Mapping Computer → Group

The `threatlocker_computers_list` response includes
`computerGroupId` and `computerGroupName` directly, so a separate
call is usually unnecessary. When you have a stale ID and need the
current name, use `threatlocker_computer_groups_dropdown` to resolve.

### Auditing Group Hygiene

1. List all groups with `threatlocker_computer_groups_list`.
2. Flag groups with zero computers (likely dead or deprecated).
3. Flag groups with extreme computer counts (oversized — policy
   changes there will have wide blast radius).
4. Flag groups whose `osType` does not match the OS distribution of
   the computers actually assigned to it (misclassified group).

### Choosing a Target Group for a New Endpoint

1. Pull dropdown groups with `threatlocker_computer_groups_dropdown`.
2. Filter to the matching `osType` for the new computer.
3. Filter to the appropriate organization scope.
4. Pick the group whose policy posture matches the endpoint's role
   (workstation, server, kiosk, etc.).

### Identifying Global vs Org-Specific

1. Use the full list endpoint and inspect the parent organization on
   each row.
2. Groups with the partner organization as parent are global.
3. Groups whose parent matches a child org ID are org-specific to that
   child.

## Edge Cases

- **Empty groups** — Some groups exist for future use. Don't auto-flag
  every empty group as a problem; cross-reference recent policy edits
  before recommending deletion.
- **OS-mismatch surprises** — A computer's reported `operatingSystem`
  string is normalized into the `osType` enum at assignment time.
  Edge OS strings (Windows IoT, macOS preview builds) sometimes land
  in the wrong bucket.
- **Dropdown vs full** — Don't try to compute counts from the dropdown
  — it does not return computer counts. Use the full list for that.

## Best Practices

- Use the dropdown for any "pick a group" workflow; only call the full
  list when you genuinely need metadata or counts.
- When scoping a policy change, list the group's computers first and
  estimate impact before recommending the change.
- Keep group naming consistent across organizations — analysts triage
  faster when "Workstations - Standard" means the same thing
  everywhere.

## Related Skills

- [api-patterns](../api-patterns/SKILL.md) — Auth and pagination
- [computers](../computers/SKILL.md) — Computers within groups
- [organizations](../organizations/SKILL.md) — Org scope for groups
