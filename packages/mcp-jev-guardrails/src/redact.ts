import type { GuardState } from "./types.js";

const REDACTED = "[REDACTED]";

const SENSITIVE_KEY =
  /(pass(word|wd)|secret|token|api[_-]?key|authorization|credential|private[_-]?key|cookie|session|bearer|access[_-]?key|refresh[_-]?key|client[_-]?secret|connectionstring)/i;

const SENSITIVE_VALUE =
  /^(sk-|rk-|ghp_|github_pat_|xox[baprs]-|Bearer\s+)/i;

function isSensitiveKey(key: string): boolean {
  return SENSITIVE_KEY.test(key);
}

function isSensitiveString(value: string): boolean {
  if (SENSITIVE_VALUE.test(value)) {
    return true;
  }
  // Compact JWT-shaped tokens in logs.
  const parts = value.split(".");
  return parts.length === 3 && parts.every((part) => part.length >= 8);
}

function redactUnknown(value: unknown, keyHint?: string): unknown {
  if (keyHint && isSensitiveKey(keyHint)) {
    return REDACTED;
  }
  if (typeof value === "string") {
    return isSensitiveString(value) ? REDACTED : value;
  }
  if (Array.isArray(value)) {
    return value.map((item) => redactUnknown(item, keyHint));
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      out[key] = redactUnknown(nested, key);
    }
    return out;
  }
  return value;
}

/**
 * Deep-redact a value for logs (arguments, context extras, full decision payloads).
 * Does not mutate the input.
 */
export function redactForLog(value: unknown): unknown {
  return redactUnknown(value);
}

/**
 * Copy of GuardState safe to log. Tool arguments and context extras are redacted;
 * role allowlists and policy names are kept so audits can see which gate applied.
 */
export function redactGuardState(state: GuardState): GuardState {
  return {
    tool_call: {
      name: state.tool_call.name,
      server: state.tool_call.server,
      arguments: redactUnknown(state.tool_call.arguments) as GuardState["tool_call"]["arguments"],
    },
    role: { ...state.role },
    policy: { ...state.policy },
    context: redactUnknown(state.context) as GuardState["context"],
  };
}
