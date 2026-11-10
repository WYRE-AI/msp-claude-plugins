---
name: "KPN Network Checks"
description: >
  Address- and number-level lookups against KPN: current and planned
  outages at a Dutch address (Disturbance Check), available access
  technology and speeds at an address (Speed Check), and the date of the
  last SIM swap on a KPN mobile number as a fraud signal.
when_to_use: >-
  When a Dutch customer site on KPN has connectivity problems, when scoping
  an internet upgrade or site survey in the Netherlands, or before resetting
  SMS-based MFA for a user on a KPN mobile number. Use when: kpn storing,
  kpn outage, kpn down, internet down netherlands, glasvezel, fibre
  availability, kpn speed, sim swap check, verify phone before mfa reset.
---

# KPN Network Checks

## Overview

Three read-only checks that need only the main KPN project keys. They cover
the Netherlands only.

## Addresses

Both address tools take a Dutch postcode (`1234AB`; spaces and lowercase are
accepted), a house number, and an optional extension (toevoeging, e.g. `A`,
`bis`). Get the extension right: flats at the same number can be on
different lines.

## Outage triage: `kpn_disturbances_check`

Returns current and planned disturbances (broadband, fixed, mobile,
generic) for the address. An empty result is a real answer: KPN knows of
no disturbance there. It is **not** an error, and it does not rule out a
problem with the customer's own equipment or line.

Typical flow when a KPN site is down:
1. `kpn_disturbances_check` for the site address.
2. If a disturbance is listed, report its type, start and expected end, and
   stop troubleshooting on-site equipment.
3. If nothing is listed, continue with the customer's own network
   (router/firewall in the RMM) and consider a KPN ticket.

## Availability: `kpn_availability_check`

Lists the access technologies available at the address (fibre, copper),
maximum download/upload speeds, planned fibre dates and third-party fibre
information. Use it for upgrade conversations and site surveys, not for
diagnosing an outage.

## SIM-swap check: `kpn_sim_swap_get_date`

Returns when the SIM behind a mobile number was last swapped. A recent swap
just before a password or MFA reset request is a classic account-takeover
signal. Pass `maxAgeHours` (for example 72) to get a direct
`swappedWithinMaxAge` flag.

- Only KPN NL mobile numbers are covered; others return "not a KPN mobile
  number or unknown".
- It is a fraud check on a person's number: use it for the user's own
  security, and don't run it speculatively.
- A recent swap is a reason to verify identity another way before resetting
  anything, not proof of fraud.
