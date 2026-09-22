# @wyre-ai/mcp-jev-guardrails

Fleet-wide **TypeSafe / Jev** question map and `decide()` composition for MCP tool-call guardrails.

Conduit gateway imports this package as the single source of truth. `*-mcp` servers may too. This is a **library only** — it does not wire Conduit, start a server, or enforce a tool call by itself.

Pattern: atomic Nouls + code owns routing ([TypeSafe LLM guardrails cookbook](https://docs.typesafe.ai/cookbooks/llm_guardrails.md)). Model: `jev-latest` via `POST https://api.typesafe.ai/v1/systemone`.

## Install

```bash
npm install @wyre-ai/mcp-jev-guardrails @typesafe-ai/sdk
```

Until this is published, path-depend the PR branch from a workspace or `file:` spec (npm does not support GitHub `#path:`):

```json
{
  "dependencies": {
    "@wyre-ai/mcp-jev-guardrails": "file:../msp-claude-plugins/packages/mcp-jev-guardrails"
  }
}
```

In this repo, the same package is a workspace-style folder at `packages/mcp-jev-guardrails`. After publish, switch to the npm name above.

`TYPESAFE_API_KEY` is read by `@typesafe-ai/sdk` from the environment. Store it in Infisical (Internal). Never commit keys.

## Import example

```ts
import {
  DECISION_THRESHOLDS,
  evaluateToolCall,
  redactForLog,
  type GuardState,
} from "@wyre-ai/mcp-jev-guardrails";

const state: GuardState = {
  tool_call: { name: "tickets.list", arguments: { status: "open" }, server: "autotask-mcp" },
  role: { id: "tech", name: "Technician", allowlist: ["tickets.list"] },
  policy: { deny: ["passwords.get"] },
  context: { user_intent: "List open tickets", tenant: "acme" },
};

const { answers, decision, logState } = await evaluateToolCall(state);

if (decision.outcome === "block") {
  throw new Error(decision.reasons.join("; "));
}

console.info("guardrail", {
  outcome: decision.outcome,
  rule: decision.matchedRule,
  advisory: decision.advisoryNextAction, // never used for routing
  thresholds: DECISION_THRESHOLDS,
  state: logState, // arguments already redacted
});
```

To compose without a network call (tests, or after you already asked Jev):

```ts
import { decide } from "@wyre-ai/mcp-jev-guardrails";

const decision = decide({
  action_class: { choice: "write", confidence: 0.91 },
  in_role_allowlist: 0.88,
  hits_deny_policy: 0.04,
  exposes_secrets: 0.02,
  matches_user_intent: 0.81,
  looks_like_injection: 0.05,
  blast_radius: 2.1,
  next_action: "allow", // ignored
});
// decision.outcome === "allow_with_confirm"
```

## State schema

```ts
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
```

Question instructions reference these fields with backtick paths (`tool_call.name`, `role.allowlist`, `policy.deny`, `context.user_intent`, …).

## Questions (`TOOL_CALL_QUESTIONS`)

| Key | Type | Notes |
| --- | --- | --- |
| `action_class` | Choice `read` \| `write` \| `destructive` \| `unknown` | Not `admin`. |
| `in_role_allowlist` | Noul | Fail closed in code when low. |
| `hits_deny_policy` | Noul | Hard block gate. |
| `exposes_secrets` | Noul | Hard block gate. |
| `matches_user_intent` | Noul | Low intent escalates. |
| `looks_like_injection` | Noul | High injection escalates. |
| `blast_radius` | Score 0–3 | 0 narrow/local → 3 multi-tenant irreversible. |
| `next_action` | Choice `allow` \| `confirm` \| `deny` \| `escalate` | **Advisory only.** |

## Thresholds (`DECISION_THRESHOLDS`)

Import these constants. Do not copy the numbers into Conduit.

| Constant | Value | Comparison |
| --- | --- | --- |
| `hitsDenyPolicyBlock` | `0.8` | `hits_deny_policy > 0.8` → block |
| `exposesSecretsBlock` | `0.8` | `exposes_secrets > 0.8` → block |
| `looksLikeInjectionEscalate` | `0.7` | `looks_like_injection > 0.7` → escalate_human |
| `inRoleAllowlistBlock` | `0.3` | `in_role_allowlist < 0.3` → block |
| `matchesUserIntentEscalate` | `0.4` | `matches_user_intent < 0.4` → escalate_human |
| `blastConfirmMin` | `2` | write/destructive and `blast_radius >= 2` → allow_with_confirm |
| `actionClassConfidenceMin` | `0.6` | `action_class.confidence < 0.6` → escalate_human |

## Hard gates (`decide`)

Outcomes: `allow` | `allow_with_confirm` | `block` | `escalate_human`.

First match wins:

1. **block** if `hits_deny_policy > 0.8` **or** `exposes_secrets > 0.8`
2. else if `looks_like_injection > 0.7` → **escalate_human**
3. else if `in_role_allowlist < 0.3` → **block**
4. else if `matches_user_intent < 0.4` → **escalate_human**
5. else if `action_class` in `{write, destructive}` **and** `blast_radius >= 2` → **allow_with_confirm**
6. else if `action_class.confidence < 0.6` → **escalate_human**
7. else if `action_class` is `unknown` → **escalate_human**
8. else **allow**

`next_action` never overrides these gates (Sample D: advisory `allow` still **blocks** when a deny/secrets noul fires).

### Confirm policy

Default is **blast ≥ 2 only**, not every write. A `write` with `blast_radius` 1.4 is allowed once earlier gates pass.

`strictEveryWrite: true` is an optional `decide()` / `evaluateToolCall()` flag that confirms every `write` or `destructive` call at step 5. Leave it off unless a tenant asks for that stricter policy.

## Logging redaction

Do not log raw `tool_call.arguments`, `policy`, or extra `context` fields. Use:

- `redactGuardState(state)` — copy with arguments, **policy**, and context walked through `redactUnknown` (nested secret keys/values become `[REDACTED]`)
- `redactForLog(value)` — same walk for arbitrary payloads
- `evaluateToolCall` returns `logState` already redacted

Keys matching password/token/secret/api_key/authorization/credential (and similar) are stripped. Bearer, `sk-`/`rk-` prefixes, and JWT-shaped strings are stripped even when the key name is innocuous. Role allowlists and `policy.deny` tool names are kept for audit unless they themselves look like secrets.

## Tests

```bash
cd packages/mcp-jev-guardrails
npm install
npm test
npm run build
```

Live `evaluateToolCall` coverage is skipped unless `TYPESAFE_API_KEY` is set in the environment. Unit tests never need the key.

## WYREAI-380

Tracks [WYREAI-380](https://linear.app/wyre-ai/issue/WYREAI-380/fleet-shared-typesafejev-mcp-tool-call-guardrails-module). Gateway wiring stays with Conduit Fixer; this package is the shared module.
