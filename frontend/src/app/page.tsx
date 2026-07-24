"use client";

import { useEffect, useState } from "react";
import { useFloorPlanState } from "@/hooks/useFloorPlanState";
import { useSaveFloorPlan } from "@/hooks/useSaveFloorPlan";
import { useExtinguisherPlacement } from "@/hooks/useExtinguisherPlacement";
import { useSelectedEquipmentProduct } from "@/hooks/useSelectedEquipmentProduct";
import { useHeatDetectorPlacement } from "@/hooks/useHeatDetectorPlacement";
import { useExitLightPlacement } from "@/hooks/useExitLightPlacement";
import { useSmokeDetectorPlacement } from "@/hooks/useSmokeDetectorPlacement";
import { useSprinklerPlacement } from "@/hooks/useSprinklerPlacement";
import { useHydrantPlacement } from "@/hooks/useHydrantPlacement";
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
    setBuildingScale,
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

  const handleResetCurrentFloor = () => {
    setPendingCategory(null);
    resetCurrentFloor();
  };

  const handleResetAll = () => {
    setPendingCategory(null);
    resetAll();
  };

  const saveFloorPlan = useSaveFloorPlan();

  // Lets the equipment-selection page (a separate route with no shared
  // state/Context) read this floor plan's latest floors/area/equipment data.
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

  return (
    <div className="flex min-h-screen flex-1 flex-col bg-gray-50">
      <TopBar
        name={state.name}
        onNameChange={setName}
        onSave={() => saveFloorPlan.mutate(state)}
        isSaving={saveFloorPlan.isPending}
        onResetAll={handleResetAll}
      />

      <FloorBar
        floors={state.floors}
        currentFloorId={state.currentFloorId}
        onSelect={selectFloor}
        onAdd={addFloor}
        onClone={cloneCurrentFloor}
        onRemove={removeFloor}
        onRename={renameFloor}
        onResetFloor={handleResetCurrentFloor}
      />

      <div className="flex flex-1">
        <LeftPanel
          facilityType={state.facilityType}
          onFacilityTypeChange={setFacilityType}
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
          isFireResistantStructure={state.isFireResistantStructure ?? false}
          onFireResistantStructureChange={setIsFireResistantStructure}
          buildingScale={{
            buildingGroundFloorCount: state.buildingGroundFloorCount,
            buildingBasementFloorCount: state.buildingBasementFloorCount,
            buildingAreaSqm: state.buildingAreaSqm,
            buildingTotalFloorAreaSqm: state.buildingTotalFloorAreaSqm,
            buildingSiteAreaSqm: state.buildingSiteAreaSqm,
          }}
          onBuildingScaleChange={setBuildingScale}
          onAutoPlaceSprinklers={autoPlaceSprinklers}
          sprinklerSummary={sprinklerSummary}
          selectedHydrantProduct={selectedHydrantProduct}
          hydrantError={hydrantError}
          onAutoPlaceHydrants={autoPlaceHydrants}
          hydrantSummary={hydrantSummary}
          onAutoPlaceAll={handleAutoPlaceAll}
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
