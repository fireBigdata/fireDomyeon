import { describe, expect, it } from "vitest";
import {
  calculateExtinguisherCountByAbility,
  calculateRequiredAbilityUnits,
  calculateTotalFloorArea,
  findAreasBeyondMaximumDistance,
  placeExtinguishersNearWalls,
  planExtinguisherPlacement,
} from "@/lib/extinguisherPlacement";
import { RoomType } from "@/types/floorplan";
import type { Floor, Structure } from "@/types/floorplan";

function makeRoom(overrides: Partial<Structure> = {}): Structure {
  return {
    id: "room-1",
    type: "room",
    x: 0,
    y: 0,
    width: 120,
    height: 100,
    roomType: RoomType.LIVING,
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

function distance(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

describe("calculateRequiredAbilityUnits + calculateExtinguisherCountByAbility", () => {
  it.each([
    [100, 1, 1],
    [101, 1, 2],
    [250, 2, 2],
    [400, 3, 2],
  ])("area %d㎡, %d단위/개 -> %d개", (area, abilityPerExtinguisher, expected) => {
    const requiredUnits = calculateRequiredAbilityUnits(area);
    expect(calculateExtinguisherCountByAbility(requiredUnits, abilityPerExtinguisher)).toBe(
      expected
    );
  });

  it("requires at least 1 ability unit per 100㎡, rounding up", () => {
    expect(calculateRequiredAbilityUnits(250)).toBe(3);
    expect(calculateRequiredAbilityUnits(0)).toBe(0);
  });

  it("throws for an invalid ability-units-per-extinguisher input", () => {
    expect(() => calculateExtinguisherCountByAbility(3, 0)).toThrow();
    expect(() => calculateExtinguisherCountByAbility(3, -1)).toThrow();
    expect(() => calculateExtinguisherCountByAbility(3, NaN)).toThrow();
  });

  it("accepts a custom area-per-unit table (facility-type-specific)", () => {
    const areaPerUnit = { normal: 200, fireResistant: 400 };
    expect(calculateRequiredAbilityUnits(200, false, areaPerUnit)).toBe(1);
    expect(calculateRequiredAbilityUnits(201, false, areaPerUnit)).toBe(2);
    expect(calculateRequiredAbilityUnits(400, true, areaPerUnit)).toBe(1);
    expect(calculateRequiredAbilityUnits(401, true, areaPerUnit)).toBe(2);
  });
});

describe("planExtinguisherPlacement", () => {
  it("throws instead of computing anything for an invalid ability-units input", () => {
    const floor = makeFloor([makeRoom()]);
    expect(() => planExtinguisherPlacement(floor, 1, 0, "A")).toThrow();
    expect(() => planExtinguisherPlacement(floor, 1, -2, "A")).toThrow();
  });

  it("computes the minimum count from floor area and ability units", () => {
    // 300x300px room = 10m x 10m = 100㎡ at PIXELS_PER_METER=30.
    const room = makeRoom({ id: "room-1", x: 0, y: 0, width: 300, height: 300 });
    const floor = makeFloor([room]);

    const result = planExtinguisherPlacement(floor, 1, 1, "A");

    expect(calculateTotalFloorArea(floor.structures, 1)).toBeCloseTo(100);
    expect(result.requiredAbilityUnits).toBe(1);
    expect(result.minimumCountByArea).toBe(1);
  });

  it("adds extra extinguishers when some area is beyond the 20m travel distance", () => {
    // A very large room (100m x 100m): the area-based minimum (1 extinguisher
    // per 100 ability units) can't possibly cover every corner within 20m.
    const bigRoom = makeRoom({ id: "big-room", x: 0, y: 0, width: 3000, height: 3000 });
    const floor = makeFloor([bigRoom]);

    const result = planExtinguisherPlacement(floor, 1, 100, "A");

    expect(result.addedByDistanceRule).toBeGreaterThan(0);
    expect(result.finalCount).toBe(result.minimumCountByArea + result.addedByDistanceRule);

    // A room this large can't reach 100% coverage from wall-hugging points
    // alone (its center is 50m from every wall), but reinforcement should
    // still measurably shrink the uncovered area rather than doing nothing.
    const gapsBeforeReinforcement = findAreasBeyondMaximumDistance(
      floor,
      placeExtinguishersNearWalls(floor, result.minimumCountByArea, "A"),
      20,
      1
    );
    const gapsAfterReinforcement = findAreasBeyondMaximumDistance(floor, result.placements, 20, 1);
    expect(gapsAfterReinforcement.length).toBeLessThan(gapsBeforeReinforcement.length);
  });

  it("fully closes 20m coverage gaps for a moderately sized room", () => {
    // 16m x 16m room: every interior point is well within 20m of a
    // wall-hugging point once enough are added, so this should fully converge.
    const room = makeRoom({ id: "room-1", x: 0, y: 0, width: 480, height: 480 });
    const floor = makeFloor([room]);

    const result = planExtinguisherPlacement(floor, 1, 1000, "A");

    const remainingGaps = findAreasBeyondMaximumDistance(floor, result.placements, 20, 1);
    expect(remainingGaps).toHaveLength(0);
  });

  it("keeps every auto-placed extinguisher inside a valid room/corridor", () => {
    const rooms = [
      makeRoom({ id: "room-a", x: 0, y: 0, width: 300, height: 300 }),
      makeRoom({ id: "room-b", x: 400, y: 0, width: 300, height: 300 }),
    ];
    const floor = makeFloor(rooms);

    const result = planExtinguisherPlacement(floor, 1, 1, "A");
    const byId = new Map(rooms.map((r) => [r.id, r]));

    for (const placement of result.placements) {
      const room = byId.get(placement.structureId);
      expect(room).toBeDefined();
      expect(placement.x).toBeGreaterThanOrEqual(room!.x);
      expect(placement.x).toBeLessThanOrEqual(room!.x + room!.width);
      expect(placement.y).toBeGreaterThanOrEqual(room!.y);
      expect(placement.y).toBeLessThanOrEqual(room!.y + room!.height);
    }
  });

  it("keeps every placement reasonably close to a wall", () => {
    const room = makeRoom({ id: "room-1", x: 0, y: 0, width: 300, height: 300 });
    const floor = makeFloor([room]);

    const result = planExtinguisherPlacement(floor, 1, 1, "A");

    for (const placement of result.placements) {
      const localX = placement.x - room.x;
      const localY = placement.y - room.y;
      const distanceToNearestWall = Math.min(
        localX,
        room.width - localX,
        localY,
        room.height - localY
      );
      // Should sit in the wall-margin band, not drift toward the room center.
      expect(distanceToNearestWall).toBeLessThanOrEqual(room.width * 0.2);
    }
  });

  it("never places two extinguishers on top of each other", () => {
    const bigRoom = makeRoom({ id: "big-room", x: 0, y: 0, width: 3000, height: 3000 });
    const floor = makeFloor([bigRoom]);

    const result = planExtinguisherPlacement(floor, 1, 50, "A");
    expect(result.placements.length).toBeGreaterThan(1);

    for (let i = 0; i < result.placements.length; i += 1) {
      for (let j = i + 1; j < result.placements.length; j += 1) {
        expect(distance(result.placements[i], result.placements[j])).toBeGreaterThan(0);
      }
    }
  });

  it("spreads extinguishers across multiple rooms instead of clustering into one", () => {
    const rooms = [
      makeRoom({ id: "room-a", x: 0, y: 0, width: 120, height: 100 }),
      makeRoom({ id: "room-b", x: 300, y: 0, width: 120, height: 100 }),
      makeRoom({ id: "room-c", x: 600, y: 0, width: 120, height: 100 }),
    ];
    const floor = makeFloor(rooms);

    // Exactly one extinguisher per room -> each room should get exactly one,
    // not all three piled into the (equally-sized) first room.
    const placements = placeExtinguishersNearWalls(floor, 3, "A");
    const structureIds = new Set(placements.map((p) => p.structureId));
    expect(structureIds.size).toBe(3);
  });

  it("nudges an extinguisher away from an obstacle placed on top of it", () => {
    const room = makeRoom({ width: 120, height: 100 });
    // A single extinguisher would land near the top-left wall margin; the obstacle covers that point.
    const obstacle: Structure = { id: "obs-1", type: "obstacle", x: 0, y: 0, width: 20, height: 20 };
    const floor = makeFloor([room, obstacle]);

    const placements = placeExtinguishersNearWalls(floor, 1, "A");

    expect(placements).toHaveLength(1);
    const [placement] = placements;
    const insideObstacle =
      placement.x > obstacle.x &&
      placement.x < obstacle.x + obstacle.width &&
      placement.y > obstacle.y &&
      placement.y < obstacle.y + obstacle.height;
    expect(insideObstacle).toBe(false);
  });
});

describe("planExtinguisherPlacement — facility-type area-per-unit", () => {
  it("hospital/school (그 밖의 것, 200㎡ group) require fewer ability units than commercial/warehouse (100㎡ group) for the same area", () => {
    // 450x300px room = 15m x 10m = 150㎡ at PIXELS_PER_METER=30.
    const room = makeRoom({ id: "room-1", x: 0, y: 0, width: 450, height: 300 });
    const floor = makeFloor([room]);

    const commercialResult = planExtinguisherPlacement(floor, 1, 1, "A", undefined, "commercial");
    const hospitalResult = planExtinguisherPlacement(floor, 1, 1, "A", undefined, "hospital");

    expect(commercialResult.requiredAbilityUnits).toBe(2); // ceil(150/100)
    expect(hospitalResult.requiredAbilityUnits).toBe(1); // ceil(150/200)
  });

  it("defaults to the 100㎡ group (unchanged prior behavior) when no facility type is given", () => {
    const room = makeRoom({ id: "room-1", x: 0, y: 0, width: 450, height: 300 });
    const floor = makeFloor([room]);
    const result = planExtinguisherPlacement(floor, 1, 1, "A");
    expect(result.requiredAbilityUnits).toBe(2);
  });

  it("subway/factory/warehouse also use the 100㎡ group, same as commercial/house", () => {
    const room = makeRoom({ id: "room-1", x: 0, y: 0, width: 450, height: 300 });
    const floor = makeFloor([room]);

    for (const facilityType of ["subway", "factory", "warehouse"] as const) {
      const result = planExtinguisherPlacement(floor, 1, 1, "A", undefined, facilityType);
      expect(result.requiredAbilityUnits).toBe(2);
    }
  });

  it("apartment/villa use the NFTC 608 2.1.1 100㎡ group, same as the general 100㎡ group", () => {
    // 450x300px room = 15m x 10m = 150㎡ at PIXELS_PER_METER=30.
    const room = makeRoom({ id: "room-1", x: 0, y: 0, width: 450, height: 300 });
    const floor = makeFloor([room]);

    for (const facilityType of ["apartment", "villa"] as const) {
      const result = planExtinguisherPlacement(floor, 1, 1, "A", undefined, facilityType);
      expect(result.requiredAbilityUnits).toBe(2); // ceil(150/100)
    }
  });

  it("apartment/villa area-per-unit does not double for fire-resistant structures (no such proviso in NFTC 608 2.1.1)", () => {
    // 300x300px room = 10m x 10m = 100㎡.
    const room = makeRoom({ id: "room-1", x: 0, y: 0, width: 300, height: 300 });
    const floor = makeFloor([room]);

    const result = planExtinguisherPlacement(floor, 1, 1, "A", true, "apartment");
    expect(result.requiredAbilityUnits).toBe(1); // ceil(100/100), not ceil(100/200)
  });
});
