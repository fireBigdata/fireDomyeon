"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useFloorPlanState } from "@/hooks/useFloorPlanState";
import { useSaveFloorPlan } from "@/hooks/useSaveFloorPlan";
import { summarizeFloorPlan } from "@/hooks/useFloorPlanSummary";
import { useExtinguisherPlacement } from "@/hooks/useExtinguisherPlacement";
import { useSelectedEquipmentProduct } from "@/hooks/useSelectedEquipmentProduct";
import { useHeatDetectorPlacement } from "@/hooks/useHeatDetectorPlacement";
import { useExitLightPlacement } from "@/hooks/useExitLightPlacement";
import { useSmokeDetectorPlacement } from "@/hooks/useSmokeDetectorPlacement";
import { useSprinklerPlacement } from "@/hooks/useSprinklerPlacement";
import { useHydrantPlacement } from "@/hooks/useHydrantPlacement";
import { saveFloorPlanStateToStorage } from "@/lib/floorPlanStorage";
import { isEntranceStructure } from "@/lib/structureArea";
import { HEAT_DETECTOR_TYPE_LABELS } from "@/constants/heatDetectorTypes";
import { EXIT_LIGHT_CATEGORY_DEFAULTS, EXIT_LIGHT_CATEGORY_ORDER } from "@/constants/exitLight";
import { HeatDetectorType } from "@/types/heatDetector";
import TopBar from "@/components/layout/TopBar";
import FloorBar from "@/components/layout/FloorBar";
import LeftPanel from "@/components/layout/LeftPanel";
import RightPanel from "@/components/layout/RightPanel";
import InitialSetupModal from "@/components/panels/InitialSetupModal";
import EquipmentSummaryModal from "@/components/panels/EquipmentSummaryModal";
import DynamicFloorPlanCanvas from "@/components/canvas/DynamicFloorPlanCanvas";
import type { StructureCategory } from "@/components/panels/StructureToolbar";
import type { EntranceSwingDirection, EntranceType, RoomType, StructureType } from "@/types/floorplan";
import type { StructureRect } from "@/lib/structureFactory";

