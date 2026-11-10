---
description: Acknowledge an RMM alert to indicate investigation is underway
argument-hint: "<alert_id> [note]"
arguments: [alert_id, note]
---

# Acknowledge SuperOps.ai Alert

Mark an RMM alert as being worked so other technicians don't pick it up.

## How this runs through Conduit

> **The API cannot do this.** `schema/superops.graphql` in superops-mcp has no
> acknowledge mutation, and neither does the published reference at
> developer.superops.com/msp. There is nothing to send through
> `superops_custom_mutation`. The acknowledgement itself happens in the SuperOps
> console. This command finds the alert, shows it to the operator, and hands off.

The Conduit `superops` connector has **no alert tool**. Reading the alert goes
through `superops_custom_query`. That tool is admin tier and read-only, and it
needs a human approver who has seen the query. Use the typed tools for asset and
client context: `superops_assets_get` and `superops_clients_get`. If the operator
has no `admin` grant on SuperOps, stop and say so rather than looking for another
route.

## Steps

1. **Find the alert.** Send `getAlertList` through `superops_custom_query`, sorted
   newest first. Keep the row whose `id` matches `alert_id`. The schema has no
   single-alert query.

   ```graphql
   query getAlertList($input: ListInfoInput!) {
     getAlertList(input: $input) {
       alerts { id message severity status createdTime asset }
       listInfo { page pageSize totalCount hasMore }
     }
   }
   ```

   ```json
   { "input": { "page": 1, "pageSize": 100, "sort": [{ "attribute": "createdTime", "order": "DESC" }] } }
   ```

   Keep paging while `hasMore` is `true`. If the alert has not turned up after a
   few pages, ask the operator for the asset and use `getAlertsForAsset` instead.
   See the alerts skill reference.
2. **Add context.** Call `superops_assets_get` with the `assetId` from the
   alert's `asset` JSON.
3. **Hand off.** Give the operator the alert ID, message and asset, and ask them
   to acknowledge it in the SuperOps console with their note.
4. **Confirm.** When the operator says it is done, re-read the alert and report
   its `status`.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| alert_id | string | Yes | The alert `id` |
| note | string | No | Note for the operator to enter in the console |

## Example

```
/acknowledge-alert 4417 "Investigating disk space on ACME-DC01"
```

```
Alert 4417 (status: <current status>, severity: <severity>)
  Asset: ACME-DC01 (ONLINE, last check-in 2 min ago)
  Message: Disk Space Critical: C: drive at 5% free

The SuperOps API has no acknowledge operation. Please acknowledge this alert
in the SuperOps console with the note:
  "Investigating disk space on ACME-DC01"
Tell me when it's done and I'll confirm the new status.
```

## Error Handling

| Situation | Response |
|-----------|----------|
| Alert not found in the pages read | Ask for the asset and search `getAlertsForAsset` |
| Alert already resolved | Report it; there is nothing to acknowledge |
| No `admin` grant for the passthrough | Stop and say so |

## Related Commands

- `/list-alerts` - List alerts
- `/resolve-alert` - Resolve an alert
- `/create-ticket` - Track the work as a ticket
- `/get-asset` - View asset details
- `/run-script` - Run a remediation script
