# SuperOps.ai Script and Execution Field Reference

## Script Definition Fields

| Field | Type | Description |
|-------|------|-------------|
| `scriptId` | ID | Unique identifier |
| `name` | String | Script name |
| `description` | String | What the script does |
| `type` | Enum | PowerShell, Batch, Bash, Python |
| `content` | String | Script source code |
| `parameters` | [Parameter] | Input parameters |
| `timeout` | Int | Execution timeout (seconds) |
| `osType` | Enum | Windows, macOS, Linux |

## Execution Fields

| Field | Type | Description |
|-------|------|-------------|
| `actionConfigId` | ID | Execution instance ID |
| `status` | Enum | Pending, Running, Success, Failed |
| `startTime` | DateTime | Execution start |
| `endTime` | DateTime | Execution end |
| `exitCode` | Int | Script exit code |
| `output` | String | Script output |
| `error` | String | Error messages |

## Script Types

| Type | Description | Use Case |
|------|-------------|----------|
| **PowerShell** | Windows PowerShell scripts | Windows automation |
| **Batch** | Windows batch scripts | Simple Windows tasks |
| **Bash** | Unix shell scripts | macOS/Linux automation |
| **Python** | Python scripts | Cross-platform automation |

## Run As Options

| Option | Description | When to Use |
|--------|-------------|-------------|
| **System** | Run as SYSTEM account | Admin tasks, service management |
| **Logged-in User** | Current user context | User-specific tasks |
| **Specific User** | Custom credentials | Specific permission needs |

## Execution Priority

| Priority | Description |
|----------|-------------|
| **Immediate** | Execute as soon as possible |
| **Normal** | Standard queue priority |
| **Low** | Execute during low activity |
