import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const mode = process.argv[2];
if (mode !== "check" && mode !== "test") throw new Error("Use check or test.");

const controls = [
  "gbp-control", "search-growth", "technical-control", "local-geo-control",
  "enquiry-control", "evidence-control", "authority-control", "reporting-control",
  "provisioning-control", "experimentation-control", "financial-control",
];
const executable = process.execPath;
const runner = mode === "check"
  ? resolve("platform/apps/platform-core/node_modules/typescript/bin/tsc")
  : resolve("platform/apps/platform-core/node_modules/vitest/vitest.mjs");

for (const control of controls) {
  const root = resolve("platform/apps", control);
  const args = mode === "check"
    ? [runner, "--project", resolve(root, "tsconfig.json")]
    : [runner, "run", "--root", root];
  const result = spawnSync(executable, args, { stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
