# Script API Patterns

## List All Scripts

```http
GET /cwa/api/v1/Scripts?pageSize=250
Authorization: Bearer {token}
```

**Response:**
```json
[
  {
    "ScriptID": 1001,
    "Name": "Clear Temp Files",
    "FolderPath": "Maintenance/Disk Cleanup",
    "ScriptType": "PowerShell",
    "Description": "Clears Windows temporary directories",
    "Enabled": true,
    "Parameters": [
      {
        "Name": "days",
        "Type": "Number",
        "Required": false,
        "DefaultValue": "7",
        "Description": "Delete files older than X days"
      }
    ]
  }
]
```

## Get Script Details

```http
GET /cwa/api/v1/Scripts/{scriptID}
Authorization: Bearer {token}
```

## List Scripts by Folder

```http
GET /cwa/api/v1/Scripts?condition=FolderID = 5&pageSize=100
Authorization: Bearer {token}
```

## Search Scripts by Name

```http
GET /cwa/api/v1/Scripts?condition=Name contains 'cleanup'&pageSize=50
Authorization: Bearer {token}
```

## Execute Script on Computer

```http
POST /cwa/api/v1/Computers/{computerID}/Scripts/{scriptID}/Execute
Authorization: Bearer {token}
Content-Type: application/json

{
  "Parameters": {
    "days": "30",
    "path": "C:\\Temp"
  }
}
```

**Response:**
```json
{
  "ExecutionID": 98765,
  "Status": "Pending",
  "ComputerID": 12345,
  "ScriptID": 1001,
  "StartTime": "2024-02-15T10:45:00Z"
}
```

## Get Execution Status

```http
GET /cwa/api/v1/Scripts/Executions/{executionID}
Authorization: Bearer {token}
```

**Response (Running):**
```json
{
  "ExecutionID": 98765,
  "Status": "Running",
  "StartTime": "2024-02-15T10:45:00Z",
  "Duration": 30
}
```

**Response (Completed):**
```json
{
  "ExecutionID": 98765,
  "Status": "Completed",
  "ExitCode": 0,
  "StartTime": "2024-02-15T10:45:00Z",
  "EndTime": "2024-02-15T10:46:30Z",
  "Duration": 90,
  "Output": "Deleted 156 files totaling 2.3 GB",
  "ErrorOutput": ""
}
```

## Execute Script on Multiple Computers

```http
POST /cwa/api/v1/Scripts/{scriptID}/Execute
Authorization: Bearer {token}
Content-Type: application/json

{
  "ComputerIDs": [12345, 12346, 12347],
  "Parameters": {
    "days": "30"
  }
}
```

**Response:**
```json
{
  "Executions": [
    { "ExecutionID": 98765, "ComputerID": 12345, "Status": "Pending" },
    { "ExecutionID": 98766, "ComputerID": 12346, "Status": "Pending" },
    { "ExecutionID": 98767, "ComputerID": 12347, "Status": "Pending" }
  ]
}
```

## Get Execution History for Computer

```http
GET /cwa/api/v1/Computers/{computerID}/Scripts/Executions?pageSize=50
Authorization: Bearer {token}
```

## Get Execution History for Script

```http
GET /cwa/api/v1/Scripts/{scriptID}/Executions?pageSize=50
Authorization: Bearer {token}
```
