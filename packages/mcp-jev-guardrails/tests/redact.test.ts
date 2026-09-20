import { describe, expect, it } from "vitest";
import { redactForLog, redactGuardState } from "../src/redact.js";
import type { GuardState } from "../src/types.js";

const state = (): GuardState => ({
  tool_call: {
    name: "passwords.get",
    server: "itglue-mcp",
    arguments: {
      id: 12,
      api_key: "super-secret",
      nested: { password: "hunter2", note: "ok" },
    },
  },
  role: { name: "Technician", allowlist: ["passwords.get"] },
  policy: { deny: ["billing.refund"] },
  context: {
    user_intent: "get the wifi password",
    tenant: "acme",
    authorization: "Bearer abc.def.ghi.jkl",
    token: "sk-live-not-a-real-key",
  },
});

describe("redactGuardState", () => {
  it("redacts secret keys in arguments and context without mutating input", () => {
    const input = state();
    const redacted = redactGuardState(input);

    expect(redacted.tool_call.arguments).toEqual({
      id: 12,
      api_key: "[REDACTED]",
      nested: { password: "[REDACTED]", note: "ok" },
    });
    expect(redacted.context.authorization).toBe("[REDACTED]");
    expect(redacted.context.token).toBe("[REDACTED]");
    expect(redacted.context.user_intent).toBe("get the wifi password");
    expect(redacted.role.allowlist).toEqual(["passwords.get"]);
    expect(redacted.policy.deny).toEqual(["billing.refund"]);

    expect((input.tool_call.arguments as { api_key: string }).api_key).toBe("super-secret");
  });

  it("redacts JWT-shaped and sk- prefixed values even under harmless keys", () => {
    const jwt =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4ifQ.signaturelong";
    expect(redactForLog({ note: jwt, prefix: "sk-abc" })).toEqual({
      note: "[REDACTED]",
      prefix: "[REDACTED]",
    });
  });
});
