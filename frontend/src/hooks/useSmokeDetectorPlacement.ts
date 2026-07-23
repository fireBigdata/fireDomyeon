"use client";

import { useCallback, useState } from "react";
import type { SmokeDetector } from "@/types/smokeDetector";
import type { Floor } from "@/types/floorplan";
import {
  autoPlaceSmokeDetectors,
  summarizeSmokeDetectors,
  type SmokeDetectorSummary,
} from "@/lib/smokeDetectorPlacement";

export function useSmokeDetectorPlacement(
  floor: Floor,
  scale: number,
  onPlaced: (detectors: SmokeDetector[]) => void
) {
  const [summary, setSummary] = useState<SmokeDetectorSummary | null>(null);

  const autoPlace = useCallback(() => {
    const detectors = autoPlaceSmokeDetectors(floor, scale);
    setSummary(summarizeSmokeDetectors(detectors));
    onPlaced(detectors);
  }, [floor, scale, onPlaced]);

  return { summary, autoPlace };
}
