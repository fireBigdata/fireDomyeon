import { describe, expect, it } from "vitest";
import { getObstaclesNear, moveOffObstacles } from "@/lib/obstacleAvoidance";
import type { Structure } from "@/types/floorplan";

function makeObstacle(overrides: Partial<Structure> = {}): Structure {
  return {
    id: "obstacle-1",
    type: "obstacle",
    x: 40,
    y: 40,
    width: 20,
    height: 20,
    ...overrides,
  };
}

describe("getObstaclesNear", () => {
  it("returns only obstacle structures overlapping the given structure, expanded by the clearance margin", () => {
    const room: Structure = { id: "room-1", type: "room", x: 0, y: 0, width: 100, height: 100 };
    const overlapping = makeObstacle({ id: "in", x: 40, y: 40, width: 20, height: 20 });
    const outside = makeObstacle({ id: "out", x: 500, y: 500, width: 20, height: 20 });
    const nonObstacle: Structure = { id: "wall", type: "corridor", x: 10, y: 10, width: 20, height: 20 };

    const found = getObstaclesNear(room, [overlapping, outside, nonObstacle]);

    expect(found).toHaveLength(1);
    // Expanded on every side by the clearance margin, not just the raw footprint.
    expect(found[0].x).toBeLessThan(40);
    expect(found[0].y).toBeLessThan(40);
    expect(found[0].x + found[0].width).toBeGreaterThan(60);
    expect(found[0].y + found[0].height).toBeGreaterThan(60);
  });

  it("returns an empty array when there are no obstacles", () => {
    const room: Structure = { id: "room-1", type: "room", x: 0, y: 0, width: 100, height: 100 };
    expect(getObstaclesNear(room, [])).toEqual([]);
  });
});

describe("moveOffObstacles", () => {
  const bounds = { x: 0, y: 0, width: 100, height: 100 };

  it("leaves a point untouched when it's outside every obstacle", () => {
    const obstacles = [{ x: 40, y: 40, width: 20, height: 20 }];
    const point = { x: 5, y: 5 };
    expect(moveOffObstacles(point, obstacles, bounds)).toEqual(point);
  });

  it("nudges a point outside the nearest edge when it lands inside an obstacle", () => {
    const obstacles = [{ x: 40, y: 40, width: 20, height: 20 }];
    const point = { x: 50, y: 41 }; // just inside the top edge of the obstacle
    const result = moveOffObstacles(point, obstacles, bounds);

    // Should be pushed out to the top edge (y === 40), x unchanged.
    expect(result.y).toBeLessThanOrEqual(40);
    expect(result.x).toBe(50);
  });

  it("clamps the nudged point within the given bounds", () => {
    const obstacles = [{ x: 0, y: 0, width: 100, height: 20 }];
    const point = { x: 50, y: 5 };
    const result = moveOffObstacles(point, obstacles, bounds);

    expect(result.y).toBeGreaterThanOrEqual(bounds.y);
    expect(result.y).toBeLessThanOrEqual(bounds.y + bounds.height);
  });

  it("resolves a point trapped between multiple obstacles without throwing", () => {
    const obstacles = [
      { x: 0, y: 40, width: 60, height: 20 },
      { x: 40, y: 0, width: 20, height: 60 },
    ];
    const point = { x: 50, y: 50 };
    expect(() => moveOffObstacles(point, obstacles, bounds)).not.toThrow();
  });
});

describe("getObstaclesNear + moveOffObstacles (end-to-end clearance)", () => {
  it("nudges away a point sitting right next to an obstacle's raw footprint, not just on top of it", () => {
    const room: Structure = { id: "room-1", type: "room", x: 0, y: 0, width: 100, height: 100 };
    const obstacle = makeObstacle({ x: 40, y: 40, width: 20, height: 20 }); // occupies [40,60] x [40,60]
    // 5px outside the obstacle's raw edge — inside the clearance buffer, not the obstacle itself.
    const point = { x: 65, y: 50 };

    const obstacles = getObstaclesNear(room, [obstacle]);
    const result = moveOffObstacles(point, obstacles, room);

    expect(result).not.toEqual(point);
    expect(result.x).toBeGreaterThanOrEqual(60 + 20); // pushed past the clearance zone, not just the raw edge
  });
});
