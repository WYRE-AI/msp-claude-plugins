# Flexible Assets Field Reference

## Flexible Asset Type Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | integer | Type identifier |
| `name` | string | Type name |
| `description` | string | Type description |
| `icon` | string | Display icon |
| `enabled` | boolean | Type enabled status |

## Flexible Asset Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | integer | Asset instance identifier |
| `organization-id` | integer | Parent organization |
| `flexible-asset-type-id` | integer | Type definition |
| `name` | string | Auto-generated from name field |
| `traits` | object | Field values |

## Traits (Field Values)

```json
{
  "traits": {
    "primary-isp": "Comcast Business",
    "backup-isp": "Verizon FiOS",
    "public-ip-addresses": "203.0.113.10\n203.0.113.11",
    "firewall": {
      "type": "Tag",
      "values": [{"id": 12345, "type": "Configuration"}]
    },
    "dns-provider": "Cloudflare"
  }
}
```

## Common Flexible Asset Types

### Network Overview

```
Fields:
├── Name (Text) - Required, Name field
├── Primary ISP (Text)
├── Backup ISP (Text)
├── Public IP Addresses (Textarea)
├── Internal IP Scheme (Textarea)
├── Firewall (Tag - Configuration)
├── Core Switch (Tag - Configuration)
├── Network Diagram (Upload)
├── DNS Provider (Select)
└── Last Reviewed (Date)
```

### Application Documentation

```
Fields:
├── Name (Text) - Required, Name field
├── Description (Textarea)
├── Version (Text)
├── Vendor (Text)
├── Support Contact (Tag - Contact)
├── Primary Server (Tag - Configuration)
├── Database Server (Tag - Configuration)
├── Admin URL (Text)
├── Admin Credentials (Password)
├── License Key (Password)
├── License Expiration (Date)
├── Documentation URL (Text)
└── Notes (Textarea)
```

### Backup Overview

```
Fields:
├── Name (Text) - Required, Name field
├── Backup Solution (Select)
├── Backup Server (Tag - Configuration)
├── Retention Policy (Textarea)
├── Backup Schedule (Textarea)
├── Data Protected (Textarea)
├── Recovery Time Objective (Text)
├── Recovery Point Objective (Text)
├── Last Test Date (Date)
├── Backup Admin Credentials (Password)
└── Notes (Textarea)
```

### Microsoft 365 Tenant

```
Fields:
├── Name (Text) - Required, Name field
├── Tenant ID (Text)
├── Primary Domain (Text)
├── Additional Domains (Textarea)
├── License Summary (Textarea)
├── Admin Portal URL (Text)
├── Global Admin (Tag - Contact)
├── Admin Credentials (Password)
├── MFA Status (Select)
├── Conditional Access (Checkbox)
└── Notes (Textarea)
```
