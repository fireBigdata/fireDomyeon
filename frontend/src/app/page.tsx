"use client";

import { useEffect } from "react";
import { useFloorPlanState } from "@/hooks/useFloorPlanState";
import { useSaveFloorPlan } from "@/hooks/useSaveFloorPlan";
import { useExtinguisherPlacement } from "@/hooks/useExtinguisherPlacement";
import { useHeatDetectorPlacement } from "@/hooks/useHeatDetectorPlacement";
import { useExitLightPlacement } from "@/hooks/useExitLightPlacement";
import { saveFloorPlanStateToStorage } from "@/lib/floorPlanStorage";
import TopBar from "@/components/layout/TopBar";
import FloorBar from "@/components/layout/FloorBar";
import LeftPanel from "@/components/layout/LeftPanel";
import RightPanel from "@/components/layout/RightPanel";
import AreaSummary from "@/components/panels/AreaSummary";
import DynamicFloorPlanCanvas from "@/components/canvas/DynamicFloorPlanCanvas";

export default function Home() {
  const {
    state,
    currentFloor,
    selectedStructure,
    totalArea,
    setName,
    setFacilityType,
    addStructure,
    updateStructure,
    removeStructure,
    setRoomType,
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
  } = useFloorPlanState();

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
          onAddStructure={addStructure}
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
            onSelect={selectStructure}
            onSelectPartition={selectPartition}
            onResizePartition={resizePartition}
            onSelectHeatDetector={selectHeatDetector}
            onSelectExitLight={selectExitLight}
            onChange={updateStructure}
          />
        </main>

        <RightPanel
          structure={selectedStructure}
          scale={state.scale}
          selectedPartitionId={state.selectedPartitionId}
          onChange={updateStructure}
          onRoomTypeChange={setRoomType}
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
