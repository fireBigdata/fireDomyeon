"use client";

import { Fragment, useRef, useEffect } from "react";
import { Group, Line, Rect, Text } from "react-konva";
import type Konva from "konva";
import type { Structure } from "@/types/floorplan";
import { STRUCTURE_DEFAULTS } from "@/constants/structureDefaults";
import { ROOM_TYPE_DEFAULTS, DEFAULT_ROOM_TYPE } from "@/constants/roomTypes";
import PartitionShape from "./PartitionShape";

type StructureShapeProps = {
  structure: Structure;
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
  const roomAppearance = isRoom
    ? ROOM_TYPE_DEFAULTS[structure.roomType ?? DEFAULT_ROOM_TYPE]
    : null;

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
        fill={roomAppearance?.fill ?? defaults.fill}
        stroke={isSelected ? "#111827" : roomAppearance?.stroke ?? defaults.stroke}
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
        text={roomAppearance?.label ?? defaults.label}
        width={structure.width}
        height={structure.height}
        align="center"
        verticalAlign="middle"
        fontSize={13}
        fill="#111827"
        listening={false}
      />
    </Group>
  );
}
