"use client";

import { useFloorPlanState } from "@/hooks/useFloorPlanState";
import { useSaveFloorPlan } from "@/hooks/useSaveFloorPlan";
import { useExtinguisherPlacement } from "@/hooks/useExtinguisherPlacement";
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
  } = useFloorPlanState();

  const saveFloorPlan = useSaveFloorPlan();

  const {
    typeId: extinguisherTypeId,
    setTypeId: setExtinguisherTypeId,
    summary: extinguisherSummary,
    autoPlace: autoPlaceExtinguishers,
  } = useExtinguisherPlacement(
    currentFloor.structures,
    state.scale,
    setExtinguisherPlacements
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
          onAddStructure={addStructure}
          extinguisherTypeId={extinguisherTypeId}
          onExtinguisherTypeChange={setExtinguisherTypeId}
          onAutoPlaceExtinguishers={autoPlaceExtinguishers}
          extinguisherSummary={extinguisherSummary}
        />

        <main className="flex flex-1 flex-col items-center gap-4 overflow-auto p-6">
          <AreaSummary
            totalArea={totalArea}
            structureCount={currentFloor.structures.length}
          />
          <DynamicFloorPlanCanvas
            structures={currentFloor.structures}
            selectedStructureId={state.selectedStructureId}
            selectedPartitionId={state.selectedPartitionId}
            extinguisherPlacements={currentFloor.extinguisherPlacements}
            onSelect={selectStructure}
            onSelectPartition={selectPartition}
            onResizePartition={resizePartition}
            onChange={updateStructure}
          />
        </main>

        <RightPanel
          structure={selectedStructure}
          scale={state.scale}
          selectedPartitionId={state.selectedPartitionId}
          onChange={updateStructure}
          onRoomTypeChange={setRoomType}
          onSplitPartition={splitPartition}
          onResetPartitions={resetPartitions}
          onMergePartition={mergePartition}
          onDeletePartitionRegion={deletePartitionRegion}
          onRestorePartitionRegion={restorePartitionRegion}
        />
      </div>
    </div>
  );
}
