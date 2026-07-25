"use client";

import { Fragment, useState } from "react";
import type { DragEvent } from "react";
import type { Floor } from "@/types/floorplan";
import { GROUND_MARKER_KEY, buildFloorBarOrder } from "@/lib/floorOrder";

type FloorBarProps = {
  floors: Floor[];
  /** See FloorPlanState.groundMarkerIndex — drives both the 지상 marker's
   * position in the bar and every floor's auto-computed name. */
  groundMarkerIndex: number;
  currentFloorId: string;
  onSelect: (floorId: string) => void;
  onAdd: () => void;
  onClone: () => void;
  onRemove: (floorId: string) => void;
  /** Drag-and-drop reorder: draggedKey is a floor id or GROUND_MARKER_KEY;
   * gapIndex is which dashed drop-line (rendered between/around tabs) the
   * user released over — dragging a floor across the marker, or dragging the
   * marker itself, both go through this one callback. */
  onMoveItem: (draggedKey: string, gapIndex: number) => void;
  onResetFloor: () => void;
};

type DropGapProps = {
  index: number;
  isDragging: boolean;
  isActive: boolean;
  onDragOver: (index: number) => void;
  onDrop: (index: number) => void;
};

/**
 * Drop target rendered between/around every tab (and the 지상 marker) — kept
 * permanently mounted (only its width/style react to `isDragging`/`isActive`)
 * rather than being added/removed at drag start/end. Mounting a fresh drop
 * target mid-drag is what made the second-and-later drag flaky: some
 * browsers don't reliably recognize an element that only appears after a
 * native drag is already in progress, which could leave the drag state
 * machine stuck for the next attempt. Widens and shows a dashed line while
 * dragging, so it's clear a floor can be dropped between two floors or at
 * either end, not just directly onto another tab.
 */
function DropGap({ index, isDragging, isActive, onDragOver, onDrop }: DropGapProps) {
  return (
    <div
      onDragEnter={(e) => e.preventDefault()}
      onDragOver={(e) => {
        e.preventDefault();
        onDragOver(index);
      }}
      onDrop={(e) => {
        e.preventDefault();
        onDrop(index);
      }}
      className={`flex h-7 shrink-0 items-center justify-center transition-[width] ${
        isDragging ? "w-3" : "w-1.5"
      }`}
    >
      <div
        className={`h-full w-0 border-l-2 ${
          isActive ? "border-dashed border-blue-500" : "border-transparent"
        }`}
      />
    </div>
  );
}

export default function FloorBar({
  floors,
  groundMarkerIndex,
  currentFloorId,
  onSelect,
  onAdd,
  onClone,
  onRemove,
  onMoveItem,
  onResetFloor,
}: FloorBarProps) {
  const currentFloorName =
    floors.find((f) => f.id === currentFloorId)?.name ?? "현재 층";

  const handleResetFloor = () => {
    if (window.confirm(`${currentFloorName}에 그린 내용을 모두 지우시겠습니까?`)) {
      onResetFloor();
    }
  };

  const [draggedKey, setDraggedKey] = useState<string | null>(null);
  const [dragOverGap, setDragOverGap] = useState<number | null>(null);
  const isDragging = draggedKey !== null;

  const handleDragStart = (key: string) => (e: DragEvent) => {
    setDraggedKey(key);
    e.dataTransfer.effectAllowed = "move";
    // Some browsers (notably Firefox) only commit to a drag operation, and
    // reliably fire later dragover/drop events, once dataTransfer carries
    // data — without this, drags can start looking fine but silently stop
    // producing drop events after the first one or two.
    e.dataTransfer.setData("text/plain", key);
  };
  const handleDragEnd = () => {
    setDraggedKey(null);
    setDragOverGap(null);
  };
  const handleDropAtGap = (gapIndex: number) => {
    if (draggedKey) onMoveItem(draggedKey, gapIndex);
    setDraggedKey(null);
    setDragOverGap(null);
  };

  const order = buildFloorBarOrder(floors, groundMarkerIndex);
  const floorsById = new Map(floors.map((f) => [f.id, f] as const));
  const groundFloorCount = floors.length - groundMarkerIndex;
  const basementFloorCount = groundMarkerIndex;

  return (
    <div className="flex items-center gap-2 border-b border-gray-200 bg-white px-4 py-2">
      <div className="flex flex-1 flex-wrap items-center">
        {order.map((key, index) => (
          <Fragment key={key}>
            <DropGap
              index={index}
              isDragging={isDragging}
              isActive={dragOverGap === index}
              onDragOver={setDragOverGap}
              onDrop={handleDropAtGap}
            />
            {key === GROUND_MARKER_KEY ? (
              <div
                draggable
                onDragStart={handleDragStart(key)}
                onDragEnd={handleDragEnd}
                title="드래그해서 지상/지하 경계를 옮길 수 있어요"
                className={`flex cursor-grab flex-col items-center rounded-md border border-dashed border-gray-300 bg-gray-50 px-2 py-1 leading-none active:cursor-grabbing ${
                  draggedKey === key ? "opacity-50" : ""
                }`}
              >
                <span className="text-xs font-medium text-gray-500">지상</span>
                <span className="mt-0.5 text-[10px] text-gray-400">
                  지상{groundFloorCount}·지하{basementFloorCount}
                </span>
              </div>
            ) : (
              (() => {
                const floor = floorsById.get(key);
                if (!floor) return null;
                const isActive = floor.id === currentFloorId;
                return (
                  <div
                    draggable
                    onDragStart={handleDragStart(floor.id)}
                    onDragEnd={handleDragEnd}
                    className={`flex cursor-grab items-center gap-1 rounded-md border px-2 py-1 text-sm active:cursor-grabbing ${
                      isActive
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-gray-300 bg-white text-gray-600 hover:bg-gray-50"
                    } ${draggedKey === floor.id ? "opacity-50" : ""}`}
                  >
                    <button type="button" onClick={() => onSelect(floor.id)}>
                      {floor.name}
                    </button>
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
              })()
            )}
          </Fragment>
        ))}
        <DropGap
          index={order.length}
          isDragging={isDragging}
          isActive={dragOverGap === order.length}
          onDragOver={setDragOverGap}
          onDrop={handleDropAtGap}
        />
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
      <button
        type="button"
        onClick={handleResetFloor}
        className="rounded-md border border-gray-300 bg-white px-3 py-1 text-sm text-red-600 hover:bg-red-50"
      >
        층 초기화
      </button>
    </div>
  );
}
