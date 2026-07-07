"use client";

import type { FacilityType, StructureType } from "@/types/floorplan";
import FacilityTypeSelect from "@/components/panels/FacilityTypeSelect";
import StructureToolbar from "@/components/panels/StructureToolbar";

type LeftPanelProps = {
  facilityType: FacilityType;
  onFacilityTypeChange: (value: FacilityType) => void;
  onAddStructure: (type: StructureType) => void;
};

export default function LeftPanel({
  facilityType,
  onFacilityTypeChange,
  onAddStructure,
}: LeftPanelProps) {
  return (
    <aside className="flex w-56 flex-col gap-6 border-r border-gray-200 bg-white p-4">
      <FacilityTypeSelect value={facilityType} onChange={onFacilityTypeChange} />
      <StructureToolbar onAdd={onAddStructure} />
    </aside>
  );
}
