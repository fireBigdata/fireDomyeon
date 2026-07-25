import { EntranceType, type Structure } from "@/types/floorplan";

type Point = { x: number; y: number };
type Box = { x: number; y: number; width: number; height: number };

// Small tolerance (px) so structures whose edges are meant to touch (e.g. a
// door snapped flush against a room/corridor wall) still count as adjacent
// despite minor drawing/snapping imprecision.
const ADJACENCY_TOLERANCE_PX = 4;

function rectsAdjacent(a: Box, b: Box): boolean {
  return (
    a.x - ADJACENCY_TOLERANCE_PX < b.x + b.width &&
    a.x + a.width + ADJACENCY_TOLERANCE_PX > b.x &&
    a.y - ADJACENCY_TOLERANCE_PX < b.y + b.height &&
    a.y + a.height + ADJACENCY_TOLERANCE_PX > b.y
  );
}

function center(structure: Structure): Point {
  return { x: structure.x + structure.width / 2, y: structure.y + structure.height / 2 };
}

function distance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

const DEFAULT_EXIT_ENTRANCE_TYPES: EntranceType[] = [EntranceType.COMMON, EntranceType.EMERGENCY];

export type EvacuationRoute = {
  /** Ordered structure ids from the hovered structure to the exit, inclusive. */
  structureIds: string[];
  /** Center points of each structure in `structureIds`, for drawing the route. */
  points: Point[];
  exitStructureId: string;
  exitEntranceType: EntranceType;
  totalDistancePx: number;
};

/**
 * Finds every 피난동선 (evacuation route) from `startStructureId` to each
 * reachable exit — an "entrance" structure whose entranceType is in
 * `allowedExitTypes` — on `structures` (one floor's worth), sorted nearest
 * first. Callers should restrict `allowedExitTypes` per floor: 공동현관
 * (COMMON) is the building's main entrance (ground floor only), so only 1F
 * should treat it as a valid target; every other floor only has 비상구
 * (EMERGENCY) stairwell exits to route to. When 2 or more exits exist, every
 * route is returned so all of them can be drawn — not just the nearest.
 *
 * Model: a graph where every non-obstacle structure is a node, but two
 * structures are only connected THROUGH an "entrance" structure (a door,
 * 공동현관, or 비상구) that sits adjacent to both — matching how doors
 * actually work, rooms/corridors never connect directly to each other just
 * because their rectangles happen to touch; you always have to go through an
 * opening. Dijkstra's algorithm (uniform-cost shortest-path search — the
 * same technique behind turn-by-turn navigation and most game/robot
 * pathfinding "AI") computes the minimum distance from the start to every
 * other node in one pass; a route is then reconstructed for each reachable
 * allowed exit from that single pass. Returns an empty array if the start
 * structure doesn't exist, is an obstacle, or no allowed exit is reachable —
 * callers use that to show a "no evacuation route" warning.
 */
export function findEvacuationRoutes(
  structures: Structure[],
  startStructureId: string,
  allowedExitTypes: EntranceType[] = DEFAULT_EXIT_ENTRANCE_TYPES
): EvacuationRoute[] {
  const startStructure = structures.find((s) => s.id === startStructureId);
  if (!startStructure || startStructure.type === "obstacle") return [];
  const allowedTypes = new Set(allowedExitTypes);

  const walkable = structures.filter((s) => s.type !== "obstacle");
  const entrances = walkable.filter((s) => s.type === "entrance");

  // Adjacency list built ONLY through entrance structures.
  const adjacency = new Map<string, { id: string; weight: number }[]>();
  const addEdge = (aId: string, bId: string, weight: number) => {
    if (!adjacency.has(aId)) adjacency.set(aId, []);
    if (!adjacency.has(bId)) adjacency.set(bId, []);
    adjacency.get(aId)!.push({ id: bId, weight });
    adjacency.get(bId)!.push({ id: aId, weight });
  };
  for (const entrance of entrances) {
    for (const other of walkable) {
      if (other.id === entrance.id || other.type === "entrance") continue;
      if (rectsAdjacent(entrance, other)) {
        addEdge(entrance.id, other.id, distance(center(entrance), center(other)));
      }
    }
  }

  // Dijkstra from the hovered structure. Floor plans are small (dozens of
  // structures, not thousands), so a plain array re-sorted each iteration is
  // simpler than a binary heap and plenty fast.
  const distances = new Map<string, number>([[startStructureId, 0]]);
  const previous = new Map<string, string>();
  const visited = new Set<string>();
  const queue: string[] = [startStructureId];

  while (queue.length > 0) {
    queue.sort((a, b) => (distances.get(a) ?? Infinity) - (distances.get(b) ?? Infinity));
    const currentId = queue.shift()!;
    if (visited.has(currentId)) continue;
    visited.add(currentId);

    const currentDist = distances.get(currentId) ?? Infinity;
    for (const { id: neighborId, weight } of adjacency.get(currentId) ?? []) {
      if (visited.has(neighborId)) continue;
      const candidate = currentDist + weight;
      if (candidate < (distances.get(neighborId) ?? Infinity)) {
        distances.set(neighborId, candidate);
        previous.set(neighborId, currentId);
        queue.push(neighborId);
      }
    }
  }

  const byId = new Map(structures.map((s) => [s.id, s] as const));

  const reachableExits = entrances
    .filter((entrance) => allowedTypes.has(entrance.entranceType ?? EntranceType.DOOR))
    .map((entrance) => ({ entrance, dist: distances.get(entrance.id) }))
    .filter((e): e is { entrance: Structure; dist: number } => e.dist !== undefined)
    .sort((a, b) => a.dist - b.dist);

  return reachableExits.map(({ entrance, dist }) => {
    const structureIds: string[] = [];
    let cursor: string | undefined = entrance.id;
    while (cursor !== undefined) {
      structureIds.unshift(cursor);
      if (cursor === startStructureId) break;
      cursor = previous.get(cursor);
    }
    const points = structureIds
      .map((id) => byId.get(id))
      .filter((s): s is Structure => s !== undefined)
      .map(center);

    return {
      structureIds,
      points,
      exitStructureId: entrance.id,
      exitEntranceType: entrance.entranceType ?? EntranceType.EMERGENCY,
      totalDistancePx: dist,
    };
  });
}
