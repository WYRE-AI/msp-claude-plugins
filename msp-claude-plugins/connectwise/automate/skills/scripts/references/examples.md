# Additional Script Examples

## Safe Script Execution

```javascript
async function safeRunScript(client, computerId, scriptId, params = {}) {
  // Verify computer is online
  const computer = await client.request(`/Computers/${computerId}`);

  if (computer.Status !== 'Online') {
    return {
      success: false,
      error: `Computer is ${computer.Status}`,
      lastContact: computer.LastContact
    };
  }

  // Validate parameters
  const validation = await validateScriptParams(client, scriptId, params);

  if (!validation.valid) {
    return {
      success: false,
      error: 'Invalid parameters',
      details: validation.errors
    };
  }

  // Execute the script
  try {
    const execution = await client.request(
      `/Computers/${computerId}/Scripts/${scriptId}/Execute`,
      {
        method: 'POST',
        body: JSON.stringify({ Parameters: params })
      }
    );
    return {
      success: true,
      executionId: execution.ExecutionID,
      warnings: validation.warnings
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}
```

## PowerShell Script Template

```powershell
# Script: Clear-TempFiles
# Parameters: days, path
param(
    [int]$days = 7,
    [string]$path = "$env:TEMP"
)

try {
    $cutoff = (Get-Date).AddDays(-$days)
    $files = Get-ChildItem -Path $path -Recurse -File |
             Where-Object { $_.LastWriteTime -lt $cutoff }

    $count = 0
    $size = 0

    foreach ($file in $files) {
        $size += $file.Length
        Remove-Item $file.FullName -Force -ErrorAction SilentlyContinue
        $count++
    }

    $sizeGB = [math]::Round($size / 1GB, 2)
    Write-Output "Deleted $count files totaling $sizeGB GB"
    exit 0
}
catch {
    Write-Error $_.Exception.Message
    exit 1
}
```
