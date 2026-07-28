import type { AutomationId } from "./automation-result";

export type ActionResolutionDisposition = "completed" | "superseded" | "cancelled";

export interface ActionResolutionItem {
  action_id: string;
  dedup_key: string;
  disposition: ActionResolutionDisposition;
  reason: string;
  evidence_ref?: string | null;
}

export interface ActionResolutionRequest {
  schema_version: "1.0";
  resolution_id: string;
  idempotency_key: string;
  correlation_id: string;
  automation_id: AutomationId;
  client_id: string;
  environment: "test" | "production";
  occurred_at: string;
  resolutions: ActionResolutionItem[];
}

type ValidationSuccess = { ok: true; resolution: ActionResolutionRequest };
type ValidationFailure = { ok: false; code: string; status: number };
export type ActionResolutionValidation = ValidationSuccess | ValidationFailure;

const AUTOMATION_IDS = new Set(Array.from({ length: 15 }, (_, index) => `A${index + 1}`));
const DISPOSITIONS = new Set(["completed", "superseded", "cancelled"]);
const IDENTIFIER_MAX = 160;
const TEXT_MAX = 500;
const MAX_RESOLUTIONS = 20;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const isNonEmptyString = (value: unknown, max = IDENTIFIER_MAX): value is string =>
  typeof value === "string" && value.length > 0 && value.length <= max;

const invalid = (code: string, status = 400): ValidationFailure => ({ ok: false, code, status });

export function validateActionResolutionCandidate(
  candidate: unknown,
  environment: "test" | "production",
  allowedClientIds: string[],
): ActionResolutionValidation {
  if (!isRecord(candidate)) return invalid("INVALID_ACTION_RESOLUTION");
  for (const field of [
    "schema_version", "resolution_id", "idempotency_key", "correlation_id",
    "automation_id", "client_id", "environment", "occurred_at",
  ]) {
    if (!isNonEmptyString(candidate[field])) return invalid("INVALID_ACTION_RESOLUTION");
  }
  if (candidate.schema_version !== "1.0") return invalid("INVALID_SCHEMA_VERSION");
  if (candidate.environment !== environment) return invalid("ENVIRONMENT_MISMATCH", 403);
  if (!allowedClientIds.includes(candidate.client_id as string)) {
    return invalid("CLIENT_NOT_ALLOWED", 403);
  }
  if (!AUTOMATION_IDS.has(candidate.automation_id as string)) {
    return invalid("INVALID_AUTOMATION");
  }
  if (!Number.isFinite(Date.parse(candidate.occurred_at as string))) {
    return invalid("INVALID_OCCURRED_AT");
  }
  if (
    !Array.isArray(candidate.resolutions)
    || candidate.resolutions.length < 1
    || candidate.resolutions.length > MAX_RESOLUTIONS
  ) {
    return invalid("INVALID_RESOLUTIONS");
  }

  const actionIds = new Set<string>();
  const dedupKeys = new Set<string>();
  for (const item of candidate.resolutions) {
    if (
      !isRecord(item)
      || !isNonEmptyString(item.action_id)
      || !isNonEmptyString(item.dedup_key)
      || !DISPOSITIONS.has(item.disposition as string)
      || !isNonEmptyString(item.reason, TEXT_MAX)
      || (
        item.evidence_ref !== undefined
        && item.evidence_ref !== null
        && !isNonEmptyString(item.evidence_ref, TEXT_MAX)
      )
    ) {
      return invalid("INVALID_RESOLUTION_ITEM");
    }
    if (actionIds.has(item.action_id) || dedupKeys.has(item.dedup_key)) {
      return invalid("DUPLICATE_RESOLUTION_ITEM");
    }
    actionIds.add(item.action_id);
    dedupKeys.add(item.dedup_key);
  }

  return { ok: true, resolution: candidate as unknown as ActionResolutionRequest };
}
