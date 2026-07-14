"use client";

import { Fragment } from "react";
import { Line, Rect } from "react-konva";
import type Konva from "konva";
import type { PartitionNode } from "@/types/floorplan";
import type { Box } from "@/lib/partitionTree";
import { CANVAS_BACKGROUND_COLOR } from "@/constants/canvas";

const MIN_RATIO = 0.1;
const MAX_RATIO = 0.9;

type PartitionShapeProps = {
  node: PartitionNode;
  box: Box;
  selectedLeafId: string | null;
  onSelectLeaf: (leafId: string) => void;
  onResize: (splitId: string, ratio: number) => void;
};

function setCursor(e: Konva.KonvaEventObject<Event>, cursor: string) {
  const stage = e.target.getStage();
  if (stage) stage.container().style.cursor = cursor;
}

export default function PartitionShape({
  node,
  box,
  selectedLeafId,
  onSelectLeaf,
  onResize,
}: PartitionShapeProps) {
  if (node.kind === "leaf") {
    return (
      <Rect
        x={box.x}
        y={box.y}
        width={box.width}
        height={box.height}
        stroke={selectedLeafId === node.id ? "#111827" : "#94a3b8"}
        strokeWidth={selectedLeafId === node.id ? 2 : 1}
        onClick={(e) => {
          e.cancelBubble = true;
          onSelectLeaf(node.id);
        }}
        onTap={(e) => {
          e.cancelBubble = true;
          onSelectLeaf(node.id);
        }}
      />
    );
  }

  if (node.kind === "empty") {
    // Painted to match the canvas background so a deleted region reads as a
    // hole (e.g. splitting a room into 4 and deleting one corner leaves an
    // L-shaped room), while still being selectable to allow restoring it.
    return (
      <Rect
        x={box.x}
        y={box.y}
        width={box.width}
        height={box.height}
        fill={CANVAS_BACKGROUND_COLOR}
        stroke={selectedLeafId === node.id ? "#111827" : "#cbd5e1"}
        strokeWidth={selectedLeafId === node.id ? 2 : 1}
        dash={[6, 4]}
        onClick={(e) => {
          e.cancelBubble = true;
          onSelectLeaf(node.id);
        }}
        onTap={(e) => {
          e.cancelBubble = true;
          onSelectLeaf(node.id);
        }}
      />
    );
  }

  const { id, direction, ratio, children } = node;
  const isVertical = direction === "vertical";

  const firstBox: Box = isVertical
    ? { ...box, width: box.width * ratio }
    : { ...box, height: box.height * ratio };
  const secondBox: Box = isVertical
    ? { ...box, x: box.x + box.width * ratio, width: box.width * (1 - ratio) }
    : { ...box, y: box.y + box.height * ratio, height: box.height * (1 - ratio) };

  const dividerX = isVertical ? box.x + box.width * ratio : box.x;
  const dividerY = isVertical ? box.y : box.y + box.height * ratio;

  return (
    <Fragment>
      <PartitionShape
        node={children[0]}
        box={firstBox}
        selectedLeafId={selectedLeafId}
        onSelectLeaf={onSelectLeaf}
        onResize={onResize}
      />
      <PartitionShape
        node={children[1]}
        box={secondBox}
        selectedLeafId={selectedLeafId}
        onSelectLeaf={onSelectLeaf}
        onResize={onResize}
      />
      <Line
        x={dividerX}
        y={dividerY}
        points={isVertical ? [0, 0, 0, box.height] : [0, 0, box.width, 0]}
        stroke="#475569"
        strokeWidth={2}
        hitStrokeWidth={12}
        draggable
        onMouseDown={(e) => {
          e.cancelBubble = true;
        }}
        onMouseEnter={(e) => setCursor(e, isVertical ? "col-resize" : "row-resize")}
        onMouseLeave={(e) => setCursor(e, "default")}
        onDragMove={(e) => {
          // Without this, the drag event bubbles up to the room Group's own
          // onDragEnd/onDragMove handler, which then misreads this Line's
          // local x/y as the room's new position.
          e.cancelBubble = true;
          const lineNode = e.target;
          if (isVertical) {
            lineNode.y(box.y);
            const rawRatio = (lineNode.x() - box.x) / box.width;
            const clamped = Math.min(Math.max(rawRatio, MIN_RATIO), MAX_RATIO);
            lineNode.x(box.x + box.width * clamped);
            onResize(id, clamped);
          } else {
            lineNode.x(box.x);
            const rawRatio = (lineNode.y() - box.y) / box.height;
            const clamped = Math.min(Math.max(rawRatio, MIN_RATIO), MAX_RATIO);
            lineNode.y(box.y + box.height * clamped);
            onResize(id, clamped);
          }
        }}
        onDragEnd={(e) => {
          e.cancelBubble = true;
        }}
      />
    </Fragment>
  );
}
