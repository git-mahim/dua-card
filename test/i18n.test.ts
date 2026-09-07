import { describe, it, expect } from "vitest";
import { toBengaliNumber } from "../src/lib/formatters";

describe("Language & Localization helpers", () => {
  it("converts numbers to Bengali digits with proper localization", () => {
    expect(toBengaliNumber(0)).toBe("০");
    expect(toBengaliNumber(12345)).toBe("১২,৩৪৫");
    expect(toBengaliNumber(100)).toBe("১০০");
  });

  it("handles standard English number formatting", () => {
    const num = 12345;
    expect(num.toLocaleString("en-US")).toBe("12,345");
  });
});
