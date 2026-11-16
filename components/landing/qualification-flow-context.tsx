"use client";
import { createContext, useContext, useState, type ReactNode, type Dispatch, type SetStateAction } from "react";
import { initialQualificationAnswers, type QualificationAnswers } from "@/lib/qualification-form";
type Flow = { step: number; answers: QualificationAnswers; complete: boolean };
const FlowContext = createContext<{ flow: Flow; setFlow: Dispatch<SetStateAction<Flow>> } | null>(null);
export function QualificationFlowProvider({ children }: { children: ReactNode }) {
  // Answers remain in memory while navigating. CRM submission uses the server endpoint only when enabled.
  const [flow, setFlow] = useState<Flow>({ step: 0, answers: { ...initialQualificationAnswers }, complete: false });
  return <FlowContext.Provider value={{ flow, setFlow }}>{children}</FlowContext.Provider>;
}
export function useQualificationFlow() {
  const context = useContext(FlowContext);
  if (!context) throw new Error("Qualification flow provider is required");
  return context;
}
