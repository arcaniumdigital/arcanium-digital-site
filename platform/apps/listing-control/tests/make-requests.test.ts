import { describe, expect, it } from "vitest";
import {
  buildMakeSignedRequests,
  resolutionReason,
  type ListingActionResolution,
} from "../src/index";
import type { ReconciliationResult } from "../src/domain";

const request = {
  run_id: "run-a2-resolution-1",
  idempotency_key: "idem-a2-resolution-1",
  client_id: "TEST-0001",
  captured_at: "2026-07-27T00:00:00.000Z",
};

const result: ReconciliationResult = {
  accepted: true,
  status: "completed",
  errorCode: null,
  preserveLastKnownGood: false,
  inputCount: 1,
  acceptedCount: 1,
  events: [{ listingId: "L-100", eventType: "SOLD" }],
  counts: { new: 0, updated: 1, sold: 1, withdrawn: 0, deletedCandidates: 0 },
  operatorActions: [{
    actionId: "action:sold_evidence:L-100:fixture",
    dedupKey: "sold_evidence:L-100:fixture",
    listingId: "L-100",
    actionType: "sold_evidence",
    severity: "warning",
    reason: "Sold evidence requires approval",
    approvalRequired: true,
    ownerGroup: "content_approvers",
  }],
  overflowActionCount: 0,
};

const resolution: ListingActionResolution = {
  actionId: "action:removal_approval:L-200:fixture",
  dedupKey: "removal_approval:L-200:fixture",
  disposition: "superseded",
  reason: "Verified source snapshot contains the listing again",
  evidenceRef: "listing-control://run-a2-resolution-1/removal_approval:L-200:fixture",
};

describe("A2 compact Make requests", () => {
  it("groups operator actions into one signed result request", () => {
    const requests = buildMakeSignedRequests(request, result, []);
    expect(requests).toHaveLength(1);
    expect(requests[0].endpointPath).toBe("/v1/results");
    expect(JSON.parse(requests[0].eventBody)).toMatchObject({
      run_id: request.run_id,
      input_count: 1,
      accepted_count: 1,
      actions: [{
        action_id: result.operatorActions[0].actionId,
        mutation_kind: "none",
        approval_required: true,
      }],
      reconciliation: { expected_count: 1, observed_count: 1, balanced: true },
    });
  });

  it("creates a separate signed action-resolution request", () => {
    const requests = buildMakeSignedRequests(
      request,
      { ...result, operatorActions: [] },
      [resolution],
    );
    expect(requests).toHaveLength(1);
    expect(requests[0].endpointPath).toBe("/v1/action-resolutions");
    expect(JSON.parse(requests[0].eventBody)).toMatchObject({
      resolution_id: `resolution:${request.run_id}`,
      automation_id: "A2",
      resolutions: [{
        action_id: resolution.actionId,
        dedup_key: resolution.dedupKey,
        disposition: "superseded",
      }],
    });
  });

  it("emits no Make request when no task or resolution exists", () => {
    expect(buildMakeSignedRequests(
      request,
      { ...result, operatorActions: [] },
      [],
    )).toEqual([]);
  });
});

describe("A2 action-resolution rules", () => {
  const activeListing = {
    listingId: "L-100",
    lifecycle: "active" as const,
    address: "1 Test Street",
    canonicalUrl: "https://example.test/listings/l-100",
    soldPriceMinor: 75000000,
    imageUrls: ["https://images.example.test/l-100.jpg"],
    contentHash: "fixture",
    source: {},
  };

  it("supersedes sold evidence when a verified listing is no longer sold", () => {
    expect(resolutionReason(
      "sold_evidence",
      "Sold evidence requires approval",
      activeListing,
    )).toContain("no longer reports");
  });

  it("supersedes removal approval when the listing returns", () => {
    expect(resolutionReason(
      "removal_approval",
      "Source omission detected",
      activeListing,
    )).toContain("contains the listing again");
  });

  it("does not resolve a sold action while the listing remains sold", () => {
    expect(resolutionReason(
      "sold_evidence",
      "Sold evidence requires approval",
      { ...activeListing, lifecycle: "sold" },
    )).toBeNull();
  });
});
