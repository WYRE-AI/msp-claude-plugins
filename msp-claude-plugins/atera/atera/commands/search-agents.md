---
description: Search for RMM agents in Atera by customer or machine name
argument-hint: "<query> [type] [online]"
arguments: [query, type, online]
---

# Search Atera Agents

Search for RMM agents in Atera by customer or machine name.

## Prerequisites

- Valid Atera API key configured
- User must have agent read permissions

## Steps

1. **Determine search type**
   - If `--type customer`, search by customer
   - If `--type machine`, search by machine name
   - If not specified, try customer first, then machine

2. **Execute search**
   - For customer search: `GET /api/v3/agents/customer/{customerId}`
   - For machine search: `GET /api/v3/agents/machine/{machineName}`
   - For all: `GET /api/v3/agents` with pagination

3. **Filter results**
   - Apply online status filter if specified
   - Sort by last seen date

4. **Return agent list**
   - Agent ID
   - Machine name
   - Customer name
   - Online status
   - Last seen timestamp
   - OS information

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| query | string | Yes | - | Customer name/ID or machine name |
| type | string | No | auto | customer, machine, or all |
| online | string | No | all | true, false, or all |

## Examples

### Search by Customer Name

```
/search-agents "Acme Corp"
```

### Search by Machine Name

```
/search-agents "DESKTOP-ABC123" --type machine
```

### Search Online Agents Only

```
/search-agents "Acme Corp" --online true
```

### Search All Agents for Customer ID

```
/search-agents 12345 --type customer
```

## Output

```
Agents Found: 15

| ID     | Machine Name      | Customer        | Status  | Last Seen           | OS                    |
|--------|-------------------|-----------------|---------|---------------------|-----------------------|
| 98765  | DESKTOP-ABC123    | Acme Corp       | Online  | 2024-02-15 14:30:00 | Windows 11 Pro        |
| 98766  | SERVER-DC01       | Acme Corp       | Online  | 2024-02-15 14:29:45 | Windows Server 2022   |
| 98767  | LAPTOP-JD01       | Acme Corp       | Offline | 2024-02-14 18:15:00 | Windows 10 Enterprise |
...

Online: 12 | Offline: 3
```

## Detailed Agent View

When querying a single agent, show extended details:

```
Agent Details: DESKTOP-ABC123 (ID: 98765)

Customer: Acme Corporation
Status: Online
Last Seen: 2024-02-15 14:30:00

System Information:
- OS: Windows 11 Pro (22H2)
- CPU: Intel Core i7-12700
- RAM: 32 GB
- Disk: 256 GB SSD (45% used)

Network:
- IP Address: 192.168.1.100
- MAC Address: 00:1A:2B:3C:4D:5E
- Domain: ACME.LOCAL

Agent Version: 2.0.1.25
Installed: 2023-06-15 09:00:00
```

## Error Handling

### Customer Not Found

```
Customer not found: "Acme"

Did you mean one of these?
- Acme Corporation (ID: 12345)
- Acme Industries (ID: 12346)
```

### No Agents Found

```
No agents found for customer "Acme Corp"

Possible reasons:
- No agents installed for this customer
- All agents have been deleted
- Customer name may be misspelled
```

### Machine Not Found

```
No agent found with machine name "DESKTOP-XYZ"

Try searching by partial name or use --type all to list all agents.
```

### Rate Limit Exceeded

```
Rate limit exceeded (700 req/min)

Waiting 30 seconds before retry...
```

## API Patterns

### Get All Agents (Paginated)
```http
GET /api/v3/agents?page=1&itemsInPage=50
X-API-KEY: {api_key}
```

### Get Agents by Customer
```http
GET /api/v3/agents/customer/{customerId}
X-API-KEY: {api_key}
```

### Get Agent by Machine Name
```http
GET /api/v3/agents/machine/{machineName}
X-API-KEY: {api_key}
```

## Related Commands

- `/create-ticket` - Create a ticket for an agent's device
- `/run-powershell` - Execute PowerShell on an agent
