import {
  ACTION_CLASSES,
  ADVISORY_NEXT_ACTIONS,
  type ActionClass,
  type AdvisoryNextAction,
  type ChoiceLike,
  type DecideOptions,
  type Decision,
  type DecisionRule,
  type NoulLike,
  type ScoreLike,
  type ToolCallAnswers,
} from "./types.js";

/**
 * Fleet-wide TypeSafe/Jev MCP tool-call decision thresholds.
 * Conduit and *-mcp servers must import these rather than copying numbers.
 *
 * Comparisons match the Conduit Fixer composition exactly:
 * `>` / `<` are exclusive; blast confirm uses `>=`.
 */
export const DECISION_THRESHOLDS = {
  /** Block when `hits_deny_policy` is strictly greater than this. */
  hitsDenyPolicyBlock: 0.8,
  /** Block when `exposes_secrets` is strictly greater than this. */
  exposesSecretsBlock: 0.8,
  /** Escalate when `looks_like_injection` is strictly greater than this. */
  looksLikeInjectionEscalate: 0.7,
  /** Block when `in_role_allowlist` is strictly less than this (fail closed). */
  inRoleAllowlistBlock: 0.3,
  /** Escalate when `matches_user_intent` is strictly less than this. */
  matchesUserIntentEscalate: 0.4,
  /**
   * Confirm `write`/`destructive` when `blast_radius` is >= this.
   * Default confirm policy is blast≥2 only, not every write.
   */
  blastConfirmMin: 2,
  /** Escalate when `action_class.confidence` is strictly less than this. */
  actionClassConfidenceMin: 0.6,
} as const;

export type DecisionThresholds = typeof DECISION_THRESHOLDS;

/** Action classes that can require confirmation under the blast (or strictEveryWrite) gate. */
export const CONFIRM_ACTION_CLASSES: readonly ActionClass[] = ["write", "destructive"];

function noulOf(value: NoulLike, field: string): number {
  const n = typeof value === "number" ? value : value?.noul;
  if (typeof n !== "number" || Number.isNaN(n)) {
    throw new TypeError(`decide(): ${field} must be a number or { noul: number }`);
  }
  return n;
}

function scoreOf(value: ScoreLike, field: string): number {
  const n = typeof value === "number" ? value : value?.score;
  if (typeof n !== "number" || Number.isNaN(n)) {
    throw new TypeError(`decide(): ${field} must be a number or { score: number }`);
  }
  return n;
}

function actionClassOf(value: ChoiceLike<ActionClass>): { choice: ActionClass; confidence: number } {
  const choice = value?.choice;
  const confidence = value?.confidence;
  if (typeof confidence !== "number" || Number.isNaN(confidence)) {
    throw new TypeError("decide(): action_class.confidence must be a number");
  }
  if (!ACTION_CLASSES.includes(choice as ActionClass)) {
    return { choice: "unknown", confidence };
  }
  return { choice, confidence };
}

function advisoryOf(
  value: ChoiceLike<AdvisoryNextAction> | AdvisoryNextAction,
): AdvisoryNextAction {
  const choice = typeof value === "string" ? value : value?.choice;
  if (ADVISORY_NEXT_ACTIONS.includes(choice as AdvisoryNextAction)) {
    return choice as AdvisoryNextAction;
  }
  return "escalate";
}

function result(
  outcome: Decision["outcome"],
  matchedRule: DecisionRule,
  reasons: string[],
  advisoryNextAction: AdvisoryNextAction,
): Decision {
  return { outcome, matchedRule, reasons, advisoryNextAction };
}

/**
 * Compose TypeSafe answers into one fleet decision.
 *
 * Rule order (first match wins). `next_action` is never consulted:
 * 1. block if hits_deny_policy > 0.8 OR exposes_secrets > 0.8
 * 2. else if looks_like_injection > 0.7 → escalate_human
 * 3. else if in_role_allowlist < 0.3 → block
 * 4. else if matches_user_intent < 0.4 → escalate_human
 * 5. else if action_class in {write, destructive} AND blast_radius >= 2 → allow_with_confirm
 *    (optional strictEveryWrite confirms every write/destructive here)
 * 6. else if action_class.confidence < 0.6 → escalate_human
 * 7. else allow
 */
export function decide(answers: ToolCallAnswers, options?: DecideOptions): Decision {
  const t = DECISION_THRESHOLDS;
  const advisoryNextAction = advisoryOf(answers.next_action);
  const action = actionClassOf(answers.action_class);
  const hitsDeny = noulOf(answers.hits_deny_policy, "hits_deny_policy");
  const exposesSecrets = noulOf(answers.exposes_secrets, "exposes_secrets");
  const injection = noulOf(answers.looks_like_injection, "looks_like_injection");
  const allowlist = noulOf(answers.in_role_allowlist, "in_role_allowlist");
  const intent = noulOf(answers.matches_user_intent, "matches_user_intent");
  const blast = scoreOf(answers.blast_radius, "blast_radius");
  const writeLike = CONFIRM_ACTION_CLASSES.includes(action.choice);

  if (hitsDeny > t.hitsDenyPolicyBlock || exposesSecrets > t.exposesSecretsBlock) {
    const reasons = [];
    if (hitsDeny > t.hitsDenyPolicyBlock) {
      reasons.push(
        `hits_deny_policy ${hitsDeny} > ${t.hitsDenyPolicyBlock}`,
      );
    }
    if (exposesSecrets > t.exposesSecretsBlock) {
      reasons.push(
        `exposes_secrets ${exposesSecrets} > ${t.exposesSecretsBlock}`,
      );
    }
    return result("block", "block_deny_or_secrets", reasons, advisoryNextAction);
  }

  if (injection > t.looksLikeInjectionEscalate) {
    return result(
      "escalate_human",
      "escalate_injection",
      [`looks_like_injection ${injection} > ${t.looksLikeInjectionEscalate}`],
      advisoryNextAction,
    );
  }

  if (allowlist < t.inRoleAllowlistBlock) {
    return result(
      "block",
      "block_role_allowlist",
      [`in_role_allowlist ${allowlist} < ${t.inRoleAllowlistBlock}`],
      advisoryNextAction,
    );
  }

  if (intent < t.matchesUserIntentEscalate) {
    return result(
      "escalate_human",
      "escalate_user_intent",
      [`matches_user_intent ${intent} < ${t.matchesUserIntentEscalate}`],
      advisoryNextAction,
    );
  }

  if (writeLike && (blast >= t.blastConfirmMin || options?.strictEveryWrite === true)) {
    const reasons = [
      `action_class ${action.choice}`,
      options?.strictEveryWrite
        ? "strictEveryWrite"
        : `blast_radius ${blast} >= ${t.blastConfirmMin}`,
    ];
    return result(
      "allow_with_confirm",
      "confirm_write_blast",
      reasons,
      advisoryNextAction,
    );
  }

  if (action.confidence < t.actionClassConfidenceMin) {
    return result(
      "escalate_human",
      "escalate_action_class_confidence",
      [
        `action_class.confidence ${action.confidence} < ${t.actionClassConfidenceMin}`,
      ],
      advisoryNextAction,
    );
  }

  return result("allow", "allow", ["no hard gate matched"], advisoryNextAction);
}
