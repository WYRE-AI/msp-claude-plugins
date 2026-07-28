# Datto RMM Alert Context Types

Datto RMM has 25+ alert context types, identified by the `@class` field. Each type has specific fields relevant to that monitor.

### antivirus_ctx

Antivirus status and detection alerts.

```typescript
interface AntivirusContext {
  "@class": "antivirus_ctx";
  avProduct: string;           // "Windows Defender", "Webroot", etc.
  avStatus: string;            // "Enabled", "Disabled", "Out of Date"
  avDefinitionDate: number;    // Last definition update (Unix ms)
  threatName?: string;         // Name of detected threat
  threatPath?: string;         // File path of threat
  scanType?: string;           // "Full", "Quick", "Real-time"
  lastScan?: number;           // Last scan timestamp
}
```

**Example Alert:**
```json
{
  "alertMessage": "Antivirus definitions out of date",
  "alertContext": {
    "@class": "antivirus_ctx",
    "avProduct": "Windows Defender",
    "avStatus": "Out of Date",
    "avDefinitionDate": 1707100000000
  }
}
```

### comp_script_ctx

Component script execution results.

```typescript
interface ComponentScriptContext {
  "@class": "comp_script_ctx";
  componentName: string;       // Script/component name
  exitCode: number;            // Process exit code
  stdout: string;              // Standard output
  stderr: string;              // Standard error
  executionTime: number;       // Duration in milliseconds
  variables?: Record<string, string>;  // Input variables
}
```

**Example Alert:**
```json
{
  "alertMessage": "Component 'Backup Check' failed with exit code 1",
  "alertContext": {
    "@class": "comp_script_ctx",
    "componentName": "Backup Check",
    "exitCode": 1,
    "stdout": "Checking backup status...",
    "stderr": "ERROR: No backup found in last 24 hours"
  }
}
```

### custom_snmp_ctx

SNMP monitoring alerts.

```typescript
interface CustomSNMPContext {
  "@class": "custom_snmp_ctx";
  oid: string;                 // SNMP OID
  value: string | number;      // Current value
  threshold: number;           // Configured threshold
  comparison: string;          // "gt", "lt", "eq", etc.
  snmpVersion: string;         // "v1", "v2c", "v3"
}
```

### disk_health_ctx

ESXi disk health monitoring.

```typescript
interface DiskHealthContext {
  "@class": "disk_health_ctx";
  diskName: string;            // Disk identifier
  status: string;              // "Healthy", "Warning", "Critical"
  capacity: number;            // Total capacity (bytes)
  smartStatus?: string;        // S.M.A.R.T. status
  temperature?: number;        // Disk temperature (Celsius)
}
```

### eventlog_ctx

Windows Event Log monitoring.

```typescript
interface EventLogContext {
  "@class": "eventlog_ctx";
  logName: string;             // "Application", "System", "Security"
  source: string;              // Event source
  eventId: number;             // Event ID
  eventType: string;           // "Error", "Warning", "Information"
  message: string;             // Event message
  timestamp: number;           // Event timestamp
  user?: string;               // Associated user
  computer?: string;           // Computer name
}
```

**Example Alert:**
```json
{
  "alertMessage": "Event Log: BSOD detected",
  "alertContext": {
    "@class": "eventlog_ctx",
    "logName": "System",
    "source": "BugCheck",
    "eventId": 1001,
    "eventType": "Error",
    "message": "The computer has rebooted from a bugcheck."
  }
}
```

### fan_ctx

ESXi fan status monitoring.

```typescript
interface FanContext {
  "@class": "fan_ctx";
  fanName: string;             // Fan identifier
  status: string;              // "OK", "Warning", "Critical"
  rpm: number;                 // Current RPM
  minRpm?: number;             // Minimum threshold
}
```

### fs_object_ctx

File/folder size monitoring.

```typescript
interface FileSystemObjectContext {
  "@class": "fs_object_ctx";
  path: string;                // File or folder path
  size: number;                // Current size (bytes)
  threshold: number;           // Size threshold (bytes)
  comparison: string;          // "gt", "lt"
  isDirectory: boolean;        // true for folders
  fileCount?: number;          // Number of files (for directories)
}
```

