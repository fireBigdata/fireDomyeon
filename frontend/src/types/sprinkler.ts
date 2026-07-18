// Special hazard classification for a single room, set by the user when the
// space doesn't fit the default residential/general case (NFTC 103 2.2.1).
// Only meaningful when Structure.type === "room".
export enum SprinklerHazardClass {
  NONE = "NONE",
  // 특수가연물 저장·취급 장소.
  SPECIAL_COMBUSTIBLE = "SPECIAL_COMBUSTIBLE",
  // 무대부.
  STAGE = "STAGE",
}

export enum SprinklerHeadType {
  // 표준형(폐쇄형) 헤드 — the general-purpose case.
  STANDARD_CLOSED = "STANDARD_CLOSED",
  // 주거용 스프링클러헤드 — 공동주택(아파트등) 세대 내.
  RESIDENTIAL = "RESIDENTIAL",
  // 개방형 헤드 — 무대부 등.
  OPEN = "OPEN",
}

// One status per calculated space (STEP 11). NOT_APPLICABLE is an addition
// for spaces/facility types sprinkler installation doesn't apply to at all
// (kept distinct from REVIEW_REQUIRED, which means "might apply, unclear").
export enum SprinklerComplianceStatus {
  COMPLIANT_CALCULATION = "COMPLIANT_CALCULATION",
  REVIEW_REQUIRED = "REVIEW_REQUIRED",
  OBSTRUCTION_REVIEW_REQUIRED = "OBSTRUCTION_REVIEW_REQUIRED",
  INVALID_LAYOUT = "INVALID_LAYOUT",
  NOT_APPLICABLE = "NOT_APPLICABLE",
}

export interface SprinklerHead {
  id: string;
  floorId: string;
  roomId: string;
  /** Set when placed inside a specific partition leaf rather than the whole room. */
  partitionId?: string;
  /** Absolute canvas coordinates, consistent with HeatDetector/ExtinguisherPlacement. */
  x: number;
  y: number;
  headType: SprinklerHeadType;
  isAutoPlaced: boolean;
  /** Id of the SprinklerRuleDefinition (lib/sprinklerRules.ts) applied to this head's space. */
  ruleId: string;
  /** The horizontal-distance criterion (R, in meters) applied when placing this head. */
  horizontalDistanceM: number;
}

// Per-space result of the classification + placement pipeline, independent
// of how many heads that space ended up with — used to drive panel summaries
// and canvas warnings even for spaces where no heads could be placed.
export interface RoomSprinklerResult {
  structureId: string;
  status: SprinklerComplianceStatus;
  ruleId: string | null;
  horizontalDistanceM: number | null;
  headType: SprinklerHeadType | null;
  classificationReason: string;
  warnings: string[];
  headCount: number;
}

export interface SprinklerPlacementResult {
  applicable: boolean;
  /** Present only when applicable is false (e.g. facilityType === "house"). */
  notApplicableReason: string | null;
  heads: SprinklerHead[];
  results: RoomSprinklerResult[];
}
