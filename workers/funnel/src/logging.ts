import type { SafeLog } from "./contracts";

export function log(entry: SafeLog): void {
  const output = JSON.stringify(entry);
  if (entry.severity === "error") console.error(output);
  else if (entry.severity === "warn") console.warn(output);
  else console.log(output);
}
