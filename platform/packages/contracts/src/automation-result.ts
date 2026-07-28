export type AutomationId =
  | "A1" | "A2" | "A3" | "A4" | "A5"
  | "A6" | "A7" | "A8" | "A9" | "A10"
  | "A11" | "A12" | "A13" | "A14" | "A15";

export type ResultStatus = "completed" | "partial" | "failed";
export type ActionSeverity = "info" | "warning" | "error" | "critical";
export type MutationKind =
  | "none"
  | "draft"
  | "publish"
  | "email"
  | "sms"
  | "gbp"
  | "outreach"
  | "destructive"
  | "replay";

export interface AutomationAction {
  action_id: string;
  dedup_key: string;
  action_type: string;
  severity: ActionSeverity;
  mutation_kind: MutationKind;
  approval_required: boolean;
  owner_group?: string | null;
  due_at?: string | null;
  evidence_ref?: string | null;
}

export interface AutomationResult {
  schema_version: "1.0";
  result_id: string;
  run_id: string;
  idempotency_key: string;
  correlation_id: string;
  automation_id: AutomationId;
  client_id: string;
  environment: "test" | "production";
  provider: string;
  status: ResultStatus;
  started_at: string;
  completed_at: string;
  input_count: number;
  accepted_count: number;
  rejected_count: number;
  output_count: number;
  actions: AutomationAction[];
  reconciliation: {
    expected_count: number;
    observed_count: number;
    balanced: boolean;
    method: string;
    evidence_ref?: string | null;
  };
  error?: {
    code: string;
    classification: "temporary" | "permanent" | "security" | "isolation";
    safe_message?: string | null;
    retryable: boolean;
  } | null;
  limitations?: string[];
}

type ValidationSuccess = { ok: true; result: AutomationResult };
type ValidationFailure = { ok: false; code: string; status: number };
export type AutomationResultValidation = ValidationSuccess | ValidationFailure;

const AUTOMATION_IDS = new Set(
  Array.from({ length: 15 }, (_, index) => `A${index + 1}`),
);
const RESULT_STATUSES = new Set(["completed", "partial", "failed"]);
const SEVERITIES = new Set(["info", "warning", "error", "critical"]);
const MUTATION_KINDS = new Set([
  "none", "draft", "publish", "email", "sms", "gbp",
  "outreach", "destructive", "replay",
]);
const ERROR_CLASSIFICATIONS = new Set(["temporary", "permanent", "security", "isolation"]);
const IDENTIFIER_MAX = 160;
const SAFE_MESSAGE_MAX = 500;

