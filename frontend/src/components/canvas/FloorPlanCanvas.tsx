"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Circle, Group, Layer, Rect, Stage, Text, Transformer } from "react-konva";
import type Konva from "konva";
import type {
  EntranceType,
  ExtinguisherPlacement,
  HeatDetector,
  RoomType,
  SprinklerHead,
  Structure,
  StructureType,
} from "@/types/floorplan";
import type { ExitLight } from "@/types/exitLight";
import type { StructureRect } from "@/lib/structureFactory";
import type { StructureCategory } from "@/components/panels/StructureToolbar";
import { CANVAS_BACKGROUND_COLOR } from "@/constants/canvas";
import { STRUCTURE_DEFAULTS, STRUCTURE_TYPE_ORDER } from "@/constants/structureDefaults";
import { DEFAULT_ROOM_TYPE, ROOM_TYPE_DEFAULTS, ROOM_TYPE_ORDER } from "@/constants/roomTypes";
import { ENTRANCE_TYPE_DEFAULTS, ENTRANCE_TYPE_ORDER } from "@/constants/entranceTypes";
import { isDoorStructure } from "@/lib/structureArea";
import { getStructureLabel } from "@/lib/structureLabel";
import StructureShape from "./StructureShape";
import HeatDetectorShape from "./HeatDetectorShape";
import ExitLightShape from "./ExitLightShape";
import SprinklerHeadShape from "./SprinklerHeadShape";
import StructureTypeChoiceOverlay from "./StructureTypeChoiceOverlay";

const CANVAS_WIDTH = 900;
const CANVAS_HEIGHT = 600;
const MIN_ZOOM = 0.4;
const MAX_ZOOM = 3;
const ZOOM_STEP = 1.15;
// Below this drag distance (in content px), a click-without-drag falls back
// to a generic default size anchored at the click point (the specific type,
// and so its real default size, isn't chosen until after the choice overlay).
const MIN_DRAG_TO_DRAW = 6;

// "구조물 추가"의 용도 선택지: 방 계열은 RoomType까지 곧바로 세분화해서 보여주고
// (선택 즉시 room + 해당 roomType으로 생성), 복도/엘리베이터/계단은 구조물 종류
// 자체를 고른다. 출입구는 별도 버튼이라 여기서 제외.
const NON_ROOM_STRUCTURE_TYPES: StructureType[] = STRUCTURE_TYPE_ORDER.filter(
  (type) => type !== "entrance" && type !== "room"
);

type StructureCategoryChoice = {
  value: string;
  label: string;
  fill: string;
  stroke: string;
  structureType: StructureType;
  roomType?: RoomType;
};

const STRUCTURE_CATEGORY_CHOICES: StructureCategoryChoice[] = [
  ...ROOM_TYPE_ORDER.map((roomType) => ({
    value: roomType as string,
    label: ROOM_TYPE_DEFAULTS[roomType].label,
    fill: ROOM_TYPE_DEFAULTS[roomType].fill,
    stroke: ROOM_TYPE_DEFAULTS[roomType].stroke,
    structureType: "room" as StructureType,
    roomType,
  })),
  ...NON_ROOM_STRUCTURE_TYPES.map((type) => ({
    value: type as string,
    label: STRUCTURE_DEFAULTS[type].label,
    fill: STRUCTURE_DEFAULTS[type].fill,
    stroke: STRUCTURE_DEFAULTS[type].stroke,
    structureType: type,
  })),
];

const OVERLAY_WIDTH = 176;
const OVERLAY_MARGIN = 8;

type ViewTransform = { scale: number; x: number; y: number };

const INITIAL_VIEW: ViewTransform = { scale: 1, x: 0, y: 0 };

function clampZoom(value: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));
}

type FloorPlanCanvasProps = {
  structures: Structure[];
  scale: number;
  selectedStructureId: string | null;
  recentlyCreatedStructureId: string | null;
  selectedPartitionId: string | null;
  extinguisherPlacements: ExtinguisherPlacement[];
  heatDetectors: HeatDetector[];
  selectedHeatDetectorId: string | null;
  exitLights: ExitLight[];
  selectedExitLightId: string | null;
  sprinklerHeads: SprinklerHead[];
  selectedSprinklerHeadId: string | null;
  onSelect: (id: string | null) => void;
  onSelectPartition: (structureId: string, leafId: string) => void;
  onResizePartition: (structureId: string, splitId: string, ratio: number) => void;
  onSelectHeatDetector: (id: string | null) => void;
  onSelectExitLight: (id: string | null) => void;
  onSelectSprinklerHead: (id: string | null) => void;
  onChange: (id: string, changes: Partial<Structure>) => void;
  /** Non-null while "구조물 추가"/"출입구 추가" is armed: the canvas switches
   * from pan/select to draw-a-rectangle mode for this category. */
  pendingCategory: StructureCategory | null;
  onConfirmStructure: (
    rect: StructureRect,
    type: StructureType,
    roomType?: RoomType,
    entranceType?: EntranceType
  ) => void;
  onCancelPendingStructure: () => void;
};

