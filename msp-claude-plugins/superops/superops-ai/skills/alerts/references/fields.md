# SuperOps.ai Alert Field Reference

This table lists every field on the `Alert` type in `schema/superops.graphql`
([superops-mcp](https://github.com/WYRE-AI/superops-mcp)).

| Field | Type | Description |
|-------|------|-------------|
| `id` | ID | Alert ID. This is the `{ id }` that `resolveAlerts` takes |
| `message` | String | Alert message |
| `description` | String | Longer description |
| `severity` | String | Severity. The schema defines no enum |
| `status` | String | Status. The schema defines no enum |
| `createdTime` | String | When the alert was raised |
| `resolvedTime` | String | When it was resolved |
| `occurrenceCount` | Int | How many times the condition fired |
| `asset` | JSON | The alerting asset. Select by name only |
| `policy` | JSON | The policy that raised it. Select by name only |

An alert has no `alertId`, `type`, `client`, `site`, `monitor`, `ticket`,
`acknowledgedTime`, `acknowledgedBy`, `resolvedBy` or `resolutionNotes` field. To
find the client, read the asset with `superops_assets_get`. To record notes, use
the related ticket.
