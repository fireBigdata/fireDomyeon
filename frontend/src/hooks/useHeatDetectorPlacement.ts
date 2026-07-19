"use client";

import { useCallback, useState } from "react";
import type { Floor, HeatDetector } from "@/types/floorplan";
import type { EquipmentProduct } from "@/types/equipmentSelection";
import { HeatDetectorType } from "@/types/heatDetector";
import { DEFAULT_ROOM_TYPE, ROOM_TYPE_DEFAULTS } from "@/constants/roomTypes";
import {
  HEAT_DETECTOR_TYPE_LABELS,
  getHeatDetectorTypeForRoom,
} from "@/constants/heatDetectorTypes";
import { autoPlaceHeatDetectors } from "@/lib/heatDetectorPlacement";
import { computeEffectivePixelArea } from "@/lib/partitionTree";
import { pixelAreaToSquareMeters } from "@/lib/area";

export type HeatDetectorRoomSummary = {
  roomId: string;
  label: string;
  typeLabel: string;
  count: number;
};

export type HeatDetectorSummary = {
  totalArea: number;
  totalCount: number;
  byRoom: HeatDetectorRoomSummary[];
};

const NO_PRODUCT_MESSAGE =
  "설비 선택 페이지에서 차동식열감지기와 정온식열감지기를 먼저 선택해주세요.";
const NO_ABILITY_UNIT_MESSAGE =
  "선택한 감지기의 보호면적이 아직 등록되지 않았습니다.";

export function useHeatDetectorPlacement(
  floor: Floor,
  scale: number,
  differentialProduct: EquipmentProduct | null,
  fixedTemperatureProduct: EquipmentProduct | null,
  onPlaced: (detectors: HeatDetector[]) => void
) {
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<HeatDetectorSummary | null>(null);

  const autoPlace = useCallback(() => {
    if (!differentialProduct || !fixedTemperatureProduct) {
      setError(NO_PRODUCT_MESSAGE);
      return;
    }

    if (
      differentialProduct.abilityUnit == null ||
      differentialProduct.abilityUnit <= 0 ||
      fixedTemperatureProduct.abilityUnit == null ||
      fixedTemperatureProduct.abilityUnit <= 0
    ) {
      setError(NO_ABILITY_UNIT_MESSAGE);
      return;
    }

    const coverageAreaByType = {
      [HeatDetectorType.DIFFERENTIAL]: differentialProduct.abilityUnit,
      [HeatDetectorType.FIXED_TEMPERATURE]: fixedTemperatureProduct.abilityUnit,
    };

    const detectors = autoPlaceHeatDetectors(floor, coverageAreaByType, scale);

    const rooms = floor.structures.filter((s) => s.type === "room");
    const totalArea = rooms.reduce(
      (sum, room) =>
        sum + pixelAreaToSquareMeters(computeEffectivePixelArea(room), scale),
      0
    );
    const byRoom: HeatDetectorRoomSummary[] = rooms.map((room) => ({
      roomId: room.id,
      label: ROOM_TYPE_DEFAULTS[room.roomType ?? DEFAULT_ROOM_TYPE].label,
      typeLabel: HEAT_DETECTOR_TYPE_LABELS[getHeatDetectorTypeForRoom(room.roomType)],
      count: detectors.filter((detector) => detector.roomId === room.id).length,
    }));

    setError(null);
    setSummary({ totalArea, totalCount: detectors.length, byRoom });
    onPlaced(detectors);
  }, [differentialProduct, fixedTemperatureProduct, floor, scale, onPlaced]);

  return { error, summary, autoPlace };
}
