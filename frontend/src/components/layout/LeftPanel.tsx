"use client";

import type { FacilityType } from "@/types/floorplan";
import type { EquipmentProduct } from "@/types/equipmentSelection";
import type { HeatDetectorSummary } from "@/hooks/useHeatDetectorPlacement";
import type { ExtinguisherSummary } from "@/hooks/useExtinguisherPlacement";
import type { ExitLightSummary } from "@/lib/exitLightPlacement";
import type { SprinklerSummary } from "@/hooks/useSprinklerPlacement";
import FacilityTypeSelect from "@/components/panels/FacilityTypeSelect";
import StructureToolbar, { type StructureCategory } from "@/components/panels/StructureToolbar";
import FireResistanceToggle from "@/components/panels/FireResistanceToggle";
import ExtinguisherPanel from "@/components/panels/ExtinguisherPanel";
import HeatDetectorPanel from "@/components/panels/HeatDetectorPanel";
import ExitLightPanel from "@/components/panels/ExitLightPanel";
import SprinklerPanel from "@/components/panels/SprinklerPanel";

type LeftPanelProps = {
  facilityType: FacilityType;
  onFacilityTypeChange: (value: FacilityType) => void;
  pendingCategory: StructureCategory | null;
  onArmStructure: (category: StructureCategory) => void;
  selectedExtinguisherProduct: EquipmentProduct | null;
  extinguisherError: string | null;
  onAutoPlaceExtinguishers: () => void;
  extinguisherSummary: ExtinguisherSummary | null;
  selectedDifferentialDetectorProduct: EquipmentProduct | null;
  selectedFixedTemperatureDetectorProduct: EquipmentProduct | null;
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
  selectedExtinguisherProduct,
  extinguisherError,
  onAutoPlaceExtinguishers,
  extinguisherSummary,
  selectedDifferentialDetectorProduct,
  selectedFixedTemperatureDetectorProduct,
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
      <FireResistanceToggle
        isFireResistantStructure={isFireResistantStructure}
        onChange={onFireResistantStructureChange}
      />
      <ExtinguisherPanel
        facilityType={facilityType}
        selectedProduct={selectedExtinguisherProduct}
        error={extinguisherError}
        onAutoPlace={onAutoPlaceExtinguishers}
        summary={extinguisherSummary}
      />
      <HeatDetectorPanel
        differentialProduct={selectedDifferentialDetectorProduct}
        fixedTemperatureProduct={selectedFixedTemperatureDetectorProduct}
        error={heatDetectorError}
        onAutoPlace={onAutoPlaceHeatDetectors}
        summary={heatDetectorSummary}
      />
      <ExitLightPanel onAutoPlace={onAutoPlaceExitLights} summary={exitLightSummary} />
      <SprinklerPanel onAutoPlace={onAutoPlaceSprinklers} summary={sprinklerSummary} />
    </aside>
  );
}
