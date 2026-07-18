import type { Floor, Structure } from "@/types/floorplan";
import { SprinklerComplianceStatus } from "@/types/sprinkler";
import type { RoomSprinklerResult, SprinklerHead, SprinklerPlacementResult } from "@/types/sprinkler";
import {
  classifyStructureForSprinkler,
  getFacilitySprinklerApplicability,
  SPRINKLER_RULES,
} from "@/lib/sprinklerRules";
import type { SprinklerClassificationContext, SprinklerRuleId } from "@/lib/sprinklerRules";
import { createId } from "@/lib/id";
import { metersToPixelLength } from "@/lib/area";
import { computeLeafBoxes, type Box } from "@/lib/partitionTree";

export type Point = { x: number; y: number };
export type SprinklerGrid = { rows: number; columns: number };

// No obstruction/beam/column/duct data exists anywhere in this app's data
// model yet (Structure has no such field). STEP 7 requires obstruction
// compliance never be silently assumed, so every placed space carries this
// warning and an OBSTRUCTION_REVIEW_REQUIRED status until such data exists.
const OBSTRUCTION_NO_DATA_WARNING =
  "장애물(보/기둥/덕트/랙 등) 데이터가 없어 살수·감열 방해 여부를 확인할 수 없습니다. 추가 천장/장애물 데이터가 필요합니다.";

/**
 * Square-grid spacing (S) for a required horizontal-distance criterion R: a
 * head centered in an S×S cell covers every point in that cell within R
 * exactly when S = R * sqrt(2) (the cell's half-diagonal). Using this bound
 * on both cell width and cell height guarantees full coverage of the region
 * (STEP 4's "distance to nearest head" requirement), not just a visually
 * plausible grid.
 */
function maxSpacingForRadius(radiusM: number): number {
  return radiusM * Math.SQRT2;
}

/** Minimal rows/columns whose cells each satisfy the `maxSpacing` bound (STEP 5.2/5.3). */
export function calculateMinimalSprinklerGrid(
  width: number,
  height: number,
  maxSpacing: number
): SprinklerGrid {
  if (maxSpacing <= 0 || width <= 0 || height <= 0) {
    return { rows: 0, columns: 0 };
  }
  return {
    rows: Math.max(1, Math.ceil(height / maxSpacing)),
    columns: Math.max(1, Math.ceil(width / maxSpacing)),
  };
}

/** Places heads at the center of each grid cell — evenly distributed, centered, and never crowding a wall more than half a cell (STEP 5.4). */
export function calculateSprinklerPositions(box: Box, grid: SprinklerGrid): Point[] {
  if (grid.rows <= 0 || grid.columns <= 0) return [];

  const cellWidth = box.width / grid.columns;
  const cellHeight = box.height / grid.rows;
  const points: Point[] = [];

  for (let row = 0; row < grid.rows; row += 1) {
    for (let col = 0; col < grid.columns; col += 1) {
      points.push({
        x: box.x + cellWidth * (col + 0.5),
        y: box.y + cellHeight * (row + 0.5),
      });
    }
  }
  return points;
}

/**
 * Room-local (0,0-origin) rectangular regions to cover — one per non-empty
 * partition leaf, or the whole room when undivided. Mirrors
 * heatDetectorPlacement's region handling so sprinklers respect the same
 * rectilinear (leaf-decomposed) room shapes; this only covers shapes
 * expressible as a union of axis-aligned rectangles via the partition tree —
 * the drawing tool has no other polygon primitive (STEP 6).
 */
function getPlacementRegions(structure: Structure): Box[] {
  const box: Box = { x: 0, y: 0, width: structure.width, height: structure.height };
  if (!structure.partitions) return [box];

  const leaves = computeLeafBoxes(structure.partitions, box).filter(
    (leaf) => leaf.kind !== "empty"
  );
  return leaves.length > 0 ? leaves.map((leaf) => leaf.box) : [box];
}

export type StructureSprinklerPlacement = {
  result: RoomSprinklerResult;
  heads: SprinklerHead[];
};

/**
 * Runs the full legal placement pipeline (STEP 2 → STEP 7) for one
 * structure: classify → select the rule → generate the minimum covering
 * grid per region → assign a compliance status. Returns a result even when
 * no heads are placed (e.g. NOT_APPLICABLE, INVALID_LAYOUT) so the caller
 * can always show a status instead of silently omitting the space.
 */
