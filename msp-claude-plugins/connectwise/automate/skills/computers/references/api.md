# ConnectWise Automate Computers - API Reference

## List All Computers

```http
GET /cwa/api/v1/Computers?pageSize=250
Authorization: Bearer {token}
```

**Response:**
```json
[
  {
    "ComputerID": 12345,
    "Name": "ACME-DC01",
    "ClientID": 100,
    "LocationID": 1,
    "Status": "Online",
    "IPAddress": "192.168.1.10",
    "OS": "Windows Server 2022 Standard",
    "LastContact": "2024-02-15T10:30:00Z",
    "Client": {
      "Name": "Acme Corporation"
    },
    "Location": {
      "Name": "Main Office"
    }
  }
]
```

## Get Single Computer

```http
GET /cwa/api/v1/Computers/{computerID}
Authorization: Bearer {token}
```

**Response:**
```json
{
  "ComputerID": 12345,
  "Name": "ACME-DC01",
  "ComputerGUID": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "ClientID": 100,
  "LocationID": 1,
  "Status": "Online",
  "IPAddress": "192.168.1.10",
  "ExternalIP": "203.0.113.50",
  "MAC": "00:1A:2B:3C:4D:5E",
  "OS": "Windows Server 2022 Standard",
  "OSVersion": "10.0.20348",
  "Manufacturer": "Dell Inc.",
  "Model": "PowerEdge R640",
  "SerialNumber": "ABC1234567",
  "TotalMemory": 32768,
  "ProcessorName": "Intel Xeon Gold 6230",
  "AgentVersion": "2023.1.0.123",
  "LastContact": "2024-02-15T10:30:00Z",
  "Uptime": 864000,
  "DateAdded": "2023-01-15T08:00:00Z"
}
```

## Filter Computers by Client

```http
GET /cwa/api/v1/Computers?condition=ClientID = 100&pageSize=250
Authorization: Bearer {token}
```

## Filter Computers by Status

```http
GET /cwa/api/v1/Computers?condition=Status = 'Online'&pageSize=250
Authorization: Bearer {token}
```

## Filter by OS Type

```http
GET /cwa/api/v1/Computers?condition=OS contains 'Windows Server'&pageSize=250
Authorization: Bearer {token}
```

## Get Computer Drives

```http
GET /cwa/api/v1/Computers/{computerID}/Drives
Authorization: Bearer {token}
```

**Response:**
```json
[
  {
    "DriveID": 1,
    "Letter": "C:",
    "Type": "Fixed",
    "FileSystem": "NTFS",
    "TotalSize": 500000,
    "FreeSpace": 150000,
    "PercentFree": 30
  }
]
```

## Get Computer Software

```http
GET /cwa/api/v1/Computers/{computerID}/Software
Authorization: Bearer {token}
```

## Get Patch Status

```http
GET /cwa/api/v1/Computers/{computerID}/Patches
Authorization: Bearer {token}
```

**Response:**
```json
{
  "Installed": 145,
  "Missing": 3,
  "Pending": 2,
  "Failed": 0,
  "Patches": [
    {
      "KBID": "KB5034441",
      "Title": "2024-01 Security Update",
      "Status": "Missing",
      "Severity": "Critical",
      "ReleaseDate": "2024-01-09T00:00:00Z"
    }
  ]
}
```

## Get Antivirus Status

```http
GET /cwa/api/v1/Computers/{computerID}/Antivirus
Authorization: Bearer {token}
```

**Response:**
```json
{
  "Product": "Windows Defender",
  "Version": "4.18.2401.7",
  "DefinitionVersion": "1.405.123.0",
  "DefinitionDate": "2024-02-15T00:00:00Z",
  "RealTimeProtection": true,
  "LastScan": "2024-02-15T03:00:00Z",
  "ScanType": "Quick",
  "ThreatsFound": 0
}
```
