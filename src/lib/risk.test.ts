import { describe, expect, it } from "vitest";
import { classifyRisk } from "./risk";

describe("risk classification", () => {
  it("0–30 is Low", () => {
    expect(classifyRisk(0)).toBe("Low");
    expect(classifyRisk(30)).toBe("Low");
  });
  it("31–70 is Medium", () => {
    expect(classifyRisk(31)).toBe("Medium");
    expect(classifyRisk(70)).toBe("Medium");
  });
  it("71–100 is High", () => {
    expect(classifyRisk(71)).toBe("High");
    expect(classifyRisk(100)).toBe("High");
  });
  it("honours custom thresholds", () => {
    expect(classifyRisk(25, { low_max: 20, medium_max: 50 })).toBe("Medium");
  });
});
