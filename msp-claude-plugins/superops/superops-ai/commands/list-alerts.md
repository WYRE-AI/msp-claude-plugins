---
description: List active RMM alerts across all clients or filtered by criteria
argument-hint: "[client_id] [severity] [status] [asset_id] [limit]"
arguments: [client_id, severity, status, asset_id, limit]
---

# List SuperOps.ai RMM Alerts

List RMM alerts across all clients, or for one client or one asset.

## How this runs through Conduit

The Conduit `superops` connector has **no alert tool**. The only route is the
generic GraphQL passthrough `superops_custom_query`, which is admin tier. It
cannot change state, but it can read anything the token can see, so it needs a
human approver.

Use the typed tools for context: `superops_clients_search` resolves a client
name, `superops_assets_list` lists a client's assets, and `superops_assets_get`
reads one asset. Fall back to the passthrough only for the alert step itself. If
the operator has no `admin` grant on SuperOps, stop and say so rather than
looking for another route.

## Steps

1. **Choose the query.**
   - No `asset_id` or `client_id`: use `getAlertList`.
   - `asset_id`: use `getAlertsForAsset` for that asset.
   - `client_id`: an `Alert` has no client field. Resolve the client with
     `superops_clients_search`, list its assets with `superops_assets_list`
     (`clientId`), and run `getAlertsForAsset` for each asset.

2. **Query alerts** with `superops_custom_query`:

   ```graphql
   query getAlertList($input: ListInfoInput!) {
     getAlertList(input: $input) {
       alerts {
         id
         message
         severity
         status
         createdTime
         resolvedTime
         asset
       }
       listInfo {
         page
         pageSize
         totalCount
         hasMore
       }
     }
   }
   ```

   ```json
   {
     "input": {
       "page": 1,
       "pageSize": 25,
       "condition": {
         "joinOperator": "AND",
         "operands": [
           { "attribute": "status", "operator": "includes", "value": ["<status>"] },
           { "attribute": "severity", "operator": "includes", "value": ["<severity>"] }
         ]
       },
       "sort": [{ "attribute": "createdTime", "order": "DESC" }]
     }
   }
   ```

   For one asset:

   ```graphql
   query getAlertsForAsset($input: AssetDetailsListInput!) {
     getAlertsForAsset(input: $input) {
       alerts { id message severity status createdTime resolvedTime }
       listInfo { page pageSize totalCount hasMore }
     }
   }
   ```

   ```json
   { "input": { "assetId": "<asset_id>", "listInfo": { "page": 1, "pageSize": 25 } } }
   ```

3. **Mind the filters.** `status` and `severity` are plain strings, and the
   schema lists no values for them. A value the tenant doesn't use returns zero
   rows without an error, so the first time, list without a condition and filter
   on the values you see. Include only the operands the user asked for.
   `joinOperator` must be uppercase.

4. **Page and format.** `limit` maps to `pageSize`, which has a maximum of 100.
   Keep paging while `listInfo.hasMore` is `true`. Group the rows by severity, show
   each alert's age from `createdTime`, and name the asset from the `asset` JSON.

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| client_id | string | No | - | Client account ID or name |
| severity | string | No | - | The tenant's severity value |
| status | string | No | - | The tenant's status value |
| asset_id | string | No | - | One asset |
| limit | integer | No | 25 | Page size (1-100) |

## Examples

```
/list-alerts
/list-alerts --severity Critical
/list-alerts --client_id "Acme Corporation"
/list-alerts --asset_id 1182
```

## Output

```
Alerts (showing 12 of 47)

Critical (3)
  [2m ago]  ACME-DC01   Disk Space Critical: C: drive at 5% free      id 4417
  [15m ago] TECH-SQL01  Service Stopped: MSSQLSERVER                  id 4415
  [1h ago]  ABC-FILE01  CPU Usage: 98% for 30 minutes                 id 4409

High (5)
  ...

Next page: --page 2
```

## Error Handling

| Situation | Response |
|-----------|----------|
| Client not found | Offer the closest matches from `superops_clients_search` |
| Zero rows with a filter | Re-run unfiltered and check the tenant's status and severity spellings |
| No `admin` grant | Stop and say so |

## Related Commands

- `/acknowledge-alert` - Acknowledge an alert
- `/resolve-alert` - Resolve an alert
- `/create-ticket` - Create a ticket for an alert
- `/get-asset` - View asset details
- `/run-script` - Run a remediation script
