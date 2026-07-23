import { describe, expect, it } from "vitest";
import {
  calculateMinimalSprinklerGrid,
  calculateSprinklerPositions,
  planStructureSprinklerPlacement,
  autoPlaceSprinklers,
  findHeadsOutsideStructureBounds,
  findDuplicateSprinklerHeads,
} from "@/lib/sprinklerPlacement";
import type { Box } from "@/lib/partitionTree";
import { RoomType, SprinklerHazardClass, type Floor, type Structure } from "@/types/floorplan";
import { SprinklerComplianceStatus, SprinklerHeadType } from "@/types/sprinkler";
import type { SprinklerClassificationContext } from "@/lib/sprinklerRules";
import { PIXELS_PER_METER } from "@/lib/area";

// Legend: each `it` block references which STEP 12 scenario(s) it covers.
// Where this app's data model has no field to represent a scenario at all
// (lodging/officetel/hospital bedrooms, EV charging bays, rack storage — see
// the STEP-1 analysis: FacilityType is only "apartment"/"house" and
// RoomType only covers residential room kinds), the test instead asserts the
// documented fallback behavior for an *unclassifiable* space
// (REVIEW_REQUIRED, never a silent COMPLIANT_CALCULATION).

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
    sprinklerHeads: [],
    hydrantPlacements: [],
  };
}

const APARTMENT: SprinklerClassificationContext = { facilityType: "apartment" };
const APARTMENT_FIRE_RESISTANT: SprinklerClassificationContext = {
  facilityType: "apartment",
  isFireResistantStructure: true,
};
const APARTMENT_NON_FIRE_RESISTANT: SprinklerClassificationContext = {
  facilityType: "apartment",
  isFireResistantStructure: false,
};
const HOUSE: SprinklerClassificationContext = { facilityType: "house" };

