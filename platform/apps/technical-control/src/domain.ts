export type TechnicalKind = "deployment" | "crawl" | "incident" | "performance";
export interface Finding { kind: TechnicalKind; cluster: string; affected_count: number; severity: "info" | "warning" | "critical"; representative_url?: string; persistent_runs: number; }
export interface TechnicalAction { dedup_key: string; kind: TechnicalKind; severity: Finding["severity"]; approval_required: boolean; owner: "technical" | "approver"; manual_review_required: true; safe_summary: string; }
const approvalClusters = /redirect|canonical|removal|security|rollback/i;
export function groupFindings(findings: Finding[], max = 20): TechnicalAction[] {
  const groups = new Map<string, Finding>();
  for (const finding of findings) { const key = `${finding.kind}:${finding.cluster}`; const prior = groups.get(key); if (!prior || finding.severity === "critical") groups.set(key, finding); }
  return [...groups.values()].filter((finding) => finding.kind !== "performance" || finding.persistent_runs >= 2).sort((a,b) => (a.severity === "critical" ? -1 : 0) - (b.severity === "critical" ? -1 : 0)).slice(0,max).map((finding) => {
    const approval_required = approvalClusters.test(finding.cluster);
    return { dedup_key: `${finding.kind}:${finding.cluster}`, kind: finding.kind, severity: finding.severity, approval_required, owner: approval_required ? "approver" : "technical", manual_review_required: true, safe_summary: `${finding.kind} issue cluster ${finding.cluster}; ${finding.affected_count} affected item(s).` };
  });
}
export function canRollback(input: { policy_approved: boolean; environment: "test" | "production"; reversible: boolean; severity: Finding["severity"] }): boolean { return input.environment === "production" && input.policy_approved && input.reversible && input.severity === "critical"; }
export function canCloseIssue(verificationPassed: boolean): boolean { return verificationPassed; }
