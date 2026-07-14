"use client";

import { RoomType } from "@/types/floorplan";
import { ROOM_TYPE_DEFAULTS, ROOM_TYPE_ORDER } from "@/constants/roomTypes";

type RoomTypeSelectProps = {
  value: RoomType;
  onChange: (value: RoomType) => void;
  className?: string;
};

export default function RoomTypeSelect({
  value,
  onChange,
  className,
}: RoomTypeSelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as RoomType)}
      className={
        className ??
        "w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm"
      }
    >
      {ROOM_TYPE_ORDER.map((type) => (
        <option key={type} value={type}>
          {ROOM_TYPE_DEFAULTS[type].label}
        </option>
      ))}
    </select>
  );
}
