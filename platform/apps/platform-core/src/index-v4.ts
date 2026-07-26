import platformCore from "./index";
import priorHandler from "./index-v2";
import type { Env } from "./index";

interface PlatformEnv extends Env { A15_DB: D1Database; }

const handler: ExportedHandler<PlatformEnv> = {
  async fetch(request: Request, env: PlatformEnv, context: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    if (request.method !== "POST" || url.pathname !== "/v1/a15/cost-imports") {
      return priorHandler.fetch!(request, env, context);
    }
    const clone = request.clone();
    const accepted = await platformCore.fetch!(request, env, context);
    if (accepted.status !== 202) return accepted;
    const event = await clone.json<{ event_id: string; client_id: string; environment: string; payload?: Record<string, unknown> }>();
    const payload = event.payload ?? {};
    const entryId = typeof payload.entry_id === "string" ? payload.entry_id : event.event_id;
    await env.A15_DB.prepare(
      "INSERT OR IGNORE INTO a15_cost_entries (entry_id, environment, client_id, provider, automation_id, service_period, source_type, external_record_id, currency, amount_minor, allocation_status, metadata_json, imported_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    ).bind(entryId, event.environment, event.client_id, typeof payload.provider === "string" ? payload.provider : "test", "A15", typeof payload.service_period === "string" ? payload.service_period : "2026-07", "test_fixture", typeof payload.external_record_id === "string" ? payload.external_record_id : entryId, typeof payload.currency === "string" ? payload.currency : "AUD", typeof payload.amount_minor === "number" ? payload.amount_minor : 0, "unallocated", "{}", new Date().toISOString()).run();
    return accepted;
  },
};
export default handler;