// These are hard ceilings from the implementation specification. Per-client
// configuration may impose a lower cap, but never a higher one.
export const AUTOMATION_ACTION_CEILINGS: Readonly<Record<AutomationId, number>> = {
  A1: 10,
  A2: 20,
  A3: 15,
  A4: 25,
  A5: 5,
  A6: 20,
  A7: 15,
  A8: 25,
  A9: 20,
  A10: 25,
  A11: 15,
  A12: 25,
  A13: 20,
  A14: 10,
  A15: 10,
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const isNonEmptyString = (value: unknown, max = IDENTIFIER_MAX): value is string =>
  typeof value === "string" && value.length > 0 && value.length <= max;

const isNonNegativeInteger = (value: unknown): value is number =>
  typeof value === "number" && Number.isSafeInteger(value) && value >= 0;

const isIsoDate = (value: unknown): value is string =>
  typeof value === "string" && Number.isFinite(Date.parse(value));

function invalid(code: string, status = 400): ValidationFailure {
  return { ok: false, code, status };
}

export function validateAutomationResultCandidate(
  candidate: unknown,
  environment: "test" | "production",
  allowedClientIds: string[],
  configuredActionCap?: number,
): AutomationResultValidation {
  if (!isRecord(candidate)) return invalid("INVALID_RESULT");

  for (const field of [
    "schema_version", "result_id", "run_id", "idempotency_key",
    "correlation_id", "automation_id", "client_id", "environment",
    "provider", "status", "started_at", "completed_at",
  ]) {
    if (!isNonEmptyString(candidate[field])) return invalid("INVALID_RESULT");
  }
  if (candidate.schema_version !== "1.0") return invalid("INVALID_SCHEMA_VERSION");
  if (candidate.environment !== environment) return invalid("ENVIRONMENT_MISMATCH", 403);
  if (!allowedClientIds.includes(candidate.client_id as string)) {
    return invalid("CLIENT_NOT_ALLOWED", 403);
  }
  if (!AUTOMATION_IDS.has(candidate.automation_id as string)) return invalid("INVALID_AUTOMATION");
  if (!RESULT_STATUSES.has(candidate.status as string)) return invalid("INVALID_RESULT_STATUS");
  if (!isIsoDate(candidate.started_at) || !isIsoDate(candidate.completed_at)) {
    return invalid("INVALID_RESULT_TIME");
  }
  if (Date.parse(candidate.completed_at) < Date.parse(candidate.started_at)) {
    return invalid("INVALID_RESULT_TIME");
  }

  for (const field of ["input_count", "accepted_count", "rejected_count", "output_count"]) {
    if (!isNonNegativeInteger(candidate[field])) return invalid("INVALID_RESULT_COUNTS");
  }
  if ((candidate.accepted_count as number) + (candidate.rejected_count as number) !== candidate.input_count) {
    return invalid("RESULT_COUNTS_UNBALANCED");
  }

  if (!Array.isArray(candidate.actions)) return invalid("INVALID_ACTIONS");
  const automationId = candidate.automation_id as AutomationId;
  const specificationCeiling = AUTOMATION_ACTION_CEILINGS[automationId];
  const effectiveCap = configuredActionCap === undefined
    ? specificationCeiling
    : Math.min(specificationCeiling, configuredActionCap);
  if (!Number.isSafeInteger(effectiveCap) || effectiveCap < 0) {
    return invalid("INVALID_ACTION_CAP", 500);
  }
  if (candidate.actions.length > effectiveCap) return invalid("ACTION_CAP_EXCEEDED", 422);

  const actionIds = new Set<string>();
  const dedupKeys = new Set<string>();
  for (const action of candidate.actions) {
    if (!isRecord(action)) return invalid("INVALID_ACTIONS");
    if (
      !isNonEmptyString(action.action_id)
      || !isNonEmptyString(action.dedup_key)
      || !isNonEmptyString(action.action_type)
      || !SEVERITIES.has(action.severity as string)
      || !MUTATION_KINDS.has(action.mutation_kind as string)
      || typeof action.approval_required !== "boolean"
    ) {
      return invalid("INVALID_ACTION");
    }
    if (actionIds.has(action.action_id) || dedupKeys.has(action.dedup_key)) {
      return invalid("DUPLICATE_ACTION");
    }
    actionIds.add(action.action_id);
    dedupKeys.add(action.dedup_key);

    if (action.mutation_kind !== "none" && action.mutation_kind !== "draft" && !action.approval_required) {
      return invalid("MUTATION_REQUIRES_APPROVAL", 422);
    }
    if (action.due_at !== undefined && action.due_at !== null && !isIsoDate(action.due_at)) {
      return invalid("INVALID_ACTION_DUE_AT");
    }
    for (const optional of ["owner_group", "evidence_ref"]) {
      if (
        action[optional] !== undefined
        && action[optional] !== null
        && !isNonEmptyString(action[optional], 500)
      ) {
        return invalid("INVALID_ACTION");
      }
    }
  }

  if (!isRecord(candidate.reconciliation)) return invalid("INVALID_RECONCILIATION");
  const reconciliation = candidate.reconciliation;
  if (
    !isNonNegativeInteger(reconciliation.expected_count)
    || !isNonNegativeInteger(reconciliation.observed_count)
    || typeof reconciliation.balanced !== "boolean"
    || !isNonEmptyString(reconciliation.method, 500)
  ) {
    return invalid("INVALID_RECONCILIATION");
  }
  const countsBalance = reconciliation.expected_count === reconciliation.observed_count;
  if (countsBalance !== reconciliation.balanced) return invalid("RECONCILIATION_MISMATCH", 422);
  if (candidate.status === "completed" && !reconciliation.balanced) {
    return invalid("COMPLETED_RESULT_UNBALANCED", 422);
  }

  if (candidate.status === "failed" && !isRecord(candidate.error)) {
    return invalid("FAILED_RESULT_REQUIRES_ERROR", 422);
  }
  if (candidate.error !== undefined && candidate.error !== null) {
    if (
      !isRecord(candidate.error)
      || !isNonEmptyString(candidate.error.code)
      || !ERROR_CLASSIFICATIONS.has(candidate.error.classification as string)
      || typeof candidate.error.retryable !== "boolean"
      || (
        candidate.error.safe_message !== undefined
        && candidate.error.safe_message !== null
        && !isNonEmptyString(candidate.error.safe_message, SAFE_MESSAGE_MAX)
      )
    ) {
      return invalid("INVALID_RESULT_ERROR");
    }
    if (
      (candidate.error.classification === "permanent"
        || candidate.error.classification === "security"
        || candidate.error.classification === "isolation")
      && candidate.error.retryable
    ) {
      return invalid("UNSAFE_RETRY_CLASSIFICATION", 422);
    }
  }
  if (
    candidate.limitations !== undefined
    && (
      !Array.isArray(candidate.limitations)
      || candidate.limitations.some((item) => !isNonEmptyString(item, 500))
    )
  ) {
    return invalid("INVALID_LIMITATIONS");
  }

  return { ok: true, result: candidate as unknown as AutomationResult };
}
