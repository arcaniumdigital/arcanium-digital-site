import type { AutomationId, Environment } from "./event";

export interface AutomationActivationEvidence {
  client_id: string;
  automation_id: AutomationId;
  environment: Environment;
  scenario_configured: boolean;
  connections_valid: boolean;
  contract_tests_passed: boolean;
  provider_workflow_verified: boolean;
  cross_client_isolation_passed: boolean;
  cost_cap_configured: boolean;
  approval_owners_configured: boolean;
  a12_incident_path_passed: boolean;
  rollback_tested: boolean;
  production_approved: boolean;
}

export interface AutomationActivationDecision {
  test_ready: boolean;
  production_ready: boolean;
  blockers: string[];
}

const TEST_GATES: Array<keyof AutomationActivationEvidence> = [
  "scenario_configured",
  "connections_valid",
  "contract_tests_passed",
  "a12_incident_path_passed",
];

const PRODUCTION_GATES: Array<keyof AutomationActivationEvidence> = [
  ...TEST_GATES,
  "provider_workflow_verified",
  "cross_client_isolation_passed",
  "cost_cap_configured",
  "approval_owners_configured",
  "rollback_tested",
  "production_approved",
];

export function evaluateActivationGate(
  evidence: AutomationActivationEvidence,
): AutomationActivationDecision {
  const testBlockers = TEST_GATES.filter((gate) => evidence[gate] !== true);
  const productionBlockers = PRODUCTION_GATES.filter((gate) => evidence[gate] !== true);

  return {
    test_ready: testBlockers.length === 0,
    production_ready: evidence.environment === "production" && productionBlockers.length === 0,
    blockers: productionBlockers,
  };
}
