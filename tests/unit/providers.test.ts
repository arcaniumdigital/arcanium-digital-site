import { afterEach, describe, expect, it, vi } from "vitest";
import { updateBrevoBooking } from "../../workers/funnel/src/providers";

afterEach(() => vi.unstubAllGlobals());

describe("Brevo booking sync", () => {
  it("keeps CRM booking data moving when the attendee email belongs to another contact", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ code: "duplicate_parameter" }), { status: 400 }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);

    await updateBrevoBooking({ BREVO_API_KEY: "test" } as Cloudflare.Env, {
      contactId: "4",
      dealId: "deal_1",
      publicId: "public_1",
      email: "duplicate@example.com",
      bookingState: "BOOKED",
      bookingUid: "booking_1",
      appointmentStart: "2026-08-12T02:00:00.000Z",
      appointmentTimezone: "Australia/Brisbane",
      stageId: "stage_booked",
    });

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toHaveProperty("email", "duplicate@example.com");
    expect(JSON.parse(String(fetchMock.mock.calls[1][1]?.body))).not.toHaveProperty("email");
    expect(fetchMock.mock.calls[2][0]).toContain("/crm/deals/deal_1");
  });
});
