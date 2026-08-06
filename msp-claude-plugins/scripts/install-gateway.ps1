# MSP MCP Gateway — Installer for Claude Code & Claude Desktop (Windows)
# Usage: irm https://raw.githubusercontent.com/wyre-technology/msp-claude-plugins/main/msp-claude-plugins/scripts/install-gateway.ps1 | iex
#
# This script:
#   1. Detects whether Claude Code CLI and/or Claude Desktop are available
#   2. Adds the msp-mcp-gateway MCP server to each detected client
#   3. Preserves all existing configuration — only appends the gateway entry
#
# Environment variables:
#   GATEWAY_URL  — Override the default gateway endpoint
#   SCOPE        — Claude Code scope: "project" (default) or "user"

$ErrorActionPreference = "Stop"

$GatewayUrl = if ($env:GATEWAY_URL) { $env:GATEWAY_URL } else { "https://conduit.wyre.ai/v1/mcp" }
$Scope      = if ($env:SCOPE) { $env:SCOPE } else { "project" }
$McpName    = "msp-mcp-gateway"

$InstalledAny = $false

function Write-Success($msg) { Write-Host "  $([char]0x2713) $msg" -ForegroundColor Green }
function Write-Warning2($msg) { Write-Host "  ! $msg" -ForegroundColor Yellow }
function Write-Error2($msg) { Write-Host "  X $msg" -ForegroundColor Red }

# ---------------------------------------------------------------------------
# Claude Code (CLI)
# ---------------------------------------------------------------------------
function Install-ClaudeCode {
    $claude = Get-Command "claude" -ErrorAction SilentlyContinue
    if (-not $claude) {
        Write-Warning2 "Claude Code CLI not found - skipping CLI install"
        return
    }

    # Check if already configured
    $list = & claude mcp list 2>$null
    if ($list -and ($list | Out-String) -match $McpName) {
        Write-Warning2 "Gateway already configured in Claude Code - skipping"
        $script:InstalledAny = $true
        return
    }

    Write-Success "Adding $McpName to Claude Code (scope: $Scope)..."
    & claude mcp add --transport http --scope $Scope $McpName $GatewayUrl
    Write-Success "Claude Code gateway configured"
    $script:InstalledAny = $true
}

# ---------------------------------------------------------------------------
# Claude Desktop
# ---------------------------------------------------------------------------
function Install-ClaudeDesktop {
    $configDir = Join-Path $env:APPDATA "Claude"
    $configFile = Join-Path $configDir "claude_desktop_config.json"

    # Check if Claude Desktop is installed
    if (-not (Test-Path $configDir)) {
        # Check common install locations
        $desktopApp = Join-Path $env:LOCALAPPDATA "Programs\claude-desktop\Claude.exe"
        if (Test-Path $desktopApp) {
            New-Item -ItemType Directory -Path $configDir -Force | Out-Null
        } else {
            Write-Warning2 "Claude Desktop config directory not found - skipping Desktop install"
            return
        }
    }

    # Create config if it doesn't exist
    if (-not (Test-Path $configFile)) {
        "{}" | Set-Content -Path $configFile -Encoding UTF8
        Write-Success "Created new Claude Desktop config at $configFile"
    }

    # Check if gateway already present
    $content = Get-Content -Path $configFile -Raw
    if ($content -match $McpName) {
        Write-Warning2 "Gateway already configured in Claude Desktop - skipping"
        $script:InstalledAny = $true
        return
    }

    # Validate JSON
    try {
        $config = $content | ConvertFrom-Json
    } catch {
        Write-Error2 "Claude Desktop config is not valid JSON - refusing to modify"
        Write-Error2 "Please fix $configFile and re-run the installer"
        return
    }

    # Back up existing config
    $backupPath = "$configFile.bak"
    Copy-Item -Path $configFile -Destination $backupPath -Force
    Write-Success "Backed up existing config to $backupPath"

    # Ensure mcpServers key exists
    if (-not (Get-Member -InputObject $config -Name "mcpServers" -MemberType NoteProperty)) {
        $config | Add-Member -NotePropertyName "mcpServers" -NotePropertyValue ([PSCustomObject]@{})
    }

    # Add gateway entry
    $gatewayEntry = [PSCustomObject]@{ url = $GatewayUrl }
    $config.mcpServers | Add-Member -NotePropertyName $McpName -NotePropertyValue $gatewayEntry -Force

    # Write back preserving formatting
    $config | ConvertTo-Json -Depth 10 | Set-Content -Path $configFile -Encoding UTF8
    Write-Success "Claude Desktop gateway configured at $configFile"
    $script:InstalledAny = $true
}

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
Write-Host ""
Write-Host "  MSP MCP Gateway Installer" -ForegroundColor White
Write-Host "  Gateway: $GatewayUrl" -ForegroundColor DarkGray
Write-Host ""

Install-ClaudeCode
Install-ClaudeDesktop

Write-Host ""
if ($InstalledAny) {
    Write-Success "Done! Next steps:"
    Write-Host "    1. Restart Claude Code / Claude Desktop"
    Write-Host "    2. Complete OAuth when prompted"
    Write-Host "    3. Connect vendors at https://conduit.wyre.ai"
} else {
    Write-Error2 "Neither Claude Code nor Claude Desktop was detected."
    Write-Host "    Install Claude Code:    https://docs.anthropic.com/en/docs/claude-code"
    Write-Host "    Install Claude Desktop: https://claude.ai/download"
}
Write-Host ""
