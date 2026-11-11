---
name: "Webroot Console Audit"
description: >
  Webroot GSM console access and agent-command audit using the four
  admin-gated tools: console and per-site administrators with their roles
  (names, emails, phone numbers), and the history of agent commands
  (scan, cleanup, uninstall, changekeycode, restart, deactivate,
  reactivate, sysisolate) with command states. Covers technician
  offboarding checks and spotting tamper-like command patterns. Read-only;
  nothing here issues commands or changes access.
when_to_use: >-
  When reviewing who can sign in to the Webroot GSM console or a customer
  site, confirming a departed technician or customer contact lost access,
  or checking which agent commands were issued and whether they ran. Use
  when: webroot admins, webroot access review, webroot offboarding, who has
  webroot access, webroot uninstall commands, webroot command history,
  webroot keycode change, or webroot audit.
---

# Webroot Console Audit

## Overview

All four tools this skill uses are **admin-gated in Conduit**:

| Tool | Returns |
|---|---|
| `webroot_admins_list` | GSM console administrators and their roles |
| `webroot_admins_list_site` | Administrators with access to one site and their access level |
| `webroot_commands_list_site` | Agent commands issued on a site: endpoint, command, parameters, state, dates |
| `webroot_commands_list_endpoint` | The same, for one endpoint |

A user with only Read access to the Webroot connection in Conduit cannot call them. If a
call is refused, tell the user an Admin grant on Webroot is required and stop; do not try
to reconstruct the answer from other tools.

The command tools are **history only**. The `command` argument is a filter; nothing is
issued.

## Anti-triggers

- **Detections and blocks**: use [threat-review](../threat-review/SKILL.md).
- **Endpoint health counts**: use [endpoint-health](../endpoint-health/SKILL.md).

## Workflow: access review or offboarding check

1. `webroot_admins_list` for console-level administrators and roles.
2. For each customer site in scope (`webroot_sites_list` for IDs),
   `webroot_admins_list_site` for who can reach that site and at what level. Customer
   staff with site access show up here.
3. Compare with the list of current technicians (and the departed person's name or email
   when this is an offboarding check). Flag:
   - departed staff still listed;
   - shared or generic accounts (`admin@`, `it@`) with console-level roles;
   - more full-access console admins than the team needs;
   - the API console user Conduit connects as, if it has a broader role than read-only
     work needs.
4. Recommend the changes for a console administrator to make in the GSM console. This
   plugin cannot remove or change an admin.

## Workflow: agent command history

`commandState` values: 1 elapsed, 2 not yet received, 3 executed, 4 scheduled,
5 cancelled, 6 failed.

1. `webroot_commands_list_site` with a date range, ordered by `daterequested` descending
   (the default). Filter with `command` when you know what you are looking for. Page with
   `pageNr` until you have `TotalAvailable` records.
2. Patterns worth raising:
   - **`uninstall`, `deactivate` or `changekeycode`** on several endpoints in a short window.
     That is how an attacker with console access, or a rogue insider, removes protection.
     Confirm each one maps to a ticket or a planned change.
   - **Commands stuck at 2 (not yet received)** for days: the endpoint is offline or the
     agent is broken; the action never happened.
   - **Failed (6) scans or cleanups** after a detection: the infection may still be there.
   - **`sysisolate`** commands: confirm the endpoint was later released if the incident is
     closed.
3. For one machine, `webroot_commands_list_endpoint` gives the same history scoped to it.

## Data handling

`webroot_admins_list` and `webroot_admins_list_site` return personal data: names, email
addresses, phone numbers and roles. Use them only when the task needs to know who has
access, and summarise rather than pasting full contact details into tickets or chat.

## Gotchas

- The command records are documented as endpoint, command, parameters, state and dates.
  If a record does not name who issued it, correlate with the PSA ticket or change record
  for the "who" rather than guessing.
- Admins are listed by the console user Conduit connects as. If that user's own role is
  limited, the listing may be incomplete; say so if the result looks short.
