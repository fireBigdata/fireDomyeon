"use client";

import type { FacilityType } from "@/types/floorplan";
import type { HeatDetectorSummary } from "@/hooks/useHeatDetectorPlacement";
import type { ExtinguisherSummary } from "@/hooks/useExtinguisherPlacement";
import type { ExitLightSummary } from "@/lib/exitLightPlacement";
import type { SprinklerSummary } from "@/hooks/useSprinklerPlacement";
import FacilityTypeSelect from "@/components/panels/FacilityTypeSelect";
import StructureToolbar, { type StructureCategory } from "@/components/panels/StructureToolbar";
import ExtinguisherPanel from "@/components/panels/ExtinguisherPanel";
import HeatDetectorPanel from "@/components/panels/HeatDetectorPanel";
import ExitLightPanel from "@/components/panels/ExitLightPanel";
import SprinklerPanel from "@/components/panels/SprinklerPanel";

type LeftPanelProps = {
  facilityType: FacilityType;
  onFacilityTypeChange: (value: FacilityType) => void;
  pendingCategory: StructureCategory | null;
  onArmStructure: (category: StructureCategory) => void;
  extinguisherTypeId: string;
  onExtinguisherTypeChange: (id: string) => void;
  extinguisherAbilityUnitsInput: string;
  onExtinguisherAbilityUnitsChange: (value: string) => void;
  extinguisherError: string | null;
  onAutoPlaceExtinguishers: () => void;
  extinguisherSummary: ExtinguisherSummary | null;
  heatDetectorCoverageAreaInput: string;
  onHeatDetectorCoverageAreaChange: (value: string) => void;
  heatDetectorError: string | null;
  onAutoPlaceHeatDetectors: () => void;
  heatDetectorSummary: HeatDetectorSummary | null;
  onAutoPlaceExitLights: () => void;
  exitLightSummary: ExitLightSummary | null;
  isFireResistantStructure: boolean;
  onFireResistantStructureChange: (value: boolean) => void;
  onAutoPlaceSprinklers: () => void;
  sprinklerSummary: SprinklerSummary | null;
};

export default function LeftPanel({
  facilityType,
  onFacilityTypeChange,
  pendingCategory,
  onArmStructure,
  extinguisherTypeId,
  onExtinguisherTypeChange,
  extinguisherAbilityUnitsInput,
  onExtinguisherAbilityUnitsChange,
  extinguisherError,
  onAutoPlaceExtinguishers,
  extinguisherSummary,
  heatDetectorCoverageAreaInput,
  onHeatDetectorCoverageAreaChange,
  heatDetectorError,
  onAutoPlaceHeatDetectors,
  heatDetectorSummary,
  onAutoPlaceExitLights,
  exitLightSummary,
  isFireResistantStructure,
  onFireResistantStructureChange,
  onAutoPlaceSprinklers,
  sprinklerSummary,
}: LeftPanelProps) {
  return (
    <aside className="flex w-56 flex-col gap-6 overflow-y-auto border-r border-gray-200 bg-white p-4">
      <FacilityTypeSelect value={facilityType} onChange={onFacilityTypeChange} />
      <StructureToolbar pendingCategory={pendingCategory} onArm={onArmStructure} />
      <ExtinguisherPanel
        facilityType={facilityType}
        typeId={extinguisherTypeId}
        onTypeChange={onExtinguisherTypeChange}
        abilityUnitsInput={extinguisherAbilityUnitsInput}
        onAbilityUnitsChange={onExtinguisherAbilityUnitsChange}
        error={extinguisherError}
        onAutoPlace={onAutoPlaceExtinguishers}
        summary={extinguisherSummary}
      />
      <HeatDetectorPanel
        coverageAreaInput={heatDetectorCoverageAreaInput}
        onCoverageAreaChange={onHeatDetectorCoverageAreaChange}
        error={heatDetectorError}
        onAutoPlace={onAutoPlaceHeatDetectors}
        summary={heatDetectorSummary}
      />
      <ExitLightPanel onAutoPlace={onAutoPlaceExitLights} summary={exitLightSummary} />
      <SprinklerPanel
        isFireResistantStructure={isFireResistantStructure}
        onFireResistantChange={onFireResistantStructureChange}
        onAutoPlace={onAutoPlaceSprinklers}
        summary={sprinklerSummary}
      />
    </aside>
  );
}
