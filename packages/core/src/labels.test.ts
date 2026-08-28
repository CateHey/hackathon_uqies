import { describe, expect, it } from "vitest";
import { REGION_PLAIN_LABEL, REGION_SHORT_LABEL, regionPlainLabel } from "./labels";
import { RegionType } from "./schema/plan";

describe("region labels", () => {
  it("covers every region type in both lengths", () => {
    for (const type of RegionType.options) {
      expect(REGION_PLAIN_LABEL[type], type).toBeTruthy();
      expect(REGION_SHORT_LABEL[type], type).toBeTruthy();
      // The short form is for the legend and chips: at most three words.
      expect(REGION_SHORT_LABEL[type].split(/\s+/).length, type).toBeLessThanOrEqual(3);
    }
  });

  it("names the two areas people ask about in plain words", () => {
    expect(regionPlainLabel("markets")).toMatch(/shares/i);
    expect(regionPlainLabel("markets")).toMatch(/etf/i);
    expect(regionPlainLabel("digital_assets")).toMatch(/crypto/i);
    expect(REGION_SHORT_LABEL.digital_assets).toBe("Crypto");
  });

  it("uses no metaphors — captions say what the area is", () => {
    const metaphors = /district|frontier|village|harbour|garden|quarter|workshop|\bcity\b/i;
    for (const type of RegionType.options) {
      expect(REGION_PLAIN_LABEL[type], type).not.toMatch(metaphors);
    }
  });
});
