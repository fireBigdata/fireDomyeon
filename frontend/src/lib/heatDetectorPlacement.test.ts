import { describe, expect, it } from "vitest";
import {
  calculateGrid,
  calculateHeatDetectorPositions,
  calculateRequiredDetectorCount,
  calculateRoomDetectorPositions,
  autoPlaceHeatDetectors,
} from "@/lib/heatDetectorPlacement";
import type { Box } from "@/lib/partitionTree";
import { RoomType, type Floor, type Structure } from "@/types/floorplan";
import { HeatDetectorType } from "@/types/heatDetector";

function makeRoom(overrides: Partial<Structure> = {}): Structure {
  return {
    id: "room-1",
    type: "room",
    x: 0,
    y: 0,
    width: 120,
    height: 100,
    ...overrides,
  };
}

function isFiniteNumber(value: number): boolean {
  return Number.isFinite(value);
}

function uniformCoverage(area: number) {
  return {
    [HeatDetectorType.DIFFERENTIAL]: area,
    [HeatDetectorType.FIXED_TEMPERATURE]: area,
  };
}

describe("calculateRequiredDetectorCount", () => {
  it.each([
    [10, 20, 1],
    [20, 20, 1],
    [21, 20, 2],
    [40, 20, 2],
    [41, 20, 3],
  ])("area %d, coverage %d -> %d", (area, coverage, expected) => {
    expect(calculateRequiredDetectorCount(area, coverage)).toBe(expected);
  });

  it("throws for zero, negative, or non-finite coverage area", () => {
    expect(() => calculateRequiredDetectorCount(50, 0)).toThrow();
    expect(() => calculateRequiredDetectorCount(50, -5)).toThrow();
    expect(() => calculateRequiredDetectorCount(50, NaN)).toThrow();
  });

  it("always returns at least 1, even for a tiny room", () => {
    expect(calculateRequiredDetectorCount(0.01, 20)).toBe(1);
  });
});

describe("calculateGrid", () => {
  it("prefers a wide layout for a wide room", () => {
    const grid = calculateGrid(2, 300, 100);
    expect(grid.rows).toBe(1);
    expect(grid.columns).toBe(2);
  });

  it("prefers a tall layout for a tall room", () => {
    const grid = calculateGrid(2, 100, 300);
    expect(grid.rows).toBe(2);
    expect(grid.columns).toBe(1);
  });

  it("picks a square-ish grid for a square-ish room with 4 detectors", () => {
    const grid = calculateGrid(4, 120, 100);
    expect(grid.rows).toBe(2);
    expect(grid.columns).toBe(2);
  });

  it("minimizes wasted cells for 6 detectors in a roughly square room", () => {
    const grid = calculateGrid(6, 120, 100);
    expect(grid.rows * grid.columns).toBe(6);
  });
});

describe("calculateHeatDetectorPositions", () => {
  const box: Box = { x: 10, y: 20, width: 120, height: 100 };

  it("places a single detector at the room center", () => {
    const points = calculateHeatDetectorPositions(box, 1);
    expect(points).toHaveLength(1);
    expect(points[0]).toEqual({ x: box.x + box.width / 2, y: box.y + box.height / 2 });
  });

  it("keeps every detector inside the box bounds", () => {
    for (const count of [2, 3, 4, 5, 6, 7]) {
      const points = calculateHeatDetectorPositions(box, count);
      for (const point of points) {
        expect(point.x).toBeGreaterThanOrEqual(box.x);
        expect(point.x).toBeLessThanOrEqual(box.x + box.width);
        expect(point.y).toBeGreaterThanOrEqual(box.y);
        expect(point.y).toBeLessThanOrEqual(box.y + box.height);
      }
    }
  });

  it("produces only finite, valid coordinates", () => {
    for (const count of [1, 2, 5, 9]) {
      for (const point of calculateHeatDetectorPositions(box, count)) {
        expect(isFiniteNumber(point.x)).toBe(true);
        expect(isFiniteNumber(point.y)).toBe(true);
      }
    }
  });

  it("never places two detectors at the same position", () => {
    for (const count of [2, 3, 4, 5, 6, 7, 8]) {
      const points = calculateHeatDetectorPositions(box, count);
      const unique = new Set(points.map((p) => `${p.x.toFixed(3)}:${p.y.toFixed(3)}`));
      expect(unique.size).toBe(points.length);
    }
  });

  it("spreads detectors horizontally in a long, wide room", () => {
    const wideBox: Box = { x: 0, y: 0, width: 400, height: 80 };
    const points = calculateHeatDetectorPositions(wideBox, 3);
    const ys = new Set(points.map((p) => p.y));
    const xs = new Set(points.map((p) => p.x));
    // A single row (all same y), spread across distinct x positions.
    expect(ys.size).toBe(1);
    expect(xs.size).toBe(3);
  });

  it("spreads detectors vertically in a long, tall room", () => {
    const tallBox: Box = { x: 0, y: 0, width: 80, height: 400 };
    const points = calculateHeatDetectorPositions(tallBox, 3);
    const xs = new Set(points.map((p) => p.x));
    const ys = new Set(points.map((p) => p.y));
    expect(xs.size).toBe(1);
    expect(ys.size).toBe(3);
  });

  it("distributes a prime/odd detector count evenly across rows", () => {
    const points = calculateHeatDetectorPositions(box, 7);
    expect(points).toHaveLength(7);
    const rowSizes = new Map<number, number>();
    for (const point of points) {
      rowSizes.set(point.y, (rowSizes.get(point.y) ?? 0) + 1);
    }
    const sizes = [...rowSizes.values()];
    // No row should hold more than one extra detector compared to another.
    expect(Math.max(...sizes) - Math.min(...sizes)).toBeLessThanOrEqual(1);
  });

  it("does not throw and stays in-bounds for a very small room", () => {
    const tinyBox: Box = { x: 0, y: 0, width: 4, height: 3 };
    const points = calculateHeatDetectorPositions(tinyBox, 4);
    expect(points).toHaveLength(4);
    for (const point of points) {
      expect(isFiniteNumber(point.x)).toBe(true);
      expect(isFiniteNumber(point.y)).toBe(true);
      expect(point.x).toBeGreaterThanOrEqual(tinyBox.x);
      expect(point.x).toBeLessThanOrEqual(tinyBox.x + tinyBox.width);
    }
  });
});

