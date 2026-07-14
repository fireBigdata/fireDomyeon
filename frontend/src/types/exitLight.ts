// 피난구유도등(EXIT) / 복도통로유도등(CORRIDOR) / 계단통로유도등(STAIRS)
export type ExitLightCategory = "EXIT" | "CORRIDOR" | "STAIRS";

export interface ExitLight {
  id: string;
  floorId: string;
  /** Structure (entrance/corridor/room/stairs) this light was placed for. */
  structureId: string;
  category: ExitLightCategory;
  /** Absolute canvas coordinates, consistent with ExtinguisherPlacement/HeatDetector. */
  x: number;
  y: number;
  /** True when placed to satisfy the mandatory bend/turn rule, not the regular spacing rule. */
  isBendPoint: boolean;
  isAutoPlaced: boolean;
}
