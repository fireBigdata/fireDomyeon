"use client";

import type { FacilityType, StructureType, RoomType } from "@/types/floorplan";
import FacilityTypeSelect from "@/components/panels/FacilityTypeSelect";
import StructureToolbar from "@/components/panels/StructureToolbar";
import ExtinguisherPanel from "@/components/panels/ExtinguisherPanel";

type LeftPanelProps = {
  facilityType: FacilityType;
  onFacilityTypeChange: (value: FacilityType) => void;
  onAddStructure: (type: StructureType, roomType?: RoomType) => void;
  extinguisherTypeId: string;
  onExtinguisherTypeChange: (id: string) => void;
  onAutoPlaceExtinguishers: () => void;
  extinguisherSummary: { totalArea: number; requiredCount: number } | null;
};

export default function LeftPanel({
  facilityType,
  onFacilityTypeChange,
  onAddStructure,
  extinguisherTypeId,
  onExtinguisherTypeChange,
  onAutoPlaceExtinguishers,
  extinguisherSummary,
}: LeftPanelProps) {
  return (
    <aside className="flex w-56 flex-col gap-6 border-r border-gray-200 bg-white p-4">
      <FacilityTypeSelect value={facilityType} onChange={onFacilityTypeChange} />
      <StructureToolbar onAdd={onAddStructure} />
      <ExtinguisherPanel
        typeId={extinguisherTypeId}
        onTypeChange={onExtinguisherTypeChange}
        onAutoPlace={onAutoPlaceExtinguishers}
        summary={extinguisherSummary}
      />
    </aside>
  );
}
