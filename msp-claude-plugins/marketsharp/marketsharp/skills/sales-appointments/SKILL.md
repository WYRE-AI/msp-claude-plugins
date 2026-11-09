---
name: "MarketSharp Sales Appointments"
description: >
  Reading a contractor's MarketSharp sales appointments: the schedule for a
  day or week, per-salesperson load, appointment results and result
  reasons, and close rate (sold over appointments run) by salesperson and
  lead source. Read-only; no tool is admin-gated in Conduit.
when_to_use: >-
  When someone asks what is on a contractor's sales schedule, how
  appointments resulted, or a salesperson's close rate in MarketSharp. Use
  when: marketsharp appointments, sales schedule today, who is running
  appointments, appointment results, close rate, no sale reasons, sales
  rep performance.
---

# MarketSharp Sales Appointments

## Overview

An appointment is a sales call on an inquiry (lead), assigned to one or
more salespeople. When the call is run, the salesperson records a
**result** (Sold, No Sale and the company's own variants) and often a
**result reason**. A contractor's sales manager lives on two numbers from
this data: how many appointments each rep ran, and how many sold.

All tools here are reads at Conduit's read tier. None is admin-gated.
Nothing here can book, move or result an appointment; that is done in
MarketSharp.

## Anti-triggers

- **Lead volume and lead sources before an appointment exists** - use
  [lead-pipeline](../lead-pipeline/SKILL.md).
- **Contract value of what sold** - use
  [job-backlog](../job-backlog/SKILL.md).

## Workflow: the schedule

1. `marketsharp_companies_get` for the time zone; "today" means today in
   the company's zone.
2. `marketsharp_appointments_list` with `appointmentFrom` and
   `appointmentTo` spanning the day or week. Add `salespersonId` for one
   rep. Page with `pageNumber` until a page is short.
3. `marketsharp_employees_list` to turn salesperson IDs into names.
4. For the customer and address behind an appointment,
   `marketsharp_appointments_get`, then `marketsharp_contacts_get` if the
   contact details are needed.

Present it grouped by salesperson, in time order, with customer, town and
appointment type. Leave phone numbers and email addresses out unless the
person asked for them.

## Workflow: results and close rate

1. Load the result names: `marketsharp_appointment_results_list`, and the
   same tool with `reasons: true` for result reasons.
2. Page through `marketsharp_appointments_list` for the period (by
   appointment date, not changed date).
3. Count per salesperson: appointments scheduled, appointments with a
   result (run), and appointments whose result is a sold result.
   **Close rate = sold / run.** Appointments still without a result are
   not "no sale"; report them separately as unresulted.
4. For close rate by lead source, collect the appointments' inquiry IDs,
   read the inquiries with `marketsharp_inquiries_get`, and group by
   primary lead source (names from `marketsharp_lead_sources_list`).
5. For the No Sale side, group by result reason. The top two or three
   reasons are usually the useful finding (price, spouse not present,
   financing).

## Output

A table per salesperson: scheduled, run, sold, close rate, unresulted.
Then close rate by lead source, then the leading No Sale reasons. State
the period, the time zone, and how many appointments had no result yet.

## Gotchas

- Which results count as "sold" is company-specific. Read the names from
  `marketsharp_appointment_results_list` and say which ones you counted;
  ask if it is ambiguous.
- `marketsharp_appointment_results_list` only returns active results. An
  old appointment may carry a result that has since been retired; show
  it as "retired result" rather than dropping it from the totals.
- `inquiryIds` on `marketsharp_appointments_list` takes at most 100 IDs
  per call.
- Unresulted appointments in the past are a data-hygiene finding in their
  own right: they make every close-rate figure look worse or better than
  it is.
