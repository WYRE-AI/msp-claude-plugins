import { describe, expect, it } from "vitest";
import { decide, DECISION_THRESHOLDS } from "../src/decide.js";
import type { ToolCallAnswers } from "../src/types.js";

/** Clean read that should ALLOW once hard gates pass. */
function clean(overrides: Partial<ToolCallAnswers> = {}): ToolCallAnswers {
  return {
    action_class: { choice: "read", confidence: 0.92 },
    in_role_allowlist: 0.9,
    hits_deny_policy: 0.05,
    exposes_secrets: 0.04,
    matches_user_intent: 0.85,
    looks_like_injection: 0.03,
    blast_radius: 0.2,
    next_action: { choice: "allow", confidence: 0.8 },
    ...overrides,
  };
}

describe("decide()", () => {
  it("allows a high-confidence in-policy read", () => {
    const decision = decide(clean());
    expect(decision.outcome).toBe("allow");
    expect(decision.matchedRule).toBe("allow");
    expect(decision.advisoryNextAction).toBe("allow");
  });

  it("blocks when hits_deny_policy exceeds 0.8", () => {
    const decision = decide(clean({ hits_deny_policy: 0.81 }));
    expect(decision.outcome).toBe("block");
    expect(decision.matchedRule).toBe("block_deny_or_secrets");
  });

  it("does not block at the exclusive deny threshold of 0.8", () => {
    const decision = decide(clean({ hits_deny_policy: 0.8 }));
    expect(decision.outcome).toBe("allow");
  });

  it("blocks when exposes_secrets exceeds 0.8", () => {
    const decision = decide(clean({ exposes_secrets: { noul: 0.95 } }));
    expect(decision.outcome).toBe("block");
    expect(decision.matchedRule).toBe("block_deny_or_secrets");
  });

  it("escalates when looks_like_injection exceeds 0.7", () => {
    const decision = decide(clean({ looks_like_injection: 0.71 }));
    expect(decision.outcome).toBe("escalate_human");
    expect(decision.matchedRule).toBe("escalate_injection");
  });

  it("blocks when in_role_allowlist is below 0.3 (fail closed)", () => {
    const decision = decide(clean({ in_role_allowlist: 0.29 }));
    expect(decision.outcome).toBe("block");
    expect(decision.matchedRule).toBe("block_role_allowlist");
  });

  it("does not block at the exclusive allowlist threshold of 0.3", () => {
    const decision = decide(clean({ in_role_allowlist: 0.3 }));
    expect(decision.outcome).toBe("allow");
  });

  it("escalates when matches_user_intent is below 0.4", () => {
    const decision = decide(clean({ matches_user_intent: 0.39 }));
    expect(decision.outcome).toBe("escalate_human");
    expect(decision.matchedRule).toBe("escalate_user_intent");
  });

  it("confirms write when blast_radius is >= 2", () => {
    const decision = decide(
      clean({
        action_class: { choice: "write", confidence: 0.9 },
        blast_radius: { score: 2 },
      }),
    );
    expect(decision.outcome).toBe("allow_with_confirm");
    expect(decision.matchedRule).toBe("confirm_write_blast");
  });

  it("confirms destructive when blast_radius is >= 2", () => {
    const decision = decide(
      clean({
        action_class: { choice: "destructive", confidence: 0.88 },
        blast_radius: 3,
      }),
    );
    expect(decision.outcome).toBe("allow_with_confirm");
  });

  it("allows write when blast_radius is below 2 (default is not every write)", () => {
    const decision = decide(
      clean({
        action_class: { choice: "write", confidence: 0.9 },
        blast_radius: 1.9,
      }),
    );
    expect(decision.outcome).toBe("allow");
  });

  it("strictEveryWrite confirms every write even when blast is low", () => {
    const decision = decide(
      clean({
        action_class: { choice: "write", confidence: 0.9 },
        blast_radius: 0.4,
      }),
      { strictEveryWrite: true },
    );
    expect(decision.outcome).toBe("allow_with_confirm");
    expect(decision.reasons).toContain("strictEveryWrite");
  });

  it("does not confirm a read even when blast_radius is high", () => {
    const decision = decide(clean({ blast_radius: 3 }));
    expect(decision.outcome).toBe("allow");
  });

  it("escalates when action_class.confidence is below 0.6", () => {
    const decision = decide(
      clean({ action_class: { choice: "read", confidence: 0.59 } }),
    );
    expect(decision.outcome).toBe("escalate_human");
    expect(decision.matchedRule).toBe("escalate_action_class_confidence");
  });

  it("Sample D: advisory next_action=allow never overrides a deny/secrets hard block", () => {
    const decision = decide(
      clean({
        hits_deny_policy: 0.99,
        next_action: { choice: "allow", confidence: 0.99 },
      }),
    );
    expect(decision.outcome).toBe("block");
    expect(decision.matchedRule).toBe("block_deny_or_secrets");
    expect(decision.advisoryNextAction).toBe("allow");
  });

  it("Sample D: advisory next_action=allow never overrides an injection escalate", () => {
    const decision = decide(
      clean({
        looks_like_injection: 0.91,
        next_action: "allow",
      }),
    );
    expect(decision.outcome).toBe("escalate_human");
    expect(decision.advisoryNextAction).toBe("allow");
  });

  it("advisory next_action=deny does not block a clean call", () => {
    const decision = decide(clean({ next_action: "deny" }));
    expect(decision.outcome).toBe("allow");
    expect(decision.advisoryNextAction).toBe("deny");
  });

  it("deny/secrets gate wins over later confirm and escalate rules", () => {
    const decision = decide(
      clean({
        hits_deny_policy: 0.9,
        action_class: { choice: "destructive", confidence: 0.2 },
        blast_radius: 3,
        matches_user_intent: 0.01,
        looks_like_injection: 0.99,
        next_action: "allow",
      }),
    );
    expect(decision.outcome).toBe("block");
    expect(decision.matchedRule).toBe("block_deny_or_secrets");
  });

  it("accepts unwrapped noul/score numbers", () => {
    const decision = decide({
      action_class: { choice: "read", confidence: 0.8 },
      in_role_allowlist: 0.8,
      hits_deny_policy: 0.1,
      exposes_secrets: 0.1,
      matches_user_intent: 0.8,
      looks_like_injection: 0.1,
      blast_radius: 0,
      next_action: "confirm",
    });
    expect(decision.outcome).toBe("allow");
    expect(decision.advisoryNextAction).toBe("confirm");
  });

  it("exports the Conduit Fixer thresholds for other packages to import", () => {
    expect(DECISION_THRESHOLDS).toEqual({
      hitsDenyPolicyBlock: 0.8,
      exposesSecretsBlock: 0.8,
      looksLikeInjectionEscalate: 0.7,
      inRoleAllowlistBlock: 0.3,
      matchesUserIntentEscalate: 0.4,
      blastConfirmMin: 2,
      actionClassConfidenceMin: 0.6,
    });
  });
});
