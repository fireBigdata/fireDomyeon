"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  HeatDetectorType,
  SprinklerHeadType,
  type EntranceType,
  type ExtinguisherPlacement,
  type FacilityType,
  type Floor,
  type FloorPlanState,
  type HeatDetector,
  type PartitionDirection,
  type RoomType,
  type SprinklerHazardClass,
  type SprinklerHead,
  type Structure,
  type StructureType,
} from "@/types/floorplan";
import type { ExitLight, ExitLightCategory } from "@/types/exitLight";
import type { SmokeDetector, SmokeDetectorCategory } from "@/types/smokeDetector";
import type { HydrantPlacement } from "@/types/hydrant";
import { createStructure } from "@/lib/structureFactory";
import type { StructureRect } from "@/lib/structureFactory";
import { createFloor, cloneFloor, nextFloorName } from "@/lib/floorFactory";
import { pixelAreaToSquareMeters } from "@/lib/area";
import { computeTotalStructurePixelArea } from "@/lib/structureArea";
import { getFloorPlanStateSnapshot } from "@/lib/floorPlanStorage";
import {
  ROOT_LEAF_ID,
  deleteRegionAt,
  mergePartitionAt,
  restoreRegionAt,
  setPartitionRatio,
  splitPartitionAt,
} from "@/lib/partitionTree";

function createFreshState(): FloorPlanState {
  const floor = createFloor("1F");
  return {
    name: "새 도면",
    facilityType: "apartment",
    floors: [floor],
    currentFloorId: floor.id,
    selectedStructureId: null,
    recentlyCreatedStructureId: null,
    selectedPartitionId: null,
    selectedHeatDetectorId: null,
    selectedExitLightId: null,
    selectedSmokeDetectorId: null,
    selectedSprinklerHeadId: null,
    selectedHydrantId: null,
    scale: 1,
  };
}

const VALID_HEAT_DETECTOR_TYPES = new Set<string>(Object.values(HeatDetectorType));
const VALID_SPRINKLER_HEAD_TYPES = new Set<string>(Object.values(SprinklerHeadType));
const VALID_EXIT_LIGHT_CATEGORIES = new Set<ExitLightCategory>([
  "EXIT",
  "CORRIDOR",
  "STAIRS",
]);
const VALID_SMOKE_DETECTOR_CATEGORIES = new Set<SmokeDetectorCategory>([
  "CORRIDOR",
  "STAIRS",
  "ELEVATOR",
]);

// Backfills array fields a floor may be missing if it was saved by an older
// version of the app (e.g. before sprinklerHeads existed), and drops any
// equipment whose discriminant (type/headType/category) no longer matches a
// known value — the canvas shapes (HeatDetectorShape, SprinklerHeadShape,
// ExitLightShape) look up colors/labels by that field via a Record and crash
// on an unrecognized one, so a stale/renamed value must be filtered here
// rather than trusted as-is.
function normalizeFloor(floor: Partial<Floor>): Floor {
  return {
    id: floor.id ?? createFloor("1F").id,
    name: floor.name ?? "1F",
    structures: Array.isArray(floor.structures) ? floor.structures : [],
    extinguisherPlacements: Array.isArray(floor.extinguisherPlacements)
      ? floor.extinguisherPlacements
      : [],
    heatDetectors: Array.isArray(floor.heatDetectors)
      ? floor.heatDetectors.filter((d) => VALID_HEAT_DETECTOR_TYPES.has(d?.type))
      : [],
    exitLights: Array.isArray(floor.exitLights)
      ? floor.exitLights.filter((l) => VALID_EXIT_LIGHT_CATEGORIES.has(l?.category))
      : [],
    smokeDetectors: Array.isArray(floor.smokeDetectors)
      ? floor.smokeDetectors.filter((d) => VALID_SMOKE_DETECTOR_CATEGORIES.has(d?.category))
      : [],
    sprinklerHeads: Array.isArray(floor.sprinklerHeads)
      ? floor.sprinklerHeads.filter((h) => VALID_SPRINKLER_HEAD_TYPES.has(h?.headType))
      : [],
    hydrantPlacements: Array.isArray(floor.hydrantPlacements) ? floor.hydrantPlacements : [],
  };
}

