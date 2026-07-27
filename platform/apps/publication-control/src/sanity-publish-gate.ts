import type { PreflightRequest } from "./domain";

export interface SanityPublicationProxyResult {
  passed: boolean;
  preflight_token_issued: boolean;
  publish_permitted: boolean;
  issue_codes: string[];
}

export interface SanityPublishGateOptions {
  proxyUrl: string;
  document: PreflightRequest;
  fetcher?: typeof fetch;
  publish: () => Promise<void>;
}

/**
 * Server-side gate used by a Sanity custom publish action.
 *
 * The Studio must call an authenticated same-origin proxy which adds the
 * publication-control HMAC headers. Never expose PREFLIGHT_HMAC_SECRET to the
 * browser or Sanity document. The publish callback is invoked only when the
 * proxy confirms deterministic validation, token issuance, token consumption,
 * and the environment's explicit publish permission.
 */
export async function publishWithSeoValidation(
  options: SanityPublishGateOptions,
): Promise<SanityPublicationProxyResult> {
  const fetcher = options.fetcher ?? fetch;
  const response = await fetcher(options.proxyUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(options.document),
  });
  if (!response.ok) throw new Error(`PUBLICATION_PROXY_${response.status}`);
  const candidate = await response.json() as Partial<SanityPublicationProxyResult>;
  const result: SanityPublicationProxyResult = {
    passed: candidate.passed === true,
    preflight_token_issued: candidate.preflight_token_issued === true,
    publish_permitted: candidate.publish_permitted === true,
    issue_codes: Array.isArray(candidate.issue_codes)
      ? candidate.issue_codes.filter((value): value is string => typeof value === "string")
      : [],
  };
  if (!result.passed || !result.preflight_token_issued) {
    throw new Error(`PUBLICATION_PREFLIGHT_BLOCKED:${result.issue_codes.join(",")}`);
  }
  if (!result.publish_permitted) throw new Error("PUBLICATION_PERMISSION_DISABLED");
  await options.publish();
  return result;
}

