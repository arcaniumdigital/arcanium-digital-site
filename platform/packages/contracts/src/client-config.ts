import type { AutomationId, Environment } from "./event";

export interface ClientConfig {
  schemaVersion: "1.0";
  environment: Environment;
  clientId: string;
  displayName: string;
  status: "onboarding" | "active" | "paused" | "offboarding";
  timezone: string;
  currency: string;
  entity: {
    agentName: string;
    agencyName?: string;
    brokerageName?: string;
    canonicalPhone?: string;
    canonicalEmail?: string;
    primaryAddress?: string;
    serviceAreas: string[];
    websiteOrigin: string;
    sameAs: string[];
  };
  website: {
    githubRepository?: string;
    vercelProjectId?: string;
    sanityProjectId?: string;
    sanityDataset?: string;
    canonicalDomain: string;
    previewOrigin?: string;
    sitemapUrl?: string;
    robotsUrl?: string;
    templateVersion?: string;
  };
  google: {
    searchConsoleProperty?: string;
    ga4PropertyId?: string;
    ga4BigQueryProject?: string;
    ga4BigQueryDataset?: string;
    searchConsoleBigQueryProject?: string;
    searchConsoleBigQueryDataset?: string;
    businessProfileAccountId?: string;
    businessProfileLocationIds: string[];
    pubsubTopic?: string;
  };
  search: {
    bingSiteId?: string;
    indexNowKeyRef?: string;
    targetTerms: string[];
    targetLocations: string[];
    competitorDomains: string[];
    pageOwnership: Array<{
      intent: string;
      ownerUrl: string;
      status: "active" | "planned" | "retired";
    }>;
  };
  listings: {
    sourceType?: "reaxml" | "rea_export" | "webhook" | "external_crm" | "manual";
    feedUrlRef?: string;
    credentialRef?: string;
    officeId?: string;
    agentId?: string;
  };
  communications: {
    operatorEmails: string[];
    approvalEmails: string[];
    testEmails: string[];
    testPhones: string[];
    resendSender?: string;
    clickSendSender?: string;
  };
  automation: {
    enabled: Partial<Record<AutomationId, boolean>>;
    schedules: Partial<Record<AutomationId, string>>;
    actionCaps: Partial<Record<AutomationId, number>>;
    providerBudgets: Record<string, {
      dailyMinor?: number;
      monthlyMinor?: number;
      currency: string;
    }>;
  };
  service: {
    packageId?: string;
    packageVersion?: string;
    entitlementRef?: string;
    contractValueSource?: string;
    renewalDate?: string;
  };
  externalCrm?: {
    enabled: boolean;
    inboundWebhookRef?: string;
    outboundWebhookRef?: string;
  };
  approvals: {
    websiteLaunchOwners: string[];
    contentOwners: string[];
    gbpOwners: string[];
    outreachOwners: string[];
    financialOwners: string[];
  };
}

const ROOT_KEYS = new Set([
  "schemaVersion", "environment", "clientId", "displayName", "status",
  "timezone", "currency", "entity", "website", "google", "search", "listings",
  "communications", "automation", "service", "externalCrm", "approvals",
]);

const SECTION_KEYS: Record<string, Set<string>> = {
  entity: new Set(["agentName", "agencyName", "brokerageName", "canonicalPhone", "canonicalEmail", "primaryAddress", "serviceAreas", "websiteOrigin", "sameAs"]),
  website: new Set(["githubRepository", "vercelProjectId", "sanityProjectId", "sanityDataset", "canonicalDomain", "previewOrigin", "sitemapUrl", "robotsUrl", "templateVersion"]),
  google: new Set(["searchConsoleProperty", "ga4PropertyId", "ga4BigQueryProject", "ga4BigQueryDataset", "searchConsoleBigQueryProject", "searchConsoleBigQueryDataset", "businessProfileAccountId", "businessProfileLocationIds", "pubsubTopic"]),
  search: new Set(["bingSiteId", "indexNowKeyRef", "targetTerms", "targetLocations", "competitorDomains", "pageOwnership"]),
  listings: new Set(["sourceType", "feedUrlRef", "credentialRef", "officeId", "agentId"]),
  communications: new Set(["operatorEmails", "approvalEmails", "testEmails", "testPhones", "resendSender", "clickSendSender"]),
  automation: new Set(["enabled", "schedules", "actionCaps", "providerBudgets"]),
  service: new Set(["packageId", "packageVersion", "entitlementRef", "contractValueSource", "renewalDate"]),
  externalCrm: new Set(["enabled", "inboundWebhookRef", "outboundWebhookRef"]),
  approvals: new Set(["websiteLaunchOwners", "contentOwners", "gbpOwners", "outreachOwners", "financialOwners"]),
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function rejectUnknownKeys(value: Record<string, unknown>, allowed: Set<string>, path: string, errors: string[]): void {
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) errors.push(`${path}.${key} is not allowed`);
  }
}

