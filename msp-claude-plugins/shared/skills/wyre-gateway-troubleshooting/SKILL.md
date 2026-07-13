---
name: WYRE MCP Gateway Troubleshooting
description: >
  Diagnose and resolve common issues with the WYRE MCP Gateway — missing
  vendor tools, OAuth failures, "Failed to update tool access" errors,
  expired credentials, and the request flow through mcp-remote → gateway →
  vendor container → external API.
when_to_use: >-
  When a user reports that vendor tools are missing in Claude, Tool Allowlists changes won't save,
  OAuth is failing on the WYRE gateway, or a tool call returns an unexpected error. Use when: wyre
  gateway not working, mcp gateway troubleshooting, tools missing in claude, failed to update tool
  access, vendor tools not appearing, mcp.wyre.ai issues, claude not seeing tools, oauth
  invalid_token gateway, or gateway 403.
---

# WYRE MCP Gateway Troubleshooting

This skill walks through the most common failure modes in the WYRE MCP Gateway and how to resolve them. Use it whenever a user is in the gateway dashboard or in Claude Desktop / Claude Code and something isn't behaving as expected.

The gateway request path has five layers — identify which layer is failing first:

```
Claude Desktop / Code  →  mcp-remote  →  WYRE Gateway  →  Vendor Container  →  Vendor API
        (1)                  (2)             (3)              (4)                (5)
```

Most user-reported issues are at layer 1 (Claude's tool registration cache) or layer 3 (gateway permissions / credentials). Layers 4 and 5 generally surface as a tool call returning an error after a tool has already been registered.

---

## Symptom: Newly added vendor's tools don't appear in Claude

**Most common cause: Claude has not refreshed its tool list.**

Claude registers the gateway's tool catalog at the moment its MCP client connects, and does **not** refresh while a session is live. Adding a vendor in the Wyre dashboard will not push new tools into a running Claude session.

**Fix:**

1. Verify the vendor connection is saved at [mcp.wyre.ai](https://mcp.wyre.ai) — open **Plugins** and confirm the vendor shows as connected with a recent test result.
2. **Fully quit Claude Desktop (Cmd+Q on macOS) and reopen it.** Closing the window is not enough — the MCP client process keeps running.
3. In Claude Code, run `/mcp`, find the gateway entry, and reconnect it. (Restarting the whole CLI also works.)
4. Start a new conversation. The first tool list request will trigger the gateway to re-aggregate vendor tools and register them with Claude.

**If tools still don't appear after a full restart:**

- The vendor's credentials may have failed validation. Open **Plugins**, click the vendor, and run the connection test. Re-enter credentials if the test fails.
- For OAuth-based vendors (Xero, QuickBooks, HubSpot, M365), the OAuth token may have expired. Click **Reconnect** to re-authorize.
- The unified endpoint silently skips vendors with invalid credentials, so a single bad vendor will not block the others — but you also will not see an error toast for the failure.

---

## Symptom: "Failed to update tool access" when saving the Tool Allowlists page

**Cause:** Saving or clearing a tool allowlist requires the **org owner** role. Admins can view the Tool Allowlists page and will see every vendor's tools displayed as "checked" (the allow-all default), but any Save or Reset action returns `403 Requires owner role or higher`. The UI surfaces this as the generic "Failed to update tool access" alert.

**Fix:**

1. Open **Organization → Members** and identify the org owner. The owner is typically the user who originally created the organization.
2. If you are not the owner, ask the owner to make the allowlist change for you, or have them transfer ownership.
3. If you *are* signed in as the owner and the error persists, escalate to `hello@wyre.ai` with your org name and the vendor you were editing.

**Important context to share with users:**

- A fresh org will show every vendor tool as checked. That is **expected** and means "allow all" — there is no saved allowlist row, so the gateway permits every tool for that role. Don't read it as "an allowlist already exists."
- Members and admins are subject to allowlists if configured; owners are never restricted by allowlists.

---

## Symptom: OAuth fails — "Invalid OAuth error response: Unexpected token '<'"

**Cause:** The OAuth discovery or token endpoint returned HTML (typically a Cloudflare error page) instead of JSON. The gateway is briefly unreachable.

**Fix:**

1. Check the gateway health: `curl https://mcp.wyre.ai/health` should return `{"status":"ok"}`.
2. Check vendor health: `https://mcp.wyre.ai/health/vendors`.
3. Wait 60–120 seconds and retry — most deployments complete within a minute.
4. If `/health` is failing for more than 2 minutes, contact `hello@wyre.ai`.

---

## Symptom: A tool call returns a credential or authentication error

This means the tool was registered (so layers 1–3 are fine) but layer 4 or 5 rejected the call.

**Walk through:**

1. Confirm credentials in the dashboard. Open **Plugins**, click the vendor, run **Test Connection**. If the test fails, re-enter credentials.
2. Vendor OAuth tokens have limited lifespans. If the dashboard shows a "Reconnect" prompt for the vendor, the OAuth token expired — click **Reconnect** to re-authorize.
3. Some vendors (e.g., Autotask, Datto) silently drop requests from non-allowlisted IPs. If the test connection works from the dashboard but tool calls time out, ask WYRE support to confirm the gateway's egress IP is on the vendor's allowlist.

---

## Symptom: Connection refused on the OAuth callback (`localhost:NNNNN`)

**Cause:** `mcp-remote` opens a local listener for the OAuth callback. With multiple per-vendor entries in `claude_desktop_config.json`, the listeners can race and time out.

**Fix:**

1. Use the unified endpoint — replace per-vendor `mcp-remote` entries with a single entry pointing to `https://mcp.wyre.ai/v1/mcp`. One OAuth flow instead of many.
2. Kill stale `mcp-remote` processes: `pkill -f mcp-remote`.
3. Restart Claude Desktop.

---

## Diagnostic Quick Reference

| Symptom | First thing to check |
|---|---|
| No tools at all in Claude | Cmd+Q Claude, reopen, start new conversation |
| One vendor's tools missing | Plugins page → run Test Connection for that vendor |
| "Failed to update tool access" | Org role — only owners can save tool allowlists |
| "Invalid OAuth error response" / HTML | `curl https://mcp.wyre.ai/health` |
| Tool call returns expired/invalid auth | Plugins → Reconnect for the vendor |
| Tool call times out (no error body) | Vendor IP allowlist — contact WYRE support |

---

## What to escalate to WYRE support

Before escalating, capture:

1. **Org name** and approximate **time** of the failure (UTC if possible).
2. **Vendor slug** (e.g., `itglue`, `autotask`, `cipp`).
3. **Exact error message** as it appeared (screenshot is best).
4. **What you have already tried** — restarting Claude, reconnecting the vendor, etc.

Send to `hello@wyre.ai`. The gateway logs every request with a `reqId`, so a precise timestamp lets us correlate.