### online_offline_status_ctx

Device online/offline status changes.

```typescript
interface OnlineOfflineContext {
  "@class": "online_offline_status_ctx";
  status: string;              // "offline", "online"
  lastSeen: number;            // Last check-in (Unix ms)
  offlineDuration: number;     // Minutes offline
  previousStatus: string;      // Status before change
}
```

**Example Alert:**
```json
{
  "alertMessage": "Device went offline",
  "alertContext": {
    "@class": "online_offline_status_ctx",
    "status": "offline",
    "lastSeen": 1707991200000,
    "offlineDuration": 45,
    "previousStatus": "online"
  }
}
```

### patch_ctx

Windows patch/update status.

```typescript
interface PatchContext {
  "@class": "patch_ctx";
  patchCount: number;          // Total pending patches
  criticalCount: number;       // Critical patches pending
  importantCount: number;      // Important patches pending
  optionalCount: number;       // Optional patches pending
  lastScan: number;            // Last patch scan (Unix ms)
  rebootRequired: boolean;     // Needs restart
  failedPatches?: string[];    // KB numbers that failed
}
```

### perf_disk_usage_ctx

Disk usage/space monitoring.

```typescript
interface DiskUsageContext {
  "@class": "perf_disk_usage_ctx";
  drive: string;               // "C:", "D:", etc.
  usagePercent: number;        // Current usage percentage
  threshold: number;           // Alert threshold percentage
  totalSpace: number;          // Total space (bytes)
  freeSpace: number;           // Free space (bytes)
  usedSpace: number;           // Used space (bytes)
}
```

**Example Alert:**
```json
{
  "alertMessage": "Disk C: is 95% full",
  "alertContext": {
    "@class": "perf_disk_usage_ctx",
    "drive": "C:",
    "usagePercent": 95,
    "threshold": 90,
    "totalSpace": 500000000000,
    "freeSpace": 25000000000,
    "usedSpace": 475000000000
  }
}
```

### perf_mon_ctx

Windows Performance Counter monitoring.

```typescript
interface PerformanceMonitorContext {
  "@class": "perf_mon_ctx";
  counter: string;             // Full counter path
  instance: string;            // Counter instance
  value: number;               // Current value
  threshold: number;           // Alert threshold
  comparison: string;          // "gt", "lt", "eq"
}
```

### perf_resource_usage_ctx

CPU/Memory usage monitoring.

```typescript
interface ResourceUsageContext {
  "@class": "perf_resource_usage_ctx";
  resource: string;            // "CPU", "Memory"
  usagePercent: number;        // Current usage percentage
  threshold: number;           // Alert threshold
  duration: number;            // Duration over threshold (seconds)
  processName?: string;        // Top consuming process
  processUsage?: number;       // Process usage percentage
}
```

**Example Alert:**
```json
{
  "alertMessage": "CPU usage above 90% for 15 minutes",
  "alertContext": {
    "@class": "perf_resource_usage_ctx",
    "resource": "CPU",
    "usagePercent": 94,
    "threshold": 90,
    "duration": 900,
    "processName": "sqlservr.exe",
    "processUsage": 78
  }
}
```

### ping_ctx

Network ping monitoring.

```typescript
interface PingContext {
  "@class": "ping_ctx";
  host: string;                // Target hostname/IP
  latency: number;             // Response time (ms)
  packetLoss: number;          // Packet loss percentage
  threshold: number;           // Latency threshold (ms)
  status: string;              // "reachable", "unreachable"
}
```

### process_resource_usage_ctx

Individual process resource monitoring.

```typescript
interface ProcessResourceContext {
  "@class": "process_resource_usage_ctx";
  processName: string;         // Process name
  pid: number;                 // Process ID
  cpuUsage: number;            // CPU percentage
  memoryUsage: number;         // Memory usage (bytes)
  memoryPercent: number;       // Memory percentage
  threshold: number;           // Alert threshold
}
```

### process_status_ctx

Process running/stopped monitoring.

