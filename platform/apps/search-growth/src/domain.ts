export type OpportunityType = "ctr" | "decay" | "ownership_conflict" | "technical_review";
export interface AggregateMetric {
  family: string;
  target_page: string;
  current_clicks: number;
  previous_clicks: number;
  impressions: number;
  ctr: number;
  average_position: number;
  sufficient_days: boolean;
  ownership_conflict?: boolean;
  technical_issue?: boolean;
}
export interface SearchAction {
  action_type: OpportunityType;
  dedup_key: string;
  score: number;
  confidence: "low" | "medium" | "high";
  owner_class: "content" | "technical" | "approver";
  manual_review_required: true;
  evidence: { clicks_change: number; impressions: number; position_band: "1-3" | "4-10" | "11-20" | "other" };
  limitations: string[];
}
function band(position: number): SearchAction["evidence"]["position_band"] { if (position <= 3) return "1-3"; if (position <= 10) return "4-10"; if (position <= 20) return "11-20"; return "other"; }
function limitations(metric: AggregateMetric): string[] { return ["Aggregated Search Console metrics; average position is not causality.", ...(metric.sufficient_days ? [] : ["Insufficient date coverage; investigate before changing SEO."])]; }
export function candidateActions(metric: AggregateMetric): SearchAction[] {
  const change = metric.current_clicks - metric.previous_clicks;
  const common = { confidence: metric.sufficient_days ? "high" as const : "low" as const, manual_review_required: true as const, evidence: { clicks_change: change, impressions: metric.impressions, position_band: band(metric.average_position) }, limitations: limitations(metric) };
  const actions: SearchAction[] = [];
  if (metric.ownership_conflict) actions.push({ ...common, action_type: "ownership_conflict", owner_class: "approver", score: 95, dedup_key: `ownership:${metric.family}:${metric.target_page}` });
  if (metric.technical_issue) actions.push({ ...common, action_type: "technical_review", owner_class: "technical", score: 90, dedup_key: `technical:${metric.target_page}` });
  if (metric.sufficient_days && metric.impressions >= 100 && metric.average_position >= 4 && metric.average_position <= 20 && metric.ctr < 0.05) actions.push({ ...common, action_type: "ctr", owner_class: "content", score: Math.round(metric.impressions * (0.05 - metric.ctr)), dedup_key: `ctr:${metric.family}:${metric.target_page}` });
  if (metric.sufficient_days && metric.previous_clicks >= 10 && change <= -Math.max(5, Math.round(metric.previous_clicks * 0.2))) actions.push({ ...common, action_type: "decay", owner_class: "content", score: Math.abs(change) * 3, dedup_key: `decay:${metric.family}:${metric.target_page}` });
  return actions;
}
export function selectDiverseActions(metrics: AggregateMetric[], max = 5): SearchAction[] {
  const seen = new Set<string>();
  return metrics.flatMap(candidateActions).filter((action) => !seen.has(action.dedup_key) && (seen.add(action.dedup_key), true)).sort((a, b) => b.score - a.score).slice(0, max);
}
export function llmNarrativeEligible(mode: "weekly" | "monthly", enabled: boolean): boolean { return mode === "monthly" && enabled; }
export function parameterizedAggregateSql(): string { return "SELECT family, target_page, SUM(clicks) AS clicks FROM `project.dataset.searchdata_site_impression` WHERE data_date BETWEEN @start_date AND @end_date GROUP BY family, target_page"; }
