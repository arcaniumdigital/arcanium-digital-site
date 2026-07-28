import { describe, expect, it } from "vitest";
import {
  canPublishReply,
  cappedActions,
  deterministicSeverity,
  nextMissingScanCount,
  reconcileReviews,
  replyPolicy,
  reviewAction,
  reviewRevisionHash,
  type ReviewRecord,
} from "../src/domain";

const base: ReviewRecord = {
  review_id: "review-1", location_id: "locations/abc", rating: 5,
  comment: "The team were prompt, clear and helpful throughout the entire process.",
  update_time: "2026-07-27T00:00:00.000Z",
};

describe("A4 deterministic review controls", () => {
  it("uses stable IDs and revision hashes without raw contact data", () => {
    expect(reviewRevisionHash(base)).toContain("review-1|locations/abc|5");
  });

  it("classifies urgency without using an LLM", () => {
    expect(deterministicSeverity({ ...base, rating: 1 })).toBe("urgent");
    expect(deterministicSeverity({ ...base, rating: 5, comment: "I will contact a lawyer about this service." })).toBe("urgent");
    expect(deterministicSeverity({ ...base, rating: 3 })).toBe("standard");
    expect(deterministicSeverity(base)).toBe("routine");
  });

  it("keeps rating-only reviews template-first with no LLM eligibility", () => {
    expect(replyPolicy({ ...base, comment: "" })).toMatchObject({ template_only: true, llm_eligible: false });
  });

  it("requires approval for negative and sensitive review replies", () => {
    expect(replyPolicy({ ...base, rating: 2 })).toMatchObject({ approval_required: true, severity: "urgent" });
    expect(replyPolicy({ ...base, comment: "My medical information was discussed in public." })).toMatchObject({ approval_required: true, llm_eligible: false });
  });

  it("does not create false deletion candidates for an incomplete page scan", () => {
    const stored = [{ review_id: "review-old", location_id: base.location_id, revision_hash: "old", missing_full_scans: 4, status: "active" as const }];
    expect(reconcileReviews(stored, [base], false).deletionCandidates).toEqual([]);
  });

  it("requires two complete scan misses before a deletion review", () => {
    const stored = [{ review_id: "review-old", location_id: base.location_id, revision_hash: "old", missing_full_scans: 1, status: "active" as const }];
    expect(reconcileReviews(stored, [base], true).deletionCandidates).toHaveLength(1);
    expect(nextMissingScanCount(stored[0], false)).toBe(2);
    expect(nextMissingScanCount(stored[0], true)).toBe(0);
  });

  it("caps Make action batches at 25 and leaves overflow for the Worker", () => {
    const actions = Array.from({ length: 27 }, () => reviewAction(base));
    expect(cappedActions(actions)).toEqual(expect.objectContaining({ overflow: 2 }));
    expect(cappedActions(actions).actions).toHaveLength(25);
  });

  it("never permits a reply while the global mutation flag is false", () => {
    expect(canPublishReply({ approval_status: "approved", approved_revision_hash: "x", requested_revision_hash: "x", approved_location_id: base.location_id, requested_location_id: base.location_id, allow_gbp_mutation: false })).toEqual({ permitted: false, code: "GBP_MUTATION_DISABLED" });
  });

  it("binds any future publish to approved revision and location", () => {
    const approved = { approval_status: "approved" as const, approved_revision_hash: "x", requested_revision_hash: "x", approved_location_id: base.location_id, requested_location_id: base.location_id, allow_gbp_mutation: true };
    expect(canPublishReply(approved)).toEqual({ permitted: true });
    expect(canPublishReply({ ...approved, requested_location_id: "locations/other" })).toMatchObject({ permitted: false, code: "LOCATION_MISMATCH" });
    expect(canPublishReply({ ...approved, requested_revision_hash: "changed" })).toMatchObject({ permitted: false, code: "REVISION_MISMATCH" });
  });
});
