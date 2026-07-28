# Datto RMM Variable API Errors

| Error | Status | Cause | Resolution |
|-------|--------|-------|------------|
| Variable exists | 400 | Duplicate name | Use PUT to update |
| Variable not found | 404 | Invalid ID | Verify variable exists |
| Invalid name | 400 | Reserved prefix or invalid chars | Use valid naming |
| Permission denied | 403 | API restrictions | Check permissions |
