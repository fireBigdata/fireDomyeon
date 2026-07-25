// Shared between FloorPlanCanvas (page background) and PartitionShape (so a
// deleted/empty region can blend into the canvas, reading as a hole).
export const CANVAS_BACKGROUND_COLOR = "#f9fafb";

// Fixed Stage size (FloorPlanCanvas) — also used by lib/area.ts to derive a
// `scale` from a real-world site width/height entered in InitialSetupModal.
export const CANVAS_WIDTH_PX = 900;
export const CANVAS_HEIGHT_PX = 600;
