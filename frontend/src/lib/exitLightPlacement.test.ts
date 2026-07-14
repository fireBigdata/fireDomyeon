import { describe, expect, it } from "vitest";
import {
  autoPlaceExitLights,
  calculateExitLightPlacements,
  calculatePassageLightPlacements,
  calculateRequiredPassageLightCount,
  calculateStairLightPlacements,
  summarizeExitLights,
} from "@/lib/exitLightPlacement";
import { EntranceType, RoomType } from "@/types/floorplan";
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
  };
}

describe("calculateRequiredPassageLightCount", () => {
  it.each([
    [20, 1],
    [21, 2],
    [40, 2],
    [41, 3],
  ])("passage length %dm -> %d개", (lengthMeters, expected) => {
    expect(calculateRequiredPassageLightCount(lengthMeters)).toBe(expected);
  });

  it("returns 0 for a zero or negative length", () => {
    expect(calculateRequiredPassageLightCount(0)).toBe(0);
    expect(calculateRequiredPassageLightCount(-5)).toBe(0);
  });
});

describe("calculateExitLightPlacements", () => {
  it("places one light per entrance, regardless of entrance kind", () => {
    const structures = [
      makeStructure({ id: "e1", type: "entrance", entranceType: EntranceType.COMMON, x: 0, y: 0, width: 60, height: 20 }),
      makeStructure({ id: "e2", type: "entrance", entranceType: EntranceType.EMERGENCY, x: 200, y: 0, width: 60, height: 20 }),
      makeStructure({ id: "e3", type: "entrance", entranceType: EntranceType.DOOR, x: 400, y: 0, width: 60, height: 20 }),
    ];
    const floor = makeFloor(structures);

    const lights = calculateExitLightPlacements(floor);

    expect(lights).toHaveLength(3);
    expect(lights.every((l) => l.category === "EXIT")).toBe(true);
    expect(new Set(lights.map((l) => l.structureId))).toEqual(new Set(["e1", "e2", "e3"]));
  });

  it("ignores non-entrance structures", () => {
    const floor = makeFloor([makeStructure({ id: "room-1", type: "room" })]);
    expect(calculateExitLightPlacements(floor)).toHaveLength(0);
  });

  it("places the light at the entrance's own center", () => {
    const entrance = makeStructure({ id: "e1", type: "entrance", x: 100, y: 200, width: 60, height: 20 });
    const floor = makeFloor([entrance]);
    const [light] = calculateExitLightPlacements(floor);
    expect(light.x).toBe(130);
    expect(light.y).toBe(210);
  });
});

describe("calculateStairLightPlacements", () => {
  it("places one light per stairs structure, at its center", () => {
    const stairs = makeStructure({ id: "stairs-1", type: "stairs", x: 0, y: 0, width: 90, height: 110 });
    const floor = makeFloor([stairs]);

    const lights = calculateStairLightPlacements(floor);

    expect(lights).toHaveLength(1);
    expect(lights[0].category).toBe("STAIRS");
    expect(lights[0].x).toBe(45);
    expect(lights[0].y).toBe(55);
  });

  it("places one light per stairs even with multiple stairs structures", () => {
    const floor = makeFloor([
      makeStructure({ id: "stairs-1", type: "stairs", x: 0, y: 0 }),
      makeStructure({ id: "stairs-2", type: "stairs", x: 300, y: 0 }),
    ]);
    expect(calculateStairLightPlacements(floor)).toHaveLength(2);
  });
});

