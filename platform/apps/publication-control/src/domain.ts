export type PublicationAction = "publish" | "unpublish";
export type PageType =
  | "area"
  | "service"
  | "appraisal"
  | "market_report"
  | "campaign_case_study"
  | "technical";

export interface PreflightRequest {
  schema_version: "1.0";
  request_id: string;
  idempotency_key: string;
  correlation_id: string;
  client_id: string;
  environment: "test" | "production";
  document_id: string;
  revision_id: string;
  action: PublicationAction;
  url: string;
  slug: string;
  page_type: PageType;
  ownership_key: string;
  title: string;
  meta_description: string;
  h1: string;
  body_word_count: number;
  schema_types: string[];
  image_count: number;
  cta_count: number;
  approval_id?: string;
  established_page: boolean;
  material_change: boolean;
}

export interface ValidationIssue {
  code: string;
  severity: "warning" | "error";
  field: string | null;
  safe_summary: string;
  approval_required: boolean;
}

export interface OperatorAction {
  action_type:
    | "approval"
    | "content_evidence"
    | "internal_link"
    | "unpublish_disposition"
    | "performance_review";
  owner_group: "content" | "operations" | "approvers";
  approval_required: boolean;
  safe_summary: string;
}

export interface PreflightResult {
  passed: boolean;
  issues: ValidationIssue[];
  operator_actions: OperatorAction[];
  overflow_action_count: number;
  llm_review_eligible: boolean;
}

export interface LiveHtmlResult {
  passed: boolean;
  title_present: boolean;
  single_h1: boolean;
  canonical_origin: string | null;
  canonical_matches: boolean;
  json_ld_present: boolean;
  image_count: number;
  images_with_alt: number;
  cta_present: boolean;
  issues: ValidationIssue[];
}

export interface PublicationResultRequest {
  schema_version: "1.0";
  publication_id: string;
  idempotency_key: string;
  correlation_id: string;
  client_id: string;
  environment: "test" | "production";
  document_id: string;
  revision_id: string;
  action: PublicationAction;
  url: string;
  page_type: PageType;
  ownership_key: string;
  status: "validation_failed" | "validated_test" | "live_verification_failed" | "live_verified_test";
  deterministic_passed: boolean;
  live_verified: boolean;
  issues: ValidationIssue[];
  operator_actions: OperatorAction[];
  overflow_action_count: number;
  evidence_ref?: string;
}

const pageTypes = new Set<PageType>([
  "area",
  "service",
  "appraisal",
  "market_report",
  "campaign_case_study",
  "technical",
]);
const forbiddenPlaceholders = /\b(lorem ipsum|demo content|placeholder|coming soon|insert (copy|text)|test page)\b/i;
const sensitiveSchema = new Set(["Review", "AggregateRating", "ClaimReview"]);
const allowedSchema = new Set([
  "WebPage",
  "AboutPage",
  "ContactPage",
  "Service",
  "LocalBusiness",
  "RealEstateAgent",
  "Article",
  "FAQPage",
  "BreadcrumbList",
  "Review",
  "AggregateRating",
  "ClaimReview",
]);

export function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isString(value: unknown, max = 512): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= max;
}

export function safePublicationUrl(value: unknown, hosts: Set<string>): URL | null {
  if (!isString(value, 2048)) return null;
  try {
    const url = new URL(value);
    if (
      url.protocol !== "https:"
      || url.username
      || url.password
      || (url.port && url.port !== "443")
      || !hosts.has(url.hostname.toLowerCase())
      || url.hash
    ) {
      return null;
    }
    return url;
  } catch {
    return null;
  }
}

