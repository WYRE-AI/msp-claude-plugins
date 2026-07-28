# Datto RMM Device Field Reference

## Core Device Fields

```typescript
interface Device {
  // Identifiers
  uid: string;                    // Unique device ID
  deviceId: number;               // Legacy numeric ID
  hostname: string;               // Computer name
  description: string;            // Custom description

  // Site Association
  siteUid: string;                // Parent site UID
  siteName: string;               // Site display name

  // Type and Status
  deviceType: DeviceType;         // Desktop, Laptop, Server, etc.
  deviceClass: string;            // device, esxihost, printer, etc.
  status: DeviceStatus;           // online, offline, rebooting

  // Network
  intIpAddress: string;           // Internal IP
  extIpAddress: string;           // External IP
  macAddresses: string[];         // MAC addresses

  // Operating System
  operatingSystem: string;        // "Windows 11 Pro"
  osType: string;                 // "Windows", "macOS", "Linux"
  osVersion: string;              // "10.0.22631"
  osSerialNumber: string;         // Windows product key

  // Hardware
  manufacturer: string;           // "Dell Inc."
  model: string;                  // "OptiPlex 7090"
  serialNumber: string;           // Hardware serial

  // Agent Info
  agentVersion: string;           // "2.5.0.1234"
  agentPlatform: string;          // Platform agent was installed from

  // Timestamps (Unix milliseconds)
  lastSeen: number;               // Last agent check-in
  lastReboot: number;             // Last system restart
  createdAt: number;              // When device was added
  warrantyExpiry: number;         // Warranty end date

  // User-Defined Fields
  udf1: string;                   // Custom field 1
  udf2: string;                   // Custom field 2
  // ... up to udf30

  // Counts
  openAlertCount: number;         // Active alerts
  patchStatus: PatchStatus;       // Patch compliance
}

type DeviceType = 'Desktop' | 'Laptop' | 'Server' | 'ESXi Host' | 'Network Device' | 'Printer';
type DeviceStatus = 'online' | 'offline' | 'rebooting' | 'unknown';
```

## User-Defined Fields (UDF)

Datto RMM provides 30 custom fields per device:

| Field | Type | Max Length | Description |
|-------|------|------------|--------------|
| `udf1` - `udf30` | string | 255 chars | Custom data fields |

**Common UDF Uses:**
- `udf1`: Asset tag
- `udf2`: Department
- `udf3`: Primary user
- `udf4`: Location/floor
- `udf5`: Purchase date
- `udf6`: Lease expiration