describe("calculateRoomDetectorPositions", () => {
  it("returns absolute (canvas) coordinates, offset by the room's position", () => {
    const room = makeRoom({ x: 200, y: 150, width: 120, height: 100 });
    const [point] = calculateRoomDetectorPositions(room, 1);
    expect(point).toEqual({ x: 260, y: 200 });
  });

  it("keeps detectors out of a deleted (empty) partition region", () => {
    const room = makeRoom({
      x: 0,
      y: 0,
      width: 100,
      height: 100,
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

    const points = calculateRoomDetectorPositions(room, 4);
    // The empty half occupies x in [0, 50); every detector should fall in the
    // remaining (leaf) half, x in [50, 100].
    for (const point of points) {
      expect(point.x).toBeGreaterThanOrEqual(50);
    }
  });
});

describe("autoPlaceHeatDetectors", () => {
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

  it("gives each room at least one detector and tags them as auto-placed", () => {
    const floor = makeFloor([
      makeRoom({ id: "living", width: 90, height: 90 }), // small room
      makeRoom({ id: "kitchen", x: 200, width: 300, height: 300 }), // large room
    ]);

    // PIXELS_PER_METER = 30, so a 90x90 room is 9m², a 300x300 room is 100m².
    const detectors = autoPlaceHeatDetectors(floor, uniformCoverage(20), 1);

    const livingDetectors = detectors.filter((d) => d.roomId === "living");
    const kitchenDetectors = detectors.filter((d) => d.roomId === "kitchen");

    expect(livingDetectors).toHaveLength(1);
    expect(kitchenDetectors.length).toBeGreaterThan(1);
    expect(detectors.every((d) => d.isAutoPlaced)).toBe(true);
    expect(detectors.every((d) => d.floorId === "floor-1")).toBe(true);
  });

  it("throws instead of silently computing anything for an invalid coverage area", () => {
    const floor = makeFloor([makeRoom()]);
    expect(() => autoPlaceHeatDetectors(floor, uniformCoverage(0), 1)).toThrow();
    expect(() => autoPlaceHeatDetectors(floor, uniformCoverage(-1), 1)).toThrow();
  });

  it("ignores non-room structures", () => {
    const floor = makeFloor([
      makeRoom({ id: "room-a" }),
      { id: "corridor-a", type: "corridor", x: 0, y: 0, width: 200, height: 50 },
    ]);
    const detectors = autoPlaceHeatDetectors(floor, uniformCoverage(20), 1);
    expect(detectors.every((d) => d.roomId === "room-a")).toBe(true);
  });

  it("nudges a detector away from an obstacle placed on top of it", () => {
    const room = makeRoom({ id: "living", width: 90, height: 90 });
    // A single detector would land at the room's center (45,45); the obstacle covers that point.
    const obstacle: Structure = { id: "obs-1", type: "obstacle", x: 35, y: 35, width: 20, height: 20 };
    const floor = makeFloor([room, obstacle]);

    const detectors = autoPlaceHeatDetectors(floor, uniformCoverage(20), 1);
    const livingDetectors = detectors.filter((d) => d.roomId === "living");

    expect(livingDetectors).toHaveLength(1);
    const [detector] = livingDetectors;
    const insideObstacle =
      detector.x > obstacle.x &&
      detector.x < obstacle.x + obstacle.width &&
      detector.y > obstacle.y &&
      detector.y < obstacle.y + obstacle.height;
    expect(insideObstacle).toBe(false);
  });

  it("uses fixed-temperature detectors for kitchens and boiler rooms, differential elsewhere", () => {
    const floor = makeFloor([
      makeRoom({ id: "living", roomType: RoomType.LIVING }),
      makeRoom({ id: "kitchen", x: 200, roomType: RoomType.KITCHEN }),
      makeRoom({ id: "boiler", x: 400, roomType: RoomType.BOILER }),
      makeRoom({ id: "bedroom", x: 600, roomType: RoomType.BEDROOM }),
      makeRoom({ id: "untyped", x: 800 }),
    ]);

    const detectors = autoPlaceHeatDetectors(floor, uniformCoverage(20), 1);
    const typeByRoom = (roomId: string) =>
      detectors.find((d) => d.roomId === roomId)?.type;

    expect(typeByRoom("living")).toBe(HeatDetectorType.DIFFERENTIAL);
    expect(typeByRoom("kitchen")).toBe(HeatDetectorType.FIXED_TEMPERATURE);
    expect(typeByRoom("boiler")).toBe(HeatDetectorType.FIXED_TEMPERATURE);
    expect(typeByRoom("bedroom")).toBe(HeatDetectorType.DIFFERENTIAL);
    expect(typeByRoom("untyped")).toBe(HeatDetectorType.DIFFERENTIAL);
  });
});
