import { describe, expect, it } from "vitest";
import type { LeadRow } from "../../workers/funnel/src/contracts";
import { internalNotificationParams } from "../../workers/funnel/src/notifications";

describe("internal lead notifications", () => {
  it("includes the lead name and callable phone without putting PII in the queued payload", () => {
    const lead = {
      public_id: "public_test",
      full_name: "Jordan Test Lead",
      first_name: "Jordan",
      phone_e164: "+61413105755",
      email: null,
      source_page: "https://www.arcaniumdigital.com/",
    } as LeadRow;

    expect(internalNotificationParams({
      lead,
      booking: null,
      bookingUid: null,
      notificationType: "new-lead",
    })).toMatchObject({
      fullName: "Jordan Test Lead",
      phone: "+61413105755",
      phoneE164: "+61413105755",
      notificationType: "new-lead",
    });
  });
});
