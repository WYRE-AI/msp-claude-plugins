---
name: "Nutanix Storage"
description: >
  The Nutanix storage read surface across four namespaces: `storage_execute`
  for storage containers and volume groups, `volumes_execute` for iSCSI /
  NVMe-TCP volume group attachment state, `objects_execute` for the
  S3-compatible object store, and `files_execute` for virtual file servers
  and NFS/SMB shares — capacity, configuration, and attachment queries.
when_to_use: >-
  When inspecting Nutanix storage capacity or configuration. Use when:
  nutanix storage, storage container, volume group, iscsi nutanix,
  nutanix files, nfs smb share nutanix, nutanix objects, object store,
  or storage usage nutanix.
---

# Nutanix Storage

## Overview

Storage on Nutanix spans four namespaces, each with its own executor:

- `storage` — storage containers and volume groups on clusters; the
  primary surface for capacity questions.
- `volumes` — volume group lifecycle with iSCSI and NVMe-TCP client
  attachment; the surface for "what is this LUN attached to".
- `objects` — Nutanix Objects, the S3-compatible object store service.
- `files` — Nutanix Files: virtual file servers, NFS/SMB shares,
  share-level security and capacity.

`objects` and `files` executors only register when those services are
deployed on the connected Prism Central — their absence is expected on
clusters without the license.

## Key Concepts

| Concept | Namespace | Notes |
|---------|-----------|-------|
| Storage container | `storage` | Cluster-scoped datastore backing VM disks; capacity and config per container |
| Volume group | `storage` / `volumes` | Block storage exposed over iSCSI/NVMe-TCP; attachment state lives in `volumes` |
| File server | `files` | A virtual file server instance hosting shares |
| Share | `files` | NFS export or SMB share with its own security and quota settings |
| Object store | `objects` | S3-compatible store instance with buckets and access policies |

## Common Workflows

### Storage capacity review

1. `listOperations(namespace="storage", search="containers")` →
   list-storage-containers operation.
2. `storage_execute` to list containers per cluster; read capacity,
   usage, and replication/compression settings from each entity.
3. Rank by utilization; anything approaching full is the headline.
   For growth trending and runway, cross to the `aiops` namespace
   (monitoring-aiops skill) rather than extrapolating one snapshot.

### Volume group attachment audit

1. Discover volume group list/get operations in `volumes`.
2. `volumes_execute` to list volume groups, then read attachment state
   (iSCSI/NVMe-TCP clients) per group.
3. Flag unattached groups (reclaimable capacity) and groups attached
   to unexpected initiators (security review).

### File services overview

1. `files_execute` list of file servers, then shares per server, with
   quota and usage fields.
2. Report per-share protocol (NFS/SMB), capacity, and security
   settings.

## Read-only boundary

Creating, resizing, attaching, or deleting containers, volume groups,
shares, or stores is non-GET and blocked by read-only mode. Findings
from an audit become recommendations for a human, optionally with
`getCodeSample` output for the specific change operation.

## Gotchas

- **Container capacity is cluster-scoped, not global.** Sum across
  clusters explicitly when reporting an estate-wide number, and say
  which clusters were counted.
- **Thin provisioning skews raw numbers.** Provisioned capacity can
  legitimately exceed physical; report both logical usage and physical
  capacity, not one figure.
- **`storage` vs `volumes` overlap.** Both touch volume groups. Use
  `storage` for existence/capacity, `volumes` for attachment and
  client (initiator) detail.

## Related Skills

- [api-patterns](../api-patterns/SKILL.md) — discovery workflow, OData, read-only mode
- [cluster-operations](../cluster-operations/SKILL.md) — the clusters containers live on
- [monitoring-aiops](../monitoring-aiops/SKILL.md) — capacity runway forecasting
