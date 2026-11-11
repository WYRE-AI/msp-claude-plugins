# SuperOps.ai Alert GraphQL Operations

Every document on this page validates against `schema/superops.graphql` in
[superops-mcp](https://github.com/WYRE-AI/superops-mcp) and uses only operations
listed in the published API reference at <https://developer.superops.com/msp>.

The Conduit `superops` connector has no typed alert tool. Alert reads go through
`superops_custom_query` and alert writes through `superops_custom_mutation`. Both
are admin tier, so a human approver must see the exact document and variables
before each call.

## What the schema has

| Operation | Type | Input | Returns |
|-----------|------|-------|---------|
| `getAlertList` | query | `ListInfoInput!` | `AlertList { alerts, listInfo }` |
| `getAlertsForAsset` | query | `AssetDetailsListInput!` (`assetId`, `listInfo`) | `AlertList` |
| `resolveAlerts` | mutation | `[ResolveAlertInput]`, each `{ id }` | `Boolean` |
| `createAlert` | mutation | `CreateAlertInput!` (`assetId`, `message`, `description`, `severity`) | `Alert` |

The schema has no single-alert query (`getAlert`), no acknowledge mutation
(`acknowledgeAlerts`) and no alert-to-ticket mutation (`createTicketFromAlert`).
Acknowledge an alert in the SuperOps console. To track an alert as a ticket,
create the ticket with `superops_tickets_create`.

An `Alert` has these fields: `id`, `message`, `description`, `severity`, `status`,
`createdTime`, `resolvedTime`, `occurrenceCount`, `asset` and `policy`. `asset`
and `policy` are `JSON` scalars, so select them by name with no sub-selection.
An alert has no `client`, `site`, `type`, `acknowledgedBy` or `ticket` field.

`status` and `severity` are plain `String` in the schema, and the schema does not
list their values. It also does not document which attributes an alert
`condition` accepts. An unrecognised attribute or value returns zero rows without
an error. Read a page of alerts first and filter on the values you see. Before
you trust a filtered count, compare its `totalCount` with an unfiltered call.

## List alerts

```graphql
query getAlertList($input: ListInfoInput!) {
  getAlertList(input: $input) {
    alerts {
      id
      message
      description
      severity
      status
      createdTime
      resolvedTime
      occurrenceCount
      asset
      policy
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

**Variables: newest first, one status, several severities.** `includes` takes
an array, and `joinOperator` must be uppercase. SuperOps treats any other spelling
as `OR` without reporting an error.

```json
{
  "input": {
    "page": 1,
    "pageSize": 50,
    "condition": {
      "joinOperator": "AND",
      "operands": [
        { "attribute": "status", "operator": "includes", "value": ["<status>"] },
        { "attribute": "severity", "operator": "includes", "value": ["<severity-1>", "<severity-2>"] }
      ]
    },
    "sort": [{ "attribute": "createdTime", "order": "DESC" }]
  }
}
```

Pagination is by offset. Increment `page` while `listInfo.hasMore` is `true`.
SuperOps returns `null` instead of `false` on the last page.

## Alerts for one asset

Use this query to scope alerts to a single asset. A client is the set of assets
listed by `superops_assets_list` with `clientId`. To gather a client's alerts, run
this query once for each of those assets.

```graphql
query getAlertsForAsset($input: AssetDetailsListInput!) {
  getAlertsForAsset(input: $input) {
    alerts {
      id
      message
      severity
      status
      createdTime
      resolvedTime
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
    "assetId": "<asset id>",
    "listInfo": { "page": 1, "pageSize": 50 }
  }
}
```

## Resolve alerts

`resolveAlerts` takes a list. Pass one `{ id }` object per alert, even when there
is only one. The mutation returns a bare `Boolean` and has no field for resolution
notes, so record the note on the related ticket with `superops_tickets_add_note`.

```graphql
mutation resolveAlerts($input: [ResolveAlertInput]) {
  resolveAlerts(input: $input)
}
```

```json
{
  "input": [{ "id": "<alert id>" }, { "id": "<another alert id>" }]
}
```

## Workflow: alert summary in one request

Aliases batch several counts into one `superops_custom_query` call. Each count
reads only `listInfo { totalCount }`. Put the tenant's status and severity values
in `condition`.

```graphql
query alertSummary {
  openCritical: getAlertList(input: {
    pageSize: 1
    condition: {
      joinOperator: "AND"
      operands: [
        { attribute: "status", operator: "includes", value: ["<open status>"] }
        { attribute: "severity", operator: "includes", value: ["<critical severity>"] }
      ]
    }
  }) {
    listInfo { totalCount }
  }
  allOpen: getAlertList(input: {
    pageSize: 1
    condition: { attribute: "status", operator: "includes", value: ["<open status>"] }
  }) {
    listInfo { totalCount }
  }
  newest: getAlertList(input: {
    pageSize: 10
    sort: [{ attribute: "createdTime", order: DESC }]
  }) {
    alerts { id message severity status createdTime asset }
  }
}
```

## Workflow: triage

1. List alerts newest first with `getAlertList` through `superops_custom_query`.
2. Read the alert's asset with `superops_assets_get`. Take the `assetId` from the
   alert's `asset` JSON.
3. Acknowledge the alert in the SuperOps console. The API cannot acknowledge alerts.
4. If the work needs tracking, call `superops_tickets_create`. Put the alert `id`
   and message in the description.
5. When the issue is fixed, send `resolveAlerts` through `superops_custom_mutation`
   with human approval.

## Workflow: client alert report

The schema offers no client attribute on `Alert` and no documented date-range
operator. The supported operators are `is`, `isNot`, `contains`, `notContains`,
`startsWith`, `endsWith`, `includes` and `notIncludes`. To report on one client:

1. Call `superops_assets_list` with `clientId` to list the client's assets.
2. For each asset, page through `getAlertsForAsset`.
3. Keep the alerts whose `createdTime` falls inside the reporting window.
