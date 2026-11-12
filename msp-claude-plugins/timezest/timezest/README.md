# TimeZest Plugin

Claude Code plugin for [TimeZest](https://timezest.com) - PSA-coupled customer scheduling for MSP technicians.

## What It Does

- **Book a tech against a PSA ticket** - Create a TimeZest scheduling request that links to a ConnectWise / Autotask / Halo ticket so the customer can self-serve their slot
- **Track scheduling requests** - Sent / clicked / booked / canceled lifecycle visibility
- **Manage agents, teams, appointment types** - Resolve the right tech and the right kind of appointment for a given ticket
- **Cancel pending bookings** - Revoke an outstanding customer link

## Installation

```
/plugin marketplace add WYRE-AI/msp-claude-plugins
/plugin install timezest
```

The plugin connects through [Conduit](https://conduit.wyre.ai) at `https://conduit.wyre.ai/v1/timezest/mcp`. Your MCP client authenticates to Conduit with OAuth (it prompts you to sign in on first use); there are no environment variables or headers to configure on the client.

## Configuration

Connect TimeZest once in the Conduit web UI (**Connections → TimeZest**). Conduit stores the token and injects it on every request; the MCP server sends it upstream as `Authorization: Bearer ...`:

| Field | Required | Description |
|-------|----------|-------------|
| API Token | Yes | TimeZest API token |

## Skills

- `api-patterns` - Auth, connectivity, polling, PSA association payload
- `scheduling` - Primary booking workflow against ConnectWise / Autotask / Halo
- `agents-and-teams` - Resolving the right technician or round-robin team
- `appointment-types` - Choosing the appointment type that matches the work
- `resources` - Surveying the combined pool of bookable agents and teams
- `psa-integration` - associatedEntities payloads and pod vs generate_url

## Agents

- `scheduling-dispatcher` - Books a technician against a PSA ticket end to end
- `psa-integration-specialist` - Audits and fixes the TimeZest-to-PSA coupling
- `booking-pipeline-auditor` - Reports on the scheduling pipeline and stale requests

## Commands

- `/search-scheduling` - List recent scheduling requests grouped by state
- `/book-tech` - Book a technician against a PSA ticket
- `/scheduling-pipeline` - Pipeline report grouped by lifecycle state and resource
- `/stale-requests` - Find requests still waiting on a customer to book
- `/resource-roster` - List bookable agents, teams, and appointment types

## Tools

Provided by the TimeZest MCP server through the WYRE MCP Gateway:

All tools are listed directly; no navigate step is needed. Use `timezest_status` for orientation and connectivity checks.

### Agents
- `timezest_agents_list`, `timezest_agents_get`

### Teams
- `timezest_teams_list`, `timezest_teams_get`

### Appointment Types
- `timezest_appointment_types_list`, `timezest_appointment_types_get`

### Resources
- `timezest_resources_list`

### Scheduling
- `timezest_scheduling_list`, `timezest_scheduling_get`
- `timezest_scheduling_create_request`, `timezest_scheduling_cancel`

## License

Apache-2.0
