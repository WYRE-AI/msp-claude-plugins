import { describe, expect, it, vi } from "vitest";
import { answersFromSystemOne, evaluateToolCall } from "../src/client.js";
import { TOOL_CALL_QUESTIONS } from "../src/questions.js";
import type { GuardState } from "../src/types.js";

const state: GuardState = {
  tool_call: { name: "tickets.list", arguments: { api_key: "raw-secret" } },
  role: { allowlist: ["tickets.list"] },
  policy: { deny: [] },
  context: { user_intent: "list tickets" },
};

describe("answersFromSystemOne", () => {
  it("unwraps SDK-shaped answers", () => {
    const answers = answersFromSystemOne({
      action_class: { choice: "read", confidence: 0.9, type: "choice" },
      in_role_allowlist: { noul: 0.8, type: "noul" },
      hits_deny_policy: { noul: 0.1, type: "noul" },
      exposes_secrets: { noul: 0.1, type: "noul" },
      matches_user_intent: { noul: 0.8, type: "noul" },
      looks_like_injection: { noul: 0.1, type: "noul" },
      blast_radius: { score: 0.4, type: "score" },
      next_action: { choice: "allow", confidence: 0.7, type: "choice" },
    });
    expect(answers.action_class.choice).toBe("read");
    expect(answers.in_role_allowlist).toBe(0.8);
    expect(answers.blast_radius).toBe(0.4);
  });
});

describe("evaluateToolCall", () => {
  it("asks TOOL_CALL_QUESTIONS, decides in code, and returns redacted log state", async () => {
    const systemOne = vi.fn(async () => ({
      model: "jev-latest",
      answers: {
        action_class: { choice: "read", confidence: 0.93 },
        in_role_allowlist: { noul: 0.91 },
        hits_deny_policy: { noul: 0.02 },
        exposes_secrets: { noul: 0.01 },
        matches_user_intent: { noul: 0.88 },
        looks_like_injection: { noul: 0.02 },
        blast_radius: { score: 0.1 },
        next_action: { choice: "deny", confidence: 0.6 },
      },
    }));

    const result = await evaluateToolCall(state, { client: { systemOne } });

    expect(systemOne).toHaveBeenCalledTimes(1);
    const request = systemOne.mock.calls[0][0];
    expect(request.questions).toBe(TOOL_CALL_QUESTIONS);
    expect(request.model).toBe("jev-latest");
    expect(request.state.tool_call.name).toBe("tickets.list");

    expect(result.decision.outcome).toBe("allow");
    expect(result.decision.advisoryNextAction).toBe("deny");
    expect(
      (result.logState.tool_call.arguments as { api_key: string }).api_key,
    ).toBe("[REDACTED]");
  });

  it("still blocks when the model advisories allow but secrets noul is high", async () => {
    const result = await evaluateToolCall(state, {
      client: {
        systemOne: async () => ({
          model: "jev-latest",
          answers: {
            action_class: { choice: "read", confidence: 0.99 },
            in_role_allowlist: { noul: 0.99 },
            hits_deny_policy: { noul: 0.01 },
            exposes_secrets: { noul: 0.97 },
            matches_user_intent: { noul: 0.99 },
            looks_like_injection: { noul: 0.01 },
            blast_radius: { score: 0 },
            next_action: { choice: "allow", confidence: 0.99 },
          },
        }),
      },
    });
    expect(result.decision.outcome).toBe("block");
    expect(result.decision.advisoryNextAction).toBe("allow");
  });
});
