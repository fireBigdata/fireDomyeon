"use client";

import { useEffect, useState } from "react";
import { useFloorPlanState } from "@/hooks/useFloorPlanState";
import { useSaveFloorPlan } from "@/hooks/useSaveFloorPlan";
import { useExtinguisherPlacement } from "@/hooks/useExtinguisherPlacement";
import { useHeatDetectorPlacement } from "@/hooks/useHeatDetectorPlacement";
import { useExitLightPlacement } from "@/hooks/useExitLightPlacement";
import { useSprinklerPlacement } from "@/hooks/useSprinklerPlacement";
import { saveFloorPlanStateToStorage } from "@/lib/floorPlanStorage";
import TopBar from "@/components/layout/TopBar";
import FloorBar from "@/components/layout/FloorBar";
import LeftPanel from "@/components/layout/LeftPanel";
import RightPanel from "@/components/layout/RightPanel";
import AreaSummary from "@/components/panels/AreaSummary";
import DynamicFloorPlanCanvas from "@/components/canvas/DynamicFloorPlanCanvas";
import type { StructureCategory } from "@/components/panels/StructureToolbar";
import type { EntranceType, RoomType, StructureType } from "@/types/floorplan";
import type { StructureRect } from "@/lib/structureFactory";

export default function Home() {
  const {
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
    selectFloor,
    setExtinguisherPlacements,
    selectHeatDetector,
    setHeatDetectors,
    selectExitLight,
    setExitLights,
    selectSprinklerHead,
    setSprinklerHeads,
  } = useFloorPlanState();

  const [pendingCategory, setPendingCategory] = useState<StructureCategory | null>(null);

  const handleArmStructure = (category: StructureCategory) => {
    setPendingCategory((prev) => (prev === category ? null : category));
    selectStructure(null);
  };

  const handleConfirmStructure = (
    rect: StructureRect,
    type: StructureType,
    roomType?: RoomType,
    entranceType?: EntranceType
  ) => {
    addStructure(type, rect, roomType, entranceType);
    setPendingCategory(null);
  };

  const saveFloorPlan = useSaveFloorPlan();

  // Lets the equipment-selection page (a separate route with no shared
  // state/Context) read this floor plan's latest floors/area/equipment data.
  useEffect(() => {
    saveFloorPlanStateToStorage(state);
  }, [state]);

  const {
    typeId: extinguisherTypeId,
    setTypeId: setExtinguisherTypeId,
    abilityUnitsInput: extinguisherAbilityUnitsInput,
    setAbilityUnitsInput: setExtinguisherAbilityUnitsInput,
    error: extinguisherError,
    summary: extinguisherSummary,
    autoPlace: autoPlaceExtinguishers,
  } = useExtinguisherPlacement(
    currentFloor,
    state.facilityType,
    state.scale,
    setExtinguisherPlacements
  );

  const {
    coverageAreaInput: heatDetectorCoverageAreaInput,
    setCoverageAreaInput: setHeatDetectorCoverageAreaInput,
    error: heatDetectorError,
    summary: heatDetectorSummary,
    autoPlace: autoPlaceHeatDetectors,
  } = useHeatDetectorPlacement(currentFloor, state.scale, setHeatDetectors);

  const { summary: exitLightSummary, autoPlace: autoPlaceExitLights } =
    useExitLightPlacement(currentFloor, state.scale, setExitLights);

  const { summary: sprinklerSummary, autoPlace: autoPlaceSprinklers } = useSprinklerPlacement(
    currentFloor,
    state.facilityType,
    state.isFireResistantStructure,
    state.scale,
    setSprinklerHeads
  );

  return (
    <div className="flex min-h-screen flex-1 flex-col bg-gray-50">
      <TopBar
        name={state.name}
        onNameChange={setName}
        onSave={() => saveFloorPlan.mutate(state)}
        isSaving={saveFloorPlan.isPending}
      />

      <FloorBar
        floors={state.floors}
        currentFloorId={state.currentFloorId}
        onSelect={selectFloor}
        onAdd={addFloor}
        onClone={cloneCurrentFloor}
        onRemove={removeFloor}
        onRename={renameFloor}
      />

      <div className="flex flex-1">
        <LeftPanel
          facilityType={state.facilityType}
          onFacilityTypeChange={setFacilityType}
          pendingCategory={pendingCategory}
          onArmStructure={handleArmStructure}
          extinguisherTypeId={extinguisherTypeId}
          onExtinguisherTypeChange={setExtinguisherTypeId}
          extinguisherAbilityUnitsInput={extinguisherAbilityUnitsInput}
          onExtinguisherAbilityUnitsChange={setExtinguisherAbilityUnitsInput}
          extinguisherError={extinguisherError}
          onAutoPlaceExtinguishers={autoPlaceExtinguishers}
          extinguisherSummary={extinguisherSummary}
          heatDetectorCoverageAreaInput={heatDetectorCoverageAreaInput}
          onHeatDetectorCoverageAreaChange={setHeatDetectorCoverageAreaInput}
          heatDetectorError={heatDetectorError}
          onAutoPlaceHeatDetectors={autoPlaceHeatDetectors}
          heatDetectorSummary={heatDetectorSummary}
          onAutoPlaceExitLights={autoPlaceExitLights}
          exitLightSummary={exitLightSummary}
          isFireResistantStructure={state.isFireResistantStructure ?? false}
          onFireResistantStructureChange={setIsFireResistantStructure}
          onAutoPlaceSprinklers={autoPlaceSprinklers}
          sprinklerSummary={sprinklerSummary}
        />

        <main className="flex flex-1 flex-col items-center gap-4 overflow-auto p-6">
          <AreaSummary
            totalArea={totalArea}
            structureCount={currentFloor.structures.length}
          />
          <DynamicFloorPlanCanvas
            structures={currentFloor.structures}
            scale={state.scale}
            selectedStructureId={state.selectedStructureId}
            recentlyCreatedStructureId={state.recentlyCreatedStructureId}
            selectedPartitionId={state.selectedPartitionId}
            extinguisherPlacements={currentFloor.extinguisherPlacements}
            heatDetectors={currentFloor.heatDetectors}
            selectedHeatDetectorId={state.selectedHeatDetectorId}
            exitLights={currentFloor.exitLights}
            selectedExitLightId={state.selectedExitLightId}
            sprinklerHeads={currentFloor.sprinklerHeads}
            selectedSprinklerHeadId={state.selectedSprinklerHeadId}
            onSelect={selectStructure}
            onSelectPartition={selectPartition}
            onResizePartition={resizePartition}
            onSelectHeatDetector={selectHeatDetector}
            onSelectExitLight={selectExitLight}
            onSelectSprinklerHead={selectSprinklerHead}
            onChange={updateStructure}
            pendingCategory={pendingCategory}
            onConfirmStructure={handleConfirmStructure}
            onCancelPendingStructure={() => setPendingCategory(null)}
          />
        </main>

        <RightPanel
          structure={selectedStructure}
          scale={state.scale}
          selectedPartitionId={state.selectedPartitionId}
          onChange={updateStructure}
          onRoomTypeChange={setRoomType}
          onSprinklerHazardChange={setSprinklerHazard}
          onEntranceTypeChange={setEntranceType}
          onSplitPartition={splitPartition}
          onResetPartitions={resetPartitions}
          onMergePartition={mergePartition}
          onDeletePartitionRegion={deletePartitionRegion}
          onRestorePartitionRegion={restorePartitionRegion}
          onDeleteStructure={removeStructure}
        />
      </div>
    </div>
  );
}
