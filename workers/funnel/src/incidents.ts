import { opaqueId } from "./crypto";
import { publishOutbox, queueEnvelope } from "./outbox";

export async function openP1Incident(
  env: Cloudflare.Env,
  input: {
    key: string;
    component: string;
    summary: string;
    evidence?: Record<string, unknown>;
    notify?: boolean;
  },
): Promise<void> {
  const now = new Date().toISOString();
  const existing = await env.DB.prepare("SELECT status FROM funnel_incidents WHERE incident_key=?").bind(input.key).first<{ status: string }>();
  const newlyOpened = existing?.status !== "OPEN";
  await env.DB.prepare(`INSERT INTO funnel_incidents
    (id, incident_key, severity, component, status, summary, safe_evidence_json, first_seen_at, last_seen_at)
    VALUES (?, ?, 'P1', ?, 'OPEN', ?, ?, ?, ?)
    ON CONFLICT(incident_key) DO UPDATE SET status='OPEN', last_seen_at=excluded.last_seen_at,
      safe_evidence_json=excluded.safe_evidence_json`)
    .bind(opaqueId("incident"), input.key, input.component, input.summary, JSON.stringify(input.evidence ?? {}), now, now).run();
  if (newlyOpened) {
    await env.DB.prepare("INSERT INTO funnel_events (id,event_type,event_at,source,correlation_id,metadata_json) VALUES (?,'INCIDENT_OPENED',?,'monitoring',?,?)")
      .bind(opaqueId("event"), now, opaqueId("corr"), JSON.stringify({ incidentKey: input.key, component: input.component })).run();
  }

  if (!input.notify || !newlyOpened) return;
  const jobId = opaqueId("job");
  const inserted = await env.DB.prepare(`INSERT INTO provider_jobs
    (id, action_type, idempotency_key, safe_payload_json, created_at, updated_at)
    VALUES (?, 'BREVO_INTERNAL_EMAIL', ?, ?, ?, ?) ON CONFLICT(idempotency_key) DO NOTHING`)
    .bind(jobId, `incident:${input.key}:${now}`, JSON.stringify({
      notificationType: "incident",
      incidentKey: input.key,
      component: input.component,
      summary: input.summary,
    }), now, now).run();
  if (Number(inserted.meta.changes ?? 0) !== 1) return;
  await env.DB.prepare("INSERT INTO outbox (id,aggregate_type,aggregate_id,event_type,payload_json,created_at) VALUES (?,'incident',?,'QUEUE_JOB',?,?)")
    .bind(opaqueId("outbox"), input.key, queueEnvelope(jobId, opaqueId("corr")), now).run();
  await publishOutbox(env);
}

export async function resolveP1Incident(env: Cloudflare.Env, key: string): Promise<void> {
  const now = new Date().toISOString();
  const result = await env.DB.prepare("UPDATE funnel_incidents SET status='RESOLVED',resolved_at=?,last_seen_at=? WHERE incident_key=? AND status='OPEN'")
    .bind(now, now, key).run();
  if (Number(result.meta.changes ?? 0) !== 1) return;
  await env.DB.prepare("INSERT INTO funnel_events (id,event_type,event_at,source,correlation_id,metadata_json) VALUES (?,'INCIDENT_RESOLVED',?,'monitoring',?,?)")
    .bind(opaqueId("event"), now, opaqueId("corr"), JSON.stringify({ incidentKey: key })).run();
}
