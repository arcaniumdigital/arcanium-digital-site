import type { FunnelQueueMessage } from "./contracts";

type OutboxRow = { id: string; payload_json: string };

export async function publishOutbox(env: Cloudflare.Env, limit = 25): Promise<number> {
  const rows = await env.DB.prepare(
    "SELECT id, payload_json FROM outbox WHERE status = 'PENDING' ORDER BY created_at ASC LIMIT ?",
  ).bind(limit).all<OutboxRow>();
  let published = 0;
  for (const row of rows.results) {
    let payload: FunnelQueueMessage;
    try {
      payload = JSON.parse(row.payload_json) as FunnelQueueMessage;
      await env.FUNNEL_QUEUE.send(payload, { contentType: "json" });
      await env.DB.prepare(
        "UPDATE outbox SET status = 'PUBLISHED', published_at = ?, attempt_count = attempt_count + 1, last_error_code = NULL WHERE id = ? AND status = 'PENDING'",
      ).bind(new Date().toISOString(), row.id).run();
      published += 1;
    } catch {
      await env.DB.prepare(
        "UPDATE outbox SET attempt_count = attempt_count + 1, last_error_code = 'QUEUE_PUBLISH_FAILED' WHERE id = ?",
      ).bind(row.id).run();
    }
  }
  return published;
}

export function queueEnvelope(jobId: string, correlationId: string): string {
  return JSON.stringify({ schemaVersion: "2.0", jobId, correlationId } satisfies FunnelQueueMessage);
}
