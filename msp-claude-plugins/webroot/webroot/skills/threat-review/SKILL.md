---
name: "Webroot Threat Review"
description: >
  Webroot detection review for a site or endpoint: threat history (file,
  path, malware group, first/last seen), repeat infections, Web Threat
  Shield URL actions, and DNS Protection traffic and blocked domains, with
  explicit date windows and paging. Includes how to check whether a scan or
  cleanup was already issued (admin-gated command history). Read-only.
when_to_use: >-
  When investigating what Webroot detected or blocked for a customer or a
  machine, following up an infection alert, or summarising threats for a
  monthly report. Use when: webroot threat, webroot detection, webroot
  infection, malware on endpoint, webroot blocked url, web threat shield,
  dns protection blocks, dnsp, or webroot threat history.
---

# Webroot Threat Review

## Overview

Webroot records three kinds of protection events, each with its own tool:

| Event | Tool | Scope |
|---|---|---|
| File detections (threat history) | `webroot_threats_list_site`, `webroot_threats_list_endpoint` | Site or one endpoint |
| Web Threat Shield URL actions | `webroot_blockedurls_list` | Site |
| DNS Protection (DNSP) | `webroot_dnsp_traffic_summary` (all sites), `webroot_dnsp_blocked_list` (one site) | Console or site |

All of these are in Conduit's Read group. The command history used in step 5 below is
**admin-gated**.

All three default to **the last 24 hours**. Always pass `startDate` and `endDate` for
anything longer, and state the window in the answer.

## Anti-triggers

- **Overall health counts** (how many infected, stale agents): use
  [endpoint-health](../endpoint-health/SKILL.md).
- **Who issued a command or who has console access**: use
  [console-audit](../console-audit/SKILL.md).

## Workflow: an infection alert on one machine

1. Find the endpoint: `webroot_endpoints_list` with `hostName`, then
   `webroot_endpoints_get` for last seen, last infected, OS, IPs, current user and
   isolation status.
2. `webroot_threats_list_endpoint` over the last 7 to 30 days with
   `returnedInfo` = `ExtendedInfo`. Page while `MoreAvailable` is true.
3. Group the records by file path and malware group. The same file reappearing after it
   was first seen means it is being re-dropped (a persistence mechanism, a synced folder,
   or a re-run installer), not that Webroot missed it once.
4. Check web and DNS activity on the same site for the same window:
   `webroot_blockedurls_list` and `webroot_dnsp_blocked_list`, filtered in your answer to
   this host or user. A detection that follows a blocked domain or URL often points at the
   delivery route.
5. **Was it already handled?** `webroot_commands_list_endpoint` with `command` = `scan` or
   `cleanup` shows whether a technician already issued one and its state (3 executed,
   6 failed, 2 not yet received). This tool is **admin-gated in Conduit**; if the user does
   not have Admin access to Webroot, say that and skip the step.
6. Recommend next steps for the GSM console (scan, cleanup, isolate). The plugin cannot
   issue them.

## Workflow: monthly threat summary for a site

1. `webroot_threats_list_site` for the month (`startDate` = first day 00:00Z, `endDate` =
   last day 23:59:59Z). Page until `MoreAvailable` is false.
2. Count detections, distinct endpoints, and distinct malware groups. List the top
   endpoints by detection count; one machine with most of the detections is the story.
3. `webroot_dnsp_traffic_summary` for the same window gives total, blocked and risky DNS
   requests per site; pick this site's row. Use `webroot_dnsp_blocked_list` only when the
   user wants the domains.
4. `webroot_blockedurls_list` for URL actions blocked or allowed by Web Threat Shield.
5. Report detections and blocks as evidence the protection is working, and repeat
   detections on one endpoint as the thing to act on.

## Paging and volume

- Threat, URL and DNS lists page with `pageNr` + `MoreAvailable`.
- `webroot_dnsp_blocked_list` can be large: `pageSize` 100 to 10000 (default 1000). For a
  summary, prefer `webroot_dnsp_traffic_summary` and only pull blocked domains on request.
- If a response is too large, shorten the date range rather than raising `pageSize`.

## Gotchas

- DNSP results carry category and block-reason **IDs**, not names. Report them as IDs
  unless the user supplies the mapping.
- `webroot_blockedurls_list` leaves out deactivated and hidden endpoints unless you set
  `includeDeactivated` or `includeHidden`. A machine that was deactivated after an
  incident needs `includeDeactivated` = true.
- Threat history shows detections, not outcomes. Whether the file was removed is in the
  endpoint's infection state and the command history, not in the threat record.
