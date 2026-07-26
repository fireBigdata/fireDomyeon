import { EntranceType, type Structure } from "@/types/floorplan";
import { computeLeafBoxes } from "@/lib/partitionTree";

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

export type StructureAnchor = {
  /** The occupied partition leaf this anchor represents, or null for an
   * undivided (or fully-deleted) structure's whole-bounding-box anchor. */
  leafId: string | null;
  point: Point;
};

/**
 * A structure's routing anchors: the points its evacuation route can pass
 * through / start or end at. An undivided structure has exactly one — its
 * bounding-box center, as before. A partitioned room instead gets one anchor
 * per remaining OCCUPIED partition (a deleted "empty" partition is a visual
 * hole with no real floor there, see computeLeafBoxes in lib/partitionTree.ts
 * — e.g. an L-shaped room made by splitting into 4 and deleting one corner —
 * so it gets no anchor at all), which keeps every route inside actual floor
 * space and lets a route enter/exit through whichever partition is actually
 * nearest a door. Falls back to the bounding-box center in the degenerate
 * case where every partition has been deleted.
 */
function structureRouteAnchorEntries(structure: Structure): StructureAnchor[] {
  if (!structure.partitions) return [{ leafId: null, point: center(structure) }];

  const roomBox: Box = { x: 0, y: 0, width: structure.width, height: structure.height };
  const occupiedLeaves = computeLeafBoxes(structure.partitions, roomBox).filter(
    (leaf) => leaf.kind !== "empty"
  );
  if (occupiedLeaves.length === 0) return [{ leafId: null, point: center(structure) }];

  return occupiedLeaves.map((leaf) => ({
    leafId: leaf.id,
    point: {
      x: structure.x + leaf.box.x + leaf.box.width / 2,
      y: structure.y + leaf.box.y + leaf.box.height / 2,
    },
  }));
}

export function structureRouteAnchors(structure: Structure): Point[] {
  return structureRouteAnchorEntries(structure).map((entry) => entry.point);
}

/**
 * The anchor point for one specific occupied partition (see
 * structureRouteAnchorEntries) — used to start a route from exactly the
 * partition the pointer is hovering, instead of every occupied partition at
 * once. Falls back to the structure's first anchor when `leafId` is null (no
 * specific partition hovered) or doesn't match any occupied partition (e.g.
 * the pointer is over a deleted/empty region, which has no anchor of its own).
 */
export function structureRouteAnchorForLeaf(structure: Structure, leafId: string | null): Point {
  const entries = structureRouteAnchorEntries(structure);
  const matched = leafId ? entries.find((entry) => entry.leafId === leafId) : undefined;
  return (matched ?? entries[0]).point;
}

function distance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

const DEFAULT_EXIT_ENTRANCE_TYPES: EntranceType[] = [EntranceType.COMMON, EntranceType.EMERGENCY];

export type EvacuationRoute = {
  /** Ordered structure ids from the hovered structure to the exit, inclusive.
   * Consecutive anchors that belong to the same (partitioned) structure are
   * collapsed to one entry — see `points` for the un-collapsed anchor path. */
  structureIds: string[];
  /** Ordered routing anchors (see structureRouteAnchors) actually selected by
   * Dijkstra, from the start structure to the exit — the same points used to
   * draw the route on screen, so the line always starts/passes through real
   * (non-deleted) floor space rather than a structure's raw bounding-box
   * center. */
  points: Point[];
  exitStructureId: string;
  exitEntranceType: EntranceType;
  totalDistancePx: number;
};

