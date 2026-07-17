// TODO: 실제 소방 기준(감지기 종류별 보호면적 등)이 정해지면 coverageArea 계산을 교체 예정.
// 현재는 사용자가 직접 입력한 보호면적을 기준으로 동작하는 Mock 설정.
export interface HeatDetectorSettings {
  /** m² per detector. */
  coverageArea: number;
}

// Detector type. To add a new type: extend this enum and add a matching
// entry in HEAT_DETECTOR_TYPE_LABELS (constants/heatDetectorTypes.ts).
export enum HeatDetectorType {
  DIFFERENTIAL = "DIFFERENTIAL", // 차동식
  FIXED_TEMPERATURE = "FIXED_TEMPERATURE", // 정온식
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
  type: HeatDetectorType;
  isAutoPlaced: boolean;
}