export function parsePreflightRequest(candidate: unknown): PreflightRequest | string {
  if (!isRecord(candidate)) return "INVALID_PREFLIGHT";
  const requiredStrings = [
    "request_id",
    "idempotency_key",
    "correlation_id",
    "client_id",
    "document_id",
    "revision_id",
    "url",
    "slug",
    "ownership_key",
    "title",
    "meta_description",
    "h1",
  ];
  if (requiredStrings.some((field) => !isString(candidate[field]))) return "INVALID_PREFLIGHT";
  if (candidate.schema_version !== "1.0") return "INVALID_SCHEMA_VERSION";
  if (candidate.environment !== "test" && candidate.environment !== "production") {
    return "INVALID_ENVIRONMENT";
  }
  if (candidate.action !== "publish" && candidate.action !== "unpublish") return "INVALID_ACTION";
  if (!pageTypes.has(candidate.page_type as PageType)) return "INVALID_PAGE_TYPE";
  if (!Number.isInteger(candidate.body_word_count) || (candidate.body_word_count as number) < 0) {
    return "INVALID_BODY_WORD_COUNT";
  }
  if (!Number.isInteger(candidate.image_count) || (candidate.image_count as number) < 0) {
    return "INVALID_IMAGE_COUNT";
  }
  if (!Number.isInteger(candidate.cta_count) || (candidate.cta_count as number) < 0) {
    return "INVALID_CTA_COUNT";
  }
  if (
    !Array.isArray(candidate.schema_types)
    || candidate.schema_types.length > 20
    || candidate.schema_types.some((value) => !isString(value, 80))
  ) {
    return "INVALID_SCHEMA_TYPES";
  }
  if (typeof candidate.established_page !== "boolean" || typeof candidate.material_change !== "boolean") {
    return "INVALID_PREFLIGHT_FLAGS";
  }
  if (candidate.approval_id !== undefined && !isString(candidate.approval_id)) {
    return "INVALID_APPROVAL_ID";
  }
  return candidate as unknown as PreflightRequest;
}

export function parsePublicationResult(candidate: unknown): PublicationResultRequest | string {
  if (!isRecord(candidate)) return "INVALID_PUBLICATION_RESULT";
  const requiredStrings = [
    "publication_id",
    "idempotency_key",
    "correlation_id",
    "client_id",
    "document_id",
    "revision_id",
    "url",
    "ownership_key",
    "status",
  ];
  if (requiredStrings.some((field) => !isString(candidate[field]))) return "INVALID_PUBLICATION_RESULT";
  if (candidate.schema_version !== "1.0") return "INVALID_SCHEMA_VERSION";
  if (candidate.environment !== "test" && candidate.environment !== "production") return "INVALID_ENVIRONMENT";
  if (candidate.action !== "publish" && candidate.action !== "unpublish") return "INVALID_ACTION";
  if (!pageTypes.has(candidate.page_type as PageType)) return "INVALID_PAGE_TYPE";
  const statuses = new Set([
    "validation_failed",
    "validated_test",
    "live_verification_failed",
    "live_verified_test",
  ]);
  if (!statuses.has(candidate.status as string)) return "INVALID_PUBLICATION_STATUS";
  if (typeof candidate.deterministic_passed !== "boolean" || typeof candidate.live_verified !== "boolean") {
    return "INVALID_PUBLICATION_FLAGS";
  }
  if (!Number.isInteger(candidate.overflow_action_count) || (candidate.overflow_action_count as number) < 0) {
    return "INVALID_OVERFLOW_COUNT";
  }
  if (!Array.isArray(candidate.issues) || candidate.issues.length > 50) return "INVALID_ISSUES";
  for (const value of candidate.issues) {
    if (
      !isRecord(value)
      || !isString(value.code, 120)
      || (value.severity !== "warning" && value.severity !== "error")
      || (value.field !== null && value.field !== undefined && !isString(value.field, 120))
      || !isString(value.safe_summary, 1000)
      || typeof value.approval_required !== "boolean"
    ) {
      return "INVALID_ISSUES";
    }
  }
  if (!Array.isArray(candidate.operator_actions) || candidate.operator_actions.length > 50) {
    return "INVALID_OPERATOR_ACTIONS";
  }
  const actionTypes = new Set([
    "approval",
    "content_evidence",
    "internal_link",
    "unpublish_disposition",
    "performance_review",
  ]);
  const ownerGroups = new Set(["content", "operations", "approvers"]);
  for (const value of candidate.operator_actions) {
    if (
      !isRecord(value)
      || !actionTypes.has(value.action_type as string)
      || !ownerGroups.has(value.owner_group as string)
      || typeof value.approval_required !== "boolean"
      || !isString(value.safe_summary, 1000)
    ) {
      return "INVALID_OPERATOR_ACTIONS";
    }
  }
  if (candidate.evidence_ref !== undefined && !isString(candidate.evidence_ref, 2048)) {
    return "INVALID_EVIDENCE_REF";
  }
  return candidate as unknown as PublicationResultRequest;
}

