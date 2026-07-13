---
name: "Datto RMM Audit"
description: >
  Use this skill when working with Datto RMM audit data - hardware inventory,
  software inventory, network interfaces, and system information. Covers
  device audit retrieval, ESXi host audits, printer audits, and audit
  data freshness tracking.
when_to_use: >-
  When working with hardware inventory, software inventory, network interfaces, and system
  information in Datto RMM audit data. Use when: datto audit, device audit, software inventory,
  hardware inventory, system audit, device inventory, installed software, hardware specs, or
  network audit.
---

# Datto RMM Audit Data

## Overview

Audit data in Datto RMM provides detailed hardware and software inventory for managed devices. The agent periodically collects this information and reports it to the platform. This skill covers accessing audit data, understanding its structure, and common audit workflows.

## Key Concepts

### Audit Categories

| Category | Description | Examples |
|----------|-------------|----------|
| **Hardware** | Physical components | CPU, RAM, disks, motherboard |
| **Software** | Installed applications | Programs, versions, publishers |
| **Network** | Network configuration | Interfaces, IPs, MACs |
| **Operating System** | OS details | Version, build, architecture |
| **ESXi** | VMware hypervisor info | VMs, datastores, hosts |
| **Printer** | Network printers | Name, model, status |

### Audit Freshness

Audit data is collected periodically:
- **Standard devices:** Every 24 hours
- **Software changes:** Real-time detection
- **On-demand:** Triggered by agent commands

## Field Reference

### Hardware Audit

```typescript
interface HardwareAudit {
  // Processor
  processor: {
    name: string;               // "Intel Core i7-10700"
    cores: number;              // Physical cores
    logicalProcessors: number;  // Logical processors
    speed: number;              // Clock speed (MHz)
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

### Software Audit

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

### Network Audit

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

### ESXi Host Audit

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

## API Patterns

### Get Device Audit

```http
GET /api/v2/device/{deviceUid}/audit
Authorization: Bearer {token}
```

**Response:**
```json
{
  "deviceUid": "d4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f9a",
  "lastAuditDate": 1707991200000,
  "hardware": {
    "processor": {
      "name": "Intel Core i7-10700",
      "cores": 8,
      "logicalProcessors": 16,
      "speed": 2900
    },
    "memory": {
      "totalRam": 34359738368,
      "availableRam": 17179869184,
      "slots": [...]
    },
    "disks": [...]
  },
  "operatingSystem": {
    "name": "Windows 11 Pro",
    "version": "10.0.22631",
    "architecture": "64-bit",
    "installDate": "2023-10-15",
    "lastBootTime": 1707800000000
  },
  "network": {
    "interfaces": [...],
    "dnsServers": ["192.168.1.1", "8.8.8.8"],
    "defaultGateway": "192.168.1.1"
  }
}
```

### Get Software Inventory

```http
GET /api/v2/device/{deviceUid}/audit/software
Authorization: Bearer {token}
```

**Response:**
```json
{
  "deviceUid": "d4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f9a",
  "lastScan": 1707991200000,
  "totalCount": 156,
  "applications": [
    {
      "name": "Google Chrome",
      "version": "121.0.6167.140",
      "publisher": "Google LLC",
      "installDate": "2024-01-20",
      "architecture": "x64"
    },
    {
      "name": "Microsoft 365 Apps",
      "version": "16.0.17231.20182",
      "publisher": "Microsoft Corporation",
      "installDate": "2023-12-10",
      "architecture": "x64"
    }
  ]
}
```

### Get ESXi Host Audit

```http
GET /api/v2/device/{deviceUid}/audit/esxi
Authorization: Bearer {token}
```

### Get Printer Audit

```http
GET /api/v2/device/{deviceUid}/audit/printers
Authorization: Bearer {token}
```

## Workflows

### Software Compliance Check

```javascript
async function checkSoftwareCompliance(client, deviceUid, requirements) {
  const audit = await client.request(`/api/v2/device/${deviceUid}/audit/software`);
  const apps = audit.applications || [];

  const results = requirements.map(req => {
    const found = apps.find(app =>
      app.name.toLowerCase().includes(req.name.toLowerCase())
    );

    if (!found) {
      return {
        requirement: req.name,
        status: 'missing',
        compliant: false
      };
    }

    // Check version if specified
    if (req.minVersion) {
      const versionOk = compareVersions(found.version, req.minVersion) >= 0;
      return {
        requirement: req.name,
        status: versionOk ? 'compliant' : 'outdated',
        installedVersion: found.version,
        requiredVersion: req.minVersion,
        compliant: versionOk
      };
    }

    return {
      requirement: req.name,
      status: 'installed',
      installedVersion: found.version,
      compliant: true
    };
  });

  return {
    deviceUid,
    totalRequirements: requirements.length,
    compliant: results.filter(r => r.compliant).length,
    nonCompliant: results.filter(r => !r.compliant).length,
    results
  };
}

