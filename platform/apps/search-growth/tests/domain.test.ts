import { describe, expect, it } from "vitest";
import { candidateActions, llmNarrativeEligible, parameterizedAggregateSql, selectDiverseActions, type AggregateMetric } from "../src/domain";
const base: AggregateMetric = { family: "service automation", target_page: "/services/automation", current_clicks: 20, previous_clicks: 40, impressions: 1000, ctr: 0.02, average_position: 8, sufficient_days: true };
describe("A5 compact search-growth controls", () => {
  it("creates only final actions with evidence and limitations", () => { expect(candidateActions(base)).toEqual(expect.arrayContaining([expect.objectContaining({ action_type: "ctr", manual_review_required: true }), expect.objectContaining({ action_type: "decay" })])); });
  it("does not create trend actions when date coverage is insufficient", () => { expect(candidateActions({ ...base, sufficient_days: false })).toEqual([]); });
  it("prioritises ownership conflict without automatic changes", () => { expect(candidateActions({ ...base, ownership_conflict: true })[0]).toMatchObject({ action_type: "ownership_conflict", owner_class: "approver" }); });
  it("caps, deduplicates and diversifies final actions", () => { expect(selectDiverseActions(Array.from({ length: 8 }, (_, index) => ({ ...base, family: `family-${index}`, target_page: `/p-${index}` }))).length).toBe(5); });
  it("allows optional narrative only for enabled monthly runs", () => { expect(llmNarrativeEligible("weekly", true)).toBe(false); expect(llmNarrativeEligible("monthly", false)).toBe(false); expect(llmNarrativeEligible("monthly", true)).toBe(true); });
  it("uses a parameterised partition-filtered aggregate query", () => { expect(parameterizedAggregateSql()).toContain("data_date BETWEEN @start_date AND @end_date"); });
});
