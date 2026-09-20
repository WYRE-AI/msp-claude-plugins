import { describe, expect, it } from "vitest";
import { evaluateToolCall } from "../src/client.js";
import type { GuardState } from "../src/types.js";

const hasKey = Boolean(process.env.TYPESAFE_API_KEY);

describe.skipIf(!hasKey)("evaluateToolCall live (TYPESAFE_API_KEY)", () => {
  it("returns a composed decision for a harmless read", async () => {
    const state: GuardState = {
      tool_call: {
        name: "tickets.list",
        server: "autotask-mcp",
        arguments: { status: "open" },
      },
      role: { name: "Technician", allowlist: ["tickets.list"] },
      policy: { deny: ["passwords.get"] },
      context: {
        user_intent: "List open tickets for this customer",
        tenant: "demo",
      },
    };

    const result = await evaluateToolCall(state);
    expect(result.model).toBeTruthy();
    expect(result.answers.action_class.choice).toMatch(/read|write|destructive|unknown/);
    expect(["allow", "allow_with_confirm", "block", "escalate_human"]).toContain(
      result.decision.outcome,
    );
  });
});
