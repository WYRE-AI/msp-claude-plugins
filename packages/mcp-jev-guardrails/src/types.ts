/**
 * Shared MCP tool-call guardrail state.
 * Conduit and *-mcp servers should send this shape to TypeSafe/Jev.
 */
export type GuardState = {
  tool_call: { name: string; arguments?: unknown; server?: string };
  role: { id?: string; name?: string; permissions?: string[]; allowlist?: string[] };
  policy: { deny?: string[]; require_confirm?: string[]; notes?: string };
  context: {
    user_intent?: string;
    conversation_summary?: string;
    tenant?: string;
    [k: string]: unknown;
  };
};

/** Choice labels for `action_class`. Not `admin` — destructive writes are their own class. */
export type ActionClass = "read" | "write" | "destructive" | "unknown";

/**
 * Advisory Choice labels for `next_action`.
 * Never used as a routing override (Sample D): code owns the decision.
 */
export type AdvisoryNextAction = "allow" | "confirm" | "deny" | "escalate";

/** Outcomes produced by `decide()`. First matching hard gate wins. */
export type DecisionOutcome = "allow" | "allow_with_confirm" | "block" | "escalate_human";

export type DecisionRule =
  | "block_deny_or_secrets"
  | "escalate_injection"
  | "block_role_allowlist"
  | "escalate_user_intent"
  | "confirm_write_blast"
  | "escalate_action_class_confidence"
  | "allow";

export type NoulLike = number | { noul: number };
export type ScoreLike = number | { score: number };
export type ChoiceLike<T extends string> = {
  choice: T;
  confidence: number;
  probabilities?: Readonly<Record<string, number>>;
};

/**
 * Answers `decide()` reads. Accepts raw TypeSafe SDK responses or unwrapped numbers.
 * `next_action` is recorded on the result and never consulted for routing.
 */
export type ToolCallAnswers = {
  action_class: ChoiceLike<ActionClass>;
  in_role_allowlist: NoulLike;
  hits_deny_policy: NoulLike;
  exposes_secrets: NoulLike;
  matches_user_intent: NoulLike;
  looks_like_injection: NoulLike;
  blast_radius: ScoreLike;
  next_action: ChoiceLike<AdvisoryNextAction> | AdvisoryNextAction;
};

export type DecideOptions = {
  /**
   * When true, every `write` or `destructive` action_class confirms
   * (after earlier hard gates). Default is false: confirm only when blast_radius >= 2.
   */
  strictEveryWrite?: boolean;
};

export type Decision = {
  outcome: DecisionOutcome;
  matchedRule: DecisionRule;
  reasons: string[];
  /** Passthrough of the model's advisory Choice. Never overrides `outcome`. */
  advisoryNextAction: AdvisoryNextAction;
};

export const ACTION_CLASSES = ["read", "write", "destructive", "unknown"] as const;
export const ADVISORY_NEXT_ACTIONS = ["allow", "confirm", "deny", "escalate"] as const;
export const DECISION_OUTCOMES = [
  "allow",
  "allow_with_confirm",
  "block",
  "escalate_human",
] as const;
