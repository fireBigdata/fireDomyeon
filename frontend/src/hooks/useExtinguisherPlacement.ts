"use client";

import { useCallback, useMemo, useState } from "react";
import type { ExtinguisherPlacement, Structure } from "@/types/floorplan";
import {
  DEFAULT_EXTINGUISHER_TYPE_ID,
  EXTINGUISHER_TYPES,
} from "@/constants/extinguisherTypes";
import { autoPlaceExtinguishers } from "@/lib/extinguisherPlacement";

type AutoPlaceSummary = {
  totalArea: number;
  requiredCount: number;
};

export function useExtinguisherPlacement(
  structures: Structure[],
  scale: number,
  onPlaced: (placements: ExtinguisherPlacement[]) => void
) {
  const [typeId, setTypeId] = useState(DEFAULT_EXTINGUISHER_TYPE_ID);
  const [summary, setSummary] = useState<AutoPlaceSummary | null>(null);

  const selectedType = useMemo(
    () =>
      EXTINGUISHER_TYPES.find((type) => type.id === typeId) ??
      EXTINGUISHER_TYPES[0],
    [typeId]
  );

  const autoPlace = useCallback(() => {
    const { totalArea, requiredCount, placements } = autoPlaceExtinguishers(
      structures,
      scale,
      selectedType
    );
    setSummary({ totalArea, requiredCount });
    onPlaced(placements);
  }, [structures, scale, selectedType, onPlaced]);

  return { typeId, setTypeId, selectedType, summary, autoPlace };
}
