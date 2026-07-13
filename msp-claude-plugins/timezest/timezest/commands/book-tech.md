---
description: Book a TimeZest scheduling request for a technician against a PSA ticket
argument-hint: "<psa_ticket> [resource] [appointment_type]"
arguments: [psa_ticket, resource, appointment_type]
---

# TimeZest Book a Tech

Create a TimeZest scheduling request that books a technician against a
ConnectWise / Autotask / Halo PSA ticket and issues the customer a
self-service booking link.

## Prerequisites

- TimeZest MCP server connected with a valid `TIMEZEST_API_TOKEN`
- The PSA ticket ID and the PSA system it lives in
- Tools: `timezest_navigate`, `timezest_agents_list`,
  `timezest_teams_list`, `timezest_resources_list`,
  `timezest_appointment_types_list`,
  `timezest_scheduling_create_request`

## Steps

1. **Parse the PSA ticket**

   Split `psa_ticket` into a PSA `type` (`connectwise`, `autotask`, or
   `halo`) and an `id`. This becomes the `associatedEntities` entry.

2. **Resolve the resource**

   - If `resource` names a person: `timezest_navigate` to `agents`,
     call `timezest_agents_list`, match by name.
   - If it names a team: navigate to `teams`, call
     `timezest_teams_list`.
   - If omitted: navigate to `resources`, call
     `timezest_resources_list` and pick from the active pool.

   Confirm ambiguous name matches with the relevant `_get` tool.

3. **Resolve the appointment type**

   `timezest_navigate` to `appointment_types`, call
   `timezest_appointment_types_list`, and match `appointment_type` by
   name and duration. If omitted, the create call will elicit one.

4. **Create the scheduling request**

   `timezest_navigate` to `scheduling`, call
   `timezest_scheduling_create_request` with:

   - `appointmentTypeId` (resolved above)
   - `triggerMode: "pod"` so the PSA workflow fires
   - `endUser` with at least the customer name (email when known)
   - `resourceIds` set to the resolved agent or team ID
   - `associatedEntities` with the parsed PSA `type` and `id`
   - `timeRange` with an IANA `timezone` if a window was given

5. **Confirm the outcome**

   Report the scheduling request ID. If `triggerMode` was
   `generate_url`, surface the `bookingUrl`. For `pod`, note that the
   PSA workflow will carry the link to the customer.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| psa_ticket | string | Yes | PSA reference, e.g. `connectwise:88421` |
| resource | string | No | Agent or team name; omit for full pool |
| appointment_type | string | No | Appointment type name |

## Examples

### Book a named tech for a ConnectWise ticket

```
/book-tech connectwise:88421 "Maria Lopez" "Onsite Visit"
```

### Book any available tech for an Autotask ticket

```
/book-tech autotask:T20240199
```

## Related Commands

- `/search-scheduling` — List recent scheduling requests by state
- `/scheduling-pipeline` — Full pipeline view across resources
- `/resource-roster` — See bookable agents and teams first
