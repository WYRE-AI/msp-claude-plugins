---
description: List and filter assets in SuperOps.ai
argument-hint: "[client] [status] [platform] [limit] [page]"
arguments: [client, status, platform, limit, page]
---

# List SuperOps.ai Assets

List and filter the assets managed by SuperOps.ai RMM.

## How this runs through Conduit

Use the typed tool `superops_assets_list` (read tier). It sends `getAssetList`
with `page`/`pageSize` paging and an AND of the filters you pass.

## Steps

1. **Resolve the client.** If the user gave a name, call
   `superops_clients_search` and take the `accountId`.
2. **List.**

   ```json
   { "status": "ONLINE", "platform": "Windows", "clientId": "<accountId>", "pageSize": 50, "page": 1 }
   ```

   - `status` is matched whole and without case. Observed values are `ONLINE`
     and `OFFLINE`.
   - `platform` is a substring of the stored OS name, such as
     `Microsoft Windows 10 Pro`. Pass `Windows`, `darwin` or `Linux`.
3. **Page.** Increment `page` while `listInfo.hasMore` is `true`. It is `null`,
   not `false`, on the last page.
4. **Format.** Group the rows by client (the `client` JSON) and show `name`,
   `platform`, `status`, `publicIp`, `lastCommunicatedTime` and `patchStatus`.

`getAssetList` has no name-search filter. To find one machine by name, page
through the list and match `name` or `hostName`.

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| client | string | No | - | Client name or account ID |
| status | string | No | all | `ONLINE` or `OFFLINE` |
| platform | string | No | - | OS name fragment, such as `Windows`, `darwin` or `Linux` |
| limit | int | No | 50 | Page size (1-100) |
| page | int | No | 1 | Page number |

## Examples

```
/list-assets
/list-assets --client "Acme Corp"
/list-assets --status ONLINE --platform Windows --limit 100
```

## Output

```
Assets (page 1, 50 of 156)

Acme Corporation
  ACME-DC01      Microsoft Windows Server 2022   ONLINE    203.0.113.50   patch: Up to date
  ACME-WS001     Microsoft Windows 11 Pro        ONLINE    203.0.113.50   patch: Pending
  ACME-MBP-JOHN  darwin                          OFFLINE   last check-in 2h ago

Next page: --page 2
```

## Error Handling

| Error | Resolution |
|-------|------------|
| Client not found | Offer the closest matches from `superops_clients_search` |
| No rows | Broaden the filters. Remember that `status` and `platform` values come from agent telemetry |
| Rate limited | Wait and retry (800 req/min limit) |

## Related Commands

- `/get-asset` - Detailed asset information
- `/create-ticket` - Create a ticket for an asset issue
- `/run-script` - Run a script on an asset
