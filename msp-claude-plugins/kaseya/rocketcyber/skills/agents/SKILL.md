---
name: "RocketCyber Agents"
description: >
  RocketCyber agent (RocketAgent) deployment, communication status, health
  monitoring, and troubleshooting: agent installation, online/offline status,
  agent-to-account mapping, and platform support.
when_to_use: >-
  When working with RocketCyber agents (RocketAgent). Use when: rocketcyber agent, rocketagent,
  rocketcyber endpoint, rocketcyber deployment, agent offline rocketcyber, agent health
  rocketcyber, rocketcyber online, endpoint protection rocketcyber, or rocketcyber install agent.
---

# RocketCyber Agent Management

## Overview

RocketAgent is the endpoint agent deployed by RocketCyber to customer workstations and servers. It provides the telemetry pipeline for threat detection -- collecting event data, monitoring processes, and reporting back to the RocketCyber SOC platform. Agent health directly impacts the MSP's security coverage.

Key agent functions:

- **Threat Telemetry** - Collects endpoint events (process execution, file changes, network connections)
- **SOC Communication** - Reports events to RocketCyber's cloud analysis engine
- **Endpoint Visibility** - Provides the SOC with real-time endpoint status
- **Detection Coverage** - Endpoints without healthy agents have no SOC coverage

## Anti-triggers

- **Claude subagents** — "agent" here is a RocketAgent endpoint sensor,
  never an AI subagent definition under `agents/*.md`.
- **What the sensor detected** — this skill covers agent health and
  deployment; findings are `rocketcyber-incidents` and software
  telemetry is `rocketcyber-apps`.
- **The RMM agent on the same endpoint** — a machine usually runs both.
  The managed-device record is `datto-rmm-devices`, and Kaseya VSA also
  calls its endpoints "agents" (`kaseya-vsa-api-patterns`).

## Key Concepts

### Agent Lifecycle

```
┌──────────────┐    Deploy    ┌────────────┐    Checks In    ┌──────────┐
│  Unmanaged   │ ──────────>  │ Installed  │ ─────────────>  │  Online  │
│  Endpoint    │              │ (Pending)  │                 │          │
└──────────────┘              └────────────┘                 └──────────┘
                                                                  │
                                                    Communication │ Lost
                                                                  ▼
                                                             ┌──────────┐
                                                             │ Offline  │
                                                             └──────────┘
```

### Communication Status

| Status | Description | Action |
|--------|-------------|--------|
| **Online** | Agent is communicating normally with the RocketCyber cloud | No action needed |
| **Offline** | Agent has not communicated within the expected interval | Investigate connectivity, service status |

### Agent Types and Platforms

RocketAgent supports multiple platforms (verify against current documentation):

| Platform | Description |
|----------|-------------|
| Windows | Primary platform -- workstations and servers |
| macOS | Mac endpoint support |
| Linux | Server monitoring (verify availability) |

## Field Reference

| Field | Type | Description |
|-------|------|-------------|
| `id` | integer | Unique agent identifier |
| `hostname` | string | Endpoint hostname |
| `accountId` | integer | Customer account the agent belongs to |
| `accountName` | string | Customer account name (verify against API docs) |
| `platform` | string | Operating system platform (Windows, macOS, Linux) |
| `osVersion` | string | OS version details (verify against API docs) |
| `status` | string | Communication status: Online, Offline |
| `lastSeen` | datetime | Last successful communication timestamp |
| `agentVersion` | string | Installed RocketAgent version (verify against API docs) |
| `ipAddress` | string | Last known IP address (verify against API docs) |
| `installedAt` | datetime | When the agent was first installed (verify against API docs) |

> **Note:** Field names are inferred from the Celerium PowerShell wrapper. Verify exact field names against RocketCyber API responses.

## API Patterns

### List All Agents

```bash
# All agents across all accounts
curl -s "https://api-${ROCKETCYBER_REGION:-us}.rocketcyber.com/v3/agents" \
  -H "Authorization: Bearer ${ROCKETCYBER_API_KEY}"
```