function issue(
  code: string,
  field: string | null,
  safeSummary: string,
  approvalRequired = false,
  severity: ValidationIssue["severity"] = "error",
): ValidationIssue {
  return {
    code,
    severity,
    field,
    safe_summary: safeSummary,
    approval_required: approvalRequired,
  };
}

export function validatePreflight(
  request: PreflightRequest,
  options: { allowedHosts: Set<string>; maxOperatorActions: number },
): PreflightResult {
  const issues: ValidationIssue[] = [];
  const url = safePublicationUrl(request.url, options.allowedHosts);
  if (!url) issues.push(issue("URL_NOT_ALLOWED", "url", "Publication URL is outside the approved HTTPS hosts."));
  const expectedSlug = url?.pathname.replace(/^\/|\/$/g, "") ?? "";
  const normalizedSlug = request.slug.replace(/^\/|\/$/g, "");
  if (!normalizedSlug || normalizedSlug !== expectedSlug) {
    issues.push(issue("SLUG_URL_MISMATCH", "slug", "Slug does not match the publication URL path."));
  }
  if (request.title.length < 15 || request.title.length > 70) {
    issues.push(issue("INVALID_TITLE_LENGTH", "title", "Title must be between 15 and 70 characters."));
  }
  if (request.meta_description.length < 50 || request.meta_description.length > 170) {
    issues.push(issue(
      "INVALID_META_DESCRIPTION_LENGTH",
      "meta_description",
      "Meta description must be between 50 and 170 characters.",
    ));
  }
  if (request.h1.length < 5 || request.h1.length > 120) {
    issues.push(issue("INVALID_H1_LENGTH", "h1", "H1 must be between 5 and 120 characters."));
  }
  if (forbiddenPlaceholders.test(`${request.title} ${request.meta_description} ${request.h1}`)) {
    issues.push(issue("DEMO_CONTENT_DETECTED", null, "Placeholder or demo content was detected."));
  }
  if (request.action === "publish" && request.page_type !== "technical" && request.body_word_count < 250) {
    issues.push(issue("THIN_CONTENT", "body_word_count", "Substantive pages require at least 250 words."));
  }
  if (request.action === "publish" && request.image_count < 1 && request.page_type !== "technical") {
    issues.push(issue("IMAGE_REQUIRED", "image_count", "Substantive pages require at least one image."));
  }
  if (request.action === "publish" && request.cta_count < 1 && request.page_type !== "technical") {
    issues.push(issue("CTA_REQUIRED", "cta_count", "Substantive pages require at least one CTA."));
  }
  for (const schemaType of request.schema_types) {
    if (!allowedSchema.has(schemaType)) {
      issues.push(issue("SCHEMA_TYPE_NOT_ALLOWED", "schema_types", "An unsupported schema type was requested."));
    } else if (sensitiveSchema.has(schemaType) && !request.approval_id) {
      issues.push(issue(
        "SENSITIVE_SCHEMA_APPROVAL_REQUIRED",
        "schema_types",
        "Proof-bearing schema requires an approval reference.",
        true,
      ));
    }
  }
  if (request.action === "unpublish" && request.established_page && !request.approval_id) {
    issues.push(issue(
      "UNPUBLISH_APPROVAL_REQUIRED",
      "approval_id",
      "Established-page unpublishing requires an approved disposition.",
      true,
    ));
  }

  const actions: OperatorAction[] = [];
  for (const validationIssue of issues) {
    actions.push({
      action_type: validationIssue.approval_required ? "approval" : "content_evidence",
      owner_group: validationIssue.approval_required ? "approvers" : "content",
      approval_required: validationIssue.approval_required,
      safe_summary: validationIssue.safe_summary,
    });
  }
  if (request.action === "publish" && request.material_change) {
    for (const day of [14, 30, 60, 90]) {
      actions.push({
        action_type: "performance_review",
        owner_group: "operations",
        approval_required: false,
        safe_summary: `Review publication performance after ${day} days.`,
      });
    }
  }
  const cap = Math.max(0, Math.floor(options.maxOperatorActions));
  const limitedActions = actions.slice(0, cap);
  return {
    passed: !issues.some((value) => value.severity === "error"),
    issues,
    operator_actions: limitedActions,
    overflow_action_count: Math.max(0, actions.length - limitedActions.length),
    llm_review_eligible: request.material_change
      && request.action === "publish"
      && request.page_type !== "technical"
      && issues.length === 0,
  };
}

