#!/usr/bin/env node
import { verifyInngestDeployment } from "../lib/inngest-health.mjs";

const baseUrl = process.argv[2] || process.env.INNGEST_PROBE_BASE_URL || "https://www.arcaniumdigital.com";

try {
  const result = await verifyInngestDeployment(baseUrl);
  console.log(`Inngest deployment probe passed: ${result.functionCount} functions registered.`);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
