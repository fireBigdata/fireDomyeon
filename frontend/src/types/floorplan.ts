import type { ExtinguisherPlacement } from "@/types/extinguisher";
import type { HeatDetector } from "@/types/heatDetector";
import type { ExitLight } from "@/types/exitLight";

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
  LIVING = "LIVING",
  KITCHEN = "KITCHEN",
  BOILER = "BOILER",
  HALLWAY = "HALLWAY",
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
};

export type Floor = {
  id: string;
  name: string;
  structures: Structure[];
  extinguisherPlacements: ExtinguisherPlacement[];
  heatDetectors: HeatDetector[];
  exitLights: ExitLight[];
};

export type FloorPlanState = {
  id?: string;
  name: string;
  facilityType: FacilityType;
  floors: Floor[];
  currentFloorId: string;
  selectedStructureId: string | null;
  selectedPartitionId: string | null;
  selectedHeatDetectorId: string | null;
  selectedExitLightId: string | null;
  scale: number;
};

export type { ExtinguisherPlacement, HeatDetector, ExitLight };
