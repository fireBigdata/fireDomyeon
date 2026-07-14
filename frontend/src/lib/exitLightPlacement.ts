import type { Floor, Structure } from "@/types/floorplan";
import type { ExitLight, ExitLightCategory } from "@/types/exitLight";
import type { Point } from "@/lib/heatDetectorPlacement";
import { createId } from "@/lib/id";
import { pixelLengthToMeters } from "@/lib/area";

const MAX_PASSAGE_SPACING_METERS = 20;

// Two segment bounding boxes within this many pixels of each other are
// treated as physically connected, forming one continuous passage.
const ADJACENCY_TOLERANCE_PX = 20;

// A bend point this close to an already-placed (regular-interval) light is
// considered already covered, so no duplicate light is added on top of it.
const BEND_DEDUPE_TOLERANCE_PX = 24;

function distance(a: Point, b: Point): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

/**
 * A structure's own span length, in pixels — the longer side of its
 * bounding box. Stands in for a real corridor/passage centerline length,
 * which the data model doesn't track yet.
 */
function spanLengthPx(structure: Structure): number {
  return Math.max(structure.width, structure.height);
}

type Orientation = "horizontal" | "vertical";

function orientationOf(structure: Structure): Orientation {
  return structure.width >= structure.height ? "horizontal" : "vertical";
}

/** The two centerline endpoints of a structure's bounding box, in absolute canvas coordinates. */
function centerlineEndpoints(structure: Structure): [Point, Point] {
  if (orientationOf(structure) === "horizontal") {
    const y = structure.y + structure.height / 2;
    return [
      { x: structure.x, y },
      { x: structure.x + structure.width, y },
    ];
  }
  const x = structure.x + structure.width / 2;
  return [
    { x, y: structure.y },
    { x, y: structure.y + structure.height },
  ];
}

/** `count` evenly spaced points along a structure's centerline (both endpoints included when count >= 2). */
function pointsAlongCenterline(structure: Structure, count: number): Point[] {
  if (count <= 0) return [];
  const [start, end] = centerlineEndpoints(structure);
  if (count === 1) {
    return [{ x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 }];
  }
  return Array.from({ length: count }, (_, i) => {
    const t = i / (count - 1);
    return { x: start.x + (end.x - start.x) * t, y: start.y + (end.y - start.y) * t };
  });
}

/** 통로 길이 20m마다 1개(올림). */
export function calculateRequiredPassageLightCount(spanMeters: number): number {
  if (spanMeters <= 0) return 0;
  return Math.ceil(spanMeters / MAX_PASSAGE_SPACING_METERS);
}

/** Whether two axis-aligned rectangles touch or nearly touch (within tolerance). */
function rectanglesAreAdjacent(a: Structure, b: Structure): boolean {
  const aLeft = a.x - ADJACENCY_TOLERANCE_PX;
  const aRight = a.x + a.width + ADJACENCY_TOLERANCE_PX;
  const aTop = a.y - ADJACENCY_TOLERANCE_PX;
  const aBottom = a.y + a.height + ADJACENCY_TOLERANCE_PX;
  const overlapsX = aLeft <= b.x + b.width && aRight >= b.x;
  const overlapsY = aTop <= b.y + b.height && aBottom >= b.y;
  return overlapsX && overlapsY;
}

/**
 * The point where two adjacent passage segments meet and change direction
 * (a "bend"), or null if they don't touch or continue in the same direction.
 *
 * TODO: this is a bounding-box heuristic, not real corridor/path topology
 * (which the data model doesn't have yet) — it flags any two touching
 * segments with different orientations as a turn.
 */
function findBendPoint(a: Structure, b: Structure): Point | null {
  if (orientationOf(a) === orientationOf(b)) return null;
  if (!rectanglesAreAdjacent(a, b)) return null;

  const aCenter = { x: a.x + a.width / 2, y: a.y + a.height / 2 };
  const bCenter = { x: b.x + b.width / 2, y: b.y + b.height / 2 };
  // Approximate the corner where the two segments meet as the midpoint
  // between the closest point on each segment's own box to the other's center.
  const clampedToA = {
    x: Math.min(Math.max(bCenter.x, a.x), a.x + a.width),
    y: Math.min(Math.max(bCenter.y, a.y), a.y + a.height),
  };
  const clampedToB = {
    x: Math.min(Math.max(aCenter.x, b.x), b.x + b.width),
    y: Math.min(Math.max(aCenter.y, b.y), b.y + b.height),
  };
  return { x: (clampedToA.x + clampedToB.x) / 2, y: (clampedToA.y + clampedToB.y) / 2 };
}