// Parses a raw localStorage snapshot into a FloorPlanState, or null if it's
// missing/corrupt/old-shape. Normalizes fields an older version of the app
// may not have saved, rather than trusting the JSON shape as-is.
function parseStoredState(stored: string | null): FloorPlanState | null {
  if (!stored) return null;
  try {
    const parsed = JSON.parse(stored) as Partial<FloorPlanState>;
    if (!Array.isArray(parsed.floors) || parsed.floors.length === 0) {
      return null;
    }
    const floors = parsed.floors.map(normalizeFloor);
    const currentFloorId = floors.some((f) => f.id === parsed.currentFloorId)
      ? (parsed.currentFloorId as string)
      : floors[0].id;
    return {
      ...createFreshState(),
      ...parsed,
      floors,
      currentFloorId,
    };
  } catch {
    // Corrupt or old-shape snapshot: ignore.
  }
  return null;
}

export function useFloorPlanState(initial?: FloorPlanState) {
  const [state, setState] = useState<FloorPlanState>(
    initial ?? createFreshState
  );

  // The initial render (and SSR) always starts from a fresh, empty plan so
  // server and client markup match. Once mounted in the browser, restore the
  // floor plan last drawn on this page — the page component unmounts when
  // navigating to another route (e.g. /equipment-selection) and remounts on
  // the way back, so in-memory state alone doesn't survive the trip.
  useEffect(() => {
    if (initial) return;
    const restored = parseStoredState(getFloorPlanStateSnapshot());
    if (restored) {
      // One-time sync from the localStorage snapshot (an external system),
      // not a derived-state cascade.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setState(restored);
    }
    // Only ever run on mount: restoring later would clobber in-progress edits.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const setIsFireResistantStructure = useCallback((isFireResistantStructure: boolean) => {
    setState((prev) => ({ ...prev, isFireResistantStructure }));
  }, []);

  const addStructure = useCallback(
    (
      type: StructureType,
      rect: StructureRect,
      roomType?: RoomType,
      entranceType?: EntranceType
    ) => {
      setState((prev) => {
        const floor = prev.floors.find((f) => f.id === prev.currentFloorId);
        if (!floor) return prev;
        const structure = createStructure(type, rect, roomType, entranceType);
        return {
          ...prev,
          floors: prev.floors.map((f) =>
            f.id === floor.id
              ? { ...f, structures: [...f.structures, structure] }
              : f
          ),
          selectedStructureId: structure.id,
          recentlyCreatedStructureId: structure.id,
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

  const removeStructure = useCallback((id: string) => {
    setState((prev) => {
      const floor = prev.floors.find((f) => f.id === prev.currentFloorId);
      if (!floor) return prev;

      const removedDetectorIds = new Set(
        floor.heatDetectors
          .filter((detector) => detector.roomId === id)
          .map((detector) => detector.id)
      );
      const removedExitLightIds = new Set(
        floor.exitLights
          .filter((light) => light.structureId === id)
          .map((light) => light.id)
      );
      const removedSmokeDetectorIds = new Set(
        floor.smokeDetectors
          .filter((detector) => detector.structureId === id)
          .map((detector) => detector.id)
      );
      const removedSprinklerHeadIds = new Set(
        floor.sprinklerHeads
          .filter((head) => head.roomId === id)
          .map((head) => head.id)
      );
      const removedHydrantIds = new Set(
        floor.hydrantPlacements
          .filter((placement) => placement.structureId === id)
          .map((placement) => placement.id)
      );

      return {
        ...prev,
        floors: prev.floors.map((f) =>
          f.id !== prev.currentFloorId
            ? f
            : {
                ...f,
                structures: f.structures.filter((s) => s.id !== id),
                heatDetectors: f.heatDetectors.filter(
                  (detector) => detector.roomId !== id
                ),
                extinguisherPlacements: f.extinguisherPlacements.filter(
                  (placement) => placement.structureId !== id
                ),
                exitLights: f.exitLights.filter(
                  (light) => light.structureId !== id
                ),
                smokeDetectors: f.smokeDetectors.filter(
                  (detector) => detector.structureId !== id
                ),
                sprinklerHeads: f.sprinklerHeads.filter(
                  (head) => head.roomId !== id
                ),
                hydrantPlacements: f.hydrantPlacements.filter(
                  (placement) => placement.structureId !== id
                ),
              }
        ),
        selectedStructureId:
          prev.selectedStructureId === id ? null : prev.selectedStructureId,
        recentlyCreatedStructureId:
          prev.recentlyCreatedStructureId === id
            ? null
            : prev.recentlyCreatedStructureId,
        selectedPartitionId:
          prev.selectedStructureId === id ? null : prev.selectedPartitionId,
        selectedHeatDetectorId:
          prev.selectedHeatDetectorId &&
          removedDetectorIds.has(prev.selectedHeatDetectorId)
            ? null
            : prev.selectedHeatDetectorId,
        selectedExitLightId:
          prev.selectedExitLightId &&
          removedExitLightIds.has(prev.selectedExitLightId)
            ? null
            : prev.selectedExitLightId,
        selectedSmokeDetectorId:
          prev.selectedSmokeDetectorId &&
          removedSmokeDetectorIds.has(prev.selectedSmokeDetectorId)
            ? null
            : prev.selectedSmokeDetectorId,
        selectedSprinklerHeadId:
          prev.selectedSprinklerHeadId &&
          removedSprinklerHeadIds.has(prev.selectedSprinklerHeadId)
            ? null
            : prev.selectedSprinklerHeadId,
        selectedHydrantId:
          prev.selectedHydrantId && removedHydrantIds.has(prev.selectedHydrantId)
            ? null
            : prev.selectedHydrantId,
      };
    });
  }, []);

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

  const setSprinklerHazard = useCallback(
    (id: string, sprinklerHazard: SprinklerHazardClass) => {
      updateCurrentFloor((floor) => ({
        ...floor,
        structures: floor.structures.map((structure) =>
          structure.id === id ? { ...structure, sprinklerHazard } : structure
        ),
      }));
    },
    [updateCurrentFloor]
  );

  const setEntranceType = useCallback(
    (id: string, entranceType: EntranceType) => {
      updateCurrentFloor((floor) => ({
        ...floor,
        structures: floor.structures.map((structure) =>
          structure.id === id ? { ...structure, entranceType } : structure
        ),
      }));
    },
    [updateCurrentFloor]
  );

  const selectStructure = useCallback((id: string | null) => {
    setState((prev) => ({
      ...prev,
      selectedStructureId: id,
      recentlyCreatedStructureId: null,
      selectedPartitionId: null,
      selectedHeatDetectorId: null,
      selectedExitLightId: null,
      selectedSmokeDetectorId: null,
      selectedSprinklerHeadId: null,
      selectedHydrantId: null,
    }));
  }, []);

  const selectPartition = useCallback(
    (structureId: string, leafId: string | null) => {
      setState((prev) => ({
        ...prev,
        selectedStructureId: structureId,
        recentlyCreatedStructureId: null,
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
        recentlyCreatedStructureId: null,
        selectedPartitionId: null,
        selectedHeatDetectorId: null,
        selectedExitLightId: null,
        selectedSmokeDetectorId: null,
        selectedSprinklerHeadId: null,
        selectedHydrantId: null,
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
        recentlyCreatedStructureId: null,
        selectedPartitionId: null,
        selectedHeatDetectorId: null,
        selectedExitLightId: null,
        selectedSmokeDetectorId: null,
        selectedSprinklerHeadId: null,
        selectedHydrantId: null,
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
        recentlyCreatedStructureId: null,
        selectedPartitionId: null,
        selectedHeatDetectorId: null,
        selectedExitLightId: null,
        selectedSmokeDetectorId: null,
        selectedSprinklerHeadId: null,
        selectedHydrantId: null,
      };
    });
  }, []);

  const renameFloor = useCallback((floorId: string, name: string) => {
    setState((prev) => ({
      ...prev,
      floors: prev.floors.map((f) => (f.id === floorId ? { ...f, name } : f)),
    }));
  }, []);

  // Clears everything drawn on the current floor (structures, detectors,
  // extinguishers, exit lights, sprinklers) but keeps the floor itself (its
  // id/name) and every other floor untouched.
  const resetCurrentFloor = useCallback(() => {
    setState((prev) => ({
      ...prev,
      floors: prev.floors.map((f) =>
        f.id === prev.currentFloorId
          ? {
              ...f,
              structures: [],
              extinguisherPlacements: [],
              heatDetectors: [],
              exitLights: [],
              smokeDetectors: [],
              sprinklerHeads: [],
              hydrantPlacements: [],
            }
          : f
      ),
      selectedStructureId: null,
      recentlyCreatedStructureId: null,
      selectedPartitionId: null,
      selectedHeatDetectorId: null,
      selectedExitLightId: null,
      selectedSmokeDetectorId: null,
      selectedSprinklerHeadId: null,
      selectedHydrantId: null,
    }));
  }, []);

  // Discards the whole floor plan (every floor) and starts over from a
  // single blank floor, same as a brand-new plan.
  const resetAll = useCallback(() => {
    setState(createFreshState());
  }, []);

  const selectFloor = useCallback((floorId: string) => {
    setState((prev) => ({
      ...prev,
      currentFloorId: floorId,
      selectedStructureId: null,
      recentlyCreatedStructureId: null,
      selectedPartitionId: null,
      selectedHeatDetectorId: null,
      selectedExitLightId: null,
      selectedSmokeDetectorId: null,
      selectedSprinklerHeadId: null,
      selectedHydrantId: null,
    }));
  }, []);

  const setExtinguisherPlacements = useCallback(
    (placements: ExtinguisherPlacement[]) => {
      updateCurrentFloor((floor) => ({
        ...floor,
        // Re-placing replaces only the previous auto-placed batch; any
        // manually placed extinguishers (isAutoPlaced === false) are kept.
        extinguisherPlacements: [
          ...floor.extinguisherPlacements.filter((placement) => !placement.isAutoPlaced),
          ...placements,
        ],
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

  const selectExitLight = useCallback((id: string | null) => {
    setState((prev) => ({ ...prev, selectedExitLightId: id }));
  }, []);

  const setExitLights = useCallback(
    (lights: ExitLight[]) => {
      updateCurrentFloor((floor) => ({
        ...floor,
        // Re-placing replaces only the previous auto-placed batch; any
        // manually placed lights (isAutoPlaced === false) are kept.
        exitLights: [
          ...floor.exitLights.filter((light) => !light.isAutoPlaced),
          ...lights,
        ],
      }));
      setState((prev) => ({ ...prev, selectedExitLightId: null }));
    },
    [updateCurrentFloor]
  );

  const selectSmokeDetector = useCallback((id: string | null) => {
    setState((prev) => ({ ...prev, selectedSmokeDetectorId: id }));
  }, []);

  const setSmokeDetectors = useCallback(
    (detectors: SmokeDetector[]) => {
      updateCurrentFloor((floor) => ({
        ...floor,
        // Re-placing replaces only the previous auto-placed batch; any
        // manually placed detectors (isAutoPlaced === false) are kept.
        smokeDetectors: [
          ...floor.smokeDetectors.filter((detector) => !detector.isAutoPlaced),
          ...detectors,
        ],
      }));
      setState((prev) => ({ ...prev, selectedSmokeDetectorId: null }));
    },
    [updateCurrentFloor]
  );

  const selectSprinklerHead = useCallback((id: string | null) => {
    setState((prev) => ({ ...prev, selectedSprinklerHeadId: id }));
  }, []);

  const setSprinklerHeads = useCallback(
    (heads: SprinklerHead[]) => {
      updateCurrentFloor((floor) => ({
        ...floor,
        // Re-placing replaces only the previous auto-placed batch; any
        // manually placed heads (isAutoPlaced === false) are kept.
        sprinklerHeads: [
          ...floor.sprinklerHeads.filter((head) => !head.isAutoPlaced),
          ...heads,
        ],
      }));
      setState((prev) => ({ ...prev, selectedSprinklerHeadId: null }));
    },
    [updateCurrentFloor]
  );

  const selectHydrant = useCallback((id: string | null) => {
    setState((prev) => ({ ...prev, selectedHydrantId: id }));
  }, []);

  const setHydrantPlacements = useCallback(
    (placements: HydrantPlacement[]) => {
      updateCurrentFloor((floor) => ({
        ...floor,
        // Re-placing replaces only the previous auto-placed batch; any
        // manually placed hydrants (isAutoPlaced === false) are kept.
        hydrantPlacements: [
          ...floor.hydrantPlacements.filter((placement) => !placement.isAutoPlaced),
          ...placements,
        ],
      }));
      setState((prev) => ({ ...prev, selectedHydrantId: null }));
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
        computeTotalStructurePixelArea(currentFloor.structures),
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
    setIsFireResistantStructure,
    addStructure,
    updateStructure,
    removeStructure,
    setRoomType,
    setSprinklerHazard,
    setEntranceType,
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
    resetCurrentFloor,
    resetAll,
    selectFloor,
    setExtinguisherPlacements,
    selectHeatDetector,
    setHeatDetectors,
    selectExitLight,
    setExitLights,
    selectSmokeDetector,
    setSmokeDetectors,
    selectSprinklerHead,
    setSprinklerHeads,
    selectHydrant,
    setHydrantPlacements,
    loadFloorPlanState,
    ROOT_LEAF_ID,
  };
}
