import type { AutomationId } from "./automation-result";

export type OpsAutomationId = Exclude<AutomationId, "A13" | "A14" | "A15">;
export type OpsCategory =
  | "ERROR"
  | "ACCESS_REVOKED"
  | "SCENARIO_DISABLED"
  | "WEBHOOK_FAILED"
  | "COST_THRESHOLD"
  | "QUOTA_THRESHOLD"
  | "DATA_STALE"
  | "QUEUE_BACKLOG"
  | "SECURITY_ANOMALY"
  | "PROVIDER_INCIDENT"
  | "RECOVERY_REQUIRED"
  | "CROSS_CLIENT_ISOLATION_FAILURE"
  | "RESOLVED";
export type OpsClassification = "temporary" | "permanent" | "security" | "isolation";
export type OpsReplayKind = "none" | "read_only" | "idempotent_write" | "dangerous";

export interface OpsCostSnapshot {
  currency: string;
  amount_minor: number;
  threshold_minor: number;
  service_period: string;
}

export interface OpsHealthSnapshot {
  status: "healthy" | "degraded" | "down" | "stale";
  checked_at: string;
  freshness_age_seconds?: number | null;
}

export interface OpsControlEvent {
  schema_version: "1.0";
  event_id: string;
  idempotency_key: string;
  correlation_id: string;
  automation_id: OpsAutomationId;
  client_id: string;
  environment: "test" | "production";
  category: OpsCategory;
  severity: "info" | "warning" | "error" | "critical";
  provider: string;
  occurred_at: string;
  summary: string;
  dedup_key: string;
  incident_id?: string | null;
  error_code?: string | null;
  classification: OpsClassification;
  retryable: boolean;
  affected_count: number;
  data_loss_window_minutes: number;
  replay_kind: OpsReplayKind;
  approval_id?: string | null;
  payload_ref?: string | null;
  verification_evidence_ref?: string | null;
  cost?: OpsCostSnapshot | null;
  health?: OpsHealthSnapshot | null;
}

type ValidationSuccess = { ok: true; event: OpsControlEvent };
type ValidationFailure = { ok: false; code: string; status: number };
export type OpsControlValidation = ValidationSuccess | ValidationFailure;

const AUTOMATION_IDS = new Set(Array.from({ length: 12 }, (_, index) => `A${index + 1}`));
const CATEGORIES = new Set([
  "ERROR", "ACCESS_REVOKED", "SCENARIO_DISABLED", "WEBHOOK_FAILED",
  "COST_THRESHOLD", "QUOTA_THRESHOLD", "DATA_STALE", "QUEUE_BACKLOG",
  "SECURITY_ANOMALY", "PROVIDER_INCIDENT", "RECOVERY_REQUIRED",
  "CROSS_CLIENT_ISOLATION_FAILURE", "RESOLVED",
]);
const SEVERITIES = new Set(["info", "warning", "error", "critical"]);
const CLASSIFICATIONS = new Set(["temporary", "permanent", "security", "isolation"]);
const REPLAY_KINDS = new Set(["none", "read_only", "idempotent_write", "dangerous"]);
const HEALTH_STATUSES = new Set(["healthy", "degraded", "down", "stale"]);
const IDENTIFIER_MAX = 120;
const TEXT_MAX = 500;
const ALLOWED_FIELDS = new Set([
  "schema_version", "event_id", "idempotency_key", "correlation_id",
  "automation_id", "client_id", "environment", "category", "severity",
  "provider", "occurred_at", "summary", "dedup_key", "incident_id",
  "error_code", "classification", "retryable", "affected_count",
  "data_loss_window_minutes", "replay_kind", "approval_id", "payload_ref",
  "verification_evidence_ref", "cost", "health",
]);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);
const isString = (value: unknown, max = IDENTIFIER_MAX): value is string =>
  typeof value === "string" && value.length > 0 && value.length <= max;
const isOptionalString = (value: unknown, max = TEXT_MAX): boolean =>
  value === undefined || value === null || isString(value, max);
const isNonNegativeInteger = (value: unknown): value is number =>
  Number.isSafeInteger(value) && (value as number) >= 0;
const invalid = (code: string, status = 400): ValidationFailure => ({ ok: false, code, status });

function validCost(value: unknown): boolean {
  if (!isRecord(value)) return false;
  if (Object.keys(value).some((key) => !["currency", "amount_minor", "threshold_minor", "service_period"].includes(key))) {
    return false;
  }
  return isString(value.currency, 8)
    && isNonNegativeInteger(value.amount_minor)
    && isNonNegativeInteger(value.threshold_minor)
    && isString(value.service_period, 32);
}

