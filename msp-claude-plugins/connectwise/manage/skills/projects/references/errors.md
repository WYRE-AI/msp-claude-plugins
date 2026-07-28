# ConnectWise PSA Project Error Reference

| Error | Cause | Resolution |
|-------|-------|------------|
| Company required | Missing company reference | Include `company: {id: x}` |
| Name required | Missing project name | Provide name field |
| Invalid status | Status doesn't exist | Query statuses endpoint |
| Invalid manager | Member doesn't exist | Verify member ID |
| Template not found | Invalid projectTemplateId | Query templates first |
