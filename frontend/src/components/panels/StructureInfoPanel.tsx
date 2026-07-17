"use client";

import type { EntranceType, PartitionDirection, RoomType, Structure } from "@/types/floorplan";
import { STRUCTURE_DEFAULTS } from "@/constants/structureDefaults";
import { DEFAULT_ROOM_TYPE } from "@/constants/roomTypes";
import { DEFAULT_ENTRANCE_TYPE } from "@/constants/entranceTypes";
import RoomTypeSelect from "@/components/panels/RoomTypeSelect";
import EntranceTypeSelect from "@/components/panels/EntranceTypeSelect";
import { ROOT_LEAF_ID, computeEffectivePixelArea, findPartitionNode } from "@/lib/partitionTree";
import { formatArea, pixelAreaToSquareMeters } from "@/lib/area";
import { isEntranceStructure } from "@/lib/structureArea";

type StructureInfoPanelProps = {
  structure: Structure | null;
  scale: number;
  selectedPartitionId: string | null;
  onChange: (id: string, changes: Partial<Structure>) => void;
  onRoomTypeChange: (id: string, roomType: RoomType) => void;
  onEntranceTypeChange: (id: string, entranceType: EntranceType) => void;
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

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-800">{value}</span>
    </div>
  );
}

export default function StructureInfoPanel({
  structure,
  scale,
  selectedPartitionId,
  onChange,
  onRoomTypeChange,
  onEntranceTypeChange,
  onSplitPartition,
  onResetPartitions,
  onMergePartition,
  onDeletePartitionRegion,
  onRestorePartitionRegion,
  onDeleteStructure,
}: StructureInfoPanelProps) {
  if (!structure) {
    return (
      <div className="text-sm text-gray-400">
        캔버스에서 구조물을 선택하면 정보가 표시됩니다.
      </div>
    );
  }

  const isRoom = structure.type === "room";
  const isEntrance = isEntranceStructure(structure);
  // Entrances (공동현관/비상구/문) are openings, not floor space, so they have no area to compute.
  const area = isEntrance
    ? null
    : pixelAreaToSquareMeters(computeEffectivePixelArea(structure), scale);
  const targetLeafId = selectedPartitionId ?? ROOT_LEAF_ID;
  const selectedNode = selectedPartitionId
    ? findPartitionNode(structure.partitions, selectedPartitionId)
    : undefined;
  const isEmptySelected = selectedNode?.kind === "empty";

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-gray-800">
        {STRUCTURE_DEFAULTS[structure.type].label}
      </h3>

      <InfoRow label="x" value={structure.x.toFixed(0)} />
      <InfoRow label="y" value={structure.y.toFixed(0)} />

      <label className="flex items-center justify-between text-sm">
        <span className="text-gray-500">width</span>
        <input
          type="number"
          min={10}
          value={Math.round(structure.width)}
          onChange={(e) =>
            onChange(structure.id, {
              width: Math.max(10, Number(e.target.value) || 10),
            })
          }
          className="w-24 rounded-md border border-gray-300 px-2 py-1 text-right text-sm"
        />
      </label>

      <label className="flex items-center justify-between text-sm">
        <span className="text-gray-500">height</span>
        <input
          type="number"
          min={10}
          value={Math.round(structure.height)}
          onChange={(e) =>
            onChange(structure.id, {
              height: Math.max(10, Number(e.target.value) || 10),
            })
          }
          className="w-24 rounded-md border border-gray-300 px-2 py-1 text-right text-sm"
        />
      </label>

      {area !== null && <InfoRow label="면적" value={formatArea(area)} />}

      {isRoom && (
        <>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-gray-500">용도</span>
            <RoomTypeSelect
              value={structure.roomType ?? DEFAULT_ROOM_TYPE}
              onChange={(value) => onRoomTypeChange(structure.id, value)}
            />
          </label>

          <div className="flex flex-col gap-1.5 border-t border-gray-100 pt-3">
            {isEmptySelected ? (
              <>
                <span className="text-xs font-medium text-gray-500">
                  선택한 구획은 빈 공간입니다
                </span>
                <button
                  type="button"
                  onClick={() =>
                    onRestorePartitionRegion(structure.id, selectedPartitionId!)
                  }
                  className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs hover:bg-gray-50"
                >
                  구획 복원
                </button>
              </>
            ) : (
              <>
                <span className="text-xs font-medium text-gray-500">
                  구획 분할
                  {!structure.partitions && " (캔버스에서 구획 선택 없이 전체 분할)"}
                </span>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      onSplitPartition(structure.id, targetLeafId, "vertical")
                    }
                    className="flex-1 rounded-md border border-gray-300 bg-white px-2 py-1 text-xs hover:bg-gray-50"
                  >
                    수직 분할
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onSplitPartition(structure.id, targetLeafId, "horizontal")
                    }
                    className="flex-1 rounded-md border border-gray-300 bg-white px-2 py-1 text-xs hover:bg-gray-50"
                  >
                    수평 분할
                  </button>
                </div>
                <p className="text-[11px] text-gray-400">
                  캔버스의 분할선을 드래그하면 구획 크기를 조정할 수 있습니다.
                </p>
                <button
                  type="button"
                  disabled={!selectedPartitionId}
                  onClick={() =>
                    selectedPartitionId &&
                    onMergePartition(structure.id, selectedPartitionId)
                  }
                  className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-300 disabled:hover:bg-white"
                >
                  선택한 구획과 인접 구획 병합 (선 삭제)
                  {!selectedPartitionId && " (캔버스에서 구획 선택 필요)"}
                </button>
                <button
                  type="button"
                  disabled={!selectedPartitionId}
                  onClick={() =>
                    selectedPartitionId &&
                    onDeletePartitionRegion(structure.id, selectedPartitionId)
                  }
                  className="rounded-md border border-red-200 bg-white px-2 py-1 text-xs text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-300 disabled:hover:bg-white"
                >
                  선택한 구획 삭제 (빈 공간으로)
                  {!selectedPartitionId && " (캔버스에서 구획 선택 필요)"}
                </button>
              </>
            )}
            {structure.partitions && (
              <button
                type="button"
                onClick={() => onResetPartitions(structure.id)}
                className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs text-gray-500 hover:bg-gray-50"
              >
                구획 전체 초기화
              </button>
            )}
          </div>
        </>
      )}

      {isEntrance && (
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-gray-500">출입구 종류</span>
          <EntranceTypeSelect
            value={structure.entranceType ?? DEFAULT_ENTRANCE_TYPE}
            onChange={(value) => onEntranceTypeChange(structure.id, value)}
          />
        </label>
      )}

      <button
        type="button"
        onClick={() => {
          if (
            window.confirm(
              "이 구조물을 삭제하시겠습니까? 연결된 구획, 감지기, 소화기도 함께 삭제됩니다."
            )
          ) {
            onDeleteStructure(structure.id);
          }
        }}
        className="mt-1 rounded-md border border-red-200 bg-white px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
      >
        구조물 삭제
      </button>
    </div>
  );
}
