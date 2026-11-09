---
name: "Datto SaaS Protection Seat Coverage"
description: >
  Seat-coverage and backup-health sweep for Datto SaaS Protection: finding
  unprotected and paused seats per customer, reading per-application backup
  status and detailed stats, and proposing (never silently applying) seat
  licence changes with datto_saas_bulk_seat_change.
when_to_use: >-
  When checking which Microsoft 365 or Google Workspace users are actually backed up, or whether
  SaaS backups are failing. Use when: saas backup coverage, unprotected seats, paused seats,
  backupify health, m365 backup failing, seat audit, or license new users for backup.
---

# Datto SaaS Protection Seat Coverage

## Overview

The two questions an MSP asks of SaaS Protection every week are "is everyone who should be protected actually protected?" and "are the backups for protected seats succeeding?". Both are answered from read tools; only the remediation step writes.

## Anti-triggers

- **Auth, tool list, error codes** — use `datto-saas-protection-api-patterns`.
- **Restoring data** — there is no restore tool. Restores are started in the SaaS Protection portal.

## Workflow: coverage sweep

1. `datto_saas_list_domains` — every customer, with `saasCustomerId`, `externalSubscriptionId` and `seatsUsed`. Use `search` to narrow to one customer.
2. For each customer, `datto_saas_list_seats` with `seatState: "Unprotected"`, then again with `seatState: "Paused"`.
3. Group the results by `seatType` (`User`, `SharedMailbox`, `SharedDrive`, `Site`, `TeamSite`, `Team`). Unprotected `User` seats are usually the finding that matters; unprotected `Site` or `Team` seats are often deliberate.
4. Report per customer: protected count, unprotected count by type, paused count. Flag paused seats separately: they keep old backups but take no new ones.

To inspect one person, `datto_saas_get_seat` with their email (`mainId`) or `remoteId` returns the seat card.

## Workflow: backup health

1. `datto_saas_list_applications` for the customer (`daysUntil: 7` for a weekly review) — backup status per suite (Exchange, OneDrive, SharePoint, Teams, Gmail, Drive) per window.
2. `datto_saas_get_backup_stats` for the same customer — per-service last-7-day status, last backup times and storage.
3. A suite whose recent windows are failing, or whose last backup is older than a day, is the finding. Name the suite and the last good backup time.

## Remediation: licensing seats

Licensing a seat starts protection **and billing**, so it is always a proposal first:

1. Build the exact list: customer, `externalSubscriptionId`, one `seatType`, the `remoteId` values (at most 100 per call), and the action (`License`, `Pause` or `Unlicense`).
2. Show it to the user and state the billing effect.
3. Only after explicit approval, call `datto_saas_bulk_seat_change`. The server asks for confirmation itself; on clients that cannot prompt, pass `confirm: true` only for the change the user approved.

Never chain a sweep straight into a bulk change, and never `Unlicense` a seat to "clean up" without the user naming it: unlicensed seats stop being protected.

## Gotchas

- **One seat type per bulk call.** Licensing users and shared mailboxes for the same customer takes two calls.
- **`Unprotected` includes leavers.** A disabled account that still exists in the tenant shows as unprotected. Check with the customer before licensing it.
- **Spanning overlap.** If the customer also uses Spanning for the same workload, an unprotected seat here may be protected there.
