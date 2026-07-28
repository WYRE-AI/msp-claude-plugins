# Datto RMM Device API Errors

| Error | Status | Cause | Resolution |
|-------|--------|-------|------------|
| Device not found | 404 | Invalid UID | Verify device exists |
| Invalid field value | 400 | UDF too long | Max 255 characters |
| Permission denied | 403 | API key restrictions | Check API permissions |
| Device locked | 409 | Concurrent update | Retry after delay |

**Error Response Example:**
```json
{
  "errorCode": "DEVICE_NOT_FOUND",
  "message": "Device with UID 'd4e5f6a7-...' not found",
  "details": {
    "deviceUid": "d4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f9a"
  }
}
```
