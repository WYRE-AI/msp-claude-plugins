---
name: "Dubber User Lifecycle"
description: >
  Adding, updating and removing Dubber users on a client account during staff
  onboarding and offboarding, and reviewing who has a Dubber login. Covers
  the user-to-Dub.Point relationship, what to check before removing a user,
  why user deletion is irreversible and admin tier in Conduit, and what this
  connector cannot do (moving a Dub.Point to another user).
when_to_use: >-
  When a client starts or leaves staff who use Dubber, or asks who has Dubber
  access. Use when: add dubber user, new starter call recording, remove dubber
  user, offboard dubber, delete dubber user, dubber access review, who has
  dubber access, rename dubber user.
---

# Dubber User Lifecycle

## Overview

Dubber users belong to an account. A user can own one or more Dub.Points (the recorded
lines), and each Dub.Point's `user` field links back to the user as a URL ending in
`/users/<USER_ID>`. Onboarding usually means creating the user; offboarding means deciding
what happens to their recorded lines and existing recordings before anything is removed.

| Tool | Conduit tier |
|---|---|
| `dubber_users_list`, `dubber_users_get`, `dubber_dub_points_list` | Read |
| `dubber_users_create`, `dubber_users_update` | Write |
| `dubber_users_delete` | **Admin** |

## Anti-triggers

- **Finding a leaver's calls for a handover or dispute** — use `dubber-call-retrieval`.

## Access review

1. `dubber_users_list` for the account.
2. `dubber_dub_points_list` and map each Dub.Point's `user` URL to a user ID.
3. Report each user with email, name and their Dub.Points. Flag users with no Dub.Point
   (portal-only logins) and Dub.Points whose user is not in the user list.
4. Compare against the client's staff list or PSA contacts if the user provides one.

`dubber_users_list` returns one Dubber page and has no paging argument. On a large account
state that the list may be incomplete.

## Onboarding

1. Check the person does not already exist: `dubber_users_list`, match on email.
2. `dubber_users_create` with `accountId`, `email` and `name`.
3. Report the new user ID. Connecting their phone line is a Dub.Point and phone-system
   task; `dubber_dub_points_create` takes a raw Dubber object, so only use it when the user
   gives you the exact fields the client's telecom system needs.

## Offboarding

1. Find the user: `dubber_users_list`, match on email, then `dubber_users_get`.
2. Find their Dub.Points with `dubber_dub_points_list`.
3. Ask the user what should happen to those lines and the recordings already made.
   Recordings are compliance records; removing a login is not a reason to remove calls.
4. Prefer a reversible change first. If the client only needs the user's details changed
   (for example a name or role), use `dubber_users_update`. Read the user with
   `dubber_users_get` first and change only what is needed. Whether Dubber offers a
   disabled state through this API is not documented; do not assume one exists.
5. Delete only on an explicit request. `dubber_users_delete` is irreversible and admin tier
   in Conduit, so a caller with write access is refused. It asks for confirmation; through
   Conduit it needs `confirm_destructive_action: true`. Confirm the exact user ID and email
   with the user before passing it.
6. Record what was done: user, Dub.Points affected, and who approved the change.

## Gotchas

- Users do not appear in recordings. To see a person's calls you go through their
  Dub.Points.
- `dubber_users_update` and `dubber_dub_points_create` pass a `data` object to Dubber
  as-is. Dubber does not publish a full schema, so copy field names from a current object
  rather than guessing.
- There is no tool to move a Dub.Point to a different user. That is done in the Dubber
  portal or the phone system.
