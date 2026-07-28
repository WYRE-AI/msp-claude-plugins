# Alert API Endpoint Catalog

### List Active Alerts

```http
GET /cwa/api/v1/Alerts?condition=Status in ('New','Active')&pageSize=100
Authorization: Bearer {token}
```

**Response:**
```json
[
  {
    "AlertID": 54321,
    "Subject": "Disk C: Low Space",
    "Message": "Disk C: is 8% free on ACME-DC01",
    "Severity": 2,
    "Status": "Active",
    "ComputerID": 12345,
    "ComputerName": "ACME-DC01",
    "ClientName": "Acme Corporation",
    "Source": "Monitor",
    "SourceName": "Disk Space Monitor",
    "TimeGenerated": "2024-02-15T08:30:00Z",
    "Category": "Performance"
  }
]
```

### Get Alert Details

```http
GET /cwa/api/v1/Alerts/{alertID}
Authorization: Bearer {token}
```

**Response:**
```json
{
  "AlertID": 54321,
  "AlertGUID": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "Subject": "Disk C: Low Space",
  "Message": "Disk C: is 8% free on ACME-DC01\n\nTotal: 500 GB\nFree: 40 GB\nThreshold: 10%",
  "Severity": 2,
  "Status": "Active",
  "ComputerID": 12345,
  "ComputerName": "ACME-DC01",
  "ClientID": 100,
  "ClientName": "Acme Corporation",
  "LocationID": 1,
  "Source": "Monitor",
  "SourceID": 5001,
  "SourceName": "Disk Space Monitor",
  "TimeGenerated": "2024-02-15T08:30:00Z",
  "Category": "Performance",
  "AdditionalData": {
    "DriveLetter": "C:",
    "FreeSpaceGB": 40,
    "TotalSpaceGB": 500,
    "FreePercent": 8
  }
}
```

### Filter Alerts by Client

```http
GET /cwa/api/v1/Alerts?condition=ClientID = 100 and Status = 'Active'&pageSize=100
Authorization: Bearer {token}
```

### Filter Alerts by Severity

```http
GET /cwa/api/v1/Alerts?condition=Severity >= 3 and Status = 'Active'&pageSize=100
Authorization: Bearer {token}
```

### Acknowledge Alert

```http
POST /cwa/api/v1/Alerts/{alertID}/Acknowledge
Authorization: Bearer {token}
Content-Type: application/json

{
  "Notes": "Investigating disk space issue"
}
```

**Response:**
```json
{
  "AlertID": 54321,
  "Status": "Acknowledged",
  "AcknowledgedBy": "admin@example.com",
  "TimeAcknowledged": "2024-02-15T10:45:00Z"
}
```

### Resolve Alert

```http
POST /cwa/api/v1/Alerts/{alertID}/Resolve
Authorization: Bearer {token}
Content-Type: application/json

{
  "Notes": "Cleared 50GB of temp files. Disk now at 18% free."
}
```

### Add Note to Alert

```http
POST /cwa/api/v1/Alerts/{alertID}/Notes
Authorization: Bearer {token}
Content-Type: application/json

{
  "Note": "Contacted user about large files in Downloads folder"
}
```

### Create Ticket from Alert

```http
POST /cwa/api/v1/Alerts/{alertID}/CreateTicket
Authorization: Bearer {token}
Content-Type: application/json

{
  "TicketSubject": "Disk Space Critical on ACME-DC01",
  "Priority": 2,
  "BoardID": 1,
  "Notes": "Auto-created from Automate alert"
}
```

**Response:**
```json
{
  "AlertID": 54321,
  "TicketID": 98765,
  "TicketNumber": "TKT-2024-00123",
  "TicketStatus": "New"
}
```

### Get Alert History

```http
GET /cwa/api/v1/Alerts/{alertID}/History
Authorization: Bearer {token}
```

**Response:**
```json
[
  {
    "HistoryID": 1,
    "Action": "Created",
    "ActionTime": "2024-02-15T08:30:00Z",
    "NewStatus": "New"
  },
  {
    "HistoryID": 2,
    "Action": "Acknowledged",
    "ActionBy": "admin@example.com",
    "ActionTime": "2024-02-15T10:45:00Z",
    "PreviousStatus": "Active",
    "NewStatus": "Acknowledged",
    "Notes": "Investigating disk space issue"
  }
]
```

### Suppress Alert

```http
POST /cwa/api/v1/Alerts/{alertID}/Suppress
Authorization: Bearer {token}
Content-Type: application/json

{
  "Duration": 3600,
  "Reason": "Scheduled maintenance window"
}
```

### Bulk Acknowledge Alerts

```http
POST /cwa/api/v1/Alerts/BulkAcknowledge
Authorization: Bearer {token}
Content-Type: application/json

{
  "AlertIDs": [54321, 54322, 54323],
  "Notes": "Bulk acknowledgment for server maintenance"
}
```
