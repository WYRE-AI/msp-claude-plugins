# SuperOps.ai Script Field Reference

These tables list the fields on the `Script`, `RunScriptInput` and
`RunScriptData` types in `schema/superops.graphql`
([superops-mcp](https://github.com/WYRE-AI/superops-mcp)).

## Script (`getScriptList`, `getScriptListByType`)

| Field | Type | Description |
|-------|------|-------------|
| `scriptId` | ID | Script ID, passed to `runScriptOnAsset` |
| `name` | String | Script name |
| `description` | String | What the script does |
| `language` | String | Script language, such as PowerShell or Bash |
| `runAs` | String | Execution context. Set on the script, not per run |
| `timeOut` | Int | Execution timeout. Set on the script, not per run |
| `runTimeVariables` | [String] | Argument names the script expects |
| `tags` | JSON | Tags |
| `readMe` | String | Usage notes |
| `favourite` | Boolean | Marked as a favourite |
| `addedBy` | JSON | Author |
| `createdTime` | String | When the script was added |

## Run input (`RunScriptInput`)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `assetId` | ID | Yes | Target asset |
| `scriptId` | ID | Yes | Script to run |
| `scriptArguments` | JSON | No | A list of `{ name, value }` pairs, each value a string |

## Run result (`RunScriptData`)

| Field | Type | Description |
|-------|------|-------------|
| `actionConfigId` | ID | ID of the queued run |
| `script` | JSON | The script that was queued |
| `scriptArguments` | JSON | The arguments sent |
| `addedBy` | JSON | Who queued it |

The schema has no type for an execution's status, start or end time, exit code or
output, and no query that reads them. Run results are visible only in the
SuperOps console.
