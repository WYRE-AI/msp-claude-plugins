# QuickBooks Online Invoice Endpoint Reference

| Operation | Method | Endpoint |
|-----------|--------|----------|
| Create | POST | `/v3/company/{realmId}/invoice` |
| Read | GET | `/v3/company/{realmId}/invoice/{id}` |
| Update | POST | `/v3/company/{realmId}/invoice` |
| Delete | POST | `/v3/company/{realmId}/invoice?operation=delete` |
| Void | POST | `/v3/company/{realmId}/invoice?operation=void` |
| Send | POST | `/v3/company/{realmId}/invoice/{id}/send` |
| PDF | GET | `/v3/company/{realmId}/invoice/{id}/pdf` |
| Query | GET | `/v3/company/{realmId}/query?query=...` |