function findAllBendPoints(segments: Structure[]): Point[] {
  const bends: Point[] = [];
  for (let i = 0; i < segments.length; i += 1) {
    for (let j = i + 1; j < segments.length; j += 1) {
      const bend = findBendPoint(segments[i], segments[j]);
      if (bend) bends.push(bend);
    }
  }
  return bends;
}

function findOwningSegment(point: Point, segments: Structure[]): Structure | undefined {
  return segments.find(
    (s) =>
      point.x >= s.x - ADJACENCY_TOLERANCE_PX &&
      point.x <= s.x + s.width + ADJACENCY_TOLERANCE_PX &&
      point.y >= s.y - ADJACENCY_TOLERANCE_PX &&
      point.y <= s.y + s.height + ADJACENCY_TOLERANCE_PX
  );
}

function buildLight(
  floorId: string,
  structureId: string,
  category: ExitLightCategory,
  point: Point,
  isBendPoint: boolean
): ExitLight {
  return {
    id: createId("exit-light"),
    floorId,
    structureId,
    category,
    x: point.x,
    y: point.y,
    isBendPoint,
    isAutoPlaced: true,
  };
}

/**
 * 복도통로유도등: 20m-interval passage lighting for corridor structures —
 * evenly spaced lights along each corridor's centerline, plus a mandatory
 * light at every point where two corridors meet and change direction.
 */
export function calculatePassageLightPlacements(
  floorId: string,
  segments: Structure[],
  category: ExitLightCategory,
  scale: number
): ExitLight[] {
  const lights: ExitLight[] = [];

  for (const segment of segments) {
    const spanMeters = pixelLengthToMeters(spanLengthPx(segment), scale);
    const count = calculateRequiredPassageLightCount(spanMeters);
    for (const point of pointsAlongCenterline(segment, count)) {
      lights.push(buildLight(floorId, segment.id, category, point, false));
    }
  }

  for (const bend of findAllBendPoints(segments)) {
    const alreadyCovered = lights.some((light) => distance(light, bend) <= BEND_DEDUPE_TOLERANCE_PX);
    if (alreadyCovered) continue;
    const owner = findOwningSegment(bend, segments);
    lights.push(buildLight(floorId, owner?.id ?? segments[0].id, category, bend, true));
  }

  return lights;
}

/** 피난구유도등: one at every entrance (공동현관/비상구/문 모두 피난구로 간주). */
export function calculateExitLightPlacements(floor: Floor): ExitLight[] {
  return floor.structures
    .filter((s) => s.type === "entrance")
    .map((entrance) =>
      buildLight(
        floor.id,
        entrance.id,
        "EXIT",
        { x: entrance.x + entrance.width / 2, y: entrance.y + entrance.height / 2 },
        false
      )
    );
}

/**
 * 계단통로유도등: one per stairs structure.
 *
 * TODO: fire code requires one light per stair *landing* (계단참) and every
 * ramp landing (경사로참); the data model doesn't yet distinguish individual
 * landings within a stairs structure, so this places a single light per
 * stairs structure as a stand-in until landing data exists.
 */
export function calculateStairLightPlacements(floor: Floor): ExitLight[] {
  return floor.structures
    .filter((s) => s.type === "stairs")
    .map((stairs) =>
      buildLight(
        floor.id,
        stairs.id,
        "STAIRS",
        { x: stairs.x + stairs.width / 2, y: stairs.y + stairs.height / 2 },
        false
      )
    );
}

export type ExitLightSummary = {
  exitCount: number;
  corridorCount: number;
  stairsCount: number;
  totalCount: number;
};

export function summarizeExitLights(lights: ExitLight[]): ExitLightSummary {
  const countOf = (category: ExitLightCategory) =>
    lights.filter((light) => light.category === category).length;

  return {
    exitCount: countOf("EXIT"),
    corridorCount: countOf("CORRIDOR"),
    stairsCount: countOf("STAIRS"),
    totalCount: lights.length,
  };
}

export function autoPlaceExitLights(floor: Floor, scale: number): ExitLight[] {
  const corridors = floor.structures.filter((s) => s.type === "corridor");

  return [
    ...calculateExitLightPlacements(floor),
    ...calculatePassageLightPlacements(floor.id, corridors, "CORRIDOR", scale),
    ...calculateStairLightPlacements(floor),
  ];
}
