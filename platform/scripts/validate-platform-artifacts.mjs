import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve(".");
const readJson = (path) => JSON.parse(readFileSync(resolve(root, path), "utf8"));
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};
const ids = Array.from({ length: 15 }, (_, index) => `A${index + 1}`);
const sameIds = (values) => JSON.stringify([...new Set(values)].sort((a, b) => Number(a.slice(1)) - Number(b.slice(1)))) === JSON.stringify(ids);

const safety = readJson("platform/config/test-safety-defaults.json");
const controls = readJson("platform/config/automation-controls.test.json");
const registry = readJson("platform/make/test/scenario-registry.json");
const resources = readJson("platform/cloudflare/resource-manifest.json");
const gates = readJson("platform/readiness/TEST-0001/ACTIVATION_GATES.json");
const ingress = readJson("platform/readiness/TEST-0001/INGRESS_MATRIX.json");
const verification = readJson("platform/readiness/TEST-0001/EVENT_VERIFICATION.json");
const signer = readJson("platform/make/custom-app/send-signed-event.module.json");

function validateSafety() {
  assert(resources.environment === "test", "Resource manifest must remain TEST-only.");
  assert(resources.production.enabled === false, "Production resources must remain disabled.");
  assert(resources.production.resource_creation === false, "Production resource creation must remain disabled.");
  assert(controls.environment === "test", "Automation controls must remain TEST-only.");
  for (const [key, value] of Object.entries(controls.global)) {
    if (key.endsWith("allowed") || key === "production_approved") assert(value === false, `${key} must remain false.`);
  }
  assert(safety.a13.allow_dns_change === false && safety.a13.allow_site_launch === false, "A13 launch flags must remain false.");
  assert(safety.a14.allow_experiment_launch === false, "A14 launch flag must remain false.");
  assert(safety.a15.allow_pricing_change === false, "A15 pricing flag must remain false.");
}

function validateCoverage() {
  assert(sameIds(registry.scenarios.map((item) => item.automation_id)), "Scenario registry must cover A1-A15 exactly once.");
  assert(new Set(registry.scenarios.map((item) => item.scenario_id)).size === 15, "Scenario IDs must be unique.");
  assert(sameIds(gates.automations.map((item) => item.automation_id)), "Activation gates must cover A1-A15.");
  assert(sameIds(ingress.results.map((item) => item.automation_id)), "Ingress evidence must cover A1-A15.");
  assert(ingress.results.every((item) => item.passed === true), "Recorded ingress evidence contains a failure.");
  assert(gates.automations.every((item) => item.production_approved === false), "Production approval must remain false.");
}

function validateBlueprints() {
  const makeRoot = resolve(root, "platform/make/test");
  const files = readdirSync(makeRoot).filter((name) => name.endsWith(".json"));
  for (const name of files) JSON.parse(readFileSync(join(makeRoot, name), "utf8"));
  const wiredIds = new Set(verification.make_blueprints_wired_automation_ids);
  for (const item of registry.scenarios) {
    if (wiredIds.has(item.automation_id)) {
      assert(item.active === false, `${item.automation_id} must remain inactive.`);
      assert(item.verification_preflight_wired === true, `${item.automation_id} is missing verification registry evidence.`);
    }
  }
  assert(signer.endpoint_paths.includes("/v1/platform/events/verify"), "Make signer is missing verification endpoint.");
  assert(signer.communication.headers["X-Correlation-ID"] === "{{parameters.correlationId}}", "Make signer is missing correlation propagation.");
  assert(signer.secret_material_committed === false, "Signer artifact must not contain committed secret material.");
  return files.length;
}

function validateSecrets() {
  const clientRoot = resolve(root, "platform/config/clients");
  const forbidden = /(secret|password|api[_-]?key|access[_-]?token|refresh[_-]?token)/i;
  const visit = (value, path = "config") => {
    if (Array.isArray(value)) value.forEach((item, index) => visit(item, `${path}[${index}]`));
    else if (value && typeof value === "object") {
      for (const [key, child] of Object.entries(value)) {
        assert(!forbidden.test(key), `Prohibited secret-like field at ${path}.${key}`);
        visit(child, `${path}.${key}`);
      }
    }
  };
  for (const name of readdirSync(clientRoot).filter((item) => item.endsWith(".json"))) visit(readJson(`platform/config/clients/${name}`));
}

function validateDataExposure() {
  const forbidden = ["raw_logs", "raw_rows", "credentials", "hmac_secret", "api_key"];
  const serialized = JSON.stringify(readJson("platform/packages/test-fixtures/golden-events.json")).toLowerCase();
  for (const key of forbidden) assert(!serialized.includes(`\"${key}\"`), `Golden events expose ${key}.`);
  assert(signer.communication.log.sanitize.includes("request.body"), "Make signer must redact request bodies.");
  assert(signer.communication.log.sanitize.includes("request.headers.X-Automation-Signature"), "Make signer must redact signatures.");
}

validateSafety();
validateCoverage();
const mode = process.argv[2] ?? "all";
const blueprintCount = validateBlueprints();

if (mode === "secrets" || mode === "all") validateSecrets();
if (mode === "data-exposure" || mode === "all") validateDataExposure();

const providerVerified = gates.automations.filter((item) => item.provider_workflow_verified).map((item) => item.automation_id);
const rollbackVerified = gates.automations.filter((item) => item.rollback_tested).map((item) => item.automation_id);
const report = {
  mode,
  environment: "test",
  automation_registry: "15/15",
  ingress_evidence: "15/15",
  provider_workflow_verified: providerVerified,
  rollback_verified: rollbackVerified,
  verification_preflight_wired: verification.make_blueprints_wired_automation_ids,
  make_json_files_valid: blueprintCount,
  production_enabled: false,
};

if (mode === "dataforseo") {
  assert(safety.dataforseo.enabled === false, "DataForSEO spend must remain disabled.");
  report.dataforseo = {
    enabled: false,
    max_tasks_per_client_per_run: safety.dataforseo.max_tasks_per_client_per_run,
    max_daily_cost_minor_per_client: safety.dataforseo.max_daily_cost_minor_per_client,
    max_monthly_cost_minor_per_client: safety.dataforseo.max_monthly_cost_minor_per_client,
    currency: safety.dataforseo.currency,
  };
}
if (mode === "costs") {
  report.cost_caps = {
    dataforseo: safety.dataforseo,
    llm: safety.llm,
    clicksend: safety.clicksend,
    bigquery: safety.bigquery,
  };
}
if (mode === "resources") report.required_bindings = resources.required_bindings;

console.log(JSON.stringify(report, null, 2));
