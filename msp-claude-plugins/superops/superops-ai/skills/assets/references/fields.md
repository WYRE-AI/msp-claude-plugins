# SuperOps.ai Asset Field Reference

## Core Fields

| Field | Type | Description |
|-------|------|-------------|
| `assetId` | ID | Unique identifier |
| `name` | String | Computer/device name |
| `status` | Enum | Online, Offline, Maintenance |
| `platform` | Enum | Windows, macOS, Linux |
| `lastSeen` | DateTime | Last check-in time |
| `agentVersion` | String | RMM agent version |

## Network Fields

| Field | Type | Description |
|-------|------|-------------|
| `ipAddress` | String | Primary IP address |
| `macAddress` | String | MAC address |
| `publicIp` | String | External IP |
| `hostname` | String | Network hostname |

## Hardware Fields

| Field | Type | Description |
|-------|------|-------------|
| `manufacturer` | String | Hardware manufacturer |
| `model` | String | Device model |
| `serialNumber` | String | Serial number |
| `processorName` | String | CPU model |
| `processorCores` | Int | CPU core count |
| `totalMemory` | Long | RAM in bytes |
| `totalDiskSpace` | Long | Total disk space |
| `freeDiskSpace` | Long | Available disk space |

## Operating System Fields

| Field | Type | Description |
|-------|------|-------------|
| `osName` | String | Operating system name |
| `osVersion` | String | OS version |
| `osBuild` | String | OS build number |
| `architecture` | String | 32-bit or 64-bit |

## Association Fields

| Field | Type | Description |
|-------|------|-------------|
| `client` | Client | Associated client |
| `site` | Site | Associated site |
| `tags` | [String] | Asset tags |
| `customFields` | [CustomField] | Custom field values |
