"use client";

import { Fragment, useCallback, useRef, useEffect } from "react";
import { Group, Line, Rect, Text } from "react-konva";
import type Konva from "konva";
import type { Structure } from "@/types/floorplan";
import { STRUCTURE_DEFAULTS } from "@/constants/structureDefaults";
import { ROOM_TYPE_DEFAULTS, DEFAULT_ROOM_TYPE } from "@/constants/roomTypes";
import { ENTRANCE_TYPE_DEFAULTS, DEFAULT_ENTRANCE_TYPE } from "@/constants/entranceTypes";
import { computeEffectivePixelArea } from "@/lib/partitionTree";
import { pixelAreaToSquareMeters, pixelLengthToMeters } from "@/lib/area";
import { getStructureLabel } from "@/lib/structureLabel";
import { snapRectPosition } from "@/lib/structureSnapping";
import PartitionShape from "./PartitionShape";
import EntranceSwingArc from "./EntranceSwingArc";

type StructureShapeProps = {
  structure: Structure;
  /** Every structure on the current floor (including this one), used to snap
   * this structure's edges/center to its neighbors' while dragging it. */
  allStructures: Structure[];
  scale: number;
  isSelected: boolean;
  suppressTooltip?: boolean;
  selectedPartitionId: string | null;
  onSelect: (id: string) => void;
  onSelectPartition: (structureId: string, leafId: string) => void;
  onResizePartition: (structureId: string, splitId: string, ratio: number) => void;
  onChange: (id: string, changes: Partial<Structure>) => void;
  registerNode: (id: string, node: Konva.Group | null) => void;
  /** True while the canvas is in draw-a-new-structure mode, so existing
   * structures don't intercept the mousedown that starts the drag rectangle. */
  interactionDisabled?: boolean;
  /** Only passed while 피난동선 표시 mode is on (see FloorPlanCanvas) — reports
   * this structure as the hover target so a route to the nearest exit can be
   * computed and drawn. */
  onHoverStructure?: (id: string) => void;
  onUnhoverStructure?: (id: string) => void;
  /** Only passed while 피난동선 표시 mode is on (see FloorPlanCanvas) — reports
   * the specific occupied partition under the pointer (structure.id + leaf
   * id), so a route can start from exactly that partition. Only meaningful
   * when structure.type === "room" and structure.partitions is set. */
  onHoverPartition?: (structureId: string, leafId: string) => void;
  onUnhoverPartition?: (structureId: string, leafId: string) => void;
  /** Only meaningful when structure.type === "stairs" — floors between the
   * current floor and 1F / the rooftop, shown in this stairs' tooltip. See
   * app/page.tsx for how these are derived. */
  floorsToGround: number;
  floorsToRoof: number;
  /** True while 피난동선 표시 mode is on (see FloorPlanCanvas) — the stairs'
   * floor-movement label is only relevant alongside the evacuation route, so
   * it's hidden the rest of the time. */
  evacuationRouteMode?: boolean;
};

// Staircase pictogram (ascending bottom-left to top-right, like a typical
// stairs icon) instead of plain horizontal tread stripes: a single zigzag
// line alternating a horizontal run then a vertical rise per step. Drawn
// small and centered (rather than filling the whole structure) and slightly
// translucent, so it reads as a subtle icon instead of dominating the shape.
function StairsIcon({ width, height }: { width: number; height: number }) {
  const ICON_SCALE = 0.45;
  const iconWidth = width * ICON_SCALE;
  const iconHeight = height * ICON_SCALE;

  const stepCount = 4;
  const stepWidth = iconWidth / stepCount;
  const stepHeight = iconHeight / stepCount;

  const points: number[] = [0, iconHeight];
  for (let i = 1; i <= stepCount; i++) {
    points.push(stepWidth * i, iconHeight - stepHeight * (i - 1));
    points.push(stepWidth * i, iconHeight - stepHeight * i);
  }

  return (
    <Line
      x={(width - iconWidth) / 2}
      y={(height - iconHeight) / 2}
      points={points}
      stroke="#111827"
      strokeWidth={3}
      opacity={0.5}
      lineJoin="miter"
      lineCap="square"
      listening={false}
    />
  );
}

