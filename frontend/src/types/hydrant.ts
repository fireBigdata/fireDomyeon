export type HydrantPlacement = {
  id: string;
  floorId: string;
  x: number;
  y: number;
  /** Id of the EquipmentProduct (설비 선택 페이지의 옥내소화전함 카탈로그) placed here. */
  hydrantTypeId: string;
  /** Corridor this placement belongs to; used to cascade-delete when that structure is removed. */
  structureId: string;
  isAutoPlaced: boolean;
};
