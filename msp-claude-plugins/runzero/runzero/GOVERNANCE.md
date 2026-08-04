# runZero plugin — governance and safety model

Unofficial. Community-built plugin for the runZero API. Not affiliated
with, endorsed by, or sponsored by the vendor.

## What it connects as

This plugin does not hold credentials. It reaches runZero through the
WYRE Conduit gateway (`https://conduit.wyre.ai/v1/mcp`), which brokers
authentication centrally and scopes every call to the tenant the
operator is authorised for.

- No runZero Account API Token is stored on the technician's machine, in
  this repo, or in the model's context.
- Credential rotation happens once at the gateway, not per technician.
- Every call carries operator identity, so the gateway audit log answers
  "who launched that scan" — runZero's own task record shows only the
  API account.
- Revoking gateway access revokes runZero access with it, immediately.

## Tool permission tiers

| Tier | What it can do | Tools |
|---|---|---|
| **Read** | Cannot change runZero state and puts no traffic on the customer's network. Safe for autonomous agents. | `runzero_assets_list`, `runzero_assets_get`, `runzero_assets_search`, `runzero_assets_export`, `runzero_services_list`, `runzero_services_get`, `runzero_services_export`, `runzero_sites_list`, `runzero_sites_get`, `runzero_wireless_list`, `runzero_wireless_get`, `runzero_explorers_list`, `runzero_explorers_get`, `runzero_tasks_list`, `runzero_tasks_get` |
| **Write** | Changes runZero-side records. Reversible, no customer-network effect. | `runzero_sites_create`, `runzero_tasks_stop` |
| **Destructive** | Puts active traffic on a customer's production network, now or later. Requires explicit per-call human approval. | `runzero_tasks_create`, `runzero_sites_update` |

`runzero_tasks_create` is the reason this plugin needs a governance
document at all. It is a `create` against runZero's own API, but what it
creates is active scanning traffic aimed at a live customer network.
Discovery probes routinely knock over the fragile end of an MSP's
estate — PLCs and building-management controllers, medical devices,
older network printers, legacy embedded appliances — and a `fast` or
`max` scan rate can saturate a thin branch WAN link or trip the client's
own IDS into a security incident. The blast radius is the customer's
production network during business hours. Never grant it to a scheduled
or unattended agent.

`runzero_sites_update` is the same hazard with a delay. A site's
excluded ranges are a safety interlock: they are how you record "do not
touch the CT scanner subnet". Editing scope or removing an exclusion
does nothing visible at the time, then puts probes on a protected
network the next time a scheduled scan fires — with nobody watching and
no obvious link back to the change. It is classified destructive for
that reason, not for what the call itself does.

`runzero_tasks_stop` sits in Write rather than Destructive: it is the
one call that makes a customer's network quieter, not busier. It is
still a real change — an aborted scan leaves partial, misleading
inventory, and stopping a compliance scan silently creates an evidence
gap — so it needs approval, just not the same ceremony.

## Recommended agent policy

The safe default is **read autonomously, propose writes, never
self-approve a scan.**

- Read tools: allow. Inventory queries, service and exposure reporting,
  rogue-AP review, explorer health checks, and scan-history summaries
  are the intended autonomous use.
- Write tools: agent drafts the exact call, human approves, then it runs.
- Destructive tools: require a named human approver per invocation, and
  make the approver confirm the target ranges, the scan rate, and the
  time of day before the call goes out. Do not grant these to scheduled
  or unattended agents.

## What it cannot reach

- Only the runZero organization and sites mapped to the operator's
  gateway identity.
- No filesystem, no shell, no other vendor's data.
- No control over the explorers themselves — an agent cannot install,
  upgrade, move, or delete a scan agent through this plugin.
- No credentialed scanning configuration. Scan-time credentials live in
  the runZero console and are not exposed here.
- No live view. Every result is what the last completed scan saw, not
  current network state.

## Data handling

- Responses pass through the gateway into model context for the session
  and are not persisted by this plugin.
- `runzero_assets_export` and `runzero_services_export` are bulk
  egress. They pull a client's entire inventory — hostnames, MAC and IP
  addressing, OS and firmware versions, open ports, and service
  banners — in one call. That is a complete network map of the customer,
  and it is exactly what an attacker would want. Restrict these if your
  agents run unattended, and never let their output leave your systems
  unreviewed.
- `runzero_wireless_*` returns SSIDs, BSSIDs, and encryption modes,
  including for neighbouring organisations whose RF an explorer can hear.
- Asset records commonly include the last logged-in user and other
  attributes that identify individuals.

## Known sharp edges

- **Scan rate is a production risk dial, not a speed preference.** Treat
  `fast` and `max` as requiring the same approval as maintenance-window
  work. `normal` is the default for a reason.
- **runZero data is a snapshot with a timestamp.** An agent reporting
  "this host is offline" is reporting what a scan saw hours or days ago.
  Always state the scan time alongside the finding.
- **Discovery is not vulnerability assessment.** runZero reports what is
  listening and which version answered; it does not test or score CVEs.
  An agent that infers "vulnerable" from a version banner is guessing.
- **Explorer coverage defines the truth.** A site with an offline
  explorer returns stale-but-plausible results rather than an error.
  Check explorer health before treating an empty or shrinking inventory
  as a real finding.
- **The tier table is derived from this plugin's skills.** Unlike most
  connectors in this repo there is no local `runzero-mcp` checkout to
  cross-check tool names against, so confirm the live tool list at the
  gateway before writing automation that depends on an exact name.
