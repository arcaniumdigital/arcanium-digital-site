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
  approvals: {
    websiteLaunchOwners: string[];
    contentOwners: string[];
    gbpOwners: string[];
    outreachOwners: string[];
    financialOwners: string[];
  };
}

export function validateClientConfig(config: ClientConfig): string[] {
  const errors: string[] = [];
  if (config.schemaVersion !== "1.0") errors.push("unsupported schemaVersion");
  if (!/^TEST-|^RE-/.test(config.clientId)) errors.push("invalid clientId");
  if (!config.website.canonicalDomain.startsWith("https://")) errors.push("canonicalDomain must use HTTPS");
  if (!config.entity.websiteOrigin.startsWith("https://")) errors.push("websiteOrigin must use HTTPS");
  if (config.environment === "production" && (config.communications.testEmails.length || config.communications.testPhones.length)) {
    errors.push("production config must not contain test recipients");
  }
  const serialized = JSON.stringify(config);
  if (/(api[_-]?key|secret|password|refresh[_-]?token)/i.test(serialized)) {
    errors.push("config contains a prohibited secret-like field");
  }
  return errors;
}
