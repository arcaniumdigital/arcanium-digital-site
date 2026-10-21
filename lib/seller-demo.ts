// Browser-only practice data. Never import a production lead client here.
export const demoScenarios = [
  {id: "curious", label: "Just curious", description: "See how the assistant helps someone who isn't selling yet.", enquiry: "I'm not looking to sell right now, just curious what my property might be worth."},
  {id: "selling", label: "Thinking of selling", description: "Try a conversation about a move in the next few months.", enquiry: "I'm thinking of selling in the next three months. How would an appraisal help?"},
  {id: "appraisal", label: "Ready for an appraisal", description: "Skip the qualification questions and explore the next step.", enquiry: "I'd like an appraisal. What would the next step be?"},
  {id: "objection", label: "Not ready to commit", description: "Try a realistic objection, then take the conversation anywhere.", enquiry: "I'd like to know the value, but I don't want to commit to selling or have an agent pressure me."},
] as const;

export type DemoScenario = (typeof demoScenarios)[number]["id"];
export const demoSuburbs = ["Castle Hill", "Kellyville", "Beaumont Hills", "The Ponds"] as const;

export function buildPracticeEnquiry(name: string, suburb: string, scenario: string): string {
  const practiceName = name.trim().replace(/\s+/g, " ");
  if (!/^[\p{L} '-]{1,30}$/u.test(practiceName)) {
    throw new Error("Use a practice first name of up to 30 letters, not contact details.");
  }
  if (!(demoSuburbs as readonly string[]).includes(suburb)) throw new Error("Choose an example suburb.");
  const selected = demoScenarios.find(item => item.id === scenario);
  if (!selected) throw new Error("Choose a conversation to try.");
  return `Demo enquiry only. Hi, I'm ${practiceName}. My example property is in ${suburb}. ${selected.enquiry} Please use demonstration options only; don't contact anyone or create a real booking.`;
}
