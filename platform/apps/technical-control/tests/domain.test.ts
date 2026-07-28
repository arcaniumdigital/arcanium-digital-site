import { describe, expect, it } from "vitest";
import { canCloseIssue, canRollback, groupFindings } from "../src/domain";
describe("A6 technical controls", () => {
 it("groups findings and limits Make actions",()=>expect(groupFindings(Array.from({length:25},(_,i)=>({kind:"crawl" as const,cluster:`template-${i}`,affected_count:1,severity:"warning" as const,persistent_runs:1}))).length).toBe(20));
 it("requires approval for redirect/canonical/security/rollback decisions",()=>expect(groupFindings([{kind:"crawl",cluster:"canonical-conflict",affected_count:2,severity:"critical",persistent_runs:1}])[0]).toMatchObject({approval_required:true,owner:"approver"}));
 it("requires persistence for performance tasks",()=>expect(groupFindings([{kind:"performance",cluster:"lcp",affected_count:1,severity:"warning",persistent_runs:1}])).toEqual([]));
 it("blocks rollback except approved reversible critical production failures",()=>{expect(canRollback({policy_approved:false,environment:"production",reversible:true,severity:"critical"})).toBe(false);expect(canRollback({policy_approved:true,environment:"production",reversible:true,severity:"critical"})).toBe(true);});
 it("requires a clean verification before closure",()=>{expect(canCloseIssue(false)).toBe(false);expect(canCloseIssue(true)).toBe(true);});
});
