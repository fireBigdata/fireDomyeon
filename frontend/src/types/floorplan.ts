import type { ExtinguisherPlacement } from "@/types/extinguisher";
import type { HeatDetector } from "@/types/heatDetector";
import type { ExitLight } from "@/types/exitLight";
import { SprinklerHazardClass } from "@/types/sprinkler";
import type { SprinklerHead } from "@/types/sprinkler";

export type StructureType =
  | "room"
  | "corridor"
  | "entrance"
  | "elevator"
  | "stairs";

export type FacilityType = "apartment" | "house";

// Room usage type. To add a new usage: extend this enum and add a matching
// entry in ROOM_TYPE_DEFAULTS / ROOM_TYPE_ORDER (constants/roomTypes.ts).
export enum RoomType {
  BEDROOM = "BEDROOM",
  LIVING = "LIVING",
  KITCHEN = "KITCHEN",
  BOILER = "BOILER",
}

// Entrance usage type. To add a new kind: extend this enum and add a
// matching entry in ENTRANCE_TYPE_DEFAULTS / ENTRANCE_TYPE_ORDER
// (constants/entranceTypes.ts).
export enum EntranceType {
  COMMON = "COMMON", // 공동현관
  EMERGENCY = "EMERGENCY", // 비상구
  DOOR = "DOOR", // 문
}

export type PartitionDirection = "vertical" | "horizontal";

export type PartitionLeaf = {
  kind: "leaf";
  id: string;
};

// A deleted region: keeps its slot in the tree (so siblings' layout is
// unaffected) but renders as a hole, allowing non-rectangular room shapes.
export type PartitionEmpty = {
  kind: "empty";
  id: string;
};

export type PartitionSplit = {
  kind: "split";
  id: string;
  direction: PartitionDirection;
  /** 0-1 share of the parent box given to children[0] (left/top). */
  ratio: number;
  children: [PartitionNode, PartitionNode];
};

// Tree structure so a Partition can itself be split again, arbitrarily deep.
export type PartitionNode = PartitionLeaf | PartitionEmpty | PartitionSplit;

export type Structure = {
  id: string;
  type: StructureType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  /** Only meaningful when type === "room". */
  roomType?: RoomType;
  /** Only meaningful when type === "room". Undefined = single undivided space. */
  partitions?: PartitionNode;
  /** Only meaningful when type === "entrance". */
  entranceType?: EntranceType;
  /**
   * Only meaningful when type === "room". Special sprinkler hazard
   * classification (NFTC 103 2.2.1) for this room; undefined/NONE uses the
   * default residential/general rule for the room. See lib/sprinklerRules.ts.
   */
  sprinklerHazard?: SprinklerHazardClass;
};

export type Floor = {
  id: string;
  name: string;
  structures: Structure[];
  extinguisherPlacements: ExtinguisherPlacement[];
  heatDetectors: HeatDetector[];
  exitLights: ExitLight[];
  sprinklerHeads: SprinklerHead[];
};

export type FloorPlanState = {
  id?: string;
  name: string;
  facilityType: FacilityType;
  /**
   * Whether the building's structure is fire-resistant (내화구조), used by
   * the sprinkler rule engine to pick between the 2.1m/2.3m horizontal
   * distance criteria (NFTC 103 2.2.1). Undefined = not yet confirmed by the
   * user; the engine falls back to the safer (smaller-radius) 2.1m rule and
   * flags the result for review. See lib/sprinklerRules.ts.
   */
  isFireResistantStructure?: boolean;
  floors: Floor[];
  currentFloorId: string;
  selectedStructureId: string | null;
  /** Set right after a structure is added so its tooltip stays hidden until the user re-selects it. */
  recentlyCreatedStructureId: string | null;
  selectedPartitionId: string | null;
  selectedHeatDetectorId: string | null;
  selectedExitLightId: string | null;
  selectedSprinklerHeadId: string | null;
  scale: number;
};

export type { ExtinguisherPlacement, HeatDetector, ExitLight, SprinklerHead };
export { HeatDetectorType } from "@/types/heatDetector";
export { SprinklerHazardClass, SprinklerHeadType, SprinklerComplianceStatus } from "@/types/sprinkler";
