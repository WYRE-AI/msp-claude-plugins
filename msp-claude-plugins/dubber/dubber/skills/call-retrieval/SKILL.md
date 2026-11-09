---
name: "Dubber Call Retrieval and Tagging"
description: >
  Finding specific Dubber recordings for a complaint, billing dispute, HR
  matter or QA sample: resolving a person or line to Dub.Points, windowed
  recording searches in the client's timezone, reading recording details,
  and marking calls with tags or metadata for follow-up or retention. Covers
  which steps are read, which are write tier in Conduit, and why recording
  deletion is out of scope for this workflow.
when_to_use: >-
  When someone needs to locate, review or mark particular calls in Dubber.
  Use when: find a call, customer complaint call, call dispute, pull
  recordings for a technician, QA call sample, tag a recording, legal hold
  tag, recordings between dates, who called on, dubber recording details.
---

# Dubber Call Retrieval and Tagging

## Overview

Most Dubber requests an MSP gets are "find the call where...". Dubber has no search by
person and no server-side date filter, so the work is: resolve the person or number to
Dub.Points, list recordings for each Dub.Point in a time window, then narrow by the call
details. Finding and reading calls is read tier in Conduit. Tagging and metadata changes
are write tier.

The plugin cannot play or download audio. Give the user the recording IDs and details so
they can open the calls in the Dubber portal.

## Anti-triggers

- **Checking whether lines are recording at all** — use `dubber-recording-coverage`.

## Workflow

### 1. Pin down the request

Get the account ID, who or which line, and the time window in the client's local time.
Convert the window to ISO 8601 with an explicit offset, for example
`2026-11-02T00:00:00+11:00` to `2026-11-07T00:00:00+11:00` for a Monday-to-Friday week
in Sydney daylight time. Ask for a narrower window if the user only says "last month".

### 2. Resolve the person or line to Dub.Points

- By person: `dubber_users_list` to find the user ID, then `dubber_dub_points_list` and
  keep the Dub.Points whose `user` URL ends in `/users/<that ID>`. A person can have more
  than one Dub.Point (desk phone and softphone).
- By phone-system identifier: `dubber_dub_points_find` with the external-system
  identifiers, then `dubber_dub_points_get` for detail.
- By team: use `teamId` on the recordings call instead.

### 3. List recordings in the window

Call `dubber_recordings_list` once per Dub.Point with `dubPointId`, `startTimeFrom`,
`startTimeTo` and a `limit` that fits the request (100 is usually enough for a week).
`query` passes a search string to Dubber if the user has a number or keyword. If
`hasMore` is true, continue with `cursor=<nextCursor>` and `offset=<remainingOffset>`,
keeping the same `dubPointId` and window.

Narrow the results by the fields on each recording: `from`, `to`, `call_type`,
`duration`, `start_time`. Present a short table, newest first.

### 4. Read the candidates

`dubber_recordings_get` for each likely match returns its metadata, tags and duration.
Confirm the match with the user before marking anything.

### 5. Mark the calls (write tier)

- `dubber_recordings_add_tags` to label calls, for example `dispute-2026-114` or
  `legal-hold`. Tags are the simplest way for the client to find the set again in the
  portal.
- `dubber_recordings_update_metadata` replaces or updates custom metadata fields. Read the
  current metadata with `dubber_recordings_get` first and send the complete object you
  want to keep.
- `dubber_recordings_delete_tags` removes tags. It asks for confirmation; through
  Conduit it needs `confirm_destructive_action: true` after the user agrees. Removing a
  hold-style tag can let a retention rule act on the call, so confirm who asked for it.

## Out of scope: deleting recordings

`dubber_recordings_delete` permanently destroys the audio and its compliance record. It is
write tier in Conduit, not admin, so a technician with write access can reach it. Do not
use it in a retrieval workflow. If the user asks to delete a call, stop and confirm there
is a written instruction from the client's authorised contact and no legal hold, then
confirm the exact recording ID before passing `confirm_destructive_action: true`.

## Gotchas

- A window without an offset is UTC. A Sydney or Los Angeles day shifts by many hours.
- A date-only `startTimeTo` includes that whole day. A date-time `startTimeTo` is
  exclusive.
- `dubPointId` and `teamId` cannot be combined, and a `cursor` must be reused with the
  same one.
- Calls Dubber could not match to a Dub.Point will not appear under any Dub.Point. If a
  call is missing, check `dubber_groups_list_unidentified_recordings` on the group.
