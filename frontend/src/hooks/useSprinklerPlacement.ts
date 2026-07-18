"use client";

import { useCallback, useState } from "react";
import type { FacilityType, Floor, SprinklerHead } from "@/types/floorplan";
import { SprinklerComplianceStatus } from "@/types/floorplan";
import { autoPlaceSprinklers } from "@/lib/sprinklerPlacement";
import { SPRINKLER_RULES } from "@/lib/sprinklerRules";
import { DEFAULT_ROOM_TYPE, ROOM_TYPE_DEFAULTS } from "@/constants/roomTypes";
import { STRUCTURE_DEFAULTS } from "@/constants/structureDefaults";

export type SprinklerRoomSummary = {
  structureId: string;
  label: string;
  status: SprinklerComplianceStatus;
  ruleLabel: string | null;
  horizontalDistanceM: number | null;
  headCount: number;
  warnings: string[];
};

export type SprinklerSummary = {
  applicable: boolean;
  notApplicableReason: string | null;
  totalCount: number;
  byRoom: SprinklerRoomSummary[];
};

export function useSprinklerPlacement(
  floor: Floor,
  facilityType: FacilityType,
  isFireResistantStructure: boolean | undefined,
  scale: number,
  onPlaced: (heads: SprinklerHead[]) => void
) {
  const [summary, setSummary] = useState<SprinklerSummary | null>(null);

  const autoPlace = useCallback(() => {
    const result = autoPlaceSprinklers(floor, { facilityType, isFireResistantStructure }, scale);

    const structureById = new Map(floor.structures.map((s) => [s.id, s]));
    const byRoom: SprinklerRoomSummary[] = result.results.map((room) => {
      const structure = structureById.get(room.structureId);
      const label = structure
        ? structure.type === "room"
          ? ROOM_TYPE_DEFAULTS[structure.roomType ?? DEFAULT_ROOM_TYPE].label
          : STRUCTURE_DEFAULTS[structure.type].label
        : room.structureId;

      return {
        structureId: room.structureId,
        label,
        status: room.status,
        ruleLabel: room.ruleId ? SPRINKLER_RULES[room.ruleId as keyof typeof SPRINKLER_RULES].label : null,
        horizontalDistanceM: room.horizontalDistanceM,
        headCount: room.headCount,
        warnings: room.warnings,
      };
    });

    setSummary({
      applicable: result.applicable,
      notApplicableReason: result.notApplicableReason,
      totalCount: result.heads.length,
      byRoom,
    });
    onPlaced(result.heads);
  }, [floor, facilityType, isFireResistantStructure, scale, onPlaced]);

  return { summary, autoPlace };
}
