---
description: Execute a script on a remote asset via SuperOps RMM
argument-hint: "<asset_id> <script_id> [arguments]"
arguments: [asset_id, script_id, arguments]
---

# Run Script on SuperOps.ai Asset

Run a library script on one asset through SuperOps.ai RMM.

## How this runs through Conduit

The Conduit `superops` connector has **no script tool**. The only route is the
generic GraphQL passthrough. `superops_custom_query` handles the script lookup
and `superops_custom_mutation` handles the run. Both are admin tier. The mutation
runs code on a client's machine, so every call needs a named human approver who
has seen the exact mutation text and variables. Never run it from a scheduled or
unattended agent.

Use `superops_assets_get` for the asset check. If the operator has no `admin`
grant on SuperOps, stop and say so rather than looking for another route.

## Steps

1. **Check the asset.** Call `superops_assets_get`. Continue only if `status` is
   online and `lastCommunicatedTime` is recent. A run queued to an offline asset
   waits until the asset checks in.

2. **Check the script.** The schema has no single-script query. Page through
   `getScriptList`, or `getScriptListByType` with `type: "WINDOWS"` or `"MAC"`,
   and find the `scriptId`:

   ```graphql
   query getScriptList($input: ListInfoInput!) {
     getScriptList(input: $input) {
       scripts { scriptId name language runAs timeOut runTimeVariables }
       listInfo { page pageSize totalCount hasMore }
     }
   }
   ```

   ```json
   { "input": { "page": 1, "pageSize": 100 } }
   ```

   `runTimeVariables` lists the argument names the script needs. `runAs` and
   `timeOut` are set on the script and cannot be overridden per run.

3. **Get approval.** Show the operator the mutation below with the filled-in
   variables.

4. **Run.**

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
       "assetId": "<asset_id>",
       "scriptId": "<script_id>",
       "scriptArguments": [
         { "name": "ServiceName", "value": "Spooler" },
         { "name": "WaitSeconds", "value": "30" }
       ]
     }
   }
   ```

   `scriptArguments` is a list of `{ name, value }` pairs, one for each
   `runTimeVariables` name. Each value is a string.

5. **Report.** Return the `actionConfigId`. The API has no query that reads a
   run's status, exit code or output. Ask the operator to check the result in the
   SuperOps console, and record it on the ticket with `superops_tickets_add_note`.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| asset_id | string | Yes | Target asset ID |
| script_id | string | Yes | Script ID from the library |
| arguments | string | No | JSON object of run-time variables, sent as `{ name, value }` pairs |

## Examples

```
/run-script 1182 6001114136934215681
/run-script 1182 6001114136934215681 --arguments '{"ServiceName": "Spooler", "WaitSeconds": "30"}'
```

## Output

```
Script queued (actionConfigId 2861598057825157120)
  Script: Restart Service (PowerShell, runs as System)
  Asset: ACME-DC01 (ONLINE)
  Arguments: ServiceName=Spooler, WaitSeconds=30

The SuperOps API cannot read the run result back.
Check it in the SuperOps console; I'll note the outcome on the ticket.
```

## Error Handling

| Error | Resolution |
|-------|------------|
| Asset offline | Wait for the asset to check in. Don't queue blind |
| Script not found | Re-list with `getScriptList` |
| Missing argument | Supply every `runTimeVariables` name |
| Invalid arguments JSON | Ask for a valid JSON object |
| No `admin` grant | Stop and say so |

## Several assets

The schema has no batch or scheduled run. Get approval for the full list of
assets, then repeat step 4 once per asset. To run at a later time, schedule the
job in the SuperOps console.

## Related Commands

- `/list-assets` - Find assets to target
- `/get-asset` - Check an asset before running
- `/list-alerts` - Find alerts that need remediation
- `/resolve-alert` - Resolve the alert after remediation
