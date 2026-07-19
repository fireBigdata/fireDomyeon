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
};

function StairsLines({ width, height }: { width: number; height: number }) {
  const stepCount = 5;
  const stepHeight = height / stepCount;

  return (
    <Fragment>
      {Array.from({ length: stepCount - 1 }, (_, index) => {
        const y = stepHeight * (index + 1);
        return (
          <Line
            key={y}
            points={[0, y, width, y]}
            stroke="#dc2626"
            strokeWidth={1}
          />
        );
      })}
    </Fragment>
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

  const tooltipLines = [
    "구조물 정보",
    `종류: ${typeLabel}`,
    ...(areaM2 !== null ? [`면적: ${areaM2.toFixed(1)}m²`] : []),
    `가로: ${widthM.toFixed(1)}m`,
    `세로: ${heightM.toFixed(1)}m`,
  ];
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
          fill={typeAppearance?.fill ?? defaults.fill}
          stroke={isSelected ? "#111827" : typeAppearance?.stroke ?? defaults.stroke}
          strokeWidth={isSelected ? 2 : 1}
        />
        {structure.type === "stairs" && (
          <StairsLines width={structure.width} height={structure.height} />
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
          />
        )}
        <Text
          text={typeLabel}
          width={structure.width}
          height={structure.height}
          align="center"
          verticalAlign="middle"
          fontSize={13}
          fill="#111827"
          listening={false}
        />
      </Group>
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
