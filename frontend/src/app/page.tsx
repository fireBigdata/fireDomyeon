"use client";

import { useFloorPlanState } from "@/hooks/useFloorPlanState";
import { useSaveFloorPlan } from "@/hooks/useSaveFloorPlan";
import TopBar from "@/components/layout/TopBar";
import LeftPanel from "@/components/layout/LeftPanel";
import RightPanel from "@/components/layout/RightPanel";
import AreaSummary from "@/components/panels/AreaSummary";
import DynamicFloorPlanCanvas from "@/components/canvas/DynamicFloorPlanCanvas";

export default function Home() {
  const {
    state,
    selectedStructure,
    totalArea,
    setName,
    setFacilityType,
    addStructure,
    updateStructure,
    selectStructure,
  } = useFloorPlanState();

  const saveFloorPlan = useSaveFloorPlan();

  return (
    <div className="flex min-h-screen flex-1 flex-col bg-gray-50">
      <TopBar
        name={state.name}
        onNameChange={setName}
        onSave={() => saveFloorPlan.mutate(state)}
        isSaving={saveFloorPlan.isPending}
      />

      <div className="flex flex-1">
        <LeftPanel
          facilityType={state.facilityType}
          onFacilityTypeChange={setFacilityType}
          onAddStructure={addStructure}
        />

        <main className="flex flex-1 flex-col items-center gap-4 overflow-auto p-6">
          <AreaSummary
            totalArea={totalArea}
            structureCount={state.structures.length}
          />
          <DynamicFloorPlanCanvas
            structures={state.structures}
            selectedStructureId={state.selectedStructureId}
            onSelect={selectStructure}
            onChange={updateStructure}
          />
        </main>

        <RightPanel
          structure={selectedStructure}
          scale={state.scale}
          onChange={updateStructure}
        />
      </div>
    </div>
  );
}
