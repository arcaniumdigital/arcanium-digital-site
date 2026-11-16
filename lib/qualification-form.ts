export const roleOptions = ["Residential Sales Agent", "Sales Team Leader", "Agency Principal", "Property Management Only", "Other"] as const;
export const appraisalOptions = ["0 to 2", "3 to 5", "6 to 10", "11+", "Not Sure"] as const;
export type QualificationAnswers = { region: string; role: string; appraisals: string; fullName: string; email: string; phone: string };
export const initialQualificationAnswers: QualificationAnswers = { region: "", role: "", appraisals: "", fullName: "", email: "", phone: "" };
export function isQualifyingRole(role: string): boolean { return roleOptions.slice(0, 3).some(option => option === role); }
export function isAustralianPhone(phone: string): boolean {
  const compact = phone.trim().replace(/[\s().-]/g, "").replace(/^(\+?61)0/, "$1");
  return /^(?:0|\+?61)[23478]\d{8}$/.test(compact);
}
export function qualificationError(step: number, answers: QualificationAnswers): string {
  switch (step) {
    case 0: return answers.region.trim().length >= 2 && answers.region.trim().length <= 200 ? "" : "Enter your suburbs or region.";
    case 1: return isQualifyingRole(answers.role) ? "" : "Choose an eligible residential sales role.";
    case 2: return appraisalOptions.some(option => option === answers.appraisals) ? "" : "Select your monthly appraisal volume.";
    case 3: return answers.fullName.trim().length >= 2 && answers.fullName.trim().length <= 120 && /\p{L}/u.test(answers.fullName) ? "" : "Enter your full name.";
    case 4: return answers.email.trim().length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(answers.email.trim()) ? "" : "Enter a valid email address.";
    case 5: return isAustralianPhone(answers.phone) ? "" : "Enter a valid Australian phone number, such as 0412 345 678 or +61 412 345 678.";
    default: return "Please complete the qualification questions.";
  }
}
export function isCompleteQualification(answers: QualificationAnswers): boolean { return Array.from({ length: 6 }, (_, step) => step).every(step => !qualificationError(step, answers)); }
