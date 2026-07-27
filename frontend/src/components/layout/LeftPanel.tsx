"use client";

import type { FacilityType } from "@/types/floorplan";
import type { EquipmentProduct } from "@/types/equipmentSelection";
import type { HeatDetectorSummary } from "@/hooks/useHeatDetectorPlacement";
import type { ExtinguisherSummary } from "@/hooks/useExtinguisherPlacement";
import type { ExitLightSummary } from "@/lib/exitLightPlacement";
import type { SmokeDetectorSummary } from "@/lib/smokeDetectorPlacement";
import type { SprinklerSummary } from "@/hooks/useSprinklerPlacement";
import type { HydrantSummary } from "@/hooks/useHydrantPlacement";
import StructureToolbar, { type StructureCategory } from "@/components/panels/StructureToolbar";
import EvacuationRoutePanel from "@/components/panels/EvacuationRoutePanel";
import AutoPlacementToggle from "@/components/panels/AutoPlacementToggle";
import ExtinguisherPanel from "@/components/panels/ExtinguisherPanel";
import HeatDetectorPanel from "@/components/panels/HeatDetectorPanel";
import ExitLightPanel from "@/components/panels/ExitLightPanel";
import SmokeDetectorPanel from "@/components/panels/SmokeDetectorPanel";
import SprinklerPanel from "@/components/panels/SprinklerPanel";
import HydrantPanel from "@/components/panels/HydrantPanel";

type LeftPanelProps = {
  facilityType: FacilityType;
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
  selectedSmokeDetectorProduct: EquipmentProduct | null;
  smokeDetectorError: string | null;
  onAutoPlaceSmokeDetectors: () => void;
  smokeDetectorSummary: SmokeDetectorSummary | null;
  evacuationRouteMode: boolean;
  onToggleEvacuationRoute: () => void;
  onAutoPlaceSprinklers: () => void;
  sprinklerSummary: SprinklerSummary | null;
  selectedHydrantProduct: EquipmentProduct | null;
  hydrantError: string | null;
  onAutoPlaceHydrants: () => void;
  hydrantSummary: HydrantSummary | null;
  autoPlacementEnabled: boolean;
  onToggleAutoPlacement: () => void;
};

export default function LeftPanel({
  facilityType,
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
  selectedSmokeDetectorProduct,
  smokeDetectorError,
  onAutoPlaceSmokeDetectors,
  smokeDetectorSummary,
  evacuationRouteMode,
  onToggleEvacuationRoute,
  onAutoPlaceSprinklers,
  sprinklerSummary,
  selectedHydrantProduct,
  hydrantError,
  onAutoPlaceHydrants,
  hydrantSummary,
  autoPlacementEnabled,
  onToggleAutoPlacement,
}: LeftPanelProps) {
  return (
    <aside className="flex w-56 flex-col gap-6 overflow-y-auto border-r border-gray-200 bg-white p-4">
      <StructureToolbar pendingCategory={pendingCategory} onArm={onArmStructure} />
      <EvacuationRoutePanel isActive={evacuationRouteMode} onToggle={onToggleEvacuationRoute} />
      <AutoPlacementToggle isEnabled={autoPlacementEnabled} onToggle={onToggleAutoPlacement} />
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
      <SmokeDetectorPanel
        selectedProduct={selectedSmokeDetectorProduct}
        error={smokeDetectorError}
        onAutoPlace={onAutoPlaceSmokeDetectors}
        summary={smokeDetectorSummary}
      />
      <SprinklerPanel onAutoPlace={onAutoPlaceSprinklers} summary={sprinklerSummary} />
      <HydrantPanel
        selectedProduct={selectedHydrantProduct}
        error={hydrantError}
        onAutoPlace={onAutoPlaceHydrants}
        summary={hydrantSummary}
      />
    </aside>
  );
}
