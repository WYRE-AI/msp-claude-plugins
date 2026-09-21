import {
  TypeSafeClient,
  type EntryType,
  type TypeSafeClientConfig,
} from "@typesafe-ai/sdk";
import { decide } from "./decide.js";
import { JEV_MODEL, TOOL_CALL_QUESTIONS } from "./questions.js";
import { redactGuardState } from "./redact.js";
import type {
  ActionClass,
  AdvisoryNextAction,
  DecideOptions,
  Decision,
  GuardState,
  ToolCallAnswers,
} from "./types.js";

export type EvaluateToolCallOptions = DecideOptions & {
  /** Injected client (tests). When omitted, constructs TypeSafeClient from env/config. */
  client?: Pick<TypeSafeClient, "systemOne">;
  apiKey?: string;
  /** Defaults to `jev-latest`. */
  model?: string;
  timeout?: number;
  clientConfig?: TypeSafeClientConfig;
};

export type EvaluateToolCallResult = {
  answers: ToolCallAnswers;
  decision: Decision;
  model: string;
  /** Redacted copy of the state that is safe to log. */
  logState: GuardState;
};

function requireFiniteNumber(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new TypeError(`evaluateToolCall(): ${field} must be a finite number`);
  }
  return value;
}

function requireUnitInterval(value: unknown, field: string): number {
  const n = requireFiniteNumber(value, field);
  if (n < 0 || n > 1) {
    throw new TypeError(`evaluateToolCall(): ${field} must be in [0, 1]`);
  }
  return n;
}

function unwrapNumericField(value: unknown, field: string, key: "noul" | "score"): unknown {
  if (typeof value === "number") {
    return value;
  }
  if (value && typeof value === "object") {
    return (value as Record<string, unknown>)[key];
  }
  throw new TypeError(`evaluateToolCall(): missing ${field} ${key}`);
}

function requireChoice<T extends string>(
  value: unknown,
  field: string,
): { choice: T; confidence: number; probabilities?: Readonly<Record<string, number>> } {
  if (!value || typeof value !== "object") {
    throw new TypeError(`evaluateToolCall(): missing ${field} answer`);
  }
  const rec = value as { choice?: unknown; confidence?: unknown; probabilities?: unknown };
  if (typeof rec.choice !== "string") {
    throw new TypeError(`evaluateToolCall(): ${field}.choice must be a string`);
  }
  return {
    choice: rec.choice as T,
    confidence: requireUnitInterval(rec.confidence, `${field}.confidence`),
    probabilities:
      rec.probabilities && typeof rec.probabilities === "object"
        ? (rec.probabilities as Readonly<Record<string, number>>)
        : undefined,
  };
}

function requireNoul(value: unknown, field: string): number {
  return requireUnitInterval(unwrapNumericField(value, field, "noul"), `${field}.noul`);
}

function requireScore(value: unknown, field: string): number {
  const n = requireFiniteNumber(unwrapNumericField(value, field, "score"), `${field}.score`);
  if (n < 0 || n > 3) {
    throw new TypeError(`evaluateToolCall(): ${field}.score must be in [0, 3]`);
  }
  return n;
}

/** Map a TypeSafe `systemOne` answers object onto `ToolCallAnswers`. */
export function answersFromSystemOne(answers: Record<string, unknown>): ToolCallAnswers {
  return {
    action_class: requireChoice<ActionClass>(answers.action_class, "action_class"),
    in_role_allowlist: requireNoul(answers.in_role_allowlist, "in_role_allowlist"),
    hits_deny_policy: requireNoul(answers.hits_deny_policy, "hits_deny_policy"),
    exposes_secrets: requireNoul(answers.exposes_secrets, "exposes_secrets"),
    matches_user_intent: requireNoul(answers.matches_user_intent, "matches_user_intent"),
    looks_like_injection: requireNoul(answers.looks_like_injection, "looks_like_injection"),
    blast_radius: requireScore(answers.blast_radius, "blast_radius"),
    next_action: requireChoice<AdvisoryNextAction>(answers.next_action, "next_action"),
  };
}

/**
 * Ask Jev the fleet TOOL_CALL_QUESTIONS and compose the hard-gated decision in code.
 * Library only — callers (Conduit, *-mcp) own wiring and enforcement.
 */
export async function evaluateToolCall(
  state: GuardState,
  options: EvaluateToolCallOptions = {},
): Promise<EvaluateToolCallResult> {
  const model = options.model ?? JEV_MODEL;
  const client =
    options.client ??
    new TypeSafeClient({
      ...options.clientConfig,
      apiKey: options.apiKey ?? options.clientConfig?.apiKey,
      defaultModel: model,
      timeout: options.timeout ?? options.clientConfig?.timeout,
    });

  const response = await client.systemOne({
    // GuardState.arguments is `unknown`; the SDK types state as JSON.
    state: state as unknown as EntryType,
    questions: TOOL_CALL_QUESTIONS,
    model,
  });

  const answers = answersFromSystemOne(response.answers as Record<string, unknown>);
  const decision = decide(answers, { strictEveryWrite: options.strictEveryWrite });

  return {
    answers,
    decision,
    model: response.model,
    logState: redactGuardState(state),
  };
}
