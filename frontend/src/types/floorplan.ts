export type StructureType =
  | "room"
  | "corridor"
  | "entrance"
  | "elevator"
  | "stairs";

export type FacilityType = "apartment" | "house";

export type Structure = {
  id: string;
  type: StructureType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
};

export type FloorPlanState = {
  id?: string;
  name: string;
  facilityType: FacilityType;
  structures: Structure[];
  selectedStructureId: string | null;
  scale: number;
};
