#!/usr/bin/env bash
# MSP MCP Gateway — Installer for Claude Code & Claude Desktop
# Usage: curl -fsSL https://raw.githubusercontent.com/wyre-technology/msp-claude-plugins/main/msp-claude-plugins/scripts/install-gateway.sh | bash
#
# This script:
#   1. Detects whether Claude Code CLI and/or Claude Desktop are available
#   2. Adds the msp-mcp-gateway MCP server to each detected client
#   3. Preserves all existing configuration — only appends the gateway entry
#
# Environment variables:
#   GATEWAY_URL  — Override the default gateway endpoint
#   SCOPE        — Claude Code scope: "project" (default) or "user"

set -euo pipefail

GATEWAY_URL="${GATEWAY_URL:-https://conduit.wyre.ai/v1/mcp}"
SCOPE="${SCOPE:-project}"
MCP_NAME="msp-mcp-gateway"

# Colors (when stdout is a terminal)
if [ -t 1 ]; then
  BOLD='\033[1m' DIM='\033[2m' GREEN='\033[32m' YELLOW='\033[33m' RED='\033[31m' RESET='\033[0m'
else
  BOLD='' DIM='' GREEN='' YELLOW='' RED='' RESET=''
fi

info()  { printf "${GREEN}✓${RESET} %s\n" "$*"; }
warn()  { printf "${YELLOW}!${RESET} %s\n" "$*"; }
error() { printf "${RED}✗${RESET} %s\n" "$*" >&2; }

installed_any=false

# ---------------------------------------------------------------------------
# Claude Code (CLI)
# ---------------------------------------------------------------------------
install_claude_code() {
  if ! command -v claude &>/dev/null; then
    warn "Claude Code CLI not found — skipping CLI install"
    return
  fi

  # Check if gateway already configured
  if claude mcp list 2>/dev/null | grep -q "$MCP_NAME"; then
    warn "Gateway already configured in Claude Code — skipping"
    installed_any=true
    return
  fi

  info "Adding ${MCP_NAME} to Claude Code (scope: ${SCOPE})..."
  claude mcp add --transport http --scope "$SCOPE" "$MCP_NAME" "$GATEWAY_URL"
  info "Claude Code gateway configured"
  installed_any=true
}

# ---------------------------------------------------------------------------
# Claude Desktop
# ---------------------------------------------------------------------------
install_claude_desktop() {
  # Determine config path by OS
  case "$(uname -s)" in
    Darwin)
      config_dir="$HOME/Library/Application Support/Claude"
      ;;
    Linux)
      config_dir="${XDG_CONFIG_HOME:-$HOME/.config}/Claude"
      ;;
    *)
      warn "Unsupported OS for Claude Desktop detection — skipping"
      return
      ;;
  esac

  config_file="${config_dir}/claude_desktop_config.json"

  # Check if Claude Desktop is installed (config dir exists or app exists)
  if [ ! -d "$config_dir" ]; then
    if [ "$(uname -s)" = "Darwin" ] && [ -d "/Applications/Claude.app" ]; then
      mkdir -p "$config_dir"
    else
      warn "Claude Desktop config directory not found — skipping Desktop install"
      return
    fi
  fi

  # If config file doesn't exist, create minimal one
  if [ ! -f "$config_file" ]; then
    echo '{}' > "$config_file"
    info "Created new Claude Desktop config at ${config_file}"
  fi

  # Check if gateway already present
  if grep -q "$MCP_NAME" "$config_file" 2>/dev/null; then
    warn "Gateway already configured in Claude Desktop — skipping"
    installed_any=true
    return
  fi

  # Validate existing JSON before modifying
  if ! python3 -c "import json, sys; json.load(open(sys.argv[1]))" "$config_file" 2>/dev/null; then
    error "Claude Desktop config is not valid JSON — refusing to modify"
    error "Please fix ${config_file} and re-run the installer"
    return
  fi

  # Back up existing config
  cp "$config_file" "${config_file}.bak"
  info "Backed up existing config to ${config_file}.bak"

  # Merge gateway entry into existing config, preserving everything else
  python3 -c "
import json, sys

config_path = sys.argv[1]
gateway_url = sys.argv[2]
mcp_name = sys.argv[3]

with open(config_path) as f:
    config = json.load(f)

servers = config.setdefault('mcpServers', {})
servers[mcp_name] = {'url': gateway_url}

with open(config_path, 'w') as f:
    json.dump(config, f, indent=2)
    f.write('\n')
" "$config_file" "$GATEWAY_URL" "$MCP_NAME"

  info "Claude Desktop gateway configured at ${config_file}"
  installed_any=true
}

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
printf "\n${BOLD}MSP MCP Gateway Installer${RESET}\n"
printf "${DIM}Gateway: ${GATEWAY_URL}${RESET}\n\n"

install_claude_code
install_claude_desktop

printf "\n"
if [ "$installed_any" = true ]; then
  info "Done! Next steps:"
  printf "  1. Restart Claude Code / Claude Desktop\n"
  printf "  2. Complete OAuth when prompted\n"
  printf "  3. Connect vendors at https://conduit.wyre.ai\n"
else
  error "Neither Claude Code nor Claude Desktop was detected."
  printf "  Install Claude Code:    https://docs.anthropic.com/en/docs/claude-code\n"
  printf "  Install Claude Desktop: https://claude.ai/download\n"
fi
printf "\n"
