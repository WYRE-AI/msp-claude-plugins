---
name: "ConnectWise Automate Clients"
description: >
  ConnectWise Automate client management: client CRUD, client identifiers,
  locations, client hierarchy, groups, extra data fields (EDFs), and
  client-level settings.
when_to_use: >-
  When creating, reading, updating, and deleting client organizations. Use when: automate client,
  automate customer, automate location, client management, client settings, client groups, client
  edf, labtech client, or automate organization.
---

# ConnectWise Automate Client Management

## Overview

Clients in ConnectWise Automate represent customer organizations. Each client can have multiple locations (physical sites), and computers belong to specific locations within clients. This skill covers client CRUD operations, location management, client-level settings, and group configurations.

## Anti-triggers

- **The PSA account record** — the same customer exists in ConnectWise
  PSA as a `company`, with a separate ID space; agreements, invoicing and
  ticket routing hang off that record, not this one. Use
  `connectwise-psa-companies`.
- **The machines inside a client** — clients and locations are containers;
  endpoint status, inventory and patching are
  `connectwise-automate-computers`.

## Key Concepts

### Client Hierarchy

```
Client (Organization)
├── Location 1 (Physical Site)
│   ├── Computer A
│   └── Computer B
├── Location 2
│   └── Computer C
└── Client Settings
    ├── EDFs (Custom Fields)
    ├── Groups
    └── Policies
```

### Client Identifiers

| Identifier | Type | Description | Example |
|------------|------|-------------|---------|
| `ClientID` | integer | Primary key, auto-incrementing | `100` |
| `Name` | string | Client display name | `Acme Corporation` |
| `ExternalID` | string | External system reference | `CW-12345` |
| `City` | string | Primary city | `Chicago` |

### Location Identifiers

| Identifier | Type | Description | Example |
|------------|------|-------------|---------|
| `LocationID` | integer | Primary key | `1` |
| `Name` | string | Location name | `Main Office` |
| `ClientID` | integer | Parent client | `100` |
| `Address` | string | Street address | `123 Main St` |

## Field Reference

See [references/fields.md](references/fields.md) for the complete `Client`, `Location`, and `Group` field reference (TypeScript interfaces).

## API Patterns

See [references/api.md](references/api.md) for the complete endpoint catalog: client CRUD, location CRUD, client computers/groups, and EDF get/update — with full request/response JSON examples.

## Workflows

### Client Lookup by Name

```javascript
async function findClientByName(client, name) {
  const clients = await client.request(
    `/Clients?condition=Name contains '${name}'`
  );

  if (clients.length === 0) {
    return { found: false, suggestions: [] };
  }

  if (clients.length === 1) {
    return { found: true, client: clients[0] };
  }

  return {
    found: false,
    ambiguous: true,
    suggestions: clients.map(c => ({
      name: c.Name,
      id: c.ClientID,
      city: c.City,
      computerCount: c.ComputerCount
    }))
  };
}
```

### Create Client with Default Location

```javascript
async function createClientWithLocation(apiClient, clientData, locationName = 'Main Office') {
  // Create the client
  const newClient = await apiClient.request('/Clients', {
    method: 'POST',
    body: JSON.stringify(clientData)
  });

  // Create default location
  const location = await apiClient.request(
    `/Clients/${newClient.ClientID}/Locations`,
    {
      method: 'POST',
      body: JSON.stringify({
        Name: locationName,
        Address1: clientData.Address1,
        City: clientData.City,
        State: clientData.State,
        Zip: clientData.Zip
      })
    }
  );

  return {
    client: newClient,
    location: location
  };
}
```

### Bulk Client Report

```javascript
async function generateClientReport(apiClient) {
  const clients = await apiClient.request('/Clients?pageSize=500');

  const report = [];

  for (const client of clients) {
    const locations = await apiClient.request(
      `/Clients/${client.ClientID}/Locations`
    );

    report.push({
      name: client.Name,
      id: client.ClientID,
      contact: client.ContactName,
      email: client.ContactEmail,
      computers: client.ComputerCount,
      locations: locations.map(l => l.Name)
    });

    // Respect rate limits
    await sleep(100);
  }

  return report;
}
```

### Client Health Dashboard

```javascript
async function getClientHealth(apiClient, clientId) {
  const client = await apiClient.request(`/Clients/${clientId}`);
  const computers = await apiClient.request(
    `/Clients/${clientId}/Computers?pageSize=500`
  );

  const online = computers.filter(c => c.Status === 'Online').length;
  const offline = computers.filter(c => c.Status === 'Offline').length;

  return {
    client: client.Name,
    totalComputers: computers.length,
    online,
    offline,
    healthPercentage: Math.round((online / computers.length) * 100),
    offlineComputers: computers
      .filter(c => c.Status === 'Offline')
      .map(c => ({
        name: c.Name,
        lastContact: c.LastContact
      }))
  };
}
```

