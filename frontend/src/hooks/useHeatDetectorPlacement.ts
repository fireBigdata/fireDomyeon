"use client";

import { useCallback, useState } from "react";
import type { Floor, HeatDetector } from "@/types/floorplan";
import { DEFAULT_COVERAGE_AREA } from "@/constants/heatDetector";
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

const INVALID_MESSAGE = "보호면적은 0보다 큰 숫자여야 합니다.";

function parseCoverageArea(input: string): number | null {
  if (input.trim() === "") return null;
  const value = Number(input);
  if (!Number.isFinite(value) || value <= 0) return null;
  return value;
}

export function useHeatDetectorPlacement(
  floor: Floor,
  scale: number,
  onPlaced: (detectors: HeatDetector[]) => void
) {
  const [coverageAreaInput, setCoverageAreaInputState] = useState(
    String(DEFAULT_COVERAGE_AREA)
  );
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<HeatDetectorSummary | null>(null);

  const setCoverageAreaInput = useCallback((value: string) => {
    setCoverageAreaInputState(value);
    setError(parseCoverageArea(value) === null ? INVALID_MESSAGE : null);
  }, []);

  const autoPlace = useCallback(() => {
    const coverageArea = parseCoverageArea(coverageAreaInput);
    if (coverageArea === null) {
      setError(INVALID_MESSAGE);
      return;
    }

    const detectors = autoPlaceHeatDetectors(floor, coverageArea, scale);

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

    setSummary({ totalArea, totalCount: detectors.length, byRoom });
    onPlaced(detectors);
  }, [coverageAreaInput, floor, scale, onPlaced]);

  return { coverageAreaInput, setCoverageAreaInput, error, summary, autoPlace };
}
