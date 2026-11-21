# NinjaOne Devices — Reference

## API Base URLs

| Region | Base URL |
|--------|----------|
| US | `https://app.ninjarmm.com` |
| US2 | `https://us2.ninjarmm.com` |
| EU | `https://eu.ninjarmm.com` |
| Oceania | `https://oc.ninjarmm.com` |
| CA | `https://ca.ninjarmm.com` |
| FED | `https://fed.ninjarmm.com` |

## Device Roles

| Role ID | Name | Description |
|---------|------|-------------|
| 1 | Windows Workstation | Standard Windows endpoint |
| 2 | Windows Server | Windows Server OS |
| 3 | Mac | macOS device |
| 4 | Linux Workstation | Linux desktop |
| 5 | Linux Server | Linux server |

## Hardware Inventory Endpoints

All endpoints require `Authorization: Bearer {token}`.

### Get Disks

```http
GET /api/v2/device/{id}/disks
Authorization: Bearer {token}
```

### Get Volumes

```http
GET /api/v2/device/{id}/volumes
Authorization: Bearer {token}
```

### Get Processors

```http
GET /api/v2/device/{id}/processors
Authorization: Bearer {token}
```

### Get Installed Software

```http
GET /api/v2/device/{id}/software
Authorization: Bearer {token}
```

## Device Approval

Approve or reject new devices pending enrollment:

```http
POST /api/v2/devices/approval/{mode}
Authorization: Bearer {token}
Content-Type: application/json
```

Modes: `APPROVE`, `REJECT`

```json
{
  "devices": [123, 456, 789]
}
```

## Error Codes

| Code | Description | Resolution |
|------|-------------|------------|
| 404 | Device not found | Verify device ID exists and belongs to an accessible organization |
| 403 | Access denied | Check API key scopes and organization-level permissions |
| 409 | Conflict | Device may be offline or mid-operation — retry after checking status |
