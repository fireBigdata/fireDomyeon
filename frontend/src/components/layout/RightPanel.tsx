"use client";

import type {
  EntranceSwingDirection,
  EntranceType,
  PartitionDirection,
  RoomType,
  SprinklerHazardClass,
  Structure,
} from "@/types/floorplan";
import StructureInfoPanel from "@/components/panels/StructureInfoPanel";

type RightPanelProps = {
  structure: Structure | null;
  scale: number;
  selectedPartitionId: string | null;
  onChange: (id: string, changes: Partial<Structure>) => void;
  onRoomTypeChange: (id: string, roomType: RoomType) => void;
  onSprinklerHazardChange: (id: string, hazard: SprinklerHazardClass) => void;
  onEntranceTypeChange: (id: string, entranceType: EntranceType) => void;
  onEntranceSwingDirectionChange: (
    id: string,
    entranceSwingDirection: EntranceSwingDirection
  ) => void;
  onSplitPartition: (
    structureId: string,
    leafId: string,
    direction: PartitionDirection
  ) => void;
  onResetPartitions: (structureId: string) => void;
  onMergePartition: (structureId: string, leafId: string) => void;
  onDeletePartitionRegion: (structureId: string, leafId: string) => void;
  onRestorePartitionRegion: (structureId: string, emptyId: string) => void;
  onDeleteStructure: (id: string) => void;
};

export default function RightPanel({
  structure,
  scale,
  selectedPartitionId,
  onChange,
  onRoomTypeChange,
  onSprinklerHazardChange,
  onEntranceTypeChange,
  onEntranceSwingDirectionChange,
  onSplitPartition,
  onResetPartitions,
  onMergePartition,
  onDeletePartitionRegion,
  onRestorePartitionRegion,
  onDeleteStructure,
}: RightPanelProps) {
  return (
    <aside className="w-64 border-l border-gray-200 bg-white p-4">
      <h2 className="mb-3 text-xs font-medium text-gray-500">구조물 정보</h2>
      <StructureInfoPanel
        structure={structure}
        scale={scale}
        selectedPartitionId={selectedPartitionId}
        onChange={onChange}
        onRoomTypeChange={onRoomTypeChange}
        onSprinklerHazardChange={onSprinklerHazardChange}
        onEntranceTypeChange={onEntranceTypeChange}
        onEntranceSwingDirectionChange={onEntranceSwingDirectionChange}
        onSplitPartition={onSplitPartition}
        onResetPartitions={onResetPartitions}
        onMergePartition={onMergePartition}
        onDeletePartitionRegion={onDeletePartitionRegion}
        onRestorePartitionRegion={onRestorePartitionRegion}
        onDeleteStructure={onDeleteStructure}
      />
    </aside>
  );
}