function validHealth(value: unknown): boolean {
  if (!isRecord(value)) return false;
  if (Object.keys(value).some((key) => !["status", "checked_at", "freshness_age_seconds"].includes(key))) {
    return false;
  }
  return HEALTH_STATUSES.has(value.status as string)
    && isString(value.checked_at, 40)
    && Number.isFinite(Date.parse(value.checked_at as string))
    && (
      value.freshness_age_seconds === undefined
      || value.freshness_age_seconds === null
      || isNonNegativeInteger(value.freshness_age_seconds)
    );
}

export function validateOpsControlCandidate(
  candidate: unknown,
  environment: "test" | "production",
  allowedClientIds: string[],
): OpsControlValidation {
  if (!isRecord(candidate)) return invalid("INVALID_OPS_EVENT");
  if (Object.keys(candidate).some((key) => !ALLOWED_FIELDS.has(key))) {
    return invalid("UNKNOWN_OPS_FIELD");
  }
  for (const field of [
    "schema_version", "event_id", "idempotency_key", "correlation_id",
    "automation_id", "client_id", "environment", "category", "severity",
    "provider", "occurred_at", "summary", "dedup_key", "classification",
    "replay_kind",
  ]) {
    if (!isString(candidate[field], field === "summary" ? TEXT_MAX : IDENTIFIER_MAX)) {
      return invalid("INVALID_OPS_EVENT");
    }
  }
  if (candidate.schema_version !== "1.0") return invalid("INVALID_SCHEMA_VERSION");
  if (candidate.environment !== environment) return invalid("ENVIRONMENT_MISMATCH", 403);
  if (!allowedClientIds.includes(candidate.client_id as string)) return invalid("CLIENT_NOT_ALLOWED", 403);
  if (!AUTOMATION_IDS.has(candidate.automation_id as string)) return invalid("INVALID_AUTOMATION");
  if (!CATEGORIES.has(candidate.category as string)) return invalid("INVALID_OPS_CATEGORY");
  if (!SEVERITIES.has(candidate.severity as string)) return invalid("INVALID_SEVERITY");
  if (!CLASSIFICATIONS.has(candidate.classification as string)) return invalid("INVALID_CLASSIFICATION");
  if (!REPLAY_KINDS.has(candidate.replay_kind as string)) return invalid("INVALID_REPLAY_KIND");
  if (!Number.isFinite(Date.parse(candidate.occurred_at as string))) return invalid("INVALID_OCCURRED_AT");
  if (typeof candidate.retryable !== "boolean") return invalid("INVALID_RETRYABLE");
  if (!isNonNegativeInteger(candidate.affected_count) || !isNonNegativeInteger(candidate.data_loss_window_minutes)) {
    return invalid("INVALID_AFFECTED_SCOPE");
  }
  for (const field of [
    "incident_id", "error_code", "approval_id", "payload_ref", "verification_evidence_ref",
  ]) {
    if (!isOptionalString(candidate[field])) return invalid("INVALID_OPS_REFERENCE");
  }
  if (candidate.cost !== undefined && candidate.cost !== null && !validCost(candidate.cost)) {
    return invalid("INVALID_COST_SNAPSHOT");
  }
  if (candidate.health !== undefined && candidate.health !== null && !validHealth(candidate.health)) {
    return invalid("INVALID_HEALTH_SNAPSHOT");
  }
  if (candidate.category === "COST_THRESHOLD" && !validCost(candidate.cost)) {
    return invalid("COST_SNAPSHOT_REQUIRED");
  }
  if (
    candidate.category === "RESOLVED"
    && (!isString(candidate.incident_id) || !isString(candidate.verification_evidence_ref, TEXT_MAX))
  ) {
    return invalid("RESOLUTION_EVIDENCE_REQUIRED");
  }
  if (
    candidate.category === "RECOVERY_REQUIRED"
    && (!isString(candidate.incident_id) || candidate.replay_kind === "none")
  ) {
    return invalid("RECOVERY_DETAILS_REQUIRED");
  }
  if (
    (candidate.classification === "security" || candidate.classification === "isolation")
    && candidate.retryable
  ) {
    return invalid("UNSAFE_RETRY_CLASSIFICATION", 422);
  }
  if (
    candidate.category === "CROSS_CLIENT_ISOLATION_FAILURE"
    && (candidate.classification !== "isolation" || candidate.severity !== "critical")
  ) {
    return invalid("ISOLATION_FAILURE_MUST_BE_CRITICAL", 422);
  }
  if (
    candidate.category === "SECURITY_ANOMALY"
    && (candidate.classification !== "security" || candidate.severity !== "critical")
  ) {
    return invalid("SECURITY_ANOMALY_MUST_BE_CRITICAL", 422);
  }
  if (
    candidate.category === "RESOLVED"
    && (candidate.retryable || candidate.replay_kind !== "none")
  ) {
    return invalid("INVALID_RESOLUTION_STATE", 422);
  }
  return { ok: true, event: candidate as unknown as OpsControlEvent };
}

export function opsActionId(incidentId: string): string {
  return `action:${incidentId}`;
}
