---
name: "cipp-groups"
description: "Use this skill when listing or creating M365 groups in CIPP — security groups, distribution lists, M365 groups, mail-enabled security groups. Covers tenant-scoped group enumeration and creation as part of user onboarding or access-management workflows."
when_to_use: >-
  When enumerating or creating Entra ID / M365 groups across managed tenants. Use when: cipp
  group, create group, m365 group, distribution list, security group, or group membership.
---

# CIPP Groups

Groups in CIPP cover all four Entra/M365 group types: Security, Microsoft 365 (unified), Distribution List, and Mail-Enabled Security. Most groups are managed through CIPP for delegation simplicity, but membership changes for individual users typically flow through `cipp_list_user_groups` (read) and the M365 plugin or graph-API for write operations.

## Tools

### `cipp_list_groups`

```
cipp_list_groups(tenantFilter='contoso.onmicrosoft.com')
```

Returns all groups in the tenant with `id`, `displayName`, `groupTypes`, `mailEnabled`, `securityEnabled`, and member count. Use to audit group sprawl, find candidate distribution lists for cleanup, or resolve group names to IDs.

### `cipp_create_group`

```
cipp_create_group(tenantFilter, displayName, description?,
                  groupType='Security'|'Microsoft 365'|'Distribution'|'Mail-Enabled Security',
                  mailNickname?, members?)
```

`mailNickname` is required for any mail-enabled group type. Members can be supplied at creation time as a list of UPNs or object IDs.

## Group type matrix

| Type | Mail-enabled | Use case |
|------|--------------|----------|
| Security | No | RBAC, conditional access scoping, license assignment |
| Microsoft 365 | Yes | Teams, SharePoint, shared inbox + collaboration |
| Distribution | Yes | Email distribution only, no shared workspace |
| Mail-Enabled Security | Yes | Both: mail distribution AND security scoping |

Pick **Security** for permissions-only, **Microsoft 365** for collaboration with a shared mailbox/Teams workspace, **Distribution** for plain mailing lists.

## Common patterns

**Find groups a user belongs to before offboarding**

```
groups = cipp_list_user_groups(tenantFilter, userId='leaver@contoso.com')
```

`cipp_offboard_user` with `removeFromGroups=true` handles this automatically; only do it manually when you need an explicit audit trail.

**Audit large unmanaged groups**

After `cipp_list_groups`, sort by member count and flag any with > 50 members and no `description`. These are usually historical distribution lists no one owns.

## Caveats

CIPP's group toolset is intentionally narrow — for membership changes (add/remove user), conditional access scoping, or license assignment via groups, use the M365 plugin or work directly against the Graph API. CIPP focuses on the multi-tenant CRUD surface.