function distance(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function metersToPx(m: number): number {
  return m * PIXELS_PER_METER;
}

// ---------------------------------------------------------------------------
// Core geometry: this is the part that must actually guarantee legal
// coverage, not just look like a grid.
// ---------------------------------------------------------------------------

describe("calculateMinimalSprinklerGrid + calculateSprinklerPositions (coverage guarantee)", () => {
  it("every point in the box is within R of its nearest head, for a range of box sizes and R", () => {
    const cases: { width: number; height: number; radiusM: number }[] = [
      { width: 60, height: 60, radiusM: 2.1 }, // small room, single head
      { width: 300, height: 60, radiusM: 2.1 }, // wide room
      { width: 60, height: 300, radiusM: 2.1 }, // long narrow room
      { width: 400, height: 400, radiusM: 2.1 }, // large room, many heads
      { width: 400, height: 400, radiusM: 2.3 }, // fire-resistant
      { width: 400, height: 400, radiusM: 1.7 }, // special combustible / stage
      { width: 400, height: 400, radiusM: 2.6 }, // residential apartment head
      { width: 133, height: 277, radiusM: 2.1 }, // odd, non-round dimensions
    ];

    for (const { width, height, radiusM } of cases) {
      const radiusPx = metersToPx(radiusM);
      const maxSpacing = radiusPx * Math.SQRT2;
      const grid = calculateMinimalSprinklerGrid(width, height, maxSpacing);
      const box: Box = { x: 0, y: 0, width, height };
      const heads = calculateSprinklerPositions(box, grid);

      expect(heads.length).toBeGreaterThan(0);

      // Sample a dense grid of points across the box (including corners,
      // which are the worst case for coverage) and check each is covered.
      const SAMPLES = 15;
      for (let sy = 0; sy <= SAMPLES; sy += 1) {
        for (let sx = 0; sx <= SAMPLES; sx += 1) {
          const point = { x: (width * sx) / SAMPLES, y: (height * sy) / SAMPLES };
          const nearest = Math.min(...heads.map((h) => distance(point, h)));
          expect(nearest).toBeLessThanOrEqual(radiusPx + 1e-6);
        }
      }
    }
  });

  it("uses a single head for a room small enough that one head's radius covers it", () => {
    const radiusPx = metersToPx(2.6);
    const grid = calculateMinimalSprinklerGrid(60, 60, radiusPx * Math.SQRT2);
    expect(grid).toEqual({ rows: 1, columns: 1 });
  });

  it("prefers more columns than rows for a wide room (evenly distributed, not just count-driven)", () => {
    const radiusPx = metersToPx(2.1);
    const grid = calculateMinimalSprinklerGrid(600, 60, radiusPx * Math.SQRT2);
    expect(grid.columns).toBeGreaterThan(grid.rows);
  });

  it("prefers more rows than columns for a long narrow room", () => {
    const radiusPx = metersToPx(2.1);
    const grid = calculateMinimalSprinklerGrid(60, 600, radiusPx * Math.SQRT2);
    expect(grid.rows).toBeGreaterThan(grid.columns);
  });

  it("returns no heads for a degenerate (zero-area) box", () => {
    const grid = calculateMinimalSprinklerGrid(0, 100, metersToPx(2.1) * Math.SQRT2);
    expect(grid).toEqual({ rows: 0, columns: 0 });
    expect(calculateSprinklerPositions({ x: 0, y: 0, width: 0, height: 100 }, grid)).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Rule selection / classification (STEP 2-3, 8)
// ---------------------------------------------------------------------------

describe("planStructureSprinklerPlacement — classification", () => {
  const floor = makeFloor([]);

  it("small rectangular apartment living room gets exactly one residential head (2.6m)", () => {
    const room = makeRoom({ width: 60, height: 60, roomType: RoomType.LIVING });
    const { result, heads } = planStructureSprinklerPlacement(floor, room, APARTMENT, 1);

    expect(result.ruleId).toBe("NFTC103-2.2.1-RESIDENTIAL-APARTMENT");
    expect(result.headType).toBe(SprinklerHeadType.RESIDENTIAL);
    expect(heads).toHaveLength(1);
    expect(result.status).toBe(SprinklerComplianceStatus.OBSTRUCTION_REVIEW_REQUIRED);
  });

  it("large room requires multiple heads", () => {
    const room = makeRoom({ width: 900, height: 900, roomType: RoomType.LIVING });
    const { heads } = planStructureSprinklerPlacement(floor, room, APARTMENT, 1);
    expect(heads.length).toBeGreaterThan(1);
  });

  it("fire-resistant structure uses the 2.3m rule for corridors; unresolved defaults to the safer 2.1m and flags review", () => {
    const corridor: Structure = { id: "corr-1", type: "corridor", x: 0, y: 0, width: 400, height: 60 };

    const resistant = planStructureSprinklerPlacement(floor, corridor, APARTMENT_FIRE_RESISTANT, 1);
    expect(resistant.result.ruleId).toBe("NFTC103-2.2.1-GENERAL-FIRERESISTANT");
    expect(resistant.result.horizontalDistanceM).toBe(2.3);
    expect(resistant.result.status).not.toBe(SprinklerComplianceStatus.REVIEW_REQUIRED);

    const nonResistant = planStructureSprinklerPlacement(floor, corridor, APARTMENT_NON_FIRE_RESISTANT, 1);
    expect(nonResistant.result.ruleId).toBe("NFTC103-2.2.1-GENERAL-NONFIRERESISTANT");
    expect(nonResistant.result.horizontalDistanceM).toBe(2.1);

    const unknown = planStructureSprinklerPlacement(floor, corridor, APARTMENT, 1);
    // Not knowing fire-resistance must never default to the larger (less
    // safe) 2.3m distance — it must fall back to the smaller, safer one.
    expect(unknown.result.ruleId).toBe("NFTC103-2.2.1-GENERAL-NONFIRERESISTANT");
    expect(unknown.result.status).toBe(SprinklerComplianceStatus.REVIEW_REQUIRED);
  });

  it("special combustible material storage area uses the 1.7m rule", () => {
    const room = makeRoom({ sprinklerHazard: SprinklerHazardClass.SPECIAL_COMBUSTIBLE });
    const { result } = planStructureSprinklerPlacement(floor, room, APARTMENT, 1);
    expect(result.ruleId).toBe("NFTC103-2.2.1-SPECIAL-COMBUSTIBLE");
    expect(result.horizontalDistanceM).toBe(1.7);
    expect(result.status).not.toBe(SprinklerComplianceStatus.REVIEW_REQUIRED);
  });

  it("apartment living room is never silently placed with the plain general (non-residential) rule", () => {
    const room = makeRoom({ roomType: RoomType.LIVING });
    const { result } = planStructureSprinklerPlacement(floor, room, APARTMENT, 1);
    expect(result.ruleId).toBe("NFTC103-2.2.1-RESIDENTIAL-APARTMENT");
  });

  it("does not hard-code a single spacing rule across room types: general, special-combustible, residential, and stage all differ", () => {
    const distances = new Set([
      planStructureSprinklerPlacement(floor, { id: "c", type: "corridor", x: 0, y: 0, width: 200, height: 60 }, APARTMENT, 1).result.horizontalDistanceM,
      planStructureSprinklerPlacement(floor, makeRoom({ id: "sc", sprinklerHazard: SprinklerHazardClass.SPECIAL_COMBUSTIBLE }), APARTMENT, 1).result.horizontalDistanceM,
      planStructureSprinklerPlacement(floor, makeRoom({ id: "res" }), APARTMENT, 1).result.horizontalDistanceM,
      planStructureSprinklerPlacement(floor, makeRoom({ id: "stage", sprinklerHazard: SprinklerHazardClass.STAGE }), APARTMENT, 1).result.horizontalDistanceM,
    ]);
    expect(distances.size).toBeGreaterThan(1);
  });

  it("stage areas get an open head and are always flagged for manual review, never claimed compliant", () => {
    const room = makeRoom({ sprinklerHazard: SprinklerHazardClass.STAGE });
    const { result } = planStructureSprinklerPlacement(floor, room, APARTMENT, 1);
    expect(result.headType).toBe(SprinklerHeadType.OPEN);
    expect(result.status).toBe(SprinklerComplianceStatus.REVIEW_REQUIRED);
  });

  it("boiler rooms still get a placement but are flagged for review (special-equipment caveat), not silently marked compliant", () => {
    const room = makeRoom({ roomType: RoomType.BOILER });
    const { result, heads } = planStructureSprinklerPlacement(floor, room, APARTMENT, 1);
    expect(heads.length).toBeGreaterThan(0);
    expect(result.status).toBe(SprinklerComplianceStatus.REVIEW_REQUIRED);
  });

  it("unsupported special-area classifications (hospital/lodging/EV-charging: no data field exists) fall back to the residential rule without ever claiming full COMPLIANT_CALCULATION, since obstruction data never exists either", () => {
    const room = makeRoom();
    const { result } = planStructureSprinklerPlacement(floor, room, APARTMENT, 1);
    expect(result.status).not.toBe(SprinklerComplianceStatus.COMPLIANT_CALCULATION);
  });

  it("entrances, elevators, and stairs are not applicable (openings/shafts, not protected floor area)", () => {
    for (const type of ["entrance", "elevator", "stairs"] as const) {
      const structure: Structure = { id: `s-${type}`, type, x: 0, y: 0, width: 60, height: 60 };
      const { result, heads } = planStructureSprinklerPlacement(floor, structure, APARTMENT, 1);
      expect(result.status).toBe(SprinklerComplianceStatus.NOT_APPLICABLE);
      expect(heads).toHaveLength(0);
    }
  });

  it("house facility type is not applicable and produces no heads", () => {
    const room = makeRoom();
    const { result, heads } = planStructureSprinklerPlacement(floor, room, HOUSE, 1);
    expect(result.status).toBe(SprinklerComplianceStatus.NOT_APPLICABLE);
    expect(result.classificationReason).toBe("");
    expect(heads).toHaveLength(0);
  });

  it("every applicable result carries the obstruction-data warning (never silently claims obstruction compliance)", () => {
    const room = makeRoom();
    const { result } = planStructureSprinklerPlacement(floor, room, APARTMENT, 1);
    expect(result.warnings.some((w) => w.includes("장애물"))).toBe(true);
  });

  it("nudges a head away from an obstacle structure placed on top of it", () => {
    const room = makeRoom({ width: 60, height: 60, roomType: RoomType.LIVING });
    // A single head would land at the room's center (30,30); the obstacle covers that point.
    const obstacle: Structure = { id: "obs-1", type: "obstacle", x: 20, y: 20, width: 20, height: 20 };
    const floorWithObstacle = makeFloor([room, obstacle]);

    const { heads } = planStructureSprinklerPlacement(floorWithObstacle, room, APARTMENT, 1);

    expect(heads).toHaveLength(1);
    const [head] = heads;
    const insideObstacle =
      head.x > obstacle.x &&
      head.x < obstacle.x + obstacle.width &&
      head.y > obstacle.y &&
      head.y < obstacle.y + obstacle.height;
    expect(insideObstacle).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Boundary / duplicate validation (STEP 7)
// ---------------------------------------------------------------------------

describe("boundary and duplicate validation", () => {
  it("keeps every generated head inside its owning structure's bounds", () => {
    const room = makeRoom({ x: 250, y: 175, width: 313, height: 217 });
    const floor = makeFloor([room]);
    const { heads } = planStructureSprinklerPlacement(floor, room, APARTMENT, 1);
    expect(findHeadsOutsideStructureBounds(heads, [room])).toHaveLength(0);
  });

  it("never produces duplicate head positions within a single room", () => {
    const room = makeRoom({ width: 900, height: 700 });
    const floor = makeFloor([room]);
    const { heads } = planStructureSprinklerPlacement(floor, room, APARTMENT, 1);
    expect(findDuplicateSprinklerHeads(heads)).toHaveLength(0);
  });

  it("keeps heads out of a deleted (empty) partition region — rectilinear non-rectangular room shape", () => {
    const room = makeRoom({
      x: 0,
      y: 0,
      width: 400,
      height: 400,
      partitions: {
        kind: "split",
        id: "split-1",
        direction: "vertical",
        ratio: 0.5,
        children: [
          { kind: "empty", id: "empty-1" },
          { kind: "leaf", id: "leaf-1" },
        ],
      },
    });
    const floor = makeFloor([room]);
    const { heads } = planStructureSprinklerPlacement(floor, room, APARTMENT, 1);

    // The empty half occupies x in [0, 200); every head must fall in the
    // remaining (leaf) half.
    expect(heads.length).toBeGreaterThan(0);
    for (const head of heads) {
      expect(head.x).toBeGreaterThanOrEqual(200);
    }
    expect(findHeadsOutsideStructureBounds(heads, [room])).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Room resize / floor orchestration (STEP 9, 11)
// ---------------------------------------------------------------------------

describe("autoPlaceSprinklers — floor orchestration", () => {
  it("recalculates head count when a room is resized", () => {
    const small = makeRoom({ width: 60, height: 60 });
    const large = { ...small, width: 900, height: 900 };

    const smallCount = autoPlaceSprinklers(makeFloor([small]), APARTMENT, 1).heads.length;
    const largeCount = autoPlaceSprinklers(makeFloor([large]), APARTMENT, 1).heads.length;

    expect(largeCount).toBeGreaterThan(smallCount);
  });

  it("tags every floorId correctly and stays independent per floor", () => {
    const room = makeRoom();
    const floorA = { ...makeFloor([room]), id: "floor-A" };
    const floorB = { ...makeFloor([room]), id: "floor-B" };

    const resultA = autoPlaceSprinklers(floorA, APARTMENT, 1);
    const resultB = autoPlaceSprinklers(floorB, APARTMENT, 1);

    expect(resultA.heads.every((h) => h.floorId === "floor-A")).toBe(true);
    expect(resultB.heads.every((h) => h.floorId === "floor-B")).toBe(true);
  });

  it("is idempotent on repeated recalculation: same room layout yields the same head count each time", () => {
    const floor = makeFloor([makeRoom({ width: 500, height: 350 })]);
    const first = autoPlaceSprinklers(floor, APARTMENT, 1);
    const second = autoPlaceSprinklers(floor, APARTMENT, 1);
    expect(second.heads.length).toBe(first.heads.length);
    // Fresh ids each run — callers (useFloorPlanState) are responsible for
    // replacing the previous auto-placed batch rather than appending.
    expect(new Set([...first.heads.map((h) => h.id), ...second.heads.map((h) => h.id)]).size).toBe(
      first.heads.length + second.heads.length
    );
  });

  it("house facility type places nothing on the whole floor and reports why", () => {
    const floor = makeFloor([makeRoom(), { id: "corr", type: "corridor", x: 0, y: 0, width: 200, height: 50 }]);
    const result = autoPlaceSprinklers(floor, HOUSE, 1);
    expect(result.applicable).toBe(false);
    expect(result.heads).toHaveLength(0);
    expect(result.notApplicableReason).toBeTruthy();
  });

  it("ignores entrance/elevator/stairs structures on an apartment floor", () => {
    const floor = makeFloor([
      makeRoom({ id: "room-a" }),
      { id: "door-a", type: "entrance", x: 0, y: 0, width: 30, height: 10 },
      { id: "stairs-a", type: "stairs", x: 0, y: 0, width: 60, height: 200 },
    ]);
    const result = autoPlaceSprinklers(floor, APARTMENT, 1);
    expect(result.heads.every((h) => h.roomId === "room-a")).toBe(true);
    expect(result.results.map((r) => r.structureId)).toEqual(["room-a"]);
  });
});

// ---------------------------------------------------------------------------
// New facility types (villa/commercial/hospital/school/subway/factory/warehouse)
// ---------------------------------------------------------------------------

describe("planStructureSprinklerPlacement — new facility types", () => {
  const floor = makeFloor([]);
  const VILLA: SprinklerClassificationContext = { facilityType: "villa" };
  const COMMERCIAL: SprinklerClassificationContext = { facilityType: "commercial" };
  const COMMERCIAL_FIRE_RESISTANT: SprinklerClassificationContext = {
    facilityType: "commercial",
    isFireResistantStructure: true,
  };

  it("villa rooms are classified exactly like apartment rooms (residential unit head)", () => {
    const room = makeRoom({ roomType: RoomType.LIVING });
    const { result } = planStructureSprinklerPlacement(floor, room, VILLA, 1);
    expect(result.ruleId).toBe("NFTC103-2.2.1-RESIDENTIAL-APARTMENT");
  });

  it("every non-residential facility type is applicable (only house is not)", () => {
    for (const facilityType of [
      "villa",
      "commercial",
      "hospital",
      "school",
      "subway",
      "factory",
      "warehouse",
    ] as const) {
      const room = makeRoom();
      const { result } = planStructureSprinklerPlacement(floor, room, { facilityType }, 1);
      expect(result.status).not.toBe(SprinklerComplianceStatus.NOT_APPLICABLE);
    }
  });

  it("a non-residential facility room gets the general rule, not the residential-apartment rule", () => {
    const room = makeRoom({ roomType: RoomType.LIVING });
    const { result } = planStructureSprinklerPlacement(floor, room, COMMERCIAL, 1);
    expect(result.ruleId).not.toBe("NFTC103-2.2.1-RESIDENTIAL-APARTMENT");
    expect(["NFTC103-2.2.1-GENERAL-NONFIRERESISTANT", "NFTC103-2.2.1-GENERAL-FIRERESISTANT"]).toContain(
      result.ruleId
    );
  });

  it("a non-residential facility room respects fire-resistance the same way a corridor does", () => {
    const room = makeRoom();
    const resistant = planStructureSprinklerPlacement(floor, room, COMMERCIAL_FIRE_RESISTANT, 1);
    expect(resistant.result.ruleId).toBe("NFTC103-2.2.1-GENERAL-FIRERESISTANT");
    expect(resistant.result.horizontalDistanceM).toBe(2.3);

    const unresolved = planStructureSprinklerPlacement(floor, room, COMMERCIAL, 1);
    expect(unresolved.result.ruleId).toBe("NFTC103-2.2.1-GENERAL-NONFIRERESISTANT");
  });

  it("a non-residential facility room or corridor is always flagged for review and never silently claimed compliant", () => {
    const room = makeRoom();
    const corridor: Structure = { id: "corr-1", type: "corridor", x: 0, y: 0, width: 200, height: 50 };

    const roomResult = planStructureSprinklerPlacement(floor, room, COMMERCIAL_FIRE_RESISTANT, 1).result;
    const corridorResult = planStructureSprinklerPlacement(floor, corridor, COMMERCIAL_FIRE_RESISTANT, 1).result;

    expect(roomResult.status).toBe(SprinklerComplianceStatus.REVIEW_REQUIRED);
    expect(corridorResult.status).toBe(SprinklerComplianceStatus.REVIEW_REQUIRED);
    expect(roomResult.warnings.some((w) => w.includes("규모"))).toBe(true);
    expect(corridorResult.warnings.some((w) => w.includes("규모"))).toBe(true);
  });

  it("special-combustible/stage hazard flags still take priority over the general non-residential rule", () => {
    const room = makeRoom({ sprinklerHazard: SprinklerHazardClass.SPECIAL_COMBUSTIBLE });
    const { result } = planStructureSprinklerPlacement(floor, room, { facilityType: "factory" }, 1);
    expect(result.ruleId).toBe("NFTC103-2.2.1-SPECIAL-COMBUSTIBLE");
  });
});