export default function FloorPlanCanvas({
  structures,
  scale,
  selectedStructureId,
  recentlyCreatedStructureId,
  selectedPartitionId,
  extinguisherPlacements,
  heatDetectors,
  selectedHeatDetectorId,
  exitLights,
  selectedExitLightId,
  sprinklerHeads,
  selectedSprinklerHeadId,
  onSelect,
  onSelectPartition,
  onResizePartition,
  onSelectHeatDetector,
  onSelectExitLight,
  onSelectSprinklerHead,
  onChange,
  pendingCategory,
  onConfirmStructure,
  onCancelPendingStructure,
}: FloorPlanCanvasProps) {
  const transformerRef = useRef<Konva.Transformer>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const nodesRef = useRef<Map<string, Konva.Group>>(new Map());
  const [view, setView] = useState<ViewTransform>(INITIAL_VIEW);
  const drawStartRef = useRef<{ x: number; y: number } | null>(null);
  const [drawRect, setDrawRect] = useState<StructureRect | null>(null);
  // True once mouseup finalizes the dragged rect: the rect stops updating
  // and the "용도 선택" overlay takes over until the user picks a type (or cancels).
  const [awaitingChoice, setAwaitingChoice] = useState(false);

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

  // Same formula as zoomAtPoint's contentPoint: undoes the stage's
  // scale/translate so a pointer position lands in structure (x/y) space.
  const toContentPoint = useCallback(
    (point: { x: number; y: number }) => ({
      x: (point.x - view.x) / view.scale,
      y: (point.y - view.y) / view.scale,
    }),
    [view]
  );

  const handleDrawMouseDown = useCallback(() => {
    if (awaitingChoice) return;
    const pointer = stageRef.current?.getPointerPosition();
    if (!pointer) return;
    const point = toContentPoint(pointer);
    drawStartRef.current = point;
    setDrawRect({ x: point.x, y: point.y, width: 0, height: 0 });
  }, [awaitingChoice, toContentPoint]);

  const handleDrawMouseMove = useCallback(() => {
    if (awaitingChoice) return;
    const start = drawStartRef.current;
    if (!start) return;
    const pointer = stageRef.current?.getPointerPosition();
    if (!pointer) return;
    const point = toContentPoint(pointer);
    setDrawRect({
      x: Math.min(start.x, point.x),
      y: Math.min(start.y, point.y),
      width: Math.abs(point.x - start.x),
      height: Math.abs(point.y - start.y),
    });
  }, [awaitingChoice, toContentPoint]);

  const handleDrawMouseUp = useCallback(() => {
    if (awaitingChoice) return;
    const start = drawStartRef.current;
    const rect = drawRect;
    drawStartRef.current = null;
    if (!start || !rect || !pendingCategory) {
      setDrawRect(null);
      return;
    }

    if (rect.width < MIN_DRAG_TO_DRAW && rect.height < MIN_DRAG_TO_DRAW) {
      // Plain click, no meaningful drag: fall back to a generic default size
      // anchored at the click point (the exact type isn't known until the
      // choice overlay below is answered).
      const defaults =
        pendingCategory === "entrance" ? STRUCTURE_DEFAULTS.entrance : STRUCTURE_DEFAULTS.room;
      setDrawRect({ x: start.x, y: start.y, width: defaults.width, height: defaults.height });
    }
    setAwaitingChoice(true);
  }, [awaitingChoice, drawRect, pendingCategory]);

  const handleChooseType = useCallback(
    (value: string) => {
      if (!drawRect) return;
      if (pendingCategory === "entrance") {
        onConfirmStructure(drawRect, "entrance", undefined, value as EntranceType);
      } else {
        const choice = STRUCTURE_CATEGORY_CHOICES.find((option) => option.value === value);
        if (!choice) return;
        onConfirmStructure(drawRect, choice.structureType, choice.roomType);
      }
      drawStartRef.current = null;
      setDrawRect(null);
      setAwaitingChoice(false);
    },
    [drawRect, pendingCategory, onConfirmStructure]
  );

  const handleCancelDraw = useCallback(() => {
    drawStartRef.current = null;
    setDrawRect(null);
    setAwaitingChoice(false);
    onCancelPendingStructure();
  }, [onCancelPendingStructure]);

  // Fallback for a mouseup that lands outside the canvas (Konva's own
  // mouseup prop only fires while the pointer is over the stage container).
  // Stops listening once awaitingChoice flips on, so a click on the choice
  // overlay's own buttons (also a mouseup) doesn't re-trigger this.
  useEffect(() => {
    if (!drawRect || awaitingChoice) return;
    window.addEventListener("mouseup", handleDrawMouseUp);
    return () => window.removeEventListener("mouseup", handleDrawMouseUp);
  }, [drawRect, awaitingChoice, handleDrawMouseUp]);

  useEffect(() => {
    if (!pendingCategory) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleCancelDraw();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [pendingCategory, handleCancelDraw]);

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

  // Doors render after every other structure (topmost among structures) so
  // they always stay visible where they overlap a room/corridor; markers
  // (extinguishers/detectors/exit lights) still render above doors too.
  const doorStructures = structures.filter(isDoorStructure);
  const regularStructures = structures.filter((structure) => !isDoorStructure(structure));

  const renderStructure = (structure: Structure) => (
    <StructureShape
      key={structure.id}
      structure={structure}
      scale={scale}
      isSelected={structure.id === selectedStructureId}
      suppressTooltip={structure.id === recentlyCreatedStructureId}
      selectedPartitionId={
        structure.id === selectedStructureId ? selectedPartitionId : null
      }
      onSelect={onSelect}
      onSelectPartition={onSelectPartition}
      onResizePartition={onResizePartition}
      onChange={onChange}
      registerNode={registerNode}
      interactionDisabled={!!pendingCategory}
    />
  );

  const choiceOptions = !pendingCategory
    ? []
    : pendingCategory === "entrance"
      ? ENTRANCE_TYPE_ORDER.map((type) => ({
          value: type as string,
          label: ENTRANCE_TYPE_DEFAULTS[type].label,
          fill: ENTRANCE_TYPE_DEFAULTS[type].fill,
          stroke: ENTRANCE_TYPE_DEFAULTS[type].stroke,
        }))
      : STRUCTURE_CATEGORY_CHOICES;

  const overlayScreenRect = drawRect
    ? {
        x: drawRect.x * view.scale + view.x,
        y: drawRect.y * view.scale + view.y,
        width: drawRect.width * view.scale,
        height: drawRect.height * view.scale,
      }
    : null;
  const overlayHeight = 44 + choiceOptions.length * 34;
  const overlayLeft = overlayScreenRect
    ? Math.min(
        Math.max(overlayScreenRect.x + overlayScreenRect.width + OVERLAY_MARGIN, OVERLAY_MARGIN),
        CANVAS_WIDTH - OVERLAY_WIDTH - OVERLAY_MARGIN
      )
    : 0;
  const overlayTop = overlayScreenRect
    ? Math.min(
        Math.max(overlayScreenRect.y, OVERLAY_MARGIN),
        CANVAS_HEIGHT - overlayHeight - OVERLAY_MARGIN
      )
    : 0;

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
        draggable={!pendingCategory}
        onWheel={handleWheel}
        onDragEnd={handleStageDragEnd}
        className="rounded-md border border-gray-300 bg-white shadow-sm"
        style={pendingCategory ? { cursor: "crosshair" } : undefined}
        onMouseDown={(e) => {
          if (pendingCategory) {
            handleDrawMouseDown();
            return;
          }
          if (e.target === e.target.getStage()) {
            onSelect(null);
            onSelectHeatDetector(null);
            onSelectExitLight(null);
            onSelectSprinklerHead(null);
          }
        }}
        onMouseMove={pendingCategory ? handleDrawMouseMove : undefined}
      >
        <Layer>
          <Rect
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            fill={CANVAS_BACKGROUND_COLOR}
            listening={false}
          />
          {regularStructures.map(renderStructure)}
        {doorStructures.map(renderStructure)}
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
        {exitLights.map((light) => {
          const owner = structures.find((s) => s.id === light.structureId);
          const structureLabel = owner ? getStructureLabel(owner) : "구조물";
          return (
            <ExitLightShape
              key={light.id}
              light={light}
              structureLabel={structureLabel}
              isSelected={light.id === selectedExitLightId}
              onToggleSelect={onSelectExitLight}
            />
          );
        })}
        {sprinklerHeads.map((head) => (
          <SprinklerHeadShape
            key={head.id}
            head={head}
            isSelected={head.id === selectedSprinklerHeadId}
            onToggleSelect={onSelectSprinklerHead}
          />
        ))}
        {drawRect && (
          <Rect
            x={drawRect.x}
            y={drawRect.y}
            width={drawRect.width}
            height={drawRect.height}
            fill="#2563eb"
            opacity={0.15}
            stroke="#2563eb"
            strokeWidth={awaitingChoice ? 2 : 1}
            dash={awaitingChoice ? undefined : [6, 4]}
            listening={false}
          />
        )}
        <Transformer
          ref={transformerRef}
          rotateEnabled={false}
          keepRatio={false}
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < 10 || newBox.height < 10) {
              return oldBox;
            }
            return newBox;
          }}
        />
        </Layer>
      </Stage>
      {awaitingChoice && (
        <StructureTypeChoiceOverlay
          left={overlayLeft}
          top={overlayTop}
          options={choiceOptions}
          onChoose={handleChooseType}
          onCancel={handleCancelDraw}
        />
      )}
    </div>
  );
}
