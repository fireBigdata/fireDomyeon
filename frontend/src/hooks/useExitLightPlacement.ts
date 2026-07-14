"use client";

import { useCallback, useState } from "react";
import type { ExitLight } from "@/types/exitLight";
import type { Floor } from "@/types/floorplan";
import {
  autoPlaceExitLights,
  summarizeExitLights,
  type ExitLightSummary,
} from "@/lib/exitLightPlacement";

export function useExitLightPlacement(
  floor: Floor,
  scale: number,
  onPlaced: (lights: ExitLight[]) => void
) {
  const [summary, setSummary] = useState<ExitLightSummary | null>(null);

  const autoPlace = useCallback(() => {
    const lights = autoPlaceExitLights(floor, scale);
    setSummary(summarizeExitLights(lights));
    onPlaced(lights);
  }, [floor, scale, onPlaced]);

  return { summary, autoPlace };
}