### Update Client EDFs

```javascript
async function updateClientEDFs(apiClient, clientId, edfUpdates) {
  const results = [];

  // Get existing EDFs
  const edfs = await apiClient.request(
    `/Clients/${clientId}/ExtraDataFields`
  );

  for (const [name, value] of Object.entries(edfUpdates)) {
    const edf = edfs.find(e => e.Name === name);

    if (edf) {
      await apiClient.request(
        `/Clients/${clientId}/ExtraDataFields/${edf.EDFID}`,
        {
          method: 'PUT',
          body: JSON.stringify({ Value: value })
        }
      );
      results.push({ name, status: 'updated', value });
    } else {
      results.push({ name, status: 'not_found' });
    }
  }

  return results;
}
```

## Error Handling

### Common Client API Errors

| Error | Status | Cause | Resolution |
|-------|--------|-------|------------|
| Client not found | 404 | Invalid ClientID | Verify client exists |
| Duplicate name | 400 | Client name exists | Use unique name |
| Invalid EDF | 400 | EDF doesn't exist | Check EDF configuration |
| Permission denied | 403 | Insufficient rights | Check user permissions |
| Has computers | 400 | Client has assigned computers | Remove computers first |

### Error Response Example

```json
{
  "error": {
    "code": "BadRequest",
    "message": "Cannot delete client with assigned computers"
  }
}
```

See [references/examples.md](references/examples.md) for a "Safe Client Deletion" helper that checks for assigned computers, optionally reassigns them, then deletes the client.

## Best Practices

1. **Use ExternalID for integrations** - Link to PSA/CRM systems
2. **Standardize naming conventions** - Consistent client names
3. **Create locations for each site** - Better organization
4. **Use EDFs for business data** - Contract type, SLA level, etc.
5. **Maintain contact information** - Keep primary contacts updated
6. **Group by client type** - MSP vs internal, etc.
7. **Regular client audits** - Review inactive clients
8. **Document client-specific settings** - Notes in Comment field
9. **Use groups for policies** - Apply settings at group level
10. **Plan location structure** - Consider VPN, network segments

## Client Onboarding Workflow

```javascript
async function onboardNewClient(apiClient, clientInfo) {
  const results = {
    steps: [],
    success: true
  };

  try {
    // Step 1: Create client
    const client = await apiClient.request('/Clients', {
      method: 'POST',
      body: JSON.stringify({
        Name: clientInfo.name,
        Address1: clientInfo.address,
        City: clientInfo.city,
        State: clientInfo.state,
        Zip: clientInfo.zip,
        Phone: clientInfo.phone,
        ContactName: clientInfo.contactName,
        ContactEmail: clientInfo.contactEmail,
        ExternalID: clientInfo.externalId
      })
    });
    results.steps.push({ step: 'Create Client', status: 'success', id: client.ClientID });

    // Step 2: Create primary location
    const location = await apiClient.request(
      `/Clients/${client.ClientID}/Locations`,
      {
        method: 'POST',
        body: JSON.stringify({
          Name: 'Main Office',
          Address1: clientInfo.address,
          City: clientInfo.city,
          State: clientInfo.state,
          Zip: clientInfo.zip
        })
      }
    );
    results.steps.push({ step: 'Create Location', status: 'success', id: location.LocationID });

    // Step 3: Set EDFs
    if (clientInfo.edfs) {
      await updateClientEDFs(apiClient, client.ClientID, clientInfo.edfs);
      results.steps.push({ step: 'Set EDFs', status: 'success' });
    }

    // Step 4: Add to groups (if specified)
    if (clientInfo.groups) {
      for (const groupId of clientInfo.groups) {
        await apiClient.request(`/Groups/${groupId}/Clients`, {
          method: 'POST',
          body: JSON.stringify({ ClientID: client.ClientID })
        });
      }
      results.steps.push({ step: 'Add to Groups', status: 'success' });
    }

    results.clientId = client.ClientID;
    results.locationId = location.LocationID;

  } catch (error) {
    results.success = false;
    results.error = error.message;
  }

  return results;
}
```

## Related Skills

- [ConnectWise Automate Computers](../computers/SKILL.md) - Computers within clients
- [ConnectWise Automate Scripts](../scripts/SKILL.md) - Client-scoped scripts
- [ConnectWise Automate Monitors](../monitors/SKILL.md) - Client monitoring
- [ConnectWise Automate Alerts](../alerts/SKILL.md) - Client alerts
- [ConnectWise Automate API Patterns](../api-patterns/SKILL.md) - Authentication and pagination
