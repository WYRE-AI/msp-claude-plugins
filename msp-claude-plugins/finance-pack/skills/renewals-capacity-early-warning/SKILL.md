---
name: "Renewals and Capacity Early Warning"
description: >
  A read-only 60-90 day look-ahead that merges everything about to expire or
  fill up into one ranked list per client: PSA contracts, marketplace
  subscriptions, hardware warranties, SSL certificates, domain registrations,
  and on-prem or cloud storage trending toward full. Covers which connected
  tool supplies each date, how much to trust it, how to forecast disk
  exhaustion from the readings an RMM actually exposes, and how to turn the
  result into one draft ticket per client so the MSP can quote in time.
when_to_use: >-
  When the MSP wants one forward-looking list of what will expire or run out
  soon, per client, early enough to quote and schedule. Use when: renewals
  look-ahead, what expires next quarter, 90 day expiry sweep, certificates
  and domains expiring, disk filling up forecast, capacity early warning,
  proactive renewal tickets, monthly expiry review.
---

# Renewals and Capacity Early Warning

## Overview

Single skills already read single date sources: the finance-pack renewal
calendar covers contracts and subscriptions, `assets-pack-warranty-tracking`
covers hardware warranties, `gogetssl-certificate-expiry` covers certificates
bought through GoGetSSL, and `cloudops-pack-cloud-capacity-planning` covers
cloud headroom. Nobody reads them together, so a client's certificate, a
warranty, and a nearly full file server surface in three different weeks and
produce three separate quotes. This skill runs the sweep once, merges the
results per client, and ends with draft tickets. It never creates, renews,
extends, or purchases anything.

Follow the source skills for the sources they cover. This skill adds the two
things they leave out: certificates and domains that were not bought through
one reseller, and on-prem disk-fill forecasting.

## Anti-triggers

- **Contract or subscription renewals only:** use the `renewal-calendar-builder`
  agent or `/finance-pack:renewals`. Come back here when certificates,
  warranties, or capacity belong in the same list.
- **Talking points for one client's renewal or price increase:** use
  `finance-pack-renewal-and-price-increase-prep`.
- **Hardware warranty or end-of-life only:** use `assets-pack-warranty-tracking`
  or `assets-pack-eol-eos-flagging`.
- **Cloud right-sizing or cloud capacity only:** use
  `cloudops-pack-cloud-capacity-planning`.
- **A device that is failing now (SMART errors, crashing services):** that is
  failure prediction, not expiry; use the `ops-pack` device-failure skill if
  it is installed.
- **A disk already under 10% free, or a certificate that has already
  expired:** that is an incident, not an early warning; work it as a ticket.
- **Ranking clients by churn risk:** use `finance-pack-churn-scanner`.

## Discovering available tools first

1. Call `conduit__search_tools` with queries such as `"expiring contracts"`,
   `"subscriptions"`, `"ssl certificate"`, `"website"`, `"device audit"`,
   `"device warranty"`, and `"quota"`. Several RMMs and PSAs can be connected
   at once; cover all of them.
2. Use only the exact names discovery returns, and only read-only tools. The
   names below show what each source usually looks like.
3. A tool that discovery does not list as callable (for example an
   admin-gated one) is "unavailable", not an error to work around.
4. Record every source as checked, partial, or unavailable. The final report
   always states which.

## Sources and how far to trust them

| Item | Tools (when connected) | Trust and caveats |
|---|---|---|
| PSA contracts | `autotask_list_expiring_contracts` (`daysAhead: 90`), `cw_search_agreements` | Term end date; note auto-renewal if the tool returns it. HaloPSA and Syncro expose no contract list, so report the contract side as unavailable when they are the only PSA |
| Marketplace subscriptions | `pax8-list-subscriptions`, `sherweb_subscriptions_list` | Commitment end or renewal date. Auto-renewal at list price is the risk |
| Hardware warranty | `auvik_devices_get_warranty`, `ncentral_get_device_lifecycle`, `datto_get_device` (`warrantyExpiry`, epoch ms), `scalepad_lm_warranty_pricing_list` | Apply the reliability tiers in `assets-pack-warranty-tracking`: an empty field is "unknown", never "expired" |
| Certificates | `gogetssl_orders_list` with `status: "active"` (`valid_till`), `hudu_list_websites` (`ssl_expiration`, `ssl_issuer`), `yeastar_list_certificates` for PBX certificates | GoGetSSL knows only what was bought there. Hudu records its last scan, not a live check. A certificate on a site, mail host, or VPN that appears in neither source is invisible to this sweep |
| Domain registrations | No dedicated domain-expiry tool is exposed through Conduit. `hudu_list_websites` may carry registration data where WHOIS monitoring is on | Use a registration expiry field only if the record returns one; otherwise list domain expiry as a gap. `cipp_list_domain_health` reports DNS and email-authentication health, not registration expiry, so it is not a date source |
| Disk and storage | `datto_get_device_audit` (`hardware.disks[]` with `size` and `freeSpace`), `datto_list_alerts` (`perf_disk_usage_ctx`), `ncentral_get_device_assets`, `ninjaone_alerts_list`, `auvik_statistics_device` for NAS and SAN devices | Mostly point-in-time readings; see the forecast rules below. `datto_get_device_audit` is admin-tier in Conduit |
| Cloud headroom | `azure-mcp__quota`, `azure-mcp__advisor`, DigitalOcean list tools | Take the forecast and its caveats from `cloudops-pack-cloud-capacity-planning` instead of redoing them |

