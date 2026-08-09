import { describe, expect, it } from "vitest";
import { classifyInboundIntent, firstNameFromFullName, normalizeAustralianMobile, sanitizeFullName } from "../../workers/funnel/src/phone";

describe("phone and contact normalization", () => {
  it.each([
    ["0412 345 678", "+61412345678"],
    ["+61 412 345 678", "+61412345678"],
    ["0061 412 345 678", "+61412345678"],
    ["61412345678", "+61412345678"],
  ])("normalizes %s", (input, expected) => expect(normalizeAustralianMobile(input)).toBe(expected));

  it.each(["", "123", "0712345678", "+14155552671", "0412 345 67"])("rejects non-Australian-mobile %s", (input) => {
    expect(normalizeAustralianMobile(input)).toBeNull();
  });

  it("sanitizes markup and control characters", () => expect(sanitizeFullName("  <Jo\u0000 Smith> ")).toBe("Jo Smith"));
  it("extracts a safe first name", () => expect(firstNameFromFullName("  Taylor   Jones ")).toBe("Taylor"));
  it("falls back when a name is empty after sanitization", () => expect(firstNameFromFullName("<>\u0000")).toBe("there"));

  it.each(["STOP", " stop! ", "unsubscribe", "Cancel", "END", "quit."])("classifies %s as STOP", (body) => {
    expect(classifyInboundIntent(body)).toBe("STOP");
  });
  it("does not treat a sentence beginning with stop as the exact STOP keyword", () => expect(classifyInboundIntent("stop calling tomorrow maybe")).toBe("REPLY"));
  it("classifies empty content separately", () => expect(classifyInboundIntent(" ... ")).toBe("EMPTY"));
});
