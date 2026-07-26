"use client";

import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Circle, Group, Layer, Line, Rect, Stage, Text, Transformer } from "react-konva";
import type Konva from "konva";
import { EntranceType } from "@/types/floorplan";
import type {
  ExtinguisherPlacement,
  HeatDetector,
  RoomType,
  SprinklerHead,
  Structure,
  StructureType,
} from "@/types/floorplan";
import type { ExitLight } from "@/types/exitLight";
import type { SmokeDetector } from "@/types/smokeDetector";
import type { HydrantPlacement } from "@/types/hydrant";
import type { StructureRect } from "@/lib/structureFactory";
import type { StructureCategory } from "@/components/panels/StructureToolbar";
import { CANVAS_BACKGROUND_COLOR, CANVAS_WIDTH_PX, CANVAS_HEIGHT_PX } from "@/constants/canvas";
import { metersToPixelLength, pixelLengthToMeters } from "@/lib/area";
import { findEvacuationRoutes, structureRouteAnchorForLeaf } from "@/lib/evacuationRoute";
import { STRUCTURE_DEFAULTS, STRUCTURE_TYPE_ORDER } from "@/constants/structureDefaults";
import { DEFAULT_ROOM_TYPE, ROOM_TYPE_DEFAULTS, ROOM_TYPE_ORDER } from "@/constants/roomTypes";
import { ENTRANCE_TYPE_DEFAULTS, ENTRANCE_TYPE_ORDER } from "@/constants/entranceTypes";
import { isDoorStructure } from "@/lib/structureArea";
import { getStructureLabel } from "@/lib/structureLabel";
import { snapPointToTargets } from "@/lib/structureSnapping";
import { detectEntranceOrientation, getEntrancePreviewRect } from "@/lib/entrancePlacement";
import StructureShape from "./StructureShape";
import HeatDetectorShape from "./HeatDetectorShape";
import ExitLightShape from "./ExitLightShape";
import SmokeDetectorShape from "./SmokeDetectorShape";
import SprinklerHeadShape from "./SprinklerHeadShape";
import HydrantShape from "./HydrantShape";
import StructureTypeChoiceOverlay from "./StructureTypeChoiceOverlay";

const CANVAS_WIDTH = CANVAS_WIDTH_PX;
const CANVAS_HEIGHT = CANVAS_HEIGHT_PX;
const MIN_ZOOM = 0.4;
const MAX_ZOOM = 3;
const ZOOM_STEP = 1.15;
// Below this drag distance (in content px), a click-without-drag falls back
// to a generic default size anchored at the click point (the specific type,
// and so its real default size, isn't chosen until after the choice overlay).
const MIN_DRAG_TO_DRAW = 6;

// 피난동선: cycled through when 2+ exits are reachable, so each route/exit
// marker is visually distinguishable.
const EVACUATION_ROUTE_COLORS = ["#16a34a", "#0ea5e9", "#f59e0b", "#8b5cf6", "#ec4899"];

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

// Radial "용도 선택" menu: each option is a circle arranged around the
// cursor position where the drag finished.
const RADIAL_MENU_RADIUS = 82;
const RADIAL_OPTION_SIZE = 60;

type ViewTransform = { scale: number; x: number; y: number };

const INITIAL_VIEW: ViewTransform = { scale: 1, x: 0, y: 0 };

function clampZoom(value: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));
}

