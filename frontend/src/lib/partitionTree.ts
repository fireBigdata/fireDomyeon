import type { PartitionDirection, PartitionNode } from "@/types/floorplan";
import { createId } from "@/lib/id";

export type Box = { x: number; y: number; width: number; height: number };

// Used as the leaf id for a room that has no partitions yet (a single,
// implicit space covering the whole room).
export const ROOT_LEAF_ID = "root";

export function createLeaf(): PartitionNode {
  return { kind: "leaf", id: createId("partition") };
}

/** Finds the node with the given id anywhere in the tree (any kind). */
export function findPartitionNode(
  node: PartitionNode | undefined,
  id: string
): PartitionNode | undefined {
  if (!node) return undefined;
  if (node.id === id) return node;
  if (node.kind !== "split") return undefined;
  return (
    findPartitionNode(node.children[0], id) ??
    findPartitionNode(node.children[1], id)
  );
}

export type SplitResult = {
  node: PartitionNode;
  /** id of the newly created first child, so callers can keep it selected for further splits. */
  newLeafId: string;
};

/** Replaces the leaf identified by `leafId` with a new split of two fresh leaves. */
export function splitPartitionAt(
  node: PartitionNode | undefined,
  leafId: string,
  direction: PartitionDirection
): SplitResult {
  if (!node) {
    // No partitions yet: the whole room is the implicit ROOT_LEAF_ID leaf.
    const children: [PartitionNode, PartitionNode] = [createLeaf(), createLeaf()];
    return {
      node: { kind: "split", id: createId("partition"), direction, ratio: 0.5, children },
      newLeafId: children[0].id,
    };
  }

  if (node.kind === "leaf") {
    if (node.id !== leafId) return { node, newLeafId: leafId };
    const children: [PartitionNode, PartitionNode] = [createLeaf(), createLeaf()];
    return {
      node: { kind: "split", id: createId("partition"), direction, ratio: 0.5, children },
      newLeafId: children[0].id,
    };
  }

  // Can't split a deleted (empty) region.
  if (node.kind === "empty") return { node, newLeafId: leafId };

  const first = splitPartitionAt(node.children[0], leafId, direction);
  const second = splitPartitionAt(node.children[1], leafId, direction);
  return {
    node: { ...node, children: [first.node, second.node] },
    newLeafId:
      first.newLeafId !== leafId ? first.newLeafId : second.newLeafId,
  };
}

/** Adjusts the ratio of the split identified by `splitId`. Used while dragging a divider. */
export function setPartitionRatio(
  node: PartitionNode | undefined,
  splitId: string,
  ratio: number
): PartitionNode | undefined {
  if (!node || node.kind !== "split") return node;
  if (node.id === splitId) return { ...node, ratio };
  return {
    ...node,
    children: [
      setPartitionRatio(node.children[0], splitId, ratio) as PartitionNode,
      setPartitionRatio(node.children[1], splitId, ratio) as PartitionNode,
    ],
  };
}

/**
 * Removes the split that directly created `leafId`, collapsing it back into
 * its sibling (the inverse of splitPartitionAt). Returns undefined if the
 * whole tree collapses back to a single, undivided room.
 */
export function mergePartitionAt(
  node: PartitionNode | undefined,
  leafId: string
): PartitionNode | undefined {
  if (!node || node.kind !== "split") return node;

  const [first, second] = node.children;
  if (first.kind !== "split" && first.id === leafId) return second;
  if (second.kind !== "split" && second.id === leafId) return first;

  const merged: PartitionNode = {
    ...node,
    children: [
      (mergePartitionAt(first, leafId) ?? first) as PartitionNode,
      (mergePartitionAt(second, leafId) ?? second) as PartitionNode,
    ],
  };
  return merged;
}

/** Turns the leaf identified by `leafId` into a hole, without touching its siblings' layout. */
export function deleteRegionAt(
  node: PartitionNode | undefined,
  leafId: string
): PartitionNode | undefined {
  if (!node) return node;
  if (node.kind === "leaf") {
    return node.id === leafId ? { kind: "empty", id: node.id } : node;
  }
  if (node.kind === "empty") return node;
  return {
    ...node,
    children: [
      deleteRegionAt(node.children[0], leafId) as PartitionNode,
      deleteRegionAt(node.children[1], leafId) as PartitionNode,
    ],
  };
}

/** Inverse of deleteRegionAt: turns a hole back into a normal (empty) leaf. */
export function restoreRegionAt(
  node: PartitionNode | undefined,
  emptyId: string
): PartitionNode | undefined {
  if (!node) return node;
  if (node.kind === "empty") {
    return node.id === emptyId ? { kind: "leaf", id: node.id } : node;
  }
  if (node.kind === "leaf") return node;
  return {
    ...node,
    children: [
      restoreRegionAt(node.children[0], emptyId) as PartitionNode,
      restoreRegionAt(node.children[1], emptyId) as PartitionNode,
    ],
  };
}

export function clonePartitionTree(
  node: PartitionNode | undefined
): PartitionNode | undefined {
  if (!node) return undefined;

  if (node.kind === "leaf" || node.kind === "empty") {
    return { kind: node.kind, id: createId("partition") };
  }

  return {
    kind: "split",
    id: createId("partition"),
    direction: node.direction,
    ratio: node.ratio,
    children: [
      clonePartitionTree(node.children[0]) as PartitionNode,
      clonePartitionTree(node.children[1]) as PartitionNode,
    ],
  };
}
