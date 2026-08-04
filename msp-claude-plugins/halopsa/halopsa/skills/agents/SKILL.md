---
name: "HaloPSA Agents"
description: >-
  HaloPSA agents (technicians) and teams as a read-only MCP surface: listing
  technicians, retrieving agent detail, listing team structures, and the
  inactive-agent filter. Agent IDs resolved here are what ticket assignment needs.
when_to_use: >-
  When assigning HaloPSA tickets, gauging team capacity, or looking up a technician or team ID.
  Use when: halopsa agent, halopsa technician, halopsa team, list agents halopsa,
  halopsa tech list, halopsa teams, find technician halopsa, agent details halopsa, or team list
  halopsa.
---

# HaloPSA Agents and Teams

## Overview

Agents in HaloPSA are the technicians who handle tickets and service delivery. Teams are groupings of agents that tickets can be assigned to. Use these tools to discover agent IDs and team structures before assigning tickets or filtering work queues.

## Anti-triggers

"Agent" is the most overloaded word in this marketplace. Here it means a
human technician.

- **Claude subagents** — definitions under `agents/*.md` are plugin
  authoring, not HaloPSA records. Nothing here configures Claude.
- **Endpoint software agents** — the sensor installed on a customer
  device is `huntress-agents` or the RMM's device skills such as
  `datto-rmm-devices`. A HaloPSA agent is never installed on anything.
- **Client-side people** — end users who raise tickets are HaloPSA
  *Users* under a client, a different entity entirely; use
  `halopsa-clients`.
- **Assigning or reassigning a ticket** — this skill resolves the
  `agent_id`; performing the assignment is `halopsa-tickets`.

## API Patterns

### List Agents

Tool: `halopsa_agents_list`

Key parameters:
- `team_id` — Filter agents by team ID
- `inactive` — Include inactive agents (default: active only)
- `limit` — Maximum results (default: 50)

Response includes:
- `record_count` — Total matching agents
- `agents` — Array of agent records with ID, name, email, team membership

### Get Agent Details

Tool: `halopsa_agents_get`

Parameters:
- `agent_id` (required) — The agent's numeric ID

Returns full agent profile including contact details, skills, team assignments, and availability settings.

### List Teams

Tool: `halopsa_teams_list`

Parameters:
- `limit` — Maximum results (default: 50)

Response includes:
- `record_count` — Total teams
- `teams` — Array of team records with ID, name, and member count

## Common Workflows

### Find an Agent by Name Before Assigning a Ticket

1. Call `halopsa_agents_list` to get all active agents
2. Search the result for the agent by name
3. Use the agent's `id` when calling `halopsa_tickets_update` to assign

### List All Technicians in a Team

1. Call `halopsa_teams_list` to find the team ID by name
2. Call `halopsa_agents_list` with `team_id` set to the team's ID
3. Review the returned agents for team membership

### Check Agent Details for Escalation

1. Call `halopsa_agents_get` with the agent's ID
2. Review availability, skills, and contact information
3. Use details to determine escalation appropriateness

## Notes

- Agent IDs are required when assigning tickets via `halopsa_tickets_update`
- Inactive agents are excluded by default — set `inactive: true` to include them when auditing
- Teams are used for ticket routing rules in HaloPSA; consult HaloPSA admin settings for routing configuration
- This skill is read-only; agent and team creation/modification must be done through the HaloPSA admin interface