NinjaOne's Conduit tools expose alerts and device records but no volume list,
so for NinjaOne clients the only disk signal is disk-space alert history. Say
that, and do not infer a fill date from an alert threshold.

## Key Concepts

### One horizon, three bands

The default window is 90 days; honor an explicit one. Band every item by days
to the event, not by source:

| Band | Days left | Meaning |
|---|---|---|
| Act now | 0-30 | Quote and schedule this week |
| Quote soon | 31-60 | Procurement lead time matters (hardware, multi-year renewals) |
| Watch | 61-90 | Put on the calendar; no action yet |

Anything already past its date is outside this skill. List it separately as
"already lapsed, treat as an incident" and move on.

### Forecasting a full disk without inventing a trend

A fill date needs at least two readings of used space taken at least seven days
apart. Fewer than that gives a threshold breach at most.

| What the RMM returns | What to do |
|---|---|
| History for used space (a metric series) | Fit growth per day over the window and project when free space reaches zero |
| Current reading only, snapshots from a prior run exist | Use your own snapshots (device id, volume, used, date) and say the trend is built from them |
| Current reading only, first run | Report volumes already under 20% free as "low now, no trend yet". Give no fill date |
| No disk data exposed | List the client under "not assessed" |

Rules for the projection:

- Project only sustained growth. One large copy, or a backup that has not yet
  rotated, is a spike; discard the step change and say so.
- Give a range: the fill date at the observed average rate, and at the faster
  of the last two intervals. State the readings used.
- Prioritize servers, file shares, and database volumes. Workstation system
  drives matter only when under 15% free.
- If a volume was expanded recently, start the trend after the change.

Never print a projected fill date without the two readings behind it.

### Why the merge matters

Group by client, then by quotable action, so related items land in one
conversation:

- A server with a warranty ending in 70 days, a disk projected full in 55 days,
  and a certificate expiring in 40 days is one refresh-and-renew proposal, not
  three tickets.
- A subscription renewal and a certificate for the same domain belong in the
  same renewal conversation.

## Workflow

1. **Discover** connected sources and the client roster from the PSA or the
   RMM's organizations.
2. **Pull** each source for the window. Record per source the tool used, the
   items returned, and whether the result was truncated or paged.
3. **Map to clients.** Certificate and domain records often carry no client
   field. Map by registrable domain to a client using documentation or an
   operator-supplied list. Items you cannot map go in an "unassigned" section.
   Never guess a client.
4. **Forecast storage** with the rules above for servers and shared volumes
   in scope.
5. **Band and merge** per client. Drop items beyond the window. Keep
   "unknown" items (warranty field empty, certificate with no expiry) in a
   labeled list rather than omitting them.
6. **Draft tickets.** One draft per client with items in the first two bands.
   Watch-band items go in the report only.
7. **Stop.** Present the report and drafts. Creating tickets or quoting is a
   separate step the technician approves.

### Draft ticket format

```
Title: Upcoming renewals and capacity: Acme Co (next 60 days)
Priority: Normal (High only if an Act now item affects production)
Body:
- Certificate: portal.acme.example expires 2026-12-14 (31 days). Source: GoGetSSL order. Renew or reissue, confirm the validation contact.
- Warranty: SRV-FS01 ends 2027-01-20 (68 days, manually maintained field, verify). Quote replacement or extension.
- Disk: SRV-FS01 D: 412 of 500 GB used. Readings 2026-10-22 (361 GB) and 2026-11-19 (412 GB) give 1.8 GB/day, about 49 days to full at that rate. Plan expansion.
Not assessed: domain registration expiry (no source connected), NinjaOne disk volumes.
Evidence window: 2026-11-20 to 2027-02-18.
```

The figures above only show the format. Every real number must come from a tool
result or from an earlier snapshot you can cite.

## Error Handling

- **No PSA, RMM, or certificate source connected:** stop and say there is
  nothing to look ahead on. Do not fall back to guesses.
- **One source fails or is truncated:** report that source as partial or
  unavailable by name and continue. A calendar with a silent gap is worse than
  none.
- **GoGetSSL list returns `truncated` or a size error:** follow the paged
  fallback in `gogetssl-certificate-expiry` for the same status.
- **Hudu and GoGetSSL disagree on a certificate date:** show both with their
  source and the Hudu last-scan date; do not pick one.
- **More than about 10% of a client's devices land in the first band:** check
  for a shared cause, such as devices bought in one batch, before drafting
  per-device quotes.

## Output

Lead with a per-client table sorted by the earliest Act now item, then the
unassigned section, then the "not assessed" and gaps list. When the `ops-pack`
client health score skill is installed, this output is its renewals and
capacity input.

## Related Skills

- The `renewal-calendar-builder` agent, for the contract and subscription part
- [Renewal and Price-Increase Prep](../renewal-and-price-increase-prep/SKILL.md),
  once a client's renewal is chosen
- [License True-Up](../license-true-up/SKILL.md), when seat counts change a
  subscription's renewal value