function compareVersions(a, b) {
  const partsA = a.split('.').map(Number);
  const partsB = b.split('.').map(Number);

  for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
    const numA = partsA[i] || 0;
    const numB = partsB[i] || 0;
    if (numA > numB) return 1;
    if (numA < numB) return -1;
  }
  return 0;
}
```

### Hardware Inventory Report

```javascript
async function generateHardwareReport(client, deviceUids) {
  const reports = [];

  for (const deviceUid of deviceUids) {
    try {
      const audit = await client.request(`/api/v2/device/${deviceUid}/audit`);

      reports.push({
        deviceUid,
        hostname: audit.hostname,
        cpu: audit.hardware?.processor?.name,
        cores: audit.hardware?.processor?.cores,
        ramGB: Math.round((audit.hardware?.memory?.totalRam || 0) / (1024 ** 3)),
        diskType: audit.hardware?.disks?.[0]?.mediaType,
        diskSizeGB: Math.round((audit.hardware?.disks?.[0]?.size || 0) / (1024 ** 3)),
        os: audit.operatingSystem?.name,
        osVersion: audit.operatingSystem?.version
      });
    } catch (error) {
      reports.push({
        deviceUid,
        error: error.message
      });
    }

    await sleep(100); // Rate limit
  }

  return reports;
}
```

### Find Devices with Specific Software

```javascript
async function findDevicesWithSoftware(client, softwareName) {
  // Get all devices
  const devicesResponse = await client.request('/api/v2/devices?max=250');
  const devices = devicesResponse.devices || [];

  const matches = [];

  for (const device of devices) {
    try {
      const audit = await client.request(`/api/v2/device/${device.uid}/audit/software`);
      const apps = audit.applications || [];

      const found = apps.find(app =>
        app.name.toLowerCase().includes(softwareName.toLowerCase())
      );

      if (found) {
        matches.push({
          hostname: device.hostname,
          deviceUid: device.uid,
          site: device.siteName,
          software: found.name,
          version: found.version
        });
      }
    } catch (error) {
      // Skip devices with audit errors
    }

    await sleep(100);
  }

  return matches;
}
```

### Disk Space Analysis

```javascript
async function analyzeDiskSpace(client, deviceUid) {
  const audit = await client.request(`/api/v2/device/${deviceUid}/audit`);
  const disks = audit.hardware?.disks || [];

  return disks.flatMap(disk =>
    (disk.partitions || []).map(partition => {
      const usedSpace = partition.size - partition.freeSpace;
      const usagePercent = Math.round((usedSpace / partition.size) * 100);

      return {
        disk: disk.name,
        partition: partition.name,
        fileSystem: partition.fileSystem,
        totalGB: Math.round(partition.size / (1024 ** 3)),
        usedGB: Math.round(usedSpace / (1024 ** 3)),
        freeGB: Math.round(partition.freeSpace / (1024 ** 3)),
        usagePercent,
        status: usagePercent >= 90 ? 'critical' :
                usagePercent >= 80 ? 'warning' : 'healthy'
      };
    })
  );
}
```

### ESXi Capacity Report

```javascript
async function generateESXiCapacityReport(client, deviceUid) {
  const audit = await client.request(`/api/v2/device/${deviceUid}/audit/esxi`);

  const vmSummary = {
    total: audit.vms?.length || 0,
    poweredOn: audit.vms?.filter(vm => vm.powerState === 'poweredOn').length || 0,
    poweredOff: audit.vms?.filter(vm => vm.powerState === 'poweredOff').length || 0
  };

  const datastoreSummary = (audit.datastores || []).map(ds => ({
    name: ds.name,
    type: ds.type,
    capacityTB: (ds.capacity / (1024 ** 4)).toFixed(2),
    freeTB: (ds.freeSpace / (1024 ** 4)).toFixed(2),
    usagePercent: Math.round(((ds.capacity - ds.freeSpace) / ds.capacity) * 100),
    vmCount: ds.vmCount
  }));

  return {
    host: audit.hostname,
    version: audit.version,
    cpuCores: audit.cpuCores,
    memoryGB: Math.round(audit.totalMemory / (1024 ** 3)),
    vms: vmSummary,
    datastores: datastoreSummary
  };
}
```

## Error Handling

### Common Audit API Errors

| Error | Status | Cause | Resolution |
|-------|--------|-------|------------|
| Device not found | 404 | Invalid deviceUid | Verify device exists |
| Audit not available | 404 | No audit data yet | Wait for agent collection |
| Device offline | - | Agent not reporting | Check device connectivity |

### Audit Data Validation

```javascript
function validateAuditFreshness(audit, maxAgeHours = 48) {
  const lastAudit = audit.lastAuditDate;
  if (!lastAudit) {
    return { fresh: false, reason: 'No audit date' };
  }

  const ageMs = Date.now() - lastAudit;
  const ageHours = ageMs / (1000 * 60 * 60);

  if (ageHours > maxAgeHours) {
    return {
      fresh: false,
      reason: `Audit data is ${Math.round(ageHours)} hours old`,
      lastAudit: new Date(lastAudit).toISOString()
    };
  }

  return {
    fresh: true,
    ageHours: Math.round(ageHours),
    lastAudit: new Date(lastAudit).toISOString()
  };
}
```

## Best Practices

1. **Check audit freshness** - Verify data is recent before reporting
2. **Cache audit data** - Audit changes slowly, cache when appropriate
3. **Handle missing data** - Not all devices have complete audits
4. **Use software inventory for compliance** - Track required applications
5. **Monitor disk space trends** - Use audit data for capacity planning
6. **Track hardware lifecycle** - Use warranty and spec data
7. **ESXi-specific queries** - Use dedicated ESXi endpoints
8. **Batch requests carefully** - Audit data can be large
9. **Filter software results** - Exclude Windows updates if needed
10. **Document hardware standards** - Use audit to verify standards

## Related Skills

- [Datto RMM Devices](../devices/SKILL.md) - Device management
- [Datto RMM Alerts](../alerts/SKILL.md) - Disk/hardware alerts
- [Datto RMM Variables](../variables/SKILL.md) - Store audit metadata
- [Datto RMM API Patterns](../api-patterns/SKILL.md) - Authentication and pagination
