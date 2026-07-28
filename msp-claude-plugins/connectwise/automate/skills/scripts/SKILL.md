---
name: "ConnectWise Automate Scripts"
description: >
  ConnectWise Automate script management: script types (PowerShell, batch,
  VBScript, Shell), script folders, script execution on computers, parameter
  handling and validation, execution status polling, and result/history
  retrieval.
when_to_use: >-
  When listing, executing, passing parameters, and retrieving results. Use when: automate script,
  automate powershell, automate execute, run script, script execution, script parameters, script
  results, script history, labtech script, or automate automation.
---

# ConnectWise Automate Script Management

## Overview

Scripts in ConnectWise Automate are automation routines that run on managed endpoints. They can be PowerShell, batch files, VBScript, or Automate's native scripting language. This skill covers script listing, execution, parameters, and result retrieval.

## Key Concepts

### Script Types

| Type | Extension | Use Case |
|------|-----------|----------|
| **Automate Script** | Internal | Built-in functions, agent commands |
| **PowerShell** | .ps1 | Windows automation, complex logic |
| **Batch** | .bat/.cmd | Simple Windows tasks |
| **VBScript** | .vbs | Legacy Windows automation |
| **Shell** | .sh | Linux/macOS automation |

### Script Execution Modes

| Mode | Description | Use Case |
|------|-------------|----------|
| **Immediate** | Run now on target | Ad-hoc tasks |
| **Scheduled** | Run at specific time | Maintenance |
| **On Event** | Triggered by alert/monitor | Automated remediation |
| **Login/Logout** | Run at user session events | User setup |

### Script Status

| Status | Description |
|--------|-------------|
| `Running` | Currently executing |
| `Completed` | Finished successfully |
| `Failed` | Execution error |
| `Pending` | Queued for execution |
| `Timeout` | Exceeded time limit |
| `Cancelled` | Manually stopped |

## Field Reference

See [references/fields.md](references/fields.md) for the complete `Script`, `ScriptParameter`, and `ScriptExecution` field reference (TypeScript interfaces).

## API Patterns

See [references/api.md](references/api.md) for the complete endpoint catalog: listing/searching scripts, executing on one or many computers, polling execution status, and retrieving execution history — with full request/response JSON examples.

## Workflows

### Find Script by Name

```javascript
async function findScriptByName(client, name) {
  const scripts = await client.request(
    `/Scripts?condition=Name contains '${name}'&pageSize=50`
  );

  if (scripts.length === 0) {
    return { found: false, suggestions: [] };
  }

  if (scripts.length === 1) {
    return { found: true, script: scripts[0] };
  }

  return {
    found: false,
    ambiguous: true,
    suggestions: scripts.map(s => ({
      name: s.Name,
      id: s.ScriptID,
      folder: s.FolderPath,
      description: s.Description
    }))
  };
}
```

### Execute Script and Wait for Completion

```javascript
async function runScriptAndWait(client, computerId, scriptId, params = {}, options = {}) {
  const { timeoutMs = 300000, pollIntervalMs = 5000 } = options;

  // Start the script
  const execution = await client.request(
    `/Computers/${computerId}/Scripts/${scriptId}/Execute`,
    {
      method: 'POST',
      body: JSON.stringify({ Parameters: params })
    }
  );

  const startTime = Date.now();

  // Poll for completion
  while (true) {
    const status = await client.request(
      `/Scripts/Executions/${execution.ExecutionID}`
    );

    if (['Completed', 'Failed', 'Timeout', 'Cancelled'].includes(status.Status)) {
      return {
        success: status.Status === 'Completed' && status.ExitCode === 0,
        execution: status
      };
    }

    // Check timeout
    if (Date.now() - startTime > timeoutMs) {
      return {
        success: false,
        execution: status,
        error: 'Polling timeout exceeded'
      };
    }

    await sleep(pollIntervalMs);
  }
}
```

### Validate Script Parameters

```javascript
async function validateScriptParams(client, scriptId, providedParams) {
  const script = await client.request(`/Scripts/${scriptId}`);
  const errors = [];
  const warnings = [];

  for (const param of script.Parameters || []) {
    const value = providedParams[param.Name];

    // Check required parameters
    if (param.Required && !value && !param.DefaultValue) {
      errors.push(`Missing required parameter: ${param.Name}`);
      continue;
    }

    // Type validation
    if (value) {
      switch (param.Type) {
        case 'Number':
          if (isNaN(Number(value))) {
            errors.push(`Parameter ${param.Name} must be a number`);
          }
          break;
        case 'Boolean':
          if (!['true', 'false', '1', '0'].includes(value.toLowerCase())) {
            errors.push(`Parameter ${param.Name} must be true/false`);
          }
          break;
        case 'Dropdown':
          if (param.Options && !param.Options.includes(value)) {
            errors.push(`Parameter ${param.Name} must be one of: ${param.Options.join(', ')}`);
          }
          break;
      }
    }
  }

  // Check for unknown parameters
  const knownParams = new Set((script.Parameters || []).map(p => p.Name));
  for (const provided of Object.keys(providedParams)) {
    if (!knownParams.has(provided)) {
      warnings.push(`Unknown parameter: ${provided}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}