**Response (verify against API docs):**
```json
{
  "data": [
    {
      "id": 5001,
      "hostname": "WORKSTATION-01",
      "accountId": 12345,
      "platform": "Windows",
      "status": "Online",
      "lastSeen": "2026-02-23T10:15:00Z",
      "agentVersion": "3.2.1"
    }
  ],
  "totalCount": 350,
  "page": 1,
  "limit": 50
}
```

### Filter Agents by Account

```bash
# Agents for a specific customer
curl -s "https://api-us.rocketcyber.com/v3/agents?accountId=12345" \
  -H "Authorization: Bearer ${ROCKETCYBER_API_KEY}"
```

### Get Agent Details

```bash
# Single agent with full details
curl -s "https://api-us.rocketcyber.com/v3/agents/5001" \
  -H "Authorization: Bearer ${ROCKETCYBER_API_KEY}"
```

**Response (verify against API docs):**
```json
{
  "id": 5001,
  "hostname": "WORKSTATION-01",
  "accountId": 12345,
  "accountName": "Acme Corporation",
  "platform": "Windows",
  "osVersion": "Windows 11 Pro 23H2",
  "status": "Online",
  "lastSeen": "2026-02-23T10:15:00Z",
  "agentVersion": "3.2.1",
  "ipAddress": "192.168.1.50",
  "installedAt": "2025-06-15T09:00:00Z"
}
```

## Common Workflows

### Agent Health Audit

1. **List all agents** -- retrieve full agent inventory
2. **Identify offline agents** -- filter for status=Offline or agents not seen recently
3. **Group by account** -- identify which customers have coverage gaps
4. **Calculate coverage** -- compare agent count to expected endpoint count
5. **Report findings** -- generate per-customer agent health summary

### Troubleshooting Offline Agents

When an agent shows as Offline:

1. **Check last seen timestamp** -- determine how long the agent has been offline
2. **Verify endpoint is powered on** -- check with RMM tool (Datto RMM, NinjaOne, etc.)
3. **Check RocketAgent service** -- verify the service is running on the endpoint
   ```powershell
   Get-Service -Name "RocketAgent" | Select-Object Status, StartType
   ```
4. **Check network connectivity** -- verify endpoint can reach `*.rocketcyber.com`
5. **Check agent version** -- outdated agents may have communication issues
6. **Reinstall if needed** -- redeploy the agent from the RocketCyber console

### New Customer Onboarding

1. **Create customer account** in RocketCyber (or verify it exists)
2. **Download agent installer** from the RocketCyber console for the customer account
3. **Deploy agents** to all customer endpoints via RMM tool or manual installation
4. **Verify agents check in** -- confirm all agents show Online status
5. **Validate coverage** -- ensure agent count matches expected endpoint count

### Agent Version Compliance

1. List all agents across accounts
2. Group by `agentVersion`
3. Identify agents on outdated versions
4. Plan upgrade rollout for non-current agents

## Error Handling

### Common Errors

| Scenario | HTTP Code | Resolution |
|----------|-----------|------------|
| Invalid API key | 401 | Verify key in Provider Settings > API |
| Agent not found | 404 | Verify agent ID; agent may have been removed |
| Account has no agents | 200 (empty) | Agents not yet deployed to this customer |
| Rate limited | 429 | Back off 30 seconds, retry |

### No Agents Found

```
No agents found for account ID 12345.

This could mean:
- Agents have not been deployed to this customer
- The account ID is incorrect (verify with /accounts endpoint)
- Agents were recently removed
```

## Related Skills

- [api-patterns](../api-patterns/SKILL.md) - Authentication, pagination, error handling
- [incidents](../incidents/SKILL.md) - Incidents reference affected devices/agents
- [accounts](../accounts/SKILL.md) - Account hierarchy (agent-to-account mapping)
- [apps](../apps/SKILL.md) - Applications detected on agent endpoints