export default function Home() {
  const {
    state,
    hasHydrated,
    currentFloor,
    selectedStructure,
    totalArea,
    setName,
    setFacilityType,
    setIsFireResistantStructure,
    setBuildingScale,
    setSiteDimensions,
    addStructure,
    updateStructure,
    removeStructure,
    setRoomType,
    setSprinklerHazard,
    setEntranceType,
    setEntranceSwingDirection,
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
    moveFloorBarItem,
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
  } = useFloorPlanState();

  const router = useRouter();
  // Derived straight from the live `state`, not the localStorage-backed
  // useFloorPlanSummary hook — that hook only updates via the "storage"
  // event, which never fires for writes made from this same tab.
  const floorPlanSummary = useMemo(() => summarizeFloorPlan(state), [state]);

  const [pendingCategory, setPendingCategory] = useState<StructureCategory | null>(null);

  // 피난동선 표시 toggle: while true, hovering a structure on the canvas
  // draws its shortest route to the nearest 공동현관/비상구 (see
  // components/canvas/FloorPlanCanvas.tsx + lib/evacuationRoute.ts).
  const [evacuationRouteMode, setEvacuationRouteMode] = useState(false);

  // 소방설비 자동 배치 ON/OFF (see AutoPlacementToggle). While ON, every
  // structure/출입구 add·move·edit·delete and every floor add/복제 re-runs
  // placement for all 6 equipment types on the current floor (via
  // autoPlaceVersion below). While OFF, none of it is shown on the canvas
  // (FloorPlanCanvas's showEquipment prop) — the underlying placement data
  // is left alone either way, so toggling back ON doesn't lose anything.
  const [autoPlacementEnabled, setAutoPlacementEnabled] = useState(true);
  // Bumped by every structure/floor mutation that should trigger a
  // re-placement. A plain counter (rather than calling the 6 autoPlace
  // functions directly at each call site) so the actual placement always
  // runs from an effect *after* the triggering state update has committed —
  // calling it inline would still close over the pre-update `currentFloor`.
  const [autoPlaceVersion, setAutoPlaceVersion] = useState(0);
  const bumpAutoPlaceVersion = useCallback(() => {
    setAutoPlaceVersion((v) => v + 1);
  }, []);

  // 계단(stairs) tooltip info: how many floors to 1F, and how many floors up
  // to the rooftop (one above the highest ground floor). Both derived from
  // the current floor's position in state.floors relative to groundMarkerIndex
  // (the array index of "1F" — see lib/floorOrder.ts's applyAutoFloorNames).
  const currentFloorIndex = state.floors.findIndex((f) => f.id === state.currentFloorId);
  const floorsToGround = Math.abs(currentFloorIndex - state.groundMarkerIndex);
  const floorsToRoof = state.floors.length - currentFloorIndex;

  const entranceCount = currentFloor.structures.filter(isEntranceStructure).length;

  // Shown once, right after the page finishes restoring any saved plan (so a
  // returning user with an already-configured site doesn't see it flash
  // open), until the user confirms (setSiteDimensions fills in siteWidthM)
  // or explicitly skips it.
  const [setupDismissed, setSetupDismissed] = useState(false);
  const showSetupModal =
    hasHydrated && state.siteWidthM === undefined && !setupDismissed;

  // Reopens the same InitialSetupModal on demand via TopBar's "건물 정보"
  // button, so the user can review/edit site dimensions after initial setup.
  const [showBuildingInfoModal, setShowBuildingInfoModal] = useState(false);

  const handleArmStructure = useCallback(
    (category: StructureCategory) => {
      setPendingCategory((prev) => (prev === category ? null : category));
      selectStructure(null);
    },
    [selectStructure]
  );

  const handleConfirmStructure = (
    rect: StructureRect,
    type: StructureType,
    roomType?: RoomType,
    entranceType?: EntranceType,
    entranceSwingDirection?: EntranceSwingDirection
  ) => {
    addStructure(type, rect, roomType, entranceType, entranceSwingDirection);
    setPendingCategory(null);
    bumpAutoPlaceVersion();
  };

  // Wrap the structure/floor mutations that 소방설비 자동 배치 should react to
  // (add/move/edit/delete a structure or 출입구, add/복제 a floor) so each one
  // also bumps autoPlaceVersion — see its declaration above for why the
  // actual re-placement happens from an effect instead of inline here.
  const handleUpdateStructure = useCallback(
    (id: string, changes: Parameters<typeof updateStructure>[1]) => {
      updateStructure(id, changes);
      bumpAutoPlaceVersion();
    },
    [updateStructure, bumpAutoPlaceVersion]
  );

  const handleRemoveStructure = useCallback(
    (id: string) => {
      removeStructure(id);
      bumpAutoPlaceVersion();
    },
    [removeStructure, bumpAutoPlaceVersion]
  );

  const handleAddFloor = useCallback(() => {
    addFloor();
    bumpAutoPlaceVersion();
  }, [addFloor, bumpAutoPlaceVersion]);

  const handleCloneCurrentFloor = useCallback(() => {
    cloneCurrentFloor();
    bumpAutoPlaceVersion();
  }, [cloneCurrentFloor, bumpAutoPlaceVersion]);

  // Room/entrance-type and partition-layout edits also feed the placement
  // algorithms (room type -> detector coverage, sprinkler hazard class ->
  // sprinkler count, partition layout -> per-room counts), so they bump
  // autoPlaceVersion too. resizePartition is deliberately excluded: it fires
  // continuously while a partition divider is being dragged, and re-running
  // all 6 placements on every drag tick would be far too expensive.
  const handleRoomTypeChange = useCallback(
    (id: string, roomType: Parameters<typeof setRoomType>[1]) => {
      setRoomType(id, roomType);
      bumpAutoPlaceVersion();
    },
    [setRoomType, bumpAutoPlaceVersion]
  );

  const handleSprinklerHazardChange = useCallback(
    (id: string, hazard: Parameters<typeof setSprinklerHazard>[1]) => {
      setSprinklerHazard(id, hazard);
      bumpAutoPlaceVersion();
    },
    [setSprinklerHazard, bumpAutoPlaceVersion]
  );

  const handleEntranceTypeChange = useCallback(
    (id: string, entranceType: Parameters<typeof setEntranceType>[1]) => {
      setEntranceType(id, entranceType);
      bumpAutoPlaceVersion();
    },
    [setEntranceType, bumpAutoPlaceVersion]
  );

  const handleEntranceSwingDirectionChange = useCallback(
    (id: string, direction: Parameters<typeof setEntranceSwingDirection>[1]) => {
      setEntranceSwingDirection(id, direction);
      bumpAutoPlaceVersion();
    },
    [setEntranceSwingDirection, bumpAutoPlaceVersion]
  );

  const handleSplitPartition = useCallback(
    (structureId: string, leafId: string, direction: Parameters<typeof splitPartition>[2]) => {
      splitPartition(structureId, leafId, direction);
      bumpAutoPlaceVersion();
    },
    [splitPartition, bumpAutoPlaceVersion]
  );

  const handleMergePartition = useCallback(
    (structureId: string, leafId: string) => {
      mergePartition(structureId, leafId);
      bumpAutoPlaceVersion();
    },
    [mergePartition, bumpAutoPlaceVersion]
  );

  const handleDeletePartitionRegion = useCallback(
    (structureId: string, leafId: string) => {
      deletePartitionRegion(structureId, leafId);
      bumpAutoPlaceVersion();
    },
    [deletePartitionRegion, bumpAutoPlaceVersion]
  );

  const handleRestorePartitionRegion = useCallback(
    (structureId: string, emptyId: string) => {
      restorePartitionRegion(structureId, emptyId);
      bumpAutoPlaceVersion();
    },
    [restorePartitionRegion, bumpAutoPlaceVersion]
  );

  const handleToggleAutoPlacement = useCallback(() => {
    setAutoPlacementEnabled((prev) => {
      const next = !prev;
      // Turning ON: place equipment for whatever's already drawn on the
      // current floor right away, instead of waiting for the next edit.
      if (next) bumpAutoPlaceVersion();
      return next;
    });
  }, [bumpAutoPlaceVersion]);

  const handleResetCurrentFloor = () => {
    setPendingCategory(null);
    resetCurrentFloor();
  };

  const handleResetAll = () => {
    setPendingCategory(null);
    resetAll();
  };

  // 설비 선택 화면으로 넘어가기 전에 현재 도면 기준 자동 배치된 설비 수량을
  // 팝업으로 먼저 보여줘서, 사용자가 "몇 개가 필요한지" 인지한 상태로 이동하게 한다.
  const [showEquipmentSummaryModal, setShowEquipmentSummaryModal] = useState(false);

  const equipmentSummaryItems = useMemo(() => {
    const items: { icon: string; label: string; count: number }[] = [];
    if (floorPlanSummary.totalExtinguisherCount > 0) {
      items.push({ icon: "🧯", label: "소화기", count: floorPlanSummary.totalExtinguisherCount });
    }
    const heatDetectorIcons: Record<HeatDetectorType, string> = {
      [HeatDetectorType.DIFFERENTIAL]: "🌡️",
      [HeatDetectorType.FIXED_TEMPERATURE]: "🔥",
    };
    for (const type of [HeatDetectorType.DIFFERENTIAL, HeatDetectorType.FIXED_TEMPERATURE]) {
      const count = floorPlanSummary.totalHeatDetectorCountsByType[type];
      if (count > 0) {
        items.push({
          icon: heatDetectorIcons[type],
          label: `${HEAT_DETECTOR_TYPE_LABELS[type]}열감지기`,
          count,
        });
      }
    }
    if (floorPlanSummary.totalSmokeDetectorCount > 0) {
      items.push({ icon: "💨", label: "연기감지기", count: floorPlanSummary.totalSmokeDetectorCount });
    }
    const exitLightIcons: Record<string, string> = {
      EXIT: "🚪",
      CORRIDOR: "🏃",
      STAIRS: "🪜",
    };
    for (const category of EXIT_LIGHT_CATEGORY_ORDER) {
      const count = floorPlanSummary.totalExitLightCountsByCategory[category];
      if (count > 0) {
        items.push({
          icon: exitLightIcons[category] ?? "🚪",
          label: EXIT_LIGHT_CATEGORY_DEFAULTS[category].label,
          count,
        });
      }
    }
    if (floorPlanSummary.totalSprinklerHeadCount > 0) {
      items.push({ icon: "💧", label: "스프링클러", count: floorPlanSummary.totalSprinklerHeadCount });
    }
    if (floorPlanSummary.totalHydrantCount > 0) {
      items.push({ icon: "🚒", label: "옥내소화전", count: floorPlanSummary.totalHydrantCount });
    }
    return items;
  }, [floorPlanSummary]);

  // 전역 단축키: S(구조물 추가), E(출입구 추가), Delete/Backspace(선택된 구조물 삭제).
  // 입력창에 포커스가 있거나 조합키(Ctrl/Alt/Meta)가 눌려있으면 무시한다.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isEditableTarget =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target?.isContentEditable;
      if (isEditableTarget || e.ctrlKey || e.metaKey || e.altKey) return;

      if (e.key === "s" || e.key === "S") {
        e.preventDefault();
        handleArmStructure("structure");
      } else if (e.key === "e" || e.key === "E") {
        e.preventDefault();
        handleArmStructure("entrance");
      } else if (e.key === "Delete" || e.key === "Backspace") {
        if (state.selectedStructureId) {
          e.preventDefault();
          if (
            window.confirm(
              "이 구조물을 삭제하시겠습니까? 연결된 구획, 감지기, 소화기도 함께 삭제됩니다."
            )
          ) {
            handleRemoveStructure(state.selectedStructureId);
          }
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [state.selectedStructureId, handleRemoveStructure, handleArmStructure]);

  const saveFloorPlan = useSaveFloorPlan();

  // Lets the equipment-selection page (a separate route with no shared
  // state/Context) read this floor plan's latest floors/area/equipment data.
  // state.buildingAreaSqm/buildingTotalFloorAreaSqm are already the live
  // auto-calculated values (see useFloorPlanState), so this just mirrors
  // `state` as-is.
  useEffect(() => {
    saveFloorPlanStateToStorage(state);
  }, [state]);

  const selectedExtinguisherProduct = useSelectedEquipmentProduct("소화기");
  const selectedDifferentialDetectorProduct = useSelectedEquipmentProduct("차동식열감지기");
  const selectedFixedTemperatureDetectorProduct = useSelectedEquipmentProduct("정온식열감지기");
  const selectedHydrantProduct = useSelectedEquipmentProduct("옥내소화전");
  const selectedSmokeDetectorProduct = useSelectedEquipmentProduct("연기감지기");

  const {
    error: extinguisherError,
    summary: extinguisherSummary,
    autoPlace: autoPlaceExtinguishers,
  } = useExtinguisherPlacement(
    currentFloor,
    state.facilityType,
    state.scale,
    selectedExtinguisherProduct,
    state.isFireResistantStructure,
    setExtinguisherPlacements
  );

  const {
    error: heatDetectorError,
    summary: heatDetectorSummary,
    autoPlace: autoPlaceHeatDetectors,
  } = useHeatDetectorPlacement(
    currentFloor,
    state.facilityType,
    state.scale,
    selectedDifferentialDetectorProduct,
    selectedFixedTemperatureDetectorProduct,
    state.isFireResistantStructure,
    setHeatDetectors
  );

  const { summary: exitLightSummary, autoPlace: autoPlaceExitLights } =
    useExitLightPlacement(currentFloor, state.scale, setExitLights);

  const {
    error: smokeDetectorError,
    summary: smokeDetectorSummary,
    autoPlace: autoPlaceSmokeDetectors,
  } = useSmokeDetectorPlacement(
    currentFloor,
    state.facilityType,
    state.scale,
    selectedSmokeDetectorProduct,
    setSmokeDetectors
  );

  const { summary: sprinklerSummary, autoPlace: autoPlaceSprinklers } = useSprinklerPlacement(
    currentFloor,
    state.facilityType,
    state.isFireResistantStructure,
    state.scale,
    setSprinklerHeads
  );

  const {
    error: hydrantError,
    summary: hydrantSummary,
    autoPlace: autoPlaceHydrants,
  } = useHydrantPlacement(
    state.floors,
    currentFloor,
    state.facilityType,
    state.scale,
    selectedHydrantProduct,
    setHydrantPlacements
  );

  const handleAutoPlaceAll = () => {
    autoPlaceExtinguishers();
    autoPlaceHeatDetectors();
    autoPlaceExitLights();
    autoPlaceSmokeDetectors();
    autoPlaceSprinklers();
    autoPlaceHydrants();
  };

  // 소방설비 자동 배치 ON: re-run placement for every equipment type whenever
  // autoPlaceVersion is bumped (structure/출입구 added/moved/edited/deleted,
  // a floor added/복제, or the toggle just switched on). Runs from an effect
  // rather than at each call site so it always sees the post-update
  // `currentFloor` — autoPlaceVersion and the structure/floor change that
  // triggered it are set together, so React commits both in the same
  // render before this effect (and the fresh autoPlace* closures it reads)
  // runs. Skipped on mount (autoPlaceVersion starts at 0).
  useEffect(() => {
    if (autoPlaceVersion === 0 || !autoPlacementEnabled) return;
    handleAutoPlaceAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoPlaceVersion]);

  return (
    <div className="flex min-h-screen flex-1 flex-col bg-gray-50">
      {(showSetupModal || showBuildingInfoModal) && (
        <InitialSetupModal
          facilityType={state.facilityType}
          onFacilityTypeChange={setFacilityType}
          isFireResistantStructure={state.isFireResistantStructure ?? false}
          onFireResistantStructureChange={setIsFireResistantStructure}
          initialWidthM={state.siteWidthM}
          initialHeightM={state.siteHeightM}
          onConfirm={(siteWidthM, siteHeightM) => {
            setSiteDimensions(siteWidthM, siteHeightM);
            setShowBuildingInfoModal(false);
          }}
          onSkip={() => {
            setSetupDismissed(true);
            setShowBuildingInfoModal(false);
          }}
        />
      )}

      {showEquipmentSummaryModal && (
        <EquipmentSummaryModal
          items={equipmentSummaryItems}
          onClose={() => setShowEquipmentSummaryModal(false)}
          onConfirm={() => {
            setShowEquipmentSummaryModal(false);
            router.push("/equipment-selection");
          }}
        />
      )}

      <TopBar
        name={state.name}
        onNameChange={setName}
        onSave={() => saveFloorPlan.mutate(state)}
        isSaving={saveFloorPlan.isPending}
        onResetAll={handleResetAll}
        onOpenBuildingInfo={() => setShowBuildingInfoModal(true)}
      />

      <FloorBar
        floors={state.floors}
        groundMarkerIndex={state.groundMarkerIndex}
        currentFloorId={state.currentFloorId}
        onSelect={selectFloor}
        onAdd={handleAddFloor}
        onClone={handleCloneCurrentFloor}
        onRemove={removeFloor}
        onMoveItem={moveFloorBarItem}
        onResetFloor={handleResetCurrentFloor}
      />

      <div className="flex flex-1">
        <LeftPanel
          facilityType={state.facilityType}
          pendingCategory={pendingCategory}
          onArmStructure={handleArmStructure}
          selectedExtinguisherProduct={selectedExtinguisherProduct}
          extinguisherError={extinguisherError}
          onAutoPlaceExtinguishers={autoPlaceExtinguishers}
          extinguisherSummary={extinguisherSummary}
          selectedDifferentialDetectorProduct={selectedDifferentialDetectorProduct}
          selectedFixedTemperatureDetectorProduct={selectedFixedTemperatureDetectorProduct}
          heatDetectorError={heatDetectorError}
          onAutoPlaceHeatDetectors={autoPlaceHeatDetectors}
          heatDetectorSummary={heatDetectorSummary}
          onAutoPlaceExitLights={autoPlaceExitLights}
          exitLightSummary={exitLightSummary}
          selectedSmokeDetectorProduct={selectedSmokeDetectorProduct}
          smokeDetectorError={smokeDetectorError}
          onAutoPlaceSmokeDetectors={autoPlaceSmokeDetectors}
          smokeDetectorSummary={smokeDetectorSummary}
          evacuationRouteMode={evacuationRouteMode}
          onToggleEvacuationRoute={() => setEvacuationRouteMode((prev) => !prev)}
          onAutoPlaceSprinklers={autoPlaceSprinklers}
          sprinklerSummary={sprinklerSummary}
          selectedHydrantProduct={selectedHydrantProduct}
          hydrantError={hydrantError}
          onAutoPlaceHydrants={autoPlaceHydrants}
          hydrantSummary={hydrantSummary}
          autoPlacementEnabled={autoPlacementEnabled}
          onToggleAutoPlacement={handleToggleAutoPlacement}
        />

        <main className="relative flex flex-1 flex-col items-center gap-4 overflow-auto p-6">
          <DynamicFloorPlanCanvas
            structures={currentFloor.structures}
            scale={state.scale}
            siteWidthM={state.siteWidthM}
            siteHeightM={state.siteHeightM}
            evacuationRouteMode={evacuationRouteMode}
            isGroundFloor={currentFloor.name === "1F"}
            floorsToGround={floorsToGround}
            floorsToRoof={floorsToRoof}
            selectedStructureId={state.selectedStructureId}
            recentlyCreatedStructureId={state.recentlyCreatedStructureId}
            selectedPartitionId={state.selectedPartitionId}
            showEquipment={autoPlacementEnabled}
            extinguisherPlacements={currentFloor.extinguisherPlacements}
            heatDetectors={currentFloor.heatDetectors}
            selectedHeatDetectorId={state.selectedHeatDetectorId}
            exitLights={currentFloor.exitLights}
            selectedExitLightId={state.selectedExitLightId}
            smokeDetectors={currentFloor.smokeDetectors}
            selectedSmokeDetectorId={state.selectedSmokeDetectorId}
            sprinklerHeads={currentFloor.sprinklerHeads}
            selectedSprinklerHeadId={state.selectedSprinklerHeadId}
            hydrantPlacements={currentFloor.hydrantPlacements}
            selectedHydrantId={state.selectedHydrantId}
            onSelect={selectStructure}
            onSelectPartition={selectPartition}
            onResizePartition={resizePartition}
            onSelectHeatDetector={selectHeatDetector}
            onSelectExitLight={selectExitLight}
            onSelectSmokeDetector={selectSmokeDetector}
            onSelectSprinklerHead={selectSprinklerHead}
            onSelectHydrant={selectHydrant}
            onChange={handleUpdateStructure}
            pendingCategory={pendingCategory}
            onConfirmStructure={handleConfirmStructure}
            onCancelPendingStructure={() => setPendingCategory(null)}
          />

          <div className="pointer-events-none sticky bottom-0 left-0 z-10 flex w-full justify-end self-stretch p-2">
            <button
              type="button"
              onClick={() => setShowEquipmentSummaryModal(true)}
              className="pointer-events-auto flex items-center gap-1.5 rounded-md bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-lg hover:bg-emerald-700 hover:shadow-xl transition-shadow"
            >
              설비 선택으로 이동
              <span aria-hidden="true">→</span>
            </button>
          </div>
        </main>

        <RightPanel
          structure={selectedStructure}
          scale={state.scale}
          selectedPartitionId={state.selectedPartitionId}
          totalArea={totalArea}
          structureCount={
            currentFloor.structures.length - entranceCount
          }
          entranceCount={entranceCount}
          buildingScale={{
            buildingGroundFloorCount: state.buildingGroundFloorCount,
            buildingBasementFloorCount: state.buildingBasementFloorCount,
            buildingAreaSqm: state.buildingAreaSqm,
            buildingTotalFloorAreaSqm: state.buildingTotalFloorAreaSqm,
            buildingSiteAreaSqm: state.buildingSiteAreaSqm,
          }}
          onBuildingScaleChange={setBuildingScale}
          onChange={handleUpdateStructure}
          onRoomTypeChange={handleRoomTypeChange}
          onSprinklerHazardChange={handleSprinklerHazardChange}
          onEntranceTypeChange={handleEntranceTypeChange}
          onEntranceSwingDirectionChange={handleEntranceSwingDirectionChange}
          onSplitPartition={handleSplitPartition}
          onResetPartitions={resetPartitions}
          onMergePartition={handleMergePartition}
          onDeletePartitionRegion={handleDeletePartitionRegion}
          onRestorePartitionRegion={handleRestorePartitionRegion}
          onDeleteStructure={handleRemoveStructure}
        />
      </div>
    </div>
  );
}
