# Datto RMM Site API Errors

| Error | Status | Cause | Resolution |
|-------|--------|-------|------------|
| Site not found | 404 | Invalid siteUid | Verify site exists |
| Name already exists | 400 | Duplicate site name | Use unique name |
| Cannot delete | 400 | Site has devices | Move devices first |
| Permission denied | 403 | API restrictions | Check permissions |
