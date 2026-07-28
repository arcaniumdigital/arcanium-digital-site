export type Environment = "test" | "production";
export type AutomationId =
  | "A1" | "A2" | "A3" | "A4" | "A5"
  | "A6" | "A7" | "A8" | "A9" | "A10"
  | "A11" | "A12" | "A13" | "A14" | "A15";

export interface AutomationEvent {
  schema_version: "1.0";
  event_id: string;
  idempotency_key: string;
  correlation_id: string;
  automation_id: AutomationId;
  event_type: string;
  client_id: string;
  environment: Environment;
  occurred_at: string;
  severity: "info" | "warning" | "error" | "critical";
  payload_ref?: string | null;
  payload: Record<string, unknown>;
}

export interface AutomationResponse {
  ok: boolean;
  data?: {
    accepted: boolean;
    event_id: string;
    correlation_id: string;
    environment: Environment;
  };
  error?: {
    code: string;
    message?: string;
    retryable?: boolean;
  };
}
