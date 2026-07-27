export interface ReviewRecord {
  review_id: string;
  location_id: string;
  rating: 1 | 2 | 3 | 4 | 5;
  comment: string;
  update_time: string;
  reviewer_display_name?: string;
}

export interface StoredReview {
  review_id: string;
  location_id: string;
  revision_hash: string;
  missing_full_scans: number;
  status: "active" | "pending_deletion_review" | "deleted";
}

export type ReviewSeverity = "routine" | "standard" | "urgent";

export interface GbpAction {
  action_type: "review_reply_approval" | "policy_review" | "manual_qanda" | "profile_review";
  location_id: string;
  review_id?: string;
  severity: ReviewSeverity;
  approval_required: boolean;
  safe_summary: string;
}

const urgentSignals = /\b(threat|lawyer|legal|police|fraud|scam|discriminat|racis|unsafe|injur|refund)\b/i;
const sensitiveSignals = /\b(health|medical|disab|personal data|privacy|child|minor|violence|threat|legal|lawyer)\b/i;

export function reviewRevisionHash(review: ReviewRecord): string {
  return [review.review_id, review.location_id, review.rating, review.comment.trim(), review.update_time].join("|");
}

export function deterministicSeverity(review: ReviewRecord): ReviewSeverity {
  if (review.rating <= 2 || urgentSignals.test(review.comment)) return "urgent";
  if (review.rating === 3) return "standard";
  return "routine";
}

export function isSubstantiveReview(review: ReviewRecord): boolean {
  return review.comment.trim().split(/\s+/).filter(Boolean).length >= 8;
}

export function replyPolicy(review: ReviewRecord): {
  template_only: boolean;
  llm_eligible: boolean;
  approval_required: boolean;
  severity: ReviewSeverity;
} {
  const severity = deterministicSeverity(review);
  const ratingOnly = review.comment.trim().length === 0;
  const sensitive = sensitiveSignals.test(review.comment);
  return {
    template_only: ratingOnly || !isSubstantiveReview(review),
    llm_eligible: isSubstantiveReview(review) && !sensitive,
    approval_required: severity !== "routine" || sensitive,
    severity,
  };
}

export function reconcileReviews(
  stored: StoredReview[],
  incoming: ReviewRecord[],
  scanComplete: boolean,
): { upserts: ReviewRecord[]; deletionCandidates: StoredReview[] } {
  const incomingById = new Map(incoming.map((review) => [review.review_id, review]));
  const existingById = new Map(stored.map((review) => [review.review_id, review]));
  const upserts = incoming.filter((review) => existingById.get(review.review_id)?.revision_hash !== reviewRevisionHash(review));
  const deletionCandidates = scanComplete
    ? stored.filter((review) => !incomingById.has(review.review_id) && review.status === "active" && review.missing_full_scans >= 1)
    : [];
  return { upserts, deletionCandidates };
}

export function nextMissingScanCount(existing: StoredReview, seenInCompleteScan: boolean): number {
  if (seenInCompleteScan) return 0;
  return existing.missing_full_scans + 1;
}

export function cappedActions(actions: GbpAction[], max = 25): { actions: GbpAction[]; overflow: number } {
  const safeMax = Math.max(0, Math.floor(max));
  return { actions: actions.slice(0, safeMax), overflow: Math.max(0, actions.length - safeMax) };
}

export function reviewAction(review: ReviewRecord): GbpAction {
  const policy = replyPolicy(review);
  return {
    action_type: policy.approval_required ? "review_reply_approval" : "policy_review",
    location_id: review.location_id,
    review_id: review.review_id,
    severity: policy.severity,
    approval_required: policy.approval_required,
    safe_summary: policy.template_only
      ? "Use an approved review-reply template; no LLM draft is eligible."
      : "Prepare a review reply for operator review; publication remains approval-gated.",
  };
}

export function canPublishReply(input: {
  approval_status: "approved" | "pending" | "rejected";
  approved_revision_hash: string;
  requested_revision_hash: string;
  requested_location_id: string;
  approved_location_id: string;
  allow_gbp_mutation: boolean;
}): { permitted: boolean; code?: string } {
  if (!input.allow_gbp_mutation) return { permitted: false, code: "GBP_MUTATION_DISABLED" };
  if (input.approval_status !== "approved") return { permitted: false, code: "APPROVAL_REQUIRED" };
  if (input.approved_revision_hash !== input.requested_revision_hash) return { permitted: false, code: "REVISION_MISMATCH" };
  if (input.approved_location_id !== input.requested_location_id) return { permitted: false, code: "LOCATION_MISMATCH" };
  return { permitted: true };
}
