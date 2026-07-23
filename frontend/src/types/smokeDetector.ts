// 복도·통로(CORRIDOR) / 계단·경사로(STAIRS) / 승강로(ELEVATOR) /
// 공동주택 세대 내 침실·거실(ROOM, NFTC 608 2.7.1.3)
export type SmokeDetectorCategory = "CORRIDOR" | "STAIRS" | "ELEVATOR" | "ROOM";

export interface SmokeDetector {
  id: string;
  floorId: string;
  /** Structure (corridor/stairs/elevator) this detector was placed for. */
  structureId: string;
  category: SmokeDetectorCategory;
  /** Absolute canvas coordinates, consistent with HeatDetector/ExitLight. */
  x: number;
  y: number;
  isAutoPlaced: boolean;
}
