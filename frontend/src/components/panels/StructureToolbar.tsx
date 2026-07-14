"use client";

import { useState } from "react";
import { EntranceType, RoomType, type StructureType } from "@/types/floorplan";
import {
  STRUCTURE_DEFAULTS,
  STRUCTURE_TYPE_ORDER,
} from "@/constants/structureDefaults";
import { DEFAULT_ROOM_TYPE } from "@/constants/roomTypes";
import { DEFAULT_ENTRANCE_TYPE } from "@/constants/entranceTypes";
import RoomTypeSelect from "@/components/panels/RoomTypeSelect";
import EntranceTypeSelect from "@/components/panels/EntranceTypeSelect";

type StructureToolbarProps = {
  onAdd: (
    type: StructureType,
    roomType?: RoomType,
    entranceType?: EntranceType
  ) => void;
};

const PLAIN_STRUCTURE_TYPES = STRUCTURE_TYPE_ORDER.filter(
  (type) => type !== "room" && type !== "entrance"
);

export default function StructureToolbar({ onAdd }: StructureToolbarProps) {
  const [roomType, setRoomType] = useState<RoomType>(DEFAULT_ROOM_TYPE);
  const [entranceType, setEntranceType] = useState<EntranceType>(DEFAULT_ENTRANCE_TYPE);

  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-gray-500">
        구조물 추가
      </label>
      <div className="flex flex-col gap-1.5">
        <div className="flex gap-1.5">
          <RoomTypeSelect
            value={roomType}
            onChange={setRoomType}
            className="flex-1 rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm"
          />
          <button
            type="button"
            onClick={() => onAdd("room", roomType)}
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm hover:bg-gray-50"
          >
            + 방
          </button>
        </div>
        <div className="flex gap-1.5">
          <EntranceTypeSelect
            value={entranceType}
            onChange={setEntranceType}
            className="flex-1 rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm"
          />
          <button
            type="button"
            onClick={() => onAdd("entrance", undefined, entranceType)}
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm hover:bg-gray-50"
          >
            + 출입구
          </button>
        </div>
        {PLAIN_STRUCTURE_TYPES.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => onAdd(type)}
            className="flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-left text-sm hover:bg-gray-50"
          >
            <span
              className="inline-block h-3 w-3 rounded-sm border"
              style={{
                backgroundColor: STRUCTURE_DEFAULTS[type].fill,
                borderColor: STRUCTURE_DEFAULTS[type].stroke,
              }}
            />
            {STRUCTURE_DEFAULTS[type].label}
          </button>
        ))}
      </div>
    </div>
  );
}