function firstMatch(html: string, expression: RegExp): string | null {
  const match = expression.exec(html);
  return match?.[1]?.trim() ?? null;
}

export function analyzeLiveHtml(
  html: string,
  pageUrl: URL,
  expectedCanonicalOrigin: string,
): LiveHtmlResult {
  const title = firstMatch(html, /<title\b[^>]*>([\s\S]*?)<\/title>/i);
  const h1Matches = html.match(/<h1\b[^>]*>[\s\S]*?<\/h1>/gi) ?? [];
  const canonical = firstMatch(
    html,
    /<link\b(?=[^>]*\brel=["'][^"']*\bcanonical\b[^"']*["'])(?=[^>]*\bhref=["']([^"']+)["'])[^>]*>/i,
  );
  let canonicalOrigin: string | null = null;
  try {
    if (canonical) canonicalOrigin = new URL(canonical, pageUrl).origin;
  } catch {
    canonicalOrigin = null;
  }
  const jsonLdPresent = /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/i.test(html);
  const imageMatches = html.match(/<img\b[^>]*>/gi) ?? [];
  const imagesWithAlt = imageMatches.filter((tag) => /\balt=["'][^"']+["']/i.test(tag)).length;
  const ctaPresent = /<(a|button)\b[^>]*(data-cta|href=["'](?:tel:|mailto:|\/contact|\/book|\/appraisal))/i.test(html);
  const issues: ValidationIssue[] = [];
  if (!title) issues.push(issue("LIVE_TITLE_MISSING", "title", "The live page has no server-rendered title."));
  if (h1Matches.length !== 1) {
    issues.push(issue("LIVE_H1_COUNT_INVALID", "h1", "The live page must contain exactly one H1."));
  }
  if (canonicalOrigin !== expectedCanonicalOrigin) {
    issues.push(issue("LIVE_CANONICAL_MISMATCH", "canonical", "The live canonical origin does not match."));
  }
  if (!jsonLdPresent) issues.push(issue("LIVE_JSON_LD_MISSING", "schema", "The live page has no JSON-LD."));
  if (imageMatches.length > imagesWithAlt) {
    issues.push(issue("LIVE_IMAGE_ALT_MISSING", "images", "One or more live images have no alt text."));
  }
  if (!ctaPresent) issues.push(issue("LIVE_CTA_MISSING", "cta", "The live page has no recognised CTA."));
  return {
    passed: issues.length === 0,
    title_present: Boolean(title),
    single_h1: h1Matches.length === 1,
    canonical_origin: canonicalOrigin,
    canonical_matches: canonicalOrigin === expectedCanonicalOrigin,
    json_ld_present: jsonLdPresent,
    image_count: imageMatches.length,
    images_with_alt: imagesWithAlt,
    cta_present: ctaPresent,
    issues,
  };
}
