"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Circle, Group, Layer, Rect, Stage, Text, Transformer } from "react-konva";
import type Konva from "konva";
import type { ExtinguisherPlacement, HeatDetector, Structure } from "@/types/floorplan";
import { CANVAS_BACKGROUND_COLOR } from "@/constants/canvas";
import { DEFAULT_ROOM_TYPE, ROOM_TYPE_DEFAULTS } from "@/constants/roomTypes";
import { isDoorStructure } from "@/lib/structureArea";
import StructureShape from "./StructureShape";
import HeatDetectorShape from "./HeatDetectorShape";

const CANVAS_WIDTH = 900;
const CANVAS_HEIGHT = 600;
const MIN_ZOOM = 0.4;
const MAX_ZOOM = 3;
const ZOOM_STEP = 1.15;

type ViewTransform = { scale: number; x: number; y: number };

const INITIAL_VIEW: ViewTransform = { scale: 1, x: 0, y: 0 };

function clampZoom(value: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));
}

type FloorPlanCanvasProps = {
  structures: Structure[];
  scale: number;
  selectedStructureId: string | null;
  selectedPartitionId: string | null;
  extinguisherPlacements: ExtinguisherPlacement[];
  heatDetectors: HeatDetector[];
  selectedHeatDetectorId: string | null;
  onSelect: (id: string | null) => void;
  onSelectPartition: (structureId: string, leafId: string) => void;
  onResizePartition: (structureId: string, splitId: string, ratio: number) => void;
  onSelectHeatDetector: (id: string | null) => void;
  onChange: (id: string, changes: Partial<Structure>) => void;
};

