#!/usr/bin/env node
// Probe local *-mcp servers over stdio for their real tools/list surface.
import { spawn } from "node:child_process";
import { existsSync, readdirSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.argv[2] || "/Users/asachs/mcp";
const OUT = process.argv[3];

const dirs = readdirSync(ROOT, { withFileTypes: true })
  .filter((d) => d.isDirectory() && d.name.endsWith("-mcp"))
  .map((d) => d.name)
  .sort();

// Generic fake credentials — enough to get past constructor-time validation in
// most servers. Tool listing itself never hits the vendor API.
const FAKE = "probe-dummy-value";
function fakeEnv(vendor) {
  const base = {
    ...process.env,
    MCP_TRANSPORT: "stdio",
    TRANSPORT: "stdio",
    NODE_ENV: "test",
  };
  // Blanket-fill anything that looks like a credential var name the server may read.
  const suffixes = [
    "API_KEY", "APIKEY", "API_TOKEN", "TOKEN", "SECRET", "CLIENT_ID",
    "CLIENT_SECRET", "USERNAME", "USER", "PASSWORD", "ACCOUNT_ID", "ORG_ID",
    "ORGANIZATION_ID", "TENANT_ID", "SUBDOMAIN", "DOMAIN", "BASE_URL", "URL",
    "REGION", "INTEGRATION_CODE", "PARTNER_ID", "COMPANY_ID", "SITE_ID",
    "INSTANCE", "HOST", "EMAIL", "KEY", "ID",
  ];
  const prefix = vendor.replace(/-mcp$/, "").replace(/-/g, "_").toUpperCase();
  for (const s of suffixes) base[`${prefix}_${s}`] = FAKE;
  base[prefix] = FAKE;
  return base;
}

function probe(vendorDir) {
  return new Promise((resolve) => {
    const cwd = join(ROOT, vendorDir);
    const entry = join(cwd, "dist", "index.js");
    if (!existsSync(entry)) {
      return resolve({ vendor: vendorDir, ok: false, reason: "no dist/index.js" });
    }
    const child = spawn("node", [entry], {
      cwd,
      env: fakeEnv(vendorDir),
      stdio: ["pipe", "pipe", "pipe"],
    });
    let buf = "";
    let stderr = "";
    let done = false;
    const finish = (res) => {
      if (done) return;
      done = true;
      try { child.kill("SIGKILL"); } catch { /* noop */ }
      resolve(res);
    };
    const timer = setTimeout(
      () => finish({ vendor: vendorDir, ok: false, reason: "timeout", stderr: stderr.slice(-500) }),
      20000,
    );

    const send = (obj) => {
      try { child.stdin.write(JSON.stringify(obj) + "\n"); } catch { /* noop */ }
    };

    child.stdout.on("data", (d) => {
      buf += d.toString();
      let idx;
      while ((idx = buf.indexOf("\n")) >= 0) {
        const line = buf.slice(0, idx).trim();
        buf = buf.slice(idx + 1);
        if (!line.startsWith("{")) continue;
        let msg;
        try { msg = JSON.parse(line); } catch { continue; }
        if (msg.id === 1) {
          send({ jsonrpc: "2.0", method: "notifications/initialized" });
          send({ jsonrpc: "2.0", id: 2, method: "tools/list", params: {} });
        } else if (msg.id === 2) {
          clearTimeout(timer);
          if (msg.result?.tools) {
            finish({
              vendor: vendorDir,
              ok: true,
              tools: msg.result.tools.map((t) => t.name).sort(),
              descriptions: Object.fromEntries(
                msg.result.tools.map((t) => [t.name, (t.description || "").slice(0, 300)]),
              ),
            });
          } else {
            finish({ vendor: vendorDir, ok: false, reason: "no tools in result", raw: JSON.stringify(msg).slice(0, 400) });
          }
        }
      }
    });
    child.stderr.on("data", (d) => { stderr += d.toString(); });
    child.on("error", (e) => finish({ vendor: vendorDir, ok: false, reason: "spawn error: " + e.message }));
    child.on("exit", (code) => {
      if (!done) {
        clearTimeout(timer);
        finish({ vendor: vendorDir, ok: false, reason: `exited ${code}`, stderr: stderr.slice(-600) });
      }
    });

    send({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2025-06-18",
        capabilities: {},
        clientInfo: { name: "drift-audit-probe", version: "1.0.0" },
      },
    });
  });
}

const results = [];
const CONCURRENCY = 6;
let cursor = 0;
async function worker() {
  while (cursor < dirs.length) {
    const v = dirs[cursor++];
    const r = await probe(v);
    results.push(r);
    process.stderr.write(`${r.ok ? "OK  " : "FAIL"} ${v}${r.ok ? ` (${r.tools.length})` : ` — ${r.reason}`}\n`);
  }
}
await Promise.all(Array.from({ length: CONCURRENCY }, worker));
results.sort((a, b) => a.vendor.localeCompare(b.vendor));
const json = JSON.stringify(results, null, 2);
if (OUT) { mkdirSync(join(OUT, ".."), { recursive: true }); writeFileSync(OUT, json); }
else console.log(json);
