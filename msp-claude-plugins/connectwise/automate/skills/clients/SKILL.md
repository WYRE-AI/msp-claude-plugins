---
name: "ConnectWise Automate Clients"
description: >
  Use this skill when working with ConnectWise Automate clients - creating,
  reading, updating, and deleting client organizations. Covers client identifiers,
  locations, client-level settings, groups, extra data fields (EDFs), and
  client hierarchy management.
when_to_use: >-
  When creating, reading, updating, and deleting client organizations. Use when: automate client,
  automate customer, automate location, client management, client settings, client groups, client
  edf, labtech client, or automate organization.
---

# ConnectWise Automate Client Management

## Overview

Clients in ConnectWise Automate represent customer organizations. Each client can have multiple locations (physical sites), and computers belong to specific locations within clients. This skill covers client CRUD operations, location management, client-level settings, and group configurations.

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

### Client Fields

```typescript
interface Client {
  // Identifiers
  ClientID: number;             // Primary key
  Name: string;                 // Display name
  ExternalID: string;           // External reference

  // Contact Information
  Address1: string;             // Street address line 1
  Address2: string;             // Street address line 2
  City: string;                 // City
  State: string;                // State/Province
  Zip: string;                  // Postal code
  Country: string;              // Country
  Phone: string;                // Primary phone
  Fax: string;                  // Fax number
  Website: string;              // Website URL

  // Primary Contact
  ContactName: string;          // Primary contact name
  ContactEmail: string;         // Primary contact email
  ContactPhone: string;         // Primary contact phone

  // Settings
  Comment: string;              // Client notes
  DefaultRouterAddress: string; // Default gateway
  DateAdded: string;            // Creation date

  // Counts
  ComputerCount: number;        // Total computers
  LocationCount: number;        // Total locations

  // Extra Data Fields
  ExtraData: {
    [key: string]: string;
  };
}
```

### Location Fields

```typescript
interface Location {
  // Identifiers
  LocationID: number;           // Primary key
  ClientID: number;             // Parent client
  Name: string;                 // Location name

  // Address
  Address1: string;
  Address2: string;
  City: string;
  State: string;
  Zip: string;
  Country: string;
  Phone: string;

  // Network
  Router: string;               // Default router IP
  NetworkProbe: number;         // Network probe computer ID

  // Settings
  Comment: string;              // Location notes
  DateAdded: string;            // Creation date

  // Counts
  ComputerCount: number;        // Computers at this location

  // Extra Data Fields
  ExtraData: {
    [key: string]: string;
  };
}
```

### Group Fields

```typescript
interface Group {
  GroupID: number;              // Primary key
  Name: string;                 // Group name
  FullPath: string;             // Full hierarchy path
  ParentID: number;             // Parent group ID
  ClientID: number;             // 0 for global groups
  Template: number;             // Template group ID
  AutoJoinScript: number;       // Auto-join script ID

  // Limits
  LimitToParent: number;        // Limit to parent group
  NetworkProbe: number;         // Network probe

  // Scripts
  Scripts: number[];            // Associated script IDs
  Monitors: number[];           // Associated monitor IDs
}
```

## API Patterns

### List All Clients

```http
GET /cwa/api/v1/Clients?pageSize=250
Authorization: Bearer {token}
```

**Response:**
```json
[
  {
    "ClientID": 100,
    "Name": "Acme Corporation",
    "City": "Chicago",
    "State": "IL",
    "Phone": "(312) 555-1234",
    "ContactName": "John Smith",
    "ContactEmail": "jsmith@acme.com",
    "ComputerCount": 45,
    "LocationCount": 3,
    "DateAdded": "2020-01-15T08:00:00Z"
  }
]
```

### Get Single Client

```http
GET /cwa/api/v1/Clients/{clientID}
Authorization: Bearer {token}
```

### Create Client

```http
POST /cwa/api/v1/Clients
Authorization: Bearer {token}
Content-Type: application/json

{
  "Name": "New Client Inc",
  "Address1": "456 Business Ave",
  "City": "New York",
  "State": "NY",
  "Zip": "10001",
  "Phone": "(212) 555-9876",
  "ContactName": "Jane Doe",
  "ContactEmail": "jdoe@newclient.com"
}
```

**Response:**
```json
{
  "ClientID": 101,
  "Name": "New Client Inc",
  "City": "New York",
  "DateAdded": "2024-02-15T10:30:00Z"
}
```

### Update Client

```http
PATCH /cwa/api/v1/Clients/{clientID}
Authorization: Bearer {token}
Content-Type: application/json

{
  "Phone": "(212) 555-1111",
  "ContactEmail": "newcontact@newclient.com"
}
```

### Delete Client

```http
DELETE /cwa/api/v1/Clients/{clientID}
Authorization: Bearer {token}
```

**Note:** Deleting a client will also delete all associated locations and unassign computers.

### List Client Locations

```http
GET /cwa/api/v1/Clients/{clientID}/Locations
Authorization: Bearer {token}
```

**Response:**
```json
[
  {
    "LocationID": 1,
    "ClientID": 100,
    "Name": "Main Office",
    "City": "Chicago",
    "State": "IL",
    "ComputerCount": 30
  },
  {
    "LocationID": 2,
    "ClientID": 100,
    "Name": "Remote Office",
    "City": "Detroit",
    "State": "MI",
    "ComputerCount": 15
  }
]
```

### Create Location

```http
POST /cwa/api/v1/Clients/{clientID}/Locations
Authorization: Bearer {token}
Content-Type: application/json

{
  "Name": "New Branch Office",
  "Address1": "789 Branch St",
  "City": "Detroit",
  "State": "MI",
  "Zip": "48201"
}
```

### Get Client Computers

```http
GET /cwa/api/v1/Clients/{clientID}/Computers?pageSize=250
Authorization: Bearer {token}
```

### Get Client Groups

```http
GET /cwa/api/v1/Clients/{clientID}/Groups
Authorization: Bearer {token}
```

### Get Client EDFs

```http
GET /cwa/api/v1/Clients/{clientID}/ExtraDataFields
Authorization: Bearer {token}
```

**Response:**
```json
[
  {
    "EDFID": 1,
    "Name": "Contract Type",
    "Value": "Managed Services",
    "Type": "Text"
  },
  {
    "EDFID": 2,
    "Name": "SLA Level",
    "Value": "Premium",
    "Type": "Dropdown"
  }
]
```

### Update Client EDF

```http
PUT /cwa/api/v1/Clients/{clientID}/ExtraDataFields/{edfID}
Authorization: Bearer {token}
Content-Type: application/json

{
  "Value": "Gold"
}
```

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

### Safe Client Deletion

```javascript
async function safeDeleteClient(apiClient, clientId, options = {}) {
  const { force = false, moveComputersTo = null } = options;

  // Check for computers
  const computers = await apiClient.request(
    `/Clients/${clientId}/Computers`
  );

  if (computers.length > 0) {
    if (!force && !moveComputersTo) {
      return {
        success: false,
        error: `Client has ${computers.length} computer(s)`,
        computers: computers.map(c => c.Name)
      };
    }

    if (moveComputersTo) {
      // Move computers to another client
      for (const computer of computers) {
        await apiClient.request(`/Computers/${computer.ComputerID}`, {
          method: 'PATCH',
          body: JSON.stringify({
            ClientID: moveComputersTo.clientId,
            LocationID: moveComputersTo.locationId
          })
        });
        await sleep(100);
      }
    }
  }

  // Delete the client
  await apiClient.request(`/Clients/${clientId}`, {
    method: 'DELETE'
  });

  return { success: true };
}
```

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