export default function FloorPlanCanvas({
  structures,
  scale,
  selectedStructureId,
  selectedPartitionId,
  extinguisherPlacements,
  heatDetectors,
  selectedHeatDetectorId,
  onSelect,
  onSelectPartition,
  onResizePartition,
  onSelectHeatDetector,
  onChange,
}: FloorPlanCanvasProps) {
  const transformerRef = useRef<Konva.Transformer>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const nodesRef = useRef<Map<string, Konva.Group>>(new Map());
  const [view, setView] = useState<ViewTransform>(INITIAL_VIEW);

  const registerNode = useCallback((id: string, node: Konva.Group | null) => {
    if (node) {
      nodesRef.current.set(id, node);
    } else {
      nodesRef.current.delete(id);
    }
  }, []);

  // Zooms so the content under `point` (in stage/screen coordinates) stays
  // fixed on screen, instead of zooming toward the canvas origin.
  const zoomAtPoint = useCallback((point: { x: number; y: number }, direction: 1 | -1) => {
    setView((prev) => {
      const nextScale = clampZoom(
        direction > 0 ? prev.scale * ZOOM_STEP : prev.scale / ZOOM_STEP
      );
      const contentPoint = {
        x: (point.x - prev.x) / prev.scale,
        y: (point.y - prev.y) / prev.scale,
      };
      return {
        scale: nextScale,
        x: point.x - contentPoint.x * nextScale,
        y: point.y - contentPoint.y * nextScale,
      };
    });
  }, []);

  const handleWheel = useCallback(
    (e: Konva.KonvaEventObject<WheelEvent>) => {
      e.evt.preventDefault();
      const pointer = stageRef.current?.getPointerPosition();
      if (!pointer) return;
      zoomAtPoint(pointer, e.evt.deltaY > 0 ? -1 : 1);
    },
    [zoomAtPoint]
  );

  const handleZoomButton = useCallback(
    (direction: 1 | -1) => {
      zoomAtPoint({ x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 }, direction);
    },
    [zoomAtPoint]
  );

  const handleResetView = useCallback(() => {
    setView(INITIAL_VIEW);
  }, []);

  const handleStageDragEnd = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
    // Konva drag events bubble: dragging a room (its own draggable Group)
    // would otherwise be mistaken here for panning the stage.
    if (e.target !== e.target.getStage()) return;
    setView((prev) => ({ ...prev, x: e.target.x(), y: e.target.y() }));
  }, []);

  useEffect(() => {
    const transformer = transformerRef.current;
    if (!transformer) return;

    const selectedNode = selectedStructureId
      ? nodesRef.current.get(selectedStructureId)
      : null;

    if (selectedNode) {
      transformer.nodes([selectedNode]);
    } else {
      transformer.nodes([]);
    }
    transformer.getLayer()?.batchDraw();
  }, [selectedStructureId, structures]);

  // Doors render last (topmost layer) so they always sit above every other
  // structure, extinguisher, and heat detector on the canvas.
  const doorStructures = structures.filter(isDoorStructure);
  const regularStructures = structures.filter((structure) => !isDoorStructure(structure));

  const renderStructure = (structure: Structure) => (
    <StructureShape
      key={structure.id}
      structure={structure}
      scale={scale}
      isSelected={structure.id === selectedStructureId}
      selectedPartitionId={
        structure.id === selectedStructureId ? selectedPartitionId : null
      }
      onSelect={onSelect}
      onSelectPartition={onSelectPartition}
      onResizePartition={onResizePartition}
      onChange={onChange}
      registerNode={registerNode}
    />
  );

  return (
    <div className="relative">
      <div className="absolute right-2 top-2 z-10 flex flex-col gap-1 rounded-md border border-gray-300 bg-white p-1 shadow-sm">
        <button
          type="button"
          onClick={() => handleZoomButton(1)}
          aria-label="확대"
          className="flex h-7 w-7 items-center justify-center rounded text-sm font-semibold text-gray-700 hover:bg-gray-100"
        >
          +
        </button>
        <button
          type="button"
          onClick={() => handleZoomButton(-1)}
          aria-label="축소"
          className="flex h-7 w-7 items-center justify-center rounded text-sm font-semibold text-gray-700 hover:bg-gray-100"
        >
          −
        </button>
        <button
          type="button"
          onClick={handleResetView}
          aria-label="확대/축소 초기화"
          className="flex h-7 w-7 items-center justify-center rounded text-[10px] font-medium text-gray-500 hover:bg-gray-100"
        >
          {Math.round(view.scale * 100)}%
        </button>
      </div>
      <Stage
        ref={stageRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        scaleX={view.scale}
        scaleY={view.scale}
        x={view.x}
        y={view.y}
        draggable
        onWheel={handleWheel}
        onDragEnd={handleStageDragEnd}
        className="rounded-md border border-gray-300 bg-white shadow-sm"
        onMouseDown={(e) => {
          if (e.target === e.target.getStage()) {
            onSelect(null);
            onSelectHeatDetector(null);
          }
        }}
      >
        <Layer>
          <Rect
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            fill={CANVAS_BACKGROUND_COLOR}
            listening={false}
          />
          {regularStructures.map(renderStructure)}
        {extinguisherPlacements.map((placement) => (
          <Group key={placement.id} x={placement.x} y={placement.y} listening={false}>
            <Circle radius={10} fill="#dc2626" stroke="#7f1d1d" strokeWidth={1} />
            <Text
              text="소"
              width={20}
              height={20}
              offsetX={10}
              offsetY={10}
              align="center"
              verticalAlign="middle"
              fontSize={10}
              fill="#ffffff"
            />
          </Group>
        ))}
        {heatDetectors.map((detector) => {
          const room = structures.find((s) => s.id === detector.roomId);
          const roomLabel =
            ROOM_TYPE_DEFAULTS[room?.roomType ?? DEFAULT_ROOM_TYPE].label;
          return (
            <HeatDetectorShape
              key={detector.id}
              detector={detector}
              roomLabel={roomLabel}
              isSelected={detector.id === selectedHeatDetectorId}
              onToggleSelect={onSelectHeatDetector}
            />
          );
        })}
        {doorStructures.map(renderStructure)}
        <Transformer
          ref={transformerRef}
          rotateEnabled={false}
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < 10 || newBox.height < 10) {
              return oldBox;
            }
            return newBox;
          }}
        />
        </Layer>
      </Stage>
    </div>
  );
}