```typescript
interface ProcessStatusContext {
  "@class": "process_status_ctx";
  processName: string;         // Process name
  status: string;              // "running", "stopped"
  expectedStatus: string;      // "running", "stopped"
  pid?: number;                // Process ID (if running)
  path?: string;               // Executable path
}
```

### psu_ctx

ESXi power supply monitoring.

```typescript
interface PSUContext {
  "@class": "psu_ctx";
  psuName: string;             // PSU identifier
  status: string;              // "OK", "Failed", "Degraded"
  wattage?: number;            // Current wattage
}
```

### ransomware_ctx

Ransomware detection alerts.

```typescript
interface RansomwareContext {
  "@class": "ransomware_ctx";
  detectionType: string;       // "Behavioral", "Signature", "Honeypot"
  path: string;                // Affected path
  action: string;              // "Blocked", "Quarantined", "Detected"
  processName?: string;        // Suspicious process
  fileCount?: number;          // Number of affected files
  extensions?: string[];       // Affected file extensions
}
```

**Example Alert:**
```json
{
  "alertMessage": "Potential ransomware activity detected",
  "alertContext": {
    "@class": "ransomware_ctx",
    "detectionType": "Behavioral",
    "path": "C:\\Users\\John\\Documents",
    "action": "Blocked",
    "processName": "suspicious.exe",
    "fileCount": 15,
    "extensions": [".encrypted", ".locked"]
  }
}
```

### sec_management_ctx

Webroot/security management status.

```typescript
interface SecurityManagementContext {
  "@class": "sec_management_ctx";
  product: string;             // "Webroot", etc.
  status: string;              // "Active", "Inactive", "Expired"
  threatCount: number;         // Number of threats detected
  lastScan: number;            // Last scan timestamp
  licenseExpiry?: number;      // License expiration
}
```

### srvc_resource_usage_ctx

Windows Service resource monitoring.

```typescript
interface ServiceResourceContext {
  "@class": "srvc_resource_usage_ctx";
  serviceName: string;         // Service name
  displayName: string;         // Service display name
  cpuUsage: number;            // CPU percentage
  memoryUsage: number;         // Memory (bytes)
  threshold: number;           // Alert threshold
}
```

### srvc_status_ctx

Windows Service status monitoring.

```typescript
interface ServiceStatusContext {
  "@class": "srvc_status_ctx";
  serviceName: string;         // Service name
  displayName: string;         // Service display name
  status: string;              // "Running", "Stopped", "Paused"
  expectedStatus: string;      // Expected status
  startType: string;           // "Automatic", "Manual", "Disabled"
  recoveryAction?: string;     // Configured recovery action
}
```

**Example Alert:**
```json
{
  "alertMessage": "Service 'SQL Server' is stopped",
  "alertContext": {
    "@class": "srvc_status_ctx",
    "serviceName": "MSSQLSERVER",
    "displayName": "SQL Server (MSSQLSERVER)",
    "status": "Stopped",
    "expectedStatus": "Running",
    "startType": "Automatic"
  }
}
```

### sw_action_ctx

Software installation/removal monitoring.

```typescript
interface SoftwareActionContext {
  "@class": "sw_action_ctx";
  action: string;              // "Installed", "Uninstalled", "Updated"
  softwareName: string;        // Application name
  version: string;             // Software version
  previousVersion?: string;    // Previous version (for updates)
  publisher?: string;          // Software publisher
  installDate: number;         // Action timestamp
}
```

### temperature_ctx

ESXi temperature monitoring.

```typescript
interface TemperatureContext {
  "@class": "temperature_ctx";
  sensorName: string;          // Sensor identifier
  temperature: number;         // Current temp (Celsius)
  threshold: number;           // Alert threshold
  status: string;              // "Normal", "Warning", "Critical"
}
```

### wmi_ctx

WMI query monitoring.

```typescript
interface WMIContext {
  "@class": "wmi_ctx";
  query: string;               // WMI query executed
  namespace: string;           // WMI namespace
  property: string;            // Property monitored
  value: string | number;      // Current value
  threshold?: string | number; // Threshold (if applicable)
}
```