export function planStructureSprinklerPlacement(
  floor: Floor,
  structure: Structure,
  context: SprinklerClassificationContext,
  scale: number
): StructureSprinklerPlacement {
  const classification = classifyStructureForSprinkler(structure, context);

  if (!classification.applicable || !classification.ruleId) {
    return {
      result: {
        structureId: structure.id,
        status: SprinklerComplianceStatus.NOT_APPLICABLE,
        ruleId: null,
        horizontalDistanceM: null,
        headType: null,
        classificationReason: classification.notApplicableReason ?? "",
        warnings: [],
        headCount: 0,
      },
      heads: [],
    };
  }

  const ruleId: SprinklerRuleId = classification.ruleId;
  const rule = SPRINKLER_RULES[ruleId];
  const maxSpacingPx = metersToPixelLength(maxSpacingForRadius(rule.horizontalDistanceM), scale);

  const regions = getPlacementRegions(structure);
  const heads: SprinklerHead[] = [];
  let anyUsableRegion = false;
  let anyRegionInvalid = false;

  for (const region of regions) {
    if (region.width <= 0 || region.height <= 0) continue;
    anyUsableRegion = true;

    const grid = calculateMinimalSprinklerGrid(region.width, region.height, maxSpacingPx);
    if (grid.rows <= 0 || grid.columns <= 0) {
      anyRegionInvalid = true;
      continue;
    }

    for (const point of calculateSprinklerPositions(region, grid)) {
      heads.push({
        id: createId("sprinkler"),
        floorId: floor.id,
        roomId: structure.id,
        x: structure.x + point.x,
        y: structure.y + point.y,
        headType: rule.headType,
        isAutoPlaced: true,
        ruleId: rule.id,
        horizontalDistanceM: rule.horizontalDistanceM,
      });
    }
  }

  const warnings = [...classification.warnings, OBSTRUCTION_NO_DATA_WARNING];

  let status: SprinklerComplianceStatus;
  if (!anyUsableRegion || anyRegionInvalid || heads.length === 0) {
    status = SprinklerComplianceStatus.INVALID_LAYOUT;
  } else if (classification.requiresReview) {
    status = SprinklerComplianceStatus.REVIEW_REQUIRED;
  } else {
    // Classification is confident and geometry is valid, but obstruction
    // data is never available in this app today (see OBSTRUCTION_NO_DATA_WARNING
    // above), so COMPLIANT_CALCULATION is reserved for once that data exists.
    status = SprinklerComplianceStatus.OBSTRUCTION_REVIEW_REQUIRED;
  }

  return {
    result: {
      structureId: structure.id,
      status,
      ruleId: rule.id,
      horizontalDistanceM: rule.horizontalDistanceM,
      headType: rule.headType,
      classificationReason: classification.classificationReason,
      warnings,
      headCount: heads.length,
    },
    heads,
  };
}

// ---------------------------------------------------------------------------
// Boundary / duplicate validation (STEP 7) — a self-check over generated
// heads, kept separate from generation so tests can exercise it directly.
// By construction (grid cells are disjoint and clipped to the region box)
// these should never find anything; they exist as an explicit safety net
// rather than an implicit assumption.
// ---------------------------------------------------------------------------

const BOUNDARY_TOLERANCE_PX = 0.01;
const DUPLICATE_TOLERANCE_PX = 0.01;

export function findHeadsOutsideStructureBounds(
  heads: SprinklerHead[],
  structures: Structure[]
): SprinklerHead[] {
  const byId = new Map(structures.map((s) => [s.id, s]));
  return heads.filter((head) => {
    const owner = byId.get(head.roomId);
    if (!owner) return true;
    return (
      head.x < owner.x - BOUNDARY_TOLERANCE_PX ||
      head.x > owner.x + owner.width + BOUNDARY_TOLERANCE_PX ||
      head.y < owner.y - BOUNDARY_TOLERANCE_PX ||
      head.y > owner.y + owner.height + BOUNDARY_TOLERANCE_PX
    );
  });
}

export function findDuplicateSprinklerHeads(heads: SprinklerHead[]): SprinklerHead[] {
  const seen: Point[] = [];
  const duplicates: SprinklerHead[] = [];
  for (const head of heads) {
    const isDuplicate = seen.some(
      (p) =>
        Math.abs(p.x - head.x) < DUPLICATE_TOLERANCE_PX &&
        Math.abs(p.y - head.y) < DUPLICATE_TOLERANCE_PX
    );
    if (isDuplicate) {
      duplicates.push(head);
    } else {
      seen.push({ x: head.x, y: head.y });
    }
  }
  return duplicates;
}

// ---------------------------------------------------------------------------
// Orchestration — the full floor.
// ---------------------------------------------------------------------------

export type SprinklerFloorSummary = {
  applicable: boolean;
  notApplicableReason: string | null;
  totalHeadCount: number;
  results: RoomSprinklerResult[];
};

/**
 * Computes and places sprinkler heads for every applicable room/corridor on
 * the given floor (STEP 2 → STEP 11). Pure function: does not touch React
 * state — callers decide how to merge the result with any existing
 * (manually placed) heads.
 */
export function autoPlaceSprinklers(
  floor: Floor,
  context: SprinklerClassificationContext,
  scale: number
): SprinklerPlacementResult {
  const facilityApplicability = getFacilitySprinklerApplicability(context.facilityType);
  if (!facilityApplicability.applicable) {
    return {
      applicable: false,
      notApplicableReason: facilityApplicability.reason,
      heads: [],
      results: [],
    };
  }

  const heads: SprinklerHead[] = [];
  const results: RoomSprinklerResult[] = [];

  for (const structure of floor.structures) {
    const placement = planStructureSprinklerPlacement(floor, structure, context, scale);
    if (placement.result.status === SprinklerComplianceStatus.NOT_APPLICABLE) continue;
    results.push(placement.result);
    heads.push(...placement.heads);
  }

  return { applicable: true, notApplicableReason: null, heads, results };
}

export function summarizeSprinklerPlacement(result: SprinklerPlacementResult): SprinklerFloorSummary {
  return {
    applicable: result.applicable,
    notApplicableReason: result.notApplicableReason,
    totalHeadCount: result.heads.length,
    results: result.results,
  };
}
