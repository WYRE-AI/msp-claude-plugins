# Automate Alert API Reference

The Automate REST API exposes alerts as read-only. These are the only alert routes, and the MCP tools wrap the first two:

| Route | MCP tool | Notes |
|-------|----------|-------|
| `GET /cwa/api/v1/Alerts` | `cwautomate_alerts_list` | Filtered with the `condition` expression; paged with `pageSize`/`page` |
| `GET /cwa/api/v1/Alerts/{alertID}` | `cwautomate_alerts_get` | One alert |
| `GET /cwa/api/v1/Computers/{computerID}/Alerts` | `cwautomate_alerts_list` with `computer_id` | Alerts for one computer |

There is **no** acknowledge, resolve, suppress, note, history or create-ticket route. Earlier versions of this reference listed `POST /Alerts/{id}/Acknowledge` and `POST /Alerts/BulkAcknowledge`; those routes do not exist in the published Automate API, and the matching MCP tool was removed in connectwise-automate-mcp 2.0.0.

## Filtering

The server builds the `condition` expression from the tool arguments:

```http
GET /cwa/api/v1/Alerts?condition=ComputerID = 1234 and Severity.Id = 4&pageSize=50
Authorization: Bearer {token}
```

Automate silently ignores query parameters other than `condition`, `pageSize`, `page` and `orderBy`, so a filter that is not expressed through `condition` returns the unfiltered list.
