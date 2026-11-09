---
name: "Dubber Recording Coverage Audit"
description: >
  Read-only audit that proves Dubber is actually capturing calls for a
  client: which Dub.Points (recorded lines) have recent recordings and which
  have gone silent, recordings Dubber could not match to an account, and
  whether REST-hook integrations are active and draining. Covers the tool
  sequence, the thresholds for flagging a line, and how to report gaps
  honestly when a list may be truncated.
when_to_use: >-
  When an MSP needs to confirm call recording is working for a client, before
  a compliance review, after a phone-system change, or when a client says a
  call "wasn't recorded". Use when: recording coverage, are calls being
  recorded, silent dub point, missing recordings, unidentified recordings,
  dubber health check, call recording compliance audit, webhook backlog.
---

# Dubber Recording Coverage Audit

## Overview

A recorded line can stop capturing without anyone noticing: a phone-system change, a
re-provisioned handset, or a Dub.Point left inactive. For clients with a recording
obligation (financial advice, healthcare, collections) a silent line is a compliance gap.
This audit checks each Dub.Point for recent recordings and looks for calls Dubber captured
but could not place. Every tool used here is read tier in Conduit.

## Anti-triggers

- **Finding specific calls for a dispute or QA review** — use `dubber-call-retrieval`.
- **Adding or removing Dubber users** — use `dubber-user-lifecycle`.

## Inputs

- Account ID (required; there is no tool that lists all accounts).
- Group ID (optional; needed for the unidentified-recordings check).
- Look-back window. Default: the last 7 days. Use the client's local offset.
- Which lines are expected to record. Ask the user if they have a list; otherwise treat
  every Dub.Point with an active status as expected.

## Workflow

1. **Confirm the connection.** `dubber_test_connection`. If it fails, stop and report
   the credential or region problem (see `dubber-api-patterns`).
2. **Confirm the account.** `dubber_accounts_get` with the account ID. Note the account
   name and timezone for the report.
3. **List the recorded lines.** `dubber_dub_points_list`. For each Dub.Point record its
   `id`, `name`/`label`, `status`, `external_type`, `external_identifier` and owning
   `user` (the user ID is the last segment of the URL). If exactly 20 come back, the list
   may be truncated; say so in the report.
4. **Check each line for recent calls.** For each Dub.Point call
   `dubber_recordings_list` with `dubPointId`, `startTimeFrom` set to the start of the
   window, and `limit: 1`. One returned recording is enough to prove capture. Then note
   its `start_time` as "last seen".
5. **Date the silent lines.** For a Dub.Point with no recording in the window, call
   `dubber_recordings_list` with only `dubPointId` and `limit: 1` (no time filter) to find
   the most recent call it ever recorded. No result at all means the line has never
   recorded.
6. **Look for unmatched calls.** If you have the group ID, call
   `dubber_groups_list_unidentified_recordings`. A growing pile here usually means a line
   is recording but is not mapped to a Dub.Point, which is the other half of a "missing
   recording" complaint.
7. **Check integrations.** `dubber_notifications_list`. For each subscription, note
   `event`, `url` and `active`. For active ones, call
   `dubber_notifications_list_unclaimed`; a non-empty backlog means the receiving system
   (PSA, CRM, archive) is not taking events.

## Flagging rules

| Finding | Severity |
|---|---|
| Expected line with no recording in the window and none ever | High: never captured |
| Expected line silent for the whole window but recorded before it | High: capture stopped; give the last-seen date |
| Unidentified recordings present on the group | Medium: mapping gap |
| Dub.Point status not active | Medium: confirm whether intentional |
| Inactive subscription, or active one with unclaimed events | Medium: integration broken |
| Line silent but the user is known to be on leave or the line is a spare | Info: note and move on |

A quiet line is not always broken. Weekend-only windows, part-time staff and fax or
alarm lines produce false positives. Ask before escalating a single quiet line.

## Report

Per account: account name, window, then a table of Dub.Points with name, external
identifier, user, status, recordings-in-window (yes or no) and last-seen date. Follow with
unidentified-recording count, integration status, and a short list of actions. State any
truncated list and any Dub.Point whose scan hit `scanCapReached`.

## Gotchas

- Use `limit: 1` for the presence check. Scanning a busy line's whole week costs up to
  25 Dubber requests per call against a 500-calls-per-day token budget.
- `start_time` without an offset is read as UTC. A "Monday" window in Sydney or London
  needs the right offset or it shifts by hours.
- This audit does not change anything. Fixing a silent line usually happens in the phone
  system or the Dubber portal, not through these tools.
