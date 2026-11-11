# SuperOps.ai Script Operations

Every GraphQL document on this page validates against `schema/superops.graphql`
in [superops-mcp](https://github.com/WYRE-AI/superops-mcp) and uses only
operations listed in the published API reference at
<https://developer.superops.com/msp>.

The Conduit `superops` connector has no typed script tool. Script lookups go
through `superops_custom_query`, and execution goes through
`superops_custom_mutation`. Both are admin tier. Running a script changes a
client's machine, so a named human approver must see the exact mutation and
variables before every run. Never send one from a scheduled or unattended agent.

## What the schema has

| Operation | Type | Input | Returns |
|-----------|------|-------|---------|
| `getScriptList` | query | `ListInfoInput!` | `ScriptList { scripts, listInfo }` |
| `getScriptListByType` | query | `ScriptListByTypeInput!` (`type`, e.g. `WINDOWS` or `MAC`, plus `listInfo`) | `ScriptList` |
| `runScriptOnAsset` | mutation | `RunScriptInput!` (`assetId`, `scriptId`, `scriptArguments`) | `RunScriptData` |

That is the whole script surface. The schema has none of the following:

- a single-script query (`getScript`)
- a multi-asset run (`runScriptOnAssets`)
- scheduling (`scheduleScript`)
- any way to read an execution back (`getScriptExecution`,
  `getBatchExecution`, `getScriptExecutionHistory`)

`runScriptOnAsset` also takes no `runAs`, `timeout` or `priority`. Those are
properties of the stored script.

## List scripts

```graphql
query getScriptList($input: ListInfoInput!) {
  getScriptList(input: $input) {
    scripts {
      scriptId
      name
      description
      language
      runAs
      timeOut
      runTimeVariables
      tags
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
{ "input": { "page": 1, "pageSize": 100 } }
```

The schema does not document which attributes a script `condition` accepts, and
an unrecognised attribute returns zero rows without an error. Page through the
list and match on `name` yourself. If you do try a `condition`, compare its
`totalCount` with an unfiltered call.

`runTimeVariables` lists the argument names the script expects.
`scriptArguments` on the run must supply a value for each of them.

## List scripts for one OS

`getScriptListByType` includes SuperOps' predefined scripts for that platform.

```graphql
query getScriptListByType($input: ScriptListByTypeInput!) {
  getScriptListByType(input: $input) {
    scripts {
      scriptId
      name
      language
      runTimeVariables
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
{ "input": { "type": "WINDOWS", "listInfo": { "page": 1, "pageSize": 100 } } }
```

## Run a script on one asset

```graphql
mutation runScriptOnAsset($input: RunScriptInput!) {
  runScriptOnAsset(input: $input) {
    actionConfigId
    script
    scriptArguments
    addedBy
  }
}
```

```json
{
  "input": {
    "assetId": "<asset id>",
    "scriptId": "<script id>",
    "scriptArguments": [
      { "name": "path", "value": "C:\\Temp" },
      { "name": "days", "value": "30" }
    ]
  }
}
```

`scriptArguments` is a list of `{ name, value }` pairs, and each value is a
string. Inside the script, an argument named `path` is read as `$path`.
`script`, `scriptArguments` and `addedBy` in the response are `JSON`. Select them
by name only.

The mutation queues the run and returns `actionConfigId`. Nothing in the schema
reads the status, exit code or output for that ID. Check the result in the
SuperOps console. `getAssetActivity` (see the
[assets reference](../../assets/references/api.md)) lists the actions recorded
against an asset, but the schema does not say whether script runs appear there.

## Workflow: remediation

1. Call `superops_assets_get`. Continue only if `status` is online and
   `lastCommunicatedTime` is recent.
2. Find the script with `getScriptList` or `getScriptListByType` through
   `superops_custom_query`. Note its `runTimeVariables`.
3. Show the operator the `runScriptOnAsset` document and variables, and get
   approval.
4. Send the mutation through `superops_custom_mutation` and report the returned
   `actionConfigId`.
5. Ask the operator to confirm the outcome in the console. Record the result on
   the ticket with `superops_tickets_add_note`.

## Workflow: the same script on several assets

The schema has no batch or scheduled run. Repeat `runScriptOnAsset` once per
asset, and get approval for the full list of assets first. For a maintenance
window, run the calls when the window opens, or schedule the job in the SuperOps
console.