```

### Batch Script Execution

```javascript
async function runScriptOnMultipleComputers(client, scriptId, computerIds, params = {}) {
  const batchSize = 50;
  const allResults = [];

  for (let i = 0; i < computerIds.length; i += batchSize) {
    const batch = computerIds.slice(i, i + batchSize);

    const response = await client.request(`/Scripts/${scriptId}/Execute`, {
      method: 'POST',
      body: JSON.stringify({
        ComputerIDs: batch,
        Parameters: params
      })
    });

    allResults.push(...response.Executions);

    // Respect rate limits between batches
    if (i + batchSize < computerIds.length) {
      await sleep(1000);
    }
  }

  return allResults;
}
```

### Monitor Multiple Executions

```javascript
async function monitorExecutions(client, executionIds, options = {}) {
  const { onUpdate, timeoutMs = 600000, pollIntervalMs = 10000 } = options;
  const startTime = Date.now();
  const results = new Map();

  // Initialize tracking
  executionIds.forEach(id => results.set(id, { Status: 'Unknown' }));

  while (true) {
    let allComplete = true;

    for (const executionId of executionIds) {
      const current = results.get(executionId);
      if (['Completed', 'Failed', 'Timeout', 'Cancelled'].includes(current.Status)) {
        continue;
      }

      try {
        const execution = await client.request(
          `/Scripts/Executions/${executionId}`
        );
        results.set(executionId, execution);

        if (!['Completed', 'Failed', 'Timeout', 'Cancelled'].includes(execution.Status)) {
          allComplete = false;
        }

        if (onUpdate) {
          onUpdate(executionId, execution);
        }
      } catch (error) {
        results.set(executionId, { Status: 'Error', error: error.message });
      }
    }

    if (allComplete) break;

    if (Date.now() - startTime > timeoutMs) {
      break;
    }

    await sleep(pollIntervalMs);
  }

  return Array.from(results.entries()).map(([id, data]) => ({
    executionId: id,
    ...data
  }));
}
```

### Script Result Summary

```javascript
function summarizeScriptResult(execution) {
  return {
    executionId: execution.ExecutionID,
    script: execution.ScriptName,
    computer: execution.ComputerName,
    status: execution.Status,
    exitCode: execution.ExitCode,
    duration: `${execution.Duration}s`,
    success: execution.Status === 'Completed' && execution.ExitCode === 0,
    output: execution.Output?.substring(0, 1000) || '',
    errors: execution.ErrorOutput?.substring(0, 500) || ''
  };
}
```

## Error Handling

### Common Script API Errors

| Error | Status | Cause | Resolution |
|-------|--------|-------|------------|
| Script not found | 404 | Invalid ScriptID | Verify script exists |
| Computer offline | 400 | Target is offline | Wait for computer or schedule |
| Missing parameter | 400 | Required param not provided | Include all required params |
| Permission denied | 403 | No access to script | Check user permissions |
| Execution failed | 400 | Script error | Check script logs |

### Error Response Example

```json
{
  "error": {
    "code": "BadRequest",
    "message": "Cannot execute script on offline computer"
  }
}
```

See [references/examples.md](references/examples.md) for a "Safe Script Execution" wrapper (online check + parameter validation + execute) and a PowerShell script template.

## Best Practices

1. **Verify computer online** - Check status before immediate execution
2. **Validate parameters** - Check required and type before running
3. **Document parameters** - Add descriptions to all parameters
4. **Handle timeouts** - Set appropriate execution timeouts
5. **Log important output** - Capture key results in script output
6. **Use folders** - Organize scripts in logical folder structure
7. **Version scripts** - Track changes in script content
8. **Handle exit codes** - Return meaningful exit codes

## Script Exit Code Interpretation

| Exit Code | Typical Meaning |
|-----------|-----------------|
| 0 | Success |
| 1 | General error |
| 2 | Misuse of command |
| 3 | File not found |
| 5 | Access denied |
| 87 | Invalid parameter |
| 1603 | Installation failed |
| -1 | Script exception |

## Related Skills

- [ConnectWise Automate Computers](../computers/SKILL.md) - Target computers for scripts
- [ConnectWise Automate Alerts](../alerts/SKILL.md) - Alert-triggered scripts
- [ConnectWise Automate Monitors](../monitors/SKILL.md) - Monitor-triggered scripts
- [ConnectWise Automate API Patterns](../api-patterns/SKILL.md) - Authentication and pagination
