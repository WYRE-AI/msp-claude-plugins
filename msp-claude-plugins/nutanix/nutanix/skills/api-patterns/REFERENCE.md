# Nutanix v4 API namespace reference

One executor tool per namespace, named `<namespace>_execute`. Tool
availability depends on the connected Prism Central version and which
optional services are deployed — an absent tool means the namespace is
not exposed there. All executors are subject to server-side read-only
mode: only GET operations execute.

| Namespace | Executor tool | Coverage |
|-----------|---------------|----------|
| `aiops` | `aiops_execute` | Analysis, reporting, capacity planning, VM rightsizing, simulations |
| `clustermgmt` | `clustermgmt_execute` | Hosts, clusters, BMC, cluster profiles, SSL certificates, storage containers |
| `datapolicies` | `datapolicies_execute` | Protection policies, disaster recovery plans, storage policies |
| `dataprotection` | `dataprotection_execute` | Consistency groups, recovery points, protection and recovery plan actions |
| `files` | `files_execute` | Virtual file servers, shares, storage provisioning, security controls |
| `iam` | `iam_execute` | Users, roles, identity providers, service accounts (API keys), access policies |
| `licensing` | `licensing_execute` | License management, compliance, feature entitlements |
| `lifecycle` | `lifecycle_execute` | Infrastructure, software, and firmware upgrades (LCM, Foundation Central) |
| `microseg` | `microseg_execute` | Flow network security policies, service groups, address groups |
| `monitoring` | `monitoring_execute` | Alerts, alert policies, events, audits |
| `multidomain` | `multidomain_execute` | Cross-domain services across on-prem, NC2, and edge |
| `networking` | `networking_execute` | AHV networking, BGP, vSwitch, VPC, and subnet configuration (artifact-dependent) |
| `objects` | `objects_execute` | Nutanix Objects (S3-compatible) store service |
| `opsmgmt` | `opsmgmt_execute` | Shared platform functionality for AIOps, DevOps, SecOps, FinOps |
| `prism` | `prism_execute` | Tasks, categories, batch operations, domain managers, backup targets, external storage |
| `security` | `security_execute` | Encryption, certificates, platform hardening |
| `storage` | `storage_execute` | Storage containers, volume groups, iSCSI client management |
| `vmm` | `vmm_execute` | VM lifecycle on AHV clusters |
| `volumes` | `volumes_execute` | Volume group lifecycle with iSCSI and NVMe-TCP client attachment |

## Discovery tools (always registered)

| Tool | Description |
|------|-------------|
| `listOperations` | List available operations, filtered by `namespace` and/or `search` text; `limit`/`offset` pagination |
| `getOperationSchema` | Full schema (parameters, path, method, description) for an `operation` id |
| `getCodeSample` | Language-specific code sample for an `operation` (`python`, `curl`, ...) |
| `getOperationPermissions` | Required Nutanix RBAC roles for an `operation` id |

## Namespace size and role expectations (upstream v0.8 defaults)

Figures from the upstream feature spotlight for the default artifact
set; the connected PC's artifacts govern what is actually indexed.

| Namespace | Approx. ops | Typical read role |
|-----------|-------------|-------------------|
| `lifecycle` | ~110 (largest) | Viewer to read inventory/recommendations |
| `prism` | ~73 | Viewer for list/get |
| `dataprotection` | ~31 | Backup Admin for most |
| `networking` | as few as 3 GET-only ops in the default artifact set | Viewer |

Always confirm per-operation requirements with
`getOperationPermissions` rather than assuming from this table.
