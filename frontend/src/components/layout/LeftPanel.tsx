"use client";

import type { EntranceType, FacilityType, StructureType, RoomType } from "@/types/floorplan";
import type { HeatDetectorSummary } from "@/hooks/useHeatDetectorPlacement";
import type { ExtinguisherSummary } from "@/hooks/useExtinguisherPlacement";
import FacilityTypeSelect from "@/components/panels/FacilityTypeSelect";
import StructureToolbar from "@/components/panels/StructureToolbar";
import ExtinguisherPanel from "@/components/panels/ExtinguisherPanel";
import HeatDetectorPanel from "@/components/panels/HeatDetectorPanel";

type LeftPanelProps = {
  facilityType: FacilityType;
  onFacilityTypeChange: (value: FacilityType) => void;
  onAddStructure: (
    type: StructureType,
    roomType?: RoomType,
    entranceType?: EntranceType
  ) => void;
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
};

export default function LeftPanel({
  facilityType,
  onFacilityTypeChange,
  onAddStructure,
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
}: LeftPanelProps) {
  return (
    <aside className="flex w-56 flex-col gap-6 overflow-y-auto border-r border-gray-200 bg-white p-4">
      <FacilityTypeSelect value={facilityType} onChange={onFacilityTypeChange} />
      <StructureToolbar onAdd={onAddStructure} />
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
    </aside>
  );
}
