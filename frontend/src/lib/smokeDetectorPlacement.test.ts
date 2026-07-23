import { describe, expect, it } from "vitest";
import {
  autoPlaceSmokeDetectors,
  calculateRequiredSmokeDetectorCount,
  summarizeSmokeDetectors,
  CORRIDOR_SMOKE_SPACING_METERS,
  STAIRS_SMOKE_SPACING_METERS,
} from "@/lib/smokeDetectorPlacement";
import type { Floor, Structure } from "@/types/floorplan";

function makeStructure(overrides: Partial<Structure> = {}): Structure {
  return {
    id: "structure-1",
    type: "corridor",
    x: 0,
    y: 0,
    width: 220,
    height: 50,
    ...overrides,
  };
}

function makeFloor(structures: Structure[]): Floor {
  return {
    id: "floor-1",
    name: "1F",
    structures,
    extinguisherPlacements: [],
    heatDetectors: [],
    exitLights: [],
    smokeDetectors: [],
    sprinklerHeads: [],
    hydrantPlacements: [],
  };
}

describe("calculateRequiredSmokeDetectorCount", () => {
  it.each([
    [30, 30, 1],
    [31, 30, 2],
    [60, 30, 2],
    [61, 30, 3],
  ])("span %dm / spacing %dm -> %d개", (spanMeters, spacingMeters, expected) => {
    expect(calculateRequiredSmokeDetectorCount(spanMeters, spacingMeters)).toBe(expected);
  });

  it("returns 0 for a zero or negative span", () => {
    expect(calculateRequiredSmokeDetectorCount(0, 30)).toBe(0);
    expect(calculateRequiredSmokeDetectorCount(-5, 30)).toBe(0);
  });
});

describe("autoPlaceSmokeDetectors", () => {
  it("places corridor detectors spaced within the 30m rule along the centerline", () => {
    // PIXELS_PER_METER = 30, so a 1860px-wide corridor is 62m -> ceil(62/30) = 3.
    const corridor = makeStructure({ id: "corridor-1", x: 0, y: 0, width: 1860, height: 50 });
    const floor = makeFloor([corridor]);

    const detectors = autoPlaceSmokeDetectors(floor, 1);

    expect(detectors).toHaveLength(3);
    expect(detectors.every((d) => d.category === "CORRIDOR")).toBe(true);
    expect(detectors.every((d) => d.structureId === "corridor-1")).toBe(true);
    expect(detectors.every((d) => d.isAutoPlaced)).toBe(true);
    expect(detectors.every((d) => d.floorId === "floor-1")).toBe(true);
  });

  it("places stairs detectors spaced within the 15m rule", () => {
    // 930px = 31m -> ceil(31/15) = 3.
    const stairs = makeStructure({ id: "stairs-1", type: "stairs", x: 0, y: 0, width: 930, height: 90 });
    const floor = makeFloor([stairs]);

    const detectors = autoPlaceSmokeDetectors(floor, 1);

    expect(detectors).toHaveLength(3);
    expect(detectors.every((d) => d.category === "STAIRS")).toBe(true);
  });

  it("places exactly one detector per elevator shaft, at its center", () => {
    const elevator = makeStructure({ id: "elevator-1", type: "elevator", x: 0, y: 0, width: 80, height: 80 });
    const floor = makeFloor([elevator]);

    const detectors = autoPlaceSmokeDetectors(floor, 1);

    expect(detectors).toHaveLength(1);
    expect(detectors[0].category).toBe("ELEVATOR");
    expect(detectors[0].x).toBe(40);
    expect(detectors[0].y).toBe(40);
  });

  it("nudges a detector away from an obstacle placed on top of it", () => {
    const elevator = makeStructure({ id: "elevator-1", type: "elevator", x: 0, y: 0, width: 80, height: 80 });
    // Elevator center = (40,40); the obstacle covers that point.
    const obstacle = makeStructure({ id: "obs-1", type: "obstacle", x: 30, y: 30, width: 20, height: 20 });
    const floor = makeFloor([elevator, obstacle]);

    const [detector] = autoPlaceSmokeDetectors(floor, 1);

    const insideObstacle =
      detector.x > obstacle.x &&
      detector.x < obstacle.x + obstacle.width &&
      detector.y > obstacle.y &&
      detector.y < obstacle.y + obstacle.height;
    expect(insideObstacle).toBe(false);
  });

  it("never places detectors inside rooms and combines every structure type", () => {
    const floor = makeFloor([
      makeStructure({ id: "corridor-1", type: "corridor", x: 0, y: 0, width: 220, height: 50 }),
      makeStructure({ id: "room-1", type: "room", x: 0, y: 100, width: 120, height: 100 }),
      makeStructure({ id: "stairs-1", type: "stairs", x: 0, y: 300, width: 90, height: 110 }),
      makeStructure({ id: "elevator-1", type: "elevator", x: 300, y: 300, width: 80, height: 80 }),
    ]);

    const detectors = autoPlaceSmokeDetectors(floor, 1);
    const summary = summarizeSmokeDetectors(detectors);

    expect(summary.corridorCount).toBeGreaterThanOrEqual(1);
    expect(summary.stairsCount).toBeGreaterThanOrEqual(1);
    expect(summary.elevatorCount).toBe(1);
    expect(summary.totalCount).toBe(
      summary.corridorCount + summary.stairsCount + summary.elevatorCount
    );
    expect(detectors.every((d) => d.structureId !== "room-1")).toBe(true);
  });

  it("returns nothing for a floor with no corridor/stairs/elevator structures", () => {
    const floor = makeFloor([makeStructure({ id: "room-1", type: "room" })]);
    expect(autoPlaceSmokeDetectors(floor, 1)).toHaveLength(0);
  });
});

describe("summarizeSmokeDetectors", () => {
  it("counts detectors per category and in total", () => {
    const detectors = [
      { id: "1", floorId: "f", structureId: "s", category: "CORRIDOR" as const, x: 0, y: 0, isAutoPlaced: true },
      { id: "2", floorId: "f", structureId: "s", category: "CORRIDOR" as const, x: 0, y: 0, isAutoPlaced: true },
      { id: "3", floorId: "f", structureId: "s", category: "STAIRS" as const, x: 0, y: 0, isAutoPlaced: true },
      { id: "4", floorId: "f", structureId: "s", category: "ELEVATOR" as const, x: 0, y: 0, isAutoPlaced: true },
    ];
    const summary = summarizeSmokeDetectors(detectors);
    expect(summary).toEqual({
      corridorCount: 2,
      stairsCount: 1,
      elevatorCount: 1,
      totalCount: 4,
    });
  });
});

describe("spacing constants", () => {
  it("uses NFTC 203 4조 spacing (corridor 30m / stairs 15m)", () => {
    expect(CORRIDOR_SMOKE_SPACING_METERS).toBe(30);
    expect(STAIRS_SMOKE_SPACING_METERS).toBe(15);
  });
});