type FloorPlanCanvasProps = {
  structures: Structure[];
  scale: number;
  /** Real-world site 가로/세로 (meters), from InitialSetupModal. Undefined =
   * not configured yet — the gray site-boundary rect fills the whole canvas. */
  siteWidthM?: number;
  siteHeightM?: number;
  /** True while 피난동선 표시 (evacuation route display) is toggled on —
   * hovering a structure then draws its shortest route to the nearest
   * 공동현관/비상구 (see lib/evacuationRoute.ts). */
  evacuationRouteMode: boolean;
  /** True when the current floor is 1F — 공동현관(COMMON) is the building's
   * main entrance and physically only exists on the ground floor, so only 1F
   * routes there; every other floor routes to 비상구(EMERGENCY) instead. */
  isGroundFloor: boolean;
  /** Floors between the current floor and 1F, and between the current floor
   * and the rooftop — shown on 계단(stairs) structures' tooltip. See
   * app/page.tsx for how these are derived from state.floors/groundMarkerIndex. */
  floorsToGround: number;
  floorsToRoof: number;
  selectedStructureId: string | null;
  recentlyCreatedStructureId: string | null;
  selectedPartitionId: string | null;
  extinguisherPlacements: ExtinguisherPlacement[];
  heatDetectors: HeatDetector[];
  selectedHeatDetectorId: string | null;
  exitLights: ExitLight[];
  selectedExitLightId: string | null;
  smokeDetectors: SmokeDetector[];
  selectedSmokeDetectorId: string | null;
  sprinklerHeads: SprinklerHead[];
  selectedSprinklerHeadId: string | null;
  hydrantPlacements: HydrantPlacement[];
  selectedHydrantId: string | null;
  onSelect: (id: string | null) => void;
  onSelectPartition: (structureId: string, leafId: string) => void;
  onResizePartition: (structureId: string, splitId: string, ratio: number) => void;
  onSelectHeatDetector: (id: string | null) => void;
  onSelectExitLight: (id: string | null) => void;
  onSelectSmokeDetector: (id: string | null) => void;
  onSelectSprinklerHead: (id: string | null) => void;
  onSelectHydrant: (id: string | null) => void;
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
  siteWidthM,
  siteHeightM,
  evacuationRouteMode,
  isGroundFloor,
  floorsToGround,
  floorsToRoof,
  selectedStructureId,
  recentlyCreatedStructureId,
  selectedPartitionId,
  extinguisherPlacements,
  heatDetectors,
  selectedHeatDetectorId,
  exitLights,
  selectedExitLightId,
  smokeDetectors,
  selectedSmokeDetectorId,
  sprinklerHeads,
  selectedSprinklerHeadId,
  hydrantPlacements,
  selectedHydrantId,
  onSelect,
  onSelectPartition,
  onResizePartition,
  onSelectHeatDetector,
  onSelectExitLight,
  onSelectSmokeDetector,
  onSelectSprinklerHead,
  onSelectHydrant,
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
  // The pointer's own content-space position, kept up to date through the
  // drag so the choice overlay can center on wherever the cursor actually
  // was at mouseup, not on the drawn rectangle's corner.
  const lastPointerContentRef = useRef<{ x: number; y: number } | null>(null);
  const [drawRect, setDrawRect] = useState<StructureRect | null>(null);
  // True once mouseup finalizes the dragged rect: the rect stops updating
  // and the "용도 선택" overlay takes over until the user picks a type (or cancels).
  const [awaitingChoice, setAwaitingChoice] = useState(false);
  // Cursor content-space position captured right as the structure finished
  // being drawn — the choice overlay is centered here.
  const [choiceCenter, setChoiceCenter] = useState<{ x: number; y: number } | null>(null);

  const registerNode = useCallback((id: string, node: Konva.Group | null) => {
    if (node) {
      nodesRef.current.set(id, node);
    } else {
      nodesRef.current.delete(id);
    }
  }, []);

  // 피난동선 표시: which structure the pointer is currently over. Only wired
  // up (via renderStructure below) while evacuationRouteMode is on.
  const [hoveredStructureId, setHoveredStructureId] = useState<string | null>(null);
  const handleHoverStructure = useCallback((id: string) => {
    setHoveredStructureId(id);
  }, []);
  // Guards against an out-of-order leave-after-enter (moving straight from
  // structure A to overlapping structure B can fire B's enter before A's
  // leave) clobbering the newer hover with null.
  const handleUnhoverStructure = useCallback((id: string) => {
    setHoveredStructureId((prev) => (prev === id ? null : prev));
  }, []);
  // Which occupied partition (leaf id) of the hovered structure the pointer
  // is specifically over, so the route starts exactly there instead of every
  // occupied partition at once. null while hovering an undivided structure,
  // a deleted/empty partition, or nothing at all.
  const [hoveredPartitionId, setHoveredPartitionId] = useState<string | null>(null);
  const handleHoverPartition = useCallback((_structureId: string, leafId: string) => {
    setHoveredPartitionId(leafId);
  }, []);
  const handleUnhoverPartition = useCallback((_structureId: string, leafId: string) => {
    setHoveredPartitionId((prev) => (prev === leafId ? null : prev));
  }, []);
  // 1F routes to 공동현관(COMMON) only — it's the building's main entrance
  // and only physically exists on the ground floor; every other floor routes
  // to 비상구(EMERGENCY) instead. See findEvacuationRoutes' allowedExitTypes.
  const allowedExitTypes = useMemo(
    () => [isGroundFloor ? EntranceType.COMMON : EntranceType.EMERGENCY],
    [isGroundFloor]
  );
  // Every reachable exit's route, not just the nearest — when 2+ exits exist
  // (e.g. two 비상구), all of them get drawn.
  const evacuationRoutes = useMemo(
    () =>
      evacuationRouteMode && hoveredStructureId
        ? findEvacuationRoutes(
            structures,
            hoveredStructureId,
            allowedExitTypes,
            hoveredPartitionId
          )
        : [],
    [evacuationRouteMode, hoveredStructureId, hoveredPartitionId, structures, allowedExitTypes]
  );
  // No route to any allowed exit exists from the hovered structure — shown
  // as a warning marker instead of silently drawing nothing.
  const showNoRouteWarning =
    evacuationRouteMode && hoveredStructureId !== null && evacuationRoutes.length === 0;
  const hoveredStructure = useMemo(
    () =>
      showNoRouteWarning
        ? (structures.find((s) => s.id === hoveredStructureId) ?? null)
        : null,
    [showNoRouteWarning, structures, hoveredStructureId]
  );

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
    const rawPoint = toContentPoint(pointer);
    const point = snapPointToTargets(rawPoint, structures);
    drawStartRef.current = point;
    lastPointerContentRef.current = point;
    setDrawRect({ x: point.x, y: point.y, width: 0, height: 0 });
  }, [awaitingChoice, toContentPoint, structures]);

  const handleDrawMouseMove = useCallback(() => {
    if (awaitingChoice) return;
    const start = drawStartRef.current;
    if (!start) return;
    const pointer = stageRef.current?.getPointerPosition();
    if (!pointer) return;
    const rawPoint = toContentPoint(pointer);
    // Snaps the growing corner to any existing structure's edge/center, so a
    // newly drawn structure naturally lines up with its neighbors.
    const point = snapPointToTargets(rawPoint, structures);
    lastPointerContentRef.current = point;
    setDrawRect({
      x: Math.min(start.x, point.x),
      y: Math.min(start.y, point.y),
      width: Math.abs(point.x - start.x),
      height: Math.abs(point.y - start.y),
    });
  }, [awaitingChoice, toContentPoint, structures]);

  const handleDrawMouseUp = useCallback(() => {
    if (awaitingChoice) return;
    const start = drawStartRef.current;
    const rect = drawRect;
    const cursorPoint = lastPointerContentRef.current;
    drawStartRef.current = null;
    if (!start || !rect || pendingCategory !== "structure") {
      setDrawRect(null);
      return;
    }

    if (rect.width < MIN_DRAG_TO_DRAW && rect.height < MIN_DRAG_TO_DRAW) {
      // Plain click, no meaningful drag: fall back to a generic default size
      // anchored at the click point (the exact type isn't known until the
      // choice overlay below is answered).
      const defaults = STRUCTURE_DEFAULTS.room;
      setDrawRect({ x: start.x, y: start.y, width: defaults.width, height: defaults.height });
    }
    setChoiceCenter(cursorPoint ?? start);
    setAwaitingChoice(true);
  }, [awaitingChoice, drawRect, pendingCategory]);

  // 출입구는 드래그로 크기를 정하지 않고, 고정 크기(STRUCTURE_DEFAULTS.entrance)의
  // 미리보기가 마우스를 따라다니다가 겹치는 구조물의 벽(가장 가까운 변)에 맞춰
  // 자동으로 가로/세로 방향을 바꾼다. 클릭하면 그 자리에서 바로 용도 선택으로 넘어간다.
  const handleEntranceMouseMove = useCallback(() => {
    if (awaitingChoice) return;
    const pointer = stageRef.current?.getPointerPosition();
    if (!pointer) return;
    const point = toContentPoint(pointer);
    lastPointerContentRef.current = point;
    const orientation = detectEntranceOrientation(point, structures);
    setDrawRect(getEntrancePreviewRect(point, orientation));
  }, [awaitingChoice, toContentPoint, structures]);

  const handleEntranceClick = useCallback(() => {
    if (awaitingChoice) return;
    const pointer = stageRef.current?.getPointerPosition();
    if (!pointer) return;
    const point = toContentPoint(pointer);
    const orientation = detectEntranceOrientation(point, structures);
    setDrawRect(getEntrancePreviewRect(point, orientation));
    setChoiceCenter(point);
    setAwaitingChoice(true);
  }, [awaitingChoice, toContentPoint, structures]);

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
      setChoiceCenter(null);
    },
    [drawRect, pendingCategory, onConfirmStructure]
  );

  const handleCancelDraw = useCallback(() => {
    drawStartRef.current = null;
    setDrawRect(null);
    setAwaitingChoice(false);
    setChoiceCenter(null);
    onCancelPendingStructure();
  }, [onCancelPendingStructure]);

  // Snaps whichever corner/edge handle is being dragged so the resized
  // structure's edge naturally lines up with a neighboring structure.
  const handleAnchorDragBound = useCallback(
    (_oldPos: { x: number; y: number }, newPos: { x: number; y: number }) => {
      const stage = transformerRef.current?.getStage();
      if (!stage || !selectedStructureId) return newPos;

      const absoluteTransform = stage.getAbsoluteTransform();
      const contentPoint = absoluteTransform.copy().invert().point(newPos);
      const others = structures
        .filter((s) => s.id !== selectedStructureId)
        .map((s) => ({ x: s.x, y: s.y, width: s.width, height: s.height }));
      const snapped = snapPointToTargets(contentPoint, others);

      return absoluteTransform.point(snapped);
    },
    [structures, selectedStructureId]
  );

  // Fallback for a mouseup that lands outside the canvas (Konva's own
  // mouseup prop only fires while the pointer is over the stage container).
  // Stops listening once awaitingChoice flips on, so a click on the choice
  // overlay's own buttons (also a mouseup) doesn't re-trigger this. Only
  // relevant to "structure" (drag-to-draw); 출입구 has no drag phase.
  useEffect(() => {
    if (!drawRect || awaitingChoice || pendingCategory !== "structure") return;
    window.addEventListener("mouseup", handleDrawMouseUp);
    return () => window.removeEventListener("mouseup", handleDrawMouseUp);
  }, [drawRect, awaitingChoice, pendingCategory, handleDrawMouseUp]);

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
      allStructures={structures}
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
      onHoverStructure={evacuationRouteMode ? handleHoverStructure : undefined}
      onUnhoverStructure={evacuationRouteMode ? handleUnhoverStructure : undefined}
      onHoverPartition={evacuationRouteMode ? handleHoverPartition : undefined}
      onUnhoverPartition={evacuationRouteMode ? handleUnhoverPartition : undefined}
      floorsToGround={floorsToGround}
      floorsToRoof={floorsToRoof}
      evacuationRouteMode={evacuationRouteMode}
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

  // Screen-space center for the radial choice menu, clamped so the ring of
  // option circles around it stays fully inside the canvas.
  const choiceCenterScreen = choiceCenter
    ? {
        x: choiceCenter.x * view.scale + view.x,
        y: choiceCenter.y * view.scale + view.y,
      }
    : null;
  const choiceMenuMargin = RADIAL_MENU_RADIUS + RADIAL_OPTION_SIZE / 2 + 4;
  const choiceCenterX = choiceCenterScreen
    ? Math.min(
        Math.max(choiceCenterScreen.x, choiceMenuMargin),
        CANVAS_WIDTH - choiceMenuMargin
      )
    : 0;
  const choiceCenterY = choiceCenterScreen
    ? Math.min(
        Math.max(choiceCenterScreen.y, choiceMenuMargin),
        CANVAS_HEIGHT - choiceMenuMargin
      )
    : 0;

  // Gray site-boundary rect: sized to the real 가로/세로 (via `scale`, which
  // InitialSetupModal derives so this always fits the canvas undistorted),
  // centered in the fixed-size Stage. Falls back to filling the whole canvas
  // when the site hasn't been configured yet.
  const siteRectWidth =
    siteWidthM !== undefined ? metersToPixelLength(siteWidthM, scale) : CANVAS_WIDTH;
  const siteRectHeight =
    siteHeightM !== undefined ? metersToPixelLength(siteHeightM, scale) : CANVAS_HEIGHT;
  const siteRectX = (CANVAS_WIDTH - siteRectWidth) / 2;
  const siteRectY = (CANVAS_HEIGHT - siteRectHeight) / 2;

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
          if (pendingCategory === "entrance") {
            handleEntranceClick();
            return;
          }
          if (pendingCategory === "structure") {
            handleDrawMouseDown();
            return;
          }
          if (e.target === e.target.getStage()) {
            onSelect(null);
            onSelectHeatDetector(null);
            onSelectExitLight(null);
            onSelectSmokeDetector(null);
            onSelectSprinklerHead(null);
            onSelectHydrant(null);
          }
        }}
        onMouseMove={
          pendingCategory === "entrance"
            ? handleEntranceMouseMove
            : pendingCategory === "structure"
              ? handleDrawMouseMove
              : undefined
        }
      >
        <Layer>
          <Rect
            x={siteRectX}
            y={siteRectY}
            width={siteRectWidth}
            height={siteRectHeight}
            fill={CANVAS_BACKGROUND_COLOR}
            stroke="#9ca3af"
            strokeWidth={1}
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
        {smokeDetectors.map((detector) => {
          const owner = structures.find((s) => s.id === detector.structureId);
          const structureLabel = owner ? getStructureLabel(owner) : "구조물";
          return (
            <SmokeDetectorShape
              key={detector.id}
              detector={detector}
              structureLabel={structureLabel}
              isSelected={detector.id === selectedSmokeDetectorId}
              onToggleSelect={onSelectSmokeDetector}
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
        {hydrantPlacements.map((hydrant) => {
          const owner = structures.find((s) => s.id === hydrant.structureId);
          const structureLabel = owner ? getStructureLabel(owner) : "구조물";
          return (
            <HydrantShape
              key={hydrant.id}
              hydrant={hydrant}
              structureLabel={structureLabel}
              isSelected={hydrant.id === selectedHydrantId}
              onToggleSelect={onSelectHydrant}
            />
          );
        })}
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
        {evacuationRoutes.map((route, index) => {
          if (route.points.length < 2) return null;
          const routeColor = EVACUATION_ROUTE_COLORS[index % EVACUATION_ROUTE_COLORS.length];
          const start = route.points[0];
          const exit = route.points[route.points.length - 1];
          return (
            <Fragment key={route.exitStructureId}>
              <Line
                points={route.points.flatMap((p) => [p.x, p.y])}
                stroke={routeColor}
                strokeWidth={3}
                dash={[10, 6]}
                lineCap="round"
                lineJoin="round"
                listening={false}
              />
              <Circle x={start.x} y={start.y} radius={6} fill={routeColor} listening={false} />
              <Group x={exit.x} y={exit.y} listening={false}>
                <Circle radius={9} fill={routeColor} stroke="#111827" strokeWidth={1} />
                <Text
                  text="출"
                  width={18}
                  height={18}
                  offsetX={9}
                  offsetY={9}
                  align="center"
                  verticalAlign="middle"
                  fontSize={10}
                  fill="#ffffff"
                />
              </Group>
              <Group x={exit.x + 12} y={exit.y - 10} listening={false}>
                <Rect width={64} height={20} fill="#111827" opacity={0.85} cornerRadius={4} />
                <Text
                  text={`${pixelLengthToMeters(route.totalDistancePx, scale).toFixed(1)}m`}
                  width={64}
                  height={20}
                  align="center"
                  verticalAlign="middle"
                  fontSize={11}
                  fill="#ffffff"
                />
              </Group>
            </Fragment>
          );
        })}
        {hoveredStructure && (
          // Anchored at the specific partition the pointer is over (same
          // anchor a route would have started from), falling back to the
          // structure's first occupied partition when hovering an undivided
          // structure or a deleted/empty region.
          <Group
            {...structureRouteAnchorForLeaf(hoveredStructure, hoveredPartitionId)}
            listening={false}
          >
            <Circle radius={12} fill="#dc2626" stroke="#7f1d1d" strokeWidth={1} />
            <Text
              text="!"
              width={24}
              height={24}
              offsetX={12}
              offsetY={12}
              align="center"
              verticalAlign="middle"
              fontSize={16}
              fontStyle="bold"
              fill="#ffffff"
            />
            <Group x={18} y={-10} listening={false}>
              <Rect width={112} height={20} fill="#7f1d1d" opacity={0.9} cornerRadius={4} />
              <Text
                text="대피 경로 없음"
                width={112}
                height={20}
                align="center"
                verticalAlign="middle"
                fontSize={11}
                fill="#ffffff"
              />
            </Group>
          </Group>
        )}
        <Transformer
          ref={transformerRef}
          rotateEnabled={false}
          keepRatio={false}
          anchorDragBoundFunc={handleAnchorDragBound}
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
          centerX={choiceCenterX}
          centerY={choiceCenterY}
          radius={RADIAL_MENU_RADIUS}
          optionSize={RADIAL_OPTION_SIZE}
          options={choiceOptions}
          onChoose={handleChooseType}
          onCancel={handleCancelDraw}
        />
      )}
    </div>
  );
}
