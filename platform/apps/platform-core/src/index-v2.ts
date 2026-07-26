import platformCore from "./index";
import type { Env } from "./index";

interface PlatformEnv extends Env {
  A13_DB: D1Database;
  A14_DB: D1Database;
  A15_DB: D1Database;
}

type AcceptedEvent = {
  event_id: string;
  client_id: string;
  environment: string;
  payload?: Record<string, unknown>;
};

const isoNow = () => new Date().toISOString();

const handler: ExportedHandler<PlatformEnv> = {
  async fetch(request: Request, env: PlatformEnv): Promise<Response> {
    const url = new URL(request.url);
    if (request.method === "GET" && url.pathname === "/health") {
      return Response.json({
        ok: true,
        data: {
          service: "arcanium-platform-core",
          environment: env.ENVIRONMENT,
          operations: ["A13_PROJECT", "A14_EXPERIMENT", "A15_COST_IMPORT"],
          production_actions_enabled: false,
        },
      }, { headers: { "cache-control": "no-store" } });
    }

    const supported = new Map<string, "A13" | "A14" | "A15">([
      ["/v1/a13/projects", "A13"],
      ["/v1/a14/experiments", "A14"],
      ["/v1/a15/cost-imports", "A15"],
    ]);
    const operation = supported.get(url.pathname);
    if (!operation || request.method !== "POST") return platformCore.fetch(request, env);

    let event: AcceptedEvent;
    try {
      event = await request.clone().json<AcceptedEvent>();
    } catch {
      return platformCore.fetch(request, env);
    }
    const response = await platformCore.fetch(request, env);
    if (response.status !== 202) return response;

    const payload = event.payload ?? {};
    if (operation === "A13") {
      const projectId = typeof payload.project_id === "string" ? payload.project_id : event.event_id;
      await env.A13_DB.prepare(
        "INSERT OR IGNORE INTO a13_projects (project_id, environment, client_id, status, source_url, target_repo, target_project, created_at, updated_at) VALUES (?, ?, ?, 'requested', ?, ?, ?, ?, ?)",
      ).bind(projectId, event.environment, event.client_id, payload.source_url ?? null, payload.target_repo ?? null, payload.target_project ?? null, isoNow(), isoNow()).run();
    }
    if (operation === "A14") {
      const experimentId = typeof payload.experiment_id === "string" ? payload.experiment_id : event.event_id;
      await env.A14_DB.prepare(
        "INSERT OR IGNORE INTO a14_experiments (experiment_id, environment, client_id, name, hypothesis_version, page_scope_json, primary_metric, status, assignment_version, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, 'draft', '1.0', ?, ?)",
      ).bind(experimentId, event.environment, event.client_id, payload.name ?? "Test experiment", payload.hypothesis_version ?? "1.0", JSON.stringify(payload.page_scope ?? []), payload.primary_metric ?? "confirmed_conversion", isoNow(), isoNow()).run();
    }
    if (operation === "A15") {
      const entryId = typeof payload.entry_id === "string" ? payload.entry_id : event.event_id;
      await env.A15_DB.prepare(
        "INSERT OR IGNORE INTO a15_cost_entries (entry_id, environment, client_id, provider, automation_id, service_period, source_type, external_record_id, currency, amount_minor, allocation_status, metadata_json, imported_at) VALUES (?, ?, ?, ?, 'A15', ?, 'test_fixture', ?, ?, ?, 'unallocated', ?, ?)",
      ).bind(entryId, event.environment, event.client_id, payload.provider ?? "test", payload.service_period ?? "2026-07", payload.external_record_id ?? entryId, payload.currency ?? "AUD", payload.amount_minor ?? 0, JSON.stringify(payload.metadata ?? {}), isoNow()).run();
    }
    return response;
  },
};

export default handler;
