// 복도·통로(CORRIDOR) / 계단·경사로(STAIRS) / 승강로(ELEVATOR)
export type SmokeDetectorCategory = "CORRIDOR" | "STAIRS" | "ELEVATOR";

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
