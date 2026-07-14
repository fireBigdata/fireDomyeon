"use client";

import { useCallback, useMemo, useState } from "react";
import type {
  ExtinguisherPlacement,
  FacilityType,
  Floor,
  FloorPlanState,
  HeatDetector,
  PartitionDirection,
  RoomType,
  Structure,
  StructureType,
} from "@/types/floorplan";
import { createStructure } from "@/lib/structureFactory";
import { createFloor, cloneFloor, nextFloorName } from "@/lib/floorFactory";
import { pixelAreaToSquareMeters } from "@/lib/area";
import {
  ROOT_LEAF_ID,
  computeEffectivePixelArea,
  deleteRegionAt,
  mergePartitionAt,
  restoreRegionAt,
  setPartitionRatio,
  splitPartitionAt,
} from "@/lib/partitionTree";

function createInitialState(): FloorPlanState {
  const floor = createFloor("1F");
  return {
    name: "새 도면",
    facilityType: "apartment",
    floors: [floor],
    currentFloorId: floor.id,
    selectedStructureId: null,
    selectedPartitionId: null,
    selectedHeatDetectorId: null,
    scale: 1,
  };
}

export function useFloorPlanState(initial?: FloorPlanState) {
  const [state, setState] = useState<FloorPlanState>(
    initial ?? createInitialState
  );

  const currentFloor = useMemo(
    () =>
      state.floors.find((floor) => floor.id === state.currentFloorId) ??
      state.floors[0],
    [state.floors, state.currentFloorId]
  );

  const updateCurrentFloor = useCallback(
    (updater: (floor: Floor) => Floor) => {
      setState((prev) => ({
        ...prev,
        floors: prev.floors.map((floor) =>
          floor.id === prev.currentFloorId ? updater(floor) : floor
        ),
      }));
    },
    []
  );

  const setName = useCallback((name: string) => {
    setState((prev) => ({ ...prev, name }));
  }, []);

  const setFacilityType = useCallback((facilityType: FacilityType) => {
    setState((prev) => ({ ...prev, facilityType }));
  }, []);

  const addStructure = useCallback(
    (type: StructureType, roomType?: RoomType) => {
      setState((prev) => {
        const floor = prev.floors.find((f) => f.id === prev.currentFloorId);
        if (!floor) return prev;
        const structure = createStructure(type, floor.structures.length, roomType);
        return {
          ...prev,
          floors: prev.floors.map((f) =>
            f.id === floor.id
              ? { ...f, structures: [...f.structures, structure] }
              : f
          ),
          selectedStructureId: structure.id,
          selectedPartitionId: null,
        };
      });
    },
    []
  );

  const updateStructure = useCallback(
    (id: string, changes: Partial<Omit<Structure, "id" | "type">>) => {
      updateCurrentFloor((floor) => ({
        ...floor,
        structures: floor.structures.map((structure) =>
          structure.id === id ? { ...structure, ...changes } : structure
        ),
      }));
    },
    [updateCurrentFloor]
  );

  const setRoomType = useCallback(
    (id: string, roomType: RoomType) => {
      updateCurrentFloor((floor) => ({
        ...floor,
        structures: floor.structures.map((structure) =>
          structure.id === id ? { ...structure, roomType } : structure
        ),
      }));
    },
    [updateCurrentFloor]
  );

  const selectStructure = useCallback((id: string | null) => {
    setState((prev) => ({
      ...prev,
      selectedStructureId: id,
      selectedPartitionId: null,
      selectedHeatDetectorId: null,
    }));
  }, []);

  const selectPartition = useCallback(
    (structureId: string, leafId: string | null) => {
      setState((prev) => ({
        ...prev,
        selectedStructureId: structureId,
        selectedPartitionId: leafId,
      }));
    },
    []
  );

  const splitPartition = useCallback(
    (structureId: string, leafId: string, direction: PartitionDirection) => {
      setState((prev) => {
        let newLeafId: string | null = null;
        const floors = prev.floors.map((floor) => {
          if (floor.id !== prev.currentFloorId) return floor;
          return {
            ...floor,
            structures: floor.structures.map((structure) => {
              if (structure.id !== structureId) return structure;
              const result = splitPartitionAt(
                structure.partitions,
                leafId,
                direction
              );
              newLeafId = result.newLeafId;
              return { ...structure, partitions: result.node };
            }),
          };
        });
        return { ...prev, floors, selectedPartitionId: newLeafId };
      });
    },
    []
  );

  const resetPartitions = useCallback(
    (structureId: string) => {
      updateCurrentFloor((floor) => ({
        ...floor,
        structures: floor.structures.map((structure) =>
          structure.id === structureId
            ? { ...structure, partitions: undefined }
            : structure
        ),
      }));
      setState((prev) => ({ ...prev, selectedPartitionId: null }));
    },
    [updateCurrentFloor]
  );

  const resizePartition = useCallback(
    (structureId: string, splitId: string, ratio: number) => {
      updateCurrentFloor((floor) => ({
        ...floor,
        structures: floor.structures.map((structure) =>
          structure.id === structureId
            ? {
                ...structure,
                partitions: setPartitionRatio(
                  structure.partitions,
                  splitId,
                  ratio
                ),
              }
            : structure
        ),
      }));
    },
    [updateCurrentFloor]
  );

  const mergePartition = useCallback(
    (structureId: string, leafId: string) => {
      updateCurrentFloor((floor) => ({
        ...floor,
        structures: floor.structures.map((structure) =>
          structure.id === structureId
            ? {
                ...structure,
                partitions: mergePartitionAt(structure.partitions, leafId),
              }
            : structure
        ),
      }));
      setState((prev) => ({ ...prev, selectedPartitionId: null }));
    },
    [updateCurrentFloor]
  );

  const deletePartitionRegion = useCallback(
    (structureId: string, leafId: string) => {
      updateCurrentFloor((floor) => ({
        ...floor,
        structures: floor.structures.map((structure) =>
          structure.id === structureId
            ? {
                ...structure,
                partitions: deleteRegionAt(structure.partitions, leafId),
              }
            : structure
        ),
      }));
      setState((prev) => ({ ...prev, selectedPartitionId: null }));
    },
    [updateCurrentFloor]
  );

  const restorePartitionRegion = useCallback(
    (structureId: string, emptyId: string) => {
      updateCurrentFloor((floor) => ({
        ...floor,
        structures: floor.structures.map((structure) =>
          structure.id === structureId
            ? {
                ...structure,
                partitions: restoreRegionAt(structure.partitions, emptyId),
              }
            : structure
        ),
      }));
      setState((prev) => ({ ...prev, selectedPartitionId: null }));
    },
    [updateCurrentFloor]
  );

  const addFloor = useCallback(() => {
    setState((prev) => {
      const floor = createFloor(nextFloorName(prev.floors));
      return {
        ...prev,
        floors: [...prev.floors, floor],
        currentFloorId: floor.id,
        selectedStructureId: null,
        selectedPartitionId: null,
        selectedHeatDetectorId: null,
      };
    });
  }, []);

  const cloneCurrentFloor = useCallback(() => {
    setState((prev) => {
      const source = prev.floors.find((f) => f.id === prev.currentFloorId);
      if (!source) return prev;
      const cloned = cloneFloor(source, nextFloorName(prev.floors));
      return {
        ...prev,
        floors: [...prev.floors, cloned],
        currentFloorId: cloned.id,
        selectedStructureId: null,
        selectedPartitionId: null,
        selectedHeatDetectorId: null,
      };
    });
  }, []);

  const removeFloor = useCallback((floorId: string) => {
    setState((prev) => {
      if (prev.floors.length <= 1) return prev;
      const floors = prev.floors.filter((f) => f.id !== floorId);
      const currentFloorId =
        prev.currentFloorId === floorId ? floors[0].id : prev.currentFloorId;
      return {
        ...prev,
        floors,
        currentFloorId,
        selectedStructureId: null,
        selectedPartitionId: null,
        selectedHeatDetectorId: null,
      };
    });
  }, []);

  const renameFloor = useCallback((floorId: string, name: string) => {
    setState((prev) => ({
      ...prev,
      floors: prev.floors.map((f) => (f.id === floorId ? { ...f, name } : f)),
    }));
  }, []);

  const selectFloor = useCallback((floorId: string) => {
    setState((prev) => ({
      ...prev,
      currentFloorId: floorId,
      selectedStructureId: null,
      selectedPartitionId: null,
      selectedHeatDetectorId: null,
    }));
  }, []);

  const setExtinguisherPlacements = useCallback(
    (placements: ExtinguisherPlacement[]) => {
      updateCurrentFloor((floor) => ({
        ...floor,
        extinguisherPlacements: placements,
      }));
    },
    [updateCurrentFloor]
  );

  const selectHeatDetector = useCallback((id: string | null) => {
    setState((prev) => ({ ...prev, selectedHeatDetectorId: id }));
  }, []);

  const setHeatDetectors = useCallback(
    (detectors: HeatDetector[]) => {
      updateCurrentFloor((floor) => ({
        ...floor,
        // Re-placing replaces only the previous auto-placed batch; any
        // manually placed detectors (isAutoPlaced === false) are kept.
        // There's no manual-placement UI yet, so today this always clears
        // everything, but the data already supports it going forward.
        heatDetectors: [
          ...floor.heatDetectors.filter((detector) => !detector.isAutoPlaced),
          ...detectors,
        ],
      }));
      setState((prev) => ({ ...prev, selectedHeatDetectorId: null }));
    },
    [updateCurrentFloor]
  );

  const loadFloorPlanState = useCallback((next: FloorPlanState) => {
    setState(next);
  }, []);

  const selectedStructure = useMemo(
    () =>
      currentFloor.structures.find(
        (s) => s.id === state.selectedStructureId
      ) ?? null,
    [currentFloor.structures, state.selectedStructureId]
  );

  const totalArea = useMemo(
    () =>
      pixelAreaToSquareMeters(
        currentFloor.structures.reduce(
          (sum, structure) => sum + computeEffectivePixelArea(structure),
          0
        ),
        state.scale
      ),
    [currentFloor.structures, state.scale]
  );

  return {
    state,
    currentFloor,
    selectedStructure,
    totalArea,
    setName,
    setFacilityType,
    addStructure,
    updateStructure,
    setRoomType,
    selectStructure,
    selectPartition,
    splitPartition,
    resetPartitions,
    resizePartition,
    mergePartition,
    deletePartitionRegion,
    restorePartitionRegion,
    addFloor,
    cloneCurrentFloor,
    removeFloor,
    renameFloor,
    selectFloor,
    setExtinguisherPlacements,
    selectHeatDetector,
    setHeatDetectors,
    loadFloorPlanState,
    ROOT_LEAF_ID,
  };
}
