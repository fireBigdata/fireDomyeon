import { describe, expect, it } from "vitest";
import {
  getHydrantApplicability,
  HYDRANT_MIN_FLOOR_COUNT_FOR_AREA_RULE,
  HYDRANT_SINGLE_FLOOR_AREA_THRESHOLD_M2,
  HYDRANT_TOTAL_FLOOR_AREA_THRESHOLD_M2,
} from "@/lib/hydrantRules";
import type { Floor, Structure } from "@/types/floorplan";

// PIXELS_PER_METER = 30, so pixel area = areaM2 * 900.
function makeFloorWithArea(id: string, areaM2: number): Floor {
  const room: Structure = {
    id: `${id}-room`,
    type: "room",
    x: 0,
    y: 0,
    width: areaM2 > 0 ? 900 : 0,
    height: areaM2 > 0 ? areaM2 : 0,
  };
  return {
    id,
    name: id,
    structures: areaM2 > 0 ? [room] : [],
    extinguisherPlacements: [],
    heatDetectors: [],
    exitLights: [],
    smokeDetectors: [],
    sprinklerHeads: [],
    hydrantPlacements: [],
  };
}

describe("getHydrantApplicability", () => {
  it("is never applicable for house (단독주택), regardless of size", () => {
    const floors = [makeFloorWithArea("f1", 10000)];
    const result = getHydrantApplicability(floors, "house", 1);
    expect(result.applicable).toBe(false);
    expect(result.notApplicableReason).toBeTruthy();
  });

  it("is applicable when total building floor area meets the 3,000㎡ threshold, even on a single floor", () => {
    const floors = [makeFloorWithArea("f1", HYDRANT_TOTAL_FLOOR_AREA_THRESHOLD_M2)];
    const result = getHydrantApplicability(floors, "commercial", 1);
    expect(result.applicable).toBe(true);
    expect(result.totalBuildingFloorAreaM2).toBeCloseTo(HYDRANT_TOTAL_FLOOR_AREA_THRESHOLD_M2);
  });

  it("is not applicable just below the 3,000㎡ threshold with too few floors", () => {
    const floors = [makeFloorWithArea("f1", HYDRANT_TOTAL_FLOOR_AREA_THRESHOLD_M2 - 1)];
    const result = getHydrantApplicability(floors, "commercial", 1);
    expect(result.applicable).toBe(false);
    expect(result.notApplicableReason).toContain("3,000");
  });

  it("is applicable via the floor-count rule (4+ floors, one with >=1,000㎡) even when total area is under 3,000㎡", () => {
    const floors = [
      makeFloorWithArea("f1", 500),
      makeFloorWithArea("f2", 500),
      makeFloorWithArea("f3", 500),
      makeFloorWithArea("f4", HYDRANT_SINGLE_FLOOR_AREA_THRESHOLD_M2),
    ];
    // total = 2000㎡, well under 3000.
    const result = getHydrantApplicability(floors, "commercial", 1);
    expect(result.totalBuildingFloorAreaM2).toBeLessThan(HYDRANT_TOTAL_FLOOR_AREA_THRESHOLD_M2);
    expect(result.applicable).toBe(true);
    expect(result.floorCount).toBe(4);
    expect(result.maxSingleFloorAreaM2).toBeCloseTo(HYDRANT_SINGLE_FLOOR_AREA_THRESHOLD_M2);
  });

  it("is not applicable with 4+ floors if no single floor reaches 1,000㎡ and total area is under 3,000㎡", () => {
    const floors = Array.from({ length: HYDRANT_MIN_FLOOR_COUNT_FOR_AREA_RULE }, (_, i) =>
      makeFloorWithArea(`f${i}`, 200)
    );
    const result = getHydrantApplicability(floors, "commercial", 1);
    expect(result.applicable).toBe(false);
  });

  it("is not applicable with a single large floor if fewer than 4 floors exist and total area is under 3,000㎡", () => {
    const floors = [makeFloorWithArea("f1", HYDRANT_SINGLE_FLOOR_AREA_THRESHOLD_M2)];
    const result = getHydrantApplicability(floors, "commercial", 1);
    expect(result.floorCount).toBeLessThan(HYDRANT_MIN_FLOOR_COUNT_FOR_AREA_RULE);
    expect(result.applicable).toBe(false);
  });

  it("always flags an applicable result for review and carries a simplified-criteria warning", () => {
    const floors = [makeFloorWithArea("f1", HYDRANT_TOTAL_FLOOR_AREA_THRESHOLD_M2)];
    const result = getHydrantApplicability(floors, "hospital", 1);
    expect(result.requiresReview).toBe(true);
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it("applies the same thresholds regardless of facility type, other than house", () => {
    const floors = [makeFloorWithArea("f1", HYDRANT_TOTAL_FLOOR_AREA_THRESHOLD_M2 - 1)];
    for (const facilityType of [
      "apartment",
      "villa",
      "commercial",
      "hospital",
      "school",
      "subway",
      "factory",
      "warehouse",
    ] as const) {
      expect(getHydrantApplicability(floors, facilityType, 1).applicable).toBe(false);
    }
  });
});
