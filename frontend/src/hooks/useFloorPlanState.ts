"use client";

import { useCallback, useMemo, useState } from "react";
import type {
  FacilityType,
  FloorPlanState,
  Structure,
  StructureType,
} from "@/types/floorplan";
import { createStructure } from "@/lib/structureFactory";

const INITIAL_STATE: FloorPlanState = {
  name: "새 도면",
  facilityType: "apartment",
  structures: [],
  selectedStructureId: null,
  scale: 1,
};

export function useFloorPlanState(initial: FloorPlanState = INITIAL_STATE) {
  const [state, setState] = useState<FloorPlanState>(initial);

  const setName = useCallback((name: string) => {
    setState((prev) => ({ ...prev, name }));
  }, []);

  const setFacilityType = useCallback((facilityType: FacilityType) => {
    setState((prev) => ({ ...prev, facilityType }));
  }, []);

  const addStructure = useCallback((type: StructureType) => {
    setState((prev) => {
      const structure = createStructure(type, prev.structures.length);
      return {
        ...prev,
        structures: [...prev.structures, structure],
        selectedStructureId: structure.id,
      };
    });
  }, []);

  const updateStructure = useCallback(
    (id: string, changes: Partial<Omit<Structure, "id" | "type">>) => {
      setState((prev) => ({
        ...prev,
        structures: prev.structures.map((structure) =>
          structure.id === id ? { ...structure, ...changes } : structure
        ),
      }));
    },
    []
  );

  const selectStructure = useCallback((id: string | null) => {
    setState((prev) => ({ ...prev, selectedStructureId: id }));
  }, []);

  const loadFloorPlanState = useCallback((next: FloorPlanState) => {
    setState(next);
  }, []);

  const selectedStructure = useMemo(
    () =>
      state.structures.find((s) => s.id === state.selectedStructureId) ??
      null,
    [state.structures, state.selectedStructureId]
  );

  const totalArea = useMemo(
    () =>
      state.structures.reduce(
        (sum, structure) => sum + structure.width * structure.height,
        0
      ) * state.scale,
    [state.structures, state.scale]
  );

  return {
    state,
    selectedStructure,
    totalArea,
    setName,
    setFacilityType,
    addStructure,
    updateStructure,
    selectStructure,
    loadFloorPlanState,
  };
}
