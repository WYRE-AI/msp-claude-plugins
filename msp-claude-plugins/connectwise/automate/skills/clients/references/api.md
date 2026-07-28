# Client API Patterns

## List All Clients

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

## Get Single Client

```http
GET /cwa/api/v1/Clients/{clientID}
Authorization: Bearer {token}
```

## Create Client

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

## Update Client

```http
PATCH /cwa/api/v1/Clients/{clientID}
Authorization: Bearer {token}
Content-Type: application/json

{
  "Phone": "(212) 555-1111",
  "ContactEmail": "newcontact@newclient.com"
}
```

## Delete Client

```http
DELETE /cwa/api/v1/Clients/{clientID}
Authorization: Bearer {token}
```

**Note:** Deleting a client will also delete all associated locations and unassign computers.

## List Client Locations

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

## Create Location

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

## Get Client Computers

```http
GET /cwa/api/v1/Clients/{clientID}/Computers?pageSize=250
Authorization: Bearer {token}
```

## Get Client Groups

```http
GET /cwa/api/v1/Clients/{clientID}/Groups
Authorization: Bearer {token}
```

## Get Client EDFs

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

## Update Client EDF

```http
PUT /cwa/api/v1/Clients/{clientID}/ExtraDataFields/{edfID}
Authorization: Bearer {token}
Content-Type: application/json

{
  "Value": "Gold"
}
```