export default function StructureShape({
  structure,
  allStructures,
  scale,
  isSelected,
  suppressTooltip,
  selectedPartitionId,
  onSelect,
  onSelectPartition,
  onResizePartition,
  onChange,
  registerNode,
  interactionDisabled,
  onHoverStructure,
  onUnhoverStructure,
  onHoverPartition,
  onUnhoverPartition,
  floorsToGround,
  floorsToRoof,
  evacuationRouteMode,
}: StructureShapeProps) {
  const contentRef = useRef<Konva.Group>(null);

  // Snaps this structure's edges/center to any other structure's while it's
  // being dragged, so moving it naturally lines rooms/corridors/etc. up.
  const handleDragBound = useCallback(
    function (this: Konva.Node, pos: { x: number; y: number }) {
      const stage = this.getStage();
      if (!stage) return pos;

      const absoluteTransform = stage.getAbsoluteTransform();
      const contentPos = absoluteTransform.copy().invert().point(pos);
      const others = allStructures
        .filter((s) => s.id !== structure.id)
        .map((s) => ({ x: s.x, y: s.y, width: s.width, height: s.height }));
      const snapped = snapRectPosition(
        { x: contentPos.x, y: contentPos.y, width: structure.width, height: structure.height },
        others
      );

      return absoluteTransform.point(snapped);
    },
    [allStructures, structure.id, structure.width, structure.height]
  );
  const defaults = STRUCTURE_DEFAULTS[structure.type];
  const isRoom = structure.type === "room";
  const isEntrance = structure.type === "entrance";
  const isObstacle = structure.type === "obstacle";
  const roomAppearance = isRoom
    ? ROOM_TYPE_DEFAULTS[structure.roomType ?? DEFAULT_ROOM_TYPE]
    : null;
  const entranceAppearance = isEntrance
    ? ENTRANCE_TYPE_DEFAULTS[structure.entranceType ?? DEFAULT_ENTRANCE_TYPE]
    : null;
  const typeAppearance = roomAppearance ?? entranceAppearance;
  const typeLabel = getStructureLabel(structure);
  const showTooltip = isSelected && !suppressTooltip;
  const widthM = pixelLengthToMeters(structure.width, scale);
  const heightM = pixelLengthToMeters(structure.height, scale);
  // Entrances (공동현관/비상구/문) are openings, not floor space, so they have no area to compute.
  const areaM2 = isEntrance
    ? null
    : pixelAreaToSquareMeters(computeEffectivePixelArea(structure), scale);

  const isStairs = structure.type === "stairs";
  const tooltipLines = [
    "구조물 정보",
    `종류: ${typeLabel}`,
    ...(areaM2 !== null ? [`면적: ${areaM2.toFixed(1)}m²`] : []),
    `가로: ${widthM.toFixed(1)}m`,
    `세로: ${heightM.toFixed(1)}m`,
  ];
  // 계단은 피난동선 표시 중에만 의미 있는 정보라, 그 모드가 켜져 있을 때만
  // 구조물 바로 아래에 별도 라벨로 표시한다 (아래 STAIRS_FLOOR_LABEL_HEIGHT 참고).
  const stairsFloorLabel =
    isStairs && evacuationRouteMode
      ? `▼ ${floorsToGround}층  ▲ ${floorsToRoof}층`
      : null;
  const STAIRS_FLOOR_LABEL_HEIGHT = 18;
  const TOOLTIP_WIDTH = 150;
  const TOOLTIP_LINE_HEIGHT = 11 * 1.5;
  const TOOLTIP_HEIGHT = tooltipLines.length * TOOLTIP_LINE_HEIGHT + 16;

  useEffect(() => {
    registerNode(structure.id, contentRef.current);
    return () => registerNode(structure.id, null);
  }, [structure.id, registerNode]);

  return (
    <Group
      x={structure.x}
      y={structure.y}
      rotation={structure.rotation ?? 0}
      draggable={!interactionDisabled}
      listening={!interactionDisabled}
      dragBoundFunc={handleDragBound}
      onClick={() => onSelect(structure.id)}
      onTap={() => onSelect(structure.id)}
      onMouseEnter={() => onHoverStructure?.(structure.id)}
      onMouseLeave={() => onUnhoverStructure?.(structure.id)}
      onDragEnd={(e) => {
        onChange(structure.id, { x: e.target.x(), y: e.target.y() });
      }}
    >
      {/* Only the resizable shape lives in this group, so the Transformer's
          selection box (registered via contentRef) bounds just the structure
          itself — not the tooltip rendered alongside it below. */}
      <Group
        ref={contentRef}
        onTransformEnd={() => {
          const node = contentRef.current;
          if (!node) return;

          const scaleX = node.scaleX();
          const scaleY = node.scaleY();
          const offsetX = node.x();
          const offsetY = node.y();
          node.scaleX(1);
          node.scaleY(1);
          node.x(0);
          node.y(0);

          onChange(structure.id, {
            x: structure.x + offsetX,
            y: structure.y + offsetY,
            width: Math.max(10, structure.width * scaleX),
            height: Math.max(10, structure.height * scaleY),
          });
        }}
      >
        <Rect
          width={structure.width}
          height={structure.height}
          // 장애물: a slightly translucent fill (rgba, so only the fill —
          // not the border — gets the transparency) and no border at all,
          // so it reads as a lighter obstruction marker rather than a room.
          fill={
            isObstacle ? "rgba(156, 163, 175, 0.7)" : (typeAppearance?.fill ?? defaults.fill)
          }
          stroke={isEntrance || isObstacle ? undefined : isSelected ? "#111827" : "#374151"}
          strokeWidth={isSelected ? 4 : 3}
        />
        {isEntrance && (
          // A door opening only reads as a wall break, not a boxed room —
          // draw just the two short (jamb) edges, along whichever axis is
          // shorter, and leave the long edges (the opening itself) borderless.
          <Fragment>
            {structure.width >= structure.height ? (
              <Fragment>
                <Line
                  points={[0, 0, 0, structure.height]}
                  stroke={isSelected ? "#111827" : "#374151"}
                  strokeWidth={isSelected ? 4 : 3}
                />
                <Line
                  points={[structure.width, 0, structure.width, structure.height]}
                  stroke={isSelected ? "#111827" : "#374151"}
                  strokeWidth={isSelected ? 4 : 3}
                />
              </Fragment>
            ) : (
              <Fragment>
                <Line
                  points={[0, 0, structure.width, 0]}
                  stroke={isSelected ? "#111827" : "#374151"}
                  strokeWidth={isSelected ? 4 : 3}
                />
                <Line
                  points={[0, structure.height, structure.width, structure.height]}
                  stroke={isSelected ? "#111827" : "#374151"}
                  strokeWidth={isSelected ? 4 : 3}
                />
              </Fragment>
            )}
          </Fragment>
        )}
        {structure.type === "stairs" && (
          <StairsIcon width={structure.width} height={structure.height} />
        )}
        {isRoom && structure.partitions && (
          <PartitionShape
            node={structure.partitions}
            box={{ x: 0, y: 0, width: structure.width, height: structure.height }}
            selectedLeafId={selectedPartitionId}
            onSelectLeaf={(leafId) => onSelectPartition(structure.id, leafId)}
            onResize={(splitId, ratio) =>
              onResizePartition(structure.id, splitId, ratio)
            }
            onHoverLeaf={
              onHoverPartition
                ? (leafId) => onHoverPartition(structure.id, leafId)
                : undefined
            }
            onUnhoverLeaf={
              onUnhoverPartition
                ? (leafId) => onUnhoverPartition(structure.id, leafId)
                : undefined
            }
          />
        )}
        {!isObstacle && !isEntrance && (
          <Text
            text={typeLabel}
            width={structure.width}
            height={structure.height}
            align="center"
            verticalAlign="middle"
            fontSize={13}
            fill="#111827"
            opacity={0.45}
            listening={false}
          />
        )}
      </Group>
      {isEntrance && structure.entranceSwingDirection && (
        // Sibling of contentRef (not a child of it) so the door-swing arc,
        // which sweeps well past the entrance's own rect, isn't folded into
        // the Transformer's selection/resize bounds.
        <EntranceSwingArc
          width={structure.width}
          height={structure.height}
          direction={structure.entranceSwingDirection}
        />
      )}
      {stairsFloorLabel && (
        // Sits centered just below the stairs rectangle, outside contentRef
        // (like the tooltip below) so it doesn't get folded into the
        // Transformer's selection bounds — shown whenever 피난동선 표시 mode is
        // on, not gated by isSelected, since it's safety info someone should
        // see at a glance, not only on click. Widened past the structure's
        // own width (stairs default to a narrow 110px) so the text isn't
        // cramped.
        <Group
          x={(structure.width - Math.max(structure.width, 140)) / 2}
          y={structure.height + 4}
          listening={false}
        >
          <Text
            text={stairsFloorLabel}
            width={Math.max(structure.width, 140)}
            height={STAIRS_FLOOR_LABEL_HEIGHT}
            align="center"
            verticalAlign="middle"
            fontSize={10}
            fontStyle="bold"
            fill="#111827"
          />
        </Group>
      )}
      {showTooltip && (
        // Anchored below-right of the room's top-left corner (rather than
        // above), mirroring HeatDetectorShape's tooltip so an upward
        // tooltip doesn't get clipped by the stage's top edge.
        <Group x={12} y={12} listening={false}>
          <Rect
            width={TOOLTIP_WIDTH}
            height={TOOLTIP_HEIGHT}
            fill="#111827"
            opacity={0.85}
            cornerRadius={4}
          />
          <Text
            text={tooltipLines.join("\n")}
            width={TOOLTIP_WIDTH}
            height={TOOLTIP_HEIGHT}
            padding={8}
            fontSize={11}
            lineHeight={1.5}
            fill="#ffffff"
          />
        </Group>
      )}
    </Group>
  );
}
