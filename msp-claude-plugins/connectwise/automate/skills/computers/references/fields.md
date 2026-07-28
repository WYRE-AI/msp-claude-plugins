# ConnectWise Automate Computers - Field Reference

## Core Computer Fields

```typescript
interface Computer {
  // Identifiers
  ComputerID: number;           // Primary key
  Name: string;                 // Hostname
  ComputerGUID: string;         // GUID

  // Client/Location Association
  ClientID: number;             // Parent client ID
  LocationID: number;           // Location within client
  Client: {
    Name: string;               // Client name
  };
  Location: {
    Name: string;               // Location name
  };

  // Status
  Status: string;               // Online, Offline, Degraded
  LastContact: string;          // ISO datetime of last check-in
  Uptime: number;               // Uptime in seconds

  // Network
  IPAddress: string;            // Internal IP
  ExternalIP: string;           // External/public IP
  DefaultGateway: string;       // Gateway IP
  MAC: string;                  // Primary MAC address

  // Operating System
  OS: string;                   // "Windows 10 Pro"
  OSType: string;               // "Windows", "macOS", "Linux"
  OSVersion: string;            // "10.0.19045"
  SerialNumber: string;         // OS serial/product key

  // Hardware
  Manufacturer: string;         // "Dell Inc."
  Model: string;                // "OptiPlex 7090"
  TotalMemory: number;          // RAM in MB
  ProcessorName: string;        // CPU model
  ProcessorCount: number;       // Number of CPUs

  // Agent
  AgentVersion: string;         // "2023.1.0.123"
  RemoteAgentVersion: string;   // Remote agent version

  // Timestamps
  DateAdded: string;            // When computer was added
  LastInventory: string;        // Last inventory scan
  LastPatched: string;          // Last patch operation

  // Extra Data Fields (EDFs)
  ExtraData: {
    [key: string]: string;      // Custom fields
  };
}
```

## Computer Inventory Fields

```typescript
interface ComputerInventory {
  // Disk Information
  Drives: DriveInfo[];

  // Software
  Software: SoftwareItem[];

  // Hardware
  Memory: MemoryModule[];
  NetworkAdapters: NetworkAdapter[];
  Printers: Printer[];

  // Services
  Services: Service[];

  // Monitors/Displays
  Monitors: Monitor[];
}

interface DriveInfo {
  Letter: string;               // "C:"
  Type: string;                 // "Fixed", "Network", "Removable"
  FileSystem: string;           // "NTFS"
  TotalSize: number;            // Size in MB
  FreeSpace: number;            // Free space in MB
  PercentFree: number;          // Percentage free
}

interface SoftwareItem {
  Name: string;                 // Application name
  Publisher: string;            // Software publisher
  Version: string;              // Installed version
  InstallDate: string;          // When installed
}
```
