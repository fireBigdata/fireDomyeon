export type ExtinguisherPlacement = {
  id: string;
  x: number;
  y: number;
  /** Id of the EquipmentProduct (설비 선택 페이지의 소화기 카탈로그) placed here. */
  extinguisherTypeId: string;
  /** Room or corridor this placement belongs to; used to cascade-delete when that structure is removed. */
  structureId: string;
  isAutoPlaced: boolean;
};