describe("calculatePassageLightPlacements", () => {
  it("places lights spaced 20m apart along a single straight corridor", () => {
    // PIXELS_PER_METER = 30, so a 630px-wide corridor is 21m -> 2 lights.
    const corridor = makeStructure({ id: "corridor-1", x: 0, y: 0, width: 630, height: 50 });
    const lights = calculatePassageLightPlacements("floor-1", [corridor], "CORRIDOR", 1);

    expect(lights).toHaveLength(2);
    expect(lights.every((l) => l.category === "CORRIDOR")).toBe(true);
    expect(lights.every((l) => l.structureId === "corridor-1")).toBe(true);
    // Endpoints of the centerline should be covered (y = height/2 = 25).
    expect(lights.map((l) => l.x).sort((a, b) => a - b)).toEqual([0, 630]);
    expect(lights.every((l) => l.y === 25)).toBe(true);
  });

  it("adds a mandatory light at a bend between two perpendicular touching corridors", () => {
    // A short horizontal segment (10m) meeting a short vertical segment (10m)
    // at a right angle -- neither alone needs more than 1 interval light,
    // but the bend itself must still get one.
    const horizontal = makeStructure({ id: "h", x: 0, y: 0, width: 300, height: 40 });
    const vertical = makeStructure({ id: "v", x: 300, y: 0, width: 40, height: 300 });
    const lights = calculatePassageLightPlacements("floor-1", [horizontal, vertical], "CORRIDOR", 1);

    expect(lights.some((l) => l.isBendPoint)).toBe(true);
  });

  it("does not add a bend light for two straight segments continuing in the same direction", () => {
    const first = makeStructure({ id: "a", x: 0, y: 0, width: 300, height: 40 });
    const second = makeStructure({ id: "b", x: 300, y: 0, width: 300, height: 40 });
    const lights = calculatePassageLightPlacements("floor-1", [first, second], "CORRIDOR", 1);

    expect(lights.some((l) => l.isBendPoint)).toBe(false);
  });

  it("returns nothing for an empty segment list", () => {
    expect(calculatePassageLightPlacements("floor-1", [], "CORRIDOR", 1)).toHaveLength(0);
  });
});

describe("summarizeExitLights", () => {
  it("counts lights per category and in total", () => {
    const lights = [
      { id: "1", floorId: "f", structureId: "s", category: "EXIT" as const, x: 0, y: 0, isBendPoint: false, isAutoPlaced: true },
      { id: "2", floorId: "f", structureId: "s", category: "EXIT" as const, x: 0, y: 0, isBendPoint: false, isAutoPlaced: true },
      { id: "3", floorId: "f", structureId: "s", category: "CORRIDOR" as const, x: 0, y: 0, isBendPoint: false, isAutoPlaced: true },
      { id: "4", floorId: "f", structureId: "s", category: "STAIRS" as const, x: 0, y: 0, isBendPoint: false, isAutoPlaced: true },
    ];
    const summary = summarizeExitLights(lights);
    expect(summary).toEqual({
      exitCount: 2,
      corridorCount: 1,
      stairsCount: 1,
      totalCount: 4,
    });
  });
});

describe("autoPlaceExitLights", () => {
  it("combines every category and never places lights inside rooms", () => {
    const floor = makeFloor([
      makeStructure({ id: "entrance-1", type: "entrance", x: 0, y: 0, width: 60, height: 20 }),
      makeStructure({ id: "corridor-1", type: "corridor", x: 0, y: 100, width: 220, height: 50 }),
      makeStructure({ id: "living-1", type: "room", roomType: RoomType.LIVING, x: 0, y: 200, width: 120, height: 100 }),
      makeStructure({ id: "kitchen-1", type: "room", roomType: RoomType.KITCHEN, x: 200, y: 200, width: 120, height: 100 }),
      makeStructure({ id: "stairs-1", type: "stairs", x: 0, y: 400, width: 90, height: 110 }),
      makeStructure({ id: "elevator-1", type: "elevator", x: 300, y: 400, width: 80, height: 80 }),
    ]);

    const lights = autoPlaceExitLights(floor, 1);
    const summary = summarizeExitLights(lights);

    expect(summary.exitCount).toBe(1);
    expect(summary.corridorCount).toBeGreaterThanOrEqual(1);
    expect(summary.stairsCount).toBe(1);
    expect(lights.every((l) => l.structureId !== "living-1")).toBe(true);
    expect(lights.every((l) => l.structureId !== "kitchen-1")).toBe(true);
    expect(lights.every((l) => l.structureId !== "elevator-1")).toBe(true);
    expect(lights.every((l) => l.isAutoPlaced)).toBe(true);
    expect(lights.every((l) => l.floorId === "floor-1")).toBe(true);
  });
});
