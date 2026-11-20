---
name: "Patch, EOL and KEV Risk Ranking"
description: >
  Ranks every client's machines, and then the clients themselves, by three
  signals: missing patches, OS past end of support, and exposure to CISA
  Known Exploited Vulnerabilities (KEV). Read-only and safe to run on a
  schedule. Composes the RMM patch tools, EOL/EOS Flagging, and
  SentinelOne's CVE data, and ends in draft tickets that the operator
  creates; it never creates one.
when_to_use: >-
  When producing a recurring, cross-client ranking of which machines are
  most exposed through unpatched software, unsupported operating systems,
  or actively exploited CVEs, or when preparing draft remediation tickets
  from that ranking. Use when: patch compliance report, patch risk
  ranking, KEV exposure, known exploited vulnerabilities across clients,
  which machines are most at risk, weekly patch and EOL risk sweep,
  unpatched machines by client, patch compliance rollup.
---

# Patch, EOL and KEV Risk Ranking

## Overview

Three questions decide which machines hurt an MSP first: is it missing
security patches, is its OS past end of support so no patch is coming,
and does it carry a vulnerability attackers are already using. Each
signal lives in a different tool, and no single tool answers all three.
This skill collects them per machine, ranks with a fixed, explainable
ladder (not a blended score), rolls the result up per client, and drafts
tickets for the top findings.

It covers endpoints and servers that an RMM manages or a SentinelOne
agent reports. Network edge devices (firewalls, VPN gateways) are not in
scope; they do not appear in RMM patch data.

The run is read-only end to end, so it is safe to schedule weekly with
no one watching. It is stateless: it keeps no history, so "new since
last run" is only possible when the operator supplies the previous
report.

## Anti-triggers

- **EOL/EOS risk on its own, with no patch or CVE data:** use
  [EOL/EOS Flagging](../eol-eos-flagging/SKILL.md). This skill calls it
  for the OS signal and adds the other two.
- **Triaging one client's CVEs by EPSS and exploit maturity inside
  SentinelOne:** use `sentinelone-vulnerabilities`. This skill reads the
  same data as one of its inputs and compares across clients.
- **Turning aging hardware into a replacement plan:** use
  [Refresh Cycle Planning](../refresh-cycle-planning/SKILL.md). Its
  replace-now tier is a good place to send what this skill finds.
- **Deploying patches or creating the tickets:** this skill drafts only.
  Create tickets with the PSA's own skill (`autotask-tickets`,
  `connectwise-psa-tickets`, `halopsa-tickets`, `superops-tickets`) and
  deploy patches from the RMM.

## Connected Systems

| System | Signal | Required? |
|--------|--------|-----------|
| An RMM with patch data (Datto RMM, SuperOps, Kaseya VSA) | Missing and pending patches per machine, plus OS version | Yes, at least one |
| SentinelOne XSPM | CVE IDs per endpoint with EPSS and exploit maturity | Optional, and the only live source of CVE IDs |
| A KEV catalog supplied by the operator | Which CVE IDs are known exploited | Optional, but without it KEV is "not assessed" |
| IT Glue or Hudu | Device role, to rank by criticality | Optional |

N-central, NinjaOne, and Atera are covered for OS inventory through
[EOL/EOS Flagging](../eol-eos-flagging/SKILL.md), but the Conduit tools
documented in this repo do not return per-machine patch status for them.
For those clients the patch signal is "not assessed". N-central's
`ncentral_list_job_statuses` reports patch job outcomes, which says a
patch run failed, not which patches are missing. Do not present it as
patch compliance.

## Workflow

### Step 1: Discover what is connected

Call `conduit__search_tools` and use the exact tool names it returns.
Never call a tool outside this allow-list.

**Datto RMM:** `datto_list_sites`, `datto_list_devices`,
`datto_get_device`, `datto_get_site_patches`, `datto_get_device_patches`.
The two patch tools are classified admin today, so a read-only key may be
refused; report that as a coverage gap. Never call `datto_run_quickjob`
or `datto_resolve_alert`.

**SuperOps:** `superops_clients_list`, `superops_assets_list`,
`superops_assets_patches`. `superops_assets_list` returns a per-asset
`patchStatus` string; call `superops_assets_patches` with
`installationStatus: "NewOrMissing"` only for assets that need detail.
Never call `superops_custom_mutation`, and do not use
`superops_custom_query` for anything the typed tools cover.

**Kaseya VSA:** `kaseya_vsa_list_agents`, `kaseya_vsa_get_patch_status`.
Never call `kaseya_vsa_deploy_patches_now` or `kaseya_vsa_run_procedure`.

**SentinelOne:** `search_vulnerabilities` and `list_vulnerabilities` for
CVE IDs and `exploitMaturity` per endpoint, `cve_search_by_id` to
enrich a CVE, and `cve_database_status` to state how current the CVE data
is. These are also admin-classified today.

For the OS signal, follow [EOL/EOS Flagging](../eol-eos-flagging/SKILL.md)
using the OS fields on the device records above.

### Step 2: Collect cheaply, then drill down

