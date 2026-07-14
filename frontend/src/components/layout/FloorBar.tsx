"use client";

import { useState } from "react";
import type { Floor } from "@/types/floorplan";

type FloorBarProps = {
  floors: Floor[];
  currentFloorId: string;
  onSelect: (floorId: string) => void;
  onAdd: () => void;
  onClone: () => void;
  onRemove: (floorId: string) => void;
  onRename: (floorId: string, name: string) => void;
};

export default function FloorBar({
  floors,
  currentFloorId,
  onSelect,
  onAdd,
  onClone,
  onRemove,
  onRename,
}: FloorBarProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState("");

  const startEditing = (floor: Floor) => {
    setEditingId(floor.id);
    setDraftName(floor.name);
  };

  const commitEditing = () => {
    if (editingId && draftName.trim()) {
      onRename(editingId, draftName.trim());
    }
    setEditingId(null);
  };

  return (
    <div className="flex items-center gap-2 border-b border-gray-200 bg-white px-4 py-2">
      <div className="flex flex-1 flex-wrap gap-1.5">
        {floors.map((floor) => {
          const isActive = floor.id === currentFloorId;
          return (
            <div
              key={floor.id}
              className={`flex items-center gap-1 rounded-md border px-2 py-1 text-sm ${
                isActive
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-gray-300 bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              {editingId === floor.id ? (
                <input
                  autoFocus
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                  onBlur={commitEditing}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commitEditing();
                    if (e.key === "Escape") setEditingId(null);
                  }}
                  className="w-16 rounded border border-gray-300 px-1 text-sm"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => onSelect(floor.id)}
                  onDoubleClick={() => startEditing(floor)}
                >
                  {floor.name}
                </button>
              )}
              {floors.length > 1 && (
                <button
                  type="button"
                  onClick={() => onRemove(floor.id)}
                  className="text-xs text-gray-400 hover:text-red-500"
                  aria-label={`${floor.name} 삭제`}
                >
                  ×
                </button>
              )}
            </div>
          );
        })}
      </div>
      <button
        type="button"
        onClick={onClone}
        className="rounded-md border border-gray-300 bg-white px-3 py-1 text-sm hover:bg-gray-50"
      >
        층 복제
      </button>
      <button
        type="button"
        onClick={onAdd}
        className="rounded-md border border-gray-300 bg-white px-3 py-1 text-sm hover:bg-gray-50"
      >
        + 층 추가
      </button>
    </div>
  );
}
