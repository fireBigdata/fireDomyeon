"use client";

import { Fragment, useRef, useEffect } from "react";
import { Group, Line, Rect, Text } from "react-konva";
import type Konva from "konva";
import type { Structure } from "@/types/floorplan";
import { STRUCTURE_DEFAULTS } from "@/constants/structureDefaults";
import { ROOM_TYPE_DEFAULTS, DEFAULT_ROOM_TYPE } from "@/constants/roomTypes";
import { ENTRANCE_TYPE_DEFAULTS, DEFAULT_ENTRANCE_TYPE } from "@/constants/entranceTypes";
import { computeEffectivePixelArea } from "@/lib/partitionTree";
import { pixelAreaToSquareMeters, pixelLengthToMeters } from "@/lib/area";
import PartitionShape from "./PartitionShape";

type StructureShapeProps = {
  structure: Structure;
  scale: number;
  isSelected: boolean;
  selectedPartitionId: string | null;
  onSelect: (id: string) => void;
  onSelectPartition: (structureId: string, leafId: string) => void;
  onResizePartition: (structureId: string, splitId: string, ratio: number) => void;
  onChange: (id: string, changes: Partial<Structure>) => void;
  registerNode: (id: string, node: Konva.Group | null) => void;
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
  scale,
  isSelected,
  selectedPartitionId,
  onSelect,
  onSelectPartition,
  onResizePartition,
  onChange,
  registerNode,
}: StructureShapeProps) {
  const groupRef = useRef<Konva.Group>(null);
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
  const typeLabel = typeAppearance?.label ?? defaults.label;
  const widthM = pixelLengthToMeters(structure.width, scale);
  const heightM = pixelLengthToMeters(structure.height, scale);
  const areaM2 = pixelAreaToSquareMeters(computeEffectivePixelArea(structure), scale);

  const tooltipLines = [
    "구조물 정보",
    `종류: ${typeLabel}`,
    `면적: ${areaM2.toFixed(1)}m²`,
    `가로: ${widthM.toFixed(1)}m`,
    `세로: ${heightM.toFixed(1)}m`,
  ];
  const TOOLTIP_WIDTH = 150;
  const TOOLTIP_HEIGHT = 102;

  useEffect(() => {
    registerNode(structure.id, groupRef.current);
    return () => registerNode(structure.id, null);
  }, [structure.id, registerNode]);

  return (
    <Group
      ref={groupRef}
      x={structure.x}
      y={structure.y}
      rotation={structure.rotation ?? 0}
      draggable
      onClick={() => onSelect(structure.id)}
      onTap={() => onSelect(structure.id)}
      onDragEnd={(e) => {
        onChange(structure.id, { x: e.target.x(), y: e.target.y() });
      }}
      onTransformEnd={() => {
        const node = groupRef.current;
        if (!node) return;

        const scaleX = node.scaleX();
        const scaleY = node.scaleY();
        node.scaleX(1);
        node.scaleY(1);

        onChange(structure.id, {
          x: node.x(),
          y: node.y(),
          rotation: node.rotation(),
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
      {isSelected && (
        // Anchored below-right of the room's top-left corner (rather than
        // above), mirroring HeatDetectorShape's tooltip so an upward
        // tooltip doesn't get clipped by the stage's top edge.
        <Group x={12} y={12} listening={false}>
          <Rect
            width={TOOLTIP_WIDTH}
            height={TOOLTIP_HEIGHT}
            fill="#111827"
            opacity={0.92}
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
