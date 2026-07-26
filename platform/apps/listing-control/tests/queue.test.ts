import { afterEach, describe, expect, it, vi } from "vitest";
import worker, { type Env } from "../src/index";

function createQueueHarness(allowMakeDispatch: "true" | "false") {
  const run = vi.fn().mockResolvedValue({ meta: { changes: 1 } });
  const bind = vi.fn((..._values: unknown[]) => ({ run }));
  const prepare = vi.fn(() => ({ bind }));
  const ack = vi.fn();
  const retry = vi.fn();
  const env = {
    ALLOW_MAKE_DISPATCH: allowMakeDispatch,
    ENVIRONMENT: "test",
    LISTING_DB: { prepare },
  } as unknown as Env;
  const batch = {
    messages: [{
      id: "queue-message-1",
      attempts: 1,
      body: {
        client_id: "TEST-0001",
        feed_id: "fixture-feed",
        run_id: "fixture-run",
        event_type: "listing.sync_batch",
      },
      ack,
      retry,
    }],
  } as unknown as MessageBatch;
  return { ack, batch, bind, env, retry };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("A2 queue-to-Make safety gate", () => {
  it("holds and acknowledges durable operator work while dispatch is disabled", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const harness = createQueueHarness("false");

    await worker.queue(harness.batch, harness.env);

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(harness.bind.mock.calls[0][7]).toBe("held_for_operator_workflow");
    expect(harness.bind.mock.calls[0][8]).toBeNull();
    expect(harness.ack).toHaveBeenCalledOnce();
    expect(harness.retry).not.toHaveBeenCalled();
  });

  it("fails closed and retries when dispatch is enabled without an endpoint", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const harness = createQueueHarness("true");

    await worker.queue(harness.batch, harness.env);

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(harness.bind.mock.calls[0][7]).toBe("delivery_blocked_missing_endpoint");
    expect(harness.bind.mock.calls[0][8]).toBe("MAKE_ENDPOINT_NOT_CONFIGURED");
    expect(harness.ack).not.toHaveBeenCalled();
    expect(harness.retry).toHaveBeenCalledOnce();
  });
});