Per-device patch calls multiply by fleet size. Start from the roll-ups
(`datto_get_site_patches`, the `patchStatus` string from
`superops_assets_list`) and call the per-device tools only for machines
that roll-up shows as non-compliant. If you stop at a cap, say how many
machines were not examined rather than ranking a partial fleet as if it
were whole.

### Step 3: Get the KEV list

No Conduit connector serves the CISA KEV catalog, so do not match against
a list recalled from memory. Ask the operator for a current copy of CISA's
`known_exploited_vulnerabilities` JSON or CSV, and record its
`catalogVersion` and `dateReleased`. Match on exact CVE ID, nothing
fuzzier.

If no catalog is supplied, set the KEV column to "not assessed" for the
whole run. SentinelOne's `exploitMaturity` of `ACTIVE` says an exploit is
used in the wild, which is a useful proxy but not the same list. Show it
as "exploited in the wild per SentinelOne", never as KEV. If the catalog
is older than a week, say so in the header.

Datto's patch records carry KB identifiers and severity, not CVE IDs, and
this skill does not map KBs to CVEs from memory. KEV matching therefore
applies to CVE-bearing sources only: SentinelOne findings, and any patch
tool that returns CVE IDs. A machine with only RMM patch data can still be
ranked on patches and OS, with KEV shown as "no CVE data for this
machine".

### Step 4: Rank machines

Join records to one machine per client by case-insensitive hostname. If a
hostname matches more than one machine in a client, list it as ambiguous
instead of merging. Then assign each machine to the first tier it
qualifies for.

| Tier | Qualifies when |
|------|----------------|
| Critical | An open CVE on the machine is in KEV, or the OS is past EOS on a high-criticality machine (servers, domain controllers, anything internet-facing) |
| High | OS past EOS on any other machine; or `exploitMaturity` `ACTIVE` without a KEV match; or a missing top-severity patch on a high-criticality machine |
| Medium | Missing top-severity patches on other machines; or OS reaches EOS within 6 months |
| Low | Only lower-severity patches missing |
| Not assessed | No patch, OS, or CVE data could be read |

A KEV hit outranks everything because exploitation is already happening.
Past-EOS on a server outranks past-EOS on a spare desktop, matching
[EOL/EOS Flagging](../eol-eos-flagging/SKILL.md). Within a tier, sort by
criticality, then by number of KEV CVEs, then by missing critical patches.
"Top severity" means the highest two levels the tool returns (typically
Critical and Important); do not re-grade or rename them. Use patch age
only when the tool returns a release or detection date.

"Not assessed" is its own tier. A machine you could not read is never
Low.

### Step 5: Roll up per client

For each client report:

- Machine counts per tier, with the Not assessed count shown beside them
- Patch compliance: machines with no missing top-severity patches, divided by machines that returned patch data
- Coverage: machines with patch data divided by all machines
- The top five machines, each with the evidence that placed it

Rank clients by Critical count, then High count, then lowest coverage. A
client with low coverage is not clean; it is unknown, and it sorts above
a client with equal counts and full coverage.

### Step 6: Draft tickets

Draft one ticket per client for its Critical machines and one for its High
machines, not one per machine. Each draft carries a title, the machine
list, the evidence line for each machine (patch tool, CVE ID and catalog
date, or OS and EOS date), and the recommended action. Leave priority to
the operator's PSA mapping. Label every draft "DRAFT, not created". Do
not call any ticket-creation tool.

## Output

```text
Patch, EOL and KEV risk, week of 2026-11-16
KEV catalog: operator-supplied, dateReleased 2026-11-14. EOL dates are general
knowledge; verify against the vendor lifecycle page before quoting a deadline.

1. Example Dental Group     Critical 2 | High 5 | Medium 11 | Low 30 | Not assessed 4
   Patch compliance 71% (46 of 65 with patch data), coverage 94%
   - DC01 (server): Critical. CVE-2024-0001 in KEV (SentinelOne finding, catalog 2026-11-14)
   - FS02 (server): Critical. Windows Server 2012 R2 past EOS (verify date)
   Draft ticket: "Example Dental Group: 2 critical exposures on servers". DRAFT, not created.
```

The data is fictional. Keep the per-client header line stable (tier
counts, compliance, coverage), because a client health roll-up can consume
it as-is.

## Error Handling

| Situation | What to do |
|-----------|-----------|
| No RMM patch tool discovered or permitted | Say patch data is unavailable and rank on OS and CVE signals only |
| Patch tool refused as admin-only | Report the client as patch "not assessed" and name the tool, rather than skipping it silently |
| No KEV catalog supplied | KEV "not assessed" for the run; use the SentinelOne proxy labeled as such |
| `cve_database_status` shows stale data | State the last update date in the header |
| Paged results hit a cap | Report the examined count against the total |
| Same hostname in RMM and SentinelOne differs by domain suffix | Join only on an exact normalized match and list the rest as unmatched |

## Related Skills

- [EOL/EOS Flagging](../eol-eos-flagging/SKILL.md) supplies the OS signal
  and the date caveat this skill repeats.
- [Refresh Cycle Planning](../refresh-cycle-planning/SKILL.md) takes the
  replace-now machines found here.
- [Warranty Tracking](../warranty-tracking/SKILL.md) answers a different
  question (hardware coverage), which this ranking ignores.
