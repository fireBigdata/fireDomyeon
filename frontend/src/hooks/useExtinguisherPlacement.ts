"use client";

import { useCallback, useState } from "react";
import type { ExtinguisherPlacement } from "@/types/extinguisher";
import type { FacilityType, Floor } from "@/types/floorplan";
import {
  DEFAULT_ABILITY_UNITS_PER_EXTINGUISHER,
  DEFAULT_EXTINGUISHER_TYPE_ID,
} from "@/constants/extinguisherTypes";
import type { StructureExtinguisherSummary } from "@/lib/extinguisherPlacement";
import {
  planApartmentExtinguisherPlacement,
  planNonApartmentExtinguisherPlacement,
} from "@/lib/extinguisherPlacement";

export type ExtinguisherSummary =
  | {
      facilityType: "house";
      totalFloorArea: number;
      abilityUnitsPerExtinguisher: number;
      requiredAbilityUnits: number;
      minimumCountByArea: number;
      addedByDistanceRule: number;
      finalCount: number;
      byStructure: StructureExtinguisherSummary[];
    }
  | {
      facilityType: "apartment";
      livingRoomCount: number;
      corridorCount: number;
      finalCount: number;
      byStructure: StructureExtinguisherSummary[];
    };

const INVALID_ABILITY_MESSAGE = "소화기 1개당 능력단위는 0보다 큰 숫자여야 합니다.";

function parseAbilityUnits(input: string): number | null {
  if (input.trim() === "") return null;
  const value = Number(input);
  if (!Number.isFinite(value) || value <= 0) return null;
  return value;
}

export function useExtinguisherPlacement(
  floor: Floor,
  facilityType: FacilityType,
  scale: number,
  onPlaced: (placements: ExtinguisherPlacement[]) => void
) {
  const [typeId, setTypeId] = useState(DEFAULT_EXTINGUISHER_TYPE_ID);
  const [abilityUnitsInput, setAbilityUnitsInputState] = useState(
    String(DEFAULT_ABILITY_UNITS_PER_EXTINGUISHER)
  );
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<ExtinguisherSummary | null>(null);

  const setAbilityUnitsInput = useCallback((value: string) => {
    setAbilityUnitsInputState(value);
    setError(parseAbilityUnits(value) === null ? INVALID_ABILITY_MESSAGE : null);
  }, []);

  const autoPlace = useCallback(() => {
    if (facilityType === "apartment") {
      const result = planApartmentExtinguisherPlacement(floor, scale, typeId);
      setError(null);
      setSummary({
        facilityType: "apartment",
        livingRoomCount: result.livingRoomCount,
        corridorCount: result.corridorCount,
        finalCount: result.finalCount,
        byStructure: result.byStructure,
      });
      onPlaced(result.placements);
      return;
    }

    const abilityUnits = parseAbilityUnits(abilityUnitsInput);
    if (abilityUnits === null) {
      setError(INVALID_ABILITY_MESSAGE);
      return;
    }

    const result = planNonApartmentExtinguisherPlacement(floor, scale, abilityUnits, typeId);
    setSummary({
      facilityType: "house",
      totalFloorArea: result.totalFloorArea,
      abilityUnitsPerExtinguisher: result.abilityUnitsPerExtinguisher,
      requiredAbilityUnits: result.requiredAbilityUnits,
      minimumCountByArea: result.minimumCountByArea,
      addedByDistanceRule: result.addedByDistanceRule,
      finalCount: result.finalCount,
      byStructure: result.byStructure,
    });
    onPlaced(result.placements);
  }, [facilityType, floor, scale, typeId, abilityUnitsInput, onPlaced]);

  return {
    typeId,
    setTypeId,
    abilityUnitsInput,
    setAbilityUnitsInput,
    error,
    summary,
    autoPlace,
  };
}
