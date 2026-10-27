import {describe, expect, it} from "vitest";
import {readFileSync} from "node:fs";
import {buildPracticeEnquiry, demoScenarios, demoSuburbs} from "../../lib/seller-demo";

describe("isolated seller conversation demo", () => {
  it("offers only the two requested seller-intent options", () => {
    expect(demoScenarios.map(item => item.label)).toEqual(["Just curious", "Thinking of selling"]);
  });
  it.each(demoScenarios)("builds a clearly labelled $id enquiry without a live destination", scenario => {
    const message = buildPracticeEnquiry("Sam", demoSuburbs[0], scenario.id);
    expect(message).toContain("Demo enquiry only");
    expect(message).toContain(scenario.enquiry);
    expect(message).toContain("don't contact anyone or create a real booking");
    expect(message).not.toMatch(/https?:|\+61|@/);
  });
  it.each(["0400000000", "person@example.com", "<script>bad</script>", "", "A".repeat(31)])("rejects contact details or invalid practice name %s", name => {
    expect(() => buildPracticeEnquiry(name, "Castle Hill", "curious")).toThrow();
  });
  it("allows names with letters, spaces, apostrophes and hyphens", () => {
    expect(buildPracticeEnquiry("  Sam-Jane  ", "Castle Hill", "curious")).toContain("I'm Sam-Jane.");
  });
  it("rejects forged scenarios and a real address in place of an example suburb", () => {
    expect(() => buildPracticeEnquiry("Sam", "1 Real Street", "curious")).toThrow();
    expect(() => buildPracticeEnquiry("Sam", "Castle Hill", "send-sms")).toThrow();
  });
  it("embeds the dedicated one-question GHL survey and keeps production lead APIs out of demo code", () => {
    const client = readFileSync("components/seller-demo/seller-demo.tsx", "utf8");
    expect(client).not.toMatch(/\/api\/vendor-audit|arc-seller-lead|localStorage|sessionStorage|track\(/);
    expect(client).toContain("https://api.leadconnectorhq.com/widget/survey/9jZ5y1quM7WTPOVQ94ef");
    expect(client).toContain("Arcanium seller AI demo");
    expect(client).not.toContain("Continue by SMS");
  });
  it("keeps the demonstration out of indexing and conversion events", () => {
    const page = readFileSync("app/seller-demo/page.tsx", "utf8");
    expect(page).toContain("index: false");
    expect(page).toContain("follow: false");
    expect(page).toContain("isolated seller enquiry demonstration");
    expect(page).not.toContain("Kael");
  });
  it("keeps demo actions disabled in the prompt and explains scenario changes honestly", () => {
    const prompt = readFileSync("demo/seller-assistant-prompt.txt", "utf8");
    expect(prompt).toContain("You have NO actions");
    expect(prompt).toContain("ALREADY introduced");
    expect(prompt).toContain("starts a NEW fictional scenario");
    expect(prompt).toContain("Do not claim earlier GHL chat history was erased");
    expect(prompt).toContain("No real appointment has been booked");
  });
  it("uses complete factual answers rather than inferring unsupported service restrictions", () => {
    const prompt = readFileSync("demo/seller-assistant-prompt.txt", "utf8");
    expect(prompt).toContain("FIXED FACTUAL ANSWERS");
    expect(prompt).toContain("Do not append a closing sentence or question");
    expect(prompt).toContain("a claim that remote estimates are impossible");
  });
  it("keeps the page copy short and delegates contact collection to GHL", () => {
    const client = readFileSync("components/seller-demo/seller-demo.tsx", "utf8");
    const page = readFileSync("app/seller-demo/page.tsx", "utf8");
    expect(client).not.toContain('fetch("/api/seller-demo"');
    expect(page).toContain("Try the AI setter");
    expect(page).toContain("Use your own mobile and fictional property details");
    expect(page).not.toContain("Continue by SMS");
  });
});