function isHttps(value: unknown): boolean {
  if (typeof value !== "string") return false;
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

export function validateClientConfigCandidate(input: unknown): string[] {
  const errors: string[] = [];
  if (!isRecord(input)) return ["config must be an object"];
  rejectUnknownKeys(input, ROOT_KEYS, "config", errors);
  for (const section of ["entity", "website", "google", "search", "listings", "communications", "automation", "service", "approvals"]) {
    if (!isRecord(input[section])) {
      errors.push(`${section} must be an object`);
    } else {
      rejectUnknownKeys(input[section], SECTION_KEYS[section], section, errors);
    }
  }
  if (input.externalCrm !== undefined) {
    if (!isRecord(input.externalCrm)) errors.push("externalCrm must be an object");
    else rejectUnknownKeys(input.externalCrm, SECTION_KEYS.externalCrm, "externalCrm", errors);
  }
  if (errors.some((error) => error.endsWith("must be an object"))) return errors;
  return [...errors, ...validateClientConfig(input as unknown as ClientConfig)];
}

export function validateClientConfig(config: ClientConfig): string[] {
  const errors: string[] = [];
  if (config.schemaVersion !== "1.0") errors.push("unsupported schemaVersion");
  if (!/^(TEST|RE)-[A-Z0-9-]+$/.test(config.clientId)) errors.push("invalid clientId");
  if (!isHttps(config.website.canonicalDomain)) errors.push("canonicalDomain must use HTTPS");
  if (!isHttps(config.entity.websiteOrigin)) errors.push("websiteOrigin must use HTTPS");
  for (const ownership of config.search.pageOwnership) {
    if (!isHttps(ownership.ownerUrl)) errors.push("pageOwnership ownerUrl must use HTTPS");
  }
  if (config.environment === "production" && (config.communications.testEmails.length || config.communications.testPhones.length)) {
    errors.push("production config must not contain test recipients");
  }
  if (config.environment === "production" && /test|preview|invalid/i.test(JSON.stringify(config.website))) {
    errors.push("production config must not reference test website resources");
  }
  for (const [provider, budget] of Object.entries(config.automation.providerBudgets)) {
    if ((budget.dailyMinor ?? 0) < 0 || (budget.monthlyMinor ?? 0) < 0) errors.push(`${provider} budget must be non-negative`);
    if (budget.dailyMinor !== undefined && budget.monthlyMinor !== undefined && budget.dailyMinor > budget.monthlyMinor) {
      errors.push(`${provider} daily budget exceeds monthly budget`);
    }
  }
  for (const [automationId, cap] of Object.entries(config.automation.actionCaps)) {
    if (!Number.isInteger(cap) || (cap ?? 0) < 0) errors.push(`${automationId} action cap must be a non-negative integer`);
  }
  const enabled = config.automation.enabled;
  if (enabled.A2 && !config.listings.sourceType) errors.push("A2 requires listings.sourceType");
  if ((enabled.A3 || enabled.A6 || enabled.A13) && !config.website.githubRepository) errors.push("A3/A6/A13 require website.githubRepository");
  if ((enabled.A3 || enabled.A6 || enabled.A13) && !config.website.vercelProjectId) errors.push("A3/A6/A13 require website.vercelProjectId");
  if ((enabled.A3 || enabled.A13) && (!config.website.sanityProjectId || !config.website.sanityDataset)) errors.push("A3/A13 require Sanity identifiers");
  if (enabled.A4 && (!config.google.businessProfileAccountId || config.google.businessProfileLocationIds.length === 0)) errors.push("A4 requires Business Profile identifiers");
  if ((enabled.A5 || enabled.A11) && (!config.google.searchConsoleProperty || !config.google.ga4PropertyId)) errors.push("A5/A11 require Search Console and GA4 identifiers");
  const serialized = JSON.stringify(config);
  if (/(api[_-]?key|secret|password|refresh[_-]?token)/i.test(serialized)) {
    errors.push("config contains a prohibited secret-like field");
  }
  return errors;
}
