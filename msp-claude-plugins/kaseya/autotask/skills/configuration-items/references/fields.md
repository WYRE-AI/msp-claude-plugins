# Autotask Configuration Items — Field Reference

## Core Identification Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | int | System | Auto-generated unique identifier |
| `referenceTitle` | string(100) | Yes | Primary name/identifier |
| `referenceNumber` | string(50) | No | Serial number or reference |
| `companyID` | int | Yes | Owner company |
| `companyLocationID` | int | No | Location within company |
| `configurationItemType` | int | Yes | Type classification |
| `configurationItemCategoryID` | int | No | Category classification |

## Hardware Specification Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `productID` | int | No | Link to Autotask product |
| `serialNumber` | string(100) | No | Manufacturer serial number |
| `make` | string(50) | No | Manufacturer |
| `model` | string(100) | No | Model name/number |

## Network Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `ipAddress` | string(50) | No | Primary IP address |
| `macAddress` | string(50) | No | MAC address |
| `hostname` | string(100) | No | Network hostname |

## Lifecycle Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `isActive` | boolean | System | Active status flag |
| `installDate` | date | No | When installed/deployed |
| `purchaseDate` | date | No | When purchased |
| `warrantyExpirationDate` | date | No | Warranty end date |
| `endOfLifeDate` | date | No | EOL date from manufacturer |
| `retirementDate` | date | No | When retired from service |
| `lastPhysicalLocationDate` | date | No | Last physical audit |

## Contract & Billing Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `contractID` | int | No | Associated contract |
| `contractServiceID` | int | No | Service on contract |
| `contractServiceBundleID` | int | No | Service bundle |
| `monthlyUnitCost` | decimal | No | Monthly recurring cost |
| `setupFee` | decimal | No | One-time setup fee |
| `hourlyRate` | decimal | No | Hourly rate for T&M work |

## RMM Integration Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `rmmDeviceID` | int | No | RMM platform device ID |
| `rmmDeviceUID` | string | No | RMM unique identifier |
| `rmmDeviceAuditID` | int | No | RMM audit record ID |
| `rmmDeviceAuditLastUser` | string | No | Last logged-in user from RMM |
| `rmmDeviceAuditOperatingSystem` | string | No | OS from RMM audit |
| `rmmDeviceAuditDeviceNetworkAddress` | string | No | IP from RMM |

## User-Defined Fields

CIs support custom user-defined fields (UDFs) for organization-specific tracking:
- Asset tags
- Cost centers
- Business criticality
- Compliance tags
- Custom lifecycle flags

## CI Categories

### Category Examples

| Category Examples | Parent Type | Description |
|-------------------|-------------|-------------|
| Physical Server | Server | On-premises physical |
| Virtual Server | Server | VMware, Hyper-V |
| Cloud Server | Server | AWS, Azure, GCP |
| Windows Workstation | Workstation | Windows PCs |
| Mac Workstation | Workstation | Apple devices |
| Firewall | Network Device | Security appliances |
| Managed Switch | Network Device | L2/L3 switches |
| Wireless AP | Network Device | Access points |

### Category Hierarchy

```
Type: Server
├── Category: Physical Server
│   ├── Rack Mount
│   └── Tower
├── Category: Virtual Server
│   ├── VMware
│   └── Hyper-V
└── Category: Cloud Server
    ├── AWS EC2
    ├── Azure VM
    └── GCP Compute

Type: Network Device
├── Category: Firewall
│   ├── Hardware Firewall
│   └── Virtual Firewall
├── Category: Switch
│   ├── Core Switch
│   └── Access Switch
└── Category: Wireless
    ├── Access Point
    └── Controller
```

## DNS Record Fields

| Field | Type | Description |
|-------|------|-------------|
| `configurationItemID` | int | Parent CI |
| `recordType` | string | A, AAAA, CNAME, MX, TXT, etc. |
| `hostname` | string | Record hostname |
| `value` | string | Record value |
| `ttl` | int | Time to live |
| `priority` | int | Priority (for MX) |
