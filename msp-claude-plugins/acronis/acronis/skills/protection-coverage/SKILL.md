---
name: "Acronis Protection Coverage"
description: >
  Protection coverage in Acronis Cyber Protect Cloud: which machines and
  workloads have no protection plan, which plans failed to deploy or are
  blocked, which agents are offline, outdated or unsupported, and how to
  reconcile Acronis resources against the client's machine list. Covers
  protection plans (policies), policy applications, resources and agents,
  plus the admin-only run-now write (off by default).
when_to_use: >-
  When an MSP needs to find unprotected machines, audit protection plan
  coverage for a client, check plan deployment problems, or review agent
  health and versions. Use when: unprotected machines, acronis coverage,
  protection plan not applied, acronis agent offline, acronis agent outdated,
  new client onboarding check, backup coverage audit, or run a protection
  plan now.
---

# Acronis Protection Coverage

## Overview

A machine only alerts in Acronis if a protection plan covers it. Coverage
gaps are silent: a new laptop with an agent but no plan, a plan that never
deployed to a server, or an agent that stopped updating months ago. This
skill finds those gaps. Run it monthly per client, after onboarding a new
client, and whenever the client's machine count changes.

## Anti-triggers

- **Backups that ran and failed** — those raise alerts. Use `acronis-backup-health`.

## Key Concepts

| Term | Meaning |
|------|---------|
| Resource | Anything Acronis can protect: a machine, a mailbox, a virtual machine and so on. Each has a `type`. |
| Policy | A protection plan in the Acronis console. Policies are composite: a root policy holds sub-policies such as backup, antimalware and patching. |
| Policy application | One policy applied to one resource (its "context"). Each application has a deployment state, a running state and an execution status. |
| Agent | The Acronis software on a machine. One agent can serve several resources (a hypervisor agent serves its VMs). |
| Issue | A problem on an application: a validation issue, a deployment error, or a running blocker. |

## Workflow: Client Coverage Audit

1. **Find the customer tenant.** See `acronis-tenants-and-usage`. You need
   the customer's tenant UUID for every step below.
2. **Protected vs. unprotected.** Call `acronis_fetch_resource_protection_status`
   with `tenant_id`. It lists resources and whether each is protected. Page
   with `after` until there is no next cursor.
3. **Count check.** `acronis_fetch_resource_count` with the same `tenant_id`
   gives a total to check your paging against.
4. **Machines with no plan.** `acronis_fetch_resources` with `tenant_id`,
   `not_applied_only: true` and `is_group: false` lists resources that have
   no policy applied, without resource groups. These are the coverage gaps.
   Some resource types are never meant to carry a plan, so read the `type`
   of each before calling it a gap.
5. **Plans that didn't land.** `acronis_fetch_applications_issue_statistics`
   counts issues per policy. For each policy with issues, call
   `acronis_fetch_policy_applications` with `policy_id`,
   `include_deployment_errors: true`, `include_running_blockers: true` and
   `include_validation_issues: true` to see which machines are affected and
   why.
6. **Per-plan status.** `acronis_fetch_application_statuses_by_policy` with
   `policy_id` returns the status of every resource the plan covers. Add
   `join_not_applied: true` to include plans with no applications at all.
7. **Agent hygiene.** `acronis_fetch_agents` with `tenant_id` (a subtree root)
   and, in separate calls, `online: false`, `up_to_date: false` and
   `unsupported: true`. `up_to_date` and `unsupported` can't be combined in
   one call. Set `limit`; without it every agent comes back at once.
8. **Reconcile with the client's machine list.** Compare Acronis resource
   names against the RMM or PSA device list. Machines in the RMM but not in
   Acronis have no agent. Machines in Acronis but not in the RMM may be
   retired.

## Reading the Results

| Finding | Meaning | Usual fix |
|---------|---------|-----------|
| Resource with no plan | Agent installed, never assigned a plan | Apply the client's standard plan in the console |
| Application with a deployment error | The plan couldn't be pushed to the agent | Check the agent is online and supported, then redeploy |
| Running blocker | The plan is deployed but can't run (for example, a missing backup destination) | Fix the blocker named in the issue |
| Agent offline for days | Machine retired, powered off, or agent service stopped | Confirm with the client, then remove or repair |
| Agent unsupported | Version is older than Acronis still supports | Update the agent before it causes plan or backup failures |
| Policy with zero applications | A plan nobody uses | Leave it, but don't count it as coverage |

## Running a Plan Now (admin only, off by default)

`acronis_execute_protection_policy` runs a protection plan right away on every
resource it's applied to, or only on the resources named in `context_ids`.
It starts real backup or protection jobs on client machines.

- It's **off by default**. If it isn't in the tool list, writes are turned
  off for the Acronis connector.
- When writes are on, Conduit puts it at the **admin** tier. Technicians
  without admin access can't run it.
- Before calling it, say which plan, which machines and why, and get the
  operator's confirmation. Leaving `context_ids` empty runs the plan on every
  machine it covers, which for a large client can mean dozens of jobs at once
  during business hours.
- The body needs `state: "running"` plus `policy_id`. Don't use `settings`
  (a temporary ad-hoc plan) unless the operator asks for one.

## Gotchas

- Policies are called **protection plans** in the console. Use the console
  word when you talk to the operator.
- Composite policies: `acronis_fetch_policies` returns root policies and
  their sub-policies. Pass `parent_ids` empty (`parent_ids: ""`) to get root
  plans only.
- `acronis_fetch_policies` with `include_applied_context: true` can't be
  combined with `applicable_to_context_id`.
- Resource IDs, agent IDs and policy IDs are different things. A 404 usually
  means one was passed where another belongs.
- The `type` filter on resource tools takes Acronis resource type strings.
  Read the `type` values from an unfiltered `acronis_fetch_resources` call
  first instead of guessing them.

## Related Skills

- [api-patterns](../api-patterns/SKILL.md) - Headers, pagination and errors
- [backup-health](../backup-health/SKILL.md) - Alert-driven backup triage
- [tenants-and-usage](../tenants-and-usage/SKILL.md) - Find the customer tenant and its usage counts