type AnchorNode = {
  id: string;
  structureId: string;
  leafId: string | null;
  point: Point;
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
 * Model: a graph whose nodes are routing ANCHORS (see structureRouteAnchors)
 * rather than whole structures — a partitioned room contributes one node per
 * occupied partition. Two anchors are only connected either (a) through an
 * "entrance" structure (a door, 공동현관, or 비상구) adjacent to both
 * anchors' structures, matching how doors actually work — rooms/corridors
 * never connect directly to each other just because their rectangles happen
 * to touch, you always have to go through an opening — or (b) by belonging
 * to the same structure, in which case every pair of that structure's
 * anchors is connected directly, so a partitioned room's separate occupied
 * partitions still act as one continuous walkable space. Dijkstra's
 * algorithm (uniform-cost shortest-path search — the same technique behind
 * turn-by-turn navigation and most game/robot pathfinding "AI") runs from
 * the anchor of the start structure matching `startHoveredLeafId` — the
 * specific partition the pointer is over, so the route starts exactly there
 * — falling back to EVERY anchor of the start structure at once (undivided
 * structure, or no matching occupied partition) and computing the minimum
 * distance to every other anchor in one pass; a route is then reconstructed
 * for each reachable allowed exit from that single pass. Returns an empty
 * array if the start structure doesn't exist, is an obstacle, or no allowed
 * exit is reachable — callers use that to show a "no evacuation route" warning.
 */
export function findEvacuationRoutes(
  structures: Structure[],
  startStructureId: string,
  allowedExitTypes: EntranceType[] = DEFAULT_EXIT_ENTRANCE_TYPES,
  startHoveredLeafId: string | null = null
): EvacuationRoute[] {
  const startStructure = structures.find((s) => s.id === startStructureId);
  if (!startStructure || startStructure.type === "obstacle") return [];
  const allowedTypes = new Set(allowedExitTypes);

  const walkable = structures.filter((s) => s.type !== "obstacle");
  const entrances = walkable.filter((s) => s.type === "entrance");

  // One or more anchor nodes per structure — see structureRouteAnchors.
  const anchorsByStructure = new Map<string, AnchorNode[]>();
  for (const structure of walkable) {
    anchorsByStructure.set(
      structure.id,
      structureRouteAnchorEntries(structure).map((entry, index) => ({
        id: `${structure.id}#${index}`,
        structureId: structure.id,
        leafId: entry.leafId,
        point: entry.point,
      }))
    );
  }
  const anchorById = new Map(
    walkable.flatMap((s) => anchorsByStructure.get(s.id)!).map((a) => [a.id, a] as const)
  );

  const adjacency = new Map<string, { id: string; weight: number }[]>();
  const addEdge = (aId: string, bId: string, weight: number) => {
    if (!adjacency.has(aId)) adjacency.set(aId, []);
    if (!adjacency.has(bId)) adjacency.set(bId, []);
    adjacency.get(aId)!.push({ id: bId, weight });
    adjacency.get(bId)!.push({ id: aId, weight });
  };

  // A structure's own anchors are fully connected to each other, so its
  // occupied partitions act as one continuous space rather than isolated points.
  for (const anchors of anchorsByStructure.values()) {
    for (let i = 0; i < anchors.length; i++) {
      for (let j = i + 1; j < anchors.length; j++) {
        addEdge(anchors[i].id, anchors[j].id, distance(anchors[i].point, anchors[j].point));
      }
    }
  }

  // Adjacency through entrance structures. Still checked at the STRUCTURE
  // level (full bounding boxes) — partitions are visual subdivisions inside
  // one continuous room, not separate rooms with their own doors — but every
  // anchor of the entrance connects to every anchor of the adjacent structure.
  for (const entrance of entrances) {
    const entranceAnchors = anchorsByStructure.get(entrance.id) ?? [];
    for (const other of walkable) {
      if (other.id === entrance.id || other.type === "entrance") continue;
      if (!rectsAdjacent(entrance, other)) continue;
      const otherAnchors = anchorsByStructure.get(other.id) ?? [];
      for (const a of entranceAnchors) {
        for (const b of otherAnchors) {
          addEdge(a.id, b.id, distance(a.point, b.point));
        }
      }
    }
  }

  // Single-source from the specific partition the pointer is hovering, when
  // it resolves to a real occupied-partition anchor; otherwise multi-source
  // from every anchor of the start structure at once (undivided structure,
  // or the pointer is over a deleted/empty region with no anchor of its own).
  const allStartAnchors = anchorsByStructure.get(startStructureId) ?? [];
  const hoveredAnchor = startHoveredLeafId
    ? allStartAnchors.find((a) => a.leafId === startHoveredLeafId)
    : undefined;
  const startAnchors = hoveredAnchor ? [hoveredAnchor] : allStartAnchors;
  const startAnchorIds = new Set(startAnchors.map((a) => a.id));
  const distances = new Map<string, number>(startAnchors.map((a) => [a.id, 0]));
  const previous = new Map<string, string>();
  const visited = new Set<string>();
  const queue: string[] = startAnchors.map((a) => a.id);

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

  // Nearest reachable anchor per allowed exit STRUCTURE (an entrance almost
  // always has exactly one anchor — entrances are never partitioned — but
  // this stays correct even if that ever changes).
  const reachableExits = entrances
    .filter((entrance) => allowedTypes.has(entrance.entranceType ?? EntranceType.DOOR))
    .map((entrance) => {
      const anchors = anchorsByStructure.get(entrance.id) ?? [];
      let best: { anchor: AnchorNode; dist: number } | null = null;
      for (const anchor of anchors) {
        const dist = distances.get(anchor.id);
        if (dist === undefined) continue;
        if (!best || dist < best.dist) best = { anchor, dist };
      }
      return best ? { entrance, anchor: best.anchor, dist: best.dist } : null;
    })
    .filter(
      (e): e is { entrance: Structure; anchor: AnchorNode; dist: number } => e !== null
    )
    .sort((a, b) => a.dist - b.dist);

  return reachableExits.map(({ entrance, anchor, dist }) => {
    const anchorIds: string[] = [];
    let cursor: string | undefined = anchor.id;
    while (cursor !== undefined) {
      anchorIds.unshift(cursor);
      if (startAnchorIds.has(cursor)) break;
      cursor = previous.get(cursor);
    }

    const points = anchorIds.map((id) => anchorById.get(id)!.point);

    // Collapse consecutive anchors belonging to the same structure (e.g. two
    // hops between occupied partitions of the same partitioned room) into a
    // single structureIds entry.
    const structureIds: string[] = [];
    for (const id of anchorIds) {
      const structureId = anchorById.get(id)!.structureId;
      if (structureIds[structureIds.length - 1] !== structureId) {
        structureIds.push(structureId);
      }
    }

    return {
      structureIds,
      points,
      exitStructureId: entrance.id,
      exitEntranceType: entrance.entranceType ?? EntranceType.EMERGENCY,
      totalDistancePx: dist,
    };
  });
}
