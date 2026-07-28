# Datto RMM Audit Field Reference

## Hardware Audit

```typescript
interface HardwareAudit {
  // Processor
  processor: {
    name: string;               // "Intel Core i7-10700"
    cores: number;              // Physical cores
    logicalProcessors: number;  // Logical processors
    speed: number;               // Clock speed (MHz)
    architecture: string;       // "x64", "ARM64"
  };

  // Memory
  memory: {
    totalRam: number;           // Total RAM (bytes)
    availableRam: number;       // Available RAM (bytes)
    slots: MemorySlot[];
  };

  // Storage
  disks: DiskInfo[];

  // Motherboard
  motherboard: {
    manufacturer: string;       // "Dell Inc."
    product: string;            // "0VNP2H"
    serialNumber: string;
  };

  // BIOS
  bios: {
    manufacturer: string;
    version: string;
    releaseDate: string;
  };
}

interface MemorySlot {
  slot: string;                 // "DIMM1"
  size: number;                 // Size (bytes)
  speed: number;                // Speed (MHz)
  type: string;                 // "DDR4"
  manufacturer: string;
}

interface DiskInfo {
  name: string;                 // "Disk 0"
  model: string;                // "Samsung SSD 970 EVO"
  serialNumber: string;
  size: number;                 // Total size (bytes)
  interface: string;            // "NVMe", "SATA"
  mediaType: string;            // "SSD", "HDD"
  partitions: PartitionInfo[];
}

interface PartitionInfo {
  name: string;                 // "C:"
  size: number;                 // Partition size
  freeSpace: number;            // Free space
  fileSystem: string;           // "NTFS", "exFAT"
}
```

## Software Audit

```typescript
interface SoftwareAudit {
  applications: Application[];
  totalCount: number;
  lastScan: number;             // Unix milliseconds
}

interface Application {
  name: string;                 // "Microsoft Office Professional Plus 2019"
  version: string;              // "16.0.14430.20234"
  publisher: string;            // "Microsoft Corporation"
  installDate: string;          // "2024-01-15"
  installLocation?: string;     // "C:\\Program Files\\Microsoft Office"
  size?: number;                // Installed size (bytes)
  uninstallString?: string;     // Uninstall command
  isUpdate: boolean;            // Is Windows Update
  architecture: string;         // "x64", "x86"
}
```

## Network Audit

```typescript
interface NetworkAudit {
  interfaces: NetworkInterface[];
  dnsServers: string[];
  defaultGateway: string;
  domainName?: string;
  workgroup?: string;
}

interface NetworkInterface {
  name: string;                 // "Ethernet"
  description: string;          // "Intel I219-LM Gigabit"
  macAddress: string;           // "00:1A:2B:3C:4D:5E"
  ipAddresses: IPAddress[];
  speed: number;                // Link speed (Mbps)
  status: string;               // "Up", "Down"
  type: string;                 // "Ethernet", "Wi-Fi", "Virtual"
}

interface IPAddress {
  address: string;              // "192.168.1.100"
  subnetMask: string;           // "255.255.255.0"
  type: string;                 // "IPv4", "IPv6"
}
```

## ESXi Host Audit

```typescript
interface ESXiAudit {
  version: string;              // "7.0.3"
  build: string;                // "19193900"
  hostname: string;

  // Hardware
  cpuModel: string;
  cpuCores: number;
  totalMemory: number;          // Bytes

  // Virtual Machines
  vms: VirtualMachine[];

  // Datastores
  datastores: Datastore[];

  // Network
  virtualSwitches: VSwitch[];
}

interface VirtualMachine {
  name: string;
  powerState: string;           // "poweredOn", "poweredOff", "suspended"
  guestOS: string;
  cpuCount: number;
  memoryMB: number;
  diskSizeGB: number;
  vmwareToolsStatus: string;
}

interface Datastore {
  name: string;
  type: string;                 // "VMFS", "NFS", "vSAN"
  capacity: number;             // Bytes
  freeSpace: number;
  vmCount: number;
}
```
