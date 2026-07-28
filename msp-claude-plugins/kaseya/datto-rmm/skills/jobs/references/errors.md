# Datto RMM Job API Errors

| Error | Status | Cause | Resolution |
|-------|--------|-------|------------|
| Device offline | 400 | Device not online | Wait for device or use scheduled job |
| Component not found | 404 | Invalid componentUid | Verify component exists |
| Missing variable | 400 | Required variable not provided | Include all required variables |
| Job not found | 404 | Invalid jobUid | Verify job was created |
| Permission denied | 403 | API restrictions | Check component permissions |

**Error Response Example:**
```json
{
  "errorCode": "DEVICE_OFFLINE",
  "message": "Cannot run quick job on offline device",
  "details": {
    "deviceUid": "d4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f9a",
    "lastSeen": 1707900000000
  }
}
```
