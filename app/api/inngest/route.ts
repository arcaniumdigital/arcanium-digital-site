import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { funnelFunctions } from "@/inngest/functions";
import {
  createInngestDeploymentProbeResponse,
  isInngestDeploymentProbe,
} from "@/lib/inngest-health.mjs";

export const maxDuration = 300;

const handlers = serve({
  client: inngest,
  functions: funnelFunctions,
  streaming: true,
});

export const { POST, PUT } = handlers;

export function GET(...args: Parameters<typeof handlers.GET>) {
  const [request] = args;
  if (isInngestDeploymentProbe(request)) {
    return createInngestDeploymentProbeResponse(funnelFunctions.length);
  }

  return handlers.GET(...args);
}
