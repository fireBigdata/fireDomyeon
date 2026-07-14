// TODO: 실제 소방 기준(감지기 종류별 보호면적 등)이 정해지면 coverageArea 계산을 교체 예정.
// 현재는 사용자가 직접 입력한 보호면적을 기준으로 동작하는 Mock 설정.
export interface HeatDetectorSettings {
  /** m² per detector. */
  coverageArea: number;
}

export interface HeatDetector {
  id: string;
  floorId: string;
  roomId: string;
  /** Set when placed inside a specific partition leaf rather than the whole room. */
  partitionId?: string;
  /** Absolute canvas coordinates, consistent with ExtinguisherPlacement. */
  x: number;
  y: number;
  coverageArea: number;
  isAutoPlaced: boolean;
}
