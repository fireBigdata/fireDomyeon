import { describe, expect, it } from "vitest";
import {
  autoPlaceIndoorHydrants,
  calculateCorridorHydrantCount,
  HYDRANT_HORIZONTAL_DISTANCE_METERS,
} from "@/lib/hydrantPlacement";
import { HYDRANT_TOTAL_FLOOR_AREA_THRESHOLD_M2 } from "@/lib/hydrantRules";
import type { Floor, Structure } from "@/types/floorplan";

function makeCorridor(overrides: Partial<Structure> = {}): Structure {
  return {
    id: "corridor-1",
    type: "corridor",
    x: 0,
    y: 0,
    width: 220,
    height: 50,
    ...overrides,
  };
}

// width fixed at 900px (30m) so pixelArea/900 == height numerically, i.e.
// `height` here is directly the room's area in ㎡ at PIXELS_PER_METER=30, scale 1.
function makeBigRoom(overrides: Partial<Structure> = {}): Structure {
  return {
    id: "big-room",
    type: "room",
    x: 0,
    y: 1000,
    width: 900,
    height: HYDRANT_TOTAL_FLOOR_AREA_THRESHOLD_M2,
    ...overrides,
  };
}

function makeFloor(id: string, structures: Structure[]): Floor {
  return {
    id,
    name: id,
    structures,
    extinguisherPlacements: [],
    heatDetectors: [],
    exitLights: [],
    smokeDetectors: [],
    sprinklerHeads: [],
    hydrantPlacements: [],
  };
}

describe("calculateCorridorHydrantCount", () => {
  it.each([
    [0, 0],
    [10, 1],
    [50, 1],
    [51, 2],
    [100, 2],
    [101, 3],
  ])("corridor length %dm -> %d개 (25m horizontal-distance rule)", (lengthMeters, expected) => {
    expect(calculateCorridorHydrantCount(lengthMeters)).toBe(expected);
  });

  it("returns 0 for a zero or negative length", () => {
    expect(calculateCorridorHydrantCount(0)).toBe(0);
    expect(calculateCorridorHydrantCount(-5)).toBe(0);
  });
});

describe("autoPlaceIndoorHydrants", () => {
  it("is not applicable for house facility type, regardless of building size", () => {
    const floor = makeFloor("f1", [makeCorridor(), makeBigRoom()]);
    const result = autoPlaceIndoorHydrants([floor], floor, "house", "indoor-hydrant-1", 1);
    expect(result.applicable).toBe(false);
    expect(result.placements).toHaveLength(0);
  });

  it("is not applicable when the whole building is below the area/floor-count threshold, even with a corridor", () => {
    const floor = makeFloor("f1", [makeCorridor()]); // no big room -> tiny building
    const result = autoPlaceIndoorHydrants([floor], floor, "commercial", "indoor-hydrant-1", 1);
    expect(result.applicable).toBe(false);
    expect(result.placements).toHaveLength(0);
  });

  it("is not applicable when the building meets the size threshold but the current floor has no corridor", () => {
    const floor = makeFloor("f1", [makeBigRoom()]); // meets area threshold, but no corridor
    const result = autoPlaceIndoorHydrants([floor], floor, "commercial", "indoor-hydrant-1", 1);
    expect(result.applicable).toBe(false);
    expect(result.notApplicableReason).toContain("복도");
  });

  it("places hydrants along the corridor once both the building-scale and per-floor corridor conditions are met", () => {
    const floor = makeFloor("f1", [makeCorridor({ id: "corridor-1", width: 220, height: 50 }), makeBigRoom()]);
    const result = autoPlaceIndoorHydrants([floor], floor, "commercial", "indoor-hydrant-1", 1);

    expect(result.applicable).toBe(true);
    expect(result.placements.length).toBeGreaterThan(0);
    expect(result.placements.every((p) => p.isAutoPlaced)).toBe(true);
    expect(result.placements.every((p) => p.structureId === "corridor-1")).toBe(true);
    expect(result.placements.every((p) => p.hydrantTypeId === "indoor-hydrant-1")).toBe(true);
    expect(result.placements.every((p) => p.floorId === "f1")).toBe(true);
  });

  it("counts the whole building (all floors), not just the current floor, toward the area threshold", () => {
    // Neither floor alone reaches 3,000㎡, but together they do.
    const floorA = makeFloor("fA", [
      makeCorridor({ id: "corridor-a" }),
      makeBigRoom({ id: "room-a", height: HYDRANT_TOTAL_FLOOR_AREA_THRESHOLD_M2 / 2 }),
    ]);
    const floorB = makeFloor("fB", [
      makeBigRoom({ id: "room-b", height: HYDRANT_TOTAL_FLOOR_AREA_THRESHOLD_M2 / 2 }),
    ]);

    const soloResult = autoPlaceIndoorHydrants([floorA], floorA, "commercial", "indoor-hydrant-1", 1);
    const combinedResult = autoPlaceIndoorHydrants([floorA, floorB], floorA, "commercial", "indoor-hydrant-1", 1);

    expect(soloResult.applicable).toBe(false);
    expect(combinedResult.applicable).toBe(true);
  });

  it("keeps hydrants away from an obstacle overlapping the corridor", () => {
    const corridor = makeCorridor({ id: "corridor-1", x: 0, y: 0, width: 220, height: 50 });
    const obstacle: Structure = { id: "obs-1", type: "obstacle", x: 0, y: 0, width: 30, height: 30 };
    const floor = makeFloor("f1", [corridor, obstacle, makeBigRoom()]);

    const result = autoPlaceIndoorHydrants([floor], floor, "commercial", "indoor-hydrant-1", 1);

    for (const placement of result.placements) {
      const insideObstacle =
        placement.x > obstacle.x &&
        placement.x < obstacle.x + obstacle.width &&
        placement.y > obstacle.y &&
        placement.y < obstacle.y + obstacle.height;
      expect(insideObstacle).toBe(false);
    }
  });

  it("uses the documented 25m horizontal-distance constant for its spacing rule", () => {
    expect(HYDRANT_HORIZONTAL_DISTANCE_METERS).toBe(25);
  });
});
